import type {
  PendingTransportOrderItem,
  PendingTransportOrderQuery,
  SpecimenOutboundListItem,
  TransportOrderHandoverRequest,
  TransportOrderOperatorRequest,
  TransportOrderOutboundRequest,
} from '../types/specimen-workflow';

export type TransportHandoverFilters = {
  applicationId: string;
  dateRange: string[];
  departmentId: string;
  page: number;
  size: number;
  specimenNo: string;
  status: string;
};

export type TransportPrintForm = {
  operatorName: string;
  operatorUserId: string;
  terminalCode: string;
};

export type TransportHandoverForm = {
  receiverUserId: string;
  receiverUserName: string;
  remarks: string;
  terminalCode: string;
};

export type TransportOutboundForm = {
  outboundUserId: string;
  outboundUserName: string;
  remarks: string;
  terminalCode: string;
};

const RECEIPT_TERMINAL_STATUSES = new Set(['RECEIVED', 'REJECTED', 'RETURNED']);
const CHECKED_IN_STATUS = 'CHECKED_IN';
const COMPLETED_FIXATION_STATUS = 'COMPLETED';

export type OutboundBlockingStep =
  | 'CHECKED_IN'
  | 'CONFIRMATION'
  | 'FIXATION'
  | 'OUTBOUNDED'
  | 'RECEIPT_TERMINAL';

export type SpecimenOutboundReadiness = {
  blockingStep: null | OutboundBlockingStep;
  canOutbound: boolean;
  displayStatus: string;
  reason: null | string;
  tagType: 'info' | 'primary' | 'success' | 'warning';
};

export type SpecimenOutboundDisplayItem = SpecimenOutboundListItem & {
  canOutbound: boolean;
  displayOutboundStatus: string;
  outboundDisabledReason: null | string;
  outboundStatusTagType: 'info' | 'primary' | 'success' | 'warning';
};

export function createDefaultTransportPrintFormState(
  operatorName: string,
  operatorUserId: string,
): TransportPrintForm {
  return {
    operatorName,
    operatorUserId,
    terminalCode: '',
  };
}

export function createDefaultTransportHandoverFormState(
  receiverUserName: string,
  receiverUserId: string,
): TransportHandoverForm {
  return {
    receiverUserId,
    receiverUserName,
    remarks: '',
    terminalCode: '',
  };
}

export function createDefaultTransportOutboundFormState(
  outboundUserName: string,
  outboundUserId: string,
): TransportOutboundForm {
  return {
    outboundUserId,
    outboundUserName,
    remarks: '',
    terminalCode: '',
  };
}

export function normalizeRouteQueryValue(value: unknown) {
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : '';
  }
  return '';
}

export function buildPendingTransportOrderQuery(
  filters: TransportHandoverFilters,
): PendingTransportOrderQuery {
  return {
    applicationId: filters.applicationId.trim() || undefined,
    dateFrom: filters.dateRange[0] || undefined,
    dateTo: filters.dateRange[1] || undefined,
    departmentId: filters.departmentId.trim() || undefined,
    page: filters.page,
    size: filters.size,
    specimenNo: filters.specimenNo.trim() || undefined,
    status: filters.status || undefined,
  };
}

export function createTransportPrintDialogTitle(
  activeOrder: null | PendingTransportOrderItem,
  selectionCount: number,
) {
  if (selectionCount > 1) {
    return `批量打印转运单（${selectionCount} 条）`;
  }
  return activeOrder
    ? `打印转运单 ${activeOrder.transportOrderNo}`
    : '打印转运单';
}

export function createTransportHandoverDialogTitle(
  activeOrder: null | PendingTransportOrderItem,
  selectionCount: number,
) {
  if (selectionCount > 1) {
    return `批量交接转运单（${selectionCount} 条）`;
  }
  return activeOrder
    ? `交接转运单 ${activeOrder.transportOrderNo}`
    : '交接转运单';
}

export function resolveTargetTransportOrders(
  selectedRows: PendingTransportOrderItem[],
  activeOrder: null | PendingTransportOrderItem,
) {
  if (selectedRows.length > 0) {
    return selectedRows;
  }
  return activeOrder ? [activeOrder] : [];
}

export function canHandoverTransportOrder(order: PendingTransportOrderItem) {
  return ['PENDING', 'PRINTED'].includes(order.status);
}

function normalizeText(value?: null | string) {
  return value?.trim() ?? '';
}

function isReceiptTerminalStatus(status?: null | string) {
  return RECEIPT_TERMINAL_STATUSES.has(normalizeText(status));
}

function isOutbound(row: SpecimenOutboundListItem) {
  return (
    Boolean(row.outboundAt) ||
    normalizeText(row.specimenStatus) === 'IN_TRANSIT'
  );
}

function resolveDisplaySpecimenNo(row: SpecimenOutboundListItem) {
  return (
    normalizeText(row.specimenNo) ||
    normalizeText(row.barcode) ||
    normalizeText(row.specimenId) ||
    '当前标本'
  );
}

function resolveBlockingStatusLabel(
  row: SpecimenOutboundListItem,
  blockingStep: OutboundBlockingStep,
) {
  if (blockingStep === 'OUTBOUNDED') {
    return '已出库';
  }
  if (blockingStep === 'RECEIPT_TERMINAL') {
    if (row.specimenStatus === 'RECEIVED') {
      return '已接收';
    }
    if (row.specimenStatus === 'REJECTED') {
      return '已拒收';
    }
    if (row.specimenStatus === 'RETURNED') {
      return '已退回';
    }
    return '流程已结束';
  }
  if (blockingStep === 'FIXATION') {
    return '待固定';
  }
  if (blockingStep === 'CONFIRMATION') {
    return '待标本确认';
  }
  return '待入库';
}

function buildOutboundBlockReason(
  row: SpecimenOutboundListItem,
  blockingStep: OutboundBlockingStep,
) {
  const specimenNo = resolveDisplaySpecimenNo(row);
  if (blockingStep === 'OUTBOUNDED') {
    return '标本已完成出库，无需重复操作';
  }
  if (blockingStep === 'RECEIPT_TERMINAL') {
    return `标本 ${specimenNo} 已接收、拒收或退回，不能再出库`;
  }
  if (blockingStep === 'FIXATION') {
    return `标本 ${specimenNo} 尚未完成固定，不能出库`;
  }
  if (blockingStep === 'CONFIRMATION') {
    return `标本 ${specimenNo} 尚未完成标本确认，不能出库`;
  }
  return `标本 ${specimenNo} 尚未完成入库，不能出库`;
}

function resolveOutboundBlockingStep(
  row: SpecimenOutboundListItem,
): null | OutboundBlockingStep {
  if (isReceiptTerminalStatus(row.specimenStatus)) {
    return 'RECEIPT_TERMINAL';
  }
  if (isOutbound(row)) {
    return 'OUTBOUNDED';
  }
  if (normalizeText(row.fixationStatus) !== COMPLETED_FIXATION_STATUS) {
    return 'FIXATION';
  }
  if (!row.specimenConfirmedAt) {
    return 'CONFIRMATION';
  }
  if (normalizeText(row.checkInStatus) !== CHECKED_IN_STATUS) {
    return 'CHECKED_IN';
  }
  return null;
}

export function resolveSpecimenOutboundReadiness(
  row: SpecimenOutboundListItem,
): SpecimenOutboundReadiness {
  const blockingStep = resolveOutboundBlockingStep(row);
  if (!blockingStep) {
    return {
      blockingStep: null,
      canOutbound: true,
      displayStatus: '待出库',
      reason: null,
      tagType: 'info',
    };
  }

  return {
    blockingStep,
    canOutbound: false,
    displayStatus: resolveBlockingStatusLabel(row, blockingStep),
    reason: buildOutboundBlockReason(row, blockingStep),
    tagType: resolveOutboundTagType(blockingStep),
  };
}

export function enhanceSpecimenOutboundItem(
  row: SpecimenOutboundListItem,
): SpecimenOutboundDisplayItem {
  const readiness = resolveSpecimenOutboundReadiness(row);
  return {
    ...row,
    canOutbound: readiness.canOutbound,
    displayOutboundStatus: readiness.displayStatus,
    outboundDisabledReason: readiness.reason,
    outboundStatusTagType: readiness.tagType,
  };
}

export function resolveExactSpecimenOutboundMatches<
  T extends SpecimenOutboundListItem,
>(rows: T[], specimenNo: string) {
  const normalizedSpecimenNo = normalizeText(specimenNo).toLowerCase();
  return rows.filter(
    (row) =>
      normalizeText(row.specimenNo).toLowerCase() === normalizedSpecimenNo,
  );
}

function resolveOutboundTagType(
  blockingStep: OutboundBlockingStep,
): 'info' | 'primary' | 'success' | 'warning' {
  if (blockingStep === 'OUTBOUNDED') {
    return 'success';
  }
  if (blockingStep === 'RECEIPT_TERMINAL') {
    return 'primary';
  }
  return 'warning';
}

export function canSelectSpecimenOutboundRow(row: SpecimenOutboundListItem) {
  return resolveSpecimenOutboundReadiness(row).canOutbound;
}

export function resolveTransportSelectionValidationMessage(
  rows: SpecimenOutboundListItem[],
) {
  if (rows.length === 0) {
    return '请先选择需要转运的标本';
  }

  const applicationIds = new Set(rows.map((row) => row.applicationId));
  if (applicationIds.size > 1) {
    return '仅支持同一申请单内的标本一起转运';
  }

  const blockedRow = rows.find((row) => !canSelectSpecimenOutboundRow(row));
  if (blockedRow) {
    return resolveSpecimenOutboundReadiness(blockedRow).reason;
  }

  return null;
}

export function splitTransportRowsByTransportOrder(
  rows: SpecimenOutboundListItem[],
) {
  const existingTransportOrderIds = [
    ...new Set(
      rows
        .map((row) => row.transportOrderId?.trim())
        .filter(Boolean) as string[],
    ),
  ];

  return {
    existingTransportOrderIds,
    rowsWithoutTransportOrder: rows.filter((row) => !row.transportOrderId),
  };
}

export function resolveSpecimenNoQuickHandoverTarget(
  orders: PendingTransportOrderItem[],
  specimenNo: string,
) {
  if (specimenNo.trim() === '' || orders.length !== 1) {
    return null;
  }

  const [matchedOrder] = orders;
  return matchedOrder && canHandoverTransportOrder(matchedOrder)
    ? matchedOrder
    : null;
}

export function resolveSpecimenNoQuickOutboundTarget(
  orders: PendingTransportOrderItem[],
  specimenNo: string,
) {
  if (specimenNo.trim() === '' || orders.length !== 1) {
    return null;
  }

  const [matchedOrder] = orders;
  return matchedOrder && canHandoverTransportOrder(matchedOrder)
    ? matchedOrder
    : null;
}

export function buildPrintTransportOrderRequest(
  form: TransportPrintForm,
): TransportOrderOperatorRequest {
  return {
    terminalCode: form.terminalCode.trim() || null,
  };
}

export function buildTransportOrderHandoverRequest(
  form: TransportHandoverForm,
): TransportOrderHandoverRequest {
  return {
    receiverUserId: form.receiverUserId.trim() || null,
    receiverUserName: form.receiverUserName.trim(),
    remarks: form.remarks.trim() || null,
    terminalCode: form.terminalCode.trim() || null,
  };
}

export function buildTransportOrderOutboundRequest(
  form: TransportOutboundForm,
): TransportOrderOutboundRequest {
  return {
    outboundUserId: form.outboundUserId.trim() || null,
    outboundUserName: form.outboundUserName.trim(),
    remarks: form.remarks.trim() || null,
    terminalCode: form.terminalCode.trim() || null,
  };
}
