import { z } from 'zod';
import { QUEST_DB, type QuestDefinition } from '../data/questDb';
import { Achievement, GeneratedChallenge, HypnosisFeature, Quest, QuestStatus, UserResources } from '../types';
import {
  canUseFeature as canUseFeatureBySubscription,
  isSubscriptionActive,
  SUBSCRIPTION_TIERS,
  type AccessContext,
  type SubscriptionState,
  type SubscriptionTier,
} from './access';
import {
  generateChallenges,
  isSecondaryApiConfigured,
  loadSecondaryApiSettings,
  type ChallengeContext,
  type SecondaryApiSettings,
} from './secondaryApi';
import { MvuBridge } from './mvuBridge';

const CHAT_OPTION = { type: 'chat' } as const;

const DEFAULT_USER_DATA: UserResources = {
  mcEnergy: 25,
  mcEnergyMax: 25,
  money: 6000,
  suspicion: 0,
};

const FEATURES: HypnosisFeature[] = [
  // LV1 - 表层感官与轻度诱导
  {
    id: 'trial_basic',
    title: '初级一般催眠',
    description: '[浅层服从] 压制目标的表层意识，使其无意识地遵循简单的动作指示。',
    tier: 'VIP1',
    costType: 'PER_MINUTE',
    costValue: 10,
    costCurrency: 'MC_ENERGY',
    isEnabled: false,
    notePlaceholder: '输入简单动作指示...',
  },
  {
    id: 'vip1_desire_echo',
    title: '欲望回响',
    description: '探听目标脑海中最真实、最具色情倾向的潜意识念头。',
    tier: 'VIP1',
    costType: 'PER_MINUTE',
    costValue: 10,
    costCurrency: 'MC_ENERGY',
    isEnabled: false,
    notePlaceholder: '输入要探听的目标与引导...',
  },
  {
    id: 'vip1_forced_lewd_language',
    title: '强制淫语',
    description: '篡改目标的语言中枢，使其说出的任何话语都变成色情词汇。',
    tier: 'VIP1',
    costType: 'PER_MINUTE',
    costValue: 15,
    costCurrency: 'MC_ENERGY',
    isEnabled: false,
    notePlaceholder: '输入对话情境或引导...',
  },
  {
    id: 'vip1_senses',
    title: '味嗅觉修改',
    description: '将目标神经系统中的某一种特定味道或气味，强制替换为另一种味道。',
    tier: 'VIP1',
    costType: 'PER_MINUTE',
    costValue: 15,
    costCurrency: 'MC_ENERGY',
    isEnabled: false,
    notePlaceholder: '输入要替换的味道或气味...',
  },
  {
    id: 'vip1_temp_sensitivity',
    title: '临时敏感度修改',
    description: '在限定轮次内临时调整目标特定部位的敏感度数值，结束后恢复原状。',
    tier: 'VIP1',
    costType: 'PER_MINUTE',
    costValue: 20,
    costCurrency: 'MC_ENERGY',
    isEnabled: false,
    notePlaceholder: '输入本次敏感度调整的补充说明...',
  },
  {
    id: 'vip1_truth_serum',
    title: '吐真',
    description: '封锁目标说谎的能力，使其开口只能说出最真实的内心想法与事实。',
    tier: 'VIP1',
    costType: 'PER_MINUTE',
    costValue: 25,
    costCurrency: 'MC_ENERGY',
    isEnabled: false,
    notePlaceholder: '输入想追问的问题或诱导语...',
  },
  {
    id: 'vip1_memory_erase',
    title: '记忆消除',
    description: '物理全盘裁切目标对特定内容的短期记忆，使其在当前阶段无法正常回忆起备注中指定的记忆片段。',
    tier: 'VIP1',
    costType: 'PER_MINUTE',
    costValue: 50,
    costCurrency: 'MC_ENERGY',
    isEnabled: false,
    notePlaceholder: '输入要消除的记忆内容...',
  },
  {
    id: 'vip2_vision_steal',
    title: '视角窃取',
    description: '窃取目标视神经与听觉中枢，以第一人称视角经历对方当前所见所闻，全程无视物理距离。',
    tier: 'VIP1',
    costType: 'PER_MINUTE',
    costValue: 20,
    costCurrency: 'MC_ENERGY',
    isEnabled: false,
    notePlaceholder: '输入本次视角窃取的补充备注...',
  },
  {
    id: 'vip2_vision_share',
    title: '视角共享',
    description: '将{{User}}的视觉与听觉信号单向共享至目标感官中枢，让目标强制接收{{User}}正在经历的一切。',
    tier: 'VIP1',
    costType: 'PER_MINUTE',
    costValue: 20,
    costCurrency: 'MC_ENERGY',
    isEnabled: false,
    notePlaceholder: '输入本次视角共享的补充备注...',
  },
  {
    id: 'vip3_visual_filter',
    title: '幻视滤镜',
    description: '篡改目标的面部与身形识别信号，强制其视觉皮层将{{User}}的身体特征替换为指定的另一人，使其完全认不出{{User}}的真实身份。',
    tier: 'VIP1',
    costType: 'PER_MINUTE',
    costValue: 15,
    costCurrency: 'MC_ENERGY',
    isEnabled: false,
    notePlaceholder: '输入本次幻视滤镜的补充备注...',
  },

  // LV2 - 生理强制与中度控制
  {
    id: 'vip1_estrus',
    title: '发情',
    description: '强制刺激目标的生殖腺体，令其身体单方面陷入强烈的性冲动与多巴胺渴求中。',
    tier: 'VIP2',
    costType: 'PER_MINUTE',
    costValue: 40,
    costCurrency: 'MC_ENERGY',
    isEnabled: false,
    notePlaceholder: '输入本次发情状态的补充引导...',
  },
  {
    id: 'vip2_medium',
    title: '中级一般催眠',
    description: '掌控目标的深度顺从意识，迫使其执行具有一定抗拒感的指令。',
    tier: 'VIP2',
    costType: 'PER_MINUTE',
    costValue: 40,
    costCurrency: 'MC_ENERGY',
    isEnabled: false,
    notePlaceholder: '输入本次中级催眠的指令备注...',
  },
  {
    id: 'vip2_pleasure',
    title: '快感赋予',
    description: '向目标指定部位持续灌入无来源的愉悦刺激，强行抬高该部位的快感反馈。',
    tier: 'VIP2',
    costType: 'PER_MINUTE',
    costValue: 5,
    costCurrency: 'MC_ENERGY',
    isEnabled: false,
    notePlaceholder: '输入本次快感赋予的补充备注...',
  },
  {
    id: 'vip2_pain_to_pleasure',
    title: '痛觉转化',
    description: '篡改目标的痛觉反馈机制，将其感受到的任何疼痛刺激即时转化为快感。',
    tier: 'VIP2',
    costType: 'PER_MINUTE',
    costValue: 40,
    costCurrency: 'MC_ENERGY',
    isEnabled: false,
    notePlaceholder: '输入本次痛觉转化的补充备注...',
  },
  {
    id: 'vip2_emperors_new_clothes',
    title: '皇帝的新衣',
    description: '篡改目标的自我体感认知，使其在全裸状态下坚信自己穿着完整的衣物。',
    tier: 'VIP2',
    costType: 'PER_MINUTE',
    costValue: 30,
    costCurrency: 'MC_ENERGY',
    isEnabled: false,
    notePlaceholder: '输入本次皇帝的新衣补充备注...',
  },
  {
    id: 'vip2_new_emperor',
    title: '新衣的皇帝',
    description: '篡改目标的自我体感认知，使其在穿着完整衣物的状态下坚信自己赤身裸体、一丝不挂。',
    tier: 'VIP2',
    costType: 'PER_MINUTE',
    costValue: 30,
    costCurrency: 'MC_ENERGY',
    isEnabled: false,
    notePlaceholder: '输入本次新衣的皇帝补充备注...',
  },
  {
    id: 'vip3_shame_invert',
    title: '羞耻心反转',
    description: '将目标的羞耻心完全反转，使其在面对本该极度羞耻的场景时反而感到强烈的快感与兴奋，越是羞耻越是愉悦。',
    tier: 'VIP2',
    costType: 'PER_MINUTE',
    costValue: 35,
    costCurrency: 'MC_ENERGY',
    isEnabled: false,
    notePlaceholder: '输入本次羞耻心反转的补充备注...',
  },
  {
    id: 'vip3_temp_common_sense',
    title: '限时常识修改',
    description: '在限定轮次内强制改写目标认知中的某一项基本常识，使其对特定事物产生完全错乱的判断与反应。',
    tier: 'VIP2',
    costType: 'PER_MINUTE',
    costValue: 50,
    costCurrency: 'MC_ENERGY',
    isEnabled: false,
    notePlaceholder: '输入要修改的常识内容...',
  },
  {
    id: 'vip3_temp_false_memory',
    title: '临时虚假记忆',
    description: '在限定轮次内向目标的记忆中临时植入一段完全虚构的经历，目标在催眠期间会深信其真实发生过，但轮次结束后会清醒意识到这段记忆是伪造的。',
    tier: 'VIP2',
    costType: 'PER_MINUTE',
    costValue: 60,
    costCurrency: 'MC_ENERGY',
    isEnabled: false,
    notePlaceholder: '输入要植入的记忆内容...',
  },

  // LV3 - 深度精神控制与认知欺骗
  {
    id: 'vip2_ghost_hand',
    title: '幽灵手',
    description: '在目标的感知中生成一双或多双无法被他人看见的幽灵手。',
    tier: 'VIP3',
    costType: 'PER_MINUTE',
    costValue: 80,
    costCurrency: 'MC_ENERGY',
    isEnabled: false,
    notePlaceholder: '输入本次幽灵手的动作备注...',
  },
  {
    id: 'vip2_body_lock',
    title: '身体固定',
    description: '强制截断目标的运动神经信号，强行将其全身冻结在当前状态。',
    tier: 'VIP3',
    costType: 'PER_MINUTE',
    costValue: 100,
    costCurrency: 'MC_ENERGY',
    isEnabled: false,
    notePlaceholder: '输入本次身体固定的补充备注...',
  },
  {
    id: 'vip4_control_body_keep_conscious',
    title: '保留意识控制身体行动',
    description: '在目标意识完全清醒且保留完整感官的情况下，强行接管其身体的运动控制权，令其眼睁睁看着自己的身体违背自身意志做出任何动作。',
    tier: 'VIP3',
    costType: 'PER_MINUTE',
    costValue: 120,
    costCurrency: 'MC_ENERGY',
    isEnabled: false,
    notePlaceholder: '输入本次身体控制的补充备注...',
  },
  {
    id: 'vip4_control_body_no_conscious',
    title: '不保留意识控制身体行动',
    description: '在完全抹除目标意识与感官反馈的情况下，强行接管其身体的运动控制权，使身体如同提线木偶般被操纵而目标毫无知觉。',
    tier: 'VIP3',
    costType: 'PER_MINUTE',
    costValue: 100,
    costCurrency: 'MC_ENERGY',
    isEnabled: false,
    notePlaceholder: '输入本次身体控制的补充备注...',
  },
  {
    id: 'vip3_true_love',
    title: '真爱降临',
    description: '指定一个目标，使其在潜意识中美化{{User}}的一切言行，催眠过程中可能产生真挚的爱慕甚至爱上{{User}}，结束后记忆依然保留。',
    tier: 'VIP3',
    costType: 'PER_MINUTE',
    costValue: 150,
    costCurrency: 'MC_ENERGY',
    isEnabled: false,
    notePlaceholder: '输入本次真爱降临的补充备注...',
  },
  {
    id: 'vip3_avenger',
    title: '复仇者',
    description: '指定一个目标，使其在潜意识中扭曲某个对象的言行，将所有行为解读为恶意与敌意，催眠过程中可能催生真实的仇恨甚至报复冲动，结束后记忆依然保留。',
    tier: 'VIP3',
    costType: 'PER_MINUTE',
    costValue: 150,
    costCurrency: 'MC_ENERGY',
    isEnabled: false,
    notePlaceholder: '输入本次复仇者的补充备注...',
  },
  {
    id: 'vip3_forced',
    title: '强制高潮',
    description: '直接刺激目标的生殖神经中枢，使其强制进入极度愉悦的高潮状态，无视当前身体状态与意志抵抗。',
    tier: 'VIP3',
    costType: 'PER_MINUTE',
    costValue: 100,
    costCurrency: 'MC_ENERGY',
    isEnabled: false,
    notePlaceholder: '输入本次强制高潮的补充备注...',
  },
  {
    id: 'vip4_temp_personality',
    title: '临时人格植入',
    description: '在限定轮次内将一组预设的全新人格覆盖至目标意识表层，使其暂时成为另一个人，轮次结束后原人格完整恢复。',
    tier: 'VIP3',
    costType: 'PER_MINUTE',
    costValue: 150,
    costCurrency: 'MC_ENERGY',
    isEnabled: false,
    notePlaceholder: '输入人格设定...',
  },

  // LV4 - 绝对奴役与肉体法则扭曲
  {
    id: 'vip4_advanced',
    title: '高级一般催眠',
    description: '彻底接管目标的心智与灵魂，实施无视一切底线的绝对精神奴役，强制其执行任何极具破坏性的色情与屈辱指令。',
    tier: 'VIP4',
    costType: 'PER_MINUTE',
    costValue: 300,
    costCurrency: 'MC_ENERGY',
    isEnabled: false,
    notePlaceholder: '输入本次高级一般催眠的补充备注...',
  },
  {
    id: 'vip4_course_edit',
    title: '课程修改',
    description: '直接读取当前角色卡绑定的世界书，修改其中的条目名称与条目内容并永久写回。改的是真实世界书数据，非催眠演绎。',
    tier: 'VIP4',
    costType: 'ONE_TIME',
    costValue: 0,
    costCurrency: 'MC_ENERGY',
    isEnabled: false,
    notePlaceholder: '（本功能直接编辑世界书条目，无需备注）',
  },
  {
    id: 'vip3_orgasm_ban',
    title: '绝顶禁止',
    description: '在目标高潮中枢中施加永续封锁，使其在催眠期间无论受到何种刺激都无法达到高潮顶点，始终处于濒临绝顶却无法释放的极限寸止状态。',
    tier: 'VIP4',
    costType: 'PER_MINUTE',
    costValue: 250,
    costCurrency: 'MC_ENERGY',
    isEnabled: false,
    notePlaceholder: '输入本次绝顶禁止的补充备注...',
  },
  {
    id: 'vip4_excretion_control',
    title: '排泄控制',
    description: '强制接管目标的排泄神经信号，使其必须在{{User}}指定的条件下才能进行排泄，脱离指定条件则排泄系统彻底锁死。',
    tier: 'VIP4',
    costType: 'PER_MINUTE',
    costValue: 200,
    costCurrency: 'MC_ENERGY',
    isEnabled: false,
    notePlaceholder: '输入排泄条件...',
  },
  {
    id: 'vip4_cognitive_block',
    title: '认知妨碍',
    description: '在目标的感知系统中施加心理学隐身效果，使周围所有人完全无法意识到{{User}}的存在，达到彻底的不可见、不可听、不可感知的隐形状态。',
    tier: 'VIP4',
    costType: 'PER_MINUTE',
    costValue: 250,
    costCurrency: 'MC_ENERGY',
    isEnabled: false,
    notePlaceholder: '输入本次认知妨碍的补充备注...',
  },
  {
    id: 'vip4_sensation_graft',
    title: '快感嫁接',
    description: '将目标特定部位（如阴蒂、乳头、子宫）的触觉与痛感网络远程绑定至任意无生命物体，目标同步体验该物体所经历的一切。',
    tier: 'VIP4',
    costType: 'PER_MINUTE',
    costValue: 300,
    costCurrency: 'MC_ENERGY',
    isEnabled: false,
    notePlaceholder: '输入快感嫁接的补充备注...',
  },
  {
    id: 'vip4_closed_space_common_sense',
    title: '封闭空间常识修改',
    description: '在封闭空间内强制扭曲现实规则与基本常识，使当前房间内的所有人被迫接受并遵从被修改后的世界规则，效果永久存留。',
    tier: 'VIP4',
    costType: 'PER_MINUTE',
    costValue: 1000,
    costCurrency: 'MC_ENERGY',
    isEnabled: false,
    notePlaceholder: '输入要修改的规则/常识...',
  },
  {
    id: 'vip5_forced_insertion',
    title: '强制插入',
    description: '无视物理空间与衣物阻隔，将阴茎直接锚定传送至目标体内最深处，强制完成插入。',
    tier: 'VIP4',
    costType: 'PER_MINUTE',
    costValue: 400,
    costCurrency: 'MC_ENERGY',
    isEnabled: false,
    notePlaceholder: '输入强制插入的补充备注...',
  },
  {
    id: 'vip3_pseudo_time_stop',
    title: '伪时停',
    description: '强制冻结单个目标的运动神经信号与意识流转，使其在催眠期间完全停止行动与思考，期间累积的快感会在结束时一次性暴涌释放。',
    tier: 'VIP4',
    costType: 'PER_MINUTE',
    costValue: 350,
    costCurrency: 'MC_ENERGY',
    isEnabled: false,
    notePlaceholder: '输入本次伪时停的补充备注...',
  },
  {
    id: 'vip4_masturbation_punishment',
    title: '自慰惩罚',
    description: '施加永久诅咒，只要目标自慰就会触发{{User}}预先设定的惩罚效果，让目标在每次产生自慰冲动或行为时都遭受不可抗拒的惩戒。',
    tier: 'VIP4',
    costType: 'PER_MINUTE',
    costValue: 1500,
    costCurrency: 'MC_ENERGY',
    isEnabled: false,
    notePlaceholder: '输入惩罚的具体内容与触发条件...',
  },

  // LV5 - 永久性肉体与生理改造
  {
    id: 'vip3_conditioned_reflex',
    title: '条件反射植入',
    description: '在目标潜意识中植入特定的条件反射回路，使目标在受到指定触发刺激时不由自主地做出预设的反射行为，植入效果永久存留直至被主动解除或覆盖。',
    tier: 'VIP5',
    costType: 'PER_MINUTE',
    costValue: 2500,
    costCurrency: 'MC_ENERGY',
    isEnabled: false,
    notePlaceholder: '输入触发条件与对应反射行为...',
  },
  {
    id: 'vip4_fetish_implant',
    title: '性癖植入',
    description: '在目标潜意识中永久刻入一个特定的性癖好，使目标在被触发时对特定事物或行为产生无法自控的强烈性兴奋与渴望。',
    tier: 'VIP5',
    costType: 'PER_MINUTE',
    costValue: 3000,
    costCurrency: 'MC_ENERGY',
    isEnabled: false,
    notePlaceholder: '输入要植入的性癖...',
  },
  {
    id: 'vip4_fetish_aversion',
    title: '性厌恶植入',
    description: '在目标潜意识中永久刻入对特定事物或行为的深度性厌恶与恐惧，使目标在被触发时产生强烈的生理排斥与心理抗拒。',
    tier: 'VIP5',
    costType: 'PER_MINUTE',
    costValue: 3000,
    costCurrency: 'MC_ENERGY',
    isEnabled: false,
    notePlaceholder: '输入要植入的性厌恶内容...',
  },
  {
    id: 'vip4_breast_remodeling',
    title: '胸部改造',
    description: '无视生理学常识与自然规律，任意调整目标胸部的大小、形状，可自由开关泌乳功能并修改母乳味道。',
    tier: 'VIP5',
    costType: 'PER_MINUTE',
    costValue: 4000,
    costCurrency: 'MC_ENERGY',
    isEnabled: false,
    notePlaceholder: '输入胸部改造的具体要求...',
  },
  {
    id: 'vip4_genital_remodeling',
    title: '私处改造',
    description: '自由调整目标阴道与阴蒂的外形、深度、松紧程度及体液分泌，可将其重塑为专门迎合特定尺寸或形状的名器。',
    tier: 'VIP5',
    costType: 'PER_MINUTE',
    costValue: 4000,
    costCurrency: 'MC_ENERGY',
    isEnabled: false,
    notePlaceholder: '输入私处改造的具体要求...',
  },
  {
    id: 'vip4_butt_remodeling',
    title: '屁股改造',
    description: '自由调整目标臀部的大小、形状、挺翘度与柔软度，可将肠道内部改造为适合性交的第二通道。',
    tier: 'VIP5',
    costType: 'PER_MINUTE',
    costValue: 4000,
    costCurrency: 'MC_ENERGY',
    isEnabled: false,
    notePlaceholder: '输入屁股改造的具体要求...',
  },
  {
    id: 'vip4_urethra_remodeling',
    title: '尿道改造',
    description: '自由调整目标尿道的口径与内部管道结构，可接管排尿开关控制权，修改尿液颜色与味道。',
    tier: 'VIP5',
    costType: 'PER_MINUTE',
    costValue: 4000,
    costCurrency: 'MC_ENERGY',
    isEnabled: false,
    notePlaceholder: '输入尿道改造的具体要求...',
  },
  {
    id: 'vip4_lewd_mark',
    title: '淫纹刻写',
    description: '在目标最私密的部位刻下不可磨灭的魔法阵淫纹，作为情欲的绝对开关——隐形时封死性欲与高潮中枢，显形时恢复正常性冲动。',
    tier: 'VIP5',
    costType: 'PER_MINUTE',
    costValue: 5000,
    costCurrency: 'MC_ENERGY',
    isEnabled: false,
    notePlaceholder: '输入淫纹刻写的补充备注...',
  },
  {
    id: 'vip4_exclusive_access',
    title: '滴滴专车',
    description: '强行关闭目标生殖系统与情欲中枢的自动响应机制，剥夺目标在没有许可的情况下对任何人产生性反应的权利。',
    tier: 'VIP5',
    costType: 'PER_MINUTE',
    costValue: 6000,
    costCurrency: 'MC_ENERGY',
    isEnabled: false,
    notePlaceholder: '输入滴滴专车的补充备注...',
  },
  {
    id: 'vip5_ability_erotic',
    title: '能力色情开发',
    description: '挖掘并固化目标超能力在性行为与肉体感官中的专属色情衍生用法，将超能力与生殖系统及高潮反射进行深度缝合。',
    tier: 'VIP5',
    costType: 'PER_MINUTE',
    costValue: 5000,
    costCurrency: 'MC_ENERGY',
    isEnabled: false,
    notePlaceholder: '输入超能力色情开发的具体方向...',
  },

  // LV6 - 概念级打击与灵魂抹杀
  {
    id: 'vip5_permanent',
    title: '永久常识修改',
    description: '从潜意识底层永久性改写目标的一项基本常识，使其对特定事物建立完全偏差且不可逆的正确认知。',
    tier: 'VIP6',
    costType: 'PER_MINUTE',
    costValue: 8000,
    costCurrency: 'MC_ENERGY',
    isEnabled: false,
    notePlaceholder: '输入要修改的常识...',
  },
  {
    id: 'vip5_permanent_false_memory',
    title: '永久虚假记忆',
    description: '在目标记忆网络中永久刻入一段完全虚构的经历，使其终生相信这段虚假记忆曾真实发生过。',
    tier: 'VIP6',
    costType: 'PER_MINUTE',
    costValue: 8000,
    costCurrency: 'MC_ENERGY',
    isEnabled: false,
    notePlaceholder: '输入要植入的记忆...',
  },
  {
    id: 'vip5_moral_reform',
    title: '道德改造',
    description: '从潜意识底层扭曲并重塑目标基础的贞操观与伦理底线，使其将极度背德的色情行为视为正常乃至被推崇的行为。',
    tier: 'VIP6',
    costType: 'PER_MINUTE',
    costValue: 10000,
    costCurrency: 'MC_ENERGY',
    isEnabled: false,
    notePlaceholder: '输入道德改造的具体方向...',
  },
  {
    id: 'vip5_permanent_personality',
    title: '第五人格',
    description: '在目标意识中永久植入一个全新完整的人格，使其成为与该人格共生或交替出现的存在。',
    tier: 'VIP6',
    costType: 'PER_MINUTE',
    costValue: 12000,
    costCurrency: 'MC_ENERGY',
    isEnabled: false,
    notePlaceholder: '输入人格设定...',
  },
  {
    id: 'vip5_personality_kill',
    title: '人格抹杀',
    description: '锁定目标意识中一个指定的人格并将其永久抹除，被抹杀的人格将彻底消失，不再存在于目标的记忆与意识中。',
    tier: 'VIP6',
    costType: 'PER_MINUTE',
    costValue: 15000,
    costCurrency: 'MC_ENERGY',
    isEnabled: false,
    notePlaceholder: '输入要抹杀的人格描述...',
  },
  {
    id: 'vip4_race_remodeling',
    title: '种族改造',
    description: '重塑目标的肉体基因与生理结构，将其转化为特定的幻想或非人物种，外观与内部生理机能均会发生根本性改变。',
    tier: 'VIP6',
    costType: 'PER_MINUTE',
    costValue: 20000,
    costCurrency: 'MC_ENERGY',
    isEnabled: false,
    notePlaceholder: '输入要改造的目标种族...',
  },
  {
    id: 'vip5_condom_transform',
    title: '鸡巴套子',
    description: '将目标肉体降维折叠，化为一枚具有其个人特色涂装、保有完整思想的活体避孕套，同步体验被使用过程中的极致屈辱与快感。',
    tier: 'VIP6',
    costType: 'PER_MINUTE',
    costValue: 1000,
    costCurrency: 'MC_ENERGY',
    isEnabled: false,
    notePlaceholder: '输入鸡巴套子的补充备注...',
  },
  {
    id: 'vip5_fleshlight',
    title: '飞机杯',
    description: '将目标角色压缩变形为一盏具有其个人特色的活体飞机杯，内部构造完美复刻目标的身体特征与敏感点，目标保持完全清醒的意识，可随时由{{User}}主动解除。',
    tier: 'VIP6',
    costType: 'PER_MINUTE',
    costValue: 1000,
    costCurrency: 'MC_ENERGY',
    isEnabled: false,
    notePlaceholder: '输入飞机杯的补充备注...',
  },
  {
    id: 'vip5_true_time_stop',
    title: '真时停',
    description: '强制暂停整个世界的时间流动，仅{{User}}与{{User}}在备注中指定的人物可以自由活动，其余一切生物与非生物均陷入完全静止的时间冻结中。',
    tier: 'VIP6',
    costType: 'PER_MINUTE',
    costValue: 800,
    costCurrency: 'MC_ENERGY',
    isEnabled: false,
    notePlaceholder: '输入可自由活动的指定人物...',
  },

  // 校规修改（世界书编辑器：直接读写 [mvu_plot]校规- 前缀条目，每次保存扣 3000 MC）
  {
    id: 'vip5_open_space_common_sense',
    title: '校规修改',
    description: '直接读取当前角色卡绑定的世界书，修改其中校规类条目（[mvu_plot]校规- 前缀）的名称与内容并永久写回。改的是真实世界书数据，非催眠演绎。',
    tier: 'VIP5',
    costType: 'ONE_TIME',
    costValue: 0,
    costCurrency: 'MC_ENERGY',
    isEnabled: false,
    notePlaceholder: '（本功能直接编辑世界书条目，无需备注）',
  },
];

const PURCHASE_PRICE_BY_TIER: Record<HypnosisFeature['tier'], number> = {
  TRIAL: 0,
  VIP1: 10,
  VIP2: 50,
  VIP3: 150,
  VIP4: 300,
  VIP5: 1000,
  VIP6: 1000,
};

const FIRST_FEATURE_ID_BY_TIER = (() => {
  const map = new Map<HypnosisFeature['tier'], string>();
  for (const feature of FEATURES) {
    if (feature.tier === 'TRIAL') continue;
    if (!map.has(feature.tier)) map.set(feature.tier, feature.id);
  }
  return map;
})();

function isPurchaseRequired(feature: HypnosisFeature): boolean {
  if (feature.tier === 'TRIAL') return false;
  const firstId = FIRST_FEATURE_ID_BY_TIER.get(feature.tier);
  return Boolean(firstId) && feature.id !== firstId;
}

function getPurchasePriceEnergy(feature: HypnosisFeature): number | null {
  if (!isPurchaseRequired(feature)) return null;
  return PURCHASE_PRICE_BY_TIER[feature.tier] ?? PURCHASE_PRICE_BY_TIER.VIP5;
}

type PersistedStore = {
  version: number;
  debugEnabled: boolean;
  sessionEndVirtualMinutes?: number;
  sessionEndAtMs?: number;
  hasUsedHypnosis: boolean;
  subscription?: {
    tier: 'VIP1' | 'VIP2' | 'VIP3' | 'VIP4' | 'VIP5' | 'VIP6';
  };
  features: Record<
    string,
    {
      isEnabled?: boolean;
      userNote?: string;
      userNumber?: number;
      userRounds?: number;
      userMode?: '视觉' | '触觉' | '听觉';
      userTarget?: string;
      userSensitivityOp?: '增加' | '减少';
      userSensitivityPart?: '阴部' | '屁股' | '胸部' | '尿道';
      userPleasurePart?: '阴部' | '屁股' | '胸部' | '尿道';
    }
  >;
  purchases: Record<string, boolean>;
  achievements: Record<string, boolean>;
  quests: Record<string, QuestStatus>;
  challenges: Array<{
    id: string;
    name: string;
    target: string;
    description: string;
    reward: string;
  }>;
  lastChallengeRefreshDate?: string | null;
};

const STORE_SCHEMA: z.ZodType<PersistedStore> = z
  .object({
    version: z.coerce.number().default(1),
    debugEnabled: z.coerce.boolean().default(false),
    sessionEndVirtualMinutes: z.coerce.number().optional(),
    sessionEndAtMs: z.coerce.number().optional(),
    hasUsedHypnosis: z.coerce.boolean().default(false),
    subscription: z
      .object({
        tier: z.enum(['VIP1', 'VIP2', 'VIP3', 'VIP4', 'VIP5', 'VIP6']),
      })
      .optional(),
    features: z
      .record(
        z.string(),
        z
          .object({
            isEnabled: z.boolean().optional(),
            userNote: z.string().optional(),
            userNumber: z.coerce.number().optional(),
            userRounds: z.coerce.number().optional(),
            userMode: z.enum(['视觉', '触觉', '听觉']).optional(),
            userTarget: z.string().optional(),
            userSensitivityOp: z.enum(['增加', '减少']).optional(),
            userSensitivityPart: z.enum(['阴部', '屁股', '胸部', '尿道']).optional(),
            userPleasurePart: z.enum(['阴部', '屁股', '胸部', '尿道']).optional(),
          })
          .passthrough(),
      )
      .default({}),
    purchases: z.record(z.string(), z.coerce.boolean()).default({}),
    achievements: z.record(z.string(), z.boolean()).default({}),
    quests: z.record(z.string(), z.enum(['AVAILABLE', 'ACTIVE', 'COMPLETED', 'CLAIMED'])).default({}),
    challenges: z
      .array(
        z.object({
          id: z.string(),
          name: z.string(),
          target: z.string(),
          description: z.string(),
          reward: z.string(),
        }),
      )
      .default([]),
    lastChallengeRefreshDate: z.string().nullable().optional(),
  })
  .default({
    version: 1,
    debugEnabled: false,
    hasUsedHypnosis: false,
    features: {},
    purchases: {},
    achievements: {},
    quests: {},
    challenges: [],
  });

function toFiniteNumber(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeSystemVariables(systemRaw: Record<string, any>) {
  return systemRaw;
}

function normalizeProtagonistVariables(protagonistRaw: Record<string, any>) {
  return protagonistRaw;
}

function getDirectCurrentStatData(): Record<string, any> | null {
  try {
    const mvu = (globalThis as any).Mvu;
    if (!mvu || typeof mvu.getMvuData !== 'function') return null;
    const option =
      typeof (globalThis as any).getCurrentMessageId === 'function'
        ? { type: 'message', message_id: (globalThis as any).getCurrentMessageId() }
        : { type: 'message', message_id: 'latest' };
    return (mvu.getMvuData(option)?.stat_data ?? null) as Record<string, any> | null;
  } catch {
    return null;
  }
}

function idSafe(part: string): string {
  return encodeURIComponent(part).replaceAll('%', '_');
}

function makeAchievementId(prefix: string, ...parts: string[]) {
  return [prefix, ...parts.map(idSafe)].join('__');
}

export const SUBSCRIPTION_PRICES: Record<SubscriptionTier, number> = {
  VIP1: 0,
  VIP2: 10000,
  VIP3: 50000,
  VIP4: 100000,
  VIP5: 500000,
  VIP6: 1000000,
};

function parseMonthDay(dateText?: string): { month: number; day: number } | null {
  if (!dateText) return null;
  const isoLike = dateText.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoLike) {
    const month = Number(isoLike[2]);
    const day = Number(isoLike[3]);
    if ([month, day].every(Number.isFinite)) return { month, day };
  }

  const cnLike = dateText.match(/(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
  if (cnLike) {
    const month = Number(cnLike[1]);
    const day = Number(cnLike[2]);
    if ([month, day].every(Number.isFinite)) return { month, day };
  }

  return null;
}

function periodToClock(currentPeriod?: string): { hours: number; minutes: number; seconds: number } | null {
  const key = currentPeriod?.trim();
  if (!key) return null;
  const map: Record<string, [number, number, number]> = {
    凌晨: [3, 0, 0],
    清晨: [6, 0, 0],
    早上: [8, 0, 0],
    上午: [10, 0, 0],
    中午: [12, 0, 0],
    下午: [15, 0, 0],
    傍晚: [18, 0, 0],
    晚上: [20, 0, 0],
    深夜: [23, 0, 0],
  };
  const hit = map[key];
  if (!hit) return null;
  const [hours, minutes, seconds] = hit;
  return { hours, minutes, seconds };
}

function parseVirtualMinutesFrom(dateText?: string, timeText?: string, currentPeriod?: string): number | null {
  const date = parseMonthDay(dateText);
  if (!date) return null;

  const timeMatch = timeText?.match(/(\d{1,2})\s*:\s*(\d{1,2})(?:\s*:\s*(\d{1,2}))?/);
  const derivedClock = timeMatch
    ? {
        hours: Number(timeMatch[1]),
        minutes: Number(timeMatch[2]),
        seconds: timeMatch[3] === undefined ? 0 : Number(timeMatch[3]),
      }
    : periodToClock(currentPeriod);

  if (!derivedClock) return null;

  const { month, day } = date;
  const { hours, minutes, seconds } = derivedClock;
  if (![month, day, hours, minutes].every(Number.isFinite)) return null;
  if (!Number.isFinite(seconds)) return null;

  const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const mIndex = Math.max(1, Math.min(12, month)) - 1;
  const dIndex = Math.max(1, Math.min(monthDays[mIndex], day)) - 1;
  const dayOfYear = monthDays.slice(0, mIndex).reduce((a, b) => a + b, 0) + dIndex;

  const h = Math.max(0, Math.min(23, hours));
  const min = Math.max(0, Math.min(59, minutes));
  const sec = Math.max(0, Math.min(59, seconds));
  return dayOfYear * 24 * 60 + h * 60 + min + sec / 60;
}

function getSystemClockFrom(system: Record<string, any> | null | undefined) {
  const dateText = typeof system?.当前日期 === 'string' ? system.当前日期 : undefined;
  const weekdayText = typeof system?.星期 === 'string' ? system.星期.trim() : '';
  const currentPeriod = typeof system?.当前时段 === 'string' ? system.当前时段.trim() : '';
  const timeText = [weekdayText, currentPeriod].filter(Boolean).join(' ') || undefined;
  return {
    dateText,
    timeText,
    virtualMinutes: parseVirtualMinutesFrom(dateText, undefined, currentPeriod),
  };
}

async function getRolesAndSystemSnapshot(): Promise<{ system: Record<string, any>; roles: Record<string, any> }> {
  let system: Record<string, any> | null = null;
  let roles: Record<string, any> | null = null;
  try {
    system = await MvuBridge.getSystem();
    if (system) normalizeSystemVariables(system);
    roles = await MvuBridge.getRoles();
  } catch {
    // ignore
  }

  if (system && roles) return { system, roles };

  const vars = getVariables(CHAT_OPTION);
  const normalized = normalizeChatVariables(vars);
  system ??= normalized.system as any;
  roles ??= (vars as any)?.角色 ?? {};
  return { system, roles };
}

type SystemWithStore = {
  _催眠能量: number;
  _催眠能量上限: number;
  可疑度: number;
  _催眠APP等级?: string | number;
  _hypnoos?: PersistedStore;
  [key: string]: any;
};

type ProtagonistVariables = {
  金钱: number;
  [key: string]: any;
};

const SYSTEM_SCHEMA: z.ZodType<SystemWithStore> = z
  .object({
    _催眠能量: z.coerce.number().default(DEFAULT_USER_DATA.mcEnergy),
    _催眠能量上限: z.coerce.number().default(DEFAULT_USER_DATA.mcEnergyMax),
    可疑度: z.coerce.number().default(DEFAULT_USER_DATA.suspicion),
    _催眠APP等级: z.union([z.string(), z.number()]).optional(),
    _hypnoos: STORE_SCHEMA.optional(),
  })
  .passthrough()
  .default({} as SystemWithStore);

const PROTAGONIST_SCHEMA: z.ZodType<ProtagonistVariables> = z
  .object({
    金钱: z.coerce.number().default(DEFAULT_USER_DATA.money),
  })
  .passthrough()
  .default({} as ProtagonistVariables);

function systemToUserResources(system: SystemWithStore, protagonist: ProtagonistVariables): UserResources {
  return {
    mcEnergy: system._催眠能量,
    mcEnergyMax: system._催眠能量上限,
    money: protagonist.金钱,
    suspicion: system.可疑度,
  };
}

function readUserResourcesFromStatData(statData: Record<string, any> | null | undefined): UserResources | null {
  if (!statData) return null;

  const systemRaw = _.isPlainObject(statData.系统) ? (statData.系统 as Record<string, any>) : {};
  const protagonistRaw = _.isPlainObject(statData.主角) ? (statData.主角 as Record<string, any>) : {};

  const mcEnergy = toFiniteNumber(systemRaw._催眠能量 ?? systemRaw.催眠能量);
  const mcEnergyMax = toFiniteNumber(systemRaw._催眠能量上限 ?? systemRaw.催眠能量上限);
  const money = toFiniteNumber(protagonistRaw.金钱);
  const suspicion = toFiniteNumber(systemRaw.可疑度);

  if ([mcEnergy, mcEnergyMax, money, suspicion].every(v => v === null)) {
    return null;
  }

  return {
    mcEnergy: mcEnergy ?? DEFAULT_USER_DATA.mcEnergy,
    mcEnergyMax: mcEnergyMax ?? DEFAULT_USER_DATA.mcEnergyMax,
    money: money ?? DEFAULT_USER_DATA.money,
    suspicion: suspicion ?? DEFAULT_USER_DATA.suspicion,
  };
}

function normalizeChatVariables(variables: Record<string, any>) {
  const systemRaw = normalizeSystemVariables(variables?.系统 ?? {});
  const protagonistRaw = normalizeProtagonistVariables(variables?.主角 ?? {});
  const system = SYSTEM_SCHEMA.parse(systemRaw);
  const protagonist = PROTAGONIST_SCHEMA.parse(protagonistRaw);
  system._hypnoos = STORE_SCHEMA.parse(system._hypnoos ?? {});
  variables.系统 = system;
  variables.主角 = protagonist;
  return { variables, system, protagonist, store: system._hypnoos };
}

async function updateStoreWith(updater: (store: PersistedStore) => PersistedStore) {
  let nextStore: PersistedStore | undefined;
  updateVariablesWith(vars => {
    const { system, store } = normalizeChatVariables(vars);
    nextStore = STORE_SCHEMA.parse(updater(store));
    system._hypnoos = nextStore;
    vars.系统 = system;
    return vars;
  }, CHAT_OPTION);

  const result = nextStore ?? STORE_SCHEMA.parse({});
  await MvuBridge.syncPersistedStore(result);
  return result;
}

const STATIC_ACHIEVEMENTS: Array<Omit<Achievement, 'isClaimed'>> = [
  {
    id: 'ach_newbie',
    title: '初次接触',
    description: '当前催眠能量达到 20 点。',
    rewardMcEnergy: 5,
    checkCondition: u => u.mcEnergy >= 20,
  },
  {
    id: 'ach_rich',
    title: '资金充裕',
    description: '持有金钱超过 50,000 円。',
    rewardMcEnergy: 10,
    checkCondition: u => u.money >= 50000,
  },
  {
    id: 'ach_sus',
    title: '隐秘行动',
    description: '将可疑度控制在 5% 以下。',
    rewardMcEnergy: 50,
    checkCondition: u => u.suspicion <= 5,
  },
];

async function buildRoleBasedAchievements(store: PersistedStore): Promise<Array<Omit<Achievement, 'isClaimed'>>> {
  const { system, roles } = await getRolesAndSystemSnapshot();

  const achievements: Array<Omit<Achievement, 'isClaimed'>> = [];

  achievements.push({
    id: 'ach_first_hypnosis',
    title: '首次使用催眠',
    description: '首次启动催眠流程。',
    rewardMcEnergy: 15,
    checkCondition: () => Boolean(store.hasUsedHypnosis),
  });

  const suspicion = toFiniteNumber(system?.可疑度) ?? 0;
  for (const t of [25, 50, 75, 100]) {
    achievements.push({
      id: makeAchievementId('ach_suspicion', String(t)),
      title: `可疑度达到 ${t}`,
      description: `可疑度达到 ${t}%（系统.可疑度）`,
      rewardMcEnergy: t,
      checkCondition: () => suspicion >= t,
    });
  }

  const energyMax = toFiniteNumber(system?._催眠能量上限) ?? 0;
  const energyMaxThresholds: Array<[number, number]> = [
    [100, 10],
    [300, 30],
    [1000, 50],
  ];
  for (const [t, reward] of energyMaxThresholds) {
    achievements.push({
      id: makeAchievementId('ach_energy_max', String(t)),
      title: `催眠能量上限达到 ${t}`,
      description: `催眠能量上限达到 ${t}（系统._催眠能量上限）`,
      rewardMcEnergy: reward,
      checkCondition: () => energyMax >= t,
    });
  }

  const sensitivityThresholds = [200, 300, 400, 500];
  const orgasmThresholds = [1, 5, 25, 100];
  const percentThresholds = [25, 50, 75, 100];

  for (const [roleName, roleDataRaw] of Object.entries(roles ?? {})) {
    if (!roleName) continue;
    if (!roleDataRaw || typeof roleDataRaw !== 'object') continue;
    const roleData = roleDataRaw as Record<string, any>;

    const guard = toFiniteNumber(roleData['警戒度']) ?? 0;
    const lust = toFiniteNumber(roleData['色情度']) ?? 0;

    for (const t of percentThresholds) {
      achievements.push({
        id: makeAchievementId('ach_role_guard', roleName, String(t)),
        title: `${roleName} 警戒度达到 ${t}`,
        description: `${roleName} 的警戒度达到 ${t}（角色.${roleName}.警戒度）`,
        rewardMcEnergy: t,
        checkCondition: () => guard >= t,
      });
      achievements.push({
        id: makeAchievementId('ach_role_lust', roleName, String(t)),
        title: `${roleName} 色情度达到 ${t}`,
        description: `${roleName} 的色情度达到 ${t}（角色.${roleName}.色情度）`,
        rewardMcEnergy: t,
        checkCondition: () => lust >= t,
      });
    }

    const sensitivityKeys = Object.keys(roleData).filter(k => k.includes('敏感度'));
    for (const key of sensitivityKeys) {
      const value = toFiniteNumber(roleData[key]);
      if (value === null) continue;
      for (const t of sensitivityThresholds) {
        achievements.push({
          id: makeAchievementId('ach_sensitivity', roleName, key, String(t)),
          title: `${roleName}·${key} ≥ ${t}`,
          description: `${roleName} 的 ${key} 达到 ${t}（角色.${roleName}.${key}）`,
          rewardMcEnergy: 20,
          checkCondition: () => value >= t,
        });
      }
    }

    const orgasmKeys = Object.keys(roleData).filter(k => k.includes('高潮次数'));
    for (const key of orgasmKeys) {
      const value = toFiniteNumber(roleData[key]);
      if (value === null) continue;
      for (const t of orgasmThresholds) {
        achievements.push({
          id: makeAchievementId('ach_orgasm', roleName, key, String(t)),
          title: `${roleName}·${key} ≥ ${t}`,
          description: `${roleName} 的 ${key} 达到 ${t}（角色.${roleName}.${key}）`,
          rewardMcEnergy: 20,
          checkCondition: () => value >= t,
        });
      }
    }
  }

  return achievements;
}

function validateQuestDb(db: QuestDefinition[]) {
  const ids = new Set<string>();
  const names = new Set<string>();
  for (const q of db) {
    if (ids.has(q.id)) throw new Error(`[HypnoOS] QUEST_DB 重复 id: ${q.id}`);
    ids.add(q.id);
    if (names.has(q.name)) throw new Error(`[HypnoOS] QUEST_DB 重复 name: ${q.name}`);
    names.add(q.name);
  }
  return db;
}

const QUEST_DATABASE = validateQuestDb(QUEST_DB);

const PERSISTENT_FEATURE_IDS = new Set<string>([]);

const SUBSCRIPTION_TIER_BASE_VALUE = 1;

function getSubscriptionTierValue(tier: SubscriptionTier): number {
  const numeric = Number(tier.replace('VIP', ''));
  return Number.isFinite(numeric) && numeric > 0 ? numeric : SUBSCRIPTION_TIER_BASE_VALUE;
}

function getSubscriptionTierValueFromState(subscription: SubscriptionState | null): number | null {
  if (!subscription) return SUBSCRIPTION_TIER_BASE_VALUE;
  return getSubscriptionTierValue(subscription.tier);
}

async function syncSubscriptionTierLabel(nowVirtualMinutes: number | null): Promise<void> {
  const { system, store } = normalizeChatVariables(getVariables(CHAT_OPTION));
  const subscription = (store.subscription as SubscriptionState | undefined) ?? null;
  const desired = getSubscriptionTierValueFromState(subscription);
  if (desired === null) return;
  if (system._催眠APP等级 === desired) return;

  updateVariablesWith(vars => {
    const { system: nextSystem } = normalizeChatVariables(vars);
    nextSystem._催眠APP等级 = desired;
    vars.系统 = nextSystem;
    return vars;
  }, CHAT_OPTION);

  await MvuBridge.syncSubscriptionTier(desired);
}

// 在当前角色卡绑定的世界书中，按条目名称开启（enabled = true）指定条目
async function enableWorldbookEntryByName(entryName: string): Promise<boolean> {
  try {
    const wb = getCharWorldbookNames('current');
    const names = [
      ...(wb?.primary ? [wb.primary] : []),
      ...(wb?.additional ?? []),
    ].filter(Boolean);

    for (const name of names) {
      try {
        const entries = await getWorldbook(name);
        const target = (entries ?? []).find(e => typeof e.name === 'string' && e.name === entryName);
        if (!target) continue;
        if (target.enabled) return true; // 已开启
        await updateWorldbookWith(
          name,
          list => list.map(e => (e.uid === target.uid ? { ...e, enabled: true } : e)),
          { render: 'immediate' },
        );
        return true;
      } catch (err) {
        // 世界书可能不存在，继续尝试下一本
        console.warn(`[HypnoOS] 开启世界书「${name}」条目失败`, err);
      }
    }
    return false;
  } catch (err) {
    console.warn('[HypnoOS] 开启世界书条目失败', err);
    return false;
  }
}

// --- 每日挑战：上下文收集与奖励解析 ---

const CHALLENGE_COST = 500;
const CHALLENGE_COUNT = 3;
const CHALLENGE_RECENT_MESSAGES = 10;

function todayKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getSceneDescription(): string | undefined {
  try {
    const vars = getVariables(CHAT_OPTION);
    const loc = (vars as any)?.世界?.当前地点;
    return typeof loc === 'string' && loc.trim() ? loc.trim() : undefined;
  } catch {
    return undefined;
  }
}

function getRecentChatMessages(count: number): Array<{ name: string; role: string; content: string }> {
  try {
    const lastMsg = getChatMessages(-1)[0];
    if (!lastMsg) return [];
    const lastId = lastMsg.message_id;
    const firstId = Math.max(0, lastId - count + 1);
    const msgs = getChatMessages(`${firstId}-${lastId}`) as Array<{ name?: string; role?: string; message?: string }>;
    return (msgs ?? [])
      .filter(m => m && typeof m.message === 'string' && m.message.trim())
      .map(m => ({
        name: typeof m.name === 'string' ? m.name : '',
        role: typeof m.role === 'string' ? m.role : 'user',
        content: m.message as string,
      }));
  } catch {
    return [];
  }
}

async function getRoleWorldbookEntries(roleNames: string[]): Promise<Array<{ roleName: string; content: string }>> {
  const results: Array<{ roleName: string; content: string }> = [];
  const nameSet = new Set(roleNames);
  if (nameSet.size === 0) return results;
  try {
    const wb = getCharWorldbookNames('current');
    const names = [...(wb?.primary ? [wb.primary] : []), ...(wb?.additional ?? [])].filter(Boolean);
    for (const wbName of names) {
      try {
        const entries = await getWorldbook(wbName);
        for (const entry of entries ?? []) {
          if (nameSet.has(entry.name) && typeof entry.content === 'string' && entry.content.trim()) {
            results.push({ roleName: entry.name, content: entry.content });
          }
        }
      } catch {
        // 该世界书不存在或读取失败，继续下一本
      }
    }
  } catch (err) {
    console.warn('[HypnoOS] 读取角色世界书条目失败', err);
  }
  return results;
}

type ParsedChallengeReward =
  | { kind: 'money'; amount: number }
  | { kind: 'item'; itemName: string; itemDescription: string };

function parseChallengeReward(reward: string): ParsedChallengeReward | null {
  const text = reward.trim();
  const moneyMatch = text.match(/金钱\s*(\d+)/);
  if (moneyMatch) {
    const amount = Number(moneyMatch[1]);
    if (Number.isFinite(amount)) return { kind: 'money', amount };
  }
  const itemMatch = text.match(/物品\s*(.+)/);
  if (itemMatch && itemMatch[1].trim()) {
    const raw = itemMatch[1].trim();
    const sep = raw.search(/[:：]/);
    if (sep > 0) {
      const itemName = raw.slice(0, sep).trim();
      const itemDescription = raw.slice(sep + 1).trim() || itemName;
      return { kind: 'item', itemName, itemDescription };
    }
    return { kind: 'item', itemName: raw, itemDescription: raw };
  }
  return null;
}

function getCharactersFromChat(recentMessages: Array<{ name: string; role: string; content: string }>): string[] {
  const names = new Set<string>();
  for (const m of recentMessages) {
    if (m.role !== 'assistant') continue;
    if (m.name && m.name.trim()) names.add(m.name.trim());
  }
  return [...names];
}

async function collectChallengeContext(): Promise<ChallengeContext | null> {
  try {
    const recentMessages = getRecentChatMessages(CHALLENGE_RECENT_MESSAGES);
    const roles = await MvuBridge.getRoles();
    const mvuRoleNames = Object.keys(roles ?? {}).filter(Boolean);
    const chatRoleNames = getCharactersFromChat(recentMessages).filter(n => !mvuRoleNames.includes(n));

    // 候选角色池：有变量的角色优先 + 正文出现的角色，全部交给副 API，由它根据剧情与人设挑选目标
    const candidatePool = [...mvuRoleNames, ...chatRoleNames];
    const roleWorldbookEntries = await getRoleWorldbookEntries(candidatePool);
    return {
      scene: getSceneDescription(),
      recentMessages,
      candidateRoles: candidatePool,
      roleWorldbookEntries,
    };
  } catch (err) {
    console.warn('[HypnoOS] 收集挑战上下文失败', err);
    return null;
  }
}

async function generateAndStoreChallenges(
  settings: SecondaryApiSettings,
): Promise<{ ok: boolean; message?: string }> {
  const ctx = await collectChallengeContext();
  if (!ctx) return { ok: false, message: '收集游戏上下文失败' };

  const result = await generateChallenges(ctx, { settings });
  if (!result.ok) return { ok: false, message: result.error };

  const generated = result.challenges.slice(0, CHALLENGE_COUNT);
  if (generated.length === 0) return { ok: false, message: '副 API 未返回有效任务' };

  const stored = generated.map((g, i) => ({
    id: makeAchievementId('challenge', g.任务名称, String(i)),
    name: g.任务名称,
    target: g.任务目标,
    description: g.任务描述,
    reward: g.任务奖励,
  }));

  await updateStoreWith(s => ({
    ...s,
    challenges: stored,
    lastChallengeRefreshDate: todayKey(),
  }));
  return { ok: true };
}

export const DataService = {
  getUnlocks: async (): Promise<{ debugEnabled: boolean; bodyStatsUnlocked: boolean }> => {
    const { store } = normalizeChatVariables(getVariables(CHAT_OPTION));
    const debugEnabled = Boolean(store.debugEnabled);
    return { debugEnabled, bodyStatsUnlocked: true };
  },

  isSubscriptionActive: (ctx: AccessContext): boolean => isSubscriptionActive(ctx),

  canUseFeature: (feature: HypnosisFeature, ctx: AccessContext): boolean => {
    if (ctx.debugEnabled) return true;
    return canUseFeatureBySubscription(feature, ctx);
  },

  getSubscriptionTiers: (): readonly SubscriptionTier[] => SUBSCRIPTION_TIERS,

  getUserData: async (): Promise<UserResources> => {
    let user: UserResources | undefined;
    try {
      const statData = await MvuBridge.getStatData();
      if (statData) {
        user = readUserResourcesFromStatData(statData) ?? undefined;
        if (!user) {
          const system = SYSTEM_SCHEMA.parse(normalizeSystemVariables(statData.系统 ?? {}));
          const protagonist = PROTAGONIST_SCHEMA.parse(normalizeProtagonistVariables(statData.主角 ?? {}));
          user = systemToUserResources(system, protagonist);
        }
      }
    } catch (err) {
      console.warn('[HypnoOS] 读取 MVU 系统变量失败，回退到聊天变量', err);
    }

    user ??= readUserResourcesFromStatData(getDirectCurrentStatData()) ?? undefined;

    updateVariablesWith(vars => {
      const { system, protagonist } = normalizeChatVariables(vars);
      user ??= systemToUserResources(system, protagonist);
      return vars;
    }, CHAT_OPTION);

    if (user) {
      updateVariablesWith(vars => {
        const { system, protagonist, store } = normalizeChatVariables(vars);
        system._催眠能量 = user.mcEnergy;
        system._催眠能量上限 = user.mcEnergyMax;
        protagonist.金钱 = user.money;
        system.可疑度 = user.suspicion;
        system._hypnoos = store;
        vars.系统 = system;
        vars.主角 = protagonist;
        return vars;
      }, CHAT_OPTION);
    }

    return user ?? DEFAULT_USER_DATA;
  },

  getSystemClock: async (): Promise<{ dateText?: string; timeText?: string; virtualMinutes: number | null }> => {
    const maybeSync = async (clock: { virtualMinutes: number | null }) => {
      try {
        await syncSubscriptionTierLabel(clock.virtualMinutes);
      } catch (err) {
        console.warn('[HypnoOS] 同步订阅等级变量失败', err);
      }
      return clock;
    };

    try {
      const mvuSystem = await MvuBridge.getSystem();
      if (mvuSystem) return await maybeSync(getSystemClockFrom(mvuSystem));
    } catch (err) {
      console.warn('[HypnoOS] 读取 MVU 系统时间失败，回退到聊天变量', err);
    }

    const { system } = normalizeChatVariables(getVariables(CHAT_OPTION));
    return await maybeSync(getSystemClockFrom(system));
  },

  getSessionEnd: async (): Promise<{ endVirtualMinutes: number | null; endAtMs: number | null }> => {
    const { store } = normalizeChatVariables(getVariables(CHAT_OPTION));
    const endVirtualMinutes =
      typeof store.sessionEndVirtualMinutes === 'number' && Number.isFinite(store.sessionEndVirtualMinutes)
        ? store.sessionEndVirtualMinutes
        : null;
    const endAtMs =
      typeof store.sessionEndAtMs === 'number' && Number.isFinite(store.sessionEndAtMs) ? store.sessionEndAtMs : null;
    return { endVirtualMinutes, endAtMs };
  },

  setSessionEnd: async ({
    endVirtualMinutes,
    endAtMs,
  }: {
    endVirtualMinutes: number | null;
    endAtMs: number | null;
  }) => {
    await updateStoreWith(store => {
      const next: PersistedStore = { ...store };
      if (endVirtualMinutes === null || !Number.isFinite(endVirtualMinutes)) delete next.sessionEndVirtualMinutes;
      else next.sessionEndVirtualMinutes = endVirtualMinutes;

      if (endAtMs === null || !Number.isFinite(endAtMs)) delete next.sessionEndAtMs;
      else next.sessionEndAtMs = endAtMs;

      return next;
    });
  },

  clearSessionEnd: async () => {
    await DataService.setSessionEnd({ endVirtualMinutes: null, endAtMs: null });
  },

  getSubscription: async (): Promise<SubscriptionState | null> => {
    const { store } = normalizeChatVariables(getVariables(CHAT_OPTION));
    return (store.subscription as SubscriptionState | undefined) ?? { tier: 'VIP1' };
  },

  clearSubscription: async () => {
    updateVariablesWith(vars => {
      const { system } = normalizeChatVariables(vars);
      if (system._催眠APP等级 === SUBSCRIPTION_TIER_BASE_VALUE) return vars;
      system._催眠APP等级 = SUBSCRIPTION_TIER_BASE_VALUE;
      vars.系统 = system;
      return vars;
    }, CHAT_OPTION);

    await updateStoreWith(store => {
      const next: PersistedStore = { ...store };
      delete next.subscription;
      return next;
    });

    await MvuBridge.syncSubscriptionTier(SUBSCRIPTION_TIER_BASE_VALUE);
  },

  unlockTier: async ({
    tier,
  }: {
    tier: SubscriptionTier;
  }): Promise<{ ok: boolean; message?: string; subscription?: SubscriptionState | null }> => {
    const price = SUBSCRIPTION_PRICES[tier];
    const user = await DataService.getUserData();
    if (user.money < price) return { ok: false, message: '零花钱不足' };

    const storeBefore = await updateStoreWith(s => s);
    const prev = storeBefore.subscription;
    if (prev?.tier === tier) {
      return { ok: false, message: '当前等级已解锁' };
    }

    if (prev && SUBSCRIPTION_TIERS.indexOf(tier) < SUBSCRIPTION_TIERS.indexOf(prev.tier)) {
      return { ok: false, message: '不能降级解锁' };
    }

    const nextSub: SubscriptionState = {
      tier,
    };

    const tierValue = getSubscriptionTierValue(tier);
    updateVariablesWith(vars => {
      const { system } = normalizeChatVariables(vars);
      if (system._催眠APP等级 === tierValue) return vars;
      system._催眠APP等级 = tierValue;
      vars.系统 = system;
      return vars;
    }, CHAT_OPTION);

    await MvuBridge.syncSubscriptionTier(tierValue);

    await DataService.updateResources({
      money: user.money - price,
    });

    const next = await updateStoreWith(store => ({
      ...store,
      subscription: nextSub,
    }));
    updateVariablesWith(vars => {
      const { system } = normalizeChatVariables(vars);
      system._hypnoos = next;
      if (system._催眠APP等级 === tierValue) return vars;
      system._催眠APP等级 = tierValue;
      vars.系统 = system;
      return vars;
    }, CHAT_OPTION);

    return { ok: true, subscription: (next.subscription as SubscriptionState | undefined) ?? null };
  },

  getFeatures: async (): Promise<HypnosisFeature[]> => {
    const { store } = normalizeChatVariables(getVariables(CHAT_OPTION));
    return FEATURES.map(f => ({
      ...f,
      isEnabled: store.features?.[f.id]?.isEnabled ?? f.isEnabled,
      userNote: store.features?.[f.id]?.userNote ?? f.userNote,
      userNumber: store.features?.[f.id]?.userNumber ?? f.userNumber,
      userRounds: store.features?.[f.id]?.userRounds ?? f.userRounds,
      userMode: store.features?.[f.id]?.userMode ?? f.userMode,
      userTarget: store.features?.[f.id]?.userTarget ?? f.userTarget,
      userSensitivityOp: store.features?.[f.id]?.userSensitivityOp ?? f.userSensitivityOp,
      userSensitivityPart: store.features?.[f.id]?.userSensitivityPart ?? f.userSensitivityPart,
      userPleasurePart: store.features?.[f.id]?.userPleasurePart ?? f.userPleasurePart,
      purchaseRequired: isPurchaseRequired(f),
      purchasePriceEnergy: getPurchasePriceEnergy(f) ?? undefined,
      isPurchased: !isPurchaseRequired(f) || Boolean(store.purchases?.[f.id]),
    }));
  },

  purchaseFeature: async (id: string): Promise<{ ok: boolean; message?: string; user?: UserResources }> => {
    const feature = FEATURES.find(f => f.id === id);
    if (!feature) return { ok: false, message: '未知功能' };

    const price = getPurchasePriceEnergy(feature);
    if (price === null) return { ok: false, message: '该功能无需购买' };

    const storeBefore = await updateStoreWith(s => s);
    if (storeBefore.purchases?.[id]) return { ok: false, message: '已购买' };

    const user = await DataService.getUserData();
    if (user.mcEnergy < price) return { ok: false, message: `催眠能量不足：需要 ${price} MC` };

    await updateStoreWith(store => ({ ...store, purchases: { ...store.purchases, [id]: true } }));
    const nextUser = await DataService.updateResources({
      mcEnergy: user.mcEnergy - price,
    });

    return { ok: true, user: nextUser };
  },

  getDebugEnabled: async (): Promise<boolean> => {
    const { store } = normalizeChatVariables(getVariables(CHAT_OPTION));
    return Boolean(store.debugEnabled);
  },

  setDebugEnabled: async (enabled: boolean) => {
    await updateStoreWith(store => ({ ...store, debugEnabled: enabled }));
  },

  updateResources: async (newData: Partial<UserResources>): Promise<UserResources> => {
    const merged: UserResources = { ...(await DataService.getUserData()), ...newData };
    updateVariablesWith(vars => {
      const { system, protagonist, store } = normalizeChatVariables(vars);
      system._催眠能量 = merged.mcEnergy;
      system._催眠能量上限 = merged.mcEnergyMax;
      protagonist.金钱 = merged.money;
      system.可疑度 = merged.suspicion;
      system._hypnoos = store;
      vars.系统 = system;
      vars.主角 = protagonist;
      return vars;
    }, CHAT_OPTION);

    await MvuBridge.syncUserResources(merged);
    return merged;
  },

  startSession: async (payload: any): Promise<boolean> => {
    console.log('[Backend] Session Started:', payload);
    await updateStoreWith(store => ({ ...store, hasUsedHypnosis: true }));
    return true;
  },

  updateFeature: async (
    id: string,
    patch: {
      isEnabled?: boolean;
      userNote?: string;
      userNumber?: number;
      userRounds?: number;
      userMode?: '视觉' | '触觉' | '听觉';
      userTarget?: string;
      userSensitivityOp?: '增加' | '减少';
      userSensitivityPart?: '阴部' | '屁股' | '胸部' | '尿道';
      userPleasurePart?: '阴部' | '屁股' | '胸部' | '尿道';
    },
  ) => {
    await updateStoreWith(store => ({
      ...store,
      features: { ...store.features, [id]: { ...store.features[id], ...patch } },
    }));
  },

  resetFeatures: async () => {
    await updateStoreWith(store => {
      const preserved: PersistedStore['features'] = {};
      for (const [id, state] of Object.entries(store.features ?? {})) {
        if (!PERSISTENT_FEATURE_IDS.has(id)) continue;
        preserved[id] = state;
      }
      return { ...store, features: preserved };
    });
  },

  getAchievements: async (): Promise<Achievement[]> => {
    const { store } = normalizeChatVariables(getVariables(CHAT_OPTION));
    const dynamic = await buildRoleBasedAchievements(store);
    const all = [...STATIC_ACHIEVEMENTS, ...dynamic];
    return all.map(a => ({ ...a, isClaimed: store.achievements[a.id] ?? false }));
  },

  getQuests: async (): Promise<Quest[]> => {
    const { store } = normalizeChatVariables(getVariables(CHAT_OPTION));
    const claimed = store.quests ?? {};
    const tasks = (await MvuBridge.getTasks().catch(() => null)) ?? {};

    const quests = QUEST_DATABASE.map(q => {
      const locked = claimed[q.id] === 'CLAIMED';
      if (locked) {
        return {
          id: q.id,
          title: q.name,
          target: q.target,
          description: q.description,
          progress: '已完成',
          rewardMcEnergy: q.rewardMcEnergy,
          rewardText: q.rewardText,
          status: 'CLAIMED' as QuestStatus,
        };
      }

      const taskState = (tasks as any)[q.name];
      const completed = Boolean(taskState && typeof taskState === 'object' && taskState.是否完成 === true);
      const active = Boolean(taskState && typeof taskState === 'object' && typeof taskState.是否完成 === 'boolean');
      const progress = (taskState && typeof taskState === 'object' && typeof taskState.当前进度 === 'string')
        ? taskState.当前进度
        : (active ? '进行中' : '未开始');
      return {
        id: q.id,
        title: q.name,
        target: q.target,
        description: q.description,
        progress,
        rewardMcEnergy: q.rewardMcEnergy,
        rewardText: q.rewardText,
        status: completed
          ? ('COMPLETED' as QuestStatus)
          : active
            ? ('ACTIVE' as QuestStatus)
            : ('AVAILABLE' as QuestStatus),
      };
    });

    const order: Record<QuestStatus, number> = { COMPLETED: 0, ACTIVE: 1, AVAILABLE: 2, CLAIMED: 3 };
    quests.sort((a, b) => order[a.status] - order[b.status]);
    return quests;
  },

  claimAchievement: async (id: string, currentEnergy: number): Promise<{ success: boolean; newEnergy: number }> => {
    const achievements = await DataService.getAchievements();
    const ach = achievements.find(a => a.id === id);
    if (!ach) return { success: false, newEnergy: currentEnergy };

    const store = await updateStoreWith(s => s);
    if (store.achievements[id]) return { success: false, newEnergy: currentEnergy };

    const user = await DataService.getUserData();
    if (!ach.checkCondition(user)) return { success: false, newEnergy: currentEnergy };

    const newEnergy = Math.min(user.mcEnergyMax, currentEnergy + ach.rewardMcEnergy);
    await DataService.updateResources({ mcEnergy: newEnergy });
    await updateStoreWith(s => ({ ...s, achievements: { ...s.achievements, [id]: true } }));
    return { success: true, newEnergy };
  },

  acceptQuest: async (id: string): Promise<{ success: boolean; message?: string }> => {
    const def = QUEST_DATABASE.find(q => q.id === id);
    if (!def) return { success: false, message: '未知任务' };
    if (def.name.includes('.')) return { success: false, message: '任务名不能包含“.”' };

    const { store } = normalizeChatVariables(getVariables(CHAT_OPTION));
    if (store.quests?.[def.id] === 'CLAIMED') return { success: false, message: '该任务已完成并锁定' };

    const tasks = await MvuBridge.getTasks();
    if (!tasks) return { success: false, message: 'MVU 未就绪，无法接取任务' };

    const activeTaskNames = Object.entries(tasks).filter(
      ([, v]) => v && typeof v === 'object' && typeof (v as any).已完成 === 'boolean',
    );
    if (activeTaskNames.length >= 3) return { success: false, message: '同时最多只能接取3个任务' };
    if ((tasks as any)[def.name]) return { success: false, message: '该任务已在进行中' };

    try {
      await MvuBridge.setTask(def.name, {
        任务目标: def.target,
        任务描述: def.description,
        当前进度: '未开始',
        任务奖励: def.rewardText ?? `+${def.rewardMcEnergy} MC`,
        是否完成: false,
      });
      const after = await MvuBridge.getTasks();
      if (!after || !(def.name in after)) {
        return { success: false, message: '接取失败：任务未写入 MVU（请确认 MVU schema 已包含“任务”）' };
      }
      return { success: true };
    } catch (err) {
      console.warn('[HypnoOS] 接取任务写入失败', err);
      return { success: false, message: '接取失败：写入 MVU 出错' };
    }
  },

  cancelQuest: async (id: string): Promise<{ success: boolean; message?: string }> => {
    const def = QUEST_DATABASE.find(q => q.id === id);
    if (!def) return { success: false, message: '未知任务' };
    if (def.name.includes('.')) return { success: false, message: '任务名不能包含“.”' };

    const { store } = normalizeChatVariables(getVariables(CHAT_OPTION));
    if (store.quests?.[def.id] === 'CLAIMED') return { success: false, message: '该任务已完成并锁定' };

    const tasks = await MvuBridge.getTasks();
    if (!tasks) return { success: false, message: 'MVU 未就绪，无法取消任务' };

    if (!(def.name in (tasks as any))) return { success: false, message: '该任务未在进行中' };

    try {
      await MvuBridge.deleteTask(def.name);
      const after = await MvuBridge.getTasks();
      if (after && def.name in after) return { success: false, message: '取消失败：任务未从 MVU 删除' };
      return { success: true };
    } catch (err) {
      console.warn('[HypnoOS] 取消任务失败', err);
      return { success: false, message: '取消失败：写入 MVU 出错' };
    }
  },

  claimQuest: async (id: string, currentEnergy: number): Promise<{ success: boolean; newEnergy: number }> => {
    const def = QUEST_DATABASE.find(q => q.id === id);
    if (!def) return { success: false, newEnergy: currentEnergy };
    if (def.name.includes('.')) return { success: false, newEnergy: currentEnergy };

    const tasks = await MvuBridge.getTasks();
    if (!tasks) return { success: false, newEnergy: currentEnergy };
    const taskState = (tasks as any)[def.name];
    if (!taskState || typeof taskState !== 'object' || taskState.是否完成 !== true)
      return { success: false, newEnergy: currentEnergy };

    const user = await DataService.getUserData();
    const newEnergy = Math.min(user.mcEnergyMax, currentEnergy + def.rewardMcEnergy);
    await DataService.updateResources({ mcEnergy: newEnergy });
    await updateStoreWith(s => ({ ...s, quests: { ...s.quests, [id]: 'CLAIMED' } }));
    await MvuBridge.deleteTask(def.name);

    // 提交成功后，开启任务奖励对应的世界书条目（如「异次元公厕」）
    if (def.unlockWorldbookEntry) {
      try {
        await enableWorldbookEntryByName(def.unlockWorldbookEntry);
      } catch (err) {
        console.warn('[HypnoOS] 开启任务奖励世界书条目失败', err);
      }
    }

    return { success: true, newEnergy };
  },

  // --- 每日挑战 ---

  getChallenges: async (): Promise<GeneratedChallenge[]> => {
    const { store } = normalizeChatVariables(getVariables(CHAT_OPTION));
    const tasks = (await MvuBridge.getTasks().catch(() => null)) ?? {};

    return (store.challenges ?? []).map(c => {
      const taskState = (tasks as any)[c.name];
      const completed = Boolean(taskState && typeof taskState === 'object' && taskState.是否完成 === true);
      const active = Boolean(taskState && typeof taskState === 'object' && typeof taskState.是否完成 === 'boolean');
      const progress =
        taskState && typeof taskState === 'object' && typeof taskState.当前进度 === 'string'
          ? taskState.当前进度
          : active
            ? '进行中'
            : '未开始';
      return {
        id: c.id,
        name: c.name,
        target: c.target,
        description: c.description,
        reward: c.reward,
        progress,
        status: completed ? ('COMPLETED' as QuestStatus) : active ? ('ACTIVE' as QuestStatus) : ('AVAILABLE' as QuestStatus),
      };
    });
  },

  refreshChallenges: async (): Promise<{ ok: boolean; message?: string; challenges?: GeneratedChallenge[]; newMoney?: number }> => {
    const settings = loadSecondaryApiSettings();
    if (!isSecondaryApiConfigured(settings)) {
      return { ok: false, message: '副 API 未配置：请先在设置中开启多 API 模式并填写端点与模型' };
    }

    const user = await DataService.getUserData();
    if (user.money < CHALLENGE_COST) {
      return { ok: false, message: `金钱不足：刷新挑战需要 ¥${CHALLENGE_COST}` };
    }

    const result = await generateAndStoreChallenges(settings);
    if (!result.ok) return { ok: false, message: result.message };

    // 扣费（生成成功后才扣）
    const newMoney = user.money - CHALLENGE_COST;
    await DataService.updateResources({ money: newMoney });

    return { ok: true, challenges: await DataService.getChallenges(), newMoney };
  },

  ensureDailyRefresh: async (): Promise<boolean> => {
    const { store } = normalizeChatVariables(getVariables(CHAT_OPTION));
    if (store.lastChallengeRefreshDate === todayKey()) return false;

    const settings = loadSecondaryApiSettings();
    if (!isSecondaryApiConfigured(settings)) return false;

    // 跨天免费刷新（不扣费）
    const result = await generateAndStoreChallenges(settings);
    return result.ok;
  },

  acceptChallenge: async (id: string): Promise<{ success: boolean; message?: string }> => {
    const { store } = normalizeChatVariables(getVariables(CHAT_OPTION));
    const challenge = (store.challenges ?? []).find(c => c.id === id);
    if (!challenge) return { success: false, message: '未知挑战' };
    if (challenge.name.includes('.')) return { success: false, message: '任务名不能包含“.”' };

    const tasks = await MvuBridge.getTasks();
    if (!tasks) return { success: false, message: 'MVU 未就绪，无法接取任务' };

    const activeTaskNames = Object.entries(tasks).filter(
      ([, v]) => v && typeof v === 'object' && typeof (v as any).是否完成 === 'boolean',
    );
    if (activeTaskNames.length >= 3) return { success: false, message: '同时最多只能接取3个任务' };
    if ((tasks as any)[challenge.name]) return { success: false, message: '该挑战已在进行中' };

    try {
      await MvuBridge.setTask(challenge.name, {
        任务目标: challenge.target,
        任务描述: challenge.description,
        当前进度: '未开始',
        任务奖励: challenge.reward,
        是否完成: false,
      });
      const after = await MvuBridge.getTasks();
      if (!after || !(challenge.name in after)) {
        return { success: false, message: '接取失败：任务未写入 MVU（请确认 MVU schema 已包含“任务”）' };
      }
      return { success: true };
    } catch (err) {
      console.warn('[HypnoOS] 接取挑战失败', err);
      return { success: false, message: '接取失败：写入 MVU 出错' };
    }
  },

  cancelChallenge: async (id: string): Promise<{ success: boolean; message?: string }> => {
    const { store } = normalizeChatVariables(getVariables(CHAT_OPTION));
    const challenge = (store.challenges ?? []).find(c => c.id === id);
    if (!challenge) return { success: false, message: '未知挑战' };
    if (challenge.name.includes('.')) return { success: false, message: '任务名不能包含“.”' };

    const tasks = await MvuBridge.getTasks();
    if (!tasks) return { success: false, message: 'MVU 未就绪，无法取消任务' };
    if (!(challenge.name in (tasks as any))) return { success: false, message: '该挑战未在进行中' };

    try {
      await MvuBridge.deleteTask(challenge.name);
      const after = await MvuBridge.getTasks();
      if (after && challenge.name in after) return { success: false, message: '取消失败：任务未从 MVU 删除' };
      return { success: true };
    } catch (err) {
      console.warn('[HypnoOS] 取消挑战失败', err);
      return { success: false, message: '取消失败：写入 MVU 出错' };
    }
  },

  claimChallenge: async (id: string): Promise<{ success: boolean; message?: string; newMoney?: number }> => {
    const { store } = normalizeChatVariables(getVariables(CHAT_OPTION));
    const challenge = (store.challenges ?? []).find(c => c.id === id);
    if (!challenge) return { success: false, message: '未知挑战' };

    const tasks = await MvuBridge.getTasks();
    if (!tasks) return { success: false, message: 'MVU 未就绪' };
    const taskState = (tasks as any)[challenge.name];
    if (!taskState || typeof taskState !== 'object' || taskState.是否完成 !== true) {
      return { success: false, message: '任务尚未完成' };
    }

    const parsed = parseChallengeReward(challenge.reward);

    // 结算奖励（点击提交后才执行）
    const user = await DataService.getUserData();
    if (parsed?.kind === 'money') {
      const newMoney = user.money + parsed.amount;
      await DataService.updateResources({ money: newMoney });
    } else if (parsed?.kind === 'item') {
      try {
        await MvuBridge.setProtagonistItem(parsed.itemName, parsed.itemDescription);
      } catch (err) {
        console.warn('[HypnoOS] 挑战物品奖励写入失败', err);
      }
    }

    // 移除该挑战（从挑战池与 MVU）
    await MvuBridge.deleteTask(challenge.name);
    await updateStoreWith(s => ({
      ...s,
      challenges: (s.challenges ?? []).filter(c => c.id !== id),
    }));

    return {
      success: true,
      newMoney: parsed?.kind === 'money' ? user.money + parsed.amount : undefined,
    };
  },
};
