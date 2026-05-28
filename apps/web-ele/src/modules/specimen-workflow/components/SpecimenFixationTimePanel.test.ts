import { computed, createApp, defineComponent, h, inject, nextTick, provide, ref, useAttrs, type ComputedRef, type Ref } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import SpecimenFixationTimePanel from './SpecimenFixationTimePanel.vue';

const tableDataKey = Symbol('table-data');
const tableSelectionKey = Symbol('table-selection');

const {
  downloadFileFromBlobMock,
  getApplicationDetailMock,
  listSpecimensMock,
  lookupApplicationRegistrationWorkbenchRecordMock,
  retryLabelPrintMock,
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
    specimenRemovalTime: applicationId === 'APP-001' ? '2026-05-26 07:40:00' : '2026-05-26 08:10:00',
    specimens: [],
  })),
  listSpecimensMock: vi.fn(async ({ keyword }: { keyword?: string }) => {
    const rows = [
      {
        abnormalFlag: false,
        applicationId: 'APP-001',
        applicationNo: 'M2-001',
        barcode: 'BC-001',
        fixationCompletedAt: '2026-05-26 09:00:00',
        fixationStartedAt: '2026-05-26 08:30:00',
        fixationStatus: 'COMPLETED',
        labelPrintBatchNo: 'LB-001',
        labelPrintStatus: 'FAILED',
        latestTrackingAt: '2026-05-26 09:00:00',
        patientName: 'Alice',
        registeredAt: '2026-05-26 08:00:00',
        specimenId: 'SPEC-001',
        specimenName: '乳腺组织',
        specimenNo: 'SP-001',
        specimenStatus: 'FIXED',
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
    ];
    return {
      items: rows.filter((item) =>
        [item.specimenId, item.specimenNo, item.barcode].includes(keyword ?? ''),
      ),
      page: 1,
      size: 100,
      summary: {
        abnormalCount: 0,
        labelPrintedCount: 0,
        pendingLabelCount: 0,
        totalCount: 0,
      },
      total: 1,
    };
  }),
  lookupApplicationRegistrationWorkbenchRecordMock: vi.fn(async ({ keyword }: { keyword: string }) => ({
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
  })),
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
  lookupApplicationRegistrationWorkbenchRecord:
    lookupApplicationRegistrationWorkbenchRecordMock,
}));

vi.mock('../api/specimen-workflow-service', () => ({
  getApplicationDetail: getApplicationDetailMock,
  listSpecimens: listSpecimensMock,
  retryLabelPrint: retryLabelPrintMock,
}));

vi.mock('element-plus', () => ({
  ElAlert: defineComponent({
    props: {
      title: { default: '', type: String },
    },
    setup(props) {
      return () => h('div', { 'data-testid': 'alert' }, props.title);
    },
  }),
  ElButton: defineComponent({
    props: {
      loading: { default: false, type: Boolean },
      type: { default: '', type: String },
    },
    emits: ['click'],
    setup(props, { emit, slots }) {
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
  }),
  ElDialog: defineComponent({
    props: {
      modelValue: { default: false, type: Boolean },
      title: { default: '', type: String },
    },
    emits: ['update:modelValue'],
    setup(props, { slots }) {
      return () =>
        props.modelValue
          ? h('div', { 'data-testid': 'dialog' }, [
              h('div', props.title),
              slots.default?.(),
              slots.footer?.(),
            ])
          : null;
    },
  }),
  ElForm: defineComponent({
    setup(_, { slots }) {
      return () => h('form', slots.default?.());
    },
  }),
  ElFormItem: defineComponent({
    props: {
      label: { default: '', type: String },
    },
    setup(props, { slots }) {
      return () => h('label', [props.label, slots.default?.()]);
    },
  }),
  ElInput: defineComponent({
    props: {
      disabled: { default: false, type: Boolean },
      modelValue: { default: '', type: String },
      placeholder: { default: '', type: String },
    },
    emits: ['keyup', 'update:modelValue'],
    setup(props, { emit }) {
      const attrs = useAttrs();
      return () =>
        h('input', {
          ...attrs,
          disabled: props.disabled,
          placeholder: props.placeholder,
          value: props.modelValue,
          onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).value),
          onKeyup: (event: KeyboardEvent) => emit('keyup', event),
        });
    },
  }),
  ElMessage: {
    success: successMock,
    warning: warningMock,
  },
  ElTable: defineComponent({
    props: {
      data: { default: () => [], type: Array },
    },
    emits: ['selection-change'],
    setup(props, { emit, slots }) {
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
      return () => h('div', { 'data-testid': 'table' }, slots.default?.());
    },
  }),
  ElTableColumn: defineComponent({
    props: {
      label: { default: '', type: String },
      prop: { default: '', type: String },
      type: { default: '', type: String },
    },
    setup(props, { slots }) {
      const data = inject<ComputedRef<Record<string, unknown>[]>>(tableDataKey);
      const selectionController = inject<{
        emitSelection: () => void;
        selectedIndexes: Ref<number[]>;
      }>(tableSelectionKey);

      return () =>
        h(
          'div',
          { 'data-column-label': props.label || props.type },
          [
            props.label || props.type,
            ...(data?.value ?? []).map((row, index) => {
              if (props.type === 'selection') {
                return h('input', {
                  checked: selectionController?.selectedIndexes.value.includes(index) ?? false,
                  'data-selection-index': String(index),
                  onClick: (event: Event) => {
                    const checked = (event.target as HTMLInputElement).checked;
                    const current = selectionController?.selectedIndexes.value ?? [];
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
          ],
        );
    },
  }),
  ElTag: defineComponent({
    props: {
      type: { default: '', type: String },
    },
    setup(props, { slots }) {
      return () => h('span', { 'data-tag-type': props.type }, slots.default?.());
    },
  }),
}));

function mountView() {
  const container = document.createElement('div');
  document.body.append(container);
  const app = createApp({
    render: () => h(SpecimenFixationTimePanel),
  });

  app.directive('loading', {});
  app.mount(container);

  return { app, container };
}

async function flushView() {
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

async function addRow(container: HTMLElement, value: string) {
  const input = container.querySelector('input[placeholder="流水号 / 标本ID"]') as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await flushView();
  input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'Enter' }));
  await flushView();
  await flushView();
}

describe('SpecimenFixationTimePanel', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('adds a specimen to the queue and renders figure 2 columns', async () => {
    const { app, container } = mountView();

    await addRow(container, 'SP-001');

    expect(container.textContent).toContain('固定时间');
    expect(container.textContent).toContain('固定人');
    expect(container.textContent).toContain('病人ID');
    expect(container.textContent).toContain('乳腺组织');
    expect(container.textContent).toContain('王护士');
    expect(container.textContent).toContain('PAT-001');
    expect(getApplicationDetailMock).toHaveBeenCalledWith('APP-001');
    expect(lookupApplicationRegistrationWorkbenchRecordMock).toHaveBeenCalled();

    app.unmount();
  });

  it('prevents duplicate queue items', async () => {
    const { app, container } = mountView();

    await addRow(container, 'SP-001');
    await addRow(container, 'SP-001');

    expect(warningMock).toHaveBeenCalledWith('该标本已在当前列表中');

    app.unmount();
  });

  it('clears selected rows and then clears the full list', async () => {
    const { app, container } = mountView();

    await addRow(container, 'SP-001');
    await addRow(container, 'SP-002');

    const selectionCheckbox = container.querySelector(
      'input[data-selection-index="1"]',
    ) as HTMLInputElement | null;
    selectionCheckbox?.click();
    await flushView();

    const clearSelectedButton = [...container.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('清除选择行'),
    );
    clearSelectedButton?.click();
    await flushView();

    expect(container.textContent).not.toContain('乳腺组织');
    expect(successMock).toHaveBeenCalledWith('已清除选择行');

    const clearListButton = [...container.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('清除列表'),
    );
    clearListButton?.click();
    await flushView();

    expect(container.textContent).not.toContain('肺组织');
    expect(successMock).toHaveBeenCalledWith('列表已清空');

    app.unmount();
  });

  it('submits retry label for queue rows', async () => {
    const { app, container } = mountView();

    await addRow(container, 'SP-001');

    const retryButton = [...container.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('补打标本标签'),
    );
    retryButton?.click();
    await flushView();

    const printerInput = document.body.querySelector(
      'input[placeholder="请输入打印机编号"]',
    ) as HTMLInputElement | null;
    printerInput!.value = 'P-01';
    printerInput!.dispatchEvent(new Event('input', { bubbles: true }));

    const submitButton = [...document.body.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('提交补打'),
    );
    submitButton?.click();
    await flushView();

    expect(retryLabelPrintMock).toHaveBeenCalledWith('LB-001', {
      operatorName: 'Test User',
      operatorUserId: 'USER-001',
      printerCode: 'P-01',
      remarks: null,
      terminalCode: null,
    });

    app.unmount();
  });

  it('exports queue rows as excel', async () => {
    const { app, container } = mountView();

    await addRow(container, 'SP-001');

    const exportButton = [...container.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('导出Excel'),
    );
    exportButton?.click();
    await flushView();

    expect(downloadFileFromBlobMock).toHaveBeenCalled();
    expect(successMock).toHaveBeenCalledWith('导出成功');

    app.unmount();
  });
});
