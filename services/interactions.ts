/**
 * 刑冲合害检测模块
 *
 * 输入: 四柱地支(年/月/日/时)
 * 输出: 7 类交互(combinations/clashes/punishments/harms/breaks/meetings)
 *
 * 命理学规则(标准):
 * - 六合: 子丑/寅亥/卯戌/辰酉/巳申/午未
 * - 三合: 申子辰(水)/寅午戌(火)/巳酉丑(金)/亥卯未(木)
 * - 三会(方局): 寅卯辰(木)/巳午未(火)/申酉戌(金)/亥子丑(水)
 * - 六冲: 子午/丑未/寅申/卯酉/辰戌/巳亥
 * - 三刑: 寅巳申/丑戌未/子卯/辰午酉亥自刑
 * - 六害: 子未/丑午/寅巳/卯辰/申亥/酉戌
 * - 破: 子酉/丑辰/寅亥/卯午/巳申/未戌
 *
 * 说明: 化气五行(子丑合化土等)在 description 中标注, 不参与逻辑
 */

import type { Interaction, InteractionType, PillarPos } from '@/engine/types';

type Branches = Record<PillarPos, string | null>;

const POS_LIST: PillarPos[] = ['year', 'month', 'day', 'hour'];

// ============ 命理关系表 ============

const SIX_HARMONY: Array<[string, string, string]> = [
  ['子', '丑', '合化土'],
  ['寅', '亥', '合化木'],
  ['卯', '戌', '合化火'],
  ['辰', '酉', '合化金'],
  ['巳', '申', '合化水'],
  ['午', '未', '合化'],
];

const TRIPLE_HARMONY: Array<[string, string, string, string]> = [
  ['申', '子', '辰', '合化水'],
  ['寅', '午', '戌', '合化火'],
  ['巳', '酉', '丑', '合化金'],
  ['亥', '卯', '未', '合化木'],
];

const THREE_DIRECTION: Array<[string, string, string, string]> = [
  ['寅', '卯', '辰', '会木方'],
  ['巳', '午', '未', '会火方'],
  ['申', '酉', '戌', '会金方'],
  ['亥', '子', '丑', '会水方'],
];

const SIX_CLASH: Array<[string, string]> = [
  ['子', '午'], ['丑', '未'], ['寅', '申'],
  ['卯', '酉'], ['辰', '戌'], ['巳', '亥'],
];

const THREE_PUNISHMENT: Array<[string, string, string]> = [
  ['寅', '巳', '申'], // 无恩之刑
  ['丑', '戌', '未'], // 恃势之刑
];

const TWO_PUNISHMENT: Array<[string, string]> = [
  ['子', '卯'], // 无礼之刑
];

const SELF_PUNISHMENT: string[] = ['辰', '午', '酉', '亥'];

const SIX_HARM: Array<[string, string]> = [
  ['子', '未'], ['丑', '午'], ['寅', '巳'],
  ['卯', '辰'], ['申', '亥'], ['酉', '戌'],
];

const SIX_BREAK: Array<[string, string]> = [
  ['子', '酉'], ['丑', '辰'], ['寅', '亥'],
  ['卯', '午'], ['巳', '申'], ['未', '戌'],
];

// ============ 工具函数 ============

/** 从四柱中取所有柱位+地支的对 */
function branchPairs(b: Branches): { pos: [PillarPos, PillarPos]; branches: [string, string] }[] {
  const present = POS_LIST.filter((p) => b[p] !== null) as PillarPos[];
  const result: { pos: [PillarPos, PillarPos]; branches: [string, string] }[] = [];
  for (let i = 0; i < present.length; i++) {
    for (let j = i + 1; j < present.length; j++) {
      const a = present[i];
      const c = present[j];
      result.push({ pos: [a, c], branches: [b[a]!, b[c]!] });
    }
  }
  return result;
}

function containsBoth(set: string[], a: string, b: string): boolean {
  return set.includes(a) && set.includes(b);
}

function containsAll(set: string[], required: string[]): boolean {
  return required.every((r) => set.includes(r));
}

function mkInteraction(
  type: InteractionType,
  positions: PillarPos[],
  branches: string[],
  description: string,
): Interaction {
  return { type, positions, branches, description };
}

// ============ 主检测函数 ============

export function detectInteractions(b: Branches): {
  combinations: Interaction[];
  clashes: Interaction[];
  punishments: Interaction[];
  harms: Interaction[];
  breaks: Interaction[];
  meetings: Interaction[];
} {
  const combinations: Interaction[] = [];
  const meetings: Interaction[] = [];
  const clashes: Interaction[] = [];
  const punishments: Interaction[] = [];
  const harms: Interaction[] = [];
  const breaks: Interaction[] = [];

  // 所有出现的柱位+地支
  const present = POS_LIST.filter((p) => b[p] !== null) as PillarPos[];
  const allBranches = present.map((p) => b[p]!);
  const allBranchSet = [...new Set(allBranches)];

  // ----- 六合 (两两) -----
  for (const { pos, branches } of branchPairs(b)) {
    for (const [x, y, suffix] of SIX_HARMONY) {
      if (containsBoth(branches, x, y)) {
        combinations.push(
          mkInteraction('COMBINATION_2', [...pos].sort((a, c) => POS_LIST.indexOf(a) - POS_LIST.indexOf(c)), branches, `${branches.join('')}${suffix}`),
        );
      }
    }
    // 六冲
    for (const [x, y] of SIX_CLASH) {
      if (containsBoth(branches, x, y)) {
        clashes.push(mkInteraction('CLASH', pos, branches, `${branches.join('')}冲`));
      }
    }
    // 六害
    for (const [x, y] of SIX_HARM) {
      if (containsBoth(branches, x, y)) {
        harms.push(mkInteraction('HARM', pos, branches, `${branches.join('')}害`));
      }
    }
    // 六破
    for (const [x, y] of SIX_BREAK) {
      if (containsBoth(branches, x, y)) {
        breaks.push(mkInteraction('BREAK', pos, branches, `${branches.join('')}破`));
      }
    }
    // 子卯相刑
    for (const [x, y] of TWO_PUNISHMENT) {
      if (containsBoth(branches, x, y)) {
        punishments.push(mkInteraction('PUNISHMENT', pos, branches, `${branches.join('')}相刑`));
      }
    }
  }

  // ----- 三合 -----
  for (const [x, y, z, suffix] of TRIPLE_HARMONY) {
    if (containsAll(allBranchSet, [x, y, z])) {
      const positions = present.filter((p) => [x, y, z].includes(b[p]!));
      combinations.push(
        mkInteraction('COMBINATION_3', positions, [x, y, z], `${x}${y}${z}${suffix}`),
      );
    } else {
      // 半合 (任意两个)
      for (const { pos, branches } of branchPairs(b)) {
        const subset = [x, y, z].filter((e) => branches.includes(e));
        if (subset.length === 2 && (subset.includes(y))) {
          combinations.push(
            mkInteraction('HALF_COMBINATION', pos, branches, `${branches.join('')}半合${suffix}`),
          );
        }
      }
    }
  }

  // ----- 三会(方局) -----
  for (const [x, y, z, suffix] of THREE_DIRECTION) {
    if (containsAll(allBranchSet, [x, y, z])) {
      const positions = present.filter((p) => [x, y, z].includes(b[p]!));
      meetings.push(
        mkInteraction('COMBINATION_3_DIRECTION', positions, [x, y, z], `${x}${y}${z}${suffix}`),
      );
    }
  }

  // ----- 三刑(三支) -----
  for (const [x, y, z] of THREE_PUNISHMENT) {
    if (containsAll(allBranchSet, [x, y, z])) {
      const positions = present.filter((p) => [x, y, z].includes(b[p]!));
      punishments.push(
        mkInteraction('PUNISHMENT', positions, [x, y, z], `${x}${y}${z}三刑`),
      );
    }
  }

  // ----- 自刑(同柱位重复出现) -----
  const seen = new Map<string, PillarPos[]>();
  for (const p of present) {
    const br = b[p]!;
    if (SELF_PUNISHMENT.includes(br)) {
      seen.set(br, [...(seen.get(br) ?? []), p]);
    }
  }
  for (const [br, positions] of seen) {
    if (positions.length >= 2) {
      punishments.push(
        mkInteraction('PUNISHMENT', positions, positions.map(() => br), `${br}${br}自刑`),
      );
    }
  }

  return { combinations, clashes, punishments, harms, breaks, meetings };
}
