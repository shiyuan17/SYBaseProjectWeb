import { computed, createApp, h, nextTick, ref } from 'vue';

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
import SpecimenFixationTimePanel from './SpecimenFixationTimePanel.vue';

const { rowContextKey } = vi.hoisted(() => ({
  rowContextKey: Symbol('row-context'),
}));
const pageErrorTextMock = { value: '' };

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

vi.mock(
  '#/modules/system-management/components/ReferenceOptionSelect.vue',
  () => ({
    default: {
      props: ['modelValue', 'options', 'placeholder'],
      template:
        '<div data-testid="reference-option-select">{{ placeholder }}</div>',
    },
  }),
);

vi.mock('../composables/useSpecimenFixationTimePanel', () => ({
  useSpecimenFixationTimePanel: () => ({
    batchRetryResult: ref(null),
    fixationLiquidType: ref('FORMALIN'),
    getSpecimenRemovalTime: vi.fn(() => null),
    handleClearList: vi.fn(),
    handleClearSelectionRows: vi.fn(),
    handleCompleteFixationByScan: vi.fn(),
    handleExportExcel: vi.fn(),
    handleRetryLabel: vi.fn(),
    handleSelectionChange: vi.fn(),
    loading: ref(false),
    pagedItems: ref([]),
    pagination: {
      page: 1,
      size: 10,
    },
    pageError: ref(pageErrorTextMock.value),
    queueItems: ref([]),
    resolveFixationLiquidLabel: vi.fn(() => '10% 中性福尔马林'),
    resolveFixationTagType: vi.fn(() => 'info'),
    handlePageChange: vi.fn(),
    handlePageSizeChange: vi.fn(),
    retryDialogVisible: ref(false),
    retryForm: {
      operatorName: 'Test User',
      operatorUserId: 'USER-001',
      printerCode: '',
      remarks: '',
      terminalCode: '',
    },
    retrySubmitting: ref(false),
    retryTargetRows: ref([]),
    scanInput: ref(''),
    selectedCount: computed(() => 0),
    submitRetryLabel: vi.fn(),
    total: ref(0),
    workflowReferenceOptions: ref({
      clinicalSymptoms: [],
      collectionModes: [],
      containerNames: [],
      cutSurfaceFeatures: [],
      fixationLiquidTypes: [{ label: '10% 中性福尔马林', value: 'FORMALIN' }],
      marginMarkings: [],
      specimenImageSizes: [],
      specimenTypes: [],
    }),
  }),
}));

function mountView() {
  const container = document.createElement('div');
  document.body.append(container);
  const app = createApp({
    render: () => h(SpecimenFixationTimePanel),
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

describe('SpecimenFixationTimePanel error display', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    pageErrorTextMock.value = '';
    vi.clearAllMocks();
  });

  it('shows the translated business error when pageError exists', async () => {
    pageErrorTextMock.value =
      '标本尚未完成离体确认，请先完成离体确认后再固定。';
    const { app, container } = mountView();
    await flush();

    expect(container.textContent).toContain(
      '标本尚未完成离体确认，请先完成离体确认后再固定。',
    );

    app.unmount();
  });
});
