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
  routine: 'EXAM,CGRS,BLOCK,QP',
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
  return normalizedValue.length > 16
    ? normalizedValue.slice(0, 16)
    : normalizedValue;
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

function createBaseRow(order: PendingMedicalOrderItem) {
  const statusLabel = formatOrderStatus(order.status);
  return {
    checkItem: getItemName(order),
    doctorTime: formatOrderDate(order.orderDate),
    doctorUser: valueOrDash(order.doctorName),
    id: order.orderId,
    orderType: getCategoryName(order),
    patientId: EMPTY_CELL,
    patientName: valueOrDash(order.patientName),
    pathologyNo: valueOrDash(order.pathologyNo),
    remark: valueOrDash(order.remarks ?? order.orderContent),
    statusLabel,
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
      blockNo: EMPTY_CELL,
      confirmedStatus: baseRow.statusLabel,
      note: valueOrDash(order.orderContent),
      originalPathologyNo: EMPTY_CELL,
      outpatientNo: EMPTY_CELL,
      printStatus: '未打印',
      printTime: EMPTY_CELL,
      releaseStatus: baseRow.statusLabel,
      releaseTime: EMPTY_CELL,
      sliceMode: getCategoryName(order),
      terminationReason: EMPTY_CELL,
      wardNo: EMPTY_CELL,
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
      wardNo: EMPTY_CELL,
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
