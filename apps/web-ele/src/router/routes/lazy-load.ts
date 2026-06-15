import type { RouteComponent } from 'vue-router';

interface RouteReloadRetryOptions {
  reload?: () => void;
}

const routeComponentReloadRetryPrefix = 'route-component-reload-retry:';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function isDynamicImportFetchError(error: unknown) {
  const message = getErrorMessage(error);
  return (
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Importing a module script failed') ||
    message.includes('error loading dynamically imported module')
  );
}

function getRouteRetryKey(routeName: string) {
  return `${routeComponentReloadRetryPrefix}${routeName}`;
}

function reloadPage() {
  globalThis.location?.reload();
}

export function withRouteComponentReloadRetry(
  loader: () => Promise<RouteComponent>,
  routeName: string,
  options: RouteReloadRetryOptions = {},
) {
  return async () => {
    try {
      const component = await loader();
      sessionStorage.removeItem(getRouteRetryKey(routeName));
      return component;
    } catch (error) {
      const retryKey = getRouteRetryKey(routeName);
      if (
        isDynamicImportFetchError(error) &&
        sessionStorage.getItem(retryKey) !== '1'
      ) {
        sessionStorage.setItem(retryKey, '1');
        (options.reload ?? reloadPage)();
      }
      throw error;
    }
  };
}
