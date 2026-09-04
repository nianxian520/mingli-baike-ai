import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { computeSeoBazi, validateSeoParams, buildBaziJsonLd } from '@/lib/seo-bazi';
import { PillarDisplay, BaziSummaryCard } from '@/components/bazi/seo-pillar-display';
import { WUXING_CN, type WuXing } from '@/engine/types';

interface Params {
  params: { year: string; month: string; day: string; hour: string };
}

export function generateMetadata({ params }: Params): Metadata {
  const v = validateSeoParams({
    year: params.year,
    month: params.month,
    day: params.day,
    hour: params.hour,
  });
  if (!v.ok) return { title: '无效参数' };
  const result = computeSeoBazi({
    year: v.data.year,
    month: v.data.month,
    day: v.data.day,
    hour: v.data.hour,
  });
  const yp = result.pillars.year;
  const mp = result.pillars.month!;
  const dp = result.pillars.day!;
  const hp = result.pillars.hour!;
  const ganzhi = `${yp.ganzhi} ${mp.ganzhi} ${dp.ganzhi} ${hp.ganzhi}`;
  const title = `${result.year}年${result.month}月${result.day}日${result.hour}时八字：${ganzhi}`;
  const description = `${result.year}年${result.month}月${result.day}日${result.hour}时出生八字四柱：年柱${yp.ganzhi}，月柱${mp.ganzhi}，日柱${dp.ganzhi}（日干${dp.stem}），时柱${hp.ganzhi}。农历${result.lunar.monthName}月${result.lunar.dayName}，${result.lunar.yearGanZhi}${result.lunar.animal}年。`;
  const canonical = `/bazi/${result.year}/${result.month}/${result.day}/${result.hour}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, type: 'article', url: canonical },
    other: { 'application/ld+json': JSON.stringify(buildBaziJsonLd(result, canonical)) },
  };
}

export function generateStaticParams() {
  // 预生成常见日期 (每天4个代表性时辰: 0,6,12,18)
  const out: { year: string; month: string; day: string; hour: string }[] = [];
  for (let y = 2000; y <= 2025; y++) {
    for (let m = 1; m <= 12; m++) {
      for (let d = 1; d <= 28; d++) {
        for (const h of [0, 6, 12, 18]) {
          out.push({ year: String(y), month: String(m), day: String(d), hour: String(h) });
        }
      }
    }
  }
  return out;
}

export const dynamicParams = true;

export default function BaziHourPage({ params }: Params) {
  const v = validateSeoParams({
    year: params.year,
    month: params.month,
    day: params.day,
    hour: params.hour,
  });
  if (!v.ok) notFound();
  const result = computeSeoBazi({
    year: v.data.year,
    month: v.data.month,
    day: v.data.day,
    hour: v.data.hour,
  });
  const yp = result.pillars.year;
  const mp = result.pillars.month!;
  const dp = result.pillars.day!;
  const hp = result.pillars.hour!;

  const dayElem = dp.stemElement;
  const allEls: WuXing[] = [
    yp.stemElement, yp.branchElement,
    mp.stemElement, mp.branchElement,
    dp.stemElement, dp.branchElement,
    hp.stemElement, hp.branchElement,
  ];
  const counts: Record<WuXing, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  allEls.forEach((e) => (counts[e] += 1));
  const order: WuXing[] = ['wood', 'fire', 'earth', 'metal', 'water'];

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
        <Link href={`/bazi/${result.year}/${result.month}/${result.day}`} className="hover:text-foreground">{result.day}日</Link>
        <span className="mx-1">/</span>
        <span>{result.hour}时</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          {result.year}年{result.month}月{result.day}日{result.hour}时八字
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          出生八字四柱：
          <strong className="text-foreground"> {yp.ganzhi} {mp.ganzhi} {dp.ganzhi} {hp.ganzhi} </strong>
          （农历{result.lunar.yearGanZhi}年·{result.lunar.animal} {result.lunar.monthName}月{result.lunar.dayName}）
        </p>
      </header>

      {/* 四柱展示 */}
      <section className="mb-8">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <PillarDisplay pillar={yp} label="年柱" />
          <PillarDisplay pillar={mp} label="月柱" />
          <PillarDisplay pillar={dp} label="日柱（日主）" />
          <PillarDisplay pillar={hp} label="时柱" />
        </div>
      </section>

      <section className="mb-8 grid gap-6 md:grid-cols-2">
        <BaziSummaryCard result={result} />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">五行统计（含藏干简化）</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {order.map((el) => {
              const c = counts[el];
              const pct = Math.round((c / 8) * 100);
              return (
                <div key={el} className="flex justify-between text-sm">
                  <span>{WUXING_CN[el]}</span>
                  <span className="text-muted-foreground">{c}个 · {pct}%</span>
                </div>
              );
            })}
            <p className="mt-3 text-xs text-muted-foreground">
              此为天干地支本气粗略统计，完整藏干五行需在排盘页查看。
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">四柱干支详解</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold">年柱 {yp.ganzhi}（{yp.nanyin}）</h3>
              <p className="mt-1 text-muted-foreground">
                天干<Link href={`/tiangan/${yp.stem}`} className="text-primary hover:underline">{yp.stem}</Link>属{yp.stemCn}，
                地支<Link href={`/dizhi/${yp.branch}`} className="text-primary hover:underline">{yp.branch}</Link>属{yp.branchCn}。
                年柱代表祖业根基与早年环境（1-15岁）。
              </p>
            </div>
            <div>
              <h3 className="font-semibold">月柱 {mp.ganzhi}（{mp.nanyin}）</h3>
              <p className="mt-1 text-muted-foreground">
                天干<Link href={`/tiangan/${mp.stem}`} className="text-primary hover:underline">{mp.stem}</Link>属{mp.stemCn}，
                地支<Link href={`/dizhi/${mp.branch}`} className="text-primary hover:underline">{mp.branch}</Link>属{mp.branchCn}。
                月柱代表父母兄弟与青年环境（16-31岁），也是判断日主旺衰的关键。
              </p>
            </div>
            <div>
              <h3 className="font-semibold">日柱 {dp.ganzhi}（{dp.nanyin}）—— 日主</h3>
              <p className="mt-1 text-muted-foreground">
                日干<Link href={`/tiangan/${dp.stem}`} className="text-primary hover:underline">{dp.stem}</Link>属{dp.stemCn}，
                日支<Link href={`/dizhi/${dp.branch}`} className="text-primary hover:underline">{dp.branch}</Link>属{dp.branchCn}。
                日干{dp.stem}为本命日主，代表命主本人。日支为配偶宫。
              </p>
            </div>
            <div>
              <h3 className="font-semibold">时柱 {hp.ganzhi}（{hp.nanyin}）</h3>
              <p className="mt-1 text-muted-foreground">
                天干<Link href={`/tiangan/${hp.stem}`} className="text-primary hover:underline">{hp.stem}</Link>属{hp.stemCn}，
                地支<Link href={`/dizhi/${hp.branch}`} className="text-primary hover:underline">{hp.branch}</Link>属{hp.branchCn}。
                时柱代表子女与晚年环境（48岁以后）。
              </p>
            </div>
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
            <Link href={`/ganzhi/${hp.ganzhi}`} className="text-primary hover:underline">{hp.ganzhi}</Link>
            <Link href={`/wuxing/${dayElem}`} className="text-primary hover:underline">日主五行：{WUXING_CN[dayElem]}</Link>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardContent className="p-4">
          <h2 className="mb-2 text-lg font-semibold">查看完整命盘</h2>
          <p className="text-sm text-muted-foreground">
            本页为 SEO 静态页面，仅展示四柱干支基础信息。如需查看完整命盘
            （含十神、藏干、刑冲合害、大运、流年、神煞、格局、喜用神），请前往
            <Link href="/bazi" className="text-primary hover:underline"> 排盘页</Link>
            输入完整出生信息（含性别、出生地点经纬度）进行真太阳时校正后计算。
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/bazi" className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              前往排盘
            </Link>
            <Link
              href={`/bazi/${result.year}/${result.month}/${result.day}`}
              className="inline-flex items-center rounded-md border border-input px-4 py-2 text-sm hover:bg-accent"
            >
              返回日柱页
            </Link>
          </div>
        </CardContent>
      </Card>

      <footer className="mt-8 border-t pt-6 text-center text-xs text-muted-foreground">
        <p>免责声明：本系统提供中国传统文化学术研究内容，命理学说不具备科学验证性，所有内容不构成任何决策建议。</p>
      </footer>
    </main>
  );
}
