/**
 * 五行统计与日主强弱判定
 *
 * 统计范围:
 * - 四柱天干 × 4 (明字)
 * - 四柱地支本气 × 4
 * - 四柱地支藏干 (中气/余气按权重减半)
 *
 * 日主强弱判定 (简化版, 子平"得令/得地/得势"三原则):
 * - 得令: 日干五行与月令地支五行相同或受生
 * - 得地: 日干在地支有根 (本气/中气/余气)
 * - 得势: 日干在天干有同类或生扶
 *
 * 产出: strength ∈ {WANG旺, XIANG相, PING平, RUO弱, JUE绝}
 *
 * 后续可由 RuleEngine 基于更精确规则覆盖此值
 */

import type { WuXing, DayMasterStrength } from './types';
import { STEM_WUXING, STEM_YINYANG, BRANCH_ELEM_MAP } from './types';

// 地支藏干表 (本气, 中气, 余气)
export const BRANCH_HIDDEN: Record<string, string[]> = {
  子: ['癸'],
  丑: ['己', '辛', '癸'],
  寅: ['甲', '丙', '戊'],
  卯: ['乙'],
  辰: ['戊', '乙', '癸'],
  巳: ['丙', '庚', '戊'],
  午: ['丁', '己'],
  未: ['己', '丁', '乙'],
  申: ['庚', '壬', '戊'],
  酉: ['辛'],
  戌: ['戊', '辛', '丁'],
  亥: ['壬', '甲'],
};

const FIVE_ELEMENTS: WuXing[] = ['wood', 'fire', 'earth', 'metal', 'water'];

// 生克关系
export function generates(a: WuXing, b: WuXing): boolean {
  return (
    (a === 'wood' && b === 'fire') ||
    (a === 'fire' && b === 'earth') ||
    (a === 'earth' && b === 'metal') ||
    (a === 'metal' && b === 'water') ||
    (a === 'water' && b === 'wood')
  );
}

export function restrains(a: WuXing, b: WuXing): boolean {
  return (
    (a === 'wood' && b === 'earth') ||
    (a === 'earth' && b === 'water') ||
    (a === 'water' && b === 'fire') ||
    (a === 'fire' && b === 'metal') ||
    (a === 'metal' && b === 'wood')
  );
}

export interface WuxingCountResult {
  count: Record<WuXing, number>;
  percentage: Record<WuXing, number>;
  missing: WuXing[];
  dominant: WuXing[];
}

/** 统计五行力量 (天干各1分, 本气1分, 中气0.5分, 余气0.3分) */
export function countWuxing(
  stems: { stem: string }[],
  branches: { branch: string }[],
): WuxingCountResult {
  const count: Record<WuXing, number> = {
    wood: 0, fire: 0, earth: 0, metal: 0, water: 0,
  };

  // 天干 1 分
  for (const { stem } of stems) {
    const w = STEM_WUXING[stem];
    if (w) count[w] += 1;
  }

  // 地支: 本气 1, 中气 0.5, 余气 0.3
  const weights = [1, 0.5, 0.3];
  for (const { branch } of branches) {
    const hidden = BRANCH_HIDDEN[branch] ?? [];
    hidden.forEach((stem, idx) => {
      const w = STEM_WUXING[stem];
      if (w) count[w] += weights[idx] ?? 0.3;
    });
  }

  const total = Object.values(count).reduce((a, b) => a + b, 0) || 1;
  const percentage: Record<WuXing, number> = {
    wood: Math.round((count.wood / total) * 1000) / 10,
    fire: Math.round((count.fire / total) * 1000) / 10,
    earth: Math.round((count.earth / total) * 1000) / 10,
    metal: Math.round((count.metal / total) * 1000) / 10,
    water: Math.round((count.water / total) * 1000) / 10,
  };

  const missing = FIVE_ELEMENTS.filter((e) => count[e] === 0);
  const maxCount = Math.max(...Object.values(count));
  const dominant = FIVE_ELEMENTS.filter((e) => count[e] === maxCount && maxCount > 0);

  return { count, percentage, missing, dominant };
}

/**
 * 日主强弱判定 (简化版)
 *
 * @param dayStem 日干
 * @param monthBranch 月令地支
 * @param allStems 四柱所有天干
 * @param allBranches 四柱所有地支
 */
export function determineDayMasterStrength(
  dayStem: string,
  monthBranch: string,
  allStems: string[],
  allBranches: string[],
): DayMasterStrength {
  const dayElem = STEM_WUXING[dayStem];
  if (!dayElem) return 'PING';

  // 1. 得令: 日干五行与月令本气/藏干五行同或受月令生
  const monthElem = BRANCH_ELEM_MAP[monthBranch];
  const monthHidden = (BRANCH_HIDDEN[monthBranch] ?? []).map((s) => STEM_WUXING[s]);
  const lingScore = // 得令分
    (monthElem === dayElem ? 3 : 0) +
    (generates(monthElem, dayElem) ? 2 : 0) +
    monthHidden.filter((e) => e === dayElem || (e && generates(e, dayElem))).length;

  // 2. 得地: 日干在地支藏干有根
  const diScore = allBranches.reduce((sum, br) => {
    const hidden = BRANCH_HIDDEN[br] ?? [];
    return sum + hidden.filter((s) => STEM_WUXING[s] === dayElem).length;
  }, 0);

  // 3. 得势: 日干在天干有同类或生扶
  const shiScore = allStems.filter(
    (s) => s !== dayStem && (STEM_WUXING[s] === dayElem || generates(STEM_WUXING[s]!, dayElem)),
  ).length;

  const total = lingScore * 2 + diScore + shiScore;

  // 阈值 (经验值, 可调)
  if (total >= 12) return 'WANG';
  if (total >= 8) return 'XIANG';
  if (total >= 4) return 'PING';
  if (total >= 1) return 'RUO';
  return 'JUE';
}

/** 判断日主阴阳 */
export function getDayMasterYinYang(dayStem: string): 'YIN' | 'YANG' {
  return STEM_YINYANG[dayStem] ?? 'YANG';
}
