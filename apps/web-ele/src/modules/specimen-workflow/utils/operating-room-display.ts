import type { OperatingBuildingOption } from '../types/application-registration-workbench';

import { listOperatingBuildingOptions } from '../api/application-registration-workbench-service';

function normalizeText(value?: null | string) {
  return value?.trim() ?? '';
}

let operatingRoomNameMapPromise: null | Promise<ReadonlyMap<string, string>> =
  null;

export function buildOperatingRoomNameMap(
  buildingOptions: OperatingBuildingOption[],
) {
  const roomNameById = new Map<string, string>();

  for (const building of buildingOptions) {
    for (const room of building.operatingRooms) {
      const roomId = normalizeText(room.roomId);
      const roomName = normalizeText(room.roomName);
      if (!roomId || !roomName || roomNameById.has(roomId)) {
        continue;
      }
      roomNameById.set(roomId, roomName);
    }
  }

  return roomNameById;
}

export async function loadOperatingRoomNameMap() {
  if (!operatingRoomNameMapPromise) {
    operatingRoomNameMapPromise = listOperatingBuildingOptions()
      .then((buildingOptions) => buildOperatingRoomNameMap(buildingOptions))
      .catch((error) => {
        operatingRoomNameMapPromise = null;
        throw error;
      });
  }

  return operatingRoomNameMapPromise;
}

export async function loadOperatingRoomNameMapSafely() {
  try {
    return await loadOperatingRoomNameMap();
  } catch {
    return new Map<string, string>();
  }
}

export function resolveOperatingRoomDisplayName(
  roomNameById: ReadonlyMap<string, string>,
  roomId?: null | string,
  fallbackValue?: null | string,
) {
  const normalizedRoomId = normalizeText(roomId);
  if (normalizedRoomId) {
    return roomNameById.get(normalizedRoomId) ?? normalizedRoomId;
  }

  return normalizeText(fallbackValue);
}

export function normalizeOperatingRoomDisplayValue(
  roomNameById: ReadonlyMap<string, string>,
  value?: null | string,
) {
  const normalizedValue = normalizeText(value);
  if (!normalizedValue) {
    return '';
  }

  return roomNameById.get(normalizedValue) ?? normalizedValue;
}
