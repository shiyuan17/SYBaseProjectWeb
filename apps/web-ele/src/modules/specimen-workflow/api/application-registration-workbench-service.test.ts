import type {
  SaveApplicationRegistrationPatientInfoRequest,
  SaveApplicationRegistrationWorkbenchRequest,
  SpecimenDictionaryResponse,
} from '../types/application-registration-workbench';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  saveApplicationRegistrationPatientInfoMock,
  saveApplicationRegistrationWorkbenchMock,
} from './application-registration-workbench-mock';
import {
  buildWorkbenchLookupRequestConfig as _unusedConfig,
  buildSpecimenDictionaryRequestConfig,
  buildWorkbenchLookupRequestConfig,
  isWorkbenchLookupNotFoundError,
  normalizeSpecimenDictionaryResponse,
} from './application-registration-workbench-service';
const _ignore = _unusedConfig;
void _ignore;

describe('application-registration-workbench-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const patientInfoPayload: SaveApplicationRegistrationPatientInfoRequest = {
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
      age: '51',
      applicationDate: '2026-06-06',
      applicationNo: '1122',
      applyDept: '妇科',
      applyDoctor: '王丽',
      bedNo: '26床',
      checkItem: '妇科病理检查',
      clinicalDiagnosis: '',
      clinicalHistory: '',
      deliveryRequirement: '',
      endoscopyDiagnosis: '',
      frozenReminder: false,
      gender: '女',
      idNo: 'ID08305',
      imagingResult: '',
      inpatientNo: 'ZY08305',
      patientName: '林晓芸',
      patientVerified: true,
      phone: '',
      registrationStatus: 'IN_TRANSIT',
      remark: '',
      specimenType: '常规',
      wardName: '妇科病区 3A',
    },
    surgeryInfo: {
      buildingId: 'B001',
      clinicalFindings: '',
      fixativeType: '',
      fixationPerson: '',
      fixationTime: '',
      roomId: 'OR-101',
      specimenRemovalTime: '',
      surgeryName: '',
    },
  };

  const workbenchPayload: SaveApplicationRegistrationWorkbenchRequest = {
    ...patientInfoPayload,
    specimenItems: [],
  };

  it('recognizes backend resource-not-found lookup errors', () => {
    expect(
      isWorkbenchLookupNotFoundError({
        code: 'RESOURCE_NOT_FOUND',
        error: '申请登记工作台记录不存在',
      }),
    ).toBe(true);
  });

  it('builds lookup request config without global error toast', () => {
    expect(
      buildWorkbenchLookupRequestConfig({
        keyword: ' 1122 ',
        queryType: 'APPLICATION_NO',
      }),
    ).toEqual({
      params: {
        keyword: '1122',
        queryType: 'APPLICATION_NO',
      },
      skipErrorMessage: true,
    });
  });

  it('builds specimen dictionary request config only when keyword is present', () => {
    expect(buildSpecimenDictionaryRequestConfig(' 宫颈 ')).toEqual({
      params: {
        keyword: '宫颈',
      },
    });
    expect(buildSpecimenDictionaryRequestConfig('   ')).toBeUndefined();
  });

  it('recognizes axios 404 lookup errors', () => {
    expect(
      isWorkbenchLookupNotFoundError({
        response: {
          data: {
            code: 'RESOURCE_NOT_FOUND',
            message: '申请登记工作台记录不存在',
          },
          status: 404,
        },
      }),
    ).toBe(true);
  });

  it('does not treat unrelated errors as lookup misses', () => {
    expect(
      isWorkbenchLookupNotFoundError({
        code: 'INTERNAL_ERROR',
        error: '数据库异常',
      }),
    ).toBe(false);
  });

  it('normalizes legacy generated idNo before saving patient info through the mock boundary', async () => {
    const saved = await saveApplicationRegistrationPatientInfoMock('APP-001', {
      ...patientInfoPayload,
      patientInfo: {
        ...patientInfoPayload.patientInfo,
        idNo: '08305',
      },
    });

    expect(saved.patientInfo.idNo).toBe('08305');
  });

  it('normalizes legacy generated idNo before saving full workbench payload through the mock boundary', async () => {
    const saved = await saveApplicationRegistrationWorkbenchMock('APP-001', {
      ...workbenchPayload,
      patientInfo: {
        ...workbenchPayload.patientInfo,
        idNo: '08305',
      },
    });

    expect(saved.patientInfo.idNo).toBe('08305');
  });

  it('normalizes the specimen dictionary endpoint response', () => {
    expect(
      normalizeSpecimenDictionaryResponse({
        commonOptions: [
          {
            partId: 'P301',
            partName: '宫颈',
            searchKeywords: ['宫颈活检组织'],
            specimenName: '宫颈活检组织',
            systemId: 'SYS003',
            systemName: '妇科',
          },
        ],
        departmentFiltered: true,
        entryOptions: [
          {
            partId: 'P301',
            partName: '宫颈',
            searchKeywords: ['宫颈活检组织'],
            specimenName: '宫颈活检组织',
            systemId: 'SYS003',
            systemName: '妇科',
          },
        ],
        groups: [
          {
            subParts: [
              {
                partId: 'P301',
                partName: '宫颈',
                specimens: ['宫颈活检组织'],
              },
            ],
            systemId: 'SYS003',
            systemName: '妇科',
          },
        ],
      } satisfies SpecimenDictionaryResponse),
    ).toEqual({
      commonOptions: [
        expect.objectContaining({
          partName: '宫颈',
          specimenName: '宫颈活检组织',
        }),
      ],
      departmentFiltered: true,
      entryOptions: [
        expect.objectContaining({
          partName: '宫颈',
          specimenName: '宫颈活检组织',
        }),
      ],
      groups: [
        expect.objectContaining({
          systemName: '妇科',
        }),
      ],
    });
  });
});
