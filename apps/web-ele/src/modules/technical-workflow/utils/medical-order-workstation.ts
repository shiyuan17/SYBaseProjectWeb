import type { PendingMedicalOrderItem } from '../../doctor-workflow/types/doctor-workflow';
import type {
  TechnicalWorkbenchDataSource,
  TechnicalWorkbenchDataSourceQuery,
  TechnicalWorkbenchRow,
} from '../types/technical-workbench';

import { listPendingMedicalOrders } from '../../doctor-workflow/api/doctor-workflow-service';

export type MedicalOrderWorkstationKind =
  | 'cytology'
  | 'ihc'
  | 'liquid-cytology'
  | 'routine'
  | 'special';

export const TECHNICAL_ORDER_CATEGORY_CODES = {
  cytology: 'CYTOLOGY',
  ihc: 'IHC',
  liquidCytology: 'LIQUID_CYTOLOGY',
  routine: 'ROUTINE,EXAM,CGRS,BLOCK,QP',
  special: 'TSRS',
} as const;

const EMPTY_CELL = '-';

function valueOrDash(value?: null | number | string) {
  if (typeof value === 'number') {
    return value;
  }
  const normalizedValue = value?.trim();
  return normalizedValue || EMPTY_CELL;
}

function formatOrderDate(value?: null | string) {
  const normalizedValue = value?.trim();
  if (!normalizedValue) {
    return EMPTY_CELL;
  }
  const [datePart = '', timePart = ''] = normalizedValue
    .replace('T', ' ')
    .split(' ');
  const normalizedTimePart =
    timePart.match(/^\d{2}:\d{2}(?::\d{2})?/)?.[0] ?? '';
  if (!datePart || !normalizedTimePart) {
    return normalizedValue;
  }
  return `${datePart} ${normalizedTimePart.slice(0, 8).padEnd(8, ':00')}`;
}

function formatOrderStatus(value?: null | string) {
  const labels: Record<string, string> = {
    ACCEPTED: '已接收',
    CANCELLED: '已取消',
    COMPLETED: '已完成',
    FAILED: '执行失败',
    IN_PROGRESS: '已确认',
    PENDING: '待确认',
    PROCESSING: '处理中',
    TERMINATED: '已终止',
  };
  const normalizedValue = value?.trim().toUpperCase();
  if (!normalizedValue) {
    return EMPTY_CELL;
  }
  return labels[normalizedValue] ?? valueOrDash(value);
}

function formatBillingStatus(value?: null | string) {
  const labels: Record<string, string> = {
    BILLED: '已计费',
    CHARGED: '已收费',
    CHARGING: '收费中',
    FAILED: '收费失败',
    PAID: '已收费',
    PENDING: '待收费',
    REFUNDED: '已退费',
    SETTLED: '已收费',
    SUCCESS: '已收费',
    UNBILLED: '未收费',
    UNCHARGED: '未收费',
    UNPAID: '未收费',
  };
  const normalizedValue = value?.trim().toUpperCase();
  if (!normalizedValue) {
    return EMPTY_CELL;
  }
  return labels[normalizedValue] ?? valueOrDash(value);
}

function buildSearchableText(row: Record<string, unknown>) {
  return Object.values(row)
    .filter((value) => value !== null && value !== undefined)
    .map(String)
    .join(' ')
    .toLowerCase();
}

type TechnicalWorkbenchRowInput = {
  [key: string]: boolean | null | number | string | undefined;
  id: string;
};

function createRow(row: TechnicalWorkbenchRowInput): TechnicalWorkbenchRow {
  return {
    ...row,
    searchableText: buildSearchableText(row),
  };
}

function getItemName(order: PendingMedicalOrderItem) {
  return valueOrDash(order.orderItemName ?? order.orderContent);
}

function getCategoryName(order: PendingMedicalOrderItem) {
  return valueOrDash(order.orderCategoryName ?? order.orderType);
}

function formatRoutineConfirmedStatus(order: PendingMedicalOrderItem) {
  const normalized = order.status?.trim().toUpperCase();
  if (normalized === 'IN_PROGRESS' || normalized === 'COMPLETED') {
    return '已确认';
  }
  if (normalized === 'TERMINATED') {
    return '已终止';
  }
  return '待确认';
}

function formatRoutinePrintStatus(order: PendingMedicalOrderItem) {
  return order.printedAt ? '已打印' : '未打印';
}

function formatRoutineReleaseStatus(order: PendingMedicalOrderItem) {
  const normalized = order.status?.trim().toUpperCase();
  if (normalized === 'TERMINATED') {
    return '已终止';
  }
  if (order.releasedAt || normalized === 'COMPLETED') {
    return '已出片';
  }
  if (order.printedAt) {
    return '待出片';
  }
  if (normalized === 'IN_PROGRESS') {
    return '待出片';
  }
  return '待确认';
}

function parseLegacyBlockNo(orderContent?: null | string) {
  const normalizedOrderContent = orderContent?.trim();
  if (!normalizedOrderContent) {
    return null;
  }
  const matched = normalizedOrderContent.match(
    /[（(]蜡块[:：]\s*([^）)]+)[）)]/,
  );
  return matched?.[1]?.trim() || null;
}

function resolveRoutineBlockNo(order: PendingMedicalOrderItem) {
  return valueOrDash(order.blockNo ?? parseLegacyBlockNo(order.orderContent));
}

function createBaseRow(order: PendingMedicalOrderItem) {
  const statusLabel = formatOrderStatus(order.status);
  return {
    acceptedAt: order.acceptedAt ?? null,
    applicationNo: valueOrDash(order.applicationNo),
    blockNo: valueOrDash(order.blockNo),
    canConfirm: Boolean(order.canConfirm),
    canPrint: Boolean(order.canPrint),
    canQc: Boolean(order.canQc),
    canRelease: Boolean(order.canRelease),
    canTerminate: Boolean(order.canTerminate),
    checkItem: getItemName(order),
    chargeStatus: formatBillingStatus(order.billingStatus),
    completedAt: order.completedAt ?? null,
    confirmedTime: formatOrderDate(order.acceptedAt),
    confirmedUser: valueOrDash(order.executorName),
    doctorTime: formatOrderDate(order.orderDate),
    doctorUser: valueOrDash(order.doctorName),
    id: order.orderId,
    inpatientNo: valueOrDash(order.inpatientNo),
    orderType: getCategoryName(order),
    patientId: valueOrDash(order.patientId),
    patientIdDisplay: order.patientIdDisplay ?? null,
    patientName: valueOrDash(order.patientName),
    pathologyNo: valueOrDash(order.pathologyNo),
    printTime: formatOrderDate(order.printedAt),
    printUser: valueOrDash(order.printedByName),
    printedAt: order.printedAt ?? null,
    printedByName: order.printedByName ?? null,
    releasedAt: order.releasedAt ?? null,
    releasedByName: order.releasedByName ?? null,
    releaseTime: formatOrderDate(order.releasedAt ?? order.completedAt),
    releaseUser: valueOrDash(order.releasedByName),
    remark: valueOrDash(order.remarks ?? order.orderContent),
    slideNo: valueOrDash(order.slideNo),
    statusLabel,
    specimenNo: valueOrDash(order.specimenNo),
    targetBlockId: order.targetBlockId ?? null,
    targetSlideId: order.targetSlideId ?? null,
    targetSpecimenId: order.targetSpecimenId ?? null,
    targetType: order.targetType ?? null,
    terminatedAt: order.terminatedAt ?? null,
    terminatedByName: order.terminatedByName ?? null,
    terminationReason: valueOrDash(order.terminationReasonLabel),
    terminationReasonCode: order.terminationReasonCode ?? null,
    terminationRemarks: valueOrDash(order.terminationRemarks),
    terminationTime: formatOrderDate(order.terminatedAt),
    terminationUser: valueOrDash(order.terminatedByName),
  };
}

export function mapMedicalOrderToTechnicalWorkbenchRow(
  order: PendingMedicalOrderItem,
  kind: MedicalOrderWorkstationKind,
): TechnicalWorkbenchRow {
  const baseRow = createBaseRow(order);

  if (kind === 'routine') {
    return createRow({
      ...baseRow,
      blockNo: resolveRoutineBlockNo(order),
      confirmedStatus: formatRoutineConfirmedStatus(order),
      note: valueOrDash(order.orderContent),
      originalPathologyNo: EMPTY_CELL,
      outpatientNo: EMPTY_CELL,
      printStatus: formatRoutinePrintStatus(order),
      printTime: formatOrderDate(order.printedAt),
      releaseStatus: formatRoutineReleaseStatus(order),
      releaseTime: formatOrderDate(order.releasedAt ?? order.completedAt),
      sliceMode: getCategoryName(order),
      terminationReason: valueOrDash(order.terminationReasonLabel),
    });
  }

  if (kind === 'special') {
    return createRow({
      ...baseRow,
      confirmAction: baseRow.statusLabel,
      doctorMessage: valueOrDash(order.remarks ?? order.orderContent),
      orderAction: baseRow.statusLabel,
      printStatus: '未打印',
      revokeReminder: EMPTY_CELL,
    });
  }

  if (kind === 'ihc') {
    return createRow({
      ...baseRow,
      confirmAction: baseRow.statusLabel,
      deviceName: EMPTY_CELL,
      instrumentAction: '待上机',
      plateNo: EMPTY_CELL,
      printCallbackResult: EMPTY_CELL,
      slideNo: valueOrDash(order.orderNumber),
      specimenNo: getItemName(order),
      stainingAction: baseRow.statusLabel,
    });
  }

  if (kind === 'cytology') {
    return createRow({
      ...baseRow,
      blockCount: 0,
      flowStatus: baseRow.statusLabel,
      printedBlocks: 0,
      printedSlides: 0,
      receiverName: EMPTY_CELL,
      releaseUser: EMPTY_CELL,
      sampleType: getCategoryName(order),
      slideCount: 0,
      specimenName: getItemName(order),
      submitDept: EMPTY_CELL,
      tagName: valueOrDash(order.orderContent),
    });
  }

  return createRow({
    ...baseRow,
    flowStatus: baseRow.statusLabel,
    printedSlides: 0,
    receiverName: EMPTY_CELL,
    releaseUser: EMPTY_CELL,
    sampleType: getCategoryName(order),
    submitDept: EMPTY_CELL,
  });
}

export function createMedicalOrderWorkstationDataSource(
  orderCategoryCode: string,
  kind: MedicalOrderWorkstationKind,
): TechnicalWorkbenchDataSource {
  return {
    async load(query: TechnicalWorkbenchDataSourceQuery) {
      const response = await listPendingMedicalOrders({
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        orderCategoryCode,
        page: query.page,
        pathologyNo: query.pathologyNo,
        size: query.size,
        status: query.status,
      });
      return {
        page: response.page,
        rows: response.items.map((item) =>
          mapMedicalOrderToTechnicalWorkbenchRow(item, kind),
        ),
        size: response.size,
        total: response.total,
      };
    },
  };
}
