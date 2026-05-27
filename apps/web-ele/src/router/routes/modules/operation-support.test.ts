import { describe, expect, it } from 'vitest';

import {
  M5_ARCHIVE_PAGE_AUTHORITIES,
  M5_EQUIPMENT_PAGE_AUTHORITIES,
  M5_PERMISSION_CODES,
  M5_REAGENT_PAGE_AUTHORITIES,
} from '#/modules/operation-support/constants';

import operationSupportRoutes from './operation-support';

describe('operation support routes', () => {
  it('registers M5 operation support routes with query authorities', () => {
    const operationRoot = operationSupportRoutes.find(
      (route) => route.name === 'OperationSupportRoot',
    );
    const entryRoute = operationRoot?.children?.find(
      (route) => route.name === 'OperationSupportEntry',
    );
    const archiveRoute = operationRoot?.children?.find(
      (route) => route.name === 'ArchiveManagement',
    );
    const reagentRoute = operationRoot?.children?.find(
      (route) => route.name === 'ReagentLedger',
    );
    const equipmentRoute = operationRoot?.children?.find(
      (route) => route.name === 'EquipmentLedger',
    );

    expect(operationRoot?.path).toBe('/operation-support');
    expect(operationRoot?.redirect).toBe('/operation-support/entry');
    expect(entryRoute?.path).toBe('/operation-support/entry');
    expect(archiveRoute?.path).toBe('/operation-support/archive');
    expect(reagentRoute?.path).toBe('/operation-support/reagents');
    expect(equipmentRoute?.path).toBe('/operation-support/equipment');
    expect(archiveRoute?.meta?.authority).toEqual([
      ...M5_ARCHIVE_PAGE_AUTHORITIES,
    ]);
    expect(reagentRoute?.meta?.authority).toEqual([
      ...M5_REAGENT_PAGE_AUTHORITIES,
    ]);
    expect(equipmentRoute?.meta?.authority).toEqual([
      ...M5_EQUIPMENT_PAGE_AUTHORITIES,
    ]);
    expect(operationRoot?.meta?.authority).toContain(
      M5_PERMISSION_CODES.REAGENT_WARNING_QUERY,
    );
    expect(operationRoot?.meta?.authority).toContain(
      M5_PERMISSION_CODES.EQUIPMENT_MAINTENANCE_CREATE,
    );
  });
});
