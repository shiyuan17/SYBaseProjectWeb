import type {
  CreateEquipmentMaintenanceLogRequest,
  CreateEquipmentRecordRequest,
  EquipmentRecordView,
  UpdateEquipmentRecordRequest,
} from '../types/operation-support';

export type EquipmentFormState = {
  enabledAt: string;
  equipmentCategory: string;
  equipmentCode: string;
  equipmentName: string;
  equipmentStatus: string;
  locationDescription: string;
  modelNo: string;
  nextMaintenanceAt: string;
  operatorName: string;
  remarks: string;
};

export type MaintenanceLogFormState = {
  description: string;
  maintenanceStatus: string;
  maintenanceType: string;
  nextMaintenanceAt: string;
  operatorName: string;
  performedAt: string;
  remarks: string;
};

function optionalText(value: string) {
  return value || undefined;
}

export function createEquipmentFormDefaults(
  operatorName: string,
): EquipmentFormState {
  return {
    enabledAt: '',
    equipmentCategory: '',
    equipmentCode: '',
    equipmentName: '',
    equipmentStatus: 'ACTIVE',
    locationDescription: '',
    modelNo: '',
    nextMaintenanceAt: '',
    operatorName,
    remarks: '',
  };
}

export function createEquipmentFormStateFromRow(
  row: EquipmentRecordView,
  operatorName: string,
): EquipmentFormState {
  return {
    enabledAt: row.enabledAt ?? '',
    equipmentCategory: row.equipmentCategory ?? '',
    equipmentCode: row.equipmentCode,
    equipmentName: row.equipmentName,
    equipmentStatus: row.equipmentStatus,
    locationDescription: row.locationDescription ?? '',
    modelNo: row.modelNo ?? '',
    nextMaintenanceAt: row.nextMaintenanceAt ?? '',
    operatorName,
    remarks: row.remarks ?? '',
  };
}

export function createMaintenanceLogFormDefaults(
  operatorName: string,
): MaintenanceLogFormState {
  return {
    description: '',
    maintenanceStatus: 'COMPLETED',
    maintenanceType: 'MAINTENANCE',
    nextMaintenanceAt: '',
    operatorName,
    performedAt: '',
    remarks: '',
  };
}

export function createDraftEquipmentRecordView(): EquipmentRecordView {
  return {
    enabledAt: null,
    equipmentCategory: null,
    equipmentCode: '',
    equipmentName: '',
    equipmentStatus: 'ACTIVE',
    id: '',
    locationDescription: null,
    modelNo: null,
    nextMaintenanceAt: null,
    remarks: null,
  };
}

export function getEquipmentStatusTagType(status?: null | string) {
  if (status === 'ACTIVE') {
    return 'success';
  }
  if (status === 'MAINTENANCE') {
    return 'warning';
  }
  return 'info';
}

export function getEquipmentWarningTagType(type?: null | string) {
  if (type === 'OVERDUE') {
    return 'danger';
  }
  if (type === 'DUE_SOON') {
    return 'warning';
  }
  return 'info';
}

export function validateEquipmentForm(
  form: EquipmentFormState,
  isCreate: boolean,
) {
  if (!form.equipmentName || !form.equipmentStatus || !form.operatorName) {
    return '请填写设备名称、设备状态和操作人';
  }
  if (isCreate && !form.equipmentCode) {
    return '新增设备需要填写设备编码';
  }
  return '';
}

export function validateMaintenanceLogForm(options: {
  form: MaintenanceLogFormState;
  hasSelectedEquipment: boolean;
}) {
  if (!options.hasSelectedEquipment) {
    return '请先选择设备';
  }

  const form = options.form;
  if (
    !form.maintenanceType ||
    !form.maintenanceStatus ||
    !form.performedAt ||
    !form.operatorName
  ) {
    return '请填写维护类型、状态、执行时间和操作人';
  }
  return '';
}

export function buildCreateEquipmentRecordRequest(
  form: EquipmentFormState,
): CreateEquipmentRecordRequest {
  return {
    enabledAt: optionalText(form.enabledAt),
    equipmentCategory: optionalText(form.equipmentCategory),
    equipmentCode: form.equipmentCode,
    equipmentName: form.equipmentName,
    equipmentStatus: form.equipmentStatus,
    locationDescription: optionalText(form.locationDescription),
    modelNo: optionalText(form.modelNo),
    nextMaintenanceAt: optionalText(form.nextMaintenanceAt),
    operatorName: form.operatorName,
    remarks: optionalText(form.remarks),
  };
}

export function buildUpdateEquipmentRecordRequest(
  form: EquipmentFormState,
): UpdateEquipmentRecordRequest {
  return {
    enabledAt: optionalText(form.enabledAt),
    equipmentCategory: optionalText(form.equipmentCategory),
    equipmentName: form.equipmentName,
    equipmentStatus: form.equipmentStatus,
    locationDescription: optionalText(form.locationDescription),
    modelNo: optionalText(form.modelNo),
    nextMaintenanceAt: optionalText(form.nextMaintenanceAt),
    operatorName: form.operatorName,
    remarks: optionalText(form.remarks),
  };
}

export function buildCreateMaintenanceLogRequest(
  form: MaintenanceLogFormState,
): CreateEquipmentMaintenanceLogRequest {
  return {
    description: optionalText(form.description),
    maintenanceStatus: form.maintenanceStatus,
    maintenanceType: form.maintenanceType,
    nextMaintenanceAt: optionalText(form.nextMaintenanceAt),
    operatorName: form.operatorName,
    performedAt: form.performedAt,
    remarks: optionalText(form.remarks),
  };
}
