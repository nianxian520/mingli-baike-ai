import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { findDizhi, DIZHI_INFO, isValidBranch } from '@/lib/encyclopedia-data';

interface Params {
  params: { branch: string };
}

export function generateStaticParams() {
  return DIZHI_INFO.map((d) => ({ branch: d.branch }));
}

export function generateMetadata({ params }: Params): Metadata {
  if (!isValidBranch(params.branch)) return { title: '无效地支' };
  const info = findDizhi(params.branch)!;
  const title = `地支${info.branch}（${info.pinyin}）·${info.wuxingCn}·${info.animal}`;
  const description = `${info.branch}（${info.pinyin}），${info.wuxingCn}，生肖${info.animal}，方位${info.direction}，时辰${info.hour}，对应${info.month}。藏干${info.hiddenStems.join('、')}。${info.description}`;
  const canonical = `/dizhi/${info.branch}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, type: 'article', url: canonical },
    other: {
      'application/ld+json': JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: `地支${info.branch}·${info.wuxingCn}·${info.animal}`,
        description,
        url: canonical,
        articleSection: '地支百科',
        keywords: `${info.branch},${info.pinyin},${info.wuxingCn},${info.animal},${info.direction}`,
        about: { '@type': 'Thing', name: `地支${info.branch}` },
      }),
    },
  };
}

export default function DizhiPage({ params }: Params) {
  if (!isValidBranch(params.branch)) notFound();
  const info = findDizhi(params.branch)!;

  return (
    <main className="container mx-auto px-4 py-8">
      <nav className="mb-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">首页</Link>
        <span className="mx-1">/</span>
        <span>地支百科</span>
        <span className="mx-1">/</span>
        <span>{info.branch}</span>
      </nav>

      <header className="mb-8 text-center">
        <p className="text-6xl font-bold text-primary">{info.branch}</p>
        <p className="mt-2 text-lg text-muted-foreground">{info.pinyin}</p>
        <h1 className="mt-2 text-3xl font-bold">
          地支{info.branch} · {info.wuxingCn} · 生肖{info.animal}
        </h1>
      </header>

      <section className="mb-8 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">基本信息</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <Info label="地支" value={info.branch} />
            <Info label="拼音" value={info.pinyin} />
            <Info label="五行" value={`${info.wuxingCn}（${info.wuxing}）`} />
            <Info label="生肖" value={info.animal} />
            <Info label="方位" value={info.direction} />
            <Info label="时辰" value={info.hour} />
            <Info label="对应月" value={info.month} />
            <Info label="类象" value={info.nature} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">藏干</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {info.hiddenStems.map((s, i) => (
                <Link key={i} href={`/tiangan/${s}`}>
                  <Badge variant="secondary" className="text-base hover:cursor-pointer">
                    {s}
                  </Badge>
                </Link>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              地支藏干是八字判断日主旺衰与十神关系的重要依据。
              {info.branch}中所藏天干为本气与杂气，本气权重最大。
            </p>
          </CardContent>
        </Card>
      </section>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-base">地支{info.branch}详解</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{info.description}</p>
        </CardContent>
      </Card>

      <section className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">相关链接</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3 text-sm">
            <Link href={`/wuxing/${info.wuxing}`} className="text-primary hover:underline">
              五行{info.wuxing}
            </Link>
            {info.hiddenStems.map((s) => (
              <Link key={s} href={`/tiangan/${s}`} className="text-primary hover:underline">
                天干{s}
              </Link>
            ))}
            <Link href="/bazi" className="text-primary hover:underline">八字排盘</Link>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">十二地支总览</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {DIZHI_INFO.map((d) => (
                <Link
                  key={d.branch}
                  href={`/dizhi/${d.branch}`}
                  className={`rounded border px-3 py-1 text-sm transition-colors hover:bg-accent ${
                    d.branch === info.branch ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
                  }`}
                >
                  {d.branch}
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
