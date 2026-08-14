import { z } from 'zod';

// 副 API 客户端：负责调用第二个大模型端点（OpenAI 兼容 /chat/completions），
// 用于论坛更新、副 AI 生成帖子、每日挑战任务等需要大量文本生成的任务。
// 与酒馆主模型解耦，独立配置、独立超时/重试。

export const SECONDARY_API_STORAGE_KEY = 'hypnoos.secondaryApi.v1';

export const SecondaryApiSettings = z.object({
  // 单 API / 多 API：single 时走酒馆主模型，multi 时走副端点
  mode: z.enum(['single', 'multi']).default('single'),
  // 端点地址（OpenAI 兼容，可传 base 或完整 /chat/completions 地址）
  url: z.string().default(''),
  apiKey: z.string().default(''),
  model: z.string().default(''),
  timeoutMs: z.number().int().positive().default(30000),
  maxRetries: z.number().int().min(0).max(10).default(3),
});
export type SecondaryApiSettings = z.infer<typeof SecondaryApiSettings>;

export const DEFAULT_SECONDARY_API_SETTINGS: SecondaryApiSettings = SecondaryApiSettings.parse({});

export function loadSecondaryApiSettings(): SecondaryApiSettings {
  try {
    const raw = localStorage.getItem(SECONDARY_API_STORAGE_KEY);
    if (!raw) return DEFAULT_SECONDARY_API_SETTINGS;
    return SecondaryApiSettings.parse(JSON.parse(raw));
  } catch (err) {
    console.warn('[HypnoOS] 读取副API设置失败，回退默认值', err);
    return DEFAULT_SECONDARY_API_SETTINGS;
  }
}

export function saveSecondaryApiSettings(settings: SecondaryApiSettings): void {
  localStorage.setItem(SECONDARY_API_STORAGE_KEY, JSON.stringify(settings));
}

export function isSecondaryApiConfigured(settings: SecondaryApiSettings): boolean {
  return settings.mode === 'multi' && settings.url.trim().length > 0 && settings.model.trim().length > 0;
}

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export type GenerateResult = { ok: true; text: string } | { ok: false; error: string };

export type ListModelsResult = { ok: true; models: string[] } | { ok: false; error: string };

function normalizeBaseUrl(url: string): string {
  let u = url.trim();
  if (!u) return u;
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
  // 若用户填的是完整 /chat/completions 端点，去掉后缀还原为 base
  u = u.replace(/\/chat\/completions\/?$/i, '');
  return u.replace(/\/+$/, '');
}

function normalizeEndpoint(url: string): string {
  return `${normalizeBaseUrl(url)}/chat/completions`;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// 调用副端点生成文本。带超时（AbortController）与重试（maxRetries），返回结构化结果而非抛错。
export async function generateChat(
  messages: ChatMessage[],
  opts?: { settings?: SecondaryApiSettings },
): Promise<GenerateResult> {
  const settings = opts?.settings ?? loadSecondaryApiSettings();
  if (!isSecondaryApiConfigured(settings)) {
    return { ok: false, error: '副API未配置：请在设置中开启多API模式并填写端点与模型' };
  }

  const endpoint = normalizeEndpoint(settings.url);
  const maxAttempts = settings.maxRetries + 1;
  let lastError = '';

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const res = await fetchWithTimeout(
        endpoint,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(settings.apiKey.trim() ? { Authorization: `Bearer ${settings.apiKey.trim()}` } : {}),
          },
          body: JSON.stringify({
            model: settings.model.trim(),
            messages,
            stream: false,
          }),
        },
        settings.timeoutMs,
      );

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status}${text ? `: ${text.slice(0, 200)}` : ''}`);
      }

      const data = (await res.json()) as any;
      const content = data?.choices?.[0]?.message?.content;
      if (typeof content !== 'string' || content.trim().length === 0) {
        throw new Error('响应缺少 choices[0].message.content');
      }
      return { ok: true, text: content };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      console.warn(`[HypnoOS] 副API请求失败（第 ${attempt}/${maxAttempts} 次）`, lastError);
      if (attempt < maxAttempts) {
        await sleep(Math.min(2000, 500 * attempt));
      }
    }
  }

  return { ok: false, error: lastError || '副API请求失败' };
}

// 拉取端点可用的模型列表（OpenAI 兼容 GET /models）。
export async function listModels(opts?: { settings?: SecondaryApiSettings }): Promise<ListModelsResult> {
  const settings = opts?.settings ?? loadSecondaryApiSettings();
  if (!settings.url.trim()) {
    return { ok: false, error: '请先填写端点地址' };
  }

  const endpoint = `${normalizeBaseUrl(settings.url)}/models`;
  try {
    const res = await fetchWithTimeout(
      endpoint,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(settings.apiKey.trim() ? { Authorization: `Bearer ${settings.apiKey.trim()}` } : {}),
        },
      },
      settings.timeoutMs,
    );

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}${text ? `: ${text.slice(0, 200)}` : ''}`);
    }

    const data = (await res.json()) as any;
    const list = Array.isArray(data?.data) ? data.data : null;
    if (!list) {
      throw new Error('响应缺少 data 数组（非 OpenAI 兼容的 /models 格式）');
    }

    const models = list
      .map((m: any) => (m && typeof m.id === 'string' ? m.id : null))
      .filter((id: string | null): id is string => Boolean(id))
      .sort((a: string, b: string) => a.localeCompare(b));
    return { ok: true, models };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('[HypnoOS] 拉取模型列表失败', message);
    return { ok: false, error: message };
  }
}

// --- 每日挑战任务生成 ---

// 副 API 生成的单条挑战原始字段（不含进度/完成状态，由前端补齐）
export type GeneratedChallengeRaw = {
  任务名称: string;
  任务目标: string;
  任务描述: string;
  任务奖励: string;
};

// 前端收集好的上下文，供 generateChallenges 拼装提示词
export type ChallengeContext = {
  scene?: string; // 场景描述
  recentMessages: Array<{ name: string; role: string; content: string }>; // 最近 N 条消息
  candidateRoles: string[]; // 候选目标角色名
  roleWorldbookEntries: Array<{ roleName: string; content: string }>; // 角色命名的世界书条目内容
};

export type GenerateChallengesResult = { ok: true; challenges: GeneratedChallengeRaw[] } | { ok: false; error: string };

const CHALLENGE_SYSTEM_PROMPT = [
  '# Role & Objective',
  '你是「每日挑战」任务生成器。职责是基于当前游戏上下文，生成 3 条以攻略女性、发展亲密关系或进行极端性互动为核心目标的每日挑战任务。',
  '',
  '# Themes (可自由组合)',
  '任务需涵盖不同的攻略路线，请在以下方向中混合搭配：',
  '- **纯爱与情感升温**：通过约会、送礼、肢体接触或情感共鸣，提升好感度，达成两情相悦的亲密互动或浪漫性行为。',
  '- **强制与强奸**：违背目标意志的强制发生关系，或利用武力/手段迫使目标服从。',
  '- **调教与恶堕**：通过系统性的训练、惩罚与奖励，驯化目标的身体与心智，使其从原本的性格逐渐堕落。',
  '- **凌辱与羞辱**：通过当众暴露、言语贬低、粗暴对待等手段彻底击碎目标的尊严。',
  '- **控制与精神操控**：完全支配目标的行为与思想，改写其认知、记忆、常识、性癖或道德观。',
  '- **NTR与背叛**：让他人的伴侣/爱人背叛原配。',
  '- **隐奸与诱惑**：在他人不知情/不察觉的情况下进行隐秘性行为，或在日常场景中制造暧昧氛围诱导目标主动寻求亲密接触。',
  '',
  '# Actionable Description Rules',
  '`任务描述` 必须是**具体的、可执行的行为指令**，明确指出场景、动作和程度，不要使用空洞的概括词。',
  '- 🔴 **错误示范**：「让目标堕落成淫乱的女人。」（过于空洞，缺乏具体场景与行为）',
  '- 🔴 **错误示范**：「攻略目标使其屈服并爱上你。」（无具体行为指令）',
  '',
  '# Constraints & Format',
  '1. **纯 JSON 输出**：严格且仅输出一个 JSON 数组，包含恰好 3 个对象。**绝对禁止**输出任何多余的思考过程、前言后语或 Markdown 代码块标记（如 ``` 或 ```json）。',
  '2. **目标角色挑选**：从【候选角色】中，根据剧情走向与角色人设，挑选 3 个最适合作任务目标的角色（可自行判断适合性），3 条任务的目标角色尽量不重复，且**必须**原样使用角色名，不得虚构。',
  '3. **字段严格性**：只能包含以下 4 个字段，严禁附加「当前进度」、「是否完成」等状态字段。',
  '4. **物品奖励用途**：当奖励为物品时，必须用一句话说明其用途/效果，格式为「物品 <物品名>：<用途描述>」，例如「物品 迷情香水：喷洒后可让目标对使用者产生强烈的情欲冲动。」',
  '',
  '## JSON Schema',
  '[',
  '  {',
  '    "任务名称": "<简短有力的挑战标题>",',
  '    "任务目标": "<选自候选目标角色的名字>",',
  '    "任务描述": "<符合 Actionable Description Rules 的具体行为描述>",',
  `    "任务奖励": "<固定格式：'金钱 [100-1000之间的整数]' 或 '物品 [物品名]：[用途描述]'>"`,
  '  }',
  ']',
].join('\n');

function buildChallengeUserPrompt(ctx: ChallengeContext): string {
  const lines: string[] = [];

  lines.push('# Context Inputs');

  if (ctx.scene && ctx.scene.trim()) {
    lines.push('', '<World>', `当前场景：${ctx.scene.trim()}`, '</World>');
  }

  const candidate = ctx.candidateRoles.filter(Boolean);
  if (candidate.length) {
    lines.push('', '<Characters>', `候选角色（请根据剧情与人设从中挑选 3 个目标）：${candidate.join('、')}`);
    if (ctx.roleWorldbookEntries.length) {
      lines.push('', '角色人设参考：');
      for (const e of ctx.roleWorldbookEntries) {
        lines.push(`—— ${e.roleName} ——`, e.content);
      }
    }
    lines.push('</Characters>');
  }

  if (ctx.recentMessages.length) {
    lines.push('', '<ChatHistory>', '最近剧情走向：');
    for (const m of ctx.recentMessages) {
      const label = m.name ? `${m.name}（${m.role}）` : m.role;
      lines.push(`${label}：${m.content}`);
    }
    lines.push('</ChatHistory>');
  }

  lines.push('', '请基于以上上下文，生成 3 条挑战任务（JSON 数组）。');
  return lines.join('\n');
}

// 从副 API 返回文本中稳健提取 JSON 数组
function extractChallengeJsonArray(text: string): GeneratedChallengeRaw[] {
  const trimmed = text.trim();

  // 去掉可能包裹的 ```json ... ``` 代码块
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;

  const start = candidate.indexOf('[');
  const end = candidate.lastIndexOf(']');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('副API 未返回 JSON 数组');
  }

  const parsed: unknown = JSON.parse(candidate.slice(start, end + 1));
  if (!Array.isArray(parsed)) {
    throw new Error('副API 返回的不是数组');
  }

  const challenges: GeneratedChallengeRaw[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const name = typeof o['任务名称'] === 'string' ? (o['任务名称'] as string).trim() : '';
    const target = typeof o['任务目标'] === 'string' ? (o['任务目标'] as string).trim() : '';
    const description = typeof o['任务描述'] === 'string' ? (o['任务描述'] as string).trim() : '';
    const reward = typeof o['任务奖励'] === 'string' ? (o['任务奖励'] as string).trim() : '';
    if (!name || !target || !description || !reward) continue;
    challenges.push({ 任务名称: name, 任务目标: target, 任务描述: description, 任务奖励: reward });
  }

  if (challenges.length === 0) {
    throw new Error('副API 返回的任务列表为空或字段缺失');
  }
  return challenges;
}

// 调用副 API 生成每日挑战任务。返回结构化结果而非抛错。
export async function generateChallenges(
  ctx: ChallengeContext,
  opts?: { settings?: SecondaryApiSettings },
): Promise<GenerateChallengesResult> {
  try {
    const result = await generateChat(
      [
        { role: 'system', content: CHALLENGE_SYSTEM_PROMPT },
        { role: 'user', content: buildChallengeUserPrompt(ctx) },
      ],
      opts,
    );
    if (!result.ok) return result;

    const challenges = extractChallengeJsonArray(result.text);
    return { ok: true, challenges };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('[HypnoOS] 生成每日挑战失败', message);
    return { ok: false, error: message };
  }
}
