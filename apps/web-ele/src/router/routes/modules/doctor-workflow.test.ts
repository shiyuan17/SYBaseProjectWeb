import { hasAuthority } from '@vben/utils';

import { describe, expect, it } from 'vitest';

import {
  M4_CONSULTATION_PAGE_AUTHORITIES,
  M4_MEDICAL_ORDER_PAGE_AUTHORITIES,
  M4_PERMISSION_CODES,
  M4_REPORT_PAGE_AUTHORITIES,
  M4_REVISION_PAGE_AUTHORITIES,
} from '#/modules/doctor-workflow/constants';

import doctorWorkflowRoutes from './doctor-workflow';

function getDoctorWorkflowChildRouteNames(accessCodes: string[]) {
  const workflowRoot = doctorWorkflowRoutes.find(
    (route) => route.name === 'DoctorWorkflowRoot',
  );
  return (workflowRoot?.children ?? [])
    .filter((route) => hasAuthority(route, accessCodes))
    .map((route) => route.name);
}

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
    const medicalOrderRoute = workflowRoot?.children?.find(
      (route) => route.name === 'MedicalOrderWorkbench',
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
    expect(assignmentRoute?.meta?.keepAlive).toBe(true);
    expect(workbenchRoute?.path).toBe('/doctor-workflow/workbench');
    expect(workbenchRoute?.meta?.keepAlive).toBe(true);
    expect(reportRoute?.path).toBe('/doctor-workflow/report');
    expect(reportRoute?.meta?.keepAlive).toBe(true);
    expect(reportRoute?.meta?.fullPathKey).toBe(false);
    expect(trackingRoute?.path).toBe('/doctor-workflow/tracking');
    expect(trackingRoute?.meta?.keepAlive).toBe(true);
    expect(trackingRoute?.meta?.fullPathKey).toBe(false);
    expect(medicalOrderRoute?.path).toBe('/doctor-workflow/medical-orders');
    expect(medicalOrderRoute?.meta?.keepAlive).toBe(true);
    expect(medicalOrderRoute?.meta?.fullPathKey).toBe(false);
    expect(revisionRoute?.path).toBe('/doctor-workflow/revision');
    expect(revisionRoute?.meta?.keepAlive).toBe(true);
    expect(revisionRoute?.meta?.fullPathKey).toBe(false);
    expect(consultationRoute?.path).toBe('/doctor-workflow/consultation');
    expect(consultationRoute?.meta?.keepAlive).toBe(true);
    expect(consultationRoute?.meta?.fullPathKey).toBe(false);
    expect(assignmentRoute?.meta?.authority).toEqual([
      M4_PERMISSION_CODES.DIAG_TASK_QUERY,
    ]);
    expect(workbenchRoute?.meta?.authority).toEqual([
      M4_PERMISSION_CODES.WORKBENCH_QUERY,
    ]);
    expect(reportRoute?.meta?.authority).toEqual([
      ...M4_REPORT_PAGE_AUTHORITIES,
    ]);
    expect(trackingRoute?.meta?.authority).toEqual([
      M4_PERMISSION_CODES.REPORT_TRACKING_QUERY,
    ]);
    expect(medicalOrderRoute?.meta?.authority).toEqual([
      ...M4_MEDICAL_ORDER_PAGE_AUTHORITIES,
    ]);
    expect(revisionRoute?.meta?.authority).toEqual([
      ...M4_REVISION_PAGE_AUTHORITIES,
    ]);
    expect(consultationRoute?.meta?.authority).toEqual([
      ...M4_CONSULTATION_PAGE_AUTHORITIES,
    ]);
    const entryRoute = workflowRoot?.children?.find(
      (route) => route.name === 'DoctorWorkflowEntry',
    );
    expect(entryRoute?.meta?.keepAlive).toBeUndefined();
  });

  it('shows the expected M4 pages for diagnosis role permissions', () => {
    const routeNames = getDoctorWorkflowChildRouteNames([
      M4_PERMISSION_CODES.DIAG_TASK_QUERY,
      M4_PERMISSION_CODES.ACCEPT,
      M4_PERMISSION_CODES.START,
      M4_PERMISSION_CODES.WORKBENCH_QUERY,
      M4_PERMISSION_CODES.REPORT_CREATE,
      M4_PERMISSION_CODES.REPORT_SUBMIT,
      M4_PERMISSION_CODES.REVISION_REQUEST_CREATE,
      M4_PERMISSION_CODES.CONSULTATION_CREATE,
      M4_PERMISSION_CODES.CONSULTATION_COMMENT,
      M4_PERMISSION_CODES.CONSULTATION_COMPLETE,
    ]);

    expect(routeNames).toEqual(
      expect.arrayContaining([
        'DiagnosisAssignment',
        'DiagnosisWorkbench',
        'PathologyReport',
        'ReportRevision',
        'Consultation',
      ]),
    );
    expect(routeNames).not.toContain('ReportTracking');
  });

  it('shows the expected M4 pages for review role permissions', () => {
    const routeNames = getDoctorWorkflowChildRouteNames([
      M4_PERMISSION_CODES.DIAG_TASK_QUERY,
      M4_PERMISSION_CODES.WORKBENCH_QUERY,
      M4_PERMISSION_CODES.REPORT_REVIEW,
      M4_PERMISSION_CODES.CONSULTATION_COMMENT,
    ]);

    expect(routeNames).toEqual(
      expect.arrayContaining([
        'DiagnosisAssignment',
        'DiagnosisWorkbench',
        'PathologyReport',
        'Consultation',
      ]),
    );
    expect(routeNames).not.toContain('ReportRevision');
    expect(routeNames).not.toContain('ReportTracking');
  });

  it('shows the expected M4 pages for sign role permissions', () => {
    const routeNames = getDoctorWorkflowChildRouteNames([
      M4_PERMISSION_CODES.DIAG_TASK_QUERY,
      M4_PERMISSION_CODES.WORKBENCH_QUERY,
      M4_PERMISSION_CODES.REPORT_SIGN,
      M4_PERMISSION_CODES.REPORT_PUBLISH,
      M4_PERMISSION_CODES.REVISION_APPROVE,
      M4_PERMISSION_CODES.CONSULTATION_COMMENT,
    ]);

    expect(routeNames).toEqual(
      expect.arrayContaining([
        'DiagnosisAssignment',
        'DiagnosisWorkbench',
        'PathologyReport',
        'ReportRevision',
        'Consultation',
      ]),
    );
    expect(routeNames).not.toContain('ReportTracking');
  });

  it('shows medical order workstation for execution role permissions', () => {
    const routeNames = getDoctorWorkflowChildRouteNames([
      M4_PERMISSION_CODES.MEDICAL_ORDER_QUERY,
      M4_PERMISSION_CODES.MEDICAL_ORDER_ACCEPT,
      M4_PERMISSION_CODES.MEDICAL_ORDER_COMPLETE,
    ]);

    expect(routeNames).toContain('MedicalOrderWorkbench');
    expect(routeNames).not.toContain('DiagnosisAssignment');
    expect(routeNames).not.toContain('DiagnosisWorkbench');
    expect(routeNames).not.toContain('PathologyReport');
  });

  it('shows only tracking page for tracking role permissions', () => {
    const routeNames = getDoctorWorkflowChildRouteNames([
      M4_PERMISSION_CODES.REPORT_TRACKING_QUERY,
    ]);

    expect(routeNames).toContain('ReportTracking');
    expect(routeNames).not.toContain('DiagnosisAssignment');
    expect(routeNames).not.toContain('DiagnosisWorkbench');
    expect(routeNames).not.toContain('PathologyReport');
    expect(routeNames).not.toContain('ReportRevision');
    expect(routeNames).not.toContain('Consultation');
    expect(routeNames).not.toContain('MedicalOrderWorkbench');
  });
});
