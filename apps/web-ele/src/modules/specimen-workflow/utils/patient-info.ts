import type { ApplicationRegistrationWorkbenchRecord } from '../types/application-registration-workbench';
import type { ApplicationDetailView, SpecimenManagementListItem } from '../types/specimen-workflow';

export type PatientInfoSourceContext = {
  applicationDetail?: ApplicationDetailView | null;
  patientGender?: null | string;
  patientId?: null | string;
  workbenchRecord?: ApplicationRegistrationWorkbenchRecord | null;
};

export type ResolvedWorkflowPatientInfo = {
  inpatientNo: string;
  patientGenderLabel: string;
  patientIdLabel: string;
  wardName: string;
};

export function normalizePatientInfoText(value?: null | string) {
  return value?.trim() ?? '';
}

export function normalizePatientGenderLabel(value?: null | string) {
  const normalizedValue = value?.trim().toUpperCase();
  if (normalizedValue === 'F' || normalizedValue === '女') {
    return '女';
  }
  if (normalizedValue === 'M' || normalizedValue === '男') {
    return '男';
  }
  return value?.trim() ?? '';
}

export function resolvePatientIdLabel(
  row: Pick<SpecimenManagementListItem, 'patientId'>,
  context: PatientInfoSourceContext,
) {
  return (
    normalizePatientInfoText(context.workbenchRecord?.patientInfo.idNo) ||
    normalizePatientInfoText(context.applicationDetail?.patientId) ||
    normalizePatientInfoText(context.patientId) ||
    normalizePatientInfoText(row.patientId)
  );
}

export function resolveInpatientNoLabel(
  row: Pick<SpecimenManagementListItem, 'inpatientNo'>,
  context: PatientInfoSourceContext,
) {
  return (
    normalizePatientInfoText(row.inpatientNo) ||
    normalizePatientInfoText(context.workbenchRecord?.patientInfo.inpatientNo)
  );
}

export function resolveWardNameLabel(context: PatientInfoSourceContext) {
  return normalizePatientInfoText(context.workbenchRecord?.patientInfo.wardName);
}

export function resolvePatientGenderDisplay(
  row: Pick<SpecimenManagementListItem, 'patientGender'>,
  context: PatientInfoSourceContext,
) {
  return normalizePatientGenderLabel(
    row.patientGender ??
      context.applicationDetail?.patientGender ??
      context.patientGender ??
      context.workbenchRecord?.patientInfo.gender,
  );
}

export function resolveWorkflowPatientInfo(
  row: Pick<SpecimenManagementListItem, 'inpatientNo' | 'patientGender' | 'patientId'>,
  context: PatientInfoSourceContext,
): ResolvedWorkflowPatientInfo {
  return {
    inpatientNo: resolveInpatientNoLabel(row, context),
    patientGenderLabel: resolvePatientGenderDisplay(row, context),
    patientIdLabel: resolvePatientIdLabel(row, context),
    wardName: resolveWardNameLabel(context),
  };
}
