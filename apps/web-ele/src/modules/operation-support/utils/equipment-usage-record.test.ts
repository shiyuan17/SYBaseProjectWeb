import { describe, expect, it } from 'vitest';

import {
  applyEquipmentUsageCommonDevice,
  buildCreateEquipmentUsageRecordRequest,
  calculateRuntimeHours,
  createEquipmentUsageRecordFormDefaults,
  syncEquipmentUsageRuntimeHours,
  validateEquipmentUsageRecordForm,
} from './equipment-usage-record';

describe('equipment-usage-record utils', () => {
  it('creates defaults aligned with legacy dialog', () => {
    const form = createEquipmentUsageRecordFormDefaults('周永坚');
    expect(form.operatorName).toBe('周永坚');
    expect(form.equipmentCondition).toBe('正常');
    expect(form.runtimeHours).toBe(9);
    expect(form.commonlyUsed).toBe(false);
  });

  it('calculates runtime hours from datetime range', () => {
    expect(
      calculateRuntimeHours('2026-06-16T08:00:00', '2026-06-16T17:30:00'),
    ).toBe(9.5);
  });

  it('applies common device back to the form', () => {
    const form = createEquipmentUsageRecordFormDefaults('周永坚');
    applyEquipmentUsageCommonDevice(form, {
      equipmentCategory: '显微镜',
      equipmentCode: 'EQ-001',
      equipmentId: 'EQ-ID-1',
      equipmentName: '生物显微镜',
      equipmentStatus: 'ACTIVE',
      locationDescription: '镜检室',
    });
    expect(form.equipmentId).toBe('EQ-ID-1');
    expect(form.equipmentCategory).toBe('显微镜');
    expect(form.commonlyUsed).toBe(true);
  });

  it('syncs runtime hours and validates required fields', () => {
    const form = createEquipmentUsageRecordFormDefaults('周永坚');
    form.equipmentCategory = '显微镜';
    form.equipmentName = '生物显微镜';
    form.startedAt = '2026-06-16T08:00:00';
    form.endedAt = '2026-06-16T18:15:00';
    syncEquipmentUsageRuntimeHours(form);
    expect(form.runtimeHours).toBe(10.25);
    expect(validateEquipmentUsageRecordForm(form)).toBe('');
  });

  it('builds request payload without blank optional fields', () => {
    const form = createEquipmentUsageRecordFormDefaults('周永坚');
    form.equipmentCategory = '显微镜';
    form.equipmentName = '生物显微镜';
    const request = buildCreateEquipmentUsageRecordRequest(form);
    expect(request).not.toHaveProperty('usageContent', '');
    expect(request.usageOperatorName).toBe('周永坚');
    expect(request.runtimeHours).toBe(9);
  });
});
