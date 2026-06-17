import type { ApplicationRegistrationWorkbenchRecord } from '../types/application-registration-workbench';

import { describe, expect, it } from 'vitest';

import {
  buildSections,
  buildSummaryItems,
  getReprintApplicationIdentifier,
  getSectionDescriptionColumns,
  getSectionItemSpan,
  getSummaryDescriptionColumns,
  getSummaryItemSpan,
  getSummaryItemValueClass,
} from './application-registration-patient-panel';

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

describe('application registration patient panel helpers', () => {
  it('builds summary items and preserves write-back normalization', () => {
    const record = createRecordFixture();
    const summaryItems = buildSummaryItems(record);
    const checkItem = summaryItems.find((item) => item.key === 'checkItem');
    const registrationStatus = summaryItems.find(
      (item) => item.key === 'registrationStatus',
    );

    expect(summaryItems[0]?.label).toBe('申请单号');
    expect(getSummaryItemValueClass(summaryItems[0]!)).toBe(
      'text-[12px] font-semibold',
    );
    expect(registrationStatus?.value).toBe('登记');
    expect(
      checkItem?.writeBack?.(record, '  更新项目  ').patientInfo.checkItem,
    ).toBe('更新项目');
  });

  it('maps english registration status values to Chinese labels in summary items', () => {
    const record = createRecordFixture();
    record.patientInfo.registrationStatus = 'RECEIVED';

    const registrationStatus = buildSummaryItems(record).find(
      (item) => item.key === 'registrationStatus',
    );

    expect(registrationStatus?.value).toBe('已接收');
  });

  it('builds section groups and keeps surgery/gynecology write-back stable', () => {
    const record = createRecordFixture();
    const sections = buildSections(record, {
      buildingLabel: '惠侨楼',
      roomLabel: '手术室 2',
    });
    const surgerySection = sections.find(
      (section) => section.key === 'surgery',
    );
    const buildingRoom = surgerySection?.items.find(
      (item) => item.key === 'buildingRoom',
    );
    const menopauseItem = sections
      .find((section) => section.key === 'gynecology')
      ?.items.find((item) => item.key === 'menopause');

    expect(sections.map((section) => section.key)).toEqual([
      'application',
      'contagious',
      'surgery',
      'gynecology',
      'special',
    ]);
    expect(buildingRoom?.value).toBe('惠侨楼 / 手术室 2');
    expect(getSectionItemSpan(buildingRoom!)).toBe(3);

    const updated = menopauseItem?.writeBack?.(record, 'true');
    expect(updated?.gynecologyInfo.menopause).toBe(true);
    expect(updated?.gynecologyInfo.specialConditions.menopause).toBe(true);
  });

  it('falls back to application number when building reprint identifier', () => {
    const record = createRecordFixture();
    record.applicationId = '';
    record.patientInfo.applicationNo = 'AP202605280003';

    expect(getReprintApplicationIdentifier(record)).toBe('AP202605280003');
    expect(getReprintApplicationIdentifier(null)).toBe('');
  });

  it('adapts description columns and spans to narrower panel widths', () => {
    const record = createRecordFixture();
    const summaryItems = buildSummaryItems(record);
    const sections = buildSections(record, {
      buildingLabel: '惠侨楼',
      roomLabel: '手术室 2',
    });
    const applyDeptDoctor = summaryItems.find(
      (item) => item.key === 'applyDeptDoctor',
    );
    const buildingRoom = sections
      .find((section) => section.key === 'surgery')
      ?.items.find((item) => item.key === 'buildingRoom');
    const clinicalHistory = sections
      .find((section) => section.key === 'application')
      ?.items.find((item) => item.key === 'clinicalHistory');

    expect(getSummaryDescriptionColumns(600)).toBe(3);
    expect(getSummaryDescriptionColumns(400)).toBe(2);
    expect(getSummaryDescriptionColumns(280)).toBe(1);

    expect(getSectionDescriptionColumns(600)).toBe(3);
    expect(getSectionDescriptionColumns(420)).toBe(2);
    expect(getSectionDescriptionColumns(320)).toBe(1);

    expect(getSummaryItemSpan(applyDeptDoctor!, 2)).toBe(2);
    expect(getSummaryItemSpan(applyDeptDoctor!, 1)).toBe(1);
    expect(getSectionItemSpan(buildingRoom!, 2)).toBe(2);
    expect(getSectionItemSpan(clinicalHistory!, 1)).toBe(1);
  });
});
