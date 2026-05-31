import type { ApplicationRegistrationWorkbenchRecord } from '../types/application-registration-workbench';
import type { SpecimenManagementListItem } from '../types/specimen-workflow';

import { formatDateTime, formatNullable } from './format';

export type CachedApplicationContext = {
  patientGender: null | string;
  submittingDoctorName: string;
};

export type ConfirmationListRow = SpecimenManagementListItem & {
  inpatientNo: string;
  patientGenderLabel: string;
  registrationOperatorName: string;
  registrationTime: null | string;
  surgeryName: string;
};

export type ConfirmationEnhancementProviders = {
  ensureApplicationContext(
    applicationId: string,
  ): Promise<CachedApplicationContext | null>;
  ensureWorkbenchRecord(
    applicationNo: string,
  ): Promise<ApplicationRegistrationWorkbenchRecord | null>;
  getApplicationContext(applicationId: string): CachedApplicationContext | null;
  getWorkbenchRecord(
    applicationNo: string,
  ): ApplicationRegistrationWorkbenchRecord | null;
};

export const MAX_QUERY_SIZE = 500;
export const RECEIPT_LOCKED_STATUSES = new Set([
  'RECEIVED',
  'REJECTED',
  'RETURNED',
]);

function formatValue(value: null | string | undefined) {
  return value?.trim() ?? '';
}

export function normalizeGenderLabel(value: null | string | undefined) {
  const normalizedValue = value?.trim().toUpperCase();
  if (normalizedValue === 'F' || normalizedValue === '女') {
    return '女';
  }
  if (normalizedValue === 'M' || normalizedValue === '男') {
    return '男';
  }
  return value?.trim() ?? '';
}

export function isReceiptLocked(row: SpecimenManagementListItem) {
  return RECEIPT_LOCKED_STATUSES.has(row.specimenStatus ?? '');
}

export function isVisibleInConfirmationScene(row: SpecimenManagementListItem) {
  return (
    row.fixationStatus === 'COMPLETED' &&
    row.verificationStatus === 'VERIFIED' &&
    row.checkInStatus !== 'CHECKED_IN' &&
    !isReceiptLocked(row)
  );
}

export function canConfirm(row: ConfirmationListRow) {
  return !row.specimenConfirmedAt;
}

export function canRetryLabel(row: ConfirmationListRow) {
  return (
    Boolean(row.labelPrintBatchNo) &&
    ['FAILED', 'PENDING'].includes(row.labelPrintStatus ?? '')
  );
}

export function enhanceRow(
  row: SpecimenManagementListItem,
  applicationContext: CachedApplicationContext | null,
  workbenchRecord: ApplicationRegistrationWorkbenchRecord | null,
): ConfirmationListRow {
  return {
    ...row,
    inpatientNo: formatValue(workbenchRecord?.patientInfo.inpatientNo),
    patientGenderLabel: normalizeGenderLabel(
      applicationContext?.patientGender ?? workbenchRecord?.patientInfo.gender,
    ),
    registrationOperatorName:
      applicationContext?.submittingDoctorName ||
      formatValue(workbenchRecord?.patientInfo.applyDoctor) ||
      formatValue(workbenchRecord?.surgeryInfo.fixationPerson),
    registrationTime:
      row.registeredAt ?? workbenchRecord?.surgeryInfo.fixationTime ?? null,
    surgeryName:
      formatValue(workbenchRecord?.surgeryInfo.roomId) ||
      formatValue(workbenchRecord?.surgeryInfo.surgeryName),
  };
}

export async function buildEnhancedRows(
  items: SpecimenManagementListItem[],
  providers: ConfirmationEnhancementProviders,
) {
  const applicationNos = [
    ...new Set(items.map((item) => item.applicationNo?.trim()).filter(Boolean)),
  ];
  const applicationIds = [
    ...new Set(items.map((item) => item.applicationId?.trim()).filter(Boolean)),
  ];

  await Promise.all([
    ...applicationNos.map((applicationNo) =>
      providers.ensureWorkbenchRecord(applicationNo),
    ),
    ...applicationIds.map((applicationId) =>
      providers.ensureApplicationContext(applicationId),
    ),
  ]);

  return items.map((item) => {
    const applicationId = item.applicationId?.trim() ?? '';
    const applicationNo = item.applicationNo?.trim() ?? '';

    return enhanceRow(
      item,
      providers.getApplicationContext(applicationId) ?? null,
      providers.getWorkbenchRecord(applicationNo) ?? null,
    );
  });
}

export function buildExportHeaders() {
  return [
    '序号',
    '申请单号',
    '标本编号',
    '姓名',
    '住院号',
    '性别',
    '手术间',
    '标本名称',
    '标本状态',
    '类型',
    '确认时间',
    '确认人',
    '添加时间',
    '添加人',
  ];
}

export function buildExportRows(
  rows: ConfirmationListRow[],
  operatorName: string,
) {
  return rows.map((row, index) => [
    String(index + 1),
    row.applicationNo,
    row.specimenNo,
    formatNullable(row.patientName),
    formatNullable(row.inpatientNo),
    formatNullable(row.patientGenderLabel),
    formatNullable(row.surgeryName),
    row.specimenName,
    row.specimenConfirmedAt ? '标本确认' : '未确认',
    formatNullable(row.specimenType),
    formatDateTime(row.specimenConfirmedAt),
    formatNullable(operatorName),
    formatDateTime(row.registrationTime),
    formatNullable(row.registrationOperatorName),
  ]);
}
