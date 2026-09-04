/**
 * GET /api/encyclopedia/[type]/[key]
 *
 * 百科查询接口
 * - type: tiangan/dizhi/ganzhi/shishen/wuxing
 * - key: 具体标识 (如 jia / zi / jiazi / zheng-guan / wood)
 *
 * 返回: KnowledgeNode (含正文 Markdown) + 关联断语
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ok, fail, failFromError, ApiError } from '@/lib/api-response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ParamsSchema = z.object({
  type: z.enum(['tiangan', 'dizhi', 'ganzhi', 'shishen', 'wuxing']),
  key: z.string().min(1).max(50),
});

const TYPE_TO_NODE_TYPE: Record<string, string> = {
  tiangan: 'TIAN_GAN',
  dizhi: 'DI_ZHI',
  ganzhi: 'GAN_ZHI',
  shishen: 'SHI_SHEN',
  wuxing: 'WU_XING',
};

export async function GET(
  req: NextRequest,
  { params }: { params: { type: string; key: string } },
) {
  try {
    const parsed = ParamsSchema.parse(params);
    const nodeType = TYPE_TO_NODE_TYPE[parsed.type];

    // 按 slug 或对应字段查找
    const slug = parsed.key;
    const node = await prisma.knowledgeNode.findFirst({
      where: {
        type: nodeType as any,
        OR: [
          { slug },
          { stem: parsed.key },
          { branch: parsed.key },
          { ganzhi: parsed.key },
          { tenGod: parsed.key },
          { element: parsed.key },
        ],
      },
      include: {
        children: true,
        statementNodes: { include: { statement: true }, take: 20 },
      },
    });

    if (!node) {
      throw new ApiError('NOT_FOUND', `百科条目 ${parsed.type}/${parsed.key} 不存在`, 404);
    }

    return ok({
      node,
      relatedStatements: node.statementNodes.map((sn) => sn.statement),
    });
  } catch (e) {
    if (e instanceof ApiError) return fail(e.code, e.message, e.statusCode);
    return failFromError(e);
  }
}
