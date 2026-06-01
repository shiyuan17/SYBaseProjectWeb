import type { SpecimenManagementListItem } from '../types/specimen-workflow';

import { describe, expect, it } from 'vitest';

import {
  buildRetryLabelPrintRequest,
  buildRetryRowsFromLatestResult,
  buildSpecimenManagementListQuery,
  buildSpecimenVerificationRequest,
  canCompleteVerify,
  canRetryBatch,
  canStartVerify,
  createEmptySummary,
  createRetryFormDefaults,
  createVerifyFormDefaults,
  isNotFoundWorkflowError,
  isVerifyCompleted,
  labelTagType,
  normalizeRouteQueryValue,
  resolveExplicitAbnormalFlag,
  resolveQuickFilterQuery,
  resolveRetryDialogContext,
  specimenTagType,
  triggerWorkbenchLookupState,
} from './specimen-management';

function createItem(
  overrides: Partial<SpecimenManagementListItem> = {},
): SpecimenManagementListItem {
  return {
    abnormalFlag: false,
    applicationId: 'APP-1',
    applicationNo: 'M2-1',
    barcode: 'BC-1',
    barcodeBindingStatus: null,
    checkInStatus: 'NOT_CHECKED_IN',
    checkedInAt: null,
    checkedInByName: null,
    containerCount: 1,
    containerName: 'Tube 1',
    fixationStatus: 'PENDING',
    fixationCompletedAt: null,
    fixationLiquidType: null,
    fixationOperatorName: null,
    fixationOperatorUserId: null,
    fixationStartedAt: null,
    labelPrintBatchNo: 'LB-1',
    labelPrintStatus: 'PENDING',
    latestTrackingAt: '2026-05-30 10:00:00',
    patientName: 'Alice',
    recentNode: null,
    registeredAt: '2026-05-30 09:00:00',
    specimenCount: 2,
    specimenConfirmedAt: null,
    specimenId: 'SPEC-1',
    specimenName: 'Specimen 1',
    specimenNo: 'SP-1',
    specimenSite: 'Site',
    specimenStatus: 'REGISTERED',
    specimenType: 'TYPE',
    submittingDepartmentId: 'DEP-1',
    submittingDepartmentName: 'Dept',
    verificationCompletedAt: null,
    verificationStartedAt: null,
    verificationStatus: null,
    ...overrides,
  };
}

describe('specimen management helpers', () => {
  it('creates reusable defaults and normalizes route values', () => {
    expect(createEmptySummary()).toEqual({
      abnormalCount: 0,
      labelPrintedCount: 0,
      pendingLabelCount: 0,
      totalCount: 0,
      unboundCount: 0,
    });
    expect(createRetryFormDefaults('Alice', 'USER-1')).toEqual(
      expect.objectContaining({
        operatorName: 'Alice',
        operatorUserId: 'USER-1',
      }),
    );
    expect(createVerifyFormDefaults('Alice', 'USER-1')).toEqual(
      expect.objectContaining({
        specimenBarcode: '',
      }),
    );
    expect(normalizeRouteQueryValue(['ABC'])).toBe('ABC');
    expect(normalizeRouteQueryValue(123)).toBe('');
  });

  it('resolves quick filter and route lookup states', () => {
    expect(resolveQuickFilterQuery('ABNORMAL')).toEqual({ abnormalFlag: true });
    expect(resolveQuickFilterQuery('VERIFIED')).toEqual({
      specimenStatus: 'FIXED',
    });
    expect(resolveExplicitAbnormalFlag('true')).toBe(true);
    expect(resolveExplicitAbnormalFlag('false')).toBe(false);
    expect(triggerWorkbenchLookupState('  APP-1  ')).toEqual(
      expect.objectContaining({
        keyword: 'APP-1',
        triggerKeyDelta: 1,
      }),
    );
    expect(triggerWorkbenchLookupState('   ')).toBeNull();
  });

  it('builds the list query and submit payloads with trimmed values', () => {
    expect(
      buildSpecimenManagementListQuery({
        abnormalFlag: '',
        dateRange: ['2026-05-01', '2026-05-30'],
        departmentId: ' DEP-1 ',
        keyword: ' APP ',
        labelPrintStatus: '',
        page: 2,
        quickFilter: 'PENDING_LABEL',
        size: 20,
        specimenStatus: '',
      }),
    ).toEqual({
      abnormalFlag: undefined,
      dateFrom: '2026-05-01',
      dateTo: '2026-05-30',
      departmentId: 'DEP-1',
      keyword: 'APP',
      labelPrintStatus: 'PENDING',
      page: 2,
      size: 20,
      specimenStatus: undefined,
    });

    expect(
      buildRetryLabelPrintRequest({
        printerCode: ' PR-1 ',
        remarks: ' Retry ',
        terminalCode: ' TERM-1 ',
      }),
    ).toEqual({
      printerCode: 'PR-1',
      remarks: 'Retry',
      terminalCode: 'TERM-1',
    });

    expect(
      buildSpecimenVerificationRequest({
        fixationLiquidType: ' 10% formalin ',
        remarks: ' Verify ',
        specimenBarcode: ' BC-1 ',
        terminalCode: ' TERM-1 ',
      }),
    ).toEqual({
      fixationLiquidType: '10% formalin',
      remarks: 'Verify',
      specimenBarcode: 'BC-1',
      terminalCode: 'TERM-1',
    });
  });

  it('keeps specimen row action guards and tags stable', () => {
    expect(canRetryBatch(createItem())).toBe(true);
    expect(isVerifyCompleted(createItem({ specimenStatus: 'FIXED' }))).toBe(
      true,
    );
    expect(canStartVerify(createItem({ fixationStatus: 'PENDING' }))).toBe(
      true,
    );
    expect(canCompleteVerify(createItem({ fixationStatus: 'FIXING' }))).toBe(
      true,
    );
    expect(labelTagType('FAILED')).toBe('danger');
    expect(specimenTagType(createItem({ abnormalFlag: true }))).toBe('danger');
  });

  it('resolves retry dialog context and latest-result retry rows', () => {
    expect(resolveRetryDialogContext([], '批量补打')).toEqual({
      errorMessage: '请先选择需要补打的标本',
      ok: false,
    });
    expect(
      resolveRetryDialogContext(
        [createItem({ labelPrintStatus: 'SUCCESS' })],
        '批量补打',
      ),
    ).toEqual({
      errorMessage: '仅待打印或打印失败的记录支持补打',
      ok: false,
    });
    expect(
      resolveRetryDialogContext(
        [
          createItem({ applicationId: 'APP-1', labelPrintBatchNo: 'LB-1' }),
          createItem({ applicationId: 'APP-1', labelPrintBatchNo: 'LB-1' }),
        ],
        '批量补打',
      ),
    ).toEqual({
      applicationId: 'APP-1',
      batchNo: 'LB-1',
      ok: true,
      selectionCount: 2,
      sourceLabel: '批量补打',
    });

    expect(
      buildRetryRowsFromLatestResult(
        {
          labelPrintBatchNo: 'LB-1',
          specimens: [
            {
              abnormalReason: null,
              barcode: 'BC-1',
              containerCount: 1,
              containerName: 'Tube 1',
              fixationStatus: 'PENDING',
              id: 'SPEC-1',
              labelPrintStatus: 'FAILED',
              specimenCount: 1,
              specimenName: 'Specimen 1',
              specimenNo: 'SP-1',
              specimenSite: 'Site',
              specimenStatus: 'REGISTERED',
              specimenType: 'TYPE',
            },
            {
              abnormalReason: null,
              barcode: 'BC-2',
              containerCount: 1,
              containerName: 'Tube 2',
              fixationStatus: 'PENDING',
              id: 'SPEC-2',
              labelPrintStatus: 'SUCCESS',
              specimenCount: 1,
              specimenName: 'Specimen 2',
              specimenNo: 'SP-2',
              specimenSite: 'Site',
              specimenStatus: 'REGISTERED',
              specimenType: 'TYPE',
            },
          ],
        },
        'APP-1',
      ),
    ).toEqual([
      expect.objectContaining({
        applicationId: 'APP-1',
        barcode: 'BC-1',
        labelPrintBatchNo: 'LB-1',
        labelPrintStatus: 'FAILED',
        specimenId: 'SPEC-1',
      }),
    ]);
  });

  it('identifies not-found workflow errors', () => {
    expect(
      isNotFoundWorkflowError({
        response: { status: 404 },
      }),
    ).toBe(true);
    expect(
      isNotFoundWorkflowError({
        response: { data: { message: 'Resource not found' } },
      }),
    ).toBe(true);
    expect(isNotFoundWorkflowError(new Error('boom'))).toBe(false);
  });
});
