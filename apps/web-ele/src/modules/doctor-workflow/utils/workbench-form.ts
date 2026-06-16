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
  terminalCode = '',
): CreateMedicalOrderRequest {
  return {
    caseId,
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
    orderContent: form.orderContent.trim(),
    orderType: form.orderType,
    remarks: optionalText(form.remarks),
    terminalCode: optionalText(form.terminalCode),
  };
}

export function buildCancelMedicalOrderRequest(options: {
  remarks?: string;
  terminalCode?: string;
}): MedicalOrderActionRequest {
  return {
    remarks: optionalText(options.remarks),
    terminalCode: optionalText(options.terminalCode),
  };
}
