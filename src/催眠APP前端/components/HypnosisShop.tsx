import React, { useEffect, useState } from 'react';
import { ArrowLeft, Coins } from 'lucide-react';
import { DataService } from '../services/dataService';
import { MvuBridge } from '../services/mvuBridge';
import { UserResources } from '../types';

interface HypnosisShopProps {
  userData: UserResources;
  onUpdateUser: (data: UserResources) => void;
  onBack: () => void;
}

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number; // 金钱（円）
  icon: React.FC<{ size?: number | string; className?: string }>;
}

// 跳蛋形状的 SVG 图标（椭圆形主体 + 上方信号线）
const VibratorEggIcon: React.FC<{ size?: number | string; className?: string }> = ({
  size = 24,
  className,
}) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* 信号线 */}
    <path d="M12 2V6" />
    {/* 跳蛋主体（竖椭圆） */}
    <ellipse cx="12" cy="15" rx="6" ry="8" />
    {/* 表面装饰纹 */}
    <path d="M9 12 Q12 10 15 12" opacity="0.5" />
    <path d="M9 15 Q12 13 15 15" opacity="0.3" />
  </svg>
);

const ITEMS: ShopItem[] = [
  {
    id: 'noisy_vibrator',
    name: '有声跳蛋',
    description: '会发出巨大声音的跳蛋，疑似假冒伪劣产品。',
    price: 100,
    icon: VibratorEggIcon,
  },
];

const HypnosisShop: React.FC<HypnosisShopProps> = ({ userData, onUpdateUser, onBack }) => {
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [boughtIds, setBoughtIds] = useState<Set<string>>(new Set());
  const [loadingItems, setLoadingItems] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  // 加载时读取 MVU 已有持有物品，已持有的道具直接标记为"已购买"
  useEffect(() => {
    let stopped = false;
    (async () => {
      try {
        const items = await MvuBridge.getProtagonistItems();
        if (stopped) return;
        const existingIds = ITEMS.filter(i => items[i.name] !== undefined).map(i => i.id);
        setBoughtIds(new Set(existingIds));
      } catch (err) {
        console.warn('[HypnoOS] 读取持有物品失败', err);
      } finally {
        if (!stopped) setLoadingItems(false);
      }
    })();
    return () => {
      stopped = true;
    };
  }, []);

  const handleBuy = async (item: ShopItem) => {
    if (userData.money < item.price) {
      setMessage(`资金不足，购买「${item.name}」需要 ¥${item.price}（当前 ¥${userData.money.toLocaleString()}）`);
      return;
    }

    setBuyingId(item.id);
    setMessage(null);
    try {
      const nextMoney = userData.money - item.price;
      const persisted = await DataService.updateResources({ money: nextMoney });
      onUpdateUser(persisted);
      setBoughtIds(prev => new Set(prev).add(item.id));
      setMessage(`已购买「${item.name}」，-¥${item.price}`);

      // 写入 MVU 变量：主角.持有物品.{物品名称} = 物品描述
      try {
        await MvuBridge.setProtagonistItem(item.name, item.description);
      } catch (err) {
        console.warn('[HypnoOS] 写入持有物品失败', err);
      }
    } catch (err) {
      console.warn('[HypnoOS] 商城购买失败', err);
      setMessage('购买失败，请重试');
    } finally {
      setBuyingId(null);
    }
  };

  const totalBought = boughtIds.size;

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
          <div className="text-sm font-bold tracking-wide">催眠商城</div>
          <div className="text-[11px] text-gray-400">购买道具与强化功能</div>
        </div>
        <div className="flex items-center gap-1.5">
          <Coins size={16} className="text-amber-400" />
          <span className="text-[11px] text-amber-400 font-bold">¥{userData.money.toLocaleString()}</span>
        </div>
      </div>

      {/* 提示消息 */}
      {message && (
        <div
          className={`shrink-0 mx-4 mt-3 px-3 py-2 rounded-lg text-[11px] border ${
            message.startsWith('已购买')
              ? 'text-green-400 bg-green-500/10 border-green-500/20'
              : 'text-red-400 bg-red-500/10 border-red-500/20'
          }`}
        >
          {message}
        </div>
      )}

      {/* 商品列表 */}
      <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
        <div className="grid grid-cols-2 gap-3">
          {ITEMS.map(item => {
            const bought = boughtIds.has(item.id);
            const buying = buyingId === item.id;
            const canAfford = userData.money >= item.price;
            return (
              <div
                key={item.id}
                className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-sm p-4 flex flex-col"
              >
                {/* 道具图标 */}
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/20 flex items-center justify-center mb-3">
                  <item.icon size={20} className="text-pink-400" />
                </div>
                {/* 道具名称 */}
                <div className="text-xs font-bold text-white mb-1">{item.name}</div>
                {/* 道具描述 */}
                <div className="text-[10px] text-gray-400 leading-relaxed flex-1 mb-3">
                  {item.description}
                </div>
                {/* 价格与购买按钮 */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400">
                    <Coins size={12} />
                    ¥{item.price.toLocaleString()}
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleBuy(item)}
                    disabled={buying || bought}
                    className={[
                      'text-[10px] px-3 py-1.5 rounded-lg font-bold tracking-wide select-none border transition-all',
                      bought
                        ? 'border-green-500/30 text-green-400 bg-green-500/10 cursor-not-allowed'
                        : canAfford && !buying
                          ? 'border-pink-400/40 text-pink-100 bg-pink-500/20 hover:bg-pink-500/30 active:scale-95 cursor-pointer'
                          : 'border-white/10 text-gray-500 bg-white/5 cursor-not-allowed',
                    ].join(' ')}
                  >
                    {bought ? '已购买' : buying ? '购买中…' : '购买'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 底部状态栏 */}
      <div className="shrink-0 px-6 py-3 border-t border-white/10 bg-gray-900/70 backdrop-blur-xl flex items-center justify-between text-[10px] text-gray-500">
        <span>共 {ITEMS.length} 件商品</span>
        <span className="flex items-center gap-1">
          <Coins size={12} />
          已购 ({totalBought})
        </span>
      </div>
    </div>
  );
};

export default HypnosisShop;
