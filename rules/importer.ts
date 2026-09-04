/**
 * 规则导入器
 *
 * 用途: 将 rules/seed/*.json 导入 Prisma Rule 表
 * 在 prisma/seed.ts 中调用
 *
 * 用法:
 *   import { importRules } from '@/rules/importer';
 *   await importRules(prisma);
 */

import type { PrismaClient } from '@prisma/client';
import { promises as fs } from 'node:fs';
import path from 'node:path';

interface SeedRule {
  code: string;
  category: string;
  subcategory?: string;
  name: string;
  description?: string;
  conditions: unknown;
  priority: number;
  confidence: number;
  tags: string[];
  source?: string;
}

async function loadRulesFromDir(dir: string): Promise<SeedRule[]> {
  let files: string[];
  try {
    files = await fs.readdir(dir);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`规则目录读取失败: ${dir} — ${msg}`);
  }
  const jsonFiles = files.filter((f) => f.endsWith('.json'));
  const all: SeedRule[] = [];
  for (const f of jsonFiles) {
    const full = path.join(dir, f);
    try {
      const content = await fs.readFile(full, 'utf-8');
      const parsed = JSON.parse(content) as SeedRule[];
      if (!Array.isArray(parsed)) {
        throw new Error(`${f}: expected array of rules`);
      }
      all.push(...parsed);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new Error(`规则文件加载失败: ${f} — ${msg}`);
    }
  }
  return all;
}

export async function importRules(prisma: PrismaClient, rulesDir?: string): Promise<number> {
  const dir = rulesDir ?? path.join(process.cwd(), 'rules', 'seed');
  const rules = await loadRulesFromDir(dir);
  let imported = 0;
  for (const r of rules) {
    await prisma.rule.upsert({
      where: { code: r.code },
      create: {
        code: r.code,
        category: r.category,
        subcategory: r.subcategory ?? null,
        name: r.name,
        description: r.description ?? null,
        conditions: r.conditions as object,
        priority: r.priority,
        confidence: r.confidence,
        tags: r.tags,
        source: r.source ?? null,
        enabled: true,
      },
      update: {
        category: r.category,
        subcategory: r.subcategory ?? null,
        name: r.name,
        description: r.description ?? null,
        conditions: r.conditions as object,
        priority: r.priority,
        confidence: r.confidence,
        tags: r.tags,
        source: r.source ?? null,
      },
    });
    imported++;
  }
  console.log(`[importRules] imported ${imported} rules from ${dir}`);
  return imported;
}
