import type {
  ArchiveCabinetView,
  ArchivePositionView,
  ArchiveRecordView,
} from '../types/operation-support';

import { createApp, defineComponent, h, nextTick } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { M5_PERMISSION_CODES } from '../constants';

const {
  messageErrorMock,
  messageBoxConfirmMock,
  messageSuccessMock,
  messageWarningMock,
  mockAccessStore,
  mockArchiveApplicationForm,
  mockArchiveEmbeddingBox,
  mockArchiveSlide,
  mockArchiveSpecimen,
  mockBatchCreateArchiveCabinets,
  mockCreateArchiveCabinet,
  mockDeleteArchiveCabinet,
  mockListArchiveCabinets,
  mockListArchiveObjects,
  mockListAvailableArchivePositions,
  mockSearchArchiveRecords,
  mockUpdateArchiveCabinet,
  mockUserStore,
} = vi.hoisted(() => ({
  messageErrorMock: vi.fn(),
  messageBoxConfirmMock: vi.fn(),
  messageSuccessMock: vi.fn(),
  messageWarningMock: vi.fn(),
  mockAccessStore: {
    accessCodes: [] as string[],
  },
  mockArchiveApplicationForm: vi.fn(),
  mockArchiveEmbeddingBox: vi.fn(),
  mockArchiveSlide: vi.fn(),
  mockArchiveSpecimen: vi.fn(),
  mockBatchCreateArchiveCabinets: vi.fn(),
  mockCreateArchiveCabinet: vi.fn(),
  mockDeleteArchiveCabinet: vi.fn(),
  mockListArchiveCabinets: vi.fn(),
  mockListArchiveObjects: vi.fn(),
  mockListAvailableArchivePositions: vi.fn(),
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
  ElMessageBox: {
    confirm: messageBoxConfirmMock,
  },
}));

vi.mock('../api/operation-support-service', () => ({
  archiveApplicationForm: mockArchiveApplicationForm,
  archiveEmbeddingBox: mockArchiveEmbeddingBox,
  archiveSlide: mockArchiveSlide,
  archiveSpecimen: mockArchiveSpecimen,
  batchCreateArchiveCabinets: mockBatchCreateArchiveCabinets,
  createArchiveCabinet: mockCreateArchiveCabinet,
  deleteArchiveCabinet: mockDeleteArchiveCabinet,
  listArchiveCabinets: mockListArchiveCabinets,
  listArchiveObjects: mockListArchiveObjects,
  listAvailableArchivePositions: mockListAvailableArchivePositions,
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
      M5_PERMISSION_CODES.ARCHIVE_CABINET_DELETE,
      M5_PERMISSION_CODES.APPLICATION_FORM_ARCHIVE,
      M5_PERMISSION_CODES.SPECIMEN_ARCHIVE,
      M5_PERMISSION_CODES.ARCHIVE_QUERY,
    ];

    mockListArchiveCabinets.mockResolvedValue([createCabinet()]);
    mockListArchiveObjects.mockImplementation(
      async ({
        objectType,
        page = 1,
        size = 20,
      }: {
        objectType: string;
        page?: number;
        size?: number;
      }) => ({
        items: [
          createRecord({
            objectId: `${objectType}-OBJECT-1`,
            objectType,
          }),
        ],
        page,
        size,
        total: 1,
      }),
    );
    mockListAvailableArchivePositions.mockResolvedValue([createPosition()]);
    mockSearchArchiveRecords.mockResolvedValue([createRecord()]);

    mockArchiveApplicationForm.mockResolvedValue({
      archiveLocation: 'CAB-01-L1-S1',
      archiveStatus: 'IN_STORAGE',
      caseId: 'CASE-1',
      objectId: 'OBJECT-1',
      objectType: 'APPLICATION_FORM',
    });
    mockArchiveEmbeddingBox.mockResolvedValue({});
    mockArchiveSlide.mockResolvedValue({});
    mockArchiveSpecimen.mockResolvedValue({});
    mockBatchCreateArchiveCabinets.mockResolvedValue([
      createCabinet({ cabinetCode: 'CAB-B001', id: 'CABINET-B1' }),
      createCabinet({ cabinetCode: 'CAB-B002', id: 'CABINET-B2' }),
    ]);
    mockCreateArchiveCabinet.mockResolvedValue(createCabinet());
    mockDeleteArchiveCabinet.mockResolvedValue(undefined);
    messageBoxConfirmMock.mockResolvedValue('confirm');
    mockUpdateArchiveCabinet.mockResolvedValue(
      createCabinet({ cabinetStatus: 'DISABLED' }),
    );
  });

  afterEach(() => {
    messageErrorMock.mockReset();
    messageBoxConfirmMock.mockReset();
    messageSuccessMock.mockReset();
    messageWarningMock.mockReset();

    mockArchiveApplicationForm.mockReset();
    mockArchiveEmbeddingBox.mockReset();
    mockArchiveSlide.mockReset();
    mockArchiveSpecimen.mockReset();
    mockBatchCreateArchiveCabinets.mockReset();
    mockCreateArchiveCabinet.mockReset();
    mockDeleteArchiveCabinet.mockReset();
    mockListArchiveCabinets.mockReset();
    mockListArchiveObjects.mockReset();
    mockListAvailableArchivePositions.mockReset();
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
    expect(
      state.recordWorkspace.objectLists.APPLICATION_FORM.items,
    ).toHaveLength(1);
    expect(state.recordWorkspace.objectLists.EMBEDDING_BOX.items).toHaveLength(
      0,
    );
    expect(state.recordWorkspace.objectLists.SLIDE.items).toHaveLength(0);
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
    expect(mockListArchiveObjects).toHaveBeenCalledWith({
      keyword: undefined,
      objectType: 'APPLICATION_FORM',
      page: 1,
      size: 20,
    });

    wrapper.destroy();
  });

  it('keeps archive object list filters and pagination independent by tab', async () => {
    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    mockListArchiveObjects.mockClear();

    state.recordWorkspace.objectLists.APPLICATION_FORM.filters.keyword =
      ' APP-001 ';
    await state.recordWorkspace.queryArchiveObjects('APPLICATION_FORM');
    state.recordWorkspace.objectLists.SLIDE.filters.keyword = ' S-001 ';
    await state.recordWorkspace.setArchiveObjectPage('SLIDE', 3);

    expect(mockListArchiveObjects).toHaveBeenNthCalledWith(1, {
      keyword: 'APP-001',
      objectType: 'APPLICATION_FORM',
      page: 1,
      size: 20,
    });
    expect(mockListArchiveObjects).toHaveBeenNthCalledWith(2, {
      keyword: 'S-001',
      objectType: 'SLIDE',
      page: 3,
      size: 20,
    });
    expect(
      state.recordWorkspace.objectLists.APPLICATION_FORM.filters.keyword,
    ).toBe(' APP-001 ');
    expect(state.recordWorkspace.objectLists.SLIDE.filters.keyword).toBe(
      ' S-001 ',
    );
    expect(
      state.recordWorkspace.objectLists.APPLICATION_FORM.filters.page,
    ).toBe(1);
    expect(state.recordWorkspace.objectLists.SLIDE.filters.page).toBe(3);

    wrapper.destroy();
  });

  it('maps cabinet dialog state from current rows', async () => {
    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    const cabinet = state.cabinetWorkspace.cabinets[0];

    expect(cabinet).toBeTruthy();

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
    mockListArchiveObjects.mockClear();

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
    expect(mockListArchiveObjects).toHaveBeenCalledWith({
      keyword: undefined,
      objectType: 'APPLICATION_FORM',
      page: 1,
      size: 20,
    });
    expect(state.archiveWorkspace.archiveForm.caseId).toBe('');
    expect(state.archiveWorkspace.archiveForm.operatorName).toBe('归档员甲');

    wrapper.destroy();
  });

  it('submits specimen archive with independent permission and refreshes specimen list', async () => {
    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    await state.recordWorkspace.setActiveArchiveObjectType('SPECIMEN');
    const position = state.cabinetWorkspace.positionRows[0];
    state.cabinetWorkspace.selectPosition(position!);
    messageSuccessMock.mockClear();

    mockListAvailableArchivePositions.mockClear();
    mockListArchiveObjects.mockClear();

    state.archiveWorkspace.openArchiveDialog('SPECIMEN');
    state.archiveWorkspace.archiveForm.specimenId = ' SPECIMEN-1 ';
    state.archiveWorkspace.archiveForm.remarks = ' 标本归档 ';

    await state.archiveWorkspace.submitArchive();

    expect(mockArchiveSpecimen).toHaveBeenCalledWith({
      archivePositionId: 'POSITION-1',
      operatorName: '归档员甲',
      operatorUserId: 'USER-ARCHIVE-1',
      remarks: '标本归档',
      specimenId: 'SPECIMEN-1',
      terminalCode: undefined,
    });
    expect(messageSuccessMock).toHaveBeenCalledWith('标本归档已完成。');
    expect(mockListAvailableArchivePositions).toHaveBeenCalledTimes(1);
    expect(mockListArchiveObjects).toHaveBeenCalledWith({
      keyword: undefined,
      objectType: 'SPECIMEN',
      page: 1,
      size: 20,
    });
    expect(state.archiveWorkspace.archiveForm.specimenId).toBe('');
    expect(state.archiveWorkspace.archiveDialogVisible).toBe(false);

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

  it('batch creates cabinets and refreshes cabinet data', async () => {
    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    state.cabinetWorkspace.openBatchCreateCabinetDialog();
    expect(state.cabinetWorkspace.batchCabinetDialogVisible).toBe(true);

    Object.assign(state.cabinetWorkspace.batchCabinetForm, {
      cabinetCodePrefix: ' CAB-B ',
      cabinetNamePrefix: ' 批量柜 ',
      count: 2,
      layerCount: 1,
      numberWidth: 3,
      slotCountPerLayer: 10,
      startNo: 1,
    });

    mockListArchiveCabinets.mockClear();
    mockListAvailableArchivePositions.mockClear();

    await state.cabinetWorkspace.submitBatchCabinets();

    expect(mockBatchCreateArchiveCabinets).toHaveBeenCalledWith({
      cabinetCodePrefix: 'CAB-B',
      cabinetNamePrefix: '批量柜',
      cabinetType: 'STANDARD',
      count: 2,
      layerCount: 1,
      locationDescription: undefined,
      numberWidth: 3,
      operatorName: '归档员甲',
      operatorUserId: 'USER-ARCHIVE-1',
      remarks: undefined,
      slotCountPerLayer: 10,
      startNo: 1,
      terminalCode: undefined,
    });
    expect(messageSuccessMock).toHaveBeenCalledWith('已批量新增 2 个归档柜。');
    expect(state.cabinetWorkspace.batchCabinetDialogVisible).toBe(false);
    expect(mockListArchiveCabinets).toHaveBeenCalledTimes(1);
    expect(mockListAvailableArchivePositions).toHaveBeenCalledTimes(1);

    wrapper.destroy();
  });

  it('confirms and deletes an empty archive cabinet', async () => {
    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    const cabinet = state.cabinetWorkspace.cabinets[0];

    mockListArchiveCabinets.mockClear();
    mockListAvailableArchivePositions.mockClear();

    await state.cabinetWorkspace.deleteCabinet(cabinet!);

    expect(messageBoxConfirmMock).toHaveBeenCalled();
    expect(mockDeleteArchiveCabinet).toHaveBeenCalledWith('CABINET-1');
    expect(messageSuccessMock).toHaveBeenCalledWith('归档柜已删除。');
    expect(mockListArchiveCabinets).toHaveBeenCalledTimes(1);
    expect(mockListAvailableArchivePositions).toHaveBeenCalledTimes(1);

    wrapper.destroy();
  });
});
