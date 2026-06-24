import type {
  CreateMedicalOrderQcEvaluationRequest,
  MedicalOrderSlidePrintResult,
  PendingMedicalOrderItem,
} from '../../doctor-workflow/types/doctor-workflow';

import { createApp, defineComponent, h, nextTick } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

const {
  downloadRoutineOrderBlobFileMock,
  messageSuccess,
  messageWarning,
  mockAcceptMedicalOrder,
  mockCompleteMedicalOrder,
  mockCreateMedicalOrderQcEvaluation,
  mockExportRoutineMedicalOrders,
  mockGetLatestMedicalOrderQcEvaluation,
  mockMergeRoutineMedicalOrderSlides,
  mockOpenRoutineOrderApplicationLabelPrintWindow,
  mockPrintMedicalOrderSlide,
  mockTerminateMedicalOrder,
  mockUnmergeRoutineMedicalOrderSlides,
  reloadSpy,
} = vi.hoisted(() => ({
  downloadRoutineOrderBlobFileMock: vi.fn(),
  messageSuccess: vi.fn(),
  messageWarning: vi.fn(),
  mockAcceptMedicalOrder: vi.fn(),
  mockCompleteMedicalOrder: vi.fn(),
  mockCreateMedicalOrderQcEvaluation: vi.fn(),
  mockExportRoutineMedicalOrders: vi.fn(),
  mockGetLatestMedicalOrderQcEvaluation: vi.fn(),
  mockMergeRoutineMedicalOrderSlides: vi.fn(),
  mockOpenRoutineOrderApplicationLabelPrintWindow: vi.fn(),
  mockPrintMedicalOrderSlide: vi.fn(),
  mockTerminateMedicalOrder: vi.fn(),
  mockUnmergeRoutineMedicalOrderSlides: vi.fn(),
  reloadSpy: vi.fn(),
}));

vi.mock('../utils/routine-order-download', () => ({
  downloadRoutineOrderBlobFile: downloadRoutineOrderBlobFileMock,
}));

vi.mock('../../doctor-workflow/api/doctor-workflow-service', () => ({
  acceptMedicalOrder: mockAcceptMedicalOrder,
  completeMedicalOrder: mockCompleteMedicalOrder,
  createMedicalOrderQcEvaluation: mockCreateMedicalOrderQcEvaluation,
  exportRoutineMedicalOrders: mockExportRoutineMedicalOrders,
  getLatestMedicalOrderQcEvaluation: mockGetLatestMedicalOrderQcEvaluation,
  mergeRoutineMedicalOrderSlides: mockMergeRoutineMedicalOrderSlides,
  printMedicalOrderSlide: mockPrintMedicalOrderSlide,
  terminateMedicalOrder: mockTerminateMedicalOrder,
  unmergeRoutineMedicalOrderSlides: mockUnmergeRoutineMedicalOrderSlides,
}));

vi.mock('element-plus', () => ({
  ElMessage: {
    success: messageSuccess,
    warning: messageWarning,
  },
}));

vi.mock('../utils/routine-order-print', () => ({
  openRoutineOrderPrintWindow: (labels: Array<Record<string, unknown>>) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      return false;
    }
    printWindow.document.open();
    printWindow.document.write(JSON.stringify(labels));
    printWindow.document.close();
    return true;
  },
}));

vi.mock('../utils/routine-order-label-print', () => ({
  openRoutineOrderApplicationLabelPrintWindow:
    mockOpenRoutineOrderApplicationLabelPrintWindow,
}));

vi.mock('../components/TechnicalWorkbenchPage.vue', () => ({
  default: defineComponent({
    props: ['config'],
    emits: ['query-action', 'selection-change', 'toolbar-action'],
    setup(_, { emit, expose }) {
      const queryState = {
        dateRange: [] as string[],
        searchKeyword: '',
        status: '',
      };

      expose({
        getQueryState: () => ({
          dateRange: [...queryState.dateRange],
          page: 1,
          pageSize: 30,
          searchKeyword: queryState.searchKeyword,
          status: queryState.status,
        }),
        reload: reloadSpy,
      });
      return () =>
        h('section', [
          h(
            'button',
            {
              'data-testid': 'select-ready-row',
              type: 'button',
              onClick: () => emit('selection-change', [createReadyRow()]),
            },
            'select-ready',
          ),
          h(
            'button',
            {
              'data-testid': 'select-legacy-row',
              type: 'button',
              onClick: () => emit('selection-change', [createLegacyRow()]),
            },
            'select-legacy',
          ),
          h(
            'button',
            {
              'data-testid': 'select-completed-row',
              type: 'button',
              onClick: () => emit('selection-change', [createCompletedRow()]),
            },
            'select-completed',
          ),
          h(
            'button',
            {
              'data-testid': 'select-terminated-row',
              type: 'button',
              onClick: () => emit('selection-change', [createTerminatedRow()]),
            },
            'select-terminated',
          ),
          h(
            'button',
            {
              'data-testid': 'select-non-printable-row',
              type: 'button',
              onClick: () =>
                emit('selection-change', [createNonPrintableRow()]),
            },
            'select-non-printable',
          ),
          h(
            'button',
            {
              'data-testid': 'select-two-ready-rows',
              type: 'button',
              onClick: () =>
                emit('selection-change', [
                  createReadyRow(),
                  createReadyRow({
                    id: 'ORDER-2',
                    orderId: 'ORDER-2',
                    pathologyNo: 'BL-002',
                    targetSlideId: 'SLIDE-2',
                  }),
                ]),
            },
            'select-two-ready',
          ),
          h(
            'button',
            {
              'data-testid': 'select-two-different-check-item-rows',
              type: 'button',
              onClick: () =>
                emit('selection-change', [
                  createReadyRow(),
                  createReadyRow({
                    checkItem: 'PAS染色',
                    id: 'ORDER-3',
                    orderId: 'ORDER-3',
                    pathologyNo: 'BL-003',
                    targetSlideId: 'SLIDE-3',
                  }),
                ]),
            },
            'select-two-different-check-item-rows',
          ),
          h(
            'button',
            {
              'data-testid': 'select-merged-group-rows',
              type: 'button',
              onClick: () =>
                emit('selection-change', [
                  createReadyRow({
                    id: 'ORDER-4',
                    orderId: 'ORDER-4',
                    slicingMergedPrintGroup: true,
                    slicingPrintGroupId: 'GROUP-1',
                  }),
                  createReadyRow({
                    id: 'ORDER-5',
                    orderId: 'ORDER-5',
                    slicingMergedPrintGroup: true,
                    slicingPrintGroupId: 'GROUP-2',
                  }),
                ]),
            },
            'select-merged-group-rows',
          ),
          h(
            'button',
            {
              'data-testid': 'set-export-query',
              type: 'button',
              onClick: () => {
                queryState.searchKeyword = 'BL-7788';
                queryState.status = 'IN_PROGRESS';
                queryState.dateRange = ['2026-06-20', '2026-06-21'];
              },
            },
            'set-export-query',
          ),
          h(
            'button',
            {
              'data-testid': 'toolbar-confirm',
              type: 'button',
              onClick: () =>
                emit('toolbar-action', {
                  action: { id: 'routine-confirm', label: '确认' },
                  selectedRows: [],
                }),
            },
            '确认',
          ),
          h(
            'button',
            {
              'data-testid': 'toolbar-print',
              type: 'button',
              onClick: () =>
                emit('toolbar-action', {
                  action: {
                    id: 'routine-print-slide',
                    label: '打印玻片',
                  },
                  selectedRows: [],
                }),
            },
            '打印玻片',
          ),
          h(
            'button',
            {
              'data-testid': 'toolbar-release',
              type: 'button',
              onClick: () =>
                emit('toolbar-action', {
                  action: { id: 'routine-release', label: '出片' },
                  selectedRows: [],
                }),
            },
            '出片',
          ),
          h(
            'button',
            {
              'data-testid': 'toolbar-terminate',
              type: 'button',
              onClick: () =>
                emit('toolbar-action', {
                  action: { id: 'routine-stop', label: '终止' },
                  selectedRows: [],
                }),
            },
            '终止',
          ),
          h(
            'button',
            {
              'data-testid': 'toolbar-print-label',
              type: 'button',
              onClick: () =>
                emit('toolbar-action', {
                  action: {
                    id: 'routine-print-label',
                    label: '打印申请单标签',
                  },
                  selectedRows: [],
                }),
            },
            '打印申请单标签',
          ),
          h(
            'button',
            {
              'data-testid': 'toolbar-merge',
              type: 'button',
              onClick: () =>
                emit('toolbar-action', {
                  action: { id: 'routine-merge', label: '相同项目合片' },
                  selectedRows: [],
                }),
            },
            '相同项目合片',
          ),
          h(
            'button',
            {
              'data-testid': 'toolbar-unmerge',
              type: 'button',
              onClick: () =>
                emit('toolbar-action', {
                  action: { id: 'routine-unmerge', label: '取消合片' },
                  selectedRows: [],
                }),
            },
            '取消合片',
          ),
          h(
            'button',
            {
              'data-testid': 'toolbar-export',
              type: 'button',
              onClick: () =>
                emit('toolbar-action', {
                  action: { id: 'routine-export', label: '导出Excel' },
                  selectedRows: [],
                }),
            },
            '导出Excel',
          ),
          h(
            'button',
            {
              'data-testid': 'toolbar-qc',
              type: 'button',
              onClick: () =>
                emit('toolbar-action', {
                  action: { id: 'routine-qc', label: '质控评价' },
                  selectedRows: [],
                }),
            },
            '质控评价',
          ),
        ]);
    },
  }),
}));

vi.mock('../components/RoutineOrderTerminationDialog.vue', () => ({
  default: defineComponent({
    props: ['modelValue'],
    emits: ['submit', 'update:modelValue'],
    setup(props, { emit }) {
      return () =>
        props.modelValue
          ? h(
              'button',
              {
                'data-testid': 'submit-termination-dialog',
                type: 'button',
                onClick: () =>
                  emit('submit', {
                    terminationReasonCode: 'BLOCK_NOT_FOUND',
                    terminationReasonLabel: '找不到对应蜡块',
                    terminationRemarks: '已核对无对应蜡块',
                  }),
              },
              'submit termination',
            )
          : null;
    },
  }),
}));

vi.mock('../components/RoutineOrderQcDrawer.vue', () => ({
  default: defineComponent({
    props: ['modelValue'],
    emits: ['active-row-change', 'submit', 'update:modelValue'],
    setup(props, { emit }) {
      return () =>
        props.modelValue
          ? h('div', [
              h(
                'button',
                {
                  'data-testid': 'emit-active-row-change',
                  type: 'button',
                  onClick: () => emit('active-row-change', createReadyRow()),
                },
                'active-row',
              ),
              h(
                'button',
                {
                  'data-testid': 'submit-qc-drawer',
                  type: 'button',
                  onClick: () =>
                    emit('submit', {
                      detailItems: [],
                      evaluationReason: '空气污染',
                      grade: '甲',
                      processingAction: 'FAST_REMAKE',
                      qcAspect: 'SLIDE',
                      remarks: '立即重打',
                      reworkType: 'RESLICE',
                      totalScore: 95,
                    } satisfies Omit<
                      CreateMedicalOrderQcEvaluationRequest,
                      'caseId' | 'orderId'
                    >),
                },
                'submit qc',
              ),
            ])
          : null;
    },
  }),
}));

import RoutineOrderWorkstationView from './RoutineOrderWorkstationView.vue';

function createReadyRow(
  overrides: Partial<PendingMedicalOrderItem> & Record<string, unknown> = {},
) {
  return {
    blockNo: 'A1',
    canConfirm: true,
    canPrint: true,
    canQc: true,
    canRelease: true,
    canTerminate: true,
    caseId: 'CASE-1',
    checkItem: 'HE染色',
    doctorTime: '2026-06-22 08:00:00',
    doctorUser: '医生甲',
    id: 'ORDER-1',
    orderId: 'ORDER-1',
    pathologyNo: 'BL-001',
    patientName: '患者甲',
    applicationNo: 'APP-001',
    releaseStatus: '待出片',
    slideNo: 'SLIDE-001',
    slicingMergedPrintGroup: false,
    slicingPrintGroupId: null,
    targetBlockId: 'BLOCK-1',
    targetSlideId: 'SLIDE-1',
    targetSpecimenId: 'SPEC-1',
    targetType: 'BLOCK',
    ...overrides,
  };
}

function createLegacyRow() {
  return createReadyRow({
    canPrint: true,
    canQc: true,
    targetBlockId: null,
    targetSlideId: null,
    targetSpecimenId: null,
    targetType: null,
  });
}

function createCompletedRow() {
  return createReadyRow({
    canConfirm: false,
    canPrint: false,
    canQc: false,
    canRelease: false,
    canTerminate: false,
    completedAt: '2026-06-23T10:00:00',
    releaseStatus: '已出片',
    status: 'COMPLETED',
  });
}

function createTerminatedRow() {
  return createReadyRow({
    canConfirm: false,
    canPrint: false,
    canQc: false,
    canRelease: false,
    canTerminate: false,
    status: 'TERMINATED',
    terminatedAt: '2026-06-23T11:00:00',
  });
}

function createNonPrintableRow() {
  return createReadyRow({
    canPrint: false,
  });
}

async function flushAll() {
  await Promise.resolve();
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

function mountView() {
  const root = document.createElement('div');
  document.body.append(root);
  const app = createApp({
    render: () => h(RoutineOrderWorkstationView),
  });
  app.mount(root);
  return { app, root };
}

function createPrintResult(orderId: string): MedicalOrderSlidePrintResult {
  return {
    labels: [
      {
        blockNo: 'A1',
        checkItem: 'HE染色',
        orderId,
        pathologyNo: orderId === 'ORDER-1' ? 'BL-001' : 'BL-002',
        patientId: orderId === 'ORDER-1' ? 'P-1' : 'P-2',
        patientIdDisplay: orderId === 'ORDER-1' ? '08305' : '08306',
        patientName: orderId === 'ORDER-1' ? '患者甲' : '患者乙',
        slideNo: orderId === 'ORDER-1' ? 'SLIDE-001' : 'SLIDE-002',
        specimenNo: orderId === 'ORDER-1' ? 'A1' : 'A2',
      },
    ],
    orderId,
    printedAt: '2026-06-22T10:00:00',
    printedByName: '技师甲',
  };
}

describe('RoutineOrderWorkstationView', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    downloadRoutineOrderBlobFileMock.mockReset();
    messageSuccess.mockReset();
    messageWarning.mockReset();
    mockAcceptMedicalOrder.mockReset();
    mockCompleteMedicalOrder.mockReset();
    mockCreateMedicalOrderQcEvaluation.mockReset();
    mockExportRoutineMedicalOrders.mockReset();
    mockGetLatestMedicalOrderQcEvaluation.mockReset();
    mockMergeRoutineMedicalOrderSlides.mockReset();
    mockOpenRoutineOrderApplicationLabelPrintWindow.mockReset();
    mockPrintMedicalOrderSlide.mockReset();
    mockTerminateMedicalOrder.mockReset();
    mockUnmergeRoutineMedicalOrderSlides.mockReset();
    reloadSpy.mockReset();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('confirms selected orders and reloads the workbench', async () => {
    mockAcceptMedicalOrder.mockResolvedValue({ orderId: 'ORDER-1' });
    const { app, root } = mountView();
    await flushAll();

    root
      .querySelector<HTMLButtonElement>('[data-testid="select-ready-row"]')
      ?.click();
    await flushAll();

    root
      .querySelector<HTMLButtonElement>('[data-testid="toolbar-confirm"]')
      ?.click();
    await flushAll();

    expect(mockAcceptMedicalOrder).toHaveBeenCalledWith('ORDER-1', {
      remarks: '常规医嘱确认',
      terminalCode: 'ROUTINE_ORDER_WORKSTATION',
    });
    expect(reloadSpy).toHaveBeenCalledTimes(1);
    expect(messageSuccess).toHaveBeenCalledWith('确认成功 1 条');

    app.unmount();
  });

  it('prints legacy orders when canPrint is true even without target snapshot', async () => {
    const writeMock = vi.fn();
    vi.spyOn(window, 'open').mockReturnValue({
      document: {
        close: vi.fn(),
        open: vi.fn(),
        write: writeMock,
      },
    } as unknown as Window);
    mockPrintMedicalOrderSlide.mockResolvedValue(createPrintResult('ORDER-1'));

    const { app, root } = mountView();
    await flushAll();

    root
      .querySelector<HTMLButtonElement>('[data-testid="select-legacy-row"]')
      ?.click();
    await flushAll();

    root
      .querySelector<HTMLButtonElement>('[data-testid="toolbar-print"]')
      ?.click();
    await flushAll();

    expect(mockPrintMedicalOrderSlide).toHaveBeenCalledWith('ORDER-1', {
      remarks: '常规医嘱打印玻片',
      terminalCode: 'ROUTINE_ORDER_WORKSTATION',
    });
    expect(writeMock).toHaveBeenCalledWith(expect.stringContaining('BL-001'));
    expect(reloadSpy).toHaveBeenCalledTimes(1);

    app.unmount();
  });

  it('prints regardless of the canPrint flag once orders are selected', async () => {
    const writeMock = vi.fn();
    vi.spyOn(window, 'open').mockReturnValue({
      document: {
        close: vi.fn(),
        open: vi.fn(),
        write: writeMock,
      },
    } as unknown as Window);
    mockPrintMedicalOrderSlide.mockResolvedValue(createPrintResult('ORDER-1'));

    const { app, root } = mountView();
    await flushAll();

    root
      .querySelector<HTMLButtonElement>(
        '[data-testid="select-non-printable-row"]',
      )
      ?.click();
    await flushAll();

    root
      .querySelector<HTMLButtonElement>('[data-testid="toolbar-print"]')
      ?.click();
    await flushAll();

    expect(messageWarning).not.toHaveBeenCalledWith(
      '选中医嘱中存在不可打印的数据，请重新选择',
    );
    expect(mockPrintMedicalOrderSlide).toHaveBeenCalledWith('ORDER-1', {
      remarks: '常规医嘱打印玻片',
      terminalCode: 'ROUTINE_ORDER_WORKSTATION',
    });
    expect(writeMock).toHaveBeenCalledWith(expect.stringContaining('BL-001'));
    expect(reloadSpy).toHaveBeenCalledTimes(1);

    app.unmount();
  });

  it('allows qc for legacy orders without target snapshot', async () => {
    const { app, root } = mountView();
    await flushAll();

    root
      .querySelector<HTMLButtonElement>('[data-testid="select-legacy-row"]')
      ?.click();
    await flushAll();

    root
      .querySelector<HTMLButtonElement>('[data-testid="toolbar-qc"]')
      ?.click();
    await flushAll();

    expect(messageWarning).not.toHaveBeenCalledWith(
      '选中医嘱中存在缺少目标快照的历史数据，无法执行质控评价',
    );
    expect(mockGetLatestMedicalOrderQcEvaluation).toHaveBeenCalledWith(
      'ORDER-1',
    );

    app.unmount();
  });

  it('allows qc for completed orders that are not terminated', async () => {
    const { app, root } = mountView();
    await flushAll();

    root
      .querySelector<HTMLButtonElement>('[data-testid="select-completed-row"]')
      ?.click();
    await flushAll();

    root
      .querySelector<HTMLButtonElement>('[data-testid="toolbar-qc"]')
      ?.click();
    await flushAll();

    expect(mockGetLatestMedicalOrderQcEvaluation).toHaveBeenCalledWith(
      'ORDER-1',
    );

    app.unmount();
  });

  it('still blocks qc for terminated orders', async () => {
    const { app, root } = mountView();
    await flushAll();

    root
      .querySelector<HTMLButtonElement>('[data-testid="select-terminated-row"]')
      ?.click();
    await flushAll();

    root
      .querySelector<HTMLButtonElement>('[data-testid="toolbar-qc"]')
      ?.click();
    await flushAll();

    expect(messageWarning).toHaveBeenCalledWith(
      '选中医嘱中存在不可质控评价的数据，请重新选择',
    );
    expect(mockGetLatestMedicalOrderQcEvaluation).not.toHaveBeenCalled();

    app.unmount();
  });

  it('shows selection warning before printing routine application labels', async () => {
    const { app, root } = mountView();
    await flushAll();

    root
      .querySelector<HTMLButtonElement>('[data-testid="toolbar-print-label"]')
      ?.click();
    await flushAll();

    expect(messageWarning).toHaveBeenCalledWith(
      '请先选择需要打印申请单标签的医嘱',
    );
    expect(
      mockOpenRoutineOrderApplicationLabelPrintWindow,
    ).not.toHaveBeenCalled();

    app.unmount();
  });

  it('blocks merging rows with different check items', async () => {
    const { app, root } = mountView();
    await flushAll();

    root
      .querySelector<HTMLButtonElement>(
        '[data-testid="select-two-different-check-item-rows"]',
      )
      ?.click();
    await flushAll();

    root
      .querySelector<HTMLButtonElement>('[data-testid="toolbar-merge"]')
      ?.click();
    await flushAll();

    expect(messageWarning).toHaveBeenCalledWith(
      '相同项目合片仅支持检查项目一致的医嘱',
    );
    expect(mockMergeRoutineMedicalOrderSlides).not.toHaveBeenCalled();

    app.unmount();
  });

  it('blocks unmerge for rows outside unprinted merged groups', async () => {
    const { app, root } = mountView();
    await flushAll();

    root
      .querySelector<HTMLButtonElement>('[data-testid="select-ready-row"]')
      ?.click();
    await flushAll();

    root
      .querySelector<HTMLButtonElement>('[data-testid="toolbar-unmerge"]')
      ?.click();
    await flushAll();

    expect(messageWarning).toHaveBeenCalledWith('取消合片只支持未打印合片组');
    expect(mockUnmergeRoutineMedicalOrderSlides).not.toHaveBeenCalled();

    app.unmount();
  });

  it('runs routine label print, merge, unmerge, and export actions then reloads', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-23T09:00:00Z'));
    mockOpenRoutineOrderApplicationLabelPrintWindow.mockReturnValue(true);
    mockMergeRoutineMedicalOrderSlides.mockResolvedValue({
      printGroupIds: ['GROUP-1'],
    });
    mockUnmergeRoutineMedicalOrderSlides.mockResolvedValue({
      printGroupIds: ['GROUP-1', 'GROUP-2'],
    });
    mockExportRoutineMedicalOrders.mockResolvedValue(
      new Blob(['csv'], { type: 'text/csv;charset=utf-8' }),
    );

    const { app, root } = mountView();
    await flushAll();

    root
      .querySelector<HTMLButtonElement>('[data-testid="select-ready-row"]')
      ?.click();
    await flushAll();

    root
      .querySelector<HTMLButtonElement>('[data-testid="toolbar-print-label"]')
      ?.click();
    await flushAll();

    expect(
      mockOpenRoutineOrderApplicationLabelPrintWindow,
    ).toHaveBeenCalledWith([
      expect.objectContaining({
        applicationNo: 'APP-001',
        id: 'ORDER-1',
        orderId: 'ORDER-1',
        pathologyNo: 'BL-001',
      }),
    ]);

    root
      .querySelector<HTMLButtonElement>('[data-testid="select-two-ready-rows"]')
      ?.click();
    await flushAll();

    root
      .querySelector<HTMLButtonElement>('[data-testid="toolbar-merge"]')
      ?.click();
    await flushAll();

    expect(mockMergeRoutineMedicalOrderSlides).toHaveBeenCalledWith([
      'ORDER-1',
      'ORDER-2',
    ]);

    root
      .querySelector<HTMLButtonElement>(
        '[data-testid="select-merged-group-rows"]',
      )
      ?.click();
    await flushAll();

    root
      .querySelector<HTMLButtonElement>('[data-testid="toolbar-unmerge"]')
      ?.click();
    await flushAll();

    expect(mockUnmergeRoutineMedicalOrderSlides).toHaveBeenCalledWith([
      'GROUP-1',
      'GROUP-2',
    ]);

    root
      .querySelector<HTMLButtonElement>('[data-testid="set-export-query"]')
      ?.click();
    await flushAll();

    root
      .querySelector<HTMLButtonElement>('[data-testid="toolbar-export"]')
      ?.click();
    await flushAll();

    expect(mockExportRoutineMedicalOrders).toHaveBeenCalledWith({
      dateFrom: '2026-06-20',
      dateTo: '2026-06-21',
      page: 1,
      pathologyNo: 'BL-7788',
      size: 9999,
      status: 'IN_PROGRESS',
      workDate: undefined,
    });
    expect(downloadRoutineOrderBlobFileMock).toHaveBeenCalledWith(
      expect.any(Blob),
      'routine-medical-orders-2026-06-23.csv',
    );
    expect(reloadSpy).toHaveBeenCalledTimes(4);

    app.unmount();
  });

  it('prints labels in batch and submits termination and qc actions', async () => {
    const writeMock = vi.fn();
    vi.spyOn(window, 'open').mockReturnValue({
      document: {
        close: vi.fn(),
        open: vi.fn(),
        write: writeMock,
      },
    } as unknown as Window);
    mockPrintMedicalOrderSlide.mockImplementation(async (orderId: string) =>
      createPrintResult(orderId),
    );
    mockTerminateMedicalOrder.mockResolvedValue({ orderId: 'ORDER-1' });
    mockCreateMedicalOrderQcEvaluation.mockResolvedValue({
      orderId: 'ORDER-1',
      qcEvaluationId: 'QC-1',
      totalScore: 95,
    });
    mockGetLatestMedicalOrderQcEvaluation.mockResolvedValue({
      orderId: 'ORDER-1',
      qcEvaluationId: 'QC-0',
      totalScore: 88,
    });

    const { app, root } = mountView();
    await flushAll();

    root
      .querySelector<HTMLButtonElement>('[data-testid="select-two-ready-rows"]')
      ?.click();
    await flushAll();

    root
      .querySelector<HTMLButtonElement>('[data-testid="toolbar-print"]')
      ?.click();
    await flushAll();

    expect(mockPrintMedicalOrderSlide).toHaveBeenCalledTimes(2);
    expect(window.open).toHaveBeenCalledWith('', '_blank');
    expect(writeMock).toHaveBeenCalledWith(expect.stringContaining('BL-001'));
    expect(writeMock).toHaveBeenCalledWith(expect.stringContaining('BL-002'));

    root
      .querySelector<HTMLButtonElement>('[data-testid="toolbar-terminate"]')
      ?.click();
    await flushAll();
    root
      .querySelector<HTMLButtonElement>(
        '[data-testid="submit-termination-dialog"]',
      )
      ?.click();
    await flushAll();

    expect(mockTerminateMedicalOrder).toHaveBeenCalledTimes(2);
    expect(mockTerminateMedicalOrder).toHaveBeenNthCalledWith(1, 'ORDER-1', {
      remarks: '已核对无对应蜡块',
      terminalCode: 'ROUTINE_ORDER_WORKSTATION',
      terminationReasonCode: 'BLOCK_NOT_FOUND',
      terminationReasonLabel: '找不到对应蜡块',
    });
    expect(mockTerminateMedicalOrder).toHaveBeenNthCalledWith(2, 'ORDER-2', {
      remarks: '已核对无对应蜡块',
      terminalCode: 'ROUTINE_ORDER_WORKSTATION',
      terminationReasonCode: 'BLOCK_NOT_FOUND',
      terminationReasonLabel: '找不到对应蜡块',
    });

    root
      .querySelector<HTMLButtonElement>('[data-testid="toolbar-qc"]')
      ?.click();
    await flushAll();

    expect(mockGetLatestMedicalOrderQcEvaluation).toHaveBeenCalledWith(
      'ORDER-1',
    );

    root
      .querySelector<HTMLButtonElement>('[data-testid="submit-qc-drawer"]')
      ?.click();
    await flushAll();

    expect(mockCreateMedicalOrderQcEvaluation).toHaveBeenCalledWith('ORDER-1', {
      caseId: 'CASE-1',
      detailItems: [],
      evaluationReason: '空气污染',
      grade: '甲',
      processingAction: 'FAST_REMAKE',
      qcAspect: 'SLIDE',
      remarks: '立即重打',
      reworkType: 'RESLICE',
      terminalCode: 'ROUTINE_ORDER_WORKSTATION',
      totalScore: 95,
    });

    app.unmount();
  });
});
