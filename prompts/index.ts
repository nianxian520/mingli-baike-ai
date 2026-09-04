/**
 * Prompt 版本管理
 *
 * - 所有 prompt 版本在此注册
 * - 同时只有一个版本为 active
 * - 通过 prisma AIPromptVersion 表持久化, 此文件为种子来源
 */

export { PROMPT_TEMPLATE, PROMPT_VERSION, PROMPT_NAME } from './v1.0.0';
export { renderPrompt, type PromptTemplate } from './v1.0.0';

import { PROMPT_TEMPLATE } from './v1.0.0';
import type { PromptTemplate } from './v1.0.0';

/** 所有已注册 prompt 版本 (按时间倒序, 第一个为最新/默认) */
export const ALL_PROMPT_VERSIONS: PromptTemplate[] = [PROMPT_TEMPLATE];

/** 获取当前活跃版本 (最新) */
export function getActivePrompt(): PromptTemplate {
  return ALL_PROMPT_VERSIONS[0];
}

/** 按版本号获取 */
export function getPromptByVersion(version: string): PromptTemplate | undefined {
  return ALL_PROMPT_VERSIONS.find((p) => p.version === version);
}
