import type {
  ApplicationFormReprintRequest,
  DirectSpecimenReceiptRequest,
  PendingSpecimenItem,
  PendingSpecimenQuery,
  SpecimenReceiptItemRequest,
  SpecimenReceiptRequest,
} from '../types/specimen-workflow';

type ReceiptDraftIdentifiers = {
  specimenId?: null | string;
  specimenNo?: null | string;
};

export type ReceiptDraftItem = Omit<
  SpecimenReceiptItemRequest,
  'specimenBarcode' | 'specimenId' | 'specimenNo'
> & {
  applicationNo?: string;
  containerName?: null | string;
  key: number;
  patientName?: null | string;
  specimenBarcode: string;
  specimenId: string;
  specimenNo: string;
};

export type ReceiptFilters = {
  page: number;
  size: number;
  specimenNo: string;
};

export type ReceiptOperatorForm = {
  receivedByName: string;
  receivedByUserId: string;
  terminalCode: string;
};

export type ReceiptConfirmForm = {
  logisticsStaffName: string;
  receivedByName: string;
  receivedByUserId: string;
};

export type ReceiptConfirmSummary = {
  applicationCount: number;
  patientCount: number;
  specimenCount: number;
};

export type TransportReceiptGroup = {
  applicationId: string;
  applicationNo: string;
  barcodes: string[];
  batchAbnormalFlag: boolean;
  items: PendingSpecimenItem[];
  latestTrackingAt: null | string;
  patientName: null | string;
  reminderCount: number;
  transportOrderId: string;
  unreceivedCount: number;
};

function normalizeText(value?: null | string) {
  return value?.trim() ?? '';
}

export function createDefaultReceiptFormState(
  receivedByName: string,
  receivedByUserId: string,
): ReceiptOperatorForm {
  return {
    receivedByName,
    receivedByUserId,
    terminalCode: '',
  };
}

export function createDefaultReceiptConfirmFormState(
  receivedByName: string,
  receivedByUserId: string,
): ReceiptConfirmForm {
  return {
    logisticsStaffName: '',
    receivedByName,
    receivedByUserId,
  };
}

export function createReceiptDraftItem(
  barcode = '',
  identifiers: ReceiptDraftIdentifiers = {},
): ReceiptDraftItem {
  return {
    containerCount: 1,
    key: Date.now() + Math.floor(Math.random() * 1000),
    qualityCheckResult: 'PASSED',
    qualityIssueCodes: [],
    reason: '',
    receiptStatus: 'RECEIVED',
    remarks: '',
    specimenBarcode: barcode,
    specimenId: identifiers.specimenId ?? '',
    specimenNo: identifiers.specimenNo ?? '',
  };
}

export function isReceiptDraftDerivedAbnormal(item: ReceiptDraftItem) {
  return (
    item.receiptStatus.trim() !== 'RECEIVED' ||
    item.qualityCheckResult.trim() === 'FAILED'
  );
}

export function countDerivedAbnormalReceiptItems(items: ReceiptDraftItem[]) {
  return items.filter((item) => isReceiptDraftDerivedAbnormal(item)).length;
}

export function buildTransportReceiptGroups(
  pendingItems: PendingSpecimenItem[],
): TransportReceiptGroup[] {
  const groupMap = new Map<string, TransportReceiptGroup>();

  for (const item of pendingItems) {
    if (!item.transportOrderId) {
      continue;
    }

    const existing = groupMap.get(item.transportOrderId);
    if (existing) {
      existing.items.push(item);
      const barcode = normalizeText(item.barcode);
      if (barcode) {
        existing.barcodes.push(barcode);
      }
      existing.batchAbnormalFlag =
        existing.batchAbnormalFlag || Boolean(item.batchAbnormalFlag);
      existing.latestTrackingAt = pickLatestTrackingAt(
        existing.latestTrackingAt,
        item.latestTrackingAt,
      );
      existing.reminderCount = Math.max(
        existing.reminderCount,
        item.reminderCount ?? 0,
      );
      existing.unreceivedCount = Math.max(
        existing.unreceivedCount,
        item.unreceivedCount ?? 0,
      );
      continue;
    }

    groupMap.set(item.transportOrderId, {
      applicationId: item.applicationId,
      applicationNo: item.applicationNo,
      batchAbnormalFlag: Boolean(item.batchAbnormalFlag),
      barcodes: normalizeText(item.barcode)
        ? [normalizeText(item.barcode)]
        : [],
      items: [item],
      latestTrackingAt: item.latestTrackingAt,
      patientName: item.patientName,
      reminderCount: item.reminderCount ?? 0,
      transportOrderId: item.transportOrderId,
      unreceivedCount: item.unreceivedCount ?? 0,
    });
  }

  return [...groupMap.values()];
}

export function buildPendingReceiptQuery(
  filters: ReceiptFilters,
): PendingSpecimenQuery {
  return {
    page: filters.page,
    size: filters.size,
    specimenNo: filters.specimenNo.trim() || undefined,
  };
}

export function createReceiptDraftItemsFromGroup(
  group: TransportReceiptGroup,
): ReceiptDraftItem[] {
  return group.items.map((item) => ({
    ...createReceiptDraftItem(item.barcode ?? '', {
      specimenId: item.specimenId,
      specimenNo: item.specimenNo,
    }),
    applicationNo: item.applicationNo,
    containerCount: item.containerCount ?? 1,
    containerName: item.containerName,
    patientName: item.patientName,
  }));
}

export function formatGroupContainerNames(items: PendingSpecimenItem[]) {
  const names = items
    .map((item) => item.containerName?.trim())
    .filter(
      (value, index, values): value is string =>
        Boolean(value) && values.indexOf(value) === index,
    );
  return names.join('、') || '-';
}

export function pickLatestTrackingAt(
  current: null | string,
  next: null | string,
): null | string {
  if (current && next) {
    return [current, next].toSorted()[1] ?? null;
  }

  return current || next;
}

function hasReceiptIdentifier(item: ReceiptDraftItem) {
  return Boolean(
    normalizeText(item.specimenId) ||
    normalizeText(item.specimenBarcode) ||
    normalizeText(item.specimenNo),
  );
}

export function validateReceiptItems(items: ReceiptDraftItem[]) {
  if (items.length === 0) {
    return '当前没有可提交的标本明细';
  }
  if (items.some((item) => !hasReceiptIdentifier(item))) {
    return '请完整填写标本标识';
  }
  if (items.some((item) => !item.receiptStatus.trim())) {
    return '请为每一条标本选择接收结果';
  }
  if (items.some((item) => !item.containerCount || item.containerCount < 1)) {
    return '容器数量必须大于 0';
  }
  if (items.some((item) => !item.qualityCheckResult.trim())) {
    return '请为每一条标本选择质控结果';
  }
  if (
    items.some(
      (item) =>
        item.receiptStatus === 'RECEIVED' &&
        item.qualityCheckResult !== 'PASSED',
    )
  ) {
    return '正常接收的标本质控结果必须为合格';
  }
  if (
    items.some(
      (item) =>
        item.qualityCheckResult === 'FAILED' &&
        !(item.qualityIssueCodes && item.qualityIssueCodes.length > 0),
    )
  ) {
    return '质控不合格时必须选择问题代码';
  }
  if (
    items.some(
      (item) => item.qualityCheckResult === 'FAILED' && !item.reason?.trim(),
    )
  ) {
    return '质控不合格时必须填写原因';
  }
  if (
    items.some(
      (item) => item.receiptStatus !== 'RECEIVED' && !item.reason?.trim(),
    )
  ) {
    return '拒收或退回时必须填写原因';
  }

  return '';
}

export function normalizeReceiptItem(
  item: ReceiptDraftItem,
): SpecimenReceiptItemRequest {
  return {
    containerCount: item.containerCount,
    qualityCheckResult: item.qualityCheckResult.trim(),
    qualityIssueCodes: item.qualityIssueCodes?.length
      ? item.qualityIssueCodes
      : null,
    reason: item.reason?.trim() || null,
    receiptStatus: item.receiptStatus.trim(),
    remarks: item.remarks?.trim() || null,
    specimenBarcode: normalizeText(item.specimenBarcode) || null,
    specimenId: normalizeText(item.specimenId) || null,
    specimenNo: normalizeText(item.specimenNo) || null,
  };
}

export function buildReceiptSubmissionRequest(
  transportOrderId: string,
  form: ReceiptConfirmForm,
  items: ReceiptDraftItem[],
): SpecimenReceiptRequest {
  return {
    items: items.map((item) => normalizeReceiptItem(item)),
    logisticsStaffName: form.logisticsStaffName.trim(),
    receivedByName: form.receivedByName.trim(),
    receivedByUserId: form.receivedByUserId.trim() || null,
    terminalCode: null,
    transportOrderId,
  };
}

export function buildDirectReceiptSubmissionRequest(
  form: ReceiptOperatorForm,
  items: ReceiptDraftItem[],
): DirectSpecimenReceiptRequest {
  return {
    items: items.map((item) => normalizeReceiptItem(item)),
    receivedByName: form.receivedByName.trim() || null,
    receivedByUserId: form.receivedByUserId.trim() || null,
    terminalCode: form.terminalCode.trim() || null,
  };
}

export function buildApplicationFormReprintRequest(
  terminalCode: string,
  transportOrderId: string,
): ApplicationFormReprintRequest {
  return {
    remarks: `标本接收页补打印申请单，转运单：${transportOrderId}`,
    terminalCode: terminalCode.trim() || null,
  };
}
