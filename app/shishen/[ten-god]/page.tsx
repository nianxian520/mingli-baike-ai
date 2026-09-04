import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { findShishen, SHISHEN_INFO, isValidShishenKey } from '@/lib/encyclopedia-data';

interface Params {
  params: { 'ten-god': string };
}

export function generateStaticParams() {
  return SHISHEN_INFO.map((s) => ({ 'ten-god': s.key }));
}

export function generateMetadata({ params }: Params): Metadata {
  const key = params['ten-god'];
  if (!isValidShishenKey(key)) return { title: '无效十神' };
  const info = findShishen(key)!;
  const title = `十神${info.cn}（${info.pinyin}）·${info.nature}`;
  const description = `${info.cn}（${info.pinyin}），别名${info.alias}。${info.relation}。${info.nature}。${info.description}`;
  const canonical = `/shishen/${info.key}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, type: 'article', url: canonical },
    other: {
      'application/ld+json': JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: `十神${info.cn}·${info.nature}`,
        description,
        url: canonical,
        articleSection: '十神百科',
        keywords: `${info.cn},${info.pinyin},${info.alias},${info.nature}`,
        about: { '@type': 'Thing', name: `十神${info.cn}` },
      }),
    },
  };
}

export default function ShishenPage({ params }: Params) {
  const key = params['ten-god'];
  if (!isValidShishenKey(key)) notFound();
  const info = findShishen(key)!;

  const categoryLabel =
    info.category === 'positive' ? '吉神' : info.category === 'negative' ? '凶神' : '中神';
  const categoryVariant =
    info.category === 'positive' ? 'default' : info.category === 'negative' ? 'destructive' : 'secondary';

  return (
    <main className="container mx-auto px-4 py-8">
      <nav className="mb-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">首页</Link>
        <span className="mx-1">/</span>
        <span>十神百科</span>
        <span className="mx-1">/</span>
        <span>{info.cn}</span>
      </nav>

      <header className="mb-8 text-center">
        <p className="text-6xl font-bold text-primary">{info.cn}</p>
        <p className="mt-2 text-lg text-muted-foreground">{info.pinyin}</p>
        <div className="mt-3 flex items-center justify-center gap-2">
          <Badge variant={categoryVariant as any}>{categoryLabel}</Badge>
          <Badge variant="outline">{info.nature}</Badge>
        </div>
        <h1 className="mt-3 text-3xl font-bold">
          十神{info.cn} · {info.nature}
        </h1>
      </header>

      <section className="mb-8 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">基本关系</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Info label="名称" value={info.cn} />
            <Info label="拼音" value={info.pinyin} />
            <Info label="别名" value={info.alias} />
            <Info label="与日主关系" value={info.relation} />
            <Info label="性质" value={info.nature} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">性格特征</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {info.characteristics.map((c, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {c}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-base">十神{info.cn}详解</CardTitle>
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
            <Link href="/bazi" className="text-primary hover:underline">八字排盘（查看十神分布）</Link>
            <Link href="/bazi/1990" className="text-primary hover:underline">按年浏览八字</Link>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">十神总览</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {SHISHEN_INFO.map((s) => (
                <Link
                  key={s.key}
                  href={`/shishen/${s.key}`}
                  className={`rounded border px-3 py-1 text-sm transition-colors hover:bg-accent ${
                    s.key === info.key ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
                  }`}
                >
                  {s.cn}
                </Link>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              十神由日干与四柱天干地支藏干的关系推导得出：
              生我者印（正印/偏印），我生者食伤（食神/伤官），
              克我者官杀（正官/七杀），我克者财（正财/偏财），
              同我者比劫（比肩/劫财）。
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
