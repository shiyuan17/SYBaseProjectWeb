import type { ApplicationRegistrationWorkbenchRecord } from '../types/application-registration-workbench';
import type {
  PendingSpecimenItem,
  SpecimenManagementListItem,
} from '../types/specimen-workflow';

import { formatDateTime, formatNullable } from './format';
import { resolveOperatingRoomDisplayName } from './operating-room-display';
import {
  normalizePatientGenderLabel,
  normalizePatientInfoText,
  resolveWorkflowPatientInfo,
} from './patient-info';

export type ReceiptWorkbenchDisplayStatus =
  | 'FAILED'
  | 'OUT_OF_SCOPE'
  | 'PENDING'
  | 'RECEIVED'
  | 'SUCCESS';

export type ReceiptWorkbenchApplicationContext = {
  patientGender: null | string;
  patientId: null | string;
};

export type ReceiptWorkbenchRow = Partial<PendingSpecimenItem> &
  SpecimenManagementListItem & {
    canReceive: boolean;
    inpatientNo: string;
    patientGenderLabel: string;
    patientIdLabel: string;
    queueAddedAt: string;
    queueAddedByName: string;
    queueStatus: ReceiptWorkbenchDisplayStatus;
    receivedAt: null | string;
    receivedByName: string;
    surgeryName: string;
    wardName: string;
  };

export const RECEIPT_WORKBENCH_MAX_QUERY_SIZE = 500;

const normalizeText = normalizePatientInfoText;

export const normalizeGenderLabel = normalizePatientGenderLabel;

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

function resolveHistoricalReceiptStatus(specimen: SpecimenManagementListItem) {
  const receiptStatus =
    (
      specimen as SpecimenManagementListItem & {
        receiptStatus?: null | string;
      }
    ).receiptStatus ?? null;
  if (normalizeText(receiptStatus)) {
    return receiptStatus;
  }

  return normalizeText(specimen.specimenStatus).toUpperCase() === 'RECEIVED'
    ? 'RECEIVED'
    : null;
}

function resolveReceiptWorkbenchQueueStatus(
  specimen: SpecimenManagementListItem,
  pending?: null | PendingSpecimenItem,
): ReceiptWorkbenchDisplayStatus {
  if (pending?.transportOrderId?.trim()) {
    return 'PENDING';
  }

  return resolveHistoricalReceiptStatus(specimen)?.trim().toUpperCase() ===
    'RECEIVED'
    ? 'RECEIVED'
    : 'OUT_OF_SCOPE';
}

export function createReceiptWorkbenchRow(
  specimen: SpecimenManagementListItem,
  pending: null | PendingSpecimenItem,
  applicationContext: null | ReceiptWorkbenchApplicationContext,
  workbenchRecord: ApplicationRegistrationWorkbenchRecord | null,
  queueAddedByName: string,
  roomNameById: ReadonlyMap<string, string> = new Map(),
): ReceiptWorkbenchRow {
  const queueStatus = resolveReceiptWorkbenchQueueStatus(specimen, pending);
  const surgeryName = resolveOperatingRoomDisplayName(
    roomNameById,
    workbenchRecord?.surgeryInfo.roomId,
    workbenchRecord?.surgeryInfo.surgeryName,
  );
  const patientInfo = resolveWorkflowPatientInfo(specimen, {
    patientGender: applicationContext?.patientGender ?? null,
    patientId: applicationContext?.patientId ?? null,
    workbenchRecord,
  });

  return {
    abnormalFlag: pending?.abnormalFlag ?? specimen.abnormalFlag,
    abnormalType: pending?.abnormalType ?? specimen.abnormalType ?? null,
    applicationId: specimen.applicationId,
    applicationNo: specimen.applicationNo,
    barcode: specimen.barcode ?? pending?.barcode ?? '',
    batchAbnormalFlag: pending?.batchAbnormalFlag ?? false,
    canReceive: queueStatus === 'PENDING',
    checkInStatus: pending?.checkInStatus ?? specimen.checkInStatus ?? null,
    checkedInAt: pending?.checkedInAt ?? specimen.checkedInAt ?? null,
    checkedInByName:
      pending?.checkedInByName ?? specimen.checkedInByName ?? null,
    containerCount: pending?.containerCount ?? specimen.containerCount,
    containerName: pending?.containerName ?? specimen.containerName,
    fixationCompletedAt:
      pending?.fixationCompletedAt ?? specimen.fixationCompletedAt ?? null,
    fixationLiquidType:
      pending?.fixationLiquidType ?? specimen.fixationLiquidType ?? null,
    fixationOperatorName:
      pending?.fixationOperatorName ?? specimen.fixationOperatorName ?? null,
    fixationOperatorUserId:
      pending?.fixationOperatorUserId ??
      specimen.fixationOperatorUserId ??
      null,
    fixationStartedAt:
      pending?.fixationStartedAt ?? specimen.fixationStartedAt ?? null,
    fixationStatus: pending?.fixationStatus ?? specimen.fixationStatus,
    inpatientNo: patientInfo.inpatientNo,
    labelPrintBatchNo: specimen.labelPrintBatchNo,
    labelPrintStatus: specimen.labelPrintStatus,
    latestTrackingAt:
      pending?.latestTrackingAt ?? specimen.latestTrackingAt ?? null,
    patientGenderLabel: patientInfo.patientGenderLabel,
    patientIdLabel: patientInfo.patientIdLabel,
    patientName: pending?.patientName ?? specimen.patientName,
    queueAddedAt: new Date().toISOString(),
    queueAddedByName: normalizeText(queueAddedByName) || '-',
    queueStatus,
    receivedAt: null,
    receivedByName: '',
    recentNode: specimen.recentNode ?? null,
    registeredAt: pending?.registeredAt ?? specimen.registeredAt,
    registrationOperatorName: specimen.registrationOperatorName ?? null,
    reminderCount: pending?.reminderCount ?? 0,
    roomId: specimen.roomId ?? null,
    specimenConfirmedAt: specimen.specimenConfirmedAt ?? null,
    specimenConfirmedByName: specimen.specimenConfirmedByName ?? null,
    specimenConfirmedByUserId: specimen.specimenConfirmedByUserId ?? null,
    specimenCount: specimen.specimenCount,
    specimenId: specimen.specimenId,
    specimenName: specimen.specimenName,
    specimenNo: specimen.specimenNo,
    specimenRemovalAt: specimen.specimenRemovalAt ?? null,
    specimenSite: specimen.specimenSite,
    specimenStatus: pending?.specimenStatus ?? specimen.specimenStatus,
    specimenType: specimen.specimenType,
    submittingDepartmentId:
      pending?.submittingDepartmentId ?? specimen.submittingDepartmentId,
    submittingDepartmentName:
      pending?.submittingDepartmentName ?? specimen.submittingDepartmentName,
    surgeryName,
    transportOrderId: pending?.transportOrderId ?? null,
    unreceivedCount: pending?.unreceivedCount ?? 0,
    verificationCompletedAt:
      pending?.verificationCompletedAt ??
      specimen.verificationCompletedAt ??
      null,
    verificationStartedAt:
      pending?.verificationStartedAt ?? specimen.verificationStartedAt ?? null,
    verificationStatus:
      pending?.verificationStatus ?? specimen.verificationStatus ?? null,
    wardName: patientInfo.wardName,
  };
}

export function isReceiptWorkbenchRowReceivable(row: ReceiptWorkbenchRow) {
  const normalizedStatus = row.specimenStatus?.trim().toUpperCase();
  if (normalizedStatus === 'REJECTED') {
    return row.canReceive;
  }
  return row.canReceive && row.queueStatus !== 'SUCCESS';
}

export function buildReceiptWorkbenchExportHeaders() {
  return [
    '序',
    '申请单',
    '标本编号',
    '姓名',
    '住院号',
    '病区',
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
    formatNullable(row.wardName),
    formatNullable(row.patientGenderLabel),
    formatNullable(row.surgeryName),
    formatNullable(row.specimenName),
    resolveSpecimenStatusLabel(row.specimenStatus),
    formatNullable(row.specimenType),
    formatDateTime(row.receivedAt),
    formatNullable(row.receivedByName),
    formatDateTime(row.queueAddedAt),
    formatNullable(row.queueAddedByName),
    formatNullable(row.patientIdLabel),
  ]);
}

export function resolveReceiptWorkbenchStatusLabel(
  status: ReceiptWorkbenchDisplayStatus,
) {
  if (status === 'SUCCESS') {
    return '接收';
  }
  if (status === 'RECEIVED') {
    return '已接收';
  }
  if (status === 'FAILED') {
    return '签收失败';
  }
  if (status === 'OUT_OF_SCOPE') {
    return '不在待签收范围';
  }
  return '待签收';
}

export function resolveReceiptWorkbenchStatusTagType(
  status: ReceiptWorkbenchDisplayStatus,
  specimenStatus?: null | string,
) {
  const normalizedSpecimenStatus = (specimenStatus ?? '').trim().toUpperCase();
  if (normalizedSpecimenStatus === 'REJECTED') {
    return 'danger' as const;
  }
  if (normalizedSpecimenStatus === 'RETURNED') {
    return 'warning' as const;
  }
  if (status === 'SUCCESS') {
    return 'success' as const;
  }
  if (status === 'RECEIVED') {
    return 'info' as const;
  }
  if (status === 'FAILED') {
    return 'danger' as const;
  }
  if (status === 'OUT_OF_SCOPE') {
    return undefined;
  }
  return 'warning' as const;
}

export function resolveSpecimenStatusLabel(status: null | string) {
  const normalizedStatus = (status ?? '').trim().toUpperCase();
  if (normalizedStatus === 'REGISTERED') {
    return '已登记';
  }
  if (normalizedStatus === 'FIXING') {
    return '固定中';
  }
  if (normalizedStatus === 'FIXED') {
    return '固定完成';
  }
  if (normalizedStatus === 'IN_TRANSIT') {
    return '转运中';
  }
  if (normalizedStatus === 'RECEIVED') {
    return '已接收';
  }
  if (normalizedStatus === 'REJECTED') {
    return '已拒收';
  }
  if (normalizedStatus === 'RETURNED') {
    return '已退回';
  }
  return status ?? '-';
}
