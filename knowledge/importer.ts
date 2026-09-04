/**
 * 断语与古籍导入器
 *
 * 用途: 将 knowledge/statements/seed.json + classics.json 导入 Prisma
 * 在 prisma/seed.ts 中调用
 *
 * 关联处理:
 * - Classic 按 title upsert
 * - Statement 按 code upsert, source 字段关联 Classic
 * - RuleStatement 关联通过 rules_to_statements 映射 (见 RULE_STMT_MAP)
 *
 * 用法:
 *   import { importStatements, importClassics } from '@/knowledge/importer';
 *   await importClassics(prisma);
 *   await importStatements(prisma);
 */

import type { PrismaClient } from '@prisma/client';
import { promises as fs } from 'node:fs';
import path from 'node:path';

interface SeedClassic {
  title: string;
  dynasty?: string;
  author?: string;
  description?: string;
}

interface SeedStatement {
  code: string;
  category: string;
  subcategory?: string;
  statement: string;
  interpretation?: string;
  source?: string;
  tags: string[];
  conditions: unknown | null;
  priority: number;
  confidence: number;
}

// 规则 code → 关联的断语 code 列表 (人工维护)
// 用于在导入断语后建立 RuleStatement 关联
export const RULE_STMT_MAP: Record<string, string[]> = {
  'R-CAREER-001': ['S-CAREER-001'],
  'R-CAREER-002': ['S-CAREER-002'],
  'R-CAREER-003': ['S-CAREER-003'],
  'R-CAREER-004': ['S-CAREER-001', 'S-PATTERN-001'],
  'R-CAREER-005': ['S-CAREER-002', 'S-PATTERN-002'],
  'R-MARRIAGE-001': ['S-MARRIAGE-001'],
  'R-MARRIAGE-002': ['S-MARRIAGE-002'],
  'R-MARRIAGE-003': ['S-MARRIAGE-003'],
  'R-MARRIAGE-004': ['S-MARRIAGE-004'],
  'R-MARRIAGE-005': ['S-MARRIAGE-003', 'S-MARRIAGE-004'],
  'R-HEALTH-001': ['S-HEALTH-001'],
  'R-HEALTH-002': ['S-HEALTH-002'],
  'R-HEALTH-003': ['S-HEALTH-003'],
  'R-HEALTH-004': ['S-HEALTH-002'],
  'R-PERSONALITY-001': ['S-PERSONALITY-001'],
  'R-PERSONALITY-002': ['S-PERSONALITY-002'],
  'R-PERSONALITY-003': ['S-PERSONALITY-003'],
  'R-PERSONALITY-004': ['S-PERSONALITY-004'],
  'R-PERSONALITY-005': ['S-PERSONALITY-005'],
};

async function loadJson<T>(file: string): Promise<T> {
  const full = path.join(process.cwd(), 'knowledge', file);
  try {
    const content = await fs.readFile(full, 'utf-8');
    return JSON.parse(content) as T;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[knowledge/importer] 加载 ${file} 失败: ${msg}`);
    throw new Error(`种子文件加载失败: knowledge/${file} — ${msg}`);
  }
}

export async function importClassics(prisma: PrismaClient): Promise<number> {
  const classics = await loadJson<SeedClassic[]>('classics.json');
  let count = 0;
  for (const c of classics) {
    await prisma.classic.upsert({
      where: { title: c.title },
      create: {
        title: c.title,
        dynasty: c.dynasty ?? null,
        author: c.author ?? null,
        description: c.description ?? null,
      },
      update: {
        dynasty: c.dynasty ?? null,
        author: c.author ?? null,
        description: c.description ?? null,
      },
    });
    count++;
  }
  console.log(`[importClassics] imported ${count} classics`);
  return count;
}

export async function importStatements(
  prisma: PrismaClient,
  opts?: { withRuleAssoc?: boolean },
): Promise<number> {
  const stmts = await loadJson<SeedStatement[]>('statements/seed.json');
  const classics = await prisma.classic.findMany();
  const classicByTitle = new Map(classics.map((c) => [c.title, c.id]));

  let count = 0;
  for (const s of stmts) {
    // 通过 source 字段关联 Classic (粗匹配: source 含书名)
    let sourceId: string | null = null;
    if (s.source) {
      for (const [title, id] of classicByTitle) {
        if (s.source.includes(title)) {
          sourceId = id;
          break;
        }
      }
    }

    await prisma.statement.upsert({
      where: { code: s.code },
      create: {
        code: s.code,
        category: s.category,
        subcategory: s.subcategory ?? null,
        statement: s.statement,
        interpretation: s.interpretation ?? null,
        sourceId,
        source: s.source ?? null,
        tags: s.tags,
        conditions: (s.conditions ?? null) as object | null,
        priority: s.priority,
        confidence: s.confidence,
        enabled: true,
      },
      update: {
        category: s.category,
        subcategory: s.subcategory ?? null,
        statement: s.statement,
        interpretation: s.interpretation ?? null,
        sourceId,
        source: s.source ?? null,
        tags: s.tags,
        conditions: (s.conditions ?? null) as object | null,
        priority: s.priority,
        confidence: s.confidence,
      },
    });
    count++;
  }
  console.log(`[importStatements] imported ${count} statements`);

  // 建立 RuleStatement 关联
  if (opts?.withRuleAssoc ?? true) {
    await associateRulesStatements(prisma);
  }
  return count;
}

async function associateRulesStatements(prisma: PrismaClient): Promise<number> {
  let linked = 0;
  for (const [ruleCode, stmtCodes] of Object.entries(RULE_STMT_MAP)) {
    const rule = await prisma.rule.findUnique({ where: { code: ruleCode } });
    if (!rule) continue;
    for (const stmtCode of stmtCodes) {
      const stmt = await prisma.statement.findUnique({ where: { code: stmtCode } });
      if (!stmt) continue;
      await prisma.ruleStatement.upsert({
        where: { ruleId_statementId: { ruleId: rule.id, statementId: stmt.id } },
        create: { ruleId: rule.id, statementId: stmt.id },
        update: {},
      });
      linked++;
    }
  }
  console.log(`[associateRulesStatements] linked ${linked} rule-statement pairs`);
  return linked;
}
