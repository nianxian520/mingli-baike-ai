# 命理百科 AI · 系统设计方案

> 本文档为「命理百科 AI」Web 应用的第一阶段架构设计。目标：出生时间 → 四柱 → 五行 → 十神 → 刑冲合害 → 大运 → 流年 → 命理规则 → 断语 → AI 解释 → SEO 页面 的完整确定性流水线。AI 不计算八字、不发明规则，只读取结构化产物生成自然语言解释。

---

## 一、Context（背景与目标）

参考传统八字网站 KVOV 的"年月日时逐级选择并展示命理内容"交互模式（不复制其页面与代码），升级为：

**确定性八字引擎 + 结构化命理知识库 + 断语数据库 + AI 解释器 + SEO 命理百科**。

核心原则：
1. 八字计算与命理解释**完全分离**：计算引擎只产出结构化 JSON，不输出任何解释文本。
2. AI **不可计算八字**、**不可自决定规则**，只能读取 `Bazi JSON + MatchedRules + MatchedStatements + KnowledgeBase` 后生成自然语言。
3. 所有命理规则**结构化**（conditions/priority/confidence），可被规则引擎确定性匹配。
4. 所有页面 SSR/SSG 友好，自动生成 title/description/canonical/OG/Schema.org。
5. 不伪造八字结果，不自发明历法算法，**优先使用成熟开源库**。
6. 第一阶段不实现支付、会员、紫微斗数、奇门遁甲、六爻、姓名学、风水。
7. 系统未来可扩展到上述模块，但当前不实现。

## 二、技术栈确认（基于用户选择）

| 层 | 技术 | 说明 |
|---|---|---|
| 前端 | Next.js 14+ App Router + TypeScript + Tailwind CSS + shadcn/ui | RSC + SSR/SSG |
| 后端 | Next.js API Routes (Node Runtime) | 命理计算用 Node Runtime 而非 Edge（避开天文算法在 Edge 限制）|
| 数据库 | PostgreSQL @ **Neon** (Serverless) | 通过 Prisma + Neon driver 连接 |
| ORM | Prisma 5+ | 用 `@prisma/adapter-neon` 适配 Neon serverless |
| 缓存 | Cloudflare KV / Upstash Redis | 第一阶段可选，AI 解释结果与命盘缓存 |
| 八字引擎 | **lunar-javascript** (MIT) | 主计算（四柱/十神/五行/纳音/神煞/大运） |
| 真太阳时 | 自实现 solarTimeUtil + 经度校正 | 包一层封装，可后续替换为 @openfate/true-solar-time |
| 刑冲合害 | 自实现 interactions 模块（基于 lunar 八字 API） | 7 种关系：合(六合/三合/化)、冲、刑、害、破、会 |
| AI 解释器 | **OpenAI 兼容接口**对接国产模型（通义/DeepSeek） | 通过 env 配置 `base_url`，可切换 |
| 校验 | Zod | 出生时间/经纬度/时区/真太阳时严格校验 |
| 部署 | Cloudflare Pages + Functions | `@cloudflare/next-on-pages`，开启 `nodejs_compat` |
| 测试 | Vitest + Playwright | 单元 + E2E |

### Cloudflare + Neon + Prisma 关键约束
- Next.js API Routes 必须用 **Node Runtime**（`export const runtime = 'nodejs'`），不用 Edge Runtime，因为 lunar-javascript 含大量历法计算。
- Prisma 在 Cloudflare 上需用 **driverAdapter**（`@prisma/adapter-neon`）通过 HTTP 连接 Neon，避免长连接。
- 或在 `next.config.js` 配置 `nodejs_compat` flag，用 `@neondatabase/serverless` 直接连接。
- 命盘计算结果强缓存（输入哈希 → JSON），减少 Neon 读写。

---

## 三、系统架构

### 3.1 分层架构图

```
┌────────────────────────────────────────────────────────────────────┐
│                       表现层 (Next.js App Router)                  │
│  / (首页)   /bazi (排盘)   /bazi/[year]/[month]/[day]/[hour]      │
│  /tiangan/[stem]   /dizhi/[branch]   /ganzhi/[ganzhi]            │
│  /shishen/[ten-god]   /wuxing/[element]   /bazi/[day-master]     │
│        RSC + SSG(百科) + SSR(排盘) + generateMetadata             │
└─────────────────────────────┬──────────────────────────────────────┘
                              │ fetch / Server Action
┌─────────────────────────────▼──────────────────────────────────────┐
│                       API 层 (Next.js API Routes)                  │
│   POST /api/bazi/calculate   GET /api/bazi/[id]                     │
│   POST /api/bazi/[id]/analyze   GET /api/encyclopedia/[type]/[key] │
│   GET /api/statements   POST /api/rules/match                      │
│        Zod 校验 → 调用 Service → 返回 JSON                          │
└─────────────────────────────┬──────────────────────────────────────┘
                              │
┌─────────────────────────────▼──────────────────────────────────────┐
│                       服务层 (Services)                            │
│  ┌──────────────┐ ┌──────────────┐ ┌────────────────┐            │
│  │BaziCalcService│ │RuleEngine    │ │StatementEngine │            │
│  │(lunar-javascript│ │(规则匹配)    │ │(断语匹配+排序) │            │
│  │ +真太阳时+交互)│ │              │ │                │            │
│  └──────────────┘ └──────────────┘ └────────────────┘            │
│  ┌──────────────┐ ┌──────────────┐ ┌────────────────┐            │
│  │AIExplainerSvc│ │SEOService    │ │KnowledgeService│            │
│  │(国产LLM)     │ │(meta/schema) │ │(知识节点树)    │            │
│  └──────────────┘ └──────────────┘ └────────────────┘            │
└─────────────────────────────┬──────────────────────────────────────┘
                              │
┌─────────────────────────────▼──────────────────────────────────────┐
│                       数据层 (Prisma ORM → Neon)                   │
│  User / BirthProfile / BaziChart / DaYun / LiuNian               │
│  Rule / Statement / Classic / KnowledgeNode                      │
│  AIAnalysisRecord / AIPromptVersion / APICallLog                  │
└────────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────▼──────────────────────────────────────┐
│                       缓存层 (Cloudflare KV / 可选)                │
│  命盘缓存(输入哈希→BaziJSON) · AI解释缓存 · 百科页缓存              │
└────────────────────────────────────────────────────────────────────┘
```

### 3.2 核心数据流（计算路径，完全确定性）

```
用户输入(生年月日时/性别/出生地经纬度/时区)
  ↓ Zod 校验
  ↓ 真太阳时校正 (经度→时差→分钟级)
  ↓ 节气边界定位 (立春切年柱/十二节切月柱)
  ↓ lunar-javascript.Lunar.fromDate(correctedDate)
  ↓ → FourPillars(年月日时柱: 天干/地支/藏干/纳音)
  ↓ → 五行力量(木火土金水 统计 + 旺衰)
  ↓ → 十神(以日干为主，对其他干支)
  ↓ → 大运(阳男阴女顺排/阴男阳女逆排，起运岁数=3天1岁)
  ↓ → 流年(每大运10年)
  ↓ → 刑冲合害 (interactions 模块)
  ↓ Bazi JSON (结构化结果，无任何解释文本)
  ↓
  ↓ RuleEngine.match(baziJson) → MatchedRules[]
  ↓ StatementEngine.match(baziJson, matchedRules) → MatchedStatements[]
  ↓
  ↓ AIExplainer.explain({baziJson, matchedRules, matchedStatements, knowledgeBase})
  ↓   → 仅基于上述结构化数据生成自然语言（国产LLM，OpenAI兼容接口）
  ↓
  ↓ SEOService.generateMeta() → title/description/canonical/OG/Schema.org
  ↓
  ↓ 渲染 SSR/SSG 页面
```

### 3.3 关键约束（合规与确定性）

- AI prompt 中**只注入结构化数据**（Bazi JSON + Rules + Statements + Knowledge），不注入任何"请计算八字"指令。
- AI 输出附 `prompt_version` 与 `input_hash`，保证可复现、可审计。
- 所有页面含**免责声明**：本系统提供传统文化学术研究内容，不构成任何决策建议，命理预测无科学依据。
- 命理断语必须标注 `source`（古籍出处），不标注的断语不入库。

---

## 四、数据库 ER 关系

### 4.1 ER 图

```
User 1──N BirthProfile 1──1 BaziChart 1──N DaYun 1──N LiuNian
                          │
                          └──N AIAnalysisRecord N──1 AIPromptVersion
                                                                │
                                                          APICallLog (全局)

Classic 1──N Statement N──M Rule (rule_statement 关联表)
KnowledgeNode ──自关联── KnowledgeNode (parent_id，树形)
Statement N──M KnowledgeNode (statement_node 关联表)
```

### 4.2 表清单与索引设计

| 表 | 主键 | 关键索引 | 说明 |
|---|---|---|---|
| User | id | email (unique) | 用户 |
| BirthProfile | id | user_id, birth_datetime, location | 出生档案 |
| BaziChart | id | birth_profile_id, chart_hash(unique) | 命盘，chart_hash 用于缓存命中 |
| DaYun | id | bazi_chart_id, start_age | 大运 |
| LiuNian | id | dayun_id, bazi_chart_id, year | 流年 |
| Rule | id | code(unique), category, subcategory, priority | 命理规则 |
| Statement | id | code(unique), category, subcategory, source_id | 命理断语 |
| RuleStatement | (rule_id, statement_id) | 复合主键 | 规则-断语关联 |
| Classic | id | title(unique), dynasty | 古籍 |
| KnowledgeNode | id | slug(unique), parent_id, type | 知识节点（树形） |
| StatementNode | (statement_id, node_id) | 复合主键 | 断语-知识节点 |
| AIAnalysisRecord | id | chart_id, prompt_version, created_at | AI 分析记录 |
| AIPromptVersion | id | version(unique), active | prompt 版本 |
| APICallLog | id | request_hash, created_at, provider | API 调用记录 |

索引设计原则：
- 所有外键加索引（加速关联查询）
- 高频查询字段加组合索引（如 `(category, subcategory)` on Statement）
- `chart_hash` 唯一索引，用于命盘缓存命中
- `request_hash` 索引，用于 AI 结果缓存命中

---

## 五、Prisma Schema（完整）

文件路径：`prisma/schema.prisma`

```prisma
// 命理百科 AI · Prisma Schema
// DataSource: PostgreSQL (Neon serverless)

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverApis"]
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // 用于迁移，直连
}

// ============ 用户与出生档案 ============

model User {
  id            String   @id @default(cuid())
  email         String?  @unique
  phone         String?
  name          String?
  passwordHash  String?
  role          Role     @default(USER)
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  birthProfiles BirthProfile[]

  @@index([email])
  @@index([phone])
  @@map("users")
}

enum Role {
  USER
  EDITOR
  ADMIN
}

model BirthProfile {
  id            String   @id @default(cuid())
  userId        String?  @map("user_id")
  name          String   // 档案名称（本人/父亲/母亲…）
  gender        Gender
  // 公历
  birthDate     DateTime @map("birth_date")     // 已校正为 UTC
  birthYear     Int      @map("birth_year")     // 冗余，便于检索
  birthMonth    Int      @map("birth_month")
  birthDay      Int      @map("birth_day")
  birthHour     Int      @map("birth_hour")     // 0-23 真太阳时小时
  birthMinute   Int      @map("birth_minute")   // 0-59
  // 地点
  birthPlace    String?  @map("birth_place")
  longitude     Float    // 经度
  latitude      Float    // 纬度
  timezone      String  // IANA 时区，如 Asia/Shanghai
  dstObserved   Boolean  @default(false) @map("dst_observed") // 是否夏令时
  // 真太阳时校正
  solarTimeOffsetMin Int  @map("solar_time_offset_min") // 经度校正分钟数
  correctedHour Int     @map("corrected_hour")
  correctedMinute Int   @map("corrected_minute")
  // 关联
  user          User?    @relation(fields: [userId], references: [id])
  baziChart     BaziChart?
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  @@index([userId])
  @@index([birthYear, birthMonth, birthDay])
  @@index([birthDate])
  @@map("birth_profiles")
}

enum Gender {
  MALE   // 男 → 阳干顺排大运
  FEMALE // 女 → 阴干逆排大运（实际由年干阴阳+性别决定）
}

// ============ 八字命盘 ============

model BaziChart {
  id              String   @id @default(cuid())
  birthProfileId  String   @unique @map("birth_profile_id")
  chartHash       String   @unique @map("chart_hash") // 输入哈希，缓存命中
  // 四柱（结构化存储，同时存 JSON 全量）
  yearPillar      String   @map("year_pillar")    // 如 "甲子"
  monthPillar     String   @map("month_pillar")
  dayPillar       String   @map("day_pillar")
  hourPillar      String?  @map("hour_pillar")    // 子时跨日可能为空
  dayMaster       String   @map("day_master")     // 日干
  // 农历
  lunarYear       Int      @map("lunar_year")
  lunarMonth      Int      @map("lunar_month")
  lunarDay        Int      @map("lunar_day")
  isLeapMonth     Boolean  @default(false) @map("is_leap_month")
  // 节气
  currentJieqi    String   @map("current_jieqi")  // 当前节气名
  prevJieqiTime   DateTime @map("prev_jieqi_time")
  nextJieqiTime   DateTime @map("next_jieqi_time")
  // 全量结构化 JSON（BaziJson，见 §七）
  fullJson        Json     @map("full_json")
  // 关联
  birthProfile    BirthProfile @relation(fields: [birthProfileId], references: [id])
  daYuns          DaYun[]
  aiRecords       AIAnalysisRecord[]
  createdAt       DateTime @default(now()) @map("created_at")

  @@index([birthProfileId])
  @@index([dayMaster])
  @@index([chartHash])
  @@map("bazi_charts")
}

model DaYun {
  id           String   @id @default(cuid())
  baziChartId  String   @map("bazi_chart_id")
  index        Int      // 第几步大运 (1-10)
  pillar       String  // 大运干支
  startAge     Int      @map("start_age")
  endAge       Int      @map("end_age")
  startYear    Int      @map("start_year") // 公历起始年
  endYear      Int      @map("end_year")
  stem         String
  branch       String
  baziChart    BaziChart @relation(fields: [baziChartId], references: [id])
  liuNians     LiuNian[]
  createdAt    DateTime @default(now()) @map("created_at")

  @@index([baziChartId])
  @@index([startYear])
  @@map("da_yuns")
}

model LiuNian {
  id          String   @id @default(cuid())
  dayunId     String   @map("dayun_id")
  baziChartId String   @map("bazi_chart_id") // 冗余便于直接查
  year        Int      // 公历年
  age         Int      // 虚岁
  pillar      String   // 流年干支
  stem        String
  branch      String
  dayun       DaYun    @relation(fields: [dayunId], references: [id])
  baziChart   BaziChart @relation(fields: [baziChartId], references: [id])
  createdAt   DateTime @default(now()) @map("created_at")

  @@index([dayunId])
  @@index([baziChartId])
  @@index([year])
  @@map("liu_nians")
}

// ============ 命理规则与断语 ============

model Rule {
  id           String   @id @default(cuid())
  code         String   @unique // 如 R-CAREER-001
  category     String   // 事业/财运/婚姻/健康/性格/学业/六亲/格局/五行/神煞
  subcategory String?  @map("subcategory")
  name         String   // 规则名
  description  String? // 规则说明（不参与匹配）
  conditions   Json     // 结构化条件 DSL（见 §八）
  priority     Int      @default(50) // 0-100，越大越优先
  confidence   Float    @default(0.5) // 0-1，规则可信度
  tags         String[] // 标签
  source       String?  // 出处
  enabled      Boolean  @default(true)
  ruleStatements RuleStatement[]
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  @@index([category, subcategory])
  @@index([priority])
  @@index([enabled])
  @@map("rules")
}

model Statement {
  id            String   @id @default(cuid())
  code          String   @unique // 如 S-CAREER-001
  category      String
  subcategory   String?  @map("subcategory")
  statement     String   // 断语文本
  interpretation String? @map("interpretation") // 现代白话解读（可选）
  sourceId      String?  @map("source_id") // 古籍 ID
  source        String?  // 出处冗余（书名·篇名）
  tags          String[]
  conditions    Json?     // 可选：断语自带的命中条件（与规则匹配互补）
  priority      Int      @default(50)
  confidence    Float    @default(0.5)
  enabled       Boolean  @default(true)
  classic       Classic?  @relation(fields: [sourceId], references: [id])
  ruleStatements RuleStatement[]
  statementNodes StatementNode[]
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  @@index([category, subcategory])
  @@index([sourceId])
  @@index([priority])
  @@index([enabled])
  @@map("statements")
}

model RuleStatement {
  ruleId      String
  statementId String
  rule        Rule      @relation(fields: [ruleId], references: [id], onDelete: Cascade)
  statement   Statement @relation(fields: [statementId], references: [id], onDelete: Cascade)

  @@id([ruleId, statementId])
  @@index([statementId])
  @@map("rule_statements")
}

model Classic {
  id        String   @id @default(cuid())
  title     String   @unique
  dynasty   String?  // 朝代
  author    String?
  description String?
  statements Statement[]
  createdAt DateTime @default(now()) @map("created_at")

  @@index([title])
  @@map("classics")
}

// ============ 知识节点（百科树） ============

model KnowledgeNode {
  id          String   @id @default(cuid())
  slug        String   @unique // URL 友好标识 如 "jia-wood"
  parentId    String?  @map("parent_id")
  type        NodeType // TIAN_GAN/DI_ZHI/GAN_ZHI/SHI_SHEN/WU_XING/DA_YUN/CONCEPT
  title       String
  summary     String   // 摘要（meta description 用）
  content     String   // 正文 Markdown
  stem        String?  // 关联天干（百科页用）
  branch      String?  // 关联地支
  ganzhi      String?  // 关联干支
  tenGod      String?  @map("ten_god")
  element     String?  // 五行
  seoTitle       String?  @map("seo_title")
  seoDescription String?  @map("seo_description")
  parent      KnowledgeNode?  @relation("NodeTree", fields: [parentId], references: [id])
  children    KnowledgeNode[] @relation("NodeTree")
  statementNodes StatementNode[]
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@index([parentId])
  @@index([type])
  @@index([slug])
  @@index([stem])
  @@index([branch])
  @@index([ganzhi])
  @@map("knowledge_nodes")
}

enum NodeType {
  TIAN_GAN
  DI_ZHI
  GAN_ZHI
  SHI_SHEN
  WU_XING
  DA_YUN
  CONCEPT
}

model StatementNode {
  statementId String
  nodeId      String
  statement   Statement      @relation(fields: [statementId], references: [id], onDelete: Cascade)
  node        KnowledgeNode  @relation(fields: [nodeId], references: [id], onDelete: Cascade)

  @@id([statementId, nodeId])
  @@index([nodeId])
  @@map("statement_nodes")
}

// ============ AI 与审计 ============

model AIAnalysisRecord {
  id             String   @id @default(cuid())
  baziChartId    String   @map("bazi_chart_id")
  promptVersionId String  @map("prompt_version_id")
  inputHash      String   @map("input_hash") // (chartId+rules+statements) 哈希
  inputSnapshot  Json      @map("input_snapshot")  // 注入 AI 的结构化数据快照
  outputText     String   @map("output_text")     // AI 生成文本
  outputTokens   Int      @map("output_tokens")
  inputTokens    Int      @map("input_tokens")
  durationMs     Int      @map("duration_ms")
  provider       String   // qwen/deepseek
  model          String
  succeeded      Boolean  @default(true)
  errorMessage   String?  @map("error_message")
  baziChart      BaziChart     @relation(fields: [baziChartId], references: [id])
  promptVersion  AIPromptVersion @relation(fields: [promptVersionId], references: [id])
  createdAt      DateTime @default(now()) @map("created_at")

  @@index([baziChartId])
  @@index([promptVersionId])
  @@index([inputHash])
  @@index([createdAt])
  @@map("ai_analysis_records")
}

model AIPromptVersion {
  id          String   @id @default(cuid())
  version     String   @unique // "v1.0.0"
  name        String
  template    String   // prompt 模板（含变量占位符）
  variables   String[] // 可用变量名
  active      Boolean  @default(false) // 同时只有一个 active
  description String?
  aiRecords   AIAnalysisRecord[]
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@index([active])
  @@map("ai_prompt_versions")
}

model APICallLog {
  id           String   @id @default(cuid())
  endpoint     String
  method       String
  requestHash  String   @map("request_hash")
  statusCode   Int      @map("status_code")
  durationMs   Int      @map("duration_ms")
  userId       String?  @map("user_id")
  ip           String?
  userAgent    String?  @map("user_agent")
  errorMessage String?  @map("error_message")
  createdAt    DateTime @default(now()) @map("created_at")

  @@index([endpoint, createdAt])
  @@index([requestHash])
  @@index([userId])
  @@map("api_call_logs")
}
```

---

## 六、API 设计

### 6.1 路由清单

| 方法 | 路径 | 用途 | 校验 |
|---|---|---|---|
| POST | `/api/bazi/calculate` | 计算八字，返回 BaziJson | Zod BirthInputSchema |
| GET | `/api/bazi/[chartId]` | 获取已存命盘 | chartId cuid |
| GET | `/api/bazi/[chartId]/dayun` | 获取大运列表 | - |
| GET | `/api/bazi/[chartId]/liunian/[year]` | 获取某流年 | year Int |
| POST | `/api/bazi/[chartId]/analyze` | AI 分析（注入结构化数据） | chartId + aspect |
| GET | `/api/encyclopedia/[type]/[key]` | 百科查询（tiangan/dizhi/ganzhi/shishen/wuxing） | enum type |
| GET | `/api/statements` | 查询断语（按 category/source） | query params |
| GET | `/api/rules` | 查询规则 | query params |
| POST | `/api/rules/match` | 规则匹配（输入 BaziJson） | BaziJsonSchema |
| GET | `/api/seo/[page]` | 获取 SEO meta（开发调试用） | - |

### 6.2 关键请求/响应 Schema（Zod）

```ts
// lib/schemas/bazi-input.ts
export const BirthInputSchema = z.object({
  year: z.number().int().min(1900).max(2100),
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31),
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().min(0).max(59).default(0),
  gender: z.enum(['MALE', 'FEMALE']),
  // 出生地点（经纬度优先）
  longitude: z.number().min(-180).max(180),
  latitude: z.number().min(-90).max(90),
  timezone: z.string().refine(v => isValidTimezone(v), 'Invalid IANA tz'),
  birthPlace: z.string().optional(),
  dstObserved: z.boolean().default(false),
}).superRefine((val, ctx) => {
  // 校验日期合法性（含闰年/月份天数）
  const d = new Date(Date.UTC(val.year, val.month - 1, val.day, val.hour, val.minute));
  if (d.getUTCFullYear() !== val.year || d.getUTCMonth() !== val.month - 1 || d.getUTCDate() !== val.day) {
    ctx.addIssue({ code: 'custom', path: ['day'], message: 'Invalid date' });
  }
});
```

### 6.3 错误响应统一格式

```ts
{ "error": { "code": "INVALID_INPUT", "message": "...", "details": [...] } }
```

错误码：`INVALID_INPUT / NOT_FOUND / ENGINE_ERROR / AI_ERROR / RATE_LIMITED`

### 6.4 速率限制
- 计算接口：20 req/min/IP
- AI 分析：5 req/min/IP（成本控制）
- 百科查询：60 req/min/IP

---

## 七、Bazi JSON Schema（八字计算产物标准结构）

文件路径：`types/bazi.ts` + `lib/schemas/bazi-output.ts`

```ts
// engine/types.ts —— 八字计算引擎输出（确定性，无解释文本）
export interface BaziJson {
  meta: {
    engine: 'lunar-javascript';
    engineVersion: string;
    calculatedAt: string;       // ISO8601
    inputHash: string;          // 输入哈希
    solarTimeCorrected: boolean;
  };
  input: {
    gender: 'MALE' | 'FEMALE';
    solar: { year: number; month: number; day: number; hour: number; minute: number };
    lunar: { year: number; month: number; day: number; isLeapMonth: boolean; monthName: string; dayName: string };
    location: { longitude: number; latitude: number; timezone: string; placeName?: string };
    solarTime: {
      originalHour: number; originalMinute: number;
      offsetMin: number; // 经度校正分钟
      correctedHour: number; correctedMinute: number;
      dayRolled: boolean; // 是否跨日
    };
  };
  jieqi: {
    current: { name: string; time: string };
    previous: { name: string; time: string };
    next: { name: string; time: string };
  };
  pillars: {
    year: Pillar; month: Pillar; day: Pillar; hour: Pillar | null;
  };
  dayMaster: {
    stem: string;          // 天干 如 "甲"
    element: string;       // 五行 如 "木"
    yinYang: 'YIN' | 'YANG';
    strength: 'WANG' | 'XIANG' | 'PING' | 'RUO' | 'JUE'; // 旺相平弱绝
  };
  wuxing: {
    count: { wood: number; fire: number; earth: number; metal: number; water: number };
    percentage: { wood: number; fire: number; earth: number; metal: number; water: number };
    missing: string[];  // 缺失五行
    dominant: string[]; // 最旺五行
  };
  tenGods: {
    year: { stem: string; branch: string; stemTenGod: string; branchTenGod: string; branchHidden: { stem: string; tenGod: string }[] };
    month: TenGodRow;
    day: TenGodRow;  // 日干为主
    hour: TenGodRow | null;
  };
  nanyin: { year: string; month: string; day: string; hour: string | null };
  hiddenStems: {
    year: string[]; month: string[]; day: string[]; hour: string[] | null;
  };
  interactions: {
    combinations: Interaction[]; // 六合/三合/三会/化
    clashes: Interaction[];      // 冲
    punishments: Interaction[];  // 刑
    harms: Interaction[];        // 害
    breaks: Interaction[];      // 破
    meetings: Interaction[];    // 半合/方局
  };
  daYun: {
    direction: 'FORWARD' | 'BACKWARD'; // 顺/逆
    startAge: number;     // 起运岁数
    startYear: number;    // 起运公历年
    entries: DaYunEntry[];
  };
  liuNian: LiuNianEntry[]; // 当前大运下 10 流年（按需扩展）
  shenSha: { year: string[]; month: string[]; day: string[]; hour: string[] | null };
  pattern: {
    name: string | null;       // 格局名（正官/七杀/食神/伤官/正财/偏财/正印/偏印/建禄/月刃）
    description: string;       // 简短说明（不参与解释）
  };
  xiYong: {
    xiShen: string[];  // 喜神五行
    yongShen: string[]; // 用神五行
    jiShen: string[];  // 忌神五行
    method: string;     // 判定方法说明
  };
}

interface Pillar {
  ganzhi: string;     // "甲子"
  stem: string;       // "甲"
  branch: string;     // "子"
  stemElement: string;
  branchElement: string;
  nanyin: string;     // 纳音 "海中金"
  shishen: string;    // 该柱天干相对日干的十神
  changSheng: string; // 十二长生
}

interface Interaction {
  type: 'COMBINATION_2' | 'COMBINATION_3' | 'COMBINATION_3_DIRECTION' | 'CLASH' | 'PUNISHMENT' | 'HARM' | 'BREAK' | 'HALF_COMBINATION';
  positions: ('year' | 'month' | 'day' | 'hour')[];
  branches: string[];
  description: string; // "子丑合化土" 等
}

interface DaYunEntry {
  index: number;
  ganzhi: string;
  stem: string; branch: string;
  startAge: number; endAge: number;
  startYear: number; endYear: number;
}

interface LiuNianEntry {
  year: number; age: number;
  ganzhi: string; stem: string; branch: string;
}
```

**校验**：`lib/schemas/bazi-output.ts` 用 Zod 定义 `BaziJsonSchema`，引擎输出后必须通过 schema 校验才入库/返回。

---

## 八、Rule Engine 设计

### 8.1 规则结构

每条规则（`Rule`）由：
- `conditions`: 结构化条件 DSL（JSON），描述何时命中
- `priority`: 0-100，越大越优先
- `confidence`: 0-1，规则可信度
- 关联 `Statement[]`（通过 `RuleStatement`）

### 8.2 条件 DSL（领域专用语言）

设计为**纯声明式 JSON**，规则引擎确定性匹配，无 eval/new Function。

```ts
// engine/rule-dsl.ts
type Condition =
  | { op: 'AND'; children: Condition[] }
  | { op: 'OR'; children: Condition[] }
  | { op: 'NOT'; child: Condition }
  | { op: 'EQ'; path: string; value: any }                       // 等于
  | { op: 'IN'; path: string; values: any[] }                    // 包含于
  | { op: 'CONTAINS'; path: string; value: any }                 // 数组包含
  | { op: 'STEM_IS'; position: PillarPos; stem: string }         // 某柱天干是 X
  | { op: 'BRANCH_IS'; position: PillarPos; branch: string }
  | { op: 'GANZHI_IS'; position: PillarPos; ganzhi: string }
  | { op: 'HAS_INTERACTION'; type: InteractionType; positions?: PillarPos[] }
  | { op: 'WUXING_MISSING'; elements: string[] }
  | { op: 'WUXING_DOMINANT'; elements: string[] }
  | { op: 'TEN_GOD_AT'; position: PillarPos; tenGod: string }
  | { op: 'DAY_MASTER_STRENGTH'; level: 'WANG' | 'RUO' | string }
  | { op: 'PATTERN_IS'; pattern: string }
  | { op: 'DAYUN_PILLAR'; ganzhi?: string; stem?: string; branch?: string }
  | { op: 'LIUNIAN_PILLAR'; year?: number; ganzhi?: string }
  | { op: 'XIYONG_INCLUDES'; elements: string[] }
```

示例规则（R-CAREER-001：日主偏弱且官杀旺）：

```json
{
  "code": "R-CAREER-001",
  "category": "career",
  "name": "日主偏弱·官杀旺",
  "conditions": {
    "op": "AND",
    "children": [
      { "op": "DAY_MASTER_STRENGTH", "level": "RUO" },
      {
        "op": "OR",
        "children": [
          { "op": "TEN_GOD_AT", "position": "month", "tenGod": "七杀" },
          { "op": "TEN_GOD_AT", "position": "month", "tenGod": "正官" }
        ]
      }
    ]
  },
  "priority": 80,
  "confidence": 0.7,
  "tags": ["事业", "官杀"],
  "source": "子平真诠·论官星"
}
```

### 8.3 匹配算法

```ts
// services/rule-engine.ts
class RuleEngine {
  constructor(private prisma: PrismaClient) {}

  async match(bazi: BaziJson, opts?: { category?: string; limit?: number }): Promise<MatchedRule[]> {
    const rules = await this.prisma.rule.findMany({
      where: { enabled: true, category: opts?.category },
      include: { ruleStatements: { include: { statement: true } } },
    });
    const matched: MatchedRule[] = [];
    for (const rule of rules) {
      const ok = this.evalCondition(rule.conditions as Condition, bazi);
      if (ok) {
        matched.push({
          ruleCode: rule.code,
          ruleName: rule.name,
          category: rule.category,
          priority: rule.priority,
          confidence: rule.confidence,
          statements: rule.ruleStatements.map(rs => ({
            code: rs.statement.code,
            statement: rs.statement.statement,
            source: rs.statement.source,
            confidence: rs.statement.confidence,
          })),
        });
      }
    }
    // 按 priority desc, confidence desc 排序
    matched.sort((a, b) => b.priority - a.priority || b.confidence - a.confidence);
    return matched.slice(0, opts?.limit ?? 50);
  }

  private evalCondition(cond: Condition, bazi: BaziJson): boolean {
    switch (cond.op) {
      case 'AND': return cond.children.every(c => this.evalCondition(c, bazi));
      case 'OR':  return cond.children.some(c => this.evalCondition(c, bazi));
      case 'NOT': return !this.evalCondition(cond.child, bazi);
      case 'EQ': return lodashGet(bazi, cond.path) === cond.value;
      case 'IN': return cond.values.includes(lodashGet(bazi, cond.path));
      case 'CONTAINS': return (lodashGet(bazi, cond.path) ?? []).includes(cond.value);
      case 'STEM_IS': return bazi.pillars[cond.position]?.stem === cond.stem;
      case 'BRANCH_IS': return bazi.pillars[cond.position]?.branch === cond.branch;
      case 'GANZHI_IS': return bazi.pillars[cond.position]?.ganzhi === cond.ganzhi;
      case 'HAS_INTERACTION': return bazi.interactions[cond.typeToField(cond.type)]
        .some(i => !cond.positions || cond.positions.every(p => i.positions.includes(p)));
      case 'WUXING_MISSING': return cond.elements.every(e => bazi.wuxing.missing.includes(e));
      case 'WUXING_DOMINANT': return cond.elements.some(e => bazi.wuxing.dominant.includes(e));
      case 'TEN_GOD_AT': {
        const row = bazi.tenGods[cond.position];
        return row && (row.stemTenGod === cond.tenGod || row.branchTenGod === cond.tenGod);
      }
      case 'DAY_MASTER_STRENGTH': return bazi.dayMaster.strength === cond.level;
      case 'PATTERN_IS': return bazi.pattern.name === cond.pattern;
      case 'DAYUN_PILLAR': return bazi.daYun.entries.some(e =>
        (!cond.ganzhi || e.ganzhi === cond.ganzhi) &&
        (!cond.stem || e.stem === cond.stem) &&
        (!cond.branch || e.branch === cond.branch));
      case 'LIUNIAN_PILLAR': return bazi.liuNian.some(l =>
        (!cond.year || l.year === cond.year) &&
        (!cond.ganzhi || l.ganzhi === cond.ganzhi));
      case 'XIYONG_INCLUDES': return cond.elements.every(e => [...bazi.xiYong.xiShen, ...bazi.xiYong.yongShen].includes(e));
      default: return false;
    }
  }
}
```

### 8.4 StatementEngine

```ts
// services/statement-engine.ts
class StatementEngine {
  async match(bazi: BaziJson, matchedRules: MatchedRule[], opts?: { category?: string; limit?: number }): Promise<MatchedStatement[]> {
    // 1. 收集规则关联的断语
    const fromRules = matchedRules.flatMap(r => r.statements);
    // 2. 补充：断语自带 conditions 也命中
    const extra = await this.prisma.statement.findMany({
      where: { enabled: true, conditions: { not: null }, category: opts?.category },
    });
    const fromSelf = extra.filter(s => s.conditions && this.evalStatementConditions(s.conditions, bazi));
    // 合并去重，按 priority/confidence 排序
    return this.mergeAndRank([...fromRules, ...fromSelf], opts?.limit ?? 30);
  }
}
```

### 8.5 AI Explainer（只读注入）

```ts
// services/ai-explainer.ts
class AIExplainer {
  async explain(input: {
    bazi: BaziJson;
    matchedRules: MatchedRule[];
    matchedStatements: MatchedStatement[];
    knowledgeNodes: KnowledgeNode[];
    aspect: 'career' | 'marriage' | 'health' | 'wealth' | 'personality';
  }): Promise<AIAnalysisResult> {
    const promptVersion = await this.getActivePrompt();
    const rendered = this.renderPrompt(promptVersion, input); // 仅注入结构化数据
    const resp = await this.openai.chat.completions.create({
      model: process.env.AI_MODEL,
      messages: [{ role: 'system', content: rendered.system },
                 { role: 'user', content: rendered.user }],
    });
    // 记录到 AIAnalysisRecord
    await this.prisma.aiAnalysisRecord.create({ ... });
    return { text: resp.choices[0].message.content, promptVersion: promptVersion.version, inputHash: hash(input) };
  }
}
```

Prompt 模板**强制约束**（system message）：
> 你是命理百科解释器。你**不能**计算八字，**不能**判断命理规则，**只能**基于提供的结构化 BaziJson、已匹配的 Rules、已匹配的 Statements、知识库节点生成自然语言解释。所有结论必须引用提供的断语 code。不得编造未提供的数据。输出末尾必须附免责声明。

---

## 九、目录结构

```
.
├── app/                          # Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx                  # 首页（出生输入表单）
│   ├── bazi/
│   │   ├── page.tsx              # /bazi 排盘首页
│   │   └── [year]/
│   │       ├── page.tsx          # /bazi/[year]
│   │       └── [month]/
│   │           ├── page.tsx      # /bazi/[year]/[month]
│   │           └── [day]/
│   │               ├── page.tsx  # /bazi/[year]/[month]/[day]
│   │               └── [hour]/
│   │                   └── page.tsx # /bazi/[year]/[month]/[day]/[hour]
│   ├── tiangan/[stem]/page.tsx
│   ├── dizhi/[branch]/page.tsx
│   ├── ganzhi/[ganzhi]/page.tsx
│   ├── shishen/[ten-god]/page.tsx
│   ├── wuxing/[element]/page.tsx
│   └── api/                      # API Routes (Node Runtime)
│       ├── bazi/
│       │   ├── calculate/route.ts
│       │   └── [chartId]/
│       │       ├── route.ts
│       │       ├── dayun/route.ts
│       │       ├── liunian/[year]/route.ts
│       │       └── analyze/route.ts
│       ├── encyclopedia/[type]/[key]/route.ts
│       ├── statements/route.ts
│       ├── rules/route.ts
│       ├── rules/match/route.ts
│       └── seo/[page]/route.ts
├── components/                   # shadcn/ui 组件 + 业务组件
│   ├── ui/                       # shadcn 生成的基础组件
│   ├── bazi/
│   │   ├── birth-form.tsx
│   │   ├── pillars-display.tsx
│   │   ├── wuxing-chart.tsx
│   │   ├── dayun-timeline.tsx
│   │   └── interactions-list.tsx
│   ├── encyclopedia/
│   └── layout/
├── lib/                          # 工具
│   ├── prisma.ts                 # Prisma client 单例
│   ├── redis.ts                  # KV/Redis 客户端
│   ├── ai-client.ts              # OpenAI 兼容客户端
│   ├── schemas/                  # Zod schemas
│   │   ├── bazi-input.ts
│   │   └── bazi-output.ts
│   ├── utils.ts
│   └── seo.ts                    # generateMetadata 工具
├── services/                     # 业务服务
│   ├── bazi-calc.service.ts      # 八字计算（封装 lunar-javascript）
│   ├── true-solar-time.ts        # 真太阳时校正
│   ├── interactions.ts          # 刑冲合害检测
│   ├── rule-engine.ts
│   ├── statement-engine.ts
│   ├── ai-explainer.ts
│   ├── knowledge.service.ts
│   └── seo.service.ts
├── engine/                       # 引擎核心（无业务依赖）
│   ├── lunar-adapter.ts         # lunar-javascript 适配层
│   ├── pillars.ts               # 四柱生成
│   ├── wuxing.ts                # 五行统计
│   ├── ten-gods.ts              # 十神计算
│   ├── dayun.ts                 # 大运计算
│   ├── liunian.ts               # 流年计算
│   ├── nanyin.ts                # 纳音
│   ├── shensha.ts               # 神煞
│   ├── pattern.ts               # 格局
│   ├── xiyong.ts                # 喜用神
│   └── types.ts                 # BaziJson 类型
├── rules/                        # 规则数据
│   ├── seed/
│   │   ├── career.json
│   │   ├── marriage.json
│   │   └── ...
│   └── importer.ts              # 从 CSV/JSON 导入
├── knowledge/                    # 断语与知识库数据
│   ├── statements/              # 移植自 ruanxiaoer888/bazi-engine
│   │   ├── career.csv
│   │   └── ...
│   ├── classics.json            # 古籍索引
│   └── nodes/                   # 知识节点 Markdown
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts                  # 种子脚本
├── prompts/                      # AI prompt 模板
│   ├── v1.0.0/
│   │   ├── system.md
│   │   └── user-template.md
│   └── registry.json
├── types/                        # 全局类型
│   ├── api.ts
│   └── bazi.ts
└── tests/
    ├── engine/                   # 引擎单元测试
    ├── rules/                    # 规则匹配测试
    ├── api/                      # API 集成测试
    └── e2e/                      # Playwright E2E
```

---

## 十、SEO 设计

### 10.1 generateMetadata 模式

每个页面用 Next.js `generateMetadata` + `generateStaticParams`：

```ts
// app/tiangan/[stem]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const node = await getKnowledgeNode('TIAN_GAN', params.stem);
  return {
    title: node.seoTitle,
    description: node.seoDescription,
    alternates: { canonical: `https://xxx.com/tiangan/${params.stem}` },
    openGraph: { title: node.seoTitle, description: node.seoDescription, type: 'article' },
  };
}
```

### 10.2 结构化数据 Schema.org

百科页用 `Article` + `DefinedTerm`；排盘页用 `Article` + `AboutPage`。

### 10.3 Sitemap

`app/sitemap.ts` 动态生成，包含：
- 静态首页
- 60 甲子 /bazi/[year]/...
- 10 天干 × 12 地支 × 60 干支 × 10 十神 × 5 五行 百科页

---

## 十一、实施阶段划分（确认设计后逐模块实现）

| 阶段 | 模块 | 关键文件 | 验证方法 |
|---|---|---|---|
| A | PostgreSQL + Prisma 初始化 | `prisma/schema.prisma` + `lib/prisma.ts` | `npx prisma migrate dev` + `prisma studio` 查看表 |
| B | 八字计算 Service | `services/bazi-calc.service.ts` + `engine/*.ts` | 用 1986-05-29 10:00 北京测试，预期 丙寅/癸巳/甲子/己巳 |
| C | BaziJson Schema + 校验 | `lib/schemas/bazi-output.ts` | Zod parse 引擎输出 |
| D | RuleEngine + DSL | `services/rule-engine.ts` + `rules/seed/*.json` | 注入测试 BaziJson，断言命中规则 |
| E | StatementEngine + 数据导入 | `services/statement-engine.ts` + `knowledge/statements/*` | 导入 1000 条，匹配测试 |
| F | API 路由 | `app/api/**/route.ts` | curl/Playwright 接口测试 |
| G | 首页 + 排盘页 | `app/page.tsx` + `app/bazi/**` | 浏览器手动 + E2E |
| H | 年月日时百科页 | `app/bazi/[year].../[hour]/page.tsx` | SSG 生成 + meta 检查 |
| I | 干支/十神/五行百科页 | `app/{tiangan,dizhi,ganzhi,shishen,wuxing}/...` | 同上 |
| J | SEO（meta + schema + sitemap） | `lib/seo.ts` + `app/sitemap.ts` | 用 Google Rich Results Test |
| K | AI 分析 + prompt 版本管理 | `services/ai-explainer.ts` + `prompts/**` | mock LLM + 真实调用 |

每完成一阶段交付：**代码 + 文件路径 + 安装命令 + 测试方法 + 测试数据 + 预期结果**。

---

## 十二、关键依赖（package.json 预览）

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "typescript": "^5.4.0",
    "tailwindcss": "^3.4.0",
    "@prisma/client": "^5.14.0",
    "@prisma/adapter-neon": "^5.14.0",
    "@neondatabase/serverless": "^0.9.0",
    "lunar-javascript": "^1.6.0",
    "zod": "^3.23.0",
    "openai": "^4.50.0",
    "shadcn-ui": "latest",
    "lodash.get": "^4.4.2",
    "date-fns": "^3.6.0",
    "next-themes": "^0.3.0"
  },
  "devDependencies": {
    "prisma": "^5.14.0",
    "vitest": "^1.6.0",
    "@playwright/test": "^1.44.0",
    "@types/node": "^20.12.0",
    "eslint": "^9.0.0"
  }
}
```

---

## 十三、验证方法（端到端）

1. **本地启动**：`docker-compose up postgres redis` → `pnpm dev`
2. **数据库迁移**：`npx prisma migrate dev --name init`
3. **种子数据**：`pnpm seed`（导入断语/规则/知识节点/百科）
4. **引擎测试**：`pnpm test engine` —— 用历史八字案例（已知四柱）验证
5. **API 测试**：`pnpm test api` —— Vitest 集成测试
6. **E2E**：`pnpm test:e2e` —— Playwright 模拟排盘全流程
7. **构建**：`pnpm build` + `pnpm preview` 验证 SSG 产出
8. **SEO 检查**：用 Google Rich Results Test 校验 Schema.org

### 关键测试数据（八字校验用）

| 出生时间（北京） | 性别 | 预期四柱 | 来源 |
|---|---|---|---|
| 1986-05-29 10:00 | 男 | 丙寅 癸巳 甲子 己巳 | lunar-javadoc |
| 1990-05-15 10:00 | 男 | 庚午 辛巳 庚辰 庚辰 | ruanxiaoer888 |
| 2006-01-28 23:50 | 男 | 乙酉 己丑 丁巳 壬子 | mymcp-fun 案例 |

---

## 十四、合规与免责

- 全站页脚固定免责声明：本系统提供中国传统文化学术研究内容，命理学说不具备科学验证性，所有内容不构成任何决策建议。
- 不承诺预测准确性。
- 断语必须标注古籍出处，未标注的断语不入库。
- AI 输出必须可追溯到 `prompt_version` + `input_hash`，可审计。
