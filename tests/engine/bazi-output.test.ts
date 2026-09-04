/**
 * BaziJson Zod Schema 输出校验测试
 *
 * 运行: npx vitest run tests/engine/bazi-output
 *
 * 测试策略:
 * - 验证 BaziJsonSchema 对合法数据通过
 * - 验证各字段缺失/类型错误时正确拒绝
 * - 验证 safeValidateBaziJson 返回格式
 */
import { describe, it, expect } from 'vitest';
import { BaziJsonSchema, validateBaziJson, safeValidateBaziJson } from '@/lib/schemas/bazi-output';

function makeValidBaziJson() {
  return {
    meta: {
      engine: 'lunar-javascript' as const,
      engineVersion: '1.0.0',
      calculatedAt: '2026-01-01T00:00:00Z',
      inputHash: 'abcdef1234567890',
      solarTimeCorrected: true,
    },
    input: {
      gender: 'MALE' as const,
      solar: { year: 1986, month: 5, day: 29, hour: 10, minute: 0 },
      lunar: { year: 1986, month: 4, day: 21, isLeapMonth: false, monthName: '四月', dayName: '廿一' },
      location: { longitude: 116.4, latitude: 39.9, timezone: 'Asia/Shanghai', placeName: '北京' },
      solarTime: { originalHour: 10, originalMinute: 0, offsetMin: 0, correctedHour: 10, correctedMinute: 0, dayRolled: false },
    },
    jieqi: {
      current: { name: '小满', time: '2026-05-21T00:00:00Z' },
      previous: { name: '立夏', time: '2026-05-05T00:00:00Z' },
      next: { name: '芒种', time: '2026-06-05T00:00:00Z' },
    },
    pillars: {
      year: { ganzhi: '丙寅', stem: '丙', branch: '寅', stemElement: 'fire', branchElement: 'wood', nanyin: '炉中火', shishen: '食神', changSheng: '长生' },
      month: { ganzhi: '癸巳', stem: '癸', branch: '巳', stemElement: 'water', branchElement: 'fire', nanyin: '长流水', shishen: '正官', changSheng: '胎' },
      day: { ganzhi: '甲子', stem: '甲', branch: '子', stemElement: 'wood', branchElement: 'water', nanyin: '海中金', shishen: '日主', changSheng: '沐浴' },
      hour: { ganzhi: '己巳', stem: '己', branch: '巳', stemElement: 'earth', branchElement: 'fire', nanyin: '大林木', shishen: '正财', changSheng: '病' },
    },
    dayMaster: { stem: '甲', element: 'wood', yinYang: 'YANG', strength: 'RUO' },
    wuxing: {
      count: { wood: 2, fire: 3, earth: 1, metal: 0, water: 2 },
      percentage: { wood: 16.7, fire: 25, earth: 8.3, metal: 0, water: 16.7 },
      missing: ['metal'],
      dominant: ['fire'],
    },
    tenGods: {
      year: { stem: '丙', branch: '寅', stemTenGod: '食神', branchTenGod: '比肩', branchHidden: [{ stem: '甲', tenGod: '比肩' }] },
      month: { stem: '癸', branch: '巳', stemTenGod: '正官', branchTenGod: '食神', branchHidden: [{ stem: '丙', tenGod: '食神' }] },
      day: { stem: '甲', branch: '子', stemTenGod: '日主', branchTenGod: '正印', branchHidden: [{ stem: '癸', tenGod: '正官' }] },
      hour: { stem: '己', branch: '巳', stemTenGod: '正财', branchTenGod: '食神', branchHidden: [{ stem: '丙', tenGod: '食神' }] },
    },
    nanyin: { year: '炉中火', month: '长流水', day: '海中金', hour: '大林木' },
    hiddenStems: { year: ['甲'], month: ['丙'], day: ['癸'], hour: ['丙'] },
    interactions: {
      combinations: [],
      clashes: [],
      punishments: [],
      harms: [],
      breaks: [],
      meetings: [],
    },
    daYun: {
      direction: 'FORWARD' as const,
      startAge: 5,
      startYear: 1991,
      entries: [
        { index: 1, ganzhi: '甲午', stem: '甲', branch: '午', startAge: 5, endAge: 14, startYear: 1991, endYear: 2000 },
      ],
    },
    liuNian: [
      { year: 2026, age: 40, ganzhi: '丙午', stem: '丙', branch: '午' },
    ],
    shenSha: { year: ['驿马'], month: [], day: ['天乙贵人'], hour: [] },
    pattern: { name: '食神格', description: '月令巳中丙火食神透干' },
    xiYong: { xiShen: ['water', 'wood'], yongShen: ['water'], jiShen: ['metal', 'earth'], method: '子平扶抑法' },
  };
}

describe('BaziJsonSchema', () => {
  it('accepts valid complete data', () => {
    const data = makeValidBaziJson();
    const result = BaziJsonSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('accepts null hour pillar', () => {
    const data = makeValidBaziJson();
    data.pillars.hour = null;
    data.tenGods.hour = null;
    data.nanyin.hour = null;
    data.hiddenStems.hour = null;
    data.shenSha.hour = null;
    const result = BaziJsonSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('rejects invalid engine literal', () => {
    const data = makeValidBaziJson();
    data.meta.engine = 'other-engine' as any;
    expect(BaziJsonSchema.safeParse(data).success).toBe(false);
  });

  it('rejects invalid gender', () => {
    const data = makeValidBaziJson();
    data.input.gender = 'UNKNOWN' as any;
    expect(BaziJsonSchema.safeParse(data).success).toBe(false);
  });

  it('rejects invalid wuxing element', () => {
    const data = makeValidBaziJson();
    data.dayMaster.element = 'void' as any;
    expect(BaziJsonSchema.safeParse(data).success).toBe(false);
  });

  it('rejects invalid strength level', () => {
    const data = makeValidBaziJson();
    data.dayMaster.strength = 'SUPER_STRONG' as any;
    expect(BaziJsonSchema.safeParse(data).success).toBe(false);
  });

  it('rejects missing required field (pillars)', () => {
    const data = makeValidBaziJson();
    delete (data as any).pillars;
    expect(BaziJsonSchema.safeParse(data).success).toBe(false);
  });

  it('rejects missing required field (dayMaster)', () => {
    const data = makeValidBaziJson();
    delete (data as any).dayMaster;
    expect(BaziJsonSchema.safeParse(data).success).toBe(false);
  });

  it('rejects invalid interaction type', () => {
    const data = makeValidBaziJson();
    data.interactions.combinations.push({
      type: 'INVALID_TYPE' as any,
      positions: ['year', 'month'],
      branches: ['寅', '巳'],
      description: 'test',
    });
    expect(BaziJsonSchema.safeParse(data).success).toBe(false);
  });

  it('rejects invalid daYun direction', () => {
    const data = makeValidBaziJson();
    data.daYun.direction = 'SIDEWAYS' as any;
    expect(BaziJsonSchema.safeParse(data).success).toBe(false);
  });

  it('rejects ganzhi with wrong length', () => {
    const data = makeValidBaziJson();
    data.pillars.year.ganzhi = '甲' as any;
    expect(BaziJsonSchema.safeParse(data).success).toBe(false);
  });

  it('accepts null pattern name', () => {
    const data = makeValidBaziJson();
    data.pattern.name = null;
    expect(BaziJsonSchema.safeParse(data).success).toBe(true);
  });

  it('rejects completely invalid input', () => {
    expect(BaziJsonSchema.safeParse({}).success).toBe(false);
    expect(BaziJsonSchema.safeParse(null).success).toBe(false);
    expect(BaziJsonSchema.safeParse('string').success).toBe(false);
  });
});

describe('validateBaziJson', () => {
  it('returns parsed data for valid input', () => {
    const data = makeValidBaziJson();
    const result = validateBaziJson(data);
    expect(result.meta.engine).toBe('lunar-javascript');
    expect(result.dayMaster.stem).toBe('甲');
  });

  it('throws ZodError for invalid input', () => {
    expect(() => validateBaziJson({})).toThrow();
  });
});

describe('safeValidateBaziJson', () => {
  it('returns success=true for valid input', () => {
    const result = safeValidateBaziJson(makeValidBaziJson());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.meta.engine).toBe('lunar-javascript');
    }
  });

  it('returns success=false for invalid input', () => {
    const result = safeValidateBaziJson({ bad: 'data' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
  });
});
