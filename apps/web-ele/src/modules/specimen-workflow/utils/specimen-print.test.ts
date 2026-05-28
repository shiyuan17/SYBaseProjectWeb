import { describe, expect, it } from 'vitest';

import {
  buildApplicationFormPrintDocument,
  buildSpecimenBatchPrintDocument,
  buildSpecimenPrintDocument,
} from './specimen-print';

describe('buildSpecimenPrintDocument', () => {
  it('renders the label fields and qrcode into a printable html document', async () => {
    const documentHtml = buildSpecimenPrintDocument({
      context: {
        applyDept: '急诊科',
        gender: '女',
        idNo: '34734663',
        patientName: '潘姐',
        roomLabel: '手术室2',
        surgeryTime: '2026-05-27 11:02:00',
      },
      item: {
        id: 'item-1',
        quantity: 1,
        specimenName: '右侧胫骨感染病灶',
        specimenNo: '22498',
        specimenSite: '骨髓炎',
        status: '标本确认',
      },
    });

    expect(documentHtml).toContain('34734663');
    expect(documentHtml).toContain('急诊科');
    expect(documentHtml).toContain('潘姐（女）');
    expect(documentHtml).toContain('26-05-27 11:02  手术室2');
    expect(documentHtml).toContain('右侧胫骨感染病灶');
    expect(documentHtml).toContain('https://api.qrserver.com/v1/create-qr-code/');
    expect(documentHtml).toContain('window.print()');
    expect(documentHtml).not.toContain('仅供预览');
  });

  it('renders multiple labels for batch printing', () => {
    const documentHtml = buildSpecimenBatchPrintDocument({
      context: {
        applyDept: '急诊科',
        gender: '女',
        idNo: '34734663',
        patientName: '潘姐',
        roomLabel: '手术室2',
        surgeryTime: '2026-05-27 11:02:00',
      },
      items: [
        {
          id: 'item-1',
          quantity: 1,
          specimenName: '右侧胫骨感染病灶',
          specimenNo: '22498',
          specimenSite: '骨髓炎',
          status: '标本确认',
        },
        {
          id: 'item-2',
          quantity: 1,
          specimenName: '右股骨骨髓炎病灶',
          specimenNo: '22499',
          specimenSite: '股骨',
          status: '标本确认',
        },
      ],
    });

    expect(documentHtml).toContain('右侧胫骨感染病灶');
    expect(documentHtml).toContain('右股骨骨髓炎病灶');
    expect(documentHtml).toContain('sheet-break');
  });

  it('renders application core content without legacy register sections', () => {
    const documentHtml = buildApplicationFormPrintDocument({
      applicationId: 'APP-001',
      contagiousSpecimen: {
        hepatitis: false,
        hiv: false,
        isolation: false,
        syphilis: false,
        tuberculosis: false,
      },
      gynecologyInfo: {
        additionalNotes: '补充说明',
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
          other: '补充说明',
          pregnancy: false,
          radiotherapy: false,
        },
      },
      patientInfo: {
        age: '30岁',
        applicationDate: '2026-05-27 10:00:00',
        applicationNo: 'AP202605280005',
        applyDept: '急诊科',
        applyDoctor: '张宏',
        bedNo: '12床',
        checkItem: '检查项目',
        clinicalDiagnosis: '糖尿病肾病并发症',
        clinicalHistory: '临床病历测试',
        deliveryRequirement: '2小时内送达病理科',
        endoscopyDiagnosis: '内镜诊断',
        frozenReminder: false,
        gender: '女',
        idNo: '320101199001011234',
        imagingResult: '影像结果',
        inpatientNo: 'ZY0001122',
        patientName: '刘雨晴',
        patientVerified: true,
        phone: '13800001122',
        registrationStatus: '登记',
        remark: '备注信息',
        specimenType: '常规',
        wardName: '惠侨楼 12A',
      },
      specimenItems: [
        {
          id: 'item-1',
          quantity: 1,
          specimenName: '右侧胫骨感染病灶',
          specimenNo: '22498',
          specimenSite: '骨髓炎',
          status: '新增',
        },
      ],
      surgeryInfo: {
        buildingId: '惠侨楼',
        clinicalFindings: '术中所见',
        fixativeType: '福尔马林',
        fixationPerson: '周永坚',
        fixationTime: '2026-05-27 11:07:02',
        roomId: '手术室1',
        surgeryName: '右侧胫骨病灶清创术',
      },
    });

    expect(documentHtml).toContain('申请单补打');
    expect(documentHtml).toContain('刘雨晴');
    expect(documentHtml).toContain('右侧胫骨感染病灶');
    expect(documentHtml).not.toContain('兼容登记');
    expect(documentHtml).not.toContain('最近标签批次结果');
  });
});
