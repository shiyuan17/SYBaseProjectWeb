import { createApp, computed, defineComponent, h, inject, nextTick, provide } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

const tableRowKey = Symbol('table-row');
const tabsContextKey = Symbol('tabs-context');

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

  const ElTabs = defineComponent({
    emits: ['update:modelValue'],
    props: ['modelValue'],
    setup(props, { emit, slots }) {
      const activeName = computed(() => String(props.modelValue ?? ''));
      provide(tabsContextKey, {
        activeName,
        selectTab: (name: string) => emit('update:modelValue', name),
      });
      return () => h('div', { 'data-active-tab': activeName.value }, slots.default?.());
    },
  });

  const ElTabPane = defineComponent({
    props: ['label', 'name'],
    setup(props, { slots }) {
      const tabsContext = inject<{
        activeName: ReturnType<typeof computed<string>>;
        selectTab: (name: string) => void;
      } | null>(tabsContextKey, null);

      return () => {
        const name = String(props.name ?? '');
        const isActive = tabsContext?.activeName.value === name;
        return h('section', [
          h(
            'button',
            {
              'data-tab-name': name,
              type: 'button',
              onClick: () => tabsContext?.selectTab(name),
            },
            props.label,
          ),
          isActive ? h('div', { 'data-tab-panel': name }, slots.default?.()) : null,
        ]);
      };
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
    ElTabPane,
    ElTable,
    ElTableColumn,
    ElTabs,
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
    registeredSpecimenCount: 3,
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
        eventContent: '创建转运单',
        eventStatus: 'SUCCESS',
        eventTime: '2026-05-24T08:00:00',
        eventType: 'ORDER_CREATED',
        nodeCode: 'TRANSPORT',
        operatorName: '李医生',
        specimenBarcode: 'BC-001',
        specimenId: 'SPEC-001',
        specimenNo: 'SP-001',
        sourceTerminal: 'TERMINAL-1',
      },
      {
        eventContent: '创建转运单',
        eventStatus: 'SUCCESS',
        eventTime: '2026-05-24T08:00:00',
        eventType: 'ORDER_CREATED',
        nodeCode: 'TRANSPORT',
        operatorName: '王护士',
        specimenBarcode: 'BC-002',
        specimenId: 'SPEC-002',
        specimenNo: 'SP-002',
        sourceTerminal: 'TERMINAL-2',
      },
      {
        eventContent: '打印转运单',
        eventStatus: 'SUCCESS',
        eventTime: '2026-05-24T08:01:00',
        eventType: 'ORDER_PRINTED',
        nodeCode: 'TRANSPORT',
        operatorName: '前台',
        specimenBarcode: null,
        specimenId: null,
        specimenNo: null,
        sourceTerminal: 'TERMINAL-3',
      },
      {
        eventContent: '完成交接',
        eventStatus: 'SUCCESS',
        eventTime: '2026-05-24T08:02:00',
        eventType: 'HANDED_OVER',
        nodeCode: 'TRANSPORT',
        operatorName: '李医生',
        specimenBarcode: 'BC-001',
        specimenId: 'SPEC-001',
        specimenNo: 'SP-001',
        sourceTerminal: 'TERMINAL-1',
      },
    ],
    remarks: '备注信息',
    sourceHospitalId: 'H-001',
    sourceHospitalName: '总院',
    specimenRemovalTime: '2026-05-22T07:30:00',
    specimens: [
      {
        abnormalReason: '容器破损',
        barcode: 'BC-001',
        containerCount: 1,
        containerName: '瓶',
        fixationStatus: 'FIXING',
        id: 'SPEC-001',
        labelPrintStatus: 'SUCCESS',
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
      {
        abnormalReason: null,
        barcode: 'BC-002',
        containerCount: 1,
        containerName: '瓶',
        fixationStatus: 'FIXING',
        id: 'SPEC-002',
        labelPrintStatus: 'SUCCESS',
        specimenCount: 1,
        specimenName: '十二指肠组织',
        specimenNo: 'SP-002',
        specimenSite: '十二指肠',
        specimenStatus: 'REGISTERED',
        specimenType: '常规',
      },
      {
        abnormalReason: null,
        barcode: 'BC-003',
        containerCount: 1,
        containerName: '瓶',
        fixationStatus: 'FIXING',
        id: 'SPEC-003',
        labelPrintStatus: 'PENDING',
        specimenCount: 1,
        specimenName: '空白标本',
        specimenNo: 'SP-003',
        specimenSite: '未知',
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

function countText(content: string, target: string) {
  return content.split(target).length - 1;
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
  app.directive('loading', {
    mounted() {},
    updated() {},
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

  it('renders overall and specimen timeline tabs, with same-second multi-specimen events aggregated in the overall tab', async () => {
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
    expect(root.querySelector('[data-tab-name="overall"]')?.textContent).toBe('总时间线');
    expect(root.querySelector('[data-tab-name="SPEC-001"]')?.textContent).toBe('SP-001');
    expect(root.querySelector('[data-tab-name="SPEC-002"]')?.textContent).toBe('SP-002');
    expect(root.querySelector('[data-tab-name="SPEC-003"]')?.textContent).toBe('SP-003');
    expect(root.textContent).toContain('异常明细');
    expect(root.textContent).toContain('异常类型：已拒收');
    expect(root.textContent).toContain('质控结果：不合格');
    expect(root.textContent).toContain('问题代码：CONTAINER_DAMAGE');
    expect(root.textContent).toContain('原因：容器破损');

    const overallPanel = root.querySelector('[data-tab-panel="overall"]');
    expect(overallPanel).not.toBeNull();
    const overallText = overallPanel?.textContent ?? '';
    expect(countText(overallText, '创建转运单 / 成功')).toBe(1);
    expect(overallText).toContain('涉及标本: 2 个');
    expect(overallText).toContain('SP-001');
    expect(overallText).toContain('SP-002');
    expect(overallText).toContain('公共事件');
    expect(overallText).toContain('打印转运单 / 成功');

    app.unmount();
  });

  it('shows only the selected specimen events in a specimen tab and excludes public events', async () => {
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

    const specimenTab = root.querySelector<HTMLButtonElement>('[data-tab-name="SPEC-001"]');
    specimenTab?.click();
    await flushAll();

    const specimenPanel = root.querySelector('[data-tab-panel="SPEC-001"]');
    expect(specimenPanel).not.toBeNull();
    const specimenText = specimenPanel?.textContent ?? '';
    expect(specimenText).toContain('创建转运单 / 成功');
    expect(specimenText).toContain('完成交接 / 成功');
    expect(specimenText).not.toContain('打印转运单 / 成功');
    expect(specimenText).not.toContain('公共事件');
    expect(specimenText).not.toContain('SP-002');

    app.unmount();
  });

  it('shows an empty state for specimen tabs without their own events', async () => {
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

    const emptySpecimenTab = root.querySelector<HTMLButtonElement>('[data-tab-name="SPEC-003"]');
    emptySpecimenTab?.click();
    await flushAll();

    const emptySpecimenPanel = root.querySelector('[data-tab-panel="SPEC-003"]');
    expect(emptySpecimenPanel?.textContent ?? '').toContain('该标本暂无追踪事件');

    app.unmount();
  });
});
