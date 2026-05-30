import type { RouteRecordStringComponent } from '@vben/types';

import type { MenuView } from '#/modules/system-management/types/system-management';

import { applyKeepAliveToTabRoutes } from '#/router/routes/keep-alive';

import { BACKEND_MENU_COMPONENT_DEFINITIONS } from './menu-component-definitions';
import { STATIC_FALLBACK_MENU_ROUTES } from './menu-fallback-routes';

type MenuTreeNode = MenuView & {
  children: MenuTreeNode[];
};

function findMenuDefinition(
  menu: Pick<MenuView, 'componentName' | 'menuCode' | 'path'>,
) {
  const normalizedComponentName = menu.componentName?.trim().toLowerCase();
  const normalizedMenuCode = menu.menuCode.trim().toLowerCase();
  const normalizedPath = menu.path.trim().toLowerCase();

  return BACKEND_MENU_COMPONENT_DEFINITIONS.find((definition) => {
    const matchesComponent = definition.componentAliases.some(
      (alias) => alias.toLowerCase() === normalizedComponentName,
    );
    const matchesMenuCode = definition.menuCodes?.some(
      (menuCode) => menuCode.toLowerCase() === normalizedMenuCode,
    );
    const matchesPath = definition.pathAliases?.some(
      (path) => path.toLowerCase() === normalizedPath,
    );

    return matchesComponent || matchesMenuCode || matchesPath;
  });
}

function buildMenuTree(menus: MenuView[]): MenuTreeNode[] {
  const visibleMenus: MenuTreeNode[] = menus
    .filter((menu) => menu.enabled && menu.visible)
    .map(
      (menu): MenuTreeNode => ({
        ...menu,
        children: [],
      }),
    );
  const menuMap = new Map<string, MenuTreeNode>(
    visibleMenus.map((menu) => [menu.id, menu]),
  );
  const roots: MenuTreeNode[] = [];

  visibleMenus.forEach((menu) => {
    if (!menu.parentId) {
      roots.push(menu);
      return;
    }

    const parent = menuMap.get(menu.parentId);
    if (parent) {
      parent.children.push(menu);
      return;
    }

    roots.push(menu);
  });

  const sortMenus = (nodes: MenuTreeNode[]) => {
    nodes.sort((left, right) => left.sortOrder - right.sortOrder);
    nodes.forEach((node) => sortMenus(node.children));
  };

  sortMenus(roots);
  return roots;
}

function convertMenuNode(
  node: MenuTreeNode,
): null | RouteRecordStringComponent<string> {
  const definition = findMenuDefinition(node);
  const convertedChildren = node.children
    .map((child) => convertMenuNode(child))
    .filter(
      (child): child is RouteRecordStringComponent<string> => child !== null,
    );
  const children = convertedChildren.filter((child, index, routes) => {
    return routes.findIndex((route) => route.name === child.name) === index;
  });

  if (!definition) {
    return null;
  }

  const route: RouteRecordStringComponent<string> = {
    component: definition.component,
    meta: {
      icon: node.icon || undefined,
      order: node.sortOrder,
      title: definition.canonicalTitle ?? node.menuName,
    },
    name: definition.routeName,
    path: definition.path,
  };

  if (children.length > 0) {
    route.children = children;
    route.redirect = children[0]?.path;
  }

  return route;
}

function hasUsableRoutes(routes: RouteRecordStringComponent<string>[]) {
  return routes.some((route) => {
    const isLayoutOnlyRoute =
      route.component === 'BasicLayout' && !route.children?.length;

    return !isLayoutOnlyRoute;
  });
}

export function mapMenuViewsToRoutes(
  menus: MenuView[],
): RouteRecordStringComponent<string>[] {
  return applyKeepAliveToTabRoutes(
    buildMenuTree(menus)
      .map((menu) => convertMenuNode(menu))
      .filter(
        (route): route is RouteRecordStringComponent<string> => route !== null,
      ),
  );
}

export async function getBackendFirstMenuRoutes(
  fetchMenuRoutes: () => Promise<RouteRecordStringComponent<string>[]>,
) {
  try {
    const backendRoutes = await fetchMenuRoutes();

    if (hasUsableRoutes(backendRoutes)) {
      return backendRoutes;
    }
  } catch {
    return STATIC_FALLBACK_MENU_ROUTES;
  }

  return STATIC_FALLBACK_MENU_ROUTES;
}
