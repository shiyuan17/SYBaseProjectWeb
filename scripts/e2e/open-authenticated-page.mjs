import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRootDir = path.resolve(__dirname, '..', '..');
const e2eAuthDir = path.join(repoRootDir, 'tests', 'e2e', '.auth');
const webEleDir = path.join(repoRootDir, 'apps', 'web-ele');

function parseArgs(argv) {
  const args = {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5777',
    open: true,
    path: '/analytics',
    role: 'm6',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    const next = argv[index + 1];

    if (current === '--role' && next) {
      args.role = next;
      index += 1;
      continue;
    }

    if (current === '--path' && next) {
      args.path = next;
      index += 1;
      continue;
    }

    if (current === '--base-url' && next) {
      args.baseURL = next;
      index += 1;
      continue;
    }

    if (current === '--print-only') {
      args.open = false;
    }
  }

  return args;
}

function readEnvFileValue(filePath, key) {
  const content = fs.readFileSync(filePath, 'utf8');
  const pattern = new RegExp(String.raw`^\s*${key}\s*=\s*(.+)\s*$`, 'm');
  const match = content.match(pattern);

  if (!match) {
    throw new Error(`Missing ${key} in ${filePath}`);
  }

  const rawValue = match[1].trim();
  if (
    (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
    (rawValue.startsWith("'") && rawValue.endsWith("'"))
  ) {
    return rawValue.slice(1, -1);
  }

  return rawValue;
}

function getWebNamespace() {
  const packageJsonPath = path.join(webEleDir, 'package.json');
  const appVersion = JSON.parse(
    fs.readFileSync(packageJsonPath, 'utf8'),
  ).version;
  const namespacePrefix = readEnvFileValue(
    path.join(webEleDir, '.env'),
    'VITE_APP_NAMESPACE',
  );
  const runtimeEnv = process.env.E2E_APP_ENV || 'dev';

  return `${namespacePrefix}-${appVersion}-${runtimeEnv}`;
}

function buildStorageState(baseURL, accessToken) {
  return {
    cookies: [],
    origins: [
      {
        origin: new URL(baseURL).origin,
        localStorage: [
          {
            name: `${getWebNamespace()}-core-access`,
            value: JSON.stringify({
              accessToken,
              refreshToken: null,
              accessCodes: [],
              isLockScreen: false,
            }),
          },
        ],
      },
    ],
  };
}

async function requestAccessToken(role) {
  const usernames = {
    admin: process.env.E2E_USER_ADMIN || 'm1.admin',
    creator: process.env.E2E_USER_CREATOR || 'm2.admin',
    fixation: process.env.E2E_USER_FIXATION || 'm2.fixation',
    m6: process.env.E2E_USER_M6 || 'm6.admin',
    receive: process.env.E2E_USER_RECEIVE || 'm2.receive',
    register: process.env.E2E_USER_REGISTER || 'm2.register',
    tracking: process.env.E2E_USER_TRACKING || 'm2.tracking',
    transport: process.env.E2E_USER_TRANSPORT || 'm2.transport',
  };
  const loginName = usernames[role];

  if (!loginName) {
    throw new Error(`Unknown role: ${role}`);
  }

  const response = await fetch(
    `${process.env.E2E_AUTH_BASE_URL || 'http://localhost:8081'}/api/v1/auth/login`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        loginName,
        password: process.env.E2E_PASSWORD || '123456',
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Login failed with HTTP ${response.status}`);
  }

  const payload = await response.json();
  const accessToken = payload?.data?.accessToken?.trim();

  if (payload?.code !== 'SUCCESS' || !accessToken) {
    throw new Error(
      `Login failed for role ${role}: ${payload?.code || 'UNKNOWN'}`,
    );
  }

  return accessToken;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const accessToken = await requestAccessToken(options.role);

  fs.mkdirSync(e2eAuthDir, { recursive: true });
  const storageStatePath = path.join(e2eAuthDir, `${options.role}.json`);
  fs.writeFileSync(
    storageStatePath,
    JSON.stringify(buildStorageState(options.baseURL, accessToken), null, 2),
    'utf8',
  );

  const targetUrl = new URL(options.path, options.baseURL).toString();
  console.log(`storageState=${storageStatePath}`);
  console.log(`targetUrl=${targetUrl}`);

  if (!options.open) {
    return;
  }

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    baseURL: options.baseURL,
    storageState: storageStatePath,
  });
  const page = await context.newPage();
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
  console.log(
    'Authenticated browser opened. Close the browser window to finish.',
  );
  await context.waitForEvent('close');
  await context.close();
  await browser.close();
}

main().catch((error) => {
  console.error(String(error));
  process.exitCode = 1;
});
