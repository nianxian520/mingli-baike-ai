/**
 * BaziJson Schema 校验测试
 *
 * 运行: npx vitest run tests/schemas
 *
 * 验证: 引擎产出的 BaziJson 必须通过 Zod schema 校验
 * 如果 lunar-javascript API 有偏差, 此测试会精确指出哪个字段不符合
 */
import { describe, it, expect } from 'vitest';
import { baziCalcService } from '@/services/bazi-calc.service';
import { validateBaziJson, safeValidateBaziJson } from '@/lib/schemas/bazi-output';

const beijingInput = {
  year: 1986, month: 5, day: 29, hour: 10, minute: 0,
  gender: 'MALE' as const,
  longitude: 116.4074, latitude: 39.9042,
  timezone: 'Asia/Shanghai',
  birthPlace: '北京',
};

describe('BaziJsonSchema validation', () => {
  const bazi = baziCalcService.calculate(beijingInput);

  it('passes strict validation', () => {
    const result = safeValidateBaziJson(bazi);
    if (!result.success) {
      // 打印具体错误便于调试
      console.error('Schema validation failed:', JSON.stringify(result.error.issues, null, 2));
    }
    expect(result.success).toBe(true);
  });

  it('passes parse (throws on failure)', () => {
    expect(() => validateBaziJson(bazi)).not.toThrow();
  });

  it('rejects missing meta', () => {
    const bad = { ...bazi, meta: undefined };
    expect(safeValidateBaziJson(bad).success).toBe(false);
  });

  it('rejects invalid gender', () => {
    const bad = {
      ...bazi,
      input: { ...bazi.input, gender: 'OTHER' },
    };
    expect(safeValidateBaziJson(bad).success).toBe(false);
  });

  it('rejects invalid wuxing', () => {
    const bad = {
      ...bazi,
      dayMaster: { ...bazi.dayMaster, element: 'AIR' },
    };
    expect(safeValidateBaziJson(bad).success).toBe(false);
  });
});
