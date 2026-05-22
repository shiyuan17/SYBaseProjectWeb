import { describe, expect, it } from 'vitest';

import { M4_PERMISSION_CODES } from '#/modules/doctor-workflow/constants';

import doctorWorkflowRoutes from './doctor-workflow';

describe('doctor workflow routes', () => {
  it('registers M4 doctor workflow routes with permission authorities', () => {
    const workflowRoot = doctorWorkflowRoutes.find(
      (route) => route.name === 'DoctorWorkflowRoot',
    );
    const assignmentRoute = workflowRoot?.children?.find(
      (route) => route.name === 'DiagnosisAssignment',
    );
    const workbenchRoute = workflowRoot?.children?.find(
      (route) => route.name === 'DiagnosisWorkbench',
    );
    const reportRoute = workflowRoot?.children?.find(
      (route) => route.name === 'PathologyReport',
    );
    const trackingRoute = workflowRoot?.children?.find(
      (route) => route.name === 'ReportTracking',
    );
    const revisionRoute = workflowRoot?.children?.find(
      (route) => route.name === 'ReportRevision',
    );
    const consultationRoute = workflowRoot?.children?.find(
      (route) => route.name === 'Consultation',
    );

    expect(workflowRoot?.path).toBe('/doctor-workflow');
    expect(workflowRoot?.redirect).toBe('/doctor-workflow/entry');
    expect(assignmentRoute?.path).toBe('/doctor-workflow/assignment');
    expect(workbenchRoute?.path).toBe('/doctor-workflow/workbench');
    expect(reportRoute?.path).toBe('/doctor-workflow/report');
    expect(trackingRoute?.path).toBe('/doctor-workflow/tracking');
    expect(revisionRoute?.path).toBe('/doctor-workflow/revision');
    expect(consultationRoute?.path).toBe('/doctor-workflow/consultation');
    expect(assignmentRoute?.meta?.authority).toEqual([
      M4_PERMISSION_CODES.DIAG_TASK_QUERY,
    ]);
    expect(workbenchRoute?.meta?.authority).toEqual([
      M4_PERMISSION_CODES.WORKBENCH_QUERY,
    ]);
    expect(reportRoute?.meta?.authority).toEqual([
      M4_PERMISSION_CODES.REPORT_CREATE,
    ]);
    expect(trackingRoute?.meta?.authority).toEqual([
      M4_PERMISSION_CODES.REPORT_TRACKING_QUERY,
    ]);
    expect(revisionRoute?.meta?.authority).toEqual([
      M4_PERMISSION_CODES.REVISION_REQUEST_CREATE,
    ]);
    expect(consultationRoute?.meta?.authority).toEqual([
      M4_PERMISSION_CODES.CONSULTATION_CREATE,
    ]);
  });
});
