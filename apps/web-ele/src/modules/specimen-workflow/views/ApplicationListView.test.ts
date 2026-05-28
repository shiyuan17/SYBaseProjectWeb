import { createApp, defineComponent, h, inject, nextTick, provide } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

const tableRowKey = Symbol('table-row');

const {
  mockAccessStore,
  mockDeleteApplication,
  mockListApplications,
  mockPush,
  mockConfirm,
  mockMessageSuccess,
} = vi.hoisted(() => ({
  mockAccessStore: {
    accessCodes: [
      'PERM_APPLICATION_DETAIL_QUERY',
      'PERM_APPLICATION_UPDATE',
      'PERM_APPLICATION_DELETE',
      'PERM_SPECIMEN_REGISTER',
    ] as string[],
  },
  mockConfirm: vi.fn(),
  mockDeleteApplication: vi.fn(),
  mockListApplications: vi.fn(),
  mockMessageSuccess: vi.fn(),
  mockPush: vi.fn(),
}));

vi.mock('@vben/common-ui', () => ({
  Page: {
    props: ['title'],
    template: '<main><h1 v-if="title">{{ title }}</h1><slot /></main>',
  },
}));

vi.mock('@vben/stores', () => ({
  useAccessStore: () => mockAccessStore,
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('#/modules/system-management/components/DepartmentSelect.vue', () => ({
  default: {
    emits: ['change', 'update:modelValue'],
    props: ['modelValue', 'placeholder'],
    template: '<input :placeholder="placeholder" :value="modelValue" />',
  },
}));

vi.mock('../components/ApplicationManageDialog.vue', () => ({
  default: {
    emits: ['submitted', 'update:modelValue'],
    props: ['applicationId', 'mode', 'modelValue'],
    template:
      '<section v-if="modelValue" data-testid="manage-dialog" :data-mode="mode" :data-application-id="applicationId || \'\'" />',
  },
}));

vi.mock('../components/WorkflowSectionCard.vue', () => ({
  default: {
    props: ['description', 'title'],
    template:
      '<section><h2>{{ title }}</h2><p v-if="description">{{ description }}</p><slot name="extra" /><slot /></section>',
  },
}));

vi.mock('../api/specimen-workflow-service', () => ({
  deleteApplication: mockDeleteApplication,
  listApplications: mockListApplications,
}));

vi.mock('element-plus', () => {
  const passthrough = (tag = 'div') =>
    defineComponent({
      props: ['description', 'label', 'modelValue', 'title'],
      setup(props, { slots }) {
        return () =>
          h(tag, [
            props.title ? h('div', props.title) : null,
            props.label ? h('span', props.label) : null,
            props.description ? h('div', props.description) : null,
            slots.default?.(),
          ]);
      },
    });

  const ElButton = defineComponent({
    emits: ['click'],
    props: ['disabled', 'loading', 'title', 'type'],
    setup(props, { emit, slots }) {
      return () =>
        h(
          'button',
          {
            disabled: Boolean(props.disabled),
            title: props.title,
            type: 'button',
            onClick: (event: MouseEvent) => {
              if (!props.disabled) {
                emit('click', event);
              }
            },
          },
          slots.default?.(),
        );
    },
  });

  const ElInput = defineComponent({
    emits: ['update:modelValue'],
    props: ['modelValue', 'placeholder'],
    setup(props, { emit }) {
      return () =>
        h('input', {
          placeholder: props.placeholder,
          value: props.modelValue,
          onInput: (event: Event) =>
            emit('update:modelValue', (event.target as HTMLInputElement).value),
        });
    },
  });

  const ElSelect = defineComponent({
    emits: ['update:modelValue'],
    props: ['modelValue'],
    setup(props, { emit, slots }) {
      return () =>
        h(
          'select',
          {
            value: props.modelValue,
            onChange: (event: Event) =>
              emit('update:modelValue', (event.target as HTMLSelectElement).value),
          },
          slots.default?.(),
        );
    },
  });

  const ElOption = defineComponent({
    props: ['label', 'value'],
    setup(props) {
      return () => h('option', { value: props.value }, props.label);
    },
  });

  const RowProvider = defineComponent({
    props: {
      row: {
        required: true,
        type: Object,
      },
    },
    setup(props, { slots }) {
      provide(tableRowKey, props.row);
      return () => h('div', { class: 'table-row' }, slots.default?.());
    },
  });

  const ElTable = defineComponent({
    props: {
      data: {
        default: () => [],
        type: Array,
      },
    },
    setup(props, { slots }) {
      return () =>
        h(
          'div',
          (props.data as unknown[]).map((row, index) =>
            h(RowProvider, { key: index, row: row as Record<string, unknown> }, () =>
              slots.default?.(),
            ),
          ),
        );
    },
  });

  const ElTableColumn = defineComponent({
    props: ['label', 'prop'],
    setup(props, { slots }) {
      return () => {
        const row = inject<Record<string, unknown> | null>(tableRowKey, null);
        const value = props.prop && row ? row[props.prop] : undefined;
        return h('div', [
          props.label ? h('span', props.label) : null,
          slots.default ? slots.default({ row }) : value == null ? null : h('span', String(value)),
        ]);
      };
    },
  });

  return {
    ElAlert: passthrough(),
    ElButton,
    ElDatePicker: passthrough(),
    ElEmpty: passthrough(),
    ElForm: passthrough('form'),
    ElFormItem: passthrough(),
    ElInput,
    ElMessage: {
      success: mockMessageSuccess,
    },
    ElMessageBox: {
      confirm: mockConfirm,
    },
    ElOption,
    ElPagination: passthrough(),
    ElSelect,
    ElTable,
    ElTableColumn,
    ElTag: passthrough('span'),
  };
});

import ApplicationListView from './ApplicationListView.vue';

function buildApplicationRow(overrides: Record<string, unknown> = {}) {
  return {
    abnormalFlag: false,
    applicationDate: '2026-05-28',
    applicationFormStatus: 'PENDING',
    applicationNo: 'M2-20260528-001',
    applicationType: 'ROUTINE',
    createdAt: '2026-05-28T08:00:00',
    currentNode: 'SUBMITTED',
    deletable: true,
    editable: true,
    id: 'APP-001',
    latestLabelPrintStatus: null,
    operationDisabledReason: null,
    patientAge: '45',
    patientGender: 'M',
    patientName: '张三',
    registeredSpecimenCount: 0,
    status: 'SUBMITTED',
    submissionDate: '2026-05-28',
    submittingDepartmentName: '外科',
    submittingDoctorName: '李医生',
    updatedAt: '2026-05-28T09:00:00',
    voided: false,
    ...overrides,
  };
}

async function flushAll() {
  await Promise.resolve();
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

async function mountView() {
  const root = document.createElement('div');
  document.body.append(root);
  const app = createApp({
    render: () => h(ApplicationListView),
  });
  app.directive('loading', {
    mounted() {},
    updated() {},
  });
  app.mount(root);
  await flushAll();
  return { app, root };
}

describe('ApplicationListView', () => {
  afterEach(() => {
    mockAccessStore.accessCodes = [
      'PERM_APPLICATION_DETAIL_QUERY',
      'PERM_APPLICATION_UPDATE',
      'PERM_APPLICATION_DELETE',
      'PERM_SPECIMEN_REGISTER',
    ];
    mockConfirm.mockReset();
    mockDeleteApplication.mockReset();
    mockListApplications.mockReset();
    mockMessageSuccess.mockReset();
    mockPush.mockReset();
    document.body.innerHTML = '';
  });

  it('shows edit and delete actions and opens edit dialog for editable rows', async () => {
    mockListApplications.mockResolvedValue({
      items: [buildApplicationRow()],
      page: 1,
      size: 20,
      total: 1,
    });

    const { app, root } = await mountView();
    const editButton = Array.from(root.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === '编辑',
    );
    const deleteButton = Array.from(root.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === '删除',
    );

    expect(editButton).toBeTruthy();
    expect(deleteButton).toBeTruthy();

    editButton?.click();
    await flushAll();

    const dialog = root.querySelector('[data-testid="manage-dialog"]');
    expect(dialog?.getAttribute('data-mode')).toBe('edit');
    expect(dialog?.getAttribute('data-application-id')).toBe('APP-001');

    app.unmount();
  });

  it('disables edit and delete actions with backend reason', async () => {
    mockListApplications.mockResolvedValue({
      items: [
        buildApplicationRow({
          deletable: false,
          editable: false,
          operationDisabledReason: '申请单已进入下游流程，不能再编辑或作废',
        }),
      ],
      page: 1,
      size: 20,
      total: 1,
    });

    const { app, root } = await mountView();
    const editButton = Array.from(root.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === '编辑',
    );
    const deleteButton = Array.from(root.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === '删除',
    );

    expect(editButton?.disabled).toBe(true);
    expect(deleteButton?.disabled).toBe(true);
    expect(editButton?.title).toBe('申请单已进入下游流程，不能再编辑或作废');
    expect(deleteButton?.title).toBe('申请单已进入下游流程，不能再编辑或作废');

    app.unmount();
  });

  it('confirms and voids an application before refreshing the list', async () => {
    mockConfirm.mockResolvedValue(undefined);
    mockDeleteApplication.mockResolvedValue({ id: 'APP-001' });
    mockListApplications.mockResolvedValue({
      items: [buildApplicationRow()],
      page: 1,
      size: 20,
      total: 1,
    });

    const { app, root } = await mountView();
    const deleteButton = Array.from(root.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === '删除',
    );

    deleteButton?.click();
    await flushAll();

    expect(mockConfirm).toHaveBeenCalled();
    expect(mockDeleteApplication).toHaveBeenCalledWith('APP-001');
    expect(mockListApplications).toHaveBeenCalledTimes(2);

    app.unmount();
  });
});
