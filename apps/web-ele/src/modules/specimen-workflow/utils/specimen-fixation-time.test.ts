import type { ApplicationRegistrationWorkbenchRecord } from '../types/application-registration-workbench';
import type { SpecimenManagementListItem } from '../types/specimen-workflow';

import { describe, expect, it } from 'vitest';

import {
  buildExportHeaders,
  buildExportRows,
  buildQueueRow,
  isReceiptLocked,
  isVisibleInFixationScene,
  normalizeGenderLabel,
  resolveExactMatches,
  resolveFixationLiquidLabel,
  resolveFixationTagType,
  resolveUnavailableMessage,
} from './specimen-fixation-time';

const roomNameById = new Map([
  ['OR-102', '惠侨楼 - 手术室 2'],
  ['手术室 2', '惠侨楼 - 手术室 2'],
]);

function createRecordFixture(): ApplicationRegistrationWorkbenchRecord {
  return {
    applicationId: 'APP-1122',
    contagiousSpecimen: {
      hepatitis: false,
      hiv: false,
      isolation: false,
      syphilis: false,
      tuberculosis: false,
    },
    gynecologyInfo: {
      additionalNotes: '随诊观察',
      hpvResult: '阴性',
      lastMenstrualPeriod: '2026-05-01',
      menopause: false,
      previousCytology: '未见异常',
      previousTreatment: '无',
      specialConditions: {
        abnormalBleeding: false,
        birthControl: false,
        hormoneReplacement: false,
        hysterectomy: false,
        iud: false,
        lactation: false,
        menopause: false,
        other: '随诊观察',
        pregnancy: false,
        radiotherapy: false,
      },
    },
    patientInfo: {
      age: '30岁',
      applicationDate: '2026-05-27 10:00:00',
      applicationNo: '1122',
      applyDept: '急诊科',
      applyDoctor: '张宏',
      bedNo: '12床',
      checkItem: '手术标本检查',
      clinicalDiagnosis: '糖尿病肾病并发症',
      clinicalHistory: '临床病史',
      deliveryRequirement: '2小时内送达病理科',
      endoscopyDiagnosis: '内镜诊断',
      frozenReminder: false,
      gender: '女',
      idNo: '320101199001011234',
      imagingResult: 'MRI 提示右膝关节异常',
      inpatientNo: 'ZY0001122',
      patientName: '刘雨晴',
      patientVerified: true,
      phone: '13800001122',
      registrationStatus: '登记',
      remark: '备注信息',
      specimenType: '常规',
      wardName: '惠民楼12A',
    },
    specimenItems: [],
    surgeryInfo: {
      buildingId: 'B001',
      clinicalFindings: '术中所见',
      fixativeType: '福尔马林',
      fixationPerson: '周永强',
      fixationTime: '2026-05-27 11:07:02',
      roomId: 'OR-102',
      specimenRemovalTime: '2026-05-27 12:05:00',
      surgeryName: '右侧病灶清创术',
    },
  };
}

function createRowFixture(
  overrides: Partial<SpecimenManagementListItem> = {},
): SpecimenManagementListItem {
  return {
    abnormalFlag: false,
    applicationId: 'APP-1122',
    applicationNo: 'APP-1122',
    barcode: 'BC-1',
    containerCount: 1,
    containerName: '蜡块盒',
    fixationStatus: 'FIXING',
    fixationStartedAt: '2026-05-27 11:10:00',
    labelPrintBatchNo: 'BATCH-1',
    labelPrintStatus: 'PENDING',
    latestTrackingAt: null,
    patientName: '刘雨晴',
    specimenCount: 1,
    specimenId: 'SPEC-1',
    specimenName: '右膝肿物',
    specimenNo: 'S-1',
    specimenStatus: 'REGISTERED',
    specimenType: '常规',
    submittingDepartmentId: 'DEP-1',
    submittingDepartmentName: '急诊科',
    verificationStatus: 'VERIFIED',
    checkInStatus: 'PENDING',
    ...overrides,
  } as SpecimenManagementListItem;
}

describe('specimen fixation time helpers', () => {
  it('normalizes labels and visibility', () => {
    expect(normalizeGenderLabel('F')).toBe('女');
    expect(resolveFixationTagType('COMPLETED')).toBe('success');
    expect(
      isVisibleInFixationScene(
        createRowFixture({ verificationStatus: 'PENDING' }),
      ),
    ).toBe(false);
    expect(
      isReceiptLocked(createRowFixture({ specimenStatus: 'RECEIVED' })),
    ).toBe(true);
    expect(
      isVisibleInFixationScene(
        createRowFixture({
          fixationStatus: 'COMPLETED',
          specimenStatus: 'FIXED',
        }),
      ),
    ).toBe(false);
  });

  it('resolves unavailable messages and exact matches', () => {
    const row = createRowFixture();
    expect(resolveExactMatches([row], 'S-1')).toHaveLength(1);
    expect(resolveUnavailableMessage([row], 'S-1')).toBe('未找到可固定的标本');
    expect(
      resolveUnavailableMessage(
        [createRowFixture({ verificationStatus: 'PENDING' })],
        'S-1',
      ),
    ).toContain('离体确认');
    expect(
      resolveUnavailableMessage(
        [
          createRowFixture({
            fixationStatus: 'COMPLETED',
            specimenStatus: 'FIXED',
          }),
        ],
        'S-1',
      ),
    ).toBe('标本已完成固定，无需重复操作');
  });

  it('builds queue rows and export tables', () => {
    const record = createRecordFixture();
    const row = createRowFixture();
    const queueRow = buildQueueRow(
      row,
      {
        patientGender: 'F',
        patientId: 'PID-1',
        specimenRemovalTime: '2026-05-27 12:00:00',
      },
      record,
      {
        queueAddedAt: '2026-05-27 12:10:00',
        queueAddedByName: '管理员',
      },
      roomNameById,
    );

    expect(queueRow.patientGenderLabel).toBe('女');
    expect(queueRow.fixationOperatorName).toBe('周永强');
    expect(queueRow.surgeryName).toBe('惠侨楼 - 手术室 2');
    expect(buildExportHeaders()[0]).toBe('序号');
    expect(
      buildExportRows([queueRow], {
        getSpecimenRemovalTime: () => '2026-05-27 12:00:00',
        resolveFixationLiquidLabel: (value) =>
          resolveFixationLiquidLabel(value, [
            { label: '福尔马林', value: 'FORMALIN' },
          ]),
      })[0]?.[0],
    ).toBe('1');
  });
});
