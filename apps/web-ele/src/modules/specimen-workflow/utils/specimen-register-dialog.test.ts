import type { LatestSpecimenRegistrationResult } from '../types/specimen-workflow';

import { describe, expect, it } from 'vitest';

import {
  buildRegisterFormSnapshot,
  buildRegisterSubmissionRequest,
  createDefaultRegisterFormState,
  createEmptyRegisterRowSeed,
  mapSpecimenToRegisterRowSeed,
  validateRegisterItems,
} from './specimen-register-dialog';

function createResultFixture(): LatestSpecimenRegistrationResult {
  return {
    applicationId: 'APP-1',
    labelPrintBatchNo: 'BATCH-1',
    labelPrintMessage: null,
    labelPrintSuccess: true,
    registrationSnapshot: {
      collectionScene: '门诊',
      operatorName: '张三',
      operatorUserId: 'U-1',
      printerCode: 'P-1',
      remarks: '备注',
      terminalCode: 'T-1',
    },
    specimens: [
      {
        abnormalReason: null,
        barcode: 'BC-1',
        barcodeBindingStatus: null,
        checkInStatus: null,
        checkedInAt: null,
        checkedInByName: null,
        clinicalSymptom: '咳嗽',
        collectionMode: '现场',
        containerCount: 1,
        containerName: '蜡块盒',
        fixationStatus: 'FIXING',
        fixationCompletedAt: null,
        fixationLiquidType: null,
        fixationOperatorName: null,
        fixationOperatorUserId: null,
        fixationStartedAt: null,
        id: 'SPEC-1',
        labelPrintStatus: 'PENDING',
        qualityCheckResult: null,
        qualityIssueCodes: [],
        receiptStatus: null,
        specimenCount: 1,
        specimenConfirmedAt: null,
        specimenName: '肿物',
        specimenNo: 'S-1',
        specimenSite: '左肺',
        specimenStatus: 'REGISTERED',
        specimenType: '常规',
        verificationCompletedAt: null,
        verificationStartedAt: null,
        verificationStatus: null,
      },
    ],
  };
}

describe('specimen register dialog helpers', () => {
  it('builds defaults and row seeds', () => {
    expect(createDefaultRegisterFormState('张三', 'U-1').operatorName).toBe(
      '张三',
    );
    expect(createEmptyRegisterRowSeed().specimenCount).toBe(1);
    expect(
      mapSpecimenToRegisterRowSeed(createResultFixture().specimens[0]!),
    ).toEqual(
      expect.objectContaining({
        barcode: 'BC-1',
        specimenNameStandardized: '肿物',
      }),
    );
  });

  it('builds snapshot and submit payload', () => {
    const result = createResultFixture();
    const snapshot = buildRegisterFormSnapshot(result, '默认人', 'U-0');
    expect(snapshot?.operatorName).toBe('张三');
    expect(snapshot?.items).toHaveLength(1);

    const request = buildRegisterSubmissionRequest(
      'APP-1',
      createDefaultRegisterFormState('张三', 'U-1'),
      [
        {
          barcode: 'BC-1',
          clinicalSymptom: '咳嗽',
          collectionMode: '现场',
          containerCount: 1,
          containerName: '蜡块盒',
          specimenCount: 1,
          specimenNameStandardized: '肿物',
          specimenSite: '左肺',
          specimenType: '常规',
        },
      ],
    );
    expect(request.applicationId).toBe('APP-1');
  });

  it('validates register items', () => {
    expect(
      validateRegisterItems([
        {
          barcode: 'BC-1',
          clinicalSymptom: '',
          collectionMode: '',
          containerCount: 1,
          containerName: '蜡块盒',
          specimenCount: 1,
          specimenNameStandardized: '肿物',
          specimenSite: '左肺',
          specimenType: '常规',
        },
      ]),
    ).toBe('');
    expect(
      validateRegisterItems([
        {
          barcode: 'BC-1',
          clinicalSymptom: '',
          collectionMode: '',
          containerCount: 1,
          containerName: '',
          specimenCount: 1,
          specimenNameStandardized: '肿物',
          specimenSite: '左肺',
          specimenType: '常规',
        },
      ]),
    ).toContain('容器');
  });
});
