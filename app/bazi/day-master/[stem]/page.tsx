import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { findTiangan, TIANGAN_INFO, isValidStem } from '@/lib/encyclopedia-data';

interface Params {
  params: { stem: string };
}

export function generateStaticParams() {
  return TIANGAN_INFO.map((t) => ({ stem: t.stem }));
}

export function generateMetadata({ params }: Params): Metadata {
  if (!isValidStem(params.stem)) return { title: '无效日主' };
  const info = findTiangan(params.stem)!;
  const title = `日主${info.stem}（${info.wuxingCn}）· 八字日主详解`;
  const description = `日主${info.stem}，${info.wuxingCn}，${info.nature}。日主为八字命盘的核心，代表命主本人。${info.description}日主${info.stem}的旺衰、喜忌与格局分析。`;
  const canonical = `/bazi/day-master/${info.stem}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, type: 'article', url: canonical },
    other: {
      'application/ld+json': JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: `日主${info.stem}·${info.wuxingCn}`,
        description,
        url: canonical,
        articleSection: '日主百科',
        keywords: `日主,${info.stem},${info.wuxingCn},八字日干`,
        about: { '@type': 'Thing', name: `日主${info.stem}` },
      }),
    },
  };
}

export default function DayMasterPage({ params }: Params) {
  if (!isValidStem(params.stem)) notFound();
  const info = findTiangan(params.stem)!;

  return (
    <main className="container mx-auto px-4 py-8">
      <nav className="mb-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">首页</Link>
        <span className="mx-1">/</span>
        <Link href="/bazi" className="hover:text-foreground">八字</Link>
        <span className="mx-1">/</span>
        <span>日主</span>
        <span className="mx-1">/</span>
        <span>{info.stem}</span>
      </nav>

      <header className="mb-8 text-center">
        <p className="text-6xl font-bold text-primary">{info.stem}</p>
        <h1 className="mt-3 text-3xl font-bold">
          日主{info.stem} · {info.wuxingCn}
        </h1>
        <p className="mt-2 text-muted-foreground">{info.nature}</p>
      </header>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-base">什么是日主？</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground">
            日主，又称日干、身主，是八字四柱中日柱的天干，代表命主本人。
            八字以日主为中心，其余七字（年月时干支加日支）皆以与日主的生克关系定十神，
            由此判断命主旺衰、格局、喜用神，进而推论一生运势。
            日主{info.stem}属{info.wuxingCn}，{info.nature}，
            其喜忌需结合月令（月支）旺衰、四柱五行多寡综合判断。
          </p>
        </CardContent>
      </Card>

      <section className="mb-8 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">日主{info.stem}特征</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <Info label="日主" value={info.stem} />
            <Info label="五行" value={info.wuxingCn} />
            <Info label="阴阳" value={info.yinYang === 'YANG' ? '阳' : '阴'} />
            <Info label="方位" value={info.direction} />
            <Info label="脏腑" value={info.bodyPart} />
            <Info label="类象" value={info.animalAssoc} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">象义</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">{info.xiangYi}</p>
          </CardContent>
        </Card>
      </section>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-base">日主{info.stem}详解</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{info.description}</p>
          <p className="mt-3 text-sm text-muted-foreground">
            判断日主{info.stem}旺衰的关键：看月令是否当令（如甲木生于寅卯月为旺），
            再看四柱干支五行多寡。旺则喜克泄耗（官杀、食伤、财），弱则喜生扶（印、比劫）。
          </p>
        </CardContent>
      </Card>

      <section className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">相关链接</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3 text-sm">
            <Link href={`/tiangan/${info.stem}`} className="text-primary hover:underline">
              天干{info.stem}百科
            </Link>
            <Link href={`/wuxing/${info.wuxing}`} className="text-primary hover:underline">
              五行{info.wuxing}
            </Link>
            <Link href="/bazi" className="text-primary hover:underline">八字排盘</Link>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">十日主总览</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {TIANGAN_INFO.map((t) => (
                <Link
                  key={t.stem}
                  href={`/bazi/day-master/${t.stem}`}
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
