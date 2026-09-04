/**
 * Prisma Client 单例
 *
 * - 本地开发(Docker Postgres)：使用普通 PrismaClient 直连
 * - 生产(Neon serverless)：使用 @prisma/adapter-neon 走 HTTP pooler
 *
 * 切换逻辑：
 *   USE_NEON_ADAPTER=true 时启用 adapter 模式（Cloudflare/Neon 生产推荐）
 *   默认（含本地开发）走普通 PrismaClient
 */

import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const useAdapter = process.env.USE_NEON_ADAPTER === 'true';

  if (useAdapter) {
    // 动态加载 Neon adapter, 避免本地开发强依赖
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Pool } = require('@neondatabase/serverless') as {
      Pool: new (cfg: { connectionString: string }) => unknown;
    };
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PrismaNeon } = require('@prisma/adapter-neon') as {
      PrismaNeon: new (pool: unknown) => unknown;
    };
    const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
    const adapter = new PrismaNeon(pool);
    return new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);
  }

  // 本地开发/直连模式
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

export const prisma: PrismaClient = globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}
