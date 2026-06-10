import { describe, expect, it } from 'vitest';

import {
  M5_ARCHIVE_PAGE_AUTHORITIES,
  M5_BORROW_PAGE_AUTHORITIES,
  M5_EQUIPMENT_PAGE_AUTHORITIES,
  M5_OPERATION_SUPPORT_AUTHORITIES,
  M5_PERMISSION_CODES,
  M5_REAGENT_PAGE_AUTHORITIES,
  M5_RESOURCE_PAGE_AUTHORITIES,
} from '#/modules/operation-support/constants';

import operationSupportRoutes from './operation-support';

describe('operation support routes', () => {
  it('registers archive and borrow routes with split authorities', () => {
    const operationRoot = operationSupportRoutes.find(
      (route) => route.name === 'OperationSupportRoot',
    );
    const entryRoute = operationRoot?.children?.find(
      (route) => route.name === 'OperationSupportEntry',
    );
    const archiveRoute = operationRoot?.children?.find(
      (route) => route.name === 'ArchiveManagement',
    );
    const borrowRoute = operationRoot?.children?.find(
      (route) => route.name === 'BorrowManagement',
    );

    expect(operationRoot?.path).toBe('/operation-support');
    expect(operationRoot?.redirect).toBe('/operation-support/entry');
    expect(entryRoute?.path).toBe('/operation-support/entry');
    expect(entryRoute?.meta?.keepAlive).toBeUndefined();
    expect(archiveRoute?.path).toBe('/operation-support/archive');
    expect(archiveRoute?.meta?.keepAlive).toBe(true);
    expect(borrowRoute?.path).toBe('/operation-support/borrow');
    expect(borrowRoute?.meta?.keepAlive).toBe(true);
    expect(operationRoot?.meta?.authority).toEqual([
      ...M5_OPERATION_SUPPORT_AUTHORITIES,
    ]);
    expect(archiveRoute?.meta?.authority).toEqual([
      ...M5_ARCHIVE_PAGE_AUTHORITIES,
    ]);
    expect(borrowRoute?.meta?.authority).toEqual([
      ...M5_BORROW_PAGE_AUTHORITIES,
    ]);
  });

  it('registers equipment and reagent routes under device resource menu', () => {
    const resourceRoot = operationSupportRoutes.find(
      (route) => route.name === 'OperationResourceRoot',
    );
    const entryRoute = resourceRoot?.children?.find(
      (route) => route.name === 'OperationResourceEntry',
    );
    const equipmentRoute = resourceRoot?.children?.find(
      (route) => route.name === 'EquipmentManagement',
    );
    const reagentRoute = resourceRoot?.children?.find(
      (route) => route.name === 'ReagentConsumableManagement',
    );
    const hazardousRoute = resourceRoot?.children?.find(
      (route) => route.name === 'HazardousChemicalsManagement',
    );
    const wasteRoute = resourceRoot?.children?.find(
      (route) => route.name === 'MedicalWasteManagement',
    );

    expect(resourceRoot?.path).toBe('/operation-resources');
    expect(resourceRoot?.redirect).toBe('/operation-resources/entry');
    expect(entryRoute?.path).toBe('/operation-resources/entry');
    expect(entryRoute?.meta?.keepAlive).toBeUndefined();
    expect(equipmentRoute?.path).toBe('/operation-resources/equipment');
    expect(equipmentRoute?.meta?.keepAlive).toBe(true);
    expect(reagentRoute?.path).toBe('/operation-resources/reagents');
    expect(reagentRoute?.meta?.keepAlive).toBe(true);
    expect(hazardousRoute?.path).toBe(
      '/operation-resources/hazardous-chemicals',
    );
    expect(hazardousRoute?.meta?.keepAlive).toBe(true);
    expect(wasteRoute?.path).toBe('/operation-resources/medical-waste');
    expect(wasteRoute?.meta?.keepAlive).toBe(true);
    expect(reagentRoute?.meta?.authority).toEqual([
      ...M5_REAGENT_PAGE_AUTHORITIES,
    ]);
    expect(equipmentRoute?.meta?.authority).toEqual([
      ...M5_EQUIPMENT_PAGE_AUTHORITIES,
    ]);
    expect(hazardousRoute?.meta?.authority).toEqual([
      ...M5_RESOURCE_PAGE_AUTHORITIES,
    ]);
    expect(wasteRoute?.meta?.authority).toEqual([
      ...M5_RESOURCE_PAGE_AUTHORITIES,
    ]);
    expect(resourceRoot?.meta?.authority).toContain(
      M5_PERMISSION_CODES.REAGENT_WARNING_QUERY,
    );
    expect(resourceRoot?.meta?.authority).toContain(
      M5_PERMISSION_CODES.EQUIPMENT_MAINTENANCE_CREATE,
    );
  });
});
