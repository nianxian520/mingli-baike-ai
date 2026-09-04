/**
 * 八字计算引擎输出类型 (BaziJson)
 *
 * 设计原则:
 * - 完全确定性: 相同输入永远产生相同输出
 * - 零解释文本: 此结构不含任何自然语言解释, 解释由 AI/规则引擎单独生成
 * - JSON 可序列化: 可直接存入 Prisma BaziChart.fullJson
 *
 * 对应文档: §七 Bazi JSON Schema
 */

// ============ 柱位 ============
export type PillarPos = 'year' | 'month' | 'day' | 'hour';

// ============ 五行 ============
export type WuXing = 'wood' | 'fire' | 'earth' | 'metal' | 'water';
// 中文五行名 (用于展示, 不参与逻辑)
export const WUXING_CN: Record<WuXing, string> = {
  wood: '木',
  fire: '火',
  earth: '土',
  metal: '金',
  water: '水',
};

// ============ 阴阳 ============
export type YinYang = 'YIN' | 'YANG';

// ============ 日主强弱 ============
export type DayMasterStrength = 'WANG' | 'XIANG' | 'PING' | 'RUO' | 'JUE';
export const STRENGTH_CN: Record<DayMasterStrength, string> = {
  WANG: '旺',
  XIANG: '相',
  PING: '平',
  RUO: '弱',
  JUE: '绝',
};

// ============ 一柱 ============
export interface Pillar {
  ganzhi: string; // "甲子"
  stem: string; // "甲"
  branch: string; // "子"
  stemElement: WuXing;
  branchElement: WuXing;
  nanyin: string; // 纳音 "海中金"
  shishen: string; // 该柱天干相对日干的十神
  changSheng: string; // 十二长生状态
}

// ============ 十神行 ============
export interface TenGodRow {
  stem: string;
  branch: string;
  stemTenGod: string; // 天干十神
  branchTenGod: string; // 地支本气十神
  branchHidden: { stem: string; tenGod: string }[]; // 藏干十神
}

// ============ 刑冲合害 ============
export type InteractionType =
  | 'COMBINATION_2' // 六合
  | 'COMBINATION_3' // 三合
  | 'COMBINATION_3_DIRECTION' // 三会(方局)
  | 'HALF_COMBINATION' // 半合
  | 'CLASH' // 冲
  | 'PUNISHMENT' // 刑
  | 'HARM' // 害
  | 'BREAK'; // 破

export interface Interaction {
  type: InteractionType;
  positions: PillarPos[];
  branches: string[];
  description: string; // "子丑合化土" 等(纯描述, 不参与匹配)
}

// ============ 大运 ============
export interface DaYunEntry {
  index: number;
  ganzhi: string;
  stem: string;
  branch: string;
  startAge: number;
  endAge: number;
  startYear: number;
  endYear: number;
}

export interface LiuNianEntry {
  year: number;
  age: number;
  ganzhi: string;
  stem: string;
  branch: string;
}

// ============ BaziJson 顶层结构 ============
export interface BaziJson {
  meta: {
    engine: 'lunar-javascript';
    engineVersion: string;
    calculatedAt: string; // ISO8601
    inputHash: string;
    solarTimeCorrected: boolean;
  };
  input: {
    gender: 'MALE' | 'FEMALE';
    solar: { year: number; month: number; day: number; hour: number; minute: number };
    lunar: {
      year: number;
      month: number;
      day: number;
      isLeapMonth: boolean;
      monthName: string;
      dayName: string;
    };
    location: { longitude: number; latitude: number; timezone: string; placeName?: string };
    solarTime: {
      originalHour: number;
      originalMinute: number;
      offsetMin: number;
      correctedHour: number;
      correctedMinute: number;
      dayRolled: boolean;
    };
  };
  jieqi: {
    current: { name: string; time: string };
    previous: { name: string; time: string };
    next: { name: string; time: string };
  };
  pillars: {
    year: Pillar;
    month: Pillar;
    day: Pillar;
    hour: Pillar | null;
  };
  dayMaster: {
    stem: string;
    element: WuXing;
    yinYang: YinYang;
    strength: DayMasterStrength;
  };
  wuxing: {
    count: Record<WuXing, number>;
    percentage: Record<WuXing, number>;
    missing: WuXing[];
    dominant: WuXing[];
  };
  tenGods: {
    year: TenGodRow;
    month: TenGodRow;
    day: TenGodRow;
    hour: TenGodRow | null;
  };
  nanyin: { year: string; month: string; day: string; hour: string | null };
  hiddenStems: {
    year: string[];
    month: string[];
    day: string[];
    hour: string[] | null;
  };
  interactions: {
    combinations: Interaction[];
    clashes: Interaction[];
    punishments: Interaction[];
    harms: Interaction[];
    breaks: Interaction[];
    meetings: Interaction[];
  };
  daYun: {
    direction: 'FORWARD' | 'BACKWARD';
    startAge: number;
    startYear: number;
    entries: DaYunEntry[];
  };
  liuNian: LiuNianEntry[]; // 当前大运下 10 流年(默认)
  shenSha: {
    year: string[];
    month: string[];
    day: string[];
    hour: string[] | null;
  };
  pattern: {
    name: string | null;
    description: string;
  };
  xiYong: {
    xiShen: WuXing[];
    yongShen: WuXing[];
    jiShen: WuXing[];
    method: string;
  };
}

// ============ 常量映射 ============
export const STEM_LIST = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
export const BRANCH_LIST = [
  '子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥',
] as const;
export const STEMS = [...STEM_LIST];
export const BRANCHES = [...BRANCH_LIST];

// 天干五行属性 (甲乙木, 丙丁火, 戊己土, 庚辛金, 壬癸水)
export const STEM_WUXING: Record<string, WuXing> = {
  甲: 'wood', 乙: 'wood',
  丙: 'fire', 丁: 'fire',
  戊: 'earth', 己: 'earth',
  庚: 'metal', 辛: 'metal',
  壬: 'water', 癸: 'water',
};

// 天干阴阳
export const STEM_YINYANG: Record<string, YinYang> = {
  甲: 'YANG', 丙: 'YANG', 戊: 'YANG', 庚: 'YANG', 壬: 'YANG',
  乙: 'YIN', 丁: 'YIN', 己: 'YIN', 辛: 'YIN', 癸: 'YIN',
};

// 地支五行属性
export const BRANCH_WUXING: Record<string, WuXing> = {
  寅卯: 'wood' as never, // placeholder, 真实映射见下方
} as Record<string, WuXing>;
// 地支五行 (真实映射)
export const BRANCH_ELEM_MAP: Record<string, WuXing> = {
  寅: 'wood', 卯: 'wood', 辰: 'earth',
  巳: 'fire', 午: 'fire', 未: 'earth',
  申: 'metal', 酉: 'metal', 戌: 'earth',
  亥: 'water', 子: 'water', 丑: 'earth',
};
