import { describe, expect, it } from 'vitest';

import { M2_PERMISSION_CODES } from '#/modules/specimen-workflow/constants';

import workflowRoutes from './workflow';

describe('workflow routes', () => {
  it('registers the consolidated M2 workflow routes with hidden legacy redirects', () => {
    const workflowRoot = workflowRoutes.find((route) => route.name === 'WorkflowRoot');
    const submissionRoute = workflowRoot?.children?.find(
      (route) => route.name === 'SubmissionRegistration',
    );
    const fixationTransportRoute = workflowRoot?.children?.find(
      (route) => route.name === 'FixationTransport',
    );
    const receiptRoute = workflowRoot?.children?.find(
      (route) => route.name === 'PathologyReceipt',
    );
    const trackingRoute = workflowRoot?.children?.find(
      (route) => route.name === 'TrackingException',
    );
    const trackingQueryRoute = workflowRoot?.children?.find(
      (route) => route.name === 'TrackingQuery',
    );
    const compatibilityRoute = workflowRoot?.children?.find(
      (route) => route.name === 'ClinicalRegister',
    );
    const visibleRoutes = workflowRoot?.children?.filter(
      (route) => !route.meta?.hideInMenu && route.name !== 'WorkflowEntry',
    );

    expect(workflowRoot?.path).toBe('/workflow');
    expect(visibleRoutes?.map((route) => route.name)).toEqual([
      'SubmissionRegistration',
      'FixationTransport',
      'PathologyReceipt',
      'TrackingException',
    ]);
    expect(submissionRoute?.path).toBe('/workflow/submission-registration');
    expect(submissionRoute?.meta?.title).toBe('申请与登记');
    expect(submissionRoute?.meta?.authority).toEqual([
      M2_PERMISSION_CODES.APPLICATION_DETAIL_QUERY,
      M2_PERMISSION_CODES.APPLICATION_CREATE,
      M2_PERMISSION_CODES.CLINICAL_IMPORT,
      M2_PERMISSION_CODES.SPECIMEN_REGISTER,
    ]);
    expect(fixationTransportRoute?.path).toBe('/workflow/fixation-transport');
    expect(fixationTransportRoute?.meta?.authority).toEqual([
      M2_PERMISSION_CODES.FIXATION_VERIFY,
      M2_PERMISSION_CODES.TRANSPORT_HANDOVER,
    ]);
    expect(compatibilityRoute?.path).toBe('/workflow/clinical-register');
    expect(compatibilityRoute?.meta?.title).toBe('送检登记兼容页');
    expect(compatibilityRoute?.meta?.hideInMenu).toBe(true);
    expect(receiptRoute?.path).toBe('/workflow/pathology-receipt');
    expect(receiptRoute?.meta?.authority).toEqual([
      M2_PERMISSION_CODES.SPECIMEN_RECEIVE,
    ]);
    expect(trackingRoute?.path).toBe('/workflow/tracking-exception');
    expect(trackingRoute?.meta?.authority).toEqual([
      M2_PERMISSION_CODES.SPECIMEN_TRACKING_QUERY,
    ]);
    expect(trackingQueryRoute?.path).toBe('/workflow/tracking-query');
    expect(trackingQueryRoute?.meta?.title).toBe('追踪查询');
    expect(trackingQueryRoute?.meta?.hideInMenu).toBe(true);
  });
});
