'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Calculator } from 'lucide-react';
import type { BaziJson } from '@/engine/types';

/**
 * 预设城市 (中国大陆主要城市)
 * 用于一键填充经纬度/时区
 */
const PRESET_CITIES: Record<
  string,
  { longitude: number; latitude: number; timezone: string; placeName: string }
> = {
  beijing: { longitude: 116.4074, latitude: 39.9042, timezone: 'Asia/Shanghai', placeName: '北京' },
  shanghai: { longitude: 121.4737, latitude: 31.2304, timezone: 'Asia/Shanghai', placeName: '上海' },
  guangzhou: { longitude: 113.2644, latitude: 23.1291, timezone: 'Asia/Shanghai', placeName: '广州' },
  shenzhen: { longitude: 114.0579, latitude: 22.5431, timezone: 'Asia/Shanghai', placeName: '深圳' },
  chengdu: { longitude: 104.0668, latitude: 30.5728, timezone: 'Asia/Shanghai', placeName: '成都' },
  chongqing: { longitude: 106.5043, latitude: 29.5332, timezone: 'Asia/Shanghai', placeName: '重庆' },
  xian: { longitude: 108.9398, latitude: 34.3416, timezone: 'Asia/Shanghai', placeName: '西安' },
  wuhan: { longitude: 114.3055, latitude: 30.5928, timezone: 'Asia/Shanghai', placeName: '武汉' },
  hangzhou: { longitude: 120.1551, latitude: 30.2741, timezone: 'Asia/Shanghai', placeName: '杭州' },
  nanjing: { longitude: 118.7969, latitude: 32.0603, timezone: 'Asia/Shanghai', placeName: '南京' },
  tianjin: { longitude: 117.1901, latitude: 39.1252, timezone: 'Asia/Shanghai', placeName: '天津' },
  harbin: { longitude: 126.534, latitude: 45.8038, timezone: 'Asia/Shanghai', placeName: '哈尔滨' },
  kunming: { longitude: 102.8329, latitude: 24.8801, timezone: 'Asia/Shanghai', placeName: '昆明' },
  urumqi: { longitude: 87.6168, latitude: 43.8256, timezone: 'Asia/Urumqi', placeName: '乌鲁木齐' },
  lhasa: { longitude: 91.1322, latitude: 29.6604, timezone: 'Asia/Urumqi', placeName: '拉萨' },
  hongkong: { longitude: 114.1694, latitude: 22.3193, timezone: 'Asia/Hong_Kong', placeName: '香港' },
  taipei: { longitude: 121.5654, latitude: 25.033, timezone: 'Asia/Taipei', placeName: '台北' },
  singapore: { longitude: 103.8198, latitude: 1.3521, timezone: 'Asia/Singapore', placeName: '新加坡' },
  tokyo: { longitude: 139.6917, latitude: 35.6895, timezone: 'Asia/Tokyo', placeName: '东京' },
  newyork: { longitude: -74.006, latitude: 40.7128, timezone: 'America/New_York', placeName: '纽约' },
};

export interface BaziFormResult {
  chartId: string;
  bazi: BaziJson;
  cached: boolean;
}

interface BaziFormProps {
  onResult: (result: BaziFormResult) => void;
}

interface FormState {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  gender: 'MALE' | 'FEMALE' | '';
  longitude: string;
  latitude: string;
  timezone: string;
  birthPlace: string;
  cityPreset: string;
}

const INITIAL_STATE: FormState = {
  year: '1990',
  month: '1',
  day: '1',
  hour: '12',
  minute: '0',
  gender: '',
  longitude: '116.4074',
  latitude: '39.9042',
  timezone: 'Asia/Shanghai',
  birthPlace: '北京',
  cityPreset: 'beijing',
};

export function BaziForm({ onResult }: BaziFormProps) {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((s) => ({ ...s, [key]: value }));
  }

  function applyCityPreset(key: string) {
    const city = PRESET_CITIES[key];
    if (!city) return;
    setForm((s) => ({
      ...s,
      cityPreset: key,
      longitude: city.longitude.toString(),
      latitude: city.latitude.toString(),
      timezone: city.timezone,
      birthPlace: city.placeName,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    // 客户端基础校验 (Zod 在服务端再做严格校验)
    const errors: Record<string, string> = {};
    if (!form.gender) errors.gender = '请选择性别';
    const year = Number(form.year);
    const month = Number(form.month);
    const day = Number(form.day);
    const hour = Number(form.hour);
    const minute = Number(form.minute);
    const longitude = Number(form.longitude);
    const latitude = Number(form.latitude);

    if (!Number.isFinite(year) || year < 1900 || year > 2100)
      errors.year = '年份须在 1900-2100';
    if (!Number.isFinite(month) || month < 1 || month > 12)
      errors.month = '月份 1-12';
    if (!Number.isFinite(day) || day < 1 || day > 31)
      errors.day = '日期 1-31';
    if (!Number.isFinite(hour) || hour < 0 || hour > 23)
      errors.hour = '小时 0-23';
    if (!Number.isFinite(minute) || minute < 0 || minute > 59)
      errors.minute = '分钟 0-59';
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)
      errors.longitude = '经度 -180~180';
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)
      errors.latitude = '纬度 -90~90';
    if (!form.timezone) errors.timezone = '请填写时区';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/bazi/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year,
          month,
          day,
          hour,
          minute,
          gender: form.gender,
          longitude,
          latitude,
          timezone: form.timezone,
          birthPlace: form.birthPlace || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        const msg = json?.error?.message ?? '计算失败';
        setError(msg);
        return;
      }
      onResult(json.data as BaziFormResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : '网络错误');
    } finally {
      setLoading(false);
    }
  }

  const err = (k: string) =>
    fieldErrors[k] ? (
      <p className="mt-1 text-xs text-destructive">{fieldErrors[k]}</p>
    ) : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 性别 */}
      <div className="space-y-2">
        <Label>性别 *</Label>
        <Select
          value={form.gender}
          onValueChange={(v) => update('gender', v as 'MALE' | 'FEMALE')}
        >
          <SelectTrigger>
            <SelectValue placeholder="请选择性别" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MALE">男</SelectItem>
            <SelectItem value="FEMALE">女</SelectItem>
          </SelectContent>
        </Select>
        {err('gender')}
      </div>

      {/* 出生时间 */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <div className="space-y-2">
          <Label htmlFor="year">年 *</Label>
          <Input
            id="year"
            inputMode="numeric"
            value={form.year}
            onChange={(e) => update('year', e.target.value)}
            placeholder="1990"
          />
          {err('year')}
        </div>
        <div className="space-y-2">
          <Label htmlFor="month">月 *</Label>
          <Input
            id="month"
            inputMode="numeric"
            value={form.month}
            onChange={(e) => update('month', e.target.value)}
            placeholder="1"
          />
          {err('month')}
        </div>
        <div className="space-y-2">
          <Label htmlFor="day">日 *</Label>
          <Input
            id="day"
            inputMode="numeric"
            value={form.day}
            onChange={(e) => update('day', e.target.value)}
            placeholder="1"
          />
          {err('day')}
        </div>
        <div className="space-y-2">
          <Label htmlFor="hour">时 *</Label>
          <Input
            id="hour"
            inputMode="numeric"
            value={form.hour}
            onChange={(e) => update('hour', e.target.value)}
            placeholder="12"
          />
          {err('hour')}
        </div>
        <div className="space-y-2">
          <Label htmlFor="minute">分</Label>
          <Input
            id="minute"
            inputMode="numeric"
            value={form.minute}
            onChange={(e) => update('minute', e.target.value)}
            placeholder="0"
          />
          {err('minute')}
        </div>
      </div>

      {/* 出生地点 (预设) */}
      <div className="space-y-2">
        <Label>出生地点 (快捷选择)</Label>
        <Select value={form.cityPreset} onValueChange={applyCityPreset}>
          <SelectTrigger>
            <SelectValue placeholder="选择常用城市自动填充经纬度" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PRESET_CITIES).map(([key, city]) => (
              <SelectItem key={key} value={key}>
                {city.placeName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 经纬度 / 时区 (可手动覆盖) */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="longitude">经度 *</Label>
          <Input
            id="longitude"
            inputMode="decimal"
            value={form.longitude}
            onChange={(e) => update('longitude', e.target.value)}
            placeholder="116.4074"
          />
          {err('longitude')}
        </div>
        <div className="space-y-2">
          <Label htmlFor="latitude">纬度 *</Label>
          <Input
            id="latitude"
            inputMode="decimal"
            value={form.latitude}
            onChange={(e) => update('latitude', e.target.value)}
            placeholder="39.9042"
          />
          {err('latitude')}
        </div>
        <div className="space-y-2">
          <Label htmlFor="timezone">时区 *</Label>
          <Input
            id="timezone"
            value={form.timezone}
            onChange={(e) => update('timezone', e.target.value)}
            placeholder="Asia/Shanghai"
          />
          {err('timezone')}
        </div>
        <div className="space-y-2">
          <Label htmlFor="birthPlace">地点名称</Label>
          <Input
            id="birthPlace"
            value={form.birthPlace}
            onChange={(e) => update('birthPlace', e.target.value)}
            placeholder="北京"
          />
        </div>
      </div>

      {/* 提交 */}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={loading} size="lg">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              计算中…
            </>
          ) : (
            <>
              <Calculator className="mr-2 h-4 w-4" />
              排盘
            </>
          )}
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <p className="text-xs text-muted-foreground">
        本系统基于 lunar-javascript 历法库进行确定性计算，结果可复现。命理内容仅作传统文化学术研究，不构成任何决策建议。
      </p>
    </form>
  );
}
