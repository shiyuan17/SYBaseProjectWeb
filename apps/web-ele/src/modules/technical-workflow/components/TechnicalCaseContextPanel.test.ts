import { createApp, defineComponent, h } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('./WorkflowSectionCard.vue', () => ({
  default: defineComponent({
    props: ['description', 'title'],
    setup(props, { slots }) {
      return () =>
        h('section', [
          h('h2', props.title),
          props.description ? h('p', props.description) : null,
          slots.default?.(),
        ]);
    },
  }),
}));

vi.mock('element-plus', () => {
  const ElAlert = defineComponent({
    props: ['title'],
    setup(props, { slots }) {
      return () => h('section', [props.title, slots.default?.()]);
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

  const ElEmpty = defineComponent({
    props: ['description'],
    setup(props) {
      return () => h('div', props.description);
    },
  });

  const ElTag = defineComponent({
    setup(_, { slots }) {
      return () => h('span', slots.default?.());
    },
  });

  const ElTimeline = defineComponent({
    setup(_, { slots }) {
      return () => h('div', slots.default?.());
    },
  });

  const ElTimelineItem = defineComponent({
    props: ['timestamp'],
    setup(props, { slots }) {
      return () => h('article', [props.timestamp, slots.default?.()]);
    },
  });

  return {
    ElAlert,
    ElButton,
    ElEmpty,
    ElTag,
    ElTimeline,
    ElTimelineItem,
  };
});

import TechnicalCaseContextPanel from './TechnicalCaseContextPanel.vue';

function createContext() {
  return {
    activeTaskCount: 1,
    alerts: [],
    blockCount: 2,
    caseId: 'CASE-001',
    caseStatus: 'DIAGNOSIS_PENDING',
    currentTaskSuggestions: [],
    embeddingBoxCount: 2,
    nextFlowLabel: '染色',
    pathologyNo: 'BL-001',
    pendingReworkCount: 0,
    progressNodes: [],
    recentEvents: [],
    slideCount: 3,
    specimenCount: 1,
  };
}

function mountPanel() {
  const root = document.createElement('div');
  document.body.append(root);

  const app = createApp({
    render: () => h(TechnicalCaseContextPanel, { context: createContext() }),
  });

  app.mount(root);
  return { app, root };
}

describe('TechnicalCaseContextPanel', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('does not render subtitle copy for the case context cards', () => {
    const { app, root } = mountPanel();

    expect(document.body.textContent).not.toContain(
      '固定展示病例摘要、下一流向和当前生产风险。',
    );
    expect(document.body.textContent).not.toContain(
      '将返工、质控和下一工位衔接信息前置显示，减少来回查找。',
    );
    expect(document.body.textContent).not.toContain(
      '汇总切片提示、返工原因与质控建议。',
    );
    expect(document.body.textContent).not.toContain(
      '展示节点操作、质控、返工和流转记录。',
    );

    app.unmount();
    root.remove();
  });
});
