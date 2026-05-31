import type { ApplicationCreateRequest } from '../types/specimen-workflow';

import { describe, expect, it } from 'vitest';

import {
  buildCreateApplicationPayload,
  buildDuplicateCheckRequest,
  buildImportClinicalApplicationPayload,
  createApplicationCreateFormDefaults,
  createImportClinicalApplicationFormDefaults,
  resolveInitialDialogTab,
  validateDuplicateCheckInputs,
} from './application-manage-dialog';

function createFormFixture(): ApplicationCreateRequest {
  return {
    ...createApplicationCreateFormDefaults(),
    applicationDate: '2026-05-27',
    applicationType: 'ROUTINE',
    externalOrderNo: '  EXT-001  ',
    patientId: '  P-001  ',
    patientName: '  张三  ',
    sourceHospitalName: '  市医院  ',
    patientAge: ' 35 ',
    patientGender: ' M ',
    remarks: ' 备注 ',
    sourceHospitalId: ' H-1 ',
  };
}

describe('application manage dialog helpers', () => {
  it('builds defaults and initial tab', () => {
    expect(createApplicationCreateFormDefaults().applicationFormStatus).toBe(
      'PENDING',
    );
    expect(createImportClinicalApplicationFormDefaults().externalOrderNo).toBe(
      '',
    );
    expect(resolveInitialDialogTab(true, false)).toBe('create');
    expect(resolveInitialDialogTab(false, false)).toBe('import');
  });

  it('validates duplicate check inputs and builds request payloads', () => {
    const form = createFormFixture();
    expect(validateDuplicateCheckInputs(form)).toBe('');
    expect(buildDuplicateCheckRequest(form)).toEqual({
      applicationDate: '2026-05-27',
      applicationType: 'ROUTINE',
      externalOrderNo: 'EXT-001',
      patientId: 'P-001',
      patientName: '张三',
    });
  });

  it('normalizes submit payloads', () => {
    const form = createFormFixture();
    expect(buildCreateApplicationPayload(form).patientGender).toBe('M');
    expect(
      buildImportClinicalApplicationPayload({
        externalOrderNo: ' EXT-2 ',
        thirdPartySource: ' 门诊系统 ',
      }),
    ).toEqual({
      externalOrderNo: 'EXT-2',
      thirdPartySource: '门诊系统',
    });
  });
});
