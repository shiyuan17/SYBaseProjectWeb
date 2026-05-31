import type {
  PendingTransportOrderItem,
  PendingTransportOrderQuery,
  TransportOrderHandoverRequest,
  TransportOrderOperatorRequest,
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

export function buildPrintTransportOrderRequest(
  form: TransportPrintForm,
): TransportOrderOperatorRequest {
  return {
    operatorName: form.operatorName.trim(),
    operatorUserId: form.operatorUserId.trim() || null,
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
