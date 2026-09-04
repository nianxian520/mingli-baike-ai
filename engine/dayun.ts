/**
 * 大运与流年
 *
 * 大运规则:
 * - 起运方向: 阳男阴女顺排, 阴男阳女逆排 (年干阴阳 + 性别)
 * - 起运岁数: 出生到下一节(顺)或上一节(逆)的天数, 3天折1岁
 * - 月柱为基点, 顺/逆数 60 甲子
 * - 每步大运管 10 年
 *
 * 直接复用 lunar-javascript 的 EightChar.getYun() + DaYun + LiuNian
 */

import type { EightChar } from 'lunar-javascript';
import type { DaYunEntry, LiuNianEntry } from './types';
import { STEM_YINYANG } from './types';

type AnyObj = Record<string, any>;

export interface DaYunResult {
  direction: 'FORWARD' | 'BACKWARD';
  startAge: number;
  startYear: number;
  entries: DaYunEntry[];
}

/**
 * 计算大运
 * @param ec EightChar 实例
 * @param gender 'MALE' | 'FEMALE'
 * @param dayGan 日干 (用于计算阴阳确定方向, 实际 lunar 内部用年干)
 * @param yearGan 年干
 * @param count 大运步数 (默认 8)
 */
export function computeDaYun(
  ec: EightChar,
  gender: 'MALE' | 'FEMALE',
  dayGan: string,
  yearGan: string,
  count = 8,
): DaYunResult {
  // lunar: getYun(gender) gender=1 男, 0 女
  const yun: AnyObj = (ec as any).getYun(gender === 'MALE' ? 1 : 0);
  const startAge = Number(yun.getStartAge() ?? 0);
  const startYear = Number(yun.getStartYear() ?? 0);

  // 方向: 阳男/阴女顺, 阴男/阳女逆
  const yearYinYang = STEM_YINYANG[yearGan] ?? 'YANG';
  const isForward =
    (yearYinYang === 'YANG' && gender === 'MALE') ||
    (yearYinYang === 'YIN' && gender === 'FEMALE');

  const daYunList: AnyObj[] = yun.getDaYun(count + 1) as AnyObj[]; // 第一项通常是起始信息, 跳过
  const entries: DaYunEntry[] = [];

  for (let i = 0; i < daYunList.length; i++) {
    const dy = daYunList[i];
    const ganzhi = String(dy.getGanZhi?.() ?? '');
    if (!ganzhi || ganzhi === '空') continue;
    const entry: DaYunEntry = {
      index: entries.length + 1,
      ganzhi,
      stem: String(dy.getGan?.() ?? ganzhi.charAt(0)),
      branch: String(dy.getZhi?.() ?? ganzhi.charAt(1)),
      startAge: Number(dy.getStartAge?.() ?? 0),
      endAge: Number(dy.getEndAge?.() ?? 0),
      startYear: Number(dy.getStartYear?.() ?? 0),
      endYear: Number(dy.getEndYear?.() ?? 0),
    };
    entries.push(entry);
    if (entries.length >= count) break;
  }

  return {
    direction: isForward ? 'FORWARD' : 'BACKWARD',
    startAge,
    startYear,
    entries,
  };
}

/**
 * 计算某大运下流年
 * @param daYunObj lunar DaYun 实例
 * @param count 流年数 (默认 10)
 */
export function computeLiuNian(
  daYunObj: AnyObj,
  count = 10,
): LiuNianEntry[] {
  const liuNianList: AnyObj[] = daYunObj.getLiuNian(count) as AnyObj[];
  const result: LiuNianEntry[] = [];
  for (const ln of liuNianList) {
    const ganzhi = String(ln.getGanZhi?.() ?? '');
    if (!ganzhi) continue;
    result.push({
      year: Number(ln.getYear?.() ?? 0),
      age: Number(ln.getAge?.() ?? 0),
      ganzhi,
      stem: String(ln.getGan?.() ?? ganzhi.charAt(0)),
      branch: String(ln.getZhi?.() ?? ganzhi.charAt(1)),
    });
  }
  return result;
}
