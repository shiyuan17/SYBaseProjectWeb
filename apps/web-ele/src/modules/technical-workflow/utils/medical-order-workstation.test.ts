import type { PendingMedicalOrderItem } from '../../doctor-workflow/types/doctor-workflow';

import { describe, expect, it, vi } from 'vitest';

import { listPendingMedicalOrders } from '../../doctor-workflow/api/doctor-workflow-service';
import {
  createMedicalOrderWorkstationDataSource,
  mapMedicalOrderToTechnicalWorkbenchRow,
  TECHNICAL_ORDER_CATEGORY_CODES,
} from './medical-order-workstation';

vi.mock('../../doctor-workflow/api/doctor-workflow-service', () => ({
  listPendingMedicalOrders: vi.fn(),
}));

const listPendingMedicalOrdersMock = vi.mocked(listPendingMedicalOrders);

function createOrder(
  overrides: Partial<PendingMedicalOrderItem> = {},
): PendingMedicalOrderItem {
  return {
    caseId: 'CASE-001',
    doctorName: '张医生',
    orderCategoryCode: 'IHC',
    orderCategoryId: 'CAT-IHC',
    orderCategoryName: '免疫组化',
    orderContent: 'CK（蜡块: A1）',
    orderDate: '2026-06-05 09:12:30',
    orderId: 'ORDER-001',
    orderItemCode: 'CK',
    orderItemId: 'ITEM-CK',
    orderItemName: 'CK',
    orderNumber: 'MO-001',
    orderType: 'IHC',
    pathologyNo: 'BL-202606050001',
    patientName: '王女士',
    remarks: '加做',
    status: 'PENDING',
    ...overrides,
  };
}

describe('medical-order-workstation mapper', () => {
  it('maps routine medical orders with stable placeholder fields', () => {
    const row = mapMedicalOrderToTechnicalWorkbenchRow(
      createOrder({
        orderCategoryCode: 'EXAM',
        orderCategoryName: '常规医嘱',
        status: 'IN_PROGRESS',
      }),
      'routine',
    );

    expect(row).toMatchObject({
      blockNo: '-',
      checkItem: 'CK',
      confirmedStatus: '已确认',
      doctorTime: '2026-06-05 09:12',
      originalPathologyNo: '-',
      patientName: '王女士',
      pathologyNo: 'BL-202606050001',
      releaseStatus: '已确认',
    });
    expect(row.searchableText).toContain('bl-202606050001');
  });

  it('maps special medical orders to confirmation and release columns', () => {
    const row = mapMedicalOrderToTechnicalWorkbenchRow(
      createOrder({
        orderCategoryCode: 'TSRS',
        orderCategoryName: '特检医嘱',
      }),
      'special',
    );

    expect(row).toMatchObject({
      confirmAction: '待确认',
      doctorMessage: '加做',
      orderAction: '待确认',
      orderType: '特检医嘱',
      printStatus: '未打印',
      revokeReminder: '-',
    });
  });

  it('maps IHC medical orders to instrument workstation columns', () => {
    const row = mapMedicalOrderToTechnicalWorkbenchRow(createOrder(), 'ihc');

    expect(row).toMatchObject({
      confirmAction: '待确认',
      deviceName: '-',
      instrumentAction: '待上机',
      slideNo: 'MO-001',
      specimenNo: 'CK',
      stainingAction: '待确认',
    });
  });

  it('maps cytology and liquid cytology orders to flow columns', () => {
    const cytologyRow = mapMedicalOrderToTechnicalWorkbenchRow(
      createOrder({
        orderCategoryCode: 'CYTOLOGY',
        orderCategoryName: '细胞学',
        orderItemName: null,
      }),
      'cytology',
    );
    const liquidRow = mapMedicalOrderToTechnicalWorkbenchRow(
      createOrder({
        orderCategoryCode: 'LIQUID_CYTOLOGY',
        orderCategoryName: '液基细胞学',
      }),
      'liquid-cytology',
    );

    expect(cytologyRow).toMatchObject({
      blockCount: 0,
      flowStatus: '待确认',
      sampleType: '细胞学',
      specimenName: 'CK（蜡块: A1）',
    });
    expect(liquidRow).toMatchObject({
      flowStatus: '待确认',
      printedSlides: 0,
      sampleType: '液基细胞学',
    });
  });

  it('loads pending orders with fixed category code and maps rows', async () => {
    listPendingMedicalOrdersMock.mockResolvedValue({
      items: [createOrder()],
      page: 2,
      size: 50,
      total: 91,
    });

    const dataSource = createMedicalOrderWorkstationDataSource(
      TECHNICAL_ORDER_CATEGORY_CODES.ihc,
      'ihc',
    );

    await expect(
      dataSource.load({
        page: 2,
        pathologyNo: 'BL-001',
        size: 50,
        status: 'PENDING',
      }),
    ).resolves.toMatchObject({
      page: 2,
      rows: [{ id: 'ORDER-001', pathologyNo: 'BL-202606050001' }],
      size: 50,
      total: 91,
    });
    expect(listPendingMedicalOrdersMock).toHaveBeenCalledWith({
      orderCategoryCode: 'IHC',
      page: 2,
      pathologyNo: 'BL-001',
      size: 50,
      status: 'PENDING',
    });
  });
});
