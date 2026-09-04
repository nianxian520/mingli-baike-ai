/**
 * 八字计算输入 Zod Schema
 *
 * 校验: 出生时间/经纬度/时区/真太阳时输入参数
 * 严格性: 拒绝非法日期/超范围数值/无效时区
 */

import { z } from 'zod';
import { isValidTimezone } from '@/lib/validate-timezone';

export const BirthInputSchema = z
  .object({
    year: z.number().int().min(1900).max(2100),
    month: z.number().int().min(1).max(12),
    day: z.number().int().min(1).max(31),
    hour: z.number().int().min(0).max(23),
    minute: z.number().int().min(0).max(59).default(0),
    gender: z.enum(['MALE', 'FEMALE']),
    longitude: z.number().min(-180).max(180),
    latitude: z.number().min(-90).max(90),
    timezone: z.string().refine((v) => isValidTimezone(v), {
      message: 'Invalid IANA timezone (e.g. Asia/Shanghai)',
    }),
    birthPlace: z.string().max(200).optional(),
    dstObserved: z.boolean().default(false),
  })
  .superRefine((val, ctx) => {
    // 日期合法性 (含闰年/月份天数)
    const d = new Date(Date.UTC(val.year, val.month - 1, val.day, val.hour, val.minute));
    if (
      d.getUTCFullYear() !== val.year ||
      d.getUTCMonth() !== val.month - 1 ||
      d.getUTCDate() !== val.day
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['day'],
        message: `Invalid date: ${val.year}-${val.month}-${val.day}`,
      });
    }
    // 经度与时区合理性 (粗略: 经度±15度内)
    // 不强制报错, 只警告
  });

export type BirthInput = z.infer<typeof BirthInputSchema>;
