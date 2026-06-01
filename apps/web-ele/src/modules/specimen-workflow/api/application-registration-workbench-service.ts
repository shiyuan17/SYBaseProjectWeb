import type {
  ApplicationRegistrationWorkbenchRecord,
  OperatingBuildingOption,
  OperatingRoomOption,
  SaveApplicationRegistrationPatientInfoRequest,
  SaveApplicationRegistrationWorkbenchRequest,
  SpecimenDictionaryEntryOption,
  SpecimenDictionaryGroup,
  SpecimenPackageOption,
  WorkbenchLookupQuery,
} from '../types/application-registration-workbench';

import { requestClient } from '#/api/request';

import {
  listCommonSpecimenOptions as listCommonSpecimenOptionsMock,
  listOperatingBuildingOptions as listOperatingBuildingOptionsMock,
  listOperatingRoomOptions as listOperatingRoomOptionsMock,
  listSpecimenDictionaryEntryOptions as listSpecimenDictionaryEntryOptionsMock,
  listSpecimenDictionaryGroups as listSpecimenDictionaryGroupsMock,
  listSpecimenPackageOptions as listSpecimenPackageOptionsMock,
  lookupApplicationRegistrationWorkbenchRecord as lookupApplicationRegistrationWorkbenchRecordMock,
  saveApplicationRegistrationPatientInfoMock,
  saveApplicationRegistrationWorkbenchMock,
} from './application-registration-workbench-mock';
import { normalizeOperatingBuildingOptions } from './internal/application-registration-operating-options';

const USE_APPLICATION_REGISTRATION_WORKBENCH_MOCK =
  import.meta.env.MODE === 'test' ||
  import.meta.env.VITE_SPECIMEN_WORKFLOW_MOCK === 'true';

type OperatingOptionsResponse = {
  buildings?: OperatingBuildingOption[];
};

let operatingOptionsPromise: null | Promise<OperatingBuildingOption[]> = null;

function isPresent<T>(value: null | T | undefined): value is T {
  return value !== null && value !== undefined;
}

function normalizeRecord(
  record: ApplicationRegistrationWorkbenchRecord,
): ApplicationRegistrationWorkbenchRecord {
  return {
    applicationId: record.applicationId,
    contagiousSpecimen: {
      hepatitis: record.contagiousSpecimen?.hepatitis ?? false,
      hiv: record.contagiousSpecimen?.hiv ?? false,
      isolation: record.contagiousSpecimen?.isolation ?? false,
      syphilis: record.contagiousSpecimen?.syphilis ?? false,
      tuberculosis: record.contagiousSpecimen?.tuberculosis ?? false,
    },
    gynecologyInfo: {
      additionalNotes: record.gynecologyInfo?.additionalNotes ?? '',
      hpvResult: record.gynecologyInfo?.hpvResult ?? '',
      lastMenstrualPeriod: record.gynecologyInfo?.lastMenstrualPeriod ?? '',
      menopause: record.gynecologyInfo?.menopause ?? false,
      previousCytology: record.gynecologyInfo?.previousCytology ?? '',
      previousTreatment: record.gynecologyInfo?.previousTreatment ?? '',
      specialConditions: {
        abnormalBleeding:
          record.gynecologyInfo?.specialConditions?.abnormalBleeding ?? false,
        birthControl:
          record.gynecologyInfo?.specialConditions?.birthControl ?? false,
        hormoneReplacement:
          record.gynecologyInfo?.specialConditions?.hormoneReplacement ?? false,
        hysterectomy:
          record.gynecologyInfo?.specialConditions?.hysterectomy ?? false,
        iud: record.gynecologyInfo?.specialConditions?.iud ?? false,
        lactation: record.gynecologyInfo?.specialConditions?.lactation ?? false,
        menopause: record.gynecologyInfo?.specialConditions?.menopause ?? false,
        other: record.gynecologyInfo?.specialConditions?.other ?? '',
        pregnancy: record.gynecologyInfo?.specialConditions?.pregnancy ?? false,
        radiotherapy:
          record.gynecologyInfo?.specialConditions?.radiotherapy ?? false,
      },
    },
    patientInfo: {
      age: record.patientInfo?.age ?? '',
      applicationDate: record.patientInfo?.applicationDate ?? '',
      applicationNo: record.patientInfo?.applicationNo ?? '',
      applyDept: record.patientInfo?.applyDept ?? '',
      applyDoctor: record.patientInfo?.applyDoctor ?? '',
      bedNo: record.patientInfo?.bedNo ?? '',
      checkItem: record.patientInfo?.checkItem ?? '',
      clinicalDiagnosis: record.patientInfo?.clinicalDiagnosis ?? '',
      clinicalHistory: record.patientInfo?.clinicalHistory ?? '',
      deliveryRequirement: record.patientInfo?.deliveryRequirement ?? '',
      endoscopyDiagnosis: record.patientInfo?.endoscopyDiagnosis ?? '',
      frozenReminder: record.patientInfo?.frozenReminder ?? false,
      gender: record.patientInfo?.gender ?? '',
      idNo: record.patientInfo?.idNo ?? '',
      imagingResult: record.patientInfo?.imagingResult ?? '',
      inpatientNo: record.patientInfo?.inpatientNo ?? '',
      patientName: record.patientInfo?.patientName ?? '',
      patientVerified: record.patientInfo?.patientVerified ?? false,
      phone: record.patientInfo?.phone ?? '',
      registrationStatus: record.patientInfo?.registrationStatus ?? '',
      remark: record.patientInfo?.remark ?? '',
      specimenType: record.patientInfo?.specimenType ?? '',
      wardName: record.patientInfo?.wardName ?? '',
    },
    specimenItems: (record.specimenItems ?? []).map((item) => ({
      id: item.id,
      quantity: item.quantity,
      specimenName: item.specimenName ?? '',
      specimenNo: item.specimenNo ?? '',
      specimenSite: item.specimenSite ?? '',
      status: item.status ?? '',
    })),
    surgeryInfo: {
      buildingId: record.surgeryInfo?.buildingId ?? '',
      clinicalFindings: record.surgeryInfo?.clinicalFindings ?? '',
      fixativeType: record.surgeryInfo?.fixativeType ?? '',
      fixationPerson: record.surgeryInfo?.fixationPerson ?? '',
      fixationTime: record.surgeryInfo?.fixationTime ?? '',
      roomId: record.surgeryInfo?.roomId ?? '',
      specimenRemovalTime: record.surgeryInfo?.specimenRemovalTime ?? '',
      surgeryName: record.surgeryInfo?.surgeryName ?? '',
    },
  };
}

export async function lookupApplicationRegistrationWorkbenchRecord(
  query: WorkbenchLookupQuery,
) {
  if (USE_APPLICATION_REGISTRATION_WORKBENCH_MOCK) {
    return lookupApplicationRegistrationWorkbenchRecordMock(query);
  }

  try {
    const response =
      await requestClient.get<ApplicationRegistrationWorkbenchRecord>(
        '/v1/application-registration-workbench/lookup',
        {
          params: {
            queryType: query.queryType,
            keyword: query.keyword.trim(),
          },
        },
      );

    return normalizeRecord(response);
  } catch (error) {
    const status = (error as { response?: { status?: number } }).response
      ?.status;
    if (status === 404) {
      return null;
    }
    throw error;
  }
}

export async function saveApplicationRegistrationWorkbench(
  applicationId: string,
  payload: SaveApplicationRegistrationWorkbenchRequest,
) {
  if (USE_APPLICATION_REGISTRATION_WORKBENCH_MOCK) {
    return saveApplicationRegistrationWorkbenchMock(applicationId, payload);
  }

  const response =
    await requestClient.post<ApplicationRegistrationWorkbenchRecord>(
      `/v1/application-registration-workbench/${applicationId}/save`,
      payload,
    );

  return normalizeRecord(response);
}

export async function saveApplicationRegistrationPatientInfo(
  applicationId: string,
  payload: SaveApplicationRegistrationPatientInfoRequest,
) {
  if (USE_APPLICATION_REGISTRATION_WORKBENCH_MOCK) {
    return saveApplicationRegistrationPatientInfoMock(applicationId, payload);
  }

  const response =
    await requestClient.request<ApplicationRegistrationWorkbenchRecord>(
      `/v1/application-registration-workbench/${applicationId}/patient-info`,
      {
        data: payload,
        method: 'PATCH',
      },
    );

  return normalizeRecord(response);
}

// 当前字典/参考选项仍由本地适配层提供，页面只依赖 service 边界。
export async function listOperatingBuildingOptions(): Promise<
  OperatingBuildingOption[]
> {
  if (USE_APPLICATION_REGISTRATION_WORKBENCH_MOCK) {
    return listOperatingBuildingOptionsMock();
  }
  if (!operatingOptionsPromise) {
    operatingOptionsPromise = requestClient
      .get<OperatingOptionsResponse>(
        '/v1/application-registration-workbench/operating-options',
      )
      .then((response) =>
        normalizeOperatingBuildingOptions(response.buildings ?? []),
      )
      .catch((error) => {
        operatingOptionsPromise = null;
        throw error;
      });
  }
  return operatingOptionsPromise;
}

export async function listOperatingRoomOptions(
  buildingId: string,
): Promise<OperatingRoomOption[]> {
  if (USE_APPLICATION_REGISTRATION_WORKBENCH_MOCK) {
    return listOperatingRoomOptionsMock(buildingId);
  }
  const normalizedBuildingId = buildingId.trim();
  if (!normalizedBuildingId) {
    return [];
  }
  const buildingOptions = await listOperatingBuildingOptions();
  return (
    buildingOptions.find((item) => item.buildingId === normalizedBuildingId)
      ?.operatingRooms ?? []
  );
}

export async function listSpecimenDictionaryGroups(
  keyword = '',
): Promise<SpecimenDictionaryGroup[]> {
  const groups = await listSpecimenDictionaryGroupsMock(keyword);
  return groups.filter(isPresent).map((group) => ({
    ...group,
    subParts: group.subParts.filter(isPresent),
  }));
}

export async function listSpecimenDictionaryEntryOptions(
  keyword = '',
): Promise<SpecimenDictionaryEntryOption[]> {
  return listSpecimenDictionaryEntryOptionsMock(keyword);
}

export async function listCommonSpecimenOptions(): Promise<
  SpecimenDictionaryEntryOption[]
> {
  return listCommonSpecimenOptionsMock();
}

export async function listSpecimenPackageOptions(
  keyword = '',
  departmentName = '',
): Promise<SpecimenPackageOption[]> {
  return listSpecimenPackageOptionsMock(keyword, departmentName);
}
