import type { RouteRecordStringComponent } from '@vben/types';

import type { MenuView } from '#/modules/system-management/types/system-management';

import { bodyRequestClient } from '#/api/request';

import {
  getBackendFirstMenuRoutes as resolveBackendFirstMenuRoutes,
  mapMenuViewsToRoutes,
} from './menu-mapper';

export { mapMenuViewsToRoutes };

export async function getAllMenusApi() {
  const menus = await bodyRequestClient.get<MenuView[]>('/v1/menus');
  return mapMenuViewsToRoutes(menus);
}

export async function getBackendFirstMenuRoutes(
  fetchMenuRoutes: () => Promise<RouteRecordStringComponent<string>[]> =
    getAllMenusApi,
) {
  return resolveBackendFirstMenuRoutes(fetchMenuRoutes);
}
