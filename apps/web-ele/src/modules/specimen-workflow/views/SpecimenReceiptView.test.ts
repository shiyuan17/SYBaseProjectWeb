import { createApp, h } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { listPendingReceipts } from '../api/specimen-workflow-service';
import SpecimenReceiptView from './SpecimenReceiptView.vue';

vi.mock('@vben/common-ui', () => ({
  Page: {
    template: '<section><slot /></section>',
  },
}));

vi.mock('@vben/stores', () => ({
  useUserStore: () => ({
    userInfo: {
      realName: 'Test User',
      userId: 'USER-001',
    },
  }),
}));

vi.mock('#/modules/system-management/components/SystemUserSelect.vue', () => ({
  default: {
    props: ['modelValue', 'placeholder', 'selectedLabel'],
    template: '<div>{{ placeholder }}</div>',
  },
}));

vi.mock('element-plus', async () => {
  const actual =
    await vi.importActual<typeof import('element-plus')>('element-plus');
  const { defineComponent, h: createVNode } = await import('vue');

  const ElDatePicker = defineComponent({
    props: [
      'defaultValue',
      'disabledDate',
      'modelValue',
      'shortcuts',
      'type',
      'unlinkPanels',
    ],
    emits: ['update:modelValue'],
    setup(props, { emit }) {
      return () =>
        createVNode('input', {
          'data-date-picker-default-value': Array.isArray(props.defaultValue)
            ? props.defaultValue
                .map((item) =>
                  item instanceof Date
                    ? item.toISOString().slice(0, 10)
                    : String(item),
                )
                .join(',')
            : '',
          'data-date-picker-type': props.type,
          value: Array.isArray(props.modelValue)
            ? props.modelValue.join(',')
            : props.modelValue,
          onInput: (event: Event) =>
            emit(
              'update:modelValue',
              (event.target as HTMLInputElement).value
                .split(',')
                .filter(Boolean),
            ),
          'data-date-picker-disable-future': String(
            typeof props.disabledDate === 'function',
          ),
          'data-date-picker-shortcuts': Array.isArray(props.shortcuts)
            ? props.shortcuts
                .map((item: { text: string }) => item.text)
                .join(',')
            : '',
          'data-date-picker-disables-tomorrow': String(
            typeof props.disabledDate === 'function'
              ? props.disabledDate(new Date('2026-06-18T00:00:00+08:00'))
              : false,
          ),
          'data-date-picker-keeps-today': String(
            typeof props.disabledDate === 'function'
              ? props.disabledDate(new Date('2026-06-17T12:00:00+08:00'))
              : false,
          ),
          'data-date-picker-unlink-panels': String(Boolean(props.unlinkPanels)),
        });
    },
  });

  return {
    ...actual,
    ElDatePicker,
    ElMessage: {
      success: vi.fn(),
      warning: vi.fn(),
    },
  };
});

vi.mock('../api/application-registration-workbench-service', () => ({
  listOperatingBuildingOptions: vi.fn(async () => []),
  lookupApplicationRegistrationWorkbenchRecord: vi.fn(),
}));

vi.mock('../api/specimen-workflow-service', () => ({
  directReceiveSpecimens: vi.fn(),
  getApplicationDetail: vi.fn(async (applicationId: string) => ({
    id: applicationId,
    patientGender: null,
    patientId: null,
    recentEvents: [],
    specimens: [],
  })),
  listPendingReceipts: vi.fn(async () => ({
    items: [],
    page: 1,
    size: 500,
    total: 0,
  })),
  listSpecimens: vi.fn(async () => ({
    items: [],
    page: 1,
    size: 500,
    summary: {
      abnormalCount: 0,
      labelPrintedCount: 0,
      pendingLabelCount: 0,
      totalCount: 0,
      unboundCount: 0,
    },
    total: 0,
  })),
  receiveSpecimens: vi.fn(),
  retryLabelPrint: vi.fn(),
}));

const mockRoute = {
  query: {},
};

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
}));

vi.mock('@vben/utils', () => ({
  downloadFileFromBlob: vi.fn(),
}));

function mountView() {
  const container = document.createElement('div');
  document.body.append(container);
  const app = createApp({
    render: () => h(SpecimenReceiptView),
  });

  app.directive('loading', {});
  app.mount(container);

  return {
    app,
    container,
  };
}

describe('SpecimenReceiptView', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    mockRoute.query = {};
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('renders the pathology receipt workbench instead of the old transport list', () => {
    const { app, container } = mountView();

    expect(container.textContent).not.toContain('病理接收');
    expect(container.textContent).toContain('标本签收');
    expect(container.textContent).toContain('异常接收');
    expect(container.textContent).toContain('选择操作人');
    expect(container.textContent).toContain('补打标本标签');
    expect(container.textContent).toContain('导出Excel');
    expect(container.textContent).toContain('查询');
    expect(container.textContent).not.toContain('待接收转运单');
    expect(container.textContent).not.toContain('条码直收');
    expect(listPendingReceipts).not.toHaveBeenCalled();

    app.unmount();
  });

  it('keeps the date range empty while defaulting the picker panel to today', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-17T09:00:00+08:00'));

    const { app, container } = mountView();

    const datePicker = container.querySelector<HTMLInputElement>(
      'input[data-date-picker-type="daterange"]',
    );
    expect(datePicker).toBeTruthy();
    expect(datePicker?.value).toBe('');
    expect(datePicker?.dataset.datePickerDefaultValue).toBe(
      '2026-06-17,2026-06-17',
    );
    expect(datePicker?.dataset.datePickerDisableFuture).toBe('true');
    expect(datePicker?.dataset.datePickerDisablesTomorrow).toBe('true');
    expect(datePicker?.dataset.datePickerKeepsToday).toBe('false');
    expect(datePicker?.dataset.datePickerUnlinkPanels).toBe('true');
    expect(datePicker?.dataset.datePickerShortcuts).toBe('今天,昨天,本周,本月');

    app.unmount();
  });
});
