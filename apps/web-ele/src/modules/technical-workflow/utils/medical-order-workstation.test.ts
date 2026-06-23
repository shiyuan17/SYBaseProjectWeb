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
        acceptedAt: '2026-06-22T09:00:00',
        blockNo: 'A1',
        canPrint: true,
        canQc: true,
        canRelease: false,
        canTerminate: true,
        executorName: '技师甲',
        orderCategoryCode: 'EXAM',
        orderCategoryName: '常规医嘱',
        inpatientNo: 'ZY-001',
        printedAt: '2026-06-22T09:30:00',
        printedByName: '技师甲',
        releasedAt: null,
        releasedByName: null,
        slideNo: 'SLIDE-001',
        status: 'IN_PROGRESS',
        targetBlockId: 'BLOCK-1',
        targetSlideId: 'SLIDE-ID-1',
        targetSpecimenId: 'SPEC-1',
        targetType: 'BLOCK',
      }),
      'routine',
    );

    expect(row).toMatchObject({
      blockNo: 'A1',
      canPrint: true,
      canQc: true,
      canRelease: false,
      canTerminate: true,
      chargeStatus: '-',
      checkItem: 'CK',
      confirmedStatus: '已确认',
      confirmedTime: '2026-06-22 09:00:00',
      confirmedUser: '技师甲',
      doctorTime: '2026-06-05 09:12:30',
      inpatientNo: 'ZY-001',
      originalPathologyNo: '-',
      patientName: '王女士',
      pathologyNo: 'BL-202606050001',
      printStatus: '已打印',
      printTime: '2026-06-22 09:30:00',
      printUser: '技师甲',
      releaseStatus: '待出片',
      slideNo: 'SLIDE-001',
      targetBlockId: 'BLOCK-1',
    });
    expect(row.searchableText).toContain('bl-202606050001');
  });

  it('falls back to parsing block number from order content for legacy routine rows', () => {
    const row = mapMedicalOrderToTechnicalWorkbenchRow(
      createOrder({
        blockNo: null,
        orderCategoryCode: 'ROUTINE',
        orderCategoryName: '常规医嘱',
        orderContent: '补做特殊染色（蜡块: A2 胃窦组织）',
        orderItemName: '特殊染色',
      }),
      'routine',
    );

    expect(row).toMatchObject({
      blockNo: 'A2 胃窦组织',
      checkItem: '特殊染色',
    });
    expect(row.searchableText).toContain('a2 胃窦组织');
  });

  it('keeps charged HE staining orders visible in routine rows', () => {
    const row = mapMedicalOrderToTechnicalWorkbenchRow(
      createOrder({
        billingStatus: 'SUCCESS',
        canRelease: true,
        completedAt: '2026-06-22T11:20:00',
        releasedAt: '2026-06-22T11:20:00',
        releasedByName: '技师乙',
        orderCategoryCode: 'ROUTINE',
        orderCategoryName: '常规医嘱',
        orderContent: 'HE染色（蜡块: A1）',
        orderItemCode: 'HE',
        orderItemName: 'HE染色',
        orderType: 'ROUTINE',
      }),
      'routine',
    );

    expect(row).toMatchObject({
      chargeStatus: '已收费',
      checkItem: 'HE染色',
      confirmedStatus: '待确认',
      orderType: '常规医嘱',
      releaseStatus: '已出片',
      releaseTime: '2026-06-22 11:20:00',
      releaseUser: '技师乙',
      sliceMode: '常规医嘱',
    });
    expect(row.searchableText).toContain('已收费');
    expect(row.searchableText).toContain('he染色');
  });

  it('prefers application workbench idNo for patient ID display', () => {
    const row = mapMedicalOrderToTechnicalWorkbenchRow(
      createOrder({
        patientId: 'UUID-001',
        patientIdDisplay: '08305',
      }),
      'routine',
    );

    expect(row).toMatchObject({
      patientId: 'UUID-001',
      patientIdDisplay: '08305',
    });
    expect(row.searchableText).toContain('08305');
  });

  it('maps terminated routine medical orders to terminal fields', () => {
    const row = mapMedicalOrderToTechnicalWorkbenchRow(
      createOrder({
        orderCategoryCode: 'ROUTINE',
        orderCategoryName: '常规医嘱',
        status: 'TERMINATED',
        terminatedAt: '2026-06-22T12:00:00',
        terminatedByName: '技师丙',
        terminationReasonCode: 'BLOCK_DAMAGED',
        terminationReasonLabel: '蜡块已损坏无法使用',
        terminationRemarks: '无法继续',
      }),
      'routine',
    );

    expect(row).toMatchObject({
      releaseStatus: '已终止',
      terminationReason: '蜡块已损坏无法使用',
      terminationTime: '2026-06-22 12:00:00',
      terminationUser: '技师丙',
      terminationRemarks: '无法继续',
    });
  });

  it('maps special medical orders to confirmation and release columns', () => {
    const row = mapMedicalOrderToTechnicalWorkbenchRow(
      createOrder({
        inpatientNo: 'ZY-009',
        orderCategoryCode: 'TSRS',
        orderCategoryName: '特检医嘱',
      }),
      'special',
    );

    expect(row).toMatchObject({
      confirmAction: '待确认',
      doctorMessage: '加做',
      inpatientNo: 'ZY-009',
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
        submittingDepartmentName: '病理科',
      }),
      'cytology',
    );
    const liquidRow = mapMedicalOrderToTechnicalWorkbenchRow(
      createOrder({
        orderCategoryCode: 'LIQUID_CYTOLOGY',
        orderCategoryName: '液基细胞学',
        submittingDepartmentName: '妇科门诊',
      }),
      'liquid-cytology',
    );

    expect(cytologyRow).toMatchObject({
      blockCount: 0,
      flowStatus: '待确认',
      sampleType: '细胞学',
      specimenName: 'CK（蜡块: A1）',
      submitDept: '病理科',
    });
    expect(liquidRow).toMatchObject({
      flowStatus: '待确认',
      printedSlides: 0,
      sampleType: '液基细胞学',
      submitDept: '妇科门诊',
    });
  });

  it('does not fall back to internal patientId for cytology workstation display', () => {
    const liquidRow = mapMedicalOrderToTechnicalWorkbenchRow(
      createOrder({
        orderCategoryCode: 'LIQUID_CYTOLOGY',
        orderCategoryName: '液基细胞学',
        patientId: '946db168-2158-4a71-8fe2-4de5a146f50a',
        patientIdDisplay: null,
      }),
      'liquid-cytology',
    );

    expect(liquidRow).toMatchObject({
      patientId: '946db168-2158-4a71-8fe2-4de5a146f50a',
      patientIdDisplay: null,
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

  it('includes legacy routine category code in routine workstation queries', async () => {
    listPendingMedicalOrdersMock.mockResolvedValue({
      items: [
        createOrder({
          orderCategoryCode: 'ROUTINE',
          orderCategoryName: '常规医嘱',
          orderItemCode: 'HE',
          orderItemName: 'HE染色',
        }),
      ],
      page: 1,
      size: 30,
      total: 1,
    });

    const dataSource = createMedicalOrderWorkstationDataSource(
      TECHNICAL_ORDER_CATEGORY_CODES.routine,
      'routine',
    );

    await expect(
      dataSource.load({
        page: 1,
        size: 30,
      }),
    ).resolves.toMatchObject({
      rows: [{ checkItem: 'HE染色', orderType: '常规医嘱' }],
      total: 1,
    });
    expect(listPendingMedicalOrdersMock).toHaveBeenCalledWith({
      orderCategoryCode: 'ROUTINE,EXAM,CGRS,BLOCK,QP',
      page: 1,
      pathologyNo: undefined,
      size: 30,
      status: undefined,
    });
  });

  it('maps completed routine orders when default status filter is omitted', async () => {
    listPendingMedicalOrdersMock.mockResolvedValue({
      items: [
        createOrder({
          completedAt: '2026-06-22T11:20:00',
          orderCategoryCode: 'ROUTINE',
          orderCategoryName: '常规医嘱',
          orderItemCode: 'HE',
          orderItemName: 'HE染色',
          orderType: 'ROUTINE',
          releasedAt: '2026-06-22T11:20:00',
          releasedByName: '技师乙',
          status: 'COMPLETED',
        }),
      ],
      page: 1,
      size: 30,
      total: 1,
    });

    const dataSource = createMedicalOrderWorkstationDataSource(
      TECHNICAL_ORDER_CATEGORY_CODES.routine,
      'routine',
    );

    await expect(
      dataSource.load({
        page: 1,
        size: 30,
      }),
    ).resolves.toMatchObject({
      rows: [
        {
          checkItem: 'HE染色',
          releaseStatus: '已出片',
          releaseTime: '2026-06-22 11:20:00',
        },
      ],
      total: 1,
    });
    expect(listPendingMedicalOrdersMock).toHaveBeenCalledWith({
      orderCategoryCode: 'ROUTINE,EXAM,CGRS,BLOCK,QP',
      page: 1,
      pathologyNo: undefined,
      size: 30,
      status: undefined,
    });
  });
});
