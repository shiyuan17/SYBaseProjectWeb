import type {
  CreateMedicalOrderRequest,
  DiagnosticTaskActionRequest,
  MedicalOrderActionRequest,
} from '../types/doctor-workflow';

export function createDiagnosticTaskActionDefaults(
  operatorName = '',
): DiagnosticTaskActionRequest {
  return {
    operatorName,
    remarks: '',
    terminalCode: '',
  };
}

export function createMedicalOrderDefaults(
  caseId = '',
  operatorName = '',
  operatorUserId = '',
  terminalCode = '',
): CreateMedicalOrderRequest {
  return {
    caseId,
    operatorName,
    operatorUserId,
    orderContent: '',
    orderType: '',
    remarks: '',
    terminalCode,
  };
}

function optionalText(value?: string) {
  return value?.trim() || undefined;
}

export function validateMedicalOrderForm(form: CreateMedicalOrderRequest) {
  if (!form.caseId.trim()) {
    return '缺少病例 ID';
  }
  if (!form.operatorName.trim()) {
    return '请填写操作人姓名';
  }
  if (!form.orderType) {
    return '请选择医嘱类型';
  }
  if (!form.orderContent.trim()) {
    return '请填写医嘱内容';
  }
  return '';
}

export function buildCreateMedicalOrderRequest(
  form: CreateMedicalOrderRequest,
): CreateMedicalOrderRequest {
  return {
    caseId: form.caseId.trim(),
    operatorName: form.operatorName.trim(),
    operatorUserId: optionalText(form.operatorUserId),
    orderContent: form.orderContent.trim(),
    orderType: form.orderType,
    remarks: optionalText(form.remarks),
    terminalCode: optionalText(form.terminalCode),
  };
}

export function buildCancelMedicalOrderRequest(options: {
  operatorName: string;
  operatorUserId?: string;
  remarks?: string;
  terminalCode?: string;
}): MedicalOrderActionRequest {
  return {
    operatorName: options.operatorName.trim(),
    operatorUserId: optionalText(options.operatorUserId),
    remarks: optionalText(options.remarks),
    terminalCode: optionalText(options.terminalCode),
  };
}
