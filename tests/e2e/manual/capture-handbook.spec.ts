import type { Browser, BrowserContext, Page } from 'playwright/test';

import type { E2ERole } from '../helpers/env';

import { expect, test } from 'playwright/test';

import * as sessionHelpers from '../helpers/session';
import { FixationTransportPage } from '../specimen-workflow/fixation-transport';
import { createWorkflowRunData } from '../specimen-workflow/helpers/test-data';
import { PathologyReceiptPage } from '../specimen-workflow/pathology-receipt';
import { SubmissionRegistrationPage } from '../specimen-workflow/submission-registration';
import { TrackingExceptionPage } from '../specimen-workflow/tracking-exception';
import {
  capture,
  type CaptureOptions,
  captureStaticScene,
  type CaptureWaitForRoleText,
  detectAuthWarning,
  getManifest,
  hasAuthFailures,
  logCaptureError,
  recordAuthFailure,
  resetManifest,
  type StaticCaptureScene,
  tryStep,
} from './helpers/capture';
import * as manualSpec from './manual-spec.mjs';

/**
 * 用户操作手册截图捕获脚本。
 *
 * 设计目标：覆盖全模块，M2 走真实业务链路（复用 specimen-workflow POM），
 * M4/M5/M6/M1/仪表盘走登录后静态页捕获。每步失败仅记日志、不中断后续模块，
 * 最终产出 docs/user-manual/.capture-manifest.json 供 generate-user-manual.mjs 渲染。
 *
 * 运行前置与 tests/e2e/README.md 一致：需启动 web-ele + auth-center + bl-center，
 * 且 tests/e2e/.auth/*.json 已由 auth.setup 生成（pnpm test:e2e 会自动生成）。
 */

test.describe.configure({ mode: 'serial' });

type SessionHandle = {
  authMode: 'api' | 'ui';
  context: BrowserContext;
  page: Page;
  path: string;
  role: E2ERole;
  waitText?: string;
};

type ManualSpecRecord = Record<string, unknown>;

type StaticSceneDefaults = {
  fullPage?: boolean;
  module: string;
  operations?: string;
  path?: string;
  pathLabel?: string;
  role?: E2ERole;
  roleNote?: string;
  sectionId?: string;
  subsectionId?: string;
  waitForRoleText?: CaptureWaitForRoleText;
  waitForSelector?: string;
  waitText?: string;
};

const m2WorkflowOperatorRole = 'creator' as const;

test('capture user manual screenshots', async ({ browser }) => {
  // 全模块捕获（静态页 + M2 主链 + M2 异常链）耗时较长，放宽单测超时。
  test.setTimeout(15 * 60 * 1000);
  resetManifest();
  // 静态页捕获在前，避免 M2 真实链路写入的业务数据影响其他模块列表的快照稳定性。
  await captureStaticPages(browser);
  await captureM2HappyPath(browser);
  await captureM2AbnormalPath(browser);

  const authFailedSteps = getManifest().filter(
    (step): step is NonNullable<typeof step> & { status: 'auth_failed' } =>
      step.status === 'auth_failed',
  );
  expect(
    authFailedSteps,
    authFailedSteps.length > 0
      ? `存在认证失败步骤：${authFailedSteps
          .map(
            (step) =>
              `${step.module}/${step.name}(${step.warning ?? 'unknown'})`,
          )
          .join(', ')}`
      : 'manual:capture 认证守门通过。',
  ).toHaveLength(0);
  expect(hasAuthFailures()).toBe(false);
});

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

async function openManualSession(
  browser: Browser,
  role: E2ERole,
  path: string,
  options: {
    waitText?: string;
  } = {},
): Promise<SessionHandle> {
  const ensured = await sessionHelpers.ensureAuthenticatedPage(
    browser,
    role,
    path,
  );

  const session: SessionHandle = {
    authMode: ensured.authMode,
    context: ensured.context,
    page: ensured.page,
    path,
    role,
    waitText: options.waitText,
  };

  await waitForOptionalText(session.page, options.waitText);
  return session;
}

async function recoverSession(browser: Browser, session: SessionHandle) {
  const previousContext = session.context;
  const recovered = await openManualSession(
    browser,
    session.role,
    session.path,
    {
      waitText: session.waitText,
    },
  );

  session.authMode = recovered.authMode;
  session.context = recovered.context;
  session.page = recovered.page;
  await previousContext.close().catch(() => {});
}

function asRecord(value: unknown): ManualSpecRecord | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  return value as ManualSpecRecord;
}

function asRecordList(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => asRecord(item)).filter(Boolean)
    : [];
}

function pickString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value !== 'string') {
      continue;
    }

    const trimmed = value.trim();
    if (trimmed) {
      return trimmed;
    }
  }

  return undefined;
}

function pickBoolean(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'boolean') {
      return value;
    }
  }

  return undefined;
}

function pickRole(value: unknown) {
  return typeof value === 'string' && value.trim()
    ? (value as E2ERole)
    : undefined;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/gu, '-')
    .replaceAll(/^-+|-+$/gu, '');
}

function normalizeWaitForRoleText(
  value: unknown,
): CaptureWaitForRoleText | undefined {
  const record = asRecord(value);
  if (!record) {
    return undefined;
  }

  const role = pickString(record.role);
  const name = pickString(record.name, record.text);
  if (!role || !name) {
    return undefined;
  }

  return {
    exact: pickBoolean(record.exact),
    name,
    role: role as CaptureWaitForRoleText['role'],
  };
}

function mergeStaticSceneDefaults(
  base: StaticSceneDefaults,
  source: ManualSpecRecord,
): StaticSceneDefaults {
  return {
    fullPage: pickBoolean(source.fullPage, base.fullPage),
    module: pickString(source.module, base.module) ?? base.module,
    operations: pickString(source.operations, base.operations),
    path: pickString(source.path, base.path),
    pathLabel: pickString(source.pathLabel, base.pathLabel),
    role: pickRole(source.role) ?? base.role,
    roleNote: pickString(source.roleNote, base.roleNote),
    sectionId: pickString(source.sectionId, base.sectionId),
    subsectionId: pickString(source.subsectionId, base.subsectionId),
    waitForRoleText:
      normalizeWaitForRoleText(source.waitForRoleText) ?? base.waitForRoleText,
    waitForSelector: pickString(source.waitForSelector, base.waitForSelector),
    waitText: pickString(source.waitText, base.waitText),
  };
}

function getSceneContainers(node: ManualSpecRecord) {
  return [
    ...asRecordList(node.captures),
    ...asRecordList(node.captureScenes),
    ...asRecordList(node.scenes),
    ...asRecordList(node.staticPages),
  ];
}

function buildStaticSceneName(
  scene: ManualSpecRecord,
  defaults: StaticSceneDefaults,
  sceneIndex: number,
) {
  const explicitName = pickString(scene.name);
  if (explicitName) {
    return explicitName;
  }

  const parts = [
    defaults.sectionId,
    defaults.subsectionId,
    pickString(scene.sceneId, scene.id, scene.key),
    pickString(scene.title, scene.caption),
    pickString(scene.path),
    `scene-${sceneIndex + 1}`,
  ]
    .filter(Boolean)
    .map((part) => slugify(part));

  return parts.filter(Boolean).join('_');
}

function normalizeStaticScene(
  scene: ManualSpecRecord,
  defaults: StaticSceneDefaults,
  sceneIndex: number,
): StaticCaptureScene | undefined {
  const sceneDefaults = mergeStaticSceneDefaults(defaults, scene);
  const path = pickString(scene.path, sceneDefaults.path);
  const role = pickRole(scene.role) ?? sceneDefaults.role;
  const name = buildStaticSceneName(scene, sceneDefaults, sceneIndex);
  const caption =
    pickString(scene.caption, scene.title) ??
    pickString(sceneDefaults.subsectionId, sceneDefaults.sectionId, path) ??
    name;

  if (!path || !role) {
    logCaptureError(
      'manual-static-spec',
      name,
      `静态场景缺少必填 path/role：${JSON.stringify({
        module: sceneDefaults.module,
        path,
        role,
      })}`,
    );
    return undefined;
  }

  return {
    caption,
    expected: pickString(scene.expected),
    fullPage: pickBoolean(scene.fullPage, sceneDefaults.fullPage),
    module: sceneDefaults.module,
    name,
    operations: pickString(scene.operations, sceneDefaults.operations),
    path,
    pathLabel: pickString(scene.pathLabel, sceneDefaults.pathLabel, path),
    role,
    roleNote: pickString(scene.roleNote, sceneDefaults.roleNote),
    sectionId: pickString(scene.sectionId, sceneDefaults.sectionId),
    subsectionId: pickString(scene.subsectionId, sceneDefaults.subsectionId),
    waitForRoleText:
      normalizeWaitForRoleText(scene.waitForRoleText) ??
      sceneDefaults.waitForRoleText,
    waitForSelector: pickString(
      scene.waitForSelector,
      sceneDefaults.waitForSelector,
    ),
    waitText: pickString(scene.waitText, sceneDefaults.waitText),
  };
}

function collectStaticScenesFromNode(
  node: ManualSpecRecord,
  defaults: StaticSceneDefaults,
  scenes: StaticCaptureScene[],
) {
  for (const [sceneIndex, scene] of getSceneContainers(node).entries()) {
    const normalized = normalizeStaticScene(scene, defaults, sceneIndex);
    if (normalized) {
      scenes.push(normalized);
    }
  }
}

function collectStaticScenesFromSection(
  section: ManualSpecRecord,
  defaults: StaticSceneDefaults,
  scenes: StaticCaptureScene[],
) {
  const sectionDefaults = mergeStaticSceneDefaults(defaults, section);
  sectionDefaults.sectionId =
    pickString(
      section.sectionId,
      section.id,
      section.key,
      defaults.sectionId,
    ) ?? sectionDefaults.sectionId;
  collectStaticScenesFromNode(section, sectionDefaults, scenes);

  for (const subsection of asRecordList(section.subsections)) {
    const subsectionDefaults = mergeStaticSceneDefaults(
      sectionDefaults,
      subsection,
    );
    subsectionDefaults.subsectionId =
      pickString(
        subsection.subsectionId,
        subsection.id,
        subsection.key,
        sectionDefaults.subsectionId,
      ) ?? subsectionDefaults.subsectionId;
    collectStaticScenesFromNode(subsection, subsectionDefaults, scenes);
  }
}

function getLegacyStaticScenesFallback() {
  return asRecordList(manualSpec.MANUAL_STATIC_PAGES).flatMap(
    (page, pageIndex) => {
      const module = pickString(page.module);
      if (!module) {
        return [];
      }

      const normalized = normalizeStaticScene(
        page,
        {
          module,
          role: pickRole(page.role),
        },
        pageIndex,
      );

      return normalized ? [normalized] : [];
    },
  );
}

function getStaticCaptureScenes() {
  const moduleSpecs = asRecordList(manualSpec.MANUAL_MODULE_SPECS);
  const staticScenes: StaticCaptureScene[] = [];

  for (const moduleSpec of [...moduleSpecs].toSorted((left, right) => {
    const leftOrder =
      typeof left.order === 'number' ? left.order : Number(left.order ?? 0);
    const rightOrder =
      typeof right.order === 'number' ? right.order : Number(right.order ?? 0);
    return leftOrder - rightOrder;
  })) {
    const module = pickString(moduleSpec.key, moduleSpec.module);
    if (!module || module === 'm2-specimen-workflow') {
      continue;
    }

    const moduleDefaults = mergeStaticSceneDefaults({ module }, moduleSpec);
    collectStaticScenesFromNode(moduleSpec, moduleDefaults, staticScenes);

    for (const section of [
      ...asRecordList(moduleSpec.sections),
      ...asRecordList(moduleSpec.chapters),
    ]) {
      collectStaticScenesFromSection(section, moduleDefaults, staticScenes);
    }
  }

  return staticScenes.length > 0
    ? staticScenes
    : getLegacyStaticScenesFallback();
}

function getCaptureManifestMeta(
  session: SessionHandle,
  options: CaptureOptions,
) {
  return {
    authMode: session.authMode,
    caption: options.caption,
    expected: options.expected,
    module: options.module,
    name: options.name,
    operations: options.operations,
    path: session.path,
    pathLabel: options.pathLabel,
    role: session.role,
    roleNote: options.roleNote,
    sectionId: options.sectionId,
    subsectionId: options.subsectionId,
  };
}

function getCaptureInvocationOptions(
  session: SessionHandle,
  options: CaptureOptions,
): CaptureOptions {
  return {
    ...options,
    authMode: session.authMode,
    path: session.path,
    role: session.role,
  };
}

async function captureWithAuthGuard(
  browser: Browser,
  session: SessionHandle,
  options: CaptureOptions,
  captureAction: (
    page: Page,
    options: CaptureOptions,
  ) => Promise<unknown> = capture,
) {
  session.waitText = options.waitText;
  const firstWarning = await detectAuthWarning(session.page);
  let pageReplaced = false;

  if (firstWarning) {
    try {
      await recoverSession(browser, session);
      pageReplaced = true;
    } catch (error) {
      recordAuthFailure({
        ...getCaptureManifestMeta(session, options),
        warning: `${firstWarning}；UI 兜底重试失败：${String(error)}`,
      });
      return { pageReplaced, skipped: true as const };
    }

    const retryWarning = await detectAuthWarning(session.page);
    if (retryWarning) {
      recordAuthFailure({
        ...getCaptureManifestMeta(session, options),
        warning: retryWarning,
      });
      return { pageReplaced, skipped: true as const };
    }
  }

  await captureAction(
    session.page,
    getCaptureInvocationOptions(session, options),
  );
  return { pageReplaced, skipped: false as const };
}

async function gotoTrackingExceptionPage(page: Page) {
  await page.goto('/workflow/tracking-exception', {
    waitUntil: 'domcontentloaded',
  });
  await page
    .getByRole('tab', { name: '申请单列表' })
    .waitFor({ state: 'visible', timeout: 10_000 });
}

async function captureStaticPages(browser: Browser) {
  const scenes = getStaticCaptureScenes();
  let currentSession: SessionHandle | undefined;
  let currentSessionKey: string | undefined;

  for (const scene of scenes) {
    const nextSessionKey = `${scene.role}::${scene.path}`;

    try {
      if (!currentSession || currentSessionKey !== nextSessionKey) {
        await currentSession?.context.close().catch(() => {});
        currentSession = await openManualSession(
          browser,
          scene.role,
          scene.path,
          {
            waitText: scene.waitText,
          },
        );
        currentSessionKey = nextSessionKey;
      }

      await captureWithAuthGuard(
        browser,
        currentSession,
        scene,
        captureStaticScene,
      );
    } catch (error) {
      logCaptureError(scene.module, scene.name, error);
    }
  }

  await currentSession?.context.close().catch(() => {});
}

async function captureM2HappyPath(browser: Browser) {
  const module = 'm2-specimen-workflow';
  const runData = createWorkflowRunData();
  let specimenIdentifiers: [string, string] | undefined;

  test.info().annotations.push({
    type: 'applicationNo',
    description: runData.applicationNo,
  });

  // 1. 申请创建 + 标本登记（creator）
  {
    const session = await openManualSession(
      browser,
      'creator',
      '/workflow/submission-registration',
    );
    try {
      let submissionPage = new SubmissionRegistrationPage(session.page);
      await tryStep(module, 'goto-submission', async () => {
        await submissionPage.goto();
      });
      const listCapture = await captureWithAuthGuard(browser, session, {
        module,
        name: 'submission-list',
        caption:
          '申请与登记：进入工作站后展示申请单列表，点击「创建」新建申请。',
        expected: '页面顶部出现「创建」按钮，列表为当前账号可见的申请单。',
      });
      if (listCapture.pageReplaced) {
        submissionPage = new SubmissionRegistrationPage(session.page);
      }

      // POM 的 createApplicationAndOpenRegistration 会点击「创建」打开对话框、
      // 填写申请单字段并保存，随后自动进入「标本登记」对话框。这里不重复点「创建」，
      // 避免对话框已打开时 overlay 拦截点击。
      await tryStep(module, 'create-application', async () => {
        await submissionPage.createApplicationAndOpenRegistration(runData);
      });
      const formCapture = await captureWithAuthGuard(browser, session, {
        module,
        name: 'specimen-register-form',
        caption:
          '创建申请单并进入标本登记：填写申请单基础信息保存后，系统切换到「标本登记」工作台。',
        expected: '登记工作台出现「保存/确认登记」「添加标本」等操作入口。',
        waitFor: session.page.getByRole('button', { name: '保存/确认登记' }),
      });
      if (formCapture.pageReplaced) {
        submissionPage = new SubmissionRegistrationPage(session.page);
      }

      await tryStep(module, 'register-specimens', async () => {
        const registrationResult =
          await submissionPage.registerSpecimens(runData);
        specimenIdentifiers = [
          registrationResult.specimens[0]?.barcode ??
            registrationResult.specimens[0]?.specimenNo ??
            '',
          registrationResult.specimens[1]?.barcode ??
            registrationResult.specimens[1]?.specimenNo ??
            '',
        ];
      });
      await captureWithAuthGuard(browser, session, {
        module,
        name: 'specimen-register-done',
        caption:
          '提交登记：保存工作台后生成本次登记结果，标本获得真实条码与标本号。',
        expected: '提示「保存并确认登记成功」，最新登记结果已可用于下游流转。',
      });
    } catch (error) {
      logCaptureError(module, 'happy-create-register', error);
    } finally {
      await session.context.close();
    }
  }

  // 2. 固定核对 + 创建转运单（fixation）
  {
    const session = await openManualSession(
      browser,
      m2WorkflowOperatorRole,
      '/workflow/fixation-verify',
    );
    try {
      let workflowPage = new FixationTransportPage(session.page);
      await tryStep(module, 'goto-verification', async () => {
        await workflowPage.gotoVerification();
      });
      await captureWithAuthGuard(browser, session, {
        module,
        name: 'verification-workbench',
        caption: '离体确认：输入真实标本号后执行快速确认，标本进入可固定状态。',
        expected: '页面展示离体确认工作台，支持按标本条码/编号快速确认。',
      });
      await tryStep(module, 'confirm-removal', async () => {
        await workflowPage.confirmRemoval(specimenIdentifiers?.[0] ?? '');
        await workflowPage.confirmRemoval(specimenIdentifiers?.[1] ?? '');
      });
      await captureWithAuthGuard(browser, session, {
        module,
        name: 'verification-done',
        caption:
          '离体确认完成：两条标本完成离体确认后，具备进入固定流程的前置条件。',
        expected: '提示标本已完成离体确认，下游固定流程可正常检索到标本。',
      });
      await tryStep(module, 'goto-fixation', async () => {
        await workflowPage.gotoFixation();
      });
      const listCapture = await captureWithAuthGuard(browser, session, {
        module,
        name: 'fixation-list',
        caption: '标本固定：输入真实条码或标本号查询，待固定标本进入固定队列。',
        expected: '页面展示「标本固定」工作台与待处理列表。',
      });
      if (listCapture.pageReplaced) {
        workflowPage = new FixationTransportPage(session.page);
      }

      await tryStep(module, 'start-fixation', async () => {
        await workflowPage.startFixation(specimenIdentifiers?.[0] ?? '');
      });
      const dialogCapture = await captureWithAuthGuard(browser, session, {
        module,
        name: 'fixation-complete-dialog',
        caption:
          '完成固定：固定中的标本勾选后执行「确认固定」，写入固定液、固定时间与固定人。',
        expected: '提示「已完成 1 条标本固定」，标本进入已固定状态。',
      });
      if (dialogCapture.pageReplaced) {
        workflowPage = new FixationTransportPage(session.page);
      }
      await tryStep(module, 'complete-fixation', async () => {
        await workflowPage.completeFixation(specimenIdentifiers?.[0] ?? '');
        await workflowPage.startFixation(specimenIdentifiers?.[1] ?? '');
        await workflowPage.completeFixation(specimenIdentifiers?.[1] ?? '');
      });

      await tryStep(module, 'goto-confirmation', async () => {
        await workflowPage.gotoConfirmation();
      });
      await captureWithAuthGuard(browser, session, {
        module,
        name: 'confirmation-list',
        caption:
          '标本确认：按申请单号/标本号/条码查询后，将待确认标本加入确认队列。',
        expected: '页面展示「标本确认」工作台与确认状态列。',
      });
      await tryStep(module, 'confirm-specimens', async () => {
        await workflowPage.confirmSpecimens(specimenIdentifiers?.[0] ?? '');
        await workflowPage.confirmSpecimens(specimenIdentifiers?.[1] ?? '');
      });
      await captureWithAuthGuard(browser, session, {
        module,
        name: 'confirmation-done',
        caption: '提交确认：选择确认人并通过二次校验后，标本状态更新为已确认。',
        expected: '提示「已完成 1 条标本确认」，标本具备入库前置条件。',
      });

      await tryStep(module, 'goto-check-in', async () => {
        await workflowPage.gotoCheckIn();
      });
      await captureWithAuthGuard(browser, session, {
        module,
        name: 'check-in-list',
        caption:
          '标本入库：输入真实条码或标本号后，待入库标本进入当前入库队列。',
        expected: '页面展示「标本入库」工作台与入库状态列。',
      });
      await tryStep(module, 'check-in-specimens', async () => {
        await workflowPage.checkInSpecimens(specimenIdentifiers?.[0] ?? '');
        await workflowPage.checkInSpecimens(specimenIdentifiers?.[1] ?? '');
      });
      await captureWithAuthGuard(browser, session, {
        module,
        name: 'check-in-done',
        caption: '提交入库：执行「标本入库」后，标本状态更新为已入库。',
        expected: '提示「标本入库成功」，标本满足出库前置条件。',
      });

      await tryStep(module, 'goto-transport', async () => {
        await workflowPage.gotoTransport();
      });
      await tryStep(module, 'create-transport', async () => {
        await workflowPage.createTransportOrder(specimenIdentifiers?.[0] ?? '');
      });
      await captureWithAuthGuard(browser, session, {
        module,
        name: 'transport-order-created',
        caption:
          '标本出库：选择出库人后执行「转运」，系统自动创建并提交转运单。',
        expected: '提示「标本转运成功」，标本状态更新为转运中。',
      });
    } catch (error) {
      logCaptureError(module, 'happy-fixation-transport-create', error);
    } finally {
      await session.context.close();
    }
  }

  // 3. 标本接收（receive）
  {
    const session = await openManualSession(
      browser,
      m2WorkflowOperatorRole,
      '/workflow/pathology-receipt',
    );
    try {
      let receiptPage = new PathologyReceiptPage(session.page);
      await tryStep(module, 'goto-receipt', async () => {
        await receiptPage.goto();
      });
      const listCapture = await captureWithAuthGuard(browser, session, {
        module,
        name: 'receipt-list',
        caption:
          '标本签收：输入标本 ID 查询后，当前申请单下全部待签收标本进入签收队列。',
        expected: '页面展示「签收」工作台、签收队列及标本状态列。',
      });
      if (listCapture.pageReplaced) {
        receiptPage = new PathologyReceiptPage(session.page);
      }

      await tryStep(module, 'receive-all', async () => {
        await receiptPage.receiveAll(specimenIdentifiers?.[0] ?? '');
      });
      await captureWithAuthGuard(browser, session, {
        module,
        name: 'receipt-result',
        caption: '签收完成：确认签收后，所有标本进入已接收状态并生成病例号。',
        expected: '提示「标本签收成功」，未接收数为 0。',
      });
    } catch (error) {
      logCaptureError(module, 'happy-receive', error);
    } finally {
      await session.context.close();
    }
  }

  // 4. 追踪查询（tracking）
  {
    const session = await openManualSession(
      browser,
      m2WorkflowOperatorRole,
      '/workflow/tracking-exception',
    );
    try {
      let trackingPage = new TrackingExceptionPage(session.page);
      await tryStep(module, 'goto-tracking', async () => {
        await gotoTrackingExceptionPage(session.page);
      });
      const listCapture = await captureWithAuthGuard(browser, session, {
        module,
        name: 'tracking-list',
        caption: '追踪与异常：申请单列表，输入申请单号查询后点击「详情」。',
        expected: '列表可按申请单号检索到本次申请单。',
      });
      if (listCapture.pageReplaced) {
        trackingPage = new TrackingExceptionPage(session.page);
      }

      await tryStep(module, 'open-tracking', async () => {
        await trackingPage.openApplicationTracking(runData.applicationNo);
      });
      await captureWithAuthGuard(browser, session, {
        module,
        name: 'tracking-timeline',
        caption: '申请单追踪详情：展示当前节点（接收）、时间线事件与标本明细。',
        expected: '时间线事件可见，所有标本条码/标本号均展示。',
        waitText: runData.applicationNo,
      });
    } catch (error) {
      logCaptureError(module, 'happy-tracking', error);
    } finally {
      await session.context.close();
    }
  }
}

async function captureM2AbnormalPath(browser: Browser) {
  const module = 'm2-specimen-workflow';
  const runData = createWorkflowRunData();
  const rejectReason = 'broken-container-e2e';
  let specimenIdentifiers: [string, string] | undefined;

  // 复用 happy-path 前置：创建登记 + 固定 + 确认 + 入库 + 出库
  {
    const session = await openManualSession(
      browser,
      'creator',
      '/workflow/submission-registration',
    );
    try {
      const submissionPage = new SubmissionRegistrationPage(session.page);
      await tryStep(module, 'abnormal-goto-submission', async () => {
        await submissionPage.goto();
        await submissionPage.createApplicationAndOpenRegistration(runData);
        const registrationResult =
          await submissionPage.registerSpecimens(runData);
        specimenIdentifiers = [
          registrationResult.specimens[0]?.barcode ??
            registrationResult.specimens[0]?.specimenNo ??
            '',
          registrationResult.specimens[1]?.barcode ??
            registrationResult.specimens[1]?.specimenNo ??
            '',
        ];
      });
    } catch (error) {
      logCaptureError(module, 'abnormal-create-register', error);
    } finally {
      await session.context.close();
    }
  }
  {
    const session = await openManualSession(
      browser,
      m2WorkflowOperatorRole,
      '/workflow/fixation-verify',
    );
    try {
      const workflowPage = new FixationTransportPage(session.page);
      await tryStep(module, 'abnormal-fixation', async () => {
        await workflowPage.gotoVerification();
        await workflowPage.confirmRemoval(specimenIdentifiers?.[0] ?? '');
        await workflowPage.confirmRemoval(specimenIdentifiers?.[1] ?? '');
        await workflowPage.gotoFixation();
        await workflowPage.startFixation(specimenIdentifiers?.[0] ?? '');
        await workflowPage.completeFixation(specimenIdentifiers?.[0] ?? '');
        await workflowPage.startFixation(specimenIdentifiers?.[1] ?? '');
        await workflowPage.completeFixation(specimenIdentifiers?.[1] ?? '');
        await workflowPage.gotoConfirmation();
        await workflowPage.confirmSpecimens(specimenIdentifiers?.[0] ?? '');
        await workflowPage.confirmSpecimens(specimenIdentifiers?.[1] ?? '');
        await workflowPage.gotoCheckIn();
        await workflowPage.checkInSpecimens(specimenIdentifiers?.[0] ?? '');
        await workflowPage.checkInSpecimens(specimenIdentifiers?.[1] ?? '');
        await workflowPage.gotoTransport();
        await workflowPage.createTransportOrder(specimenIdentifiers?.[0] ?? '');
      });
    } catch (error) {
      logCaptureError(module, 'abnormal-fixation-transport', error);
    } finally {
      await session.context.close();
    }
  }

  // 异常接收：拒收其中一条标本
  {
    const session = await openManualSession(
      browser,
      m2WorkflowOperatorRole,
      '/workflow/pathology-receipt',
    );
    try {
      let receiptPage = new PathologyReceiptPage(session.page);
      await tryStep(module, 'abnormal-goto-receipt', async () => {
        await receiptPage.goto();
      });
      await tryStep(module, 'abnormal-reject', async () => {
        await receiptPage.rejectOneSpecimen(
          specimenIdentifiers?.[0] ?? '',
          rejectReason,
        );
      });
      const resultCapture = await captureWithAuthGuard(browser, session, {
        module,
        name: 'abnormal-receipt-result',
        caption:
          '异常接收：在签收工作台执行拒收并填写拒收原因与整改建议，结果为部分接收。',
        expected: '接收状态为 PARTIALLY_RECEIVED，未接收数为 1。',
        waitText: rejectReason,
      });
      if (resultCapture.pageReplaced) {
        receiptPage = new PathologyReceiptPage(session.page);
      }
    } catch (error) {
      logCaptureError(module, 'abnormal-receive', error);
    } finally {
      await session.context.close();
    }
  }

  // 异常追踪：确认异常标记
  {
    const session = await openManualSession(
      browser,
      m2WorkflowOperatorRole,
      '/workflow/tracking-exception',
    );
    try {
      let trackingPage = new TrackingExceptionPage(session.page);
      await tryStep(module, 'abnormal-goto-tracking', async () => {
        await gotoTrackingExceptionPage(session.page);
        await trackingPage.openApplicationTracking(runData.applicationNo);
      });
      const detailCapture = await captureWithAuthGuard(browser, session, {
        module,
        name: 'abnormal-tracking-detail',
        caption: '异常追踪详情：展示异常明细、拒收标本状态与异常原因。',
        expected: '异常标记为真，拒收标本状态为 REJECTED，展示异常原因。',
        waitText: rejectReason,
      });
      if (detailCapture.pageReplaced) {
        trackingPage = new TrackingExceptionPage(session.page);
      }
    } catch (error) {
      logCaptureError(module, 'abnormal-tracking', error);
    } finally {
      await session.context.close();
    }
  }
}
