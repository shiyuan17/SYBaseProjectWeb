import { LOGIN_PATH } from '@vben/constants';

export const LEGACY_LOGIN_PATH = '/login';

function firstQueryValue(value: unknown) {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function stripQueryAndHash(path: string) {
  return path.split(/[?#]/)[0] || path;
}

export function decodeRedirectPath(value: unknown) {
  const queryValue = firstQueryValue(value);
  if (typeof queryValue !== 'string') {
    return '';
  }

  let decoded = queryValue.trim();
  for (let index = 0; index < 2; index += 1) {
    try {
      const nextDecoded = decodeURIComponent(decoded);
      if (nextDecoded === decoded) {
        break;
      }
      decoded = nextDecoded;
    } catch {
      break;
    }
  }
  return decoded;
}

export function isLoginPath(path: string) {
  return (
    stripQueryAndHash(path) === LOGIN_PATH ||
    stripQueryAndHash(path) === LEGACY_LOGIN_PATH
  );
}

export function buildLoginRedirectQuery(
  fullPath: string,
  defaultHomePath: string,
) {
  if (
    !fullPath ||
    stripQueryAndHash(fullPath) === defaultHomePath ||
    isLoginPath(fullPath)
  ) {
    return {};
  }

  return {
    redirect: encodeURIComponent(fullPath),
  };
}

export function resolvePostLoginRedirect(
  redirect: unknown,
  fallbackPath: string,
) {
  const decodedRedirect = decodeRedirectPath(redirect);
  if (!decodedRedirect || isLoginPath(decodedRedirect)) {
    return fallbackPath;
  }
  return decodedRedirect;
}
