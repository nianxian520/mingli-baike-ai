import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, BookOpen, Sparkles, Calendar } from 'lucide-react';

const FEATURES = [
  {
    href: '/bazi',
    title: '八字排盘',
    desc: '输入出生时间地点，生成四柱、五行、十神、大运、流年',
    icon: Calculator,
  },
  {
    href: '/tiangan/jia',
    title: '天干百科',
    desc: '十干类象、五行属性、阴阳与象义详解',
    icon: BookOpen,
  },
  {
    href: '/dizhi/zi',
    title: '地支百科',
    desc: '十二地支、藏干、生肖、方位与时辰',
    icon: BookOpen,
  },
  {
    href: '/ganzhi/jiazi',
    title: '干支百科',
    desc: '六十甲子、纳音、旬首与空亡',
    icon: BookOpen,
  },
  {
    href: '/shishen/bi-jian',
    title: '十神百科',
    desc: '比肩、劫财、食神、伤官、偏财、正财、七杀、正官、偏印、正印',
    icon: BookOpen,
  },
  {
    href: '/wuxing/wood',
    title: '五行百科',
    desc: '金木水火土的生克关系与类象',
    icon: BookOpen,
  },
];

export default function HomePage() {
  return (
    <main className="container mx-auto px-4 py-12">
      <header className="mx-auto mb-12 max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          命理百科 AI
        </h1>
        <p className="mt-4 text-muted-foreground">
          基于确定性八字引擎与结构化命理知识库的传统文化学术研究平台。
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          出生时间 → 四柱 → 五行 → 十神 → 刑冲合害 → 大运 → 流年 → 命理规则 → 断语 → AI 解释 → SEO 百科
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/bazi"
            className="inline-flex h-11 items-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Calculator className="mr-2 h-4 w-4" />
            立即排盘
          </Link>
          <Link
            href="/bazi/1990"
            className="inline-flex h-11 items-center rounded-md border border-input bg-background px-8 text-sm font-medium hover:bg-accent"
          >
            <Calendar className="mr-2 h-4 w-4" />
            按年浏览
          </Link>
        </div>
      </header>

      <nav className="mx-auto grid max-w-4xl gap-4 md:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <Link key={f.href} href={f.href}>
            <Card className="h-full transition-colors hover:border-primary/50">
              <CardHeader>
                <f.icon className="mb-2 h-6 w-6 text-primary" />
                <CardTitle className="text-lg">{f.title}</CardTitle>
                <CardDescription>{f.desc}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </nav>

      <section className="mx-auto mt-16 max-w-3xl">
        <h2 className="mb-4 text-2xl font-bold">系统架构</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <p className="flex items-center gap-2 font-semibold">
                <Sparkles className="h-4 w-4" /> 计算引擎
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                基于 lunar-javascript 历法库，产出结构化 BaziJson，结果确定性可复现。
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="flex items-center gap-2 font-semibold">
                <Sparkles className="h-4 w-4" /> 规则引擎
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                结构化命理规则 DSL + 3000+ 断语知识库，按八字 JSON 匹配，AI 不参与计算。
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="flex items-center gap-2 font-semibold">
                <Sparkles className="h-4 w-4" /> AI 解释器
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                只读 BaziJson + 匹配的规则与断语，生成自然语言解释，prompt 版本可管理。
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="mx-auto mt-16 max-w-2xl border-t pt-6 text-center text-xs text-muted-foreground">
        <p>
          免责声明：本系统提供中国传统文化学术研究内容，命理学说不具备科学验证性，所有内容不构成任何决策建议。
        </p>
      </footer>
    </main>
  );
}
