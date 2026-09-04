import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { findGanzhi, GANZHI_LIST, isValidGanzhi } from '@/lib/encyclopedia-data';

interface Params {
  params: { ganzhi: string };
}

export function generateStaticParams() {
  return GANZHI_LIST.map((g) => ({ ganzhi: g.ganzhi }));
}

export function generateMetadata({ params }: Params): Metadata {
  if (!isValidGanzhi(params.ganzhi)) return { title: '无效干支' };
  const info = findGanzhi(params.ganzhi)!;
  const title = `${info.ganzhi}（${info.nanyin}）· 六十甲子第${info.index}位`;
  const description = `${info.ganzhi}，六十甲子第${info.index}位，纳音「${info.nanyin}」，属${info.xun}。天干${info.stem}，地支${info.branch}。空亡：${info.kongWang.join('、')}。`;
  const canonical = `/ganzhi/${info.ganzhi}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, type: 'article', url: canonical },
    other: {
      'application/ld+json': JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: `${info.ganzhi}·${info.nanyin}`,
        description,
        url: canonical,
        articleSection: '六十甲子百科',
        keywords: `${info.ganzhi},${info.nanyin},${info.xun},六十甲子`,
        about: { '@type': 'Thing', name: `干支${info.ganzhi}` },
      }),
    },
  };
}

export default function GanzhiPage({ params }: Params) {
  if (!isValidGanzhi(params.ganzhi)) notFound();
  const info = findGanzhi(params.ganzhi)!;
  // 同旬干支
  const sameXun = GANZHI_LIST.filter((g) => g.xun === info.xun);
  // 纳音相同
  const sameNanyin = GANZHI_LIST.filter((g) => g.nanyin === info.nanyin);

  return (
    <main className="container mx-auto px-4 py-8">
      <nav className="mb-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">首页</Link>
        <span className="mx-1">/</span>
        <span>干支百科</span>
        <span className="mx-1">/</span>
        <span>{info.ganzhi}</span>
      </nav>

      <header className="mb-8 text-center">
        <p className="text-6xl font-bold text-primary">{info.ganzhi}</p>
        <h1 className="mt-3 text-3xl font-bold">
          {info.ganzhi} · {info.nanyin}
        </h1>
        <p className="mt-2 text-muted-foreground">六十甲子第 {info.index} 位</p>
      </header>

      <section className="mb-8 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">基本信息</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <Info label="干支" value={info.ganzhi} />
            <Info label="六十甲子序" value={`第 ${info.index} 位`} />
            <Info label="天干" value={info.stem} />
            <Info label="地支" value={info.branch} />
            <Info label="纳音" value={info.nanyin} />
            <Info label="纳音五行" value={info.nanyinElement} />
            <Info label="所属旬" value={info.xun} />
            <Info label="空亡" value={info.kongWang.join('、')} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">干支组成</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {info.ganzhi} 由天干
              <Link href={`/tiangan/${info.stem}`} className="text-primary hover:underline"> {info.stem} </Link>
              与地支
              <Link href={`/dizhi/${info.branch}`} className="text-primary hover:underline"> {info.branch} </Link>
              组合而成。
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              纳音「{info.nanyin}」是六十甲子干支组合的特殊五行属性，
              用于年命、柱位纳音论命。纳音五行与天干地支本气五行不同，
              是古人根据音律与干支配对得出的另一套五行体系。
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              本干支属
              <Link href="/bazi" className="text-primary hover:underline"> {info.xun}</Link>
              ，该旬中空亡为
              <Badge variant="outline" className="mx-1 text-[10px]">{info.kongWang.join('、')}</Badge>
              （即此二地支在排盘中落空，力量减弱）。
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">同旬干支（{info.xun}）</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {sameXun.map((g) => (
                <Link
                  key={g.ganzhi}
                  href={`/ganzhi/${g.ganzhi}`}
                  className={`rounded border px-3 py-1 text-sm transition-colors hover:bg-accent ${
                    g.ganzhi === info.ganzhi ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
                  }`}
                >
                  {g.ganzhi}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">同纳音干支（{info.nanyin}）</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {sameNanyin.map((g) => (
                <Link
                  key={g.ganzhi}
                  href={`/ganzhi/${g.ganzhi}`}
                  className={`rounded border px-3 py-1 text-sm transition-colors hover:bg-accent ${
                    g.ganzhi === info.ganzhi ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
                  }`}
                >
                  {g.ganzhi}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">六十甲子总览</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-1 md:grid-cols-10">
              {GANZHI_LIST.map((g) => (
                <Link
                  key={g.ganzhi}
                  href={`/ganzhi/${g.ganzhi}`}
                  className={`rounded border px-2 py-1 text-center text-xs transition-colors hover:bg-accent ${
                    g.ganzhi === info.ganzhi ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
                  }`}
                  title={`${g.ganzhi}·${g.nanyin}`}
                >
                  {g.ganzhi}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <footer className="mt-8 border-t pt-6 text-center text-xs text-muted-foreground">
        <p>免责声明：本系统提供中国传统文化学术研究内容，命理学说不具备科学验证性，所有内容不构成任何决策建议。</p>
      </footer>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
