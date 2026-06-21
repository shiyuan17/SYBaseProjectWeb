import type {
  TechnicalTrackingCaseListItem,
  TechnicalTrackingView as TechnicalTrackingViewModel,
} from '../types/technical-workflow';

import { createApp, defineComponent, h, nextTick } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  messageWarning,
  mockGetTechnicalTracking,
  mockListTechnicalTrackingCases,
  mockRoute,
} = vi.hoisted(() => ({
  messageWarning: vi.fn(),
  mockGetTechnicalTracking: vi.fn(),
  mockListTechnicalTrackingCases: vi.fn(),
  mockRoute: {
    query: {} as Record<string, string>,
  },
}));

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
}));

vi.mock('@vben/common-ui', () => ({
  Page: defineComponent({
    setup(_, { slots }) {
      return () => h('main', slots.default?.());
    },
  }),
}));

vi.mock('#/utils/error-feedback', () => ({
  reportInlineErrorDisabled: vi.fn(),
}));

vi.mock('../api/technical-workflow-service', () => ({
  getTechnicalTracking: mockGetTechnicalTracking,
  listTechnicalTrackingCases: mockListTechnicalTrackingCases,
}));

vi.mock('../components/TechnicalTrackingDetailsSection.vue', () => ({
  default: defineComponent({
    props: ['activeTab', 'selectedNodeId', 'trackingResult'],
    setup(props) {
      return () =>
        h('section', { 'data-testid': 'tracking-details-stub' }, [
          `tab:${props.activeTab ?? ''}`,
          `node:${props.selectedNodeId ?? ''}`,
          `case:${props.trackingResult?.caseId ?? ''}`,
        ]);
    },
  }),
}));

vi.mock('../components/TechnicalTrackingSummaryTables.vue', () => ({
  default: defineComponent({
    props: ['trackingResult'],
    setup(props) {
      return () =>
        h(
          'section',
          { 'data-testid': 'tracking-summary-stub' },
          `summary:${props.trackingResult?.caseId ?? ''}`,
        );
    },
  }),
}));

vi.mock('../components/WorkflowSectionCard.vue', () => ({
  default: defineComponent({
    props: ['description', 'title'],
    setup(props, { slots }) {
      return () =>
        h('section', [
          props.title ? h('h2', props.title) : null,
          props.description ? h('p', props.description) : null,
          slots.default?.(),
        ]);
    },
  }),
}));

vi.mock('element-plus', () => {
  const ElAlert = defineComponent({
    props: ['title'],
    setup(props) {
      return () => h('section', props.title);
    },
  });

  const ElButton = defineComponent({
    props: ['disabled', 'loading', 'type'],
    emits: ['click'],
    setup(props, { attrs, emit, slots }) {
      return () =>
        h(
          'button',
          {
            ...attrs,
            disabled: props.disabled || props.loading,
            type: 'button',
            onClick: (event: MouseEvent) => emit('click', event),
          },
          slots.default?.(),
        );
    },
  });

  const ElDatePicker = defineComponent({
    props: ['modelValue'],
    emits: ['update:modelValue'],
    setup(props, { emit }) {
      return () =>
        h('input', {
          'data-testid': 'tracking-date-range',
          value: Array.isArray(props.modelValue)
            ? props.modelValue.join(',')
            : '',
          onInput: (event: Event) => {
            const value = (event.target as HTMLInputElement).value;
            emit(
              'update:modelValue',
              value
                ? value
                    .split(',')
                    .map((item) => item.trim())
                    .filter(Boolean)
                : [],
            );
          },
        });
    },
  });

  const ElEmpty = defineComponent({
    props: ['description'],
    setup(props) {
      return () => h('div', props.description);
    },
  });

  const ElForm = defineComponent({
    setup(_, { slots }) {
      return () => h('form', slots.default?.());
    },
  });

  const ElFormItem = defineComponent({
    setup(_, { slots }) {
      return () => h('label', slots.default?.());
    },
  });

  const ElInput = defineComponent({
    props: ['modelValue', 'placeholder'],
    emits: ['keyup', 'update:modelValue'],
    setup(props, { emit }) {
      return () =>
        h('input', {
          placeholder: props.placeholder,
          value: props.modelValue,
          onInput: (event: Event) =>
            emit('update:modelValue', (event.target as HTMLInputElement).value),
          onKeyup: (event: KeyboardEvent) => emit('keyup', event),
        });
    },
  });

  const ElPagination = defineComponent({
    props: ['currentPage', 'pageSize', 'total'],
    emits: ['update:currentPage', 'update:pageSize'],
    setup(props, { emit }) {
      return () =>
        h('nav', { 'data-testid': 'tracking-pagination' }, [
          `page:${props.currentPage ?? 1}`,
          `size:${props.pageSize ?? 20}`,
          `total:${props.total ?? 0}`,
          h(
            'button',
            {
              type: 'button',
              onClick: () =>
                emit('update:currentPage', (props.currentPage ?? 1) + 1),
            },
            'next-page',
          ),
        ]);
    },
  });

  const ElTag = defineComponent({
    setup(_, { slots }) {
      return () => h('span', slots.default?.());
    },
  });

  return {
    ElAlert,
    ElButton,
    ElDatePicker,
    ElEmpty,
    ElForm,
    ElFormItem,
    ElInput,
    ElMessage: {
      warning: messageWarning,
    },
    ElPagination,
    ElTag,
  };
});

import TechnicalTrackingView from './TechnicalTrackingView.vue';

function createCaseListItem(
  overrides: Partial<TechnicalTrackingCaseListItem> = {},
): TechnicalTrackingCaseListItem {
  return {
    applicationNo: 'APP-001',
    applicationType: 'ROUTINE',
    caseId: 'CASE-001',
    caseStatus: 'SAMPLING',
    latestActivityAt: '2026-06-21T09:00:00',
    matchedActivityTypes: ['TASK'],
    pathologyNo: 'BL-001',
    patientIdDisplay: '08305',
    patientName: '患者甲',
    submittingDepartmentName: '手术室',
    ...overrides,
  };
}

function createTracking(
  overrides: Partial<TechnicalTrackingViewModel> = {},
): TechnicalTrackingViewModel {
  return {
    blocks: [],
    caseId: 'CASE-001',
    caseStatus: 'SAMPLING',
    embeddingBoxes: [],
    embeddingEvaluationRecords: [],
    embeddingRecords: [],
    events: [],
    pathologyNo: 'BL-001',
    qcEvaluations: [],
    reworks: [],
    slides: [],
    specimens: [],
    technicalTasks: [
      {
        applicationId: 'APP-001',
        applicationNo: 'APP-001',
        assignedToName: '技师甲',
        assignedToUserId: 'USER-1',
        caseId: 'CASE-001',
        completedAt: null,
        createdAt: '2026-06-21T08:00:00',
        currentNode: 'GROSSING',
        deadlineAt: null,
        embeddingRemarks: null,
        expectedCompletedAt: null,
        grossDescription: null,
        id: 'TASK-001',
        objectDisplayNo: 'A1',
        objectId: 'SLIDE-001',
        objectType: 'SLIDE',
        pathologyNo: 'BL-001',
        patientId: 'P-001',
        patientIdDisplay: '08305',
        patientName: '患者甲',
        payload: null,
        priority: null,
        productionRemarks: null,
        receivedAt: null,
        remarks: null,
        sampledAt: null,
        sampledByName: null,
        samplingBlockCode: null,
        samplingBlockDescription: null,
        shiftRemark: null,
        specimenId: 'SPEC-001',
        specimenName: '胃组织',
        startedAt: null,
        stationCode: null,
        stationName: null,
        taskStatus: 'PENDING',
        taskType: 'GROSSING',
        timedOut: false,
        timeoutRuleCode: null,
      },
    ],
    ...overrides,
  };
}

async function flushView() {
  await Promise.resolve();
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

function mountView(query?: Record<string, string>) {
  mockRoute.query = query ?? {};
  const root = document.createElement('div');
  document.body.append(root);

  const app = createApp({
    render: () => h(TechnicalTrackingView),
  });
  app.mount(root);
  return { app, root };
}

function setInputValue(input: HTMLInputElement, value: string) {
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

function findButton(root: HTMLElement, text: string) {
  const button = [...root.querySelectorAll('button')].find(
    (item) => item.textContent?.trim() === text,
  );
  expect(button).toBeTruthy();
  return button as HTMLButtonElement;
}

describe('TechnicalTrackingView', () => {
  beforeEach(() => {
    mockRoute.query = {};
    messageWarning.mockReset();
    mockGetTechnicalTracking.mockReset();
    mockListTechnicalTrackingCases.mockReset();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('在标识和日期都为空时提示新文案且不发请求', async () => {
    const { app, root } = mountView();
    await flushView();

    findButton(root, '查询').click();
    await flushView();

    expect(messageWarning).toHaveBeenCalledWith(
      '请输入病例ID、病理号或对象ID，或选择工作日期',
    );
    expect(mockGetTechnicalTracking).not.toHaveBeenCalled();
    expect(mockListTechnicalTrackingCases).not.toHaveBeenCalled();

    app.unmount();
  });

  it('仅日期且单条命中时先查列表再自动进入详情', async () => {
    mockListTechnicalTrackingCases.mockResolvedValue({
      items: [createCaseListItem()],
      page: 1,
      size: 20,
      total: 1,
    });
    mockGetTechnicalTracking.mockResolvedValue(createTracking());

    const { app, root } = mountView();
    await flushView();

    const dateInput = root.querySelector<HTMLInputElement>(
      '[data-testid="tracking-date-range"]',
    );
    expect(dateInput).toBeTruthy();
    setInputValue(dateInput!, '2026-06-21,2026-06-21');
    findButton(root, '查询').click();
    await flushView();
    await flushView();

    expect(mockListTechnicalTrackingCases).toHaveBeenCalledWith({
      dateFrom: '2026-06-21',
      dateTo: '2026-06-21',
      page: 1,
      size: 20,
    });
    expect(mockGetTechnicalTracking).toHaveBeenCalledWith('CASE-001', {
      dateFrom: '2026-06-21',
      dateTo: '2026-06-21',
    });
    expect(
      root.querySelector('[data-testid="tracking-details-stub"]')?.textContent,
    ).toContain('case:CASE-001');

    app.unmount();
  });

  it('仅日期且多条命中时展示列表并在点击后加载详情', async () => {
    mockListTechnicalTrackingCases.mockResolvedValue({
      items: [
        createCaseListItem(),
        createCaseListItem({
          caseId: 'CASE-002',
          pathologyNo: 'BL-002',
          patientIdDisplay: '08306',
          patientName: '患者乙',
        }),
      ],
      page: 1,
      size: 20,
      total: 2,
    });
    mockGetTechnicalTracking.mockResolvedValue(
      createTracking({
        caseId: 'CASE-002',
        pathologyNo: 'BL-002',
      }),
    );

    const { app, root } = mountView();
    await flushView();

    const dateInput = root.querySelector<HTMLInputElement>(
      '[data-testid="tracking-date-range"]',
    );
    setInputValue(dateInput!, '2026-06-21,2026-06-21');
    findButton(root, '查询').click();
    await flushView();

    expect(mockGetTechnicalTracking).not.toHaveBeenCalled();
    expect(root.textContent).toContain('请选择病例查看技术追踪详情');

    const caseRow = root.querySelector<HTMLButtonElement>(
      '[data-testid="tracking-case-row-CASE-002"]',
    );
    expect(caseRow).toBeTruthy();
    caseRow!.click();
    await flushView();
    await flushView();

    expect(mockGetTechnicalTracking).toHaveBeenCalledWith('CASE-002', {
      dateFrom: '2026-06-21',
      dateTo: '2026-06-21',
    });
    expect(
      root.querySelector('[data-testid="tracking-details-stub"]')?.textContent,
    ).toContain('case:CASE-002');

    app.unmount();
  });

  it('输入标识和日期时仍直接走详情接口', async () => {
    mockGetTechnicalTracking.mockResolvedValue(createTracking());

    const { app, root } = mountView();
    await flushView();

    const identifierInput = root.querySelector<HTMLInputElement>(
      'input[placeholder="请输入病例ID、病理号或对象ID"]',
    );
    const dateInput = root.querySelector<HTMLInputElement>(
      '[data-testid="tracking-date-range"]',
    );
    expect(identifierInput).toBeTruthy();
    expect(dateInput).toBeTruthy();

    setInputValue(identifierInput!, 'BL-001');
    setInputValue(dateInput!, '2026-06-21,2026-06-21');
    findButton(root, '查询').click();
    await flushView();

    expect(mockListTechnicalTrackingCases).not.toHaveBeenCalled();
    expect(mockGetTechnicalTracking).toHaveBeenCalledWith('BL-001', {
      dateFrom: '2026-06-21',
      dateTo: '2026-06-21',
    });

    app.unmount();
  });

  it('深链 caseId/objectId/taskId/tab 仍直接打开详情', async () => {
    mockGetTechnicalTracking.mockResolvedValue(createTracking());

    const { app, root } = mountView({
      caseId: 'CASE-001',
      objectId: 'SLIDE-001',
      tab: 'abnormal',
      taskId: 'TASK-001',
    });
    await flushView();
    await flushView();

    expect(mockGetTechnicalTracking).toHaveBeenCalledWith('CASE-001', {});
    expect(
      root.querySelector('[data-testid="tracking-details-stub"]')?.textContent,
    ).toContain('tab:abnormal');
    expect(
      root.querySelector('[data-testid="tracking-details-stub"]')?.textContent,
    ).toContain('node:SLIDE-001');

    app.unmount();
  });
});
