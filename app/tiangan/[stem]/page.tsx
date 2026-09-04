import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { findTiangan, TIANGAN_INFO, isValidStem } from '@/lib/encyclopedia-data';

interface Params {
  params: { stem: string };
}

export function generateStaticParams() {
  return TIANGAN_INFO.map((t) => ({ stem: t.stem }));
}

export function generateMetadata({ params }: Params): Metadata {
  if (!isValidStem(params.stem)) return { title: '无效天干' };
  const info = findTiangan(params.stem)!;
  const title = `天干${info.stem}（${info.pinyin}）·${info.wuxingCn}${info.nature}`;
  const description = `${info.stem}（${info.pinyin}），${info.wuxingCn}，${info.nature}。${info.description}方位${info.direction}，对应脏腑${info.bodyPart}。`;
  const canonical = `/tiangan/${info.stem}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, type: 'article', url: canonical },
    other: {
      'application/ld+json': JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: `天干${info.stem}·${info.wuxingCn}`,
        description,
        url: canonical,
        articleSection: '天干百科',
        keywords: `${info.stem},${info.pinyin},${info.wuxingCn},${info.nature}`,
        about: { '@type': 'Thing', name: `天干${info.stem}` },
      }),
    },
  };
}

export default function TianganPage({ params }: Params) {
  if (!isValidStem(params.stem)) notFound();
  const info = findTiangan(params.stem)!;

  return (
    <main className="container mx-auto px-4 py-8">
      <nav className="mb-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">首页</Link>
        <span className="mx-1">/</span>
        <span>天干百科</span>
        <span className="mx-1">/</span>
        <span>{info.stem}</span>
      </nav>

      <header className="mb-8 text-center">
        <p className="text-6xl font-bold text-primary">{info.stem}</p>
        <p className="mt-2 text-lg text-muted-foreground">{info.pinyin}</p>
        <h1 className="mt-2 text-3xl font-bold">
          天干{info.stem} · {info.wuxingCn} · {info.nature}
        </h1>
      </header>

      <section className="mb-8 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">基本信息</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <Info label="天干" value={info.stem} />
            <Info label="拼音" value={info.pinyin} />
            <Info label="五行" value={`${info.wuxingCn}（${info.wuxing}）`} />
            <Info label="阴阳" value={info.yinYang === 'YANG' ? '阳' : '阴'} />
            <Info label="方位" value={info.direction} />
            <Info label="脏腑" value={info.bodyPart} />
            <Info label="类象" value={info.animalAssoc} />
            <Info label="本性" value={info.nature} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">象义详解</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">{info.xiangYi}</p>
          </CardContent>
        </Card>
      </section>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-base">天干{info.stem}详解</CardTitle>
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
            {TIANGAN_INFO.filter((t) => t.stem !== info.stem && t.wuxing === info.wuxing).map((t) => (
              <Link key={t.stem} href={`/tiangan/${t.stem}`} className="text-primary hover:underline">
                {t.stem}（同类天干）
              </Link>
            ))}
            <Link href="/bazi" className="text-primary hover:underline">八字排盘</Link>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">十天干总览</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {TIANGAN_INFO.map((t) => (
                <Link
                  key={t.stem}
                  href={`/tiangan/${t.stem}`}
                  className={`rounded border px-3 py-1 text-sm transition-colors hover:bg-accent ${
                    t.stem === info.stem ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
                  }`}
                >
                  {t.stem}
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
