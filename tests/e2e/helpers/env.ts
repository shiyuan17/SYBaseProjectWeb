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

export function getStorageStatePath(role: E2ERole) {
  return path.join(e2eEnv.authDir, getRoleConfig(role).storageFile);
}
