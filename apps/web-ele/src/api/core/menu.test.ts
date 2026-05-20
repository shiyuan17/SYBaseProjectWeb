import type { MenuView } from '#/modules/system-management/types/system-management';

import { describe, expect, it } from 'vitest';

import { M1_PERMISSION_CODES } from '#/modules/system-management/constants';
import systemRoutes from '#/router/routes/modules/system';

import { getBackendFirstMenuRoutes, mapMenuViewsToRoutes } from './menu-mapper';

describe('mapMenuViewsToRoutes', () => {
  it('converts legacy M1 menu definitions into canonical frontend routes', () => {
    const menus: MenuView[] = [
      {
        componentName: 'SystemRoot',
        enabled: true,
        icon: 'setting',
        id: 'MENU_SYSTEM',
        menuCode: 'SYSTEM',
        menuName: '系统管理',
        menuType: 'DIRECTORY',
        parentId: null,
        path: '/system',
        permissionPrefix: 'sys',
        sortOrder: 1,
        visible: true,
      },
      {
        componentName: 'SystemUsers',
        enabled: true,
        icon: 'user',
        id: 'MENU_SYS_USERS',
        menuCode: 'SYS_USERS',
        menuName: '系统用户',
        menuType: 'MENU',
        parentId: 'MENU_SYSTEM',
        path: '/api/v1/system-users',
        permissionPrefix: 'sys:user',
        sortOrder: 10,
        visible: true,
      },
      {
        componentName: 'system/medical-order-dict/index',
        enabled: true,
        icon: 'clipboard',
        id: 'MENU_SYS_ORDER_DICT',
        menuCode: 'SYS_MEDICAL_ORDER_DICT',
        menuName: '医嘱字典管理',
        menuType: 'MENU',
        parentId: 'MENU_SYSTEM',
        path: '/system/medical-order-dict',
        permissionPrefix: 'sys:medical-order-dict',
        sortOrder: 20,
        visible: true,
      },
      {
        componentName: 'system/login-log/index',
        enabled: false,
        icon: 'log',
        id: 'MENU_SYS_LOGIN_LOG',
        menuCode: 'SYS_LOGIN_LOG',
        menuName: '登录日志',
        menuType: 'MENU',
        parentId: 'MENU_SYSTEM',
        path: '/system/login-logs',
        permissionPrefix: 'sys:login-log',
        sortOrder: 30,
        visible: false,
      },
    ];

    const routes = mapMenuViewsToRoutes(menus);

    expect(routes).toHaveLength(1);
    expect(routes[0]).toMatchObject({
      component: 'BasicLayout',
      name: 'SystemRoot',
      path: '/system',
      redirect: '/system/users',
    });
    expect(routes[0]?.children).toEqual([
      expect.objectContaining({
        component: '/modules/system-management/views/SystemUsersView',
        name: 'SystemUsers',
        path: '/system/users',
      }),
      expect.objectContaining({
        component: '/modules/system-management/views/MedicalOrderDictsView',
        name: 'MedicalOrderDicts',
        path: '/system/medical-order-dicts',
      }),
    ]);
  });
});

describe('getBackendFirstMenuRoutes', () => {
  it('uses backend menu routes when they include mapped child routes', async () => {
    const backendRoutes = mapMenuViewsToRoutes([
      {
        componentName: 'SystemRoot',
        enabled: true,
        icon: 'setting',
        id: 'MENU_SYSTEM',
        menuCode: 'SYSTEM',
        menuName: '系统管理',
        menuType: 'DIRECTORY',
        parentId: null,
        path: '/system',
        permissionPrefix: 'sys',
        sortOrder: 1,
        visible: true,
      },
      {
        componentName: 'SystemUsers',
        enabled: true,
        icon: 'user',
        id: 'MENU_SYS_USERS',
        menuCode: 'SYS_USERS',
        menuName: '系统用户',
        menuType: 'MENU',
        parentId: 'MENU_SYSTEM',
        path: '/system/users',
        permissionPrefix: 'sys:user',
        sortOrder: 10,
        visible: true,
      },
    ]);

    const routes = await getBackendFirstMenuRoutes(async () => backendRoutes);

    expect(routes).toBe(backendRoutes);
    expect(routes[0]?.children).toEqual([
      expect.objectContaining({
        name: 'SystemUsers',
        path: '/system/users',
      }),
    ]);
  });

  it('falls back to static routes when backend menu routes are empty', async () => {
    const routes = await getBackendFirstMenuRoutes(async () => []);

    expect(routes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'SystemRoot',
          path: '/system',
          redirect: '/system/users',
          children: expect.arrayContaining([
            expect.objectContaining({
              name: 'SystemUsers',
              path: '/system/users',
            }),
          ]),
        }),
      ]),
    );
  });

  it('falls back to static routes when backend menu loading fails', async () => {
    const routes = await getBackendFirstMenuRoutes(async () => {
      throw new Error('menu api unavailable');
    });

    expect(routes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'SystemRoot',
          children: expect.arrayContaining([
            expect.objectContaining({
              component: '/modules/system-management/views/SystemUsersView',
              name: 'SystemUsers',
              path: '/system/users',
            }),
          ]),
        }),
      ]),
    );
  });
});

describe('system management route access', () => {
  it('keeps page routes registered with query permission authorities', () => {
    const systemRoot = systemRoutes.find((route) => route.name === 'SystemRoot');
    const systemUserRoute = systemRoot?.children?.find(
      (route) => route.name === 'SystemUsers',
    );
    const roleRoute = systemRoot?.children?.find(
      (route) => route.name === 'Roles',
    );

    expect(systemUserRoute?.component).toBeTypeOf('function');
    expect(roleRoute?.component).toBeTypeOf('function');
    expect(systemUserRoute?.meta?.authority).toEqual([
      M1_PERMISSION_CODES.SYSTEM_USER_QUERY,
    ]);
    expect(roleRoute?.meta?.authority).toEqual([
      M1_PERMISSION_CODES.SYSTEM_ROLE_QUERY,
    ]);
  });

  it('does not use legacy system permission keys as page authorities', () => {
    const systemRoot = systemRoutes.find((route) => route.name === 'SystemRoot');
    const authorities = [
      ...(systemRoot?.meta?.authority ?? []),
      ...(systemRoot?.children ?? []).flatMap((route) => route.meta?.authority ?? []),
    ];

    expect(authorities).toEqual(
      expect.arrayContaining([
        M1_PERMISSION_CODES.ORDER_DICT_QUERY,
        M1_PERMISSION_CODES.ORDER_CHARGE_QUERY,
      ]),
    );
    expect(authorities).not.toContain('sys:medical-order-dict:query');
    expect(authorities).not.toContain('sys:medical-order-charge:query');
  });
});
