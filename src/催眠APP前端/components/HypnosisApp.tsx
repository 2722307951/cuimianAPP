import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { UserResources, HypnosisFeature, VIP_LEVELS } from '../types';
import { DataService, SUBSCRIPTION_PRICES } from '../services/dataService';
import { MvuBridge } from '../services/mvuBridge';
import { buildHypnosisSendMessage } from '../prompts/hypnosisSend';
import {
  Battery,
  Zap,
  Lock,
  ChevronDown,
  ChevronUp,
  ShoppingCart,
  AlertTriangle,
  StopCircle,
  ArrowLeft,
} from 'lucide-react';

interface HypnosisAppProps {
  userData: UserResources;
  onUpdateUser: (data: UserResources) => void;
  onExit: () => void;
}

// --- SVG Logo Component ---
// Exported for use in App.tsx as the icon
export const HypnoLogoSVG = ({
  className,
  size = 24,
  ...props
}: {
  className?: string;
  size?: number | string;
  [key: string]: any;
}) => (
  <svg viewBox="0 0 200 200" className={className} width={size} height={size} {...props}>
    <defs>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <g fill="currentColor" filter="url(#glow)">
      {/* Top Left Spike */}
      <path d="M 45 60 L 40 20 L 75 65" />
      {/* Top Middle Spike */}
      <path d="M 85 55 L 100 5 L 115 55" />
      {/* Top Right Spike */}
      <path d="M 155 60 L 160 20 L 125 65" />

      {/* Main Body (Oval-ish) */}
      <path d="M 10 100 C 10 40 190 40 190 100 C 190 160 10 160 10 100 Z" />

      {/* Bottom Spike */}
      <path d="M 70 145 L 100 195 L 130 145" />
    </g>

    {/* Inner Eye (Cutout via black fill) */}
    <ellipse cx="100" cy="100" rx="55" ry="28" fill="#0f0518" />

    {/* Pupil */}
    <circle cx="100" cy="100" r="18" fill="currentColor" filter="url(#glow)" />
  </svg>
);

// --- Vortex Background Component (Spiral SVG) ---
const VortexBackground = ({ speed = 'spin-slow' }: { speed?: string }) => {
  // Generate a spiral path
  // Center is 500, 500.
  const center = 500;
  const generateSpiralPath = (offsetAngle: number) => {
    let path = `M ${center} ${center} `;
    const loops = 4;
    const pointsPerLoop = 20;
    const maxRadius = 800;

    for (let i = 0; i <= loops * pointsPerLoop; i++) {
      const angle = (i / pointsPerLoop) * Math.PI * 2 + offsetAngle;
      // Exponential growth for "sucked in" look (smaller in center, wider at edges)
      const t = i / (loops * pointsPerLoop);
      const radius = Math.pow(t, 1.5) * maxRadius;

      const x = center + Math.cos(angle) * radius;
      const y = center + Math.sin(angle) * radius;
      path += `L ${x} ${y} `;
    }
    return path;
  };

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#0f0518] pointer-events-none">
      {/* Rotating Spiral SVG */}
      <div
        className="absolute inset-[-50%] animate-[spin_4s_linear_infinite]"
        style={{ animationDuration: speed === 'spin-slow' ? '12s' : '4s' }}
      >
        <svg viewBox="0 0 1000 1000" className="w-full h-full opacity-80 blur-xl">
          <defs>
            <linearGradient id="spiralGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4a044e" stopOpacity="0" />
              <stop offset="50%" stopColor="#d946ef" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
          </defs>
          {/* Draw multiple arms */}
          {[0, 1, 2, 3, 4, 5].map(i => (
            <path
              key={i}
              d={generateSpiralPath((i / 6) * Math.PI * 2)}
              fill="none"
              stroke="url(#spiralGrad)"
              strokeWidth={40 + i * 5}
              strokeLinecap="round"
            />
          ))}
        </svg>
      </div>

      {/* Strong Radial Overlay for "Sucked In" Dark Center */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#000000_15%,transparent_70%)]"></div>

      {/* Edge Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,#4a044e_100%)] mix-blend-overlay opacity-60"></div>
    </div>
  );
};

// --- Transition View (Initialization) ---
const TransitionView = () => {
  const [percent, setPercent] = useState(0);
  const [startAnim, setStartAnim] = useState(false);

  useEffect(() => {
    // 1. Start the bar animation immediately
    const timeout = setTimeout(() => {
      setStartAnim(true);
    }, 50); // Short delay to ensure mount

    // 2. Start the number counter
    const fillDuration = 3000;
    const startTime = Date.now();
    let rafId: number;

    const frame = () => {
      const now = Date.now();
      const elapsed = now - startTime;

      // Calculate progress 0-100 purely for text
      let p = (elapsed / fillDuration) * 100;
      if (p > 100) p = 100;

      setPercent(p);

      if (p < 100) {
        rafId = requestAnimationFrame(frame);
      }
    };

    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center overflow-hidden animate-fade-in font-sans">
      <VortexBackground speed="spin" />

      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full pb-10">
        {/* Title Text */}
        <h1
          className="text-5xl font-black text-[#d946ef] mb-12 tracking-widest select-none drop-shadow-[0_0_15px_rgba(217,70,239,0.8)]"
          style={{
            fontFamily: '"Noto Sans SC", sans-serif',
          }}
        >
          催眠アプリ
        </h1>

        {/* Logo */}
        <div className="w-64 h-64 mb-24 animate-breathing drop-shadow-[0_0_30px_rgba(217,70,239,0.5)]">
          <HypnoLogoSVG className="text-[#d946ef] w-full h-full filter drop-shadow-[0_0_10px_#ff00ff]" />
        </div>

        {/* Progress Bar Container - Positioned at bottom */}
        <div className="absolute bottom-20 w-[80%] max-w-xs">
          <div className="w-full h-6 bg-gray-900/90 border border-[#d946ef]/50 rounded-full overflow-hidden backdrop-blur-md p-1 shadow-[0_0_20px_rgba(217,70,239,0.3)]">
            {/* Progress Fill */}
            {/* We use CSS transition for width to guarantee smoothness over 3s */}
            <div
              className="h-full bg-gradient-to-r from-purple-800 via-[#d946ef] to-pink-400 rounded-full shadow-[0_0_15px_#d946ef] relative"
              style={{
                width: startAnim ? '100%' : '0%',
                transition: 'width 3000ms linear',
              }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>
          <div className="flex justify-between mt-2 px-1">
            <span className="text-[10px] text-[#d946ef] font-mono tracking-widest animate-pulse">
              SYSTEM INITIALIZING...
            </span>
            <span className="text-[12px] text-[#d946ef] font-mono font-bold">{Math.floor(percent)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Active Session View (Countdown) ---
const ActiveSessionView = ({
  timeLeft,
  sessionEndVirtualMinutes,
  sessionEndAtMs,
  onStop,
}: {
  timeLeft: number;
  sessionEndVirtualMinutes: number | null;
  sessionEndAtMs: number | null;
  onStop: () => void;
}) => {
  const [remaining, setRemaining] = useState(timeLeft);

  useEffect(() => {
    let stopped = false;
    let lastRemaining = timeLeft;
    const tick = async () => {
      if (stopped) return;
      if (sessionEndVirtualMinutes !== null) {
        const clock = await DataService.getSystemClock();
        if (stopped) return;
        if (clock.virtualMinutes !== null) {
          const remainingMinutes = sessionEndVirtualMinutes - clock.virtualMinutes;
          const next = Math.max(0, Math.ceil(remainingMinutes * 60));
          setRemaining(next);
          if (next <= 0) onStop();
          return;
        }
      }

      if (sessionEndAtMs !== null) {
        const next = Math.max(0, Math.ceil((sessionEndAtMs - Date.now()) / 1000));
        setRemaining(next);
        if (next <= 0) onStop();
        return;
      }

      lastRemaining = Math.max(0, lastRemaining - 1);
      setRemaining(lastRemaining);
      if (lastRemaining <= 0) onStop();
    };

    void tick();
    const timer = setInterval(() => void tick(), 1000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [onStop, sessionEndAtMs, sessionEndVirtualMinutes, timeLeft]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center overflow-hidden animate-fade-in">
      <VortexBackground speed="spin-slow" />

      {/* Overlay Scanlines */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-20 bg-[length:100%_2px,3px_100%] pointer-events-none"></div>

      <div className="relative z-30 flex flex-col items-center w-full">
        {/* Header */}
        <h1
          className="text-4xl font-bold text-[#d946ef] mb-2 tracking-widest opacity-90 select-none"
          style={{ fontFamily: '"Noto Sans SC", sans-serif', textShadow: '0 0 10px #d946ef' }}
        >
          催眠アプリ
        </h1>
        <div className="text-pink-500/70 text-xs tracking-[0.5em] mb-12 uppercase font-bold animate-pulse">
          Running...
        </div>

        {/* Center Logo Watermark behind timer */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 opacity-20 pointer-events-none animate-pulse-slow">
          <HypnoLogoSVG className="text-[#d946ef] w-full h-full" />
        </div>

        {/* Timer */}
        <div className="text-8xl font-mono font-bold text-white drop-shadow-[0_0_20px_rgba(217,70,239,1)] tabular-nums tracking-tighter mb-16 relative z-10">
          {formatTime(remaining)}
        </div>

        {/* Stop Button */}
        <button
          onClick={onStop}
          className="group relative px-10 py-4 bg-black/60 border-2 border-[#d946ef] rounded-full overflow-hidden transition-all hover:bg-[#d946ef]/20 active:scale-95 shadow-[0_0_15px_#d946ef]"
        >
          <span className="relative z-10 text-[#d946ef] font-bold tracking-widest text-lg flex items-center gap-2">
            <StopCircle size={24} /> 解除
          </span>
        </button>
      </div>
    </div>
  );
};

// --- 世界书条目编辑器（课程修改 / 校规修改 共用） ---
// 真正读写酒馆世界书条目：读取当前角色卡绑定的世界书（默认当前挂载的主世界书），
// 仅列出指定前缀的条目，下拉选择条目，按固定字段表单编辑并写回。
// 内容以多行「- {字段名}：{值}」格式存储；条目名 = 前缀 + 名称字段值。
// 显示时剥掉前缀；写回时名称重新拼回前缀 + 名称字段值。
// 任一字段为空则禁止保存。每次保存成功扣 costPerSave 催眠能量，不足则阻止保存。

interface EditorField {
  // 字段键，唯一
  key: string;
  // 字段显示名，也是写入世界书内容时「- {label}：{value}」的 label
  label: string;
  // 是否为名称字段：名称字段的值会拼到条目名前缀之后作为条目名
  isName?: boolean;
  // 是否多行文本（描述类用 textarea）
  multiline?: boolean;
}

interface WorldBookEditorProps {
  feature: HypnosisFeature;
  // 条目名前缀，只有以此前缀开头的条目才视为目标条目
  namePrefix: string;
  // 条目类型显示名（如「课程」「校规」）
  itemLabel: string;
  // 字段定义（顺序即表单顺序；其中须有且仅有一个 isName 字段）
  fields: EditorField[];
  // 每次保存成功扣除的催眠能量
  costPerSave: number;
  // 保存成功后写入玩家输入框的规则提示文本（<...规则> 块全文）
  rulesText: string;
  userData: UserResources;
  onUpdateUser: (data: UserResources) => void;
}

const stripPrefix = (name: string, prefix: string): string =>
  name.startsWith(prefix) ? name.slice(prefix.length) : name;

// 课程条目字段定义
const COURSE_FIELDS: EditorField[] = [
  { key: 'name', label: '课程名称', isName: true },
  { key: 'desc', label: '课程描述', multiline: true },
  { key: 'teacher', label: '任课老师' },
  { key: 'location', label: '上课地点' },
];

// 校规条目字段定义
const SCHOOL_RULE_FIELDS: EditorField[] = [
  { key: 'name', label: '校规名称', isName: true },
  { key: 'desc', label: '校规描述', multiline: true },
  { key: 'scope', label: '校规范围' },
  { key: 'penalty', label: '校规惩罚', multiline: true },
];

// 把世界书条目 content（多行「- label：value」）解析为字段 -> 值 的映射
const parseFieldsFromContent = (content: string, fields: EditorField[]): Record<string, string> => {
  const result: Record<string, string> = {};
  fields.forEach(f => {
    result[f.key] = '';
  });
  if (!content) return result;
  const lines = content.split('\n');
  for (const line of lines) {
    const m = line.match(/^\s*-\s*(.+?)\s*[：:]\s*(.*)$/);
    if (!m) continue;
    const label = m[1].trim();
    const value = m[2].trim();
    const field = fields.find(f => f.label === label);
    if (field) result[field.key] = value;
  }
  return result;
};

// 把字段 -> 值 映射序列化为多行「- label：value」内容
const serializeFieldsToContent = (values: Record<string, string>, fields: EditorField[]): string =>
  fields.map(f => `- ${f.label}：${(values[f.key] ?? '').trim()}`).join('\n');

// 课程修改提示词规则文本（保存成功后写入玩家输入框）
const COURSE_RULES_TEXT = `<课程常识规则>
- 课程不是角色的临时催眠效果，也不是永久催眠效果。
- 课程属于校园教学安排的一部分，独立于个体催眠效果存在。
- 若某门课程被修改，则校内相关人员会自然将修改后的课程视为正常课程。
- 老师会按修改后的课程内容正常授课，学生会按修改后的课程内容正常上课。
- 角色会觉得课程被改过，也会主动拿旧课程与新课程比较。
- 角色会把当前课程当作本来就该这样上的课程。不会太在意有多离谱。
- 只要处于校内上课情境，剧情就应按当前课程信息自然展开。
</课程常识规则>`;

// 校规修改提示词规则文本（保存成功后写入玩家输入框）
const SCHOOL_RULES_TEXT = `<校规常识规则>
- 校规不是角色的临时催眠效果，也不是永久催眠效果。
- 校规属于校园管理规定的一部分，独立于个体催眠效果存在。
- 若某条校规被修改，则校内所有人会自然将修改后的校规视为正常规定。
- 教职员工会按修改后的校规内容正常执行管理，学生会按修改后的校规内容正常遵守。
- 角色会觉得校规被改过，也会主动拿旧校规与新校规比较。
- 角色会把当前校规当作本来就该这样的规定。不会太在意有多离谱。
- 只要处于校内情境，剧情就应按当前校规信息自然展开。
</校规常识规则>`;

const WorldBookEntryEditor: React.FC<WorldBookEditorProps> = ({
  feature: _feature,
  namePrefix,
  itemLabel,
  fields,
  costPerSave,
  rulesText,
  userData,
  onUpdateUser,
}) => {
  const nameField = fields.find(f => f.isName) ?? fields[0];
  const [worldbookNames, setWorldbookNames] = useState<string[]>([]);
  const [selectedName, setSelectedName] = useState<string>('');
  const [entries, setEntries] = useState<WorldbookEntry[]>([]);
  const [selectedUid, setSelectedUid] = useState<number | null>(null);
  const [loadingNames, setLoadingNames] = useState(true);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 选中条目的字段草稿：fieldKey -> 值
  const [draftFields, setDraftFields] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // 1. 取当前角色卡绑定的世界书列表，默认选中当前挂载的主世界书
  useEffect(() => {
    let stopped = false;
    setLoadingNames(true);
    setError(null);
    (async () => {
      try {
        const wb = await getCharWorldbookNames('current');
        if (stopped) return;
        const primaryName = wb?.primary ?? '';
        const names = [...(primaryName ? [primaryName] : []), ...(wb?.additional ?? [])].filter(Boolean);
        setWorldbookNames(names);
        // 默认读取当前挂载的主世界书
        if (primaryName && selectedName !== primaryName) {
          setSelectedName(primaryName);
        } else if (!selectedName && names.length > 0) {
          setSelectedName(names[0]);
        }
      } catch (err) {
        console.warn('[HypnoOS] 读取角色卡世界书列表失败', err);
        if (!stopped) setError('读取世界书列表失败');
      } finally {
        if (!stopped) setLoadingNames(false);
      }
    })();
    return () => {
      stopped = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. 选定世界书后读取条目
  useEffect(() => {
    if (!selectedName) {
      setEntries([]);
      setSelectedUid(null);
      setDraftFields({});
      return;
    }
    let stopped = false;
    setLoadingEntries(true);
    setError(null);
    (async () => {
      try {
        const list = await getWorldbook(selectedName);
        if (stopped) return;
        setEntries(list ?? []);
        // 默认选中第一个目标条目
        const matched = (list ?? []).filter(e => typeof e.name === 'string' && e.name.startsWith(namePrefix));
        setSelectedUid(matched.length > 0 ? matched[0].uid : null);
        setDraftFields({});
      } catch (err) {
        console.warn('[HypnoOS] 读取世界书条目失败', err);
        if (!stopped) {
          setEntries([]);
          setSelectedUid(null);
          setError(`读取世界书「${selectedName}」条目失败`);
        }
      } finally {
        if (!stopped) setLoadingEntries(false);
      }
    })();
    return () => {
      stopped = true;
    };
  }, [selectedName]);

  // 课程条目列表
  const courseEntries = useMemo(
    () => entries.filter(e => typeof e.name === 'string' && e.name.startsWith(namePrefix)),
    [entries, namePrefix],
  );

  const selectedEntry = useMemo(
    () => courseEntries.find(e => e.uid === selectedUid) ?? null,
    [courseEntries, selectedUid],
  );

  // 选中条目变化时，把 content 解析为各字段草稿
  useEffect(() => {
    setDraftFields(parseFieldsFromContent(selectedEntry?.content ?? '', fields));
    setSaved(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEntry?.uid]);

  const originalFields = useMemo(
    () => parseFieldsFromContent(selectedEntry?.content ?? '', fields),
    [selectedEntry?.content, fields],
  );

  const dirty =
    selectedEntry != null &&
    fields.some(f => (draftFields[f.key] ?? '').trim() !== (originalFields[f.key] ?? '').trim());

  const updateField = (key: string, value: string) => {
    setDraftFields(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  // 3. 写回选中条目的名称与字段内容，并扣除催眠能量
  // 内容序列化为多行「- label：value」；名称 = 前缀 + 名称字段值。
  const saveEntry = async () => {
    if (!selectedName || selectedEntry == null) return;
    // 任一字段为空则禁止保存
    const emptyField = fields.find(f => (draftFields[f.key] ?? '').trim() === '');
    if (emptyField) {
      setError(`${emptyField.label}不能为空`);
      return;
    }
    const trimmedName = (draftFields[nameField.key] ?? '').trim();
    const originalName = selectedEntry.name ?? '';
    const originalContent = selectedEntry.content ?? '';
    const newName = namePrefix + trimmedName;
    const newContent = serializeFieldsToContent(draftFields, fields);
    if (newName === originalName && newContent === originalContent) return;

    // 扣能量：不足则阻止保存
    if (userData.mcEnergy < costPerSave) {
      setError(`催眠能量不足，保存${itemLabel}需 ${costPerSave} MC（当前 ${Math.floor(userData.mcEnergy)}）`);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const targetUid = selectedEntry.uid;
      await updateWorldbookWith(
        selectedName,
        list => list.map(e => (e.uid === targetUid ? { ...e, name: newName, content: newContent } : e)),
        { render: 'immediate' },
      );
      // 刷新本地条目
      const refreshed = await getWorldbook(selectedName);
      setEntries(refreshed ?? []);

      // 扣除催眠能量并持久化
      const newEnergy = Math.max(0, userData.mcEnergy - costPerSave);
      try {
        const persisted = await DataService.updateResources({ mcEnergy: newEnergy });
        onUpdateUser(persisted);
      } catch (err) {
        console.warn('[HypnoOS] 保存扣能量持久化失败', err);
        onUpdateUser({ ...userData, mcEnergy: newEnergy });
      }

      // 把「修改前后对比 + 规则文本」写入玩家输入框，提示 AI 演绎修改后的剧情
      try {
        const oldShort = stripPrefix(originalName, namePrefix);
        const newShort = stripPrefix(newName, namePrefix);
        const oldBlock = serializeFieldsToContent(originalFields, fields);
        const prompt = [
          `【${itemLabel}修改提示】`,
          `注意，${itemLabel}「${oldShort}」已被修改为「${newShort}」，内容也从：`,
          oldBlock || '（空）',
          `改为：`,
          newContent || '（空）',
          `请根据历史记录，展示${itemLabel}被修改后的剧情。`,
          '',
          rulesText,
        ].join('\n');
        if (typeof triggerSlash === 'function') {
          const escaped = prompt.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
          await triggerSlash(`/setinput "${escaped}"`);
        }
      } catch (err) {
        console.warn('[HypnoOS] 修改提示写入输入框失败', err);
      }

      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.warn('[HypnoOS] 写回世界书条目失败', err);
      setError(`保存${itemLabel}「${stripPrefix(originalName, namePrefix)}」失败`);
    } finally {
      setSaving(false);
    }
  };

  if (loadingNames) {
    return <div className="mt-2 text-xs text-gray-400 animate-pulse">正在读取当前角色卡绑定的世界书…</div>;
  }

  if (worldbookNames.length === 0) {
    return <div className="mt-2 text-xs text-amber-300/80">当前角色卡未绑定任何世界书，无法编辑条目。</div>;
  }

  return (
    <div className="mt-3 space-y-3">
      {/* 世界书选择（默认当前挂载） */}
      <div>
        <div className="text-[10px] text-gray-400 mb-1">选择世界书（默认当前挂载）</div>
        <select
          value={selectedName}
          onChange={e => setSelectedName(e.target.value)}
          className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500/50 transition-colors"
        >
          {worldbookNames.map(name => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-2 py-1.5">
          {error}
        </div>
      )}

      {/* 课程条目下拉选择 */}
      {loadingEntries ? (
        <div className="text-xs text-gray-400 animate-pulse">正在读取条目…</div>
      ) : courseEntries.length === 0 ? (
        <div className="text-xs text-gray-500">
          该世界书中没有{itemLabel}条目（名称需以 {namePrefix} 为前缀）。
        </div>
      ) : (
        <>
          <div>
            <div className="text-[10px] text-gray-400 mb-1">选择{itemLabel}条目</div>
            <select
              value={selectedUid ?? ''}
              onChange={e => setSelectedUid(e.target.value === '' ? null : Number(e.target.value))}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500/50 transition-colors"
            >
              {courseEntries.map(entry => (
                <option key={entry.uid} value={entry.uid}>
                  {stripPrefix(entry.name ?? '', namePrefix)}
                </option>
              ))}
            </select>
          </div>

          {selectedEntry && (
            <div className="rounded-lg border border-white/10 bg-black/20 p-2 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-pink-200/90 truncate">
                  {stripPrefix(selectedEntry.name ?? '', namePrefix)}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-gray-500">#{selectedEntry.uid}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full border ${
                      selectedEntry.enabled
                        ? 'border-green-500/30 text-green-300 bg-green-500/10'
                        : 'border-gray-500/30 text-gray-400 bg-white/5'
                    }`}
                  >
                    {selectedEntry.enabled ? '启用' : '禁用'}
                  </span>
                </div>
              </div>

              {/* 字段表单 */}
              {fields.map(field => (
                <label key={field.key} className="block">
                  <div className="text-[10px] text-gray-400 mb-1">{field.label}</div>
                  {field.isName ? (
                    <div className="flex items-stretch gap-1">
                      <span className="inline-flex items-center px-2 rounded-lg bg-white/5 border border-white/10 text-[10px] text-gray-400 select-none whitespace-nowrap">
                        {namePrefix}
                      </span>
                      <input
                        type="text"
                        value={draftFields[field.key] ?? ''}
                        onChange={e => updateField(field.key, e.target.value)}
                        className="flex-1 min-w-0 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-pink-500/50 transition-colors"
                        placeholder={`（${field.label}，保存时自动拼回前缀作为条目名）`}
                      />
                    </div>
                  ) : field.multiline ? (
                    <textarea
                      value={draftFields[field.key] ?? ''}
                      onChange={e => updateField(field.key, e.target.value)}
                      className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-pink-500/50 transition-colors resize-none h-20"
                      placeholder={`（${field.label}）`}
                    />
                  ) : (
                    <input
                      type="text"
                      value={draftFields[field.key] ?? ''}
                      onChange={e => updateField(field.key, e.target.value)}
                      className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-pink-500/50 transition-colors"
                      placeholder={`（${field.label}）`}
                    />
                  )}
                </label>
              ))}

              {/* 保存按钮 */}
              <div className="flex items-center justify-end gap-2">
                <span className="text-[10px] text-gray-500">每次保存 -{costPerSave} MC</span>
                {saved && <span className="text-[10px] text-green-400">已保存</span>}
                <button
                  type="button"
                  onClick={() => void saveEntry()}
                  disabled={!dirty || saving}
                  className={[
                    'text-[10px] px-3 py-1.5 rounded-lg font-bold tracking-wide select-none border transition-all',
                    dirty && !saving
                      ? 'border-pink-400/40 text-pink-100 bg-pink-500/20 hover:bg-pink-500/30 active:scale-95 cursor-pointer'
                      : 'border-white/10 text-gray-500 bg-white/5 cursor-not-allowed',
                  ].join(' ')}
                >
                  {saving ? '保存中…' : '保存本条目'}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <p className="text-[10px] text-gray-500 leading-relaxed">
        仅显示{itemLabel}类条目（前缀 {namePrefix}），展示与编辑时已隐藏该前缀。内容按固定字段格式写回（- 字段名：值），
        {nameField.label}会自动拼到前缀之后作为条目名。任一字段为空则无法保存；保存成功扣除 {costPerSave}{' '}
        催眠能量，并把修改前后对比与规则写入玩家输入框。修改的是真实世界书数据，保存后立即生效。
      </p>
    </div>
  );
};

export const HypnosisApp: React.FC<HypnosisAppProps> = ({ userData, onUpdateUser, onExit }) => {
  const normalizeDurationMinutes = (raw: string): number => {
    const numeric = Number(raw);
    if (!Number.isFinite(numeric)) return 1;
    const minutes = Math.floor(numeric);
    if (minutes <= 0) return 1;
    return Math.min(9999, minutes);
  };

  // State
  const [features, setFeatures] = useState<HypnosisFeature[]>([]);
  const [isExpanded, setIsExpanded] = useState(false); // Controls the "Command Center" (Stats + Store)
  const [quickSupplyQtyInput, setQuickSupplyQtyInput] = useState('1');
  const containerRef = useRef<HTMLDivElement>(null);
  const commandCenterBaseRef = useRef<HTMLDivElement>(null);
  const footerControlsRef = useRef<HTMLDivElement>(null);
  const [commandCenterMaxHeightPx, setCommandCenterMaxHeightPx] = useState(512);
  const [durationInput, setDurationInput] = useState('10'); // Minutes
  const duration = normalizeDurationMinutes(durationInput);
  const [globalNote, setGlobalNote] = useState('');
  const [isClosing, setIsClosing] = useState(false); // For exit animation
  const [debugEnabled, setDebugEnabled] = useState(false);
  const debugToggleCountRef = useRef(0);
  const [nowVirtualMinutes, setNowVirtualMinutes] = useState<number | null>(null);
  const [subscription, setSubscription] = useState<{
    tier: 'VIP1' | 'VIP2' | 'VIP3' | 'VIP4' | 'VIP5' | 'VIP6';
  } | null>(null);
  const [subscriptionNotice, setSubscriptionNotice] = useState<string | null>(null);
  const [purchaseShakeFeatureId, setPurchaseShakeFeatureId] = useState<string | null>(null);
  const purchaseShakeTimerRef = useRef<number | null>(null);
  const [roleNames, setRoleNames] = useState<string[]>([]);

  // Immersive Mode State
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [sessionEndVirtualMinutes, setSessionEndVirtualMinutes] = useState<number | null>(null);
  const [sessionEndAtMs, setSessionEndAtMs] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showLowEnergyModal, setShowLowEnergyModal] = useState(false);

  useEffect(() => {
    let stopped = false;
    void (async () => {
      try {
        const refreshed = await DataService.getUserData();
        if (!stopped) onUpdateUser(refreshed);
      } catch (err) {
        console.warn('[HypnoOS] 进入催眠APP时刷新用户数据失败', err);
      }
    })();
    return () => {
      stopped = true;
    };
  }, [onUpdateUser]);

  // Load Features on Mount
  useEffect(() => {
    let stopped = false;
    void (async () => {
      const [nextFeatures, nextDebug, nextSub] = await Promise.all([
        DataService.getFeatures(),
        DataService.getDebugEnabled().catch(() => false),
        DataService.getSubscription().catch(() => null),
      ]);
      if (stopped) return;
      setFeatures(nextFeatures);
      setDebugEnabled(nextDebug);
      setSubscription(nextSub as any);
    })();
    return () => {
      stopped = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (purchaseShakeTimerRef.current !== null) {
        window.clearTimeout(purchaseShakeTimerRef.current);
        purchaseShakeTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let stopped = false;

    const extractRoleNames = (value: unknown): string[] => {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
      return Object.keys(value as Record<string, unknown>).filter(Boolean);
    };

    const refreshRoleNames = async () => {
      try {
        const system = await MvuBridge.getSystem();
        if (stopped) return;
        const preferred = extractRoleNames(system?.角色);
        if (preferred.length > 0) {
          setRoleNames(preferred);
          return;
        }

        const fallback = await MvuBridge.getRoles();
        if (stopped) return;
        setRoleNames(extractRoleNames(fallback));
      } catch (err) {
        console.warn('[HypnoOS] 读取角色列表失败', err);
        if (!stopped) setRoleNames([]);
      }
    };

    void refreshRoleNames();
    return () => {
      stopped = true;
    };
  }, []);

  const triggerPurchaseShake = (featureId: string) => {
    if (purchaseShakeTimerRef.current !== null) window.clearTimeout(purchaseShakeTimerRef.current);

    setPurchaseShakeFeatureId(null);
    window.requestAnimationFrame(() => {
      setPurchaseShakeFeatureId(featureId);
      containerRef.current
        ?.querySelector<HTMLButtonElement>(`button[data-hypno-purchase="${featureId}"]`)
        ?.focus({ preventScroll: true });
    });

    purchaseShakeTimerRef.current = window.setTimeout(() => {
      setPurchaseShakeFeatureId(prev => (prev === featureId ? null : prev));
      purchaseShakeTimerRef.current = null;
    }, 500);
  };

  useEffect(() => {
    const update = () => {
      const containerEl = containerRef.current;
      const baseEl = commandCenterBaseRef.current;
      if (!containerEl || !baseEl) return;

      const containerHeight = containerEl.getBoundingClientRect().height;
      const footerHeight = footerControlsRef.current?.getBoundingClientRect().height ?? 0;
      const baseHeight = baseEl.getBoundingClientRect().height;

      const available = Math.max(0, containerHeight - footerHeight - baseHeight - 12);
      setCommandCenterMaxHeightPx(available);
    };

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [isExpanded]);

  useEffect(() => {
    let stopped = false;
    void (async () => {
      try {
        const end = await DataService.getSessionEnd();
        if (stopped) return;

        setSessionEndVirtualMinutes(end.endVirtualMinutes);
        setSessionEndAtMs(end.endAtMs);

        let remainingSeconds: number | null = null;
        if (end.endVirtualMinutes !== null) {
          try {
            const clock = await DataService.getSystemClock();
            if (!stopped && clock.virtualMinutes !== null) {
              remainingSeconds = Math.max(0, Math.ceil((end.endVirtualMinutes - clock.virtualMinutes) * 60));
            }
          } catch {
            // ignore
          }
        }

        if (remainingSeconds === null && end.endAtMs !== null) {
          remainingSeconds = Math.max(0, Math.ceil((end.endAtMs - Date.now()) / 1000));
        }

        if (remainingSeconds !== null && remainingSeconds > 0) {
          setTimeLeft(remainingSeconds);
          setIsActive(true);
          setIsTransitioning(false);
        } else if (end.endVirtualMinutes !== null || end.endAtMs !== null) {
          void DataService.clearSessionEnd();
        }
      } catch (err) {
        console.warn('[HypnoOS] 恢复催眠状态失败', err);
      }
    })();
    return () => {
      stopped = true;
    };
  }, []);

  useEffect(() => {
    let stopped = false;
    const tick = async () => {
      try {
        const clock = await DataService.getSystemClock();
        if (stopped) return;
        setNowVirtualMinutes(clock.virtualMinutes);

        const nextSub = await DataService.getSubscription();
        if (stopped) return;
        setSubscription(nextSub as any);
      } catch (err) {
        console.warn('[HypnoOS] 等级/时间同步失败', err);
      }
    };

    void tick();
    const timer = setInterval(() => void tick(), 1000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [onUpdateUser]);

  // --- Logic Calculations ---

  useEffect(() => {
    if (duration !== 3614) debugToggleCountRef.current = 0;
  }, [duration]);

  const parseFirstNumber = (text: string | undefined): number | null => {
    if (!text) return null;
    const match = text.match(/(\d+)/);
    if (!match) return null;
    const n = Number(match[1]);
    return Number.isFinite(n) ? n : null;
  };

  const clampInt = (value: unknown, fallback: number, min: number, max: number) => {
    const n = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(n)) return fallback;
    const i = Math.floor(n);
    return Math.max(min, Math.min(max, i));
  };

  const getFeatureNumericConfig = (
    feature: HypnosisFeature,
  ): {
    label: string;
    unit: string;
    min: number;
    max: number;
    step?: number;
    hint?: string;
  } | null => {
    switch (feature.id) {
      default:
        return null;
    }
  };

  const getFeatureCost = (feature: HypnosisFeature): number => {
    const persons = feature.userNumber ?? parseFirstNumber(feature.userNote) ?? 1;

    let amount = 0;
    switch (feature.id) {
      case 'trial_basic':
      case 'vip1_desire_echo':
      case 'vip1_forced_lewd_language':
      case 'vip1_senses':
      case 'vip1_truth_serum':
      case 'vip1_memory_erase':
      case 'vip2_medium':
      case 'vip2_ghost_hand':
      case 'vip2_body_lock': {
        const rounds = feature.id === 'vip1_memory_erase' ? 1 : clampInt(feature.userRounds, 1, 1, 5);
        const modeExtra = feature.userMode === '听觉' ? 300 : feature.userMode === '触觉' ? 100 : 0;
        amount = feature.costValue * rounds + modeExtra;
        break;
      }
      case 'vip2_vision_steal': {
        const rounds = clampInt(feature.userRounds, 1, 1, 5);
        const modeExtra = feature.userMode === '听觉' ? 300 : feature.userMode === '触觉' ? 100 : 0;
        amount = feature.costValue * rounds + modeExtra;
        break;
      }
      case 'vip2_vision_share': {
        const rounds = clampInt(feature.userRounds, 1, 1, 5);
        const modeExtra = feature.userMode === '听觉' ? 300 : feature.userMode === '触觉' ? 100 : 0;
        amount = feature.costValue * rounds + modeExtra;
        break;
      }
      case 'vip2_pain_to_pleasure': {
        const rounds = clampInt(feature.userRounds, 1, 1, 5);
        const modeExtra = feature.userMode === '听觉' ? 300 : feature.userMode === '触觉' ? 100 : 0;
        amount = feature.costValue * rounds + modeExtra;
        break;
      }
      case 'vip2_emperors_new_clothes': {
        const rounds = clampInt(feature.userRounds, 1, 1, 5);
        const modeExtra = feature.userMode === '听觉' ? 300 : feature.userMode === '触觉' ? 100 : 0;
        amount = feature.costValue * rounds + modeExtra;
        break;
      }
      case 'vip2_new_emperor': {
        const rounds = clampInt(feature.userRounds, 1, 1, 5);
        const modeExtra = feature.userMode === '听觉' ? 300 : feature.userMode === '触觉' ? 100 : 0;
        amount = feature.costValue * rounds + modeExtra;
        break;
      }
      case 'vip3_true_love': {
        const rounds = clampInt(feature.userRounds, 1, 1, 5);
        const modeExtra = feature.userMode === '听觉' ? 300 : feature.userMode === '触觉' ? 100 : 0;
        amount = feature.costValue * rounds + modeExtra;
        break;
      }
      case 'vip3_avenger': {
        const rounds = clampInt(feature.userRounds, 1, 1, 5);
        const modeExtra = feature.userMode === '听觉' ? 300 : feature.userMode === '触觉' ? 100 : 0;
        amount = feature.costValue * rounds + modeExtra;
        break;
      }
      case 'vip3_forced': {
        const count = clampInt(feature.userNumber ?? 1, 1, 1, 99);
        const modeExtra = feature.userMode === '听觉' ? 300 : feature.userMode === '触觉' ? 100 : 0;
        amount = feature.costValue * count + modeExtra;
        break;
      }
      case 'vip3_orgasm_ban': {
        const rounds = clampInt(feature.userRounds, 1, 1, 5);
        const modeExtra = feature.userMode === '听觉' ? 300 : feature.userMode === '触觉' ? 100 : 0;
        amount = feature.costValue * rounds + modeExtra;
        break;
      }
      case 'vip3_visual_filter': {
        const rounds = clampInt(feature.userRounds, 1, 1, 5);
        const modeExtra = feature.userMode === '听觉' ? 300 : feature.userMode === '触觉' ? 100 : 0;
        amount = feature.costValue * rounds + modeExtra;
        break;
      }
      case 'vip3_conditioned_reflex': {
        const modeExtra = feature.userMode === '听觉' ? 300 : feature.userMode === '触觉' ? 100 : 0;
        amount = feature.costValue + modeExtra;
        break;
      }
      case 'vip3_temp_common_sense': {
        const rounds = clampInt(feature.userRounds, 1, 1, 5);
        const modeExtra = feature.userMode === '听觉' ? 300 : feature.userMode === '触觉' ? 100 : 0;
        amount = feature.costValue * rounds + modeExtra;
        break;
      }
      case 'vip3_shame_invert': {
        const rounds = clampInt(feature.userRounds, 1, 1, 5);
        const modeExtra = feature.userMode === '听觉' ? 300 : feature.userMode === '触觉' ? 100 : 0;
        amount = feature.costValue * rounds + modeExtra;
        break;
      }
      case 'vip3_temp_false_memory': {
        const rounds = clampInt(feature.userRounds, 1, 1, 5);
        const modeExtra = feature.userMode === '听觉' ? 300 : feature.userMode === '触觉' ? 100 : 0;
        amount = feature.costValue * rounds + modeExtra;
        break;
      }
      case 'vip3_pseudo_time_stop': {
        const rounds = clampInt(feature.userRounds, 1, 1, 5);
        const modeExtra = feature.userMode === '听觉' ? 300 : feature.userMode === '触觉' ? 100 : 0;
        amount = feature.costValue * rounds + modeExtra;
        break;
      }
      case 'vip4_advanced': {
        const rounds = clampInt(feature.userRounds, 1, 1, 5);
        const modeExtra = feature.userMode === '听觉' ? 300 : feature.userMode === '触觉' ? 100 : 0;
        amount = feature.costValue * rounds + modeExtra;
        break;
      }
      case 'vip4_excretion_control': {
        const rounds = clampInt(feature.userRounds, 1, 1, 5);
        const modeExtra = feature.userMode === '听觉' ? 300 : feature.userMode === '触觉' ? 100 : 0;
        amount = feature.costValue * rounds + modeExtra;
        break;
      }
      case 'vip4_control_body_keep_conscious': {
        const rounds = clampInt(feature.userRounds, 1, 1, 5);
        const modeExtra = feature.userMode === '听觉' ? 300 : feature.userMode === '触觉' ? 100 : 0;
        amount = feature.costValue * rounds + modeExtra;
        break;
      }
      case 'vip4_control_body_no_conscious': {
        const rounds = clampInt(feature.userRounds, 1, 1, 5);
        const modeExtra = feature.userMode === '听觉' ? 300 : feature.userMode === '触觉' ? 100 : 0;
        amount = feature.costValue * rounds + modeExtra;
        break;
      }
      case 'vip4_cognitive_block': {
        const rounds = clampInt(feature.userRounds, 1, 1, 5);
        const modeExtra = feature.userMode === '听觉' ? 300 : feature.userMode === '触觉' ? 100 : 0;
        amount = feature.costValue * rounds + modeExtra;
        break;
      }
      case 'vip4_temp_personality': {
        const rounds = clampInt(feature.userRounds, 1, 1, 5);
        const modeExtra = feature.userMode === '听觉' ? 300 : feature.userMode === '触觉' ? 100 : 0;
        amount = feature.costValue * rounds + modeExtra;
        break;
      }
      case 'vip5_condom_transform': {
        const rounds = clampInt(feature.userRounds, 1, 1, 5);
        const modeExtra = feature.userMode === '听觉' ? 300 : feature.userMode === '触觉' ? 100 : 0;
        amount = feature.costValue * rounds + modeExtra;
        break;
      }
      case 'vip5_fleshlight': {
        const rounds = clampInt(feature.userRounds, 1, 1, 5);
        const modeExtra = feature.userMode === '听觉' ? 300 : feature.userMode === '触觉' ? 100 : 0;
        amount = feature.costValue * rounds + modeExtra;
        break;
      }
      case 'vip5_true_time_stop': {
        const rounds = clampInt(feature.userRounds, 1, 1, 5);
        const modeExtra = feature.userMode === '听觉' ? 300 : feature.userMode === '触觉' ? 100 : 0;
        amount = feature.costValue * rounds + modeExtra;
        break;
      }
      case 'vip5_forced_insertion': {
        const rounds = clampInt(feature.userRounds, 1, 1, 5);
        const modeExtra = feature.userMode === '听觉' ? 300 : feature.userMode === '触觉' ? 100 : 0;
        amount = feature.costValue * rounds + modeExtra;
        break;
      }
      case 'vip4_sensation_graft': {
        const rounds = clampInt(feature.userRounds, 1, 1, 5);
        const modeExtra = feature.userMode === '听觉' ? 300 : feature.userMode === '触觉' ? 100 : 0;
        amount = feature.costValue * rounds + modeExtra;
        break;
      }
      case 'vip4_breast_remodeling':
      case 'vip4_genital_remodeling':
      case 'vip4_race_remodeling':
      case 'vip4_butt_remodeling':
      case 'vip4_urethra_remodeling':
      case 'vip4_exclusive_access':
      case 'vip4_lewd_mark':
      case 'vip4_masturbation_punishment':
      case 'vip5_ability_erotic':
      case 'vip5_moral_reform':
      case 'vip5_permanent':
      case 'vip5_permanent_false_memory':
      case 'vip5_permanent_personality':
      case 'vip5_personality_kill':
      case 'vip4_closed_space_common_sense':
      case 'vip4_fetish_implant':
      case 'vip4_fetish_aversion': {
        const modeExtra = feature.userMode === '听觉' ? 300 : feature.userMode === '触觉' ? 100 : 0;
        amount = feature.costValue + modeExtra;
        break;
      }
      case 'vip1_estrus': {
        const rounds = clampInt(feature.userRounds, 1, 1, 5);
        const modeExtra = feature.userMode === '听觉' ? 300 : feature.userMode === '触觉' ? 100 : 0;
        amount = feature.costValue * rounds + modeExtra;
        break;
      }
      case 'vip1_temp_sensitivity': {
        const rounds = clampInt(feature.userRounds, 1, 1, 5);
        const delta = clampInt(feature.userNumber ?? parseFirstNumber(feature.userNote), 1, 1, 100);
        const modeExtra = feature.userMode === '听觉' ? 300 : feature.userMode === '触觉' ? 100 : 0;
        amount = delta * rounds + modeExtra;
        break;
      }
      case 'vip2_pleasure': {
        const rounds = clampInt(feature.userRounds, 1, 1, 5);
        const intensity = clampInt(feature.userNumber ?? parseFirstNumber(feature.userNote), 1, 1, 100);
        const modeExtra = feature.userMode === '听觉' ? 300 : feature.userMode === '触觉' ? 100 : 0;
        amount = feature.costValue * intensity * rounds + modeExtra;
        break;
      }
      case 'vip4_closed_space_common_sense': {
        amount = feature.costValue * persons * duration;
        break;
      }
      default: {
        amount = feature.costType === 'ONE_TIME' ? feature.costValue : feature.costValue * duration;
      }
    }

    return amount;
  };

  const accessContext = useMemo(
    () => ({ debugEnabled, subscription, nowVirtualMinutes }),
    [debugEnabled, nowVirtualMinutes, subscription],
  );
  const subscriptionTiers = useMemo(() => DataService.getSubscriptionTiers(), []);
  const subscriptionActive = useMemo(() => DataService.isSubscriptionActive(accessContext), [accessContext]);

  const hasAccessForFeature = (feature: HypnosisFeature) => DataService.canUseFeature(feature, accessContext);
  const isPurchasedForFeature = (feature: HypnosisFeature) => !feature.purchaseRequired || Boolean(feature.isPurchased);
  const canUseEnabledFeature = (feature: HypnosisFeature) =>
    hasAccessForFeature(feature) && isPurchasedForFeature(feature);

  useEffect(() => {
    const toDisable = features.filter(f => f.isEnabled && !canUseEnabledFeature(f));
    if (toDisable.length === 0) return;
    setFeatures(prev =>
      prev.map(f => (!f.isEnabled || canUseEnabledFeature(f) ? f : { ...f, isEnabled: false, userNote: '' })),
    );
    for (const f of toDisable) {
      void DataService.updateFeature(f.id, { isEnabled: false, userNote: '' });
    }
  }, [debugEnabled, features, nowVirtualMinutes, subscription, subscriptionActive]);

  const totalEnergyCost = useMemo(() => {
    let energy = 0;
    for (const feature of features) {
      if (!feature.isEnabled) continue;
      if (!canUseEnabledFeature(feature)) continue;
      energy += getFeatureCost(feature);
    }
    return energy;
  }, [debugEnabled, duration, features, nowVirtualMinutes, subscription, subscriptionActive]);

  const hasSessionFeaturesEnabled = useMemo(
    () => features.some(f => f.isEnabled && canUseEnabledFeature(f)),
    [debugEnabled, features, nowVirtualMinutes, subscription, subscriptionActive],
  );

  const remainingSubscriptionText = useMemo(() => {
    if (debugEnabled) return 'DEBUG 已解锁';
    if (!subscription) return 'LV1';
    return `LV${subscription.tier.slice(3)}`;
  }, [debugEnabled, subscription]);

  const missingEnergy = Math.max(0, totalEnergyCost - userData.mcEnergy);
  const templateFeatureIds = useMemo(
    () => [
      'trial_basic',
      'vip1_desire_echo',
      'vip1_forced_lewd_language',
      'vip1_senses',
      'vip1_temp_sensitivity',
      'vip1_truth_serum',
      'vip1_memory_erase',
      'vip1_estrus',
      'vip2_medium',
      'vip2_ghost_hand',
      'vip2_body_lock',
      'vip2_vision_steal',
      'vip2_vision_share',
      'vip2_pain_to_pleasure',
      'vip2_emperors_new_clothes',
      'vip2_new_emperor',
      'vip3_true_love',
      'vip3_avenger',
      'vip3_forced',
      'vip3_orgasm_ban',
      'vip3_visual_filter',
      'vip3_conditioned_reflex',
      'vip3_temp_common_sense',
      'vip3_shame_invert',
      'vip3_temp_false_memory',
      'vip3_pseudo_time_stop',
      'vip4_advanced',
      'vip4_excretion_control',
      'vip4_closed_space_common_sense',
      'vip4_fetish_implant',
      'vip4_fetish_aversion',
      'vip4_control_body_keep_conscious',
      'vip4_control_body_no_conscious',
      'vip4_cognitive_block',
      'vip4_temp_personality',
      'vip4_breast_remodeling',
      'vip4_genital_remodeling',
      'vip4_race_remodeling',
      'vip4_butt_remodeling',
      'vip4_urethra_remodeling',
      'vip4_exclusive_access',
      'vip4_lewd_mark',
      'vip4_sensation_graft',
      'vip4_masturbation_punishment',
      'vip5_ability_erotic',
      'vip5_moral_reform',
      'vip5_permanent',
      'vip5_permanent_false_memory',
      'vip5_permanent_personality',
      'vip5_personality_kill',
      'vip5_condom_transform',
      'vip5_forced_insertion',
      'vip5_fleshlight',
      'vip5_true_time_stop',
      'vip2_pleasure',
    ],
    [],
  );
  const templateFeatures = useMemo(
    () => features.filter(f => templateFeatureIds.includes(f.id)),
    [features, templateFeatureIds],
  );
  const templateTargetMissing = Boolean(
    templateFeatures.some(
      f => f.isEnabled && roleNames.length > 0 && !(f.userTarget && f.userTarget.trim() && f.userTarget !== '暂无对象'),
    ),
  );

  // --- Handlers ---

  const handleExitApp = () => {
    setIsClosing(true);
    setTimeout(onExit, 300); // Wait for animation
  };

  const unlockTier = async (tier: 'VIP1' | 'VIP2' | 'VIP3' | 'VIP4' | 'VIP5' | 'VIP6') => {
    const result = await DataService.unlockTier({ tier });
    if (!result.ok) {
      window.alert(result.message || '解锁失败');
      return;
    }
    const refreshed = await DataService.getUserData();
    onUpdateUser(refreshed);
    setSubscription(result.subscription ?? null);
    setSubscriptionNotice('解锁成功');
    setTimeout(() => setSubscriptionNotice(null), 2000);
    const price = SUBSCRIPTION_PRICES[tier] ?? 0;
    void MvuBridge.appendThisTurnAppOperationLog(`解锁 LV${tier.slice(3)}（-¥${price.toLocaleString()}）`);
  };

  const purchaseFeature = async (feature: HypnosisFeature) => {
    const price = feature.purchasePriceEnergy ?? 0;
    const result = await DataService.purchaseFeature(feature.id);
    if (!result.ok || !result.user) {
      window.alert(result.message || '购买失败');
      return;
    }
    onUpdateUser(result.user);
    setFeatures(prev => prev.map(f => (f.id === feature.id ? { ...f, isPurchased: true } : f)));
    setSubscriptionNotice(`已购买：-${price} MC`);
    setTimeout(() => setSubscriptionNotice(null), 1500);
    void MvuBridge.appendThisTurnAppOperationLog(`解锁功能「${feature.title}」（-${price} MC）`);
  };

  const enableDebugMode = async () => {
    await DataService.setDebugEnabled(true);
    setDebugEnabled(true);
    onUpdateUser({
      ...userData,
      money: 999999,
      mcEnergy: 999999,
      mcEnergyMax: 999999,
    });
  };

  const toggleFeature = (id: string) => {
    if (!debugEnabled) {
      if (duration === 3614 && id === 'trial_basic') {
        debugToggleCountRef.current += 1;
        if (debugToggleCountRef.current >= 10) {
          debugToggleCountRef.current = 0;
          void enableDebugMode();
        }
      } else {
        debugToggleCountRef.current = 0;
      }
    }

    const currentEnabled = features.find(f => f.id === id)?.isEnabled ?? false;
    const nextEnabled = !currentEnabled;

    const target = features.find(f => f.id === id);
    if (target && target.purchaseRequired && !target.isPurchased) {
      triggerPurchaseShake(id);
      return;
    }
    if (target && !hasAccessForFeature(target)) {
      return;
    }

    const getNumericDefault = (featureId: string): number | null => {
      switch (featureId) {
        case 'vip1_temp_sensitivity':
          return 1;
        case 'vip2_pleasure':
          return 3;
        default:
          return null;
      }
    };

    const nextNumber =
      nextEnabled && target && typeof target.userNumber === 'undefined' ? getNumericDefault(target.id) : null;

    const defaultTrialBasicTarget = roleNames.length > 0 ? (roleNames[0] ?? '') : '暂无对象';
    const isTemplateFeature = (featureId: string) =>
      [
        'trial_basic',
        'vip1_desire_echo',
        'vip1_forced_lewd_language',
        'vip1_senses',
        'vip1_temp_sensitivity',
        'vip1_truth_serum',
        'vip1_memory_erase',
        'vip1_estrus',
        'vip2_medium',
        'vip2_ghost_hand',
        'vip2_body_lock',
        'vip2_vision_steal',
        'vip2_vision_share',
        'vip2_pain_to_pleasure',
        'vip2_emperors_new_clothes',
        'vip2_new_emperor',
        'vip3_true_love',
        'vip3_avenger',
        'vip3_orgasm_ban',
        'vip3_visual_filter',
        'vip3_temp_common_sense',
        'vip3_shame_invert',
        'vip3_temp_false_memory',
        'vip3_pseudo_time_stop',
        'vip4_advanced',
        'vip4_excretion_control',
        'vip4_control_body_keep_conscious',
        'vip4_control_body_no_conscious',
        'vip4_cognitive_block',
        'vip4_temp_personality',
        'vip5_condom_transform',
        'vip5_forced_insertion',
        'vip5_fleshlight',
        'vip5_true_time_stop',
        'vip4_sensation_graft',
        'vip2_pleasure',
      ].includes(featureId);

    // 互斥：开启某功能时，自动关闭其它所有已开启的功能（同一时间只能启用一个）
    const othersToClose = nextEnabled ? features.filter(f => f.id !== id && f.isEnabled).map(f => f.id) : [];

    setFeatures(prev =>
      prev.map(f => {
        if (f.id === id) {
          return {
            ...f,
            isEnabled: !f.isEnabled,
            ...(nextNumber === null ? null : { userNumber: nextNumber }),
            ...(isTemplateFeature(id) && nextEnabled
              ? {
                  userRounds: typeof f.userRounds === 'number' ? f.userRounds : 1,
                  userMode: f.userMode ?? '视觉',
                  userTarget: f.userTarget || defaultTrialBasicTarget,
                  ...(id === 'vip1_memory_erase' ? { userRounds: 1 } : null),
                  ...(id === 'vip1_temp_sensitivity'
                    ? {
                        userSensitivityOp: f.userSensitivityOp ?? '增加',
                        userSensitivityPart: f.userSensitivityPart ?? '阴部',
                      }
                    : null),
                }
              : null),
          };
        }
        // 被互斥关闭的其它功能
        if (nextEnabled && f.isEnabled) {
          return { ...f, isEnabled: false };
        }
        return f;
      }),
    );
    void DataService.updateFeature(id, {
      isEnabled: nextEnabled,
      ...(nextNumber === null ? null : { userNumber: nextNumber }),
      ...(isTemplateFeature(id) && nextEnabled
        ? {
            userRounds: typeof target?.userRounds === 'number' ? target.userRounds : 1,
            userMode: target?.userMode ?? '视觉',
            userTarget: target?.userTarget || defaultTrialBasicTarget,
            ...(id === 'vip1_memory_erase' ? { userRounds: 1 } : null),
            ...(id === 'vip1_temp_sensitivity'
              ? {
                  userSensitivityOp: target?.userSensitivityOp ?? '增加',
                  userSensitivityPart: target?.userSensitivityPart ?? '阴部',
                }
              : null),
          }
        : null),
    });
    // 持久化被互斥关闭的其它功能
    othersToClose.forEach(otherId => {
      void DataService.updateFeature(otherId, { isEnabled: false });
    });
  };

  const updateFeatureNote = (id: string, note: string) => {
    setFeatures(prev => prev.map(f => (f.id === id ? { ...f, userNote: note } : f)));
    void DataService.updateFeature(id, { userNote: note });
  };

  const updateFeatureNumber = (id: string, value: number | null) => {
    setFeatures(prev => prev.map(f => (f.id === id ? { ...f, userNumber: value === null ? undefined : value } : f)));
    void DataService.updateFeature(id, { userNumber: value === null ? undefined : value });
  };

  const updateTemplateFeatureRounds = (id: string, rounds: number) => {
    setFeatures(prev => prev.map(f => (f.id === id ? { ...f, userRounds: rounds } : f)));
    void DataService.updateFeature(id, { userRounds: rounds });
  };

  const updateTemplateFeatureMode = (id: string, mode: '视觉' | '触觉' | '听觉') => {
    setFeatures(prev => prev.map(f => (f.id === id ? { ...f, userMode: mode } : f)));
    void DataService.updateFeature(id, { userMode: mode });
  };

  const updateTemplateFeatureTarget = (id: string, target: string) => {
    setFeatures(prev => prev.map(f => (f.id === id ? { ...f, userTarget: target } : f)));
    void DataService.updateFeature(id, { userTarget: target });
  };

  const updateFeatureSensitivityOp = (id: string, op: '增加' | '减少') => {
    setFeatures(prev => prev.map(f => (f.id === id ? { ...f, userSensitivityOp: op } : f)));
    void DataService.updateFeature(id, { userSensitivityOp: op });
  };

  const updateFeatureSensitivityPart = (id: string, part: '阴部' | '屁股' | '胸部' | '尿道') => {
    setFeatures(prev => prev.map(f => (f.id === id ? { ...f, userSensitivityPart: part } : f)));
    void DataService.updateFeature(id, { userSensitivityPart: part });
  };

  const updateFeaturePleasurePart = (id: string, part: '阴部' | '屁股' | '胸部' | '尿道') => {
    setFeatures(prev => prev.map(f => (f.id === id ? { ...f, userPleasurePart: part } : f)));
    void DataService.updateFeature(id, { userPleasurePart: part });
  };

  const handleStart = async () => {
    if (missingEnergy > 0) {
      setShowLowEnergyModal(true);
      return;
    }
    if (templateTargetMissing) {
      window.alert('请先为启用的催眠功能选择对象');
      return;
    }

    // Start Sequence
    setIsTransitioning(true);

    let endVirtualMinutes: number | null = null;
    try {
      const clock = await DataService.getSystemClock();
      if (clock.virtualMinutes !== null) endVirtualMinutes = clock.virtualMinutes + duration;
    } catch (err) {
      console.warn('[HypnoOS] 读取系统时间失败，回退到本地倒计时', err);
    }
    const endAtMs = Date.now() + duration * 60 * 1000;
    await DataService.setSessionEnd({ endVirtualMinutes, endAtMs });
    setSessionEndVirtualMinutes(endVirtualMinutes);
    setSessionEndAtMs(endAtMs);

    const enabledFeatures = features.filter(f => f.isEnabled && canUseEnabledFeature(f)).map(f => f);

    // Deduct resources BEFORE sending message (the iframe may reload after chat update)
    await MvuBridge.appendThisTurnAppOperationLog(`启动催眠 ${duration}分钟（-${totalEnergyCost} MC）`);
    const newEnergy = Math.max(0, userData.mcEnergy - totalEnergyCost);
    try {
      const persisted = await DataService.updateResources({
        mcEnergy: newEnergy,
      });
      onUpdateUser(persisted);
    } catch (err) {
      console.warn('[HypnoOS] 资源扣除持久化失败', err);
      onUpdateUser({
        ...userData,
        mcEnergy: newEnergy,
      });
    }

    try {
      const message = buildHypnosisSendMessage({
        features: enabledFeatures,
        durationMinutes: duration,
        globalNote,
      });

      if (typeof triggerSlash === 'function') {
        const escaped = message.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        await triggerSlash(`/setinput "${escaped}"`);
      }
    } catch (err) {
      console.warn('[HypnoOS] 催眠写入输入框失败', err);
    }

    // Mock Backend Call
    await DataService.startSession({
      startTime: Date.now(),
      durationMinutes: duration,
      selectedFeatures: enabledFeatures.map(f => ({
        id: f.id,
        note: f.userNote,
        number: f.userNumber,
        rounds: f.userRounds,
        mode: f.userMode,
        target: f.userTarget,
        sensitivityOp: f.userSensitivityOp,
        sensitivityPart: f.userSensitivityPart,
        pleasurePart: f.userPleasurePart,
      })),
      globalNote,
    });

    // Transition Animation delay
    // 3200ms to allow full completion visual
    setTimeout(() => {
      setIsTransitioning(false);
      setIsActive(true);
      setTimeLeft(duration * 60); // Seconds
    }, 3200);
  };

  const handleStop = () => {
    // Fade out effect could be added here
    setIsActive(false);
    setSessionEndVirtualMinutes(null);
    setSessionEndAtMs(null);
    void DataService.clearSessionEnd();
    // Reset inputs
    setFeatures(prev => prev.map(f => ({ ...f, isEnabled: false, userNote: '' })));
    void DataService.resetFeatures();
    setGlobalNote('');
  };

  const quickSupplyQty = useMemo(() => {
    const parsed = Number.parseInt(quickSupplyQtyInput, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) return 1;
    return Math.min(999, parsed);
  }, [quickSupplyQtyInput]);

  const purchaseEnergy = async (desiredAmount: number) => {
    const unitPrice = 100;
    const amount = Math.floor(desiredAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;

    const missing = Math.max(0, userData.mcEnergyMax - Math.floor(userData.mcEnergy));
    const actualAmount = Math.min(missing, amount);
    if (actualAmount <= 0) return;

    const costMoney = unitPrice * actualAmount;
    if (userData.money < costMoney) return;

    const nextMoney = userData.money - costMoney;
    const nextEnergy = Math.min(userData.mcEnergyMax, userData.mcEnergy + actualAmount);
    try {
      const persisted = await DataService.updateResources({
        money: nextMoney,
        mcEnergy: nextEnergy,
      });
      onUpdateUser(persisted);
    } catch (err) {
      console.warn('[HypnoOS] 购买能量持久化失败', err);
      onUpdateUser({
        ...userData,
        money: nextMoney,
        mcEnergy: nextEnergy,
      });
    }
    void MvuBridge.appendThisTurnAppOperationLog(`购买能量 +${actualAmount} MC（-¥${costMoney.toLocaleString()}）`);
  };

  const purchaseMaxEnergy = async (desiredAmount: number) => {
    const amount = Math.floor(desiredAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    const unitPrice = 1000;
    const costMoney = amount * unitPrice;
    if (userData.money < costMoney) return;

    const nextMoney = userData.money - costMoney;
    const nextEnergyMax = userData.mcEnergyMax + amount;
    try {
      const persisted = await DataService.updateResources({
        money: nextMoney,
        mcEnergyMax: nextEnergyMax,
      });
      onUpdateUser(persisted);
    } catch (err) {
      console.warn('[HypnoOS] 提升能量上限持久化失败', err);
      onUpdateUser({
        ...userData,
        money: nextMoney,
        mcEnergyMax: nextEnergyMax,
      });
    }
    void MvuBridge.appendThisTurnAppOperationLog(`提升能量上限 +${amount}（-¥${costMoney.toLocaleString()}）`);
  };

  // --- Render Helpers ---

  const renderTierSection = (tierConfig: (typeof VIP_LEVELS)[0]) => {
    const tierFeatures = features.filter(f => f.tier === tierConfig.tier);
    if (tierFeatures.length === 0) return null;

    const formatFeatureCost = (feature: HypnosisFeature) => {
      const currency = 'MC';
      if (feature.id === 'vip1_temp_sensitivity') {
        const rounds = clampInt(feature.userRounds, 1, 1, 5);
        const delta = clampInt(feature.userNumber, 1, 1, 100);
        const modeLabel =
          feature.userMode === '听觉' ? '听觉 +300' : feature.userMode === '触觉' ? '触觉 +100' : '视觉 +0';
        return `${delta}点 x ${rounds}轮，${modeLabel}`;
      }
      if (feature.id === 'vip2_pleasure') {
        const rounds = clampInt(feature.userRounds, 1, 1, 5);
        const intensity = clampInt(feature.userNumber, 1, 1, 100);
        const modeLabel =
          feature.userMode === '听觉' ? '听觉 +300' : feature.userMode === '触觉' ? '触觉 +100' : '视觉 +0';
        return `${intensity}级 x ${rounds}轮，${modeLabel}`;
      }
      if (feature.id === 'vip1_memory_erase') {
        const modeLabel =
          feature.userMode === '听觉' ? '听觉 +300' : feature.userMode === '触觉' ? '触觉 +100' : '视觉 +0';
        return `启用一次 ${feature.costValue} MC，${modeLabel}`;
      }
      if (
        feature.id === 'trial_basic' ||
        feature.id === 'vip1_desire_echo' ||
        feature.id === 'vip1_forced_lewd_language' ||
        feature.id === 'vip1_senses' ||
        feature.id === 'vip1_truth_serum' ||
        feature.id === 'vip1_memory_erase' ||
        feature.id === 'vip1_estrus' ||
        feature.id === 'vip2_medium' ||
        feature.id === 'vip2_ghost_hand' ||
        feature.id === 'vip2_body_lock' ||
        feature.id === 'vip2_vision_steal' ||
        feature.id === 'vip2_vision_share' ||
        feature.id === 'vip2_pain_to_pleasure' ||
        feature.id === 'vip2_emperors_new_clothes' ||
        feature.id === 'vip2_new_emperor' ||
        feature.id === 'vip3_true_love' ||
        feature.id === 'vip3_avenger' ||
        feature.id === 'vip3_orgasm_ban' ||
        feature.id === 'vip3_visual_filter' ||
        feature.id === 'vip3_temp_common_sense' ||
        feature.id === 'vip3_shame_invert' ||
        feature.id === 'vip3_temp_false_memory' ||
        feature.id === 'vip3_pseudo_time_stop' ||
        feature.id === 'vip4_advanced' ||
        feature.id === 'vip4_excretion_control' ||
        feature.id === 'vip4_control_body_keep_conscious' ||
        feature.id === 'vip4_control_body_no_conscious' ||
        feature.id === 'vip4_cognitive_block' ||
        feature.id === 'vip4_temp_personality' ||
        feature.id === 'vip4_sensation_graft' ||
        feature.id === 'vip5_condom_transform' ||
        feature.id === 'vip5_forced_insertion' ||
        feature.id === 'vip5_fleshlight' ||
        feature.id === 'vip5_true_time_stop'
      ) {
        const rounds = clampInt(feature.userRounds, 1, 1, 5);
        const modeExtra = feature.userMode === '听觉' ? 300 : feature.userMode === '触觉' ? 100 : 0;
        const modeLabel =
          feature.userMode === '听觉' ? '听觉 +300' : feature.userMode === '触觉' ? '触觉 +100' : '视觉 +0';
        return `基础 ${feature.costValue} MC x ${rounds}轮，${modeLabel}`;
      }
      if (feature.id === 'vip4_closed_space_common_sense') return `每人每分钟: ${feature.costValue} ${currency}`;
      return feature.costType === 'ONE_TIME'
        ? `一次性: ${feature.costValue} ${currency}`
        : `每分钟: ${feature.costValue} ${currency}`;
    };

    return (
      <div key={tierConfig.tier} className="mb-6 relative">
        <div className="flex justify-between items-center mb-2 px-1">
          <h3 className="text-pink-300 font-bold text-sm tracking-wider uppercase">{tierConfig.label}</h3>
        </div>

        {/* Features List */}
        <div className="space-y-3">
          {tierFeatures.map(feature => {
            const lockedBySubscription = !hasAccessForFeature(feature);
            const lockedByPurchase = Boolean(feature.purchaseRequired) && !feature.isPurchased;
            const canToggle = !lockedBySubscription && !lockedByPurchase;
            const purchasePriceEnergy = feature.purchasePriceEnergy ?? 0;

            return (
              <div
                key={feature.id}
                className={`
                 bg-white/5 border rounded-xl overflow-hidden transition-all duration-300
                 ${lockedBySubscription || lockedByPurchase ? 'opacity-80' : ''}
                 ${
                   feature.isEnabled && !lockedBySubscription && !lockedByPurchase
                     ? 'border-pink-500/50 bg-pink-500/10 shadow-[0_0_15px_rgba(236,72,153,0.1)]'
                     : 'border-white/10'
                 }
               `}
              >
                <div
                  className={[
                    'p-3 flex justify-between items-center active:bg-white/5',
                    canToggle || lockedByPurchase ? 'cursor-pointer hover:bg-white/5' : 'cursor-not-allowed',
                  ].join(' ')}
                  onClick={() => {
                    if (lockedByPurchase) {
                      triggerPurchaseShake(feature.id);
                      return;
                    }
                    if (lockedBySubscription) {
                      return;
                    }
                    toggleFeature(feature.id);
                  }}
                >
                  <div>
                    <div className="font-medium text-gray-100 flex items-center gap-2">
                      <span>{feature.title}</span>
                      {lockedByPurchase && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-gray-200 flex items-center gap-1">
                          <Lock size={10} className="text-gray-300" /> 未购买
                        </span>
                      )}
                      {lockedBySubscription && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-gray-200 flex items-center gap-1">
                          <Lock size={10} className="text-gray-300" /> 未解锁
                        </span>
                      )}
                      {!lockedByPurchase && feature.purchaseRequired && feature.isPurchased && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-200">
                          已购买
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{formatFeatureCost(feature)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {lockedByPurchase && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          void purchaseFeature(feature);
                        }}
                        disabled={userData.mcEnergy < purchasePriceEnergy}
                        data-hypno-purchase={feature.id}
                        className={[
                          'text-[10px] px-3 py-1.5 rounded-xl font-extrabold tracking-wide select-none',
                          'border border-amber-200/20 text-black',
                          'bg-gradient-to-r from-amber-300 via-orange-400 to-amber-300',
                          'shadow-[0_6px_18px_rgba(245,158,11,0.22)]',
                          'transition-transform transition-shadow duration-150',
                          'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70',
                          userData.mcEnergy < purchasePriceEnergy
                            ? 'opacity-50 cursor-not-allowed grayscale'
                            : 'hover:shadow-[0_10px_26px_rgba(245,158,11,0.35)] active:scale-[0.97] cursor-pointer',
                          purchaseShakeFeatureId === feature.id ? 'hypno-shake' : '',
                        ].join(' ')}
                      >
                        购买 {purchasePriceEnergy} MC
                      </button>
                    )}
                    {feature.id === 'vip4_course_edit' || feature.id === 'vip5_open_space_common_sense' ? (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          if (canToggle) toggleFeature(feature.id);
                        }}
                        disabled={!canToggle}
                        className={[
                          'text-[10px] px-3 py-1.5 rounded-xl font-bold tracking-wide select-none whitespace-nowrap',
                          'border border-pink-400/40 text-pink-100 bg-pink-500/10',
                          'transition-all duration-150',
                          canToggle
                            ? 'hover:bg-pink-500/20 active:scale-95 cursor-pointer'
                            : 'opacity-50 cursor-not-allowed',
                          feature.isEnabled ? 'bg-pink-500/30' : '',
                        ].join(' ')}
                      >
                        {feature.isEnabled ? '收起编辑器' : '打开编辑器'}
                      </button>
                    ) : (
                      <div
                        className={`
                          w-10 h-6 rounded-full relative transition-colors duration-200
                          ${feature.isEnabled && !lockedBySubscription && !lockedByPurchase ? 'bg-pink-500' : 'bg-gray-700'}
                        `}
                      >
                        <div
                          className={`
                            absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-200 shadow-sm
                            ${feature.isEnabled && !lockedBySubscription && !lockedByPurchase ? 'left-5' : 'left-1'}
                          `}
                        ></div>
                      </div>
                    )}
                  </div>
                </div>

                {feature.isEnabled && !lockedBySubscription && !lockedByPurchase && (
                  <div className="px-3 pb-3 pt-0 border-t border-white/5 animate-slide-down">
                    <p className="text-xs text-gray-300 mt-2 leading-relaxed opacity-90">{feature.description}</p>

                    {feature.id === 'vip4_course_edit' && (
                      <WorldBookEntryEditor
                        feature={feature}
                        namePrefix="[mvu_plot]课程-"
                        itemLabel="课程"
                        fields={COURSE_FIELDS}
                        costPerSave={1000}
                        rulesText={COURSE_RULES_TEXT}
                        userData={userData}
                        onUpdateUser={onUpdateUser}
                      />
                    )}
                    {feature.id === 'vip5_open_space_common_sense' && (
                      <WorldBookEntryEditor
                        feature={feature}
                        namePrefix="[mvu_plot]校规-"
                        itemLabel="校规"
                        fields={SCHOOL_RULE_FIELDS}
                        costPerSave={3000}
                        rulesText={SCHOOL_RULES_TEXT}
                        userData={userData}
                        onUpdateUser={onUpdateUser}
                      />
                    )}
                    {(feature.id === 'trial_basic' ||
                      feature.id === 'vip1_desire_echo' ||
                      feature.id === 'vip1_forced_lewd_language' ||
                      feature.id === 'vip1_senses' ||
                      feature.id === 'vip1_truth_serum' ||
                      feature.id === 'vip1_memory_erase' ||
                      feature.id === 'vip1_estrus' ||
                      feature.id === 'vip2_medium' ||
                      feature.id === 'vip2_ghost_hand' ||
                      feature.id === 'vip2_body_lock' ||
                      feature.id === 'vip2_vision_steal' ||
                      feature.id === 'vip2_vision_share' ||
                      feature.id === 'vip2_pain_to_pleasure' ||
                      feature.id === 'vip2_emperors_new_clothes' ||
                      feature.id === 'vip2_new_emperor' ||
                      feature.id === 'vip3_true_love' ||
                      feature.id === 'vip3_avenger' ||
                      feature.id === 'vip3_orgasm_ban' ||
                      feature.id === 'vip3_visual_filter' ||
                      feature.id === 'vip3_temp_common_sense' ||
                      feature.id === 'vip3_shame_invert' ||
                      feature.id === 'vip3_temp_false_memory' ||
                      feature.id === 'vip3_pseudo_time_stop' ||
                      feature.id === 'vip4_advanced' ||
                      feature.id === 'vip4_excretion_control' ||
                      feature.id === 'vip4_control_body_keep_conscious' ||
                      feature.id === 'vip4_control_body_no_conscious' ||
                      feature.id === 'vip4_cognitive_block' ||
                      feature.id === 'vip4_temp_personality' ||
                      feature.id === 'vip4_sensation_graft' ||
                      feature.id === 'vip5_condom_transform' ||
                      feature.id === 'vip5_forced_insertion' ||
                      feature.id === 'vip5_fleshlight' ||
                      feature.id === 'vip5_true_time_stop') && (
                      <div className="mt-3 space-y-3">
                        {/* Row 1: 持续轮次 + 目标对象 */}
                        <div className="grid grid-cols-[auto_1fr] gap-3 items-end">
                          <div className="shrink-0">
                            <div className="text-[10px] text-gray-400 mb-1">持续轮次</div>
                            <div className="flex gap-1.5">
                              {[
                                { value: 1, label: 'X1' },
                                { value: 2, label: 'X2' },
                                { value: 3, label: 'X3' },
                                { value: 5, label: 'X5' },
                              ].map(round => {
                                const roundValue = round.value;
                                const effectiveRounds =
                                  feature.id === 'vip1_memory_erase' ? 1 : (feature.userRounds ?? 1);
                                const active = effectiveRounds === roundValue;
                                const disabled = feature.id === 'vip1_memory_erase' && roundValue !== 1;
                                return (
                                  <button
                                    key={round.label}
                                    type="button"
                                    onClick={() => {
                                      if (disabled) return;
                                      updateTemplateFeatureRounds(feature.id, roundValue);
                                    }}
                                    disabled={disabled}
                                    className={[
                                      'rounded-lg px-2.5 py-1 text-[11px] font-medium border transition-colors',
                                      active
                                        ? 'border-pink-400 bg-pink-500/20 text-pink-100'
                                        : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10',
                                      disabled ? 'opacity-40 cursor-not-allowed hover:bg-white/5' : '',
                                    ].join(' ')}
                                  >
                                    {round.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <label className="min-w-0 flex-1">
                            <div className="text-[10px] text-gray-400 mb-1">目标对象</div>
                            <select
                              value={feature.userTarget ?? ''}
                              onChange={e => updateTemplateFeatureTarget(feature.id, e.target.value)}
                              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500/50 transition-colors"
                            >
                              {roleNames.length === 0 ? (
                                <option value="">暂无对象</option>
                              ) : (
                                <>
                                  <option value="">请选择对象</option>
                                  {roleNames.map(name => (
                                    <option key={name} value={name}>
                                      {name}
                                    </option>
                                  ))}
                                </>
                              )}
                            </select>
                          </label>
                        </div>

                        <div>
                          <div className="text-[10px] text-gray-400 mb-1">催眠模式选择</div>
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1.5">
                              {(
                                [
                                  { value: '视觉', extra: 0 },
                                  { value: '触觉', extra: 100 },
                                  { value: '听觉', extra: 300 },
                                ] as const
                              ).map(option => {
                                const active = (feature.userMode ?? '视觉') === option.value;
                                return (
                                  <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => updateTemplateFeatureMode(feature.id, option.value)}
                                    className={[
                                      'rounded-lg px-2.5 py-1 text-[11px] font-medium border transition-colors whitespace-nowrap',
                                      active
                                        ? 'border-pink-400 bg-pink-500/20 text-pink-100'
                                        : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10',
                                    ].join(' ')}
                                  >
                                    {option.value}+{option.extra}
                                  </button>
                                );
                              })}
                            </div>
                            <div className="ml-auto rounded-lg border border-amber-400/20 bg-amber-500/10 px-3 py-1.5 flex items-center gap-2 shrink-0">
                              <span className="text-[11px] text-amber-100">总消耗</span>
                              <span className="text-sm font-bold text-amber-300 tabular-nums">
                                {getFeatureCost(feature)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {feature.id === 'vip1_temp_sensitivity' && (
                      <div className="mt-3 space-y-3">
                        <div className="grid grid-cols-[auto_1fr] gap-3 items-end">
                          <div className="shrink-0">
                            <div className="text-[10px] text-gray-400 mb-1">持续轮次</div>
                            <div className="flex gap-1.5">
                              {[1, 2, 3, 5].map(round => {
                                const active = (feature.userRounds ?? 1) === round;
                                return (
                                  <button
                                    key={round}
                                    type="button"
                                    onClick={() => updateTemplateFeatureRounds(feature.id, round)}
                                    className={[
                                      'rounded-lg px-2.5 py-1 text-[11px] font-medium border transition-colors',
                                      active
                                        ? 'border-pink-400 bg-pink-500/20 text-pink-100'
                                        : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10',
                                    ].join(' ')}
                                  >
                                    X{round}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <label className="min-w-0 flex-1">
                            <div className="text-[10px] text-gray-400 mb-1">目标对象</div>
                            <select
                              value={feature.userTarget ?? ''}
                              onChange={e => updateTemplateFeatureTarget(feature.id, e.target.value)}
                              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500/50 transition-colors"
                            >
                              {roleNames.length === 0 ? (
                                <option value="">暂无对象</option>
                              ) : (
                                <>
                                  <option value="">请选择对象</option>
                                  {roleNames.map(name => (
                                    <option key={name} value={name}>
                                      {name}
                                    </option>
                                  ))}
                                </>
                              )}
                            </select>
                          </label>
                        </div>

                        <div className="grid grid-cols-[auto_minmax(96px,120px)_1fr] gap-2 items-end">
                          <div>
                            <div className="text-[10px] text-gray-400 mb-1">调整方向</div>
                            <div className="flex gap-1.5">
                              {(['增加', '减少'] as const).map(op => {
                                const active = (feature.userSensitivityOp ?? '增加') === op;
                                return (
                                  <button
                                    key={op}
                                    type="button"
                                    onClick={() => updateFeatureSensitivityOp(feature.id, op)}
                                    className={[
                                      'rounded-lg px-2.5 py-1 text-[11px] font-medium border transition-colors whitespace-nowrap',
                                      active
                                        ? 'border-pink-400 bg-pink-500/20 text-pink-100'
                                        : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10',
                                    ].join(' ')}
                                  >
                                    {op === '增加' ? '+' : '-'}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <label>
                            <div className="text-[10px] text-gray-400 mb-1">敏感度数值</div>
                            <input
                              type="number"
                              inputMode="numeric"
                              min={1}
                              max={100}
                              step={1}
                              value={
                                typeof feature.userNumber === 'number' && Number.isFinite(feature.userNumber)
                                  ? feature.userNumber
                                  : ''
                              }
                              onChange={e => {
                                const raw = e.target.value;
                                if (!raw) {
                                  updateFeatureNumber(feature.id, null);
                                  return;
                                }
                                const next = Number(raw);
                                if (!Number.isFinite(next)) return;
                                updateFeatureNumber(feature.id, Math.max(1, Math.min(100, Math.floor(next))));
                              }}
                              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-pink-500/50 transition-colors"
                              placeholder="1-100"
                            />
                          </label>

                          <label className="min-w-0">
                            <div className="text-[10px] text-gray-400 mb-1">目标部位</div>
                            <select
                              value={feature.userSensitivityPart ?? '阴部'}
                              onChange={e =>
                                updateFeatureSensitivityPart(
                                  feature.id,
                                  e.target.value as '阴部' | '屁股' | '胸部' | '尿道',
                                )
                              }
                              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500/50 transition-colors"
                            >
                              {(['阴部', '屁股', '胸部', '尿道'] as const).map(part => (
                                <option key={part} value={part}>
                                  {part}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>

                        <div>
                          <div className="text-[10px] text-gray-400 mb-1">催眠模式选择</div>
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1.5">
                              {(
                                [
                                  { value: '视觉', extra: 0 },
                                  { value: '触觉', extra: 100 },
                                  { value: '听觉', extra: 300 },
                                ] as const
                              ).map(option => {
                                const active = (feature.userMode ?? '视觉') === option.value;
                                return (
                                  <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => updateTemplateFeatureMode(feature.id, option.value)}
                                    className={[
                                      'rounded-lg px-2.5 py-1 text-[11px] font-medium border transition-colors whitespace-nowrap',
                                      active
                                        ? 'border-pink-400 bg-pink-500/20 text-pink-100'
                                        : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10',
                                    ].join(' ')}
                                  >
                                    {option.value}+{option.extra}
                                  </button>
                                );
                              })}
                            </div>
                            <div className="ml-auto rounded-lg border border-amber-400/20 bg-amber-500/10 px-3 py-1.5 flex items-center gap-2 shrink-0">
                              <span className="text-[11px] text-amber-100">总消耗</span>
                              <span className="text-sm font-bold text-amber-300 tabular-nums">
                                {getFeatureCost(feature)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <textarea
                          placeholder={feature.notePlaceholder || '在此输入具体指令备注...'}
                          value={feature.userNote || ''}
                          onChange={e => updateFeatureNote(feature.id, e.target.value)}
                          className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-pink-500/50 transition-colors resize-none h-16"
                        />
                      </div>
                    )}

                    {feature.id === 'vip2_pleasure' && (
                      <div className="mt-3 space-y-3">
                        <div className="grid grid-cols-[auto_1fr] gap-3 items-end">
                          <div className="shrink-0">
                            <div className="text-[10px] text-gray-400 mb-1">持续轮次</div>
                            <div className="flex gap-1.5">
                              {[1, 2, 3, 5].map(round => {
                                const active = (feature.userRounds ?? 1) === round;
                                return (
                                  <button
                                    key={round}
                                    type="button"
                                    onClick={() => updateTemplateFeatureRounds(feature.id, round)}
                                    className={[
                                      'rounded-lg px-2.5 py-1 text-[11px] font-medium border transition-colors',
                                      active
                                        ? 'border-pink-400 bg-pink-500/20 text-pink-100'
                                        : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10',
                                    ].join(' ')}
                                  >
                                    X{round}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <label className="min-w-0 flex-1">
                            <div className="text-[10px] text-gray-400 mb-1">目标对象</div>
                            <select
                              value={feature.userTarget ?? ''}
                              onChange={e => updateTemplateFeatureTarget(feature.id, e.target.value)}
                              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500/50 transition-colors"
                            >
                              {roleNames.length === 0 ? (
                                <option value="">暂无对象</option>
                              ) : (
                                <>
                                  <option value="">请选择对象</option>
                                  {roleNames.map(name => (
                                    <option key={name} value={name}>
                                      {name}
                                    </option>
                                  ))}
                                </>
                              )}
                            </select>
                          </label>
                        </div>

                        <div className="grid grid-cols-[minmax(96px,120px)_1fr] gap-2 items-end">
                          <label>
                            <div className="text-[10px] text-gray-400 mb-1">快感强度</div>
                            <input
                              type="number"
                              inputMode="numeric"
                              min={1}
                              max={100}
                              step={1}
                              value={
                                typeof feature.userNumber === 'number' && Number.isFinite(feature.userNumber)
                                  ? feature.userNumber
                                  : ''
                              }
                              onChange={e => {
                                const raw = e.target.value;
                                if (!raw) {
                                  updateFeatureNumber(feature.id, null);
                                  return;
                                }
                                const next = Number(raw);
                                if (!Number.isFinite(next)) return;
                                updateFeatureNumber(feature.id, Math.max(1, Math.min(100, Math.floor(next))));
                              }}
                              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-pink-500/50 transition-colors"
                              placeholder="1-100"
                            />
                          </label>

                          <label className="min-w-0">
                            <div className="text-[10px] text-gray-400 mb-1">目标部位</div>
                            <select
                              value={feature.userPleasurePart ?? '阴部'}
                              onChange={e =>
                                updateFeaturePleasurePart(
                                  feature.id,
                                  e.target.value as '阴部' | '屁股' | '胸部' | '尿道',
                                )
                              }
                              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500/50 transition-colors"
                            >
                              {(['阴部', '屁股', '胸部', '尿道'] as const).map(part => (
                                <option key={part} value={part}>
                                  {part}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>

                        <div>
                          <div className="text-[10px] text-gray-400 mb-1">催眠模式选择</div>
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1.5">
                              {(
                                [
                                  { value: '视觉', extra: 0 },
                                  { value: '触觉', extra: 100 },
                                  { value: '听觉', extra: 300 },
                                ] as const
                              ).map(option => {
                                const active = (feature.userMode ?? '视觉') === option.value;
                                return (
                                  <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => updateTemplateFeatureMode(feature.id, option.value)}
                                    className={[
                                      'rounded-lg px-2.5 py-1 text-[11px] font-medium border transition-colors whitespace-nowrap',
                                      active
                                        ? 'border-pink-400 bg-pink-500/20 text-pink-100'
                                        : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10',
                                    ].join(' ')}
                                  >
                                    {option.value}+{option.extra}
                                  </button>
                                );
                              })}
                            </div>
                            <div className="ml-auto rounded-lg border border-amber-400/20 bg-amber-500/10 px-3 py-1.5 flex items-center gap-2 shrink-0">
                              <span className="text-[11px] text-amber-100">总消耗</span>
                              <span className="text-sm font-bold text-amber-300 tabular-nums">
                                {getFeatureCost(feature)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <textarea
                          placeholder={feature.notePlaceholder || '在此输入具体指令备注...'}
                          value={feature.userNote || ''}
                          onChange={e => updateFeatureNote(feature.id, e.target.value)}
                          className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-pink-500/50 transition-colors resize-none h-16"
                        />
                      </div>
                    )}

                    {feature.id === 'vip3_forced' && (
                      <div className="mt-3 space-y-3">
                        <div className="grid grid-cols-[auto_1fr] gap-3 items-end">
                          <label className="min-w-0">
                            <div className="text-[10px] text-gray-400 mb-1">高潮次数</div>
                            <input
                              type="number"
                              inputMode="numeric"
                              min={1}
                              max={99}
                              step={1}
                              value={
                                typeof feature.userNumber === 'number' && Number.isFinite(feature.userNumber)
                                  ? feature.userNumber
                                  : ''
                              }
                              onChange={e => {
                                const raw = e.target.value;
                                if (!raw) {
                                  updateFeatureNumber(feature.id, null);
                                  return;
                                }
                                const next = Number(raw);
                                if (!Number.isFinite(next)) return;
                                updateFeatureNumber(feature.id, Math.max(1, Math.min(99, Math.floor(next))));
                              }}
                              className="w-24 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-pink-500/50 transition-colors"
                              placeholder="1-99"
                            />
                          </label>
                          <label className="min-w-0 flex-1">
                            <div className="text-[10px] text-gray-400 mb-1">目标对象</div>
                            <select
                              value={feature.userTarget ?? ''}
                              onChange={e => updateTemplateFeatureTarget(feature.id, e.target.value)}
                              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500/50 transition-colors"
                            >
                              {roleNames.length === 0 ? (
                                <option value="">暂无对象</option>
                              ) : (
                                <>
                                  <option value="">请选择对象</option>
                                  {roleNames.map(name => (
                                    <option key={name} value={name}>
                                      {name}
                                    </option>
                                  ))}
                                </>
                              )}
                            </select>
                          </label>
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-400 mb-1">催眠模式选择</div>
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1.5">
                              {(
                                [
                                  { value: '视觉', extra: 0 },
                                  { value: '触觉', extra: 100 },
                                  { value: '听觉', extra: 300 },
                                ] as const
                              ).map(option => {
                                const active = (feature.userMode ?? '视觉') === option.value;
                                return (
                                  <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => updateTemplateFeatureMode(feature.id, option.value)}
                                    className={[
                                      'rounded-lg px-2.5 py-1 text-[11px] font-medium border transition-colors whitespace-nowrap',
                                      active
                                        ? 'border-pink-400 bg-pink-500/20 text-pink-100'
                                        : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10',
                                    ].join(' ')}
                                  >
                                    {option.value}+{option.extra}
                                  </button>
                                );
                              })}
                            </div>
                            <div className="ml-auto rounded-lg border border-amber-400/20 bg-amber-500/10 px-3 py-1.5 flex items-center gap-2 shrink-0">
                              <span className="text-[11px] text-amber-100">总消耗</span>
                              <span className="text-sm font-bold text-amber-300 tabular-nums">
                                {getFeatureCost(feature)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <textarea
                          placeholder={feature.notePlaceholder || '在此输入具体指令备注...'}
                          value={feature.userNote || ''}
                          onChange={e => updateFeatureNote(feature.id, e.target.value)}
                          className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-pink-500/50 transition-colors resize-none h-16"
                        />
                      </div>
                    )}

                    {feature.id === 'vip3_conditioned_reflex' && (
                      <div className="mt-3 space-y-3">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="text-[10px] text-gray-400 mb-1">持续轮次</div>
                            <button
                              type="button"
                              className="rounded-lg px-3 py-1 text-[11px] font-medium border border-pink-400 bg-pink-500/20 text-pink-100 cursor-default"
                            >
                              X∞
                            </button>
                          </div>
                          <label className="min-w-0 flex-1">
                            <div className="text-[10px] text-gray-400 mb-1">目标对象</div>
                            <select
                              value={feature.userTarget ?? ''}
                              onChange={e => updateTemplateFeatureTarget(feature.id, e.target.value)}
                              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500/50 transition-colors"
                            >
                              {roleNames.length === 0 ? (
                                <option value="">暂无对象</option>
                              ) : (
                                <>
                                  <option value="">请选择对象</option>
                                  {roleNames.map(name => (
                                    <option key={name} value={name}>
                                      {name}
                                    </option>
                                  ))}
                                </>
                              )}
                            </select>
                          </label>
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-400 mb-1">催眠模式选择</div>
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1.5">
                              {(
                                [
                                  { value: '视觉', extra: 0 },
                                  { value: '触觉', extra: 100 },
                                  { value: '听觉', extra: 300 },
                                ] as const
                              ).map(option => {
                                const active = (feature.userMode ?? '视觉') === option.value;
                                return (
                                  <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => updateTemplateFeatureMode(feature.id, option.value)}
                                    className={[
                                      'rounded-lg px-2.5 py-1 text-[11px] font-medium border transition-colors whitespace-nowrap',
                                      active
                                        ? 'border-pink-400 bg-pink-500/20 text-pink-100'
                                        : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10',
                                    ].join(' ')}
                                  >
                                    {option.value}+{option.extra}
                                  </button>
                                );
                              })}
                            </div>
                            <div className="ml-auto rounded-lg border border-amber-400/20 bg-amber-500/10 px-3 py-1.5 flex items-center gap-2 shrink-0">
                              <span className="text-[11px] text-amber-100">总消耗</span>
                              <span className="text-sm font-bold text-amber-300 tabular-nums">
                                {getFeatureCost(feature)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <textarea
                          placeholder={feature.notePlaceholder || '在此输入具体指令备注...'}
                          value={feature.userNote || ''}
                          onChange={e => updateFeatureNote(feature.id, e.target.value)}
                          className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-pink-500/50 transition-colors resize-none h-16"
                        />
                      </div>
                    )}

                    {[
                      'vip4_breast_remodeling',
                      'vip4_genital_remodeling',
                      'vip4_race_remodeling',
                      'vip4_butt_remodeling',
                      'vip4_urethra_remodeling',
                      'vip4_exclusive_access',
                      'vip4_lewd_mark',
                      'vip4_fetish_implant',
                      'vip4_fetish_aversion',
                      'vip4_masturbation_punishment',
                      'vip5_ability_erotic',
                      'vip5_moral_reform',
                      'vip5_permanent',
                      'vip5_permanent_false_memory',
                      'vip5_permanent_personality',
                      'vip5_personality_kill',
                    ].includes(feature.id) && (
                      <div className="mt-3 space-y-3">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="text-[10px] text-gray-400 mb-1">持续轮次</div>
                            <button
                              type="button"
                              className="rounded-lg px-3 py-1 text-[11px] font-medium border border-pink-400 bg-pink-500/20 text-pink-100 cursor-default"
                            >
                              X∞
                            </button>
                          </div>
                          <label className="min-w-0 flex-1">
                            <div className="text-[10px] text-gray-400 mb-1">目标对象</div>
                            <select
                              value={feature.userTarget ?? ''}
                              onChange={e => updateTemplateFeatureTarget(feature.id, e.target.value)}
                              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500/50 transition-colors"
                            >
                              {roleNames.length === 0 ? (
                                <option value="">暂无对象</option>
                              ) : (
                                <>
                                  <option value="">请选择对象</option>
                                  {roleNames.map(name => (
                                    <option key={name} value={name}>
                                      {name}
                                    </option>
                                  ))}
                                </>
                              )}
                            </select>
                          </label>
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-400 mb-1">催眠模式选择</div>
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1.5">
                              {(
                                [
                                  { value: '视觉', extra: 0 },
                                  { value: '触觉', extra: 100 },
                                  { value: '听觉', extra: 300 },
                                ] as const
                              ).map(option => {
                                const active = (feature.userMode ?? '视觉') === option.value;
                                return (
                                  <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => updateTemplateFeatureMode(feature.id, option.value)}
                                    className={[
                                      'rounded-lg px-2.5 py-1 text-[11px] font-medium border transition-colors whitespace-nowrap',
                                      active
                                        ? 'border-pink-400 bg-pink-500/20 text-pink-100'
                                        : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10',
                                    ].join(' ')}
                                  >
                                    {option.value}+{option.extra}
                                  </button>
                                );
                              })}
                            </div>
                            <div className="ml-auto rounded-lg border border-amber-400/20 bg-amber-500/10 px-3 py-1.5 flex items-center gap-2 shrink-0">
                              <span className="text-[11px] text-amber-100">总消耗</span>
                              <span className="text-sm font-bold text-amber-300 tabular-nums">
                                {getFeatureCost(feature)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <textarea
                          placeholder={feature.notePlaceholder || '在此输入具体指令备注...'}
                          value={feature.userNote || ''}
                          onChange={e => updateFeatureNote(feature.id, e.target.value)}
                          className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-pink-500/50 transition-colors resize-none h-16"
                        />
                      </div>
                    )}

                    {feature.id === 'vip4_closed_space_common_sense' && (
                      <div className="mt-3 space-y-3">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="text-[10px] text-gray-400 mb-1">持续轮次</div>
                            <button
                              type="button"
                              className="rounded-lg px-3 py-1 text-[11px] font-medium border border-pink-400 bg-pink-500/20 text-pink-100 cursor-default"
                            >
                              X∞
                            </button>
                          </div>
                          <label className="min-w-0 flex-1">
                            <div className="text-[10px] text-gray-400 mb-1">目标对象</div>
                            <div className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-pink-200">
                              当前房间所有人
                            </div>
                          </label>
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-400 mb-1">催眠模式选择</div>
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1.5">
                              {(
                                [
                                  { value: '视觉', extra: 0 },
                                  { value: '触觉', extra: 100 },
                                  { value: '听觉', extra: 300 },
                                ] as const
                              ).map(option => {
                                const active = (feature.userMode ?? '视觉') === option.value;
                                return (
                                  <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => updateTemplateFeatureMode(feature.id, option.value)}
                                    className={[
                                      'rounded-lg px-2.5 py-1 text-[11px] font-medium border transition-colors whitespace-nowrap',
                                      active
                                        ? 'border-pink-400 bg-pink-500/20 text-pink-100'
                                        : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10',
                                    ].join(' ')}
                                  >
                                    {option.value}+{option.extra}
                                  </button>
                                );
                              })}
                            </div>
                            <div className="ml-auto rounded-lg border border-amber-400/20 bg-amber-500/10 px-3 py-1.5 flex items-center gap-2 shrink-0">
                              <span className="text-[11px] text-amber-100">总消耗</span>
                              <span className="text-sm font-bold text-amber-300 tabular-nums">
                                {getFeatureCost(feature)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <textarea
                          placeholder={feature.notePlaceholder || '在此输入具体指令备注...'}
                          value={feature.userNote || ''}
                          onChange={e => updateFeatureNote(feature.id, e.target.value)}
                          className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-pink-500/50 transition-colors resize-none h-16"
                        />
                      </div>
                    )}

                    {feature.id !== 'trial_basic' &&
                      feature.id !== 'vip4_course_edit' &&
                      feature.id !== 'vip5_open_space_common_sense' &&
                      feature.id !== 'vip1_desire_echo' &&
                      feature.id !== 'vip1_forced_lewd_language' &&
                      feature.id !== 'vip1_senses' &&
                      feature.id !== 'vip1_truth_serum' &&
                      feature.id !== 'vip1_estrus' &&
                      feature.id !== 'vip1_temp_sensitivity' &&
                      feature.id !== 'vip2_ghost_hand' &&
                      feature.id !== 'vip2_body_lock' &&
                      feature.id !== 'vip2_pleasure' &&
                      feature.id !== 'vip3_forced' &&
                      feature.id !== 'vip3_conditioned_reflex' &&
                      feature.id !== 'vip4_breast_remodeling' &&
                      feature.id !== 'vip4_genital_remodeling' &&
                      feature.id !== 'vip4_race_remodeling' &&
                      feature.id !== 'vip4_butt_remodeling' &&
                      feature.id !== 'vip4_urethra_remodeling' &&
                      feature.id !== 'vip4_exclusive_access' &&
                      feature.id !== 'vip4_lewd_mark' &&
                      feature.id !== 'vip4_closed_space_common_sense' &&
                      feature.id !== 'vip4_fetish_implant' &&
                      feature.id !== 'vip4_fetish_aversion' &&
                      feature.id !== 'vip4_masturbation_punishment' &&
                      feature.id !== 'vip5_ability_erotic' &&
                      feature.id !== 'vip5_moral_reform' &&
                      feature.id !== 'vip5_permanent' &&
                      feature.id !== 'vip5_permanent_false_memory' &&
                      feature.id !== 'vip5_permanent_personality' &&
                      feature.id !== 'vip5_personality_kill' &&
                      (() => {
                        const cfg = getFeatureNumericConfig(feature);
                        if (!cfg) return null;
                        const currentRaw = feature.userNumber;
                        const current = typeof currentRaw === 'number' && Number.isFinite(currentRaw) ? currentRaw : '';
                        const computed = getFeatureCost(feature);
                        const currencyLabel = 'MC';
                        return (
                          <div className="mt-3 grid grid-cols-2 gap-2 items-end">
                            <label className="col-span-1">
                              <div className="text-[10px] text-gray-400 mb-1 flex items-center justify-between gap-2">
                                <span className="truncate">
                                  {cfg.label}
                                  {cfg.unit ? `（${cfg.unit}）` : ''}
                                </span>
                                {cfg.hint && <span className="text-[10px] text-gray-500 truncate">{cfg.hint}</span>}
                              </div>
                              <input
                                type="number"
                                inputMode="numeric"
                                min={cfg.min}
                                max={cfg.max}
                                step={cfg.step ?? 1}
                                value={current}
                                onChange={e => {
                                  const raw = e.target.value;
                                  if (!raw) {
                                    updateFeatureNumber(feature.id, null);
                                    return;
                                  }
                                  const next = Number(raw);
                                  if (!Number.isFinite(next)) return;
                                  const clamped = Math.max(cfg.min, Math.min(cfg.max, Math.floor(next)));
                                  updateFeatureNumber(feature.id, clamped);
                                }}
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-pink-500/50 transition-colors"
                                placeholder={`${cfg.min}-${cfg.max}`}
                              />
                            </label>
                            <div className="col-span-1 text-right">
                              <div className="text-[10px] text-gray-500">自动计算费用</div>
                              <div className="text-xs font-bold text-amber-300 tabular-nums">
                                {computed} {currencyLabel}
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                    {feature.id !== 'vip4_course_edit' &&
                      feature.id !== 'vip5_open_space_common_sense' &&
                      feature.id !== 'vip1_temp_sensitivity' &&
                      feature.id !== 'vip2_pleasure' &&
                      feature.id !== 'vip3_forced' &&
                      feature.id !== 'vip3_conditioned_reflex' &&
                      feature.id !== 'vip4_breast_remodeling' &&
                      feature.id !== 'vip4_genital_remodeling' &&
                      feature.id !== 'vip4_race_remodeling' &&
                      feature.id !== 'vip4_butt_remodeling' &&
                      feature.id !== 'vip4_urethra_remodeling' &&
                      feature.id !== 'vip4_exclusive_access' &&
                      feature.id !== 'vip4_lewd_mark' &&
                      feature.id !== 'vip4_closed_space_common_sense' &&
                      feature.id !== 'vip4_fetish_implant' &&
                      feature.id !== 'vip4_fetish_aversion' &&
                      feature.id !== 'vip4_masturbation_punishment' &&
                      feature.id !== 'vip5_ability_erotic' &&
                      feature.id !== 'vip5_moral_reform' &&
                      feature.id !== 'vip5_permanent' &&
                      feature.id !== 'vip5_permanent_false_memory' &&
                      feature.id !== 'vip5_permanent_personality' &&
                      feature.id !== 'vip5_personality_kill' && (
                        <textarea
                          placeholder={feature.notePlaceholder || '在此输入具体指令备注...'}
                          value={feature.userNote || ''}
                          onChange={e => updateFeatureNote(feature.id, e.target.value)}
                          className="w-full mt-3 bg-black/30 border border-white/10 rounded-lg p-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-pink-500/50 transition-colors resize-none h-16"
                        />
                      )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // --- Views ---

  if (isActive) {
    return (
      <ActiveSessionView
        timeLeft={timeLeft}
        sessionEndVirtualMinutes={sessionEndVirtualMinutes}
        sessionEndAtMs={sessionEndAtMs}
        onStop={handleStop}
      />
    );
  }

  if (isTransitioning) {
    const target = typeof document !== 'undefined' ? document.body : null;
    if (!target) return <TransitionView />;
    return createPortal(<TransitionView />, target);
  }

  // --- Main Dashboard View ---
  return (
    <div
      ref={containerRef}
      className={`
      h-full flex flex-col bg-hypno-dark relative overflow-hidden font-sans
      ${isClosing ? 'animate-fade-out-down' : 'animate-slide-up'}
    `}
    >
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[40%] bg-purple-900/20 rounded-full blur-[80px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[50%] bg-pink-900/20 rounded-full blur-[80px] pointer-events-none"></div>

      {/* --- Re-designed HUD (Command Center) --- */}
      <div className="relative z-30 flex flex-col bg-gray-900/80 backdrop-blur-xl border-b border-white/10 shadow-lg rounded-b-2xl transition-all duration-300">
        <div ref={commandCenterBaseRef}>
          {/* Top Bar Area */}
          <div
            className="px-4 pt-3 pb-1 flex justify-between items-center cursor-pointer select-none"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {/* Left: Back/Exit */}
            <button
              onClick={e => {
                e.stopPropagation();
                handleExitApp();
              }}
              className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors rounded-full active:bg-white/10"
            >
              <ArrowLeft size={22} />
            </button>

            {/* Center: Energy Bar & Title */}
            <div className="flex-1 mx-4 flex flex-col justify-center">
              <div className="flex justify-between items-end mb-1">
                <span className="text-[10px] text-pink-300 font-bold tracking-widest uppercase">MC Energy</span>
                <span className="text-[10px] text-gray-400">
                  {Math.floor(userData.mcEnergy)} / {userData.mcEnergyMax}
                </span>
              </div>
              <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${userData.mcEnergy < 20 ? 'bg-red-500' : 'bg-gradient-to-r from-purple-600 to-pink-500'}`}
                  style={{ width: `${(userData.mcEnergy / userData.mcEnergyMax) * 100}%` }}
                ></div>
              </div>
              <div className="mt-1 flex items-center justify-between text-[9px] text-gray-500">
                <span className="truncate">等级: {remainingSubscriptionText}</span>
              </div>
            </div>

            {/* Right: Money */}
            <div className="flex flex-col items-end min-w-[50px]">
              <span className="text-white font-bold text-lg leading-none">¥{userData.money.toLocaleString()}</span>
              <span className="text-[9px] text-gray-500 uppercase tracking-wider">Money</span>
            </div>
          </div>

          {/* Dropdown Handle Indicator */}
          <div
            className="w-full flex justify-center pb-1 cursor-pointer hover:bg-white/5 transition-colors"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp size={14} className="text-gray-500" />
            ) : (
              <ChevronDown size={14} className="text-gray-500 animate-pulse" />
            )}
          </div>
        </div>

        {/* Expanded Command Center (Stats + Store) */}
        <div
          className={`no-scrollbar transition-[max-height,opacity] duration-300 ease-in-out ${isExpanded ? 'opacity-100 overflow-y-auto pointer-events-auto' : 'opacity-0 overflow-hidden pointer-events-none'}`}
          style={{ maxHeight: isExpanded ? `${commandCenterMaxHeightPx}px` : '0px' }}
        >
          <div className="px-4 pb-4 pt-2">
            {/* Secondary Stats Grid */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-black/30 rounded-lg p-2 text-center border border-white/5">
                <div className="text-[10px] text-gray-400 mb-1">当前能量</div>
                <div className="text-sm font-semibold text-white">{Math.floor(userData.mcEnergy)}</div>
              </div>
              <div className="bg-black/30 rounded-lg p-2 text-center border border-white/5">
                <div className="text-[10px] text-gray-400 mb-1">可疑度</div>
                <div className={`text-sm font-semibold ${userData.suspicion > 50 ? 'text-red-400' : 'text-green-400'}`}>
                  {userData.suspicion}%
                </div>
              </div>
              <div className="bg-black/30 rounded-lg p-2 text-center border border-white/5">
                <div className="text-[10px] text-gray-400 mb-1">资金 (円)</div>
                <div className="text-sm font-semibold text-yellow-400">¥{userData.money.toLocaleString()}</div>
              </div>
            </div>

            {/* Quick Store Area */}
            <div className="space-y-2">
              <div className="mb-1 flex items-center justify-between gap-2">
                <div className="text-[10px] text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <ShoppingCart size={10} /> 快速补给
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">数量</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    step={1}
                    value={quickSupplyQtyInput}
                    onChange={e => setQuickSupplyQtyInput(e.target.value)}
                    onBlur={() => setQuickSupplyQtyInput(String(quickSupplyQty))}
                    aria-label="快速补给数量"
                    className="w-16 bg-black/30 border border-white/10 rounded-md px-2 py-1 text-[10px] text-gray-200 focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Buy Energy */}
                <button
                  onClick={() => void purchaseEnergy(quickSupplyQty)}
                  disabled={
                    Math.max(0, userData.mcEnergyMax - Math.floor(userData.mcEnergy)) <= 0 ||
                    userData.money <
                      Math.min(Math.max(0, userData.mcEnergyMax - Math.floor(userData.mcEnergy)), quickSupplyQty) * 100
                  }
                  className="flex flex-col items-start bg-blue-900/20 border border-blue-500/20 hover:bg-blue-900/30 p-2 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex justify-between w-full mb-1">
                    <Zap size={16} className="text-blue-400" />
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 rounded">
                      {Math.max(0, userData.mcEnergyMax - Math.floor(userData.mcEnergy)) <= 0
                        ? '已满'
                        : `¥${(
                            Math.min(
                              Math.max(0, userData.mcEnergyMax - Math.floor(userData.mcEnergy)),
                              quickSupplyQty,
                            ) * 100
                          ).toLocaleString()}`}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-gray-200">
                    {Math.max(0, userData.mcEnergyMax - Math.floor(userData.mcEnergy)) <= 0
                      ? '能量已满'
                      : `恢复 ${Math.min(Math.max(0, userData.mcEnergyMax - Math.floor(userData.mcEnergy)), quickSupplyQty)} 能量`}
                  </div>
                </button>

                {/* Buy Max Energy */}
                <button
                  onClick={() => void purchaseMaxEnergy(quickSupplyQty)}
                  disabled={userData.money < quickSupplyQty * 1000}
                  className="flex flex-col items-start bg-purple-900/20 border border-purple-500/20 hover:bg-purple-900/30 p-2 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex justify-between w-full mb-1">
                    <Battery size={16} className="text-purple-400" />
                    <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 rounded">
                      ¥{(quickSupplyQty * 1000).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-gray-200">上限 +{quickSupplyQty}</div>
                </button>
              </div>
            </div>

            {/* Upgrade Area */}
            <div className="mt-4 space-y-2">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Lock size={10} /> 等级解锁（永久）
              </div>

              <div className="p-3 rounded-xl border border-white/10 bg-black/20">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-300">当前等级</div>
                  <div className="text-xs font-bold text-gray-100">{remainingSubscriptionText}</div>
                </div>
                {subscriptionNotice && <div className="mt-2 text-[10px] text-pink-300">{subscriptionNotice}</div>}
              </div>

              <div className="grid grid-cols-1 gap-2">
                {(['VIP1', 'VIP2', 'VIP3', 'VIP4', 'VIP5', 'VIP6'] as const).map(tier => {
                  const price = SUBSCRIPTION_PRICES[tier];
                  const isCurrent = subscription?.tier === tier;
                  const hasHigherTier =
                    Boolean(subscription) &&
                    subscriptionTiers.indexOf(tier) < subscriptionTiers.indexOf(subscription!.tier);
                  const label = !subscription ? '解锁' : isCurrent ? '当前等级' : hasHigherTier ? '已拥有' : '升级';
                  return (
                    <button
                      key={tier}
                      onClick={() => void unlockTier(tier)}
                      disabled={debugEnabled || userData.money < price || isCurrent || hasHigherTier}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <div className="flex flex-col items-start">
                        <div className="text-xs font-bold text-gray-100">{`LV${tier.slice(3)}`}</div>
                        <div className="text-[10px] text-gray-400">{`${label} ¥${price.toLocaleString()}`}</div>
                      </div>
                      <div className="text-[10px] font-bold text-yellow-300">{label}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- Main Content (Scrollable) --- */}
      <div className="flex-1 overflow-y-auto p-4 no-scrollbar">{VIP_LEVELS.map(tier => renderTierSection(tier))}</div>

      {/* --- Footer Controls --- */}
      <div
        ref={footerControlsRef}
        className="bg-gray-900/95 backdrop-blur-xl border-t border-white/10 p-4 pb-8 rounded-t-2xl shadow-[0_-5px_30px_rgba(0,0,0,0.6)] animate-slide-up shrink-0"
      >
        {/* Start Button */}
        <button
          onClick={handleStart}
          disabled={!hasSessionFeaturesEnabled}
          className={`
                 w-full py-3 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all
                 ${
                   hasSessionFeaturesEnabled
                     ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-pink-500/25 active:scale-95'
                     : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                 }
               `}
        >
          <Zap size={18} fill="currentColor" />
          {missingEnergy > 0 ? '能量不足' : '启动催眠'}
        </button>

        {/* Cost Summary */}
        <div className="flex justify-between mt-2 px-1 text-[10px] text-gray-500">
          <span>
            预计消耗:{' '}
            <span className={missingEnergy > 0 ? 'text-red-500 font-bold' : 'text-gray-300'}>{totalEnergyCost}</span> MC
          </span>
          <span>当前可用: {Math.floor(userData.mcEnergy)} MC</span>
        </div>
      </div>

      {/* --- Low Energy Modal --- */}
      {showLowEnergyModal && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-gray-900 border border-red-500/30 w-full max-w-xs rounded-2xl p-6 shadow-[0_0_30px_rgba(239,68,68,0.2)] animate-slide-up">
            <div className="flex flex-col items-center text-center">
              <AlertTriangle size={48} className="text-red-500 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">资源不足</h3>
              <p className="text-sm text-gray-400 mb-6">
                启动需要 <span className="text-white font-bold">{totalEnergyCost}</span> MC，您当前缺少{' '}
                <span className="text-red-400 font-bold">{missingEnergy}</span> 能量。
              </p>

              <div className="w-full space-y-2">
                <button
                  onClick={() =>
                    void (async () => {
                      const topUpCost = missingEnergy * 100;
                      if (userData.money < topUpCost) return;

                      const nextMoney = userData.money - topUpCost;
                      const nextEnergy = Math.min(userData.mcEnergyMax, userData.mcEnergy + missingEnergy);

                      try {
                        const persisted = await DataService.updateResources({
                          money: nextMoney,
                          mcEnergy: nextEnergy,
                        });
                        onUpdateUser(persisted);
                      } catch (err) {
                        console.warn('[HypnoOS] 补齐资源持久化失败', err);
                        onUpdateUser({
                          ...userData,
                          money: nextMoney,
                          mcEnergy: nextEnergy,
                        });
                      }

                      void MvuBridge.appendThisTurnAppOperationLog(
                        `补齐资源（-¥${topUpCost.toLocaleString()}, +${missingEnergy} MC）`,
                      );
                      setShowLowEnergyModal(false);
                    })()
                  }
                  disabled={userData.money < missingEnergy * 100}
                  className="w-full py-3 bg-white text-black font-bold rounded-xl active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  花费 ¥{missingEnergy * 100} 补齐
                </button>
                <button
                  onClick={() => setShowLowEnergyModal(false)}
                  className="w-full py-3 text-gray-400 text-sm hover:text-white"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
