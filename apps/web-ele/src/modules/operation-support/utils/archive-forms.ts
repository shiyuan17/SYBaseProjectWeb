import type {
  ArchiveApplicationFormRequest,
  ArchiveCabinetNodeType,
  ArchiveCabinetNodeView,
  ArchiveCabinetView,
  ArchiveEmbeddingBoxRequest,
  ArchiveObjectType,
  ArchiveSlideRequest,
  ArchiveSpecimenRequest,
  BatchArchiveObjectRequest,
  BatchArchiveSpecimenRequest,
  BatchCreateArchiveCabinetRequest,
  CreateArchiveCabinetNodeRequest,
  CreateArchiveCabinetRequest,
  CreateMaterialLoanAbnormalRecordRequest,
  CreateMaterialLoanRequest,
  ReturnMaterialLoanRequest,
  UpdateArchiveCabinetNodeRequest,
  UpdateArchiveCabinetRequest,
} from '../types/operation-support';

export type CabinetFormState = {
  cabinetCode: string;
  cabinetName: string;
  cabinetStatus: string;
  cabinetType: string;
  capacity: number;
  layerCount: number;
  locationDescription: string;
  nodeCode: string;
  nodeType: ArchiveCabinetNodeType;
  operatorName: string;
  operatorUserId: string;
  parentId: string;
  pathLocation: string;
  remainingCapacity: number;
  remarks: string;
  slotCountPerLayer: number;
  terminalCode: string;
};

export type BatchCabinetFormState = {
  cabinetCodePrefix: string;
  cabinetNamePrefix: string;
  cabinetType: string;
  count: number;
  layerCount: number;
  locationDescription: string;
  numberWidth: number;
  operatorName: string;
  operatorUserId: string;
  parentId: string;
  remarks: string;
  slotCountPerLayer: number;
  startNo: number;
  terminalCode: string;
};

export type ArchiveFormState = {
  archiveCabinetId: string;
  archiveExpiresAt: string;
  archiveReminderDays: null | number;
  caseId: string;
  embeddingBoxId: string;
  fileName: string;
  fileUrl: string;
  objectType: ArchiveObjectType;
  operatorName: string;
  operatorUserId: string;
  remarks: string;
  slideId: string;
  specimenId: string;
  terminalCode: string;
};

export type ArchiveApplicationFormSelection = {
  applicationNo?: null | string;
  archivedAt?: null | string;
  archiveLocation?: null | string;
  archiveStatus?: null | string;
  caseId: string;
  objectCode?: null | string;
  objectId: string;
  objectType: ArchiveObjectType | string;
  pathologyNo?: null | string;
  patientName?: null | string;
  storedByName?: null | string;
};

export type ArchivePhysicalSelection = {
  objectId: string;
};

export type LoanFormState = {
  borrowedByName: string;
  borrowedByUserId: string;
  borrowerPhone: string;
  borrowerUnit: string;
  borrowPurpose: string;
  depositAmount: string;
  materialId: string;
  materialType: string;
  operatorName: string;
  operatorUserId: string;
  remarks: string;
  terminalCode: string;
};

export type ReturnFormState = {
  operatorName: string;
  operatorUserId: string;
  remarks: string;
  terminalCode: string;
};

export type MaterialLoanAbnormalFormState = {
  abnormalReason: string;
  borrowedAt: string;
  borrowedContent: string;
  borrowedSlideNo: string;
  borrowerIdentityNo: string;
  borrowerName: string;
  borrowerPhone: string;
  borrowerRelationship: string;
  borrowerUnit: string;
  contacted: boolean;
  contactResult: string;
  depositAmount: string;
  expectedReturnAt: string;
  loanId: string;
  materialId: string;
  materialType: string;
  returnAbnormalInfo: string;
  slideCount: number;
  terminalCode: string;
};

export type OperatorDefaults = {
  operatorName: string;
  operatorUserId: string;
};

function optionalText(value: string) {
  return value.trim() || undefined;
}

export function createCabinetFormDefaults(
  operator: OperatorDefaults,
): CabinetFormState {
  return {
    capacity: 10,
    cabinetCode: '',
    cabinetName: '',
    cabinetStatus: 'ACTIVE',
    cabinetType: 'APPLICATION_FORM',
    layerCount: 1,
    locationDescription: '',
    nodeCode: '',
    nodeType: 'CABINET',
    operatorName: operator.operatorName,
    operatorUserId: operator.operatorUserId,
    parentId: '',
    pathLocation: '',
    remainingCapacity: 10,
    remarks: '',
    slotCountPerLayer: 10,
    terminalCode: '',
  };
}

export function createBatchCabinetFormDefaults(
  operator: OperatorDefaults,
): BatchCabinetFormState {
  return {
    cabinetCodePrefix: '',
    cabinetNamePrefix: '',
    cabinetType: 'APPLICATION_FORM',
    count: 1,
    layerCount: 1,
    locationDescription: '',
    numberWidth: 3,
    operatorName: operator.operatorName,
    operatorUserId: operator.operatorUserId,
    parentId: '',
    remarks: '',
    slotCountPerLayer: 10,
    startNo: 1,
    terminalCode: '',
  };
}

export function createCabinetFormStateFromCabinet(
  cabinet: ArchiveCabinetView,
  operator: OperatorDefaults,
): CabinetFormState {
  return {
    capacity: cabinet.capacity,
    cabinetCode: cabinet.cabinetCode,
    cabinetName: cabinet.cabinetName,
    cabinetStatus: cabinet.cabinetStatus,
    cabinetType: cabinet.cabinetType,
    layerCount: cabinet.layerCount,
    locationDescription: cabinet.locationDescription ?? '',
    nodeCode: cabinet.cabinetCode,
    nodeType: 'CABINET',
    operatorName: operator.operatorName,
    operatorUserId: operator.operatorUserId,
    parentId: '',
    pathLocation: cabinet.locationDescription ?? '',
    remainingCapacity: 0,
    remarks: cabinet.remarks ?? '',
    slotCountPerLayer: cabinet.slotCountPerLayer,
    terminalCode: '',
  };
}

export function createCabinetFormStateFromNode(
  node: ArchiveCabinetNodeView,
  operator: OperatorDefaults,
): CabinetFormState {
  const capacity = node.capacity;
  return {
    capacity,
    cabinetCode: node.nodeCode,
    cabinetName: node.nodeCode,
    cabinetStatus: 'ACTIVE',
    cabinetType: node.cabinetType ?? 'APPLICATION_FORM',
    layerCount: 1,
    locationDescription: node.pathLocation ?? '',
    nodeCode: node.nodeCode,
    nodeType: node.nodeType,
    operatorName: operator.operatorName,
    operatorUserId: operator.operatorUserId,
    parentId: node.parentId ?? '',
    pathLocation: node.pathLocation ?? '',
    remainingCapacity: node.remainingCapacity,
    remarks: node.remarks ?? '',
    slotCountPerLayer: Math.max(1, capacity),
    terminalCode: '',
  };
}

export function createArchiveFormDefaults(
  operator: OperatorDefaults,
): ArchiveFormState {
  return {
    archiveCabinetId: '',
    archiveExpiresAt: '',
    archiveReminderDays: null,
    caseId: '',
    embeddingBoxId: '',
    fileName: '',
    fileUrl: '',
    objectType: 'APPLICATION_FORM',
    operatorName: operator.operatorName,
    operatorUserId: operator.operatorUserId,
    remarks: '',
    slideId: '',
    specimenId: '',
    terminalCode: '',
  };
}

export function createLoanFormDefaults(
  operator: OperatorDefaults,
): LoanFormState {
  return {
    borrowerPhone: '',
    borrowerUnit: '',
    borrowPurpose: '',
    borrowedByName: '',
    borrowedByUserId: '',
    depositAmount: '',
    materialId: '',
    materialType: 'SLIDE',
    operatorName: operator.operatorName,
    operatorUserId: operator.operatorUserId,
    remarks: '',
    terminalCode: '',
  };
}

export function createMaterialLoanAbnormalFormDefaults(): MaterialLoanAbnormalFormState {
  return {
    abnormalReason: '',
    borrowedAt: '',
    borrowedContent: '',
    borrowedSlideNo: '',
    borrowerIdentityNo: '',
    borrowerName: '',
    borrowerPhone: '',
    borrowerRelationship: '',
    borrowerUnit: '',
    contactResult: '',
    contacted: false,
    depositAmount: '',
    expectedReturnAt: '',
    loanId: '',
    materialId: '',
    materialType: 'SLIDE',
    returnAbnormalInfo: '',
    slideCount: 1,
    terminalCode: '',
  };
}

export function createReturnFormDefaults(
  operator: OperatorDefaults,
): ReturnFormState {
  return {
    operatorName: operator.operatorName,
    operatorUserId: operator.operatorUserId,
    remarks: '',
    terminalCode: '',
  };
}

export function validateCabinetForm(
  form: CabinetFormState,
  mode: 'create' | 'edit' | null,
) {
  if (!form.nodeCode.trim()) {
    return '请填写编号。';
  }
  if (mode === 'edit' && !form.operatorName.trim()) {
    return '请填写操作人。';
  }
  if (!['AREA', 'CABINET', 'DRAWER'].includes(form.nodeType)) {
    return '请选择节点类型。';
  }
  if (form.nodeType === 'CABINET' && !form.cabinetType.trim()) {
    return '柜子节点必须选择柜子类型。';
  }
  if (form.nodeType === 'DRAWER' && !form.parentId.trim()) {
    return '抽屉节点必须选择父柜子。';
  }
  if (form.nodeType !== 'AREA' && form.capacity < 1) {
    return '总容量必须大于 0。';
  }
  if (mode === 'edit' && form.capacity < 0) {
    return '总容量不能小于 0。';
  }
  return '';
}

export function validateBatchCabinetForm(form: BatchCabinetFormState) {
  if (!form.cabinetCodePrefix.trim()) {
    return '请填写归档柜编号前缀。';
  }
  if (!form.operatorName.trim()) {
    return '请填写操作人。';
  }
  if (form.startNo < 0) {
    return '起始序号不能小于 0。';
  }
  if (form.count < 1 || form.count > 100) {
    return '批量添加数量必须在 1 到 100 之间。';
  }
  if (form.numberWidth < 1 || form.numberWidth > 10) {
    return '序号位数必须在 1 到 10 之间。';
  }
  if (form.layerCount < 1 || form.slotCountPerLayer < 1) {
    return '层数和每层柜位数必须大于 0。';
  }
  return '';
}

export function validateArchiveForm(options: {
  canArchiveObjectType: boolean;
  canQueryCabinets: boolean;
  form: ArchiveFormState;
  hasSelectedPosition: boolean;
  permissionWarning: string;
  selectedApplicationFormRecordCount?: number;
}) {
  const {
    canArchiveObjectType,
    canQueryCabinets,
    form,
    hasSelectedPosition,
    permissionWarning,
    selectedApplicationFormRecordCount = 0,
  } = options;

  if (!canArchiveObjectType) {
    return permissionWarning;
  }
  if (!canQueryCabinets || !hasSelectedPosition) {
    return '请先在柜位工作站中选择一个可用柜位。';
  }
  if (!form.operatorName.trim()) {
    return '请填写归档操作人。';
  }
  if (form.objectType === 'APPLICATION_FORM') {
    return selectedApplicationFormRecordCount > 0
      ? ''
      : '请先勾选至少一条申请单记录。';
  }
  if (form.objectType === 'EMBEDDING_BOX') {
    return form.embeddingBoxId.trim() ? '' : '蜡块归档必须填写蜡块 ID。';
  }
  if (form.objectType === 'SLIDE') {
    return form.slideId.trim() ? '' : '玻片归档必须填写玻片 ID。';
  }
  if (form.objectType === 'SPECIMEN') {
    return form.specimenId.trim() ? '' : '标本归档必须填写标本 ID。';
  }
  return '';
}

export function validateBatchArchiveForm(options: {
  canArchiveObjectType: boolean;
  canQueryCabinets: boolean;
  form: ArchiveFormState;
  hasSelectedCabinet: boolean;
  objectType: ArchiveObjectType;
  permissionWarning: string;
  selectedRecordCount: number;
}) {
  const {
    canArchiveObjectType,
    canQueryCabinets,
    form,
    hasSelectedCabinet,
    objectType,
    permissionWarning,
    selectedRecordCount,
  } = options;

  if (!canArchiveObjectType) {
    return permissionWarning;
  }
  if (!canQueryCabinets || !hasSelectedCabinet) {
    return '请选择归档框编号。';
  }
  if (selectedRecordCount <= 0) {
    return '请先勾选至少一条归档记录。';
  }
  if (!form.operatorName.trim()) {
    return '请填写归档操作人。';
  }
  if (
    objectType === 'SPECIMEN' &&
    form.archiveReminderDays !== null &&
    form.archiveReminderDays < 0
  ) {
    return '剩余几天提醒不能小于 0。';
  }
  return '';
}

export function validateLoanForm(form: LoanFormState, canCreateLoan: boolean) {
  if (!canCreateLoan) {
    return '当前账号缺少借出权限。';
  }
  if (!form.materialId.trim()) {
    return '请填写借出材料 ID。';
  }
  if (!form.borrowedByName.trim()) {
    return '请填写借阅人姓名。';
  }
  if (!form.operatorName.trim()) {
    return '请填写借出操作人。';
  }
  return '';
}

export function validateMaterialLoanAbnormalForm(
  form: MaterialLoanAbnormalFormState,
  canRegisterLoanAbnormal: boolean,
) {
  if (!canRegisterLoanAbnormal) {
    return '当前账号缺少异常登记权限。';
  }
  if (!form.materialId.trim()) {
    return '请先选择需要登记异常的材料。';
  }
  if (!form.abnormalReason.trim()) {
    return '请填写异常原因。';
  }
  return '';
}

export function validateReturnForm(options: {
  canReturnLoan: boolean;
  form: ReturnFormState;
  hasReturningLoan: boolean;
}) {
  if (!options.canReturnLoan) {
    return '当前账号缺少归还权限。';
  }
  if (!options.hasReturningLoan) {
    return '请先选择待归还记录。';
  }
  if (!options.form.operatorName.trim()) {
    return '请填写归还操作人。';
  }
  return '';
}

export function buildCreateCabinetRequest(
  form: CabinetFormState,
): CreateArchiveCabinetRequest {
  return {
    cabinetCode: form.cabinetCode.trim(),
    cabinetName: form.cabinetName.trim(),
    cabinetType: form.cabinetType,
    layerCount: form.layerCount,
    locationDescription: optionalText(form.locationDescription),
    operatorName: form.operatorName.trim(),
    operatorUserId: optionalText(form.operatorUserId),
    remarks: optionalText(form.remarks),
    slotCountPerLayer: form.slotCountPerLayer,
    terminalCode: optionalText(form.terminalCode),
  };
}

export function buildBatchCreateCabinetRequest(
  form: BatchCabinetFormState,
): BatchCreateArchiveCabinetRequest {
  return {
    cabinetCodePrefix: form.cabinetCodePrefix.trim(),
    cabinetNamePrefix: optionalText(form.cabinetNamePrefix),
    cabinetType: form.cabinetType,
    count: form.count,
    layerCount: form.layerCount,
    locationDescription: optionalText(form.locationDescription),
    numberWidth: form.numberWidth,
    operatorName: form.operatorName.trim(),
    operatorUserId: optionalText(form.operatorUserId),
    parentId: optionalText(form.parentId),
    remarks: optionalText(form.remarks),
    slotCountPerLayer: form.slotCountPerLayer,
    startNo: form.startNo,
    terminalCode: optionalText(form.terminalCode),
  };
}

export function buildCreateCabinetNodeRequest(
  form: CabinetFormState,
): CreateArchiveCabinetNodeRequest {
  return {
    cabinetType:
      form.nodeType === 'CABINET' ? optionalText(form.cabinetType) : undefined,
    capacity: form.nodeType === 'AREA' ? 0 : form.capacity,
    nodeCode: form.nodeCode.trim(),
    nodeType: form.nodeType,
    parentId: optionalText(form.parentId),
    pathLocation: optionalText(form.pathLocation),
    remarks: optionalText(form.remarks),
    terminalCode: optionalText(form.terminalCode),
  };
}

export function buildUpdateCabinetRequest(
  form: CabinetFormState,
): UpdateArchiveCabinetRequest {
  return {
    cabinetName: form.cabinetName.trim(),
    cabinetStatus: form.cabinetStatus,
    locationDescription: optionalText(form.locationDescription),
    operatorName: form.operatorName.trim(),
    operatorUserId: optionalText(form.operatorUserId),
    remarks: optionalText(form.remarks),
    terminalCode: optionalText(form.terminalCode),
  };
}

export function buildUpdateCabinetNodeRequest(
  form: CabinetFormState,
): UpdateArchiveCabinetNodeRequest {
  return {
    cabinetType:
      form.nodeType === 'CABINET' ? optionalText(form.cabinetType) : undefined,
    capacity: form.nodeType === 'AREA' ? 0 : form.capacity,
    nodeCode: form.nodeCode.trim(),
    pathLocation: optionalText(form.pathLocation),
    remarks: optionalText(form.remarks),
    terminalCode: optionalText(form.terminalCode),
  };
}

export function buildArchiveApplicationFormRequest(
  form: ArchiveFormState,
  archivePositionId: string,
): ArchiveApplicationFormRequest {
  return {
    archivePositionId,
    caseId: form.caseId.trim(),
    fileName: optionalText(form.fileName),
    fileUrl: optionalText(form.fileUrl),
    operatorName: form.operatorName.trim(),
    operatorUserId: optionalText(form.operatorUserId),
    remarks: optionalText(form.remarks),
    terminalCode: optionalText(form.terminalCode),
  };
}

export function buildArchiveApplicationFormRequests(
  records: ArchiveApplicationFormSelection[],
  form: ArchiveFormState,
  archivePositionId: string,
) {
  return records.map((record) => ({
    archivePositionId,
    caseId: record.caseId.trim(),
    fileName: optionalText(form.fileName),
    fileUrl: optionalText(form.fileUrl),
    operatorName: form.operatorName.trim(),
    operatorUserId: optionalText(form.operatorUserId),
    remarks: optionalText(form.remarks),
    terminalCode: optionalText(form.terminalCode),
  }));
}

export function buildArchiveEmbeddingBoxRequest(
  form: ArchiveFormState,
  archivePositionId: string,
): ArchiveEmbeddingBoxRequest {
  return {
    archivePositionId,
    embeddingBoxId: form.embeddingBoxId.trim(),
    operatorName: form.operatorName.trim(),
    operatorUserId: optionalText(form.operatorUserId),
    remarks: optionalText(form.remarks),
    terminalCode: optionalText(form.terminalCode),
  };
}

export function buildArchiveSlideRequest(
  form: ArchiveFormState,
  archivePositionId: string,
): ArchiveSlideRequest {
  return {
    archivePositionId,
    operatorName: form.operatorName.trim(),
    operatorUserId: optionalText(form.operatorUserId),
    remarks: optionalText(form.remarks),
    slideId: form.slideId.trim(),
    terminalCode: optionalText(form.terminalCode),
  };
}

export function buildArchiveSpecimenRequest(
  form: ArchiveFormState,
  archivePositionId: string,
): ArchiveSpecimenRequest {
  return {
    archivePositionId,
    operatorName: form.operatorName.trim(),
    operatorUserId: optionalText(form.operatorUserId),
    remarks: optionalText(form.remarks),
    specimenId: form.specimenId.trim(),
    terminalCode: optionalText(form.terminalCode),
  };
}

export function buildBatchArchiveObjectRequest(
  records: ArchivePhysicalSelection[],
  form: ArchiveFormState,
  archiveCabinetId = form.archiveCabinetId,
): BatchArchiveObjectRequest {
  return {
    archiveCabinetId,
    objectIds: records.map((record) => record.objectId.trim()),
    remarks: optionalText(form.remarks),
    terminalCode: optionalText(form.terminalCode),
  };
}

export function buildBatchArchiveSpecimenRequest(
  records: ArchivePhysicalSelection[],
  form: ArchiveFormState,
  archiveCabinetId = form.archiveCabinetId,
): BatchArchiveSpecimenRequest {
  return {
    ...buildBatchArchiveObjectRequest(records, form, archiveCabinetId),
    archiveExpiresAt: optionalText(form.archiveExpiresAt),
    archiveReminderDays:
      form.archiveReminderDays === null ? undefined : form.archiveReminderDays,
  };
}

export function buildCreateMaterialLoanRequest(
  form: LoanFormState,
): CreateMaterialLoanRequest {
  const loanRemarks = [
    form.remarks.trim(),
    form.borrowerPhone.trim() ? `借阅人电话：${form.borrowerPhone.trim()}` : '',
    form.borrowerUnit.trim() ? `借阅人单位：${form.borrowerUnit.trim()}` : '',
    form.depositAmount.trim() ? `押金：${form.depositAmount.trim()}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return {
    borrowPurpose: optionalText(form.borrowPurpose),
    borrowedByName: form.borrowedByName.trim(),
    borrowedByUserId: optionalText(form.borrowedByUserId),
    materialId: form.materialId.trim(),
    materialType: form.materialType,
    operatorName: form.operatorName.trim(),
    operatorUserId: optionalText(form.operatorUserId),
    remarks: optionalText(loanRemarks),
    terminalCode: optionalText(form.terminalCode),
  };
}

export function buildCreateMaterialLoanAbnormalRecordRequest(
  form: MaterialLoanAbnormalFormState,
): CreateMaterialLoanAbnormalRecordRequest {
  return {
    abnormalReason: form.abnormalReason.trim(),
    borrowedAt: optionalText(form.borrowedAt),
    borrowedContent: optionalText(form.borrowedContent),
    borrowedSlideNo: optionalText(form.borrowedSlideNo),
    borrowerIdentityNo: optionalText(form.borrowerIdentityNo),
    borrowerName: optionalText(form.borrowerName),
    borrowerPhone: optionalText(form.borrowerPhone),
    borrowerRelationship: optionalText(form.borrowerRelationship),
    borrowerUnit: optionalText(form.borrowerUnit),
    contactResult: optionalText(form.contactResult),
    contacted: form.contacted,
    depositAmount: optionalText(form.depositAmount),
    expectedReturnAt: optionalText(form.expectedReturnAt),
    loanId: optionalText(form.loanId),
    materialId: form.materialId.trim(),
    materialType: form.materialType,
    returnAbnormalInfo: optionalText(form.returnAbnormalInfo),
    slideCount: form.slideCount,
    terminalCode: optionalText(form.terminalCode),
  };
}

export function buildReturnMaterialLoanRequest(
  form: ReturnFormState,
  archivePositionId?: string,
): ReturnMaterialLoanRequest {
  return {
    archivePositionId,
    operatorName: form.operatorName.trim(),
    operatorUserId: optionalText(form.operatorUserId),
    remarks: optionalText(form.remarks),
    terminalCode: optionalText(form.terminalCode),
  };
}
