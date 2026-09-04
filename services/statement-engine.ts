/**
 * Statement Engine · 命理断语匹配引擎
 *
 * 职责:
 * - 接收 MatchedRule[] (从 RuleEngine)
 * - 收集规则关联的断语 (通过 RuleStatement)
 * - 补充: 断语自带 conditions 也命中 (条件 DSL 复用 RuleEngine)
 * - 合并去重, 按 priority/confidence 排序
 *
 * 设计:
 * - 复用 RuleEngine.evalCondition 评估断语自带条件
 * - 支持两种数据源: Prisma (生产) / 内存 (测试)
 *
 * 对应文档: §八 StatementEngine
 */

import type { PrismaClient, Statement } from '@prisma/client';
import type { BaziJson } from '@/engine/types';
import type { Condition, MatchedRule, MatchedStatementRef } from '@/engine/rule-dsl';
import { RuleEngine } from './rule-engine';

export interface MatchedStatement extends MatchedStatementRef {
  subcategory?: string | null;
  tags: string[];
  interpretation?: string | null;
  // 来源规则 code (便于追溯)
  fromRules: string[];
}

export class StatementEngine {
  private ruleEngine: RuleEngine;

  constructor(private prisma?: PrismaClient) {
    // 复用 RuleEngine 的 evalCondition 来评估断语自带条件
    this.ruleEngine = prisma ? new RuleEngine(prisma) : new RuleEngine();
  }

  /**
   * 生产模式: 从 Prisma 加载断语自带条件 + 合并规则关联断语
   */
  async match(
    bazi: BaziJson,
    matchedRules: MatchedRule[],
    opts?: { category?: string; limit?: number },
  ): Promise<MatchedStatement[]> {
    // 1. 收集规则关联的断语 (已在 matchedRules.statements 中)
    const fromRules: Map<string, MatchedStatement> = new Map();
    for (const r of matchedRules) {
      for (const s of r.statements) {
        const existing = fromRules.get(s.code);
        if (existing) {
          existing.fromRules.push(r.ruleCode);
        } else {
          fromRules.set(s.code, {
            ...s,
            tags: [],
            fromRules: [r.ruleCode],
          });
        }
      }
    }

    // 2. 补充: 断语自带 conditions 也命中
    if (this.prisma) {
      const extras = await this.prisma.statement.findMany({
        where: {
          enabled: true,
          conditions: { not: null },
          ...(opts?.category ? { category: opts.category } : {}),
        },
      });
      for (const s of extras) {
        if (fromRules.has(s.code)) continue; // 已包含
        const cond = s.conditions as unknown as Condition;
        if (!cond) continue;
        try {
          if (this.ruleEngine.evalCondition(cond, bazi)) {
            fromRules.set(s.code, {
              code: s.code,
              statement: s.statement,
              source: s.source ?? undefined,
              confidence: s.confidence,
              subcategory: s.subcategory,
              tags: s.tags,
              interpretation: s.interpretation,
              fromRules: ['__self__'],
            });
          }
        } catch (e) {
          console.warn(`[StatementEngine] stmt ${s.code} eval error:`, (e as Error).message);
        }
      }
    }

    // 3. 排序: confidence desc, priority desc
    const result = Array.from(fromRules.values());
    result.sort((a, b) => b.confidence - a.confidence);
    return result.slice(0, opts?.limit ?? 30);
  }

  /**
   * 内存模式: 传入断语列表匹配 (测试用)
   */
  matchWithStatements(
    bazi: BaziJson,
    matchedRules: MatchedRule[],
    extraStatements: Statement[] = [],
    limit = 30,
  ): MatchedStatement[] {
    const fromRules: Map<string, MatchedStatement> = new Map();
    for (const r of matchedRules) {
      for (const s of r.statements) {
        const existing = fromRules.get(s.code);
        if (existing) {
          existing.fromRules.push(r.ruleCode);
        } else {
          fromRules.set(s.code, { ...s, tags: [], fromRules: [r.ruleCode] });
        }
      }
    }

    for (const s of extraStatements) {
      if (fromRules.has(s.code) || !s.conditions) continue;
      const cond = s.conditions as unknown as Condition;
      try {
        if (this.ruleEngine.evalCondition(cond, bazi)) {
          fromRules.set(s.code, {
            code: s.code,
            statement: s.statement,
            source: s.source ?? undefined,
            confidence: s.confidence,
            subcategory: s.subcategory,
            tags: s.tags,
            interpretation: s.interpretation,
            fromRules: ['__self__'],
          });
        }
      } catch {
        // ignore
      }
    }

    const result = Array.from(fromRules.values());
    result.sort((a, b) => b.confidence - a.confidence);
    return result.slice(0, limit);
  }
}

export function createStatementEngine(prisma: PrismaClient): StatementEngine {
  return new StatementEngine(prisma);
}
