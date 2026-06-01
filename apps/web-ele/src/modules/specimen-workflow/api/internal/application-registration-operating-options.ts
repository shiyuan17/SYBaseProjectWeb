import type {
  OperatingBuildingOption,
  OperatingRoomOption,
} from '../../types/application-registration-workbench';

import operatingOptionsFallbackRaw from '../../../../../../../mock_data/sss.json';

type OperatingOptionsFallbackRoom = Pick<
  OperatingRoomOption,
  'roomId' | 'roomName'
>;

type OperatingOptionsFallbackBuilding = Pick<
  OperatingBuildingOption,
  'buildingId' | 'buildingName'
> & {
  operatingRooms: OperatingOptionsFallbackRoom[];
};

const operatingOptionsFallback =
  operatingOptionsFallbackRaw as OperatingOptionsFallbackBuilding[];

const fallbackBuildingNameById = new Map(
  operatingOptionsFallback.map((building) => [
    normalizeText(building.buildingId),
    normalizeText(building.buildingName),
  ]),
);

const fallbackRoomNameByKey = new Map(
  operatingOptionsFallback.flatMap((building) =>
    building.operatingRooms.map((room) => [
      buildRoomKey(building.buildingId, room.roomId),
      normalizeText(room.roomName),
    ]),
  ),
);

const fallbackRoomNameById = new Map(
  operatingOptionsFallback.flatMap((building) =>
    building.operatingRooms.map((room) => [
      normalizeText(room.roomId),
      normalizeText(room.roomName),
    ]),
  ),
);

function normalizeText(value?: null | string) {
  return value?.trim() ?? '';
}

function buildRoomKey(buildingId?: null | string, roomId?: null | string) {
  return `${normalizeText(buildingId)}::${normalizeText(roomId)}`;
}

function resolveDisplayName(
  currentLabel: string,
  code: string,
  fallbackLabel: string,
) {
  if (currentLabel && currentLabel !== code) {
    return currentLabel;
  }
  if (fallbackLabel) {
    return fallbackLabel;
  }
  return currentLabel || code;
}

function resolveRoomFallbackName(buildingId: string, roomId: string) {
  return (
    fallbackRoomNameByKey.get(buildRoomKey(buildingId, roomId)) ??
    fallbackRoomNameById.get(roomId) ??
    ''
  );
}

export function normalizeOperatingBuildingOptions(
  buildingOptions: OperatingBuildingOption[],
) {
  return buildingOptions.map((building) => {
    const buildingId = normalizeText(building.buildingId);
    const buildingName = resolveDisplayName(
      normalizeText(building.buildingName),
      buildingId,
      fallbackBuildingNameById.get(buildingId) ?? '',
    );

    return {
      ...building,
      buildingName,
      operatingRooms: building.operatingRooms.map((room) => {
        const roomId = normalizeText(room.roomId);

        return {
          ...room,
          roomName: resolveDisplayName(
            normalizeText(room.roomName),
            roomId,
            resolveRoomFallbackName(buildingId, roomId),
          ),
        };
      }),
    };
  });
}
