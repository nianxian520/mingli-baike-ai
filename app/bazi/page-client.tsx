'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { BaziForm, type BaziFormResult } from '@/components/bazi/bazi-form';
import { BaziResult } from '@/components/bazi/bazi-result';

export function BaziPageClient() {
  const [result, setResult] = useState<BaziFormResult | null>(null);

  return (
    <main className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <nav className="mb-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            首页
          </Link>
          <span className="mx-1">/</span>
          <span>八字排盘</span>
        </nav>
        <h1 className="text-3xl font-bold tracking-tight">八字排盘</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          输入出生时间与地点，自动生成四柱八字、五行、十神、藏干、刑冲合害、大运流年。
          计算引擎基于 lunar-javascript 历法库，结果确定性可复现。
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[400px_1fr]">
        {/* 表单 */}
        <div className="lg:sticky lg:top-8 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle>出生信息</CardTitle>
              <CardDescription>阳历时间 + 性别 + 出生地点</CardDescription>
            </CardHeader>
            <CardContent>
              <BaziForm onResult={setResult} />
            </CardContent>
          </Card>
        </div>

        {/* 结果 */}
        <div>
          {result ? (
            <BaziResult
              data={result.bazi}
              chartId={result.chartId}
              cached={result.cached}
            />
          ) : (
            <Card className="flex min-h-[400px] items-center justify-center border-dashed">
              <CardContent className="p-8 text-center text-muted-foreground">
                <p className="text-lg">填写左侧表单后点击「排盘」</p>
                <p className="mt-2 text-sm">结果将在此处展示四柱、五行、十神、大运等</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <footer className="mt-12 border-t pt-6 text-center text-xs text-muted-foreground">
        <p>
          免责声明：本系统提供中国传统文化学术研究内容，命理学说不具备科学验证性，所有内容不构成任何决策建议。
        </p>
      </footer>
    </main>
  );
}
