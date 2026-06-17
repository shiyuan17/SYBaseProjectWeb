import { createApp, defineComponent, h, inject, nextTick, provide } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const tableRowsKey = Symbol('table-rows');

const { messageWarning, mockGetTechnicalTracking, mockRoute, mockRouter } =
  vi.hoisted(() => ({
    messageWarning: vi.fn(),
    mockGetTechnicalTracking: vi.fn(),
    mockRoute: {
      query: {
        caseId: 'BL-001',
        mode: 'exception',
      } as Record<string, string>,
    },
    mockRouter: {
      push: vi.fn(),
    },
  }));

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => mockRouter,
}));

vi.mock('@vben/common-ui', () => ({
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

vi.mock('../api/technical-workflow-service', () => ({
  getTechnicalTracking: mockGetTechnicalTracking,
}));

vi.mock('../components/WorkflowSectionCard.vue', () => ({
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

vi.mock('../components/TechnicalCaseContextPanel.vue', () => ({
  default: defineComponent({
    props: ['context', 'loading'],
    setup() {
      return () => h('aside', { 'data-testid': 'case-context-panel' });
    },
  }),
}));

vi.mock('../components/ReworkCreateDialog.vue', () => ({
  default: defineComponent({
    props: [
      'caseId',
      'initialObjectId',
      'initialObjectType',
      'modelValue',
      'trackingResult',
    ],
    emits: ['submitted', 'update:modelValue'],
    setup(props) {
      return () =>
        h('div', {
          'data-case-id': props.caseId,
          'data-testid': 'rework-create-dialog',
          'data-visible': String(props.modelValue),
        });
    },
  }),
}));

vi.mock('../components/ReworkExecuteDialog.vue', () => ({
  default: defineComponent({
    props: ['initialReworkOrderId', 'modelValue', 'trackingResult'],
    emits: ['submitted', 'update:modelValue'],
    setup(props) {
      return () =>
        h('div', {
          'data-testid': 'rework-execute-dialog',
          'data-visible': String(props.modelValue),
        });
    },
  }),
}));

vi.mock('element-plus', () => {
  const passthrough = (tag = 'div') =>
    defineComponent({
      props: ['label', 'title'],
      setup(props, { slots }) {
        return () =>
          h(tag, [
            props.title ? h('div', props.title) : null,
            props.label ? h('label', props.label) : null,
            slots.default?.(),
          ]);
      },
    });

  const ElAlert = defineComponent({
    props: ['title'],
    setup(props, { slots }) {
      return () => h('section', [props.title, slots.default?.()]);
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

  const ElDatePicker = defineComponent({
    props: ['modelValue', 'placeholder'],
    emits: ['update:modelValue'],
    setup(props, { emit }) {
      return () =>
        h('input', {
          'data-testid': 'work-date-picker',
          placeholder: props.placeholder,
          value: props.modelValue,
          onInput: (event: Event) =>
            emit('update:modelValue', (event.target as HTMLInputElement).value),
        });
    },
  });

  const ElDescriptions = passthrough();
  const ElDescriptionsItem = passthrough();
  const ElForm = passthrough('form');
  const ElFormItem = passthrough();

  const ElInput = defineComponent({
    props: ['modelValue', 'placeholder'],
    emits: ['update:modelValue'],
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

  const ElTable = defineComponent({
    props: ['data'],
    setup(props, { slots }) {
      provide(tableRowsKey, () => props.data ?? []);
      return () => h('div', slots.default?.());
    },
  });

  const ElTableColumn = defineComponent({
    props: ['label', 'prop'],
    setup(props, { slots }) {
      const getRows = inject<() => Record<string, unknown>[]>(
        tableRowsKey,
        () => [],
      );
      const renderCellContent = (row: Record<string, unknown>) => {
        if (slots.default) {
          return slots.default({ row });
        }
        if (props.prop) {
          return String(row[props.prop] ?? '');
        }
        return '';
      };
      return () =>
        h('section', [
          h('strong', props.label),
          ...getRows().map((row) => h('div', renderCellContent(row))),
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
    ElDescriptions,
    ElDescriptionsItem,
    ElForm,
    ElFormItem,
    ElInput,
    ElMessage: {
      warning: messageWarning,
    },
    ElTable,
    ElTableColumn,
    ElTag,
  };
});

import ReworkWorkstationView from './ReworkWorkstationView.vue';

function createTrackingResult() {
  return {
    blocks: [],
    caseId: 'CASE-001',
    caseStatus: 'DIAGNOSIS_PENDING',
    embeddingBoxes: [],
    events: [],
    pathologyNo: 'BL-001',
    qcEvaluations: [],
    reworks: [
      {
        reason: 'color-faded',
        reworkOrderId: 'RW-001',
        reworkType: 'RESTAIN',
        status: 'PENDING',
      },
    ],
    slides: [],
    specimens: [],
    technicalTasks: [],
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
    render: () => h(ReworkWorkstationView),
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

describe('ReworkWorkstationView', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-17T09:00:00'));
    mockRoute.query = {
      caseId: 'BL-001',
      mode: 'exception',
    };
    mockGetTechnicalTracking.mockResolvedValue(createTrackingResult());
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
    messageWarning.mockReset();
    mockGetTechnicalTracking.mockReset();
    mockRouter.push.mockReset();
  });

  it('passes the resolved case id to the create dialog after searching by pathology number', async () => {
    const { app, root } = mountView();
    await flushView();

    expect(mockGetTechnicalTracking).toHaveBeenCalledWith('BL-001', {
      workDate: undefined,
    });
    expect(document.body.textContent).toContain('CASE-001');

    const createDialog = document.querySelector<HTMLElement>(
      '[data-testid="rework-create-dialog"]',
    );
    expect(createDialog?.dataset.caseId).toBe('CASE-001');
    expect(createDialog?.dataset.visible).toBe('true');

    app.unmount();
    root.remove();
  });

  it('passes workDate when loading tracking', async () => {
    const { app, root } = mountView();
    await flushView();

    expect(mockGetTechnicalTracking).toHaveBeenCalledWith('BL-001', {
      workDate: undefined,
    });

    app.unmount();
    root.remove();
  });

  it('uses the resolved case id when routing back to the target workstation', async () => {
    const { app, root } = mountView();
    await flushView();

    findButton('回到对应工位').click();

    expect(mockRouter.push).toHaveBeenCalledWith({
      path: '/technical-workflow/staining',
      query: {
        caseId: 'CASE-001',
        mode: 'exception',
        pathologyNo: 'BL-001',
      },
    });

    app.unmount();
    root.remove();
  });
});
