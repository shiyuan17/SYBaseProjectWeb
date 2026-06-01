import type {
  PendingTechnicalSpecimenRegistrationItem,
  TechnicalSpecimenRegistrationDetail,
} from '../types/technical-workflow';

import { createApp, defineComponent, h, inject, nextTick, provide } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockCompleteTechnicalSpecimenRegistration,
  mockGoToTasks,
  mockGetTechnicalSpecimenRegistrationDetail,
  mockListPendingTechnicalSpecimenRegistrations,
  mockRouter,
  messageError,
  messageSuccess,
  messageWarning,
} = vi.hoisted(() => ({
  mockCompleteTechnicalSpecimenRegistration: vi.fn(),
  mockGoToTasks: vi.fn(),
  mockGetTechnicalSpecimenRegistrationDetail: vi.fn(),
  mockListPendingTechnicalSpecimenRegistrations: vi.fn(),
  mockRouter: {
    push: vi.fn(),
  },
  messageError: vi.fn(),
  messageSuccess: vi.fn(),
  messageWarning: vi.fn(),
}));

vi.mock('vue-router', () => ({
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
  completeTechnicalSpecimenRegistration:
    mockCompleteTechnicalSpecimenRegistration,
  getTechnicalSpecimenRegistrationDetail:
    mockGetTechnicalSpecimenRegistrationDetail,
  listPendingTechnicalSpecimenRegistrations:
    mockListPendingTechnicalSpecimenRegistrations,
}));

vi.mock('../utils/navigation', () => ({
  useTechnicalWorkflowNavigation: () => ({
    goToTasks: mockGoToTasks,
  }),
}));

vi.mock('element-plus', () => {
  const rowsKey = Symbol('rows');

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

  const ElEmpty = defineComponent({
    props: ['description'],
    setup(props) {
      return () => h('div', props.description);
    },
  });

  const ElInput = defineComponent({
    props: ['modelValue', 'placeholder', 'rows', 'type'],
    emits: ['update:modelValue'],
    setup(props, { emit }) {
      return () =>
        props.type === 'textarea'
          ? h('textarea', {
              placeholder: props.placeholder,
              rows: props.rows,
              value: props.modelValue,
              onInput: (event: Event) =>
                emit(
                  'update:modelValue',
                  (event.target as HTMLTextAreaElement).value,
                ),
            })
          : h('input', {
              placeholder: props.placeholder,
              value: props.modelValue,
              onInput: (event: Event) =>
                emit(
                  'update:modelValue',
                  (event.target as HTMLInputElement).value,
                ),
            });
    },
  });

  const ElPagination = defineComponent({
    setup() {
      return () => h('nav');
    },
  });

  const ElTable = defineComponent({
    props: ['data'],
    emits: ['row-click'],
    setup(props, { emit, slots }) {
      provide(rowsKey, () => props.data ?? []);
      return () =>
        h(
          'div',
          { 'data-testid': 'specimen-table' },
          [
            slots.default?.(),
            ...(props.data ?? []).map((row: PendingTechnicalSpecimenRegistrationItem) =>
              h(
                'div',
                {
                  'data-testid': `specimen-row-${row.caseId}`,
                  onClick: () => emit('row-click', row),
                },
                [
                  h('span', row.pathologyNo ?? '-'),
                  h('span', row.patientName ?? '-'),
                  h('span', row.registrationStatus ?? '-'),
                ],
              ),
            ),
          ],
        );
    },
  });

  const ElTableColumn = defineComponent({
    props: ['label', 'prop', 'type'],
    setup(props) {
      const getRows = inject<() => PendingTechnicalSpecimenRegistrationItem[]>(
        rowsKey,
        () => [],
      );
      return () =>
        h(
          'section',
          { 'data-testid': `column-${String(props.prop ?? props.type ?? 'index')}` },
          [
            h('strong', props.label),
            ...getRows().map((row, index) =>
              h(
                'div',
                String(
                  props.type === 'index'
                    ? index + 1
                    : row[
                        String(
                          props.prop,
                        ) as keyof PendingTechnicalSpecimenRegistrationItem
                      ] ?? '',
                ),
              ),
            ),
          ],
        );
    },
  });

  return {
    ElAlert,
    ElButton,
    ElEmpty,
    ElInput,
    ElMessage: {
      error: messageError,
      success: messageSuccess,
      warning: messageWarning,
    },
    ElPagination,
    ElTable,
    ElTableColumn,
  };
});

import TechnicalSpecimenRegistrationView from './TechnicalSpecimenRegistrationView.vue';

function createPendingItem(
  overrides: Partial<PendingTechnicalSpecimenRegistrationItem> = {},
): PendingTechnicalSpecimenRegistrationItem {
  return {
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
    ...overrides,
  };
}

function createDetail(
  overrides: Partial<TechnicalSpecimenRegistrationDetail> = {},
): TechnicalSpecimenRegistrationDetail {
  return {
    applicationId: 'APP-1',
    applicationNo: 'APP-20260601-001',
    applicationType: 'ROUTINE',
    caseId: 'CASE-1',
    checkItems: [{ name: 'HE', sequenceNo: 1 }],
    clinicalDiagnosis: '临床诊断说明',
    inpatientNo: 'INP-1',
    materials: [
      {
        sequenceNo: 1,
        sourcePart: '胃',
        specimenName: '组织块',
        specimenType: 'ROUTINE',
      },
    ],
    pathologyNo: 'BL-20260601-001',
    patientId: 'P-001',
    patientName: '患者甲',
    receivedAt: '2026-06-01T08:00:00',
    registeredAt: null,
    registeredByName: null,
    registrationRemarks: null,
    registrationStatus: 'PENDING',
    submittingDepartmentName: '病理科',
    ...overrides,
  };
}

async function flushView() {
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

function findButton(text: string) {
  const button = [...document.querySelectorAll('button')].find(
    (item) => item.textContent?.trim() === text,
  );
  expect(button).toBeTruthy();
  return button as HTMLButtonElement;
}

function mountView() {
  const root = document.createElement('div');
  document.body.append(root);

  const app = createApp({
    render: () => h(TechnicalSpecimenRegistrationView),
  });
  app.directive('loading', {});

  app.mount(root);
  return { app, root };
}

describe('TechnicalSpecimenRegistrationView', () => {
  beforeEach(() => {
    mockListPendingTechnicalSpecimenRegistrations.mockResolvedValue({
      items: [
        createPendingItem({
          caseId: 'CASE-1',
          pathologyNo: 'BL-20260601-001',
        }),
        createPendingItem({
          caseId: 'CASE-2',
          pathologyNo: 'BL-20260601-002',
          patientName: '患者乙',
        }),
      ],
      page: 1,
      size: 20,
      total: 2,
    });
    mockGetTechnicalSpecimenRegistrationDetail.mockResolvedValue(
      createDetail(),
    );
    mockGoToTasks.mockResolvedValue(undefined);
    mockCompleteTechnicalSpecimenRegistration.mockResolvedValue({
      caseId: 'CASE-1',
      grossingTaskCreated: true,
      pathologyNo: 'BL-20260601-001',
      registrationStatus: 'COMPLETED',
    });
  });

  afterEach(() => {
    mockCompleteTechnicalSpecimenRegistration.mockReset();
    mockGetTechnicalSpecimenRegistrationDetail.mockReset();
    mockGoToTasks.mockReset();
    mockListPendingTechnicalSpecimenRegistrations.mockReset();
    mockRouter.push.mockReset();
    messageError.mockReset();
    messageSuccess.mockReset();
    messageWarning.mockReset();
    document.body.innerHTML = '';
  });

  it('renders the four main sections and loads pending registrations on mount', async () => {
    const { app, root } = mountView();
    await flushView();

    expect(document.body.textContent).toContain('标本登记');
    expect(document.body.textContent).toContain('接收后待登记台账');
    expect(document.body.textContent).toContain('送检材料');
    expect(document.body.textContent).toContain('临床诊断');
    expect(document.body.textContent).toContain('检查项目');
    expect(mockListPendingTechnicalSpecimenRegistrations).toHaveBeenCalledWith({
      keyword: undefined,
      page: 1,
      size: 20,
    });
    expect(mockGetTechnicalSpecimenRegistrationDetail).toHaveBeenCalledWith(
      'CASE-1',
    );

    app.unmount();
    root.remove();
  });

  it('refreshes right-side details when selecting a different case', async () => {
    const { app, root } = mountView();
    await flushView();

    document
      .querySelector<HTMLDivElement>('[data-testid="specimen-row-CASE-2"]')
      ?.click();
    await flushView();

    expect(mockGetTechnicalSpecimenRegistrationDetail).toHaveBeenCalledWith(
      'CASE-2',
    );

    app.unmount();
    root.remove();
  });

  it('completes registration and jumps to task pool', async () => {
    const { app, root } = mountView();
    await flushView();

    findButton('完成登记').click();
    await flushView();
    await flushView();

    expect(mockCompleteTechnicalSpecimenRegistration).toHaveBeenCalledWith(
      'CASE-1',
      {
        remarks: undefined,
        terminalCode: 'T-M3-SPEC-REG',
      },
    );
    expect(mockGoToTasks).toHaveBeenCalledWith({
      mode: 'queue',
      pathologyNo: 'BL-20260601-001',
    });

    app.unmount();
    root.remove();
  });
});
