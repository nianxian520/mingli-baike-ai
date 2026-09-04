/**
 * RuleEngine 单元测试 (内存模式, 不依赖 Prisma)
 *
 * 运行: npx vitest run tests/rules
 */
import { describe, it, expect } from 'vitest';
import { RuleEngine, type LoadedRule } from '@/services/rule-engine';
import type { BaziJson } from '@/engine/types';

// 构造一个最小可用的 BaziJson (用于 DSL 测试)
function mockBazi(overrides: Partial<BaziJson> = {}): BaziJson {
  return {
    meta: {
      engine: 'lunar-javascript',
      engineVersion: '1.6.12',
      calculatedAt: '2026-09-03T00:00:00.000Z',
      inputHash: 'abc123',
      solarTimeCorrected: true,
    },
    input: {
      gender: 'MALE',
      solar: { year: 1986, month: 5, day: 29, hour: 10, minute: 0 },
      lunar: {
        year: 1986, month: 4, day: 21, isLeapMonth: false,
        monthName: '四月', dayName: '廿一',
      },
      location: { longitude: 116.4, latitude: 39.9, timezone: 'Asia/Shanghai' },
      solarTime: {
        originalHour: 10, originalMinute: 0, offsetMin: -10,
        correctedHour: 9, correctedMinute: 50, dayRolled: false,
      },
    },
    jieqi: {
      current: { name: '立夏', time: '1986-05-05 12:00:00' },
      previous: { name: '谷雨', time: '1986-04-20 06:00:00' },
      next: { name: '芒种', time: '1986-06-05 16:00:00' },
    },
    pillars: {
      year: {
        ganzhi: '丙寅', stem: '丙', branch: '寅',
        stemElement: 'fire', branchElement: 'wood',
        nanyin: '炉中火', shishen: '食神', changSheng: '长生',
      },
      month: {
        ganzhi: '癸巳', stem: '癸', branch: '巳',
        stemElement: 'water', branchElement: 'fire',
        nanyin: '长流水', shishen: '正印', changSheng: '胎',
      },
      day: {
        ganzhi: '甲子', stem: '甲', branch: '子',
        stemElement: 'wood', branchElement: 'water',
        nanyin: '海中金', shishen: '日主', changSheng: '沐浴',
      },
      hour: {
        ganzhi: '己巳', stem: '己', branch: '巳',
        stemElement: 'earth', branchElement: 'fire',
        nanyin: '大林木', shishen: '正财', changSheng: '病',
      },
    },
    dayMaster: {
      stem: '甲', element: 'wood', yinYang: 'YANG', strength: 'XIANG',
    },
    wuxing: {
      count: { wood: 2, fire: 3, earth: 1, metal: 0, water: 2 },
      percentage: { wood: 25, fire: 37.5, earth: 12.5, metal: 0, water: 25 },
      missing: ['metal'],
      dominant: ['fire'],
    },
    tenGods: {
      year: { stem: '丙', branch: '寅', stemTenGod: '食神', branchTenGod: '比肩', branchHidden: [{ stem: '甲', tenGod: '比肩' }] },
      month: { stem: '癸', branch: '巳', stemTenGod: '正印', branchTenGod: '食神', branchHidden: [{ stem: '丙', tenGod: '食神' }] },
      day: { stem: '甲', branch: '子', stemTenGod: '日主', branchTenGod: '正印', branchHidden: [{ stem: '癸', tenGod: '正印' }] },
      hour: { stem: '己', branch: '巳', stemTenGod: '正财', branchTenGod: '食神', branchHidden: [{ stem: '丙', tenGod: '食神' }] },
    },
    nanyin: { year: '炉中火', month: '长流水', day: '海中金', hour: '大林木' },
    hiddenStems: { year: ['甲', '丙', '戊'], month: ['丙', '庚', '戊'], day: ['癸'], hour: ['丙', '庚', '戊'] },
    interactions: {
      combinations: [],
      clashes: [],
      punishments: [],
      harms: [],
      breaks: [],
      meetings: [],
    },
    daYun: {
      direction: 'FORWARD', startAge: 5, startYear: 1991,
      entries: [
        { index: 1, ganzhi: '甲午', stem: '甲', branch: '午', startAge: 5, endAge: 14, startYear: 1991, endYear: 2000 },
      ],
    },
    liuNian: [
      { year: 1986, age: 1, ganzhi: '丙寅', stem: '丙', branch: '寅' },
    ],
    shenSha: { year: [], month: [], day: [], hour: [] },
    pattern: { name: '正印格', description: '月令巳, 透癸, 取正印格' },
    xiYong: {
      xiShen: ['fire'], yongShen: ['fire'], jiShen: ['water'],
      method: '偏旺则克泄',
    },
    ...overrides,
  } as BaziJson;
}

function mockRule(code: string, conditions: any, priority = 50, confidence = 0.5): LoadedRule {
  return {
    id: 'r-' + code,
    code,
    category: 'test',
    subcategory: null,
    name: 'Test rule ' + code,
    description: '',
    conditions,
    priority,
    confidence,
    tags: [],
    source: null,
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ruleStatements: [],
  } as unknown as LoadedRule;
}

describe('RuleEngine DSL evaluation', () => {
  const engine = new RuleEngine(); // 无 prisma (内存模式)
  const bazi = mockBazi();

  it('AND with all true → true', () => {
    const rules = [mockRule('R1', {
      op: 'AND',
      children: [
        { op: 'STEM_IS', position: 'day', stem: '甲' },
        { op: 'BRANCH_IS', position: 'day', branch: '子' },
      ],
    })];
    const matched = engine.matchWithRules(bazi, rules);
    expect(matched).toHaveLength(1);
  });

  it('AND with one false → false', () => {
    const rules = [mockRule('R2', {
      op: 'AND',
      children: [
        { op: 'STEM_IS', position: 'day', stem: '甲' },
        { op: 'STEM_IS', position: 'day', stem: '乙' },
      ],
    })];
    expect(engine.matchWithRules(bazi, rules)).toHaveLength(0);
  });

  it('OR with one true → true', () => {
    const rules = [mockRule('R3', {
      op: 'OR',
      children: [
        { op: 'STEM_IS', position: 'day', stem: '乙' },
        { op: 'BRANCH_IS', position: 'day', branch: '子' },
      ],
    })];
    expect(engine.matchWithRules(bazi, rules)).toHaveLength(1);
  });

  it('NOT inverts', () => {
    const rules = [mockRule('R4', {
      op: 'NOT',
      child: { op: 'STEM_IS', position: 'day', stem: '乙' },
    })];
    expect(engine.matchWithRules(bazi, rules)).toHaveLength(1);
  });

  it('TEN_GOD_AT month matches stem tenGod', () => {
    const rules = [mockRule('R5', {
      op: 'TEN_GOD_AT', position: 'month', tenGod: '正印',
    })];
    expect(engine.matchWithRules(bazi, rules)).toHaveLength(1);
  });

  it('WUXING_MISSING detects metal', () => {
    const rules = [mockRule('R6', {
      op: 'WUXING_MISSING', elements: ['metal'],
    })];
    expect(engine.matchWithRules(bazi, rules)).toHaveLength(1);
  });

  it('WUXING_DOMINANT detects fire', () => {
    const rules = [mockRule('R7', {
      op: 'WUXING_DOMINANT', elements: ['fire'],
    })];
    expect(engine.matchWithRules(bazi, rules)).toHaveLength(1);
  });

  it('DAY_MASTER_STRENGTH matches XIANG', () => {
    const rules = [mockRule('R8', {
      op: 'DAY_MASTER_STRENGTH', level: 'XIANG',
    })];
    expect(engine.matchWithRules(bazi, rules)).toHaveLength(1);
  });

  it('PATTERN_IS matches 正印格', () => {
    const rules = [mockRule('R9', {
      op: 'PATTERN_IS', pattern: '正印格',
    })];
    expect(engine.matchWithRules(bazi, rules)).toHaveLength(1);
  });

  it('EQ on gender', () => {
    const rules = [mockRule('R10', {
      op: 'EQ', path: 'input.gender', value: 'MALE',
    })];
    expect(engine.matchWithRules(bazi, rules)).toHaveLength(1);
  });

  it('DAYUN_PILLAR matches 甲午', () => {
    const rules = [mockRule('R11', {
      op: 'DAYUN_PILLAR', ganzhi: '甲午',
    })];
    expect(engine.matchWithRules(bazi, rules)).toHaveLength(1);
  });

  it('sorting by priority desc then confidence desc', () => {
    const rules = [
      mockRule('LOW', { op: 'STEM_IS', position: 'day', stem: '甲' }, 30, 0.5),
      mockRule('HIGH', { op: 'STEM_IS', position: 'day', stem: '甲' }, 90, 0.8),
      mockRule('MID', { op: 'STEM_IS', position: 'day', stem: '甲' }, 60, 0.9),
    ];
    const matched = engine.matchWithRules(bazi, rules);
    expect(matched[0].ruleCode).toBe('HIGH');
    expect(matched[1].ruleCode).toBe('MID');
    expect(matched[2].ruleCode).toBe('LOW');
  });

  it('respects limit', () => {
    const rules = Array.from({ length: 10 }, (_, i) =>
      mockRule('R' + i, { op: 'STEM_IS', position: 'day', stem: '甲' }),
    );
    const matched = engine.matchWithRules(bazi, rules, 3);
    expect(matched).toHaveLength(3);
  });
});
