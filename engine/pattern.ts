/**
 * 格局判定 (简化版, 基于月令透干)
 *
 * 子平真诠规则: 看月令所藏之神, 透干与否定格局
 * 月令本气透干 → 对应十神格
 *
 * 八大正格:
 * - 正官格 / 七杀格 / 正财格 / 偏财格
 * - 正印格 / 偏印格 / 食神格 / 伤官格
 *
 * 特殊格:
 * - 建禄格 (月令本气=比肩)
 * - 月刃格 (月令本气=劫财)
 *
 * 简化: 仅取月令本气十神, 不处理杂气/变格/特殊格
 */

import { BRANCH_HIDDEN } from './wuxing';
import { getTenGod } from './ten-gods';

export interface PatternResult {
  name: string | null;
  description: string;
}

export function determinePattern(
  dayGan: string,
  monthBranch: string,
  yearGan: string,
  dayGan2: string,
  hourGan: string | null,
): PatternResult {
  const hidden = BRANCH_HIDDEN[monthBranch] ?? [];
  if (hidden.length === 0) {
    return { name: null, description: '月令无藏干, 无法定格' };
  }

  // 月令本气十神
  const mainQi = hidden[0];
  const mainQiTenGod = getTenGod(dayGan, mainQi);

  // 检查是否透干 (本气或中气/余气出现在天干)
  const stems = [yearGan, dayGan2, hourGan].filter(Boolean) as string[];
  const transparent = hidden.filter((h) => stems.includes(h));

  let patternName: string | null = null;
  let description = `月令${monthBranch}, 本气${mainQi}, 十神${mainQiTenGod}`;

  if (transparent.length > 0) {
    // 优先取透出的藏干对应的十神
    const firstTransparent = transparent[0];
    const tg = getTenGod(dayGan, firstTransparent);
    switch (tg) {
      case '正官': patternName = '正官格'; break;
      case '七杀': patternName = '七杀格'; break;
      case '正财': patternName = '正财格'; break;
      case '偏财': patternName = '偏财格'; break;
      case '正印': patternName = '正印格'; break;
      case '偏印': patternName = '偏印格'; break;
      case '食神': patternName = '食神格'; break;
      case '伤官': patternName = '伤官格'; break;
      case '比肩': patternName = '建禄格'; break;
      case '劫财': patternName = '月刃格'; break;
    }
    description += `, 透${firstTransparent}(${tg})`;
  } else {
    patternName = mainQiTenGod ? `${mainQiTenGod}格` : null;
    description += ', 未透干, 取本气定格';
  }

  return { name: patternName, description };
}
