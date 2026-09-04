/**
 * Rule Engine · 命理规则匹配引擎
 *
 * 职责:
 * - 从 Prisma (或内存) 加载 Rule
 * - 对 BaziJson 执行 DSL 条件匹配
 * - 输出按 priority/confidence 排序的 MatchedRule[]
 *
 * 设计:
 * - 纯函数式 evalCondition, 无副作用, 易单元测试
 * - 支持两种数据源:
 *   1. Prisma (生产): match(bazi) 自动查库
 *   2. 内存 (测试): matchWithRules(bazi, rules)
 *
 * 对应文档: §八 Rule Engine 设计
 */

import type { PrismaClient, Rule, RuleStatement, Statement } from '@prisma/client';
import type { BaziJson, InteractionType, PillarPos } from '@/engine/types';
import type { Condition, MatchedRule, MatchedStatementRef } from '@/engine/rule-dsl';

// ============ 加载的规则结构 ============
export interface LoadedRule extends Rule {
  ruleStatements: Array<{
    statement: Statement;
  }>;
}

// ============ 路径取值 (替代 lodash.get) ============
function getPath(obj: unknown, path: string): unknown {
  if (!path) return obj;
  const parts = path.split('.');
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur === null || cur === undefined) return undefined;
    if (Array.isArray(cur)) {
      const idx = parseInt(p, 10);
      if (Number.isNaN(idx)) return undefined;
      cur = cur[idx];
    } else if (typeof cur === 'object') {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return cur;
}

// ============ 交互类型 → 字段名映射 ============
const INTERACTION_FIELD: Record<InteractionType, keyof BaziJson['interactions']> = {
  COMBINATION_2: 'combinations',
  COMBINATION_3: 'combinations',
  COMBINATION_3_DIRECTION: 'meetings',
  HALF_COMBINATION: 'combinations',
  CLASH: 'clashes',
  PUNISHMENT: 'punishments',
  HARM: 'harms',
  BREAK: 'breaks',
};

// ============ RuleEngine ============
export class RuleEngine {
  constructor(private prisma?: PrismaClient) {}

  /**
   * 生产模式: 从 Prisma 加载并匹配
   */
  async match(
    bazi: BaziJson,
    opts?: { category?: string; limit?: number },
  ): Promise<MatchedRule[]> {
    if (!this.prisma) throw new Error('RuleEngine.match 需要 prisma client');
    const rules = await this.prisma.rule.findMany({
      where: {
        enabled: true,
        ...(opts?.category ? { category: opts.category } : {}),
      },
      include: {
        ruleStatements: { include: { statement: true } },
      },
      orderBy: [{ priority: 'desc' }, { confidence: 'desc' }],
    });
    return this.matchWithRules(bazi, rules, opts?.limit ?? 50);
  }

  /**
   * 内存模式: 传入规则列表匹配 (测试/离线用)
   */
  matchWithRules(
    bazi: BaziJson,
    rules: LoadedRule[],
    limit = 50,
  ): MatchedRule[] {
    const matched: MatchedRule[] = [];
    for (const rule of rules) {
      if (!rule.enabled) continue;
      const cond = rule.conditions as unknown as Condition;
      if (!cond) continue;
      try {
        if (this.evalCondition(cond, bazi)) {
          matched.push({
            ruleCode: rule.code,
            ruleName: rule.name,
            category: rule.category,
            priority: rule.priority,
            confidence: rule.confidence,
            statements: rule.ruleStatements.map((rs) => this.toStmtRef(rs.statement)),
          });
        }
      } catch (e) {
        // 单条规则匹配出错不影响其他规则, 但记录
        console.warn(`[RuleEngine] rule ${rule.code} eval error:`, (e as Error).message);
      }
    }
    // 排序: priority desc, confidence desc
    matched.sort((a, b) => b.priority - a.priority || b.confidence - a.confidence);
    return matched.slice(0, limit);
  }

  private toStmtRef(s: Statement): MatchedStatementRef {
    return {
      code: s.code,
      statement: s.statement,
      source: s.source ?? undefined,
      confidence: s.confidence,
    };
  }

  // ============ DSL 评估 (递归) ============
  evalCondition(cond: Condition, bazi: BaziJson): boolean {
    switch (cond.op) {
      case 'AND':
        return cond.children.every((c) => this.evalCondition(c, bazi));
      case 'OR':
        return cond.children.some((c) => this.evalCondition(c, bazi));
      case 'NOT':
        return !this.evalCondition(cond.child, bazi);

      case 'EQ':
        return getPath(bazi, cond.path) === cond.value;
      case 'IN':
        return cond.values.includes(getPath(bazi, cond.path));
      case 'CONTAINS': {
        const v = getPath(bazi, cond.path);
        return Array.isArray(v) && v.includes(cond.value);
      }

      case 'STEM_IS':
        return bazi.pillars[cond.position as PillarPos]?.stem === cond.stem;
      case 'BRANCH_IS':
        return bazi.pillars[cond.position as PillarPos]?.branch === cond.branch;
      case 'GANZHI_IS':
        return bazi.pillars[cond.position as PillarPos]?.ganzhi === cond.ganzhi;

      case 'HAS_INTERACTION': {
        const field = INTERACTION_FIELD[cond.type];
        const list = bazi.interactions[field] ?? [];
        return list.some((i) => {
          if (cond.positions && cond.positions.length > 0) {
            return cond.positions.every((p) => i.positions.includes(p));
          }
          return true;
        });
      }

      case 'WUXING_MISSING':
        return cond.elements.every((e) => bazi.wuxing.missing.includes(e));
      case 'WUXING_DOMINANT':
        return cond.elements.some((e) => bazi.wuxing.dominant.includes(e));

      case 'TEN_GOD_AT': {
        const row = bazi.tenGods[cond.position as PillarPos];
        if (!row) return false;
        return row.stemTenGod === cond.tenGod || row.branchTenGod === cond.tenGod;
      }

      case 'DAY_MASTER_STRENGTH':
        return bazi.dayMaster.strength === cond.level;

      case 'PATTERN_IS':
        return bazi.pattern.name === cond.pattern;

      case 'DAYUN_PILLAR':
        return bazi.daYun.entries.some((e) =>
          (!cond.ganzhi || e.ganzhi === cond.ganzhi) &&
          (!cond.stem || e.stem === cond.stem) &&
          (!cond.branch || e.branch === cond.branch),
        );

      case 'LIUNIAN_PILLAR':
        return bazi.liuNian.some((l) =>
          (!cond.year || l.year === cond.year) &&
          (!cond.ganzhi || l.ganzhi === cond.ganzhi),
        );

      case 'XIYONG_INCLUDES':
        return cond.elements.every((e) =>
          [...bazi.xiYong.xiShen, ...bazi.xiYong.yongShen].includes(e),
        );

      default:
        return false;
    }
  }
}

/** 单例 (生产, 用 prisma) */
export function createRuleEngine(prisma: PrismaClient): RuleEngine {
  return new RuleEngine(prisma);
}
