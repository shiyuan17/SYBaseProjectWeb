import type { ApplicationRegistrationWorkbenchRecord } from '../types/application-registration-workbench';
import type { SpecimenManagementListItem } from '../types/specimen-workflow';

import { formatDateTime, formatFixationStatus, formatNullable } from './format';
import { resolveOperatingRoomDisplayName } from './operating-room-display';

export type CachedApplicationContext = {
  patientGender: null | string;
  patientId: null | string;
  specimenRemovalTime: null | string;
};

export type FixationWorkbenchRow = SpecimenManagementListItem & {
  fixationOperatorName: string;
  fixationTime: null | string;
  inpatientNo: string;
  patientGenderLabel: string;
  patientIdLabel: string;
  queueAddedAt: string;
  queueAddedByName: string;
  surgeryName: string;
};

export type FixationQueueContext = {
  queueAddedAt: string;
  queueAddedByName: string;
};

export type FixationLiquidOption = {
  label: string;
  value: string;
};

export type FixationExportDependencies = {
  getSpecimenRemovalTime(applicationId: string): null | string;
  resolveFixationLiquidLabel(value: null | string | undefined): string;
};

export const MAX_QUERY_SIZE = 100;
export const DEFAULT_FIXATION_LIQUID_TYPE = 'FORMALIN';

const RECEIPT_LOCKED_STATUSES = new Set(['RECEIVED', 'REJECTED', 'RETURNED']);

export function normalizeText(value?: null | string) {
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

export function resolveFixationTagType(status: null | string | undefined) {
  if (status === 'COMPLETED') {
    return 'success';
  }
  if (status === 'FIXING') {
    return 'warning';
  }
  return 'info';
}

export function resolveFixationLiquidLabel(
  value: null | string | undefined,
  options: FixationLiquidOption[],
) {
  const normalizedValue = normalizeText(value);
  if (!normalizedValue) {
    return '-';
  }
  const option = options.find(
    (item) => item.value === normalizedValue || item.label === normalizedValue,
  );
  return option?.label ?? normalizedValue;
}

export function isReceiptLocked(row: SpecimenManagementListItem) {
  return RECEIPT_LOCKED_STATUSES.has(row.specimenStatus ?? '');
}

export function isVisibleInFixationScene(row: SpecimenManagementListItem) {
  return (
    row.verificationStatus === 'VERIFIED' &&
    !isReceiptLocked(row) &&
    row.fixationStatus !== 'COMPLETED' &&
    row.specimenStatus !== 'FIXED'
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
  if (
    targetItems.some(
      (item) => normalizeText(item.verificationStatus) !== 'VERIFIED',
    )
  ) {
    return '标本尚未完成离体确认，请先完成离体确认后再固定';
  }
  if (targetItems.some((item) => isReceiptLocked(item))) {
    return '标本已接收、拒收或退回，不能完成固定';
  }
  if (
    targetItems.some(
      (item) =>
        item.fixationStatus === 'COMPLETED' || item.specimenStatus === 'FIXED',
    )
  ) {
    return '标本已完成固定，无需重复操作';
  }
  return '未找到可固定的标本';
}

export function buildQueueRow(
  row: SpecimenManagementListItem,
  applicationContext: CachedApplicationContext | null,
  workbenchRecord: ApplicationRegistrationWorkbenchRecord | null,
  queueContext: FixationQueueContext,
  roomNameById: ReadonlyMap<string, string> = new Map(),
): FixationWorkbenchRow {
  return {
    ...row,
    fixationOperatorName:
      normalizeText(row.fixationOperatorName) ||
      normalizeText(workbenchRecord?.surgeryInfo.fixationPerson),
    fixationTime: row.fixationCompletedAt ?? row.fixationStartedAt ?? null,
    inpatientNo: normalizeText(workbenchRecord?.patientInfo.inpatientNo),
    patientGenderLabel: normalizeGenderLabel(
      applicationContext?.patientGender ?? workbenchRecord?.patientInfo.gender,
    ),
    patientIdLabel: normalizeText(applicationContext?.patientId),
    queueAddedAt: queueContext.queueAddedAt,
    queueAddedByName: normalizeText(queueContext.queueAddedByName) || '-',
    surgeryName: resolveOperatingRoomDisplayName(
      roomNameById,
      workbenchRecord?.surgeryInfo.roomId,
      workbenchRecord?.surgeryInfo.surgeryName,
    ),
  };
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
    '离体时间',
    '固定时间',
    '固定人',
    '固定液类型',
    '添加时间',
    '添加人',
    '病人ID',
  ];
}

export function buildExportRows(
  rows: FixationWorkbenchRow[],
  dependencies: FixationExportDependencies,
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
    formatFixationStatus(row.fixationStatus),
    formatNullable(row.specimenType),
    formatDateTime(
      dependencies.getSpecimenRemovalTime(normalizeText(row.applicationId)),
    ),
    formatDateTime(row.fixationTime),
    formatNullable(row.fixationOperatorName),
    dependencies.resolveFixationLiquidLabel(row.fixationLiquidType),
    formatDateTime(row.queueAddedAt),
    formatNullable(row.queueAddedByName),
    formatNullable(row.patientIdLabel),
  ]);
}
