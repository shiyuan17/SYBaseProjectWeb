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
  mockBatchArchiveEmbeddingBoxes,
  mockBatchArchiveSlides,
  mockBatchArchiveSpecimens,
  mockBatchCreateArchiveCabinets,
  mockCreateMaterialLoan,
  mockCreateArchiveCabinet,
  mockCreateArchiveCabinetNode,
  mockDeleteArchiveCabinet,
  mockListArchiveCabinets,
  mockListArchiveCabinetNodes,
  mockListArchiveObjects,
  mockListAvailableArchivePositions,
  mockListMaterialLoans,
  mockSearchArchiveRecords,
  mockUpdateArchiveCabinet,
  mockUpdateArchiveCabinetNode,
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
  mockBatchArchiveEmbeddingBoxes: vi.fn(),
  mockBatchArchiveSlides: vi.fn(),
  mockBatchArchiveSpecimens: vi.fn(),
  mockBatchCreateArchiveCabinets: vi.fn(),
  mockCreateMaterialLoan: vi.fn(),
  mockCreateArchiveCabinet: vi.fn(),
  mockCreateArchiveCabinetNode: vi.fn(),
  mockDeleteArchiveCabinet: vi.fn(),
  mockListArchiveCabinets: vi.fn(),
  mockListArchiveCabinetNodes: vi.fn(),
  mockListArchiveObjects: vi.fn(),
  mockListAvailableArchivePositions: vi.fn(),
  mockListMaterialLoans: vi.fn(),
  mockSearchArchiveRecords: vi.fn(),
  mockUpdateArchiveCabinet: vi.fn(),
  mockUpdateArchiveCabinetNode: vi.fn(),
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
  batchArchiveEmbeddingBoxes: mockBatchArchiveEmbeddingBoxes,
  batchArchiveSlides: mockBatchArchiveSlides,
  batchArchiveSpecimens: mockBatchArchiveSpecimens,
  batchCreateArchiveCabinets: mockBatchCreateArchiveCabinets,
  createMaterialLoan: mockCreateMaterialLoan,
  createArchiveCabinet: mockCreateArchiveCabinet,
  createArchiveCabinetNode: mockCreateArchiveCabinetNode,
  deleteArchiveCabinet: mockDeleteArchiveCabinet,
  listArchiveCabinets: mockListArchiveCabinets,
  listArchiveCabinetNodes: mockListArchiveCabinetNodes,
  listArchiveObjects: mockListArchiveObjects,
  listAvailableArchivePositions: mockListAvailableArchivePositions,
  listMaterialLoans: mockListMaterialLoans,
  searchArchiveRecords: mockSearchArchiveRecords,
  updateArchiveCabinet: mockUpdateArchiveCabinet,
  updateArchiveCabinetNode: mockUpdateArchiveCabinetNode,
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

function createCabinetNode(overrides = {}) {
  return {
    cabinetId: 'CABINET-1',
    cabinetType: 'APPLICATION_FORM',
    capacity: 4,
    id: 'NODE-CABINET-1',
    nodeCode: 'CAB-01',
    nodeType: 'CABINET',
    parentId: 'NODE-AREA-1',
    pathLocation: 'B1 走廊',
    remainingCapacity: 1,
    remarks: '可用',
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
      M5_PERMISSION_CODES.EMBEDDING_BOX_ARCHIVE,
      M5_PERMISSION_CODES.SLIDE_ARCHIVE,
      M5_PERMISSION_CODES.SPECIMEN_ARCHIVE,
      M5_PERMISSION_CODES.ARCHIVE_QUERY,
      M5_PERMISSION_CODES.LOAN_CREATE,
      M5_PERMISSION_CODES.LOAN_QUERY,
    ];

    mockListArchiveCabinets.mockResolvedValue([createCabinet()]);
    mockListArchiveCabinetNodes.mockResolvedValue([
      createCabinetNode({
        cabinetId: null,
        capacity: 0,
        id: 'NODE-AREA-1',
        nodeCode: '申请单',
        nodeType: 'AREA',
        parentId: null,
        remainingCapacity: 1,
      }),
      createCabinetNode(),
    ]);
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
    mockListMaterialLoans.mockResolvedValue([]);
    mockSearchArchiveRecords.mockResolvedValue([createRecord()]);

    mockArchiveApplicationForm.mockResolvedValue({
      archiveLocation: 'CAB-01-L1-S1',
      archiveStatus: 'IN_STORAGE',
      caseId: 'CASE-1',
      objectId: 'OBJECT-1',
      objectType: 'APPLICATION_FORM',
    });
    mockBatchArchiveEmbeddingBoxes.mockResolvedValue([]);
    mockBatchArchiveSlides.mockResolvedValue([]);
    mockBatchArchiveSpecimens.mockResolvedValue([]);
    mockBatchCreateArchiveCabinets.mockResolvedValue([
      createCabinet({ cabinetCode: 'CAB-B001', id: 'CABINET-B1' }),
      createCabinet({ cabinetCode: 'CAB-B002', id: 'CABINET-B2' }),
    ]);
    mockCreateMaterialLoan.mockResolvedValue({
      caseId: 'CASE-BOX-1',
      loanId: 'LOAN-1',
      loanStatus: 'BORROWED',
      materialId: 'BOX-1',
      materialType: 'EMBEDDING_BOX',
    });
    mockCreateArchiveCabinet.mockResolvedValue(createCabinet());
    mockCreateArchiveCabinetNode.mockResolvedValue(createCabinetNode());
    mockDeleteArchiveCabinet.mockResolvedValue(undefined);
    messageBoxConfirmMock.mockResolvedValue('confirm');
    mockUpdateArchiveCabinet.mockResolvedValue(
      createCabinet({ cabinetStatus: 'DISABLED' }),
    );
    mockUpdateArchiveCabinetNode.mockResolvedValue(createCabinetNode());
  });

  afterEach(() => {
    messageErrorMock.mockReset();
    messageBoxConfirmMock.mockReset();
    messageSuccessMock.mockReset();
    messageWarningMock.mockReset();

    mockArchiveApplicationForm.mockReset();
    mockBatchArchiveEmbeddingBoxes.mockReset();
    mockBatchArchiveSlides.mockReset();
    mockBatchArchiveSpecimens.mockReset();
    mockBatchCreateArchiveCabinets.mockReset();
    mockCreateMaterialLoan.mockReset();
    mockCreateArchiveCabinet.mockReset();
    mockCreateArchiveCabinetNode.mockReset();
    mockDeleteArchiveCabinet.mockReset();
    mockListArchiveCabinets.mockReset();
    mockListArchiveCabinetNodes.mockReset();
    mockListArchiveObjects.mockReset();
    mockListAvailableArchivePositions.mockReset();
    mockListMaterialLoans.mockReset();
    mockSearchArchiveRecords.mockReset();
    mockUpdateArchiveCabinet.mockReset();
    mockUpdateArchiveCabinetNode.mockReset();

    mockAccessStore.accessCodes = [];
    mockUserStore.userInfo = {
      realName: '归档员甲',
      userId: 'USER-ARCHIVE-1',
    };
    document.body.innerHTML = '';
  });

  it('initializes archive workbench state with only the default object tab loaded', async () => {
    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    expect(state).toBeTruthy();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    expect(state.capabilities.canViewArchivePage).toBe(true);
    expect(
      state.recordWorkspace.objectLists.APPLICATION_FORM.items,
    ).toHaveLength(1);
    expect(state.recordWorkspace.objectLists.EMBEDDING_BOX.items).toHaveLength(
      0,
    );
    expect(state.recordWorkspace.objectLists.SLIDE.items).toHaveLength(0);
    expect(state.recordWorkspace.objectLists.SPECIMEN.items).toHaveLength(0);
    expect(state.cabinetWorkspace.cabinets).toHaveLength(0);
    expect(state.cabinetWorkspace.cabinetNodes).toHaveLength(0);
    expect(state.cabinetWorkspace.positionRows).toHaveLength(0);
    expect(state.cabinetWorkspace.positionSummary).toEqual({
      available: 0,
      disabled: 0,
      occupied: 0,
      total: 0,
    });
    expect(state.cabinetWorkspace.selectedPositionLabel).toBe('未选择柜位');
    expect(mockListArchiveCabinets).not.toHaveBeenCalled();
    expect(mockListArchiveCabinetNodes).not.toHaveBeenCalled();
    expect(mockListAvailableArchivePositions).not.toHaveBeenCalled();
    expect(mockListArchiveObjects).toHaveBeenCalledWith({
      keyword: undefined,
      objectType: 'APPLICATION_FORM',
      page: 1,
      size: 20,
    });

    wrapper.destroy();
  });

  it('loads cabinet workbench data only on the first explicit request', async () => {
    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    mockListArchiveCabinets.mockClear();
    mockListArchiveCabinetNodes.mockClear();
    mockListAvailableArchivePositions.mockClear();

    await state.cabinetWorkspace.loadWorkbenchIfNeeded();

    expect(state.cabinetWorkspace.cabinets).toHaveLength(1);
    expect(state.cabinetWorkspace.cabinetNodes).toHaveLength(2);
    expect(state.cabinetWorkspace.positionRows).toHaveLength(4);
    expect(state.cabinetWorkspace.positionSummary).toEqual({
      available: 1,
      disabled: 0,
      occupied: 3,
      total: 4,
    });
    expect(mockListArchiveCabinets).toHaveBeenCalledTimes(1);
    expect(mockListArchiveCabinetNodes).toHaveBeenCalledTimes(1);
    expect(mockListAvailableArchivePositions).toHaveBeenCalledWith({
      cabinetId: undefined,
      cabinetType: undefined,
    });

    await state.cabinetWorkspace.loadWorkbenchIfNeeded();

    expect(mockListArchiveCabinets).toHaveBeenCalledTimes(1);
    expect(mockListArchiveCabinetNodes).toHaveBeenCalledTimes(1);
    expect(mockListAvailableArchivePositions).toHaveBeenCalledTimes(1);

    state.cabinetWorkspace.selectPosition(
      state.cabinetWorkspace.positionRows[0]!,
    );

    expect(state.cabinetWorkspace.selectedPositionCode).toBe('CAB-01-L1-S1');
    expect(state.cabinetWorkspace.selectedPositionLabel).toBe('CAB-01-L1-S1');
    expect(messageSuccessMock).toHaveBeenCalledWith('已选择柜位 CAB-01-L1-S1');

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

    await state.cabinetWorkspace.loadWorkbenchIfNeeded();

    const cabinet = state.cabinetWorkspace.cabinets[0];

    expect(cabinet).toBeTruthy();

    state.cabinetWorkspace.openEditCabinetDialog(cabinet!);
    expect(state.cabinetWorkspace.cabinetDialogVisible).toBe(true);
    expect(state.cabinetWorkspace.cabinetDialogMode).toBe('edit');
    expect(state.cabinetWorkspace.cabinetForm.cabinetCode).toBe('CAB-01');
    expect(state.cabinetWorkspace.cabinetForm.locationDescription).toBe(
      'B1 走廊',
    );
    expect(state.cabinetWorkspace.cabinetForm.nodeCode).toBe('CAB-01');
    expect(state.cabinetWorkspace.cabinetForm.operatorName).toBe('归档员甲');

    state.cabinetWorkspace.openCreateCabinetDialog();
    expect(state.cabinetWorkspace.cabinetDialogMode).toBe('create');
    expect(state.cabinetWorkspace.cabinetForm.cabinetCode).toBe('');
    expect(state.cabinetWorkspace.cabinetForm.nodeType).toBe('CABINET');
    expect(state.cabinetWorkspace.cabinetForm.operatorName).toBe('归档员甲');

    wrapper.destroy();
  });

  it('creates an archive cabinet node and refreshes node data', async () => {
    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    state.cabinetWorkspace.openCreateCabinetDialog();
    Object.assign(state.cabinetWorkspace.cabinetForm, {
      cabinetType: 'SLIDE',
      capacity: 8,
      nodeCode: ' CAB-NODE-1 ',
      nodeType: 'CABINET',
      parentId: ' NODE-AREA-1 ',
      pathLocation: ' 2F ',
      remarks: ' 新增节点 ',
    });

    mockListArchiveCabinets.mockClear();
    mockListArchiveCabinetNodes.mockClear();
    mockListAvailableArchivePositions.mockClear();

    await state.cabinetWorkspace.submitCabinet();

    expect(mockCreateArchiveCabinetNode).toHaveBeenCalledWith({
      cabinetType: 'SLIDE',
      capacity: 8,
      nodeCode: 'CAB-NODE-1',
      nodeType: 'CABINET',
      parentId: 'NODE-AREA-1',
      pathLocation: '2F',
      remarks: '新增节点',
      terminalCode: undefined,
    });
    expect(messageSuccessMock).toHaveBeenCalledWith('归档柜节点已创建。');
    expect(mockListArchiveCabinets).toHaveBeenCalledTimes(1);
    expect(mockListArchiveCabinetNodes).toHaveBeenCalledTimes(1);
    expect(mockListAvailableArchivePositions).toHaveBeenCalledTimes(1);

    wrapper.destroy();
  });

  it('submits application-form archive and refreshes dependent workbench data', async () => {
    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    await state.cabinetWorkspace.loadWorkbenchIfNeeded();

    const position = state.cabinetWorkspace.positionRows[0];

    expect(position?.selectable).toBe(true);

    state.cabinetWorkspace.selectPosition(position!);
    messageSuccessMock.mockClear();

    mockListAvailableArchivePositions.mockClear();
    mockListArchiveObjects.mockClear();

    expect(state.archiveWorkspace.archiveDialogVisible).toBe(false);

    state.archiveWorkspace.openArchiveDialog('APPLICATION_FORM');

    expect(messageWarningMock).toHaveBeenCalledWith(
      '请先勾选至少一条申请单记录。',
    );
    expect(state.archiveWorkspace.archiveDialogVisible).toBe(false);

    state.recordWorkspace.setSelectedApplicationFormRecords([
      {
        caseId: ' CASE-1 ',
        objectId: 'OBJECT-1',
        objectType: 'APPLICATION_FORM',
        pathologyNo: 'BL-2026-001',
        patientName: '张三',
      },
      {
        caseId: ' CASE-2 ',
        objectId: 'OBJECT-2',
        objectType: 'APPLICATION_FORM',
        pathologyNo: 'BL-2026-002',
        patientName: '李四',
      },
    ]);
    state.archiveWorkspace.archiveForm.remarks = ' 已归档 ';

    state.archiveWorkspace.openArchiveDialog('APPLICATION_FORM');

    expect(state.archiveWorkspace.applicationFormDialogVisible).toBe(true);
    expect(state.archiveWorkspace.archiveForm.archiveCabinetId).toBe(
      'CABINET-1',
    );

    await state.archiveWorkspace.submitArchive();

    expect(mockListAvailableArchivePositions).toHaveBeenNthCalledWith(1, {
      cabinetId: 'CABINET-1',
    });
    expect(mockArchiveApplicationForm).toHaveBeenNthCalledWith(1, {
      archivePositionId: 'POSITION-1',
      caseId: 'CASE-1',
      fileName: undefined,
      fileUrl: undefined,
      remarks: '已归档',
      terminalCode: undefined,
    });
    expect(mockArchiveApplicationForm).toHaveBeenNthCalledWith(2, {
      archivePositionId: 'POSITION-1',
      caseId: 'CASE-2',
      fileName: undefined,
      fileUrl: undefined,
      remarks: '已归档',
      terminalCode: undefined,
    });
    expect(messageSuccessMock).toHaveBeenCalledWith('申请单归档已完成。');
    expect(mockListAvailableArchivePositions).toHaveBeenNthCalledWith(2, {
      cabinetId: undefined,
      cabinetType: undefined,
    });
    expect(mockListAvailableArchivePositions).toHaveBeenCalledTimes(2);
    expect(mockListArchiveObjects).toHaveBeenCalledWith({
      keyword: undefined,
      objectType: 'APPLICATION_FORM',
      page: 1,
      size: 20,
    });
    expect(state.archiveWorkspace.applicationFormDialogVisible).toBe(false);
    expect(state.recordWorkspace.selectedApplicationFormRecords).toEqual([]);
    expect(state.archiveWorkspace.archiveForm.operatorName).toBe('归档员甲');

    wrapper.destroy();
  });

  it('stops application-form archive submission at the first failed record', async () => {
    mockArchiveApplicationForm
      .mockResolvedValueOnce({
        archiveLocation: 'CAB-01-L1-S1',
        archiveStatus: 'IN_STORAGE',
        caseId: 'CASE-1',
        objectId: 'OBJECT-1',
        objectType: 'APPLICATION_FORM',
      })
      .mockRejectedValueOnce(new Error('第二条失败'));

    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    await state.cabinetWorkspace.loadWorkbenchIfNeeded();

    const position = state.cabinetWorkspace.positionRows[0];
    state.cabinetWorkspace.selectPosition(position!);
    messageSuccessMock.mockClear();
    messageErrorMock.mockClear();
    mockListAvailableArchivePositions.mockClear();
    mockListArchiveObjects.mockClear();

    state.recordWorkspace.setSelectedApplicationFormRecords([
      {
        caseId: 'CASE-1',
        objectId: 'OBJECT-1',
        objectType: 'APPLICATION_FORM',
        pathologyNo: 'BL-2026-001',
        patientName: '张三',
      },
      {
        caseId: 'CASE-2',
        objectId: 'OBJECT-2',
        objectType: 'APPLICATION_FORM',
        pathologyNo: 'BL-2026-002',
        patientName: '李四',
      },
      {
        caseId: 'CASE-3',
        objectId: 'OBJECT-3',
        objectType: 'APPLICATION_FORM',
        pathologyNo: 'BL-2026-003',
        patientName: '王五',
      },
    ]);
    state.archiveWorkspace.archiveForm.remarks = ' 逐条归档 ';
    state.archiveWorkspace.openArchiveDialog('APPLICATION_FORM');
    expect(state.archiveWorkspace.archiveForm.archiveCabinetId).toBe(
      'CABINET-1',
    );

    await state.archiveWorkspace.submitArchive();

    expect(mockListAvailableArchivePositions).toHaveBeenNthCalledWith(1, {
      cabinetId: 'CABINET-1',
    });
    expect(mockArchiveApplicationForm).toHaveBeenCalledTimes(2);
    expect(mockArchiveApplicationForm).toHaveBeenNthCalledWith(1, {
      archivePositionId: 'POSITION-1',
      caseId: 'CASE-1',
      fileName: undefined,
      fileUrl: undefined,
      remarks: '逐条归档',
      terminalCode: undefined,
    });
    expect(mockArchiveApplicationForm).toHaveBeenNthCalledWith(2, {
      archivePositionId: 'POSITION-1',
      caseId: 'CASE-2',
      fileName: undefined,
      fileUrl: undefined,
      remarks: '逐条归档',
      terminalCode: undefined,
    });
    expect(state.archiveWorkspace.applicationFormDialogVisible).toBe(true);
    expect(state.recordWorkspace.selectedApplicationFormRecords).toHaveLength(
      3,
    );
    expect(mockListAvailableArchivePositions).toHaveBeenCalledTimes(1);
    expect(mockListAvailableArchivePositions).toHaveBeenCalledWith({
      cabinetId: 'CABINET-1',
    });
    expect(mockListArchiveObjects).not.toHaveBeenCalled();
    expect(messageErrorMock).toHaveBeenCalledWith(
      '申请单 BL-2026-002 归档失败：第二条失败',
    );

    wrapper.destroy();
  });

  it('submits selected specimen records through batch archive and refreshes specimen list', async () => {
    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    await state.recordWorkspace.setActiveArchiveObjectType('SPECIMEN');
    messageSuccessMock.mockClear();

    mockListAvailableArchivePositions.mockClear();
    mockListArchiveObjects.mockClear();

    state.recordWorkspace.setSelectedArchiveObjectRecords('SPECIMEN', [
      {
        caseId: 'CASE-1',
        objectId: ' SPECIMEN-1 ',
        objectType: 'SPECIMEN',
        pathologyNo: 'BL-2026-001',
        patientName: '张三',
      },
    ]);
    state.archiveWorkspace.openArchiveDialog('SPECIMEN');
    state.archiveWorkspace.archiveForm.archiveCabinetId = 'CABINET-1';
    state.archiveWorkspace.archiveForm.archiveExpiresAt = '2026-06-30T18:00:00';
    state.archiveWorkspace.archiveForm.archiveReminderDays = 1;
    state.archiveWorkspace.archiveForm.remarks = ' 标本归档 ';

    await state.archiveWorkspace.submitArchive();

    expect(mockBatchArchiveSpecimens).toHaveBeenCalledWith({
      archiveCabinetId: 'CABINET-1',
      archiveExpiresAt: '2026-06-30T18:00:00',
      archiveReminderDays: 1,
      objectIds: ['SPECIMEN-1'],
      remarks: '标本归档',
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
    expect(state.archiveWorkspace.archiveForm.archiveCabinetId).toBe('');
    expect(state.archiveWorkspace.physicalArchiveDialogVisible).toBe(false);
    expect(state.recordWorkspace.selectedSpecimenRecords).toHaveLength(0);

    wrapper.destroy();
  });

  it('keeps selected physical records when batch archive fails', async () => {
    mockBatchArchiveEmbeddingBoxes.mockRejectedValueOnce(new Error('柜位不足'));

    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    await state.recordWorkspace.setActiveArchiveObjectType('EMBEDDING_BOX');
    state.recordWorkspace.setSelectedArchiveObjectRecords('EMBEDDING_BOX', [
      {
        caseId: 'CASE-BOX-1',
        objectId: 'BOX-1',
        objectType: 'EMBEDDING_BOX',
        pathologyNo: 'BL-2026-002',
      },
    ]);
    state.archiveWorkspace.openArchiveDialog('EMBEDDING_BOX');
    state.archiveWorkspace.archiveForm.archiveCabinetId = 'CABINET-1';

    mockListAvailableArchivePositions.mockClear();
    mockListArchiveObjects.mockClear();

    await state.archiveWorkspace.submitArchive();

    expect(mockBatchArchiveEmbeddingBoxes).toHaveBeenCalledWith({
      archiveCabinetId: 'CABINET-1',
      objectIds: ['BOX-1'],
      remarks: undefined,
      terminalCode: undefined,
    });
    expect(messageErrorMock).toHaveBeenCalledWith('柜位不足');
    expect(state.archiveWorkspace.physicalArchiveDialogVisible).toBe(true);
    expect(state.recordWorkspace.selectedEmbeddingBoxRecords).toHaveLength(1);
    expect(mockListAvailableArchivePositions).not.toHaveBeenCalled();
    expect(mockListArchiveObjects).not.toHaveBeenCalled();

    wrapper.destroy();
  });

  it('opens archive-page borrow dialog for selected embedding boxes and refreshes selected rows with latest state', async () => {
    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    await state.recordWorkspace.setActiveArchiveObjectType('EMBEDDING_BOX');
    const selectedRecord = createRecord({
      archiveStatus: 'IN_STORAGE',
      loanStatus: 'NONE',
      objectCode: 'A1',
      objectId: 'BOX-1',
      objectType: 'EMBEDDING_BOX',
      pathologyNo: 'BL-2026-010',
    });

    state.recordWorkspace.setSelectedArchiveObjectRecords('EMBEDDING_BOX', [
      selectedRecord,
      createRecord({
        archiveStatus: 'IN_STORAGE',
        loanStatus: 'BORROWED',
        objectCode: 'A2',
        objectId: 'BOX-2',
        objectType: 'EMBEDDING_BOX',
      }),
      createRecord({
        archiveStatus: 'NOT_ARCHIVED',
        loanStatus: 'NONE',
        objectCode: 'A3',
        objectId: 'BOX-3',
        objectType: 'EMBEDDING_BOX',
      }),
    ]);

    state.loanWorkspace.openBorrowDialogForRecords(
      'EMBEDDING_BOX',
      state.recordWorkspace.selectedEmbeddingBoxRecords,
    );
    state.loanWorkspace.loanForm.borrowedByName = ' 张三 ';
    state.loanWorkspace.loanForm.borrowerPhone = ' 13800000000 ';
    state.loanWorkspace.loanForm.borrowerUnit = ' 外借单位 ';
    state.loanWorkspace.loanForm.depositAmount = ' 66 ';
    state.loanWorkspace.loanForm.remarks = ' 借记备注 ';

    expect(state.loanWorkspace.borrowDialogVisible).toBe(true);
    expect(state.loanWorkspace.borrowDialogMode).toBe('EMBEDDING_BOX');
    expect(state.loanWorkspace.loanForm.materialType).toBe('EMBEDDING_BOX');
    expect(state.loanWorkspace.loanForm.materialId).toBe('BOX-1');

    mockListAvailableArchivePositions.mockClear();
    mockListArchiveCabinetNodes.mockClear();
    mockListArchiveObjects.mockClear();
    mockListArchiveObjects.mockResolvedValueOnce({
      items: [
        {
          ...selectedRecord,
          borrowedByName: '张三',
          loanStatus: 'BORROWED',
        },
        {
          archiveStatus: 'NOT_ARCHIVED',
          borrowedByName: '张三',
          caseId: 'CASE-3',
          loanStatus: 'BORROWED',
          objectCode: 'A3',
          objectId: 'BOX-3',
          objectType: 'EMBEDDING_BOX',
          pathologyNo: 'BL-2026-003',
          patientName: '患者丙',
        },
      ],
      page: 1,
      size: 20,
      total: 2,
    });

    await state.loanWorkspace.submitLoan();

    expect(mockCreateMaterialLoan).toHaveBeenCalledTimes(2);
    expect(mockCreateMaterialLoan).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        borrowerPhone: '13800000000',
        borrowerUnit: '外借单位',
        borrowedByName: '张三',
        depositAmount: '66',
        materialId: 'BOX-1',
        materialType: 'EMBEDDING_BOX',
        remarks: '借记备注',
      }),
    );
    expect(mockCreateMaterialLoan).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        borrowerPhone: '13800000000',
        borrowerUnit: '外借单位',
        borrowedByName: '张三',
        depositAmount: '66',
        materialId: 'BOX-3',
        materialType: 'EMBEDDING_BOX',
        remarks: '借记备注',
      }),
    );
    expect(messageWarningMock).toHaveBeenCalledWith(
      '借记完成：成功 2 条，跳过 1 条，失败 0 条。跳过原因：已借出。',
    );
    expect(mockListArchiveCabinetNodes).toHaveBeenCalledTimes(1);
    expect(mockListAvailableArchivePositions).toHaveBeenCalledTimes(1);
    expect(mockListArchiveObjects).toHaveBeenCalledWith({
      keyword: undefined,
      objectType: 'EMBEDDING_BOX',
      page: 1,
      size: 20,
    });
    expect(state.loanWorkspace.borrowDialogVisible).toBe(false);
    expect(state.recordWorkspace.selectedEmbeddingBoxRecords).toEqual([
      expect.objectContaining({
        borrowedByName: '张三',
        loanStatus: 'BORROWED',
        objectId: 'BOX-1',
      }),
      expect.objectContaining({
        borrowedByName: '张三',
        loanStatus: 'BORROWED',
        objectId: 'BOX-3',
      }),
    ]);

    wrapper.destroy();
  });

  it('toggles cabinet status with current operator identity and refreshes cabinet data', async () => {
    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    await state.cabinetWorkspace.loadWorkbenchIfNeeded();

    const cabinet = state.cabinetWorkspace.cabinets[0];

    mockListArchiveCabinets.mockClear();
    mockListArchiveCabinetNodes.mockClear();
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
    expect(mockListArchiveCabinetNodes).toHaveBeenCalledTimes(1);
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
      parentId: 'NODE-AREA-1',
      layerCount: 1,
      numberWidth: 3,
      slotCountPerLayer: 10,
      startNo: 1,
    });

    mockListArchiveCabinets.mockClear();
    mockListArchiveCabinetNodes.mockClear();
    mockListAvailableArchivePositions.mockClear();

    await state.cabinetWorkspace.submitBatchCabinets();

    expect(mockBatchCreateArchiveCabinets).toHaveBeenCalledWith({
      cabinetCodePrefix: 'CAB-B',
      cabinetNamePrefix: '批量柜',
      cabinetType: 'APPLICATION_FORM',
      count: 2,
      layerCount: 1,
      locationDescription: undefined,
      numberWidth: 3,
      operatorName: '归档员甲',
      operatorUserId: 'USER-ARCHIVE-1',
      parentId: 'NODE-AREA-1',
      remarks: undefined,
      slotCountPerLayer: 10,
      startNo: 1,
      terminalCode: undefined,
    });
    expect(messageSuccessMock).toHaveBeenCalledWith('已批量新增 2 个归档柜。');
    expect(state.cabinetWorkspace.batchCabinetDialogVisible).toBe(false);
    expect(mockListArchiveCabinets).toHaveBeenCalledTimes(1);
    expect(mockListArchiveCabinetNodes).toHaveBeenCalledTimes(1);
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

    await state.cabinetWorkspace.loadWorkbenchIfNeeded();

    const cabinet = state.cabinetWorkspace.cabinets[0];

    mockListArchiveCabinets.mockClear();
    mockListArchiveCabinetNodes.mockClear();
    mockListAvailableArchivePositions.mockClear();

    await state.cabinetWorkspace.deleteCabinet(cabinet!);

    expect(messageBoxConfirmMock).toHaveBeenCalled();
    expect(mockDeleteArchiveCabinet).toHaveBeenCalledWith('CABINET-1');
    expect(messageSuccessMock).toHaveBeenCalledWith('归档柜已删除。');
    expect(mockListArchiveCabinets).toHaveBeenCalledTimes(1);
    expect(mockListArchiveCabinetNodes).toHaveBeenCalledTimes(1);
    expect(mockListAvailableArchivePositions).toHaveBeenCalledTimes(1);

    wrapper.destroy();
  });
});
