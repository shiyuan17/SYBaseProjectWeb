import type {
  CreateEquipmentUsageRecordRequest,
  EquipmentRecordView,
} from '../types/operation-support';

import dayjs from 'dayjs';

export type EquipmentCommonDeviceView = Pick<
  EquipmentRecordView,
  | 'equipmentCategory'
  | 'equipmentCode'
  | 'equipmentName'
  | 'equipmentStatus'
  | 'id'
  | 'locationDescription'
> & {
  equipmentId: string;
};

export type EquipmentUsageRecordFormState = {
  commonlyUsed: boolean;
  diagnosisCount: number;
  endedAt: string;
  equipmentCategory: string;
  equipmentCondition: string;
  equipmentId: string;
  equipmentName: string;
  operatorName: string;
  remarks: string;
  runtimeHours: number;
  startedAt: string;
  usageContent: string;
};

function formatDefaultDateTime(hour: number) {
  return dayjs()
    .hour(hour)
    .minute(0)
    .second(0)
    .millisecond(0)
    .format('YYYY-MM-DDTHH:mm:ss');
}

function trimText(value: string) {
  const trimmed = value.trim();
  return trimmed || undefined;
}

export function calculateRuntimeHours(startedAt: string, endedAt: string) {
  if (!startedAt || !endedAt) {
    return 0;
  }
  const start = dayjs(startedAt);
  const end = dayjs(endedAt);
  if (!start.isValid() || !end.isValid() || end.isBefore(start)) {
    return 0;
  }
  return Number((end.diff(start, 'minute') / 60).toFixed(2));
}

export function createEquipmentUsageRecordFormDefaults(
  operatorName: string,
): EquipmentUsageRecordFormState {
  const startedAt = formatDefaultDateTime(8);
  const endedAt = formatDefaultDateTime(17);
  return {
    commonlyUsed: false,
    diagnosisCount: 0,
    endedAt,
    equipmentCategory: '',
    equipmentCondition: '正常',
    equipmentId: '',
    equipmentName: '',
    operatorName,
    remarks: '',
    runtimeHours: calculateRuntimeHours(startedAt, endedAt),
    startedAt,
    usageContent: '',
  };
}

export function applyEquipmentUsageCommonDevice(
  form: EquipmentUsageRecordFormState,
  row: EquipmentCommonDeviceView,
) {
  form.commonlyUsed = true;
  form.equipmentCategory = row.equipmentCategory ?? '';
  form.equipmentId = row.equipmentId;
  form.equipmentName = row.equipmentName;
}

export function syncEquipmentUsageRuntimeHours(
  form: EquipmentUsageRecordFormState,
) {
  form.runtimeHours = calculateRuntimeHours(form.startedAt, form.endedAt);
}

export function validateEquipmentUsageRecordForm(
  form: EquipmentUsageRecordFormState,
) {
  if (!form.equipmentCategory.trim() || !form.equipmentName.trim()) {
    return '请填写设备类型和设备名称';
  }
  if (!form.startedAt || !form.endedAt) {
    return '请选择开机时间和关机时间';
  }
  if (dayjs(form.endedAt).isBefore(dayjs(form.startedAt))) {
    return '关机时间不能早于开机时间';
  }
  if (!form.operatorName.trim()) {
    return '请填写使用人';
  }
  if (!form.equipmentCondition.trim()) {
    return '请填写设备状况';
  }
  if (form.runtimeHours < 0) {
    return '运行时长不能小于 0';
  }
  if (form.diagnosisCount < 0) {
    return '诊治数量不能小于 0';
  }
  return '';
}

export function buildCreateEquipmentUsageRecordRequest(
  form: EquipmentUsageRecordFormState,
): CreateEquipmentUsageRecordRequest {
  return {
    commonlyUsed: form.commonlyUsed,
    diagnosisCount: form.diagnosisCount,
    endedAt: form.endedAt,
    equipmentCategory: form.equipmentCategory,
    equipmentCondition: form.equipmentCondition,
    equipmentId: trimText(form.equipmentId),
    equipmentName: form.equipmentName,
    remarks: trimText(form.remarks),
    runtimeHours: form.runtimeHours,
    startedAt: form.startedAt,
    usageOperatorName: form.operatorName,
    usageContent: trimText(form.usageContent),
  };
}
