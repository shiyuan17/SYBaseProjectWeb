import type {
  ArchiveApplicationFormRequest,
  ArchiveCabinetView,
  ArchiveEmbeddingBoxRequest,
  ArchiveSlideRequest,
  ArchiveSpecimenRequest,
  BatchCreateArchiveCabinetRequest,
  CreateArchiveCabinetRequest,
  CreateMaterialLoanRequest,
  ReturnMaterialLoanRequest,
  UpdateArchiveCabinetRequest,
} from '../types/operation-support';

export type CabinetFormState = {
  cabinetCode: string;
  cabinetName: string;
  cabinetStatus: string;
  cabinetType: string;
  layerCount: number;
  locationDescription: string;
  operatorName: string;
  operatorUserId: string;
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
  remarks: string;
  slotCountPerLayer: number;
  startNo: number;
  terminalCode: string;
};

export type ArchiveFormState = {
  caseId: string;
  embeddingBoxId: string;
  fileName: string;
  fileUrl: string;
  objectType: string;
  operatorName: string;
  operatorUserId: string;
  remarks: string;
  slideId: string;
  specimenId: string;
  terminalCode: string;
};

export type LoanFormState = {
  borrowedByName: string;
  borrowedByUserId: string;
  borrowPurpose: string;
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
    cabinetCode: '',
    cabinetName: '',
    cabinetStatus: 'ACTIVE',
    cabinetType: 'STANDARD',
    layerCount: 1,
    locationDescription: '',
    operatorName: operator.operatorName,
    operatorUserId: operator.operatorUserId,
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
    cabinetType: 'STANDARD',
    count: 1,
    layerCount: 1,
    locationDescription: '',
    numberWidth: 3,
    operatorName: operator.operatorName,
    operatorUserId: operator.operatorUserId,
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
    cabinetCode: cabinet.cabinetCode,
    cabinetName: cabinet.cabinetName,
    cabinetStatus: cabinet.cabinetStatus,
    cabinetType: cabinet.cabinetType,
    layerCount: cabinet.layerCount,
    locationDescription: cabinet.locationDescription ?? '',
    operatorName: operator.operatorName,
    operatorUserId: operator.operatorUserId,
    remarks: cabinet.remarks ?? '',
    slotCountPerLayer: cabinet.slotCountPerLayer,
    terminalCode: '',
  };
}

export function createArchiveFormDefaults(
  operator: OperatorDefaults,
): ArchiveFormState {
  return {
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
    borrowPurpose: '',
    borrowedByName: '',
    borrowedByUserId: '',
    materialId: '',
    materialType: 'SLIDE',
    operatorName: operator.operatorName,
    operatorUserId: operator.operatorUserId,
    remarks: '',
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
  if (!form.cabinetName.trim()) {
    return '请填写归档柜名称。';
  }
  if (!form.operatorName.trim()) {
    return '请填写操作人。';
  }
  if (mode === 'create' && !form.cabinetCode.trim()) {
    return '新增归档柜时必须填写归档柜编号。';
  }
  if (form.layerCount < 1 || form.slotCountPerLayer < 1) {
    return '层数和每层柜位数必须大于 0。';
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
}) {
  const {
    canArchiveObjectType,
    canQueryCabinets,
    form,
    hasSelectedPosition,
    permissionWarning,
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
    return form.caseId.trim() ? '' : '申请单归档必须填写病例 ID。';
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
    remarks: optionalText(form.remarks),
    slotCountPerLayer: form.slotCountPerLayer,
    startNo: form.startNo,
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

export function buildCreateMaterialLoanRequest(
  form: LoanFormState,
): CreateMaterialLoanRequest {
  return {
    borrowPurpose: optionalText(form.borrowPurpose),
    borrowedByName: form.borrowedByName.trim(),
    borrowedByUserId: optionalText(form.borrowedByUserId),
    materialId: form.materialId.trim(),
    materialType: form.materialType,
    operatorName: form.operatorName.trim(),
    operatorUserId: optionalText(form.operatorUserId),
    remarks: optionalText(form.remarks),
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
