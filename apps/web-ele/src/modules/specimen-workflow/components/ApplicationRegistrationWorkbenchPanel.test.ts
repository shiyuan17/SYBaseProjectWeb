import type {
  ApplicationRegistrationWorkbenchRecord,
  OperatingBuildingOption,
  OperatingRoomOption,
  SaveApplicationRegistrationPatientInfoRequest,
  SaveApplicationRegistrationWorkbenchRequest,
  SpecimenDictionaryEntryOption,
  SpecimenDictionaryGroup,
  SpecimenPackageOption,
} from '../types/application-registration-workbench';

import { createApp, h, nextTick, type SetupContext } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createAlertStub,
  createButtonStub,
  createDescriptionsItemStub,
  createEmptyStub,
  createPassthroughStub,
} from '../test-utils/component-stubs';

type EmitContext = {
  emit: (event: string, ...args: unknown[]) => void;
};

type SlotContext = Pick<SetupContext, 'slots'>;

type ToolbarStubProps = {
  buildingId: string;
  buildingOptions: OperatingBuildingOption[];
  frozenReminder: boolean;
  patientVerified: boolean;
  registrationStatus: string;
  roomId: string;
  roomOptions: OperatingRoomOption[];
  saveDisabled: boolean;
  saving: boolean;
  searchKeyword: string;
  searchType: string;
};

type PatientPanelStubProps = {
  buildingLabel: string;
  record: ApplicationRegistrationWorkbenchRecord | null;
  roomLabel: string;
  saveDisabled: boolean;
  saving: boolean;
};

type SpecimenTableStubProps = {
  items: ApplicationRegistrationWorkbenchRecord['specimenItems'];
  roomLabel: string;
};

type DictionaryPanelStubProps = {
  activePartId: string;
  activeSystemId: string;
  departmentCommonSpecimenOptions: SpecimenDictionaryEntryOption[];
  dictionaryKeyword: string;
  doctorCommonSpecimenOptions: SpecimenDictionaryEntryOption[];
  groups: SpecimenDictionaryGroup[];
};

const {
  listCommonSpecimenOptionsMock,
  listOperatingBuildingOptionsMock,
  listOperatingRoomOptionsMock,
  listSpecimenDictionaryEntryOptionsMock,
  listSpecimenDictionaryGroupsMock,
  listSpecimenPackageOptionsMock,
  lookupApplicationRegistrationWorkbenchRecordMock,
  saveApplicationRegistrationPatientInfoMock,
  saveApplicationRegistrationWorkbenchMock,
  messageSuccessMock,
  messageWarningMock,
} = vi.hoisted(() => ({
  listCommonSpecimenOptionsMock:
    vi.fn<() => Promise<SpecimenDictionaryEntryOption[]>>(),
  listOperatingBuildingOptionsMock:
    vi.fn<() => Promise<OperatingBuildingOption[]>>(),
  listOperatingRoomOptionsMock:
    vi.fn<(buildingId: string) => Promise<OperatingRoomOption[]>>(),
  listSpecimenDictionaryEntryOptionsMock:
    vi.fn<() => Promise<SpecimenDictionaryEntryOption[]>>(),
  listSpecimenDictionaryGroupsMock:
    vi.fn<(keyword?: string) => Promise<SpecimenDictionaryGroup[]>>(),
  listSpecimenPackageOptionsMock:
    vi.fn<() => Promise<SpecimenPackageOption[]>>(),
  lookupApplicationRegistrationWorkbenchRecordMock:
    vi.fn<
      (query: {
        keyword: string;
        queryType?: string;
      }) => Promise<ApplicationRegistrationWorkbenchRecord | null>
    >(),
  saveApplicationRegistrationPatientInfoMock:
    vi.fn<
      (
        applicationId: string,
        payload: SaveApplicationRegistrationPatientInfoRequest,
      ) => Promise<ApplicationRegistrationWorkbenchRecord>
    >(),
  messageSuccessMock: vi.fn(),
  messageWarningMock: vi.fn(),
  saveApplicationRegistrationWorkbenchMock:
    vi.fn<
      (
        applicationId: string,
        payload: SaveApplicationRegistrationWorkbenchRequest,
      ) => Promise<ApplicationRegistrationWorkbenchRecord>
    >(),
}));

vi.mock('element-plus', () => ({
  ElAlert: createAlertStub(),
  ElButton: createButtonStub(),
  ElDescriptions: createPassthroughStub('div'),
  ElDescriptionsItem: createDescriptionsItemStub(),
  ElEmpty: createEmptyStub(),
  ElMessage: {
    success: messageSuccessMock,
    warning: messageWarningMock,
  },
  ElTable: ((props: Record<string, unknown>) =>
    h(
      'div',
      { 'data-testid': 'table' },
      JSON.stringify(props.data),
    )) as unknown,
  ElTableColumn: (() => null) as unknown,
  ElTag: createPassthroughStub('span'),
}));

vi.mock('../api/application-registration-workbench-service', () => ({
  listCommonSpecimenOptions: listCommonSpecimenOptionsMock,
  listOperatingBuildingOptions: listOperatingBuildingOptionsMock,
  listOperatingRoomOptions: listOperatingRoomOptionsMock,
  listSpecimenDictionaryEntryOptions: listSpecimenDictionaryEntryOptionsMock,
  listSpecimenDictionaryGroups: listSpecimenDictionaryGroupsMock,
  listSpecimenPackageOptions: listSpecimenPackageOptionsMock,
  lookupApplicationRegistrationWorkbenchRecord:
    lookupApplicationRegistrationWorkbenchRecordMock,
  saveApplicationRegistrationPatientInfo:
    saveApplicationRegistrationPatientInfoMock,
  saveApplicationRegistrationWorkbench:
    saveApplicationRegistrationWorkbenchMock,
}));

vi.mock('../api/specimen-workflow-service', () => ({
  getLatestRegistrationResult: vi.fn(async () => ({
    applicationId: 'app-1124',
    labelPrintBatchNo: null,
    labelPrintMessage: null,
    labelPrintSuccess: false,
    registrationSnapshot: null,
    specimens: [],
  })),
}));

vi.mock('./WorkflowSectionCard.vue', () => ({
  default: {
    setup(_: Record<string, never>, { slots }: SlotContext) {
      return () => h('section', slots.default?.());
    },
  },
}));

vi.mock('./ApplicationRegistrationWorkbenchToolbar.vue', () => ({
  default: {
    props: {
      buildingId: { default: '', type: String },
      buildingOptions: { default: () => [], type: Array },
      frozenReminder: { default: false, type: Boolean },
      patientVerified: { default: false, type: Boolean },
      registrationStatus: { default: '', type: String },
      roomId: { default: '', type: String },
      roomOptions: { default: () => [], type: Array },
      saveDisabled: { default: false, type: Boolean },
      saving: { default: false, type: Boolean },
      searchKeyword: { default: '', type: String },
      searchType: { default: 'INPATIENT_NO', type: String },
    },
    emits: [
      'save',
      'search',
      'update:buildingId',
      'update:roomId',
      'update:searchKeyword',
      'update:searchType',
    ],
    setup(props: ToolbarStubProps, { emit }: EmitContext) {
      return () =>
        h('div', { 'data-testid': 'toolbar' }, [
          h('div', { 'data-testid': 'toolbar-building' }, props.buildingId),
          h('div', { 'data-testid': 'toolbar-room' }, props.roomId),
          h(
            'div',
            { 'data-testid': 'toolbar-status' },
            props.registrationStatus,
          ),
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
            'select',
            {
              'data-testid': 'toolbar-search-type',
              value: props.searchType,
              onChange: (event: Event) =>
                emit(
                  'update:searchType',
                  (event.target as HTMLSelectElement).value,
                ),
            },
            [
              h('option', { value: 'INPATIENT_NO' }, '住院号'),
              h('option', { value: 'APPLICATION_NO' }, '申请单号'),
              h('option', { value: 'PATIENT_NAME' }, '姓名'),
            ],
          ),
          h(
            'button',
            {
              'data-testid': 'toolbar-search-button',
              onClick: () => emit('search'),
              type: 'button',
            },
            '查询',
          ),
          h(
            'button',
            {
              'data-testid': 'toolbar-save-button',
              disabled: props.saveDisabled,
              onClick: () => emit('save'),
              type: 'button',
            },
            props.saving ? '保存中' : '保存',
          ),
        ]);
    },
  },
}));

vi.mock('./ApplicationRegistrationPatientPanel.vue', () => ({
  default: {
    props: {
      buildingLabel: { default: '', type: String },
      record: { default: null, type: Object },
      roomLabel: { default: '', type: String },
      saveDisabled: { default: true, type: Boolean },
      saving: { default: false, type: Boolean },
    },
    emits: ['reprint-application-form', 'save-patient-info', 'update:record'],
    setup(props: PatientPanelStubProps, { emit }: EmitContext) {
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
              'data-testid': 'patient-save',
              disabled: props.saveDisabled,
              onClick: () => emit('save-patient-info'),
              type: 'button',
            },
            props.saving ? '保存中' : '保存患者信息',
          ),
          h(
            'button',
            {
              'data-testid': 'patient-reprint',
              onClick: () => {
                if (!props.record) {
                  return;
                }
                emit('reprint-application-form', props.record.applicationId);
              },
              type: 'button',
            },
            '补打申请单',
          ),
          h(
            'button',
            {
              'data-testid': 'patient-update-diagnosis',
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
              type: 'button',
            },
            '更新诊断',
          ),
        ]);
    },
  },
}));

vi.mock('./ApplicationRegistrationSpecimenTable.vue', () => ({
  default: {
    props: {
      items: { default: () => [], type: Array },
      roomLabel: { default: '', type: String },
    },
    emits: ['add-manual', 'select-package', 'update:items'],
    setup(props: SpecimenTableStubProps) {
      return () =>
        h('div', { 'data-testid': 'specimen-table' }, [
          h('div', { 'data-testid': 'specimen-room' }, props.roomLabel),
          h(
            'div',
            { 'data-testid': 'specimen-items' },
            JSON.stringify(props.items),
          ),
        ]);
    },
  },
}));

vi.mock('./ApplicationRegistrationDictionaryPanel.vue', () => ({
  default: {
    props: {
      activePartId: { default: '', type: String },
      activeSystemId: { default: '', type: String },
      departmentCommonSpecimenOptions: { default: () => [], type: Array },
      dictionaryKeyword: { default: '', type: String },
      doctorCommonSpecimenOptions: { default: () => [], type: Array },
      groups: { default: () => [], type: Array },
    },
    emits: [
      'append',
      'select-part',
      'select-system',
      'update:dictionaryKeyword',
    ],
    setup(props: DictionaryPanelStubProps, { emit }: EmitContext) {
      return () =>
        h('div', { 'data-testid': 'dictionary-panel' }, [
          h(
            'div',
            { 'data-testid': 'dictionary-state' },
            JSON.stringify({
              activePartId: props.activePartId,
              activeSystemId: props.activeSystemId,
              departmentCommonSpecimenOptions:
                props.departmentCommonSpecimenOptions,
              doctorCommonSpecimenOptions: props.doctorCommonSpecimenOptions,
              groups: props.groups,
            }),
          ),
          h(
            'button',
            {
              'data-testid': 'dictionary-append',
              onClick: () =>
                emit('append', {
                  specimenName: '追加标本',
                  specimenSite: '宫颈',
                }),
              type: 'button',
            },
            '追加词条',
          ),
        ]);
    },
  },
}));

vi.mock('./ApplicationRegistrationPackageDialog.vue', () => ({
  default: {
    props: {
      modelValue: { default: false, type: Boolean },
      packageOptions: { default: () => [], type: Array },
      preferredDept: { default: '', type: String },
    },
    emits: ['confirm', 'create-package', 'update:modelValue'],
    setup() {
      return () => h('div', { 'data-testid': 'package-dialog' });
    },
  },
}));

import ApplicationRegistrationWorkbenchPanel from './ApplicationRegistrationWorkbenchPanel.vue';

const buildingOptionsFixture: OperatingBuildingOption[] = [
  {
    buildingId: 'B001',
    buildingName: '惠侨楼',
    floors: 12,
    location: '北区',
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
      roomName: '手术室二',
      roomType: '洁净手术室',
    },
  ],
};

const dictionaryGroupsFixture: SpecimenDictionaryGroup[] = [
  {
    subParts: [
      {
        partId: 'P202',
        partName: '乳腺',
        specimens: ['右乳外上象限结节', '右乳周围皮肤组织'],
      },
    ],
    systemId: 'SYS002',
    systemName: '乳腺及皮肤',
  },
];

const specimenEntryOptionsFixture: SpecimenDictionaryEntryOption[] = [
  {
    partId: 'P301',
    partName: '宫颈',
    searchKeywords: ['宫颈活检组织'],
    specimenName: '宫颈活检组织',
    systemId: 'SYS003',
    systemName: '妇科',
  },
];

const commonSpecimenOptionsFixture: SpecimenDictionaryEntryOption[] = [
  {
    partId: 'P202',
    partName: '乳腺',
    searchKeywords: ['右乳外上象限结节'],
    specimenName: '右乳外上象限结节',
    systemId: 'SYS002',
    systemName: '乳腺及皮肤',
  },
  {
    partId: 'P301',
    partName: '宫颈',
    searchKeywords: ['宫颈活检组织'],
    specimenName: '宫颈活检组织',
    systemId: 'SYS003',
    systemName: '妇科',
  },
  {
    partId: 'P101',
    partName: '骨髓炎',
    searchKeywords: ['右侧胫骨感染病灶'],
    specimenName: '右侧胫骨感染病灶',
    systemId: 'SYS001',
    systemName: '骨、关节及软组织',
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
    searchKeywords: ['乳腺肿物常规取材套餐'],
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
      wardName: '普外科病区B',
    },
    specimenItems: [
      {
        id: 'item-1',
        quantity: 1,
        specimenName: '右乳外上象限结节',
        specimenNo: 'SP20260527001',
        specimenSite: '乳腺',
        status: '新增',
      },
      {
        id: 'item-2',
        quantity: 1,
        specimenName: '右乳周围皮肤组织',
        specimenNo: 'SP20260527002',
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
      specimenRemovalTime: '2026-05-27 09:30:00',
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
  saveApplicationRegistrationPatientInfoMock.mockReset();
  saveApplicationRegistrationWorkbenchMock.mockReset();
  messageSuccessMock.mockReset();
  messageWarningMock.mockReset();

  listCommonSpecimenOptionsMock.mockResolvedValue(commonSpecimenOptionsFixture);
  listOperatingBuildingOptionsMock.mockResolvedValue(buildingOptionsFixture);
  listOperatingRoomOptionsMock.mockImplementation(
    async (buildingId: string) => {
      return roomOptionsByBuilding[buildingId] ?? [];
    },
  );
  listSpecimenDictionaryEntryOptionsMock.mockResolvedValue(
    specimenEntryOptionsFixture,
  );
  listSpecimenDictionaryGroupsMock.mockResolvedValue(dictionaryGroupsFixture);
  listSpecimenPackageOptionsMock.mockResolvedValue(
    specimenPackageOptionsFixture,
  );
  lookupApplicationRegistrationWorkbenchRecordMock.mockResolvedValue(
    createRecordFixture(),
  );
  saveApplicationRegistrationPatientInfoMock.mockResolvedValue(
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

async function mountPanel(props: Record<string, unknown> = {}) {
  const root = document.createElement('div');
  document.body.append(root);
  const reprintMock = vi.fn();

  const app = createApp(() =>
    h(ApplicationRegistrationWorkbenchPanel, {
      ...props,
      onReprintApplicationForm: reprintMock,
    }),
  );

  app.mount(root);
  await flushPromises();

  return {
    reprintMock,
    root,
    search(keyword: string) {
      const input = root.querySelector<HTMLInputElement>(
        '[data-testid="toolbar-search"]',
      );
      input!.value = keyword;
      input!.dispatchEvent(new Event('input'));
      root
        .querySelector<HTMLButtonElement>(
          '[data-testid="toolbar-search-button"]',
        )!
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

describe('ApplicationRegistrationWorkbenchPanel', () => {
  beforeEach(() => {
    resetMocks();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('shows the initial empty state before any lookup', async () => {
    const wrapper = await mountPanel();

    expect(
      wrapper.root.querySelector('[data-testid="empty"]')?.textContent,
    ).toBe('请输入申请单号查询');
    expect(
      wrapper.root.querySelector('[data-testid="patient-panel"]'),
    ).toBeNull();

    wrapper.unmount();
  });

  it('hydrates patient info and specimen items after a successful lookup', async () => {
    const wrapper = await mountPanel({
      lookupKeyword: '1124',
      lookupTriggerKey: 1,
    });
    await wrapper.wait();

    expect(
      lookupApplicationRegistrationWorkbenchRecordMock,
    ).toHaveBeenCalledWith({
      keyword: '1124',
      queryType: 'APPLICATION_NO',
    });
    expect(
      wrapper.root.querySelector('[data-testid="patient-panel-text"]')
        ?.textContent,
    ).toContain('张敏');
    expect(
      wrapper.root.querySelector('[data-testid="toolbar-building"]')
        ?.textContent,
    ).toBe('B001');
    expect(
      wrapper.root.querySelector('[data-testid="toolbar-room"]')?.textContent,
    ).toBe('OR-102');
    expect(
      wrapper.root.querySelector('[data-testid="specimen-items"]')?.textContent,
    ).toContain('右乳外上象限结节');
    expect(wrapper.root.textContent).not.toContain('打开兼容登记');

    wrapper.unmount();
  });

  it('hides dictionary specimens already shown as common options', async () => {
    const wrapper = await mountPanel({
      lookupKeyword: '1124',
      lookupTriggerKey: 1,
    });
    await wrapper.wait();

    const dictionaryStateText =
      wrapper.root.querySelector('[data-testid="dictionary-state"]')
        ?.textContent ?? '[]';
    const dictionaryState = JSON.parse(dictionaryStateText) as {
      activePartId: string;
      activeSystemId: string;
      departmentCommonSpecimenOptions: SpecimenDictionaryEntryOption[];
      doctorCommonSpecimenOptions: SpecimenDictionaryEntryOption[];
      groups: SpecimenDictionaryGroup[];
    };

    expect(dictionaryState.departmentCommonSpecimenOptions).toHaveLength(2);
    expect(dictionaryState.doctorCommonSpecimenOptions).toHaveLength(1);
    expect(dictionaryState.groups[0]?.subParts[0]?.specimens).toEqual([
      '右乳周围皮肤组织',
    ]);
    expect(dictionaryState.activeSystemId).toBe('SYS002');
    expect(dictionaryState.activePartId).toBe('P202');

    wrapper.unmount();
  });

  it('deduplicates common specimens before rendering', async () => {
    const wrapper = await mountPanel({
      lookupKeyword: '1124',
      lookupTriggerKey: 1,
    });
    await wrapper.wait();

    const dictionaryStateText =
      wrapper.root.querySelector('[data-testid="dictionary-state"]')
        ?.textContent ?? '[]';
    const dictionaryState = JSON.parse(dictionaryStateText) as {
      departmentCommonSpecimenOptions: Array<{
        partName: string;
        specimenName: string;
      }>;
      doctorCommonSpecimenOptions: Array<{
        partName: string;
        specimenName: string;
      }>;
    };

    expect(dictionaryState.departmentCommonSpecimenOptions).toEqual([
      expect.objectContaining({
        partName: '乳腺',
        specimenName: '右乳外上象限结节',
      }),
      expect.objectContaining({
        partName: '宫颈',
        specimenName: '宫颈活检组织',
      }),
    ]);
    expect(dictionaryState.doctorCommonSpecimenOptions).toEqual([
      expect.objectContaining({
        partName: '骨髓炎',
        specimenName: '右侧胫骨感染病灶',
      }),
    ]);

    wrapper.unmount();
  });

  it('uses the selected lookup type when searching', async () => {
    const wrapper = await mountPanel();

    const select = wrapper.root.querySelector<HTMLSelectElement>(
      '[data-testid="toolbar-search-type"]',
    );
    select!.value = 'APPLICATION_NO';
    select!.dispatchEvent(new Event('change'));
    await wrapper.wait();

    wrapper.search('1124');
    await wrapper.wait();

    expect(
      lookupApplicationRegistrationWorkbenchRecordMock,
    ).toHaveBeenCalledWith({
      keyword: '1124',
      queryType: 'APPLICATION_NO',
    });

    wrapper.unmount();
  });

  it('forwards patient reprint event with current application record', async () => {
    const wrapper = await mountPanel({
      lookupKeyword: '1124',
      lookupTriggerKey: 1,
    });
    await wrapper.wait();

    wrapper.root
      .querySelector<HTMLButtonElement>('[data-testid="patient-reprint"]')!
      .click();

    expect(wrapper.reprintMock).toHaveBeenCalledTimes(1);
    expect(wrapper.reprintMock.mock.calls[0]?.[0]?.applicationId).toBe(
      'app-1124',
    );
    expect(
      wrapper.reprintMock.mock.calls[0]?.[0]?.record?.patientInfo?.patientName,
    ).toBe('张敏');

    wrapper.unmount();
  });

  it('appends a specimen row when a dictionary item is selected', async () => {
    const wrapper = await mountPanel({
      lookupKeyword: '1124',
      lookupTriggerKey: 1,
    });
    await wrapper.wait();

    wrapper.root
      .querySelector<HTMLButtonElement>('[data-testid="dictionary-append"]')!
      .click();
    await wrapper.wait();

    const specimenText =
      wrapper.root.querySelector('[data-testid="specimen-items"]')
        ?.textContent ?? '';
    expect(specimenText).toContain('追加标本');
    expect(specimenText).toContain('宫颈');

    wrapper.unmount();
  });

  it('saves patient info without calling the workbench registration save', async () => {
    const patientInfoSavedRecord = {
      ...createRecordFixture(),
      patientInfo: {
        ...createRecordFixture().patientInfo,
        clinicalDiagnosis: '患者信息轻保存后的临床诊断',
      },
    };
    saveApplicationRegistrationPatientInfoMock.mockResolvedValueOnce(
      patientInfoSavedRecord,
    );

    const wrapper = await mountPanel({
      lookupKeyword: '1124',
      lookupTriggerKey: 1,
    });
    await wrapper.wait();

    wrapper.root
      .querySelector<HTMLButtonElement>(
        '[data-testid="patient-update-diagnosis"]',
      )!
      .click();
    await wrapper.wait();

    wrapper.root
      .querySelector<HTMLButtonElement>('[data-testid="patient-save"]')!
      .click();
    await wrapper.wait();

    expect(saveApplicationRegistrationPatientInfoMock).toHaveBeenCalledTimes(1);
    expect(saveApplicationRegistrationPatientInfoMock).toHaveBeenCalledWith(
      'app-1124',
      expect.objectContaining({
        patientInfo: expect.objectContaining({
          clinicalDiagnosis: '更新后的临床诊断',
        }),
      }),
    );
    expect(saveApplicationRegistrationWorkbenchMock).not.toHaveBeenCalled();
    expect(messageSuccessMock).toHaveBeenCalledWith('患者信息保存成功');

    wrapper.unmount();
  });

  it('allows patient info save even when no specimen rows are present', async () => {
    const recordWithoutSpecimens = {
      ...createRecordFixture(),
      specimenItems: [],
    };
    lookupApplicationRegistrationWorkbenchRecordMock.mockResolvedValueOnce(
      recordWithoutSpecimens,
    );
    saveApplicationRegistrationPatientInfoMock.mockResolvedValueOnce(
      recordWithoutSpecimens,
    );

    const wrapper = await mountPanel({
      lookupKeyword: '1124',
      lookupTriggerKey: 1,
    });
    await wrapper.wait();

    const patientSaveButton = wrapper.root.querySelector<HTMLButtonElement>(
      '[data-testid="patient-save"]',
    );

    expect(patientSaveButton?.disabled).toBe(true);

    wrapper.root
      .querySelector<HTMLButtonElement>(
        '[data-testid="patient-update-diagnosis"]',
      )!
      .click();
    await wrapper.wait();

    expect(patientSaveButton?.disabled).toBe(false);

    patientSaveButton?.click();
    await wrapper.wait();

    expect(saveApplicationRegistrationPatientInfoMock).toHaveBeenCalledTimes(1);
    expect(saveApplicationRegistrationWorkbenchMock).not.toHaveBeenCalled();

    wrapper.unmount();
  });

  it('sends the full payload on save and refreshes the workbench state', async () => {
    lookupApplicationRegistrationWorkbenchRecordMock
      .mockResolvedValueOnce(createRecordFixture())
      .mockResolvedValueOnce(createSavedRecordFixture());
    const wrapper = await mountPanel({
      lookupKeyword: '1124',
      lookupTriggerKey: 1,
    });
    await wrapper.wait();

    wrapper.root
      .querySelector<HTMLButtonElement>('[data-testid="dictionary-append"]')!
      .click();
    await wrapper.wait();

    wrapper.root
      .querySelector<HTMLButtonElement>(
        '[data-testid="patient-update-diagnosis"]',
      )!
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
      }),
    );
    expect(
      saveApplicationRegistrationWorkbenchMock.mock.calls[0]?.[1]?.specimenItems?.every(
        (item) => !('specimenNo' in item),
      ),
    ).toBe(true);
    expect(
      wrapper.root.querySelector('[data-testid="toolbar-status"]')?.textContent,
    ).toBe('已提交');

    wrapper.unmount();
  });

  it('shows the backend 409 message when save is rejected', async () => {
    const wrapper = await mountPanel({
      lookupKeyword: '1124',
      lookupTriggerKey: 1,
    });
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

    expect(
      wrapper.root.querySelector('[data-testid="alert"]')?.textContent,
    ).toContain('申请单已进入后续流程，不能回到工作台整体改写');

    wrapper.unmount();
  });
});
