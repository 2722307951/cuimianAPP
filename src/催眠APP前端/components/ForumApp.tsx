import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, RefreshCw, Loader2, MessageSquare, MessageCircle, ThumbsUp } from 'lucide-react';
import { loadState, saveState, refreshForum, type ForumPost, type ForumStateV1 } from '../services/forum';

type ViewState = { mode: 'list' } | { mode: 'thread'; postId: number };

// 贴吧风格：确定性昵称 + 头像配色，让每层楼看起来像不同网友（刷新后保持稳定）。
const NICKNAMES = [
  '路过的吃瓜群众', '深夜冲浪选手', '热心市民小张', '不愿透露姓名的网友',
  '贴吧老哥', '围观路人甲', '半夜不睡觉', '本吧潜水员', '路过看看', '匿名网友',
];
const AVATAR_COLORS = [
  'bg-rose-500', 'bg-amber-500', 'bg-emerald-500', 'bg-sky-500',
  'bg-violet-500', 'bg-orange-500', 'bg-teal-500', 'bg-pink-500',
];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function nickFor(key: string): string {
  return NICKNAMES[hashStr(key) % NICKNAMES.length];
}
function avatarFor(key: string): string {
  return AVATAR_COLORS[hashStr(key) % AVATAR_COLORS.length];
}

const BAR_NAME = '同城吧';

const ForumApp: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [state, setState] = useState<ForumStateV1>(() => loadState());
  const [view, setView] = useState<ViewState>({ mode: 'list' });
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');

  const doRefresh = useCallback(async () => {
    if (syncing) return;
    setSyncing(true);
    setSyncStatus('');

    const result = await refreshForum();
    setSyncing(false);

    if (!result.ok) {
      setSyncStatus(`刷新失败：${result.error ?? '未知错误'}`);
      return;
    }

    const next: ForumStateV1 = { version: 1, posts: result.posts };
    saveState(next);
    setState(next);
    setSyncStatus(`已更新 ${result.posts.length} 条帖子`);
  }, [syncing]);

  // 首次挂载：无帖时自动刷一次。
  useEffect(() => {
    if (state.posts.length === 0) void doRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const thread = useMemo(() => {
    if (view.mode !== 'thread') return undefined;
    return state.posts.find(p => p.id === view.postId);
  }, [view, state]);

  const formatTime = (ms: number) => {
    const d = new Date(ms);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // --- 列表页（贴吧帖子列表卡片） ---
  const renderList = () => (
    <div className="flex-1 overflow-y-auto no-scrollbar">
      <div className="flex items-center gap-2 px-4 pt-2 pb-2">
        <span className="text-[10px] text-white/40 font-mono">匿名版 · 只读 · 每次刷新 5 条</span>
        <button
          onClick={doRefresh}
          disabled={syncing}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs font-semibold text-white/80 hover:bg-white/10 transition-colors disabled:opacity-40"
        >
          {syncing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          {syncing ? '刷新中…' : '刷新'}
        </button>
      </div>

      {syncStatus && <div className="px-4 pb-2 text-[10px] text-cyan-300/80">{syncStatus}</div>}

      {state.posts.length === 0 ? (
        <div className="px-4 py-8 text-xs text-white/50 text-center">
          {syncing ? '正在获取帖子…' : '暂无帖子，点击「刷新」获取。'}
        </div>
      ) : (
        <div className="px-3 flex flex-col gap-2.5 pb-6">
          {state.posts.map(p => {
            const replyCount = p.floors.length;
            return (
              <button
                key={p.id}
                onClick={() => setView({ mode: 'thread', postId: p.id })}
                className="w-full text-left p-3.5 rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/[0.10] transition-colors"
              >
                <div className="text-sm font-bold text-white/95 leading-snug line-clamp-2">{p.title}</div>
                {p.body && <div className="mt-1.5 text-xs text-white/45 leading-relaxed line-clamp-2">{p.body}</div>}
                <div className="mt-2.5 flex items-center gap-3 text-[10px] text-white/40">
                  <span className="flex items-center gap-1">
                    <span className="text-cyan-300/90">{nickFor(`op:${p.id}`)}</span>
                  </span>
                  <span className="flex items-center gap-0.5">
                    <MessageCircle size={11} className="text-white/30" />
                    {replyCount} 回复
                  </span>
                  <span className="ml-auto">{formatTime(p.createdAtMs)}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  // --- 楼层（通用，贴吧回帖样式） ---
  const renderFloor = (key: string, label: string, text: string, ts: number, isOp: boolean) => {
    const name = nickFor(key);
    const avatar = avatarFor(key);
    return (
      <div className="p-3.5 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-full ${avatar} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
            {name.slice(0, 1)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] font-semibold text-sky-300/90 truncate">{name}</span>
              {isOp && (
                <span className="shrink-0 text-[9px] font-bold text-white bg-blue-500/80 px-1 py-0.5 rounded">楼主</span>
              )}
            </div>
            <div className="text-[10px] text-white/35 mt-0.5">{label} · {formatTime(ts)}</div>
          </div>
        </div>
        <div className="mt-2 text-[13px] text-white/85 leading-relaxed whitespace-pre-wrap break-words pl-[42px]">{text}</div>
        <div className="mt-1.5 pl-[42px] flex items-center gap-4 text-[10px] text-white/35">
          <span className="flex items-center gap-1"><ThumbsUp size={11} /> 赞</span>
          <span className="flex items-center gap-1"><MessageCircle size={11} /> 回复</span>
        </div>
      </div>
    );
  };

  // --- 详情页（贴吧帖子详情） ---
  const renderThread = (post: ForumPost) => {
    const opName = nickFor(`op:${post.id}`);
    const opAvatar = avatarFor(`op:${post.id}`);
    return (
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="flex items-center gap-2 px-4 pt-2 pb-2">
          <button onClick={() => setView({ mode: 'list' })} className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
            <ArrowLeft size={16} className="text-white/70" />
          </button>
          <span className="text-xs font-semibold text-white/70">{BAR_NAME} · 帖子</span>
        </div>

        {/* 楼主（1楼） */}
        <div className="p-4 border-b border-white/10">
          <div className="text-base font-bold text-white/95 leading-snug">{post.title}</div>
          <div className="mt-3 flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-full ${opAvatar} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
              {opName.slice(0, 1)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] font-semibold text-sky-300/90 truncate">{opName}</span>
                <span className="shrink-0 text-[9px] font-bold text-white bg-blue-500/80 px-1 py-0.5 rounded">楼主</span>
              </div>
              <div className="text-[10px] text-white/35 mt-0.5">1楼 · {formatTime(post.createdAtMs)}</div>
            </div>
          </div>
          {post.body && (
            <div className="mt-3 text-[13px] text-white/85 leading-relaxed whitespace-pre-wrap break-words">{post.body}</div>
          )}
          <div className="mt-3 flex items-center gap-4 text-[10px] text-white/35">
            <span className="flex items-center gap-1"><ThumbsUp size={11} /> 赞</span>
            <span className="flex items-center gap-1"><MessageCircle size={11} /> 回复</span>
          </div>
        </div>

        {/* 全部回复 */}
        <div className="px-4 py-2 bg-white/[0.03] text-[10px] text-white/40 font-medium">
          全部回复（{post.floors.length}）
        </div>

        {post.floors.length === 0 ? (
          <div className="px-4 py-8 text-xs text-white/50 text-center">暂无回复</div>
        ) : (
          <div>
            {post.floors.map(f =>
              renderFloor(`f:${post.id}:${f.floorNo}`, `${f.floorNo + 1}楼`, f.content, f.createdAtMs, false),
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-950 via-purple-950/40 to-black text-white overflow-hidden animate-fade-in">
      {/* Header（贴吧吧名栏） */}
      <div className="px-4 pt-6 pb-3 flex items-center gap-3 border-b border-white/10 bg-black/20 backdrop-blur-md">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft size={18} className="text-white/80" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <MessageSquare size={14} className="text-white" />
          </div>
          <div className="leading-tight">
            <h1 className="text-sm font-bold tracking-wide">{BAR_NAME}</h1>
            <span className="text-[9px] text-white/35">匿名版 · 只读 · 关注 0</span>
          </div>
        </div>
      </div>

      {view.mode === 'thread' && thread ? renderThread(thread) : renderList()}
    </div>
  );
};

export default ForumApp;
