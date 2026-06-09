import type {
  SpecimenManagementListItem,
  SpecimenManagementListPage,
} from '../types/specimen-workflow';

import {
  computed,
  type ComputedRef,
  createApp,
  h,
  inject,
  nextTick,
  provide,
  ref,
  type Ref,
  type SetupContext,
  useAttrs,
} from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import SpecimenFixationTimePanel from './SpecimenFixationTimePanel.vue';

const tableDataKey = Symbol('table-data');
const tableSelectionKey = Symbol('table-selection');

type EmitContext = {
  emit: (event: string, ...args: unknown[]) => void;
};

type SlotContext = Pick<SetupContext, 'slots'>;

type EmitSlotContext = EmitContext & SlotContext;

type ReferenceOption = {
  label: string;
  value: string;
};

type ReferenceOptionSelectProps = {
  modelValue: string;
  options: ReferenceOption[];
  placeholder: string;
};

type AlertProps = {
  title: string;
};

type ButtonProps = {
  loading: boolean;
  type: string;
};

type DialogProps = {
  modelValue: boolean;
  title: string;
};

type FormItemProps = {
  label: string;
};

type InputProps = {
  disabled: boolean;
  modelValue: string;
  placeholder: string;
};

type TableProps = {
  data: Record<string, unknown>[];
  rowClassName?: (context: {
    row: Record<string, unknown>;
    rowIndex: number;
  }) => string;
};

type TableColumnProps = {
  label: string;
  prop: string;
  type: string;
};

type TagProps = {
  type: string;
};

const {
  downloadFileFromBlobMock,
  getApplicationDetailMock,
  listSpecimensMock,
  listOperatingBuildingOptionsMock,
  lookupApplicationRegistrationWorkbenchRecordMock,
  loadWorkflowReferenceOptionsMock,
  completeFixationMock,
  retryLabelPrintMock,
  startFixationMock,
  successMock,
  warningMock,
} = vi.hoisted(() => ({
  downloadFileFromBlobMock: vi.fn(),
  getApplicationDetailMock: vi.fn(async (applicationId: string) => ({
    applicationNo: applicationId === 'APP-001' ? 'M2-001' : 'M2-002',
    id: applicationId,
    patientGender: applicationId === 'APP-001' ? '女' : '男',
    patientId: applicationId === 'APP-001' ? 'PAT-001' : 'PAT-002',
    recentEvents: [],
    specimenRemovalTime:
      applicationId === 'APP-001'
        ? '2026-05-26 07:40:00'
        : '2026-05-26 08:10:00',
    specimens: [],
  })),
  listSpecimensMock: vi.fn(
    async ({
      applicationNo,
      keyword,
    }: {
      applicationNo?: string;
      keyword?: string;
    }): Promise<SpecimenManagementListPage> => {
      const rows = [
        {
          abnormalFlag: false,
          applicationId: 'APP-001',
          applicationNo: 'M2-001',
          barcode: 'BC-001',
          fixationCompletedAt: null,
          fixationStartedAt: null,
          fixationStatus: 'PENDING',
          labelPrintBatchNo: 'LB-001',
          labelPrintStatus: 'FAILED',
          latestTrackingAt: '2026-05-26 08:40:00',
          patientName: 'Alice',
          registeredAt: '2026-05-26 08:00:00',
          specimenId: 'SPEC-001',
          specimenName: '乳腺组织',
          specimenNo: 'SP-001',
          specimenStatus: 'REGISTERED',
          specimenType: '常规',
          verificationStatus: 'VERIFIED',
        },
        {
          abnormalFlag: false,
          applicationId: 'APP-002',
          applicationNo: 'M2-002',
          barcode: 'BC-002',
          fixationCompletedAt: null,
          fixationStartedAt: null,
          fixationStatus: 'PENDING',
          labelPrintBatchNo: 'LB-002',
          labelPrintStatus: 'SUCCESS',
          latestTrackingAt: '2026-05-26 09:20:00',
          patientName: 'Bob',
          registeredAt: '2026-05-26 08:20:00',
          specimenId: 'SPEC-002',
          specimenName: '肺组织',
          specimenNo: 'SP-002',
          specimenStatus: 'REGISTERED',
          specimenType: '冰冻',
          verificationStatus: 'VERIFIED',
        },
        {
          abnormalFlag: false,
          applicationId: 'APP-002',
          applicationNo: 'M2-002',
          barcode: 'BC-003',
          fixationCompletedAt: null,
          fixationStartedAt: null,
          fixationStatus: 'PENDING',
          labelPrintBatchNo: 'LB-002',
          labelPrintStatus: 'SUCCESS',
          latestTrackingAt: '2026-05-26 09:25:00',
          patientName: 'Bob',
          registeredAt: '2026-05-26 08:25:00',
          specimenId: 'SPEC-003',
          specimenName: '纵隔淋巴结',
          specimenNo: 'SP-003',
          specimenStatus: 'REGISTERED',
          specimenType: '常规',
          verificationStatus: 'VERIFIED',
        },
      ] as SpecimenManagementListItem[];
      const matchedRows = applicationNo
        ? rows.filter((item) => item.applicationNo === applicationNo)
        : rows.filter(
            (item) => item.specimenNo === keyword || item.barcode === keyword,
          );
      return {
        items: matchedRows,
        page: 1,
        size: 100,
        summary: {
          abnormalCount: 0,
          labelPrintedCount: 0,
          pendingLabelCount: 0,
          totalCount: matchedRows.length,
          unboundCount: 0,
        },
        total: matchedRows.length,
      };
    },
  ),
  listOperatingBuildingOptionsMock: vi.fn(async () => []),
  completeFixationMock: vi.fn(
    async (payload: {
      fixationLiquidType: string;
      specimenBarcode: string;
    }) => ({
      barcode: payload.specimenBarcode,
      fixationCompletedAt: '2026-05-26 10:00:00',
      fixationLiquidType: payload.fixationLiquidType,
      fixationStatus: 'COMPLETED',
      operatorName: 'Test User',
      operatorUserId: 'USER-001',
      specimenId: 'SPEC-002',
    }),
  ),
  startFixationMock: vi.fn(
    async (payload: {
      fixationLiquidType?: null | string;
      specimenBarcode: string;
    }) => ({
      barcode: payload.specimenBarcode,
      fixationCompletedAt: null,
      fixationLiquidType: payload.fixationLiquidType,
      fixationStatus: 'FIXING',
      operatorName: 'Test User',
      operatorUserId: 'USER-001',
      specimenId: 'SPEC-002',
    }),
  ),
  loadWorkflowReferenceOptionsMock: vi.fn(async () => ({
    clinicalSymptoms: [],
    collectionModes: [],
    containerNames: [],
    cutSurfaceFeatures: [],
    fixationLiquidTypes: [
      { label: '10% 中性福尔马林', value: 'FORMALIN' },
      { label: '酒精', value: 'ETHANOL' },
    ],
    marginMarkings: [],
    specimenImageSizes: [],
    specimenTypes: [],
  })),
  lookupApplicationRegistrationWorkbenchRecordMock: vi.fn(
    async ({ keyword }: { keyword: string }) => ({
      applicationId: keyword === 'M2-001' ? 'APP-001' : 'APP-002',
      contagiousSpecimen: {
        hepatitis: false,
        hiv: false,
        isolation: false,
        syphilis: false,
        tuberculosis: false,
      },
      gynecologyInfo: {
        additionalNotes: '',
        hpvResult: null,
        lastMenstrualPeriod: null,
        menopause: false,
        previousCytology: '',
        previousTreatment: '',
        specialConditions: {
          abnormalBleeding: false,
          birthControl: false,
          hormoneReplacement: false,
          hysterectomy: false,
          iud: false,
          lactation: false,
          menopause: false,
          other: '',
          pregnancy: false,
          radiotherapy: false,
        },
      },
      patientInfo: {
        age: '42',
        applicationDate: '2026-05-26',
        applicationNo: keyword,
        applyDept: '外科',
        applyDoctor: '张医生',
        bedNo: null,
        checkItem: null,
        clinicalDiagnosis: null,
        clinicalHistory: null,
        deliveryRequirement: null,
        endoscopyDiagnosis: null,
        frozenReminder: false,
        gender: keyword === 'M2-001' ? '女' : '男',
        idNo: null,
        imagingResult: null,
        inpatientNo: keyword === 'M2-001' ? 'ZY-001' : 'ZY-002',
        patientName: keyword === 'M2-001' ? 'Alice' : 'Bob',
        patientVerified: true,
        phone: null,
        registrationStatus: null,
        remark: null,
        specimenType: null,
        wardName: null,
      },
      specimenItems: [],
      surgeryInfo: {
        buildingId: null,
        clinicalFindings: null,
        fixativeType: null,
        fixationPerson: keyword === 'M2-001' ? '王护士' : '',
        fixationTime: null,
        roomId: keyword === 'M2-001' ? '手术室1' : '手术室2',
        surgeryName: keyword === 'M2-001' ? '乳腺切除术' : '肺叶切除术',
      },
    }),
  ),
  retryLabelPrintMock: vi.fn(async () => ({
    allSuccessful: true,
    failedCount: 0,
    labelPrintBatchNo: 'LB-001',
    message: 'ok',
    retriedCount: 1,
    successCount: 1,
  })),
  successMock: vi.fn(),
  warningMock: vi.fn(),
}));

vi.mock('@vben/stores', () => ({
  useUserStore: () => ({
    userInfo: {
      realName: 'Test User',
      userId: 'USER-001',
    },
  }),
}));

vi.mock('@vben/utils', () => ({
  downloadFileFromBlob: downloadFileFromBlobMock,
}));

vi.mock('../api/application-registration-workbench-service', () => ({
  listOperatingBuildingOptions: listOperatingBuildingOptionsMock,
  lookupApplicationRegistrationWorkbenchRecord:
    lookupApplicationRegistrationWorkbenchRecordMock,
}));

vi.mock('../api/specimen-workflow-service', () => ({
  getApplicationDetail: getApplicationDetailMock,
  completeFixation: completeFixationMock,
  listSpecimens: listSpecimensMock,
  retryLabelPrint: retryLabelPrintMock,
  startFixation: startFixationMock,
}));

vi.mock('#/modules/system-management/api/workflow-reference-service', () => ({
  createEmptyWorkflowReferenceOptions: () => ({
    clinicalSymptoms: [],
    collectionModes: [],
    containerNames: [],
    cutSurfaceFeatures: [],
    fixationLiquidTypes: [],
    marginMarkings: [],
    specimenImageSizes: [],
    specimenTypes: [],
  }),
  loadWorkflowReferenceOptionsSafely: loadWorkflowReferenceOptionsMock,
}));

vi.mock(
  '#/modules/system-management/components/ReferenceOptionSelect.vue',
  () => ({
    default: {
      props: {
        modelValue: { default: '', type: String },
        options: { default: () => [], type: Array },
        placeholder: { default: '', type: String },
      },
      emits: ['update:modelValue'],
      setup(props: ReferenceOptionSelectProps, { emit }: EmitContext) {
        return () =>
          h(
            'select',
            {
              'data-testid': 'reference-option-select',
              value: props.modelValue,
              onChange: (event: Event) =>
                emit(
                  'update:modelValue',
                  (event.target as HTMLSelectElement).value,
                ),
            },
            [
              h('option', { value: '' }, props.placeholder),
              ...(props.options as Array<{ label: string; value: string }>).map(
                (option) => h('option', { value: option.value }, option.label),
              ),
            ],
          );
      },
    },
  }),
);

vi.mock('element-plus', () => ({
  ElAlert: {
    props: {
      title: { default: '', type: String },
    },
    setup(props: AlertProps) {
      return () => h('div', { 'data-testid': 'alert' }, props.title);
    },
  },
  ElButton: {
    props: {
      loading: { default: false, type: Boolean },
      type: { default: '', type: String },
    },
    emits: ['click'],
    setup(props: ButtonProps, { emit, slots }: EmitSlotContext) {
      return () =>
        h(
          'button',
          {
            'data-loading': props.loading ? 'true' : 'false',
            'data-type': props.type,
            onClick: () => emit('click'),
            type: 'button',
          },
          slots.default?.(),
        );
    },
  },
  ElDialog: {
    props: {
      modelValue: { default: false, type: Boolean },
      title: { default: '', type: String },
    },
    emits: ['update:modelValue'],
    setup(props: DialogProps, { slots }: SlotContext) {
      return () =>
        props.modelValue
          ? h('div', { 'data-testid': 'dialog' }, [
              h('div', props.title),
              slots.default?.(),
              slots.footer?.(),
            ])
          : null;
    },
  },
  ElForm: {
    setup(_: Record<string, never>, { slots }: SlotContext) {
      return () => h('form', slots.default?.());
    },
  },
  ElFormItem: {
    props: {
      label: { default: '', type: String },
    },
    setup(props: FormItemProps, { slots }: SlotContext) {
      return () => h('label', [props.label, slots.default?.()]);
    },
  },
  ElInput: {
    props: {
      disabled: { default: false, type: Boolean },
      modelValue: { default: '', type: String },
      placeholder: { default: '', type: String },
    },
    emits: ['keyup', 'update:modelValue'],
    setup(props: InputProps, { emit }: EmitContext) {
      const attrs = useAttrs();
      return () =>
        h('input', {
          ...attrs,
          disabled: props.disabled,
          placeholder: props.placeholder,
          value: props.modelValue,
          onInput: (event: Event) =>
            emit('update:modelValue', (event.target as HTMLInputElement).value),
          onKeyup: (event: KeyboardEvent) => emit('keyup', event),
        });
    },
  },
  ElMessage: {
    success: successMock,
    warning: warningMock,
  },
  ElTable: {
    props: {
      data: { default: () => [], type: Array },
      rowClassName: { default: undefined, type: Function },
    },
    emits: ['selection-change'],
    setup(props: TableProps, { emit, slots }: EmitSlotContext) {
      const selectedIndexes = ref<number[]>([]);
      provide(
        tableDataKey,
        computed(() => props.data as Record<string, unknown>[]),
      );
      provide(tableSelectionKey, {
        emitSelection: () => {
          const rows = selectedIndexes.value
            .map((index) => (props.data as Record<string, unknown>[])[index])
            .filter(Boolean);
          emit('selection-change', rows);
        },
        selectedIndexes,
      });
      return () =>
        h('div', { 'data-testid': 'table' }, [
          ...(props.data as Record<string, unknown>[]).map((row, rowIndex) =>
            h('div', {
              class: props.rowClassName?.({ row, rowIndex }) ?? '',
              'data-testid': 'table-row',
            }),
          ),
          slots.default?.(),
        ]);
    },
  },
  ElTableColumn: {
    props: {
      label: { default: '', type: String },
      prop: { default: '', type: String },
      type: { default: '', type: String },
    },
    setup(props: TableColumnProps, { slots }: SlotContext) {
      const data = inject<ComputedRef<Record<string, unknown>[]>>(tableDataKey);
      const selectionController = inject<{
        emitSelection: () => void;
        selectedIndexes: Ref<number[]>;
      }>(tableSelectionKey);

      return () =>
        h('div', { 'data-column-label': props.label || props.type }, [
          props.label || props.type,
          ...(data?.value ?? []).map((row, index) => {
            if (props.type === 'selection') {
              return h('input', {
                checked:
                  selectionController?.selectedIndexes.value.includes(index) ??
                  false,
                'data-selection-index': String(index),
                onClick: (event: Event) => {
                  const checked = (event.target as HTMLInputElement).checked;
                  const current =
                    selectionController?.selectedIndexes.value ?? [];
                  selectionController!.selectedIndexes.value = checked
                    ? [...current, index]
                    : current.filter((item) => item !== index);
                  selectionController?.emitSelection();
                },
                type: 'checkbox',
              });
            }

            return h(
              'div',
              {
                'data-column-cell': `${props.label}-${index}`,
              },
              slots.default?.({ $index: index, row }) ??
                (props.prop ? String(row[props.prop] ?? '') : ''),
            );
          }),
        ]);
    },
  },
  ElTag: {
    props: {
      type: { default: '', type: String },
    },
    setup(props: TagProps, { slots }: SlotContext) {
      return () =>
        h('span', { 'data-tag-type': props.type }, slots.default?.());
    },
  },
}));

function mountView() {
  const container = document.createElement('div');
  document.body.append(container);
  const app = createApp(SpecimenFixationTimePanel);

  app.directive('loading', {});
  app.mount(container);

  return { app, container };
}

async function flushView() {
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

async function querySpecimen(container: HTMLElement, value: string) {
  const input = container.querySelector(
    'input[placeholder="请输入标本号或条码"]',
  ) as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await flushView();
  await clickActionButton(container, '查询');
  await flushView();
  await flushView();
  await flushView();
}

async function selectRow(container: HTMLElement, index: number) {
  const checkbox = container.querySelector(
    `input[data-selection-index="${index}"]`,
  ) as HTMLInputElement | null;
  if (!checkbox) {
    return;
  }
  checkbox.checked = true;
  checkbox.dispatchEvent(new Event('click', { bubbles: true }));
  await flushView();
}

async function clickActionButton(container: HTMLElement, text: string) {
  const button = [...container.querySelectorAll('button')].find((item) =>
    item.textContent?.includes(text),
  );
  button?.click();
  await flushView();
}

describe('SpecimenFixationTimePanel', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('starts fixation by specimenNo and renders the application rows without completing fixation', async () => {
    const { app, container } = mountView();

    await flushView();
    const fixationLiquidSelect = container.querySelector(
      'select[data-testid="reference-option-select"]',
    ) as HTMLSelectElement | null;
    expect(fixationLiquidSelect?.value).toBe('FORMALIN');

    await querySpecimen(container, 'SP-002');

    expect(container.textContent).toContain('固定时间');
    expect(container.textContent).toContain('固定人');
    expect(container.textContent).toContain('固定液类型');
    expect(container.textContent).toContain('病人ID');
    expect(container.textContent).toContain('肺组织');
    expect(container.textContent).toContain('固定中');
    expect(container.textContent).toContain('PAT-002');
    expect(container.textContent).toContain('纵隔淋巴结');
    expect(
      container.querySelector('.specimen-workflow-row--in-progress'),
    ).not.toBeNull();
    expect(
      container.querySelector('.specimen-workflow-row--actionable'),
    ).not.toBeNull();
    expect(startFixationMock).toHaveBeenCalledWith({
      fixationLiquidType: 'FORMALIN',
      remarks: '扫码开始固定',
      specimenBarcode: 'BC-002',
    });
    expect(completeFixationMock).not.toHaveBeenCalled();

    app.unmount();
  });

  it('appends query results and avoids duplicate rows by specimen id', async () => {
    const { app, container } = mountView();

    await querySpecimen(container, 'SP-002');
    expect(container.textContent).toContain('肺组织');
    expect(container.textContent).toContain('纵隔淋巴结');

    await querySpecimen(container, 'SP-001');

    expect(container.textContent).toContain('乳腺组织');
    expect(container.textContent).toContain('肺组织');
    expect(container.textContent).toContain('纵隔淋巴结');

    await querySpecimen(container, 'SP-002');

    const tableText = container.textContent ?? '';
    expect(tableText.match(/肺组织/g)).toHaveLength(1);
    expect(tableText.match(/纵隔淋巴结/g)).toHaveLength(1);
    expect(startFixationMock).toHaveBeenCalledTimes(2);

    app.unmount();
  });

  it('renders completed fixation rows with completed tone', async () => {
    listSpecimensMock.mockResolvedValueOnce({
      items: [
        {
          abnormalFlag: false,
          applicationId: 'APP-004',
          applicationNo: 'M2-004',
          barcode: 'BC-004',
          containerCount: 1,
          containerName: '福尔马林瓶',
          fixationCompletedAt: '2026-05-26 10:00:00',
          fixationStartedAt: '2026-05-26 09:30:00',
          fixationStatus: 'COMPLETED',
          labelPrintBatchNo: 'LB-004',
          labelPrintStatus: 'SUCCESS',
          latestTrackingAt: '2026-05-26 10:00:00',
          patientName: 'Dave',
          registeredAt: '2026-05-26 08:30:00',
          specimenId: 'SPEC-004',
          specimenCount: 1,
          specimenName: '肝组织',
          specimenNo: 'SP-004',
          specimenSite: '肝脏',
          specimenStatus: 'FIXED',
          specimenType: '常规',
          submittingDepartmentId: 'DEP-004',
          submittingDepartmentName: '外科',
          verificationStatus: 'VERIFIED',
        },
      ],
      page: 1,
      size: 100,
      summary: {
        abnormalCount: 0,
        labelPrintedCount: 0,
        pendingLabelCount: 0,
        totalCount: 1,
        unboundCount: 0,
      },
      total: 1,
    });
    const { app, container } = mountView();

    await querySpecimen(container, 'SP-004');

    expect(container.textContent).toContain('肝组织');
    expect(container.textContent).toContain('已固定');
    expect(startFixationMock).not.toHaveBeenCalled();
    expect(
      container.querySelector('.specimen-workflow-row--completed'),
    ).not.toBeNull();

    app.unmount();
  });

  it('explains when a matched specimen is not verified yet', async () => {
    listSpecimensMock.mockResolvedValueOnce({
      items: [
        {
          abnormalFlag: false,
          applicationId: 'APP-003',
          applicationNo: 'M2-003',
          barcode: 'BC-003',
          containerCount: 1,
          containerName: '福尔马林瓶',
          fixationCompletedAt: null,
          fixationStartedAt: null,
          fixationStatus: 'PENDING',
          labelPrintBatchNo: 'LB-003',
          labelPrintStatus: 'SUCCESS',
          latestTrackingAt: '2026-05-26 09:30:00',
          patientName: 'Carol',
          registeredAt: '2026-05-26 08:30:00',
          specimenId: 'SPEC-003',
          specimenCount: 1,
          specimenName: '胃组织',
          specimenNo: 'SP-003',
          specimenSite: '胃部',
          specimenStatus: 'REGISTERED',
          specimenType: '常规',
          submittingDepartmentId: 'DEP-003',
          submittingDepartmentName: '外科',
          verificationStatus: 'UNVERIFIED',
        },
      ],
      page: 1,
      size: 100,
      summary: {
        abnormalCount: 0,
        labelPrintedCount: 0,
        pendingLabelCount: 0,
        totalCount: 1,
        unboundCount: 0,
      },
      total: 1,
    });
    const { app, container } = mountView();

    await querySpecimen(container, 'SP-003');

    expect(warningMock).toHaveBeenCalledWith(
      '标本尚未完成离体确认，请先完成离体确认后再固定',
    );
    expect(startFixationMock).not.toHaveBeenCalled();
    expect(container.textContent).toContain('胃组织');
    expect(container.textContent).toContain('待固定');
    expect(
      container.querySelector('.specimen-workflow-row--blocked'),
    ).not.toBeNull();

    app.unmount();
  });

  it('clears selected rows and then clears the full list', async () => {
    const { app, container } = mountView();

    await querySpecimen(container, 'SP-002');

    await selectRow(container, 1);

    const clearSelectedButton = [...container.querySelectorAll('button')].find(
      (button) => button.textContent?.includes('清除选择行'),
    );
    clearSelectedButton?.click();
    await flushView();

    expect(container.textContent).not.toContain('纵隔淋巴结');
    expect(container.textContent).toContain('肺组织');
    expect(successMock).toHaveBeenCalledWith('已清除选择行');

    const clearListButton = [...container.querySelectorAll('button')].find(
      (button) => button.textContent?.includes('清除列表'),
    );
    clearListButton?.click();
    await flushView();

    expect(container.textContent).not.toContain('肺组织');
    expect(successMock).toHaveBeenCalledWith('列表已清空');

    app.unmount();
  });

  it('submits retry label for queue rows', async () => {
    const { app, container } = mountView();

    await querySpecimen(container, 'SP-001');

    const retryButton = [...container.querySelectorAll('button')].find(
      (button) => button.textContent?.includes('补打标本标签'),
    );
    retryButton?.click();
    await flushView();

    const printerInput = document.body.querySelector(
      'input[placeholder="请输入打印机编号"]',
    ) as HTMLInputElement | null;
    printerInput!.value = 'P-01';
    printerInput!.dispatchEvent(new Event('input', { bubbles: true }));

    const submitButton = [...document.body.querySelectorAll('button')].find(
      (button) => button.textContent?.includes('提交补打'),
    );
    submitButton?.click();
    await flushView();

    expect(retryLabelPrintMock).toHaveBeenCalledWith('LB-001', {
      printerCode: 'P-01',
      remarks: null,
      terminalCode: null,
    });

    app.unmount();
  });

  it('exports queue rows as excel', async () => {
    const { app, container } = mountView();

    await querySpecimen(container, 'SP-001');

    const exportButton = [...container.querySelectorAll('button')].find(
      (button) => button.textContent?.includes('导出Excel'),
    );
    exportButton?.click();
    await flushView();

    expect(downloadFileFromBlobMock).toHaveBeenCalled();
    expect(successMock).toHaveBeenCalledWith('导出成功');

    app.unmount();
  });

  it('confirms fixation only for selected rows', async () => {
    const { app, container } = mountView();

    await querySpecimen(container, 'SP-002');

    await selectRow(container, 0);

    await clickActionButton(container, '确认固定');

    expect(completeFixationMock).toHaveBeenCalledTimes(1);
    expect(completeFixationMock).toHaveBeenCalledWith({
      fixationLiquidType: 'FORMALIN',
      remarks: '手动确认固定',
      specimenBarcode: 'BC-002',
    });
    expect(container.textContent).toContain('Test User');
    expect(successMock).toHaveBeenCalledWith('已完成 1 条标本固定');

    app.unmount();
  });

  it('warns when confirming fixation without a selection', async () => {
    const { app, container } = mountView();

    await querySpecimen(container, 'SP-002');
    await clickActionButton(container, '确认固定');

    expect(completeFixationMock).not.toHaveBeenCalled();
    expect(warningMock).toHaveBeenCalledWith('请先勾选需要固定的标本');

    app.unmount();
  });
});
