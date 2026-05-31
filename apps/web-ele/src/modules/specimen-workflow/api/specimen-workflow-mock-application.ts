import type {
  ApplicationCreateRequest,
  ApplicationCreateResult,
  ApplicationDetailView,
  ApplicationListQuery,
  ApplicationPage,
  ApplicationUpdateRequest,
  DuplicateApplicationCheckQuery,
  DuplicateApplicationCheckResult,
  ImportClinicalApplicationRequest,
  TrackingQueryView,
} from '../types/specimen-workflow';

import {
  compareNullableDateDesc,
  createNumericId,
  createTimestamp,
  includesText,
  normalizeText,
  paginateItems,
  withinDateRange,
} from '../utils/mock-support';
import {
  getApplicationById,
  getMockState,
  mapApplicationListItem,
  mapApplicationTrackingView,
  resolveApplicationForLookup,
  resolveApplicationOperationState,
  resolveSpecimenByIdentifier,
} from './specimen-workflow-mock-core';

function isPresent<T>(value: null | T | undefined): value is T {
  return value !== null && value !== undefined;
}

export async function createApplicationMock(
  data: ApplicationCreateRequest,
): Promise<ApplicationCreateResult> {
  const now = createTimestamp();
  const applicationId = createNumericId(
    'APP',
    getMockState().applications.map((item) => item.id),
  );
  const applicationNo =
    normalizeText(data.applicationNo) ||
    `M2-${now.slice(0, 10).replaceAll('-', '')}-${String(getMockState().applications.length + 1).padStart(3, '0')}`;
  getMockState().applications.unshift({
    abnormalFlag: false,
    applicationDate: data.applicationDate ?? now.slice(0, 10),
    applicationFormStatus: data.applicationFormStatus ?? 'NOT_UPLOADED',
    applicationNo,
    applicationType: data.applicationType,
    clinicalDiagnosis: data.clinicalDiagnosis,
    clinicalSymptom: data.clinicalSymptom ?? null,
    createdAt: now,
    currentNode: 'SUBMITTED',
    deletable: true,
    editable: true,
    externalOrderNo: data.externalOrderNo ?? null,
    fixationCompletedAt: null,
    id: applicationId,
    operationDisabledReason: null,
    patientAge: data.patientAge ?? null,
    patientGender: data.patientGender ?? null,
    patientId: data.patientId ?? null,
    patientCheckStatus: 'UNKNOWN',
    patientName: data.patientName ?? null,
    remarks: data.remarks ?? null,
    reportIssued: false,
    reportStatus: null,
    sourceHospitalId: data.sourceHospitalId ?? null,
    sourceHospitalName: data.sourceHospitalName ?? null,
    specimenConfirmedAt: null,
    specimenRemovalTime: data.specimenRemovalTime ?? null,
    specimenSite: data.specimenSite ?? null,
    status: data.status ?? 'SUBMITTED',
    submissionDate: data.submissionDate ?? now.slice(0, 10),
    submittingDepartmentId: data.submittingDepartmentId ?? null,
    submittingDepartmentName: data.submittingDepartmentName ?? null,
    submittingDoctorName: data.submittingDoctorName ?? null,
    submittingDoctorUserId: data.submittingDoctorUserId ?? null,
    thirdPartySource: data.thirdPartySource ?? null,
    unreceivedCount: 0,
    updatedAt: now,
    voided: false,
  });

  return { id: applicationId };
}

export async function updateApplicationMock(
  applicationId: string,
  data: ApplicationUpdateRequest,
): Promise<ApplicationCreateResult> {
  const application = getApplicationById(applicationId);
  const operationState = resolveApplicationOperationState(application);
  if (!operationState.editable) {
    throw new Error(
      operationState.operationDisabledReason ?? '申请单当前状态不可编辑',
    );
  }
  const applicationNo =
    normalizeText(data.applicationNo) || application.applicationNo;
  const conflict = getMockState().applications.find(
    (item) =>
      item.id !== application.id &&
      item.status !== 'VOIDED' &&
      item.applicationNo === applicationNo,
  );
  if (conflict) {
    throw new Error('申请单号已存在');
  }
  Object.assign(application, {
    applicationDate: data.applicationDate ?? application.applicationDate,
    applicationFormStatus:
      data.applicationFormStatus ?? application.applicationFormStatus,
    applicationNo,
    applicationType: data.applicationType,
    clinicalDiagnosis: data.clinicalDiagnosis,
    clinicalSymptom: data.clinicalSymptom ?? null,
    externalOrderNo: data.externalOrderNo ?? null,
    patientAge: data.patientAge ?? null,
    patientGender: data.patientGender ?? null,
    patientId: data.patientId ?? null,
    patientName: data.patientName ?? null,
    remarks: data.remarks ?? null,
    sourceHospitalId: data.sourceHospitalId ?? null,
    sourceHospitalName: data.sourceHospitalName ?? null,
    specimenRemovalTime: data.specimenRemovalTime ?? null,
    specimenSite: data.specimenSite ?? null,
    submissionDate: data.submissionDate ?? application.submissionDate,
    submittingDepartmentId: data.submittingDepartmentId ?? null,
    submittingDepartmentName: data.submittingDepartmentName ?? null,
    submittingDoctorName: data.submittingDoctorName ?? null,
    submittingDoctorUserId: data.submittingDoctorUserId ?? null,
    thirdPartySource: data.thirdPartySource ?? null,
    updatedAt: createTimestamp(),
  });
  return { id: application.id };
}

export async function deleteApplicationMock(
  applicationId: string,
): Promise<ApplicationCreateResult> {
  const application = getApplicationById(applicationId);
  const operationState = resolveApplicationOperationState(application);
  if (!operationState.deletable) {
    throw new Error(
      operationState.operationDisabledReason ?? '申请单当前状态不可作废',
    );
  }
  application.status = 'VOIDED';
  application.currentNode = 'VOIDED';
  application.updatedAt = createTimestamp();
  getMockState().specimens = getMockState().specimens.filter(
    (item) => item.applicationId !== application.id,
  );
  getMockState().registrationBatches =
    getMockState().registrationBatches.filter(
      (item) => item.applicationId !== application.id,
    );
  getMockState().workflowEvents = getMockState().workflowEvents.filter(
    (item) => item.applicationId !== application.id,
  );
  return { id: application.id };
}

export async function listApplicationsMock(
  params: ApplicationListQuery,
): Promise<ApplicationPage> {
  const formStatus = normalizeText(params.applicationFormStatus);
  const filtered = getMockState()
    .applications.filter(
      (item) =>
        (formStatus === 'VOIDED'
          ? item.status === 'VOIDED'
          : item.status !== 'VOIDED' &&
            (!formStatus || item.applicationFormStatus === formStatus)) &&
        (!normalizeText(params.applicationType) ||
          item.applicationType === params.applicationType) &&
        includesText(item.applicationNo, params.applicationNo) &&
        includesText(item.patientName, params.patientName) &&
        (!normalizeText(params.submittingDepartmentId) ||
          item.submittingDepartmentId === params.submittingDepartmentId) &&
        withinDateRange(item.applicationDate, params.dateFrom, params.dateTo),
    )
    .toSorted((left, right) =>
      compareNullableDateDesc(left.updatedAt, right.updatedAt),
    )
    .map((item) => mapApplicationListItem(item));

  return paginateItems(filtered, params.page, params.size);
}

export async function duplicateCheckApplicationsMock(
  params: DuplicateApplicationCheckQuery,
): Promise<DuplicateApplicationCheckResult> {
  const items = getMockState()
    .applications.filter((application) => application.status !== 'VOIDED')
    .map((application) => {
      const matchedBy = [
        params.externalOrderNo &&
        normalizeText(application.externalOrderNo) ===
          normalizeText(params.externalOrderNo)
          ? 'externalOrderNo'
          : '',
        params.patientId &&
        normalizeText(application.patientId) === normalizeText(params.patientId)
          ? 'patientId'
          : '',
        params.patientName &&
        normalizeText(application.patientName) ===
          normalizeText(params.patientName)
          ? 'patientName'
          : '',
        params.specimenSite &&
        normalizeText(application.specimenSite) ===
          normalizeText(params.specimenSite)
          ? 'specimenSite'
          : '',
        params.applicationDate &&
        normalizeText(application.applicationDate) ===
          normalizeText(params.applicationDate)
          ? 'applicationDate'
          : '',
        params.applicationType &&
        normalizeText(application.applicationType) ===
          normalizeText(params.applicationType)
          ? 'applicationType'
          : '',
      ].filter(isPresent);

      if (matchedBy.length === 0) {
        return null;
      }

      return {
        applicationDate: application.applicationDate,
        applicationNo: application.applicationNo,
        currentNode: application.currentNode,
        id: application.id,
        matchedBy,
        patientName: application.patientName,
        specimenSite: application.specimenSite,
        status: application.status,
      };
    })
    .filter(isPresent);

  let suggestedAction: 'ALLOW' | 'BLOCK' | 'CONFIRM';
  if (items.length === 0) {
    suggestedAction = 'ALLOW';
  } else if (items.length === 1) {
    suggestedAction = 'CONFIRM';
  } else {
    suggestedAction = 'BLOCK';
  }

  return {
    items,
    suggestedAction,
  };
}

export async function importClinicalApplicationMock(
  data: ImportClinicalApplicationRequest,
): Promise<ApplicationCreateResult> {
  return createApplicationMock({
    applicationType: 'ROUTINE',
    clinicalDiagnosis: 'HIS 导入申请',
    externalOrderNo: data.externalOrderNo,
    patientName: '导入患者',
    sourceHospitalName: data.thirdPartySource,
    specimenSite: '待补充',
    submittingDepartmentId: 'DEP-IMPORT',
    submittingDepartmentName: '导入科室',
    submittingDoctorName: '导入医生',
    submittingDoctorUserId: 'DOC-IMPORT',
    thirdPartySource: data.thirdPartySource,
  });
}

export async function getApplicationDetailMock(
  applicationId: string,
): Promise<ApplicationDetailView> {
  return mapApplicationTrackingView(getApplicationById(applicationId));
}

export async function getApplicationTrackingMock(
  applicationId: string,
): Promise<TrackingQueryView> {
  return mapApplicationTrackingView(getApplicationById(applicationId));
}

export async function getApplicationTrackingByApplicationNoMock(
  applicationNo: string,
): Promise<TrackingQueryView> {
  const application = resolveApplicationForLookup(applicationNo);
  return getApplicationTrackingMock(application.id);
}

export async function getSpecimenTrackingByBarcodeMock(
  barcode: string,
): Promise<TrackingQueryView> {
  const specimen = resolveSpecimenByIdentifier(barcode);
  return getApplicationTrackingMock(specimen.applicationId);
}
