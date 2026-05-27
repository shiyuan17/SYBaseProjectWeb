import { describe, expect, it } from 'vitest';

import {
  listCommonSpecimenOptions,
  listOperatingBuildingOptions,
  listOperatingRoomOptions,
  listSpecimenDictionaryEntryOptions,
  listSpecimenDictionaryGroups,
  listSpecimenPackageOptions,
  lookupApplicationRegistrationWorkbenchRecord,
} from './application-registration-workbench-mock';

describe('application registration workbench mock service', () => {
  it('looks up the same record by application number and inpatient number', async () => {
    const byApplicationNo = await lookupApplicationRegistrationWorkbenchRecord({
      keyword: '1122',
    });
    const byInpatientNo = await lookupApplicationRegistrationWorkbenchRecord({
      keyword: 'ZY0001122',
    });

    expect(byApplicationNo?.patientInfo.applicationNo).toBe('1122');
    expect(byInpatientNo?.patientInfo.inpatientNo).toBe('ZY0001122');
    expect(byInpatientNo).toEqual(byApplicationNo);
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
    expect(
      buildingB002Rooms.every((room) => room.buildingId === 'B002'),
    ).toBe(true);
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
});
