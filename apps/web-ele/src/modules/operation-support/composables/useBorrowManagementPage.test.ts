import type {
  ArchiveCabinetView,
  ArchivePositionView,
  ArchiveRecordView,
  MaterialLoanView,
} from '../types/operation-support';

import { createApp, defineComponent, h, nextTick } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { M5_PERMISSION_CODES } from '../constants';

const {
  messageErrorMock,
  messageSuccessMock,
  messageWarningMock,
  mockAccessStore,
  mockCreateMaterialLoan,
  mockCreateMaterialLoanAbnormalRecord,
  mockListArchiveCabinets,
  mockListArchiveObjects,
  mockListAvailableArchivePositions,
  mockListMaterialLoans,
  mockListWhiteSlideLoans,
  mockListWhiteSlideStocks,
  mockReturnMaterialLoan,
  mockUserStore,
} = vi.hoisted(() => ({
  messageErrorMock: vi.fn(),
  messageSuccessMock: vi.fn(),
  messageWarningMock: vi.fn(),
  mockAccessStore: {
    accessCodes: [] as string[],
  },
  mockCreateMaterialLoan: vi.fn(),
  mockCreateMaterialLoanAbnormalRecord: vi.fn(),
  mockListArchiveCabinets: vi.fn(),
  mockListArchiveObjects: vi.fn(),
  mockListAvailableArchivePositions: vi.fn(),
  mockListMaterialLoans: vi.fn(),
  mockListWhiteSlideLoans: vi.fn(),
  mockListWhiteSlideStocks: vi.fn(),
  mockReturnMaterialLoan: vi.fn(),
  mockUserStore: {
    userInfo: {
      realName: '归档员甲',
      userId: 'USER-ARCHIVE-1',
    },
  },
}));

vi.mock('@vben/stores', () => ({
  useAccessStore: () => mockAccessStore,
  useUserStore: () => mockUserStore,
}));

vi.mock('element-plus', () => ({
  ElMessage: {
    error: messageErrorMock,
    success: messageSuccessMock,
    warning: messageWarningMock,
  },
}));

vi.mock('../api/operation-support-service', () => ({
  createMaterialLoan: mockCreateMaterialLoan,
  createMaterialLoanAbnormalRecord: mockCreateMaterialLoanAbnormalRecord,
  listArchiveCabinets: mockListArchiveCabinets,
  listArchiveObjects: mockListArchiveObjects,
  listAvailableArchivePositions: mockListAvailableArchivePositions,
  listMaterialLoans: mockListMaterialLoans,
  listWhiteSlideLoans: mockListWhiteSlideLoans,
  listWhiteSlideStocks: mockListWhiteSlideStocks,
  returnMaterialLoan: mockReturnMaterialLoan,
}));

import { useBorrowManagementPage } from './useBorrowManagementPage';

function createCabinet(
  overrides: Partial<ArchiveCabinetView> = {},
): ArchiveCabinetView {
  return {
    cabinetCode: 'CAB-01',
    cabinetName: '一号归档柜',
    cabinetStatus: 'ACTIVE',
    cabinetType: 'STANDARD',
    capacity: 4,
    id: 'CABINET-1',
    layerCount: 2,
    locationDescription: 'B1 走廊',
    remarks: '可用',
    slotCountPerLayer: 2,
    ...overrides,
  };
}

function createPosition(
  overrides: Partial<ArchivePositionView> = {},
): ArchivePositionView {
  return {
    cabinetId: 'CABINET-1',
    id: 'POSITION-1',
    layerNo: 1,
    positionCode: 'CAB-01-L1-S1',
    positionStatus: 'AVAILABLE',
    slotNo: 1,
    ...overrides,
  };
}

function createLoan(
  overrides: Partial<MaterialLoanView> = {},
): MaterialLoanView {
  return {
    caseId: 'CASE-1',
    patientId: 'PAT-1',
    loanId: 'LOAN-1',
    loanStatus: 'BORROWED',
    materialId: 'SLIDE-1',
    materialType: 'SLIDE',
    ...overrides,
  };
}

function createArchiveRecord(
  overrides: Partial<ArchiveRecordView> = {},
): ArchiveRecordView {
  return {
    archiveLocation: 'CAB-01-L1-S1',
    archiveStatus: 'IN_STORAGE',
    borrowedAt: null,
    borrowedByName: null,
    caseId: 'CASE-1',
    loanStatus: null,
    objectCode: 'SLIDE-NO-1',
    objectId: 'SLIDE-1',
    objectType: 'SLIDE',
    pathologyNo: 'BL-2026-001',
    patientId: 'PAT-1',
    patientName: '患者甲',
    storedAt: '2026-06-15 10:00:00',
    storedByName: '归档员甲',
    ...overrides,
  };
}

function createHarness() {
  let state: null | ReturnType<typeof useBorrowManagementPage> = null;

  const Harness = defineComponent({
    setup() {
      state = useBorrowManagementPage();
      return () => h('div');
    },
  });

  return {
    getState: () => state,
    Harness,
  };
}

async function flushComposable() {
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

function mountComposable() {
  const { Harness, getState } = createHarness();
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

describe('useBorrowManagementPage', () => {
  beforeEach(() => {
    mockAccessStore.accessCodes = [
      M5_PERMISSION_CODES.ARCHIVE_CABINET_QUERY,
      M5_PERMISSION_CODES.ARCHIVE_QUERY,
      M5_PERMISSION_CODES.LOAN_CREATE,
      M5_PERMISSION_CODES.LOAN_ABNORMAL_REGISTER,
      M5_PERMISSION_CODES.LOAN_QUERY,
      M5_PERMISSION_CODES.LOAN_RETURN,
    ];

    mockListArchiveCabinets.mockResolvedValue([createCabinet()]);
    mockListArchiveObjects.mockResolvedValue({
      items: [createArchiveRecord()],
      page: 1,
      size: 20,
      total: 1,
    });
    mockListAvailableArchivePositions.mockResolvedValue([createPosition()]);
    mockListMaterialLoans.mockResolvedValue([createLoan()]);
    mockListWhiteSlideLoans.mockResolvedValue([]);
    mockListWhiteSlideStocks.mockResolvedValue([]);
    mockCreateMaterialLoanAbnormalRecord.mockResolvedValue({
      id: 'ABNORMAL-1',
      materialId: 'SLIDE-1',
      materialType: 'SLIDE',
    });
    mockCreateMaterialLoan.mockResolvedValue(createLoan());
    mockReturnMaterialLoan.mockResolvedValue(
      createLoan({ loanStatus: 'RETURNED' }),
    );
  });

  afterEach(() => {
    messageErrorMock.mockReset();
    messageSuccessMock.mockReset();
    messageWarningMock.mockReset();
    mockCreateMaterialLoan.mockReset();
    mockCreateMaterialLoanAbnormalRecord.mockReset();
    mockListArchiveCabinets.mockReset();
    mockListArchiveObjects.mockReset();
    mockListAvailableArchivePositions.mockReset();
    mockListMaterialLoans.mockReset();
    mockListWhiteSlideLoans.mockReset();
    mockListWhiteSlideStocks.mockReset();
    mockReturnMaterialLoan.mockReset();
    mockAccessStore.accessCodes = [];
    document.body.innerHTML = '';
  });

  it('initializes only the default embedding-box tab data on first entry', async () => {
    mockAccessStore.accessCodes = [
      M5_PERMISSION_CODES.ARCHIVE_CABINET_QUERY,
      M5_PERMISSION_CODES.ARCHIVE_QUERY,
      M5_PERMISSION_CODES.LOAN_CREATE,
      M5_PERMISSION_CODES.LOAN_ABNORMAL_REGISTER,
      M5_PERMISSION_CODES.LOAN_QUERY,
      M5_PERMISSION_CODES.LOAN_RETURN,
      M5_PERMISSION_CODES.WHITE_SLIDE_QUERY,
      M5_PERMISSION_CODES.WHITE_SLIDE_CREATE,
      M5_PERMISSION_CODES.WHITE_SLIDE_RETURN,
    ];

    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    expect(state).toBeTruthy();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    expect(mockListArchiveObjects).toHaveBeenCalledWith({
      keyword: undefined,
      objectType: 'EMBEDDING_BOX',
      page: 1,
      size: 20,
    });
    expect(mockListMaterialLoans).not.toHaveBeenCalled();
    expect(mockListArchiveCabinets).not.toHaveBeenCalled();
    expect(mockListAvailableArchivePositions).not.toHaveBeenCalled();
    expect(mockListWhiteSlideStocks).not.toHaveBeenCalled();
    expect(mockListWhiteSlideLoans).not.toHaveBeenCalled();

    wrapper.destroy();
  });

  it('loads pending borrow workbench data on demand', async () => {
    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    expect(state).toBeTruthy();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    await state.loadBorrowTabData('PENDING');

    expect(state.capabilities.canViewBorrowPage).toBe(true);
    expect(state.capabilities.canViewArchivePage).toBe(true);
    expect(state.loanWorkspace.materialObjectPage.items).toHaveLength(1);
    expect(state.loanWorkspace.pendingLoans).toHaveLength(1);
    expect(state.cabinetWorkspace.positionRows).toHaveLength(4);
    expect(mockListArchiveCabinets).toHaveBeenCalledTimes(1);
    expect(mockListArchiveObjects).toHaveBeenCalledWith({
      keyword: undefined,
      objectType: 'EMBEDDING_BOX',
      page: 1,
      size: 20,
    });
    expect(mockListAvailableArchivePositions).toHaveBeenCalledTimes(1);
    expect(mockListMaterialLoans).toHaveBeenCalledWith({
      keyword: undefined,
      loanStatus: 'BORROWED',
      materialType: undefined,
    });

    wrapper.destroy();
  });

  it('submits slide borrow and refreshes pending loans', async () => {
    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    mockListAvailableArchivePositions.mockClear();
    mockListArchiveObjects.mockClear();
    mockListMaterialLoans.mockClear();

    state.loanWorkspace.selectMaterialRecord(createArchiveRecord());
    state.loanWorkspace.openBorrowDialog();
    state.loanWorkspace.loanForm.borrowedByName = ' 张三 ';
    state.loanWorkspace.loanForm.borrowerPhone = ' 13800000000 ';
    state.loanWorkspace.loanForm.borrowerUnit = ' 外院 ';
    state.loanWorkspace.loanForm.depositAmount = ' 100 ';
    state.loanWorkspace.loanForm.borrowPurpose = ' 会诊 ';

    await state.loanWorkspace.submitLoan();

    expect(mockCreateMaterialLoan).toHaveBeenCalledWith({
      borrowerPhone: '13800000000',
      borrowerUnit: '外院',
      borrowPurpose: '会诊',
      borrowedByName: '张三',
      borrowedByUserId: undefined,
      depositAmount: '100',
      materialId: 'SLIDE-1',
      materialType: 'SLIDE',
      operatorName: '归档员甲',
      operatorUserId: 'USER-ARCHIVE-1',
      remarks: undefined,
      terminalCode: undefined,
    });
    expect(messageSuccessMock).toHaveBeenCalledWith(
      '借记完成：成功 1 条，跳过 0 条，失败 0 条。',
    );
    expect(mockListAvailableArchivePositions).toHaveBeenCalledTimes(1);
    expect(mockListArchiveObjects).toHaveBeenCalledTimes(1);
    expect(mockListMaterialLoans).toHaveBeenCalledTimes(1);

    wrapper.destroy();
  });

  it('submits batch borrow for selected valid materials and skips invalid rows', async () => {
    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    mockListAvailableArchivePositions.mockClear();
    mockListArchiveObjects.mockClear();
    mockListMaterialLoans.mockClear();

    state.loanWorkspace.setSelectedMaterialRecords([
      createArchiveRecord({ objectId: 'SLIDE-1', objectType: 'SLIDE' }),
      createArchiveRecord({
        objectId: 'SLIDE-2',
        objectType: 'SLIDE',
        loanStatus: 'BORROWED',
      }),
      createArchiveRecord({
        archiveStatus: 'ARCHIVED',
        objectId: 'SLIDE-3',
        objectType: 'SLIDE',
      }),
    ]);
    state.loanWorkspace.openBorrowDialog();
    state.loanWorkspace.loanForm.borrowedByName = '张三';

    await state.loanWorkspace.submitLoan();

    expect(mockCreateMaterialLoan).toHaveBeenCalledTimes(1);
    expect(mockCreateMaterialLoan).toHaveBeenCalledWith(
      expect.objectContaining({
        materialId: 'SLIDE-1',
        materialType: 'SLIDE',
      }),
    );
    expect(messageWarningMock).toHaveBeenCalledWith(
      '借记完成：成功 1 条，跳过 2 条，失败 0 条。跳过原因：已借出、非在库。',
    );
    expect(mockListArchiveObjects).toHaveBeenCalledTimes(1);
    expect(mockListMaterialLoans).toHaveBeenCalledTimes(1);

    wrapper.destroy();
  });

  it('opens embedding-box borrow dialog for not-archived wax blocks', async () => {
    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    state.loanWorkspace.setActiveMaterialType('EMBEDDING_BOX');
    state.loanWorkspace.setSelectedMaterialRecords([
      createArchiveRecord({
        archiveStatus: 'NOT_ARCHIVED',
        loanStatus: null,
        objectCode: 'A8',
        objectId: 'BOX-1',
        objectType: 'EMBEDDING_BOX',
      }),
    ]);

    state.loanWorkspace.openBorrowDialog('EMBEDDING_BOX');

    expect(state.loanWorkspace.borrowDialogVisible).toBe(true);
    expect(state.loanWorkspace.borrowDialogMode).toBe('EMBEDDING_BOX');
    expect(state.loanWorkspace.loanForm.materialId).toBe('BOX-1');

    wrapper.destroy();
  });

  it('submits not-archived wax block borrow without non-storage skip', async () => {
    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    mockListAvailableArchivePositions.mockClear();
    mockListArchiveObjects.mockClear();
    mockListMaterialLoans.mockClear();

    state.loanWorkspace.setActiveMaterialType('EMBEDDING_BOX');
    state.loanWorkspace.setSelectedMaterialRecords([
      createArchiveRecord({
        archiveStatus: 'NOT_ARCHIVED',
        loanStatus: null,
        objectCode: 'A8',
        objectId: 'BOX-1',
        objectType: 'EMBEDDING_BOX',
      }),
      createArchiveRecord({
        archiveStatus: 'NOT_ARCHIVED',
        loanStatus: 'BORROWED',
        objectCode: 'A9',
        objectId: 'BOX-2',
        objectType: 'EMBEDDING_BOX',
      }),
    ]);
    state.loanWorkspace.openBorrowDialog('EMBEDDING_BOX');
    state.loanWorkspace.loanForm.borrowedByName = '张三';

    await state.loanWorkspace.submitLoan();

    expect(mockCreateMaterialLoan).toHaveBeenCalledTimes(1);
    expect(mockCreateMaterialLoan).toHaveBeenCalledWith(
      expect.objectContaining({
        materialId: 'BOX-1',
        materialType: 'EMBEDDING_BOX',
      }),
    );
    expect(messageWarningMock).toHaveBeenCalledWith(
      '借记完成：成功 1 条，跳过 1 条，失败 0 条。跳过原因：已借出。',
    );

    wrapper.destroy();
  });

  it('queries material loans with selected loan status', async () => {
    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    mockListMaterialLoans.mockClear();
    state.loanWorkspace.loanFilters.keyword = ' BL-2026 ';
    state.loanWorkspace.loanFilters.loanStatus = 'RETURNED';
    state.loanWorkspace.loanFilters.materialType = 'SLIDE';

    await state.loanWorkspace.loadLoans();

    expect(mockListMaterialLoans).toHaveBeenCalledWith({
      keyword: 'BL-2026',
      loanStatus: 'RETURNED',
      materialType: 'SLIDE',
    });

    wrapper.destroy();
  });

  it('queries archive objects for the active borrow material type', async () => {
    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    mockListArchiveObjects.mockClear();
    state.loanWorkspace.setActiveMaterialType('SLIDE');
    state.loanWorkspace.materialObjectFilters.keyword = ' BL-2026 ';

    await state.loanWorkspace.queryMaterialObjects();

    expect(mockListArchiveObjects).toHaveBeenCalledWith({
      keyword: 'BL-2026',
      objectType: 'SLIDE',
      page: 1,
      size: 20,
    });

    wrapper.destroy();
  });

  it('keeps current loan status filter when refreshing after return', async () => {
    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    await state.loadBorrowTabData('PENDING');
    state.loanWorkspace.loanFilters.loanStatus = 'RETURNED';
    state.loanWorkspace.openReturnDialog(state.loanWorkspace.pendingLoans[0]!);
    mockListMaterialLoans.mockClear();

    await state.loanWorkspace.submitReturn();

    expect(mockListMaterialLoans).toHaveBeenCalledWith({
      keyword: undefined,
      loanStatus: 'RETURNED',
      materialType: undefined,
    });

    wrapper.destroy();
  });

  it('returns borrowed material with selected replacement position', async () => {
    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    await state.loadBorrowTabData('PENDING');
    state.cabinetWorkspace.selectPosition(
      state.cabinetWorkspace.positionRows[0]!,
    );
    state.loanWorkspace.openReturnDialog(state.loanWorkspace.pendingLoans[0]!);
    mockListAvailableArchivePositions.mockClear();
    mockListMaterialLoans.mockClear();

    await state.loanWorkspace.submitReturn();

    expect(mockReturnMaterialLoan).toHaveBeenCalledWith('LOAN-1', {
      archivePositionId: 'POSITION-1',
      remarks: undefined,
      terminalCode: undefined,
    });
    expect(messageSuccessMock).toHaveBeenCalledWith(
      '归还完成：成功 1 条，跳过 0 条，失败 0 条。',
    );
    expect(mockListAvailableArchivePositions).toHaveBeenCalledTimes(1);
    expect(mockListMaterialLoans).toHaveBeenCalledTimes(1);

    wrapper.destroy();
  });

  it('opens return dialog from a selected borrowed material row', async () => {
    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    await state.loadBorrowTabData('PENDING');
    state.loanWorkspace.selectMaterialRecord(
      createArchiveRecord({ loanStatus: 'BORROWED' }),
    );
    state.loanWorkspace.openSelectedReturnDialog();

    expect(state.loanWorkspace.returningLoan?.loanId).toBe('LOAN-1');
    expect(state.loanWorkspace.returningLoans).toHaveLength(1);

    wrapper.destroy();
  });

  it('submits batch return for selected borrowed materials', async () => {
    mockListMaterialLoans.mockResolvedValue([
      createLoan({ loanId: 'LOAN-1', materialId: 'SLIDE-1' }),
      createLoan({ loanId: 'LOAN-2', materialId: 'SLIDE-2' }),
    ]);
    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    await state.loadBorrowTabData('PENDING');
    mockListAvailableArchivePositions.mockClear();
    mockListArchiveObjects.mockClear();
    mockListMaterialLoans.mockClear();

    state.loanWorkspace.setSelectedMaterialRecords([
      createArchiveRecord({ loanStatus: 'BORROWED', objectId: 'SLIDE-1' }),
      createArchiveRecord({ loanStatus: 'BORROWED', objectId: 'SLIDE-2' }),
      createArchiveRecord({ loanStatus: null, objectId: 'SLIDE-3' }),
    ]);
    state.loanWorkspace.openSelectedReturnDialog();

    await state.loanWorkspace.submitReturn();

    expect(mockReturnMaterialLoan).toHaveBeenCalledTimes(2);
    expect(mockReturnMaterialLoan).toHaveBeenNthCalledWith(
      1,
      'LOAN-1',
      expect.objectContaining({
        archivePositionId: undefined,
        remarks: undefined,
        terminalCode: undefined,
      }),
    );
    expect(mockReturnMaterialLoan).toHaveBeenNthCalledWith(
      2,
      'LOAN-2',
      expect.objectContaining({
        archivePositionId: undefined,
        remarks: undefined,
        terminalCode: undefined,
      }),
    );
    expect(messageWarningMock).toHaveBeenCalledWith(
      '归还完成：成功 2 条，跳过 1 条，失败 0 条。跳过原因：非借已。',
    );

    wrapper.destroy();
  });

  it('warns when returning without a borrowed selected material row', async () => {
    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    state.loanWorkspace.selectMaterialRecord(createArchiveRecord());
    state.loanWorkspace.openSelectedReturnDialog();

    expect(messageWarningMock).toHaveBeenCalledWith(
      '请选择借阅状态为借已的材料。',
    );
    expect(state.loanWorkspace.returningLoan).toBeNull();

    wrapper.destroy();
  });

  it('submits abnormal record for selected material', async () => {
    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    await state.loadBorrowTabData('PENDING');
    mockListArchiveObjects.mockClear();
    mockListAvailableArchivePositions.mockClear();
    mockListMaterialLoans.mockClear();

    state.loanWorkspace.selectMaterialRecord(
      createArchiveRecord({ loanStatus: 'BORROWED' }),
    );
    state.loanWorkspace.openAbnormalDialog();
    state.loanWorkspace.abnormalForm.abnormalReason = ' 玻片破损 ';
    state.loanWorkspace.abnormalForm.borrowerPhone = ' 13900000000 ';

    await state.loanWorkspace.submitAbnormalRecord();

    expect(mockCreateMaterialLoanAbnormalRecord).toHaveBeenCalledWith({
      abnormalReason: '玻片破损',
      borrowedAt: undefined,
      borrowedContent: 'SLIDE-NO-1',
      borrowedSlideNo: 'SLIDE-NO-1',
      borrowerIdentityNo: undefined,
      borrowerName: undefined,
      borrowerPhone: '13900000000',
      borrowerRelationship: undefined,
      borrowerUnit: undefined,
      contactResult: undefined,
      contacted: false,
      depositAmount: undefined,
      expectedReturnAt: undefined,
      loanId: 'LOAN-1',
      materialId: 'SLIDE-1',
      materialType: 'SLIDE',
      returnAbnormalInfo: undefined,
      slideCount: 1,
      terminalCode: undefined,
    });
    expect(messageSuccessMock).toHaveBeenCalledWith(
      '异常登记完成：成功 1 条，跳过 0 条，失败 0 条。',
    );
    expect(mockListAvailableArchivePositions).toHaveBeenCalledTimes(1);
    expect(mockListArchiveObjects).toHaveBeenCalledTimes(1);
    expect(mockListMaterialLoans).toHaveBeenCalledTimes(1);

    wrapper.destroy();
  });

  it('submits batch abnormal records and keeps processing after one failure', async () => {
    mockListMaterialLoans.mockResolvedValue([
      createLoan({ loanId: 'LOAN-1', materialId: 'SLIDE-1' }),
      createLoan({ loanId: 'LOAN-2', materialId: 'SLIDE-2' }),
    ]);
    mockCreateMaterialLoanAbnormalRecord
      .mockRejectedValueOnce(new Error('failed once'))
      .mockResolvedValueOnce({
        id: 'ABNORMAL-2',
        materialId: 'SLIDE-2',
        materialType: 'SLIDE',
      });
    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    await state.loadBorrowTabData('PENDING');
    mockListArchiveObjects.mockClear();
    mockListAvailableArchivePositions.mockClear();
    mockListMaterialLoans.mockClear();

    state.loanWorkspace.setSelectedMaterialRecords([
      createArchiveRecord({ loanStatus: 'BORROWED', objectId: 'SLIDE-1' }),
      createArchiveRecord({
        loanStatus: 'BORROWED',
        objectCode: 'SLIDE-NO-2',
        objectId: 'SLIDE-2',
      }),
    ]);
    state.loanWorkspace.openAbnormalDialog();
    state.loanWorkspace.abnormalForm.abnormalReason = '玻片破损';

    await state.loanWorkspace.submitAbnormalRecord();

    expect(mockCreateMaterialLoanAbnormalRecord).toHaveBeenCalledTimes(2);
    expect(mockCreateMaterialLoanAbnormalRecord).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        loanId: 'LOAN-1',
        materialId: 'SLIDE-1',
      }),
    );
    expect(mockCreateMaterialLoanAbnormalRecord).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        loanId: 'LOAN-2',
        materialId: 'SLIDE-2',
      }),
    );
    expect(messageErrorMock).toHaveBeenCalledWith(
      '异常登记完成：成功 1 条，跳过 0 条，失败 1 条。',
    );
    expect(mockListArchiveObjects).toHaveBeenCalledTimes(1);
    expect(mockListMaterialLoans).toHaveBeenCalledTimes(1);

    wrapper.destroy();
  });
});
