// 用户操作手册生成器。
// 读取 docs/user-manual/.capture-manifest.json，按模块渲染 Markdown 手册。
// 幂等：重跑覆盖 Markdown 正文，不删除 images/。
//
// 运行：pnpm manual:gen（通常由 pnpm manual:build 自动串接）。

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const manualRoot = path.join(repoRoot, 'docs', 'user-manual');
const manifestPath = path.join(manualRoot, '.capture-manifest.json');
const errorLogPath = path.join(manualRoot, 'capture-errors.log');

// 模块元数据：标题、顺序、章节说明、每页主要操作列表（best-effort，用于无 POM 的静态页）。
const MODULE_META = {
  dashboard: {
    title: '仪表盘',
    order: 10,
    intro: '病理看板与个人工作台，聚合当日标本流转、诊断进度与异常指标。',
  },
  'm2-specimen-workflow': {
    title: 'M2 临床送检',
    order: 20,
    intro:
      '临床标本送检全链路：申请创建 → 标本登记 → 固定核对 → 转运交接 → 标本接收 → 追踪查询，含部分接收/拒收异常链。',
  },
  'm4-doctor-workflow': {
    title: 'M4 诊断管理',
    order: 30,
    intro:
      '诊断分配、诊断平台工作站、病理报告、报告追踪、病理医嘱执行、报告修订、会诊管理。',
  },
  'm5-operation-support': {
    title: 'M5 归档与借记 / 设备及试剂',
    order: 40,
    intro: '归档管理、借记管理、仪器设备、试剂耗材、医疗废物管理。',
  },
  'm6-statistics': {
    title: 'M6 数据统计与分析',
    order: 50,
    intro: '统计仪表盘、质控指标、管理指标、统计报表工作台。',
  },
  'm1-system': {
    title: 'M1 系统管理',
    order: 60,
    intro: '用户、角色、科室/部位字典、医嘱字典/收费/套餐、描写模板、取材规范、系统配置、编号规则、日志。',
  },
};

// 静态页主要操作清单（与 capture-handbook.spec.ts STATIC_PAGES 对应，供手册补全操作说明）。
const STATIC_OPERATIONS = {
  dashboard: {
    '/analytics': '查看当日标本流转、诊断进度与异常指标；切换看板筛选条件。',
    '/workspace': '查看个人岗位待办，点击快捷入口进入对应工作站。',
  },
  'm4-doctor-workflow': {
    '/doctor-workflow/assignment':
      '查询待分派任务；选择医生；勾选任务后「初步分片」或「签发分片」。',
    '/doctor-workflow/workbench':
      '查询队列并选择任务；编辑报告；「保存/初步/复核/签发」并选择发放模式；采图、查看医嘱/会诊/历史病理。',
    '/doctor-workflow/report':
      '按病例/病理号查询报告；对已审核报告「驳回」；对已签发报告「发布」；批量打印/发放/回收正式版本。',
    '/doctor-workflow/tracking':
      '查询病例；查看全局生命周期时间线与对象追踪明细；跳转诊断工作台/报告/医嘱。',
    '/doctor-workflow/medical-orders':
      '按病理号/状态查询医嘱；「确认」「打印玻片」「出片」「取消」。',
    '/doctor-workflow/revision':
      '查询病例；对当前报告「发起修订申请」；对修订申请「审批通过/驳回」。',
    '/doctor-workflow/consultation':
      '查询病例；「发起会诊」添加参与人；「录入参与人意见」；「完成会诊」。',
  },
  'm5-operation-support': {
    '/operation-support/archive': '查询归档台账；登记/调整归档位置；查看归档明细。',
    '/operation-support/borrow': '登记借出；办理归还；查看逾期提醒。',
    '/operation-resources/equipment': '维护设备档案；登记保养记录；查看设备预警。',
    '/operation-resources/reagents': '维护试剂耗材基础信息；登记库存批次；查看预警。',
    '/operation-resources/medical-waste': '打印废物袋标签；登记交接记录。',
  },
  'm6-statistics': {
    '/m6/dashboard': '切换时间维度查看质控、运营与工作量核心指标。',
    '/m6/quality-indicators': '查看三甲质控、质量安全控制指标与数据源状态。',
    '/m6/management-indicators': '查看业务量、收费、物资/试剂预警与人员工作量。',
    '/m6/custom-analysis':
      '选择分析维度（工作量/质控/冰冻/报告更改/不合格标本）；查询并导出报表。',
  },
  'm1-system': {
    '/system/users': '新增/编辑用户；启停账号；绑定岗位。',
    '/system/roles': '新增/编辑角色；分配权限码。',
    '/system/departments': '维护科室组织架构树。',
    '/system/body-parts': '维护取材部位分类字典。',
    '/system/medical-order-dicts': '维护医嘱项目基础字典。',
    '/system/medical-order-charges': '维护收费项目与价格。',
    '/system/medical-order-packages': '维护常用医嘱套餐组合。',
    '/system/sampling-templates': '维护大体/镜下/诊断描写模板。',
    '/system/sampling-guidelines': '维护取材标准操作规范。',
    '/system/configs': '维护运行参数与开关。',
    '/system/numbering-rules': '配置病理号/标本号等编号规则。',
    '/system/logs': '按条件查询操作日志。',
  },
};

function readManifest() {
  if (!fs.existsSync(manifestPath)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(manifestPath, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function hasErrorLog() {
  return fs.existsSync(errorLogPath) && fs.readFileSync(errorLogPath, 'utf8').trim().length > 0;
}

function imageMarkdown(image) {
  if (!image) {
    return '> （截图捕获失败，详见 `capture-errors.log`）';
  }
  return `![${image}](${image})`;
}

function groupByModule(steps) {
  const groups = new Map();
  for (const step of steps) {
    if (!groups.has(step.module)) {
      groups.set(step.module, []);
    }
    groups.get(step.module).push(step);
  }
  for (const [, list] of groups) {
    list.sort((a, b) => a.order - b.order);
  }
  return groups;
}

function renderM2Module(steps) {
  const lines = [];
  lines.push(`# M2 临床送检`);
  lines.push('');
  lines.push(
    '临床标本送检全链路：申请创建 → 标本登记 → 固定核对 → 转运交接 → 标本接收 → 追踪查询，含部分接收/拒收异常链。',
  );
  lines.push('');

  // happy-path 步骤名为前 13 个（按捕获顺序），abnormal 为后 2 个。
  const happy = steps.filter((s) => !s.name.startsWith('abnormal-'));
  const abnormal = steps.filter((s) => s.name.startsWith('abnormal-'));

  if (happy.length === 0) {
    lines.push('> 本模块截图未捕获。请先运行 `pnpm manual:capture`（需本地联调环境在线）。');
    lines.push('');
  } else {
    lines.push('## 主链路（正常接收）');
    lines.push('');
    let n = 1;
    for (const step of happy) {
      lines.push(`### ${n}. ${step.caption}`);
      lines.push('');
      if (step.expected) {
        lines.push(`**预期结果**：${step.expected}`);
        lines.push('');
      }
      lines.push(imageMarkdown(step.image));
      lines.push('');
      n += 1;
    }
  }

  if (abnormal.length > 0) {
    lines.push('## 异常链（部分接收 / 拒收）');
    lines.push('');
    let n = 1;
    for (const step of abnormal) {
      lines.push(`### ${n}. ${step.caption}`);
      lines.push('');
      if (step.expected) {
        lines.push(`**预期结果**：${step.expected}`);
        lines.push('');
      }
      lines.push(imageMarkdown(step.image));
      lines.push('');
      n += 1;
    }
  }

  return lines.join('\n');
}

function renderStaticModule(moduleKey, steps) {
  const meta = MODULE_META[moduleKey] ?? { title: moduleKey, intro: '' };
  const lines = [];
  lines.push(`# ${meta.title}`);
  lines.push('');
  if (meta.intro) {
    lines.push(meta.intro);
    lines.push('');
  }
  const operations = STATIC_OPERATIONS[moduleKey] ?? {};

  if (steps.length === 0) {
    lines.push('> 本模块截图未捕获。请先运行 `pnpm manual:capture`（需本地联调环境在线）。');
    lines.push('');
    // 仍按已知路由列出操作说明骨架。
    for (const [route, op] of Object.entries(operations)) {
      lines.push(`## ${route}`);
      lines.push('');
      lines.push(`- 主要操作：${op}`);
      lines.push('');
    }
    return lines.join('\n');
  }

  let n = 1;
  for (const step of steps) {
    const route = `/${step.name.replaceAll('_', '/')}`;
    const op = operations[route];
    lines.push(`## ${n}. ${step.caption}`);
    lines.push('');
    if (op) {
      lines.push(`- **主要操作**：${op}`);
      lines.push('');
    }
    if (step.expected) {
      lines.push(`- **预期结果**：${step.expected}`);
      lines.push('');
    }
    lines.push(imageMarkdown(step.image));
    lines.push('');
    n += 1;
  }

  return lines.join('\n');
}

function renderReadme(moduleKeys) {
  const lines = [];
  lines.push('# 用户操作手册');
  lines.push('');
  lines.push(
    '本手册由 Playwright 驱动 `apps/web-ele` 真实页面捕获截图后自动生成，覆盖病理系统全模块。',
  );
  lines.push('');
  lines.push('## 生成方式');
  lines.push('');
  lines.push('```bash');
  lines.push('# 1. 启动本地联调环境（web-ele + auth-center + bl-center）');
  lines.push('#    pnpm dev:ele');
  lines.push('#    ./scripts/dev/run-auth-center-dev.cmd');
  lines.push('#    ./scripts/dev/run-bl-center-dev.cmd');
  lines.push('');
  lines.push('# 2. 生成各岗位登录态（首次或 tests/e2e/.auth 过期时）');
  lines.push('#    pnpm test:e2e 会自动跑 auth.setup 生成 .auth/*.json；');
  lines.push('#    也可单独：pnpm exec playwright test -c playwright.config.ts --project=auth-setup');
  lines.push('');
  lines.push('# 3. 捕获截图 + 生成手册');
  lines.push('pnpm manual:build');
  lines.push('```');
  lines.push('');
  lines.push('也可分步执行：`pnpm manual:capture`（仅捕获）与 `pnpm manual:gen`（仅渲染 Markdown）。');
  lines.push('');
  lines.push('> M2 临床送检走真实业务链路（含真实数据流转）；其余模块为登录后静态页截图，画面可能为空态。');
  lines.push('');
  lines.push('## 模块索引');
  lines.push('');

  for (const key of moduleKeys) {
    const meta = MODULE_META[key] ?? { title: key };
    const file = `${key}.md`;
    lines.push(`- [${meta.title}](${file})${meta.intro ? `：${meta.intro}` : ''}`);
  }
  lines.push('');

  if (hasErrorLog()) {
    lines.push('> ⚠️ 本次捕获存在失败步骤，详见 [capture-errors.log](./capture-errors.log)。');
    lines.push('');
  }

  lines.push('## 维护约定');
  lines.push('');
  lines.push('- 截图产物位于 `images/<module>/`（已 gitignore，可重新生成），手册正文位于各 `<module>.md`（入库）。');
  lines.push('- 重跑 `pnpm manual:build` 会覆盖 Markdown 正文与截图，不保留历史；如需留存请手动归档。');
  lines.push('- 捕获脚本与静态页清单维护在 `tests/e2e/manual/capture-handbook.spec.ts`；模块元数据与操作说明维护在 `scripts/generate-user-manual.mjs`。');
  lines.push('- 新增模块页面时，同步更新上述两处的 `STATIC_PAGES` 与 `MODULE_META` / `STATIC_OPERATIONS`。');
  lines.push('');
  lines.push('## 与其他文档的关系');
  lines.push('');
  lines.push('- 联调运行前置与 E2E 约定见 [tests/e2e/README.md](../../tests/e2e/README.md)。');
  lines.push('- 现场演练岗位 SOP 见 [docs/acceptance/phase1_5/](../acceptance/phase1_5/README.md)。');
  lines.push('- 业务流程总览见 [docs/acceptance/M1_M6_BUSINESS_PROCESS_GUIDE.html](../acceptance/M1_M6_BUSINESS_PROCESS_GUIDE.html)。');

  return lines.join('\n');
}

function main() {
  const steps = readManifest();
  const groups = groupByModule(steps);

  // 合并：manifest 中出现的模块 + 元数据中定义的模块（保证未捕获模块也生成骨架）。
  const moduleKeys = [
    ...new Set([...Object.keys(MODULE_META), ...groups.keys()]),
  ].sort((a, b) => {
    const oa = MODULE_META[a]?.order ?? 999;
    const ob = MODULE_META[b]?.order ?? 999;
    return oa - ob;
  });

  fs.mkdirSync(manualRoot, { recursive: true });

  const readme = renderReadme(moduleKeys);
  fs.writeFileSync(path.join(manualRoot, 'README.md'), `${readme}\n`, 'utf8');

  for (const key of moduleKeys) {
    const moduleSteps = groups.get(key) ?? [];
    const content =
      key === 'm2-specimen-workflow'
        ? renderM2Module(moduleSteps)
        : renderStaticModule(key, moduleSteps);
    fs.writeFileSync(path.join(manualRoot, `${key}.md`), `${content}\n`, 'utf8');
  }

  const captured = steps.filter((s) => s.image).length;
  const total = steps.length;
  process.stdout.write(
    `用户操作手册已生成：${moduleKeys.length} 个模块，截图 ${captured}/${total} 步成功。` +
      `输出目录：${path.relative(repoRoot, manualRoot)}\n`,
  );
}

main();
