import type { MetadataRoute } from 'next';
import {
  TIANGAN_INFO,
  DIZHI_INFO,
  GANZHI_LIST,
  SHISHEN_INFO,
  WUXING_INFO,
} from '@/lib/encyclopedia-data';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // 静态页
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE}/bazi`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
  ];

  // 天干
  const tiangan: MetadataRoute.Sitemap = TIANGAN_INFO.map((t) => ({
    url: `${BASE}/tiangan/${t.stem}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  // 地支
  const dizhi: MetadataRoute.Sitemap = DIZHI_INFO.map((d) => ({
    url: `${BASE}/dizhi/${d.branch}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  // 六十甲子
  const ganzhi: MetadataRoute.Sitemap = GANZHI_LIST.map((g) => ({
    url: `${BASE}/ganzhi/${g.ganzhi}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  // 十神
  const shishen: MetadataRoute.Sitemap = SHISHEN_INFO.map((s) => ({
    url: `${BASE}/shishen/${s.key}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  // 五行
  const wuxing: MetadataRoute.Sitemap = WUXING_INFO.map((w) => ({
    url: `${BASE}/wuxing/${w.key}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  // 日主
  const dayMaster: MetadataRoute.Sitemap = TIANGAN_INFO.map((t) => ({
    url: `${BASE}/bazi/day-master/${t.stem}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  // 八字年页 (1950-2030)
  const baziYears: MetadataRoute.Sitemap = Array.from({ length: 81 }, (_, i) => ({
    url: `${BASE}/bazi/${1950 + i}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.5,
  }));

  return [
    ...staticRoutes,
    ...tiangan,
    ...dizhi,
    ...ganzhi,
    ...shishen,
    ...wuxing,
    ...dayMaster,
    ...baziYears,
  ];
}
