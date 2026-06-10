import type {
  ArchiveCabinetView,
  ArchivePositionView,
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
  mockListArchiveCabinets,
  mockListAvailableArchivePositions,
  mockListPendingMaterialLoans,
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
  mockListArchiveCabinets: vi.fn(),
  mockListAvailableArchivePositions: vi.fn(),
  mockListPendingMaterialLoans: vi.fn(),
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
  listArchiveCabinets: mockListArchiveCabinets,
  listAvailableArchivePositions: mockListAvailableArchivePositions,
  listPendingMaterialLoans: mockListPendingMaterialLoans,
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
    loanId: 'LOAN-1',
    loanStatus: 'BORROWED',
    materialId: 'SLIDE-1',
    materialType: 'SLIDE',
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
      M5_PERMISSION_CODES.LOAN_CREATE,
      M5_PERMISSION_CODES.LOAN_QUERY,
      M5_PERMISSION_CODES.LOAN_RETURN,
    ];

    mockListArchiveCabinets.mockResolvedValue([createCabinet()]);
    mockListAvailableArchivePositions.mockResolvedValue([createPosition()]);
    mockListPendingMaterialLoans.mockResolvedValue([createLoan()]);
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
    mockListArchiveCabinets.mockReset();
    mockListAvailableArchivePositions.mockReset();
    mockListPendingMaterialLoans.mockReset();
    mockReturnMaterialLoan.mockReset();
    mockAccessStore.accessCodes = [];
    document.body.innerHTML = '';
  });

  it('initializes borrow workbench data for loan permissions', async () => {
    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    expect(state).toBeTruthy();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    expect(state.capabilities.canViewBorrowPage).toBe(true);
    expect(state.capabilities.canViewArchivePage).toBe(true);
    expect(state.loanWorkspace.pendingLoans).toHaveLength(1);
    expect(state.cabinetWorkspace.positionRows).toHaveLength(4);
    expect(mockListArchiveCabinets).toHaveBeenCalledTimes(1);
    expect(mockListAvailableArchivePositions).toHaveBeenCalledTimes(1);
    expect(mockListPendingMaterialLoans).toHaveBeenCalledWith({
      keyword: undefined,
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
    mockListPendingMaterialLoans.mockClear();

    state.loanWorkspace.loanForm.materialId = ' SLIDE-1 ';
    state.loanWorkspace.loanForm.borrowedByName = ' 张三 ';
    state.loanWorkspace.loanForm.borrowPurpose = ' 会诊 ';

    await state.loanWorkspace.submitLoan();

    expect(mockCreateMaterialLoan).toHaveBeenCalledWith({
      borrowPurpose: '会诊',
      borrowedByName: '张三',
      borrowedByUserId: undefined,
      materialId: 'SLIDE-1',
      materialType: 'SLIDE',
      operatorName: '归档员甲',
      operatorUserId: 'USER-ARCHIVE-1',
      remarks: undefined,
      terminalCode: undefined,
    });
    expect(messageSuccessMock).toHaveBeenCalledWith('材料借出已登记。');
    expect(mockListAvailableArchivePositions).toHaveBeenCalledTimes(1);
    expect(mockListPendingMaterialLoans).toHaveBeenCalledTimes(1);

    wrapper.destroy();
  });

  it('returns borrowed material with selected replacement position', async () => {
    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    state.cabinetWorkspace.selectPosition(
      state.cabinetWorkspace.positionRows[0]!,
    );
    state.loanWorkspace.openReturnDialog(state.loanWorkspace.pendingLoans[0]!);
    mockListAvailableArchivePositions.mockClear();
    mockListPendingMaterialLoans.mockClear();

    await state.loanWorkspace.submitReturn();

    expect(mockReturnMaterialLoan).toHaveBeenCalledWith('LOAN-1', {
      archivePositionId: 'POSITION-1',
      operatorName: '归档员甲',
      operatorUserId: 'USER-ARCHIVE-1',
      remarks: undefined,
      terminalCode: undefined,
    });
    expect(messageSuccessMock).toHaveBeenCalledWith('材料归还已完成。');
    expect(mockListAvailableArchivePositions).toHaveBeenCalledTimes(1);
    expect(mockListPendingMaterialLoans).toHaveBeenCalledTimes(1);

    wrapper.destroy();
  });
});
