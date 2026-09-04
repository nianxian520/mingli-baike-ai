/**
 * 时区校验工具
 *
 * 使用 Intl.DateTimeFormat 探测时区合法性, 不依赖额外包
 */

const cache = new Map<string, boolean>();

/** 校验字符串是否为合法 IANA 时区 (如 Asia/Shanghai, America/New_York) */
export function isValidTimezone(tz: string): boolean {
  if (cache.has(tz)) return cache.get(tz)!;
  try {
    // Intl 会抛异常如果不是合法时区
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    cache.set(tz, true);
    return true;
  } catch {
    cache.set(tz, false);
    return false;
  }
}

/** 获取时区的 UTC 偏移分钟 (考虑 DST) */
export function getTimezoneOffsetMin(tz: string, date: Date = new Date()): number {
  if (!isValidTimezone(tz)) {
    throw new Error(`Invalid timezone: ${tz}`);
  }
  // 通过 formatToParts 提取 GMT 偏移
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    timeZoneName: 'shortOffset',
  });
  const parts = fmt.formatToParts(date);
  const tzPart = parts.find((p) => p.type === 'timeZoneName');
  if (!tzPart) return 0;
  // tzPart.value 形如 "GMT+8" 或 "GMT-5:30" 或 "GMT"
  const m = tzPart.value.match(/GMT([+-])(\d+)(?::(\d+))?/);
  if (!m) return 0;
  const sign = m[1] === '+' ? 1 : -1;
  const hours = parseInt(m[2], 10);
  const minutes = m[3] ? parseInt(m[3], 10) : 0;
  return sign * (hours * 60 + minutes);
}
