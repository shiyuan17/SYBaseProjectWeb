import { createApp, defineComponent, h, inject, nextTick, provide } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

const tableRowKey = Symbol('table-row');

const { mockAccessStore, mockGetApplicationTracking, mockListApplications } = vi.hoisted(() => ({
  mockAccessStore: {
    accessCodes: ['PERM_APPLICATION_DETAIL_QUERY'] as string[],
  },
  mockGetApplicationTracking: vi.fn(),
  mockListApplications: vi.fn(),
}));

vi.mock('@vben/stores', () => ({
  useAccessStore: () => mockAccessStore,
}));

vi.mock('#/modules/system-management/components/DepartmentSelect.vue', () => ({
  default: {
    props: ['modelValue', 'placeholder'],
    template: '<div :data-placeholder="placeholder">{{ modelValue }}</div>',
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
  getApplicationTracking: mockGetApplicationTracking,
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
    setup(_, { emit, slots }) {
      return () =>
        h(
          'button',
          {
            type: 'button',
            onClick: (event: MouseEvent) => emit('click', event),
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

  const ElDialog = defineComponent({
    props: ['modelValue', 'title'],
    setup(props, { slots }) {
      return () =>
        props.modelValue
          ? h('section', [h('h3', props.title), slots.default?.()])
          : null;
    },
  });

  const ElDescriptions = passthrough('div');
  const ElDescriptionsItem = defineComponent({
    props: ['label'],
    setup(props, { slots }) {
      return () => h('div', [h('strong', `${props.label}:`), slots.default?.()]);
    },
  });

  const ElTimeline = passthrough('ul');
  const ElTimelineItem = defineComponent({
    props: ['timestamp'],
    setup(props, { slots }) {
      return () => h('li', [props.timestamp ? h('span', props.timestamp) : null, slots.default?.()]);
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
      return () => h('div', slots.default?.());
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
    ElDescriptions,
    ElDescriptionsItem,
    ElDialog,
    ElEmpty: passthrough(),
    ElForm: passthrough('form'),
    ElFormItem: passthrough(),
    ElInput,
    ElOption,
    ElPagination: passthrough(),
    ElSelect,
    ElTable,
    ElTableColumn,
    ElTag: passthrough('span'),
    ElTimeline,
    ElTimelineItem,
  };
});

import TrackingApplicationListView from './TrackingApplicationListView.vue';

function buildApplicationRow() {
  return {
    abnormalFlag: true,
    applicationDate: '2026-05-22',
    applicationFormStatus: 'PENDING',
    applicationNo: 'AP202605220001',
    applicationType: 'ROUTINE',
    createdAt: '2026-05-22T08:00:00',
    currentNode: 'SPECIMEN_COLLECTION',
    id: 'APP-TRACK-001',
    latestLabelPrintStatus: 'SUCCESS',
    patientAge: '42',
    patientGender: 'F',
    patientName: '张三',
    registeredSpecimenCount: 2,
    status: 'SUBMITTED',
    submissionDate: '2026-05-22',
    submittingDepartmentName: '普外科',
    submittingDoctorName: '李医生',
    updatedAt: '2026-05-24T08:00:00',
  };
}

function buildTrackingDetail() {
  return {
    abnormalFlag: true,
    applicationDate: '2026-05-22',
    applicationFormStatus: 'PENDING',
    applicationNo: 'AP202605220001',
    applicationType: 'ROUTINE',
    clinicalDiagnosis: '胃息肉',
    clinicalSymptom: '腹痛',
    createdAt: '2026-05-22T08:00:00',
    currentNode: 'SPECIMEN_COLLECTION',
    externalOrderNo: 'EXT-001',
    id: 'APP-TRACK-001',
    patientAge: '42',
    patientGender: 'F',
    patientId: 'PAT-001',
    patientName: '张三',
    recentEvents: [
      {
        eventContent: '已登记',
        eventStatus: 'DONE',
        eventTime: '2026-05-24T08:00:00',
        eventType: 'REGISTER',
        nodeCode: 'SPECIMEN_COLLECTION',
        operatorName: '李医生',
        sourceTerminal: 'TERMINAL-1',
      },
    ],
    remarks: '备注信息',
    sourceHospitalId: 'H-001',
    sourceHospitalName: '总院',
    specimenRemovalTime: '2026-05-22T07:30:00',
    specimens: [
      {
        barcode: 'BC-001',
        containerCount: 1,
        containerName: '瓶1',
        fixationStatus: 'FIXING',
        id: 'SPEC-001',
        labelPrintStatus: 'SUCCESS',
        specimenCount: 1,
        specimenName: '胃组织',
        specimenNo: 'SP-001',
        specimenSite: '胃',
        specimenStatus: 'REGISTERED',
        specimenType: '常规',
      },
    ],
    status: 'SUBMITTED',
    submissionDate: '2026-05-22',
    submittingDepartmentId: 'DEP-001',
    submittingDepartmentName: '普外科',
    submittingDoctorName: '李医生',
    submittingDoctorUserId: 'USER-001',
    thirdPartySource: null,
    updatedAt: '2026-05-24T08:00:00',
  };
}

async function flushAll() {
  await Promise.resolve();
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

async function mountView(props?: Record<string, unknown>) {
  const root = document.createElement('div');
  document.body.append(root);
  const app = createApp({
    render: () => h(TrackingApplicationListView, props ?? {}),
  });
  app.mount(root);
  await flushAll();
  return { app, root };
}

describe('TrackingApplicationListView', () => {
  afterEach(() => {
    mockAccessStore.accessCodes = ['PERM_APPLICATION_DETAIL_QUERY'];
    mockListApplications.mockReset();
    mockGetApplicationTracking.mockReset();
    document.body.innerHTML = '';
  });

  it('renders a read-only application list with detail as the only row action', async () => {
    mockListApplications.mockResolvedValue({
      items: [buildApplicationRow()],
      page: 1,
      size: 20,
      total: 1,
    });
    mockGetApplicationTracking.mockResolvedValue(buildTrackingDetail());

    const { app, root } = await mountView();

    expect(mockListApplications).toHaveBeenCalledTimes(1);
    const buttonTexts = Array.from(root.querySelectorAll('button')).map((button) =>
      button.textContent?.trim(),
    );
    expect(buttonTexts).toContain('详情');
    expect(buttonTexts).not.toContain('创建');
    expect(buttonTexts).not.toContain('登记标本');
    expect(buttonTexts).not.toContain('追踪与异常');

    app.unmount();
  });

  it('loads tracking detail into a dialog when detail is opened', async () => {
    mockListApplications.mockResolvedValue({
      items: [buildApplicationRow()],
      page: 1,
      size: 20,
      total: 1,
    });
    mockGetApplicationTracking.mockResolvedValue(buildTrackingDetail());

    const { app, root } = await mountView();
    const detailButton = Array.from(root.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === '详情',
    );

    detailButton?.click();
    await flushAll();

    expect(mockGetApplicationTracking).toHaveBeenCalledWith('APP-TRACK-001');
    expect(root.textContent).toContain('异常标记');
    expect(root.textContent).toContain('基本信息');
    expect(root.textContent).toContain('标本列表');
    expect(root.textContent).toContain('时间线事件');
    expect(root.textContent).toContain('完整申请单详情');

    app.unmount();
  });

  it('opens detail automatically when an initial application id is provided', async () => {
    mockListApplications.mockResolvedValue({
      items: [buildApplicationRow()],
      page: 1,
      size: 20,
      total: 1,
    });
    mockGetApplicationTracking.mockResolvedValue(buildTrackingDetail());

    const { app, root } = await mountView({
      initialApplicationId: 'APP-TRACK-001',
      triggerKey: 1,
    });

    expect(mockGetApplicationTracking).toHaveBeenCalledWith('APP-TRACK-001');
    expect(root.textContent).toContain('申请单追踪详情');
    expect(root.textContent).toContain('异常标记');

    app.unmount();
  });
});
