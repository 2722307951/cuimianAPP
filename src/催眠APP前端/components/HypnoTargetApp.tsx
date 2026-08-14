import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, UserPlus } from 'lucide-react';
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

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-950 via-purple-950 to-black text-white">
      <div className="shrink-0 px-4 pt-4 pb-3 border-b border-white/10 bg-gray-900/70 backdrop-blur-xl flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="返回主界面"
        >
          <ArrowLeft size={22} />
        </button>
        <div className="min-w-0">
          <div className="text-sm font-bold tracking-wide">催眠对象</div>
          <div className="text-[11px] text-gray-400">写入到酒馆输入框，不自动发送</div>
        </div>
      </div>

      <div className="flex-1 p-4 flex items-center">
        <div className="w-full rounded-3xl border border-white/10 bg-black/30 backdrop-blur-xl p-5 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-fuchsia-600 to-pink-600 flex items-center justify-center shadow-lg mb-4">
            <UserPlus size={24} className="text-white" />
          </div>

          <label className="block text-sm font-medium text-white mb-2" htmlFor="hypno-target-name">
            角色名称
          </label>
          <input
            id="hypno-target-name"
            type="text"
            value={roleName}
            onChange={e => setRoleName(e.target.value)}
            placeholder="请输入角色名称"
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-pink-500/60 transition-colors"
          />

          <label className="block text-sm font-medium text-white mt-4 mb-2" htmlFor="hypno-target-work-name">
            作品名字
          </label>
          <input
            id="hypno-target-work-name"
            type="text"
            value={workName}
            onChange={e => setWorkName(e.target.value)}
            placeholder="请输入角色所属作品名"
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-pink-500/60 transition-colors"
          />

          <label className="block text-sm font-medium text-white mt-4 mb-2" htmlFor="hypno-target-extra-info">
            补充信息
          </label>
          <textarea
            id="hypno-target-extra-info"
            value={extraInfo}
            onChange={e => setExtraInfo(e.target.value)}
            placeholder="可填写补充设定、当前剧情线索或希望强调的方向"
            className="w-full h-28 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-pink-500/60 transition-colors resize-none"
          />

          <label className="block text-sm font-medium text-white mt-4 mb-2" htmlFor="hypno-target-extra-rules">
            补充规则
          </label>
          <textarea
            id="hypno-target-extra-rules"
            value={extraRules}
            onChange={e => setExtraRules(e.target.value)}
            placeholder="可填写这次额外的生成约束，例如强调外貌、对白节奏或数值阶段表现"
            className="w-full h-28 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-pink-500/60 transition-colors resize-none"
          />

          <p className="mt-3 text-xs text-amber-300">请务必书写当前剧情中已有角色</p>

          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-medium text-white">已有角色</div>
              <div className="text-xs text-gray-400">
                等级 {hypnoAppLevel} / {existingRoleNames.length}
                {' / '}
                {hypnoTargetLimit}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
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
            <p className={`mt-3 text-xs ${isAtHypnoTargetLimit ? 'text-rose-300' : 'text-gray-400'}`}>
              {isAtHypnoTargetLimit
                ? `当前催眠APP等级仅可容纳 ${hypnoTargetLimit} 名催眠对象，已达到上限。`
                : `当前催眠APP等级最多可容纳 ${hypnoTargetLimit} 名催眠对象。`}
            </p>
          </div>

          <button
            onClick={() => void handleWriteToInput()}
            disabled={!normalizedRoleName || !normalizedWorkName || isWriting || isAtHypnoTargetLimit}
            className={[
              'mt-5 w-full rounded-2xl py-3 text-sm font-bold transition-all',
              !normalizedRoleName || !normalizedWorkName || isWriting || isAtHypnoTargetLimit
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-pink-500/25 active:scale-[0.99]',
            ].join(' ')}
          >
            {isWriting ? '写入中...' : '确认加入催眠对象'}
          </button>
        </div>
      </div>
    </div>
  );
};
