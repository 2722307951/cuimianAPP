import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Package, RefreshCw } from 'lucide-react';
import { MvuBridge } from '../services/mvuBridge';

interface HypnosisBackpackProps {
  onBack: () => void;
}

interface BackpackItem {
  name: string;
  description: string;
}

const HypnosisBackpack: React.FC<HypnosisBackpackProps> = ({ onBack }) => {
  const [items, setItems] = useState<BackpackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async (showSpinner: boolean) => {
    if (showSpinner) setRefreshing(true);
    setError(null);
    try {
      const raw = await MvuBridge.getProtagonistItems();
      const list: BackpackItem[] = Object.entries(raw).map(([name, description]) => ({
        name,
        description: typeof description === 'string' ? description : String(description ?? ''),
      }));
      // 按名称排序
      list.sort((a, b) => a.name.localeCompare(b.name, 'zh'));
      setItems(list);
    } catch (err) {
      console.warn('[HypnoOS] 读取背包失败', err);
      setError('读取背包数据失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadItems(false);
  }, [loadItems]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-950 via-purple-950 to-black text-white animate-fade-in">
      {/* 顶部导航栏 */}
      <div className="shrink-0 px-4 pt-4 pb-3 border-b border-white/10 bg-gray-900/70 backdrop-blur-xl flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="返回主界面"
        >
          <ArrowLeft size={22} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold tracking-wide">背包</div>
          <div className="text-[11px] text-gray-400">持有物品一览</div>
        </div>
        <button
          onClick={() => void loadItems(true)}
          disabled={refreshing}
          className="p-2 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
          aria-label="刷新背包"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
        </button>
        <span className="text-[11px] text-gray-500">{items.length} 件</span>
      </div>

      {/* 主体内容 */}
      <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-gray-500 text-xs">加载中…</div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <p className="text-red-400 text-xs">{error}</p>
            <button
              onClick={() => void loadItems(true)}
              className="px-4 py-1.5 rounded-lg border border-white/10 text-xs text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              重试
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3 text-gray-500">
            <Package size={40} className="opacity-30" />
            <p className="text-xs">背包里空空如也</p>
            <p className="text-[10px] opacity-60">在催眠商城中购买道具后会出现在这里</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {items.map(item => (
              <div
                key={item.name}
                className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-sm p-4 flex flex-col"
              >
                {/* 物品图标 */}
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20 flex items-center justify-center mb-3">
                  <Package size={20} className="text-cyan-400" />
                </div>
                {/* 物品名称 */}
                <div className="text-xs font-bold text-white mb-1">{item.name}</div>
                {/* 物品描述 */}
                <div className="text-[10px] text-gray-400 leading-relaxed flex-1">
                  {item.description || '暂无描述'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 底部状态栏 */}
      <div className="shrink-0 px-6 py-3 border-t border-white/10 bg-gray-900/70 backdrop-blur-xl flex items-center justify-between text-[10px] text-gray-500">
        <span>MVU 变量：主角.持有物品</span>
        <span>共 {items.length} 件</span>
      </div>
    </div>
  );
};

export default HypnosisBackpack;
