// 用户操作手册生成器。
// 读取 staging 下的截图 manifest，按共享手册元数据渲染 Markdown 手册，
// 验证通过后再整体同步到 docs/user-manual/，避免留下半生成状态。
//
// 运行：pnpm manual:gen（通常由 pnpm manual:build 自动串接）。

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const manualRoot = path.join(repoRoot, 'docs', 'user-manual');
const stageRoot = path.join(manualRoot, '.generated');
const tempRenderRoot = path.join(
  repoRoot,
  '.codex-temp',
  'user-manual-rendered',
);

const defaultManualSpecCandidates = [
  path.join(repoRoot, 'tests', 'e2e', 'manual', 'manual-spec.mjs'),
  path.join(repoRoot, 'tests', 'e2e', 'manual', 'manual-spec.js'),
];

const STEP_PLACEHOLDERS = {
  auth_failed:
    '> 本节因认证失效未生成截图；请先刷新登录态后重试，详见 `capture-errors.log`。',
  capture_failed:
    '> 本节截图捕获失败，详见 `capture-errors.log` 排查失败原因。',
  missing: '> 本节尚未捕获截图；请先运行 `pnpm manual:capture` 补齐。',
};

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function safeReadFile(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
}

function readManifest(manifestPath) {
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

function hasErrorLog(errorLogPath) {
  return safeReadFile(errorLogPath).trim().length > 0;
}

function syncDirectory(sourceDir, targetDir) {
  ensureDir(targetDir);
  fs.rmSync(targetDir, { force: true, recursive: true });
  ensureDir(targetDir);
  fs.cpSync(sourceDir, targetDir, { recursive: true });
}

function firstNonEmptyString(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

function normalizeStringList(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) {
    return [value.trim()];
  }
  return [];
}

function uniqueStrings(values) {
  return [...new Set(values.filter(Boolean))];
}

function imageMarkdown(alt, image) {
  return `![${alt}](${image})`;
}

function resolveStepStatus(step) {
  if (step.status === 'auth_failed') {
    return 'auth_failed';
  }
  if (step.status === 'capture_failed') {
    return 'capture_failed';
  }
  if (step.status === 'missing') {
    return 'missing';
  }
  if (typeof step.image === 'string' && step.image.trim()) {
    return 'captured';
  }
  return 'missing';
}

function normalizeManifestStep(step, index) {
  const order = Number.isFinite(step.order) ? step.order : index + 1;
  const moduleKey = firstNonEmptyString(step.module, step.moduleKey);
  const sectionId = firstNonEmptyString(step.sectionId, step.sectionKey);
  const subsectionId = firstNonEmptyString(
    step.subsectionId,
    step.subsectionKey,
    step.name,
  );
  const name = firstNonEmptyString(step.name, step.subsectionId);
  const image = firstNonEmptyString(step.image);

  return {
    caption: firstNonEmptyString(step.caption, step.title, name, '截图'),
    expected: firstNonEmptyString(step.expected),
    image,
    module: moduleKey,
    name,
    order,
    path: firstNonEmptyString(step.path),
    role: firstNonEmptyString(step.role),
    sectionId,
    status: resolveStepStatus(step),
    subsectionId,
    warning: firstNonEmptyString(step.warning),
  };
}

function normalizeManifest(steps) {
  return steps
    .map((step, index) => normalizeManifestStep(step, index))
    .filter((step) => step.module)
    .toSorted((left, right) => left.order - right.order);
}

function groupByModule(steps) {
  const groups = new Map();
  for (const step of steps) {
    if (!groups.has(step.module)) {
      groups.set(step.module, []);
    }
    groups.get(step.module).push(step);
  }
  return groups;
}

async function loadManualSpecModule(candidatePaths = defaultManualSpecCandidates) {
  for (const candidatePath of candidatePaths) {
    if (!fs.existsSync(candidatePath)) {
      continue;
    }
    return import(pathToFileURL(candidatePath).href);
  }

  throw new Error(
    '未找到用户手册 spec 导出，请确认 tests/e2e/manual/manual-spec.mjs 已生成。',
  );
}

function getExportedModuleSpecs(specModule) {
  const candidates = [
    specModule?.MANUAL_HANDBOOK_SPEC?.modules,
    specModule?.MANUAL_SPEC?.modules,
    specModule?.MANUAL_RENDER_SPEC?.modules,
    specModule?.MANUAL_RENDER_SPEC,
    specModule?.MANUAL_MODULE_SPECS,
    specModule?.default?.modules,
    specModule?.default,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
}

function createModuleMeta(moduleSpecs) {
  return Object.fromEntries(
    moduleSpecs.map((moduleSpec) => [moduleSpec.key, moduleSpec]),
  );
}

function hasStructuredSections(moduleSpec) {
  return (
    Array.isArray(moduleSpec.sections) && moduleSpec.sections.length > 0
  ) || (
    Array.isArray(moduleSpec.chapters) && moduleSpec.chapters.length > 0
  );
}

function normalizeSteps(value) {
  if (Array.isArray(value)) {
    return value
      .map((step) => (typeof step === 'string' ? step.trim() : ''))
      .filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) {
    return [value.trim()];
  }
  return [];
}

function normalizeSubsection(rawSubsection, index, section) {
  const subsectionId = firstNonEmptyString(
    rawSubsection.subsectionId,
    rawSubsection.id,
    rawSubsection.name,
    `${section.id}-subsection-${index + 1}`,
  );
  const title = firstNonEmptyString(
    rawSubsection.title,
    rawSubsection.name,
    rawSubsection.caption,
    `操作节 ${index + 1}`,
  );
  const captureKeys = uniqueStrings([
    subsectionId,
    rawSubsection.name,
    ...normalizeStringList(rawSubsection.captureNames),
    ...normalizeStringList(rawSubsection.screenshotNames),
    ...normalizeStringList(rawSubsection.names),
  ]);

  return {
    captureKeys,
    expected: firstNonEmptyString(
      rawSubsection.expected,
      rawSubsection.result,
    ),
    operations: normalizeSteps(rawSubsection.operations),
    path: firstNonEmptyString(
      rawSubsection.path,
      rawSubsection.routePath,
      section.path,
    ),
    pathLabel: firstNonEmptyString(rawSubsection.pathLabel),
    role: firstNonEmptyString(rawSubsection.role, rawSubsection.actor, section.role),
    roleNote: firstNonEmptyString(rawSubsection.roleNote),
    steps: normalizeSteps(rawSubsection.steps ?? rawSubsection.operations),
    subsectionId,
    summary: firstNonEmptyString(
      rawSubsection.summary,
      rawSubsection.caption,
      rawSubsection.description,
    ),
    title,
  };
}

function normalizeStructuredSection(rawSection, index) {
  const sectionId = firstNonEmptyString(
    rawSection.sectionId,
    rawSection.id,
    rawSection.name,
    `section-${index + 1}`,
  );
  const title = firstNonEmptyString(
    rawSection.title,
    rawSection.name,
    rawSection.caption,
    `章节 ${index + 1}`,
  );
  const rawSubsections = Array.isArray(rawSection.subsections)
    ? rawSection.subsections
    : [];

  const subsections = (
    rawSubsections.length > 0 ? rawSubsections : [rawSection]
  ).map((rawSubsection, subsectionIndex) =>
    normalizeSubsection(rawSubsection, subsectionIndex, {
      id: sectionId,
      path: firstNonEmptyString(rawSection.path, rawSubsection.path),
      role: firstNonEmptyString(rawSection.role, rawSubsection.role),
    }),
  );

  return {
    matchKeys: uniqueStrings([sectionId, rawSection.name]),
    sectionId,
    subsections,
    summary: firstNonEmptyString(
      rawSection.summary,
      rawSection.caption,
      rawSection.description,
    ),
    title,
  };
}

function normalizeLegacyStaticSections(staticPages = []) {
  const groupedSections = new Map();

  for (const [pageIndex, page] of staticPages.entries()) {
    const sectionId = firstNonEmptyString(
      page.sectionId,
      page.groupId,
      page.name,
      `section-${pageIndex + 1}`,
    );
    const existingSection = groupedSections.get(sectionId);

    const section =
      existingSection ??
      {
        matchKeys: uniqueStrings([sectionId, page.name]),
        sectionId,
        subsections: [],
        summary: firstNonEmptyString(
          page.sectionSummary,
          page.caption,
          page.operations,
        ),
        title: firstNonEmptyString(
          page.sectionTitle,
          page.title,
          page.caption,
          `章节 ${groupedSections.size + 1}`,
        ),
      };

    section.subsections.push(
      normalizeSubsection(page, section.subsections.length, {
        id: sectionId,
        path: firstNonEmptyString(page.path),
        role: firstNonEmptyString(page.role),
      }),
    );

    if (!existingSection) {
      groupedSections.set(sectionId, section);
    }
  }

  return [...groupedSections.values()];
}

function normalizeModuleSpec(rawModuleSpec, index) {
  const key = firstNonEmptyString(rawModuleSpec.key);
  if (!key) {
    return undefined;
  }

  const structuredSections = hasStructuredSections(rawModuleSpec)
    ? (rawModuleSpec.sections ?? rawModuleSpec.chapters).map(
        normalizeStructuredSection,
      )
    : normalizeLegacyStaticSections(rawModuleSpec.staticPages ?? []);

  return {
    intro: firstNonEmptyString(rawModuleSpec.intro, rawModuleSpec.description),
    key,
    order: Number.isFinite(rawModuleSpec.order)
      ? rawModuleSpec.order
      : (index + 1) * 10,
    processSummary: firstNonEmptyString(
      rawModuleSpec.processSummary,
      rawModuleSpec.flowSummary,
      rawModuleSpec.process,
    ),
    renderMode: firstNonEmptyString(rawModuleSpec.renderMode),
    sections: structuredSections,
    title: firstNonEmptyString(rawModuleSpec.title, key, '未命名模块'),
  };
}

function normalizeModuleSpecs(moduleSpecs) {
  return moduleSpecs
    .map(normalizeModuleSpec)
    .filter(Boolean)
    .toSorted((left, right) => left.order - right.order);
}

async function resolveManualSpecs(options = {}) {
  const moduleSpecs = Array.isArray(options.moduleSpecs)
    ? options.moduleSpecs
    : getExportedModuleSpecs(
        await loadManualSpecModule(options.manualSpecCandidates),
      );

  const normalizedSpecs = normalizeModuleSpecs(moduleSpecs);
  return {
    moduleMeta: createModuleMeta(normalizedSpecs),
    moduleSpecs: normalizedSpecs,
  };
}

function renderModuleHeader(lines, spec) {
  lines.push(`# ${spec.title}`, '');
  if (spec.intro) {
    lines.push(spec.intro, '');
  }
  if (spec.processSummary) {
    lines.push(`流程：${spec.processSummary}`, '');
  }
}

function renderPlaceholderLines(lines, status) {
  lines.push(STEP_PLACEHOLDERS[status] ?? STEP_PLACEHOLDERS.missing, '');
}

function matchesSubsection(step, section, subsection) {
  if (!step) {
    return false;
  }

  const stepKeys = uniqueStrings([step.subsectionId, step.name]);
  if (
    stepKeys.length > 0 &&
    subsection.captureKeys.some((captureKey) => stepKeys.includes(captureKey))
  ) {
    return true;
  }

  if (
    step.sectionId &&
    section.matchKeys.includes(step.sectionId) &&
    stepKeys.length === 0 &&
    section.subsections.length === 1
  ) {
    return true;
  }

  return false;
}

function getSubsectionSteps(moduleSteps, section, subsection) {
  return moduleSteps.filter((step) => matchesSubsection(step, section, subsection));
}

function renderScreenshotGroup(lines, steps) {
  const capturedSteps = steps.filter((step) => step.status === 'captured' && step.image);
  const hasAuthFailure = steps.some((step) => step.status === 'auth_failed');
  const hasCaptureFailure = steps.some((step) => step.status === 'capture_failed');
  const hasExplicitMissing = steps.some((step) => step.status === 'missing');

  lines.push('截图组：', '');

  if (
    capturedSteps.length === 0 &&
    !hasAuthFailure &&
    !hasCaptureFailure &&
    !hasExplicitMissing
  ) {
    renderPlaceholderLines(lines, 'missing');
    return;
  }

  for (const step of capturedSteps) {
    lines.push(imageMarkdown(step.caption, step.image), '');
  }

  if (hasAuthFailure) {
    renderPlaceholderLines(lines, 'auth_failed');
  }
  if (hasCaptureFailure) {
    renderPlaceholderLines(lines, 'capture_failed');
  }
  if (
    capturedSteps.length === 0 &&
    !hasAuthFailure &&
    !hasCaptureFailure &&
    hasExplicitMissing
  ) {
    renderPlaceholderLines(lines, 'missing');
  }
}

function renderOperationSteps(lines, steps) {
  if (steps.length === 0) {
    return;
  }

  lines.push('操作步骤：');
  for (const [index, step] of steps.entries()) {
    lines.push(`${index + 1}. ${step}`);
  }
  lines.push('');
}

function renderOptionalOperations(lines, operations) {
  if (operations.length === 0) {
    return;
  }

  lines.push(`可选操作：${operations.join('；')}`, '');
}

function renderStaticSubsection(lines, sectionIndex, subsectionIndex, subsection, steps) {
  lines.push(`#### ${sectionIndex + 1}.${subsectionIndex + 1} ${subsection.title}`, '');

  if (subsection.summary) {
    lines.push(subsection.summary, '');
  }
  if (subsection.pathLabel) {
    lines.push(`菜单路径：${subsection.pathLabel}`, '');
  }
  if (subsection.path) {
    lines.push(`页面地址：\`${subsection.path}\``, '');
  }
  if (subsection.role) {
    lines.push(`适用角色：\`${subsection.role}\``, '');
  }
  if (subsection.roleNote) {
    lines.push(`角色说明：${subsection.roleNote}`, '');
  }

  renderOperationSteps(lines, subsection.steps);
  renderOptionalOperations(lines, subsection.operations ?? []);

  if (subsection.expected) {
    lines.push(`预期结果：${subsection.expected}`, '');
  }

  renderScreenshotGroup(lines, steps);
}

function renderStaticSection(lines, sectionIndex, section, moduleSteps) {
  lines.push(`### ${sectionIndex + 1}.${section.title}`, '');
  if (section.summary) {
    lines.push(section.summary, '');
  }

  for (const [subsectionIndex, subsection] of section.subsections.entries()) {
    const subsectionSteps = getSubsectionSteps(moduleSteps, section, subsection);
    renderStaticSubsection(
      lines,
      sectionIndex,
      subsectionIndex,
      subsection,
      subsectionSteps,
    );
  }
}

function renderStaticModule(spec, steps) {
  const lines = [];
  renderModuleHeader(lines, spec);

  if (spec.sections.length === 0) {
    renderPlaceholderLines(lines, 'missing');
    return lines.join('\n');
  }

  for (const [sectionIndex, section] of spec.sections.entries()) {
    renderStaticSection(lines, sectionIndex, section, steps);
  }

  return lines.join('\n');
}

function renderM2Step(lines, index, step) {
  lines.push(`### ${index}.${step.caption}`, '');
  if (step.path) {
    lines.push(`页面路径：\`${step.path}\``, '');
  }
  if (step.role) {
    lines.push(`适用角色：\`${step.role}\``, '');
  }
  if (step.expected) {
    lines.push(`预期结果：${step.expected}`, '');
  }

  if (step.status === 'captured' && step.image) {
    lines.push(imageMarkdown(step.caption, step.image), '');
    return;
  }

  renderPlaceholderLines(lines, step.status);
}

function renderM2Group(lines, title, steps) {
  if (steps.length === 0) {
    return;
  }

  lines.push(`## ${title}`, '');
  for (const [index, step] of steps.entries()) {
    renderM2Step(lines, index + 1, step);
  }
}

function renderM2Module(spec, steps) {
  const lines = [];
  renderModuleHeader(lines, spec);

  if (steps.length === 0) {
    renderPlaceholderLines(lines, 'missing');
    return lines.join('\n');
  }

  const happyPathSteps = steps.filter((step) => !step.name?.startsWith('abnormal-'));
  const abnormalSteps = steps.filter((step) => step.name?.startsWith('abnormal-'));

  renderM2Group(lines, '主链路（正常接收）', happyPathSteps);
  renderM2Group(lines, '异常链（部分接收 / 拒收）', abnormalSteps);

  return lines.join('\n');
}

function shouldUseLegacyM2Renderer(spec) {
  return spec.key === 'm2-specimen-workflow' && spec.sections.length === 0;
}

function renderModule(spec, moduleSteps) {
  if (shouldUseLegacyM2Renderer(spec) || spec.renderMode === 'legacy-m2') {
    return renderM2Module(spec, moduleSteps);
  }
  return renderStaticModule(spec, moduleSteps);
}

function renderReadme(moduleSpecs, hasErrors) {
  const lines = [
    '# 用户操作手册',
    '',
    '本手册由 Playwright 驱动 `apps/web-ele` 真实页面捕获截图后自动生成，按模块 SOP 结构输出页面入口、关键操作与截图组。',
    '',
    '## 生成方式',
    '',
    '```bash',
    '# 1. 启动本地联调环境（web-ele + auth-center + bl-center）',
    '#    pnpm dev:ele',
    '#    ./scripts/dev/run-auth-center-dev.cmd',
    '#    ./scripts/dev/run-bl-center-dev.cmd',
    '',
    '# 2. 生成各岗位登录态（首次或 tests/e2e/.auth 过期时）',
    '#    pnpm test:e2e 会自动跑 auth.setup 生成 .auth/*.json；',
    '#    也可单独：pnpm exec playwright test -c playwright.config.ts --project=auth-setup',
    '',
    '# 3. 捕获截图 + 生成手册',
    'pnpm manual:build',
    '```',
    '',
    '也可分步执行：`pnpm manual:capture`（仅捕获）与 `pnpm manual:gen`（仅渲染 Markdown）。',
    '',
    '## 认证刷新',
    '',
    '- 默认走 `api-then-ui`：先尝试 API 登录态，若检测到登录页/令牌过期/滑块页，再自动切换到 UI 滑块登录兜底。',
    '- 可单独刷新登录态：`pnpm exec playwright test -c playwright.config.ts --project=auth-setup`。',
    '- 如发现 `tests/e2e/.auth/*.json` 过期、总是被重定向回登录页，先重新执行 `auth-setup`；必要时删除旧 `.auth/*.json` 后再刷新。',
    '- 如需强制回归真实登录页与滑块链路，可设置 `E2E_AUTH_STRATEGY=ui`，例如 `cross-env E2E_AUTH_STRATEGY=ui pnpm manual:capture`。',
    '',
    '## 产物与排障',
    '',
    '- `pnpm manual:capture`：更新 `docs/user-manual/.generated/.capture-manifest.json`、`docs/user-manual/.generated/images/` 与 `docs/user-manual/.generated/capture-errors.log`，不改 Markdown 正文。',
    '- `pnpm manual:gen`：读取 `.generated/` 中间产物，生成/覆盖 `docs/user-manual/README.md` 与各模块 `<module>.md`；即使模块未捕获，也会输出 SOP 骨架页。',
    '- `pnpm manual:build`：串行执行 `manual:capture` + `manual:gen`，用于完整重建手册。',
    '- 排障优先看 `docs/user-manual/capture-errors.log`，再看 `test-results/`、`playwright-report/` 与 `.logs/frontend.log` / `.logs/backend.log`。若模块页只出现占位文案，先确认登录态、页面权限与捕获步骤是否成功写入 manifest。',
    '',
    '> M2 临床送检可继续沿用真实业务链路截图；静态模块统一按“模块 → 一级章节 → 二级操作节 → 截图组”渲染。',
    '',
    '## 模块索引',
    '',
  ];

  for (const spec of moduleSpecs) {
    const detailParts = [];
    if (spec.intro) {
      detailParts.push(spec.intro);
    }
    if (spec.processSummary) {
      detailParts.push(`流程：${spec.processSummary}`);
    }
    lines.push(
      `- [${spec.title}](${spec.key}.md)${detailParts.length > 0 ? `：${detailParts.join(' ')}` : ''}`,
    );
  }
  lines.push('');

  if (hasErrors) {
    lines.push(
      '> ⚠️ 本次捕获存在失败步骤，详见 [capture-errors.log](./capture-errors.log)。',
      '',
    );
  }

  lines.push(
    '## 维护约定',
    '',
    '- 截图产物位于 `images/<module>/`（已 gitignore，可重新生成），手册正文位于各 `<module>.md`（入库）。',
    '- `pnpm manual:capture` 先写入 `docs/user-manual/.generated/`，`pnpm manual:gen` 验证并同步到正式目录，避免留下半生成状态。',
    '- 手册元数据单一来源位于 `tests/e2e/manual/manual-spec.mjs`；新增模块页面时优先更新这里，再补必要 POM/捕获逻辑。',
    '- `capture-handbook.spec.ts` 负责截图捕获，`generate-user-manual.mjs` 仅负责渲染与同步。',
    '- 新增 manifest 字段时优先保持向后兼容：即使旧数据只有 `caption/name/order/image`，生成器也应继续输出手册；失败状态需通过节级占位与 `capture-errors.log` 暴露。',
    '',
    '## 与其他文档的关系',
    '',
    '- 联调运行前置与 E2E 约定见 [tests/e2e/README.md](../../tests/e2e/README.md)。',
    '- 现场演练岗位 SOP 见 [docs/acceptance/phase1_5/](../acceptance/phase1_5/README.md)。',
    '- 业务流程总览见 [docs/acceptance/M1_M6_BUSINESS_PROCESS_GUIDE.html](../acceptance/M1_M6_BUSINESS_PROCESS_GUIDE.html)。',
  );

  return lines.join('\n');
}

export async function generateUserManual(options = {}) {
  const targetManualRoot = options.manualRoot ?? manualRoot;
  const sourceStageRoot = options.stageRoot ?? stageRoot;
  const renderRoot = options.renderRoot ?? tempRenderRoot;
  const manifestPath = path.join(sourceStageRoot, '.capture-manifest.json');
  const errorLogPath = path.join(sourceStageRoot, 'capture-errors.log');
  const manifestSteps = normalizeManifest(readManifest(manifestPath));
  const groups = groupByModule(manifestSteps);
  const { moduleMeta, moduleSpecs } = await resolveManualSpecs(options);

  fs.rmSync(renderRoot, { force: true, recursive: true });
  ensureDir(renderRoot);

  const readme = renderReadme(moduleSpecs, hasErrorLog(errorLogPath));
  fs.writeFileSync(path.join(renderRoot, 'README.md'), `${readme}\n`, 'utf8');

  for (const spec of moduleSpecs) {
    const moduleSteps = groups.get(spec.key) ?? [];
    const content = renderModule(spec, moduleSteps);
    fs.writeFileSync(
      path.join(renderRoot, `${spec.key}.md`),
      `${content}\n`,
      'utf8',
    );
  }

  if (fs.existsSync(errorLogPath)) {
    fs.copyFileSync(errorLogPath, path.join(renderRoot, 'capture-errors.log'));
  }

  const stageImagesRoot = path.join(sourceStageRoot, 'images');
  if (fs.existsSync(stageImagesRoot)) {
    fs.cpSync(stageImagesRoot, path.join(renderRoot, 'images'), {
      recursive: true,
    });
  }

  syncDirectory(renderRoot, targetManualRoot);
  fs.rmSync(renderRoot, { force: true, recursive: true });

  const captured = manifestSteps.filter(
    (step) => step.status === 'captured' && step.image,
  ).length;

  return {
    captured,
    moduleKeys: moduleSpecs.map((spec) => spec.key),
    modules: moduleMeta,
    outputDir: targetManualRoot,
    total: manifestSteps.length,
  };
}

async function main() {
  const result = await generateUserManual();
  process.stdout.write(
    `用户操作手册已生成：${result.moduleKeys.length} 个模块，截图 ${result.captured}/${result.total} 步成功。` +
      `输出目录：${path.relative(repoRoot, result.outputDir)}\n`,
  );
}

const scriptPath = process.argv[1] ? path.resolve(process.argv[1]) : undefined;

if (scriptPath && scriptPath === __filename) {
  await main();
}
