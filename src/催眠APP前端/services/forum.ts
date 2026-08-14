import { generateChat } from './secondaryApi';

const CHAT_OPTION = { type: 'chat' } as const;
const RECENT_MESSAGES = 12;
const POSTS_PER_REFRESH = 5;

// --- 数据模型（无分区，单信息流）---

export type ForumFloor = {
  floorNo: number;
  content: string;
  createdAtMs: number;
};

export type ForumPost = {
  id: number;
  title: string; // 帖子标题
  body: string; // 帖子内容
  floors: ForumFloor[]; // 评论区
  createdAtMs: number;
};

export type ForumStateV1 = {
  version: 1;
  posts: ForumPost[];
};

function getChatScopedKey(): string {
  try {
    const chatId = (window as any)?.SillyTavern?.getCurrentChatId?.();
    if (chatId !== undefined && chatId !== null && String(chatId).length > 0) {
      return String(chatId);
    }
  } catch {}
  return 'global';
}

function getStorageKey(): string {
  return `forum.v1:${getChatScopedKey()}`;
}

export function createEmptyState(): ForumStateV1 {
  return { version: 1, posts: [] };
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

export function loadState(): ForumStateV1 {
  const raw = localStorage.getItem(getStorageKey());
  if (!raw) return createEmptyState();

  const parsed = safeJsonParse(raw);
  if (!parsed || typeof parsed !== 'object') return createEmptyState();
  if ((parsed as any).version !== 1) return createEmptyState();

  const posts = Array.isArray((parsed as any).posts)
    ? ((parsed as any).posts as any[])
        .filter((p: any) => p && typeof p === 'object')
        .map((p: any): ForumPost => {
          const floors = Array.isArray(p.floors)
            ? (p.floors as any[])
                .filter((f: any) => f && typeof f === 'object')
                .map((f: any): ForumFloor => ({
                  floorNo: Number.isFinite(f.floorNo) ? Number(f.floorNo) : 1,
                  content: typeof f.content === 'string' ? f.content : '',
                  createdAtMs: Number.isFinite(f.createdAtMs) ? Number(f.createdAtMs) : Date.now(),
                }))
            : [];
          floors.sort((a: ForumFloor, b: ForumFloor) => a.floorNo - b.floorNo);
          return {
            id: Number.isFinite(p.id) ? Number(p.id) : 1,
            title: typeof p.title === 'string' ? p.title : '',
            body: typeof p.body === 'string' ? p.body : '',
            floors,
            createdAtMs: Number.isFinite(p.createdAtMs) ? Number(p.createdAtMs) : Date.now(),
          };
        })
    : [];

  posts.sort((a, b) => b.id - a.id);
  return { version: 1, posts };
}

export function saveState(state: ForumStateV1): void {
  localStorage.setItem(getStorageKey(), JSON.stringify(state));
}

// --- 世界快照（供副 API 生成反映玩家影响的帖子）---

function toNumber(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function readVariables(): Record<string, any> {
  try {
    const vars = getVariables(CHAT_OPTION);
    return vars && typeof vars === 'object' ? (vars as Record<string, any>) : {};
  } catch {
    return {};
  }
}

function readRecentMessages(count: number): Array<{ name: string; role: string; content: string }> {
  try {
    const last = getChatMessages(-1)[0];
    if (!last) return [];
    const lastId = last.message_id;
    const firstId = Math.max(0, lastId - count + 1);
    const msgs = getChatMessages(`${firstId}-${lastId}`);
    return (msgs ?? [])
      .filter(m => m && typeof m.message === 'string' && m.message.trim().length > 0)
      .map(m => ({
        name: typeof m.name === 'string' ? m.name : '',
        role: typeof m.role === 'string' ? m.role : 'user',
        content: m.message,
      }));
  } catch {
    return [];
  }
}

type WorldSnapshot = {
  scene: string;
  suspicion: number;
  money: number;
  itemNames: string[];
  recentMessages: Array<{ name: string; role: string; content: string }>;
};

function collectWorldSnapshot(): WorldSnapshot {
  const vars = readVariables();

  const scene = typeof vars?.世界?.当前地点 === 'string' ? vars.世界.当前地点.trim() : '';
  const suspicion = toNumber(vars?.系统?.可疑度) ?? 0;
  const money = toNumber(vars?.主角?.金钱) ?? 0;

  const itemRaw = vars?.主角?.持有物品;
  const itemNames: string[] = [];
  if (itemRaw && typeof itemRaw === 'object') {
    for (const k of Object.keys(itemRaw)) {
      if (k && k.trim()) itemNames.push(k.trim());
    }
  }
  itemNames.sort();

  return {
    scene,
    suspicion,
    money,
    itemNames,
    recentMessages: readRecentMessages(RECENT_MESSAGES),
  };
}

// --- 副 API 提示词 ---

const FORUM_SYSTEM_PROMPT = [
  '# Role',
  '你是这个虚拟世界里「百度贴吧」的资深网民。你不是故事主角，也没有上帝视角，不知道任何幕后真相或系统设定。你只是一个普通的乐子人、吃瓜群众，每天就喜欢在网上看八卦、吐槽沙雕日常、分享别人的社死瞬间。',
  '',
  '# Style & Tone',
  '- **轻松搞笑**：整体基调是欢乐、吐槽、沙雕、看热闹不嫌事大。',
  '- **极度口语化**：短句为主，常用贴吧词汇（如「草」「笑发财了」「社死」「蚌埠住了」「什么逆天操作」「哈哈哈」「蹲个后续」）。',
  '- **情绪化与互动**：主要是幸灾乐祸、调侃楼主、互相玩梗、发癫。',
  '- **排版习惯**：网民发帖通常不爱用标准标点符号，多用空格、波浪号或直接换行。',
  '',
  '# Task',
  '系统会提供 `<World>`（当前世界公开状态）与 `<RecentEvents>`（最近发生的剧情走向）。请把这些信息当作「街坊八卦」或「同城趣闻」来理解。',
  `基于这些线索，生成恰好 ${POSTS_PER_REFRESH} 条新的匿名帖。每条帖是一个独立的讨论串，必须能体现出「这个世界/这个城市里发生的轻松、搞笑、甚至有点社死的日常趣事」。`,
  '',
  '# Constraints & Format',
  '1. **纯 JSON 输出**：严格且仅输出一个 JSON 数组。**绝对禁止**输出任何思考过程、前言后语或 Markdown 代码块标记（如 ``` 或 ```json）。',
  `2. **结构要求**：数组恰好包含 ${POSTS_PER_REFRESH} 个对象，每个对象包含且仅包含 \`标题\`、\`正文\`、\`楼层\`（1~4 条回复构成的字符串数组）三个字段。`,
  '3. **视角限制**：帖子中**绝对不能**直接点破「是某个玩家/主角干的」或提到「催眠」「系统」等确切原因。网民只能看到表面的搞笑现象，分享目击画面，或者瞎吐槽。',
  '',
  '## JSON Schema',
  '[',
  '  {',
  '    "标题": "<吸引眼球的沙雕标题，如：救命啊，刚才在广场看到个人社死了...>",',
  '    "正文": "<楼主视角的详细吐槽，包含目击的搞笑过程或听说的奇葩八卦>",',
  '    "楼层": [',
  '      "<吧友A的回复，如：哈哈哈哈哈笑死我了，楼主你没拍个视频？>",',
  '      "<吧友B的回复，如：草，画面感太强了，我已经替他抠出三室一厅了>"',
  '    ]',
  '  }',
  ']',
].join('\n');

function buildForumUserPrompt(snapshot: WorldSnapshot): string {
  const lines: string[] = [];

  lines.push('# Context Inputs', '');

  lines.push('<World>', '当前世界公开状态：');
  lines.push(`当前场景：${snapshot.scene || '（未知）'}`);
  lines.push(`当前可疑度：${snapshot.suspicion}`);
  lines.push(`主角金钱：${snapshot.money}`);
  if (snapshot.itemNames.length) {
    lines.push(`主角持有的物品：${snapshot.itemNames.join('、')}`);
  }
  lines.push('</World>', '');

  if (snapshot.recentMessages.length) {
    lines.push('<RecentEvents>', '最近的街坊八卦/剧情走向：');
    for (const m of snapshot.recentMessages) {
      const label = m.name ? `${m.name}（${m.role}）` : m.role;
      lines.push(`${label}：${m.content}`);
    }
    lines.push('</RecentEvents>', '');
  }

  lines.push(`请基于以上信息，生成 ${POSTS_PER_REFRESH} 条匿名帖（JSON 数组）。`);
  return lines.join('\n');
}

// --- 副 API 响应解析 ---

type WorldPostRaw = {
  title: string;
  body: string;
  floors: string[];
};

function extractWorldPosts(text: string): WorldPostRaw[] {
  const trimmed = text.trim();

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

  const posts: WorldPostRaw[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;

    const title = typeof o['标题'] === 'string' ? o['标题'].trim() : '';
    const body = typeof o['正文'] === 'string' ? o['正文'].trim() : '';
    if (!title && !body) continue;

    const floors = Array.isArray(o['楼层'])
      ? o['楼层'].filter((f: unknown): f is string => typeof f === 'string' && f.trim().length > 0).map(f => f.trim())
      : [];

    posts.push({ title: title || '（无标题）', body, floors });
  }

  if (posts.length === 0) {
    throw new Error('副API 返回的帖子列表为空');
  }
  return posts;
}

// --- 主入口 ---

export type RefreshForumResult = {
  ok: boolean;
  posts: ForumPost[];
  error?: string;
};

// 刷新论坛：清空旧帖，用副 API 基于当前世界状态生成一批新帖（不做留存）。
export async function refreshForum(): Promise<RefreshForumResult> {
  try {
    const snapshot = collectWorldSnapshot();

    const result = await generateChat([
      { role: 'system', content: FORUM_SYSTEM_PROMPT },
      { role: 'user', content: buildForumUserPrompt(snapshot) },
    ]);

    if (!result.ok) {
      return { ok: false, posts: [], error: result.error };
    }

    const raws = extractWorldPosts(result.text);
    const now = Date.now();
    const posts: ForumPost[] = raws.map((r, i) => ({
      id: i + 1,
      title: r.title,
      body: r.body,
      floors: r.floors.map((content, idx) => ({
        floorNo: idx + 1,
        content,
        createdAtMs: now,
      })),
      createdAtMs: now,
    }));

    return { ok: true, posts };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('[HypnoOS] 刷新论坛失败', message);
    return { ok: false, posts: [], error: message };
  }
}
