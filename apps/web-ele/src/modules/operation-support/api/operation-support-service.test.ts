import type { Mock } from 'vitest';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requestClient } from '#/api/request';

import {
  archiveApplicationForm,
  archiveEmbeddingBox,
  archiveSlide,
  archiveSpecimen,
  batchArchiveEmbeddingBoxes,
  batchArchiveSlides,
  batchArchiveSpecimens,
  batchCreateArchiveCabinets,
  consumeReagentStock,
  createArchiveCabinet,
  createArchiveCabinetNode,
  createEquipmentMaintenanceLog,
  createEquipmentRecord,
  createMaterialLoan,
  createMaterialLoanAbnormalRecord,
  createReagent,
  createReagentStock,
  deleteArchiveCabinet,
  exportReagentStocks,
  finishUsingReagentStock,
  importReagentStocks,
  listArchiveCabinetNodes,
  listArchiveCabinets,
  listArchiveObjects,
  listAvailableArchivePositions,
  listEquipmentMaintenanceLogs,
  listEquipmentRecords,
  listEquipmentWarnings,
  listMaterialLoans,
  listPendingMaterialLoans,
  listReagents,
  listReagentStockEvents,
  listReagentStocks,
  listReagentWarnings,
  normalizeArrayResult,
  returnMaterialLoan,
  searchArchiveRecords,
  startUsingReagentStock,
  testReagentStock,
  updateArchiveCabinet,
  updateArchiveCabinetNode,
  updateEquipmentRecord,
  updateReagent,
  updateReagentStock,
} from './operation-support-service';

vi.mock('#/api/request', () => ({
  requestClient: {
    download: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
    request: vi.fn(),
    upload: vi.fn(),
  },
}));

const requestClientMock = requestClient as unknown as {
  download: Mock;
  get: Mock;
  post: Mock;
  request: Mock;
  upload: Mock;
};

beforeEach(() => {
  requestClientMock.download.mockReset();
  requestClientMock.get.mockReset();
  requestClientMock.post.mockReset();
  requestClientMock.request.mockReset();
  requestClientMock.upload.mockReset();
});

describe('operation-support-service mappers', () => {
  it('normalizes nullable list responses', () => {
    expect(normalizeArrayResult(null)).toEqual([]);
    expect(normalizeArrayResult(undefined)).toEqual([]);
    expect(normalizeArrayResult([{ id: '1' }])).toEqual([{ id: '1' }]);
  });
});

describe('operation-support-service archive requests', () => {
  it('lists archive objects with pagination params and normalizes empty pages', async () => {
    requestClientMock.get
      .mockResolvedValueOnce({
        items: [
          {
            applicantDoctorName: '申请医生甲',
            applicationDate: '2026-06-15',
            caseId: 'CASE-1',
            objectId: 'SLIDE-1',
            objectType: 'SLIDE',
            pathologyNo: 'BL-2026-001',
          },
        ],
        page: 2,
        size: 10,
        total: 1,
      })
      .mockResolvedValueOnce(null);

    const page = await listArchiveObjects({
      keyword: 'BL-2026',
      objectType: 'SLIDE',
      page: 2,
      size: 10,
    });
    const emptyPage = await listArchiveObjects({
      objectType: 'APPLICATION_FORM',
      page: 1,
      size: 20,
    });

    expect(requestClientMock.get).toHaveBeenNthCalledWith(
      1,
      '/v1/archive-objects',
      {
        params: {
          keyword: 'BL-2026',
          objectType: 'SLIDE',
          page: 2,
          size: 10,
        },
      },
    );
    expect(requestClientMock.get).toHaveBeenNthCalledWith(
      2,
      '/v1/archive-objects',
      {
        params: {
          objectType: 'APPLICATION_FORM',
          page: 1,
          size: 20,
        },
      },
    );
    expect(page).toEqual({
      items: [
        {
          applicantDoctorName: '申请医生甲',
          applicationDate: '2026-06-15',
          caseId: 'CASE-1',
          objectId: 'SLIDE-1',
          objectType: 'SLIDE',
          pathologyNo: 'BL-2026-001',
        },
      ],
      page: 2,
      size: 10,
      total: 1,
    });
    expect(emptyPage).toEqual({
      items: [],
      page: 1,
      size: 20,
      total: 0,
    });
  });

  it('calls archive cabinet and record endpoints with exact paths', async () => {
    requestClientMock.get.mockResolvedValue([]);

    await listArchiveCabinets();
    await listArchiveCabinetNodes();
    await listAvailableArchivePositions({ cabinetId: 'CAB-1' });
    await searchArchiveRecords({ keyword: 'BL-1', objectType: 'SLIDE' });
    await listMaterialLoans({ loanStatus: 'RETURNED', materialType: 'SLIDE' });
    await listPendingMaterialLoans({ materialType: 'SLIDE' });

    expect(requestClientMock.get).toHaveBeenNthCalledWith(
      1,
      '/v1/archive-cabinets',
    );
    expect(requestClientMock.get).toHaveBeenNthCalledWith(
      2,
      '/v1/archive-cabinet-nodes',
    );
    expect(requestClientMock.get).toHaveBeenNthCalledWith(
      3,
      '/v1/archive-positions/available',
      { params: { cabinetId: 'CAB-1' } },
    );
    expect(requestClientMock.get).toHaveBeenNthCalledWith(
      4,
      '/v1/archive-records/search',
      { params: { keyword: 'BL-1', objectType: 'SLIDE' } },
    );
    expect(requestClientMock.get).toHaveBeenNthCalledWith(
      5,
      '/v1/material-loans',
      { params: { loanStatus: 'RETURNED', materialType: 'SLIDE' } },
    );
    expect(requestClientMock.get).toHaveBeenNthCalledWith(
      6,
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
    await batchCreateArchiveCabinets({
      cabinetCodePrefix: 'CAB-B',
      cabinetNamePrefix: '批量柜',
      cabinetType: 'APPLICATION_FORM',
      count: 2,
      layerCount: 1,
      numberWidth: 3,
      operatorName: '归档员',
      parentId: 'NODE-AREA-1',
      slotCountPerLayer: 10,
      startNo: 1,
    });
    await createArchiveCabinetNode({
      cabinetType: 'SLIDE',
      capacity: 5,
      nodeCode: 'CAB-NODE-1',
      nodeType: 'CABINET',
      parentId: 'NODE-AREA-1',
      pathLocation: '2F',
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
    await archiveSpecimen({
      archivePositionId: 'POS-4',
      operatorName: '归档员',
      specimenId: 'SPECIMEN-1',
    });
    await batchArchiveEmbeddingBoxes({
      archiveCabinetId: 'CABINET-1',
      objectIds: ['BOX-1', 'BOX-2'],
      remarks: '批量蜡块',
    });
    await batchArchiveSlides({
      archiveCabinetId: 'CABINET-1',
      objectIds: ['SLIDE-1'],
    });
    await batchArchiveSpecimens({
      archiveCabinetId: 'CABINET-1',
      archiveExpiresAt: '2026-06-30T18:00:00',
      archiveReminderDays: 1,
      objectIds: ['SPECIMEN-1'],
    });
    await createMaterialLoan({
      borrowedByName: '医生',
      materialId: 'SLIDE-1',
      materialType: 'SLIDE',
      operatorName: '归档员',
    });
    await createMaterialLoanAbnormalRecord({
      abnormalReason: '玻片破损',
      materialId: 'SLIDE-1',
      materialType: 'SLIDE',
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
      '/v1/archive-cabinets/batch',
      {
        cabinetCodePrefix: 'CAB-B',
        cabinetNamePrefix: '批量柜',
        cabinetType: 'APPLICATION_FORM',
        count: 2,
        layerCount: 1,
        numberWidth: 3,
        operatorName: '归档员',
        parentId: 'NODE-AREA-1',
        slotCountPerLayer: 10,
        startNo: 1,
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      3,
      '/v1/archive-cabinet-nodes',
      {
        cabinetType: 'SLIDE',
        capacity: 5,
        nodeCode: 'CAB-NODE-1',
        nodeType: 'CABINET',
        parentId: 'NODE-AREA-1',
        pathLocation: '2F',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      4,
      '/v1/archive/application-forms',
      {
        archivePositionId: 'POS-1',
        caseId: 'CASE-1',
        operatorName: '归档员',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      5,
      '/v1/archive/embedding-boxes',
      {
        archivePositionId: 'POS-2',
        embeddingBoxId: 'BOX-1',
        operatorName: '归档员',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      6,
      '/v1/archive/slides',
      {
        archivePositionId: 'POS-3',
        operatorName: '归档员',
        slideId: 'SLIDE-1',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      7,
      '/v1/archive/specimens',
      {
        archivePositionId: 'POS-4',
        operatorName: '归档员',
        specimenId: 'SPECIMEN-1',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      8,
      '/v1/archive/embedding-boxes/batch',
      {
        archiveCabinetId: 'CABINET-1',
        objectIds: ['BOX-1', 'BOX-2'],
        remarks: '批量蜡块',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      9,
      '/v1/archive/slides/batch',
      {
        archiveCabinetId: 'CABINET-1',
        objectIds: ['SLIDE-1'],
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      10,
      '/v1/archive/specimens/batch',
      {
        archiveCabinetId: 'CABINET-1',
        archiveExpiresAt: '2026-06-30T18:00:00',
        archiveReminderDays: 1,
        objectIds: ['SPECIMEN-1'],
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      11,
      '/v1/material-loans',
      {
        borrowedByName: '医生',
        materialId: 'SLIDE-1',
        materialType: 'SLIDE',
        operatorName: '归档员',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      12,
      '/v1/material-loans/abnormal-records',
      {
        abnormalReason: '玻片破损',
        materialId: 'SLIDE-1',
        materialType: 'SLIDE',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      13,
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
    await updateArchiveCabinetNode('NODE-1', {
      cabinetType: 'SLIDE',
      capacity: 10,
      nodeCode: 'CAB-1',
      pathLocation: '2F',
      remarks: '更新',
    });

    expect(requestClientMock.request).toHaveBeenNthCalledWith(
      1,
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
    expect(requestClientMock.request).toHaveBeenNthCalledWith(
      2,
      '/v1/archive-cabinet-nodes/NODE-1',
      {
        data: {
          cabinetType: 'SLIDE',
          capacity: 10,
          nodeCode: 'CAB-1',
          pathLocation: '2F',
          remarks: '更新',
        },
        method: 'PATCH',
      },
    );
  });

  it('deletes archive cabinets', async () => {
    await deleteArchiveCabinet('CAB-1');

    expect(requestClientMock.request).toHaveBeenCalledWith(
      '/v1/archive-cabinets/CAB-1',
      {
        method: 'DELETE',
      },
    );
  });
});

describe('operation-support-service reagent requests', () => {
  it('calls reagent endpoints with exact paths', async () => {
    requestClientMock.get.mockResolvedValue([]);

    await listReagents({
      enabled: true,
      keyword: 'RG',
      reagentType: 'IMMUNO_WORKING_SOLUTION',
      templateStatus: 'ENABLED',
    });
    await listReagentStocks({
      dateFrom: '2026-03-11',
      dateTo: '2026-06-12',
      reagentType: 'IMMUNO_WORKING_SOLUTION',
      stockStatus: 'IN_USE',
    });
    await listReagentWarnings();
    await listReagentStockEvents('STOCK-1');

    expect(requestClientMock.get).toHaveBeenNthCalledWith(1, '/v1/reagents', {
      params: {
        enabled: true,
        keyword: 'RG',
        reagentType: 'IMMUNO_WORKING_SOLUTION',
        templateStatus: 'ENABLED',
      },
    });
    expect(requestClientMock.get).toHaveBeenNthCalledWith(
      2,
      '/v1/reagent-stocks',
      {
        params: {
          dateFrom: '2026-03-11',
          dateTo: '2026-06-12',
          reagentType: 'IMMUNO_WORKING_SOLUTION',
          stockStatus: 'IN_USE',
        },
      },
    );
    expect(requestClientMock.get).toHaveBeenNthCalledWith(
      3,
      '/v1/reagent-stocks/warnings',
    );
    expect(requestClientMock.get).toHaveBeenNthCalledWith(
      4,
      '/v1/reagent-stocks/STOCK-1/events',
    );
  });

  it('creates and patches reagents and stock batches without legacy operator fields', async () => {
    await createReagent({
      applicationDilution: '1:80',
      enabled: true,
      orderDictItemId: 'ODI_IHC_CK',
      reagentCode: 'RG-1',
      reagentName: '试剂',
      reagentType: 'IMMUNO_WORKING_SOLUTION',
      templateStatus: 'ENABLED',
    });
    await updateReagent('RG-1', {
      enabled: false,
      reagentName: '试剂2',
      templateStatus: 'DISABLED',
    });
    await createReagentStock({
      batchNo: 'B-1',
      initialQuantity: 20,
      reagentId: 'RG-1',
      remainingQuantity: 20,
      stockStatus: 'IN_STOCK',
    });
    await updateReagentStock('STOCK-1', {
      remainingQuantity: 0,
      stockStatus: 'FINISHED',
    });

    expect(requestClientMock.post).toHaveBeenNthCalledWith(1, '/v1/reagents', {
      applicationDilution: '1:80',
      enabled: true,
      orderDictItemId: 'ODI_IHC_CK',
      reagentCode: 'RG-1',
      reagentName: '试剂',
      reagentType: 'IMMUNO_WORKING_SOLUTION',
      templateStatus: 'ENABLED',
    });
    expect(requestClientMock.request).toHaveBeenNthCalledWith(
      1,
      '/v1/reagents/RG-1',
      {
        data: {
          enabled: false,
          reagentName: '试剂2',
          templateStatus: 'DISABLED',
        },
        method: 'PATCH',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      2,
      '/v1/reagent-stocks',
      {
        batchNo: 'B-1',
        initialQuantity: 20,
        reagentId: 'RG-1',
        remainingQuantity: 20,
        stockStatus: 'IN_STOCK',
      },
    );
    expect(requestClientMock.request).toHaveBeenNthCalledWith(
      2,
      '/v1/reagent-stocks/STOCK-1',
      {
        data: {
          remainingQuantity: 0,
          stockStatus: 'FINISHED',
        },
        method: 'PATCH',
      },
    );
  });

  it('calls reagent stock actions and csv exchange endpoints', async () => {
    const file = new File(['csv'], 'stocks.csv', { type: 'text/csv' });

    await testReagentStock('STOCK-1', { quantity: 1, remarks: '测试' });
    await consumeReagentStock('STOCK-1', { quantity: 2, remarks: '消耗' });
    await startUsingReagentStock('STOCK-1', { remarks: '开始' });
    await finishUsingReagentStock('STOCK-1', { remarks: '结束' });
    await exportReagentStocks({ keyword: 'RG' });
    await importReagentStocks(file);

    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      1,
      '/v1/reagent-stocks/STOCK-1/test',
      { quantity: 1, remarks: '测试' },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      2,
      '/v1/reagent-stocks/STOCK-1/consume',
      { quantity: 2, remarks: '消耗' },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      3,
      '/v1/reagent-stocks/STOCK-1/start-use',
      { remarks: '开始' },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      4,
      '/v1/reagent-stocks/STOCK-1/finish-use',
      { remarks: '结束' },
    );
    expect(requestClientMock.download).toHaveBeenCalledWith(
      '/v1/reagent-stocks/export',
      {
        params: { keyword: 'RG' },
        responseReturn: 'body',
      },
    );
    expect(requestClientMock.upload).toHaveBeenCalledWith(
      '/v1/reagent-stocks/import',
      { file },
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
