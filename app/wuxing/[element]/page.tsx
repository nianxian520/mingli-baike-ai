import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { findWuxing, WUXING_INFO, isValidWuxing } from '@/lib/encyclopedia-data';

interface Params {
  params: { element: string };
}

export function generateStaticParams() {
  return WUXING_INFO.map((w) => ({ element: w.key }));
}

export function generateMetadata({ params }: Params): Metadata {
  if (!isValidWuxing(params.element)) return { title: '无效五行' };
  const info = findWuxing(params.element)!;
  const title = `五行${info.cn} · ${info.nature} · ${info.direction}方${info.season}`;
  const description = `五行${info.cn}（${info.key}），${info.nature}，方位${info.direction}，季节${info.season}。生${info.sheng}，克${info.ke}。${info.description}`;
  const canonical = `/wuxing/${info.key}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, type: 'article', url: canonical },
    other: {
      'application/ld+json': JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: `五行${info.cn}·${info.nature}`,
        description,
        url: canonical,
        articleSection: '五行百科',
        keywords: `${info.cn},${info.key},${info.nature},${info.direction},${info.season}`,
        about: { '@type': 'Thing', name: `五行${info.cn}` },
      }),
    },
  };
}

export default function WuxingPage({ params }: Params) {
  if (!isValidWuxing(params.element)) notFound();
  const info = findWuxing(params.element)!;

  return (
    <main className="container mx-auto px-4 py-8">
      <nav className="mb-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">首页</Link>
        <span className="mx-1">/</span>
        <span>五行百科</span>
        <span className="mx-1">/</span>
        <span>{info.cn}</span>
      </nav>

      <header className="mb-8 text-center">
        <p className="text-8xl font-bold" style={{ color: info.color }}>
          {info.cn}
        </p>
        <h1 className="mt-3 text-3xl font-bold">
          五行{info.cn} · {info.nature}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {info.direction}方 · {info.season}
        </p>
      </header>

      <section className="mb-8 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">基本属性</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <Info label="五行" value={`${info.cn}（${info.key}）`} />
            <Info label="特性" value={info.nature} />
            <Info label="方位" value={info.direction} />
            <Info label="季节" value={info.season} />
            <Info label="脏腑" value={info.organs} />
            <Info label="情志" value={info.emotions} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">生克关系</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{info.cn}</Badge>
              <span className="text-muted-foreground">生 →</span>
              <Link href={`/wuxing/${info.sheng === '金' ? 'metal' : info.sheng === '木' ? 'wood' : info.sheng === '水' ? 'water' : info.sheng === '火' ? 'fire' : 'earth'}`} className="text-primary hover:underline">
                {info.sheng}
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{info.cn}</Badge>
              <span className="text-muted-foreground">克 →</span>
              <Link href={`/wuxing/${info.ke === '金' ? 'metal' : info.ke === '木' ? 'wood' : info.ke === '水' ? 'water' : info.ke === '火' ? 'fire' : 'earth'}`} className="text-primary hover:underline">
                {info.ke}
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/wuxing/${info.beiSheng === '金' ? 'metal' : info.beiSheng === '木' ? 'wood' : info.beiSheng === '水' ? 'water' : info.beiSheng === '火' ? 'fire' : 'earth'}`} className="text-primary hover:underline">
                {info.beiSheng}
              </Link>
              <span className="text-muted-foreground">→ 生</span>
              <Badge variant="secondary">{info.cn}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/wuxing/${info.beiKe === '金' ? 'metal' : info.beiKe === '木' ? 'wood' : info.beiKe === '水' ? 'water' : info.beiKe === '火' ? 'fire' : 'earth'}`} className="text-primary hover:underline">
                {info.beiKe}
              </Link>
              <span className="text-muted-foreground">→ 克</span>
              <Badge variant="secondary">{info.cn}</Badge>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-base">五行{info.cn}详解</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{info.description}</p>
        </CardContent>
      </Card>

      <section className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">相关天干地支</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 text-sm">
              <Link href="/tiangan/jia" className="text-primary hover:underline">查看同属天干 →</Link>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">五行总览</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {WUXING_INFO.map((w) => (
                <Link
                  key={w.key}
                  href={`/wuxing/${w.key}`}
                  className={`rounded border px-4 py-2 text-sm transition-colors hover:bg-accent ${
                    w.key === info.key ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
                  }`}
                  style={w.key === info.key ? { backgroundColor: w.color, color: 'white' } : undefined}
                >
                  {w.cn}
                </Link>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              五行相生：金生水、水生木、木生火、火生土、土生金。
              五行相克：金克木、木克土、土克水、水克火、火克金。
            </p>
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
