import type { Page } from 'playwright/test';

import fs from 'node:fs';
import path from 'node:path';

import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..', '..', '..');
const manualRoot = path.join(repoRoot, 'docs', 'user-manual');
const imagesRoot = path.join(manualRoot, 'images');
const manifestPath = path.join(manualRoot, '.capture-manifest.json');
const errorLogPath = path.join(manualRoot, 'capture-errors.log');

export type CaptureStep = {
  module: string;
  /** 模块内唯一步骤名，用作图片文件名（不含扩展名）。 */
  name: string;
  /** 步骤标题/说明，写入手册正文。 */
  caption: string;
  /** 期望结果或操作要点，写入手册正文。 */
  expected?: string;
  /** 相对 docs/user-manual/ 的图片路径，捕获失败时省略。 */
  image?: string;
  /** 捕获阶段的顺序序号，便于生成器排序。 */
  order: number;
};

let orderSeed = 0;
const manifest: CaptureStep[] = [];

function resetManifest() {
  orderSeed = 0;
  manifest.length = 0;
  fs.mkdirSync(manualRoot, { recursive: true });
  fs.writeFileSync(manifestPath, '[]', 'utf8');
  fs.writeFileSync(errorLogPath, '', 'utf8');
}

function flushManifest() {
  fs.mkdirSync(manualRoot, { recursive: true });
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
}

export function logCaptureError(module: string, step: string, error: unknown) {
  fs.appendFileSync(
    errorLogPath,
    `[${new Date().toISOString()}] ${module}/${step}: ${String(error)}\n`,
    'utf8',
  );
}

/**
 * 捕获页面截图并登记到 manifest。
 * 失败时不抛出，仅记录到 capture-errors.log，保证后续步骤继续执行。
 * 返回登记后的步骤条目（image 可能为空）。
 */
export async function capture(
  page: Page,
  options: {
    module: string;
    name: string;
    caption: string;
    expected?: string;
    fullPage?: boolean;
    /** 截图前额外等待的元素定位器，避免空态/动画。 */
    waitFor?: import('playwright/test').Locator;
  },
): Promise<CaptureStep> {
  const { module, name, caption, expected, fullPage = true, waitFor } = options;
  const order = (orderSeed += 1);
  const step: CaptureStep = { module, name, caption, expected, order };

  try {
    if (waitFor) {
      await waitFor.waitFor({ state: 'visible', timeout: 8_000 }).catch(() => {});
    }
    // 等待网络与动画稳定；load 事件后额外给图表/表格渲染留时间。
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    await page.waitForTimeout(600);

    const moduleDir = path.join(imagesRoot, module);
    fs.mkdirSync(moduleDir, { recursive: true });
    const fileBase = name.replace(/[^\w-]+/gu, '_');
    const imagePath = path.join(moduleDir, `${fileBase}.png`);
    await page.screenshot({ path: imagePath, fullPage });
    step.image = path.relative(manualRoot, imagePath).replaceAll(path.sep, '/');
  } catch (error) {
    logCaptureError(module, name, error);
  }

  manifest.push(step);
  flushManifest();
  return step;
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

export const manualPaths = {
  errorLogPath,
  imagesRoot,
  manualRoot,
  manifestPath,
};

export { flushManifest, resetManifest };
