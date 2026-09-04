/**
 * POST /api/rules/match
 *
 * 规则匹配接口
 * - 输入: BaziJson + 可选 category/limit
 * - 输出: 按 priority/confidence 排序的 MatchedRule[]
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createRuleEngine } from '@/services/rule-engine';
import { prisma } from '@/lib/prisma';
import { ok, failFromError } from '@/lib/api-response';
import { BaziJsonSchema } from '@/lib/schemas/bazi-output';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MatchInputSchema = z.object({
  bazi: BaziJsonSchema,
  category: z.string().optional(),
  limit: z.number().int().min(1).max(200).default(50),
});

export async function POST(req: NextRequest) {
  try {
    const body = MatchInputSchema.parse(await req.json());
    const engine = createRuleEngine(prisma);
    const matched = await engine.match(body.bazi, {
      category: body.category,
      limit: body.limit,
    });
    return ok({
      count: matched.length,
      matchedRules: matched,
    });
  } catch (e) {
    return failFromError(e);
  }
}
