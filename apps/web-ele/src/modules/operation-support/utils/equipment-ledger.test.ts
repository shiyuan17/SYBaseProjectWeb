import { describe, expect, it } from 'vitest';

import {
  buildCreateEquipmentRecordRequest,
  buildEquipmentExportDocument,
  buildEquipmentPrintDocument,
  createEquipmentFormDefaults,
  createEquipmentFormStateFromRow,
  validateEquipmentForm,
} from './equipment-ledger';

describe('equipment-ledger utils', () => {
  it('creates defaults for legacy equipment form', () => {
    const form = createEquipmentFormDefaults('设备员甲');
    expect(form.equipmentStatus).toBe('ACTIVE');
    expect(form.quantity).toBe(1);
    expect(form.commonlyUsed).toBe(false);
    expect(form.operatorName).toBe('设备员甲');
  });

  it('maps row data into form state', () => {
    const form = createEquipmentFormStateFromRow(
      {
        commonlyUsed: true,
        currentTemperature: 23.5,
        enabledAt: '2026-06-01T00:00:00',
        equipmentCategory: 'MICROTOME',
        equipmentCode: 'EQ-001',
        equipmentName: '切片机',
        equipmentStatus: 'ACTIVE',
        id: '1',
        managementCode: 'GL-001',
        modelNo: 'M-1',
        price: 123,
        quantity: 2,
        setTemperature: 24.5,
      },
      '设备员乙',
    );

    expect(form.equipmentCode).toBe('EQ-001');
    expect(form.managementCode).toBe('GL-001');
    expect(form.commonlyUsed).toBe(true);
    expect(form.operatorName).toBe('设备员乙');
  });

  it('builds create request with expanded fields', () => {
    const request = buildCreateEquipmentRecordRequest({
      ...createEquipmentFormDefaults('设备员甲'),
      commonlyUsed: true,
      currentTemperature: 23.5,
      depreciationMethod: '直线法',
      equipmentCategory: 'MICROTOME',
      equipmentCode: 'EQ-001',
      equipmentName: '切片机',
      factoryNo: 'FC-001',
      managementCode: 'GL-001',
      price: 200,
      quantity: 2,
      setTemperature: 24.5,
    });

    expect(request.equipmentCode).toBe('EQ-001');
    expect(request.managementCode).toBe('GL-001');
    expect(request.commonlyUsed).toBe(true);
    expect(request.quantity).toBe(2);
  });

  it('validates required legacy-aligned fields', () => {
    expect(
      validateEquipmentForm(
        {
          ...createEquipmentFormDefaults('设备员甲'),
          equipmentCode: 'EQ-001',
        },
        true,
      ),
    ).toBe('请填写设备名称和设备状态');
  });

  it('builds equipment requests without legacy operator fields', () => {
    const createRequest = buildCreateEquipmentRecordRequest({
      ...createEquipmentFormDefaults('设备员甲'),
      equipmentCategory: '免疫组化仪',
      equipmentCode: 'EQ-002',
      equipmentName: '设备乙',
      equipmentStatus: 'ACTIVE',
    });
    const maintenanceRequest = buildCreateEquipmentRecordRequest({
      ...createEquipmentFormDefaults('设备员甲'),
      equipmentCategory: '切片机',
      equipmentCode: 'EQ-003',
      equipmentName: '设备丙',
      equipmentStatus: 'DISABLED',
    });

    expect(createRequest).not.toHaveProperty('operatorName');
    expect(createRequest).not.toHaveProperty('operatorUserId');
    expect(maintenanceRequest).not.toHaveProperty('operatorName');
  });

  it('builds export and print documents', () => {
    const rows = [
      {
        commonlyUsed: true,
        equipmentCategory: 'MICROTOME',
        equipmentCode: 'EQ-001',
        equipmentName: '切片机',
        equipmentStatus: 'ACTIVE',
        id: '1',
      },
    ];
    const exportHtml = buildEquipmentExportDocument({
      categoryFormatter: () => '切片机',
      nullableFormatter: (value) => String(value ?? '-'),
      rows,
      statusFormatter: () => '正常',
    });
    const printHtml = buildEquipmentPrintDocument({
      categoryFormatter: () => '切片机',
      nullableFormatter: (value) => String(value ?? '-'),
      rows,
      statusFormatter: () => '正常',
    });

    expect(exportHtml).toContain('资产编号');
    expect(exportHtml).toContain('EQ-001');
    expect(printHtml).toContain('设备档案列表');
    expect(printHtml).toContain('window.print()');
  });
});
