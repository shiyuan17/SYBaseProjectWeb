import type { ApplicationRegistrationWorkbenchRecord } from '../types/application-registration-workbench';
import type {
  PendingSpecimenItem,
  SpecimenManagementListItem,
} from '../types/specimen-workflow';

import { formatDateTime, formatNullable } from './format';
import { resolveOperatingRoomDisplayName } from './operating-room-display';

export type ReceiptWorkbenchQueueStatus = 'FAILED' | 'PENDING' | 'SUCCESS';

export type ReceiptWorkbenchApplicationContext = {
  patientGender: null | string;
  patientId: null | string;
};

export type ReceiptWorkbenchRow = SpecimenManagementListItem &
  PendingSpecimenItem & {
    patientGenderLabel: string;
    patientIdLabel: string;
    queueAddedAt: string;
    queueAddedByName: string;
    queueStatus: ReceiptWorkbenchQueueStatus;
    receivedAt: null | string;
    receivedByName: string;
    surgeryName: string;
    inpatientNo: string;
  };

export const RECEIPT_WORKBENCH_MAX_QUERY_SIZE = 500;

function normalizeText(value?: null | string) {
  return value?.trim() ?? '';
}

export function normalizeGenderLabel(value?: null | string) {
  const normalizedValue = value?.trim().toUpperCase();
  if (normalizedValue === 'F' || normalizedValue === '女') {
    return '女';
  }
  if (normalizedValue === 'M' || normalizedValue === '男') {
    return '男';
  }
  return value?.trim() ?? '';
}

export function resolveReceiptWorkbenchExactMatches(
  items: SpecimenManagementListItem[],
  keyword: string,
) {
  const normalizedKeyword = normalizeText(keyword).toUpperCase();
  return items.filter((item) =>
    [item.specimenId, item.specimenNo, item.barcode].some(
      (value) => normalizeText(value).toUpperCase() === normalizedKeyword,
    ),
  );
}

export function createReceiptWorkbenchRow(
  specimen: SpecimenManagementListItem,
  pending: PendingSpecimenItem,
  applicationContext: ReceiptWorkbenchApplicationContext | null,
  workbenchRecord: ApplicationRegistrationWorkbenchRecord | null,
  queueAddedByName: string,
  roomNameById: ReadonlyMap<string, string> = new Map(),
): ReceiptWorkbenchRow {
  const surgeryName = resolveOperatingRoomDisplayName(
    roomNameById,
    workbenchRecord?.surgeryInfo.roomId,
    workbenchRecord?.surgeryInfo.surgeryName,
  );

  return {
    ...specimen,
    ...pending,
    inpatientNo: normalizeText(workbenchRecord?.patientInfo.inpatientNo),
    patientGenderLabel: normalizeGenderLabel(
      applicationContext?.patientGender ?? workbenchRecord?.patientInfo.gender,
    ),
    patientIdLabel: normalizeText(applicationContext?.patientId),
    queueAddedAt: new Date().toISOString(),
    queueAddedByName: normalizeText(queueAddedByName) || '-',
    queueStatus: 'PENDING',
    receivedAt: null,
    receivedByName: '',
    surgeryName,
  };
}

export function buildReceiptWorkbenchExportHeaders() {
  return [
    '序',
    '申请单',
    '标本编号',
    '姓名',
    '住院号',
    '性别',
    '手术间',
    '标本名称',
    '标本状态',
    '类型',
    '接收时间',
    '接收人',
    '添加时间',
    '添加人',
    '病人ID',
  ];
}

export function buildReceiptWorkbenchExportRows(rows: ReceiptWorkbenchRow[]) {
  return rows.map((row, index) => [
    String(index + 1),
    formatNullable(row.applicationNo),
    formatNullable(row.specimenNo),
    formatNullable(row.patientName),
    formatNullable(row.inpatientNo),
    formatNullable(row.patientGenderLabel),
    formatNullable(row.surgeryName),
    formatNullable(row.specimenName),
    resolveReceiptWorkbenchStatusLabel(row.queueStatus),
    formatNullable(row.specimenType),
    formatDateTime(row.receivedAt),
    formatNullable(row.receivedByName),
    formatDateTime(row.queueAddedAt),
    formatNullable(row.queueAddedByName),
    formatNullable(row.patientIdLabel),
  ]);
}

export function resolveReceiptWorkbenchStatusLabel(
  status: ReceiptWorkbenchQueueStatus,
) {
  if (status === 'SUCCESS') {
    return '接收';
  }
  if (status === 'FAILED') {
    return '签收失败';
  }
  return '待接收';
}

export function resolveReceiptWorkbenchStatusTagType(
  status: ReceiptWorkbenchQueueStatus,
) {
  if (status === 'SUCCESS') {
    return 'success' as const;
  }
  if (status === 'FAILED') {
    return 'danger' as const;
  }
  return 'warning' as const;
}
