import type {
  CreateReagentRequest,
  CreateReagentStockRequest,
  ReagentStockView,
  ReagentView,
  UpdateReagentRequest,
  UpdateReagentStockRequest,
} from '../types/operation-support';

export type ReagentFormState = {
  applicationDilution: string;
  cloneNo: string;
  defaultLowStockThreshold?: number;
  defaultNearExpiryDays?: number;
  defaultStockThreshold?: number;
  enabled: boolean;
  manufacturer: string;
  orderDictItemId: string;
  reagentCode: string;
  reagentName: string;
  reagentType: string;
  reagentUsage: string;
  recommendedDilution: string;
  remarks: string;
  specification: string;
  stainCapacity?: number;
  stainThreshold?: number;
  templateStatus: string;
  unit: string;
  validityDays?: number;
};

export type ReagentStockFormState = {
  applicationDilution: string;
  batchNo: string;
  expiryDate: string;
  expiryReminderThreshold?: number;
  inboundAt: string;
  initialQuantity?: number;
  lowStockThreshold?: number;
  nearExpiryDays?: number;
  productionDate: string;
  reagentId: string;
  recommendedDilution: string;
  remainingQuantity?: number;
  remarks: string;
  stainCapacity?: number;
  stainThreshold?: number;
  stockQuantity?: number;
  stockStatus: string;
  storageLocation: string;
  testReminderThreshold?: number;
  validityDays?: number;
};

function optionalText(value: string) {
  return value.trim() || undefined;
}

function optionalNumber(value: number | undefined) {
  return value;
}

function toOptionalNumber(value?: null | number | string) {
  return value === null || value === undefined || value === ''
    ? undefined
    : Number(value);
}

export function createReagentFormDefaults(): ReagentFormState {
  return {
    applicationDilution: '',
    cloneNo: '',
    defaultLowStockThreshold: undefined,
    defaultNearExpiryDays: undefined,
    defaultStockThreshold: undefined,
    enabled: true,
    manufacturer: '',
    orderDictItemId: '',
    reagentCode: '',
    reagentName: '',
    reagentType: '',
    reagentUsage: '',
    recommendedDilution: '',
    remarks: '',
    specification: '',
    stainCapacity: undefined,
    stainThreshold: undefined,
    templateStatus: 'ENABLED',
    unit: '',
    validityDays: undefined,
  };
}

export function createReagentFormStateFromRow(
  row: ReagentView,
): ReagentFormState {
  return {
    applicationDilution: row.applicationDilution ?? '',
    cloneNo: row.cloneNo ?? '',
    defaultLowStockThreshold: toOptionalNumber(row.defaultLowStockThreshold),
    defaultNearExpiryDays: row.defaultNearExpiryDays ?? undefined,
    defaultStockThreshold: toOptionalNumber(row.defaultStockThreshold),
    enabled: row.enabled,
    manufacturer: row.manufacturer ?? '',
    orderDictItemId: row.orderDictItemId ?? '',
    reagentCode: row.reagentCode,
    reagentName: row.reagentName,
    reagentType: row.reagentType ?? '',
    reagentUsage: row.reagentUsage ?? '',
    recommendedDilution: row.recommendedDilution ?? '',
    remarks: row.remarks ?? '',
    specification: row.specification ?? '',
    stainCapacity: toOptionalNumber(row.stainCapacity),
    stainThreshold: toOptionalNumber(row.stainThreshold),
    templateStatus:
      row.templateStatus ?? (row.enabled ? 'ENABLED' : 'DISABLED'),
    unit: row.unit ?? '',
    validityDays: row.validityDays ?? undefined,
  };
}

export function createReagentStockFormDefaults(): ReagentStockFormState {
  return {
    applicationDilution: '',
    batchNo: '',
    expiryDate: '',
    expiryReminderThreshold: undefined,
    inboundAt: '',
    initialQuantity: undefined,
    lowStockThreshold: undefined,
    nearExpiryDays: undefined,
    productionDate: '',
    reagentId: '',
    recommendedDilution: '',
    remainingQuantity: undefined,
    remarks: '',
    stainCapacity: undefined,
    stainThreshold: undefined,
    stockQuantity: undefined,
    stockStatus: 'IN_STOCK',
    storageLocation: '',
    testReminderThreshold: undefined,
    validityDays: undefined,
  };
}

export function createReagentStockFormStateFromRow(
  row: ReagentStockView,
): ReagentStockFormState {
  return {
    applicationDilution: row.applicationDilution ?? '',
    batchNo: row.batchNo,
    expiryDate: row.expiryDate ?? '',
    expiryReminderThreshold: row.expiryReminderThreshold ?? undefined,
    inboundAt: row.inboundAt ?? '',
    initialQuantity: toOptionalNumber(row.initialQuantity),
    lowStockThreshold: toOptionalNumber(row.lowStockThreshold),
    nearExpiryDays: row.nearExpiryDays ?? undefined,
    productionDate: row.productionDate ?? '',
    reagentId: row.reagentId,
    recommendedDilution: row.recommendedDilution ?? '',
    remainingQuantity: toOptionalNumber(
      row.remainingQuantity ?? row.stockQuantity,
    ),
    remarks: row.remarks ?? '',
    stainCapacity: toOptionalNumber(row.stainCapacity),
    stainThreshold: toOptionalNumber(row.stainThreshold),
    stockQuantity: toOptionalNumber(row.stockQuantity),
    stockStatus: row.stockStatus,
    storageLocation: row.storageLocation ?? '',
    testReminderThreshold: row.testReminderThreshold ?? undefined,
    validityDays: row.validityDays ?? undefined,
  };
}

export function createDraftReagentView(): ReagentView {
  return {
    defaultLowStockThreshold: null,
    defaultNearExpiryDays: null,
    defaultStockThreshold: null,
    enabled: true,
    id: '',
    manufacturer: '',
    orderDictItemId: '',
    orderItemName: '',
    reagentCode: '',
    reagentName: '',
    reagentType: '',
    remarks: '',
    specification: '',
    templateStatus: 'ENABLED',
    unit: '',
  };
}

export function createDraftReagentStockView(): ReagentStockView {
  return {
    batchNo: '',
    expiryDate: null,
    id: '',
    initialQuantity: null,
    lowStockThreshold: null,
    nearExpiryDays: null,
    reagentCode: null,
    reagentId: '',
    reagentName: null,
    remainingQuantity: null,
    remarks: null,
    stockQuantity: null,
    stockStatus: 'IN_STOCK',
    storageLocation: null,
  };
}

export function getStockStatusTagType(status?: null | string) {
  if (status === 'IN_USE' || status === 'TESTED') {
    return 'success';
  }
  if (status === 'FINISHED') {
    return 'danger';
  }
  if (status === 'DISABLED') {
    return 'info';
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
  if (!form.reagentName) {
    return '请填写试剂名称';
  }
  if (isCreate && !form.reagentCode) {
    return '新增试剂需要填写试剂编码';
  }
  if (
    form.defaultStockThreshold !== undefined &&
    form.defaultStockThreshold < 0
  ) {
    return '库存阈值不能为负数';
  }
  if (
    form.defaultLowStockThreshold !== undefined &&
    form.defaultLowStockThreshold < 0
  ) {
    return '低库存阈值不能为负数';
  }
  if (form.stainThreshold !== undefined && form.stainThreshold < 0) {
    return '染色阈值不能为负数';
  }
  return '';
}

export function validateReagentStockForm(
  form: ReagentStockFormState,
  isCreate: boolean,
) {
  if (!form.stockStatus) {
    return '请选择库存状态';
  }
  if (isCreate && (!form.reagentId || !form.batchNo)) {
    return '新增库存需要选择试剂并填写批号';
  }
  if (form.remainingQuantity !== undefined && form.remainingQuantity < 0) {
    return '库存数量不能为负数';
  }
  if (form.initialQuantity !== undefined && form.initialQuantity < 0) {
    return '初始数量不能为负数';
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
    applicationDilution: optionalText(form.applicationDilution),
    cloneNo: optionalText(form.cloneNo),
    defaultLowStockThreshold: optionalNumber(form.defaultLowStockThreshold),
    defaultNearExpiryDays: optionalNumber(form.defaultNearExpiryDays),
    defaultStockThreshold: optionalNumber(form.defaultStockThreshold),
    enabled: form.templateStatus === 'ENABLED',
    manufacturer: optionalText(form.manufacturer),
    orderDictItemId: optionalText(form.orderDictItemId),
    reagentCode: form.reagentCode,
    reagentName: form.reagentName,
    reagentType: optionalText(form.reagentType),
    reagentUsage: optionalText(form.reagentUsage),
    recommendedDilution: optionalText(form.recommendedDilution),
    remarks: optionalText(form.remarks),
    specification: optionalText(form.specification),
    stainCapacity: optionalNumber(form.stainCapacity),
    stainThreshold: optionalNumber(form.stainThreshold),
    templateStatus: form.templateStatus,
    unit: optionalText(form.unit),
    validityDays: optionalNumber(form.validityDays),
  };
}

export function buildUpdateReagentRequest(
  form: ReagentFormState,
): UpdateReagentRequest {
  const { reagentCode: _reagentCode, ...payload } =
    buildCreateReagentRequest(form);
  return payload;
}

export function buildCreateReagentStockRequest(
  form: ReagentStockFormState,
): CreateReagentStockRequest {
  return {
    applicationDilution: optionalText(form.applicationDilution),
    batchNo: form.batchNo,
    expiryDate: optionalText(form.expiryDate),
    expiryReminderThreshold: optionalNumber(form.expiryReminderThreshold),
    inboundAt: optionalText(form.inboundAt),
    initialQuantity: optionalNumber(form.initialQuantity),
    lowStockThreshold: optionalNumber(form.lowStockThreshold),
    nearExpiryDays: optionalNumber(form.nearExpiryDays),
    productionDate: optionalText(form.productionDate),
    reagentId: form.reagentId,
    recommendedDilution: optionalText(form.recommendedDilution),
    remainingQuantity: optionalNumber(form.remainingQuantity),
    remarks: optionalText(form.remarks),
    stainCapacity: optionalNumber(form.stainCapacity),
    stainThreshold: optionalNumber(form.stainThreshold),
    stockStatus: form.stockStatus,
    storageLocation: optionalText(form.storageLocation),
    testReminderThreshold: optionalNumber(form.testReminderThreshold),
    validityDays: optionalNumber(form.validityDays),
  };
}

export function buildUpdateReagentStockRequest(
  form: ReagentStockFormState,
): UpdateReagentStockRequest {
  const {
    batchNo: _batchNo,
    reagentId: _reagentId,
    ...payload
  } = buildCreateReagentStockRequest(form);
  return payload;
}
