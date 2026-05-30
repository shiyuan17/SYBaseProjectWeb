import type { Mock } from 'vitest';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requestClient } from '#/api/request';

import {
  archiveApplicationForm,
  archiveEmbeddingBox,
  archiveSlide,
  createArchiveCabinet,
  createEquipmentMaintenanceLog,
  createEquipmentRecord,
  createMaterialLoan,
  createReagent,
  createReagentStock,
  listArchiveCabinets,
  listAvailableArchivePositions,
  listEquipmentMaintenanceLogs,
  listEquipmentRecords,
  listEquipmentWarnings,
  listPendingMaterialLoans,
  listReagents,
  listReagentStocks,
  listReagentWarnings,
  normalizeArrayResult,
  returnMaterialLoan,
  searchArchiveRecords,
  updateArchiveCabinet,
  updateEquipmentRecord,
  updateReagent,
  updateReagentStock,
} from './operation-support-service';

vi.mock('#/api/request', () => ({
  requestClient: {
    get: vi.fn(),
    post: vi.fn(),
    request: vi.fn(),
  },
}));

const requestClientMock = requestClient as unknown as {
  get: Mock;
  post: Mock;
  request: Mock;
};

beforeEach(() => {
  requestClientMock.get.mockReset();
  requestClientMock.post.mockReset();
  requestClientMock.request.mockReset();
});

describe('operation-support-service mappers', () => {
  it('normalizes nullable list responses', () => {
    expect(normalizeArrayResult(null)).toEqual([]);
    expect(normalizeArrayResult(undefined)).toEqual([]);
    expect(normalizeArrayResult([{ id: '1' }])).toEqual([{ id: '1' }]);
  });
});

describe('operation-support-service archive requests', () => {
  it('calls archive cabinet and record endpoints with exact paths', async () => {
    requestClientMock.get.mockResolvedValue([]);

    await listArchiveCabinets();
    await listAvailableArchivePositions({ cabinetId: 'CAB-1' });
    await searchArchiveRecords({ keyword: 'BL-1', objectType: 'SLIDE' });
    await listPendingMaterialLoans({ materialType: 'SLIDE' });

    expect(requestClientMock.get).toHaveBeenNthCalledWith(
      1,
      '/v1/archive-cabinets',
    );
    expect(requestClientMock.get).toHaveBeenNthCalledWith(
      2,
      '/v1/archive-positions/available',
      { params: { cabinetId: 'CAB-1' } },
    );
    expect(requestClientMock.get).toHaveBeenNthCalledWith(
      3,
      '/v1/archive-records/search',
      { params: { keyword: 'BL-1', objectType: 'SLIDE' } },
    );
    expect(requestClientMock.get).toHaveBeenNthCalledWith(
      4,
      '/v1/material-loans/pending',
      { params: { materialType: 'SLIDE' } },
    );
  });

  it('posts archive actions and material loans', async () => {
    await createArchiveCabinet({
      cabinetCode: 'CAB-1',
      cabinetName: '柜1',
      cabinetType: 'STANDARD',
      layerCount: 1,
      operatorName: '归档员',
      slotCountPerLayer: 2,
    });
    await archiveApplicationForm({
      archivePositionId: 'POS-1',
      caseId: 'CASE-1',
      operatorName: '归档员',
    });
    await archiveEmbeddingBox({
      archivePositionId: 'POS-2',
      embeddingBoxId: 'BOX-1',
      operatorName: '归档员',
    });
    await archiveSlide({
      archivePositionId: 'POS-3',
      operatorName: '归档员',
      slideId: 'SLIDE-1',
    });
    await createMaterialLoan({
      borrowedByName: '医生',
      materialId: 'SLIDE-1',
      materialType: 'SLIDE',
      operatorName: '归档员',
    });
    await returnMaterialLoan('LOAN-1', { operatorName: '归档员' });

    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      1,
      '/v1/archive-cabinets',
      {
        cabinetCode: 'CAB-1',
        cabinetName: '柜1',
        cabinetType: 'STANDARD',
        layerCount: 1,
        operatorName: '归档员',
        slotCountPerLayer: 2,
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      2,
      '/v1/archive/application-forms',
      {
        archivePositionId: 'POS-1',
        caseId: 'CASE-1',
        operatorName: '归档员',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      3,
      '/v1/archive/embedding-boxes',
      {
        archivePositionId: 'POS-2',
        embeddingBoxId: 'BOX-1',
        operatorName: '归档员',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      4,
      '/v1/archive/slides',
      {
        archivePositionId: 'POS-3',
        operatorName: '归档员',
        slideId: 'SLIDE-1',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      5,
      '/v1/material-loans',
      {
        borrowedByName: '医生',
        materialId: 'SLIDE-1',
        materialType: 'SLIDE',
        operatorName: '归档员',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      6,
      '/v1/material-loans/LOAN-1/return',
      { operatorName: '归档员' },
    );
  });

  it('patches archive cabinets', async () => {
    await updateArchiveCabinet('CAB-1', {
      cabinetName: '柜1',
      cabinetStatus: 'DISABLED',
      operatorName: '归档员',
    });

    expect(requestClientMock.request).toHaveBeenCalledWith(
      '/v1/archive-cabinets/CAB-1',
      {
        data: {
          cabinetName: '柜1',
          cabinetStatus: 'DISABLED',
          operatorName: '归档员',
        },
        method: 'PATCH',
      },
    );
  });
});

describe('operation-support-service reagent requests', () => {
  it('calls reagent endpoints with exact paths', async () => {
    requestClientMock.get.mockResolvedValue([]);

    await listReagents({ enabled: true, keyword: 'RG' });
    await listReagentStocks({ stockStatus: 'ACTIVE' });
    await listReagentWarnings();

    expect(requestClientMock.get).toHaveBeenNthCalledWith(1, '/v1/reagents', {
      params: { enabled: true, keyword: 'RG' },
    });
    expect(requestClientMock.get).toHaveBeenNthCalledWith(
      2,
      '/v1/reagent-stocks',
      {
        params: { stockStatus: 'ACTIVE' },
      },
    );
    expect(requestClientMock.get).toHaveBeenNthCalledWith(
      3,
      '/v1/reagent-stocks/warnings',
    );
  });

  it('creates and patches reagents and stock batches', async () => {
    await createReagent({
      enabled: true,
      operatorName: '试剂员',
      reagentCode: 'RG-1',
      reagentName: '试剂',
    });
    await updateReagent('RG-1', {
      enabled: false,
      operatorName: '试剂员',
      reagentName: '试剂2',
    });
    await createReagentStock({
      batchNo: 'B-1',
      operatorName: '试剂员',
      reagentId: 'RG-1',
      stockStatus: 'ACTIVE',
    });
    await updateReagentStock('STOCK-1', {
      operatorName: '试剂员',
      stockStatus: 'DEPLETED',
    });

    expect(requestClientMock.post).toHaveBeenNthCalledWith(1, '/v1/reagents', {
      enabled: true,
      operatorName: '试剂员',
      reagentCode: 'RG-1',
      reagentName: '试剂',
    });
    expect(requestClientMock.request).toHaveBeenNthCalledWith(
      1,
      '/v1/reagents/RG-1',
      {
        data: {
          enabled: false,
          operatorName: '试剂员',
          reagentName: '试剂2',
        },
        method: 'PATCH',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      2,
      '/v1/reagent-stocks',
      {
        batchNo: 'B-1',
        operatorName: '试剂员',
        reagentId: 'RG-1',
        stockStatus: 'ACTIVE',
      },
    );
    expect(requestClientMock.request).toHaveBeenNthCalledWith(
      2,
      '/v1/reagent-stocks/STOCK-1',
      {
        data: {
          operatorName: '试剂员',
          stockStatus: 'DEPLETED',
        },
        method: 'PATCH',
      },
    );
  });
});

describe('operation-support-service equipment requests', () => {
  it('calls equipment endpoints with exact paths', async () => {
    requestClientMock.get.mockResolvedValue([]);

    await listEquipmentRecords({ equipmentStatus: 'ACTIVE' });
    await listEquipmentMaintenanceLogs('EQ-1');
    await listEquipmentWarnings();

    expect(requestClientMock.get).toHaveBeenNthCalledWith(
      1,
      '/v1/equipment-records',
      { params: { equipmentStatus: 'ACTIVE' } },
    );
    expect(requestClientMock.get).toHaveBeenNthCalledWith(
      2,
      '/v1/equipment-records/EQ-1/maintenance-logs',
    );
    expect(requestClientMock.get).toHaveBeenNthCalledWith(
      3,
      '/v1/equipment-records/warnings',
    );
  });

  it('creates and patches equipment records and maintenance logs', async () => {
    await createEquipmentRecord({
      equipmentCode: 'EQ-1',
      equipmentName: '设备',
      equipmentStatus: 'ACTIVE',
      operatorName: '设备员',
    });
    await updateEquipmentRecord('EQ-1', {
      equipmentName: '设备2',
      equipmentStatus: 'MAINTENANCE',
      operatorName: '设备员',
    });
    await createEquipmentMaintenanceLog('EQ-1', {
      maintenanceStatus: 'COMPLETED',
      maintenanceType: 'MAINTENANCE',
      operatorName: '设备员',
      performedAt: '2026-05-22T10:00:00',
    });

    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      1,
      '/v1/equipment-records',
      {
        equipmentCode: 'EQ-1',
        equipmentName: '设备',
        equipmentStatus: 'ACTIVE',
        operatorName: '设备员',
      },
    );
    expect(requestClientMock.request).toHaveBeenCalledWith(
      '/v1/equipment-records/EQ-1',
      {
        data: {
          equipmentName: '设备2',
          equipmentStatus: 'MAINTENANCE',
          operatorName: '设备员',
        },
        method: 'PATCH',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      2,
      '/v1/equipment-records/EQ-1/maintenance-logs',
      {
        maintenanceStatus: 'COMPLETED',
        maintenanceType: 'MAINTENANCE',
        operatorName: '设备员',
        performedAt: '2026-05-22T10:00:00',
      },
    );
  });
});
