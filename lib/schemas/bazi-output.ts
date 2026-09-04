/**
 * 八字计算输出 BaziJson Zod Schema
 *
 * 用途: 引擎产出的 BaziJson 必须通过此 schema 校验, 才能入库/返回 API
 *
 * 设计原则:
 * - 与 engine/types.ts 的 BaziJson 接口一一对应
 * - 严格类型 + 必填字段, 防止引擎/适配层遗漏字段
 * - 用于运行时校验, 非 TS 编译期校验
 */

import { z } from 'zod';

const STEM = z.string().length(1);
const BRANCH = z.string().length(1);
const GANZHI = z.string().length(2);
const WUXING = z.enum(['wood', 'fire', 'earth', 'metal', 'water']);
const YINYANG = z.enum(['YIN', 'YANG']);
const STRENGTH = z.enum(['WANG', 'XIANG', 'PING', 'RUO', 'JUE']);
const POS = z.enum(['year', 'month', 'day', 'hour']);
const INTERACTION_TYPE = z.enum([
  'COMBINATION_2',
  'COMBINATION_3',
  'COMBINATION_3_DIRECTION',
  'HALF_COMBINATION',
  'CLASH',
  'PUNISHMENT',
  'HARM',
  'BREAK',
]);

const PillarSchema = z.object({
  ganzhi: GANZHI,
  stem: STEM,
  branch: BRANCH,
  stemElement: WUXING,
  branchElement: WUXING,
  nanyin: z.string(),
  shishen: z.string(),
  changSheng: z.string(),
});

const TenGodRowSchema = z.object({
  stem: STEM,
  branch: BRANCH,
  stemTenGod: z.string(),
  branchTenGod: z.string(),
  branchHidden: z.array(
    z.object({ stem: STEM, tenGod: z.string() }),
  ),
});

const InteractionSchema = z.object({
  type: INTERACTION_TYPE,
  positions: z.array(POS),
  branches: z.array(z.string()),
  description: z.string(),
});

const DaYunEntrySchema = z.object({
  index: z.number().int().positive(),
  ganzhi: GANZHI,
  stem: STEM,
  branch: BRANCH,
  startAge: z.number(),
  endAge: z.number(),
  startYear: z.number().int(),
  endYear: z.number().int(),
});

const LiuNianEntrySchema = z.object({
  year: z.number().int(),
  age: z.number().int(),
  ganzhi: GANZHI,
  stem: STEM,
  branch: BRANCH,
});

export const BaziJsonSchema = z.object({
  meta: z.object({
    engine: z.literal('lunar-javascript'),
    engineVersion: z.string(),
    calculatedAt: z.string(),
    inputHash: z.string(),
    solarTimeCorrected: z.boolean(),
  }),
  input: z.object({
    gender: z.enum(['MALE', 'FEMALE']),
    solar: z.object({
      year: z.number().int(),
      month: z.number().int(),
      day: z.number().int(),
      hour: z.number().int(),
      minute: z.number().int(),
    }),
    lunar: z.object({
      year: z.number().int(),
      month: z.number().int(),
      day: z.number().int(),
      isLeapMonth: z.boolean(),
      monthName: z.string(),
      dayName: z.string(),
    }),
    location: z.object({
      longitude: z.number(),
      latitude: z.number(),
      timezone: z.string(),
      placeName: z.string().optional().nullable(),
    }),
    solarTime: z.object({
      originalHour: z.number().int(),
      originalMinute: z.number().int(),
      offsetMin: z.number(),
      correctedHour: z.number().int(),
      correctedMinute: z.number().int(),
      dayRolled: z.boolean(),
    }),
  }),
  jieqi: z.object({
    current: z.object({ name: z.string(), time: z.string() }),
    previous: z.object({ name: z.string(), time: z.string() }),
    next: z.object({ name: z.string(), time: z.string() }),
  }),
  pillars: z.object({
    year: PillarSchema,
    month: PillarSchema,
    day: PillarSchema,
    hour: PillarSchema.nullable(),
  }),
  dayMaster: z.object({
    stem: STEM,
    element: WUXING,
    yinYang: YINYANG,
    strength: STRENGTH,
  }),
  wuxing: z.object({
    count: z.object({
      wood: z.number(), fire: z.number(), earth: z.number(),
      metal: z.number(), water: z.number(),
    }),
    percentage: z.object({
      wood: z.number(), fire: z.number(), earth: z.number(),
      metal: z.number(), water: z.number(),
    }),
    missing: z.array(WUXING),
    dominant: z.array(WUXING),
  }),
  tenGods: z.object({
    year: TenGodRowSchema,
    month: TenGodRowSchema,
    day: TenGodRowSchema,
    hour: TenGodRowSchema.nullable(),
  }),
  nanyin: z.object({
    year: z.string(),
    month: z.string(),
    day: z.string(),
    hour: z.string().nullable(),
  }),
  hiddenStems: z.object({
    year: z.array(STEM),
    month: z.array(STEM),
    day: z.array(STEM),
    hour: z.array(STEM).nullable(),
  }),
  interactions: z.object({
    combinations: z.array(InteractionSchema),
    clashes: z.array(InteractionSchema),
    punishments: z.array(InteractionSchema),
    harms: z.array(InteractionSchema),
    breaks: z.array(InteractionSchema),
    meetings: z.array(InteractionSchema),
  }),
  daYun: z.object({
    direction: z.enum(['FORWARD', 'BACKWARD']),
    startAge: z.number(),
    startYear: z.number().int(),
    entries: z.array(DaYunEntrySchema),
  }),
  liuNian: z.array(LiuNianEntrySchema),
  shenSha: z.object({
    year: z.array(z.string()),
    month: z.array(z.string()),
    day: z.array(z.string()),
    hour: z.array(z.string()).nullable(),
  }),
  pattern: z.object({
    name: z.string().nullable(),
    description: z.string(),
  }),
  xiYong: z.object({
    xiShen: z.array(WUXING),
    yongShen: z.array(WUXING),
    jiShen: z.array(WUXING),
    method: z.string(),
  }),
});

export type BaziJsonValidated = z.infer<typeof BaziJsonSchema>;

/** 校验 BaziJson, 失败抛 ZodError */
export function validateBaziJson(data: unknown): BaziJsonValidated {
  return BaziJsonSchema.parse(data);
}

/** 安全校验 (返回 success/data 或 success/false/error) */
export function safeValidateBaziJson(data: unknown) {
  return BaziJsonSchema.safeParse(data);
}
