import { describe, expect, it } from 'vitest';

import { M2_PERMISSION_CODES } from '#/modules/specimen-workflow/constants';
import { M3_PERMISSION_CODES } from '#/modules/technical-workflow/constants';

import technicalWorkflowRoutes from './technical-workflow';

describe('technical workflow routes', () => {
  it('registers M3 workstation routes with permission authorities', () => {
    const workflowRoot = technicalWorkflowRoutes.find(
      (route) => route.name === 'TechnicalWorkflowRoot',
    );
    const tasksRoute = workflowRoot?.children?.find(
      (route) => route.name === 'TechnicalTasks',
    );
    const receiptRoute = workflowRoot?.children?.find(
      (route) => route.name === 'PathologyReceipt',
    );
    const frozenRoute = workflowRoot?.children?.find(
      (route) => route.name === 'FrozenWorkstation',
    );
    const grossingRoute = workflowRoot?.children?.find(
      (route) => route.name === 'GrossingWorkstation',
    );

    expect(workflowRoot?.path).toBe('/technical-workflow');
    expect(workflowRoot?.meta?.authority).toContain(
      M2_PERMISSION_CODES.SPECIMEN_RECEIVE,
    );
    expect(receiptRoute?.path).toBe('/workflow/pathology-receipt');
    expect(receiptRoute?.meta?.authority).toEqual([
      M2_PERMISSION_CODES.SPECIMEN_RECEIVE,
    ]);
    expect(tasksRoute?.meta?.authority).toEqual([
      M3_PERMISSION_CODES.TECHNICAL_TASK_QUERY,
    ]);
    expect(frozenRoute?.path).toBe('/technical-workflow/frozen');
    expect(frozenRoute?.meta?.authority).toEqual([
      M3_PERMISSION_CODES.TECHNICAL_TASK_QUERY,
    ]);
    expect(grossingRoute?.meta?.authority).toEqual([
      M3_PERMISSION_CODES.GROSSING,
    ]);
  });
});
