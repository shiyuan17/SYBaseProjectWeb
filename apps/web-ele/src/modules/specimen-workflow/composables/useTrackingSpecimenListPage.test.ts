import type { SpecimenManagementListItem } from '../types/specimen-workflow';

import { createApp, defineComponent, h, nextTick } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockAccessStore,
  mockGetApplicationDetail,
  mockGetLatestRegistrationResult,
  mockListSpecimens,
} = vi.hoisted(() => ({
  mockAccessStore: {
    accessCodes: [
      'PERM_APPLICATION_DETAIL_QUERY',
      'PERM_SPECIMEN_REGISTER',
    ] as string[],
  },
  mockGetApplicationDetail: vi.fn(),
  mockGetLatestRegistrationResult: vi.fn(),
  mockListSpecimens: vi.fn(),
}));

vi.mock('@vben/stores', () => ({
  useAccessStore: () => mockAccessStore,
}));

vi.mock('../api/specimen-workflow-service', () => ({
  getApplicationDetail: mockGetApplicationDetail,
  getLatestRegistrationResult: mockGetLatestRegistrationResult,
  listSpecimens: mockListSpecimens,
}));

import { useTrackingSpecimenListPage } from './useTrackingSpecimenListPage';

function createRow(
  overrides: Partial<SpecimenManagementListItem> = {},
): SpecimenManagementListItem {
  return {
    abnormalFlag: true,
    applicationId: 'APP-TRACK-001',
    applicationNo: 'AP202605220001',
    barcode: 'BC-TRACK-001',
    containerCount: 1,
    containerName: '瓶1',
    fixationStatus: 'FIXING',
    labelPrintBatchNo: 'BATCH-001',
    labelPrintStatus: 'FAILED',
    latestTrackingAt: '2026-05-24T08:00:00',
    patientName: '张三',
    registeredAt: '2026-05-24T08:00:00',
    specimenCount: 1,
    specimenId: 'SPEC-001',
    specimenName: '胃组织',
    specimenNo: 'SP-001',
    specimenSite: '胃',
    specimenStatus: 'REGISTERED',
    specimenType: '常规',
    submittingDepartmentId: 'DEP-001',
    submittingDepartmentName: '普外科',
    ...overrides,
  };
}

function createHarness(props: {
  initialBarcode?: string;
  triggerKey?: number;
}) {
  let state: null | ReturnType<typeof useTrackingSpecimenListPage> = null;

  const Harness = defineComponent({
    setup() {
      state = useTrackingSpecimenListPage(props);
      return () => h('div');
    },
  });

  return {
    getState: () => state,
    Harness,
  };
}

function mountComposable(props: {
  initialBarcode?: string;
  triggerKey?: number;
}) {
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
  await Promise.resolve();
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

describe('useTrackingSpecimenListPage', () => {
  beforeEach(() => {
    mockListSpecimens.mockResolvedValue({
      items: [createRow()],
      page: 1,
      size: 20,
      summary: {
        abnormalCount: 1,
        labelPrintedCount: 0,
        pendingLabelCount: 1,
        totalCount: 1,
      },
      total: 1,
    });
    mockGetApplicationDetail.mockResolvedValue({
      applicationNo: 'AP202605220001',
      recentEvents: [],
      specimens: [],
    });
    mockGetLatestRegistrationResult.mockResolvedValue(null);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    mockAccessStore.accessCodes = [
      'PERM_APPLICATION_DETAIL_QUERY',
      'PERM_SPECIMEN_REGISTER',
    ];
    mockGetApplicationDetail.mockReset();
    mockGetLatestRegistrationResult.mockReset();
    mockListSpecimens.mockReset();
  });

  it('applies initial barcode and opens the matched detail dialog', async () => {
    const wrapper = mountComposable({
      initialBarcode: 'BC-TRACK-001',
      triggerKey: 1,
    });
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    expect(state.filters.keyword).toBe('BC-TRACK-001');
    expect(state.detailVisible.value).toBe(true);
    expect(state.detailRow.value?.specimenId).toBe('SPEC-001');
    expect(mockListSpecimens).toHaveBeenCalledWith(
      expect.objectContaining({
        keyword: 'BC-TRACK-001',
      }),
    );
    expect(mockGetApplicationDetail).toHaveBeenCalledWith('APP-TRACK-001');
    expect(mockGetLatestRegistrationResult).toHaveBeenCalledWith(
      'APP-TRACK-001',
    );

    wrapper.destroy();
  });

  it('resets filters and quick filter before reloading specimens', async () => {
    const wrapper = mountComposable({
      initialBarcode: '',
      triggerKey: 0,
    });
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    state.filters.keyword = 'BC-TRACK-001';
    state.filters.specimenStatus = 'FIXING';
    state.quickFilter.value = 'ABNORMAL';

    mockListSpecimens.mockClear();
    state.handleReset();
    await flushComposable();

    expect(state.filters.keyword).toBe('');
    expect(state.filters.specimenStatus).toBe('');
    expect(state.quickFilter.value).toBe('ALL');
    expect(mockListSpecimens).toHaveBeenCalledWith(
      expect.objectContaining({
        keyword: undefined,
        specimenStatus: undefined,
      }),
    );

    wrapper.destroy();
  });
});
