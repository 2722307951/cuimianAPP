import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Clock,
  Cpu,
  Eye,
  EyeOff,
  KeyRound,
  Link2,
  Loader2,
  RefreshCw,
  Save,
  Send,
  Settings,
  XCircle,
} from 'lucide-react';
import {
  SecondaryApiSettings as SecondaryApiSettingsSchema,
  loadSecondaryApiSettings,
  saveSecondaryApiSettings,
  isSecondaryApiConfigured,
  generateChat,
  listModels,
  type SecondaryApiSettings,
} from '../services/secondaryApi';

const Field: React.FC<{ label: string; icon: React.ReactNode; children: React.ReactNode }> = ({
  label,
  icon,
  children,
}) => (
  <label className="block">
    <div className="flex items-center gap-1.5 mb-1.5 text-[11px] font-semibold text-white/60">
      {icon}
      {label}
    </div>
    {children}
  </label>
);

const inputClass =
  'w-full px-3 py-2.5 rounded-xl border border-white/10 bg-black/20 text-sm text-white/90 placeholder:text-white/25 focus:outline-none focus:border-cyan-400/40 transition-colors';

export const SettingsApp: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [settings, setSettings] = useState<SecondaryApiSettings>(() => loadSecondaryApiSettings());
  const [showKey, setShowKey] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [models, setModels] = useState<string[] | null>(null);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [modelsOpen, setModelsOpen] = useState(false);
  const modelsDropdownRef = useRef<HTMLDivElement | null>(null);
  const saveTimerRef = useRef<number | null>(null);

  // 自动保存（防抖）
  useEffect(() => {
    if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      saveSecondaryApiSettings(settings);
      setSavedAt(new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }));
    }, 300);
    return () => {
      if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
    };
  }, [settings]);

  // 点击外部关闭模型下拉
  useEffect(() => {
    if (!modelsOpen) return;
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (modelsDropdownRef.current && !modelsDropdownRef.current.contains(target)) {
        setModelsOpen(false);
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [modelsOpen]);

  const patch = (p: Partial<SecondaryApiSettings>) => setSettings(prev => ({ ...prev, ...p }));

  const configured = isSecondaryApiConfigured(settings);

  const handleSave = () => {
    saveSecondaryApiSettings(settings);
    setSavedAt(new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }));
    toastr.success('保存成功');
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await generateChat([{ role: 'user', content: '请只回复两个字：正常' }], { settings });
    setTesting(false);
    if (result.ok) {
      setTestResult({ ok: true, message: `连接成功：${result.text.slice(0, 60)}` });
    } else {
      setTestResult({ ok: false, message: result.error });
    }
  };

  const handleFetchModels = async () => {
    setLoadingModels(true);
    setModelsError(null);
    setModels(null);
    const result = await listModels({ settings });
    setLoadingModels(false);
    if (result.ok) {
      if (result.models.length === 0) {
        setModelsError('端点未返回任何模型');
      } else {
        setModels(result.models);
      }
    } else {
      setModelsError(result.error);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-950 via-slate-950 to-black text-white overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 flex items-center gap-3 border-b border-white/10 bg-black/20 backdrop-blur-md">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft size={18} className="text-white/80" />
        </button>
        <div className="flex items-center gap-2">
          <Settings size={16} className="text-cyan-300" />
          <h1 className="text-sm font-bold tracking-wide">设置</h1>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-[10px] text-white/40">
          {savedAt && (
            <>
              <CheckCircle2 size={12} className="text-emerald-400" />
              <span>已保存 {savedAt}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
        {/* API 模式开关 */}
        <div className="p-4 rounded-2xl border border-white/10 bg-white/5">
          <div className="text-xs font-bold text-white/80 mb-3">API 模式</div>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { value: 'single', label: '单 API', desc: '论坛/帖子走酒馆主模型' },
                { value: 'multi', label: '多 API', desc: '额外更新走独立副端点' },
              ] as const
            ).map(opt => (
              <button
                key={opt.value}
                onClick={() => patch({ mode: opt.value })}
                className={[
                  'p-3 rounded-xl border text-left transition-colors',
                  settings.mode === opt.value
                    ? 'border-cyan-400/40 bg-cyan-500/10'
                    : 'border-white/10 bg-black/20 hover:bg-white/5',
                ].join(' ')}
              >
                <div className="text-sm font-bold text-white/90">{opt.label}</div>
                <div className="mt-0.5 text-[10px] text-white/45 leading-snug">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 副端点配置 */}
        <div className="p-4 rounded-2xl border border-white/10 bg-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-white/80">副 API 配置</div>
            {settings.mode === 'multi' && (
              <span
                className={[
                  'text-[10px] px-2 py-0.5 rounded-full border',
                  configured
                    ? 'bg-emerald-500/10 border-emerald-400/20 text-emerald-300'
                    : 'bg-amber-500/10 border-amber-400/20 text-amber-300',
                ].join(' ')}
              >
                {configured ? '已就绪' : '未完成'}
              </span>
            )}
          </div>

          <div className={settings.mode === 'multi' ? '' : 'opacity-40 pointer-events-none'}>
            <div className="space-y-4">
              <Field label="端点地址（OpenAI 兼容）" icon={<Link2 size={12} className="text-cyan-300" />}>
                <input
                  className={inputClass}
                  value={settings.url}
                  onChange={e => patch({ url: e.target.value })}
                  placeholder="https://api.openai.com/v1 或完整 /chat/completions 地址"
                />
              </Field>

              <Field label="API Key" icon={<KeyRound size={12} className="text-cyan-300" />}>
                <div className="relative">
                  <input
                    className={`${inputClass} pr-10`}
                    type={showKey ? 'text' : 'password'}
                    value={settings.apiKey}
                    onChange={e => patch({ apiKey: e.target.value })}
                    placeholder="sk-..."
                  />
                  <button
                    onClick={() => setShowKey(v => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-white/40 hover:text-white/80 transition-colors"
                    aria-label={showKey ? '隐藏' : '显示'}
                  >
                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </Field>

              <Field label="模型名" icon={<Cpu size={12} className="text-cyan-300" />}>
                <div className="flex gap-2">
                  <input
                    className={`${inputClass} flex-1`}
                    value={settings.model}
                    onChange={e => patch({ model: e.target.value })}
                    placeholder="gpt-4o-mini / deepseek-chat / ..."
                  />
                  <button
                    onClick={handleFetchModels}
                    disabled={!settings.url.trim() || loadingModels}
                    className="shrink-0 px-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-white/80 transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {loadingModels ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                    拉取
                  </button>
                </div>
                {models && models.length > 0 && (
                  <div ref={modelsDropdownRef} className="relative mt-2">
                    <button
                      type="button"
                      onClick={() => setModelsOpen(v => !v)}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-white/10 bg-slate-900 text-sm text-white/90 hover:bg-slate-800 transition-colors"
                    >
                      <span className="truncate">{settings.model.trim() || '选择模型'}</span>
                      <ChevronDown
                        size={14}
                        className={['shrink-0 text-white/40 transition-transform', modelsOpen ? 'rotate-180' : ''].join(
                          ' ',
                        )}
                      />
                    </button>
                    {modelsOpen && (
                      <div className="absolute z-20 left-0 right-0 top-full mt-1 max-h-56 overflow-y-auto no-scrollbar rounded-xl border border-white/10 bg-slate-900 shadow-[0_10px_40px_rgba(0,0,0,0.7)]">
                        {models.map(m => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => {
                              patch({ model: m });
                              setModelsOpen(false);
                            }}
                            className={[
                              'w-full text-left px-3 py-2 text-sm truncate transition-colors',
                              m === settings.model ? 'bg-cyan-500/15 text-cyan-200' : 'text-white/80 hover:bg-white/5',
                            ].join(' ')}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {modelsError && (
                  <div className="mt-1.5 text-[10px] text-red-300/80 leading-snug break-all">{modelsError}</div>
                )}
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="超时（毫秒）" icon={<Clock size={12} className="text-cyan-300" />}>
                  <input
                    className={inputClass}
                    type="number"
                    min={1000}
                    step={1000}
                    value={settings.timeoutMs}
                    onChange={e => {
                      const n = Number(e.target.value);
                      if (Number.isFinite(n) && n > 0) patch({ timeoutMs: n });
                    }}
                  />
                </Field>
                <Field label="最大重试次数" icon={<RefreshCw size={12} className="text-cyan-300" />}>
                  <input
                    className={inputClass}
                    type="number"
                    min={0}
                    max={10}
                    step={1}
                    value={settings.maxRetries}
                    onChange={e => {
                      const n = Number(e.target.value);
                      if (Number.isFinite(n)) patch({ maxRetries: Math.max(0, Math.min(10, Math.floor(n))) });
                    }}
                  />
                </Field>
              </div>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-cyan-400/40 bg-cyan-500/10 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/20 transition-colors"
          >
            <Save size={15} /> 保存
          </button>
          <button
            onClick={handleTest}
            disabled={!configured || testing}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-white/80 hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {testing ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            {testing ? '测试中…' : '测试连接'}
          </button>
        </div>

        {testResult && (
          <div
            className={[
              'flex items-start gap-2 p-3 rounded-xl border text-[11px] leading-snug',
              testResult.ok
                ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200'
                : 'border-red-400/20 bg-red-500/10 text-red-200',
            ].join(' ')}
          >
            {testResult.ok ? (
              <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
            ) : (
              <XCircle size={14} className="mt-0.5 shrink-0" />
            )}
            <div className="break-all">{testResult.message}</div>
          </div>
        )}

        <div className="text-[10px] text-white/35 leading-relaxed px-1">
          说明：副 API 用于论坛更新、副 AI 生成帖子、每日挑战等大量文本任务，与酒馆主模型解耦。 端点需支持 CORS 与
          OpenAI 兼容的 <span className="text-white/50">/chat/completions</span> 格式；API Key 保存在浏览器 localStorage
          中，请勿用于公开分发的环境。
        </div>
      </div>
    </div>
  );
};
