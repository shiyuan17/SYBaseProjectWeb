import type { PendingTransportOrderItem } from '../types/specimen-workflow';

import { describe, expect, it } from 'vitest';

import {
  buildPendingTransportOrderQuery,
  buildPrintTransportOrderRequest,
  buildTransportOrderHandoverRequest,
  canHandoverTransportOrder,
  createDefaultTransportHandoverFormState,
  createDefaultTransportPrintFormState,
  createTransportHandoverDialogTitle,
  createTransportPrintDialogTitle,
  normalizeRouteQueryValue,
  resolveTargetTransportOrders,
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
        operatorName: ' 张三 ',
        operatorUserId: ' U-1 ',
        terminalCode: ' T-1 ',
      }),
    ).toEqual({
      operatorName: '张三',
      operatorUserId: 'U-1',
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
});
