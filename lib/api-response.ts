/**
 * API 统一响应工具
 *
 * 成功: { data: T }
 * 失败: { error: { code, message, details? } }
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export type ErrorCode =
  | 'INVALID_INPUT'
  | 'NOT_FOUND'
  | 'ENGINE_ERROR'
  | 'AI_ERROR'
  | 'RATE_LIMITED'
  | 'UNAUTHORIZED'
  | 'INTERNAL_ERROR';

export class ApiError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 400,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function ok<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json({ data }, { status });
}

export function fail(
  code: ErrorCode,
  message: string,
  statusCode: number = 400,
  details?: unknown,
): NextResponse {
  return NextResponse.json(
    { error: { code, message, ...(details !== undefined ? { details } : {}) } },
    { status: statusCode },
  );
}

export function failFromError(e: unknown): NextResponse {
  if (e instanceof ApiError) {
    return fail(e.code, e.message, e.statusCode, e.details);
  }
  if (e instanceof ZodError) {
    return fail('INVALID_INPUT', '请求参数校验失败', 422, e.issues);
  }
  const msg = e instanceof Error ? e.message : '未知错误';
  return fail('INTERNAL_ERROR', msg, 500);
}

/** 客户端 IP (用于限流/日志) */
export function getClientIp(req: Request): string | null {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip');
}
