import type {
  SlicingWorkbenchRow,
  SlicingWorkbenchView,
} from '../types/technical-workflow';

import {
  createApp,
  defineComponent,
  h,
  inject,
  nextTick,
  onMounted,
  provide,
  watch,
} from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockGetSlicingWorkbench,
  mockGetTechnicalTracking,
  mockCancelSlicingSlidePrintMergeGroups,
  mockCreateSlicingSlidePrintMergeGroups,
  mockPrintSlicingSlideMergeGroup,
  mockPrintSlicingSlides,
  mockRoute,
  mockStartSlicing,
  mockUpdateTechnicalTaskRemarks,
} = vi.hoisted(() => ({
  mockGetSlicingWorkbench: vi.fn(),
  mockGetTechnicalTracking: vi.fn(),
  mockCancelSlicingSlidePrintMergeGroups: vi.fn(),
  mockCreateSlicingSlidePrintMergeGroups: vi.fn(),
  mockPrintSlicingSlideMergeGroup: vi.fn(),
  mockPrintSlicingSlides: vi.fn(),
  mockRoute: {
    query: {},
  } as { query: Record<string, string> },
  mockStartSlicing: vi.fn(),
  mockUpdateTechnicalTaskRemarks: vi.fn(),
}));

const rowContextKey = Symbol('slicing-row-context');

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
}));

vi.mock('@vben/common-ui', () => ({
  Page: defineComponent({
    props: ['description', 'title'],
    setup(props, { slots }) {
      return () =>
        h('main', [
          props.title ? h('h1', props.title) : null,
          props.description ? h('p', props.description) : null,
          slots.default?.(),
        ]);
    },
  }),
}));

vi.mock('@vben/stores', () => ({
  useUserStore: () => ({
    userInfo: {
      realName: '测试技师',
      userId: 'USER-001',
      username: 'tester',
    },
  }),
}));

vi.mock('#/utils/error-feedback', () => ({
  reportInlineErrorDisabled: vi.fn(),
}));

vi.mock('../api/technical-workflow-service', () => ({
  cancelSlicingSlidePrintMergeGroups: mockCancelSlicingSlidePrintMergeGroups,
  createSlicingSlidePrintMergeGroups: mockCreateSlicingSlidePrintMergeGroups,
  getSlicingWorkbench: mockGetSlicingWorkbench,
  getTechnicalTracking: mockGetTechnicalTracking,
  printSlicingSlideMergeGroup: mockPrintSlicingSlideMergeGroup,
  printSlicingSlides: mockPrintSlicingSlides,
  startSlicing: mockStartSlicing,
  updateTechnicalTaskRemarks: mockUpdateTechnicalTaskRemarks,
}));

vi.mock('../components/EmbeddingQualityReviewDialog.vue', () => ({
  default: defineComponent({
    setup() {
      return () => null;
    },
  }),
}));

vi.mock('../components/SlicingProcessDialog.vue', () => ({
  default: defineComponent({
    setup() {
      return () => null;
    },
  }),
}));

vi.mock('../components/SlicingQcEvaluationDialog.vue', () => ({
  default: defineComponent({
    setup() {
      return () => null;
    },
  }),
}));

vi.mock('../components/TechnicalTaskStartDialog.vue', () => ({
  default: defineComponent({
    setup() {
      return () => null;
    },
  }),
}));

vi.mock('../components/TechnicalTrackingDetailsSection.vue', () => ({
  default: defineComponent({
    setup() {
      return () => null;
    },
  }),
}));

vi.mock('../components/TechnicalTrackingSummaryTables.vue', () => ({
  default: defineComponent({
    setup() {
      return () => null;
    },
  }),
}));

vi.mock('element-plus', () => {
  const simple = (tag = 'div') =>
    defineComponent({
      props: ['disabled', 'modelValue', 'title'],
      emits: ['change', 'click', 'update:modelValue'],
      setup(props, { attrs, emit, slots }) {
        return () =>
          h(
            tag,
            {
              ...attrs,
              disabled: props.disabled,
              type: tag === 'button' ? 'button' : undefined,
              onClick: (event: MouseEvent) => emit('click', event),
            },
            slots.default?.() ?? props.title,
          );
      },
    });

  return {
    ElAlert: simple('section'),
    ElButton: simple('button'),
    ElCheckbox: simple('label'),
    ElDatePicker: simple('input'),
    ElDrawer: simple('section'),
    ElInput: simple('input'),
    ElInputNumber: simple('input'),
    ElMessage: {
      success: vi.fn(),
      warning: vi.fn(),
    },
    ElOption: simple('option'),
    ElPagination: simple('nav'),
    ElSelect: simple('select'),
    ElSwitch: simple('label'),
    ElTabPane: simple('section'),
    ElTabs: simple('section'),
    ElTable: defineComponent({
      props: ['data'],
      emits: ['selection-change'],
      setup(props, { emit, expose, slots }) {
        const emitSelection = () => {
          emit('selection-change', props.data ?? []);
        };
        onMounted(emitSelection);
        watch(() => props.data, emitSelection);
        expose({
          clearSelection: vi.fn(),
          toggleRowSelection: vi.fn(),
        });
        return () =>
          h('div', [
            ...(props.data ?? []).map(
              (
                row: {
                  embeddingBoxNo?: null | string;
                  embeddingRemarks?: null | string;
                  submittingDepartmentName?: null | string;
                  taskId?: string;
                },
                index: number,
              ) =>
                h(
                  defineComponent({
                    setup(_, { slots: providerSlots }) {
                      provide(rowContextKey, {
                        $index: index,
                        row,
                      });
                      return () => h('div', providerSlots.default?.());
                    },
                  }),
                  { key: index },
                  {
                    default: () => [
                      slots.default?.(),
                      h(
                        'div',
                        [
                          row.taskId,
                          row.embeddingBoxNo,
                          row.embeddingRemarks,
                          row.submittingDepartmentName,
                        ]
                          .filter(Boolean)
                          .join(' '),
                      ),
                    ],
                  },
                ),
            ),
          ]);
      },
    }),
    ElTableColumn: defineComponent({
      props: ['label'],
      setup(props, { slots }) {
        const rowContext = inject<null | { $index: number; row: unknown }>(
          rowContextKey,
          null,
        );
        return () =>
          h('section', [
            props.label,
            slots.default?.({
              $index: rowContext?.$index ?? 0,
              row: rowContext?.row ?? {},
            }),
          ]);
      },
    }),
    ElTag: simple('span'),
  };
});

vi.mock('../utils/tracking', () => ({
  buildTrackingTreeData: vi.fn(() => []),
  buildWorkflowTimelineSteps: vi.fn(() => []),
  filterTrackingQcEvaluations: vi.fn(() => []),
  filterTrackingReworks: vi.fn(() => []),
  filterTrackingTasks: vi.fn(() => []),
  resolveSelectedTrackingNodeId: vi.fn(() => ''),
}));

import SlicingWorkstationView from './SlicingWorkstationView.vue';

function createWorkbench(): SlicingWorkbenchView {
  return {
    completedPage: 1,
    completedSize: 20,
    completedTodayList: [],
    completedTotal: 0,
    pendingList: [
      {
        applicationType: 'ROUTINE',
        caseId: 'CASE-1',
        combinedSlide: false,
        completedAt: null,
        embeddingBoxId: 'BOX-1',
        embeddingBoxIds: ['BOX-1'],
        embeddingBoxNo: 'A1',
        embeddingClearRemark: null,
        embeddingRemarks: '包埋备注',
        embeddingEvaluation: null,
        embeddingOperatorName: null,
        grossingEvaluation: null,
        pathologyNo: 'BL-001',
        patientId: 'P-001',
        patientIdDisplay: '08305',
        patientName: '患者甲',
        printGroupId: null,
        selectable: true,
        shiftRemark: null,
        slideId: 'SLIDE-1',
        slideNo: 'SLIDE-001',
        slidePrintStatus: 'PENDING',
        sliceNotice: null,
        slicingOperatorName: null,
        slicingRemark: null,
        specimenId: 'SPEC-1',
        specimenName: '胃窦',
        submittingDepartmentName: '急诊科',
        taskId: 'TASK-1',
        taskIds: ['TASK-1'],
        taskStatus: 'PENDING',
        timedOut: false,
        mergedPrintGroup: false,
        printedSlideCount: 0,
      },
    ],
    pendingPrintList: [
      {
        applicationType: 'ROUTINE',
        caseId: 'CASE-1',
        combinedSlide: false,
        completedAt: null,
        embeddingBoxId: 'BOX-1',
        embeddingBoxIds: ['BOX-1'],
        embeddingBoxNo: 'A1',
        embeddingClearRemark: null,
        embeddingRemarks: '包埋备注',
        embeddingEvaluation: null,
        embeddingOperatorName: null,
        grossingEvaluation: null,
        pathologyNo: 'BL-001',
        patientId: 'P-001',
        patientIdDisplay: '08305',
        patientName: '患者甲',
        printGroupId: null,
        selectable: true,
        shiftRemark: null,
        slideId: null,
        slideNo: null,
        slidePrintStatus: 'PENDING',
        sliceNotice: null,
        slicingOperatorName: null,
        slicingRemark: null,
        specimenId: 'SPEC-1',
        specimenName: '胃窦',
        submittingDepartmentName: '急诊科',
        taskId: 'TASK-1',
        taskIds: ['TASK-1'],
        taskStatus: 'PENDING',
        timedOut: false,
        mergedPrintGroup: false,
        printedSlideCount: 0,
      },
    ],
    pendingPrintTotal: 1,
    pendingPage: 1,
    pendingSize: 20,
    pendingSliceList: [],
    pendingSliceTotal: 0,
    pendingTotal: 1,
    stats: {
      completedDeptTodayCount: 0,
      completedMineTodayCount: 0,
      overdueCount: 0,
      pendingPrintCount: 0,
      pendingTodayCount: 1,
      pendingTomorrowCount: 0,
    },
  };
}

function createBatchPrintWorkbench(): SlicingWorkbenchView {
  const workbench = createWorkbench();
  const baseRow = workbench.pendingPrintList[0];
  if (!baseRow) {
    throw new Error('缺少批量打印测试基准行');
  }
  const secondRow: SlicingWorkbenchRow = {
    ...baseRow,
    embeddingBoxId: 'BOX-2',
    embeddingBoxIds: ['BOX-2'],
    embeddingBoxNo: 'A2',
    pathologyNo: 'BL-002',
    patientId: 'P-002',
    patientIdDisplay: '08306',
    patientName: '患者乙',
    specimenName: '皮肤',
    taskId: 'TASK-2',
    taskIds: ['TASK-2'],
  };
  return {
    ...workbench,
    pendingList: [...workbench.pendingList, secondRow],
    pendingPrintList: [...workbench.pendingPrintList, secondRow],
    pendingPrintTotal: 2,
    pendingTotal: 2,
  };
}

function createMergedPrintWorkbench(): SlicingWorkbenchView {
  const workbench = createWorkbench();
  const baseRow = workbench.pendingPrintList[0];
  if (!baseRow) {
    throw new Error('缺少合片打印测试基准行');
  }
  const mergedRow: SlicingWorkbenchRow = {
    ...baseRow,
    embeddingBoxId: 'BOX-1',
    embeddingBoxIds: ['BOX-1', 'BOX-2'],
    embeddingBoxNo: 'A1+A2',
    mergedPrintGroup: true,
    printGroupId: 'GROUP-1',
    taskId: 'TASK-1',
    taskIds: ['TASK-1', 'TASK-2'],
  };
  return {
    ...workbench,
    pendingList: [mergedRow],
    pendingPrintList: [mergedRow],
    pendingPrintTotal: 1,
    pendingTotal: 1,
  };
}

async function flushView() {
  await Promise.resolve();
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

function mountView() {
  const root = document.createElement('div');
  document.body.append(root);
  const app = createApp({
    render: () => h(SlicingWorkstationView),
  });
  app.directive('loading', {});
  app.mount(root);
  return { app, root };
}

describe('SlicingWorkstationView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-17T09:00:00'));
    mockRoute.query = {};
    document.body.innerHTML = '';
    mockGetSlicingWorkbench.mockResolvedValue(createWorkbench());
    mockGetTechnicalTracking.mockResolvedValue({
      blocks: [],
      caseId: 'CASE-1',
      caseStatus: 'SLICING',
      embeddingBoxes: [],
      embeddingEvaluationRecords: [],
      embeddingRecords: [],
      events: [],
      pathologyNo: 'BL-001',
      qcEvaluations: [],
      reworks: [],
      slides: [],
      specimens: [],
      technicalTasks: [],
    });
    mockPrintSlicingSlides.mockResolvedValue({
      merged: false,
      printedSlideCount: 1,
      slideIds: ['SLIDE-1'],
      slideNos: ['SLIDE-001'],
      slicingId: 'SLICING-1',
      taskId: 'TASK-1',
    });
    mockPrintSlicingSlideMergeGroup.mockResolvedValue({
      merged: true,
      printedSlideCount: 1,
      slideIds: ['SLIDE-GROUP-1'],
      slideNos: ['SLIDE-GROUP-001'],
      slicingId: 'SLICING-GROUP-1',
      taskId: 'TASK-1',
    });
    mockCreateSlicingSlidePrintMergeGroups.mockResolvedValue({
      printGroupIds: ['GROUP-1'],
    });
    mockCancelSlicingSlidePrintMergeGroups.mockResolvedValue({
      printGroupIds: ['GROUP-1'],
    });
    mockStartSlicing.mockResolvedValue({});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('queries workbench without date filters by default', async () => {
    const { app, root } = mountView();
    await flushView();

    expect(mockGetSlicingWorkbench).toHaveBeenCalledWith(
      expect.not.objectContaining({
        dateFrom: expect.any(String),
        dateTo: expect.any(String),
        workDate: expect.any(String),
      }),
    );

    app.unmount();
    root.remove();
  });

  it('uses route workDate when querying workbench from deep link', async () => {
    mockRoute.query = { workDate: '2026-06-01' };

    const { app, root } = mountView();
    await flushView();

    expect(mockGetSlicingWorkbench).toHaveBeenCalledWith(
      expect.objectContaining({
        dateFrom: '2026-06-01',
        dateTo: '2026-06-01',
        workDate: undefined,
      }),
    );

    app.unmount();
    root.remove();
  });

  it('hides placeholder actions while keeping the primary slicing flow visible', async () => {
    const { app, root } = mountView();
    await flushView();

    expect(document.body.textContent).toContain('完成切片');
    expect(document.body.textContent).toContain('玻片打印');
    expect(document.body.textContent).toContain('两两合片');
    expect(document.body.textContent).toContain('取消合片');
    expect(document.body.textContent).toContain('打印玻片');
    expect(document.body.textContent).toContain('蜡块号');
    expect(document.body.textContent).toContain('A1');
    expect(document.body.textContent).toContain('包埋备注');
    expect(document.body.textContent).toContain('申请科室');
    expect(document.body.textContent).toContain('急诊科');
    expect(document.body.textContent).toContain('今日已完成');
    expect(document.body.textContent).not.toContain('玻片数量');
    expect(document.body.textContent).not.toContain('打印机编码');
    expect(document.body.textContent).not.toContain('打印备注');
    expect(document.body.textContent).not.toContain('只看今天待切');
    expect(document.body.textContent).not.toContain('先打印玻片');
    expect(document.body.textContent).not.toContain('近邻合并');
    expect(document.body.textContent).not.toContain(
      '参照旧站结构重排为顶部统计查询',
    );
    expect(document.body.textContent).not.toContain('待补后端能力');
    expect(document.body.textContent).not.toContain('重打玻片');
    expect(document.body.textContent).not.toContain('取消完成');
    expect(document.body.textContent).not.toContain('SLIDE-001');
    const buttonTexts = [...root.querySelectorAll('button')].map(
      (button) => button.textContent ?? '',
    );
    expect(
      buttonTexts.findIndex((text) => text.includes('两两合片')),
    ).toBeLessThan(buttonTexts.findIndex((text) => text.includes('打印玻片')));
    expect(
      buttonTexts.findIndex((text) => text.includes('取消合片')),
    ).toBeLessThan(buttonTexts.findIndex((text) => text.includes('打印玻片')));

    app.unmount();
    root.remove();
  });

  it('shows merged slide display number with hyphen when falling back to embedding box no', async () => {
    const mergedWorkbench = createWorkbench();
    mergedWorkbench.pendingSliceList = [
      {
        ...mergedWorkbench.pendingList[0]!,
        embeddingBoxNo: 'A1+A2',
        slideNo: null,
      },
    ];
    mergedWorkbench.pendingSliceTotal = 1;
    mergedWorkbench.completedTodayList = [
      {
        ...mergedWorkbench.pendingList[0]!,
        completedAt: '2026-06-17T09:30:00',
        embeddingBoxNo: 'A1+A2',
        slideNo: null,
        slidePrintStatus: 'PRINTED',
        slicingOperatorName: '技师甲',
        taskStatus: 'COMPLETED',
      },
    ];
    mergedWorkbench.completedTotal = 1;
    mockGetSlicingWorkbench.mockResolvedValue(mergedWorkbench);

    const { app, root } = mountView();
    await flushView();

    expect(document.body.textContent).toContain('A1-A2');
    expect(document.body.textContent).toContain('A1+A2');

    app.unmount();
    root.remove();
  });

  it('prints selected slide rows in batch without switching to the slicing tab', async () => {
    const writeMock = vi.fn();
    const printWindowMock = {
      close: vi.fn(),
      document: {
        close: vi.fn(),
        open: vi.fn(),
        write: writeMock,
      },
    } as unknown as Window;
    vi.spyOn(window, 'open').mockReturnValue(printWindowMock);

    mockGetSlicingWorkbench.mockResolvedValue(createBatchPrintWorkbench());
    mockPrintSlicingSlides.mockImplementation(async ({ taskId }) => ({
      merged: false,
      printedSlideCount: 1,
      slideIds: [`SLIDE-${taskId}`],
      slideNos: [`SLIDE-${taskId}`],
      slicingId: `SLICING-${taskId}`,
      taskId,
    }));

    const { app, root } = mountView();
    await flushView();

    const printButton = [...root.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('打印玻片'),
    );
    expect(printButton).toBeTruthy();
    if (!printButton) {
      throw new Error('未找到打印玻片按钮');
    }
    printButton.click();
    await flushView();
    await flushView();

    expect(window.open).toHaveBeenCalledWith('', '_blank');
    expect(mockPrintSlicingSlides).toHaveBeenCalledTimes(2);
    expect(mockPrintSlicingSlides).toHaveBeenNthCalledWith(1, {
      embeddingBoxId: 'BOX-1',
      mergeAdjacent: false,
      printerCode: null,
      remarks: null,
      sourceSlideCount: 1,
      taskId: 'TASK-1',
    });
    expect(mockPrintSlicingSlides).toHaveBeenNthCalledWith(2, {
      embeddingBoxId: 'BOX-2',
      mergeAdjacent: false,
      printerCode: null,
      remarks: null,
      sourceSlideCount: 1,
      taskId: 'TASK-2',
    });
    expect(writeMock).toHaveBeenCalledWith(expect.stringContaining('BL-001'));
    expect(writeMock).toHaveBeenCalledWith(expect.stringContaining('BL-002'));
    expect(writeMock).toHaveBeenCalledWith(expect.stringContaining('08305'));
    expect(writeMock).toHaveBeenCalledWith(expect.stringContaining('08306'));
    expect(document.body.textContent).toContain('蜡块号');
    expect(document.body.textContent).not.toContain(
      '只展示已完成玻片打印的待切任务',
    );

    app.unmount();
    root.remove();
  });

  it('creates print merge groups for selected ordinary pending print rows', async () => {
    mockGetSlicingWorkbench.mockResolvedValue(createBatchPrintWorkbench());

    const { app, root } = mountView();
    await flushView();

    const mergeButton = [...root.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('两两合片'),
    );
    expect(mergeButton).toBeTruthy();
    if (!mergeButton) {
      throw new Error('未找到两两合片按钮');
    }
    mergeButton.click();
    await flushView();
    await flushView();

    expect(mockCreateSlicingSlidePrintMergeGroups).toHaveBeenCalledWith({
      remarks: null,
      taskIds: ['TASK-1', 'TASK-2'],
      terminalCode: null,
    });

    app.unmount();
    root.remove();
  });

  it('cancels selected pending print merge groups', async () => {
    mockGetSlicingWorkbench.mockResolvedValue(createMergedPrintWorkbench());

    const { app, root } = mountView();
    await flushView();

    const cancelButton = [...root.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('取消合片'),
    );
    expect(cancelButton).toBeTruthy();
    if (!cancelButton) {
      throw new Error('未找到取消合片按钮');
    }
    cancelButton.click();
    await flushView();
    await flushView();

    expect(mockCancelSlicingSlidePrintMergeGroups).toHaveBeenCalledWith({
      printGroupIds: ['GROUP-1'],
      remarks: null,
      terminalCode: null,
    });

    app.unmount();
    root.remove();
  });

  it('prints selected merged group rows with merged embedding box label', async () => {
    const writeMock = vi.fn();
    const printWindowMock = {
      close: vi.fn(),
      document: {
        close: vi.fn(),
        open: vi.fn(),
        write: writeMock,
      },
    } as unknown as Window;
    vi.spyOn(window, 'open').mockReturnValue(printWindowMock);
    mockGetSlicingWorkbench.mockResolvedValue(createMergedPrintWorkbench());

    const { app, root } = mountView();
    await flushView();

    expect(document.body.textContent).toContain('A1+A2');
    const printButton = [...root.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('打印玻片'),
    );
    expect(printButton).toBeTruthy();
    if (!printButton) {
      throw new Error('未找到打印玻片按钮');
    }
    printButton.click();
    await flushView();
    await flushView();

    expect(mockPrintSlicingSlideMergeGroup).toHaveBeenCalledWith({
      printGroupId: 'GROUP-1',
      printerCode: null,
      remarks: null,
      terminalCode: null,
    });
    expect(mockPrintSlicingSlides).not.toHaveBeenCalled();
    expect(writeMock).toHaveBeenCalledWith(expect.stringContaining('A1+A2'));

    app.unmount();
    root.remove();
  });

  it('allows copying patient and pathology identifiers from the slicing tables', async () => {
    const clipboardWriteText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: clipboardWriteText,
      },
    });

    const { app, root } = mountView();
    await flushView();

    const pathologyTrigger = root.querySelector(
      '[title="点击复制病理号"]',
    ) as HTMLElement | null;
    const patientTrigger = root.querySelector(
      '[title="点击复制病人ID"]',
    ) as HTMLElement | null;

    expect(pathologyTrigger).not.toBeNull();
    expect(patientTrigger).not.toBeNull();

    pathologyTrigger?.click();
    patientTrigger?.click();
    await flushView();

    expect(clipboardWriteText).toHaveBeenNthCalledWith(1, 'BL-001');
    expect(clipboardWriteText).toHaveBeenNthCalledWith(2, '08305');

    app.unmount();
    root.remove();
  });
});
