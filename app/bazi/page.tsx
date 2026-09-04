import type { Metadata } from 'next';
import { BaziPageClient } from './page-client';

export const metadata: Metadata = {
  title: '八字排盘',
  description:
    '免费在线八字排盘工具。输入出生日期、时间、性别、出生地点，自动生成四柱八字、五行、十神、藏干、刑冲合害、大运流年。基于 lunar-javascript 历法库，结果确定性可复现。',
  alternates: { canonical: '/bazi' },
  openGraph: {
    title: '八字排盘 · 命理百科 AI',
    description: '在线八字排盘：四柱、五行、十神、大运流年一键生成。',
    type: 'website',
  },
};

export default function BaziPage() {
  return <BaziPageClient />;
}
