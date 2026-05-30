import type {
  ArchiveCabinetView,
  ArchivePositionView,
} from '../types/operation-support';

import { describe, expect, it } from 'vitest';

import {
  buildArchivePositionRows,
  buildPositionCode,
  getArchiveStatusTagType,
  getCabinetStatusTagType,
  getLoanStatusTagType,
  getPositionStatusTagType,
  getToggleCabinetActionLabel,
  summarizeArchivePositions,
} from './archive-workbench';

function createCabinet(
  overrides: Partial<ArchiveCabinetView> = {},
): ArchiveCabinetView {
  return {
    cabinetCode: 'CAB-01',
    cabinetName: '一号柜',
    cabinetStatus: 'ACTIVE',
    cabinetType: 'STANDARD',
    capacity: 4,
    id: 'CABINET-1',
    layerCount: 2,
    slotCountPerLayer: 2,
    ...overrides,
  };
}

function createPosition(
  overrides: Partial<ArchivePositionView> = {},
): ArchivePositionView {
  return {
    cabinetId: 'CABINET-1',
    id: 'POSITION-1',
    layerNo: 1,
    positionCode: 'CAB-01-L1-S1',
    positionStatus: 'AVAILABLE',
    slotNo: 1,
    ...overrides,
  };
}

describe('archive workbench helpers', () => {
  it('builds archive position codes consistently', () => {
    expect(buildPositionCode('CAB-01', 2, 8)).toBe('CAB-01-L2-S8');
  });

  it('expands cabinet capacity into selectable and occupied position rows', () => {
    const rows = buildArchivePositionRows(
      [createCabinet()],
      [createPosition()],
    );

    expect(rows).toHaveLength(4);
    expect(rows[0]).toEqual(
      expect.objectContaining({
        positionCode: 'CAB-01-L1-S1',
        positionStatus: 'AVAILABLE',
        selectable: true,
      }),
    );
    expect(rows[1]).toEqual(
      expect.objectContaining({
        positionCode: 'CAB-01-L1-S2',
        positionStatus: 'OCCUPIED',
        selectable: false,
      }),
    );
    expect(summarizeArchivePositions(rows)).toEqual({
      available: 1,
      disabled: 0,
      occupied: 3,
      total: 4,
    });
  });

  it('marks all rows disabled when the cabinet is disabled', () => {
    const rows = buildArchivePositionRows(
      [createCabinet({ cabinetStatus: 'DISABLED' })],
      [createPosition()],
    );

    expect(summarizeArchivePositions(rows)).toEqual({
      available: 0,
      disabled: 4,
      occupied: 0,
      total: 4,
    });
    expect(rows.every((row) => !row.selectable)).toBe(true);
  });

  it('keeps Element Plus tag type mapping stable', () => {
    expect(getCabinetStatusTagType('ACTIVE')).toBe('success');
    expect(getCabinetStatusTagType('DISABLED')).toBe('info');
    expect(getPositionStatusTagType('OCCUPIED')).toBe('warning');
    expect(getArchiveStatusTagType('BORROWED')).toBe('warning');
    expect(getLoanStatusTagType('RETURNED')).toBe('success');
    expect(getToggleCabinetActionLabel('DISABLED')).toBe('启用');
    expect(getToggleCabinetActionLabel('ACTIVE')).toBe('停用');
  });
});
