import { describe, expect, it } from 'vitest';

import { M2_PERMISSION_CODES } from '#/modules/specimen-workflow/constants';

import workflowRoutes from './workflow';

describe('workflow routes', () => {
  it('registers M2 workstation routes with permission authorities', () => {
    const workflowRoot = workflowRoutes.find((route) => route.name === 'WorkflowRoot');
    const registerRoute = workflowRoot?.children?.find(
      (route) => route.name === 'ClinicalRegister',
    );
    const receiptRoute = workflowRoot?.children?.find(
      (route) => route.name === 'SpecimenReceipt',
    );

    expect(workflowRoot?.path).toBe('/workflow');
    expect(registerRoute?.meta?.authority).toEqual([
      M2_PERMISSION_CODES.SPECIMEN_REGISTER,
    ]);
    expect(receiptRoute?.meta?.authority).toEqual([
      M2_PERMISSION_CODES.SPECIMEN_RECEIVE,
    ]);
  });
});
