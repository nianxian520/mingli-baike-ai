/**
 * POST /api/bazi/[chartId]/analyze
 *
 * 对已存在的八字命盘进行 AI 解释
 * 流程:
 * 1. 加载 BaziChart.fullJson
 * 2. RuleEngine.match(bazi)
 * 3. StatementEngine.match(bazi, matchedRules)
 * 4. AiExplainer.explain({ bazi, matchedRules, matchedStatements })
 * 5. 返回 AI 解释文本 + 元信息
 *
 * AI 只读取结构化数据, 不计算八字, 不决定规则
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ok, fail, failFromError, ApiError } from '@/lib/api-response';
import { createRuleEngine } from '@/services/rule-engine';
import { StatementEngine } from '@/services/statement-engine';
import { aiExplainer, AiExplainerError } from '@/services/ai-explainer';
import type { BaziJson } from '@/engine/types';
import { safeValidateBaziJson } from '@/lib/schemas/bazi-output';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // LLM 调用可能耗时

const AnalyzeBody = z.object({
  analysisFocus: z.string().max(200).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { chartId: string } },
) {
  try {
    const chartId = params.chartId;
    const body = await req.json().catch(() => ({}));
    const { analysisFocus } = AnalyzeBody.parse(body);

    // 1. 加载命盘
    const chart = await prisma.baziChart.findUnique({
      where: { id: chartId },
    });
    if (!chart) {
      throw new ApiError('NOT_FOUND', `命盘 ${chartId} 不存在`, 404);
    }

    const parsed = safeValidateBaziJson(chart.fullJson);
    if (!parsed.success) {
      return fail('INVALID_CHART_DATA', '命盘数据格式异常，请重新计算', 422);
    }
    const bazi = parsed.data as BaziJson;

    // 2. 规则引擎匹配
    const ruleEngine = createRuleEngine(prisma);
    const matchedRules = await ruleEngine.match(bazi, { limit: 30 });

    // 3. 断语引擎匹配
    const statementEngine = new StatementEngine(prisma);
    const matchedStatements = await statementEngine.match(bazi, matchedRules, {
      limit: 50,
    });

    // 4. AI 解释 (只读结构化数据)
    const result = await aiExplainer.explain({
      bazi,
      matchedRules,
      matchedStatements,
      analysisFocus,
    });

    return ok({
      chartId,
      text: result.text,
      meta: {
        promptVersion: result.promptVersion,
        provider: result.provider,
        model: result.model,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        durationMs: result.durationMs,
        cached: result.cached,
        recordId: result.recordId,
        matchedRulesCount: matchedRules.length,
        matchedStatementsCount: matchedStatements.length,
      },
    });
  } catch (e) {
    if (e instanceof AiExplainerError) {
      return fail('AI_ERROR', e.message, 503);
    }
    return failFromError(e);
  }
}

/**
 * GET /api/bazi/[chartId]/analyze
 * 返回该命盘的历史 AI 分析记录
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { chartId: string } },
) {
  try {
    const records = await prisma.aIAnalysisRecord.findMany({
      where: { baziChartId: params.chartId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { promptVersion: true },
    });
    return ok({
      chartId: params.chartId,
      records: records.map((r) => ({
        id: r.id,
        promptVersion: r.promptVersion.version,
        provider: r.provider,
        model: r.model,
        succeeded: r.succeeded,
        text: r.outputText,
        inputTokens: r.inputTokens,
        outputTokens: r.outputTokens,
        durationMs: r.durationMs,
        createdAt: r.createdAt,
        errorMessage: r.errorMessage,
      })),
    });
  } catch (e) {
    return failFromError(e);
  }
}
