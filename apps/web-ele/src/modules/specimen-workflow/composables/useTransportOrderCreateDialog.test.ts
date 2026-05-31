import type { ApplicationDetailView } from '../types/specimen-workflow';

import { createApp, defineComponent, h, nextTick, ref } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

const createTransportOrderMock = vi.hoisted(() => vi.fn());
const getApplicationDetailMock = vi.hoisted(() => vi.fn());
const successMock = vi.hoisted(() => vi.fn());
const warningMock = vi.hoisted(() => vi.fn());

vi.mock('@vben/stores', () => ({
  useUserStore: () => ({
    userInfo: {
      realName: 'Test User',
      userId: 'USER-001',
    },
  }),
}));

vi.mock('element-plus', () => ({
  ElMessage: {
    success: successMock,
    warning: warningMock,
  },
}));

vi.mock('../api/specimen-workflow-service', () => ({
  createTransportOrder: createTransportOrderMock,
  getApplicationDetail: getApplicationDetailMock,
}));

import { useTransportOrderCreateDialog } from './useTransportOrderCreateDialog';

function createApplicationDetail(): ApplicationDetailView {
  const specimenOne = {
    barcode: 'BC-001',
    checkInStatus: 'CHECKED_IN',
    clinicalSymptom: '',
    collectionMode: '手术',
    fixationStatus: 'COMPLETED',
    id: 'SPEC-001',
    specimenConfirmedAt: '2026-05-21T09:40:00',
    specimenName: '胃组织',
    specimenSite: '',
    specimenType: '组织',
    verificationStatus: 'VERIFIED',
  } as ApplicationDetailView['specimens'][number];
  const specimenTwo = {
    barcode: 'BC-002',
    checkInStatus: 'NOT_CHECKED_IN',
    clinicalSymptom: '',
    collectionMode: '手术',
    fixationStatus: 'COMPLETED',
    id: 'SPEC-002',
    specimenConfirmedAt: '2026-05-21T09:40:00',
    specimenName: '无效标本',
    specimenSite: '',
    specimenType: '组织',
    verificationStatus: 'VERIFIED',
  } as ApplicationDetailView['specimens'][number];

  return {
    abnormalFlag: false,
    applicationDate: '2026-05-21',
    applicationFormStatus: 'PENDING',
    applicationNo: 'M2-20260526-002',
    applicationType: 'ROUTINE',
    clinicalDiagnosis: '临床诊断',
    clinicalSymptom: '临床症状',
    createdAt: '2026-05-21T10:00:00',
    currentNode: 'TRANSPORT_HANDOVER',
    deletable: false,
    editable: true,
    externalOrderNo: null,
    id: 'APP-002',
    operationDisabledReason: null,
    patientAge: '40',
    patientGender: 'F',
    patientId: 'PAT-002',
    patientName: 'Alice',
    recentEvents: [],
    remarks: null,
    sourceHospitalId: null,
    sourceHospitalName: '本院',
    specimenRemovalTime: '2026-05-21T09:30:00',
    specimenSite: '胃',
    specimens: [specimenOne, specimenTwo],
    status: 'SUBMITTED',
    submissionDate: '2026-05-21',
    submittingDepartmentId: 'DEP-1',
    submittingDepartmentName: '外科',
    submittingDoctorName: '医生A',
    submittingDoctorUserId: 'DOC-1',
    thirdPartySource: null,
    updatedAt: '2026-05-21T10:00:00',
    voided: false,
  };
}

function createHarness() {
  const initialApplicationId = ref('APP-002');
  const initialApplicationNo = ref('M2-20260526-002');
  const modelValue = ref(true);
  const onCreated = vi.fn();
  const updateModelValue = vi.fn((value: boolean) => {
    modelValue.value = value;
  });
  let state: null | ReturnType<typeof useTransportOrderCreateDialog> = null;

  const Harness = defineComponent({
    setup() {
      state = useTransportOrderCreateDialog({
        initialApplicationId,
        initialApplicationNo,
        modelValue,
        onCreated,
        updateModelValue,
      });

      return () => h('div');
    },
  });

  return {
    Harness,
    getState: () => state,
    modelValue,
    onCreated,
    updateModelValue,
  };
}

function mountComposable() {
  const harness = createHarness();
  const root = document.createElement('div');
  document.body.append(root);

  const app = createApp(harness.Harness);
  app.mount(root);

  return {
    ...harness,
    destroy() {
      app.unmount();
      root.remove();
    },
  };
}

async function flushComposable() {
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

describe('useTransportOrderCreateDialog', () => {
  afterEach(() => {
    createTransportOrderMock.mockReset();
    getApplicationDetailMock.mockReset();
    successMock.mockReset();
    warningMock.mockReset();
    document.body.innerHTML = '';
  });

  it('loads eligible specimens on open and merges selected/manual barcodes', async () => {
    getApplicationDetailMock.mockResolvedValue(createApplicationDetail());

    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    expect(getApplicationDetailMock).toHaveBeenCalledWith('APP-002');
    expect(state.visibleApplicationNo.value).toBe('M2-20260526-002');
    expect(state.eligibleSpecimens.value).toHaveLength(1);
    expect(state.createForm.selectedSpecimenBarcodes).toEqual(['BC-001']);

    state.createForm.specimenBarcodesText = 'BC-001, BC-003\nBC-004';
    expect(state.mergedSpecimenBarcodes.value).toEqual([
      'BC-001',
      'BC-003',
      'BC-004',
    ]);

    wrapper.destroy();
  });

  it('validates required fields and submits transport order successfully', async () => {
    getApplicationDetailMock.mockResolvedValue(createApplicationDetail());
    createTransportOrderMock.mockResolvedValue({
      id: 'TO-001',
    });

    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    state.createForm.handoverDepartmentId = 'DEP-HO';
    state.createForm.handoverDepartmentName = '交接科室';
    state.createForm.receiverDepartmentId = 'DEP-RE';
    state.createForm.receiverDepartmentName = '接收科室';
    state.createForm.terminalCode = 'TERM-01';
    state.createForm.remarks = '备注';

    await state.submitCreate();

    expect(createTransportOrderMock).toHaveBeenCalledWith(
      expect.objectContaining({
        applicationId: 'APP-002',
        handoverDepartmentId: 'DEP-HO',
        handoverUserId: 'USER-001',
        receiverDepartmentId: 'DEP-RE',
        specimenBarcodes: ['BC-001'],
        terminalCode: 'TERM-01',
      }),
    );
    expect(successMock).toHaveBeenCalledWith('转运单创建成功');
    expect(wrapper.onCreated).toHaveBeenCalledTimes(1);
    expect(wrapper.updateModelValue).toHaveBeenCalledWith(false);

    wrapper.destroy();
  });

  it('warns when application id or specimen selection is missing', async () => {
    getApplicationDetailMock.mockResolvedValue(createApplicationDetail());

    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    state.createForm.applicationId = '';
    await state.submitCreate();
    expect(warningMock).toHaveBeenCalledWith('请填写申请单编号');

    state.createForm.applicationId = 'APP-002';
    state.createForm.handoverDepartmentId = 'DEP-HO';
    state.createForm.handoverDepartmentName = '交接科室';
    state.createForm.receiverDepartmentId = 'DEP-RE';
    state.createForm.receiverDepartmentName = '接收科室';
    state.createForm.selectedSpecimenBarcodes = [];
    state.createForm.specimenBarcodesText = '';
    await state.submitCreate();
    expect(warningMock).toHaveBeenCalledWith('请至少选择一条标本');

    wrapper.destroy();
  });
});
