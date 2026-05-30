import { spawn } from 'node:child_process';
import { access, cp, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');
const mode = process.argv[2] ?? 'all';
const reportRoot = path.join(
  workspaceRoot,
  'tests',
  'reports',
  'system-management',
);
const frontendReportDir = path.join(reportRoot, 'frontend');
const backendReportDir = path.join(reportRoot, 'backend');
const aggregateReportPath = path.join(reportRoot, 'index.html');
const frontendTestReportPath = path.join(frontendReportDir, 'test-report.html');
const frontendCoverageDir = path.join(frontendReportDir, 'coverage');
const backendTestReportPath = path.join(
  backendReportDir,
  'test-report',
  'index.html',
);
const backendCoverageDir = path.join(backendReportDir, 'coverage');

const backendRepoInput = process.env.SY_BACKEND_REPO_PATH ?? '../SYBaseProject';
const backendRepoPath = path.isAbsolute(backendRepoInput)
  ? backendRepoInput
  : path.resolve(workspaceRoot, backendRepoInput);
const backendModulePath = path.join(backendRepoPath, 'bl-center');

const backendTests = [
  'SystemManagementUserIntegrationTest',
  'SystemManagementRoleAndMenuIntegrationTest',
  'MasterDataControllerIntegrationTest',
];

function commandName(name) {
  return process.platform === 'win32' ? `${name}.cmd` : name;
}

function mvnwName() {
  return process.platform === 'win32' ? 'mvnw.cmd' : './mvnw';
}

function toReportHref(targetPath) {
  return path.relative(reportRoot, targetPath).replaceAll('\\', '/');
}

async function pathExists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(targetPath) {
  await mkdir(targetPath, { recursive: true });
}

async function cleanDir(targetPath) {
  await rm(targetPath, { force: true, recursive: true });
  await ensureDir(targetPath);
}

function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: process.env,
      shell: process.platform === 'win32',
      stdio: 'inherit',
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(
        new Error(
          `Command failed (${code ?? 'unknown'}): ${command} ${args.join(' ')}`,
        ),
      );
    });
  });
}

async function writeRedirectIndex(targetDir, reportFileName, title) {
  await writeFile(
    path.join(targetDir, 'index.html'),
    `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="refresh" content="0; url=${reportFileName}" />
    <title>${title}</title>
  </head>
  <body>
    <p><a href="${reportFileName}">打开 ${title}</a></p>
  </body>
</html>
`,
    'utf8',
  );
}

async function findExistingReport(candidates) {
  for (const candidate of candidates) {
    if (await pathExists(candidate)) {
      return candidate;
    }
  }
  return null;
}

async function runFrontend() {
  await cleanDir(frontendReportDir);

  await runCommand(
    commandName('pnpm'),
    [
      'exec',
      'vitest',
      'run',
      '--config',
      'vitest.system-management.config.ts',
      '--reporter=default',
      '--reporter=html',
      `--outputFile.html=${frontendTestReportPath}`,
      '--coverage',
    ],
    workspaceRoot,
  );
}

async function runBackend() {
  await cleanDir(backendReportDir);

  await runCommand(
    mvnwName(),
    [
      '-pl',
      'bl-center',
      '-am',
      `-Dtest=${backendTests.join(',')}`,
      '-Dsurefire.failIfNoSpecifiedTests=false',
      'test',
      'org.jacoco:jacoco-maven-plugin:report',
      'org.apache.maven.plugins:maven-surefire-report-plugin:report-only',
    ],
    backendRepoPath,
  );

  const surefireReport = await findExistingReport([
    path.join(backendModulePath, 'target', 'reports', 'surefire.html'),
    path.join(backendModulePath, 'target', 'reports', 'surefire-report.html'),
    path.join(backendModulePath, 'target', 'site', 'surefire.html'),
    path.join(backendModulePath, 'target', 'site', 'surefire-report.html'),
  ]);

  if (!surefireReport) {
    throw new Error('Unable to locate the backend Surefire HTML report.');
  }

  const backendTestOutputDir = path.join(backendReportDir, 'test-report');
  await cleanDir(backendTestOutputDir);
  await cp(path.dirname(surefireReport), backendTestOutputDir, {
    force: true,
    recursive: true,
  });
  await writeRedirectIndex(
    backendTestOutputDir,
    path.basename(surefireReport),
    '后端测试报告',
  );

  const jacocoSourceDir = path.join(
    backendModulePath,
    'target',
    'site',
    'jacoco',
  );
  if (!(await pathExists(jacocoSourceDir))) {
    throw new Error(
      'Unable to locate the backend JaCoCo HTML report directory.',
    );
  }
  await cp(jacocoSourceDir, backendCoverageDir, {
    force: true,
    recursive: true,
  });
}

async function writeAggregateReport() {
  await ensureDir(reportRoot);

  const frontendTestAvailable = await pathExists(frontendTestReportPath);
  const frontendCoverageAvailable = await pathExists(
    path.join(frontendCoverageDir, 'index.html'),
  );
  const backendTestAvailable = await pathExists(backendTestReportPath);
  const backendCoverageAvailable = await pathExists(
    path.join(backendCoverageDir, 'index.html'),
  );

  const generatedAt = new Date().toLocaleString('zh-CN', {
    hour12: false,
  });

  await writeFile(
    aggregateReportPath,
    `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>系统管理模块测试报告</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f4f6fb;
        --card: #ffffff;
        --text: #18212f;
        --muted: #5d6b82;
        --accent: #0f766e;
        --border: #d7dfeb;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        background: linear-gradient(180deg, #eef6ff 0%, var(--bg) 50%, #ffffff 100%);
        color: var(--text);
        font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
      }

      main {
        margin: 0 auto;
        max-width: 960px;
        padding: 40px 24px 56px;
      }

      h1 {
        margin: 0 0 12px;
        font-size: 32px;
      }

      p {
        color: var(--muted);
        line-height: 1.6;
      }

      .grid {
        display: grid;
        gap: 16px;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        margin-top: 28px;
      }

      .card {
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 16px;
        box-shadow: 0 14px 40px rgba(15, 23, 42, 0.06);
        padding: 20px;
      }

      .card h2 {
        margin: 0 0 8px;
        font-size: 20px;
      }

      .status {
        display: inline-block;
        border-radius: 999px;
        background: #d1fae5;
        color: #065f46;
        font-size: 12px;
        font-weight: 600;
        margin-bottom: 12px;
        padding: 4px 10px;
      }

      .status.missing {
        background: #fee2e2;
        color: #991b1b;
      }

      ul {
        margin: 14px 0 0;
        padding-left: 18px;
      }

      li + li {
        margin-top: 8px;
      }

      a {
        color: var(--accent);
        font-weight: 600;
        text-decoration: none;
      }

      a:hover {
        text-decoration: underline;
      }

      .meta {
        margin-top: 28px;
        font-size: 13px;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>系统管理模块测试报告</h1>
      <p>该报告入口聚合了系统管理模块的前端 API 契约测试与后端真实接口联调报告。</p>
      <div class="grid">
        <section class="card">
          <span class="status${frontendTestAvailable && frontendCoverageAvailable ? '' : ' missing'}">
            ${frontendTestAvailable && frontendCoverageAvailable ? '前端报告已生成' : '前端报告缺失'}
          </span>
          <h2>前端 Vitest</h2>
          <p>覆盖系统管理模块前端 API 契约测试与覆盖率报告。</p>
          <ul>
            <li>${frontendTestAvailable ? `<a href="${toReportHref(frontendTestReportPath)}">打开执行报告</a>` : '执行报告未生成'}</li>
            <li>${frontendCoverageAvailable ? `<a href="${toReportHref(path.join(frontendCoverageDir, 'index.html'))}">打开覆盖率报告</a>` : '覆盖率报告未生成'}</li>
          </ul>
        </section>
        <section class="card">
          <span class="status${backendTestAvailable && backendCoverageAvailable ? '' : ' missing'}">
            ${backendTestAvailable && backendCoverageAvailable ? '后端报告已生成' : '后端报告缺失'}
          </span>
          <h2>后端 Maven</h2>
          <p>覆盖系统管理相关联调测试、Surefire HTML 报告与 JaCoCo 覆盖率。</p>
          <ul>
            <li>${backendTestAvailable ? `<a href="${toReportHref(backendTestReportPath)}">打开执行报告</a>` : '执行报告未生成'}</li>
            <li>${backendCoverageAvailable ? `<a href="${toReportHref(path.join(backendCoverageDir, 'index.html'))}">打开覆盖率报告</a>` : '覆盖率报告未生成'}</li>
          </ul>
        </section>
      </div>
      <p class="meta">生成时间: ${generatedAt}</p>
      <p class="meta">后端仓库路径: ${backendRepoPath}</p>
    </main>
  </body>
</html>
`,
    'utf8',
  );
}

async function main() {
  if (!['all', 'backend', 'frontend'].includes(mode)) {
    throw new Error(`Unsupported mode: ${mode}`);
  }

  await ensureDir(reportRoot);

  if (mode === 'all' || mode === 'frontend') {
    await runFrontend();
  }

  if (mode === 'all' || mode === 'backend') {
    await runBackend();
  }

  await writeAggregateReport();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
