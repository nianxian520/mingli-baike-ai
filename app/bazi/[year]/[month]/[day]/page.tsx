import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { computeSeoBazi, validateSeoParams, buildBaziJsonLd } from '@/lib/seo-bazi';
import { PillarDisplay, BaziSummaryCard } from '@/components/bazi/seo-pillar-display';

interface Params {
  params: { year: string; month: string; day: string };
}

export function generateMetadata({ params }: Params): Metadata {
  const v = validateSeoParams({
    year: params.year,
    month: params.month,
    day: params.day,
  });
  if (!v.ok) return { title: '无效参数' };
  const result = computeSeoBazi({ year: v.data.year, month: v.data.month, day: v.data.day });
  const yp = result.pillars.year;
  const mp = result.pillars.month!;
  const dp = result.pillars.day!;
  const title = `${result.year}年${result.month}月${result.day}日八字：${dp.ganzhi}日`;
  const description = `${result.year}年${result.month}月${result.day}日（农历${result.lunar.monthName}${result.lunar.dayName}）八字日柱为${dp.ganzhi}（${dp.nanyin}），日干${dp.stem}（${dp.stemCn}），日支${dp.branch}（${dp.branchCn}）。年柱${yp.ganzhi}，月柱${mp.ganzhi}。查看十二时辰干支。`;
  const canonical = `/bazi/${result.year}/${result.month}/${result.day}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, type: 'article', url: canonical },
    other: { 'application/ld+json': JSON.stringify(buildBaziJsonLd(result, canonical)) },
  };
}

export function generateStaticParams() {
  // 预生成每月 28 天 (覆盖大多数月份)
  const out: { year: string; month: string; day: string }[] = [];
  for (let y = 2000; y <= 2025; y++) {
    for (let m = 1; m <= 12; m++) {
      for (let d = 1; d <= 28; d++) {
        out.push({ year: String(y), month: String(m), day: String(d) });
      }
    }
  }
  return out;
}

export const dynamicParams = true;

// 十二时辰映射: startHour 为链接代表小时, range 为显示区间
const ZI_HOUR_RANGES = [
  { startHour: 0, range: '23-1', name: '子时', branch: '子' },
  { startHour: 1, range: '1-3', name: '丑时', branch: '丑' },
  { startHour: 3, range: '3-5', name: '寅时', branch: '寅' },
  { startHour: 5, range: '5-7', name: '卯时', branch: '卯' },
  { startHour: 7, range: '7-9', name: '辰时', branch: '辰' },
  { startHour: 9, range: '9-11', name: '巳时', branch: '巳' },
  { startHour: 11, range: '11-13', name: '午时', branch: '午' },
  { startHour: 13, range: '13-15', name: '未时', branch: '未' },
  { startHour: 15, range: '15-17', name: '申时', branch: '申' },
  { startHour: 17, range: '17-19', name: '酉时', branch: '酉' },
  { startHour: 19, range: '19-21', name: '戌时', branch: '戌' },
  { startHour: 21, range: '21-23', name: '亥时', branch: '亥' },
];

export default function BaziDayPage({ params }: Params) {
  const v = validateSeoParams({
    year: params.year,
    month: params.month,
    day: params.day,
  });
  if (!v.ok) notFound();
  const result = computeSeoBazi({ year: v.data.year, month: v.data.month, day: v.data.day });
  const yp = result.pillars.year;
  const mp = result.pillars.month!;
  const dp = result.pillars.day!;

  return (
    <main className="container mx-auto px-4 py-8">
      <nav className="mb-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">首页</Link>
        <span className="mx-1">/</span>
        <Link href="/bazi" className="hover:text-foreground">八字</Link>
        <span className="mx-1">/</span>
        <Link href={`/bazi/${result.year}`} className="hover:text-foreground">{result.year}年</Link>
        <span className="mx-1">/</span>
        <Link href={`/bazi/${result.year}/${result.month}`} className="hover:text-foreground">{result.month}月</Link>
        <span className="mx-1">/</span>
        <span>{result.day}日</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          {result.year}年{result.month}月{result.day}日八字日柱：{dp.ganzhi}
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          {result.year}年{result.month}月{result.day}日（农历{result.lunar.monthName}月{result.lunar.dayName}）的八字日柱为
          <strong className="text-foreground"> {dp.ganzhi} </strong>
          （{dp.nanyin}），日干<Link href={`/tiangan/${dp.stem}`} className="text-primary hover:underline">{dp.stem}</Link>
          （{dp.stemCn}），日支<Link href={`/dizhi/${dp.branch}`} className="text-primary hover:underline">{dp.branch}</Link>
          （{dp.branchCn}）。
        </p>
      </header>

      <section className="mb-8 grid gap-6 md:grid-cols-2">
        <div className="grid grid-cols-3 gap-3">
          <PillarDisplay pillar={yp} label="年柱" />
          <PillarDisplay pillar={mp} label="月柱" />
          <PillarDisplay pillar={dp} label="日柱" />
        </div>
        <BaziSummaryCard result={result} />
      </section>

      <section className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">查看十二时辰时柱</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-6">
              {ZI_HOUR_RANGES.map((z) => {
                return (
                  <Link
                    key={z.name}
                    href={`/bazi/${result.year}/${result.month}/${result.day}/${z.startHour}`}
                    className="rounded-md border border-border p-2 text-center text-xs transition-colors hover:border-primary/50 hover:bg-accent"
                  >
                    <p className="font-medium">{z.name}</p>
                    <p className="text-muted-foreground">{z.range}时</p>
                  </Link>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              时柱每两小时（一个时辰）更替一次，子时横跨 23:00-01:00。点击时辰查看完整四柱。
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">相关百科</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3 text-sm">
            <Link href={`/ganzhi/${yp.ganzhi}`} className="text-primary hover:underline">{yp.ganzhi}</Link>
            <Link href={`/ganzhi/${mp.ganzhi}`} className="text-primary hover:underline">{mp.ganzhi}</Link>
            <Link href={`/ganzhi/${dp.ganzhi}`} className="text-primary hover:underline">{dp.ganzhi}</Link>
            <Link href={`/tiangan/${dp.stem}`} className="text-primary hover:underline">日干{dp.stem}</Link>
            <Link href={`/dizhi/${dp.branch}`} className="text-primary hover:underline">日支{dp.branch}</Link>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardContent className="p-4">
          <h2 className="mb-2 text-lg font-semibold">关于{result.year}年{result.month}月{result.day}日</h2>
          <p className="text-sm text-muted-foreground">
            日柱是八字四柱中最重要的柱位，代表命主本人（日干为日主/身主）。
            本日日柱{dp.ganzhi}，纳音{dp.nanyin}，日干{dp.stem}属{dp.stemCn}，日支{dp.branch}属{dp.branchCn}。
            日柱在八字中代表自身与配偶（32-47岁中年运）。日支为配偶宫，藏干影响婚姻与中年环境。
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            如需查看完整八字命盘（含大运流年），请前往
            <Link href="/bazi" className="text-primary hover:underline"> 排盘页</Link>。
          </p>
        </CardContent>
      </Card>

      <footer className="mt-8 border-t pt-6 text-center text-xs text-muted-foreground">
        <p>免责声明：本系统提供中国传统文化学术研究内容，命理学说不具备科学验证性，所有内容不构成任何决策建议。</p>
      </footer>
    </main>
  );
}
