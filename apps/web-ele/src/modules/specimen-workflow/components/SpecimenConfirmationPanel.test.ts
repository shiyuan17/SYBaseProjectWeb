import { createApp, h, nextTick, reactive, ref } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createButtonStub,
  createDialogStub,
  createInputStub,
  createPassthroughStub,
  createTableColumnStub,
  createTableStub,
  createTagStub,
} from '../test-utils/component-stubs';

const { rowContextKey } = vi.hoisted(() => ({
  rowContextKey: Symbol('row-context'),
}));

const mockHandleClearList = vi.fn();
const mockHandleClearSelectionRows = vi.fn();
const mockHandleConfirmRow = vi.fn();
const mockHandleConfirmSelected = vi.fn();
const mockHandleExportExcel = vi.fn();
const mockHandleOperatorChange = vi.fn();
const mockHandleReset = vi.fn();
const mockHandleRetryLabel = vi.fn();
const mockHandleSearch = vi.fn();
const mockHandleSelectionChange = vi.fn();
const mockSubmitRetryLabel = vi.fn();
const mockTryQuickConfirmByKeyword = vi.fn();
const mockCanConfirm = vi.fn(() => true);

vi.mock('element-plus', () => ({
  ElAlert: createPassthroughStub(),
  ElButton: createButtonStub(),
  ElDialog: createDialogStub(),
  ElForm: createPassthroughStub('form'),
  ElFormItem: createPassthroughStub(),
  ElInput: createInputStub(),
  ElPagination: createPassthroughStub(),
  ElTable: createTableStub(rowContextKey),
  ElTableColumn: createTableColumnStub(rowContextKey),
  ElTag: createTagStub(),
}));

vi.mock('#/modules/system-management/components/SystemUserSelect.vue', () => ({
  default: {
    props: ['modelValue', 'placeholder', 'selectedLabel'],
    template:
      '<div data-testid="system-user-select">{{ placeholder }}{{ selectedLabel }}</div>',
  },
}));

vi.mock('../composables/useSpecimenConfirmationPanel', () => ({
  useSpecimenConfirmationPanel: () => {
    const filters = reactive({
      keyword: 'SP-001',
      page: 1,
      size: 10,
    });
    const operatorForm = reactive({
      operatorName: 'Test User',
      operatorUserId: 'USER-001',
      remarks: '',
      terminalCode: '',
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
      barcode: 'BC-001',
      specimenId: 'SPEC-001',
      specimenNo: 'SP-001',
      specimenName: '乳腺组织',
      patientName: 'Alice',
      specimenConfirmedAt: '2026-05-26 10:00:00',
      specimenConfirmedByName: 'Actual User',
      specimenType: '常规',
      registrationTime: '2026-05-26 08:00:00',
      registrationOperatorName: '李医生',
      inpatientNo: 'ZY-001',
      patientGenderLabel: '女',
      surgeryName: '手术室1',
      specimenStatus: 'FIXED',
    };

    return {
      actionLoading: ref(false),
      batchRetryResult: ref(null),
      canConfirm: mockCanConfirm,
      filters,
      handleClearList: mockHandleClearList,
      handleClearSelectionRows: mockHandleClearSelectionRows,
      handleConfirmRow: mockHandleConfirmRow,
      handleConfirmSelected: mockHandleConfirmSelected,
      handleExportExcel: mockHandleExportExcel,
      handleOperatorChange: mockHandleOperatorChange,
      handleReset: mockHandleReset,
      handleRetryLabel: mockHandleRetryLabel,
      handleSearch: mockHandleSearch,
      handleSelectionChange: mockHandleSelectionChange,
      loading: ref(false),
      operatorForm,
      pageError: ref(''),
      pagedItems: ref([row]),
      retryDialogVisible: ref(false),
      retryForm,
      retrySubmitting: ref(false),
      retryTargetRows: ref([row]),
      submitRetryLabel: mockSubmitRetryLabel,
      summary: ref({
        allCount: 1,
        confirmedCount: 0,
        pendingCount: 1,
      }),
      total: ref(1),
      tryQuickConfirmByKeyword: mockTryQuickConfirmByKeyword,
    };
  },
}));

import SpecimenConfirmationPanel from './SpecimenConfirmationPanel.vue';

function mountView() {
  const container = document.createElement('div');
  document.body.append(container);
  const app = createApp({
    render: () => h(SpecimenConfirmationPanel),
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

describe('SpecimenConfirmationPanel', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('binds the shell to composable handlers', async () => {
    const { app, container } = mountView();
    await flush();

    expect(container.textContent).toContain('标本确认');
    expect(container.textContent).toContain('Test User');
    expect(container.textContent).toContain('Actual User');

    const confirmButtons = [...container.querySelectorAll('button')].filter(
      (button) => button.textContent?.trim() === '标本确认',
    );
    confirmButtons.at(-1)?.click();
    await flush();

    expect(mockHandleConfirmRow).toHaveBeenCalledWith(
      expect.objectContaining({
        specimenId: 'SPEC-001',
      }),
    );

    app.unmount();
  });
});
