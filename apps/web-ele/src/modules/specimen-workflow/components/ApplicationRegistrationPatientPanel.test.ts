import type { ApplicationRegistrationWorkbenchRecord } from '../types/application-registration-workbench';

import { createApp, h, nextTick } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createButtonStub,
  createDescriptionsItemStub,
  createEmptyStub,
  createInputStub,
  createOptionStub,
  createPassthroughStub,
  createSelectStub,
} from '../test-utils/component-stubs';

const warningMock = vi.hoisted(() => vi.fn());
const errorMock = vi.hoisted(() => vi.fn());

vi.mock('element-plus/theme-chalk/base.css', () => ({}));

vi.mock('@vben/icons', async () => {
  const { h } = await import('vue');

  const createIcon = (name: string) =>
    (() => h('span', { 'aria-hidden': 'true', 'data-icon': name })) as unknown;

  return {
    Check: createIcon('Check'),
    UserRoundPen: createIcon('UserRoundPen'),
    X: createIcon('X'),
  };
});

vi.mock('element-plus', () => {
  return {
    ElButton: createButtonStub(),
    ElDescriptions: createPassthroughStub('div'),
    ElDescriptionsItem: createDescriptionsItemStub(),
    ElDivider: createPassthroughStub('div'),
    ElEmpty: createEmptyStub(),
    ElInput: createInputStub(),
    ElMessage: {
      error: errorMock,
      warning: warningMock,
    },
    ElOption: createOptionStub(),
    ElSelect: createSelectStub(),
  };
});

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
      specimenRemovalTime: '2026-05-27 12:05:00',
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

async function mountPanel(
  props: Record<string, unknown> = {},
  initialRecord: ApplicationRegistrationWorkbenchRecord = createRecordFixture(),
) {
  const root = document.createElement('div');
  document.body.append(root);

  let latestRecord = initialRecord;
  const updateRecordMock = vi.fn(
    (value: ApplicationRegistrationWorkbenchRecord) => {
      latestRecord = value;
    },
  );
  const reprintMock = vi.fn();
  const savePatientInfoMock = vi.fn();

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
        ...props,
        record: this.record,
        roomLabel: this.roomLabel,
        onReprintApplicationForm: reprintMock,
        onSavePatientInfo: savePatientInfoMock,
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
    savePatientInfoMock,
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
    vi.restoreAllMocks();
  });

  it('allows editing a field through the hover edit button', async () => {
    const wrapper = await mountPanel();

    wrapper.root
      .querySelector<HTMLButtonElement>(
        '[data-testid="patient-edit-checkItem"]',
      )!
      .click();
    await flushPromises();

    const input = wrapper.root.querySelector<HTMLInputElement>('input');
    expect(input).not.toBeNull();
    input!.value = '更新后的检查项目';
    input!.dispatchEvent(new Event('input'));
    await flushPromises();

    wrapper.root
      .querySelector<HTMLButtonElement>(
        '[data-testid="patient-save-checkItem"]',
      )!
      .click();
    await flushPromises();

    expect(wrapper.updateRecordMock).toHaveBeenCalledTimes(1);
    expect(wrapper.getLatestRecord().patientInfo.checkItem).toBe(
      '更新后的检查项目',
    );
    expect(
      wrapper.root.querySelector('[data-testid="patient-value-checkItem"]')
        ?.textContent,
    ).toContain('更新后的检查项目');

    wrapper.unmount();
  });

  it('allows editing a field through double click', async () => {
    const wrapper = await mountPanel();

    wrapper.root
      .querySelector<HTMLElement>(
        '[data-testid="patient-value-clinicalHistory"]',
      )!
      .dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    await flushPromises();

    const textarea =
      wrapper.root.querySelector<HTMLTextAreaElement>('textarea');
    expect(textarea).not.toBeNull();
    textarea!.value = '双击修改后的病史';
    textarea!.dispatchEvent(new Event('input'));
    await flushPromises();

    wrapper.root
      .querySelector<HTMLButtonElement>(
        '[data-testid="patient-save-clinicalHistory"]',
      )!
      .click();
    await flushPromises();

    expect(wrapper.updateRecordMock).toHaveBeenCalledTimes(1);
    expect(wrapper.getLatestRecord().patientInfo.clinicalHistory).toBe(
      '双击修改后的病史',
    );
    expect(
      wrapper.root.querySelector(
        '[data-testid="patient-value-clinicalHistory"]',
      )?.textContent,
    ).toContain('双击修改后的病史');

    wrapper.unmount();
  });

  it('renders the expanded field groups', async () => {
    const wrapper = await mountPanel();

    expect(wrapper.root.textContent).toContain('申请单号');
    expect(wrapper.root.textContent).toContain('患者姓名');
    expect(wrapper.root.textContent).toContain('病区');
    expect(wrapper.root.textContent).toContain('床号');
    expect(wrapper.root.textContent).toContain('申请信息');
    expect(wrapper.root.textContent).toContain('传染性标本');
    expect(wrapper.root.textContent).toContain('手术信息');
    expect(wrapper.root.textContent).toContain('妇科信息');
    expect(wrapper.root.textContent).toContain('特殊情况标注');
    expect(wrapper.root.textContent).toContain('标本离体时间');
    expect(wrapper.root.textContent).toContain('冰冻提醒');
    expect(wrapper.root.textContent).not.toContain('基本信息');
    expect(wrapper.root.textContent).not.toContain('患者已核对');

    wrapper.unmount();
  });

  it('prints application form directly from the reprint button', async () => {
    const printWindowState = { html: '' };
    vi.spyOn(window, 'open').mockImplementation(() => {
      return {
        document: {
          close: vi.fn(),
          open: vi.fn(),
          write: (html: string) => {
            printWindowState.html = html;
          },
        },
      } as any;
    });
    const wrapper = await mountPanel();

    const printButton = [
      ...wrapper.root.querySelectorAll<HTMLButtonElement>('button'),
    ].find((button) => button.textContent?.includes('补打申请单'));
    printButton?.click();

    expect(window.open).toHaveBeenCalledWith(
      '',
      '_blank',
      'width=960,height=760',
    );
    expect(printWindowState.html).toContain('补打申请单');
    expect(printWindowState.html).toContain('申请单号');
    expect(printWindowState.html).toContain('1122');
    expect(wrapper.reprintMock).not.toHaveBeenCalled();

    wrapper.unmount();
  });

  it('renders the patient save button after reprint and respects disabled state', async () => {
    const wrapper = await mountPanel({ saveDisabled: true });

    const buttons = [
      ...wrapper.root.querySelectorAll<HTMLButtonElement>('button'),
    ].filter((button) =>
      ['保存', '补打申请单'].includes(button.textContent?.trim() ?? ''),
    );

    expect(buttons[0]?.textContent?.trim()).toBe('补打申请单');
    expect(buttons[1]?.textContent?.trim()).toBe('保存');
    expect(buttons[1]?.disabled).toBe(true);

    wrapper.unmount();
  });

  it('commits the active editor before emitting patient save', async () => {
    const wrapper = await mountPanel({ saveDisabled: false });

    wrapper.root
      .querySelector<HTMLButtonElement>(
        '[data-testid="patient-edit-clinicalHistory"]',
      )!
      .click();
    await flushPromises();

    const textarea =
      wrapper.root.querySelector<HTMLTextAreaElement>('textarea');
    textarea!.value = '点击右上角保存前提交';
    textarea!.dispatchEvent(new Event('input'));
    await flushPromises();

    const saveButton = [
      ...wrapper.root.querySelectorAll<HTMLButtonElement>('button'),
    ].find((button) => button.textContent?.trim() === '保存');
    saveButton?.click();
    await flushPromises();

    expect(wrapper.updateRecordMock).toHaveBeenCalledTimes(1);
    expect(wrapper.getLatestRecord().patientInfo.clinicalHistory).toBe(
      '点击右上角保存前提交',
    );
    expect(wrapper.savePatientInfoMock).toHaveBeenCalledTimes(1);

    wrapper.unmount();
  });

  it('falls back to application no when printing without application id', async () => {
    const printWindowState = { html: '' };
    vi.spyOn(window, 'open').mockImplementation(() => {
      return {
        document: {
          close: vi.fn(),
          open: vi.fn(),
          write: (html: string) => {
            printWindowState.html = html;
          },
        },
      } as any;
    });
    const record = createRecordFixture();
    record.applicationId = '';
    record.patientInfo.applicationNo = 'AP202605280003';
    const wrapper = await mountPanel({}, record);

    const printButton = [
      ...wrapper.root.querySelectorAll<HTMLButtonElement>('button'),
    ].find((button) => button.textContent?.includes('补打申请单'));
    printButton?.click();

    expect(window.open).toHaveBeenCalledTimes(1);
    expect(printWindowState.html).toContain('AP202605280003');
    expect(wrapper.reprintMock).not.toHaveBeenCalled();

    wrapper.unmount();
  });

  it('uses full-height mode when requested', async () => {
    const wrapper = await mountPanel({ fullHeight: true });

    const card = wrapper.root.querySelector('section');
    expect(card?.className).toContain('min-h-[420px]');
    expect(wrapper.root.querySelector('.overflow-y-auto')?.className).toContain(
      'overflow-y-auto',
    );
    expect(wrapper.root.textContent).toContain('特殊情况标注');

    wrapper.unmount();
  });
});
