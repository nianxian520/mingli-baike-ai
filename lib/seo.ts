/**
 * SEO 元数据辅助工具
 *
 * 提供:
 * - 站点配置常量
 * - 通用的页面元数据构建函数
 * - Schema.org JSON-LD 构建器
 */

export const SITE = {
  name: '命理百科 AI',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  locale: 'zh-CN',
  description:
    '基于确定性八字引擎与结构化命理知识库的传统文化学术研究平台。出生时间 → 四柱 → 五行 → 十神 → 大运 → 流年 → 命理规则 → 断语 → AI 解释。',
  keywords: [
    '八字',
    '八字排盘',
    '四柱八字',
    '天干地支',
    '六十甲子',
    '十神',
    '五行',
    '大运',
    '流年',
    '命理百科',
    '八字计算',
    '中国传统文化',
  ],
};

export interface PageMetaOptions {
  title: string;
  description: string;
  canonical: string; // path e.g. '/bazi/1990'
  keywords?: string[];
  ogType?: 'website' | 'article';
  noIndex?: boolean;
}

/**
 * 构建单个页面的 Metadata 对象 (用于 Next.js generateMetadata)
 */
export function buildPageMeta(opts: PageMetaOptions) {
  const url = `${SITE.url}${opts.canonical}`;
  return {
    title: opts.title,
    description: opts.description,
    keywords: opts.keywords ?? SITE.keywords,
    alternates: { canonical: opts.canonical },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url,
      siteName: SITE.name,
      locale: SITE.locale,
      type: opts.ogType ?? 'article',
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: opts.title,
      description: opts.description,
    },
    robots: opts.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

/**
 * 站点级 Schema.org WebSite + Organization JSON-LD
 * 注入到根 layout
 */
export function buildSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE.url}/#website`,
        url: SITE.url,
        name: SITE.name,
        description: SITE.description,
        inLanguage: SITE.locale,
        publisher: { '@id': `${SITE.url}/#org` },
      },
      {
        '@type': 'Organization',
        '@id': `${SITE.url}/#org`,
        name: SITE.name,
        url: SITE.url,
        description: SITE.description,
        areaServed: 'CN',
        knowsAbout: [
          '八字命理',
          '四柱八字',
          '天干地支',
          '五行',
          '十神',
          '大运流年',
          '中国传统文化',
        ],
      },
    ],
  };
}

/**
 * BreadcrumbList JSON-LD
 */
export function buildBreadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE.url}${item.url}`,
    })),
  };
}
