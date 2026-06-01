import type { OperatingBuildingOption } from '../types/application-registration-workbench';

import { describe, expect, it } from 'vitest';

import {
  buildOperatingRoomNameMap,
  normalizeOperatingRoomDisplayValue,
  resolveOperatingRoomDisplayName,
} from './operating-room-display';

const buildingOptionsFixture: OperatingBuildingOption[] = [
  {
    buildingId: 'B001',
    buildingName: '惠侨楼',
    floors: 12,
    location: '北区',
    operatingRooms: [
      {
        buildingId: 'B001',
        cleanLevel: '百级',
        floor: 3,
        roomId: 'OR-101',
        roomName: '手术室 1',
        roomType: '洁净手术室',
      },
      {
        buildingId: 'B001',
        cleanLevel: '百级',
        floor: 3,
        roomId: 'OR-102',
        roomName: '手术室 2',
        roomType: '洁净手术室',
      },
    ],
  },
];

describe('operating room display helpers', () => {
  it('builds a room id to room name map', () => {
    const roomNameById = buildOperatingRoomNameMap(buildingOptionsFixture);

    expect(roomNameById.get('OR-101')).toBe('惠侨楼 - 手术室 1');
    expect(roomNameById.get('OR-102')).toBe('惠侨楼 - 手术室 2');
    expect(roomNameById.get('手术室 2')).toBe('惠侨楼 - 手术室 2');
  });

  it('resolves room ids to Chinese room names and falls back safely', () => {
    const roomNameById = buildOperatingRoomNameMap(buildingOptionsFixture);

    expect(
      resolveOperatingRoomDisplayName(
        roomNameById,
        'OR-102',
        '右侧胫骨感染病灶清创术',
      ),
    ).toBe('惠侨楼 - 手术室 2');
    expect(
      resolveOperatingRoomDisplayName(
        roomNameById,
        'OR-999',
        '右侧胫骨感染病灶清创术',
      ),
    ).toBe('OR-999');
    expect(
      resolveOperatingRoomDisplayName(
        roomNameById,
        '',
        '右侧胫骨感染病灶清创术',
      ),
    ).toBe('右侧胫骨感染病灶清创术');
  });

  it('normalizes raw display values from downstream lists', () => {
    const roomNameById = buildOperatingRoomNameMap(buildingOptionsFixture);

    expect(normalizeOperatingRoomDisplayValue(roomNameById, 'OR-102')).toBe(
      '惠侨楼 - 手术室 2',
    );
    expect(normalizeOperatingRoomDisplayValue(roomNameById, '手术室 2')).toBe(
      '惠侨楼 - 手术室 2',
    );
    expect(normalizeOperatingRoomDisplayValue(roomNameById, 'OR-999')).toBe(
      'OR-999',
    );
  });
});
