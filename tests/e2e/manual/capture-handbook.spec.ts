import type { E2ERole } from '../helpers/env';

import { test } from 'playwright/test';

import { openRolePage } from '../helpers/session';
import { createWorkflowRunData } from '../specimen-workflow/helpers/test-data';
import { FixationTransportPage } from '../specimen-workflow/fixation-transport';
import { PathologyReceiptPage } from '../specimen-workflow/pathology-receipt';
import { SubmissionRegistrationPage } from '../specimen-workflow/submission-registration';
import { TrackingExceptionPage } from '../specimen-workflow/tracking-exception';
import {
  capture,
  logCaptureError,
  resetManifest,
  tryStep,
} from './helpers/capture';

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

type StaticPage = {
  module: string;
  role: E2ERole;
  path: string;
  title: string;
  /** 页面加载后等待出现的文本，用于确认渲染完成。 */
  waitText?: string;
  caption: string;
  expected?: string;
};

const STATIC_PAGES: StaticPage[] = [
  // 仪表盘（病理看板在 /analytics 内）
  {
    module: 'dashboard',
    role: 'admin',
    path: '/analytics',
    title: '病理看板',
    caption: '病理看板：汇总当日标本流转、诊断进度与异常指标。',
    expected: '看板分左/中/右三栏展示核心指标与待办。',
  },
  {
    module: 'dashboard',
    role: 'admin',
    path: '/workspace',
    title: '工作台',
    caption: '个人工作台：按当前账号岗位聚合待办与快捷入口。',
  },
  // M4 诊断管理
  {
    module: 'm4-doctor-workflow',
    role: 'admin',
    path: '/doctor-workflow/assignment',
    title: '诊断分配',
    waitText: '用户分片列表',
    caption: '诊断分配：选择医生并对未分派任务做初步/签发分片。',
    expected: '左侧为可分派医生，右侧为待分派诊断任务列表。',
  },
  {
    module: 'm4-doctor-workflow',
    role: 'admin',
    path: '/doctor-workflow/workbench',
    title: '诊断平台工作站',
    caption: '诊断平台工作站：队列 + 报告编辑 + 资料三联布局，支持保存/初步/复核/签发/发放。',
  },
  {
    module: 'm4-doctor-workflow',
    role: 'admin',
    path: '/doctor-workflow/report',
    title: '病理报告',
    caption: '病理报告列表：按病例/病理号查询，支持驳回、发布与版本打印/发放/回收。',
  },
  {
    module: 'm4-doctor-workflow',
    role: 'admin',
    path: '/doctor-workflow/tracking',
    title: '报告追踪',
    caption: '报告追踪：只读展示病例全局生命周期时间线与对象追踪明细。',
  },
  {
    module: 'm4-doctor-workflow',
    role: 'admin',
    path: '/doctor-workflow/medical-orders',
    title: '病理医嘱执行',
    waitText: '病理号',
    caption: '病理医嘱执行：对医嘱做确认/打印玻片/出片/取消。',
  },
  {
    module: 'm4-doctor-workflow',
    role: 'admin',
    path: '/doctor-workflow/revision',
    title: '报告修订',
    caption: '报告修订：发起修订申请并审批通过/驳回。',
  },
  {
    module: 'm4-doctor-workflow',
    role: 'admin',
    path: '/doctor-workflow/consultation',
    title: '会诊管理',
    caption: '会诊管理：发起会诊、录入参与人意见、完成会诊。',
  },
  // M5 归档与借记
  {
    module: 'm5-operation-support',
    role: 'admin',
    path: '/operation-support/archive',
    title: '归档管理',
    caption: '归档管理：维护蜡块/切片/报告归档台账与位置。',
  },
  {
    module: 'm5-operation-support',
    role: 'admin',
    path: '/operation-support/borrow',
    title: '借记管理',
    caption: '借记管理：登记借出、归还与逾期提醒。',
  },
  // M5 设备及试剂
  {
    module: 'm5-operation-support',
    role: 'admin',
    path: '/operation-resources/equipment',
    title: '仪器设备管理',
    caption: '仪器设备管理：设备档案、保养记录与预警。',
  },
  {
    module: 'm5-operation-support',
    role: 'admin',
    path: '/operation-resources/reagents',
    title: '试剂耗材管理',
    caption: '试剂耗材管理：基础信息、库存批次与预警。',
  },
  {
    module: 'm5-operation-support',
    role: 'admin',
    path: '/operation-resources/medical-waste',
    title: '医疗废物管理',
    caption: '医疗废物管理：废物袋打印与交接记录。',
  },
  // M6 数据统计与分析
  {
    module: 'm6-statistics',
    role: 'm6',
    path: '/m6/dashboard',
    title: '统计仪表盘',
    caption: '统计仪表盘：汇总 M6 质控、运营与工作量核心指标。',
  },
  {
    module: 'm6-statistics',
    role: 'm6',
    path: '/m6/quality-indicators',
    title: '质控指标统计',
    caption: '质控指标统计：三甲质控、质量安全控制指标与数据源状态。',
  },
  {
    module: 'm6-statistics',
    role: 'm6',
    path: '/m6/management-indicators',
    title: '管理指标统计',
    caption: '管理指标统计：业务量、收费、物资/试剂预警与人员工作量。',
  },
  {
    module: 'm6-statistics',
    role: 'm6',
    path: '/m6/custom-analysis',
    title: '统计报表工作台',
    caption: '统计报表工作台：工作量/质控/冰冻/报告更改/不合格标本分析。',
  },
  // M1 系统管理
  {
    module: 'm1-system',
    role: 'admin',
    path: '/system/users',
    title: '系统用户',
    caption: '系统用户：账号创建、启停与岗位绑定。',
  },
  {
    module: 'm1-system',
    role: 'admin',
    path: '/system/roles',
    title: '角色授权',
    caption: '角色授权：角色与权限码分配。',
  },
  {
    module: 'm1-system',
    role: 'admin',
    path: '/system/departments',
    title: '科室字典',
    caption: '科室字典：组织架构与科室维护。',
  },
  {
    module: 'm1-system',
    role: 'admin',
    path: '/system/body-parts',
    title: '部位字典',
    caption: '部位字典：取材部位分类维护。',
  },
  {
    module: 'm1-system',
    role: 'admin',
    path: '/system/medical-order-dicts',
    title: '医嘱字典',
    caption: '医嘱字典：医嘱项目基础定义。',
  },
  {
    module: 'm1-system',
    role: 'admin',
    path: '/system/medical-order-charges',
    title: '医嘱收费',
    caption: '医嘱收费：收费项目与价格维护。',
  },
  {
    module: 'm1-system',
    role: 'admin',
    path: '/system/medical-order-packages',
    title: '医嘱套餐',
    caption: '医嘱套餐：常用医嘱组合维护。',
  },
  {
    module: 'm1-system',
    role: 'admin',
    path: '/system/sampling-templates',
    title: '描写模板',
    caption: '描写模板：大体/镜下/诊断描述模板维护。',
  },
  {
    module: 'm1-system',
    role: 'admin',
    path: '/system/sampling-guidelines',
    title: '取材规范',
    caption: '取材规范：取材标准操作规范维护。',
  },
  {
    module: 'm1-system',
    role: 'admin',
    path: '/system/configs',
    title: '系统配置',
    caption: '系统配置：运行参数与开关维护。',
  },
  {
    module: 'm1-system',
    role: 'admin',
    path: '/system/numbering-rules',
    title: '编号规则',
    caption: '编号规则：病理号/标本号等编号规则配置。',
  },
  {
    module: 'm1-system',
    role: 'admin',
    path: '/system/logs',
    title: '日志管理',
    caption: '日志管理：操作日志查询与审计。',
  },
];

test.describe.configure({ mode: 'serial' });

test('capture user manual screenshots', async ({ browser }) => {
  // 全模块捕获（静态页 + M2 主链 + M2 异常链）耗时较长，放宽单测超时。
  test.setTimeout(15 * 60 * 1000);
  resetManifest();
  // 静态页捕获在前，避免 M2 真实链路写入的业务数据影响其他模块列表的快照稳定性。
  await captureStaticPages(browser);
  await captureM2HappyPath(browser);
  await captureM2AbnormalPath(browser);
});

async function captureStaticPages(browser: import('playwright/test').Browser) {
  for (const page of STATIC_PAGES) {
    const { context, page: p } = await openRolePage(
      browser,
      page.role,
      page.path,
    );
    try {
      if (page.waitText) {
        await p
          .getByText(page.waitText, { exact: false })
          .first()
          .waitFor({ state: 'visible', timeout: 10_000 })
          .catch(() => {});
      }
      await capture(p, {
        module: page.module,
        name: pathToName(page.path),
        caption: page.caption,
        expected: page.expected,
      });
    } catch (error) {
      logCaptureError(page.module, page.path, error);
    } finally {
      await context.close();
    }
  }
}

async function captureM2HappyPath(browser: import('playwright/test').Browser) {
  const module = 'm2-specimen-workflow';
  const runData = createWorkflowRunData();
  let transportOrderId: string | undefined;
  let transportOrderNo: string | undefined;

  test.info().annotations.push({
    type: 'applicationNo',
    description: runData.applicationNo,
  });

  // 1. 申请创建 + 标本登记（creator）
  {
    const { context, page } = await openRolePage(
      browser,
      'creator',
      '/workflow/submission-registration',
    );
    try {
      const submissionPage = new SubmissionRegistrationPage(page);
      await tryStep(module, 'goto-submission', async () => {
        await submissionPage.goto();
      });
      await capture(page, {
        module,
        name: 'submission-list',
        caption: '申请与登记：进入工作站后展示申请单列表，点击「创建」新建申请。',
        expected: '页面顶部出现「创建」按钮，列表为当前账号可见的申请单。',
      });

      // POM 的 createApplicationAndOpenRegistration 会点击「创建」打开对话框、
      // 填写申请单字段并保存，随后自动进入「标本登记」对话框。这里不重复点「创建」，
      // 避免对话框已打开时 overlay 拦截点击。
      await tryStep(module, 'create-application', async () => {
        await submissionPage.createApplicationAndOpenRegistration(runData);
      });
      await capture(page, {
        module,
        name: 'specimen-register-form',
        caption:
          '创建申请单并进入标本登记：填写申请单号、患者信息、送检科室、送检部位等字段保存后，自动进入「标本登记」对话框。',
        expected: '「标本登记」对话框打开，可录入打印机编号与多行标本。',
      });

      await tryStep(module, 'register-specimens', async () => {
        await submissionPage.registerSpecimens(runData);
      });
      await capture(page, {
        module,
        name: 'specimen-register-done',
        caption: '提交登记：点击「提交登记」后接口返回登记成功，标签打印批次号生成。',
        expected: '提示「标本登记成功」，列表出现新建申请单。',
      });
    } catch (error) {
      logCaptureError(module, 'happy-create-register', error);
    } finally {
      await context.close();
    }
  }

  // 2. 固定核对 + 创建转运单（fixation）
  {
    const { context, page } = await openRolePage(
      browser,
      'fixation',
      '/workflow/fixation-verify',
    );
    try {
      const workflowPage = new FixationTransportPage(page);
      await tryStep(module, 'goto-fixation', async () => {
        await workflowPage.gotoFixation();
      });
      await capture(page, {
        module,
        name: 'fixation-list',
        caption: '固定核对：固定列表展示待固定标本，按条码操作「开始固定」。',
        expected: '固定列表出现刚登记的标本条码。',
      });

      await tryStep(module, 'start-fixation', async () => {
        await workflowPage.startFixation(runData.barcodes[0]);
      });
      await capture(page, {
        module,
        name: 'fixation-complete-dialog',
        caption: '完成固定：开始固定后点击「完成固定」并确认，记录固定液与时间。',
        expected: '提示「已完成固定」，标本进入可转运状态。',
      });
      await tryStep(module, 'complete-fixation', async () => {
        await workflowPage.completeFixation(runData.barcodes[0]);
        await workflowPage.startFixation(runData.barcodes[1]);
        await workflowPage.completeFixation(runData.barcodes[1]);
      });

      await tryStep(module, 'create-transport', async () => {
        const order = await workflowPage.createTransportOrder([
          ...runData.barcodes,
        ]);
        transportOrderId = order.id;
        transportOrderNo = order.transportOrderNo;
      });
      await capture(page, {
        module,
        name: 'transport-order-created',
        caption: '创建转运单：选择交接/接收科室并扫码后生成转运单号。',
        expected: '提示「转运单创建成功」，转运列表出现新单。',
      });
    } catch (error) {
      logCaptureError(module, 'happy-fixation-transport-create', error);
    } finally {
      await context.close();
    }
  }

  // 3. 转运交接（transport）
  {
    const { context, page } = await openRolePage(
      browser,
      'transport',
      '/workflow/transport-handover',
    );
    try {
      const workflowPage = new FixationTransportPage(page);
      await tryStep(module, 'goto-transport', async () => {
        await workflowPage.gotoTransport();
      });
      await capture(page, {
        module,
        name: 'transport-list',
        caption: '标本出库：待处理转运单列表，对转运单「打印」与「交接」。',
        expected: '列表出现刚创建的转运单号。',
      });

      await tryStep(module, 'print-transport', async () => {
        if (transportOrderNo) {
          await workflowPage.printTransportOrder(transportOrderNo);
        }
      });
      await tryStep(module, 'handover-transport', async () => {
        if (transportOrderNo) {
          await workflowPage.handoverTransportOrder(transportOrderNo);
        }
      });
      await capture(page, {
        module,
        name: 'transport-handover-done',
        caption: '转运交接：确认打印后点击「交接」，状态变为已交接。',
        expected: '提示「转运交接成功」，转运单进入待接收。',
      });
    } catch (error) {
      logCaptureError(module, 'happy-transport-handover', error);
    } finally {
      await context.close();
    }
  }

  // 4. 标本接收（receive）
  {
    const { context, page } = await openRolePage(
      browser,
      'receive',
      '/workflow/pathology-receipt',
    );
    try {
      const receiptPage = new PathologyReceiptPage(page);
      await tryStep(module, 'goto-receipt', async () => {
        await receiptPage.goto();
      });
      await capture(page, {
        module,
        name: 'receipt-list',
        caption: '标本接收工作站：待接收转运单列表，点击「接收」打开接收对话框。',
        expected: '列表出现已交接的转运单。',
      });

      await tryStep(module, 'receive-all', async () => {
        if (transportOrderId) {
          await receiptPage.receiveAll(transportOrderId);
        }
      });
      await capture(page, {
        module,
        name: 'receipt-result',
        caption: '接收结果：提交接收后展示接收结果，生成病例号，未接收数为 0。',
        expected: '提示「标本接收成功」，接收结果展示病例号。',
      });
    } catch (error) {
      logCaptureError(module, 'happy-receive', error);
    } finally {
      await context.close();
    }
  }

  // 5. 追踪查询（tracking）
  {
    const { context, page } = await openRolePage(
      browser,
      'tracking',
      '/workflow/tracking-exception',
    );
    try {
      const trackingPage = new TrackingExceptionPage(page);
      await tryStep(module, 'goto-tracking', async () => {
        await trackingPage.goto();
      });
      await capture(page, {
        module,
        name: 'tracking-list',
        caption: '追踪与异常：申请单列表，输入申请单号查询后点击「详情」。',
        expected: '列表可按申请单号检索到本次申请单。',
      });

      await tryStep(module, 'open-tracking', async () => {
        await trackingPage.openApplicationTracking(runData.applicationNo);
      });
      await capture(page, {
        module,
        name: 'tracking-timeline',
        caption: '申请单追踪详情：展示当前节点（接收）、时间线事件与标本明细。',
        expected: '时间线事件可见，所有标本条码均展示。',
      });
    } catch (error) {
      logCaptureError(module, 'happy-tracking', error);
    } finally {
      await context.close();
    }
  }
}

async function captureM2AbnormalPath(browser: import('playwright/test').Browser) {
  const module = 'm2-specimen-workflow';
  const runData = createWorkflowRunData();
  const rejectReason = 'broken-container-e2e';
  let transportOrderId: string | undefined;
  let transportOrderNo: string | undefined;

  // 复用 happy-path 前置：创建登记 + 固定 + 转运 + 交接
  {
    const { context, page } = await openRolePage(
      browser,
      'creator',
      '/workflow/submission-registration',
    );
    try {
      const submissionPage = new SubmissionRegistrationPage(page);
      await tryStep(module, 'abnormal-goto-submission', async () => {
        await submissionPage.goto();
        await submissionPage.createApplicationAndOpenRegistration(runData);
        await submissionPage.registerSpecimens(runData);
      });
    } catch (error) {
      logCaptureError(module, 'abnormal-create-register', error);
    } finally {
      await context.close();
    }
  }
  {
    const { context, page } = await openRolePage(
      browser,
      'fixation',
      '/workflow/fixation-verify',
    );
    try {
      const workflowPage = new FixationTransportPage(page);
      await tryStep(module, 'abnormal-fixation', async () => {
        await workflowPage.gotoFixation();
        await workflowPage.startFixation(runData.barcodes[0]);
        await workflowPage.completeFixation(runData.barcodes[0]);
        await workflowPage.startFixation(runData.barcodes[1]);
        await workflowPage.completeFixation(runData.barcodes[1]);
        const order = await workflowPage.createTransportOrder([
          ...runData.barcodes,
        ]);
        transportOrderId = order.id;
        transportOrderNo = order.transportOrderNo;
      });
    } catch (error) {
      logCaptureError(module, 'abnormal-fixation-transport', error);
    } finally {
      await context.close();
    }
  }
  {
    const { context, page } = await openRolePage(
      browser,
      'transport',
      '/workflow/transport-handover',
    );
    try {
      const workflowPage = new FixationTransportPage(page);
      await tryStep(module, 'abnormal-transport', async () => {
        await workflowPage.gotoTransport();
        if (transportOrderNo) {
          await workflowPage.printTransportOrder(transportOrderNo);
          await workflowPage.handoverTransportOrder(transportOrderNo);
        }
      });
    } catch (error) {
      logCaptureError(module, 'abnormal-transport-handover', error);
    } finally {
      await context.close();
    }
  }

  // 异常接收：拒收其中一条标本
  {
    const { context, page } = await openRolePage(
      browser,
      'receive',
      '/workflow/pathology-receipt',
    );
    try {
      const receiptPage = new PathologyReceiptPage(page);
      await tryStep(module, 'abnormal-goto-receipt', async () => {
        await receiptPage.goto();
      });
      await tryStep(module, 'abnormal-reject', async () => {
        if (transportOrderId) {
          await receiptPage.rejectOneSpecimen(transportOrderId, rejectReason);
        }
      });
      await capture(page, {
        module,
        name: 'abnormal-receipt-result',
        caption: '异常接收：对其中一条标本选择拒收并填写原因，提交后结果为部分接收。',
        expected: '接收状态为 PARTIALLY_RECEIVED，未接收数为 1。',
      });
    } catch (error) {
      logCaptureError(module, 'abnormal-receive', error);
    } finally {
      await context.close();
    }
  }

  // 异常追踪：确认异常标记
  {
    const { context, page } = await openRolePage(
      browser,
      'tracking',
      '/workflow/tracking-exception',
    );
    try {
      const trackingPage = new TrackingExceptionPage(page);
      await tryStep(module, 'abnormal-goto-tracking', async () => {
        await trackingPage.goto();
        await trackingPage.openApplicationTracking(runData.applicationNo);
      });
      await capture(page, {
        module,
        name: 'abnormal-tracking-detail',
        caption: '异常追踪详情：展示异常明细、拒收标本状态与异常原因。',
        expected: '异常标记为真，拒收标本状态为 REJECTED，展示异常原因。',
      });
    } catch (error) {
      logCaptureError(module, 'abnormal-tracking', error);
    } finally {
      await context.close();
    }
  }
}

function pathToName(p: string) {
  return p.replace(/^\//, '').replaceAll('/', '_');
}
