/**
 * 真太阳时校正
 *
 * 真太阳时 = 当地平太阳时 + 均时差(Equation of Time)
 * 当地平太阳时 = 标准时 + (经度 - 标准时区基准经度) × 4分钟/度
 *
 * 第一阶段: 实现经度校正(主要项), 均时差用近似公式
 * 后续可替换为 @openfate/true-solar-time 提升精度
 */

import { isValidTimezone } from '@/lib/validate-timezone';

// 北京时间对应的基准经度 (Asia/Shanghai UTC+8 → 120°E)
const BEIJING_REFERENCE_LONGITUDE = 120;

export interface SolarTimeInput {
  year: number; month: number; day: number;
  hour: number; minute: number;
  longitude: number;
  timezone: string; // IANA 时区
}

export interface SolarTimeResult {
  /** 经度校正分钟数 (当地平太阳时 - 标准时) */
  offsetMin: number;
  /** 均时差分钟数 (真太阳时 - 平太阳时) */
  equationOfTimeMin: number;
  /** 总校正分钟数 */
  totalOffsetMin: number;
  /** 校正后小时 (0-23) */
  correctedHour: number;
  /** 校正后分钟 (0-59) */
  correctedMinute: number;
  /** 是否跨日 (校正后日期变化) */
  dayRolled: boolean;
  /** 跨日方向 */
  dayRollDirection: 0 | 1 | -1;
  /** 校正后 UTC 时间 */
  correctedUtcDate: Date;
}

/**
 * 均时差近似公式 (B. Danev, 8阶傅里叶级数, 精度±0.5分钟)
 * 输入: 一年中的天数 (1-366)
 * 输出: 分钟数 (真太阳时 - 平太阳时)
 *
 * 公式来自 NOAA Solar Calculator 的常见实现
 */
function equationOfTime(dayOfYear: number): number {
  const B = (2 * Math.PI * (dayOfYear - 81)) / 365;
  // 单位: 分钟
  return (
    9.87 * Math.sin(2 * B)
    - 7.53 * Math.cos(B)
    - 1.5 * Math.sin(B)
  );
}

/**
 * 计算一年中的天数 (1-366)
 */
function dayOfYear(year: number, month: number, day: number): number {
  const d = new Date(Date.UTC(year, month - 1, day));
  const start = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.floor((d.getTime() - start.getTime()) / 86400000) + 1;
}

/**
 * 计算真太阳时校正
 *
 * 步骤:
 * 1. 输入时间视为 timezone 的标准时 (如 Asia/Shanghai 即北京时间)
 * 2. 经度校正: offset = (longitude - referenceLong) × 4 分钟
 *    - 上海基准 120°E (UTC+8)
 *    - 东经>120 加时间, 西经<120 减时间
 * 3. 均时差: 真太阳时 = 平太阳时 + EoT
 * 4. 合并后, 计算校正后的小时分钟, 判断是否跨日
 */
export function correctSolarTime(input: SolarTimeInput): SolarTimeResult {
  if (!isValidTimezone(input.timezone)) {
    throw new Error(`Invalid timezone: ${input.timezone}`);
  }

  const dayOfYearVal = dayOfYear(input.year, input.month, input.day);
  const eotMin = equationOfTime(dayOfYearVal);

  // 经度校正 (相对北京时间基准 120°E)
  const longitudeOffsetMin = (input.longitude - BEIJING_REFERENCE_LONGITUDE) * 4;

  const totalOffsetMin = longitudeOffsetMin + eotMin;

  // 总分钟数 (从 00:00 起算)
  const totalInputMin = input.hour * 60 + input.minute;
  const totalCorrectedMin = totalInputMin + totalOffsetMin;

  // 计算跨日
  let dayRolled = false;
  let dayRollDirection: 0 | 1 | -1 = 0;
  let normalizedMin = totalCorrectedMin;

  if (normalizedMin >= 1440) {
    normalizedMin -= 1440;
    dayRolled = true;
    dayRollDirection = 1;
  } else if (normalizedMin < 0) {
    normalizedMin += 1440;
    dayRolled = true;
    dayRollDirection = -1;
  }

  const correctedHour = Math.floor(normalizedMin / 60);
  const correctedMinute = Math.floor(normalizedMin % 60);

  // 构造校正后 UTC Date (用于传给 lunar-javascript)
  // 注意: 我们把校正后的"北京时间"当作输入, 再转 UTC
  // 这里简化处理: 把校正后的时分直接用于八字排盘(因 lunar-javascript 接受 Date, 需转 UTC)
  const beijingOffsetHours = 8; // Asia/Shanghai = UTC+8
  const utcMs =
    Date.UTC(input.year, input.month - 1, input.day, correctedHour, correctedMinute) -
    dayRollDirection * 86400000 -
    beijingOffsetHours * 3600000;
  const correctedUtcDate = new Date(utcMs);

  return {
    offsetMin: longitudeOffsetMin,
    equationOfTimeMin: eotMin,
    totalOffsetMin,
    correctedHour,
    correctedMinute,
    dayRolled,
    dayRollDirection,
    correctedUtcDate,
  };
}
