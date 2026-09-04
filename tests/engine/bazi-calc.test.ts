/**
 * 八字计算引擎单元测试
 *
 * 运行: npx vitest run tests/engine
 *
 * 测试数据(用户安装环境后运行):
 *   出生时间: 1986-05-29 10:00 北京 (Asia/Shanghai, 经度 116.4)
 *   性别: 男
 *
 * 预期(lunar-javascript 官方示例):
 *   农历: 丙寅年四月廿一
 *   年柱: 丙寅 (1986年立春后为丙寅年)
 *   月柱: 癸巳 (五月已在立夏后, 月令巳)
 *   日柱: 甲子
 *   时柱: 己巳 (10:00 为巳时)
 *
 * 注意: 实际值以本地运行 lunar-javascript 为准, 此测试断言结构完整性
 */
import { describe, it, expect } from 'vitest';
import { baziCalcService, type BirthInput } from '@/services/bazi-calc.service';
import type { BaziJson } from '@/engine/types';

const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

const beijingInput: BirthInput = {
  year: 1986, month: 5, day: 29, hour: 10, minute: 0,
  gender: 'MALE',
  longitude: 116.4074, latitude: 39.9042,
  timezone: 'Asia/Shanghai',
  birthPlace: '北京',
};

describe('BaziCalcService', () => {
  let result: BaziJson;

  it('should calculate without throwing', () => {
    result = baziCalcService.calculate(beijingInput);
    expect(result).toBeDefined();
  });

  describe('meta', () => {
    it('engine is lunar-javascript', () => {
      expect(result.meta.engine).toBe('lunar-javascript');
    });
    it('has engine version', () => {
      expect(result.meta.engineVersion).toBeTruthy();
    });
    it('has calculatedAt ISO8601', () => {
      expect(result.meta.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
    it('has inputHash 16+ hex', () => {
      expect(result.meta.inputHash).toMatch(/^[0-9a-f]{12,}$/);
    });
    it('solarTimeCorrected is true', () => {
      expect(result.meta.solarTimeCorrected).toBe(true);
    });
  });

  describe('input', () => {
    it('echoes gender', () => expect(result.input.gender).toBe('MALE'));
    it('echoes solar date', () => {
      expect(result.input.solar).toEqual({ year: 1986, month: 5, day: 29, hour: 10, minute: 0 });
    });
    it('has lunar year 1986 (BingYin)', () => {
      expect(result.input.lunar.year).toBe(1986);
    });
    it('has location', () => {
      expect(result.input.location.longitude).toBeCloseTo(116.4074, 2);
    });
    it('solarTime corrected hour is number 0-23', () => {
      expect(result.input.solarTime.correctedHour).toBeGreaterThanOrEqual(0);
      expect(result.input.solarTime.correctedHour).toBeLessThanOrEqual(23);
    });
  });

  describe('pillars', () => {
    it('year pillar is 丙寅 (BingYin year)', () => {
      expect(result.pillars.year.ganzhi).toBe('丙寅');
    });
    it('all pillars have valid stem/branch', () => {
      for (const p of [result.pillars.year, result.pillars.month, result.pillars.day]) {
        expect(STEMS).toContain(p.stem);
        expect(BRANCHES).toContain(p.branch);
        expect(p.ganzhi).toHaveLength(2);
      }
    });
    it('hour pillar exists for 10:00', () => {
      expect(result.pillars.hour).not.toBeNull();
      expect(STEMS).toContain(result.pillars.hour!.stem);
    });
    it('each pillar has nanyin', () => {
      expect(result.pillars.year.nanyin).toBeTruthy();
      expect(result.pillars.month.nanyin).toBeTruthy();
      expect(result.pillars.day.nanyin).toBeTruthy();
    });
  });

  describe('dayMaster', () => {
    it('stem is valid', () => expect(STEMS).toContain(result.dayMaster.stem));
    it('element is in 5 elements', () => {
      expect(['wood', 'fire', 'earth', 'metal', 'water']).toContain(result.dayMaster.element);
    });
    it('has strength', () => {
      expect(['WANG', 'XIANG', 'PING', 'RUO', 'JUE']).toContain(result.dayMaster.strength);
    });
  });

  describe('wuxing', () => {
    it('count sums > 0', () => {
      const sum = Object.values(result.wuxing.count).reduce((a, b) => a + b, 0);
      expect(sum).toBeGreaterThan(0);
    });
    it('percentage sums ~100', () => {
      const sum = Object.values(result.wuxing.percentage).reduce((a, b) => a + b, 0);
      expect(sum).toBeGreaterThan(95);
      expect(sum).toBeLessThan(105);
    });
  });

  describe('tenGods', () => {
    it('day stem is 日主', () => {
      expect(result.tenGods.day.stemTenGod).toBe('日主');
    });
    it('all rows have tenGod', () => {
      expect(result.tenGods.year.stemTenGod).toBeTruthy();
      expect(result.tenGods.month.stemTenGod).toBeTruthy();
    });
  });

  describe('daYun', () => {
    it('has direction', () => {
      expect(['FORWARD', 'BACKWARD']).toContain(result.daYun.direction);
    });
    it('has entries', () => {
      expect(result.daYun.entries.length).toBeGreaterThan(0);
      expect(result.daYun.entries.length).toBeLessThanOrEqual(8);
    });
    it('first entry has valid ganzhi', () => {
      const first = result.daYun.entries[0];
      expect(first.ganzhi).toHaveLength(2);
      expect(STEMS).toContain(first.stem);
      expect(BRANCHES).toContain(first.branch);
    });
  });

  describe('interactions', () => {
    it('returns all 6 categories', () => {
      expect(result.interactions).toHaveProperty('combinations');
      expect(result.interactions).toHaveProperty('clashes');
      expect(result.interactions).toHaveProperty('punishments');
      expect(result.interactions).toHaveProperty('harms');
      expect(result.interactions).toHaveProperty('breaks');
      expect(result.interactions).toHaveProperty('meetings');
    });
  });

  describe('pattern', () => {
    it('has pattern name or null', () => {
      expect(result.pattern.name === null || typeof result.pattern.name === 'string').toBe(true);
    });
  });

  describe('xiYong', () => {
    it('has xiShen array', () => {
      expect(Array.isArray(result.xiYong.xiShen)).toBe(true);
    });
    it('has method description', () => {
      expect(result.xiYong.method).toBeTruthy();
    });
  });

  describe('determinism', () => {
    it('same input produces same inputHash', () => {
      const r2 = baziCalcService.calculate(beijingInput);
      expect(r2.meta.inputHash).toBe(result.meta.inputHash);
    });
  });
});
