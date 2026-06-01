import type { OperatingBuildingOption } from '../../types/application-registration-workbench';

import { describe, expect, it } from 'vitest';

import { normalizeOperatingBuildingOptions } from './application-registration-operating-options';

function createEncodedOperatingOptions(): OperatingBuildingOption[] {
  return [
    {
      buildingId: 'B001',
      buildingName: 'B001',
      floors: 0,
      location: '',
      operatingRooms: [
        {
          buildingId: 'B001',
          cleanLevel: '',
          floor: 0,
          roomId: 'OR-102',
          roomName: 'OR-102',
          roomType: '',
        },
      ],
    },
  ];
}

describe('normalizeOperatingBuildingOptions', () => {
  it('falls back to local Chinese labels when the backend only returns codes', () => {
    const normalized = normalizeOperatingBuildingOptions(
      createEncodedOperatingOptions(),
    );

    expect(normalized[0]?.buildingName).toBe('惠侨楼');
    expect(normalized[0]?.operatingRooms[0]?.roomName).toBe('手术室 2');
  });

  it('keeps backend labels when readable names are already available', () => {
    const normalized = normalizeOperatingBuildingOptions([
      {
        buildingId: 'B010',
        buildingName: '门诊手术楼',
        floors: 6,
        location: '东区',
        operatingRooms: [
          {
            buildingId: 'B010',
            cleanLevel: '百级',
            floor: 2,
            roomId: 'OR-888',
            roomName: '特需手术室',
            roomType: '洁净手术室',
          },
        ],
      },
    ]);

    expect(normalized[0]?.buildingName).toBe('门诊手术楼');
    expect(normalized[0]?.operatingRooms[0]?.roomName).toBe('特需手术室');
  });

  it('keeps the original code when neither backend nor fallback has a Chinese label', () => {
    const normalized = normalizeOperatingBuildingOptions([
      {
        buildingId: 'B999',
        buildingName: 'B999',
        floors: 0,
        location: '',
        operatingRooms: [
          {
            buildingId: 'B999',
            cleanLevel: '',
            floor: 0,
            roomId: 'OR-999',
            roomName: 'OR-999',
            roomType: '',
          },
        ],
      },
    ]);

    expect(normalized[0]?.buildingName).toBe('B999');
    expect(normalized[0]?.operatingRooms[0]?.roomName).toBe('OR-999');
  });
});
