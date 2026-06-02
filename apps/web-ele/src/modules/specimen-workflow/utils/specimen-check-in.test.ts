import type { SpecimenManagementListItem } from '../types/specimen-workflow';

import { describe, expect, it } from 'vitest';

import {
  isCheckInReady,
  isVisibleInCheckInScene,
  resolveUnavailableMessage,
} from './specimen-check-in';

function createRowFixture(
  overrides: Partial<SpecimenManagementListItem> = {},
): SpecimenManagementListItem {
  return {
    abnormalFlag: false,
    applicationId: 'APP-1',
    applicationNo: 'AP-1',
    barcode: 'BC-1',
    checkInStatus: 'NOT_CHECKED_IN',
    containerCount: 1,
    containerName: '标本瓶',
    fixationStatus: 'COMPLETED',
    labelPrintBatchNo: 'BATCH-1',
    labelPrintStatus: 'SUCCESS',
    latestTrackingAt: '2026-06-01 08:00:00',
    patientName: 'Alice',
    registeredAt: '2026-06-01 07:30:00',
    specimenConfirmedAt: '2026-06-01 07:50:00',
    specimenCount: 1,
    specimenId: 'SPEC-1',
    specimenName: '乳腺组织',
    specimenNo: 'SP-1',
    specimenSite: '乳腺',
    specimenStatus: 'FIXED',
    specimenType: '常规',
    submittingDepartmentId: 'DEPT-1',
    submittingDepartmentName: '外科',
    verificationStatus: 'VERIFIED',
    ...overrides,
  } as SpecimenManagementListItem;
}

describe('specimen check-in helpers', () => {
  it('keeps visibility and readiness aligned', () => {
    const row = createRowFixture();
    expect(isCheckInReady(row)).toBe(true);
    expect(isVisibleInCheckInScene(row)).toBe(true);
    expect(
      isCheckInReady(createRowFixture({ checkInStatus: 'CHECKED_IN' })),
    ).toBe(false);
  });

  it('explains why a specimen cannot be checked in', () => {
    expect(
      resolveUnavailableMessage(
        [
          createRowFixture(),
          createRowFixture({
            barcode: 'BC-2',
            specimenId: 'SPEC-2',
            specimenNo: 'SP-2',
            specimenConfirmedAt: null,
          }),
        ],
        'SP-1',
      ),
    ).toBe('当前申请单下仍有标本未完成核对、固定或标本确认，不能入库');
    expect(
      resolveUnavailableMessage(
        [createRowFixture({ checkInStatus: 'CHECKED_IN' })],
        'SP-1',
      ),
    ).toBe('标本已完成入库，无需重复操作');
    expect(
      resolveUnavailableMessage(
        [createRowFixture({ specimenConfirmedAt: null })],
        'SP-1',
      ),
    ).toBe('当前申请单下仍有标本未完成核对、固定或标本确认，不能入库');
    expect(
      resolveUnavailableMessage(
        [createRowFixture({ fixationStatus: 'PENDING' })],
        'SP-1',
      ),
    ).toBe('当前申请单下仍有标本未完成核对、固定或标本确认，不能入库');
    expect(
      resolveUnavailableMessage(
        [createRowFixture({ verificationStatus: 'PENDING' })],
        'SP-1',
      ),
    ).toBe('当前申请单下仍有标本未完成核对、固定或标本确认，不能入库');
    expect(
      resolveUnavailableMessage(
        [createRowFixture({ specimenStatus: 'RECEIVED' })],
        'SP-1',
      ),
    ).toBe('标本已接收、拒收或退回，不能再入库');
    expect(resolveUnavailableMessage([], 'SP-404')).toBe('未找到可入库标本');
  });
});
