import type {
  CreateReagentRequest,
  CreateReagentStockRequest,
  MedicalOrderDictCategoryNode,
  MedicalOrderDictItemOption,
  ReagentStockView,
  ReagentView,
  UpdateReagentRequest,
  UpdateReagentStockRequest,
} from '../types/operation-support';

import {
  REAGENT_TEMPLATE_STATUS_OPTIONS,
  REAGENT_TYPE_OPTIONS,
} from '../constants';

export type ReagentFormState = {
  cloneNo: string;
  defaultLowStockThreshold?: number;
  defaultNearExpiryDays?: number;
  defaultStockThreshold?: number;
  dilutionRatio: string;
  manufacturer: string;
  orderDictItemId: string;
  reagentCode: string;
  reagentName: string;
  reagentType: string;
  reagentUsage: string;
  remarks: string;
  specification: string;
  stainCapacity?: number;
  stainThreshold?: number;
  status: string;
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

export interface ReagentTemplateTreeItem {
  id: string;
  keywordText: string;
  label: string;
  metaLabel: string;
  reagent: ReagentView;
}

export interface ReagentTemplateTreeGroup {
  children: ReagentTemplateTreeItem[];
  id: string;
  label: string;
}

export interface ReagentMedicalOrderOption {
  categoryId: string;
  categoryName: string;
  id: string;
  keywordText: string;
  label: string;
  orderItemCode: string;
  orderItemName: string;
}

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

function toDisplayText(value?: null | string) {
  return value?.trim() || '-';
}

function resolveFormStatus(row: ReagentView) {
  return row.templateStatus ?? (row.enabled ? 'ENABLED' : 'DISABLED');
}

function getFormEnabled(status: string) {
  return status === 'ENABLED';
}

function createGeneratedReagentCode() {
  const now = new Date();
  const pad = (value: number, length = 2) => String(value).padStart(length, '0');
  const timestamp = [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join('');
  const randomSuffix = pad(Math.floor(Math.random() * 1000), 3);
  return `RG-${timestamp}${randomSuffix}`;
}

function getReagentTypeLabel(value?: null | string) {
  return (
    REAGENT_TYPE_OPTIONS.find((option) => option.value === value)?.label ??
    value ??
    '未分类'
  );
}

export function createReagentFormDefaults(): ReagentFormState {
  return {
    cloneNo: '',
    dilutionRatio: '',
    defaultLowStockThreshold: undefined,
    defaultNearExpiryDays: undefined,
    defaultStockThreshold: undefined,
    manufacturer: '',
    orderDictItemId: '',
    reagentCode: createGeneratedReagentCode(),
    reagentName: '',
    reagentType: '',
    reagentUsage: '',
    remarks: '',
    status: 'ENABLED',
    specification: '',
    stainCapacity: undefined,
    stainThreshold: undefined,
    unit: '',
    validityDays: undefined,
  };
}

export function flattenMedicalOrderDictItems(
  nodes: MedicalOrderDictCategoryNode[],
  keyword = '',
): ReagentMedicalOrderOption[] {
  const normalizedKeyword = keyword.trim().toLowerCase();
  const options: ReagentMedicalOrderOption[] = [];

  const visit = (node: MedicalOrderDictCategoryNode) => {
    for (const item of node.items ?? []) {
      appendMedicalOrderOption(options, node, item, normalizedKeyword);
    }
    for (const child of node.children ?? []) {
      visit(child);
    }
  };

  for (const node of nodes) {
    visit(node);
  }

  return options.toSorted((left, right) =>
    left.label.localeCompare(right.label, 'zh-CN'),
  );
}

function appendMedicalOrderOption(
  options: ReagentMedicalOrderOption[],
  category: MedicalOrderDictCategoryNode,
  item: MedicalOrderDictItemOption,
  normalizedKeyword: string,
) {
  if (!item.enabled) {
    return;
  }

  const keywordText = [
    category.categoryName,
    item.orderItemCode,
    item.orderItemName,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (normalizedKeyword && !keywordText.includes(normalizedKeyword)) {
    return;
  }

  options.push({
    categoryId: category.id,
    categoryName: category.categoryName,
    id: item.id,
    keywordText,
    label: `${item.orderItemName}（${toDisplayText(item.orderItemCode)}）`,
    orderItemCode: item.orderItemCode,
    orderItemName: item.orderItemName,
  });
}

export function createReagentFormStateFromRow(
  row: ReagentView,
): ReagentFormState {
  const dilutionRatio =
    row.recommendedDilution?.trim() || row.applicationDilution?.trim() || '';
  return {
    cloneNo: row.cloneNo ?? '',
    dilutionRatio,
    defaultLowStockThreshold: toOptionalNumber(row.defaultLowStockThreshold),
    defaultNearExpiryDays: row.defaultNearExpiryDays ?? undefined,
    defaultStockThreshold: toOptionalNumber(row.defaultStockThreshold),
    manufacturer: row.manufacturer ?? '',
    orderDictItemId: row.orderDictItemId ?? '',
    reagentCode: row.reagentCode,
    reagentName: row.reagentName,
    reagentType: row.reagentType ?? '',
    reagentUsage: row.reagentUsage ?? '',
    remarks: row.remarks ?? '',
    status: resolveFormStatus(row),
    specification: row.specification ?? '',
    stainCapacity: toOptionalNumber(row.stainCapacity),
    stainThreshold: toOptionalNumber(row.stainThreshold),
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

export function buildReagentTemplateTree(
  reagents: ReagentView[],
  keyword = '',
): ReagentTemplateTreeGroup[] {
  const normalizedKeyword = keyword.trim().toLowerCase();
  const groups = new Map<string, ReagentTemplateTreeGroup>();

  for (const reagent of reagents) {
    const keywordText = [
      reagent.reagentCode,
      reagent.reagentName,
      reagent.orderItemName,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    if (normalizedKeyword && !keywordText.includes(normalizedKeyword)) {
      continue;
    }

    const groupId = reagent.reagentType?.trim() || 'UNCLASSIFIED';
    const existingGroup = groups.get(groupId);
    const item: ReagentTemplateTreeItem = {
      id: reagent.id,
      keywordText,
      label: reagent.reagentName,
      metaLabel: `${reagent.reagentCode} / ${toDisplayText(reagent.orderItemName)}`,
      reagent,
    };

    if (existingGroup) {
      existingGroup.children.push(item);
      continue;
    }

    groups.set(groupId, {
      children: [item],
      id: groupId,
      label: getReagentTypeLabel(reagent.reagentType),
    });
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      children: group.children.toSorted((left, right) =>
        left.label.localeCompare(right.label, 'zh-CN'),
      ),
    }))
    .toSorted((left, right) => left.label.localeCompare(right.label, 'zh-CN'));
}

export function applyReagentTemplateToStockForm(
  form: ReagentStockFormState,
  reagent: ReagentView,
  options: {
    overwriteEmptyOnly: boolean;
  },
) {
  const assignOptionalText = (
    key: keyof Pick<
      ReagentStockFormState,
      'applicationDilution' | 'recommendedDilution'
    >,
    value?: null | string,
  ) => {
    const normalizedValue = value?.trim() || '';
    if (!normalizedValue) {
      return;
    }
    if (options.overwriteEmptyOnly && form[key].trim()) {
      return;
    }
    form[key] = normalizedValue;
  };

  const assignOptionalNumber = (
    key: keyof Pick<
      ReagentStockFormState,
      'stainCapacity' | 'stainThreshold' | 'validityDays'
    >,
    value?: null | number | string,
  ) => {
    const normalizedValue = toOptionalNumber(value);
    if (normalizedValue === undefined) {
      return;
    }
    if (options.overwriteEmptyOnly && form[key] !== undefined) {
      return;
    }
    form[key] = normalizedValue;
  };

  form.reagentId = reagent.id;
  assignOptionalText('recommendedDilution', reagent.recommendedDilution);
  assignOptionalText('applicationDilution', reagent.applicationDilution);
  assignOptionalNumber('stainCapacity', reagent.stainCapacity);
  assignOptionalNumber('stainThreshold', reagent.stainThreshold);
  assignOptionalNumber('validityDays', reagent.validityDays);
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
    return '新增试剂编码生成失败，请关闭弹窗后重试';
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
    applicationDilution: optionalText(form.dilutionRatio),
    cloneNo: optionalText(form.cloneNo),
    defaultLowStockThreshold: optionalNumber(form.defaultLowStockThreshold),
    defaultNearExpiryDays: optionalNumber(form.defaultNearExpiryDays),
    defaultStockThreshold: optionalNumber(form.defaultStockThreshold),
    enabled: getFormEnabled(form.status),
    manufacturer: optionalText(form.manufacturer),
    orderDictItemId: optionalText(form.orderDictItemId),
    reagentCode: form.reagentCode,
    reagentName: form.reagentName,
    reagentType: optionalText(form.reagentType),
    reagentUsage: optionalText(form.reagentUsage),
    recommendedDilution: optionalText(form.dilutionRatio),
    remarks: optionalText(form.remarks),
    specification: optionalText(form.specification),
    templateStatus:
      REAGENT_TEMPLATE_STATUS_OPTIONS.find((option) => option.value === form.status)
        ?.value ?? 'ENABLED',
    stainCapacity: optionalNumber(form.stainCapacity),
    stainThreshold: optionalNumber(form.stainThreshold),
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
