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
  mockArchiveApplicationForm,
  mockArchiveEmbeddingBox,
  mockArchiveSlide,
  mockCreateArchiveCabinet,
  mockCreateMaterialLoan,
  mockListArchiveCabinets,
  mockListAvailableArchivePositions,
  mockListPendingMaterialLoans,
  mockReturnMaterialLoan,
  mockSearchArchiveRecords,
  mockUpdateArchiveCabinet,
  mockUserStore,
} = vi.hoisted(() => ({
  messageErrorMock: vi.fn(),
  messageSuccessMock: vi.fn(),
  messageWarningMock: vi.fn(),
  mockAccessStore: {
    accessCodes: [] as string[],
  },
  mockArchiveApplicationForm: vi.fn(),
  mockArchiveEmbeddingBox: vi.fn(),
  mockArchiveSlide: vi.fn(),
  mockCreateArchiveCabinet: vi.fn(),
  mockCreateMaterialLoan: vi.fn(),
  mockListArchiveCabinets: vi.fn(),
  mockListAvailableArchivePositions: vi.fn(),
  mockListPendingMaterialLoans: vi.fn(),
  mockReturnMaterialLoan: vi.fn(),
  mockSearchArchiveRecords: vi.fn(),
  mockUpdateArchiveCabinet: vi.fn(),
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
  archiveApplicationForm: mockArchiveApplicationForm,
  archiveEmbeddingBox: mockArchiveEmbeddingBox,
  archiveSlide: mockArchiveSlide,
  createArchiveCabinet: mockCreateArchiveCabinet,
  createMaterialLoan: mockCreateMaterialLoan,
  listArchiveCabinets: mockListArchiveCabinets,
  listAvailableArchivePositions: mockListAvailableArchivePositions,
  listPendingMaterialLoans: mockListPendingMaterialLoans,
  returnMaterialLoan: mockReturnMaterialLoan,
  searchArchiveRecords: mockSearchArchiveRecords,
  updateArchiveCabinet: mockUpdateArchiveCabinet,
}));

import { useArchiveManagementPage } from './useArchiveManagementPage';

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

function createRecord(
  overrides: Partial<ArchiveRecordView> = {},
): ArchiveRecordView {
  return {
    caseId: 'CASE-1',
    objectId: 'OBJECT-1',
    objectType: 'APPLICATION_FORM',
    ...overrides,
  };
}

function createLoan(
  overrides: Partial<MaterialLoanView> = {},
): MaterialLoanView {
  return {
    caseId: 'CASE-1',
    loanId: 'LOAN-1',
    loanStatus: 'BORROWED',
    materialId: 'SLIDE-1',
    materialType: 'SLIDE',
    ...overrides,
  };
}

function createHarness() {
  let state: null | ReturnType<typeof useArchiveManagementPage> = null;

  const Harness = defineComponent({
    setup() {
      state = useArchiveManagementPage();
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
    app,
    destroy() {
      app.unmount();
      root.remove();
    },
    getState,
  };
}

describe('useArchiveManagementPage', () => {
  beforeEach(() => {
    mockAccessStore.accessCodes = [
      M5_PERMISSION_CODES.ARCHIVE_CABINET_QUERY,
      M5_PERMISSION_CODES.ARCHIVE_CABINET_CREATE,
      M5_PERMISSION_CODES.ARCHIVE_CABINET_UPDATE,
      M5_PERMISSION_CODES.APPLICATION_FORM_ARCHIVE,
      M5_PERMISSION_CODES.ARCHIVE_QUERY,
      M5_PERMISSION_CODES.LOAN_CREATE,
      M5_PERMISSION_CODES.LOAN_QUERY,
      M5_PERMISSION_CODES.LOAN_RETURN,
    ];

    mockListArchiveCabinets.mockResolvedValue([createCabinet()]);
    mockListAvailableArchivePositions.mockResolvedValue([createPosition()]);
    mockSearchArchiveRecords.mockResolvedValue([createRecord()]);
    mockListPendingMaterialLoans.mockResolvedValue([createLoan()]);

    mockArchiveApplicationForm.mockResolvedValue({
      archiveLocation: 'CAB-01-L1-S1',
      archiveStatus: 'IN_STORAGE',
      caseId: 'CASE-1',
      objectId: 'OBJECT-1',
      objectType: 'APPLICATION_FORM',
    });
    mockArchiveEmbeddingBox.mockResolvedValue({});
    mockArchiveSlide.mockResolvedValue({});
    mockCreateArchiveCabinet.mockResolvedValue(createCabinet());
    mockCreateMaterialLoan.mockResolvedValue(createLoan());
    mockReturnMaterialLoan.mockResolvedValue(
      createLoan({ loanStatus: 'RETURNED' }),
    );
    mockUpdateArchiveCabinet.mockResolvedValue(
      createCabinet({ cabinetStatus: 'DISABLED' }),
    );
  });

  afterEach(() => {
    messageErrorMock.mockReset();
    messageSuccessMock.mockReset();
    messageWarningMock.mockReset();

    mockArchiveApplicationForm.mockReset();
    mockArchiveEmbeddingBox.mockReset();
    mockArchiveSlide.mockReset();
    mockCreateArchiveCabinet.mockReset();
    mockCreateMaterialLoan.mockReset();
    mockListArchiveCabinets.mockReset();
    mockListAvailableArchivePositions.mockReset();
    mockListPendingMaterialLoans.mockReset();
    mockReturnMaterialLoan.mockReset();
    mockSearchArchiveRecords.mockReset();
    mockUpdateArchiveCabinet.mockReset();

    mockAccessStore.accessCodes = [];
    mockUserStore.userInfo = {
      realName: '归档员甲',
      userId: 'USER-ARCHIVE-1',
    };
    document.body.innerHTML = '';
  });

  it('initializes archive workbench state and derives selectable positions', async () => {
    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    expect(state).toBeTruthy();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    expect(state.capabilities.canViewArchivePage).toBe(true);
    expect(state.cabinetWorkspace.cabinets).toHaveLength(1);
    expect(state.recordWorkspace.records).toHaveLength(1);
    expect(state.loanWorkspace.pendingLoans).toHaveLength(1);
    expect(state.cabinetWorkspace.positionRows).toHaveLength(4);
    expect(state.cabinetWorkspace.positionSummary).toEqual({
      available: 1,
      disabled: 0,
      occupied: 3,
      total: 4,
    });
    expect(state.cabinetWorkspace.selectedPositionLabel).toBe('未选择柜位');

    state.cabinetWorkspace.selectPosition(
      state.cabinetWorkspace.positionRows[0]!,
    );

    expect(state.cabinetWorkspace.selectedPositionCode).toBe('CAB-01-L1-S1');
    expect(state.cabinetWorkspace.selectedPositionLabel).toBe('CAB-01-L1-S1');
    expect(messageSuccessMock).toHaveBeenCalledWith('已选择柜位 CAB-01-L1-S1');
    expect(mockListArchiveCabinets).toHaveBeenCalledTimes(1);
    expect(mockListAvailableArchivePositions).toHaveBeenCalledWith({
      cabinetId: undefined,
      cabinetType: undefined,
    });
    expect(mockSearchArchiveRecords).toHaveBeenCalledWith({
      caseId: undefined,
      keyword: undefined,
      objectType: undefined,
    });
    expect(mockListPendingMaterialLoans).toHaveBeenCalledWith({
      keyword: undefined,
      materialType: undefined,
    });

    wrapper.destroy();
  });

  it('maps cabinet and return dialog state from current rows', async () => {
    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    const cabinet = state.cabinetWorkspace.cabinets[0];
    const loan = state.loanWorkspace.pendingLoans[0];

    expect(cabinet).toBeTruthy();
    expect(loan).toBeTruthy();

    state.cabinetWorkspace.openEditCabinetDialog(cabinet!);
    expect(state.cabinetWorkspace.cabinetDialogVisible).toBe(true);
    expect(state.cabinetWorkspace.cabinetDialogMode).toBe('edit');
    expect(state.cabinetWorkspace.cabinetForm.cabinetCode).toBe('CAB-01');
    expect(state.cabinetWorkspace.cabinetForm.locationDescription).toBe(
      'B1 走廊',
    );
    expect(state.cabinetWorkspace.cabinetForm.operatorName).toBe('归档员甲');

    state.cabinetWorkspace.openCreateCabinetDialog();
    expect(state.cabinetWorkspace.cabinetDialogMode).toBe('create');
    expect(state.cabinetWorkspace.cabinetForm.cabinetCode).toBe('');
    expect(state.cabinetWorkspace.cabinetForm.operatorName).toBe('归档员甲');

    state.loanWorkspace.openReturnDialog(loan!);
    expect(state.loanWorkspace.returnDialogVisible).toBe(true);
    expect(state.loanWorkspace.returningLoan?.loanId).toBe('LOAN-1');
    expect(state.loanWorkspace.returnForm.operatorName).toBe('归档员甲');
    expect(state.loanWorkspace.selectedReturnPositionDescription).toContain(
      '默认归还到原始归档柜位',
    );

    wrapper.destroy();
  });

  it('submits application-form archive and refreshes dependent workbench data', async () => {
    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    const position = state.cabinetWorkspace.positionRows[0];

    expect(position?.selectable).toBe(true);

    state.cabinetWorkspace.selectPosition(position!);
    messageSuccessMock.mockClear();

    mockListAvailableArchivePositions.mockClear();
    mockListPendingMaterialLoans.mockClear();
    mockSearchArchiveRecords.mockClear();

    state.archiveWorkspace.archiveForm.caseId = ' CASE-1 ';
    state.archiveWorkspace.archiveForm.fileName = ' scan.pdf ';
    state.archiveWorkspace.archiveForm.remarks = ' 已归档 ';

    await state.archiveWorkspace.submitArchive();

    expect(mockArchiveApplicationForm).toHaveBeenCalledWith({
      archivePositionId: 'POSITION-1',
      caseId: 'CASE-1',
      fileName: 'scan.pdf',
      fileUrl: undefined,
      operatorName: '归档员甲',
      operatorUserId: 'USER-ARCHIVE-1',
      remarks: '已归档',
      terminalCode: undefined,
    });
    expect(messageSuccessMock).toHaveBeenCalledWith('申请单归档已完成。');
    expect(mockListAvailableArchivePositions).toHaveBeenCalledTimes(1);
    expect(mockSearchArchiveRecords).toHaveBeenCalledTimes(1);
    expect(mockListPendingMaterialLoans).toHaveBeenCalledTimes(1);
    expect(state.archiveWorkspace.archiveForm.caseId).toBe('');
    expect(state.archiveWorkspace.archiveForm.operatorName).toBe('归档员甲');

    wrapper.destroy();
  });

  it('toggles cabinet status with current operator identity and refreshes cabinet data', async () => {
    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    const cabinet = state.cabinetWorkspace.cabinets[0];

    mockListArchiveCabinets.mockClear();
    mockListAvailableArchivePositions.mockClear();

    await state.cabinetWorkspace.toggleCabinetStatus(cabinet!);

    expect(mockUpdateArchiveCabinet).toHaveBeenCalledWith('CABINET-1', {
      cabinetName: '一号归档柜',
      cabinetStatus: 'DISABLED',
      locationDescription: 'B1 走廊',
      operatorName: '归档员甲',
      operatorUserId: 'USER-ARCHIVE-1',
      remarks: '可用',
    });
    expect(messageSuccessMock).toHaveBeenCalledWith('归档柜已停用。');
    expect(mockListArchiveCabinets).toHaveBeenCalledTimes(1);
    expect(mockListAvailableArchivePositions).toHaveBeenCalledTimes(1);

    wrapper.destroy();
  });
});
