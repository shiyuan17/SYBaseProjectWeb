import type { SpecimenManagementListItem } from '../types/specimen-workflow';

import { createApp, defineComponent, h, nextTick } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  messageSuccessMock,
  messageWarningMock,
  mockAccessStore,
  mockCompleteFixation,
  mockGetApplicationDetail,
  mockGetLatestRegistrationResult,
  mockListSpecimens,
  mockLoadWorkflowReferenceOptionsSafely,
  mockRetryLabelPrint,
  mockRoute,
  mockRouter,
  mockStartFixation,
  mockUserStore,
} = vi.hoisted(() => ({
  messageSuccessMock: vi.fn(),
  messageWarningMock: vi.fn(),
  mockAccessStore: {
    accessCodes: [] as string[],
  },
  mockCompleteFixation: vi.fn(),
  mockGetApplicationDetail: vi.fn(),
  mockGetLatestRegistrationResult: vi.fn(),
  mockListSpecimens: vi.fn(),
  mockLoadWorkflowReferenceOptionsSafely: vi.fn(),
  mockRetryLabelPrint: vi.fn(),
  mockRoute: {
    query: {
      action: 'register',
      applicationId: 'APP-ID',
    } as Record<string, string>,
  },
  mockRouter: {
    push: vi.fn(),
  },
  mockStartFixation: vi.fn(),
  mockUserStore: {
    userInfo: {
      realName: '测试用户',
      userId: 'USER-001',
    },
  },
}));

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => mockRouter,
}));

vi.mock('@vben/stores', () => ({
  useAccessStore: () => mockAccessStore,
  useUserStore: () => mockUserStore,
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
  listSpecimens: mockListSpecimens,
  retryLabelPrint: mockRetryLabelPrint,
  startFixation: mockStartFixation,
}));

import { useSpecimenManagementPage } from './useSpecimenManagementPage';

function createRow(
  overrides: Partial<SpecimenManagementListItem> = {},
): SpecimenManagementListItem {
  return {
    abnormalFlag: false,
    applicationId: 'APP-ID',
    applicationNo: 'APP-001',
    barcode: 'BC-001',
    containerCount: 1,
    containerName: '标本瓶',
    fixationStatus: 'REGISTERED',
    labelPrintBatchNo: null,
    labelPrintStatus: 'SUCCESS',
    latestTrackingAt: '2026-05-31T10:00:00',
    patientName: '张三',
    registeredAt: '2026-05-31T09:30:00',
    specimenCount: 1,
    specimenId: 'SPEC-001',
    specimenName: '右侧肿物',
    specimenNo: 'SP-001',
    specimenSite: '胸部',
    specimenStatus: 'REGISTERED',
    specimenType: '常规',
    submittingDepartmentId: 'DEP-1',
    submittingDepartmentName: '外科',
    ...overrides,
  };
}

function createHarness(
  props: Partial<Parameters<typeof useSpecimenManagementPage>[0]> = {},
) {
  let state: null | ReturnType<typeof useSpecimenManagementPage> = null;

  const Harness = defineComponent({
    setup() {
      state = useSpecimenManagementPage({
        embedded: false,
        registrationApplicationId: '',
        registrationTriggerKey: 0,
        ...props,
      });
      return () => h('div');
    },
  });

  return {
    Harness,
    getState: () => state,
  };
}

function mountComposable(
  props: Partial<Parameters<typeof useSpecimenManagementPage>[0]> = {},
) {
  const { Harness, getState } = createHarness(props);
  const root = document.createElement('div');
  document.body.append(root);

  const app = createApp(Harness);
  app.mount(root);

  return {
    destroy() {
      app.unmount();
      root.remove();
    },
    getState,
  };
}

async function flushComposable() {
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

describe('useSpecimenManagementPage', () => {
  beforeEach(() => {
    mockAccessStore.accessCodes = [
      'PERM_APPLICATION_DETAIL_QUERY',
      'PERM_FIXATION_VERIFY',
      'PERM_SPECIMEN_REGISTER',
      'PERM_WORKFLOW_REFERENCE_QUERY',
    ];
    mockGetApplicationDetail.mockResolvedValue({
      applicationNo: 'APP-001',
    });
    mockGetLatestRegistrationResult.mockResolvedValue(null);
    mockListSpecimens.mockResolvedValue({
      items: [],
      page: 1,
      size: 20,
      summary: {
        abnormalCount: 0,
        labelPrintedCount: 0,
        pendingLabelCount: 0,
        totalCount: 0,
      },
      total: 0,
    });
    mockLoadWorkflowReferenceOptionsSafely.mockResolvedValue({
      clinicalSymptoms: [],
      collectionModes: [],
      containerNames: [],
      fixationLiquidTypes: [{ label: '福尔马林', value: 'FORMALIN' }],
      specimenTypes: [],
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
    mockAccessStore.accessCodes = [];
    mockRoute.query = {
      action: 'register',
      applicationId: 'APP-ID',
    };
    mockRouter.push.mockReset();
    messageSuccessMock.mockReset();
    messageWarningMock.mockReset();
    mockCompleteFixation.mockReset();
    mockGetApplicationDetail.mockReset();
    mockGetLatestRegistrationResult.mockReset();
    mockListSpecimens.mockReset();
    mockLoadWorkflowReferenceOptionsSafely.mockReset();
    mockRetryLabelPrint.mockReset();
    mockStartFixation.mockReset();
  });

  it('hydrates route-derived workbench lookup and initial list query', async () => {
    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    expect(state.workbenchLookupKeyword.value).toBe('APP-001');
    expect(state.workbenchLookupQueryType.value).toBe('APPLICATION_NO');
    expect(state.workbenchLookupTriggerKey.value).toBe(1);
    expect(state.filters.keyword).toBe('APP-001');
    expect(mockGetApplicationDetail).toHaveBeenCalledWith('APP-ID');
    expect(mockListSpecimens).toHaveBeenCalledWith(
      expect.objectContaining({
        keyword: 'APP-001',
        page: 1,
        size: 20,
      }),
    );

    wrapper.destroy();
  });

  it('uses embedded registration props as the single lookup source', async () => {
    const wrapper = mountComposable({
      embedded: true,
      registrationApplicationId: 'APP-ID',
      registrationTriggerKey: 1,
    });
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    expect(state.workbenchLookupKeyword.value).toBe('APP-001');
    expect(state.workbenchLookupQueryType.value).toBe('APPLICATION_NO');
    expect(state.workbenchLookupTriggerKey.value).toBe(1);
    expect(mockGetApplicationDetail).toHaveBeenCalledTimes(1);
    expect(mockGetApplicationDetail).toHaveBeenCalledWith('APP-ID');
    expect(mockListSpecimens).not.toHaveBeenCalled();

    wrapper.destroy();
  });

  it('warns when print popup is blocked during application-form reprint', async () => {
    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    vi.spyOn(window, 'open').mockReturnValue(null);

    state.handleWorkbenchReprintApplicationForm({
      applicationId: '',
      record: {
        patientInfo: {
          applicationNo: 'APP-001',
        },
      } as any,
    });

    expect(window.open).toHaveBeenCalledTimes(1);
    expect(messageWarningMock).toHaveBeenCalledWith(
      '打印窗口被浏览器拦截，请允许弹窗后重试',
    );

    wrapper.destroy();
  });

  it('prepares verify dialog state and loads workflow reference options', async () => {
    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    await state.openVerifyDialog(createRow(), 'start');

    expect(state.verifyDialogVisible.value).toBe(true);
    expect(state.verifyAction.value).toBe('start');
    expect(state.verifyForm.specimenBarcode).toBe('BC-001');
    expect(state.workflowReferenceOptions.value.fixationLiquidTypes).toEqual([
      { label: '福尔马林', value: 'FORMALIN' },
    ]);
    expect(mockLoadWorkflowReferenceOptionsSafely).toHaveBeenCalledWith({
      enabled: true,
    });

    wrapper.destroy();
  });
});
