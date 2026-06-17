import type {
  ApplicationRegistrationWorkbenchRecord,
  SpecimenDictionaryResponse,
  SpecimenPackageOption,
} from '../types/application-registration-workbench';

import { createApp, defineComponent, h, nextTick, ref } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  messageWarningMock,
  mockGetSpecimenDictionary,
  mockListSpecimenPackageOptions,
} = vi.hoisted(() => ({
  messageWarningMock: vi.fn(),
  mockGetSpecimenDictionary: vi.fn(),
  mockListSpecimenPackageOptions: vi.fn(),
}));

vi.mock('element-plus', () => ({
  ElMessage: {
    warning: messageWarningMock,
  },
}));

vi.mock('../api/application-registration-workbench-service', () => ({
  getSpecimenDictionary: mockGetSpecimenDictionary,
  listSpecimenPackageOptions: mockListSpecimenPackageOptions,
}));

import { useApplicationRegistrationWorkbenchSpecimens } from './useApplicationRegistrationWorkbenchSpecimens';

function createRecord(): ApplicationRegistrationWorkbenchRecord {
  return {
    applicationId: 'APP-1',
    contagiousSpecimen: {
      hepatitis: false,
      hiv: false,
      isolation: false,
      syphilis: false,
      tuberculosis: false,
    },
    gynecologyInfo: {
      additionalNotes: '',
      hpvResult: '',
      lastMenstrualPeriod: '',
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
      age: '',
      applyDept: '',
      applyDoctor: '',
      applicationDate: '',
      applicationNo: 'APP-001',
      bedNo: '',
      checkItem: '',
      clinicalDiagnosis: '',
      clinicalHistory: '',
      deliveryRequirement: '',
      endoscopyDiagnosis: '',
      frozenReminder: false,
      gender: '',
      idNo: '',
      imagingResult: '',
      inpatientNo: 'INP-001',
      patientName: '测试患者',
      patientVerified: false,
      phone: '',
      registrationStatus: '',
      remark: '',
      specimenType: '',
      wardName: '',
    },
    specimenItems: [],
    surgeryInfo: {
      buildingId: 'B-1',
      clinicalFindings: '',
      fixativeType: '',
      fixationPerson: '',
      fixationTime: '',
      roomId: 'R-1',
      specimenRemovalTime: '',
      surgeryName: '',
    },
  };
}

function createPackage(): SpecimenPackageOption {
  return {
    applyDept: '检验科',
    description: '套餐',
    itemCount: 1,
    items: [
      {
        quantity: 1,
        specimenName: '胃组织',
        specimenSite: '胃',
        status: '新增',
      },
    ],
    packageId: 'PKG-1',
    packageName: '套餐1',
    searchKeywords: [],
  };
}

function createDictionaryResponse(
  overrides: Partial<SpecimenDictionaryResponse> = {},
): SpecimenDictionaryResponse {
  return {
    commonOptions: [
      {
        partId: 'P-1',
        partName: '胃',
        searchKeywords: ['胃组织'],
        specimenName: '胃组织',
        systemId: 'S-1',
        systemName: '消化',
      },
      {
        partId: 'P-1',
        partName: '胃',
        searchKeywords: ['胃切缘'],
        specimenName: '胃切缘',
        systemId: 'S-1',
        systemName: '消化',
      },
      {
        partId: 'P-2',
        partName: '肠系膜',
        searchKeywords: ['肠系膜组织'],
        specimenName: '肠系膜组织',
        systemId: 'S-1',
        systemName: '消化',
      },
    ],
    departmentFiltered: false,
    entryOptions: [
      {
        partId: 'P-1',
        partName: '胃',
        searchKeywords: ['胃组织'],
        specimenName: '胃组织',
        systemId: 'S-1',
        systemName: '消化',
      },
      {
        partId: 'P-1',
        partName: '胃',
        searchKeywords: ['胃切缘'],
        specimenName: '胃切缘',
        systemId: 'S-1',
        systemName: '消化',
      },
      {
        partId: 'P-2',
        partName: '肠系膜',
        searchKeywords: ['肠系膜组织'],
        specimenName: '肠系膜组织',
        systemId: 'S-1',
        systemName: '消化',
      },
    ],
    groups: [
      {
        subParts: [
          {
            partId: 'P-1',
            partName: '胃',
            specimens: ['胃组织', '胃切缘'],
          },
        ],
        systemId: 'S-1',
        systemName: '消化',
      },
    ],
    ...overrides,
  };
}

function createHarness() {
  const currentRecord = ref<ApplicationRegistrationWorkbenchRecord | null>(
    null,
  );
  const pageError = ref('');
  let state: null | ReturnType<
    typeof useApplicationRegistrationWorkbenchSpecimens
  > = null;

  const Harness = defineComponent({
    setup() {
      state = useApplicationRegistrationWorkbenchSpecimens({
        currentRecord,
        pageError,
      });
      return () => h('div');
    },
  });

  return {
    Harness,
    currentRecord,
    getState: () => state,
    pageError,
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

describe('useApplicationRegistrationWorkbenchSpecimens', () => {
  beforeEach(() => {
    mockGetSpecimenDictionary.mockResolvedValue(createDictionaryResponse());
    mockListSpecimenPackageOptions.mockResolvedValue([createPackage()]);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    messageWarningMock.mockReset();
    mockGetSpecimenDictionary.mockReset();
    mockListSpecimenPackageOptions.mockReset();
  });

  it('warns when appending without a current record and loads dictionary data on mount', async () => {
    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    state.handleAppendSpecimen({
      specimenName: '追加标本',
      specimenSite: '胃',
    });
    state.handleOpenPackageDialog();

    expect(messageWarningMock).toHaveBeenNthCalledWith(
      1,
      '请先查询申请单后再追加标本',
    );
    expect(messageWarningMock).toHaveBeenNthCalledWith(
      2,
      '请先查询申请单后再选择套餐',
    );
    expect(state.departmentCommonSpecimenOptions.value).toEqual([
      expect.objectContaining({
        partName: '胃',
        specimenName: '胃组织',
      }),
    ]);
    expect(state.doctorCommonSpecimenOptions.value).toEqual([
      expect.objectContaining({
        partName: '肠系膜',
        specimenName: '肠系膜组织',
      }),
    ]);
    expect(state.dictionaryGroups.value[0]?.subParts[0]?.specimens).toEqual([
      '胃切缘',
    ]);
    expect(state.activeSystemId.value).toBe('S-1');
    expect(state.activePartId.value).toBe('P-1');

    wrapper.destroy();
  });

  it('resets dictionary selection when keyword switching no longer contains the active system or part', async () => {
    mockGetSpecimenDictionary.mockImplementation(async (keyword = '') => {
      if (keyword.trim() === '宫颈') {
        return createDictionaryResponse({
          commonOptions: [
            {
              partId: 'P-3',
              partName: '宫颈',
              searchKeywords: ['宫颈活检组织'],
              specimenName: '宫颈活检组织',
              systemId: 'S-2',
              systemName: '妇科',
            },
          ],
          departmentFiltered: true,
          entryOptions: [
            {
              partId: 'P-3',
              partName: '宫颈',
              searchKeywords: ['宫颈活检组织'],
              specimenName: '宫颈活检组织',
              systemId: 'S-2',
              systemName: '妇科',
            },
            {
              partId: 'P-3',
              partName: '宫颈',
              searchKeywords: ['宫颈锥切标本'],
              specimenName: '宫颈锥切标本',
              systemId: 'S-2',
              systemName: '妇科',
            },
          ],
          groups: [
            {
              subParts: [
                {
                  partId: 'P-3',
                  partName: '宫颈',
                  specimens: ['宫颈活检组织', '宫颈锥切标本'],
                },
              ],
              systemId: 'S-2',
              systemName: '妇科',
            },
          ],
        });
      }

      return createDictionaryResponse();
    });

    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    state.dictionaryKeyword.value = '宫颈';
    await flushComposable();

    expect(state.activeSystemId.value).toBe('S-2');
    expect(state.activePartId.value).toBe('P-3');
    expect(state.dictionaryGroups.value[0]?.systemName).toBe('妇科');

    wrapper.destroy();
  });

  it('falls back to the backend full dictionary payload when no department filter is applied', async () => {
    mockGetSpecimenDictionary.mockResolvedValueOnce(
      createDictionaryResponse({
        commonOptions: [
          {
            partId: 'P-9',
            partName: '皮肤',
            searchKeywords: ['背部黑毛痣'],
            specimenName: '背部黑毛痣',
            systemId: 'S-9',
            systemName: '乳腺及皮肤',
          },
        ],
        departmentFiltered: false,
        entryOptions: [
          {
            partId: 'P-9',
            partName: '皮肤',
            searchKeywords: ['背部黑毛痣'],
            specimenName: '背部黑毛痣',
            systemId: 'S-9',
            systemName: '乳腺及皮肤',
          },
        ],
        groups: [
          {
            subParts: [
              {
                partId: 'P-9',
                partName: '皮肤',
                specimens: ['背部黑毛痣'],
              },
            ],
            systemId: 'S-9',
            systemName: '乳腺及皮肤',
          },
        ],
      }),
    );

    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    expect(state.departmentCommonSpecimenOptions.value).toEqual([
      expect.objectContaining({
        partName: '皮肤',
        specimenName: '背部黑毛痣',
      }),
    ]);
    expect(state.doctorCommonSpecimenOptions.value).toEqual([]);
    expect(state.dictionaryGroups.value).toEqual([]);

    wrapper.destroy();
  });

  it('supports manual append and package append after a record is loaded', async () => {
    const wrapper = mountComposable();
    await flushComposable();

    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    wrapper.currentRecord.value = createRecord();

    state.handleAddManualSpecimen();
    state.handleAppendSpecimen({
      specimenName: '追加标本',
      specimenSite: '胃',
    });
    state.handleAppendPackageItems(createPackage());

    expect(state.specimenItems.value).toHaveLength(3);
    expect(state.packageDialogVisible.value).toBe(false);

    state.handleOpenPackageDialog();
    expect(state.packageDialogVisible.value).toBe(true);

    wrapper.destroy();
  });
});
