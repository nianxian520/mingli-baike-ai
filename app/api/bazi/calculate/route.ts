/**
 * POST /api/bazi/calculate
 *
 * 计算八字命盘
 * - Zod 校验输入 (BirthInputSchema)
 * - 调用 BaziCalcService 生成 BaziJson
 * - Zod 校验输出 (BaziJsonSchema)
 * - 入库 (BirthProfile + BaziChart + DaYun + LiuNian)
 * - 返回命盘 ID + BaziJson
 *
 * 限流: 20 req/min/IP (后续可加)
 */

import { NextRequest } from 'next/server';
import { baziCalcService } from '@/services/bazi-calc.service';
import { BirthInputSchema } from '@/lib/schemas/bazi-input';
import { safeValidateBaziJson } from '@/lib/schemas/bazi-output';
import { ok, failFromError } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';
import { hashString, stableStringify } from '@/lib/utils';

export const runtime = 'nodejs'; // 命理计算需 Node Runtime
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = BirthInputSchema.parse(body);

    // 1. 计算八字
    const bazi = baziCalcService.calculate(input);

    // 2. 校验输出
    const v = safeValidateBaziJson(bazi);
    if (!v.success) {
      console.error('BaziJson validation failed:', v.error.issues);
      return ok({ bazi, validationIssues: v.error.issues });
    }

    // 3. 入库
    const chartHash = hashString(stableStringify(bazi));

    // 检查是否已存在相同 chartHash (缓存命中)
    const existing = await prisma.baziChart.findUnique({
      where: { chartHash },
      include: { birthProfile: true },
    });

    if (existing) {
      return ok({
        chartId: existing.id,
        bazi,
        cached: true,
      });
    }

    // 创建 BirthProfile + BaziChart
    const birthDate = new Date(
      Date.UTC(input.year, input.month - 1, input.day, input.hour, input.minute),
    );

    const birthProfile = await prisma.birthProfile.create({
      data: {
        name: input.birthPlace ?? '匿名',
        gender: input.gender,
        birthDate,
        birthYear: input.year,
        birthMonth: input.month,
        birthDay: input.day,
        birthHour: input.hour,
        birthMinute: input.minute,
        birthPlace: input.birthPlace ?? null,
        longitude: input.longitude,
        latitude: input.latitude,
        timezone: input.timezone,
        dstObserved: input.dstObserved ?? false,
        solarTimeOffsetMin: Math.round(bazi.input.solarTime.offsetMin),
        correctedHour: bazi.input.solarTime.correctedHour,
        correctedMinute: bazi.input.solarTime.correctedMinute,
      },
    });

    const chart = await prisma.baziChart.create({
      data: {
        birthProfileId: birthProfile.id,
        chartHash,
        yearPillar: bazi.pillars.year.ganzhi,
        monthPillar: bazi.pillars.month.ganzhi,
        dayPillar: bazi.pillars.day.ganzhi,
        hourPillar: bazi.pillars.hour?.ganzhi ?? null,
        dayMaster: bazi.dayMaster.stem,
        lunarYear: bazi.input.lunar.year,
        lunarMonth: bazi.input.lunar.month,
        lunarDay: bazi.input.lunar.day,
        isLeapMonth: bazi.input.lunar.isLeapMonth,
        currentJieqi: bazi.jieqi.current.name,
        prevJieqiTime: bazi.jieqi.previous.time
          ? new Date(bazi.jieqi.previous.time)
          : new Date(),
        nextJieqiTime: bazi.jieqi.next.time
          ? new Date(bazi.jieqi.next.time)
          : new Date(),
        fullJson: bazi as any,
        daYuns: {
          create: bazi.daYun.entries.map((e) => ({
            index: e.index,
            pillar: e.ganzhi,
            startAge: e.startAge,
            endAge: e.endAge,
            startYear: e.startYear,
            endYear: e.endYear,
            stem: e.stem,
            branch: e.branch,
          })),
        },
      },
      include: { daYuns: true },
    });

    // 创建流年 (关联到第一步大运)
    if (chart.daYuns.length > 0 && bazi.liuNian.length > 0) {
      const firstDaYun = chart.daYuns[0];
      await prisma.liuNian.createMany({
        data: bazi.liuNian.map((l) => ({
          dayunId: firstDaYun.id,
          baziChartId: chart.id,
          year: l.year,
          age: l.age,
          pillar: l.ganzhi,
          stem: l.stem,
          branch: l.branch,
        })),
      });
    }

    return ok({
      chartId: chart.id,
      bazi,
      cached: false,
    });
  } catch (e) {
    return failFromError(e);
  }
}

/**
 * GET /api/bazi/calculate
 * 返回 API 说明
 */
export async function GET() {
  return ok({
    endpoint: 'POST /api/bazi/calculate',
    schema: {
      required: ['year', 'month', 'day', 'hour', 'gender', 'longitude', 'latitude', 'timezone'],
      optional: ['minute', 'birthPlace', 'dstObserved'],
    },
  });
}
