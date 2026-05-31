import type {
  ApplicationCreateRequest,
  ImportClinicalApplicationRequest,
} from '../types/specimen-workflow';

export type ApplicationManageDialogTabName = 'create' | 'import';
export type ApplicationManageDialogMode = 'create' | 'edit';
export type ApplicationManageSubmitMode = 'save' | 'save-and-manage';

export function createApplicationCreateFormDefaults(): ApplicationCreateRequest {
  return {
    applicationDate: null,
    applicationNo: null,
    applicationFormStatus: 'PENDING',
    applicationType: 'ROUTINE',
    clinicalDiagnosis: '',
    clinicalSymptom: null,
    externalOrderNo: null,
    patientAge: null,
    patientGender: null,
    patientId: null,
    patientName: null,
    remarks: null,
    sourceHospitalId: null,
    sourceHospitalName: null,
    status: null,
    submissionDate: null,
    thirdPartySource: null,
  };
}

export function createImportClinicalApplicationFormDefaults(): ImportClinicalApplicationRequest {
  return {
    externalOrderNo: '',
    thirdPartySource: '',
  };
}

export function resolveInitialDialogTab(
  isEditMode: boolean,
  canCreateApplication: boolean,
): ApplicationManageDialogTabName {
  return isEditMode || canCreateApplication ? 'create' : 'import';
}

export function trimOrNull(value?: null | string) {
  const normalized = value?.trim();
  return normalized || null;
}

export function buildCreateApplicationPayload(form: ApplicationCreateRequest) {
  return {
    ...form,
    patientAge: form.patientAge?.trim() || null,
    patientGender: form.patientGender?.trim() || null,
    patientId: form.patientId?.trim() || null,
    patientName: form.patientName?.trim() || null,
    remarks: form.remarks?.trim() || null,
    sourceHospitalId: form.sourceHospitalId?.trim() || null,
    sourceHospitalName: form.sourceHospitalName?.trim() || null,
  };
}

export function buildImportClinicalApplicationPayload(
  form: ImportClinicalApplicationRequest,
) {
  return {
    externalOrderNo: form.externalOrderNo.trim(),
    thirdPartySource: form.thirdPartySource.trim(),
  };
}

export function buildDuplicateCheckRequest(form: ApplicationCreateRequest) {
  return {
    applicationDate: trimOrNull(form.applicationDate),
    applicationType: trimOrNull(form.applicationType),
    externalOrderNo: trimOrNull(form.externalOrderNo),
    patientId: trimOrNull(form.patientId),
    patientName: trimOrNull(form.patientName),
  };
}

export function validateDuplicateCheckInputs(form: ApplicationCreateRequest) {
  if (!trimOrNull(form.patientId) && !trimOrNull(form.patientName)) {
    return '请先填写患者编号或患者姓名';
  }
  if (!trimOrNull(form.externalOrderNo) && !trimOrNull(form.applicationDate)) {
    return '请至少填写外部单号或申请日期';
  }
  return '';
}
