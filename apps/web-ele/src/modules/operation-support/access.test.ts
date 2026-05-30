import { describe, expect, it } from 'vitest';

import {
  canViewArchivePage,
  getEquipmentLedgerCapabilities,
  getOperationSupportEntryPath,
  getReagentLedgerCapabilities,
} from './access';
import { M5_PERMISSION_CODES } from './constants';

describe('operation support access helpers', () => {
  it('routes archive-only users to archive entry and denies reagent equipment workstations', () => {
    const archiveCodes = [
      M5_PERMISSION_CODES.ARCHIVE_CABINET_QUERY,
      M5_PERMISSION_CODES.APPLICATION_FORM_ARCHIVE,
      M5_PERMISSION_CODES.ARCHIVE_QUERY,
    ];

    expect(getOperationSupportEntryPath(archiveCodes)).toBe(
      '/operation-support/archive',
    );
    expect(canViewArchivePage(archiveCodes)).toBe(true);

    const reagentCapabilities = getReagentLedgerCapabilities(archiveCodes);
    expect(reagentCapabilities.canViewPage).toBe(false);
    expect(reagentCapabilities.canCreateReagent).toBe(false);
    expect(reagentCapabilities.canManageStocks).toBe(false);

    const equipmentCapabilities = getEquipmentLedgerCapabilities(archiveCodes);
    expect(equipmentCapabilities.canViewPage).toBe(false);
    expect(equipmentCapabilities.canCreateEquipment).toBe(false);
    expect(equipmentCapabilities.canCreateMaintenanceLog).toBe(false);
  });

  it('grants reagent and equipment maintenance capabilities to reagent device manager permissions', () => {
    const reagentDeviceCodes = [
      M5_PERMISSION_CODES.REAGENT_QUERY,
      M5_PERMISSION_CODES.REAGENT_CREATE,
      M5_PERMISSION_CODES.REAGENT_UPDATE,
      M5_PERMISSION_CODES.REAGENT_STOCK_QUERY,
      M5_PERMISSION_CODES.REAGENT_STOCK_UPDATE,
      M5_PERMISSION_CODES.REAGENT_WARNING_QUERY,
      M5_PERMISSION_CODES.EQUIPMENT_QUERY,
      M5_PERMISSION_CODES.EQUIPMENT_CREATE,
      M5_PERMISSION_CODES.EQUIPMENT_UPDATE,
      M5_PERMISSION_CODES.EQUIPMENT_MAINTENANCE_CREATE,
      M5_PERMISSION_CODES.EQUIPMENT_WARNING_QUERY,
    ];

    expect(getOperationSupportEntryPath(reagentDeviceCodes)).toBe(
      '/operation-support/reagents',
    );

    const reagentCapabilities =
      getReagentLedgerCapabilities(reagentDeviceCodes);
    expect(reagentCapabilities.canViewPage).toBe(true);
    expect(reagentCapabilities.canCreateReagent).toBe(true);
    expect(reagentCapabilities.canUpdateReagent).toBe(true);
    expect(reagentCapabilities.canManageStocks).toBe(true);
    expect(reagentCapabilities.canQueryWarnings).toBe(true);

    const equipmentCapabilities =
      getEquipmentLedgerCapabilities(reagentDeviceCodes);
    expect(equipmentCapabilities.canViewPage).toBe(true);
    expect(equipmentCapabilities.canCreateEquipment).toBe(true);
    expect(equipmentCapabilities.canUpdateEquipment).toBe(true);
    expect(equipmentCapabilities.canCreateMaintenanceLog).toBe(true);
    expect(equipmentCapabilities.canQueryWarnings).toBe(true);
  });

  it('allows warning-only entry into the matching workstation', () => {
    expect(
      getOperationSupportEntryPath([M5_PERMISSION_CODES.REAGENT_WARNING_QUERY]),
    ).toBe('/operation-support/reagents');
    expect(
      getReagentLedgerCapabilities([M5_PERMISSION_CODES.REAGENT_WARNING_QUERY])
        .canViewPage,
    ).toBe(true);

    expect(
      getOperationSupportEntryPath([
        M5_PERMISSION_CODES.EQUIPMENT_WARNING_QUERY,
      ]),
    ).toBe('/operation-support/equipment');
    expect(
      getEquipmentLedgerCapabilities([
        M5_PERMISSION_CODES.EQUIPMENT_WARNING_QUERY,
      ]).canViewPage,
    ).toBe(true);
  });
});
