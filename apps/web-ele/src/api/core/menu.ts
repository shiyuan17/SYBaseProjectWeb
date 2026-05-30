import type { RouteRecordStringComponent } from '@vben/types';

import type { MenuView } from '#/modules/system-management/types/system-management';

import { requestClient } from '#/api/request';

import {
  mapMenuViewsToRoutes,
  getBackendFirstMenuRoutes as resolveBackendFirstMenuRoutes,
} from './menu-mapper';

export { mapMenuViewsToRoutes };

export async function getAllMenusApi() {
  const menus = await requestClient.get<MenuView[]>('/v1/menus');
  return mapMenuViewsToRoutes(Array.isArray(menus) ? menus : []);
}

export async function getBackendFirstMenuRoutes(
  fetchMenuRoutes: () => Promise<
    RouteRecordStringComponent<string>[]
  > = getAllMenusApi,
) {
  return resolveBackendFirstMenuRoutes(fetchMenuRoutes);
}
