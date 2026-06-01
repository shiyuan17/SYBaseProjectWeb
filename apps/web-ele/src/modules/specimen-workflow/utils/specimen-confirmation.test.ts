import type { ApplicationRegistrationWorkbenchRecord } from '../types/application-registration-workbench';
import type { SpecimenManagementListItem } from '../types/specimen-workflow';

import { describe, expect, it, vi } from 'vitest';

import {
  buildEnhancedRows,
  buildExportHeaders,
  buildExportRows,
  canConfirm,
  canRetryLabel,
  enhanceRow,
  isReceiptLocked,
  isVisibleInConfirmationScene,
  normalizeGenderLabel,
} from './specimen-confirmation';

const roomNameById = new Map([['OR-102', '手术室 2']]);

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
      additionalNotes: '随访观察',
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
        other: '随访观察',
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
      wardName: '惠侨楼 12A',
    },
    specimenItems: [],
    surgeryInfo: {
      buildingId: 'B001',
      clinicalFindings: '术中所见',
      fixativeType: '福尔马林',
      fixationPerson: '周永坡',
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
    fixationStatus: 'COMPLETED',
    labelPrintBatchNo: 'BATCH-1',
    labelPrintStatus: 'PENDING',
    latestTrackingAt: null,
    patientName: '刘雨晴',
    registeredAt: '2026-05-27 12:30:00',
    specimenCount: 1,
    specimenId: 'SPEC-1',
    specimenName: '右膝肿物',
    specimenNo: 'S-1',
    specimenSite: '右膝',
    specimenStatus: 'REGISTERED',
    specimenType: '常规',
    submittingDepartmentId: 'DEP-1',
    submittingDepartmentName: '急诊科',
    verificationStatus: 'VERIFIED',
    checkInStatus: 'PENDING',
    ...overrides,
  } as SpecimenManagementListItem;
}

function createConfirmationRowFixture(
  overrides: Partial<SpecimenManagementListItem> = {},
) {
  return enhanceRow(
    createRowFixture(overrides),
    { patientGender: 'F', submittingDoctorName: '张宏' },
    createRecordFixture(),
    roomNameById,
  );
}

describe('specimen confirmation helpers', () => {
  it('normalizes gender and visibility rules', () => {
    expect(normalizeGenderLabel('F')).toBe('女');
    expect(normalizeGenderLabel('男')).toBe('男');
    expect(
      isVisibleInConfirmationScene(
        createRowFixture({ specimenStatus: 'RECEIVED' }),
      ),
    ).toBe(false);
    expect(isReceiptLocked(createRowFixture())).toBe(false);
  });

  it('keeps confirmation and retry guards stable', () => {
    const row = createConfirmationRowFixture();
    expect(canConfirm({ ...row, specimenConfirmedAt: null })).toBe(true);
    expect(canConfirm({ ...row, specimenConfirmedAt: '2026-05-27' })).toBe(
      false,
    );
    expect(canRetryLabel(row)).toBe(true);
  });

  it('enhances rows and exports tabular data', async () => {
    const record = createRecordFixture();
    const row = createRowFixture();
    const enhanced = enhanceRow(
      row,
      { patientGender: 'F', submittingDoctorName: '张宏' },
      record,
      roomNameById,
    );
    expect(enhanced.patientGenderLabel).toBe('女');
    expect(enhanced.inpatientNo).toBe('ZY0001122');
    expect(enhanced.surgeryName).toBe('手术室 2');

    const ensureWorkbenchRecord = vi.fn(async () => record);
    const ensureApplicationContext = vi.fn(async () => ({
      patientGender: 'F',
      submittingDoctorName: '张宏',
    }));
    const rows = await buildEnhancedRows([row], {
      ensureApplicationContext,
      ensureWorkbenchRecord,
      getApplicationContext: () => ({
        patientGender: 'F',
        submittingDoctorName: '张宏',
      }),
      getWorkbenchRecord: () => record,
    }, roomNameById);

    expect(rows[0]?.registrationOperatorName).toBe('张宏');
    expect(rows[0]?.surgeryName).toBe('手术室 2');
    expect(buildExportHeaders()[0]).toBe('序号');
    expect(buildExportRows(rows)[0]?.[0]).toBe('1');
    expect(buildExportRows(rows)[0]?.[6]).toBe('手术室 2');
  });
});
