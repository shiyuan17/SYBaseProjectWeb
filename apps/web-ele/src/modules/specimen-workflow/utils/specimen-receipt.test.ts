import type { PendingSpecimenItem } from '../types/specimen-workflow';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  buildApplicationFormReprintRequest,
  buildDirectReceiptSubmissionRequest,
  buildPendingReceiptQuery,
  buildReceiptSubmissionRequest,
  buildTransportReceiptGroups,
  createDefaultReceiptFormState,
  createReceiptDraftItem,
  createReceiptDraftItemsFromGroup,
  formatGroupContainerNames,
  normalizeReceiptItem,
  pickLatestTrackingAt,
  validateReceiptItems,
} from './specimen-receipt';

function createPendingSpecimenItem(
  overrides: Partial<PendingSpecimenItem> = {},
): PendingSpecimenItem {
  return {
    abnormalFlag: false,
    applicationId: 'APP-1',
    applicationNo: 'NO-1',
    barcode: 'BC-1',
    batchAbnormalFlag: false,
    checkInStatus: null,
    checkedInAt: null,
    checkedInByName: null,
    containerCount: 1,
    containerName: '蜡块盒',
    fixationCompletedAt: null,
    fixationLiquidType: null,
    fixationOperatorName: null,
    fixationOperatorUserId: null,
    fixationStartedAt: null,
    fixationStatus: null,
    latestTrackingAt: '2026-05-31T09:00:00',
    patientName: '张三',
    registeredAt: null,
    reminderCount: 0,
    specimenId: 'SPEC-1',
    specimenNo: 'SP-1',
    specimenStatus: 'IN_TRANSIT',
    submittingDepartmentId: null,
    submittingDepartmentName: null,
    transportOrderId: 'TO-1',
    unreceivedCount: 1,
    verificationCompletedAt: null,
    verificationStartedAt: null,
    verificationStatus: null,
    ...overrides,
  };
}

describe('specimen receipt helpers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('builds default forms and draft items', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1000);
    vi.spyOn(Math, 'random').mockReturnValue(0);

    expect(createDefaultReceiptFormState('张三', 'U-1')).toEqual({
      receivedByName: '张三',
      receivedByUserId: 'U-1',
      terminalCode: '',
    });
    expect(createReceiptDraftItem('BC-1')).toEqual(
      expect.objectContaining({
        containerCount: 1,
        key: 1000,
        qualityCheckResult: 'PASSED',
        receiptStatus: 'RECEIVED',
        specimenBarcode: 'BC-1',
      }),
    );
  });

  it('groups pending items by transport order and derives draft rows', () => {
    vi.spyOn(Date, 'now').mockReturnValue(2000);
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const groups = buildTransportReceiptGroups([
      createPendingSpecimenItem(),
      createPendingSpecimenItem({
        barcode: 'BC-2',
        batchAbnormalFlag: true,
        containerName: '离心管',
        latestTrackingAt: '2026-05-31T10:00:00',
        reminderCount: 2,
        specimenId: 'SPEC-2',
      }),
      createPendingSpecimenItem({
        barcode: 'BC-3',
        specimenId: 'SPEC-3',
        transportOrderId: '',
      }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]).toEqual(
      expect.objectContaining({
        batchAbnormalFlag: true,
        latestTrackingAt: '2026-05-31T10:00:00',
        reminderCount: 2,
        transportOrderId: 'TO-1',
        unreceivedCount: 1,
      }),
    );
    expect(formatGroupContainerNames(groups[0]!.items)).toBe('蜡块盒、离心管');
    expect(createReceiptDraftItemsFromGroup(groups[0]!)).toEqual([
      expect.objectContaining({
        applicationNo: 'NO-1',
        containerName: '蜡块盒',
        key: 2000,
        patientName: '张三',
        specimenBarcode: 'BC-1',
      }),
      expect.objectContaining({
        applicationNo: 'NO-1',
        containerName: '离心管',
        key: 2000,
        patientName: '张三',
        specimenBarcode: 'BC-2',
      }),
    ]);
    expect(pickLatestTrackingAt('2026-05-31T09:00:00', null)).toBe(
      '2026-05-31T09:00:00',
    );
  });

  it('builds query and submission payloads', () => {
    const form = {
      receivedByName: ' 张三 ',
      receivedByUserId: ' U-1 ',
      terminalCode: ' T-1 ',
    };
    const items = [
      {
        ...createReceiptDraftItem(' BC-1 '),
        qualityIssueCodes: ['A'],
        reason: ' 破损 ',
        receiptStatus: ' REJECTED ',
        remarks: ' 备注 ',
      },
    ];

    expect(
      buildPendingReceiptQuery({
        specimenNo: ' SP-001 ',
        page: 2,
        size: 20,
      }),
    ).toEqual({
      page: 2,
      size: 20,
      specimenNo: 'SP-001',
    });
    expect(normalizeReceiptItem(items[0]!)).toEqual({
      containerCount: 1,
      qualityCheckResult: 'PASSED',
      qualityIssueCodes: ['A'],
      reason: '破损',
      receiptStatus: 'REJECTED',
      remarks: '备注',
      specimenBarcode: 'BC-1',
    });
    expect(buildReceiptSubmissionRequest('TO-1', form, items)).toEqual({
      items: [normalizeReceiptItem(items[0]!)],
      receivedByName: '张三',
      receivedByUserId: 'U-1',
      terminalCode: 'T-1',
      transportOrderId: 'TO-1',
    });
    expect(buildDirectReceiptSubmissionRequest(form, items)).toEqual({
      items: [normalizeReceiptItem(items[0]!)],
      receivedByName: '张三',
      receivedByUserId: 'U-1',
      terminalCode: 'T-1',
    });
    expect(
      buildApplicationFormReprintRequest(' T-1 ', 'TO-1'),
    ).toEqual({
      remarks: '病理接收页补打印申请单，转运单：TO-1',
      terminalCode: 'T-1',
    });
  });

  it('validates receipt items with actionable messages', () => {
    expect(validateReceiptItems([])).toContain('没有可提交');
    expect(
      validateReceiptItems([
        {
          ...createReceiptDraftItem('BC-1'),
          qualityCheckResult: 'FAILED',
          qualityIssueCodes: [],
          receiptStatus: 'REJECTED',
        },
      ]),
    ).toContain('问题代码');
    expect(
      validateReceiptItems([
        {
          ...createReceiptDraftItem('BC-1'),
          reason: '',
          receiptStatus: 'REJECTED',
        },
      ]),
    ).toContain('填写原因');
    expect(validateReceiptItems([createReceiptDraftItem('BC-1')])).toBe('');
  });
});
