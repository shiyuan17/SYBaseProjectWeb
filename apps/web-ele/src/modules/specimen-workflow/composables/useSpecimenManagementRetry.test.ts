import type {
  SpecimenManagementListItem,
  SpecimenRegisterResult,
} from '../types/specimen-workflow';

import { computed, createApp, defineComponent, h, nextTick, ref } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

const { messageSuccessMock, messageWarningMock, mockRetryLabelPrint } =
  vi.hoisted(() => ({
    messageSuccessMock: vi.fn(),
    messageWarningMock: vi.fn(),
    mockRetryLabelPrint: vi.fn(),
  }));

vi.mock('element-plus', () => ({
  ElMessage: {
    success: messageSuccessMock,
    warning: messageWarningMock,
  },
}));

vi.mock('../api/specimen-workflow-service', () => ({
  retryLabelPrint: mockRetryLabelPrint,
}));

import { useSpecimenManagementRetry } from './useSpecimenManagementRetry';

function createRow(
  overrides: Partial<SpecimenManagementListItem> = {},
): SpecimenManagementListItem {
  return {
    abnormalFlag: false,
    applicationId: 'APP-1',
    applicationNo: 'APP-001',
    barcode: 'BC-001',
    containerCount: 1,
    containerName: '标本瓶',
    fixationStatus: 'REGISTERED',
    labelPrintBatchNo: 'BATCH-001',
    labelPrintStatus: 'FAILED',
    latestTrackingAt: '2026-06-01T09:00:00',
    patientName: '张三',
    registeredAt: '2026-06-01T08:30:00',
    specimenCount: 1,
    specimenId: 'SPEC-1',
    specimenName: '胃组织',
    specimenNo: 'SP-001',
    specimenSite: '胃',
    specimenStatus: 'REGISTERED',
    specimenType: '常规',
    submittingDepartmentId: 'DEP-1',
    submittingDepartmentName: '普外科',
    ...overrides,
  };
}

function createHarness() {
  let state: null | ReturnType<typeof useSpecimenManagementRetry> = null;
  const detailDrawerVisible = ref(true);
  const detailRow = ref<null | SpecimenManagementListItem>(createRow());
  const latestRegisterApplicationId = ref('APP-1');
  const latestRegisterResult = ref<null | SpecimenRegisterResult>({
    labelPrintBatchNo: 'BATCH-001',
    labelPrintMessage: null,
    labelPrintSuccess: false,
    specimens: [
      {
        abnormalReason: null,
        barcode: 'BC-001',
        containerCount: 1,
        containerName: '标本瓶',
        fixationStatus: 'REGISTERED',
        id: 'SPEC-1',
        labelPrintStatus: 'FAILED',
        specimenCount: 1,
        specimenName: '胃组织',
        specimenNo: 'SP-001',
        specimenSite: '胃',
        specimenStatus: 'REGISTERED',
        specimenType: '常规',
      },
    ],
  });
  const pageError = ref('');
  const selectedRows = ref<SpecimenManagementListItem[]>([]);
  const loadSpecimens = vi.fn(async () => {});
  const openDetailDrawer = vi.fn(async () => {});

  const Harness = defineComponent({
    setup() {
      state = useSpecimenManagementRetry({
        currentUserId: computed(() => 'USER-001'),
        currentUserName: computed(() => '测试用户'),
        detailDrawerVisible,
        detailRow,
        latestRegisterApplicationId,
        latestRegisterResult,
        loadSpecimens,
        openDetailDrawer,
        pageError,
        selectedRows,
      });
      return () => h('div');
    },
  });

  return {
    Harness,
    detailDrawerVisible,
    detailRow,
    getState: () => state,
    loadSpecimens,
    openDetailDrawer,
    pageError,
    selectedRows,
  };
}

function mountComposable() {
  const harness = createHarness();
  const root = document.createElement('div');
  document.body.append(root);

  const app = createApp(harness.Harness);
  app.mount(root);

  return {
    ...harness,
    destroy() {
      app.unmount();
      root.remove();
    },
  };
}

async function flushComposable() {
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

describe('useSpecimenManagementRetry', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    messageSuccessMock.mockReset();
    messageWarningMock.mockReset();
    mockRetryLabelPrint.mockReset();
  });

  it('opens retry dialog from selected rows and warns on empty selection', async () => {
    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    state.handleBulkRetry();
    expect(messageWarningMock).toHaveBeenCalledWith('请先选择需要补打的标本');

    wrapper.selectedRows.value = [createRow()];
    state.handleBulkRetry();

    expect(state.retryDialogVisible.value).toBe(true);
    expect(state.retryContext.batchNo).toBe('BATCH-001');
    expect(state.retrySelectionCount.value).toBe(1);
    expect(state.retrySourceLabel.value).toBe('批量补打标签');

    wrapper.destroy();
  });

  it('submits retry request and refreshes detail when current application matches', async () => {
    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    mockRetryLabelPrint.mockResolvedValue({
      allSuccessful: false,
      failedCount: 1,
      labelPrintBatchNo: 'BATCH-001',
      message: '已提交',
      retriedCount: 1,
      successCount: 0,
    });

    state.openRetryDialogFromLatestResult();
    state.retryForm.printerCode = 'PRINTER-1';
    await state.submitRetry();

    expect(mockRetryLabelPrint).toHaveBeenCalledWith('BATCH-001', {
      printerCode: 'PRINTER-1',
      remarks: null,
      terminalCode: null,
    });
    expect(messageSuccessMock).toHaveBeenCalledWith('批次补打已提交');
    expect(wrapper.loadSpecimens).toHaveBeenCalledTimes(1);
    expect(wrapper.openDetailDrawer).toHaveBeenCalledWith(
      expect.objectContaining({ applicationId: 'APP-1' }),
    );

    wrapper.destroy();
  });
});
