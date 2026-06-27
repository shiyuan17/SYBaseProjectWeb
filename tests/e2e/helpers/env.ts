import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

export type E2EAuthStrategy = 'api' | 'ui';
export type E2ERole =
  | 'admin'
  | 'creator'
  | 'fixation'
  | 'm6'
  | 'receive'
  | 'register'
  | 'tracking'
  | 'transport';

type RoleConfig = {
  key: E2ERole;
  storageFile: string;
  username: string;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const e2eRootDir = path.resolve(__dirname, '..');
const repoRootDir = path.resolve(e2eRootDir, '..', '..');
const webEleDir = path.join(repoRootDir, 'apps', 'web-ele');

type BrowserStorageState = {
  cookies?: unknown[];
  origins?: Array<{
    localStorage?: Array<{ name: string; value: string }>;
    origin: string;
  }>;
};

function readEnvFileValue(filePath: string, key: string) {
  const content = fs.readFileSync(filePath, 'utf8');
  const pattern = new RegExp(String.raw`^\s*${key}\s*=\s*(.+)\s*$`, 'm');
  const match = content.match(pattern);

  if (!match) {
    throw new Error(`未在 ${filePath} 中找到 ${key}。`);
  }

  const rawValue = match[1]?.trim() ?? '';
  const maybeQuoted =
    (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
    (rawValue.startsWith("'") && rawValue.endsWith("'"));

  return maybeQuoted ? rawValue.slice(1, -1) : rawValue;
}

function readWebAppVersion() {
  const packageJsonPath = path.join(webEleDir, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as {
    version?: string;
  };
  const version = packageJson.version?.trim();

  if (!version) {
    throw new Error(`未在 ${packageJsonPath} 中找到 version。`);
  }

  return version;
}

export const e2eEnv = {
  appRuntimeEnv: process.env.E2E_APP_ENV || 'dev',
  authBaseURL: process.env.E2E_AUTH_BASE_URL || 'http://localhost:8081',
  authDir: path.join(e2eRootDir, '.auth'),
  authStrategy: resolveE2EAuthStrategy(),
  baseURL: process.env.E2E_BASE_URL || 'http://localhost:5777',
  blBaseURL: process.env.E2E_BL_BASE_URL || 'http://localhost:8080',
  password: process.env.E2E_PASSWORD || '123456',
  roles: {
    admin: {
      key: 'admin',
      storageFile: 'admin.json',
      username: process.env.E2E_USER_ADMIN || 'm1.admin',
    },
    creator: {
      key: 'creator',
      storageFile: 'creator.json',
      username: process.env.E2E_USER_CREATOR || 'm2.admin',
    },
    fixation: {
      key: 'fixation',
      storageFile: 'fixation.json',
      username: process.env.E2E_USER_FIXATION || 'm2.fixation',
    },
    m6: {
      key: 'm6',
      storageFile: 'm6.json',
      username: process.env.E2E_USER_M6 || 'm6.admin',
    },
    receive: {
      key: 'receive',
      storageFile: 'receive.json',
      username: process.env.E2E_USER_RECEIVE || 'm2.receive',
    },
    register: {
      key: 'register',
      storageFile: 'register.json',
      username: process.env.E2E_USER_REGISTER || 'm2.register',
    },
    tracking: {
      key: 'tracking',
      storageFile: 'tracking.json',
      username: process.env.E2E_USER_TRACKING || 'm2.tracking',
    },
    transport: {
      key: 'transport',
      storageFile: 'transport.json',
      username: process.env.E2E_USER_TRANSPORT || 'm2.transport',
    },
  } satisfies Record<E2ERole, RoleConfig>,
} as const;

const webAppNamespacePrefix = readEnvFileValue(
  path.join(webEleDir, '.env'),
  'VITE_APP_NAMESPACE',
);
const webAppVersion = readWebAppVersion();

export const workflowDefaults = {
  handoverDepartmentCandidates: ['OR', '手术室', '病理技术组'],
  receiverDepartmentCandidates: ['Pathology', '病理科', '病理技术组'],
  submittingDepartmentCandidates: ['OR', '手术室', '病理技术组', '病理科'],
};

export function resolveE2EAuthStrategy(
  value: string | undefined = process.env.E2E_AUTH_STRATEGY,
): E2EAuthStrategy {
  return value?.trim().toLowerCase() === 'ui' ? 'ui' : 'api';
}

export function getRoleConfig(role: E2ERole) {
  return e2eEnv.roles[role];
}

export function getAuthStorageStatePath(role: E2ERole) {
  const roleConfig = getRoleConfig(role);
  return path.join(e2eEnv.authDir, roleConfig.storageFile);
}

export function getWebAppStorageNamespace() {
  return `${webAppNamespacePrefix}-${webAppVersion}-${e2eEnv.appRuntimeEnv}`;
}

export function getAccessStoreStorageKey() {
  return `${getWebAppStorageNamespace()}-core-access`;
}

function normalizeStorageStateOrigin(origin: string, targetOrigin: string) {
  try {
    const sourceUrl = new URL(origin);
    const targetUrl = new URL(targetOrigin);

    if (
      sourceUrl.protocol === targetUrl.protocol &&
      sourceUrl.hostname === targetUrl.hostname &&
      sourceUrl.origin !== targetUrl.origin
    ) {
      return targetUrl.origin;
    }
  } catch {
    return origin;
  }

  return origin;
}

export function normalizeStorageStateOrigins(
  storageState: BrowserStorageState,
  targetOrigin: string,
) {
  const origins = Array.isArray(storageState.origins)
    ? storageState.origins
    : [];
  let normalizedChanged = false;

  const normalizedOrigins = origins.map((item) => {
    const normalizedOrigin = normalizeStorageStateOrigin(
      item.origin,
      targetOrigin,
    );

    if (normalizedOrigin !== item.origin) {
      normalizedChanged = true;
    }

    return {
      ...item,
      origin: normalizedOrigin,
    };
  });

  if (!normalizedChanged) {
    return storageState;
  }

  return {
    ...storageState,
    origins: normalizedOrigins,
  };
}

export function getStorageStatePath(role: E2ERole) {
  const sourcePath = getAuthStorageStatePath(role);

  if (!fs.existsSync(sourcePath)) {
    return sourcePath;
  }

  const targetOrigin = new URL(e2eEnv.baseURL).origin;

  try {
    const raw = fs.readFileSync(sourcePath, 'utf8');
    const parsed = JSON.parse(raw) as BrowserStorageState;
    const normalized = normalizeStorageStateOrigins(parsed, targetOrigin);

    if (
      Array.isArray(normalized.origins) &&
      normalized.origins.some((item) => item.origin === targetOrigin)
    ) {
      if (normalized === parsed) {
        return sourcePath;
      }

      const normalizedPath = path.join(
        e2eEnv.authDir,
        `${targetOrigin.replaceAll(/[:/\\]/gu, '_')}-${getRoleConfig(role).storageFile}`,
      );

      fs.writeFileSync(
        normalizedPath,
        JSON.stringify(normalized, null, 2),
        'utf8',
      );

      return normalizedPath;
    }

    if (normalized === parsed) {
      return sourcePath;
    }

    const normalizedPath = path.join(
      e2eEnv.authDir,
      `${targetOrigin.replaceAll(/[:/\\]/gu, '_')}-${getRoleConfig(role).storageFile}`,
    );

    fs.writeFileSync(
      normalizedPath,
      JSON.stringify(normalized, null, 2),
      'utf8',
    );

    return normalizedPath;
  } catch {
    return sourcePath;
  }
}
