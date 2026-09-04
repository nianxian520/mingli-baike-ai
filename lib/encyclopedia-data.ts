/**
 * 命理百科数据
 *
 * 天干 / 地支 / 六十甲子 / 十神 / 五行 的结构化知识
 * 用于 /tiangan /dizhi /ganzhi /shishen /wuxing 静态百科页
 *
 * 数据来源：传统命理学经典（《滴天髓》《穷通宝典》《三命通会》等）
 * 仅作学术研究, 不构成决策建议
 */

import type { WuXing, YinYang } from '@/engine/types';
import { STEM_LIST, BRANCH_LIST } from '@/engine/types';

// ============ 五行 ============
export interface WuxingInfo {
  key: string; // 'wood' | 'fire' ...
  cn: string;
  color: string; // CSS color
  direction: string;
  season: string;
  sheng: string; // 所生
  ke: string; // 所克
  beiSheng: string; // 被生(生我)
  beiKe: string; // 被克(克我)
  nature: string; // 五行特性
  organs: string; // 对应脏腑
  emotions: string;
  description: string;
}

export const WUXING_INFO: WuxingInfo[] = [
  {
    key: 'wood',
    cn: '木',
    color: '#5C8D5A',
    direction: '东',
    season: '春',
    sheng: '火',
    ke: '土',
    beiSheng: '水',
    beiKe: '金',
    nature: '曲直',
    organs: '肝、胆',
    emotions: '怒',
    description:
      '木曰「曲直」，主仁，其性温和，有生发向上之德。木旺于春，代表东方、青色。木主肝胆，在志为怒。八字中木旺者，性格仁慈、有同情心，但过旺则固执、不知变通。',
  },
  {
    key: 'fire',
    cn: '火',
    color: '#C0392B',
    direction: '南',
    season: '夏',
    sheng: '土',
    ke: '金',
    beiSheng: '木',
    beiKe: '水',
    nature: '炎上',
    organs: '心、小肠',
    emotions: '喜',
    description:
      '火曰「炎上」，主礼，其性急躁，有光明向上之德。火旺于夏，代表南方、赤色。火主心，在志为喜。八字中火旺者，热情有礼、思维敏捷，但过旺则急躁冲动、缺乏耐性。',
  },
  {
    key: 'earth',
    cn: '土',
    color: '#B5895A',
    direction: '中',
    season: '四季月（辰戌丑未）',
    sheng: '金',
    ke: '水',
    beiSheng: '火',
    beiKe: '木',
    nature: '稼穑',
    organs: '脾、胃',
    emotions: '思',
    description:
      '土曰「稼穑」，主信，其性厚重，有承载包容之德。土旺于四季月（辰戌丑未），居中央、黄色。土主脾胃，在志为思。八字中土旺者，诚实守信、踏实稳重，但过旺则愚钝、不知变通。',
  },
  {
    key: 'metal',
    cn: '金',
    color: '#BFA89E',
    direction: '西',
    season: '秋',
    sheng: '水',
    ke: '木',
    beiSheng: '土',
    beiKe: '火',
    nature: '从革',
    organs: '肺、大肠',
    emotions: '悲',
    description:
      '金曰「从革」，主义，其性刚毅，有肃杀决断之德。金旺于秋，代表西方、白色。金主肺，在志为悲。八字中金旺者，刚毅果断、重义气，但过旺则好斗、刻薄寡恩。',
  },
  {
    key: 'water',
    cn: '水',
    color: '#2E5A88',
    direction: '北',
    season: '冬',
    sheng: '木',
    ke: '火',
    beiSheng: '金',
    beiKe: '土',
    nature: '润下',
    organs: '肾、膀胱',
    emotions: '恐',
    description:
      '水曰「润下」，主智，其性柔弱，有渗透流动之德。水旺于冬，代表北方、黑色。水主肾，在志为恐。八字中水旺者，聪明机智、足智多谋，但过旺则反复无常、缺乏主见。',
  },
];

export function findWuxing(key: string): WuxingInfo | undefined {
  return WUXING_INFO.find((w) => w.key === key);
}

// ============ 天干 ============
export interface TianganInfo {
  stem: string;
  pinyin: string;
  wuxing: WuXing;
  yinYang: YinYang;
  wuxingCn: string;
  direction: string;
  bodyPart: string;
  animalAssoc: string;
  nature: string; // 天干本性
  description: string;
  xiangYi: string; // 象义
}

export const TIANGAN_INFO: TianganInfo[] = [
  {
    stem: '甲',
    pinyin: 'jiǎ',
    wuxing: 'wood',
    yinYang: 'YANG',
    wuxingCn: '阳木',
    direction: '东方',
    bodyPart: '头、胆',
    animalAssoc: '乔木、参天大树',
    nature: '栋梁之木',
    description:
      '甲为阳木，参天大树之象，栋梁之材。位居东方，色青。性刚直，有领导力，如大树庇荫下物。在人体为头、为胆。',
    xiangYi: '甲木象征参天大树，性刚直、有领导力与庇护心。喜阳和雨露，忌金斧砍伐、火炎焚烧。',
  },
  {
    stem: '乙',
    pinyin: 'yǐ',
    wuxing: 'wood',
    yinYang: 'YIN',
    wuxingCn: '阴木',
    direction: '东方',
    bodyPart: '颈、肝',
    animalAssoc: '花草、藤蔓',
    nature: '花草之木',
    description:
      '乙为阴木，花草藤萝之象，柔韧盘绕。位居东方，色青。性柔和，有依附缠绕之德，如藤蔓附树而生。在人体为颈、为肝。',
    xiangYi: '乙木象征花草藤蔓，性柔韧、善依附。喜癸水滋润、丙火温暖，忌洪流冲刷、寒冬冰冻。',
  },
  {
    stem: '丙',
    pinyin: 'bǐng',
    wuxing: 'fire',
    yinYang: 'YANG',
    wuxingCn: '阳火',
    direction: '南方',
    bodyPart: '肩、小肠',
    animalAssoc: '太阳',
    nature: '太阳之火',
    description:
      '丙为阳火，太阳之象，光明普照。位居南方，色赤。性炽烈，有温暖万物之德，如日悬中天。在人体为肩、为小肠。',
    xiangYi: '丙火象征太阳，性炽烈、光明普照。喜壬水辉映，忌土多晦光、阴云遮蔽。',
  },
  {
    stem: '丁',
    pinyin: 'dīng',
    wuxing: 'fire',
    yinYang: 'YIN',
    wuxingCn: '阴火',
    direction: '南方',
    bodyPart: '心、舌',
    animalAssoc: '灯烛、星光',
    nature: '灯烛之火',
    description:
      '丁为阴火，灯烛之象，柔光内映。位居南方，色赤。性温柔，有照亮暗处之德，如烛火映人。在人体为心、为舌。',
    xiangYi: '丁火象征灯烛星光，性温柔、内照。喜甲木为薪，忌丙火夺光、强风吹灭。',
  },
  {
    stem: '戊',
    pinyin: 'wù',
    wuxing: 'earth',
    yinYang: 'YANG',
    wuxingCn: '阳土',
    direction: '中央',
    bodyPart: '胃、鼻',
    animalAssoc: '山岳、堤坝',
    nature: '城墙之土',
    description:
      '戊为阳土，山岳之象，厚重如墙。位居中央，色黄。性沉稳，有承载万物之德，如高山峻岭。在人体为胃、为鼻面。',
    xiangYi: '戊土象征山岳城墙，性厚重、可阻挡。喜丙火生扶，忌甲木冲破、壬水冲刷。',
  },
  {
    stem: '己',
    pinyin: 'jǐ',
    wuxing: 'earth',
    yinYang: 'YIN',
    wuxingCn: '阴土',
    direction: '中央',
    bodyPart: '脾、腹',
    animalAssoc: '田园之土',
    nature: '田园之土',
    description:
      '己为阴土，田园之象，湿润生养。位居中央，色黄。性柔和，有孕育万物之德，如沃土生苗。在人体为脾、为腹。',
    xiangYi: '己土象征田园沃土，性柔润、善生养。喜丙火温暖、癸水滋润，忌甲木过度克破、寒冷冻结。',
  },
  {
    stem: '庚',
    pinyin: 'gēng',
    wuxing: 'metal',
    yinYang: 'YANG',
    wuxingCn: '阳金',
    direction: '西方',
    bodyPart: '筋、大肠',
    animalAssoc: '顽铁、刀剑',
    nature: '刀剑之金',
    description:
      '庚为阳金，顽铁之象，刚硬锋利。位居西方，色白。性刚毅，有肃杀决断之德，如刀剑霜刃。在人体为筋、为大肠。',
    xiangYi: '庚金象征顽铁刀剑，性刚硬、主肃杀。喜丁火锻炼、甲木相伐，忌水土太多埋没锈蚀。',
  },
  {
    stem: '辛',
    pinyin: 'xīn',
    wuxing: 'metal',
    yinYang: 'YIN',
    wuxingCn: '阴金',
    direction: '西方',
    bodyPart: '肺、胸',
    animalAssoc: '珠玉、首饰',
    nature: '珠玉之金',
    description:
      '辛为阴金，珠玉之象，温润晶莹。位居西方，色白。性柔润，有润饰华美之德，如珠玉宝石。在人体为肺、为胸。',
    xiangYi: '辛金象征珠玉首饰，性温润、主华美。喜壬水洗涤，忌丙火焚烧、戊土埋没。',
  },
  {
    stem: '壬',
    pinyin: 'rén',
    wuxing: 'water',
    yinYang: 'YANG',
    wuxingCn: '阳水',
    direction: '北方',
    bodyPart: '膀胱、胫',
    animalAssoc: '江河、海洋',
    nature: '江河之水',
    description:
      '壬为阳水，江河之象，滔滔奔流。位居北方，色黑。性汹涌，有润泽万物之德，如大江东去。在人体为膀胱、为胫。',
    xiangYi: '壬水象征江河海洋，性汹涌、奔流不息。喜戊土堤防、丙火映辉，忌乙木泄气、己土混浊。',
  },
  {
    stem: '癸',
    pinyin: 'guǐ',
    wuxing: 'water',
    yinYang: 'YIN',
    wuxingCn: '阴水',
    direction: '北方',
    bodyPart: '肾、足',
    animalAssoc: '雨露、泉水',
    nature: '雨露之水',
    description:
      '癸为阴水，雨露之象，润物无声。位居北方，色黑。性柔弱，有渗透滋养之德，如朝露润物。在人体为肾、为足。',
    xiangYi: '癸水象征雨露泉水，性柔弱、润物无声。喜辛金生源，忌丙火干涸、戊土阻隔。',
  },
];

export function findTiangan(stem: string): TianganInfo | undefined {
  return TIANGAN_INFO.find((t) => t.stem === stem);
}

// ============ 地支 ============
export interface DizhiInfo {
  branch: string;
  pinyin: string;
  wuxing: WuXing;
  wuxingCn: string;
  animal: string; // 生肖
  direction: string;
  hour: string; // 时辰
  month: string; // 农历月
  hiddenStems: string[]; // 藏干
  nature: string;
  description: string;
}

export const DIZHI_INFO: DizhiInfo[] = [
  {
    branch: '子',
    pinyin: 'zǐ',
    wuxing: 'water',
    wuxingCn: '阴水',
    animal: '鼠',
    direction: '正北',
    hour: '23:00-01:00（子时）',
    month: '农历十一月（冬月）',
    hiddenStems: ['癸'],
    nature: '墨池、溪流',
    description: '子为阴水，方位正北，生肖鼠，时辰夜半。藏干癸水。在节气为冬至所在月，一阳初生之地。',
  },
  {
    branch: '丑',
    pinyin: 'chǒu',
    wuxing: 'earth',
    wuxingCn: '阴土',
    animal: '牛',
    direction: '东北偏北',
    hour: '01:00-03:00（丑时）',
    month: '农历十二月（腊月）',
    hiddenStems: ['己', '癸', '辛'],
    nature: '冻土、田园',
    description: '丑为阴土，方位东北，生肖牛，时辰鸡鸣。藏干己癸辛（土水金）。隆冬之土，冻而待春。',
  },
  {
    branch: '寅',
    pinyin: 'yín',
    wuxing: 'wood',
    wuxingCn: '阳木',
    animal: '虎',
    direction: '东北偏东',
    hour: '03:00-05:00（寅时）',
    month: '农历正月（立春起）',
    hiddenStems: ['甲', '丙', '戊'],
    nature: '参天大树',
    description: '寅为阳木，方位东北，生肖虎，时辰平旦。藏干甲丙戊（木火土）。立春所在，三阳开泰之始。',
  },
  {
    branch: '卯',
    pinyin: 'mǎo',
    wuxing: 'wood',
    wuxingCn: '阴木',
    animal: '兔',
    direction: '正东',
    hour: '05:00-07:00（卯时）',
    month: '农历二月（惊蛰起）',
    hiddenStems: ['乙'],
    nature: '花草、林木',
    description: '卯为阴木，方位正东，生肖兔，时辰日出。藏干乙木。春分所在，木气最旺之时。',
  },
  {
    branch: '辰',
    pinyin: 'chén',
    wuxing: 'earth',
    wuxingCn: '阳土',
    animal: '龙',
    direction: '东南偏东',
    hour: '07:00-09:00（辰时）',
    month: '农历三月（清明起）',
    hiddenStems: ['戊', '乙', '癸'],
    nature: '湿土、水库',
    description: '辰为阳土，方位东南，生肖龙，时辰食时。藏干戊乙癸（土木水）。春季之末，为水之库。',
  },
  {
    branch: '巳',
    pinyin: 'sì',
    wuxing: 'fire',
    wuxingCn: '阴火',
    animal: '蛇',
    direction: '东南偏南',
    hour: '09:00-11:00（巳时）',
    month: '农历四月（立夏起）',
    hiddenStems: ['丙', '庚', '戊'],
    nature: '炉火、灯火',
    description: '巳为阴火，方位东南，生肖蛇，时辰隅中。藏干丙庚戊（火金土）。立夏所在，火气初生。',
  },
  {
    branch: '午',
    pinyin: 'wǔ',
    wuxing: 'fire',
    wuxingCn: '阳火',
    animal: '马',
    direction: '正南',
    hour: '11:00-13:00（午时）',
    month: '农历五月（芒种起）',
    hiddenStems: ['丁', '己'],
    nature: '烈日、灶火',
    description: '午为阳火，方位正南，生肖马，时辰日中。藏干丁己（火土）。夏至所在，火气最旺，一阴初生之地。',
  },
  {
    branch: '未',
    pinyin: 'wèi',
    wuxing: 'earth',
    wuxingCn: '阴土',
    animal: '羊',
    direction: '西南偏南',
    hour: '13:00-15:00（未时）',
    month: '农历六月（小暑起）',
    hiddenStems: ['己', '丁', '乙'],
    nature: '燥土、田园',
    description: '未为阴土，方位西南，生肖羊，时辰日昳。藏干己丁乙（土火木）。夏季之末，木之库。',
  },
  {
    branch: '申',
    pinyin: 'shēn',
    wuxing: 'metal',
    wuxingCn: '阳金',
    animal: '猴',
    direction: '西南偏西',
    hour: '15:00-17:00（申时）',
    month: '农历七月（立秋起）',
    hiddenStems: ['庚', '壬', '戊'],
    nature: '顽铁、刀剑',
    description: '申为阳金，方位西南，生肖猴，时辰哺时。藏干庚壬戊（金水土）。立秋所在，金气初生。',
  },
  {
    branch: '酉',
    pinyin: 'yǒu',
    wuxing: 'metal',
    wuxingCn: '阴金',
    animal: '鸡',
    direction: '正西',
    hour: '17:00-19:00（酉时）',
    month: '农历八月（白露起）',
    hiddenStems: ['辛'],
    nature: '珠玉、首饰',
    description: '酉为阴金，方位正西，生肖鸡，时辰日入。藏干辛金。秋分所在，金气最旺。',
  },
  {
    branch: '戌',
    pinyin: 'xū',
    wuxing: 'earth',
    wuxingCn: '阳土',
    animal: '狗',
    direction: '西北偏西',
    hour: '19:00-21:00（戌时）',
    month: '农历九月（寒露起）',
    hiddenStems: ['戊', '辛', '丁'],
    nature: '燥土、城墙',
    description: '戌为阳土，方位西北，生肖狗，时辰黄昏。藏干戊辛丁（土金火）。秋季之末，火之库。',
  },
  {
    branch: '亥',
    pinyin: 'hài',
    wuxing: 'water',
    wuxingCn: '阴水',
    animal: '猪',
    direction: '西北偏北',
    hour: '21:00-23:00（亥时）',
    month: '农历十月（立冬起）',
    hiddenStems: ['壬', '甲'],
    nature: '江河、湖海',
    description: '亥为阴水，方位西北，生肖猪，时辰人定。藏干壬甲（水木）。立冬所在，水气初生。',
  },
];

export function findDizhi(branch: string): DizhiInfo | undefined {
  return DIZHI_INFO.find((d) => d.branch === branch);
}

// ============ 六十甲子 ============
export interface GanzhiInfo {
  ganzhi: string;
  stem: string;
  branch: string;
  index: number; // 1-60
  nanyin: string;
  nanyinElement: string; // 纳音五行
  xun: string; // 旬
  kongWang: string[]; // 空亡
}

// 六十甲子纳音表 (传统)
const NANYIN_TABLE: { ganzhi: string; nanyin: string }[] = [
  { ganzhi: '甲子', nanyin: '海中金' }, { ganzhi: '乙丑', nanyin: '海中金' },
  { ganzhi: '丙寅', nanyin: '炉中火' }, { ganzhi: '丁卯', nanyin: '炉中火' },
  { ganzhi: '戊辰', nanyin: '大林木' }, { ganzhi: '己巳', nanyin: '大林木' },
  { ganzhi: '庚午', nanyin: '路旁土' }, { ganzhi: '辛未', nanyin: '路旁土' },
  { ganzhi: '壬申', nanyin: '剑锋金' }, { ganzhi: '癸酉', nanyin: '剑锋金' },
  { ganzhi: '甲戌', nanyin: '山头火' }, { ganzhi: '乙亥', nanyin: '山头火' },
  { ganzhi: '丙子', nanyin: '涧下水' }, { ganzhi: '丁丑', nanyin: '涧下水' },
  { ganzhi: '戊寅', nanyin: '城头土' }, { ganzhi: '己卯', nanyin: '城头土' },
  { ganzhi: '庚辰', nanyin: '白蜡金' }, { ganzhi: '辛巳', nanyin: '白蜡金' },
  { ganzhi: '壬午', nanyin: '杨柳木' }, { ganzhi: '癸未', nanyin: '杨柳木' },
  { ganzhi: '甲申', nanyin: '泉中水' }, { ganzhi: '乙酉', nanyin: '泉中水' },
  { ganzhi: '丙戌', nanyin: '屋上土' }, { ganzhi: '丁亥', nanyin: '屋上土' },
  { ganzhi: '戊子', nanyin: '霹雳火' }, { ganzhi: '己丑', nanyin: '霹雳火' },
  { ganzhi: '庚寅', nanyin: '松柏木' }, { ganzhi: '辛卯', nanyin: '松柏木' },
  { ganzhi: '壬辰', nanyin: '长流水' }, { ganzhi: '癸巳', nanyin: '长流水' },
  { ganzhi: '甲午', nanyin: '砂中金' }, { ganzhi: '乙未', nanyin: '砂中金' },
  { ganzhi: '丙申', nanyin: '山下火' }, { ganzhi: '丁酉', nanyin: '山下火' },
  { ganzhi: '戊戌', nanyin: '平地木' }, { ganzhi: '己亥', nanyin: '平地木' },
  { ganzhi: '庚子', nanyin: '壁上土' }, { ganzhi: '辛丑', nanyin: '壁上土' },
  { ganzhi: '壬寅', nanyin: '金箔金' }, { ganzhi: '癸卯', nanyin: '金箔金' },
  { ganzhi: '甲辰', nanyin: '覆灯火' }, { ganzhi: '乙巳', nanyin: '覆灯火' },
  { ganzhi: '丙午', nanyin: '天河水' }, { ganzhi: '丁未', nanyin: '天河水' },
  { ganzhi: '戊申', nanyin: '大驿土' }, { ganzhi: '己酉', nanyin: '大驿土' },
  { ganzhi: '庚戌', nanyin: '钗钏金' }, { ganzhi: '辛亥', nanyin: '钗钏金' },
  { ganzhi: '壬子', nanyin: '桑柘木' }, { ganzhi: '癸丑', nanyin: '桑柘木' },
  { ganzhi: '甲寅', nanyin: '大溪水' }, { ganzhi: '乙卯', nanyin: '大溪水' },
  { ganzhi: '丙辰', nanyin: '沙中土' }, { ganzhi: '丁巳', nanyin: '沙中土' },
  { ganzhi: '戊午', nanyin: '天上火' }, { ganzhi: '己未', nanyin: '天上火' },
  { ganzhi: '庚申', nanyin: '石榴木' }, { ganzhi: '辛酉', nanyin: '石榴木' },
  { ganzhi: '壬戌', nanyin: '大海水' }, { ganzhi: '癸亥', nanyin: '大海水' },
];

const NANYIN_ELEMENT_MAP: Record<string, string> = {
  '金': 'metal', '木': 'wood', '水': 'water', '火': 'fire', '土': 'earth',
};

const XUN_LIST = ['甲子旬', '甲戌旬', '甲申旬', '甲午旬', '甲辰旬', '甲寅旬'];

function buildGanzhiList(): GanzhiInfo[] {
  return NANYIN_TABLE.map((item, i) => {
    const index = i + 1;
    const stem = item.ganzhi[0];
    const branch = item.ganzhi[1];
    const xunIdx = Math.floor(i / 10);
    const xun = XUN_LIST[xunIdx];
    // 空亡: 每旬中有两个地支为空亡
    const kongWang = KONGWANG_TABLE[xunIdx];
    const nanyinElement = NANYIN_ELEMENT_MAP[item.nanyin[item.nanyin.length - 1]] ?? 'earth';
    return {
      ganzhi: item.ganzhi,
      stem,
      branch,
      index,
      nanyin: item.nanyin,
      nanyinElement,
      xun,
      kongWang,
    };
  });
}

const KONGWANG_TABLE: string[][] = [
  ['戌', '亥'], // 甲子旬
  ['申', '酉'], // 甲戌旬
  ['午', '未'], // 甲申旬
  ['辰', '巳'], // 甲午旬
  ['寅', '卯'], // 甲辰旬
  ['子', '丑'], // 甲寅旬
];

export const GANZHI_LIST: GanzhiInfo[] = buildGanzhiList();

export function findGanzhi(ganzhi: string): GanzhiInfo | undefined {
  return GANZHI_LIST.find((g) => g.ganzhi === ganzhi);
}

// ============ 十神 ============
export interface ShishenInfo {
  key: string; // URL key
  cn: string;
  pinyin: string;
  alias: string;
  relation: string; // 与日主的关系
  nature: string; // 性质
  category: 'positive' | 'negative' | 'neutral';
  description: string;
  characteristics: string[];
}

export const SHISHEN_INFO: ShishenInfo[] = [
  {
    key: 'bi-jian',
    cn: '比肩',
    pinyin: 'bǐ jiān',
    alias: '比',
    relation: '与日主同类同阴阳（如甲见甲）',
    nature: '助身、夺财',
    category: 'neutral',
    description:
      '比肩为与日主同类同阴阳之干。如同辈兄弟，助身亦夺财。代表自我、同辈、竞争者。比肩旺则自尊心强、独立，过旺则固执、破财。',
    characteristics: ['自尊心强', '独立自主', '竞争意识', '重义气', '易破财'],
  },
  {
    key: 'jie-cai',
    cn: '劫财',
    pinyin: 'jié cái',
    alias: '劫',
    relation: '与日主同类异阴阳（如甲见乙）',
    nature: '助身、夺财（更甚）',
    category: 'negative',
    description:
      '劫财为与日主同类异阴阳之干。如异性兄弟，助身而夺财更甚。代表竞争对手、合伙人、异性同辈。劫财旺则热情好胜，过旺则克妻克父、破耗不断。',
    characteristics: ['热情好胜', '冒险投机', '易克妻父', '合伙破财', '重情义'],
  },
  {
    key: 'shi-shen',
    cn: '食神',
    pinyin: 'shí shén',
    alias: '食',
    relation: '日主所生同阴阳（如甲见丙）',
    nature: '泄身、生财、制杀',
    category: 'positive',
    description:
      '食神为日主所生同阴阳之干。如子女晚辈，泄秀生财。代表才华、口福、子女。食神旺则聪明温和、有才艺，过旺则懒散贪图安逸。',
    characteristics: ['聪明温和', '有才艺', '口福好', '多子女', '乐天安命'],
  },
  {
    key: 'shang-guan',
    cn: '伤官',
    pinyin: 'shāng guān',
    alias: '伤',
    relation: '日主所生异阴阳（如甲见丁）',
    nature: '泄身、克官',
    category: 'negative',
    description:
      '伤官为日主所生异阴阳之干。如叛逆子女，泄秀而克官。代表才华横溢、叛逆、口才。伤官旺则聪明过人、敢创新，过旺则傲慢、是非多、克官（事业不顺）。',
    characteristics: ['聪明过人', '才华横溢', '叛逆桀骜', '口才犀利', '克官惹非'],
  },
  {
    key: 'pian-cai',
    cn: '偏财',
    pinyin: 'piān cái',
    alias: '财',
    relation: '日主所克同阴阳（如甲见戊）',
    nature: '耗身、得财',
    category: 'positive',
    description:
      '偏财为日主所克同阴阳之干。如意外之财、众人之财。代表横财、父、交际。偏财旺则慷慨大方、善交际，过旺则虚耗、克母、不利婚姻。',
    characteristics: ['慷慨大方', '善交际', '易得横财', '代表父亲', '易有外遇'],
  },
  {
    key: 'zheng-cai',
    cn: '正财',
    pinyin: 'zhèng cái',
    alias: '财',
    relation: '日主所克异阴阳（如甲见己）',
    nature: '耗身、得财（正当）',
    category: 'positive',
    description:
      '正财为日主所克异阴阳之干。如正当收入、妻子。代表工资、妻、勤俭。正财旺则勤劳节俭、顾家，过旺则吝啬、无大志、溺于物质。',
    characteristics: ['勤劳节俭', '顾家', '代表妻子', '务实', '易守财'],
  },
  {
    key: 'qi-sha',
    cn: '七杀',
    pinyin: 'qī shā',
    alias: '杀',
    relation: '克日主同阴阳（如甲见庚）',
    nature: '克身、权威',
    category: 'negative',
    description:
      '七杀为克日主同阴阳之干，又称偏官。如上司、敌人。代表权威、压力、武职。七杀旺则有魄力、敢冒险，过旺则多灾、克身、性格暴躁。',
    characteristics: ['有魄力', '敢冒险', '多灾厄', '性格刚硬', '宜武职'],
  },
  {
    key: 'zheng-guan',
    cn: '正官',
    pinyin: 'zhèng guān',
    alias: '官',
    relation: '克日主异阴阳（如甲见辛）',
    nature: '克身（温和）、约束',
    category: 'positive',
    description:
      '正官为克日主异阴阳之干。如上司、丈夫。代表事业、名声、夫（女命）。正官旺则正直守纪、有官运，过旺则胆小拘谨、压力重。',
    characteristics: ['正直守纪', '有官运', '代表丈夫(女命)', '重名誉', '易受约束'],
  },
  {
    key: 'pian-yin',
    cn: '偏印',
    pinyin: 'piān yìn',
    alias: '枭',
    relation: '生日主同阴阳（如甲见壬）',
    nature: '生身、夺食',
    category: 'negative',
    description:
      '偏印为生日主同阴阳之干，又称枭神。如继母。代表学业、偏门学问、孤独。偏印旺则聪明内向、善思考，过旺则孤僻、夺食、多愁善感。',
    characteristics: ['聪明内向', '善思考', '偏门学问', '孤僻', '夺食'],
  },
  {
    key: 'zheng-yin',
    cn: '正印',
    pinyin: 'zhèng yìn',
    alias: '印',
    relation: '生日主异阴阳（如甲见癸）',
    nature: '生身、护身',
    category: 'positive',
    description:
      '正印为生日主异阴阳之干。如母亲。代表学业、名誉、庇护。正印旺则仁慈善良、学业有成，过旺则依赖、缺乏主见、溺于安逸。',
    characteristics: ['仁慈善良', '学业有成', '代表母亲', '有庇护', '易依赖'],
  },
];

export function findShishen(key: string): ShishenInfo | undefined {
  return SHISHEN_INFO.find((s) => s.key === key);
}

// ============ 工具函数 ============
export function isValidStem(s: string): boolean {
  return (STEM_LIST as readonly string[]).includes(s);
}
export function isValidBranch(s: string): boolean {
  return (BRANCH_LIST as readonly string[]).includes(s);
}
export function isValidGanzhi(s: string): boolean {
  return GANZHI_LIST.some((g) => g.ganzhi === s);
}
export function isValidWuxing(s: string): boolean {
  return ['wood', 'fire', 'earth', 'metal', 'water'].includes(s);
}
export function isValidShishenKey(s: string): boolean {
  return SHISHEN_INFO.some((x) => x.key === s);
}
