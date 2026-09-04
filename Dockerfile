# ============================================================
# 命理百科 AI · 生产 Dockerfile
# 推荐使用: docker compose -f docker-compose.prod.yml up -d --build
# 架构: debian-slim (多阶段) + Node 20 Alpine (运行)
# ============================================================

# ---- 阶段 1 / 依赖安装 (de/重打包) ----
FROM node:20-bookworm-slim AS deps
WORKDIR /app
# 仅复制锁文件，最大化 layer 缓存
COPY package.json package-lock.json* ./
# 允许 package-lock.json 不存在（退化为 npm install）
RUN if [ -f package-lock.json ]; then \
      npm ci --include=dev --no-audit --no-fund; \
    else \
      npm install --include=dev --no-audit --no-fund; \
    fi

# ---- 阶段 2 / 构建产物 ----
FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Prisma Client 生成（schema 中已启用 driverApis 预览）
RUN npx prisma generate
# Next.js standalone 构建：产出 .next/standalone
RUN npm run build || (echo "=== BUILD FAILED, dumping .next/build-manifest ==="; ls -la .next 2>/dev/null || true; exit 1)

# ---- 阶段 3 / 运行镜像 (最小化) ----
FROM node:20-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs \
    && adduser  --system --uid 1001 nextjs

# 手动复制 standalone + static/public (Next standalone 官方要求)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static   ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public             ./public

# Prisma schema (用于 prisma migrate) 与生成后的 client
COPY --from=builder --chown=nextjs:nodejs /app/prisma                   ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma   ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma   ./node_modules/@prisma

USER nextjs

# Next 端口 (容器内固定 3000, 外部由 compose 映射)
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 启动: 1) 数据库就绪检查  2) Prisma migrate deploy  3) prisma db seed (幂等, upsert)  4) 启动 Next
# 注意: seed 与 migrate 通过 entrypoint 脚本注入，这里只启动 Next（健康检查由 compose 负责）
CMD ["node", "server.js"]
