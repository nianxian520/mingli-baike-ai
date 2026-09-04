/**
 * GET /api/bazi/[chartId]/dayun
 * 获取大运列表
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, fail, ApiError } from '@/lib/api-response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { chartId: string } },
) {
  try {
    const chart = await prisma.baziChart.findUnique({
      where: { id: params.chartId },
      select: { id: true },
    });
    if (!chart) throw new ApiError('NOT_FOUND', `命盘 ${params.chartId} 不存在`, 404);

    const daYuns = await prisma.daYun.findMany({
      where: { baziChartId: params.chartId },
      orderBy: { index: 'asc' },
      include: { liuNians: { orderBy: { year: 'asc' } } },
    });

    return ok({
      chartId: params.chartId,
      count: daYuns.length,
      daYuns,
    });
  } catch (e) {
    if (e instanceof ApiError) return fail(e.code, e.message, e.statusCode);
    return fail('INTERNAL_ERROR', (e as Error).message, 500);
  }
}
