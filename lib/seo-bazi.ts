/**
 * SEO 八字计算辅助
 *
 * 用于 /bazi/[year]/[month]/[day]/[hour] 静态页面
 * 仅计算指定时间点的干支柱, 不需要完整出生信息
 * 使用 lunar-javascript 直接计算, 结果确定性
 */

import { Solar } from 'lunar-javascript';
import { STEM_WUXING, BRANCH_ELEM_MAP, WUXING_CN, type WuXing, type Pillar } from '@/engine/types';

export interface SeoPillarInfo {
  ganzhi: string;
  stem: string;
  branch: string;
  stemElement: WuXing;
  branchElement: WuXing;
  stemCn: string; // 五行中文名
  branchCn: string;
  nanyin: string;
  changSheng: string;
}

export interface SeoBaziResult {
  year: number;
  month?: number;
  day?: number;
  hour?: number;
  pillars: {
    year: SeoPillarInfo;
    month?: SeoPillarInfo;
    day?: SeoPillarInfo;
    hour?: SeoPillarInfo;
  };
  lunar: {
    year: number;
    month: number;
    day: number;
    isLeapMonth: boolean;
    monthName: string;
    dayName: string;
    yearGanZhi: string;
    animal: string;
  };
  jieqi?: string;
}

function buildPillarInfo(
  ganzhi: string,
  stem: string,
  branch: string,
  nanyin: string,
  changSheng: string,
): SeoPillarInfo {
  return {
    ganzhi,
    stem,
    branch,
    stemElement: STEM_WUXING[stem] ?? 'earth',
    branchElement: BRANCH_ELEM_MAP[branch] ?? 'earth',
    stemCn: WUXING_CN[STEM_WUXING[stem] ?? 'earth'],
    branchCn: WUXING_CN[BRANCH_ELEM_MAP[branch] ?? 'earth'],
    nanyin,
    changSheng,
  };
}

/**
 * 计算指定年月日时的干支柱
 * @param params.year 公历年 (1900-2100)
 * @param params.month 公历月 1-12
 * @param params.day 公历日 1-31
 * @param params.hour 公历时 0-23
 */
export function computeSeoBazi(params: {
  year: number;
  month?: number;
  day?: number;
  hour?: number;
}): SeoBaziResult {
  const { year, month, day, hour } = params;

  // 至少有年, 用 1月1日 12时 作为默认锚点计算年柱
  // 注意: 年柱以立春为界, lunar-javascript 已处理
  const m = month ?? 1;
  const d = day ?? 1;
  const h = hour ?? 12;

  const solar = Solar.fromYmdHms(year, m, d, h, 0, 0);
  const lunar = solar.getLunar();
  const ec = lunar.getEightChar();

  const yearObj = (ec as any).getYear();
  const monthObj = (ec as any).getMonth();
  const dayObj = (ec as any).getDay();
  const hourObj = (ec as any).getTime();

  const result: SeoBaziResult = {
    year,
    pillars: {
      year: buildPillarInfo(
        yearObj.getGanZhi(),
        yearObj.getGan(),
        yearObj.getZhi(),
        yearObj.getNaYin(),
        String(yearObj.getDiShi?.() ?? ''),
      ),
    },
    lunar: {
      year: lunar.getYear() as number,
      month: Math.abs(lunar.getMonth() as number),
      day: lunar.getDay() as number,
      isLeapMonth: (lunar.getMonth() as number) < 0,
      monthName: lunar.getMonthInChinese() as string,
      dayName: lunar.getDayInChinese() as string,
      yearGanZhi: lunar.getYearInGanZhi() as string,
      animal: lunar.getYearShengXiao() as string,
    },
  };

  if (month !== undefined) {
    result.pillars.month = buildPillarInfo(
      monthObj.getGanZhi(),
      monthObj.getGan(),
      monthObj.getZhi(),
      monthObj.getNaYin(),
      String(monthObj.getDiShi?.() ?? ''),
    );
  }
  if (day !== undefined) {
    result.pillars.day = buildPillarInfo(
      dayObj.getGanZhi(),
      dayObj.getGan(),
      dayObj.getZhi(),
      dayObj.getNaYin(),
      String(dayObj.getDiShi?.() ?? ''),
    );
  }
  if (hour !== undefined && hourObj) {
    result.pillars.hour = buildPillarInfo(
      hourObj.getGanZhi(),
      hourObj.getGan(),
      hourObj.getZhi(),
      hourObj.getNaYin(),
      String(hourObj.getDiShi?.() ?? ''),
    );
  }

  try {
    result.jieqi = String(lunar.getJieQi() ?? '') || undefined;
  } catch {
    result.jieqi = undefined;
  }

  return result;
}

/**
 * 参数校验 (Zod 风格, 手写避免在 SEO 页面引入完整 Zod 开销)
 */
export function validateSeoParams(params: {
  year?: string;
  month?: string;
  day?: string;
  hour?: string;
}): { ok: true; data: { year: number; month?: number; day?: number; hour?: number } } | { ok: false; error: string } {
  const y = Number(params.year);
  if (!Number.isFinite(y) || y < 1900 || y > 2100) {
    return { ok: false, error: '年份须在 1900-2100 之间' };
  }
  if (params.month !== undefined) {
    const mo = Number(params.month);
    if (!Number.isFinite(mo) || mo < 1 || mo > 12) {
      return { ok: false, error: '月份须在 1-12 之间' };
    }
  }
  if (params.day !== undefined) {
    const dd = Number(params.day);
    if (!Number.isFinite(dd) || dd < 1 || dd > 31) {
      return { ok: false, error: '日期须在 1-31 之间' };
    }
  }
  if (params.hour !== undefined) {
    const hh = Number(params.hour);
    if (!Number.isFinite(hh) || hh < 0 || hh > 23) {
      return { ok: false, error: '小时须在 0-23 之间' };
    }
  }
  return {
    ok: true,
    data: {
      year: y,
      month: params.month !== undefined ? Number(params.month) : undefined,
      day: params.day !== undefined ? Number(params.day) : undefined,
      hour: params.hour !== undefined ? Number(params.hour) : undefined,
    },
  };
}

/**
 * 生成 Schema.org 结构化数据 (JSON-LD)
 */
export function buildBaziJsonLd(result: SeoBaziResult, url: string) {
  const pillars = [result.pillars.year, result.pillars.month, result.pillars.day, result.pillars.hour].filter(
    Boolean,
  ) as SeoPillarInfo[];
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${result.year}年${result.pillars.month ? `${result.pillars.month.ganzhi}月` : ''}八字干支`,
    description: `${result.year}年（农历${result.lunar.yearGanZhi}年·${result.lunar.animal}年）八字四柱干支详解`,
    url,
    about: {
      '@type': 'Thing',
      name: '八字命理',
      description: '中国传统命理学的四柱八字推算',
    },
    articleSection: '八字百科',
    keywords: pillars.map((p) => p.ganzhi).join(','),
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: pillars.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: `${p.ganzhi}（${p.nanyin}）`,
        description: `天干${p.stem}（${p.stemCn}）·地支${p.branch}（${p.branchCn}）`,
      })),
    },
  };
}
