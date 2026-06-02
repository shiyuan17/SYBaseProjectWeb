import type {
  PendingTransportOrderItem,
  SpecimenOutboundListItem,
} from '../types/specimen-workflow';

import { describe, expect, it } from 'vitest';

import {
  buildPendingTransportOrderQuery,
  buildPrintTransportOrderRequest,
  canSelectSpecimenOutboundRow,
  buildTransportOrderHandoverRequest,
  canHandoverTransportOrder,
  createDefaultTransportHandoverFormState,
  createDefaultTransportPrintFormState,
  createTransportHandoverDialogTitle,
  createTransportPrintDialogTitle,
  normalizeRouteQueryValue,
  resolveTransportSelectionValidationMessage,
  resolveTargetTransportOrders,
  resolveSpecimenNoQuickHandoverTarget,
  splitTransportRowsByTransportOrder,
} from './transport-handover';

function createOrder(
  overrides: Partial<PendingTransportOrderItem> = {},
): PendingTransportOrderItem {
  return {
    applicationId: 'APP-1',
    applicationNo: 'NO-1',
    handedOverAt: null,
    handoverDepartmentName: '外科',
    id: 'TO-1',
    patientName: '张三',
    receiverDepartmentName: '病理科',
    specimenBarcodes: ['BC-1'],
    status: 'PRINTED',
    toBeTransportedAt: '2026-05-31 10:00:00',
    transportOrderNo: 'TR-001',
    ...overrides,
  };
}

function createOutboundRow(
  overrides: Partial<SpecimenOutboundListItem> = {},
): SpecimenOutboundListItem {
  return {
    applicationId: 'APP-1',
    applicationNo: 'NO-1',
    barcode: 'BC-1',
    inpatientNo: 'ZY-1',
    outboundAt: null,
    outboundUserName: null,
    patientGender: '女',
    patientId: 'PAT-1',
    patientName: '张三',
    registeredAt: '2026-05-31 09:00:00',
    registeredByName: '登记员',
    specimenId: 'SP-1',
    specimenName: '甲状腺组织',
    specimenNo: 'SP-NO-1',
    specimenStatus: 'CHECKED_IN',
    submittingDepartmentId: 'D-1',
    submittingDepartmentName: '外科',
    surgeryName: '手术间A',
    transportOrderId: null,
    ...overrides,
  };
}

describe('transport handover helpers', () => {
  it('creates defaults and dialog titles', () => {
    expect(createDefaultTransportPrintFormState('张三', 'U-1')).toEqual({
      operatorName: '张三',
      operatorUserId: 'U-1',
      terminalCode: '',
    });
    expect(createDefaultTransportHandoverFormState('李四', 'U-2')).toEqual({
      receiverUserId: 'U-2',
      receiverUserName: '李四',
      remarks: '',
      terminalCode: '',
    });
    expect(createTransportPrintDialogTitle(createOrder(), 1)).toContain(
      'TR-001',
    );
    expect(createTransportHandoverDialogTitle(createOrder(), 2)).toContain(
      '批量交接',
    );
  });

  it('normalizes route values and query payloads', () => {
    expect(normalizeRouteQueryValue(['APP-1'])).toBe('APP-1');
    expect(
      buildPendingTransportOrderQuery({
        applicationId: ' APP-1 ',
        dateRange: ['2026-05-01', '2026-05-31'],
        departmentId: ' DEP-1 ',
        page: 2,
        size: 50,
        specimenNo: ' SP-001 ',
        status: 'PRINTED',
      }),
    ).toEqual({
      applicationId: 'APP-1',
      dateFrom: '2026-05-01',
      dateTo: '2026-05-31',
      departmentId: 'DEP-1',
      page: 2,
      size: 50,
      specimenNo: 'SP-001',
      status: 'PRINTED',
    });
  });

  it('resolves targets, payloads, and handover ability', () => {
    const selected = [createOrder()];
    expect(resolveTargetTransportOrders(selected, null)).toBe(selected);
    expect(resolveTargetTransportOrders([], createOrder())).toEqual([
      createOrder(),
    ]);
    expect(canHandoverTransportOrder(createOrder({ status: 'PENDING' }))).toBe(
      true,
    );
    expect(
      canHandoverTransportOrder(createOrder({ status: 'HANDED_OVER' })),
    ).toBe(false);
    expect(
      buildPrintTransportOrderRequest({
        operatorName: '张三',
        operatorUserId: 'U-1',
        terminalCode: ' T-1 ',
      }),
    ).toEqual({
      terminalCode: 'T-1',
    });
    expect(
      buildTransportOrderHandoverRequest({
        receiverUserId: ' U-2 ',
        receiverUserName: ' 李四 ',
        remarks: ' 备注 ',
        terminalCode: ' T-2 ',
      }),
    ).toEqual({
      receiverUserId: 'U-2',
      receiverUserName: '李四',
      remarks: '备注',
      terminalCode: 'T-2',
    });
  });

  it('resolves the quick handover target only for a single handoverable match', () => {
    expect(resolveSpecimenNoQuickHandoverTarget([], 'SP-001')).toBeNull();
    expect(
      resolveSpecimenNoQuickHandoverTarget([createOrder()], 'SP-001'),
    ).toEqual(createOrder());
    expect(
      resolveSpecimenNoQuickHandoverTarget(
        [createOrder(), createOrder({ id: 'TO-2' })],
        'SP-001',
      ),
    ).toBeNull();
    expect(
      resolveSpecimenNoQuickHandoverTarget(
        [createOrder({ status: 'HANDED_OVER' })],
        'SP-001',
      ),
    ).toBeNull();
  });

  it('validates outbound transfer selection and splits rows by transport order', () => {
    expect(canSelectSpecimenOutboundRow(createOutboundRow())).toBe(true);
    expect(
      canSelectSpecimenOutboundRow(
        createOutboundRow({ outboundAt: '2026-05-31 10:00:00' }),
      ),
    ).toBe(false);
    expect(
      canSelectSpecimenOutboundRow(
        createOutboundRow({ specimenStatus: 'RECEIVED' }),
      ),
    ).toBe(false);

    expect(resolveTransportSelectionValidationMessage([])).toBe(
      '请先选择需要转运的标本',
    );
    expect(
      resolveTransportSelectionValidationMessage([
        createOutboundRow(),
        createOutboundRow({ applicationId: 'APP-2', specimenId: 'SP-2' }),
      ]),
    ).toBe('仅支持同一申请单内的标本一起转运');
    expect(
      resolveTransportSelectionValidationMessage([
        createOutboundRow({ outboundAt: '2026-05-31 10:00:00' }),
      ]),
    ).toBe('仅可转运未出库且未到接收终态的标本');
    expect(
      resolveTransportSelectionValidationMessage([
        createOutboundRow(),
        createOutboundRow({ specimenId: 'SP-2', specimenNo: 'SP-NO-2' }),
      ]),
    ).toBeNull();

    expect(
      splitTransportRowsByTransportOrder([
        createOutboundRow({ transportOrderId: 'TO-1' }),
        createOutboundRow({
          specimenId: 'SP-2',
          specimenNo: 'SP-NO-2',
          transportOrderId: 'TO-1',
        }),
        createOutboundRow({
          specimenId: 'SP-3',
          specimenNo: 'SP-NO-3',
          transportOrderId: null,
        }),
      ]),
    ).toEqual({
      existingTransportOrderIds: ['TO-1'],
      rowsWithoutTransportOrder: [
        expect.objectContaining({ specimenId: 'SP-3' }),
      ],
    });
  });
});
