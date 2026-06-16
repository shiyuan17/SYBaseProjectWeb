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
    const specimenRegistrationRoute = workflowRoot?.children?.find(
      (route) => route.name === 'TechnicalSpecimenRegistration',
    );
    const frozenRoute = workflowRoot?.children?.find(
      (route) => route.name === 'FrozenWorkstation',
    );
    const grossingRoute = workflowRoot?.children?.find(
      (route) => route.name === 'GrossingWorkstation',
    );
    const stainingRoute = workflowRoot?.children?.find(
      (route) => route.name === 'StainingWorkstation',
    );
    const routineOrderRoute = workflowRoot?.children?.find(
      (route) => route.name === 'RoutineOrderWorkstation',
    );
    const specialOrderRoute = workflowRoot?.children?.find(
      (route) => route.name === 'SpecialOrderWorkstation',
    );
    const ihcRoute = workflowRoot?.children?.find(
      (route) => route.name === 'IhcWorkstation',
    );
    const cytologyRoute = workflowRoot?.children?.find(
      (route) => route.name === 'CytologyWorkstation',
    );
    const liquidCytologyRoute = workflowRoot?.children?.find(
      (route) => route.name === 'LiquidCytologyWorkstation',
    );

    expect(workflowRoot?.path).toBe('/technical-workflow');
    expect(workflowRoot?.meta?.authority).toContain(
      M2_PERMISSION_CODES.SPECIMEN_RECEIVE,
    );
    expect(
      workflowRoot?.children?.some(
        (route) => route.name === 'PathologyReceipt',
      ),
    ).toBe(false);
    expect(specimenRegistrationRoute?.path).toBe(
      '/technical-workflow/specimen-registration',
    );
    expect(specimenRegistrationRoute?.meta?.keepAlive).toBe(true);
    expect(specimenRegistrationRoute?.meta?.title).toBe('检查登记');
    expect(specimenRegistrationRoute?.meta?.authority).toEqual([
      M2_PERMISSION_CODES.SPECIMEN_RECEIVE,
    ]);
    expect(routineOrderRoute?.path).toBe('/technical-workflow/routine-orders');
    expect(routineOrderRoute?.meta?.title).toBe('常规医嘱工作站');
    expect(routineOrderRoute?.meta?.authority).toEqual([
      M3_PERMISSION_CODES.TECHNICAL_TASK_QUERY,
    ]);
    expect(routineOrderRoute?.component?.toString()).toContain(
      'RoutineOrderWorkstationView.vue',
    );
    expect(routineOrderRoute?.component?.toString()).not.toContain(
      'TechnicalWorkflowPlaceholderView.vue',
    );
    expect(specialOrderRoute?.path).toBe('/technical-workflow/special-orders');
    expect(specialOrderRoute?.meta?.title).toBe('特检医嘱工作站');
    expect(specialOrderRoute?.meta?.authority).toEqual([
      M3_PERMISSION_CODES.TECHNICAL_TASK_QUERY,
    ]);
    expect(specialOrderRoute?.component?.toString()).toContain(
      'SpecialOrderWorkstationView.vue',
    );
    expect(ihcRoute?.path).toBe('/technical-workflow/ihc');
    expect(ihcRoute?.meta?.title).toBe('免疫组化工作站');
    expect(ihcRoute?.meta?.authority).toEqual([
      M3_PERMISSION_CODES.TECHNICAL_TASK_QUERY,
    ]);
    expect(ihcRoute?.component?.toString()).toContain('IhcWorkstationView.vue');
    expect(cytologyRoute?.path).toBe('/technical-workflow/cytology');
    expect(cytologyRoute?.meta?.title).toBe('细胞学工作站');
    expect(cytologyRoute?.meta?.authority).toEqual([
      M3_PERMISSION_CODES.TECHNICAL_TASK_QUERY,
    ]);
    expect(cytologyRoute?.component?.toString()).toContain(
      'CytologyWorkstationView.vue',
    );
    expect(liquidCytologyRoute?.path).toBe(
      '/technical-workflow/liquid-cytology',
    );
    expect(liquidCytologyRoute?.meta?.icon).toBe('lucide:droplets');
    expect(liquidCytologyRoute?.meta?.title).toBe('液基细胞学工作站');
    expect(liquidCytologyRoute?.meta?.authority).toEqual([
      M3_PERMISSION_CODES.TECHNICAL_TASK_QUERY,
    ]);
    expect(liquidCytologyRoute?.component?.toString()).toContain(
      'LiquidCytologyWorkstationView.vue',
    );
    expect(tasksRoute?.meta?.keepAlive).toBe(true);
    expect(tasksRoute?.meta?.hideInMenu).toBe(true);
    expect(tasksRoute?.meta?.authority).toEqual([
      M3_PERMISSION_CODES.TECHNICAL_TASK_QUERY,
    ]);
    expect(frozenRoute?.path).toBe('/technical-workflow/frozen');
    expect(frozenRoute?.meta?.keepAlive).toBe(true);
    expect(frozenRoute?.meta?.hideInMenu).toBe(true);
    expect(frozenRoute?.meta?.authority).toEqual([
      M3_PERMISSION_CODES.TECHNICAL_TASK_QUERY,
    ]);
    expect(grossingRoute?.meta?.keepAlive).toBe(true);
    expect(grossingRoute?.meta?.title).toBe('取材描写工作站');
    expect(grossingRoute?.meta?.authority).toEqual([
      M3_PERMISSION_CODES.GROSSING,
    ]);
    expect(stainingRoute?.meta?.title).toBe('染色出片工作站');
    expect(stainingRoute?.meta?.authority).toEqual([
      M3_PERMISSION_CODES.STAINING,
    ]);
    const routeNames = (workflowRoot?.children ?? []).map(
      (route) => route.name,
    );
    expect(routeNames.indexOf('StainingWorkstation')).toBeLessThan(
      routeNames.indexOf('RoutineOrderWorkstation'),
    );
    expect(routeNames.indexOf('RoutineOrderWorkstation')).toBeLessThan(
      routeNames.indexOf('SpecialOrderWorkstation'),
    );
    expect(routeNames.indexOf('SpecialOrderWorkstation')).toBeLessThan(
      routeNames.indexOf('IhcWorkstation'),
    );
    expect(routeNames.indexOf('IhcWorkstation')).toBeLessThan(
      routeNames.indexOf('CytologyWorkstation'),
    );
    expect(routeNames.indexOf('CytologyWorkstation')).toBeLessThan(
      routeNames.indexOf('LiquidCytologyWorkstation'),
    );
    const entryRoute = workflowRoot?.children?.find(
      (route) => route.name === 'TechnicalWorkflowEntry',
    );
    expect(entryRoute?.meta?.keepAlive).toBeUndefined();
  });
});
