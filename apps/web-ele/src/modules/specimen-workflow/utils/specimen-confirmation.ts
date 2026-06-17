import type { ApplicationRegistrationWorkbenchRecord } from '../types/application-registration-workbench';
import type { SpecimenManagementListItem } from '../types/specimen-workflow';

import { formatDateTime, formatNullable } from './format';
import { resolveOperatingRoomDisplayName } from './operating-room-display';
import {
  normalizePatientGenderLabel,
  normalizePatientInfoText,
  resolveWorkflowPatientInfo,
} from './patient-info';

export type CachedApplicationContext = {
  patientId?: null | string;
  patientGender: null | string;
  submittingDoctorName: string;
};

export type ConfirmationListRow = SpecimenManagementListItem & {
  actionDisabledReason: null | string;
  inpatientNo: string;
  patientGenderLabel: string;
  patientIdLabel: string;
  registrationOperatorName: string;
  registrationTime: null | string;
  sceneMatched: boolean;
  surgeryName: string;
  wardName: string;
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

const formatValue = normalizePatientInfoText;
const normalizeText = normalizePatientInfoText;
export const normalizeGenderLabel = normalizePatientGenderLabel;

export function isReceiptLocked(row: SpecimenManagementListItem) {
  return RECEIPT_LOCKED_STATUSES.has(row.specimenStatus ?? '');
}

export function isVisibleInConfirmationScene(row: SpecimenManagementListItem) {
  return resolveConfirmationSceneMismatchReason(row) === null;
}

export function resolveConfirmationSceneMismatchReason(
  row: SpecimenManagementListItem,
) {
  if (normalizeText(row.fixationStatus) === 'COMPLETED') {
    if (normalizeText(row.verificationStatus) === 'VERIFIED') {
      if (normalizeText(row.checkInStatus) === 'CHECKED_IN') {
        return '标本已完成入库，无需重复确认';
      }

      return isReceiptLocked(row)
        ? '标本已接收、拒收或退回，不能进行标本确认'
        : null;
    }

    return '标本尚未完成核对，不能进行标本确认';
  }

  return '标本尚未完成固定，不能进行标本确认';
}

export function canConfirm(row: ConfirmationListRow) {
  return resolveConfirmActionDisabledReason(row) === null;
}

export function resolveConfirmActionDisabledReason(
  row: ConfirmationListRow | SpecimenManagementListItem,
) {
  if (row.specimenConfirmedAt) {
    return '标本已确认';
  }

  return resolveConfirmationSceneMismatchReason(row);
}

export function canRetryLabel(row: ConfirmationListRow) {
  return (
    Boolean(row.labelPrintBatchNo) &&
    ['FAILED', 'PENDING'].includes(row.labelPrintStatus ?? '')
  );
}

export function resolveExactMatches(
  items: SpecimenManagementListItem[],
  keyword: string,
) {
  const normalizedKeyword = normalizeText(keyword).toLowerCase();
  return items.filter((item) =>
    [item.specimenId, item.specimenNo, item.barcode].some(
      (value) => normalizeText(value).toLowerCase() === normalizedKeyword,
    ),
  );
}

export function resolveUnavailableMessage(
  items: SpecimenManagementListItem[],
  keyword: string,
) {
  const exactMatches = resolveExactMatches(items, keyword);
  const targetItems = exactMatches.length > 0 ? exactMatches : items;
  const mismatchItem = targetItems.find((item) =>
    resolveConfirmationSceneMismatchReason(item),
  );

  if (mismatchItem) {
    return (
      resolveConfirmationSceneMismatchReason(mismatchItem) ??
      '未找到可确认的标本'
    );
  }

  return '未找到可确认的标本';
}

export function enhanceRow(
  row: SpecimenManagementListItem,
  applicationContext: CachedApplicationContext | null,
  workbenchRecord: ApplicationRegistrationWorkbenchRecord | null,
  roomNameById: ReadonlyMap<string, string> = new Map(),
): ConfirmationListRow {
  const sceneMismatchReason = resolveConfirmationSceneMismatchReason(row);
  const patientInfo = resolveWorkflowPatientInfo(row, {
    patientGender: applicationContext?.patientGender ?? null,
    patientId: applicationContext?.patientId ?? null,
    workbenchRecord,
  });
  return {
    ...row,
    actionDisabledReason: resolveConfirmActionDisabledReason(row),
    inpatientNo: patientInfo.inpatientNo,
    patientGenderLabel: patientInfo.patientGenderLabel,
    patientIdLabel: patientInfo.patientIdLabel,
    registrationOperatorName:
      applicationContext?.submittingDoctorName ||
      formatValue(workbenchRecord?.patientInfo.applyDoctor) ||
      formatValue(workbenchRecord?.surgeryInfo.fixationPerson),
    registrationTime:
      row.registeredAt ?? workbenchRecord?.surgeryInfo.fixationTime ?? null,
    sceneMatched: sceneMismatchReason === null,
    surgeryName: resolveOperatingRoomDisplayName(
      roomNameById,
      workbenchRecord?.surgeryInfo.roomId,
      workbenchRecord?.surgeryInfo.surgeryName,
    ),
    wardName: patientInfo.wardName,
  };
}

export async function buildEnhancedRows(
  items: SpecimenManagementListItem[],
  providers: ConfirmationEnhancementProviders,
  roomNameById: ReadonlyMap<string, string> = new Map(),
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
      roomNameById,
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
    '病区',
    '性别',
    '手术间',
    '标本名称',
    '标本状态',
    '类型',
    '确认时间',
    '确认人',
    '添加时间',
    '添加人',
    '病人ID',
  ];
}

export function buildExportRows(rows: ConfirmationListRow[]) {
  return rows.map((row, index) => [
    String(index + 1),
    row.applicationNo,
    row.specimenNo,
    formatNullable(row.patientName),
    formatNullable(row.inpatientNo),
    formatNullable(row.wardName),
    formatNullable(row.patientGenderLabel),
    formatNullable(row.surgeryName),
    row.specimenName,
    row.specimenConfirmedAt ? '标本确认' : '未确认',
    formatNullable(row.specimenType),
    formatDateTime(row.specimenConfirmedAt),
    formatNullable(row.specimenConfirmedByName),
    formatDateTime(row.registrationTime),
    formatNullable(row.registrationOperatorName),
    formatNullable(row.patientIdLabel),
  ]);
}
