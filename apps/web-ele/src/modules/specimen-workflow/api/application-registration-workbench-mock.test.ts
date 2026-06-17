import { beforeEach, describe, expect, it } from 'vitest';

import {
  listCommonSpecimenOptions,
  listOperatingBuildingOptions,
  listOperatingRoomOptions,
  listSpecimenDictionaryEntryOptions,
  listSpecimenDictionaryGroups,
  listSpecimenPackageOptions,
  lookupApplicationRegistrationWorkbenchRecord,
  resetApplicationRegistrationWorkbenchMockState,
  saveApplicationRegistrationWorkbenchMock,
} from './application-registration-workbench-mock';
import { createApplication, resetMockState } from './specimen-workflow-service';

describe('application registration workbench mock service', () => {
  beforeEach(() => {
    resetApplicationRegistrationWorkbenchMockState();
    resetMockState();
  });

  it('looks up the same record by application number and inpatient number', async () => {
    const byApplicationNo = await lookupApplicationRegistrationWorkbenchRecord({
      keyword: '1122',
      queryType: 'APPLICATION_NO',
    });
    const byInpatientNo = await lookupApplicationRegistrationWorkbenchRecord({
      keyword: 'ZY0001122',
      queryType: 'INPATIENT_NO',
    });
    const byPatientName = await lookupApplicationRegistrationWorkbenchRecord({
      keyword: '张',
      queryType: 'PATIENT_NAME',
    });

    expect(byApplicationNo?.patientInfo.applicationNo).toBe('1122');
    expect(byInpatientNo?.patientInfo.inpatientNo).toBe('ZY0001122');
    expect(
      byApplicationNo?.surgeryInfo.specimenRemovalTime ?? '',
    ).not.toBeUndefined();
    expect(byInpatientNo).toEqual(byApplicationNo);
    expect(byPatientName?.patientInfo.patientName).toContain('张');
  });

  it('filters operating rooms by selected operating building', async () => {
    const buildings = await listOperatingBuildingOptions();
    const buildingIds = buildings.map((building) => building.buildingId);
    const buildingB002Rooms = await listOperatingRoomOptions('B002');

    expect(buildingIds).toContain('B001');
    expect(buildingIds).toContain('B002');
    expect(buildingB002Rooms.map((room) => room.roomId)).toEqual([
      'OR-201',
      'OR-202',
    ]);
    expect(buildingB002Rooms.every((room) => room.buildingId === 'B002')).toBe(
      true,
    );
  });

  it('filters specimen dictionary groups by Chinese keyword', async () => {
    const groups = await listSpecimenDictionaryGroups('宫颈');

    expect(groups).toHaveLength(1);
    expect(groups[0]?.systemName).toBe('妇科');
    expect(groups[0]?.subParts[0]?.partName).toBe('宫颈');
    expect(groups[0]?.subParts[0]?.specimens).toEqual(
      expect.arrayContaining(['宫颈 3 点位组织', '宫颈 6 点位组织']),
    );
  });

  it('filters specimen entry options by pinyin initials', async () => {
    const options = await listSpecimenDictionaryEntryOptions('xgjhm');

    expect(options.map((option) => option.specimenName)).toEqual(
      expect.arrayContaining(['膝关节滑膜组织']),
    );
  });

  it('returns common specimen options for the quick tag area', async () => {
    const options = await listCommonSpecimenOptions();

    expect(options.length).toBeGreaterThan(0);
    expect(options[0]).toMatchObject({
      partName: '骨髓炎',
      specimenName: '右侧胫骨感染病灶',
    });
  });

  it('filters specimen packages by department and keyword', async () => {
    const gynecologyPackages = await listSpecimenPackageOptions('', '妇科');
    const breastPackages = await listSpecimenPackageOptions('rxzw', '普外科');
    const emergencyPackages = await listSpecimenPackageOptions('', '急诊科');

    expect(gynecologyPackages.map((item) => item.packageName)).toEqual(
      expect.arrayContaining(['宫颈多点活检套餐']),
    );
    expect(breastPackages).toHaveLength(1);
    expect(breastPackages[0]).toMatchObject({
      applyDept: '普外科',
      itemCount: 3,
      packageName: '乳腺肿物常规取材套餐',
    });
    expect(emergencyPackages.map((item) => item.packageName)).toEqual(
      expect.arrayContaining(['急诊清创送检套餐', '急诊创面皮肤活检套餐']),
    );
  });

  it('can look up a newly created application by application number', async () => {
    await createApplication({
      applicationDate: '2026-06-08',
      applicationFormStatus: 'PENDING',
      applicationNo: 'AUTO-MOCK-LOOKUP-001',
      applicationType: 'ROUTINE',
      clinicalDiagnosis: '自动创建待补充诊断',
      patientId: 'AUTO-AUTO-MOCK-LOOKUP-001',
      patientName: '自动生成患者-AUTO-MOCK-LOOKUP-001',
      submissionDate: '2026-06-08',
    });

    const lookedUpRecord = await lookupApplicationRegistrationWorkbenchRecord({
      keyword: 'AUTO-MOCK-LOOKUP-001',
      queryType: 'APPLICATION_NO',
    });

    expect(lookedUpRecord).toMatchObject({
      contagiousSpecimen: {
        hepatitis: expect.any(Boolean),
        hiv: expect.any(Boolean),
        isolation: expect.any(Boolean),
        syphilis: expect.any(Boolean),
        tuberculosis: expect.any(Boolean),
      },
      gynecologyInfo: {
        additionalNotes: expect.not.stringContaining('待补充'),
        hpvResult: expect.any(String),
        previousCytology: expect.not.stringContaining('待补充'),
        previousTreatment: expect.not.stringContaining('待补充'),
        specialConditions: {
          abnormalBleeding: expect.any(Boolean),
          birthControl: expect.any(Boolean),
          hormoneReplacement: expect.any(Boolean),
          hysterectomy: expect.any(Boolean),
          iud: expect.any(Boolean),
          lactation: expect.any(Boolean),
          menopause: expect.any(Boolean),
          other: expect.any(String),
          pregnancy: expect.any(Boolean),
          radiotherapy: expect.any(Boolean),
        },
      },
      patientInfo: {
        applicationNo: 'AUTO-MOCK-LOOKUP-001',
        checkItem: expect.not.stringContaining('待补充'),
        clinicalDiagnosis: expect.not.stringContaining('待补充'),
        clinicalHistory: expect.not.stringContaining('待补充'),
        gender: expect.stringMatching(/男|女/),
        idNo: expect.stringMatching(/^\d{5}$/),
        imagingResult: expect.not.stringContaining('待补充'),
        inpatientNo: expect.stringMatching(/^ZY\d{5}$/),
        patientName: expect.not.stringContaining('待补充'),
        patientVerified: true,
        phone: expect.stringMatching(/^138\d{8}$/),
        specimenType: '常规',
      },
      specimenItems: [],
      surgeryInfo: {
        buildingId: expect.stringMatching(/^B\d{3}$/),
        clinicalFindings: expect.not.stringContaining('待补充'),
        fixativeType: '10%中性福尔马林',
        fixationPerson: expect.not.stringContaining('待补充'),
        fixationTime: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/,
        ),
        roomId: expect.stringMatching(/^OR-\d{3}$/),
        specimenRemovalTime: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/,
        ),
        surgeryName: expect.not.stringContaining('待补充'),
      },
    });
  });

  it('persists saved workbench changes through the mock service boundary', async () => {
    const savedRecord = await saveApplicationRegistrationWorkbenchMock('1122', {
      contagiousSpecimen: {
        hepatitis: false,
        hiv: false,
        isolation: false,
        syphilis: false,
        tuberculosis: false,
      },
      gynecologyInfo: {
        additionalNotes: '已补充保存',
        hpvResult: null,
        lastMenstrualPeriod: null,
        menopause: false,
        previousCytology: '',
        previousTreatment: '',
        specialConditions: {
          abnormalBleeding: false,
          birthControl: false,
          hormoneReplacement: false,
          hysterectomy: false,
          iud: false,
          lactation: false,
          menopause: false,
          other: '',
          pregnancy: false,
          radiotherapy: false,
        },
      },
      patientInfo: {
        age: '42',
        applicationDate: '2026-05-23',
        applicationNo: '1122',
        applyDept: '骨科',
        applyDoctor: '张医生',
        bedNo: '12A',
        checkItem: '常规病理',
        clinicalDiagnosis: '慢性骨髓炎',
        clinicalHistory: '保存后应可再次查询',
        deliveryRequirement: '',
        endoscopyDiagnosis: '',
        frozenReminder: false,
        gender: '男',
        idNo: '320000000000000000',
        imagingResult: '',
        inpatientNo: 'ZY0001122',
        patientName: '张某某',
        patientVerified: true,
        phone: '13800000000',
        registrationStatus: 'SAVED',
        remark: '测试保存',
        specimenType: '常规',
        wardName: '骨科病房',
      },
      specimenItems: [
        {
          quantity: 2,
          specimenName: '保存后的右侧胫骨感染病灶',
          specimenSite: '右胫骨',
          status: '待登记',
        },
      ],
      surgeryInfo: {
        buildingId: 'B001',
        clinicalFindings: '局部红肿',
        fixativeType: '10%中性福尔马林',
        fixationPerson: '王护士',
        fixationTime: '2026-05-23 10:20:00',
        roomId: 'OR-101',
        specimenRemovalTime: '2026-05-23 10:10:00',
        surgeryName: '感染灶清创',
      },
    });
    const lookedUpRecord = await lookupApplicationRegistrationWorkbenchRecord({
      keyword: '1122',
      queryType: 'APPLICATION_NO',
    });

    expect(savedRecord.patientInfo.registrationStatus).toBe('SAVED');
    expect(savedRecord.specimenItems[0]?.specimenName).toBe(
      '保存后的右侧胫骨感染病灶',
    );
    expect(lookedUpRecord?.patientInfo.clinicalHistory).toBe(
      '保存后应可再次查询',
    );
  });
});
