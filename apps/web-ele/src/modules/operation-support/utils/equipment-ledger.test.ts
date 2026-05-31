import type { EquipmentRecordView } from '../types/operation-support';

import { describe, expect, it } from 'vitest';

import {
  buildCreateEquipmentRecordRequest,
  buildCreateMaintenanceLogRequest,
  buildUpdateEquipmentRecordRequest,
  createDraftEquipmentRecordView,
  createEquipmentFormDefaults,
  createEquipmentFormStateFromRow,
  createMaintenanceLogFormDefaults,
  getEquipmentStatusTagType,
  getEquipmentWarningTagType,
  validateEquipmentForm,
  validateMaintenanceLogForm,
} from './equipment-ledger';

function createEquipment(
  overrides: Partial<EquipmentRecordView> = {},
): EquipmentRecordView {
  return {
    enabledAt: '2026-01-01',
    equipmentCategory: 'PROCESSING',
    equipmentCode: 'EQ-1',
    equipmentName: 'Processor',
    equipmentStatus: 'ACTIVE',
    id: 'EQUIPMENT-1',
    locationDescription: 'Lab A',
    modelNo: 'M-1',
    nextMaintenanceAt: '2026-06-01',
    remarks: 'Ready',
    ...overrides,
  };
}

describe('equipment ledger helpers', () => {
  it('creates default and draft equipment states', () => {
    expect(createEquipmentFormDefaults('Alice')).toEqual(
      expect.objectContaining({
        equipmentStatus: 'ACTIVE',
        operatorName: 'Alice',
      }),
    );
    expect(createMaintenanceLogFormDefaults('Alice')).toEqual(
      expect.objectContaining({
        maintenanceStatus: 'COMPLETED',
        maintenanceType: 'MAINTENANCE',
        operatorName: 'Alice',
      }),
    );
    expect(createDraftEquipmentRecordView()).toEqual(
      expect.objectContaining({
        equipmentCode: '',
        equipmentStatus: 'ACTIVE',
        id: '',
      }),
    );
  });

  it('maps an existing equipment row into edit form state', () => {
    expect(
      createEquipmentFormStateFromRow(
        createEquipment({
          locationDescription: null,
          remarks: null,
        }),
        'Alice',
      ),
    ).toEqual(
      expect.objectContaining({
        equipmentCode: 'EQ-1',
        locationDescription: '',
        operatorName: 'Alice',
        remarks: '',
      }),
    );
  });

  it('validates equipment and maintenance log forms', () => {
    const equipmentForm = createEquipmentFormDefaults('Alice');

    expect(validateEquipmentForm(equipmentForm, true)).toBeTruthy();
    Object.assign(equipmentForm, {
      equipmentCode: 'EQ-1',
      equipmentName: 'Processor',
    });
    expect(validateEquipmentForm(equipmentForm, true)).toBe('');

    const logForm = createMaintenanceLogFormDefaults('Alice');
    expect(
      validateMaintenanceLogForm({
        form: logForm,
        hasSelectedEquipment: false,
      }),
    ).toBeTruthy();
    logForm.performedAt = '2026-05-30';
    expect(
      validateMaintenanceLogForm({
        form: logForm,
        hasSelectedEquipment: true,
      }),
    ).toBe('');
  });

  it('builds equipment create and update requests with stable field sets', () => {
    const form = createEquipmentFormDefaults('Alice');
    Object.assign(form, {
      enabledAt: '2026-01-01',
      equipmentCode: 'EQ-1',
      equipmentName: 'Processor',
      locationDescription: '',
      modelNo: 'M-1',
    });

    expect(buildCreateEquipmentRecordRequest(form)).toEqual({
      enabledAt: '2026-01-01',
      equipmentCategory: undefined,
      equipmentCode: 'EQ-1',
      equipmentName: 'Processor',
      equipmentStatus: 'ACTIVE',
      locationDescription: undefined,
      modelNo: 'M-1',
      nextMaintenanceAt: undefined,
      operatorName: 'Alice',
      remarks: undefined,
    });
    expect(buildUpdateEquipmentRecordRequest(form)).toEqual(
      expect.not.objectContaining({
        equipmentCode: 'EQ-1',
      }),
    );
  });

  it('builds maintenance log requests and maps tags', () => {
    const form = createMaintenanceLogFormDefaults('Alice');
    Object.assign(form, {
      description: 'Cleaned',
      nextMaintenanceAt: '',
      performedAt: '2026-05-30',
      remarks: 'OK',
    });

    expect(buildCreateMaintenanceLogRequest(form)).toEqual({
      description: 'Cleaned',
      maintenanceStatus: 'COMPLETED',
      maintenanceType: 'MAINTENANCE',
      nextMaintenanceAt: undefined,
      operatorName: 'Alice',
      performedAt: '2026-05-30',
      remarks: 'OK',
    });
    expect(getEquipmentStatusTagType('ACTIVE')).toBe('success');
    expect(getEquipmentStatusTagType('MAINTENANCE')).toBe('warning');
    expect(getEquipmentWarningTagType('OVERDUE')).toBe('danger');
    expect(getEquipmentWarningTagType('DUE_SOON')).toBe('warning');
  });
});
