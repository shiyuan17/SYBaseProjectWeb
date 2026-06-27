import type {
  PathologyDashboardSnapshot,
  PathologyScreenDashboardResponse,
} from '../types/pathology-screen';

import { StorageManager } from '@vben/utils';

const STORAGE_PREFIX = 'pathology-dashboard-screen';
const STORAGE_TTL = 5 * 60 * 1000;

const storage = new StorageManager({
  prefix: STORAGE_PREFIX,
  storageType: 'sessionStorage',
});

function buildCacheKey(userId: string) {
  return `user:${userId}`;
}

export function buildPathologyDashboardSnapshotStorageKey(userId: string) {
  return `${STORAGE_PREFIX}-${buildCacheKey(userId)}`;
}

export function readPathologyDashboardSnapshot(
  userId: string,
): null | PathologyDashboardSnapshot {
  return storage.getItem<PathologyDashboardSnapshot>(buildCacheKey(userId));
}

export function removePathologyDashboardSnapshot(userId: string) {
  storage.removeItem(buildCacheKey(userId));
}

export function writePathologyDashboardSnapshot(
  userId: string,
  dashboard: PathologyScreenDashboardResponse,
) {
  storage.setItem<PathologyDashboardSnapshot>(
    buildCacheKey(userId),
    {
      cachedAt: Date.now(),
      dashboard,
      userId,
    },
    STORAGE_TTL,
  );
}
