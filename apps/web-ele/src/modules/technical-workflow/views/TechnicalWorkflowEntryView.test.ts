import type { PendingTechnicalTaskItem } from '../types/technical-workflow';

import { createApp, defineComponent, h, nextTick } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockAccessStore,
  mockListPendingTechnicalSpecimenRegistrations,
  mockListPendingTechnicalTasks,
  mockRouter,
} =
  vi.hoisted(() => ({
    mockAccessStore: {
      accessCodes: [] as string[],
    },
    mockListPendingTechnicalSpecimenRegistrations: vi.fn(),
    mockListPendingTechnicalTasks: vi.fn(),
    mockRouter: {
      push: vi.fn(),
    },
  }));

vi.mock('vue-router', () => ({
  useRouter: () => mockRouter,
}));

vi.mock('@vben/common-ui', () => ({
  Fallback: defineComponent({
    props: ['status'],
    setup(props) {
      return () => h('div', `fallback-${props.status}`);
    },
  }),
  Page: defineComponent({
    props: ['description', 'title'],
    setup(props, { slots }) {
      return () =>
        h('main', [
          h('h1', props.title),
          props.description ? h('p', props.description) : null,
          slots.default?.(),
        ]);
    },
  }),
}));

vi.mock('@vben/stores', () => ({
  useAccessStore: () => mockAccessStore,
}));

vi.mock('#/modules/specimen-workflow/constants', () => ({
  M2_PERMISSION_CODES: {
    SPECIMEN_RECEIVE: 'PERM_M2_SPECIMEN_RECEIVE',
  },
}));

vi.mock('../api/technical-workflow-service', () => ({
  listPendingTechnicalSpecimenRegistrations:
    mockListPendingTechnicalSpecimenRegistrations,
  listPendingTechnicalTasks: mockListPendingTechnicalTasks,
}));

vi.mock('element-plus', () => {
  const ElAlert = defineComponent({
    props: ['title'],
    setup(props) {
      return () => h('section', props.title);
    },
  });

  const ElButton = defineComponent({
    emits: ['click'],
    setup(_, { attrs, emit, slots }) {
      return () =>
        h(
          'button',
          {
            ...attrs,
            type: 'button',
            onClick: (event: MouseEvent) => emit('click', event),
          },
          slots.default?.(),
        );
    },
  });

  const ElSkeleton = defineComponent({
    setup() {
      return () => h('div', 'skeleton');
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
    ElSkeleton,
    ElTag,
  };
});

import TechnicalWorkflowEntryView from './TechnicalWorkflowEntryView.vue';

function createTask(
  overrides: Partial<PendingTechnicalTaskItem> = {},
): PendingTechnicalTaskItem {
  return {
    applicationId: 'APP-1',
    applicationNo: 'APP-20260528-001',
    caseId: 'CASE-1',
    completedAt: null,
    createdAt: '2026-05-28T08:00:00',
    deadlineAt: null,
    id: 'TASK-1',
    objectId: 'BLOCK-1',
    objectType: 'SAMPLING_BLOCK',
    pathologyNo: 'BL-20260528-001',
    payload: null,
    remarks: null,
    specimenId: 'SPEC-1',
    startedAt: null,
    taskStatus: 'PENDING',
    taskType: 'GROSSING',
    timedOut: false,
    timeoutRuleCode: null,
    ...overrides,
  };
}

async function flushView() {
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

function mountView() {
  const root = document.createElement('div');
  document.body.append(root);

  const app = createApp({
    render: () => h(TechnicalWorkflowEntryView),
  });

  app.mount(root);
  return { app, root };
}

function findButton(text: string) {
  const button = [...document.querySelectorAll('button')].find(
    (item) => item.textContent?.trim() === text,
  );
  expect(button).toBeTruthy();
  return button as HTMLButtonElement;
}

describe('TechnicalWorkflowEntryView', () => {
  beforeEach(() => {
    mockAccessStore.accessCodes = [
      'PERM_M2_SPECIMEN_RECEIVE',
      'PERM_M3_TECH_TASK_QUERY',
      'PERM_M3_GROSSING',
      'PERM_M3_EMBEDDING',
      'PERM_M3_SLICING',
      'PERM_M3_STAINING',
      'PERM_M3_REWORK',
      'PERM_M3_TECH_TRACKING_QUERY',
    ];

    mockListPendingTechnicalTasks.mockResolvedValue({
      items: [
        createTask({
          id: 'TASK-GROSSING',
          taskStatus: 'IN_PROGRESS',
          taskType: 'GROSSING',
        }),
        createTask({
          id: 'TASK-REWORK',
          objectId: 'SLIDE-9',
          objectType: 'SLIDE',
          remarks: '切片破损需重切',
          taskType: 'REWORK',
          timedOut: true,
        }),
      ],
      page: 1,
      size: 200,
      total: 2,
    });
    mockListPendingTechnicalSpecimenRegistrations.mockResolvedValue({
      items: [],
      page: 1,
      size: 20,
      total: 0,
    });
  });

  afterEach(() => {
    mockListPendingTechnicalSpecimenRegistrations.mockReset();
    mockListPendingTechnicalTasks.mockReset();
    mockRouter.push.mockReset();
    document.body.innerHTML = '';
  });

  it('shows fallback when user has no technical workflow access', async () => {
    mockAccessStore.accessCodes = [];

    const { app, root } = mountView();
    await flushView();

    expect(document.body.textContent).toContain('fallback-403');
    expect(mockListPendingTechnicalTasks).not.toHaveBeenCalled();

    app.unmount();
    root.remove();
  });

  it('renders workflow overview and keeps key entry actions available', async () => {
    const { app, root } = mountView();
    await flushView();

    expect(document.body.textContent).toContain('模块概览');
    expect(document.body.textContent).toContain('核心功能地图');
    expect(document.body.textContent).toContain('典型工作流程');
    expect(document.body.textContent).toContain('步骤 2: 标本登记');
    expect(document.body.textContent).toContain('步骤 4: 取材描写');
    expect(document.body.textContent).toContain('切片破损需重切');

    app.unmount();
    root.remove();
  });

  it('navigates to pathology receipt and task pool from the entry view', async () => {
    const { app, root } = mountView();
    await flushView();

    findButton('打开病理接收').click();
    findButton('进入任务池').click();
    await flushView();

    expect(mockRouter.push).toHaveBeenCalledWith({
      path: '/workflow/pathology-receipt',
      query: undefined,
    });
    expect(mockRouter.push).toHaveBeenCalledWith({
      path: '/technical-workflow/tasks',
      query: undefined,
    });

    app.unmount();
    root.remove();
  });

  it('prefers specimen registration when pending cases exist', async () => {
    mockListPendingTechnicalSpecimenRegistrations.mockResolvedValue({
      items: [
        {
          applicationId: 'APP-1',
          applicationNo: 'APP-20260601-001',
          applicationType: 'ROUTINE',
          caseId: 'CASE-1',
          checkItem: 'HE',
          inpatientNo: 'INP-1',
          pathologyNo: 'BL-20260601-001',
          patientId: 'P-001',
          patientName: '患者甲',
          receivedAt: '2026-06-01T08:00:00',
          registeredAt: null,
          registeredByName: null,
          registrationStatus: 'PENDING',
          submittingDepartmentName: '病理科',
        },
      ],
      page: 1,
      size: 20,
      total: 1,
    });

    const { app, root } = mountView();
    await flushView();
    await flushView();

    expect(document.body.textContent).toContain('接收后待登记病例');
    const continueButton = [...document.querySelectorAll('button')].find(
      (item) => item.textContent?.includes('继续当前工位处理中任务'),
    ) as HTMLButtonElement | undefined;
    expect(continueButton).toBeTruthy();
    continueButton?.click();
    await flushView();

    expect(mockRouter.push).toHaveBeenCalledWith({
      path: '/technical-workflow/specimen-registration',
      query: undefined,
    });

    app.unmount();
    root.remove();
  });
});
