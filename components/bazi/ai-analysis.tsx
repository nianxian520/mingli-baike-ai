'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';

interface AiAnalysisProps {
  chartId: string;
}

interface AiResult {
  text: string;
  meta: {
    promptVersion: string;
    provider: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    durationMs: number;
    cached: boolean;
    recordId: string;
    matchedRulesCount: number;
    matchedStatementsCount: number;
  };
}

const FOCUS_OPTIONS = [
  { value: '综合分析', label: '综合分析' },
  { value: '性格分析', label: '性格倾向' },
  { value: '事业分析', label: '事业发展' },
  { value: '婚姻分析', label: '婚姻感情' },
  { value: '健康分析', label: '健康状况' },
  { value: '财运分析', label: '财运理财' },
];

export function AiAnalysis({ chartId }: AiAnalysisProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [focus, setFocus] = useState('综合分析');

  async function handleAnalyze() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/bazi/${chartId}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisFocus: focus }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error?.message ?? 'AI 分析失败');
        return;
      }
      setResult(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : '网络错误');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-5 w-5 text-primary" />
          AI 命理解读
        </CardTitle>
        <CardDescription>
          基于结构化八字数据与匹配的命理规则、断语，由 AI 生成自然语言解释
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!result && !loading && (
          <>
            <p className="text-sm text-muted-foreground">
              AI 解释器只读取确定性引擎产出的 BaziJson 与规则引擎匹配的断语，
              不计算八字，不决定规则。所有解释可追溯。
            </p>
            <div className="flex items-center gap-3">
              <Select value={focus} onValueChange={setFocus}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="选择分析方向" />
                </SelectTrigger>
                <SelectContent>
                  {FOCUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAnalyze} size="lg">
                <Sparkles className="mr-2 h-4 w-4" />
                生成 AI 命理解读
              </Button>
            </div>
          </>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            AI 正在读取命盘数据并生成解释…（可能需要 10-30 秒）
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">AI 分析出错</p>
              <p className="mt-1 text-xs">{error}</p>
              <p className="mt-1 text-xs">
                请确认已配置 AI_API_KEY 与 AI_BASE_URL 环境变量。
              </p>
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="prose prose-sm max-w-none whitespace-pre-wrap rounded-md bg-muted/40 p-4 text-sm leading-relaxed">
              {result.text}
            </div>

            <div className="flex flex-wrap gap-2">
              {result.meta.cached && (
                <Badge variant="secondary" className="text-[10px]">命中缓存</Badge>
              )}
              <Badge variant="outline" className="text-[10px]">
                {result.meta.provider} · {result.meta.model}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                prompt {result.meta.promptVersion}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                规则 {result.meta.matchedRulesCount} 条
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                断语 {result.meta.matchedStatementsCount} 条
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                {result.meta.inputTokens + result.meta.outputTokens} tokens
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                {(result.meta.durationMs / 1000).toFixed(1)}s
              </Badge>
            </div>

            <Button variant="outline" size="sm" onClick={handleAnalyze} disabled={loading}>
              重新生成
            </Button>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          免责声明：AI 生成的解释仅基于中国传统文化命理学说，命理学说不具备科学验证性，所有内容不构成任何决策建议。
        </p>
      </CardContent>
    </Card>
  );
}
