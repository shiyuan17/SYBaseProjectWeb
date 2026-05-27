import { createApp, defineComponent, h, inject, nextTick, provide } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

const tableRowKey = Symbol('table-row');

const {
  mockAccessStore,
  mockGetApplicationDetail,
  mockGetLatestRegistrationResult,
  mockListSpecimens,
} = vi.hoisted(() => ({
  mockAccessStore: {
    accessCodes: [
      'PERM_APPLICATION_DETAIL_QUERY',
      'PERM_SPECIMEN_REGISTER',
    ] as string[],
  },
  mockGetApplicationDetail: vi.fn(),
  mockGetLatestRegistrationResult: vi.fn(),
  mockListSpecimens: vi.fn(),
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
  getApplicationDetail: mockGetApplicationDetail,
  getLatestRegistrationResult: mockGetLatestRegistrationResult,
  listSpecimens: mockListSpecimens,
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

import TrackingSpecimenListView from './TrackingSpecimenListView.vue';

function buildSpecimenRow() {
  return {
    abnormalFlag: true,
    abnormalReason: '容器破损',
    applicationId: 'APP-TRACK-001',
    applicationNo: 'AP202605220001',
    barcode: 'BC-TRACK-001',
    containerCount: 1,
    containerName: '瓶1',
    fixationStatus: 'FIXING',
    labelPrintBatchNo: 'BATCH-001',
    labelPrintStatus: 'FAILED',
    latestTrackingAt: '2026-05-24T08:00:00',
    qualityCheckResult: 'FAILED',
    qualityIssueCodes: ['CONTAINER_DAMAGE'],
    patientName: '张三',
    registeredAt: '2026-05-24T08:00:00',
    receiptStatus: 'REJECTED',
    specimenCount: 1,
    specimenId: 'SPEC-001',
    specimenName: '胃组织',
    specimenNo: 'SP-001',
    specimenSite: '胃',
    specimenStatus: 'REGISTERED',
    specimenType: '常规',
    submittingDepartmentId: 'DEP-001',
    submittingDepartmentName: '普外科',
  };
}

function buildApplicationDetail() {
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
    specimens: [],
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

function buildLatestResult() {
  return {
    applicationId: 'APP-TRACK-001',
    labelPrintBatchNo: 'BATCH-001',
    labelPrintMessage: '存在失败',
    labelPrintSuccess: false,
    registrationSnapshot: null,
    specimens: [
      {
        abnormalReason: '容器破损',
        barcode: 'BC-TRACK-001',
        containerCount: 1,
        containerName: '瓶1',
        fixationStatus: 'FIXING',
        id: 'SPEC-001',
        labelPrintStatus: 'FAILED',
        qualityCheckResult: 'FAILED',
        qualityIssueCodes: ['CONTAINER_DAMAGE'],
        receiptStatus: 'REJECTED',
        specimenCount: 1,
        specimenName: '胃组织',
        specimenNo: 'SP-001',
        specimenSite: '胃',
        specimenStatus: 'REGISTERED',
        specimenType: '常规',
      },
    ],
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
    render: () => h(TrackingSpecimenListView, props ?? {}),
  });
  app.mount(root);
  await flushAll();
  return { app, root };
}

describe('TrackingSpecimenListView', () => {
  afterEach(() => {
    mockAccessStore.accessCodes = [
      'PERM_APPLICATION_DETAIL_QUERY',
      'PERM_SPECIMEN_REGISTER',
    ];
    mockListSpecimens.mockReset();
    mockGetApplicationDetail.mockReset();
    mockGetLatestRegistrationResult.mockReset();
    document.body.innerHTML = '';
  });

  it('keeps only detail as the specimen row action', async () => {
    mockListSpecimens.mockResolvedValue({
      items: [buildSpecimenRow()],
      page: 1,
      size: 20,
      summary: {
        abnormalCount: 1,
        labelPrintedCount: 0,
        pendingLabelCount: 1,
        totalCount: 1,
      },
      total: 1,
    });
    mockGetApplicationDetail.mockResolvedValue(buildApplicationDetail());
    mockGetLatestRegistrationResult.mockResolvedValue(buildLatestResult());

    const { app, root } = await mountView({
      initialBarcode: 'BC-TRACK-001',
      triggerKey: 1,
    });

    const buttonTexts = Array.from(root.querySelectorAll('button')).map((button) =>
      button.textContent?.trim(),
    );
    expect(buttonTexts).toContain('详情');
    expect(buttonTexts).not.toContain('异常处理');
    expect(buttonTexts).not.toContain('补打标签');
    expect(buttonTexts).not.toContain('开始核验');
    expect(buttonTexts).not.toContain('完成核验');

    expect(root.textContent).toContain('异常明细');
    expect(root.textContent).toContain('异常类型：已拒收');
    expect(root.textContent).toContain('质控结果：不合格');
    expect(root.textContent).toContain('问题代码：CONTAINER_DAMAGE');
    expect(root.textContent).toContain('原因：容器破损');

    app.unmount();
  });

  it('applies the initial barcode filter and opens the matched detail dialog', async () => {
    mockListSpecimens.mockResolvedValue({
      items: [buildSpecimenRow()],
      page: 1,
      size: 20,
      summary: {
        abnormalCount: 1,
        labelPrintedCount: 0,
        pendingLabelCount: 1,
        totalCount: 1,
      },
      total: 1,
    });
    mockGetApplicationDetail.mockResolvedValue(buildApplicationDetail());
    mockGetLatestRegistrationResult.mockResolvedValue(buildLatestResult());

    const { app, root } = await mountView({
      initialBarcode: 'BC-TRACK-001',
      triggerKey: 1,
    });

    expect(mockListSpecimens).toHaveBeenCalledWith(
      expect.objectContaining({
        keyword: 'BC-TRACK-001',
      }),
    );
    expect(mockGetApplicationDetail).toHaveBeenCalledWith('APP-TRACK-001');
    expect(mockGetLatestRegistrationResult).toHaveBeenCalledWith('APP-TRACK-001');
    expect(root.textContent).toContain('标本基础信息');
    expect(root.textContent).toContain('所属申请单信息');
    expect(root.textContent).toContain('最近流程节点');
    expect(root.textContent).toContain('最近标签批次结果');
    expect(root.textContent).not.toContain('去追踪与异常');

    app.unmount();
  });
});
