/**
 * 喜用神判定 (简化版, 子平"扶抑法")
 *
 * 实际生产中喜用神判定极其复杂, 需考虑:
 * - 日主旺衰
 * - 月令
 * - 五行平衡
 * - 寒燥平衡
 * - 格局
 *
 * 本简化版规则:
 * - 日主旺: 用克/泄/耗 (官杀/食伤/财)
 * - 日主弱: 用生/扶 (印星/比劫)
 * - 极旺: 顺其势 (用官杀或食伤泄秀)
 * - 极弱: 从势 (用财官, 忌印比)
 *
 * 后续可由 RuleEngine 用更精细规则覆盖
 */

import type { WuXing, DayMasterStrength } from './types';
import { generates, restrains } from './wuxing';

export interface XiYongResult {
  xiShen: WuXing[]; // 喜神
  yongShen: WuXing[]; // 用神
  jiShen: WuXing[]; // 忌神
  method: string;
}

const FIVE: WuXing[] = ['wood', 'fire', 'earth', 'metal', 'water'];

export function determineXiYong(
  dayElem: WuXing,
  strength: DayMasterStrength,
): XiYongResult {
  // 同我(比劫): 与日主同五行
  const sameElem = dayElem;
  // 生我(印星): 生日主的五行
  const motherElem = FIVE.find((e) => generates(e, dayElem))!;
  // 我生(食伤): 日主生的五行
  const childElem = FIVE.find((e) => generates(dayElem, e))!;
  // 我克(财星): 日主克的五行
  const wealthElem = FIVE.find((e) => restrains(dayElem, e))!;
  // 克我(官杀): 克日主的五行
  const officerElem = FIVE.find((e) => restrains(e, dayElem))!;

  switch (strength) {
    case 'WANG':
      // 旺: 用克泄耗
      return {
        xiShen: [childElem, wealthElem],
        yongShen: [officerElem],
        jiShen: [sameElem, motherElem],
        method: '旺则泄之耗之, 忌生扶',
      };
    case 'XIANG':
      // 相(偏旺): 同上略弱
      return {
        xiShen: [childElem, officerElem],
        yongShen: [wealthElem],
        jiShen: [sameElem, motherElem],
        method: '偏旺则克泄, 忌生扶',
      };
    case 'PING':
      // 平: 用平衡, 倾向印比
      return {
        xiShen: [motherElem, sameElem],
        yongShen: [motherElem],
        jiShen: [officerElem],
        method: '中和取印比平衡',
      };
    case 'RUO':
      // 弱: 用生扶
      return {
        xiShen: [motherElem, sameElem],
        yongShen: [motherElem],
        jiShen: [officerElem, wealthElem, childElem],
        method: '弱则生之扶之, 忌克泄耗',
      };
    case 'JUE':
      // 绝: 从势, 反用财官
      return {
        xiShen: [wealthElem, officerElem],
        yongShen: [officerElem],
        jiShen: [motherElem, sameElem],
        method: '极弱从势, 用财官, 忌印比',
      };
    default:
      return {
        xiShen: [motherElem],
        yongShen: [motherElem],
        jiShen: [],
        method: '默认中和',
      };
  }
}
