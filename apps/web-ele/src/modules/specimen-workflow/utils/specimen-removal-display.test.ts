import type {
  SpecimenManagementListItem,
  SpecimenRemovalItem,
} from '../types/specimen-workflow';

import { describe, expect, it } from 'vitest';

import {
  canConfirmRemoval,
  mapSpecimenManagementItemToRemovalDisplayRow,
  resolveRemovalActionDisabledReason,
  toRemovalDisplayRow,
} from './specimen-removal-display';

describe('specimen removal display helpers', () => {
  it('marks confirmed specimens as disabled', () => {
    const row: SpecimenRemovalItem = {
      abnormalFlag: false,
      applicationId: 'APP-001',
      applicationNo: 'AP-001',
      barcode: 'BC-001',
      containerCount: 1,
      containerName: '福尔马林瓶',
      inpatientNo: null,
      latestTrackingAt: null,
      patientGender: null,
      patientName: 'Alice',
      registeredAt: '2026-06-02 09:00:00',
      registeredByName: '护士A',
      specimenId: 'SPEC-001',
      specimenName: '右臂组织',
      specimenNo: 'SP-001',
      specimenRemovalAt: '2026-06-02 09:30:00',
      specimenRemovalOperatorName: '护士A',
      specimenStatus: 'REGISTERED',
      specimenType: '常规',
      surgeryName: 'OR-101',
    };

    expect(canConfirmRemoval(row)).toBe(false);
    expect(resolveRemovalActionDisabledReason(row)).toBe('标本已完成离体确认');
    expect(toRemovalDisplayRow(row).sceneMatched).toBe(false);
  });

  it('maps specimen management items into removal display rows', () => {
    const row = mapSpecimenManagementItemToRemovalDisplayRow({
      abnormalFlag: false,
      applicationId: 'APP-001',
      applicationNo: 'AP-001',
      barcode: 'BC-001',
      containerCount: 1,
      containerName: '福尔马林瓶',
      fixationStatus: 'PENDING',
      latestTrackingAt: '2026-06-02 09:00:00',
      patientGender: '女',
      patientId: 'INTERNAL-001',
      patientName: 'Alice',
      registeredAt: '2026-06-02 08:00:00',
      registrationOperatorName: '护士A',
      specimenId: 'SPEC-001',
      specimenName: '右臂组织',
      specimenNo: 'SP-001',
      specimenRemovalAt: null,
      specimenRemovalOperatorName: '护士B',
      specimenStatus: 'REGISTERED',
      specimenType: '常规',
      surgeryName: 'OR-101',
      wardName: '普外科病区 8B',
      verificationStatus: 'PENDING',
    } as SpecimenManagementListItem);

    expect(row.sceneMatched).toBe(true);
    expect(row.actionDisabledReason).toBe(null);
    expect(row.patientGender).toBe('女');
    expect(row.patientId).toBe('INTERNAL-001');
    expect(row.registeredByName).toBe('护士A');
    expect(row.specimenRemovalOperatorName).toBe('护士B');
    expect(row.wardName).toBe('普外科病区 8B');
  });
});
