type RouteMetaLike = Record<string, unknown> & {
  hideInTab?: boolean;
  keepAlive?: boolean;
};

type RouteLike = {
  children?: RouteLike[];
  component?: unknown;
  meta?: RouteMetaLike;
};

function shouldKeepAlive(route: RouteLike) {
  return (
    route.component &&
    route.component !== 'BasicLayout' &&
    route.meta?.hideInTab !== true &&
    route.meta?.keepAlive !== false
  );
}

export function applyKeepAliveToTabRoutes<const TRoute extends RouteLike>(
  routes: readonly TRoute[],
): TRoute[] {
  return routes.map((route) => {
    const children = route.children
      ? applyKeepAliveToTabRoutes(route.children)
      : route.children;
    let meta = route.meta ? { ...route.meta } : undefined;
    if (shouldKeepAlive(route)) {
      meta = {
        ...meta,
        keepAlive: route.meta?.keepAlive ?? true,
      };
    }

    return {
      ...route,
      ...(children ? { children: children as TRoute[] } : {}),
      ...(meta ? { meta } : {}),
    };
  });
}
