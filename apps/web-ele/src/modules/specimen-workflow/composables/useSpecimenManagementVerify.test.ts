import type {
  ApplicationDetailView,
  LatestSpecimenRegistrationResult,
  SpecimenManagementListItem,
} from '../types/specimen-workflow';

import { computed, createApp, defineComponent, h, nextTick, ref } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  messageSuccessMock,
  messageWarningMock,
  mockCompleteFixation,
  mockGetApplicationDetail,
  mockGetLatestRegistrationResult,
  mockLoadWorkflowReferenceOptionsSafely,
  mockStartFixation,
} = vi.hoisted(() => ({
  messageSuccessMock: vi.fn(),
  messageWarningMock: vi.fn(),
  mockCompleteFixation: vi.fn(),
  mockGetApplicationDetail: vi.fn(),
  mockGetLatestRegistrationResult: vi.fn(),
  mockLoadWorkflowReferenceOptionsSafely: vi.fn(),
  mockStartFixation: vi.fn(),
}));

vi.mock('element-plus', () => ({
  ElMessage: {
    success: messageSuccessMock,
    warning: messageWarningMock,
  },
}));

vi.mock('#/modules/system-management/api/workflow-reference-service', () => ({
  createEmptyWorkflowReferenceOptions: () => ({
    clinicalSymptoms: [],
    collectionModes: [],
    containerNames: [],
    fixationLiquidTypes: [],
    specimenTypes: [],
  }),
  loadWorkflowReferenceOptionsSafely: mockLoadWorkflowReferenceOptionsSafely,
}));

vi.mock('../api/specimen-workflow-service', () => ({
  completeFixation: mockCompleteFixation,
  getApplicationDetail: mockGetApplicationDetail,
  getLatestRegistrationResult: mockGetLatestRegistrationResult,
  startFixation: mockStartFixation,
}));

import { useSpecimenManagementVerify } from './useSpecimenManagementVerify';

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
    labelPrintBatchNo: null,
    labelPrintStatus: 'SUCCESS',
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

function createLatestRegistrationResult(
  applicationId = 'APP-1',
): LatestSpecimenRegistrationResult {
  return {
    applicationId,
    labelPrintBatchNo: null,
    labelPrintMessage: null,
    labelPrintSuccess: true,
    registrationSnapshot: null,
    specimens: [],
  };
}

type HarnessOptions = {
  canQueryApplicationDetail?: boolean;
  canQueryWorkflowReference?: boolean;
  initialItems?: SpecimenManagementListItem[];
  loadSpecimensImpl?: (items: {
    value: SpecimenManagementListItem[];
  }) => Promise<void> | void;
};

function createHarness(options: HarnessOptions = {}) {
  let state: null | ReturnType<typeof useSpecimenManagementVerify> = null;

  const detailDrawerVisible = ref(false);
  const detailLoading = ref(false);
  const detailRow = ref<null | SpecimenManagementListItem>(null);
  const items = ref<SpecimenManagementListItem[]>(options.initialItems ?? []);
  const pageError = ref('');
  const loadSpecimens = vi.fn(async () => {
    await options.loadSpecimensImpl?.(items);
  });

  const Harness = defineComponent({
    setup() {
      state = useSpecimenManagementVerify({
        canQueryApplicationDetail: computed(
          () => options.canQueryApplicationDetail ?? true,
        ),
        canQueryWorkflowReference: computed(
          () => options.canQueryWorkflowReference ?? true,
        ),
        currentUserId: computed(() => 'USER-001'),
        currentUserName: computed(() => '测试用户'),
        detailDrawerVisible,
        detailLoading,
        detailRow,
        items,
        loadSpecimens,
        pageError,
      });
      return () => h('div');
    },
  });

  return {
    Harness,
    detailDrawerVisible,
    detailLoading,
    detailRow,
    getState: () => state,
    items,
    loadSpecimens,
    pageError,
  };
}

function mountComposable(options: HarnessOptions = {}) {
  const harness = createHarness(options);
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

describe('useSpecimenManagementVerify', () => {
  beforeEach(() => {
    mockCompleteFixation.mockResolvedValue(undefined);
    mockGetApplicationDetail.mockResolvedValue({
      applicationNo: 'APP-001',
    } as ApplicationDetailView);
    mockGetLatestRegistrationResult.mockResolvedValue(
      createLatestRegistrationResult(),
    );
    mockLoadWorkflowReferenceOptionsSafely.mockResolvedValue({
      clinicalSymptoms: [],
      collectionModes: [],
      containerNames: [],
      fixationLiquidTypes: [{ label: '福尔马林', value: 'FORMALIN' }],
      specimenTypes: [],
    });
    mockStartFixation.mockResolvedValue(undefined);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    messageSuccessMock.mockReset();
    messageWarningMock.mockReset();
    mockCompleteFixation.mockReset();
    mockGetApplicationDetail.mockReset();
    mockGetLatestRegistrationResult.mockReset();
    mockLoadWorkflowReferenceOptionsSafely.mockReset();
    mockStartFixation.mockReset();
  });

  it('skips application detail query without permission and prepares verify dialog options', async () => {
    const wrapper = mountComposable({
      canQueryApplicationDetail: false,
    });
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    await state.openDetailDrawer(createRow());
    await state.openVerifyDialog(createRow(), 'complete');

    expect(mockGetApplicationDetail).not.toHaveBeenCalled();
    expect(mockGetLatestRegistrationResult).toHaveBeenCalledWith('APP-1');
    expect(state.detailApplicationDetail.value).toBeNull();
    expect(state.detailLatestRegisterResult.value?.applicationId).toBe('APP-1');
    expect(state.verifyAction.value).toBe('complete');
    expect(state.verifyDialogVisible.value).toBe(true);
    expect(state.workflowReferenceOptions.value.fixationLiquidTypes).toEqual([
      { label: '福尔马林', value: 'FORMALIN' },
    ]);
    expect(mockLoadWorkflowReferenceOptionsSafely).toHaveBeenCalledWith({
      enabled: true,
    });
    expect(wrapper.detailLoading.value).toBe(false);

    wrapper.destroy();
  });

  it('warns before submitting when required verify fields are missing', async () => {
    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    state.verifyForm.specimenBarcode = ' ';
    state.verifyForm.specimenId = ' ';
    state.verifyForm.specimenNo = ' ';
    await state.submitVerify();

    state.verifyForm.specimenBarcode = 'BC-001';
    state.verifyForm.operatorName = ' ';
    await state.submitVerify();

    expect(messageWarningMock).toHaveBeenNthCalledWith(1, '缺少标本标识');
    expect(messageWarningMock).toHaveBeenNthCalledWith(2, '请选择核验人');
    expect(mockStartFixation).not.toHaveBeenCalled();
    expect(mockCompleteFixation).not.toHaveBeenCalled();

    wrapper.destroy();
  });

  it('submits verify request and refreshes the active detail row after reload', async () => {
    const currentRow = createRow();
    const refreshedRow = createRow({
      fixationStatus: 'FIXING',
      specimenStatus: 'FIXING',
    });
    const wrapper = mountComposable({
      initialItems: [currentRow],
      loadSpecimensImpl: async (items) => {
        items.value = [refreshedRow];
      },
    });
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    await state.openDetailDrawer(currentRow);
    await state.openVerifyDialog(currentRow, 'start');

    state.verifyForm.fixationLiquidType = 'FORMALIN';
    state.verifyForm.remarks = '需要立即处理';
    state.verifyForm.terminalCode = 'TERM-01';
    await state.submitVerify();

    expect(mockStartFixation).toHaveBeenCalledWith({
      fixationLiquidType: 'FORMALIN',
      remarks: '需要立即处理',
      specimenBarcode: 'BC-001',
      specimenId: 'SPEC-1',
      specimenNo: 'SP-001',
      terminalCode: 'TERM-01',
    });
    expect(messageSuccessMock).toHaveBeenCalledWith('标本 BC-001 已开始核验');
    expect(wrapper.loadSpecimens).toHaveBeenCalledTimes(1);
    expect(mockGetApplicationDetail).toHaveBeenCalledTimes(2);
    expect(wrapper.detailRow.value).toEqual(
      expect.objectContaining({
        specimenId: 'SPEC-1',
        specimenStatus: 'FIXING',
      }),
    );

    wrapper.destroy();
  });
});
