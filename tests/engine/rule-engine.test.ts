/**
 * Rule Engine 单元测试
 *
 * 运行: npx vitest run tests/engine/rule-engine
 *
 * 测试策略:
 * - 使用 RuleEngine.matchWithRules (内存模式) 避免依赖数据库
 * - 构造 mock BaziJson 覆盖各 DSL 条件分支
 * - 验证 evalCondition 对每种 op 的正确性
 * - 验证排序 (priority/confidence desc) 和 limit 截断
 */
import { describe, it, expect } from 'vitest';
import { RuleEngine } from '@/services/rule-engine';
import type { BaziJson, WuXing } from '@/engine/types';
import type { Condition } from '@/engine/rule-dsl';
import type { LoadedRule } from '@/services/rule-engine';

// ============ Mock BaziJson 工厂 ============
function makeBazi(overrides: Partial<BaziJson> = {}): BaziJson {
  return {
    meta: {
      engine: 'lunar-javascript',
      engineVersion: '1.0.0',
      calculatedAt: '2026-01-01T00:00:00Z',
      inputHash: 'abc123',
      solarTimeCorrected: true,
    },
    input: {
      gender: 'MALE',
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
      missing: ['metal'] as WuXing[],
      dominant: ['fire'] as WuXing[],
    },
    tenGods: {
      year: { stem: '丙', branch: '寅', stemTenGod: '食神', branchTenGod: '比肩', branchHidden: [{ stem: '甲', tenGod: '比主' }] },
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
      direction: 'FORWARD',
      startAge: 5,
      startYear: 1991,
      entries: [
        { index: 1, ganzhi: '甲午', stem: '甲', branch: '午', startAge: 5, endAge: 14, startYear: 1991, endYear: 2000 },
        { index: 2, ganzhi: '乙未', stem: '乙', branch: '未', startAge: 15, endAge: 24, startYear: 2001, endYear: 2010 },
      ],
    },
    liuNian: [
      { year: 2026, age: 40, ganzhi: '丙午', stem: '丙', branch: '午' },
    ],
    shenSha: { year: ['驿马'], month: [], day: ['天乙贵人'], hour: [] },
    pattern: { name: '食神格', description: '月令巳中丙火食神透干' },
    xiYong: { xiShen: ['water', 'wood'] as WuXing[], yongShen: ['water'] as WuXing[], jiShen: ['metal', 'earth'] as WuXing[], method: '子平扶抑法' },
    ...overrides,
  } as BaziJson;
}

function makeRule(code: string, conditions: Condition, priority = 50, confidence = 0.7): LoadedRule {
  return {
    id: code,
    code,
    category: 'test',
    subcategory: null,
    name: `测试规则${code}`,
    description: null,
    conditions,
    priority,
    confidence,
    tags: [],
    source: null,
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ruleStatements: [],
  };
}

const engine = new RuleEngine();

describe('RuleEngine.evalCondition', () => {
  const bazi = makeBazi();

  it('AND: all true → true', () => {
    expect(engine.evalCondition({ op: 'AND', children: [
      { op: 'DAY_MASTER_STRENGTH', level: 'RUO' },
      { op: 'PATTERN_IS', pattern: '食神格' },
    ]}, bazi)).toBe(true);
  });

  it('AND: one false → false', () => {
    expect(engine.evalCondition({ op: 'AND', children: [
      { op: 'DAY_MASTER_STRENGTH', level: 'RUO' },
      { op: 'DAY_MASTER_STRENGTH', level: 'WANG' },
    ]}, bazi)).toBe(false);
  });

  it('OR: one true → true', () => {
    expect(engine.evalCondition({ op: 'OR', children: [
      { op: 'DAY_MASTER_STRENGTH', level: 'WANG' },
      { op: 'DAY_MASTER_STRENGTH', level: 'RUO' },
    ]}, bazi)).toBe(true);
  });

  it('OR: all false → false', () => {
    expect(engine.evalCondition({ op: 'OR', children: [
      { op: 'DAY_MASTER_STRENGTH', level: 'WANG' },
      { op: 'DAY_MASTER_STRENGTH', level: 'JUE' },
    ]}, bazi)).toBe(false);
  });

  it('NOT: inverts result', () => {
    expect(engine.evalCondition({ op: 'NOT', child: { op: 'DAY_MASTER_STRENGTH', level: 'WANG' }}, bazi)).toBe(true);
    expect(engine.evalCondition({ op: 'NOT', child: { op: 'DAY_MASTER_STRENGTH', level: 'RUO' }}, bazi)).toBe(false);
  });

  it('EQ: matches nested path', () => {
    expect(engine.evalCondition({ op: 'EQ', path: 'dayMaster.stem', value: '甲' }, bazi)).toBe(true);
    expect(engine.evalCondition({ op: 'EQ', path: 'dayMaster.stem', value: '乙' }, bazi)).toBe(false);
  });

  it('IN: value in list', () => {
    expect(engine.evalCondition({ op: 'IN', path: 'dayMaster.strength', values: ['WANG', 'RUO'] }, bazi)).toBe(true);
    expect(engine.evalCondition({ op: 'IN', path: 'dayMaster.strength', values: ['WANG', 'XIANG'] }, bazi)).toBe(false);
  });

  it('CONTAINS: array contains value', () => {
    expect(engine.evalCondition({ op: 'CONTAINS', path: 'wuxing.missing', value: 'metal' }, bazi)).toBe(true);
    expect(engine.evalCondition({ op: 'CONTAINS', path: 'wuxing.missing', value: 'wood' }, bazi)).toBe(false);
  });

  it('STEM_IS: checks pillar stem', () => {
    expect(engine.evalCondition({ op: 'STEM_IS', position: 'year', stem: '丙' }, bazi)).toBe(true);
    expect(engine.evalCondition({ op: 'STEM_IS', position: 'year', stem: '甲' }, bazi)).toBe(false);
  });

  it('BRANCH_IS: checks pillar branch', () => {
    expect(engine.evalCondition({ op: 'BRANCH_IS', position: 'day', branch: '子' }, bazi)).toBe(true);
  });

  it('GANZHI_IS: checks pillar ganzhi', () => {
    expect(engine.evalCondition({ op: 'GANZHI_IS', position: 'year', ganzhi: '丙寅' }, bazi)).toBe(true);
    expect(engine.evalCondition({ op: 'GANZHI_IS', position: 'year', ganzhi: '甲子' }, bazi)).toBe(false);
  });

  it('WUXING_MISSING: checks missing elements', () => {
    expect(engine.evalCondition({ op: 'WUXING_MISSING', elements: ['metal'] }, bazi)).toBe(true);
    expect(engine.evalCondition({ op: 'WUXING_MISSING', elements: ['wood'] }, bazi)).toBe(false);
  });

  it('WUXING_DOMINANT: checks dominant elements', () => {
    expect(engine.evalCondition({ op: 'WUXING_DOMINANT', elements: ['fire'] }, bazi)).toBe(true);
    expect(engine.evalCondition({ op: 'WUXING_DOMINANT', elements: ['water'] }, bazi)).toBe(false);
  });

  it('TEN_GOD_AT: checks ten god at position', () => {
    expect(engine.evalCondition({ op: 'TEN_GOD_AT', position: 'month', tenGod: '正官' }, bazi)).toBe(true);
    expect(engine.evalCondition({ op: 'TEN_GOD_AT', position: 'month', tenGod: '七杀' }, bazi)).toBe(false);
  });

  it('DAY_MASTER_STRENGTH: checks strength level', () => {
    expect(engine.evalCondition({ op: 'DAY_MASTER_STRENGTH', level: 'RUO' }, bazi)).toBe(true);
    expect(engine.evalCondition({ op: 'DAY_MASTER_STRENGTH', level: 'WANG' }, bazi)).toBe(false);
  });

  it('PATTERN_IS: checks pattern name', () => {
    expect(engine.evalCondition({ op: 'PATTERN_IS', pattern: '食神格' }, bazi)).toBe(true);
    expect(engine.evalCondition({ op: 'PATTERN_IS', pattern: '正官格' }, bazi)).toBe(false);
  });

  it('PATTERN_IS: null pattern returns false', () => {
    const b = makeBazi({ pattern: { name: null, description: '未定' } } as any);
    expect(engine.evalCondition({ op: 'PATTERN_IS', pattern: '正官格' }, b)).toBe(false);
  });

  it('DAYUN_PILLAR: checks daYun entries', () => {
    expect(engine.evalCondition({ op: 'DAYUN_PILLAR', ganzhi: '甲午' }, bazi)).toBe(true);
    expect(engine.evalCondition({ op: 'DAYUN_PILLAR', ganzhi: '壬申' }, bazi)).toBe(false);
  });

  it('LIUNIAN_PILLAR: checks liuNian entries', () => {
    expect(engine.evalCondition({ op: 'LIUNIAN_PILLAR', year: 2026 }, bazi)).toBe(true);
    expect(engine.evalCondition({ op: 'LIUNIAN_PILLAR', year: 2000 }, bazi)).toBe(false);
  });

  it('XIYONG_INCLUDES: checks xi+yong elements', () => {
    expect(engine.evalCondition({ op: 'XIYONG_INCLUDES', elements: ['water'] }, bazi)).toBe(true);
    expect(engine.evalCondition({ op: 'XIYONG_INCLUDES', elements: ['metal'] }, bazi)).toBe(false);
  });

  it('HAS_INTERACTION: empty interactions → false', () => {
    expect(engine.evalCondition({ op: 'HAS_INTERACTION', type: 'CLASH' }, bazi)).toBe(false);
  });

  it('unknown op → false', () => {
    expect(engine.evalCondition({ op: 'UNKNOWN_OP' } as any, bazi)).toBe(false);
  });
});

describe('RuleEngine.matchWithRules', () => {
  const bazi = makeBazi();

  it('returns matched rules sorted by priority desc', () => {
    const rules = [
      makeRule('R1', { op: 'DAY_MASTER_STRENGTH', level: 'RUO' }, 50, 0.7),
      makeRule('R2', { op: 'DAY_MASTER_STRENGTH', level: 'RUO' }, 90, 0.8),
      makeRule('R3', { op: 'DAY_MASTER_STRENGTH', level: 'WANG' }, 100, 0.9),
    ];
    const result = engine.matchWithRules(bazi, rules);
    expect(result).toHaveLength(2);
    expect(result[0].ruleCode).toBe('R2');
    expect(result[1].ruleCode).toBe('R1');
  });

  it('respects limit parameter', () => {
    const rules = [
      makeRule('R1', { op: 'DAY_MASTER_STRENGTH', level: 'RUO' }, 50, 0.7),
      makeRule('R2', { op: 'PATTERN_IS', pattern: '食神格' }, 60, 0.8),
    ];
    const result = engine.matchWithRules(bazi, rules, 1);
    expect(result).toHaveLength(1);
    expect(result[0].ruleCode).toBe('R2');
  });

  it('skips disabled rules', () => {
    const rules = [
      { ...makeRule('R1', { op: 'DAY_MASTER_STRENGTH', level: 'RUO' }), enabled: false },
    ];
    const result = engine.matchWithRules(bazi, rules);
    expect(result).toHaveLength(0);
  });

  it('single rule eval error does not crash others', () => {
    const rules = [
      makeRule('BAD', { op: 'EQ', path: 'nonexistent.deep.path', value: 'x' }, 50, 0.5),
      makeRule('GOOD', { op: 'DAY_MASTER_STRENGTH', level: 'RUO' }, 60, 0.7),
    ];
    const result = engine.matchWithRules(bazi, rules);
    expect(result.some((r) => r.ruleCode === 'GOOD')).toBe(true);
  });

  it('includes statements from ruleStatements', () => {
    const rule = makeRule('R1', { op: 'DAY_MASTER_STRENGTH', level: 'RUO' });
    rule.ruleStatements = [{
      statement: {
        id: 'S1', code: 'S-TEST-001', category: 'test', subcategory: null,
        statement: '测试断语', interpretation: null, sourceId: null,
        source: null, tags: [], conditions: null, priority: 50,
        confidence: 0.8, enabled: true, createdAt: new Date(), updatedAt: new Date(),
      },
    }];
    const result = engine.matchWithRules(bazi, [rule]);
    expect(result[0].statements).toHaveLength(1);
    expect(result[0].statements[0].code).toBe('S-TEST-001');
  });
});
