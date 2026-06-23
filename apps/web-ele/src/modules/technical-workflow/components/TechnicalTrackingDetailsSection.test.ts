import type {
  TechnicalTrackingView,
  WorkstationCaseContext,
} from '../types/technical-workflow';
import type { WorkflowTimelineStep } from '../utils/tracking';

import { createApp, defineComponent, h, nextTick } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../components/CopyableIdentifier.vue', () => ({
  default: defineComponent({
    props: ['value'],
    setup(props) {
      return () => h('span', props.value ?? '-');
    },
  }),
}));

vi.mock('./WorkflowSectionCard.vue', () => ({
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
  const createPassThrough = (tag: string) =>
    defineComponent({
      setup(_, { slots }) {
        return () => h(tag, slots.default?.());
      },
    });

  const ElDescriptions = createPassThrough('div');
  const ElDescriptionsItem = defineComponent({
    props: ['label'],
    setup(props, { slots }) {
      return () => h('div', [props.label ? h('span', props.label) : null, slots.default?.()]);
    },
  });
  const ElEmpty = defineComponent({
    props: ['description'],
    setup(props) {
      return () => h('div', props.description);
    },
  });
  const ElTable = defineComponent({
    setup(_, { slots }) {
      return () => h('table', slots.default?.());
    },
  });
  const ElTableColumn = defineComponent({
    props: ['label'],
    setup(props) {
      return () => h('col', props.label);
    },
  });
  const ElTag = createPassThrough('span');
  const ElAlert = createPassThrough('div');
  const ElTabs = defineComponent({
    props: ['modelValue'],
    setup(_, { slots }) {
      return () => h('div', slots.default?.());
    },
  });
  const ElTabPane = defineComponent({
    props: ['label', 'name'],
    setup(props, { slots }) {
      return () =>
        h(
          'section',
          { 'data-tab-name': props.name },
          [props.label ? h('h3', props.label) : null, slots.default?.()],
        );
    },
  });

  return {
    ElAlert,
    ElDescriptions,
    ElDescriptionsItem,
    ElEmpty,
    ElTable,
    ElTableColumn,
    ElTabPane,
    ElTabs,
    ElTag,
  };
});

import TechnicalTrackingDetailsSection from './TechnicalTrackingDetailsSection.vue';

function createTracking(
  overrides: Partial<TechnicalTrackingView> = {},
): TechnicalTrackingView {
  return {
    blocks: [],
    caseId: 'CASE-001',
    caseStatus: 'RECEIVED',
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
    ...overrides,
  };
}

function createContext(
  overrides: Partial<WorkstationCaseContext> = {},
): WorkstationCaseContext {
  return {
    activeTaskCount: 0,
    alerts: [],
    blockCount: 0,
    caseId: 'CASE-001',
    caseStatus: 'RECEIVED',
    currentTaskSuggestions: [],
    embeddingBoxCount: 0,
    nextFlowLabel: '技术标本登记',
    pathologyNo: 'BL-001',
    pendingReworkCount: 0,
    progressNodes: [
      {
        id: 'CASE-001',
        label: 'BL-001',
        type: 'CASE',
      },
      {
        id: 'SPEC-001',
        label: 'SP20260620001',
        parentId: 'CASE-001',
        status: 'RECEIVED',
        type: 'SPECIMEN',
      },
      {
        id: 'SLIDE-001',
        label: 'SL20260623001',
        parentId: 'SPEC-001',
        status: 'PRINTED',
        type: 'SLIDE',
      },
    ],
    recentEvents: [],
    slideCount: 0,
    specimenCount: 1,
    ...overrides,
  };
}

function createTimelineSteps(): WorkflowTimelineStep[] {
  return [
    {
      content: '标本已接收',
      index: 1,
      nodeCode: 'RECEIVED',
      operatorName: '技师甲',
      status: 'completed',
      statusText: '成功',
      time: '2026-06-18 11:06:39',
      title: '标本接收',
    },
  ];
}

async function flushView() {
  await Promise.resolve();
  await nextTick();
}

function mountComponent() {
  const root = document.createElement('div');
  document.body.append(root);
  const app = createApp({
    render: () =>
      h(TechnicalTrackingDetailsSection, {
        activeTab: 'timeline',
        context: createContext(),
        filteredQcEvaluations: [],
        filteredReworks: [],
        filteredTasks: [],
        selectedNodeId: 'CASE-001',
        trackingResult: createTracking(),
        workflowTimelineSteps: createTimelineSteps(),
        'onUpdate:activeTab': () => {},
      }),
  });

  app.mount(root);
  return { app, root };
}

describe('TechnicalTrackingDetailsSection', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('removes tracking subtitles, object tree, and redundant summary fields', async () => {
    const { app, root } = mountComponent();
    await flushView();

    expect(root.textContent).not.toContain('展示病例主状态和当前聚焦对象。');
    expect(root.textContent).not.toContain('按照病例、标本、蜡块、包埋盒、玻片展开。');
    expect(root.textContent).not.toContain(
      '按时间线、任务返工和质控异常查看当前对象。',
    );
    expect(root.textContent).not.toContain('病例编号');
    expect(root.textContent).not.toContain('当前聚焦对象');
    expect(root.textContent).not.toContain('对象树');
    expect(root.textContent).toContain('病理号');
    expect(root.textContent).toContain('病例状态');

    app.unmount();
  });

  it('removes the recent events section from timeline details', async () => {
    const { app, root } = mountComponent();
    await flushView();

    expect(root.textContent).not.toContain('最近事件');
    expect(root.textContent).toContain('标本已接收');

    app.unmount();
  });

  it('adds overflow boundaries around tracking detail tabs and tables', async () => {
    const { app, root } = mountComponent();
    await flushView();

    expect(
      root.querySelector('.technical-tracking-detail-grid')?.className,
    ).toContain('min-w-0');
    expect(root.querySelector('.tracking-detail-card')?.className).toContain(
      'min-w-0',
    );
    expect(root.querySelector('.tracking-detail-tabs')?.className).toContain(
      'min-w-0',
    );
    expect(
      root.querySelector('.tracking-detail-table-scroll')?.className,
    ).toContain('overflow-x-auto');

    app.unmount();
  });
});
