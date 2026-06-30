import type { AriaRole, Locator, Page } from 'playwright/test';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..', '..', '..');
const manualRoot = path.join(repoRoot, 'docs', 'user-manual');
const stageRoot = path.join(manualRoot, '.generated');
const imagesRoot = path.join(stageRoot, 'images');
const manifestPath = path.join(stageRoot, '.capture-manifest.json');
const errorLogPath = path.join(stageRoot, 'capture-errors.log');

export type CaptureStep = {
  authMode?: 'api' | 'ui';
  /** 步骤标题/说明，写入手册正文。 */
  caption: string;
  /** 期望结果或操作要点，写入手册正文。 */
  expected?: string;
  /** 相对 docs/user-manual/ 的图片路径，捕获失败时省略。 */
  image?: string;
  module: string;
  /** 模块内唯一步骤名，用作图片文件名（不含扩展名）。 */
  name: string;
  operations?: string;
  /** 捕获阶段的顺序序号，便于生成器排序。 */
  order: number;
  path?: string;
  pathLabel?: string;
  role?: string;
  roleNote?: string;
  sectionId?: string;
  status?: 'auth_failed' | 'capture_failed' | 'captured' | 'missing';
  subsectionId?: string;
  warning?: string;
};

export type CaptureWaitForRoleText = {
  exact?: boolean;
  name?: string;
  role: AriaRole;
  text?: string;
};

export type CaptureOptions = {
  authMode?: 'api' | 'ui';
  caption: string;
  expected?: string;
  fullPage?: boolean;
  module: string;
  name: string;
  operations?: string;
  path?: string;
  pathLabel?: string;
  role?: string;
  roleNote?: string;
  sectionId?: string;
  subsectionId?: string;
  /** 截图前额外等待的元素定位器，避免空态/动画。 */
  waitFor?: Locator;
  /** 截图前等待指定 role + 文本出现，适合按钮、标签页和对话框标题。 */
  waitForRoleText?: CaptureWaitForRoleText;
  /** 截图前等待选择器可见，适合弹窗、抽屉和列表容器。 */
  waitForSelector?: string;
  /** 截图前等待特定文本出现，适合表格、结果区域或延迟渲染内容。 */
  waitText?: string;
};

export type StaticCaptureScene = CaptureOptions & {
  path: string;
  role: string;
};

let orderSeed = 0;
const manifest: CaptureStep[] = [];
const authWarningSignals = [
  '欢迎回来',
  '请输入用户名',
  '请按住滑块拖动',
  '访问令牌已过期',
] as const;

function resetManifest() {
  orderSeed = 0;
  manifest.length = 0;
  fs.rmSync(stageRoot, { force: true, recursive: true });
  fs.mkdirSync(stageRoot, { recursive: true });
  fs.writeFileSync(manifestPath, '[]', 'utf8');
  fs.writeFileSync(errorLogPath, '', 'utf8');
}

function flushManifest() {
  fs.mkdirSync(stageRoot, { recursive: true });
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
}

function appendStep(step: CaptureStep) {
  manifest.push(step);
  flushManifest();
  return step;
}

export function logCaptureError(module: string, step: string, error: unknown) {
  fs.appendFileSync(
    errorLogPath,
    `[${new Date().toISOString()}] ${module}/${step}: ${String(error)}\n`,
    'utf8',
  );
}

async function isVisible(
  locatorFactory: () => { first: () => { isVisible: () => Promise<boolean> } },
) {
  try {
    return await locatorFactory().first().isVisible();
  } catch {
    return false;
  }
}

export async function detectAuthWarning(
  page: Pick<Page, 'getByPlaceholder' | 'getByText' | 'url'>,
) {
  const currentUrl = page.url();

  if (/\/auth\/login(?:[/?#]|$)/u.test(currentUrl)) {
    return `命中登录页 URL: ${currentUrl}`;
  }

  if (
    await isVisible(
      () =>
        page.getByPlaceholder('请输入用户名') as ReturnType<
          Page['getByPlaceholder']
        >,
    )
  ) {
    return '请输入用户名';
  }

  for (const signal of authWarningSignals) {
    if (
      await isVisible(
        () =>
          page.getByText(signal, { exact: false }) as ReturnType<
            Page['getByText']
          >,
      )
    ) {
      return signal;
    }
  }

  return undefined;
}

export function recordAuthFailure(
  step: Omit<CaptureStep, 'image' | 'order' | 'status'> & {
    warning: string;
  },
) {
  const entry: CaptureStep = {
    ...step,
    order: (orderSeed += 1),
    status: 'auth_failed',
  };

  logCaptureError(step.module, step.name, `AUTH_FAILED: ${step.warning}`);
  return appendStep(entry);
}

async function waitForOptionalText(page: Page, waitText?: string) {
  if (!waitText) {
    return;
  }

  await page
    .getByText(waitText, { exact: false })
    .first()
    .waitFor({ state: 'visible', timeout: 10_000 })
    .catch(() => {});
}

async function waitForOptionalSelector(page: Page, selector?: string) {
  if (!selector) {
    return;
  }

  await page
    .locator(selector)
    .first()
    .waitFor({ state: 'visible', timeout: 10_000 })
    .catch(() => {});
}

async function waitForOptionalRoleText(
  page: Page,
  waitForRoleText?: CaptureWaitForRoleText,
) {
  const name = waitForRoleText?.name ?? waitForRoleText?.text;

  if (!waitForRoleText || !name) {
    return;
  }

  await page
    .getByRole(waitForRoleText.role, {
      exact: waitForRoleText.exact,
      name,
    })
    .first()
    .waitFor({ state: 'visible', timeout: 10_000 })
    .catch(() => {});
}

async function waitForCaptureReady(page: Page, options: CaptureOptions) {
  await waitForOptionalText(page, options.waitText);
  await waitForOptionalSelector(page, options.waitForSelector);
  await waitForOptionalRoleText(page, options.waitForRoleText);

  if (options.waitFor) {
    await options.waitFor
      .waitFor({ state: 'visible', timeout: 8000 })
      .catch(() => {});
  }
}

/**
 * 捕获页面截图并登记到 manifest。
 * 失败时不抛出，仅记录到 capture-errors.log，保证后续步骤继续执行。
 * 返回登记后的步骤条目（image 可能为空）。
 */
export async function capture(
  page: Page,
  options: CaptureOptions,
): Promise<CaptureStep> {
  const {
    module,
    name,
    caption,
    expected,
    fullPage = true,
    authMode,
    operations,
    path: routePath,
    pathLabel,
    role,
    roleNote,
    sectionId,
    subsectionId,
  } = options;
  const order = (orderSeed += 1);
  const step: CaptureStep = {
    module,
    name,
    caption,
    expected,
    order,
    authMode,
    operations,
    path: routePath,
    pathLabel,
    role,
    roleNote,
    sectionId,
    subsectionId,
    status: 'captured',
  };

  try {
    await waitForCaptureReady(page, options);
    // 等待网络与动画稳定；load 事件后额外给图表/表格渲染留时间。
    await page
      .waitForLoadState('networkidle', { timeout: 10_000 })
      .catch(() => {});
    await page.waitForTimeout(600);

    const moduleDir = path.join(imagesRoot, module);
    fs.mkdirSync(moduleDir, { recursive: true });
    const fileBase = name.replaceAll(/[^\w-]+/gu, '_');
    const imagePath = path.join(moduleDir, `${fileBase}.png`);
    await page.screenshot({ path: imagePath, fullPage });
    step.image = path.relative(stageRoot, imagePath).replaceAll(path.sep, '/');
  } catch (error) {
    step.status = 'capture_failed';
    step.warning = String(error);
    logCaptureError(module, name, error);
  }

  return appendStep(step);
}

export async function captureStaticScene(
  page: Page,
  scene: StaticCaptureScene,
): Promise<CaptureStep> {
  return capture(page, scene);
}

/** 尝试性操作：执行一个可能失败的动作，失败仅记日志、不中断流程。 */
export async function tryStep(
  module: string,
  step: string,
  action: () => Promise<void>,
) {
  try {
    await action();
  } catch (error) {
    logCaptureError(module, step, error);
  }
}

export function getManifest() {
  return manifest;
}

export function hasAuthFailures() {
  return manifest.some((step) => step.status === 'auth_failed');
}

export const manualPaths = {
  errorLogPath,
  imagesRoot,
  manualRoot,
  manifestPath,
  stageRoot,
};

export { flushManifest, resetManifest };
