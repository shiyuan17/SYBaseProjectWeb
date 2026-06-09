import { createApp, h, nextTick, reactive, ref } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createButtonStub,
  createDialogStub,
  createInputStub,
  createOptionStub,
  createPassthroughStub,
  createSelectStub,
  createTableColumnStub,
  createTableStub,
} from '../test-utils/component-stubs';

const { rowContextKey } = vi.hoisted(() => ({
  rowContextKey: Symbol('row-context'),
}));

const mockHandleBindBarcode = vi.fn();
const mockHandleExportExcel = vi.fn();
const mockHandlePreprintBarcodes = vi.fn();
const mockHandlePrintBoundBarcodes = vi.fn();
const mockHandleReset = vi.fn();
const mockHandleRetryLabel = vi.fn();
const mockHandleSearch = vi.fn();
const mockHandleSelectionChange = vi.fn();
const mockHandleUnbindBarcode = vi.fn();
const mockSubmitRetryLabel = vi.fn();

vi.mock('element-plus', () => ({
  ElAlert: createPassthroughStub(),
  ElButton: createButtonStub(),
  ElCheckbox: createPassthroughStub('label'),
  ElDatePicker: createInputStub(),
  ElDialog: createDialogStub(),
  ElForm: createPassthroughStub('form'),
  ElFormItem: createPassthroughStub(),
  ElInput: createInputStub(),
  ElOption: createOptionStub(),
  ElPagination: createPassthroughStub(),
  ElSelect: createSelectStub(),
  ElTable: createTableStub(rowContextKey),
  ElTableColumn: createTableColumnStub(rowContextKey),
}));

vi.mock('../composables/useSpecimenBarcodeBindingPanel', () => ({
  useSpecimenBarcodeBindingPanel: () => {
    const filters = reactive({
      buildingId: 'B001',
      dateRange: ['2026-05-20', '2026-05-21'],
      onlyUnbound: false,
      page: 1,
      roomId: 'OR-101',
      size: 10,
    });
    const retryForm = reactive({
      operatorName: 'Test User',
      operatorUserId: 'USER-001',
      printerCode: '',
      remarks: '',
      terminalCode: '',
    });
    const row = {
      applicationNo: 'M2-001',
      barcode: null,
      patientGender: '女',
      patientId: 'P-001',
      patientName: 'Alice',
      registeredAt: '2026-05-20 08:00:00',
      registrationOperatorName: '李护士',
      specimenId: 'SPEC-001',
      specimenName: '乳腺组织',
      specimenNo: 'SP-001',
      specimenType: '常规',
      surgeryName: '惠侨楼 - 手术室 1',
    };

    return {
      actionLoading: ref(false),
      allRows: ref([row]),
      batchRetryResult: ref(null),
      buildingOptions: ref([
        {
          buildingId: 'B001',
          buildingName: '惠侨楼',
          floors: 1,
          location: '',
          operatingRooms: [],
        },
      ]),
      canBind: ref(true),
      canExportExcel: ref(true),
      canPrintBoundBarcodes: ref(true),
      canPreprint: ref(true),
      canRetryLabel: ref(true),
      canUnbind: ref(false),
      filters,
      handleBindBarcode: mockHandleBindBarcode,
      handleExportExcel: mockHandleExportExcel,
      handlePreprintBarcodes: mockHandlePreprintBarcodes,
      handlePrintBoundBarcodes: mockHandlePrintBoundBarcodes,
      handleReset: mockHandleReset,
      handleRetryLabel: mockHandleRetryLabel,
      handleSearch: mockHandleSearch,
      handleSelectionChange: mockHandleSelectionChange,
      handleUnbindBarcode: mockHandleUnbindBarcode,
      loading: ref(false),
      pageError: ref(''),
      pagedItems: ref([row]),
      resolveRoomLabel: (room: { buildingName: string; roomName: string }) =>
        `${room.buildingName} - ${room.roomName}`,
      retryDialogVisible: ref(false),
      retryForm,
      retrySubmitting: ref(false),
      retryTargetRows: ref([row]),
      roomOptions: ref([
        {
          buildingName: '惠侨楼',
          roomId: 'OR-101',
          roomName: '手术室 1',
        },
      ]),
      selectedRows: ref([row]),
      submitRetryLabel: mockSubmitRetryLabel,
      summary: ref({
        abnormalCount: 0,
        labelPrintedCount: 0,
        pendingLabelCount: 0,
        totalCount: 12,
        unboundCount: 3,
      }),
      targetBarcode: ref('BC-NEW-001'),
      total: ref(1),
    };
  },
}));

import SpecimenBarcodeBindingPanel from './SpecimenBarcodeBindingPanel.vue';

function mountView() {
  const container = document.createElement('div');
  document.body.append(container);
  const app = createApp({
    render: () => h(SpecimenBarcodeBindingPanel),
  });

  app.directive('loading', {});
  app.mount(container);

  return { app, container };
}

async function flush() {
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

describe('SpecimenBarcodeBindingPanel', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('renders the workbench layout and binds toolbar actions', async () => {
    const { app, container } = mountView();
    await flush();

    expect(container.textContent).toContain('条码绑定');
    expect(container.textContent).toContain('全部');
    expect(container.textContent).toContain('未绑定');
    expect(container.textContent).toContain('惠侨楼');
    expect(container.textContent).toContain('手术室 1');
    expect(container.textContent).toContain('仅显示未绑定');
    expect(container.textContent).toContain('条码绑定');
    expect(container.textContent).toContain('取消绑定');
    expect(container.textContent).toContain('补打标本标签');
    expect(container.textContent).toContain('打印');
    expect(container.textContent).toContain('导出 Excel');
    expect(container.textContent).toContain('预打印条码');
    expect(
      container.querySelector('[data-column-label="病人ID"]'),
    ).not.toBeNull();
    const columnLabels = [
      ...container.querySelectorAll('[data-column-label]'),
    ].map((column) => (column as HTMLElement).dataset.columnLabel);
    expect(columnLabels.slice(2, 5)).toEqual([
      '申请单',
      '标本编号',
      '标本条码',
    ]);
    expect(container.textContent).toContain('李护士');

    const bindButton = [...container.querySelectorAll('button')].find(
      (button) => button.textContent?.includes('条码绑定'),
    );
    const exportButton = [...container.querySelectorAll('button')].find(
      (button) => button.textContent?.includes('导出 Excel'),
    );
    const boundPrintButton = [...container.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === '打印',
    );
    const printButton = [...container.querySelectorAll('button')].find(
      (button) => button.textContent?.includes('预打印条码'),
    );

    bindButton?.click();
    exportButton?.click();
    boundPrintButton?.click();
    printButton?.click();
    await flush();

    expect(mockHandleBindBarcode).toHaveBeenCalledTimes(1);
    expect(mockHandleExportExcel).toHaveBeenCalledTimes(1);
    expect(mockHandlePrintBoundBarcodes).toHaveBeenCalledTimes(1);
    expect(mockHandlePreprintBarcodes).toHaveBeenCalledTimes(1);

    app.unmount();
  });
});
