import type { ApplicationRegistrationWorkbenchRecord } from '../types/application-registration-workbench';

import { createApp, h, nextTick } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import ApplicationRegistrationPatientPanel from './ApplicationRegistrationPatientPanel.vue';

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
        other: '随访观察',
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
      checkItem: '手术标本检查与诊断（显微摄影）',
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
      surgeryName: '右侧胫骨病灶清创术',
    },
  };
}

async function flushPromises() {
  await Promise.resolve();
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

async function mountPanel() {
  const root = document.createElement('div');
  document.body.append(root);

  let latestRecord = createRecordFixture();
  const updateRecordMock = vi.fn((value: ApplicationRegistrationWorkbenchRecord) => {
    latestRecord = value;
  });
  const reprintMock = vi.fn();

  const app = createApp({
    data() {
      return {
        buildingLabel: '惠侨楼',
        record: latestRecord,
        roomLabel: '手术室 2',
      };
    },
    methods: {
      handleRecordUpdate(value: ApplicationRegistrationWorkbenchRecord) {
        this.record = value;
        updateRecordMock(value);
      },
    },
    render() {
      return h(ApplicationRegistrationPatientPanel, {
        buildingLabel: this.buildingLabel,
        record: this.record,
        roomLabel: this.roomLabel,
        onReprintApplicationForm: reprintMock,
        'onUpdate:record': this.handleRecordUpdate,
      });
    },
  });

  app.mount(root);
  await flushPromises();

  return {
    getLatestRecord() {
      return latestRecord;
    },
    root,
    reprintMock,
    unmount() {
      app.unmount();
      root.remove();
    },
    updateRecordMock,
  };
}

describe('ApplicationRegistrationPatientPanel', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('allows editing a field through the hover edit button', async () => {
    const wrapper = await mountPanel();

    wrapper.root
      .querySelector<HTMLButtonElement>('[data-testid="patient-edit-checkItem"]')!
      .click();
    await flushPromises();

    const input = wrapper.root.querySelector<HTMLInputElement>('input');
    expect(input).not.toBeNull();
    input!.value = '更新后的检查项目';
    input!.dispatchEvent(new Event('input'));
    await flushPromises();

    wrapper.root
      .querySelector<HTMLButtonElement>('[data-testid="patient-save-checkItem"]')!
      .click();
    await flushPromises();

    expect(wrapper.updateRecordMock).toHaveBeenCalledTimes(1);
    expect(wrapper.getLatestRecord().patientInfo.checkItem).toBe('更新后的检查项目');
    expect(
      wrapper.root.querySelector('[data-testid="patient-value-checkItem"]')?.textContent,
    ).toContain('更新后的检查项目');

    wrapper.unmount();
  });

  it('allows editing a field through double click', async () => {
    const wrapper = await mountPanel();

    wrapper.root
      .querySelector<HTMLElement>('[data-testid="patient-value-clinicalHistory"]')!
      .dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    await flushPromises();

    const textarea = wrapper.root.querySelector<HTMLTextAreaElement>('textarea');
    expect(textarea).not.toBeNull();
    textarea!.value = '双击修改后的病史';
    textarea!.dispatchEvent(new Event('input'));
    await flushPromises();

    wrapper.root
      .querySelector<HTMLButtonElement>('[data-testid="patient-save-clinicalHistory"]')!
      .click();
    await flushPromises();

    expect(wrapper.updateRecordMock).toHaveBeenCalledTimes(1);
    expect(wrapper.getLatestRecord().patientInfo.clinicalHistory).toBe(
      '双击修改后的病史',
    );
    expect(
      wrapper.root.querySelector('[data-testid="patient-value-clinicalHistory"]')
        ?.textContent,
    ).toContain('双击修改后的病史');

    wrapper.unmount();
  });

  it('shows reprint button and emits current application id', async () => {
    const wrapper = await mountPanel();

    wrapper.root
      .querySelectorAll<HTMLButtonElement>('button')
      .forEach((button) => {
        if (button.textContent?.includes('补打申请单')) {
          button.click();
        }
      });

    expect(wrapper.reprintMock).toHaveBeenCalledWith('APP-1122');

    wrapper.unmount();
  });
});
