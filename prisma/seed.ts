/**
 * Prisma Seed 脚本
 *
 * 执行: npm run prisma:seed (即 tsx prisma/seed.ts)
 *
 * 导入顺序:
 * 1. AIPromptVersion (K 阶段需要)
 * 2. 古籍 (Classic) - 断语依赖
 * 3. 规则 (Rule) - 从 rules/seed/*.json
 * 4. 断语 (Statement) - 从 knowledge/statements/seed.json, 含 RuleStatement 关联
 */
import { PrismaClient } from '@prisma/client';
import { importRules } from '@/rules/importer';
import { importClassics, importStatements } from '@/knowledge/importer';
import { PROMPT_TEMPLATE } from '@/prompts/v1.0.0';

const prisma = new PrismaClient();

async function main() {
  console.log('=== 开始种子数据导入 ===\n');

  // 1. AI Prompt 版本 (使用 prompts/ 模块集中管理)
  const prompt = await prisma.aIPromptVersion.upsert({
    where: { version: PROMPT_TEMPLATE.version },
    create: {
      version: PROMPT_TEMPLATE.version,
      name: PROMPT_TEMPLATE.name,
      template: PROMPT_TEMPLATE.userTemplate,
      variables: PROMPT_TEMPLATE.variables,
      active: true,
      description: PROMPT_TEMPLATE.description,
    },
    update: {
      // 更新模板内容（保留 active 状态）
      template: PROMPT_TEMPLATE.userTemplate,
      variables: PROMPT_TEMPLATE.variables,
      description: PROMPT_TEMPLATE.description,
    },
  });
  console.log(`1. AIPromptVersion: ${prompt.version} (${prompt.name})`);
  console.log(`   系统提示长度: ${PROMPT_TEMPLATE.system.length} 字`);
  console.log(`   用户模板长度: ${PROMPT_TEMPLATE.userTemplate.length} 字`);

  // 2. 古籍
  await importClassics(prisma);

  // 3. 规则
  await importRules(prisma);

  // 4. 断语 + RuleStatement 关联
  await importStatements(prisma, { withRuleAssoc: true });

  console.log('\n=== 种子数据导入完成 ===');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error('Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
