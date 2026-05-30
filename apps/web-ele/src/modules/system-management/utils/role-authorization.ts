import type {
  MenuView,
  PermissionView,
} from '#/modules/system-management/types/system-management';

export interface RoleAuthorizationPermissionGroup {
  entryPermissions: PermissionView[];
  manualPermissions: PermissionView[];
  menu: MenuView;
}

export interface RoleAuthorizationSummary {
  autoEntryPermissionCount: number;
  manualPermissionCount: number;
  selectedMenuCount: number;
}

export function getSelectedPageMenus(
  menus: MenuView[],
  selectedMenuIds: string[],
): MenuView[] {
  const selectedMenuIdSet = new Set(normalizeIds(selectedMenuIds));
  return [...menus]
    .filter(
      (menu) => menu.menuType === 'MENU' && selectedMenuIdSet.has(menu.id),
    )
    .toSorted(
      (left, right) =>
        left.sortOrder - right.sortOrder ||
        left.menuCode.localeCompare(right.menuCode),
    );
}

export function buildRoleAuthorizationPermissionGroups(
  menus: MenuView[],
  permissions: PermissionView[],
  selectedMenuIds: string[],
): RoleAuthorizationPermissionGroup[] {
  const selectedPageMenus = getSelectedPageMenus(menus, selectedMenuIds);

  return selectedPageMenus.map((menu) => {
    const menuPermissions = [...permissions]
      .filter((permission) => permission.menuId === menu.id)
      .toSorted(
        (left, right) =>
          left.sortOrder - right.sortOrder ||
          left.permissionCode.localeCompare(right.permissionCode),
      );

    return {
      entryPermissions: menuPermissions.filter(
        (permission) => permission.entryPermission,
      ),
      manualPermissions: menuPermissions.filter(
        (permission) => !permission.entryPermission,
      ),
      menu,
    };
  });
}

export function normalizeManualPermissionIds(
  permissions: PermissionView[],
  selectedMenuIds: string[],
  permissionIds: string[],
): string[] {
  const selectedMenuIdSet = new Set(normalizeIds(selectedMenuIds));
  const selectedPermissionIdSet = new Set(normalizeIds(permissionIds));

  return permissions
    .filter((permission) => selectedPermissionIdSet.has(permission.id))
    .filter((permission) => selectedMenuIdSet.has(permission.menuId))
    .filter((permission) => !permission.entryPermission)
    .map((permission) => permission.id)
    .filter((permissionId, index, ids) => ids.indexOf(permissionId) === index);
}

export function summarizeRoleAuthorization(
  menus: MenuView[],
  permissions: PermissionView[],
  selectedMenuIds: string[],
  permissionIds: string[],
): RoleAuthorizationSummary {
  const permissionGroups = buildRoleAuthorizationPermissionGroups(
    menus,
    permissions,
    selectedMenuIds,
  );
  const manualPermissionIds = normalizeManualPermissionIds(
    permissions,
    selectedMenuIds,
    permissionIds,
  );

  return {
    autoEntryPermissionCount: permissionGroups.reduce(
      (count, group) => count + group.entryPermissions.length,
      0,
    ),
    manualPermissionCount: manualPermissionIds.length,
    selectedMenuCount: permissionGroups.length,
  };
}

function normalizeIds(values: string[]): string[] {
  return values
    .filter((value) => typeof value === 'string' && value.trim().length > 0)
    .filter((value, index, ids) => ids.indexOf(value) === index);
}
