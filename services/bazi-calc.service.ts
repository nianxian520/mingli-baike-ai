/**
 * 八字计算主服务
 *
 * 输入: 校验过的 BirthInput (见 lib/schemas/bazi-input.ts)
 * 输出: BaziJson (确定性, 无任何解释文本)
 *
 * 流程:
 * 1. 真太阳时校正 (services/true-solar-time.ts)
 * 2. lunar-javascript 适配 (engine/lunar-adapter.ts)
 * 3. 四柱/十神/五行/纳音/藏干/神煞/节气 (各 engine/* 模块)
 * 4. 大运/流年 (engine/dayun.ts)
 * 5. 刑冲合害 (services/interactions.ts)
 * 6. 格局/喜用神 (engine/pattern.ts, engine/xiyong.ts)
 * 7. 组装 BaziJson, 计算 inputHash
 */

import { fromUtcDate, extractPillar, extractHiddenStems, extractJieQi, extractLunar, extractShenSha } from '@/engine/lunar-adapter';
import { STEM_WUXING } from '@/engine/types';
import type { BaziJson, Pillar, TenGodRow } from '@/engine/types';
import { countWuxing, determineDayMasterStrength, getDayMasterYinYang } from '@/engine/wuxing';
import { computeTenGodRow } from '@/engine/ten-gods';
import { computeDaYun, computeLiuNian } from '@/engine/dayun';
import { determinePattern } from '@/engine/pattern';
import { determineXiYong } from '@/engine/xiyong';
import { detectInteractions } from '@/services/interactions';
import { correctSolarTime } from '@/services/true-solar-time';
import { hashString, stableStringify } from '@/lib/utils';
import pkg from 'lunar-javascript/package.json';

export interface BirthInput {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  gender: 'MALE' | 'FEMALE';
  longitude: number;
  latitude: number;
  timezone: string;
  birthPlace?: string;
  dstObserved?: boolean;
}

export class BaziCalcService {
  /**
   * 计算八字, 返回确定性 BaziJson
   */
  calculate(input: BirthInput): BaziJson {
    // 1. 真太阳时校正
    const solarTime = correctSolarTime({
      year: input.year,
      month: input.month,
      day: input.day,
      hour: input.hour,
      minute: input.minute,
      longitude: input.longitude,
      timezone: input.timezone,
    });

    // 2. lunar-javascript 适配 (用校正后 UTC Date)
    const adapted = fromUtcDate(solarTime.correctedUtcDate);
    const { solar, lunar, eightChar } = adapted;

    // 提取四柱 (EightChar 各柱对象)
    const yearPillarObj = (eightChar as any).getYear();
    const monthPillarObj = (eightChar as any).getMonth();
    const dayPillarObj = (eightChar as any).getDay();
    const hourPillarObj = (eightChar as any).getTime(); // 时柱可能为 null (晚子时处理时需注意)

    const dayGan = dayPillarObj.getGan() as string;
    const yearGan = yearPillarObj.getGan() as string;

    // 单柱提取
    const yearPillar: Pillar = extractPillar(yearPillarObj, dayGan);
    const monthPillar: Pillar = extractPillar(monthPillarObj, dayGan);
    const dayPillar: Pillar = extractPillar(dayPillarObj, dayGan);
    const hourPillar: Pillar | null = hourPillarObj ? extractPillar(hourPillarObj, dayGan) : null;

    // 藏干
    const hiddenStems = {
      year: extractHiddenStems(yearPillarObj),
      month: extractHiddenStems(monthPillarObj),
      day: extractHiddenStems(dayPillarObj),
      hour: hourPillarObj ? extractHiddenStems(hourPillarObj) : null,
    };

    // 节气
    const jieqi = extractJieQi(lunar);

    // 农历
    const lunarInfo = extractLunar(lunar);

    // 神煞
    const shenSha = extractShenSha(lunar, eightChar);

    // 3. 五行统计 (含藏干)
    const allStems = [
      { stem: yearPillar.stem },
      { stem: monthPillar.stem },
      { stem: dayPillar.stem },
      ...(hourPillar ? [{ stem: hourPillar.stem }] : []),
    ];
    const allBranches = [
      { branch: yearPillar.branch },
      { branch: monthPillar.branch },
      { branch: dayPillar.branch },
      ...(hourPillar ? [{ branch: hourPillar.branch }] : []),
    ];
    const wuxing = countWuxing(allStems, allBranches);

    // 4. 日主
    const dayElem = STEM_WUXING[dayGan]!;
    const strength = determineDayMasterStrength(
      dayGan,
      monthPillar.branch,
      allStems.map((s) => s.stem),
      allBranches.map((b) => b.branch),
    );
    const dayMaster = {
      stem: dayGan,
      element: dayElem,
      yinYang: getDayMasterYinYang(dayGan),
      strength,
    };

    // 5. 十神行
    const mkRow = (stem: string, branch: string): TenGodRow =>
      computeTenGodRow(dayGan, stem, branch);
    const tenGods = {
      year: mkRow(yearPillar.stem, yearPillar.branch),
      month: mkRow(monthPillar.stem, monthPillar.branch),
      day: mkRow(dayPillar.stem, dayPillar.branch),
      hour: hourPillar ? mkRow(hourPillar.stem, hourPillar.branch) : null,
    };

    // 6. 纳音
    const nanyin = {
      year: yearPillar.nanyin,
      month: monthPillar.nanyin,
      day: dayPillar.nanyin,
      hour: hourPillar ? hourPillar.nanyin : null,
    };

    // 7. 大运 + 流年
    const daYun = computeDaYun(eightChar, input.gender, dayGan, yearGan, 8);
    // 取第一步大运的流年
    const daYunList = (eightChar as any).getYun(input.gender === 'MALE' ? 1 : 0).getDaYun(9);
    const liuNian = daYunList.length > 1 ? computeLiuNian(daYunList[1] ?? daYunList[0], 10) : [];

    // 8. 刑冲合害
    const branches = {
      year: yearPillar.branch,
      month: monthPillar.branch,
      day: dayPillar.branch,
      hour: hourPillar?.branch ?? null,
    };
    const interactions = detectInteractions(branches);

    // 9. 格局
    const pattern = determinePattern(
      dayGan,
      monthPillar.branch,
      yearPillar.stem,
      dayPillar.stem,
      hourPillar?.stem ?? null,
    );

    // 10. 喜用神
    const xiYong = determineXiYong(dayElem, strength);

    // 11. 组装 BaziJson
    const partial = {
      input: {
        gender: input.gender,
        solar: { year: input.year, month: input.month, day: input.day, hour: input.hour, minute: input.minute },
        lunar: lunarInfo,
        location: {
          longitude: input.longitude,
          latitude: input.latitude,
          timezone: input.timezone,
          placeName: input.birthPlace,
        },
        solarTime: {
          originalHour: input.hour,
          originalMinute: input.minute,
          offsetMin: solarTime.totalOffsetMin,
          correctedHour: solarTime.correctedHour,
          correctedMinute: solarTime.correctedMinute,
          dayRolled: solarTime.dayRolled,
        },
      },
      jieqi,
      pillars: { year: yearPillar, month: monthPillar, day: dayPillar, hour: hourPillar },
      dayMaster,
      wuxing,
      tenGods,
      nanyin,
      hiddenStems,
      interactions,
      daYun,
      liuNian,
      shenSha,
      pattern,
      xiYong,
    };

    const inputHash = hashString(stableStringify(partial));
    const now = new Date().toISOString();

    return {
      meta: {
        engine: 'lunar-javascript',
        engineVersion: (pkg as any).version ?? 'unknown',
        calculatedAt: now,
        inputHash,
        solarTimeCorrected: true,
      },
      ...partial,
    } as BaziJson;
  }
}

/** 单例 */
export const baziCalcService = new BaziCalcService();
