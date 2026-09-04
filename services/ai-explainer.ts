/**
 * AI 解释器服务
 *
 * 职责:
 * - 只读 BaziJson + MatchedRules + MatchedStatements + KnowledgeBase
 * - 调用 LLM (OpenAI 兼容协议, 支持 DeepSeek/通义)
 * - 生成自然语言命理解释
 * - 记录 AIAnalysisRecord (含 prompt 版本/输入快照/tokens/耗时)
 *
 * 限制:
 * - AI 不计算八字 (数据由 BaziCalcService 提供)
 * - AI 不决定规则 (规则由 RuleEngine 匹配)
 * - AI 只做自然语言解释
 *
 * 对应文档: §九 AI 解释器
 */

import OpenAI from 'openai';
import type { BaziJson } from '@/engine/types';
import type { MatchedRule } from '@/engine/rule-dsl';
import type { MatchedStatement } from './statement-engine';
import { getActivePrompt, renderPrompt } from '@/prompts';
import { hashString, stableStringify } from '@/lib/utils';
import { prisma } from '@/lib/prisma';
import type { PrismaClient, AIPromptVersion } from '@prisma/client';

export interface AiExplainInput {
  bazi: BaziJson;
  matchedRules: MatchedRule[];
  matchedStatements: MatchedStatement[];
  knowledgeNodes?: { code: string; title: string; content: string }[];
  analysisFocus?: string; // 性格/事业/婚姻/健康
}

export interface AiExplainResult {
  recordId: string;
  text: string;
  promptVersion: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
  cached: boolean;
}

export class AiExplainer {
  private client: OpenAI | null = null;

  constructor(
    private prismaClient: PrismaClient = prisma,
    private opts?: {
      apiKey?: string;
      baseURL?: string;
      model?: string;
      provider?: string;
    },
  ) {
    const key = opts?.apiKey ?? process.env.AI_API_KEY;
    const base = opts?.baseURL ?? process.env.AI_BASE_URL;
    if (key && base) {
      this.client = new OpenAI({ apiKey: key, baseURL: base });
    }
  }

  /**
   * 获取或创建活跃的 AIPromptVersion 记录
   */
  private async getOrCreatePromptVersion(): Promise<AIPromptVersion> {
    const active = await this.prismaClient.aIPromptVersion.findFirst({
      where: { active: true },
    });
    if (active) return active;

    const tpl = getActivePrompt();
    return this.prismaClient.aIPromptVersion.create({
      data: {
        version: tpl.version,
        name: tpl.name,
        template: tpl.userTemplate,
        variables: tpl.variables,
        active: true,
        description: tpl.description,
      },
    });
  }

  /**
   * 生成 AI 解释
   */
  async explain(input: AiExplainInput): Promise<AiExplainResult> {
    const startTime = Date.now();

    // 1. 获取 prompt 版本
    const promptVersion = await this.getOrCreatePromptVersion();
    const tpl = getActivePrompt();

    // 2. 构建输入快照 + 哈希 (用于缓存)
    const inputSnapshot = {
      bazi: input.bazi,
      matchedRules: input.matchedRules,
      matchedStatements: input.matchedStatements,
      knowledgeNodes: input.knowledgeNodes ?? [],
      analysisFocus: input.analysisFocus ?? '综合分析',
      promptVersion: tpl.version,
    };
    const inputHash = hashString(stableStringify(inputSnapshot));

    // 3. 缓存命中检查
    const cached = await this.prismaClient.aIAnalysisRecord.findFirst({
      where: { inputHash, succeeded: true, promptVersionId: promptVersion.id },
      orderBy: { createdAt: 'desc' },
    });
    if (cached) {
      return {
        recordId: cached.id,
        text: cached.outputText,
        promptVersion: promptVersion.version,
        provider: cached.provider,
        model: cached.model,
        inputTokens: cached.inputTokens,
        outputTokens: cached.outputTokens,
        durationMs: cached.durationMs,
        cached: true,
      };
    }

    // 4. 调用 LLM
    if (!this.client) {
      throw new AiExplainerError(
        'AI 服务未配置, 请设置 AI_API_KEY 与 AI_BASE_URL 环境变量',
      );
    }

    const model = this.opts?.model ?? process.env.AI_MODEL ?? 'deepseek-chat';
    const provider = this.opts?.provider ?? process.env.AI_PROVIDER ?? 'deepseek';

    const userPrompt = renderPrompt(tpl.userTemplate, {
      baziJson: JSON.stringify(input.bazi, null, 2),
      matchedRules: JSON.stringify(input.matchedRules, null, 2),
      matchedStatements: JSON.stringify(input.matchedStatements, null, 2),
      knowledgeNodes: JSON.stringify(input.knowledgeNodes ?? [], null, 2),
      analysisFocus: input.analysisFocus ?? '综合分析（性格、格局、五行旺衰、大运流年概览）',
    });

    let outputText = '';
    let inputTokens = 0;
    let outputTokens = 0;
    let succeeded = true;
    let errorMessage: string | undefined;

    try {
      const completion = await this.client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: tpl.system },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });
      outputText = completion.choices[0]?.message?.content ?? '';
      inputTokens = completion.usage?.prompt_tokens ?? 0;
      outputTokens = completion.usage?.completion_tokens ?? 0;
    } catch (e) {
      succeeded = false;
      errorMessage = e instanceof Error ? e.message : 'LLM 调用失败';
      outputText = '';
    }

    const durationMs = Date.now() - startTime;

    // 5. 记录 AIAnalysisRecord
    const record = await this.prismaClient.aIAnalysisRecord.create({
      data: {
        baziChartId: await this.findChartId(input.bazi),
        promptVersionId: promptVersion.id,
        inputHash,
        inputSnapshot: inputSnapshot as any,
        outputText,
        outputTokens,
        inputTokens,
        durationMs,
        provider,
        model,
        succeeded,
        errorMessage,
      },
    });

    if (!succeeded) {
      throw new AiExplainerError(errorMessage ?? 'AI 解释失败');
    }

    return {
      recordId: record.id,
      text: outputText,
      promptVersion: promptVersion.version,
      provider,
      model,
      inputTokens,
      outputTokens,
      durationMs,
      cached: false,
    };
  }

  /**
   * 根据 BaziJson 找到对应的 BaziChart 记录
   */
  private async findChartId(bazi: BaziJson): Promise<string> {
    const chartHash = hashString(stableStringify(bazi));
    const chart = await this.prismaClient.baziChart.findUnique({
      where: { chartHash },
    });
    return chart?.id ?? '';
  }
}

export class AiExplainerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiExplainerError';
  }
}

/** 单例 */
export const aiExplainer = new AiExplainer();
