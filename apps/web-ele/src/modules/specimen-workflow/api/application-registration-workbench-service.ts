import type {
  ApplicationRegistrationWorkbenchRecord,
  SaveApplicationRegistrationWorkbenchRequest,
  WorkbenchLookupQuery,
} from '../types/application-registration-workbench';

import { requestClient } from '#/api/request';

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
        lactation:
          record.gynecologyInfo?.specialConditions?.lactation ?? false,
        menopause:
          record.gynecologyInfo?.specialConditions?.menopause ?? false,
        other: record.gynecologyInfo?.specialConditions?.other ?? '',
        pregnancy:
          record.gynecologyInfo?.specialConditions?.pregnancy ?? false,
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
      surgeryName: record.surgeryInfo?.surgeryName ?? '',
    },
  };
}

export async function lookupApplicationRegistrationWorkbenchRecord(
  query: WorkbenchLookupQuery,
) {
  try {
    const response = await requestClient.get<ApplicationRegistrationWorkbenchRecord>(
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
    const status = (error as { response?: { status?: number } }).response?.status;
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
  const response = await requestClient.post<ApplicationRegistrationWorkbenchRecord>(
    `/v1/application-registration-workbench/${applicationId}/save`,
    payload,
  );

  return normalizeRecord(response);
}
