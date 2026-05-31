import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

export type E2ERole =
  | 'creator'
  | 'fixation'
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

export const e2eEnv = {
  authBaseURL: process.env.E2E_AUTH_BASE_URL || 'http://localhost:8081',
  authDir: path.join(e2eRootDir, '.auth'),
  baseURL: process.env.E2E_BASE_URL || 'http://localhost:5778',
  blBaseURL: process.env.E2E_BL_BASE_URL || 'http://localhost:8080',
  password: process.env.E2E_PASSWORD || '123456',
  roles: {
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

export const workflowDefaults = {
  handoverDepartmentCandidates: ['OR', '手术室', '病理技术组'],
  receiverDepartmentCandidates: ['Pathology', '病理科', '病理技术组'],
  submittingDepartmentCandidates: ['OR', '手术室', '病理技术组', '病理科'],
};

export function getRoleConfig(role: E2ERole) {
  return e2eEnv.roles[role];
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

export function getStorageStatePath(role: E2ERole) {
  const roleConfig = getRoleConfig(role);
  const sourcePath = path.join(e2eEnv.authDir, roleConfig.storageFile);

  if (!fs.existsSync(sourcePath)) {
    return sourcePath;
  }

  const targetOrigin = new URL(e2eEnv.baseURL).origin;

  try {
    const raw = fs.readFileSync(sourcePath, 'utf8');
    const parsed = JSON.parse(raw) as {
      cookies?: unknown[];
      origins?: Array<{
        localStorage?: Array<{ name: string; value: string }>;
        origin: string;
      }>;
    };

    const origins = Array.isArray(parsed.origins) ? parsed.origins : [];
    if (origins.some((item) => item.origin === targetOrigin)) {
      return sourcePath;
    }

    const normalizedOrigins = origins.map((item) => ({
      ...item,
      origin: normalizeStorageStateOrigin(item.origin, targetOrigin),
    }));

    const normalizedChanged = normalizedOrigins.some(
      (item, index) => item.origin !== origins[index]?.origin,
    );

    if (!normalizedChanged) {
      return sourcePath;
    }

    const normalizedPath = path.join(
      e2eEnv.authDir,
      `${targetOrigin.replaceAll(/[:/\\]/gu, '_')}-${roleConfig.storageFile}`,
    );

    fs.writeFileSync(
      normalizedPath,
      JSON.stringify(
        {
          ...parsed,
          origins: normalizedOrigins,
        },
        null,
        2,
      ),
      'utf8',
    );

    return normalizedPath;
  } catch {
    return sourcePath;
  }
}
