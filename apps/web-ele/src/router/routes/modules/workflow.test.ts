import { describe, expect, it } from 'vitest';

import { M2_PERMISSION_CODES } from '#/modules/specimen-workflow/constants';

import workflowRoutes from './workflow';

describe('workflow routes', () => {
  it('registers M2 workstation routes with permission authorities', () => {
    const workflowRoot = workflowRoutes.find((route) => route.name === 'WorkflowRoot');
    const listRoute = workflowRoot?.children?.find(
      (route) => route.name === 'ApplicationList',
    );
    const specimenManagementRoute = workflowRoot?.children?.find(
      (route) => route.name === 'SpecimenManagement',
    );
    const compatibilityRoute = workflowRoot?.children?.find(
      (route) => route.name === 'ClinicalRegister',
    );
    const receiptRoute = workflowRoot?.children?.find(
      (route) => route.name === 'SpecimenReceipt',
    );

    expect(workflowRoot?.path).toBe('/workflow');
    expect(listRoute?.meta?.authority).toEqual([
      M2_PERMISSION_CODES.APPLICATION_DETAIL_QUERY,
      M2_PERMISSION_CODES.APPLICATION_CREATE,
      M2_PERMISSION_CODES.CLINICAL_IMPORT,
    ]);
    expect(specimenManagementRoute?.meta?.authority).toEqual([
      M2_PERMISSION_CODES.SPECIMEN_REGISTER,
    ]);
    expect(specimenManagementRoute?.path).toBe('/workflow/specimen-management');
    expect(compatibilityRoute?.path).toBe('/workflow/clinical-register');
    expect(receiptRoute?.meta?.authority).toEqual([
      M2_PERMISSION_CODES.SPECIMEN_RECEIVE,
    ]);
  });
});
