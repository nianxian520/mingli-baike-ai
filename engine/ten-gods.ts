/**
 * 十神计算
 *
 * 以日干为主, 计算其他天干/地支本气/藏干相对日干的十神
 *
 * 十神规则:
 * - 同我(同五行): 比肩(同阴阳)/劫财(异阴阳)
 * - 我生(食伤): 食神(同阴阳)/伤官(异阴阳)
 * - 我克(财星): 偏财(同阴阳)/正财(异阴阳)
 * - 克我(官杀): 七杀(同阴阳)/正官(异阴阳)
 * - 生我(印星): 偏印(同阴阳)/正印(异阴阳)
 */

import { STEM_WUXING, STEM_YINYANG, type WuXing } from './types';
import { generates, restrains, BRANCH_HIDDEN } from './wuxing';

const STEMS_10 = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

/**
 * 计算任意天干相对日干的十神
 *
 * @param dayGan 日干
 * @param targetGan 目标天干
 */
export function getTenGod(dayGan: string, targetGan: string): string {
  if (dayGan === targetGan) return '比肩';
  const dayElem = STEM_WUXING[dayGan];
  const targetElem = STEM_WUXING[targetGan];
  const dayYinYang = STEM_YINYANG[dayGan];
  const targetYinYang = STEM_YINYANG[targetGan];
  const sameYinYang = dayYinYang === targetYinYang;

  if (!dayElem || !targetElem) return '';

  // 同五行 → 比肩/劫财
  if (dayElem === targetElem) {
    return sameYinYang ? '比肩' : '劫财';
  }
  // 我生 → 食神/伤官
  if (generates(dayElem, targetElem)) {
    return sameYinYang ? '食神' : '伤官';
  }
  // 我克 → 偏财/正财
  if (restrains(dayElem, targetElem)) {
    return sameYinYang ? '偏财' : '正财';
  }
  // 克我 → 七杀/正官
  if (restrains(targetElem, dayElem)) {
    return sameYinYang ? '七杀' : '正官';
  }
  // 生我 → 偏印/正印
  if (generates(targetElem, dayElem)) {
    return sameYinYang ? '偏印' : '正印';
  }
  return '';
}

/**
 * 计算地支相对日干的十神 (取本气十神)
 * @param dayGan 日干
 * @param branch 地支
 */
export function getBranchTenGod(dayGan: string, branch: string): string {
  const hidden = BRANCH_HIDDEN[branch] ?? [];
  if (hidden.length === 0) return '';
  return getTenGod(dayGan, hidden[0]); // 本气
}

/**
 * 计算一柱完整的十神行
 */
export interface TenGodRowResult {
  stem: string;
  branch: string;
  stemTenGod: string;
  branchTenGod: string;
  branchHidden: { stem: string; tenGod: string }[];
}

export function computeTenGodRow(
  dayGan: string,
  stem: string,
  branch: string,
): TenGodRowResult {
  const hidden = BRANCH_HIDDEN[branch] ?? [];
  return {
    stem,
    branch,
    stemTenGod: getTenGod(dayGan, stem),
    branchTenGod: hidden.length ? getTenGod(dayGan, hidden[0]) : '',
    branchHidden: hidden.map((s) => ({ stem: s, tenGod: getTenGod(dayGan, s) })),
  };
}

/** 生成"日干 → 十神 → 天干"反查表 (用于喜用神等) */
export function getStemsByTenGod(
  dayGan: string,
): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const stem of STEMS_10) {
    if (stem === dayGan) continue;
    const tg = getTenGod(dayGan, stem);
    if (!result[tg]) result[tg] = [];
    result[tg].push(stem);
  }
  return result;
}
