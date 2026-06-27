import type { RouteRecordRaw } from 'vue-router';

import { describe, expect, it, vi } from 'vitest';

import { M2_PERMISSION_CODES } from '#/modules/specimen-workflow/constants';

const { withRouteComponentReloadRetryMock } = vi.hoisted(() => ({
  withRouteComponentReloadRetryMock: vi.fn((loader) => loader),
}));

vi.mock('#/router/routes/lazy-load', () => ({
  withRouteComponentReloadRetry: withRouteComponentReloadRetryMock,
}));

import technicalWorkflowRoutes from './technical-workflow';
import workflowRoutes from './workflow';

function collectRoutes(routes: RouteRecordRaw[]): RouteRecordRaw[] {
  return routes.flatMap((route) => [
    route,
    ...collectRoutes(route.children ?? []),
  ]);
}

describe('workflow routes', () => {
  it('registers the consolidated M2 workflow routes with hidden legacy redirects', () => {
    const workflowRoot = workflowRoutes.find(
      (route) => route.name === 'WorkflowRoot',
    );
    const submissionRoute = workflowRoot?.children?.find(
      (route) => route.name === 'SubmissionRegistration',
    );
    const workbenchRoute = workflowRoot?.children?.find(
      (route) => route.name === 'ApplicationRegistrationWorkbench',
    );
    const fixationTransportRoute = workflowRoot?.children?.find(
      (route) => route.name === 'FixationTransport',
    );
    const trackingRoute = workflowRoot?.children?.find(
      (route) => route.name === 'TrackingException',
    );
    const receiptRoute = workflowRoot?.children?.find(
      (route) => route.name === 'PathologyReceipt',
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
      'ApplicationRegistrationWorkbench',
      'FixationTransport',
      'TrackingException',
    ]);
    expect(submissionRoute?.path).toBe('/workflow/submission-registration');
    expect(submissionRoute?.meta?.title).toBe('申请与登记');
    expect(submissionRoute?.meta?.hideInMenu).toBe(true);
    expect(submissionRoute?.meta?.keepAlive).toBe(true);
    expect(submissionRoute?.meta?.authority).toEqual([
      M2_PERMISSION_CODES.APPLICATION_DETAIL_QUERY,
      M2_PERMISSION_CODES.APPLICATION_CREATE,
      M2_PERMISSION_CODES.CLINICAL_IMPORT,
      M2_PERMISSION_CODES.SPECIMEN_REGISTER,
    ]);
    expect(workbenchRoute?.path).toBe(
      '/workflow/application-registration-workbench',
    );
    expect(workbenchRoute?.meta?.title).toBe('标本采集');
    expect(workbenchRoute?.meta?.keepAlive).toBe(true);
    expect(workbenchRoute?.meta?.authority).toEqual([
      M2_PERMISSION_CODES.APPLICATION_DETAIL_QUERY,
      M2_PERMISSION_CODES.APPLICATION_CREATE,
      M2_PERMISSION_CODES.CLINICAL_IMPORT,
      M2_PERMISSION_CODES.SPECIMEN_REGISTER,
    ]);
    expect(fixationTransportRoute?.path).toBe('/workflow/fixation-transport');
    expect(fixationTransportRoute?.meta?.keepAlive).toBe(true);
    expect(fixationTransportRoute?.meta?.authority).toEqual([
      M2_PERMISSION_CODES.FIXATION_VERIFY,
      M2_PERMISSION_CODES.TRANSPORT_HANDOVER,
    ]);
    expect(receiptRoute?.path).toBe('/workflow/pathology-receipt');
    expect(receiptRoute?.meta?.hideInMenu).toBe(true);
    expect(receiptRoute?.meta?.keepAlive).toBe(true);
    expect(receiptRoute?.meta?.authority).toEqual([
      M2_PERMISSION_CODES.SPECIMEN_RECEIVE,
    ]);
    expect(
      workflowRoot?.children?.some(
        (route) => route.name === 'TechnicalWorkflowReceipt',
      ),
    ).toBe(false);
    expect(compatibilityRoute?.path).toBe('/workflow/clinical-register');
    expect(compatibilityRoute?.meta?.title).toBe('送检登记兼容页');
    expect(compatibilityRoute?.meta?.hideInMenu).toBe(true);
    expect(compatibilityRoute?.meta?.keepAlive).toBeUndefined();
    expect(trackingRoute?.path).toBe('/workflow/tracking-exception');
    expect(trackingRoute?.meta?.keepAlive).toBe(true);
    expect(trackingRoute?.meta?.authority).toEqual([
      M2_PERMISSION_CODES.SPECIMEN_TRACKING_QUERY,
    ]);
    expect(trackingQueryRoute?.path).toBe('/workflow/tracking-query');
    expect(trackingQueryRoute?.meta?.title).toBe('追踪查询');
    expect(trackingQueryRoute?.meta?.hideInMenu).toBe(true);
    expect(trackingQueryRoute?.meta?.keepAlive).toBeUndefined();
  });

  it('keeps route names and component page paths unique across M2 and M3 modules', () => {
    const routes = collectRoutes([
      ...workflowRoutes,
      ...technicalWorkflowRoutes,
    ]);
    const namedRoutes = routes.filter((route) => route.name);
    const componentPageRoutes = routes.filter(
      (route) => route.component && !route.redirect,
    );

    expect(namedRoutes.map((route) => route.name)).toHaveLength(
      new Set(namedRoutes.map((route) => route.name)).size,
    );
    expect(componentPageRoutes.map((route) => route.path)).toHaveLength(
      new Set(componentPageRoutes.map((route) => route.path)).size,
    );
  });

  it('wraps high-frequency M2 workflow pages with route reload retry', () => {
    for (const routeName of [
      'WorkflowEntry',
      'SubmissionRegistration',
      'ApplicationRegistrationWorkbench',
      'FixationTransport',
      'PathologyReceipt',
      'TrackingException',
    ]) {
      expect(withRouteComponentReloadRetryMock).toHaveBeenCalledWith(
        expect.any(Function),
        routeName,
      );
    }
  });
});
