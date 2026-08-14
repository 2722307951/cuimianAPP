// Enum for application state (which app is open)
export enum AppMode {
  HOME = 'HOME',
  HYPNOSIS = 'HYPNOSIS',
  HYPNO_TARGET = 'HYPNO_TARGET',
  BODY_STATS = 'BODY_STATS',
  CALENDAR = 'CALENDAR',
  HELP = 'HELP',
  ACHIEVEMENTS = 'ACHIEVEMENTS', // Replaces Ghost/WIP
  SHOP = 'SHOP',
  BACKPACK = 'BACKPACK',
  SETTINGS = 'SETTINGS',
  FORUM = 'FORUM',
  WIP = 'WIP',
}

// User Resources Data Structure
export interface UserResources {
  mcEnergy: number;
  mcEnergyMax: number;
  money: number; // Yen
  suspicion: number; // 0-100
}

// Hypnosis Feature Definition
export interface HypnosisFeature {
  id: string;
  title: string;
  description: string; // Detail shown when expanded
  tier: 'TRIAL' | 'VIP1' | 'VIP2' | 'VIP3' | 'VIP4' | 'VIP5' | 'VIP6';
  costType: 'PER_MINUTE' | 'ONE_TIME';
  costValue: number;
  costCurrency?: 'MC_ENERGY';
  notePlaceholder?: string;
  userNote?: string; // User input
  userNumber?: number; // Numeric input for some features
  userRounds?: number;
  userMode?: '视觉' | '触觉' | '听觉';
  userTarget?: string;
  userSensitivityOp?: '增加' | '减少';
  userSensitivityPart?: '阴部' | '屁股' | '胸部' | '尿道';
  userPleasurePart?: '阴部' | '屁股' | '胸部' | '尿道';
  isEnabled: boolean; // Toggle state
  purchaseRequired?: boolean; // Must be permanently purchased to use
  purchasePriceEnergy?: number; // Price in MC energy for purchase
  isPurchased?: boolean; // Permanently purchased (or free to use)
}

// Achievement Data Structure
export interface Achievement {
  id: string;
  title: string;
  description: string;
  rewardMcEnergy: number;
  isClaimed: boolean;
  // Function to check if unlocked based on current user stats
  // Returns true if the condition is met
  checkCondition: (user: UserResources) => boolean;
}

// Quest Data Structure
export type QuestStatus = 'AVAILABLE' | 'ACTIVE' | 'COMPLETED' | 'CLAIMED';

export interface Quest {
  id: string;
  title: string;
  target: string; // 任务目标（简短）
  description: string; // 任务描述（详细）
  progress: string; // 当前进度
  rewardMcEnergy: number;
  rewardText?: string; // 物品奖励文本（有则优先显示）
  status: QuestStatus;
}

// 每日挑战任务（副 API 动态生成）
export interface GeneratedChallenge {
  id: string;
  name: string; // 任务名称（同时作为 MVU key: 任务.<name>）
  target: string; // 任务目标（角色名）
  description: string; // 任务描述
  reward: string; // 任务奖励（「金钱 N」或「物品 X」格式）
  progress: string; // 当前进度（运行时从 MVU 回填，主 LLM 推进）
  status: QuestStatus; // 运行时从 MVU 派生
}

// Data payload for backend submission
export interface SessionStartPayload {
  startTime: number;
  durationMinutes: number;
  selectedFeatures: {
    id: string;
    note?: string;
    number?: number;
    rounds?: number;
    mode?: '视觉' | '触觉' | '听觉';
    target?: string;
    sensitivityOp?: '增加' | '减少';
    sensitivityPart?: '阴部' | '屁股' | '胸部' | '尿道';
    pleasurePart?: '阴部' | '屁股' | '胸部' | '尿道';
  }[];
  globalNote: string;
}

// VIP Tier Config
export interface VipTierConfig {
  tier: string;
  label: string;
}

export const VIP_LEVELS: VipTierConfig[] = [
  { tier: 'VIP1', label: 'LV1 表层感官与轻度诱导' },
  { tier: 'VIP2', label: 'LV2 生理强制与中度控制' },
  { tier: 'VIP3', label: 'LV3 深度精神控制与认知欺骗' },
  { tier: 'VIP4', label: 'LV4 绝对奴役与肉体法则扭曲' },
  { tier: 'VIP5', label: 'LV5 永久性肉体与生理改造' },
  { tier: 'VIP6', label: 'LV6 概念级打击与灵魂抹杀' },
];
