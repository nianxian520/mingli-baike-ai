import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { computeSeoBazi, validateSeoParams, buildBaziJsonLd } from '@/lib/seo-bazi';
import { PillarDisplay, BaziSummaryCard } from '@/components/bazi/seo-pillar-display';

interface Params {
  params: { year: string; month: string };
}

export function generateMetadata({ params }: Params): Metadata {
  const v = validateSeoParams({ year: params.year, month: params.month });
  if (!v.ok) return { title: '无效参数' };
  const result = computeSeoBazi({ year: v.data.year, month: v.data.month });
  const yp = result.pillars.year;
  const mp = result.pillars.month!;
  const title = `${result.year}年${result.month}月八字：${yp.ganzhi}年 ${mp.ganzhi}月`;
  const description = `${result.year}年${result.month}月八字月柱为${mp.ganzhi}（${mp.nanyin}），天干${mp.stem}（${mp.stemCn}），地支${mp.branch}（${mp.branchCn}）。年柱${yp.ganzhi}。查看每日日柱干支。`;
  const canonical = `/bazi/${result.year}/${result.month}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, type: 'article', url: canonical },
    other: { 'application/ld+json': JSON.stringify(buildBaziJsonLd(result, canonical)) },
  };
}

export function generateStaticParams() {
  const out: { year: string; month: string }[] = [];
  for (let y = 1950; y <= 2030; y++) {
    for (let m = 1; m <= 12; m++) {
      out.push({ year: String(y), month: String(m) });
    }
  }
  return out;
}

export const dynamicParams = true;

export default function BaziMonthPage({ params }: Params) {
  const v = validateSeoParams({ year: params.year, month: params.month });
  if (!v.ok) notFound();
  const result = computeSeoBazi({ year: v.data.year, month: v.data.month });
  const yp = result.pillars.year;
  const mp = result.pillars.month!;

  return (
    <main className="container mx-auto px-4 py-8">
      <nav className="mb-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">首页</Link>
        <span className="mx-1">/</span>
        <Link href="/bazi" className="hover:text-foreground">八字</Link>
        <span className="mx-1">/</span>
        <Link href={`/bazi/${result.year}`} className="hover:text-foreground">{result.year}年</Link>
        <span className="mx-1">/</span>
        <span>{result.month}月</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          {result.year}年{result.month}月八字月柱：{mp.ganzhi}
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          {result.year}年{result.month}月（农历{result.lunar.monthName}月{result.lunar.isLeapMonth ? '（闰）' : ''}）的八字月柱为
          <strong className="text-foreground"> {mp.ganzhi} </strong>
          （{mp.nanyin}），年柱{yp.ganzhi}。
        </p>
      </header>

      <section className="mb-8 grid gap-6 md:grid-cols-2">
        <div className="grid grid-cols-2 gap-3">
          <PillarDisplay pillar={yp} label="年柱" />
          <PillarDisplay pillar={mp} label="月柱" />
        </div>
        <BaziSummaryCard result={result} />
      </section>

      <section className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">查看每日日柱</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-2 md:grid-cols-10">
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <Link
                  key={d}
                  href={`/bazi/${result.year}/${result.month}/${d}`}
                  className="rounded-md border border-border p-1.5 text-center text-xs transition-colors hover:border-primary/50 hover:bg-accent"
                >
                  {d}日
                </Link>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              注意：日柱每日更替，以子时（23:00）为界。点击具体日期查看该日干支与时柱。
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
            <Link href={`/tiangan/${yp.stem}`} className="text-primary hover:underline">天干{yp.stem}</Link>
            <Link href={`/tiangan/${mp.stem}`} className="text-primary hover:underline">天干{mp.stem}</Link>
            <Link href={`/dizhi/${yp.branch}`} className="text-primary hover:underline">地支{yp.branch}</Link>
            <Link href={`/dizhi/${mp.branch}`} className="text-primary hover:underline">地支{mp.branch}</Link>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardContent className="p-4">
          <h2 className="mb-2 text-lg font-semibold">关于{result.year}年{result.month}月</h2>
          <p className="text-sm text-muted-foreground">
            八字月柱以二十四节气中的「节」为分界点（如立春为寅月起点，惊蛰为卯月起点），
            与公历月份不完全对应。本月月柱{mp.ganzhi}，纳音{mp.nanyin}，
            天干{mp.stem}属{mp.stemCn}，地支{mp.branch}属{mp.branchCn}。
            月柱在八字中代表父母、兄弟与青年环境（16-31岁）。
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            如需查看完整八字命盘，请前往<Link href="/bazi" className="text-primary hover:underline"> 排盘页</Link>。
          </p>
        </CardContent>
      </Card>

      <footer className="mt-8 border-t pt-6 text-center text-xs text-muted-foreground">
        <p>免责声明：本系统提供中国传统文化学术研究内容，命理学说不具备科学验证性，所有内容不构成任何决策建议。</p>
      </footer>
    </main>
  );
}
