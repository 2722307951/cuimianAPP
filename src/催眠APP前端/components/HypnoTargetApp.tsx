import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Info, FileText, Users, Eraser, Send } from 'lucide-react';
import { buildHypnoTargetPrompt } from '../prompts/hypnoTarget';
import { MvuBridge, waitForMvuReady } from '../services/mvuBridge';

interface HypnoTargetAppProps {
  onBack: () => void;
}

function slashQuote(text: string): string {
  const escaped = text.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `"${escaped}"`;
}

const HYPNO_TARGET_LIMITS: Record<number, number> = {
  1: 1,
  2: 3,
  3: 5,
  4: 10,
  5: 20,
  6: 50,
};

function parseHypnoAppLevel(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(1, Math.round(value));
  }
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) return Math.max(1, parsed);
  }
  return 1;
}

function getHypnoTargetLimit(level: number): number {
  if (level >= 6) return HYPNO_TARGET_LIMITS[6];
  return HYPNO_TARGET_LIMITS[level] ?? HYPNO_TARGET_LIMITS[1];
}

// 表单字段长度上限（简历式计数用）
const LIMITS = {
  roleName: 30,
  workName: 40,
  extraInfo: 500,
  extraRules: 500,
} as const;

const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; hint?: string }> = ({ icon, title, hint }) => (
  <div className="flex items-center gap-2 mb-1.5 px-1">
    <span className="text-pink-400/90">{icon}</span>
    <h2 className="text-sm font-bold tracking-wide text-white">{title}</h2>
    {hint && <span className="ml-auto text-[10px] font-medium text-white/35">{hint}</span>}
  </div>
);

const FieldLabel: React.FC<{
  htmlFor: string;
  label: string;
  required?: boolean;
  count?: number;
  max?: number;
}> = ({ htmlFor, label, required, count, max }) => (
  <div className="flex items-baseline justify-between mb-1.5">
    <label className="block text-[13px] font-medium text-white" htmlFor={htmlFor}>
      {label}
      {required && <span className="ml-0.5 text-pink-400">*</span>}
    </label>
    {typeof count === 'number' && max && (
      <span className={`text-[10px] tabular-nums ${count >= max ? 'text-amber-300' : 'text-white/30'}`}>
        {count}/{max}
      </span>
    )}
  </div>
);

const fieldClass =
  'w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-pink-500/60 focus:ring-1 focus:ring-pink-500/20 transition-all';

export const HypnoTargetApp: React.FC<HypnoTargetAppProps> = ({ onBack }) => {
  const [roleName, setRoleName] = useState('');
  const [workName, setWorkName] = useState('');
  const [extraInfo, setExtraInfo] = useState('');
  const [extraRules, setExtraRules] = useState('');
  const [isWriting, setIsWriting] = useState(false);
  const [existingRoleNames, setExistingRoleNames] = useState<string[]>([]);
  const [hypnoAppLevel, setHypnoAppLevel] = useState(1);
  const normalizedRoleName = roleName.trim();
  const normalizedWorkName = workName.trim();
  const hypnoTargetLimit = useMemo(() => getHypnoTargetLimit(hypnoAppLevel), [hypnoAppLevel]);
  const isAtHypnoTargetLimit = existingRoleNames.length >= hypnoTargetLimit;
  const previewPrompt = useMemo(
    () =>
      buildHypnoTargetPrompt({
        roleName: normalizedRoleName,
        workName: normalizedWorkName,
        extraInfo,
        extraRules,
      }),
    [extraInfo, extraRules, normalizedRoleName, normalizedWorkName],
  );

  // 简历式完成度：必填 + 选填共 4 项
  const fields = [
    { filled: normalizedRoleName.length > 0 },
    { filled: normalizedWorkName.length > 0 },
    { filled: extraInfo.trim().length > 0 },
    { filled: extraRules.trim().length > 0 },
  ];
  const filledCount = fields.filter(f => f.filled).length;
  const completionPercent = Math.round((filledCount / fields.length) * 100);
  const isDirty = filledCount > 0;

  useEffect(() => {
    let stopped = false;
    let listeners: Array<{ stop: () => void }> = [];

    const extractRoleNames = (value: unknown): string[] => {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
      return Object.keys(value as Record<string, unknown>).filter(Boolean);
    };

    const refreshExistingRoles = async () => {
      try {
        const ready = await waitForMvuReady({ timeoutMs: 3000, pollMs: 100 });
        if (!ready || stopped) return;

        const system = await MvuBridge.getSystem();
        if (stopped) return;
        setHypnoAppLevel(parseHypnoAppLevel(system?._催眠APP等级));

        const preferred = extractRoleNames(system?.角色);
        if (preferred.length > 0) {
          setExistingRoleNames(preferred);
          return;
        }

        const fallback = await MvuBridge.getRoles();
        if (stopped) return;
        setExistingRoleNames(extractRoleNames(fallback));
      } catch (error) {
        console.warn('[HypnoOS] 读取已有角色列表失败', error);
        if (!stopped) setExistingRoleNames([]);
      }
    };

    void refreshExistingRoles();

    void (async () => {
      try {
        const ready = await waitForMvuReady({ timeoutMs: 3000, pollMs: 100 });
        if (!ready || stopped) return;
        listeners = [
          eventOn(Mvu.events.VARIABLE_INITIALIZED, () => {
            void refreshExistingRoles();
          }),
          eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, () => {
            void refreshExistingRoles();
          }),
        ];
      } catch {
        // ignore tavern-unavailable cases
      }
    })();

    return () => {
      stopped = true;
      listeners.forEach(listener => listener.stop());
    };
  }, []);

  const handleWriteToInput = async () => {
    if (!normalizedRoleName || !normalizedWorkName || isWriting || isAtHypnoTargetLimit) return;
    if (typeof triggerSlash !== 'function') {
      window.alert('当前环境不支持写入酒馆输入框');
      return;
    }

    setIsWriting(true);
    try {
      await triggerSlash(`/setinput ${slashQuote(previewPrompt)}`);
      toastr.success('已写入酒馆输入框');
    } catch (error) {
      console.warn('[HypnoOS] 写入酒馆输入框失败', error);
      window.alert('写入酒馆输入框失败');
    } finally {
      setIsWriting(false);
    }
  };

  const handleClear = () => {
    setRoleName('');
    setWorkName('');
    setExtraInfo('');
    setExtraRules('');
  };

  const submitDisabled = !normalizedRoleName || !normalizedWorkName || isWriting || isAtHypnoTargetLimit;

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-950 via-purple-950 to-black text-white">
      {/* Header */}
      <div className="shrink-0 px-4 pt-3 pb-2.5 border-b border-white/10 bg-gray-900/70 backdrop-blur-xl flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="返回主界面"
        >
          <ArrowLeft size={22} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold tracking-wide">催眠对象</div>
          <div className="text-[11px] text-gray-400">填写角色档案 · 写入酒馆输入框</div>
        </div>
        <span className={`text-[11px] font-semibold tabular-nums ${completionPercent === 100 ? 'text-emerald-300' : 'text-white/40'}`}>
          {completionPercent}%
        </span>
      </div>

      {/* 完成度进度条 */}
      <div className="shrink-0 h-0.5 bg-white/5">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
          style={{ width: `${completionPercent}%` }}
        />
      </div>

      {/* 可滚动内容 */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="p-3 flex flex-col gap-3">
          {/* 基本信息 */}
          <section>
            <SectionHeader icon={<Info size={15} />} title="基本信息" hint="必填" />
            <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-3 space-y-3">
              <div>
                <FieldLabel htmlFor="hypno-target-name" label="角色名称" required count={roleName.length} max={LIMITS.roleName} />
                <input
                  id="hypno-target-name"
                  type="text"
                  value={roleName}
                  maxLength={LIMITS.roleName}
                  onChange={e => setRoleName(e.target.value)}
                  placeholder="请输入角色名称"
                  className={fieldClass}
                />
              </div>
              <div>
                <FieldLabel htmlFor="hypno-target-work-name" label="作品名字" required count={workName.length} max={LIMITS.workName} />
                <input
                  id="hypno-target-work-name"
                  type="text"
                  value={workName}
                  maxLength={LIMITS.workName}
                  onChange={e => setWorkName(e.target.value)}
                  placeholder="请输入角色所属作品名"
                  className={fieldClass}
                />
              </div>
              <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-amber-300/90">
                <span className="mt-px shrink-0">⚠</span>
                <span>请务必书写当前剧情中已有角色</span>
              </p>
            </div>
          </section>

          {/* 补充设定 */}
          <section>
            <SectionHeader icon={<FileText size={15} />} title="补充设定" hint="选填" />
            <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-3 space-y-3">
              <div>
                <FieldLabel htmlFor="hypno-target-extra-info" label="补充信息" count={extraInfo.length} max={LIMITS.extraInfo} />
                <textarea
                  id="hypno-target-extra-info"
                  value={extraInfo}
                  maxLength={LIMITS.extraInfo}
                  onChange={e => setExtraInfo(e.target.value)}
                  placeholder="补充设定、当前剧情线索或希望强调的方向"
                  className={`${fieldClass} h-14 resize-none leading-relaxed`}
                />
              </div>
              <div>
                <FieldLabel htmlFor="hypno-target-extra-rules" label="补充规则" count={extraRules.length} max={LIMITS.extraRules} />
                <textarea
                  id="hypno-target-extra-rules"
                  value={extraRules}
                  maxLength={LIMITS.extraRules}
                  onChange={e => setExtraRules(e.target.value)}
                  placeholder="本次额外生成约束，例如外貌、对白节奏或数值阶段表现"
                  className={`${fieldClass} h-14 resize-none leading-relaxed`}
                />
              </div>
            </div>
          </section>

          {/* 已有角色 */}
          <section>
            <SectionHeader
              icon={<Users size={15} />}
              title="已有角色"
              hint={`${existingRoleNames.length} / ${hypnoTargetLimit}`}
            />
            <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-3">
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-white/50 whitespace-nowrap">容量</span>
                <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isAtHypnoTargetLimit ? 'bg-rose-400' : 'bg-gradient-to-r from-purple-500 to-pink-500'
                    }`}
                    style={{ width: `${Math.min(100, (existingRoleNames.length / hypnoTargetLimit) * 100)}%` }}
                  />
                </div>
                <span className="text-[11px] tabular-nums text-white/60">Lv.{hypnoAppLevel}</span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {existingRoleNames.length > 0 ? (
                  existingRoleNames.map(name => (
                    <span
                      key={name}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-200"
                    >
                      {name}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-500">当前未读取到角色名单</span>
                )}
              </div>

              <p className={`mt-3 text-[11px] leading-relaxed ${isAtHypnoTargetLimit ? 'text-rose-300' : 'text-white/40'}`}>
                {isAtHypnoTargetLimit
                  ? `当前催眠APP等级仅可容纳 ${hypnoTargetLimit} 名催眠对象，已达到上限。`
                  : `当前催眠APP等级最多可容纳 ${hypnoTargetLimit} 名催眠对象。`}
              </p>
            </div>
          </section>
        </div>
      </div>

      {/* 底部操作栏（吸底） */}
      <div className="shrink-0 px-3 py-2.5 border-t border-white/10 bg-black/40 backdrop-blur-xl flex gap-2">
        <button
          onClick={handleClear}
          disabled={!isDirty}
          className="shrink-0 w-12 flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="清空表单"
        >
          <Eraser size={18} />
        </button>
        <button
          onClick={() => void handleWriteToInput()}
          disabled={submitDisabled}
          className={[
            'flex-1 rounded-xl py-3 text-sm font-bold transition-all flex items-center justify-center gap-2',
            submitDisabled
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-pink-500/20 hover:shadow-pink-500/35 active:scale-[0.99]',
          ].join(' ')}
        >
          {isWriting ? (
            <>
              <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              写入中...
            </>
          ) : (
            <>
              <Send size={16} />
              确认加入催眠对象
            </>
          )}
        </button>
      </div>
    </div>
  );
};
