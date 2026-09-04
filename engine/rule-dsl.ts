/**
 * Rule Engine 条件 DSL
 *
 * 设计原则:
 * - 纯声明式 JSON, 无 eval/new Function, 确定性
 * - 每个条件原子可独立单元测试
 * - 可被 services/rule-engine.ts 直接执行
 *
 * 对应文档: §八 Rule Engine 设计
 */

import type { PillarPos, InteractionType, WuXing, DayMasterStrength } from './types';

// ============ 条件原子类型 ============
export type Condition =
  | { op: 'AND'; children: Condition[] }
  | { op: 'OR'; children: Condition[] }
  | { op: 'NOT'; child: Condition }
  | { op: 'EQ'; path: string; value: unknown }
  | { op: 'IN'; path: string; values: unknown[] }
  | { op: 'CONTAINS'; path: string; value: unknown }
  | { op: 'STEM_IS'; position: PillarPos; stem: string }
  | { op: 'BRANCH_IS'; position: PillarPos; branch: string }
  | { op: 'GANZHI_IS'; position: PillarPos; ganzhi: string }
  | { op: 'HAS_INTERACTION'; type: InteractionType; positions?: PillarPos[] }
  | { op: 'WUXING_MISSING'; elements: WuXing[] }
  | { op: 'WUXING_DOMINANT'; elements: WuXing[] }
  | { op: 'TEN_GOD_AT'; position: PillarPos; tenGod: string }
  | { op: 'DAY_MASTER_STRENGTH'; level: DayMasterStrength }
  | { op: 'PATTERN_IS'; pattern: string }
  | { op: 'DAYUN_PILLAR'; ganzhi?: string; stem?: string; branch?: string }
  | { op: 'LIUNIAN_PILLAR'; year?: number; ganzhi?: string }
  | { op: 'XIYONG_INCLUDES'; elements: WuXing[] };

export const CONDITION_OPS = [
  'AND', 'OR', 'NOT',
  'EQ', 'IN', 'CONTAINS',
  'STEM_IS', 'BRANCH_IS', 'GANZHI_IS',
  'HAS_INTERACTION',
  'WUXING_MISSING', 'WUXING_DOMINANT',
  'TEN_GOD_AT',
  'DAY_MASTER_STRENGTH',
  'PATTERN_IS',
  'DAYUN_PILLAR',
  'LIUNIAN_PILLAR',
  'XIYONG_INCLUDES',
] as const;

// ============ 匹配结果 ============
export interface MatchedStatementRef {
  code: string;
  statement: string;
  source?: string;
  confidence: number;
}

export interface MatchedRule {
  ruleCode: string;
  ruleName: string;
  category: string;
  priority: number;
  confidence: number;
  statements: MatchedStatementRef[];
}
