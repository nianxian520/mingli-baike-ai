import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { computeSeoBazi, validateSeoParams, buildBaziJsonLd } from '@/lib/seo-bazi';
import { PillarDisplay, BaziSummaryCard } from '@/components/bazi/seo-pillar-display';

interface Params {
  params: { year: string };
}

export function generateMetadata({ params }: Params): Metadata {
  const v = validateSeoParams({ year: params.year });
  if (!v.ok) return { title: '无效年份' };
  const result = computeSeoBazi({ year: v.data.year });
  const yp = result.pillars.year;
  const title = `${result.year}年八字年柱：${yp.ganzhi}（${yp.nanyin}）`;
  const description = `${result.year}年（农历${result.lunar.yearGanZhi}${result.lunar.animal}年）八字年柱为${yp.ganzhi}，天干${yp.stem}（${yp.stemCn}），地支${yp.branch}（${yp.branchCn}），纳音${yp.nanyin}。查看每月月柱干支。`;
  const canonical = `/bazi/${result.year}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: 'article',
      url: canonical,
    },
    other: {
      'application/ld+json': JSON.stringify(buildBaziJsonLd(result, canonical)),
    },
  };
}

// 预生成常见年份 (1950-2030)
export function generateStaticParams() {
  return Array.from({ length: 81 }, (_, i) => ({
    year: String(1950 + i),
  }));
}

export const dynamicParams = true;

export default function BaziYearPage({ params }: Params) {
  const v = validateSeoParams({ year: params.year });
  if (!v.ok) notFound();
  const result = computeSeoBazi({ year: v.data.year });
  const yp = result.pillars.year;

  return (
    <main className="container mx-auto px-4 py-8">
      <nav className="mb-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">首页</Link>
        <span className="mx-1">/</span>
        <Link href="/bazi" className="hover:text-foreground">八字</Link>
        <span className="mx-1">/</span>
        <span>{result.year}年</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          {result.year}年八字年柱：{yp.ganzhi}
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          {result.year}年（农历{result.lunar.yearGanZhi}年·{result.lunar.animal}）的八字年柱为
          <strong className="text-foreground"> {yp.ganzhi} </strong>
          （{yp.nanyin}），天干
          <Link href={`/tiangan/${yp.stem}`} className="text-primary hover:underline"> {yp.stem} </Link>
          （{yp.stemCn}），地支
          <Link href={`/dizhi/${yp.branch}`} className="text-primary hover:underline"> {yp.branch} </Link>
          （{yp.branchCn}）。
        </p>
      </header>

      <section className="mb-8 grid gap-6 md:grid-cols-2">
        <div className="grid grid-cols-2 gap-3">
          <PillarDisplay pillar={yp} label="年柱" />
          <Card className="flex items-center justify-center border-dashed">
            <CardContent className="p-4 text-center text-muted-foreground">
              <p className="text-sm">月柱</p>
              <p className="mt-2 text-xs">选择月份查看</p>
            </CardContent>
          </Card>
        </div>
        <BaziSummaryCard result={result} />
      </section>

      <section className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">查看每月月柱</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <Link
                  key={m}
                  href={`/bazi/${result.year}/${m}`}
                  className="rounded-md border border-border p-2 text-center text-sm transition-colors hover:border-primary/50 hover:bg-accent"
                >
                  {m}月
                </Link>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              注意：八字月柱以「节」为界（如立春、惊蛰），非公历月初。点击具体月份查看该月干支。
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
            <Link href={`/ganzhi/${yp.ganzhi}`} className="text-primary hover:underline">
              {yp.ganzhi}（六十甲子）
            </Link>
            <Link href={`/tiangan/${yp.stem}`} className="text-primary hover:underline">
              天干{yp.stem}
            </Link>
            <Link href={`/dizhi/${yp.branch}`} className="text-primary hover:underline">
              地支{yp.branch}
            </Link>
            <Link href={`/wuxing/${yp.stemElement}`} className="text-primary hover:underline">
              五行{yp.stemCn}
            </Link>
            <Link href={`/wuxing/${yp.branchElement}`} className="text-primary hover:underline">
              五行{yp.branchCn}
            </Link>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardContent className="p-4">
          <h2 className="mb-2 text-lg font-semibold">关于{result.year}年</h2>
          <p className="text-sm text-muted-foreground">
            {result.year}年对应的农历干支年为「{result.lunar.yearGanZhi}」，生肖为{result.lunar.animal}。
            在八字命理中，年柱代表祖业、根基与早年环境（1-15岁）。
            年柱天干{yp.stem}属{yp.stemCn}，地支{yp.branch}属{yp.branchCn}，纳音为「{yp.nanyin}」。
            年柱干支的阴阳属性影响该年生人的大运顺逆排法。
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            如需查看完整八字命盘（含日柱、时柱、大运、流年），请前往
            <Link href="/bazi" className="text-primary hover:underline"> 排盘页 </Link>
            输入完整出生信息。
          </p>
        </CardContent>
      </Card>

      <footer className="mt-8 border-t pt-6 text-center text-xs text-muted-foreground">
        <p>免责声明：本系统提供中国传统文化学术研究内容，命理学说不具备科学验证性，所有内容不构成任何决策建议。</p>
      </footer>
    </main>
  );
}
