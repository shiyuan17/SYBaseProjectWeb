import type {
  MenuView,
  PermissionView,
} from '#/modules/system-management/types/system-management';

import { describe, expect, it } from 'vitest';

import {
  buildRoleAuthorizationPermissionGroups,
  normalizeManualPermissionIds,
  summarizeRoleAuthorization,
} from './role-authorization';

const menus: MenuView[] = [
  {
    componentName: 'SystemRoot',
    enabled: true,
    icon: null,
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
    componentName: 'Roles',
    enabled: true,
    icon: null,
    id: 'MENU_SYS_ROLES',
    menuCode: 'SYS_ROLES',
    menuName: '角色管理',
    menuType: 'MENU',
    parentId: 'MENU_SYSTEM',
    path: '/system/roles',
    permissionPrefix: 'sys:role',
    sortOrder: 2,
    visible: true,
  },
  {
    componentName: 'TechnicalTasks',
    enabled: true,
    icon: null,
    id: 'MENU_M3_TASKS',
    menuCode: 'M3_TASKS',
    menuName: '技术任务',
    menuType: 'MENU',
    parentId: null,
    path: '/technical-workflow/tasks',
    permissionPrefix: 'm3:tasks',
    sortOrder: 3,
    visible: true,
  },
];

const permissions: PermissionView[] = [
  {
    actionKey: 'QUERY',
    enabled: true,
    entryPermission: true,
    httpMethod: 'GET',
    id: 'PERM_SYS_ROLE_QUERY',
    menuId: 'MENU_SYS_ROLES',
    permissionCode: 'PERM_SYS_ROLE_QUERY',
    permissionGroup: 'SYSTEM',
    permissionName: '查询角色',
    resourcePath: '/api/v1/roles',
    sortOrder: 1,
  },
  {
    actionKey: 'ASSIGN',
    enabled: true,
    entryPermission: false,
    httpMethod: 'PUT',
    id: 'PERM_SYS_ROLE_ASSIGN',
    menuId: 'MENU_SYS_ROLES',
    permissionCode: 'PERM_SYS_ROLE_ASSIGN',
    permissionGroup: 'SYSTEM',
    permissionName: '授权角色',
    resourcePath: '/api/v1/roles/{id}/authorizations',
    sortOrder: 2,
  },
  {
    actionKey: 'QUERY',
    enabled: true,
    entryPermission: true,
    httpMethod: 'GET',
    id: 'PERM_M3_TASK_QUERY',
    menuId: 'MENU_M3_TASKS',
    permissionCode: 'PERM_M3_TASK_QUERY',
    permissionGroup: 'M3',
    permissionName: '查询技术任务',
    resourcePath: '/api/v1/technical-tasks/pending',
    sortOrder: 3,
  },
  {
    actionKey: 'START',
    enabled: true,
    entryPermission: false,
    httpMethod: 'POST',
    id: 'PERM_M3_GROSSING_START',
    menuId: 'MENU_M3_TASKS',
    permissionCode: 'PERM_M3_GROSSING_START',
    permissionGroup: 'M3',
    permissionName: '开始技术任务',
    resourcePath: '/api/v1/grossings/start',
    sortOrder: 4,
  },
];

describe('role-authorization utils', () => {
  it('builds permission groups only for selected page menus', () => {
    const groups = buildRoleAuthorizationPermissionGroups(menus, permissions, [
      'MENU_SYSTEM',
      'MENU_SYS_ROLES',
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.menu.id).toBe('MENU_SYS_ROLES');
    expect(
      groups[0]?.entryPermissions.map((permission) => permission.id),
    ).toEqual(['PERM_SYS_ROLE_QUERY']);
    expect(
      groups[0]?.manualPermissions.map((permission) => permission.id),
    ).toEqual(['PERM_SYS_ROLE_ASSIGN']);
  });

  it('drops entry permissions and unselected-menu permissions from manual payloads', () => {
    expect(
      normalizeManualPermissionIds(
        permissions,
        ['MENU_SYSTEM', 'MENU_SYS_ROLES'],
        [
          'PERM_SYS_ROLE_QUERY',
          'PERM_SYS_ROLE_ASSIGN',
          'PERM_M3_GROSSING_START',
        ],
      ),
    ).toEqual(['PERM_SYS_ROLE_ASSIGN']);
  });

  it('summarizes selected menus, auto permissions, and manual permissions', () => {
    expect(
      summarizeRoleAuthorization(
        menus,
        permissions,
        ['MENU_SYSTEM', 'MENU_SYS_ROLES', 'MENU_M3_TASKS'],
        [
          'PERM_SYS_ROLE_ASSIGN',
          'PERM_M3_TASK_QUERY',
          'PERM_M3_GROSSING_START',
        ],
      ),
    ).toEqual({
      autoEntryPermissionCount: 2,
      manualPermissionCount: 2,
      selectedMenuCount: 2,
    });
  });
});
