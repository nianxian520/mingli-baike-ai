/**
 * GET /api/rules
 *
 * 规则查询接口
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, failFromError } from '@/lib/api-response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl;
    const category = url.searchParams.get('category') ?? undefined;
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50', 10) || 50, 200);

    const where = {
      enabled: true,
      ...(category ? { category } : {}),
    };

    const items = await prisma.rule.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { confidence: 'desc' }],
      take: limit,
      include: { ruleStatements: { include: { statement: true } } },
    });

    return ok({
      items,
      count: items.length,
    });
  } catch (e) {
    return failFromError(e);
  }
}
