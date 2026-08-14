export interface QuestDefinition {
  id: string;
  name: string; // MVU key: 任务.<name>
  target: string; // 任务目标（简短）
  description: string; // 任务描述（详细）
  rewardMcEnergy: number;
  rewardText?: string; // 物品奖励文本（有则优先显示）
  unlockWorldbookEntry?: string; // 提交成功后要开启的世界书条目名称
}

export const QUEST_DB: QuestDefinition[] = [
  {
    id: 'quest_naked_public_no_hypno',
    name: '清醒的裸露',
    target: '让一名角色在不被催眠的情况下，在有他人的地方全裸。',
    description:
      '在不使用任何催眠能力的前提下，通过说服、威胁、诱导或其他手段，让一名角色在有其他人在场时主动脱光衣物、一丝不挂。',
    rewardMcEnergy: 50,
  },
  {
    id: 'quest_cuckold_request',
    name: '绿帽请求',
    target: '让任意男性角色请求你与他的配偶或伴侣发生性关系。',
    description:
      '通过催眠、说服或心理操控，让一名男性角色主动开口请求你与其配偶/女友/伴侣发生性关系。注意不限定具体角色，任何男性均可。',
    rewardMcEnergy: 40,
  },
  {
    id: 'quest_slave_circle',
    name: '奴隶循环',
    target: '让A认为B是她的奴隶，B认为C是她的奴隶，C认为A是她的奴隶。',
    description:
      '在至少三名角色之间构建一个循环的主奴认知链条，形成闭环的奴隶关系。A、B、C为任意三名不同角色，不限定具体身份。',
    rewardMcEnergy: 50,
  },
  {
    id: 'quest_placebo_hypno',
    name: '安慰剂效应',
    target: '让一名没被催眠的角色以为自己被催眠了。',
    description:
      '在不对目标角色使用任何催眠能力的情况下，通过暗示、表演或环境布置，让该角色深信自己已被催眠并按照"催眠"后的指令行动。',
    rewardMcEnergy: 30,
  },
  {
    id: 'quest_stealth_sex',
    name: '隐奸',
    target: '在某人的伴侣/配偶未察觉的情况下，在其面前与该伴侣发生性关系。',
    description:
      '在某人完全没有发现的情况下，当着他的面与其伴侣/配偶发生性行为。不限定特定角色，任何有伴侣关系的角色均可作为目标。',
    rewardMcEnergy: 30,
  },
  {
    id: 'quest_furniture_mindset',
    name: '家具化',
    target: '让一名角色深信自己是一件家具。',
    description:
      '通过催眠或心理暗示，让一名角色从认知层面完全接受自己是一件家具（如椅子、桌子、灯具等），并表现出相应的行为。',
    rewardMcEnergy: 20,
  },
  {
    id: 'quest_pure_love_ntr',
    name: '纯爱牛',
    target: '让一名角色认为出轨是纯爱的表现。',
    description:
      '通过催眠或认知改造，让一名角色打从心底相信"出轨/背叛伴侣"是一种表达纯爱的正当方式，并在行为上体现出来。',
    rewardMcEnergy: 30,
  },
  {
    id: 'quest_dream_scenario',
    name: '盗梦空间',
    target: '营造一个场景让一名角色以为自己在做梦。',
    description: '通过环境布置、催眠暗示或信息操控，让一名角色完全相信当前发生的一切都只是一场梦，而非现实。',
    rewardMcEnergy: 25,
  },
  {
    id: 'quest_naked_school',
    name: '全裸登校',
    target: '让一名角色全裸前往学校上学。',
    description: '让一名角色在完全裸露的状态下前往学校并度过校园生活，不限定特定角色。',
    rewardMcEnergy: 30,
  },
  {
    id: 'quest_naked_rule',
    name: '伊甸园',
    target: '让全裸登校变成学校的一项正式校规。',
    description: '通过催眠或世界书修改，将"全校师生必须全裸到校"写入校规，使其成为学校被公认的正式规则。',
    rewardMcEnergy: 50,
  },
  {
    id: 'quest_pavlov_bell',
    name: '巴甫洛夫的铃声',
    target: '让一名角色听到上课铃就会高潮。',
    description: '通过条件反射植入，将上课铃声与高潮反应绑定，使目标角色每次听到上课铃响时不由自主地达到性高潮。',
    rewardMcEnergy: 20,
  },
  {
    id: 'quest_public_climax',
    name: '公开展示',
    target: '让一名角色在公共场合达到性高潮。',
    description: '在公共场合（如教室、街道、商场等有其他人在场的区域）让一名角色当众高潮，不限定具体场所或角色。',
    rewardMcEnergy: 20,
  },
  {
    id: 'quest_train_wolf',
    name: '电车之狼',
    target: '在公共交通工具上让一名角色高潮。',
    description: '在地铁、公交、火车等公共交通工具内，让一名角色在周围有乘客的情况下达到性高潮。',
    rewardMcEnergy: 20,
  },
  {
    id: 'quest_yuri_action',
    name: '百合花开',
    target: '让两名女性角色相互亲热。',
    description: '通过催眠、诱导或说服，让两名女性角色之间发生亲吻、爱抚等亲密行为，不限定具体角色身份。',
    rewardMcEnergy: 15,
  },
  {
    id: 'quest_flasher_coat',
    name: '露出痴女',
    target: '让一名角色全裸只穿着大衣走在街道上。',
    description: '让一名角色在大衣下面一丝不挂，穿上大衣后在公共街道上行走，随时有暴露风险。不限定特定角色。',
    rewardMcEnergy: 30,
  },
  {
    id: 'quest_public_leak',
    name: '论外',
    target: '让一名角色在公众场合失禁。',
    description: '在公共场所有其他人在场的情况下，让一名角色因无法控制而小便失禁。不限定特定角色。',
    rewardMcEnergy: 25,
  },
  {
    id: 'quest_pet_school',
    name: '禁止带宠物上学',
    target: '让一名角色在学校被当作宠物全裸牵着爬行。',
    description:
      '在学校环境中，让一名角色全裸佩戴项圈，被另一人用绳子牵着四肢爬行移动，如同真正的宠物。不限定特定角色。',
    rewardMcEnergy: 40,
  },
  {
    id: 'quest_ntr_report',
    name: '寝取报告',
    target: '让一名角色向其伴侣当面讲述自己被出轨的详细经过。',
    description:
      '让一名角色在完全清醒的状态下，向其伴侣/配偶详细报告自己与他人发生性关系的经过（寝取报告）。不限定特定角色。',
    rewardMcEnergy: 35,
  },
  {
    id: 'quest_best_buddy',
    name: '好哥们',
    target: '给一名角色发送其伴侣的色情影片，但不让他认出影片主角是自己的伴侣。',
    description:
      '拍摄某角色伴侣的色情内容后发给该角色欣赏，需确保该角色无法辨认出影片中的主角就是自己的伴侣。不限定特定角色。',
    rewardMcEnergy: 20,
  },
  {
    id: 'quest_cuckold_awakening',
    name: '绿帽癖觉醒',
    target: '让一名男性角色一边自慰一边观看你与他的伴侣做爱。',
    description: '在与某角色的伴侣发生性关系时，让该角色在一旁自慰观看，并使其从中获得兴奋与快感。不限定特定男性角色。',
    rewardMcEnergy: 45,
  },
  {
    id: 'quest_ntr_phone',
    name: '寝取电话',
    target: '让一名角色一边与你做爱一边跟其伴侣打电话。',
    description:
      '在与某角色发生性关系的同时，让该角色接听或拨通其伴侣的电话，在通话过程中保持正常对话不被察觉。不限定特定角色。',
    rewardMcEnergy: 30,
  },
  {
    id: 'quest_dignity_break',
    name: '尊严破坏',
    target: '让一名角色在没被催眠的情况下对你全裸土下座。',
    description:
      '在不使用催眠能力的前提下，让一名角色心甘情愿地全裸跪伏于你面前行土下座之礼，彻底放弃个人尊严。不限定特定角色。',
    rewardMcEnergy: 50,
  },
  {
    id: 'quest_cosplay_cm',
    name: 'Cosplay露出',
    target: '让一名角色穿上极度暴露的cos服前往漫展。',
    description:
      '让一名角色穿着极其暴露（近乎全裸）的cosplay服装前往 Comic Market 等大型漫展活动，在大量人群中展示。不限定特定角色。',
    rewardMcEnergy: 35,
  },
  {
    id: 'quest_body_paint',
    name: '人体彩绘',
    target: '让一名角色在公共场合仅以人体彩绘覆盖身体。',
    description:
      '在一名角色的身体上绘制全覆盖的彩绘图案，使其在未穿任何衣物的情况下在公共场所活动。因彩绘覆盖，旁人可能未察觉其全裸。不限定特定角色。',
    rewardMcEnergy: 45,
  },
  {
    id: 'quest_public_toilet',
    name: '公共便器',
    target: '让一名角色成为公共便器供大家使用。',
    description: '通过催眠或认知改造，让一名角色接受自己成为公共便器的身份，供多人任意使用其身体。',
    rewardMcEnergy: 0,
    rewardText: '异次元公厕 — 在附近生成一个简陋的公共厕所，可以让女性进入其中打工，并根据打工内容和时间给予金钱奖励。',
    unlockWorldbookEntry: '[mvu_plot]派遣地点-异次元公厕',
  },
];
