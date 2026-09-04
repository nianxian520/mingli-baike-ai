/**
 * GET /api/bazi/[chartId]
 *
 * 获取已存命盘 (含 BaziJson 全量)
 */

import { NextRequest, NextResponse } from 'next/server';
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
      include: {
        birthProfile: true,
        daYuns: { orderBy: { index: 'asc' } },
      },
    });
    if (!chart) {
      throw new ApiError('NOT_FOUND', `命盘 ${params.chartId} 不存在`, 404);
    }
    return ok({
      chartId: chart.id,
      birthProfile: chart.birthProfile,
      pillars: {
        year: chart.yearPillar,
        month: chart.monthPillar,
        day: chart.dayPillar,
        hour: chart.hourPillar,
      },
      dayMaster: chart.dayMaster,
      lunar: {
        year: chart.lunarYear,
        month: chart.lunarMonth,
        day: chart.lunarDay,
        isLeapMonth: chart.isLeapMonth,
      },
      currentJieqi: chart.currentJieqi,
      daYuns: chart.daYuns,
      bazi: chart.fullJson,
    });
  } catch (e) {
    if (e instanceof ApiError) {
      return fail(e.code, e.message, e.statusCode);
    }
    return fail('INTERNAL_ERROR', (e as Error).message, 500);
  }
}
