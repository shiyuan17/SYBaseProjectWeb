import type { SlicingWorkbenchView } from '../types/technical-workflow';

import { createApp, defineComponent, h, nextTick } from 'vue';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockGetSlicingWorkbench,
  mockGetTechnicalTracking,
  mockStartSlicing,
  mockUpdateTechnicalTaskRemarks,
} = vi.hoisted(() => ({
  mockGetSlicingWorkbench: vi.fn(),
  mockGetTechnicalTracking: vi.fn(),
  mockStartSlicing: vi.fn(),
  mockUpdateTechnicalTaskRemarks: vi.fn(),
}));

vi.mock('@vben/common-ui', () => ({
  Page: defineComponent({
    props: ['description', 'title'],
    setup(props, { slots }) {
      return () =>
        h('main', [
          props.title ? h('h1', props.title) : null,
          props.description ? h('p', props.description) : null,
          slots.default?.(),
        ]);
    },
  }),
}));

vi.mock('#/utils/error-feedback', () => ({
  reportInlineErrorDisabled: vi.fn(),
}));

vi.mock('../api/technical-workflow-service', () => ({
  getSlicingWorkbench: mockGetSlicingWorkbench,
  getTechnicalTracking: mockGetTechnicalTracking,
  startSlicing: mockStartSlicing,
  updateTechnicalTaskRemarks: mockUpdateTechnicalTaskRemarks,
}));

vi.mock('../components/EmbeddingQualityReviewDialog.vue', () => ({
  default: defineComponent({
    setup() {
      return () => null;
    },
  }),
}));

vi.mock('../components/SlicingProcessDialog.vue', () => ({
  default: defineComponent({
    setup() {
      return () => null;
    },
  }),
}));

vi.mock('../components/SlicingQcEvaluationDialog.vue', () => ({
  default: defineComponent({
    setup() {
      return () => null;
    },
  }),
}));

vi.mock('../components/TechnicalTaskStartDialog.vue', () => ({
  default: defineComponent({
    setup() {
      return () => null;
    },
  }),
}));

vi.mock('../components/TechnicalTrackingDetailsSection.vue', () => ({
  default: defineComponent({
    setup() {
      return () => null;
    },
  }),
}));

vi.mock('../components/TechnicalTrackingSummaryTables.vue', () => ({
  default: defineComponent({
    setup() {
      return () => null;
    },
  }),
}));

vi.mock('element-plus', () => {
  const simple = (tag = 'div') =>
    defineComponent({
      props: ['disabled', 'modelValue', 'title'],
      emits: ['change', 'click', 'update:modelValue'],
      setup(props, { attrs, emit, slots }) {
        return () =>
          h(
            tag,
            {
              ...attrs,
              disabled: props.disabled,
              type: tag === 'button' ? 'button' : undefined,
              onClick: (event: MouseEvent) => emit('click', event),
            },
            slots.default?.() ?? props.title,
          );
      },
    });

  return {
    ElAlert: simple('section'),
    ElButton: simple('button'),
    ElCheckbox: simple('label'),
    ElDrawer: simple('section'),
    ElInput: simple('input'),
    ElMessage: {
      success: vi.fn(),
      warning: vi.fn(),
    },
    ElOption: simple('option'),
    ElPagination: simple('nav'),
    ElSelect: simple('select'),
    ElTable: defineComponent({
      props: ['data'],
      setup(props, { slots }) {
        return () =>
          h('div', [
            slots.default?.(),
            ...(props.data ?? []).map((row: { taskId?: string }) =>
              h('div', row.taskId ?? ''),
            ),
          ]);
      },
    }),
    ElTableColumn: defineComponent({
      props: ['label'],
      setup(props, { slots }) {
        return () => h('section', slots.default?.({ row: {} }) ?? props.label);
      },
    }),
    ElTag: simple('span'),
  };
});

vi.mock('../utils/tracking', () => ({
  buildTrackingTreeData: vi.fn(() => []),
  buildWorkflowTimelineSteps: vi.fn(() => []),
  filterTrackingQcEvaluations: vi.fn(() => []),
  filterTrackingReworks: vi.fn(() => []),
  filterTrackingTasks: vi.fn(() => []),
  resolveSelectedTrackingNodeId: vi.fn(() => ''),
}));

import SlicingWorkstationView from './SlicingWorkstationView.vue';

function createWorkbench(): SlicingWorkbenchView {
  return {
    completedPage: 1,
    completedSize: 20,
    completedTodayList: [],
    completedTotal: 0,
    pendingList: [
      {
        caseId: 'CASE-1',
        completedAt: null,
        embeddingBoxId: 'BOX-1',
        embeddingClearRemark: null,
        embeddingEvaluation: null,
        embeddingOperatorName: null,
        grossingEvaluation: null,
        pathologyNo: 'BL-001',
        patientId: 'P-001',
        patientName: '患者甲',
        selectable: true,
        shiftRemark: null,
        slideId: 'SLIDE-1',
        slideNo: 'SLIDE-001',
        sliceNotice: null,
        slicingOperatorName: null,
        slicingRemark: null,
        specimenId: 'SPEC-1',
        specimenName: '胃窦',
        taskId: 'TASK-1',
        taskStatus: 'PENDING',
        timedOut: false,
      },
    ],
    pendingPage: 1,
    pendingSize: 20,
    pendingTotal: 1,
    stats: {
      completedDeptTodayCount: 0,
      completedMineTodayCount: 0,
      overdueCount: 0,
      pendingPrintCount: 0,
      pendingTodayCount: 1,
      pendingTomorrowCount: 0,
    },
  };
}

async function flushView() {
  await Promise.resolve();
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

function mountView() {
  const root = document.createElement('div');
  document.body.append(root);
  const app = createApp({
    render: () => h(SlicingWorkstationView),
  });
  app.directive('loading', {});
  app.mount(root);
  return { app, root };
}

describe('SlicingWorkstationView', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    mockGetSlicingWorkbench.mockResolvedValue(createWorkbench());
    mockGetTechnicalTracking.mockResolvedValue({
      blocks: [],
      caseId: 'CASE-1',
      caseStatus: 'SLICING',
      embeddingBoxes: [],
      embeddingEvaluationRecords: [],
      embeddingRecords: [],
      events: [],
      pathologyNo: 'BL-001',
      qcEvaluations: [],
      reworks: [],
      slides: [],
      specimens: [],
      technicalTasks: [],
    });
    mockStartSlicing.mockResolvedValue({});
  });

  it('hides placeholder actions while keeping the primary slicing flow visible', async () => {
    const { app, root } = mountView();
    await flushView();

    expect(document.body.textContent).toContain('完成切片');
    expect(document.body.textContent).toContain('质控评价');
    expect(document.body.textContent).toContain('今日已完成');
    expect(document.body.textContent).not.toContain(
      '参照旧站结构重排为顶部统计查询',
    );
    expect(document.body.textContent).not.toContain('待补后端能力');
    expect(document.body.textContent).not.toContain('重打玻片');
    expect(document.body.textContent).not.toContain('取消完成');

    app.unmount();
    root.remove();
  });
});
