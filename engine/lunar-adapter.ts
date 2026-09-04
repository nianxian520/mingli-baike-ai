/**
 * lunar-javascript 适配层
 *
 * 封装 lunar-javascript 的 API, 屏蔽其内部细节, 对外暴露稳定的中文命名方法
 *
 * 依赖: lunar-javascript (MIT, 6tail)
 * 文档: https://6tail.cn/calendar/api.html
 *
 * 注意: lunar-javascript 的 TS 类型不完整, 这里使用宽松类型 (Record<string, any>)
 */

import { Solar, Lunar, EightChar } from 'lunar-javascript';
import type { Pillar } from './types';
import { STEM_WUXING, BRANCH_ELEM_MAP } from './types';

// lunar-javascript 内部对象类型 (宽松)
type AnyObj = Record<string, any>;

export interface LunarAdaptedData {
  solar: Solar;
  lunar: Lunar;
  eightChar: EightChar;
}

/** 创建适配数据 (从已校正的 UTC Date) */
export function fromUtcDate(utcDate: Date): LunarAdaptedData {
  // lunar-javascript 接受本地 Date, 会用 Date 的本地时区
  // 我们传入的 utcDate 是 UTC, 需要构造一个"看上去是北京时间"的 Date
  // 因为 lunar-javascript 内部会调用 new Date() 的本地方法
  // 解决: 转换为表示北京时间的 Date, 让 lunar 用本地时区读取
  // 最稳妥: 直接传 utcDate, lunar-javascript 会按 Date 的本地表示处理
  // 这里我们要求调用方传入的 utcDate 已经是"实际八字时间"对应的 UTC 时刻
  const solar = Solar.fromDate(utcDate);
  const lunar = solar.getLunar();
  const eightChar = lunar.getEightChar();
  return { solar, lunar, eightChar };
}

// ============ 单柱提取 ============

/** 从 EightChar 的某柱对象(年/月/日/时)提取 Pillar 结构 */
export function extractPillar(
  pillarObj: AnyObj,
  dayGan: string,
): Pillar {
  const gan = pillarObj.getGan() as string; // 天干
  const zhi = pillarObj.getZhi() as string; // 地支
  const ganzhi = pillarObj.getGanZhi() as string;
  const nanyin = pillarObj.getNaYin() as string;
  // 该柱天干相对日干的十神 (日干本身为"日主")
  const shishen = gan === dayGan ? '日主' : pillarObj.getShiShenGan() as string;
  // 十二长生 (lunar 用 getDiShi / getChangShengSpirt, 这里用 getDiShi)
  let changSheng = '';
  try {
    changSheng = String(pillarObj.getDiShi?.() ?? '');
  } catch {
    changSheng = '';
  }

  return {
    ganzhi,
    stem: gan,
    branch: zhi,
    stemElement: STEM_WUXING[gan] ?? 'earth',
    branchElement: BRANCH_ELEM_MAP[zhi] ?? 'earth',
    nanyin: nanyin || '',
    shishen,
    changSheng,
  };
}

/** 提取藏干 (lunar 的 getHideGan 返回 string[]) */
export function extractHiddenStems(pillarObj: AnyObj): string[] {
  try {
    const hide = pillarObj.getHideGan();
    if (Array.isArray(hide)) return hide as string[];
    if (typeof hide === 'string') return hide.split('');
    return [];
  } catch {
    return [];
  }
}

// ============ 节气 ============

export interface JieQiInfo {
  current: { name: string; time: string };
  previous: { name: string; time: string };
  next: { name: string; time: string };
}

/** 提取当前/前一个/下一个节气 */
export function extractJieQi(lunar: Lunar): JieQiInfo {
  // lunar.getJieQi() 返回当前节气名
  // lunar.getJieQiTable() 返回所有节气时间 {name: 'yyyy-mm-dd hh:mm:ss'}
  const currentName = String(lunar.getJieQi() ?? '');
  const table = lunar.getJieQiTable() as Record<string, string>;

  // 排序所有节气时间, 找到当前的前后
  const sortedNames = Object.keys(table).filter((k) => table[k]);
  // 节气顺序(简化处理: 按时间字符串排序)
  // lunar 的 table 值是 'yyyy-mm-dd hh:mm:ss' 字符串, 直接排序
  const sorted = sortedNames.sort((a, b) => (table[a] < table[b] ? -1 : 1));
  const currentIdx = sorted.indexOf(currentName);

  let prev: { name: string; time: string };
  let next: { name: string; time: string };

  if (currentIdx === -1) {
    // 当前不在节气点上, 用 lunar.getCurrentJieQi() 获取
    // 简化: 用最近的过去节气 + 最近的将来节气
    prev = { name: sorted[sorted.length - 1] ?? '', time: table[sorted[sorted.length - 1]] ?? '' };
    next = { name: sorted[0] ?? '', time: table[sorted[0]] ?? '' };
  } else {
    prev = {
      name: sorted[(currentIdx - 1 + sorted.length) % sorted.length] ?? '',
      time: table[sorted[(currentIdx - 1 + sorted.length) % sorted.length]] ?? '',
    };
    next = {
      name: sorted[(currentIdx + 1) % sorted.length] ?? '',
      time: table[sorted[(currentIdx + 1) % sorted.length]] ?? '',
    };
  }

  return {
    current: { name: currentName, time: table[currentName] ?? '' },
    previous: prev,
    next,
  };
}

// ============ 农历 ============

export interface LunarInfo {
  year: number;
  month: number;
  day: number;
  isLeapMonth: boolean;
  monthName: string;
  dayName: string;
}

export function extractLunar(lunar: Lunar): LunarInfo {
  // lunar.getMonth() 返回负数表示闰月 (如 -6 表示闰六月)
  const rawMonth = lunar.getMonth() as number;
  const isLeapMonth = rawMonth < 0;
  const month = Math.abs(rawMonth);
  return {
    year: lunar.getYear() as number,
    month,
    day: lunar.getDay() as number,
    isLeapMonth,
    monthName: lunar.getMonthInChinese() as string,
    dayName: lunar.getDayInChinese() as string,
  };
}

// ============ 神煞 ============

export function extractShenSha(lunar: Lunar, ec: EightChar) {
  // 各柱神煞
  const get = (obj: AnyObj): string[] => {
    try {
      const arr = obj?.getShenSha?.();
      if (Array.isArray(arr)) return arr.map(String);
      if (typeof arr === 'string') return arr.split(/[，,、]/).filter(Boolean);
      return [];
    } catch {
      return [];
    }
  };
  return {
    year: get(ec.getYear()),
    month: get(ec.getMonth()),
    day: get(ec.getDay()),
    hour: get(ec.getTime()),
  };
}
