import type {
  ApplicationRegistrationWorkbenchRecord,
  OperatingBuildingOption,
  OperatingRoomOption,
  SaveApplicationRegistrationWorkbenchRequest,
  SpecimenDictionaryEntryOption,
  SpecimenDictionaryGroup,
  SpecimenPackageOption,
} from '../types/application-registration-workbench';

import { createApp, defineComponent, h, nextTick } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  listCommonSpecimenOptionsMock,
  listOperatingBuildingOptionsMock,
  listOperatingRoomOptionsMock,
  listSpecimenDictionaryEntryOptionsMock,
  listSpecimenDictionaryGroupsMock,
  listSpecimenPackageOptionsMock,
  lookupApplicationRegistrationWorkbenchRecordMock,
  saveApplicationRegistrationWorkbenchMock,
  messageSuccessMock,
  messageWarningMock,
} = vi.hoisted(() => ({
  listCommonSpecimenOptionsMock: vi.fn<
    () => Promise<SpecimenDictionaryEntryOption[]>
  >(),
  listOperatingBuildingOptionsMock: vi.fn<
    () => Promise<OperatingBuildingOption[]>
  >(),
  listOperatingRoomOptionsMock: vi.fn<
    (buildingId: string) => Promise<OperatingRoomOption[]>
  >(),
  listSpecimenDictionaryEntryOptionsMock: vi.fn<
    () => Promise<SpecimenDictionaryEntryOption[]>
  >(),
  listSpecimenDictionaryGroupsMock: vi.fn<
    (keyword?: string) => Promise<SpecimenDictionaryGroup[]>
  >(),
  listSpecimenPackageOptionsMock: vi.fn<
    () => Promise<SpecimenPackageOption[]>
  >(),
  lookupApplicationRegistrationWorkbenchRecordMock: vi.fn<
    (query: { keyword: string }) => Promise<ApplicationRegistrationWorkbenchRecord | null>
  >(),
  saveApplicationRegistrationWorkbenchMock: vi.fn<
    (
      applicationId: string,
      payload: SaveApplicationRegistrationWorkbenchRequest,
    ) => Promise<ApplicationRegistrationWorkbenchRecord>
  >(),
  messageSuccessMock: vi.fn(),
  messageWarningMock: vi.fn(),
}));

vi.mock('@vben/common-ui', () => ({
  Page: defineComponent({
    setup(_, { slots }) {
      return () => h('section', { 'data-testid': 'page' }, slots.default?.());
    },
  }),
}));

vi.mock('element-plus', () => ({
  ElAlert: defineComponent({
    props: {
      title: {
        default: '',
        type: String,
      },
    },
    setup(props) {
      return () => h('div', { 'data-testid': 'alert' }, props.title);
    },
  }),
  ElEmpty: defineComponent({
    props: {
      description: {
        default: '',
        type: String,
      },
    },
    setup(props) {
      return () => h('div', { 'data-testid': 'empty' }, props.description);
    },
  }),
  ElMessage: {
    success: messageSuccessMock,
    warning: messageWarningMock,
  },
}));

vi.mock('../api/application-registration-workbench-mock', () => ({
  listCommonSpecimenOptions: listCommonSpecimenOptionsMock,
  listOperatingBuildingOptions: listOperatingBuildingOptionsMock,
  listOperatingRoomOptions: listOperatingRoomOptionsMock,
  listSpecimenDictionaryEntryOptions: listSpecimenDictionaryEntryOptionsMock,
  listSpecimenDictionaryGroups: listSpecimenDictionaryGroupsMock,
  listSpecimenPackageOptions: listSpecimenPackageOptionsMock,
}));

vi.mock('../api/application-registration-workbench-service', () => ({
  lookupApplicationRegistrationWorkbenchRecord:
    lookupApplicationRegistrationWorkbenchRecordMock,
  saveApplicationRegistrationWorkbench: saveApplicationRegistrationWorkbenchMock,
}));

vi.mock('../components/ApplicationRegistrationWorkbenchToolbar.vue', () => ({
  default: defineComponent({
    props: {
      buildingId: {
        default: '',
        type: String,
      },
      registrationStatus: {
        default: '',
        type: String,
      },
      roomId: {
        default: '',
        type: String,
      },
      saveDisabled: {
        default: false,
        type: Boolean,
      },
      saving: {
        default: false,
        type: Boolean,
      },
      searchKeyword: {
        default: '',
        type: String,
      },
    },
    emits: [
      'save',
      'search',
      'update:buildingId',
      'update:roomId',
      'update:searchKeyword',
    ],
    setup(props, { emit }) {
      return () =>
        h('div', { 'data-testid': 'toolbar' }, [
          h('div', { 'data-testid': 'toolbar-building' }, props.buildingId),
          h('div', { 'data-testid': 'toolbar-room' }, props.roomId),
          h('div', { 'data-testid': 'toolbar-status' }, props.registrationStatus),
          h('input', {
            'data-testid': 'toolbar-search',
            value: props.searchKeyword,
            onInput: (event: Event) =>
              emit(
                'update:searchKeyword',
                (event.target as HTMLInputElement).value,
              ),
          }),
          h(
            'button',
            {
              'data-testid': 'toolbar-search-button',
              type: 'button',
              onClick: () => emit('search'),
            },
            '查询',
          ),
          h(
            'button',
            {
              'data-testid': 'toolbar-save-button',
              disabled: props.saveDisabled,
              type: 'button',
              onClick: () => emit('save'),
            },
            props.saving ? '保存中' : '保存',
          ),
        ]);
    },
  }),
}));

vi.mock('../components/ApplicationRegistrationPatientPanel.vue', () => ({
  default: defineComponent({
    props: {
      buildingLabel: {
        default: '',
        type: String,
      },
      record: {
        default: null,
        type: Object,
      },
      roomLabel: {
        default: '',
        type: String,
      },
    },
    emits: ['update:record'],
    setup(props, { emit }) {
      return () =>
        h('div', { 'data-testid': 'patient-panel' }, [
          h(
            'div',
            { 'data-testid': 'patient-panel-text' },
            props.record
              ? [
                  props.record.patientInfo.patientName,
                  props.record.patientInfo.inpatientNo,
                  props.buildingLabel,
                  props.roomLabel,
                ].join('|')
              : 'EMPTY',
          ),
          h(
            'button',
            {
              'data-testid': 'patient-update-diagnosis',
              type: 'button',
              onClick: () => {
                if (!props.record) {
                  return;
                }
                emit('update:record', {
                  ...props.record,
                  patientInfo: {
                    ...props.record.patientInfo,
                    clinicalDiagnosis: '更新后的临床诊断',
                  },
                });
              },
            },
            '更新诊断',
          ),
        ]);
    },
  }),
}));

vi.mock('../components/ApplicationRegistrationSpecimenTable.vue', () => ({
  default: defineComponent({
    props: {
      items: {
        default: () => [],
        type: Array,
      },
      roomLabel: {
        default: '',
        type: String,
      },
    },
    emits: ['add-manual', 'select-package', 'update:items'],
    setup(props, { emit }) {
      return () =>
        h('div', { 'data-testid': 'specimen-table' }, [
          h('div', { 'data-testid': 'specimen-room' }, props.roomLabel),
          h(
            'div',
            { 'data-testid': 'specimen-items' },
            JSON.stringify(props.items),
          ),
          h(
            'button',
            {
              'data-testid': 'add-manual',
              type: 'button',
              onClick: () => emit('add-manual'),
            },
            '添加标本',
          ),
          h(
            'button',
            {
              'data-testid': 'select-package',
              type: 'button',
              onClick: () => emit('select-package'),
            },
            '选择套餐',
          ),
        ]);
    },
  }),
}));

vi.mock('../components/ApplicationRegistrationDictionaryPanel.vue', () => ({
  default: defineComponent({
    props: {
      dictionaryKeyword: {
        default: '',
        type: String,
      },
      groups: {
        default: () => [],
        type: Array,
      },
    },
    emits: ['append', 'update:dictionaryKeyword'],
    setup(props, { emit }) {
      return () =>
        h('div', { 'data-testid': 'dictionary-panel' }, [
          h(
            'div',
            { 'data-testid': 'dictionary-groups' },
            JSON.stringify(props.groups),
          ),
          h('input', {
            'data-testid': 'dictionary-input',
            value: props.dictionaryKeyword,
            onInput: (event: Event) =>
              emit(
                'update:dictionaryKeyword',
                (event.target as HTMLInputElement).value,
              ),
          }),
          h(
            'button',
            {
              'data-testid': 'dictionary-append',
              type: 'button',
              onClick: () =>
                emit('append', {
                  specimenName: '追加标本',
                  specimenSite: '宫颈',
                }),
            },
            '追加词条',
          ),
        ]);
    },
  }),
}));

vi.mock('../components/ApplicationRegistrationPackageDialog.vue', () => ({
  default: defineComponent({
    props: {
      modelValue: {
        default: false,
        type: Boolean,
      },
      packageOptions: {
        default: () => [],
        type: Array,
      },
      preferredDept: {
        default: '',
        type: String,
      },
    },
    emits: ['confirm', 'create-package', 'update:modelValue'],
    setup(props, { emit }) {
      return () =>
        h('div', { 'data-testid': 'package-dialog' }, [
          h('div', { 'data-testid': 'package-visible' }, String(props.modelValue)),
          h(
            'div',
            { 'data-testid': 'package-preferred-dept' },
            props.preferredDept,
          ),
          h(
            'button',
            {
              'data-testid': 'package-confirm',
              disabled: !props.modelValue || props.packageOptions.length === 0,
              type: 'button',
              onClick: () => emit('confirm', props.packageOptions[0]),
            },
            '确认套餐',
          ),
        ]);
    },
  }),
}));

import ApplicationRegistrationWorkbenchView from './ApplicationRegistrationWorkbenchView.vue';

const buildingOptionsFixture: OperatingBuildingOption[] = [
  {
    buildingId: 'B001',
    buildingName: '惠侨楼',
    floors: 12,
    location: '北区',
    operatingRooms: [],
  },
  {
    buildingId: 'B002',
    buildingName: '门诊医技楼',
    floors: 8,
    location: '中区',
    operatingRooms: [],
  },
];

const roomOptionsByBuilding: Record<string, OperatingRoomOption[]> = {
  B001: [
    {
      buildingId: 'B001',
      cleanLevel: '百级',
      floor: 3,
      roomId: 'OR-102',
      roomName: '手术室2',
      roomType: '洁净手术室',
    },
  ],
  B002: [
    {
      buildingId: 'B002',
      cleanLevel: '千级',
      floor: 5,
      roomId: 'OR-201',
      roomName: '日间手术室A',
      roomType: '日间手术室',
    },
  ],
};

const dictionaryGroupsFixture: SpecimenDictionaryGroup[] = [
  {
    subParts: [
      {
        partId: 'P301',
        partName: '宫颈',
        specimens: ['宫颈3点位组织'],
      },
    ],
    systemId: 'SYS003',
    systemName: '妇科',
  },
];

const specimenEntryOptionsFixture: SpecimenDictionaryEntryOption[] = [
  {
    partId: 'P301',
    partName: '宫颈',
    searchKeywords: ['宫颈活检组织', 'gjhjzz', '妇科', 'fg'],
    specimenName: '宫颈活检组织',
    systemId: 'SYS003',
    systemName: '妇科',
  },
];

const commonSpecimenOptionsFixture: SpecimenDictionaryEntryOption[] = [
  {
    partId: 'P202',
    partName: '乳腺',
    searchKeywords: ['右乳外上象限结节', 'yrwsxxjj', '乳腺', 'rx'],
    specimenName: '右乳外上象限结节',
    systemId: 'SYS002',
    systemName: '乳腺及皮肤',
  },
];

const specimenPackageOptionsFixture: SpecimenPackageOption[] = [
  {
    applyDept: '普外科',
    description: '乳腺肿物常规送检套餐',
    itemCount: 2,
    items: [
      {
        quantity: 1,
        specimenName: '乳腺病灶切缘组织',
        specimenSite: '乳腺',
        status: '新增',
      },
      {
        quantity: 1,
        specimenName: '病灶周边皮肤组织',
        specimenSite: '皮肤',
        status: '新增',
      },
    ],
    packageId: 'SPKG-001',
    packageName: '乳腺肿物常规取材套餐',
    searchKeywords: ['乳腺肿物常规取材套餐', 'rxzwcgqctc'],
  },
];

function createRecordFixture(): ApplicationRegistrationWorkbenchRecord {
  return {
    applicationId: 'app-1124',
    contagiousSpecimen: {
      hepatitis: false,
      hiv: false,
      isolation: false,
      syphilis: false,
      tuberculosis: false,
    },
    gynecologyInfo: {
      additionalNotes: '',
      hpvResult: '阴性',
      lastMenstrualPeriod: '2026-05-01',
      menopause: false,
      previousCytology: '正常',
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
      age: '35岁',
      applicationDate: '2026-05-27 09:45:33',
      applicationNo: '1124',
      applyDept: '普外科',
      applyDoctor: '刘强',
      bedNo: '16床',
      checkItem: '乳腺肿物活检',
      clinicalDiagnosis: '乳腺增生伴结节',
      clinicalHistory: '乳腺纤维腺瘤术后复查',
      deliveryRequirement: '双人核对后送检',
      endoscopyDiagnosis: '无',
      frozenReminder: false,
      gender: '女',
      idNo: '63847291',
      imagingResult: '超声示右乳外上象限低回声结节',
      inpatientNo: 'ZY0001124',
      patientName: '张敏',
      patientVerified: false,
      phone: '13800001124',
      registrationStatus: '登记',
      remark: '关注右乳外上象限病灶边界',
      specimenType: '常规',
      wardName: '普外科病区8B',
    },
    specimenItems: [
      {
        id: 'item-1',
        quantity: 1,
        specimenName: '右乳外上象限结节',
        specimenNo: '22503',
        specimenSite: '乳腺',
        status: '新增',
      },
      {
        id: 'item-2',
        quantity: 1,
        specimenName: '右乳周围皮肤组织',
        specimenNo: '22504',
        specimenSite: '皮肤',
        status: '新增',
      },
    ],
    surgeryInfo: {
      buildingId: 'B001',
      clinicalFindings: '右乳外上象限可触及约1.5cm结节',
      fixativeType: '福尔马林',
      fixationPerson: '赵护士',
      fixationTime: '2026-05-27 09:45:33',
      roomId: 'OR-102',
      surgeryName: '乳腺肿物切除术',
    },
  };
}

function createSavedRecordFixture(): ApplicationRegistrationWorkbenchRecord {
  return {
    ...createRecordFixture(),
    patientInfo: {
      ...createRecordFixture().patientInfo,
      clinicalDiagnosis: '更新后的临床诊断',
      registrationStatus: 'SUBMITTED',
    },
    specimenItems: [
      {
        id: 'saved-1',
        quantity: 1,
        specimenName: '右乳外上象限结节',
        specimenNo: 'SP20260527001',
        specimenSite: '乳腺',
        status: '已登记',
      },
      {
        id: 'saved-2',
        quantity: 1,
        specimenName: '右乳周围皮肤组织',
        specimenNo: 'SP20260527002',
        specimenSite: '皮肤',
        status: '已登记',
      },
      {
        id: 'saved-3',
        quantity: 1,
        specimenName: '追加标本',
        specimenNo: 'SP20260527003',
        specimenSite: '宫颈',
        status: '已登记',
      },
    ],
  };
}

function resetMocks() {
  listCommonSpecimenOptionsMock.mockReset();
  listOperatingBuildingOptionsMock.mockReset();
  listOperatingRoomOptionsMock.mockReset();
  listSpecimenDictionaryEntryOptionsMock.mockReset();
  listSpecimenDictionaryGroupsMock.mockReset();
  listSpecimenPackageOptionsMock.mockReset();
  lookupApplicationRegistrationWorkbenchRecordMock.mockReset();
  saveApplicationRegistrationWorkbenchMock.mockReset();
  messageSuccessMock.mockReset();
  messageWarningMock.mockReset();

  listCommonSpecimenOptionsMock.mockResolvedValue(commonSpecimenOptionsFixture);
  listOperatingBuildingOptionsMock.mockResolvedValue(buildingOptionsFixture);
  listOperatingRoomOptionsMock.mockImplementation(async (buildingId: string) => {
    return roomOptionsByBuilding[buildingId] ?? [];
  });
  listSpecimenDictionaryEntryOptionsMock.mockResolvedValue(
    specimenEntryOptionsFixture,
  );
  listSpecimenDictionaryGroupsMock.mockResolvedValue(dictionaryGroupsFixture);
  listSpecimenPackageOptionsMock.mockResolvedValue(specimenPackageOptionsFixture);
  lookupApplicationRegistrationWorkbenchRecordMock.mockResolvedValue(
    createRecordFixture(),
  );
  saveApplicationRegistrationWorkbenchMock.mockResolvedValue(
    createSavedRecordFixture(),
  );
}

async function flushPromises() {
  await Promise.resolve();
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

async function mountView() {
  const root = document.createElement('div');
  document.body.append(root);

  const app = createApp({
    render: () => h(ApplicationRegistrationWorkbenchView),
  });

  app.mount(root);
  await flushPromises();

  return {
    root,
    search(keyword: string) {
      const input = root.querySelector<HTMLInputElement>(
        '[data-testid="toolbar-search"]',
      );
      input!.value = keyword;
      input!.dispatchEvent(new Event('input'));
      root
        .querySelector<HTMLButtonElement>('[data-testid="toolbar-search-button"]')!
        .click();
    },
    async wait() {
      await flushPromises();
    },
    unmount() {
      app.unmount();
      root.remove();
    },
  };
}

describe('ApplicationRegistrationWorkbenchView', () => {
  beforeEach(() => {
    resetMocks();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('shows the initial empty state before any lookup', async () => {
    const wrapper = await mountView();

    expect(wrapper.root.querySelector('[data-testid="empty"]')).not.toBeNull();
    expect(wrapper.root.querySelector('[data-testid="empty"]')?.textContent).toBe(
      '请输入申请单编号 / 申请单号 / 住院号查询',
    );
    expect(wrapper.root.querySelector('[data-testid="patient-panel"]')).toBeNull();
    expect(listSpecimenDictionaryEntryOptionsMock).toHaveBeenCalledTimes(1);
    expect(listCommonSpecimenOptionsMock).toHaveBeenCalledTimes(1);
    expect(listOperatingBuildingOptionsMock).toHaveBeenCalledTimes(1);
    expect(listSpecimenDictionaryGroupsMock).toHaveBeenCalledTimes(1);
    expect(listSpecimenPackageOptionsMock).toHaveBeenCalledTimes(1);

    wrapper.unmount();
  });

  it('hydrates patient info, building/room selections, and specimen items after a successful lookup', async () => {
    const wrapper = await mountView();

    wrapper.search('1124');
    await wrapper.wait();

    expect(lookupApplicationRegistrationWorkbenchRecordMock).toHaveBeenCalledWith({
      keyword: '1124',
    });
    expect(
      wrapper.root.querySelector('[data-testid="patient-panel-text"]')?.textContent,
    ).toContain('张敏');
    expect(
      wrapper.root.querySelector('[data-testid="patient-panel-text"]')?.textContent,
    ).toContain('ZY0001124');
    expect(
      wrapper.root.querySelector('[data-testid="toolbar-building"]')?.textContent,
    ).toBe('B001');
    expect(
      wrapper.root.querySelector('[data-testid="toolbar-room"]')?.textContent,
    ).toBe('OR-102');
    expect(
      wrapper.root.querySelector('[data-testid="specimen-items"]')?.textContent,
    ).toContain('右乳外上象限结节');

    wrapper.unmount();
  });

  it('appends a specimen row when a dictionary item is selected', async () => {
    const wrapper = await mountView();

    wrapper.search('1124');
    await wrapper.wait();

    const beforeAppendText =
      wrapper.root.querySelector('[data-testid="specimen-items"]')?.textContent ?? '';
    expect(beforeAppendText).toContain('右乳外上象限结节');
    expect(beforeAppendText).not.toContain('追加标本');

    wrapper.root
      .querySelector<HTMLButtonElement>('[data-testid="dictionary-append"]')!
      .click();
    await wrapper.wait();

    const afterAppendText =
      wrapper.root.querySelector('[data-testid="specimen-items"]')?.textContent ?? '';
    expect(afterAppendText).toContain('追加标本');
    expect(afterAppendText).toContain('宫颈');

    wrapper.unmount();
  });

  it('sends the full payload on save and refreshes the workbench state', async () => {
    const wrapper = await mountView();

    lookupApplicationRegistrationWorkbenchRecordMock
      .mockResolvedValueOnce(createRecordFixture())
      .mockResolvedValueOnce(createSavedRecordFixture());

    wrapper.search('1124');
    await wrapper.wait();

    wrapper.root
      .querySelector<HTMLButtonElement>('[data-testid="dictionary-append"]')!
      .click();
    await wrapper.wait();

    wrapper.root
      .querySelector<HTMLButtonElement>('[data-testid="patient-update-diagnosis"]')!
      .click();
    await wrapper.wait();

    wrapper.root
      .querySelector<HTMLButtonElement>('[data-testid="toolbar-save-button"]')!
      .click();
    await wrapper.wait();

    expect(saveApplicationRegistrationWorkbenchMock).toHaveBeenCalledTimes(1);
    expect(saveApplicationRegistrationWorkbenchMock).toHaveBeenCalledWith(
      'app-1124',
      expect.objectContaining({
        patientInfo: expect.objectContaining({
          clinicalDiagnosis: '更新后的临床诊断',
        }),
        specimenItems: expect.arrayContaining([
          expect.objectContaining({
            specimenName: '右乳外上象限结节',
            specimenSite: '乳腺',
          }),
          expect.objectContaining({
            specimenName: '追加标本',
            specimenSite: '宫颈',
          }),
        ]),
        surgeryInfo: expect.objectContaining({
          buildingId: 'B001',
          roomId: 'OR-102',
        }),
      }),
    );
    expect(lookupApplicationRegistrationWorkbenchRecordMock).toHaveBeenLastCalledWith(
      {
        keyword: '1124',
      },
    );
    expect(
      wrapper.root.querySelector('[data-testid="toolbar-status"]')?.textContent,
    ).toBe('SUBMITTED');
    expect(
      wrapper.root.querySelector('[data-testid="specimen-items"]')?.textContent,
    ).toContain('已登记');
    expect(messageSuccessMock).toHaveBeenCalledWith('保存并确认登记成功');

    wrapper.unmount();
  });

  it('shows the backend 409 message when save is rejected', async () => {
    const wrapper = await mountView();

    wrapper.search('1124');
    await wrapper.wait();

    saveApplicationRegistrationWorkbenchMock.mockRejectedValueOnce({
      response: {
        data: {
          message: '申请单已进入后续流程，不能回到工作台整体改写',
        },
        status: 409,
      },
    });

    wrapper.root
      .querySelector<HTMLButtonElement>('[data-testid="toolbar-save-button"]')!
      .click();
    await wrapper.wait();

    expect(wrapper.root.querySelector('[data-testid="alert"]')?.textContent).toContain(
      '申请单已进入后续流程，不能回到工作台整体改写',
    );

    wrapper.unmount();
  });

  it('shows the unified not-found hint when lookup returns null', async () => {
    const wrapper = await mountView();

    lookupApplicationRegistrationWorkbenchRecordMock.mockResolvedValueOnce(null);

    wrapper.search('missing-id');
    await wrapper.wait();

    expect(wrapper.root.querySelector('[data-testid="empty"]')?.textContent).toBe(
      '未找到对应申请单编号 / 申请单号 / 住院号',
    );
    expect(wrapper.root.querySelector('[data-testid="patient-panel"]')).toBeNull();

    wrapper.unmount();
  });
});
