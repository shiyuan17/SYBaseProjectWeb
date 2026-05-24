import { createApp, defineComponent, h, inject, nextTick, provide, toRef } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import type { LatestSpecimenRegistrationResult } from '../types/specimen-workflow';

const tableRowKey = Symbol('table-row');

const {
  messageSuccess,
  messageWarning,
  mockAccessStore,
  mockGetApplicationDetail,
  mockGetLatestRegistrationResult,
  mockLoadWorkflowReferenceOptionsSafely,
  mockRegisterSpecimens,
  mockUserStore,
} = vi.hoisted(() => ({
  messageSuccess: vi.fn(),
  messageWarning: vi.fn(),
  mockAccessStore: {
    accessCodes: [
      'PERM_APPLICATION_DETAIL_QUERY',
      'PERM_WORKFLOW_REFERENCE_QUERY',
      'PERM_SPECIMEN_REGISTER',
    ] as string[],
  },
  mockGetApplicationDetail: vi.fn(),
  mockGetLatestRegistrationResult: vi.fn(),
  mockLoadWorkflowReferenceOptionsSafely: vi.fn(),
  mockRegisterSpecimens: vi.fn(),
  mockUserStore: {
    userInfo: {
      realName: '当前登录人',
      userId: 'USER-CURRENT',
    },
  },
}));

vi.mock('@vben/stores', () => ({
  useAccessStore: () => mockAccessStore,
  useUserStore: () => mockUserStore,
}));

vi.mock('#/modules/system-management/api/workflow-reference-service', () => ({
  createEmptyWorkflowReferenceOptions: () => ({
    clinicalSymptoms: [],
    collectionModes: [],
    containerNames: [],
    fixationLiquidTypes: [],
    specimenTypes: [],
  }),
  loadWorkflowReferenceOptionsSafely: mockLoadWorkflowReferenceOptionsSafely,
}));

vi.mock('#/modules/system-management/components/BodyPartSelect.vue', () => ({
  default: defineComponent({
    emits: ['update:modelValue'],
    props: ['modelValue', 'placeholder'],
    setup(props, { emit }) {
      return () =>
        h('input', {
          'data-component': 'body-part-select',
          placeholder: props.placeholder,
          value: props.modelValue,
          onInput: (event: Event) =>
            emit('update:modelValue', (event.target as HTMLInputElement).value),
        });
    },
  }),
}));

vi.mock('#/modules/system-management/components/ReferenceOptionSelect.vue', () => ({
  default: defineComponent({
    emits: ['update:modelValue'],
    props: ['modelValue', 'placeholder'],
    setup(props, { emit }) {
      return () =>
        h('input', {
          'data-component': 'reference-option-select',
          placeholder: props.placeholder,
          value: props.modelValue,
          onInput: (event: Event) =>
            emit('update:modelValue', (event.target as HTMLInputElement).value),
        });
    },
  }),
}));

vi.mock('../api/specimen-workflow-service', () => ({
  getApplicationDetail: mockGetApplicationDetail,
  getLatestRegistrationResult: mockGetLatestRegistrationResult,
  registerSpecimens: mockRegisterSpecimens,
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
      return () =>
        h('section', [
          props.title ? h('div', props.title) : null,
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

  const ElDialog = defineComponent({
    props: ['modelValue', 'title'],
    setup(props, { slots }) {
      return () =>
        props.modelValue
          ? h('section', [h('h3', props.title), slots.default?.(), slots.footer?.()])
          : null;
    },
  });

  const ElInput = defineComponent({
    emits: ['update:modelValue'],
    props: ['disabled', 'modelValue', 'placeholder', 'rows', 'type'],
    setup(props, { emit }) {
      return () =>
        props.type === 'textarea'
          ? h('textarea', {
              disabled: props.disabled,
              placeholder: props.placeholder,
              rows: props.rows,
              value: props.modelValue,
              onInput: (event: Event) =>
                emit('update:modelValue', (event.target as HTMLTextAreaElement).value),
            })
          : h('input', {
              disabled: props.disabled,
              placeholder: props.placeholder,
              value: props.modelValue,
              onInput: (event: Event) =>
                emit('update:modelValue', (event.target as HTMLInputElement).value),
            });
    },
  });

  const ElInputNumber = defineComponent({
    emits: ['update:modelValue'],
    props: ['min', 'modelValue'],
    setup(props, { emit }) {
      return () =>
        h('input', {
          min: props.min,
          type: 'number',
          value: props.modelValue,
          onInput: (event: Event) =>
            emit('update:modelValue', Number((event.target as HTMLInputElement).value)),
        });
    },
  });

  const ElDescriptionsItem = defineComponent({
    props: ['label'],
    setup(props, { slots }) {
      return () => h('div', [h('strong', `${props.label}:`), slots.default?.()]);
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
      provide(tableRowKey, toRef(props, 'row'));
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
        const row = inject<{ value: null | Record<string, unknown> } | null>(tableRowKey, null);
        const currentRow = row?.value ?? null;
        const value = props.prop && currentRow ? currentRow[props.prop] : undefined;
        return h('div', [
          props.label ? h('span', props.label) : null,
          slots.default ? slots.default({ row: currentRow }) : value == null ? null : h('span', String(value)),
        ]);
      };
    },
  });

  return {
    ElAlert,
    ElButton,
    ElDescriptions: passthrough(),
    ElDescriptionsItem,
    ElDialog,
    ElForm: passthrough('form'),
    ElFormItem: passthrough(),
    ElInput,
    ElInputNumber,
    ElMessage: {
      success: messageSuccess,
      warning: messageWarning,
    },
    ElTable,
    ElTableColumn,
    ElTag: passthrough('span'),
  };
});

import SpecimenRegisterDialog from './SpecimenRegisterDialog.vue';

function buildApplicationDetail() {
  return {
    abnormalFlag: true,
    applicationDate: '2026-05-24',
    applicationFormStatus: 'PENDING',
    applicationNo: 'AP202605240001',
    applicationType: 'ROUTINE',
    clinicalDiagnosis: '胃息肉',
    clinicalSymptom: '腹痛',
    createdAt: '2026-05-24T08:00:00',
    currentNode: 'SPECIMEN_COLLECTION',
    externalOrderNo: null,
    id: 'APP-ID',
    patientAge: '40',
    patientGender: 'F',
    patientId: 'PAT-001',
    patientName: '张三',
    recentEvents: [],
    remarks: null,
    sourceHospitalId: null,
    sourceHospitalName: null,
    specimenRemovalTime: null,
    specimenSite: '胃',
    specimens: [],
    status: 'SUBMITTED',
    submissionDate: '2026-05-24',
    submittingDepartmentId: 'DEP-001',
    submittingDepartmentName: '普外科',
    submittingDoctorName: '李医生',
    submittingDoctorUserId: 'DOC-001',
    thirdPartySource: null,
    updatedAt: '2026-05-24T08:30:00',
  };
}

function buildLatestRegistrationResult() {
  return {
    applicationId: 'APP-ID',
    labelPrintBatchNo: 'LP-001',
    labelPrintMessage: '存在退回',
    labelPrintSuccess: false,
    registrationSnapshot: {
      collectionScene: '门诊',
      operatorName: '历史登记员',
      operatorUserId: 'USER-OLD',
      printerCode: 'P-01',
      remarks: '请补充容器信息',
      terminalCode: 'TERM-01',
    },
    specimens: [
      {
        abnormalReason: '容器破损',
        barcode: 'BC-001',
        clinicalSymptom: '腹痛',
        collectionMode: '手术',
        containerCount: 2,
        containerName: '标本瓶',
        fixationStatus: 'PENDING',
        id: 'SPEC-001',
        labelPrintStatus: 'FAILED',
        qualityCheckResult: 'FAILED',
        qualityIssueCodes: ['CONTAINER_DAMAGE'],
        receiptStatus: 'RETURNED',
        specimenCount: 1,
        specimenName: '胃组织',
        specimenNo: 'SP-001',
        specimenSite: '胃',
        specimenStatus: 'RETURNED',
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

async function mountDialog(latestResult = buildLatestRegistrationResult()) {
  mockGetApplicationDetail.mockResolvedValue(buildApplicationDetail());
  mockGetLatestRegistrationResult.mockResolvedValue(latestResult);
  mockLoadWorkflowReferenceOptionsSafely.mockResolvedValue({
    clinicalSymptoms: [],
    collectionModes: [],
    containerNames: [],
    fixationLiquidTypes: [],
    specimenTypes: [],
  });

  const root = document.createElement('div');
  document.body.append(root);
  const app = createApp({
    render: () => h(SpecimenRegisterDialog, {
      applicationId: 'APP-ID',
      modelValue: true,
      'onUpdate:modelValue': () => {},
      onRegistered: () => {},
    }),
  });
  app.mount(root);
  await flushAll();
  return { app, root };
}

function inputByPlaceholder(root: HTMLElement, placeholder: string) {
  const elements = Array.from(
    root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
      `[placeholder="${placeholder}"]`,
    ),
  );
  const element = elements.at(-1);
  if (!element) {
    throw new Error(`Missing input for placeholder: ${placeholder}`);
  }
  return element;
}

describe('SpecimenRegisterDialog', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    messageSuccess.mockReset();
    messageWarning.mockReset();
    mockGetApplicationDetail.mockReset();
    mockGetLatestRegistrationResult.mockReset();
    mockLoadWorkflowReferenceOptionsSafely.mockReset();
    mockRegisterSpecimens.mockReset();
  });

  it('prefills the form and specimen rows from the latest registration result and shows abnormal reasons', async () => {
    const { app, root } = await mountDialog();

    expect(mockGetApplicationDetail).toHaveBeenCalledWith('APP-ID');
    expect(mockGetLatestRegistrationResult).toHaveBeenCalledWith('APP-ID');
    expect(root.textContent).toContain('最近一次登记存在异常标本');
    expect(root.textContent).toContain('SP-001 / BC-001');
    expect(root.textContent).toContain('异常类型：已退回');
    expect(root.textContent).toContain('质控结果：不合格');
    expect(root.textContent).toContain('问题代码：CONTAINER_DAMAGE');
    expect(root.textContent).toContain('原因：容器破损');
    expect(inputByPlaceholder(root, '用于标签打印').value).toBe('P-01');
    expect(inputByPlaceholder(root, '扫码枪或工作站终端').value).toBe('TERM-01');
    expect(inputByPlaceholder(root, '例如：门诊、病房、手术室').value).toBe('门诊');
    expect(inputByPlaceholder(root, '补充登记说明').value).toBe('请补充容器信息');
    expect(inputByPlaceholder(root, '标准化标本名称').value).toBe('胃组织');

    app.unmount();
  });

  it('restores the initial snapshot when reset is clicked', async () => {
    const { app, root } = await mountDialog();

    const printerInput = inputByPlaceholder(root, '用于标签打印');
    const specimenNameInput = inputByPlaceholder(root, '标准化标本名称');

    printerInput.value = 'P-99';
    printerInput.dispatchEvent(new Event('input'));
    specimenNameInput.value = '修改后的标本';
    specimenNameInput.dispatchEvent(new Event('input'));
    await flushAll();

    const resetButton = Array.from(root.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('重置登记表单'),
    );
    resetButton?.click();
    await flushAll();

    expect(inputByPlaceholder(root, '用于标签打印').value).toBe('P-01');
    expect(inputByPlaceholder(root, '标准化标本名称').value).toBe('胃组织');

    app.unmount();
  });

  it('falls back to a blank form when there is no latest registration snapshot', async () => {
    const latestResult: LatestSpecimenRegistrationResult = {
      applicationId: 'APP-ID',
      labelPrintBatchNo: null,
      labelPrintMessage: null,
      labelPrintSuccess: false,
      registrationSnapshot: null,
      specimens: [],
    };
    const { app, root } = await mountDialog(latestResult);

    expect(root.textContent).not.toContain('最近一次登记存在异常标本');
    expect(inputByPlaceholder(root, '用于标签打印').value).toBe('');
    expect(inputByPlaceholder(root, '扫码枪或工作站终端').value).toBe('');
    expect(inputByPlaceholder(root, '例如：门诊、病房、手术室').value).toBe('');
    expect(inputByPlaceholder(root, '标准化标本名称').value).toBe('');
    expect(root.querySelector<HTMLInputElement>('input[disabled]')?.value).toBe('当前登录人');

    app.unmount();
  });
});
