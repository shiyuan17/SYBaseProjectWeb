import type {
  CreateReagentRequest,
  CreateReagentStockRequest,
  ReagentStockView,
  ReagentView,
  UpdateReagentRequest,
  UpdateReagentStockRequest,
} from '../types/operation-support';

export type ReagentFormState = {
  defaultLowStockThreshold?: number;
  defaultNearExpiryDays?: number;
  enabled: boolean;
  manufacturer: string;
  operatorName: string;
  reagentCode: string;
  reagentName: string;
  remarks: string;
  specification: string;
  unit: string;
};

export type ReagentStockFormState = {
  batchNo: string;
  expiryDate: string;
  lowStockThreshold?: number;
  nearExpiryDays?: number;
  operatorName: string;
  reagentId: string;
  remarks: string;
  stockQuantity?: number;
  stockStatus: string;
  storageLocation: string;
};

function optionalText(value: string) {
  return value || undefined;
}

function optionalNumber(value: number | undefined) {
  return value;
}

function toOptionalNumber(value?: null | number | string) {
  return value === null || value === undefined ? undefined : Number(value);
}

export function createReagentFormDefaults(
  operatorName: string,
): ReagentFormState {
  return {
    defaultLowStockThreshold: undefined,
    defaultNearExpiryDays: undefined,
    enabled: true,
    manufacturer: '',
    operatorName,
    reagentCode: '',
    reagentName: '',
    remarks: '',
    specification: '',
    unit: '',
  };
}

export function createReagentFormStateFromRow(
  row: ReagentView,
  operatorName: string,
): ReagentFormState {
  return {
    defaultLowStockThreshold: toOptionalNumber(row.defaultLowStockThreshold),
    defaultNearExpiryDays: row.defaultNearExpiryDays ?? undefined,
    enabled: row.enabled,
    manufacturer: row.manufacturer ?? '',
    operatorName,
    reagentCode: row.reagentCode,
    reagentName: row.reagentName,
    remarks: row.remarks ?? '',
    specification: row.specification ?? '',
    unit: row.unit ?? '',
  };
}

export function createReagentStockFormDefaults(
  operatorName: string,
): ReagentStockFormState {
  return {
    batchNo: '',
    expiryDate: '',
    lowStockThreshold: undefined,
    nearExpiryDays: undefined,
    operatorName,
    reagentId: '',
    remarks: '',
    stockQuantity: undefined,
    stockStatus: 'ACTIVE',
    storageLocation: '',
  };
}

export function createReagentStockFormStateFromRow(
  row: ReagentStockView,
  operatorName: string,
): ReagentStockFormState {
  return {
    batchNo: row.batchNo,
    expiryDate: row.expiryDate ?? '',
    lowStockThreshold: toOptionalNumber(row.lowStockThreshold),
    nearExpiryDays: row.nearExpiryDays ?? undefined,
    operatorName,
    reagentId: row.reagentId,
    remarks: row.remarks ?? '',
    stockQuantity: toOptionalNumber(row.stockQuantity),
    stockStatus: row.stockStatus,
    storageLocation: row.storageLocation ?? '',
  };
}

export function createDraftReagentView(): ReagentView {
  return {
    defaultLowStockThreshold: null,
    defaultNearExpiryDays: null,
    enabled: true,
    id: '',
    manufacturer: '',
    reagentCode: '',
    reagentName: '',
    remarks: '',
    specification: '',
    unit: '',
  };
}

export function createDraftReagentStockView(): ReagentStockView {
  return {
    batchNo: '',
    expiryDate: null,
    id: '',
    lowStockThreshold: null,
    nearExpiryDays: null,
    reagentCode: null,
    reagentId: '',
    reagentName: null,
    remarks: null,
    stockQuantity: null,
    stockStatus: 'ACTIVE',
    storageLocation: null,
  };
}

export function getStockStatusTagType(status?: null | string) {
  if (status === 'ACTIVE') {
    return 'success';
  }
  if (status === 'DEPLETED' || status === 'EXPIRED') {
    return 'danger';
  }
  return 'info';
}

export function getReagentWarningTagType(type?: null | string) {
  if (type === 'LOW_STOCK') {
    return 'warning';
  }
  if (type === 'NEAR_EXPIRY') {
    return 'danger';
  }
  return 'info';
}

export function validateReagentForm(form: ReagentFormState, isCreate: boolean) {
  if (!form.reagentName || !form.operatorName) {
    return '请填写试剂名称和操作人';
  }
  if (isCreate && !form.reagentCode) {
    return '新增试剂需要填写试剂编码';
  }
  if (
    form.defaultLowStockThreshold !== undefined &&
    form.defaultLowStockThreshold < 0
  ) {
    return '低库存阈值不能为负数';
  }
  return '';
}

export function validateReagentStockForm(
  form: ReagentStockFormState,
  isCreate: boolean,
) {
  if (!form.stockStatus || !form.operatorName) {
    return '请填写库存状态和操作人';
  }
  if (isCreate && (!form.reagentId || !form.batchNo)) {
    return '新增库存需要选择试剂并填写批号';
  }
  if (form.stockQuantity !== undefined && form.stockQuantity < 0) {
    return '库存数量不能为负数';
  }
  if (form.lowStockThreshold !== undefined && form.lowStockThreshold < 0) {
    return '低库存阈值不能为负数';
  }
  return '';
}

export function buildCreateReagentRequest(
  form: ReagentFormState,
): CreateReagentRequest {
  return {
    defaultLowStockThreshold: optionalNumber(form.defaultLowStockThreshold),
    defaultNearExpiryDays: optionalNumber(form.defaultNearExpiryDays),
    enabled: form.enabled,
    manufacturer: optionalText(form.manufacturer),
    operatorName: form.operatorName,
    remarks: optionalText(form.remarks),
    reagentCode: form.reagentCode,
    reagentName: form.reagentName,
    specification: optionalText(form.specification),
    unit: optionalText(form.unit),
  };
}

export function buildUpdateReagentRequest(
  form: ReagentFormState,
): UpdateReagentRequest {
  return {
    defaultLowStockThreshold: optionalNumber(form.defaultLowStockThreshold),
    defaultNearExpiryDays: optionalNumber(form.defaultNearExpiryDays),
    enabled: form.enabled,
    manufacturer: optionalText(form.manufacturer),
    operatorName: form.operatorName,
    remarks: optionalText(form.remarks),
    reagentName: form.reagentName,
    specification: optionalText(form.specification),
    unit: optionalText(form.unit),
  };
}

export function buildCreateReagentStockRequest(
  form: ReagentStockFormState,
): CreateReagentStockRequest {
  return {
    batchNo: form.batchNo,
    expiryDate: optionalText(form.expiryDate),
    lowStockThreshold: optionalNumber(form.lowStockThreshold),
    nearExpiryDays: optionalNumber(form.nearExpiryDays),
    operatorName: form.operatorName,
    reagentId: form.reagentId,
    remarks: optionalText(form.remarks),
    stockQuantity: optionalNumber(form.stockQuantity),
    stockStatus: form.stockStatus,
    storageLocation: optionalText(form.storageLocation),
  };
}

export function buildUpdateReagentStockRequest(
  form: ReagentStockFormState,
): UpdateReagentStockRequest {
  return {
    expiryDate: optionalText(form.expiryDate),
    lowStockThreshold: optionalNumber(form.lowStockThreshold),
    nearExpiryDays: optionalNumber(form.nearExpiryDays),
    operatorName: form.operatorName,
    remarks: optionalText(form.remarks),
    stockQuantity: optionalNumber(form.stockQuantity),
    stockStatus: form.stockStatus,
    storageLocation: optionalText(form.storageLocation),
  };
}
