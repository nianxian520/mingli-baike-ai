/**
 * GET /api/statements
 *
 * 断语查询接口
 * - 支持 category / subcategory / source 筛选
 * - 分页 (默认 50, 最大 200)
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
    const subcategory = url.searchParams.get('subcategory') ?? undefined;
    const source = url.searchParams.get('source') ?? undefined;
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50', 10) || 50, 200);
    const offset = Math.max(parseInt(url.searchParams.get('offset') ?? '0', 10) || 0, 0);

    const where = {
      enabled: true,
      ...(category ? { category } : {}),
      ...(subcategory ? { subcategory } : {}),
      ...(source ? { source: { contains: source } } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.statement.findMany({
        where,
        orderBy: [{ priority: 'desc' }, { confidence: 'desc' }],
        take: limit,
        skip: offset,
        include: { classic: true },
      }),
      prisma.statement.count({ where }),
    ]);

    return ok({
      items,
      total,
      limit,
      offset,
    });
  } catch (e) {
    return failFromError(e);
  }
}
