import type { ApplicationRegistrationWorkbenchRecord } from '../types/application-registration-workbench';

import { createApp, defineComponent, h, ref } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

const buildApplicationFormPrintDocumentMock = vi.hoisted(() => vi.fn());
const errorMock = vi.hoisted(() => vi.fn());
const warningMock = vi.hoisted(() => vi.fn());

vi.mock('element-plus', () => ({
  ElMessage: {
    error: errorMock,
    warning: warningMock,
  },
}));

vi.mock('../utils/specimen-print', () => ({
  buildApplicationFormPrintDocument: buildApplicationFormPrintDocumentMock,
}));

import { useApplicationRegistrationPatientPanel } from './useApplicationRegistrationPatientPanel';

function createRecordFixture(): ApplicationRegistrationWorkbenchRecord {
  return {
    applicationId: 'APP-1122',
    contagiousSpecimen: {
      hepatitis: false,
      hiv: false,
      isolation: false,
      syphilis: false,
      tuberculosis: false,
    },
    gynecologyInfo: {
      additionalNotes: '随访观察',
      hpvResult: '阴性',
      lastMenstrualPeriod: '2026-05-01',
      menopause: false,
      previousCytology: '未见异常',
      previousTreatment: '无',
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
      age: '30岁',
      applicationDate: '2026-05-27 10:00:00',
      applicationNo: '1122',
      applyDept: '急诊科',
      applyDoctor: '张宏',
      bedNo: '12床',
      checkItem: '',
      clinicalDiagnosis: '糖尿病肾病并发症',
      clinicalHistory: '临床病历测试',
      deliveryRequirement: '2小时内送达病理科',
      endoscopyDiagnosis: '请结合术中所见补充内镜诊断',
      frozenReminder: false,
      gender: '女',
      idNo: '320101199001011234',
      imagingResult: 'MRI提示右膝关节骨髓水肿',
      inpatientNo: 'ZY0001122',
      patientName: '刘雨晴',
      patientVerified: true,
      phone: '13800001122',
      registrationStatus: '登记',
      remark: '备注信息',
      specimenType: '常规',
      wardName: '惠侨楼 12A',
    },
    specimenItems: [],
    surgeryInfo: {
      buildingId: 'B001',
      clinicalFindings: '术中见胫骨近端骨质破坏',
      fixativeType: '福尔马林',
      fixationPerson: '周永坚',
      fixationTime: '2026-05-27 11:07:02',
      roomId: 'OR-102',
      specimenRemovalTime: '2026-05-27 12:05:00',
      surgeryName: '右侧胫骨病灶清创术',
    },
  };
}

function createHarness() {
  const buildingLabel = ref('惠侨楼');
  const record = ref<ApplicationRegistrationWorkbenchRecord | null>(
    createRecordFixture(),
  );
  const roomLabel = ref('手术室 2');
  const updateRecordMock = vi.fn(
    (nextRecord: ApplicationRegistrationWorkbenchRecord) => {
      record.value = nextRecord;
    },
  );
  let state: null | ReturnType<typeof useApplicationRegistrationPatientPanel> =
    null;

  const Harness = defineComponent({
    setup() {
      state = useApplicationRegistrationPatientPanel({
        buildingLabel,
        record,
        roomLabel,
        updateRecord: updateRecordMock,
      });

      return () => h('div');
    },
  });

  return {
    Harness,
    record,
    updateRecordMock,
    getState: () => state,
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

describe('useApplicationRegistrationPatientPanel', () => {
  afterEach(() => {
    buildApplicationFormPrintDocumentMock.mockReset();
    errorMock.mockReset();
    warningMock.mockReset();
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('normalizes editor values and writes updated record back', async () => {
    const wrapper = mountComposable();
    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    const checkItem = state.summaryItems.value.find(
      (item) => item.key === 'checkItem',
    );
    const contagiousHiv = state.sections.value
      .find((section) => section.key === 'contagious')
      ?.items.find((item) => item.key === 'contagiousHiv');

    if (!checkItem || !contagiousHiv) {
      throw new Error('expected workbench items not found');
    }

    await state.beginEditing(checkItem);
    expect(state.activeEditorKey.value).toBe('checkItem');
    expect(state.editingValue.value).toBe('');

    state.editingValue.value = '更新后的检查项目';
    state.saveEditing(checkItem);
    expect(wrapper.updateRecordMock).toHaveBeenCalledTimes(1);
    expect(wrapper.record.value?.patientInfo.checkItem).toBe(
      '更新后的检查项目',
    );
    expect(state.activeEditorKey.value).toBe('');

    await state.beginEditing(contagiousHiv);
    expect(state.editingValue.value).toBe('false');

    wrapper.destroy();
  });

  it('prints application form and warns when identifier is missing', () => {
    const wrapper = mountComposable();
    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    buildApplicationFormPrintDocumentMock.mockReturnValue('<html>print</html>');
    const documentCloseSpy = vi
      .spyOn(document, 'close')
      .mockImplementation(() => undefined);
    const documentOpenSpy = vi
      .spyOn(document, 'open')
      .mockImplementation(() => window);
    const documentWriteSpy = vi
      .spyOn(document, 'write')
      .mockImplementation(() => undefined);
    vi.spyOn(window, 'open').mockReturnValue(window);

    state.printApplicationForm();

    expect(buildApplicationFormPrintDocumentMock).toHaveBeenCalledTimes(1);
    expect(window.open).toHaveBeenCalledWith(
      '',
      '_blank',
      'width=960,height=760',
    );
    expect(documentOpenSpy).toHaveBeenCalledTimes(1);
    expect(documentWriteSpy).toHaveBeenCalledTimes(1);
    expect(documentCloseSpy).toHaveBeenCalledTimes(1);

    wrapper.record.value = {
      ...createRecordFixture(),
      applicationId: '',
      patientInfo: {
        ...createRecordFixture().patientInfo,
        applicationNo: '',
      },
    };
    state.printApplicationForm();

    expect(warningMock).toHaveBeenCalledWith('缺少补打申请单所需的申请单号');

    wrapper.destroy();
  });
});
