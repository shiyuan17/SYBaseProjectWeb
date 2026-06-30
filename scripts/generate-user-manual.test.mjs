import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { generateUserManual } from './generate-user-manual.mjs';

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'user-manual-test-'));
}

function createStageRoot(tempDir) {
  const stageRoot = path.join(tempDir, 'stage');
  fs.mkdirSync(stageRoot, { recursive: true });
  return stageRoot;
}

function writeManifest(stageRoot, manifest) {
  fs.writeFileSync(
    path.join(stageRoot, '.capture-manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf8',
  );
}

function writeErrorLog(stageRoot, content = '') {
  fs.writeFileSync(path.join(stageRoot, 'capture-errors.log'), content, 'utf8');
}

function readManualFile(manualRoot, fileName) {
  return fs.readFileSync(path.join(manualRoot, fileName), 'utf8');
}

const tempDirs = [];

const TEST_MODULE_SPECS = [
  {
    key: 'dashboard',
    title: '仪表盘',
    order: 10,
    intro: '展示首页看板与个人工作台，便于登录后快速掌握当日待办。',
    processSummary: '工作台总览 → 看板筛选 → 进入业务模块',
    sections: [
      {
        sectionId: 'dashboard-overview',
        title: '首页总览',
        summary: '确认首页可见的总体信息与入口。',
        subsections: [
          {
            subsectionId: 'workspace',
            title: '查看个人工作台',
            path: '/workspace',
            role: 'admin',
            steps: ['登录后进入工作台。', '确认待办区与快捷入口可见。'],
            expected: '当前账号可看到岗位待办与快捷入口。',
            screenshotNames: ['dashboard-workspace'],
          },
        ],
      },
    ],
  },
  {
    key: 'm2-specimen-workflow',
    title: 'M2 临床送检',
    order: 20,
    intro: '沿用真实业务链路截图，覆盖申请、登记、固定、接收与异常处理。',
    processSummary: '申请登记 → 固定转运 → 接收确认 → 追踪查询',
  },
  {
    key: 'm3-production-management',
    title: 'M3 制片管理',
    order: 30,
    intro: '覆盖包埋、切片、染色等技术制片 SOP，强调岗位入口与结果确认。',
    processSummary: '包埋 → 切片 → 染色 → 封片',
    sections: [
      {
        sectionId: 'embedding',
        title: '包埋工作站',
        summary: '从待处理任务进入包埋工位并完成基础筛选。',
        subsections: [
          {
            subsectionId: 'embedding-entry',
            title: '进入包埋工作站',
            pathLabel: '制片管理 -> 包埋工作站',
            path: '/technical-workflow/embedding',
            role: 'embedding-tech',
            roleNote: '建议使用包埋岗位账号查看完整列表。',
            steps: ['打开包埋工作站。', '按病理号或申请单筛选待包埋任务。'],
            operations: ['查看待处理任务', '按病理号筛选'],
            expected: '列表展示待包埋任务，并可进入包埋处理。',
            screenshotNames: [
              'm3-embedding-overview',
              'm3-embedding-filter',
              'legacy-entry-shot',
            ],
          },
          {
            subsectionId: 'embedding-complete',
            title: '完成包埋确认',
            pathLabel: '制片管理 -> 包埋工作站',
            path: '/technical-workflow/embedding',
            role: 'embedding-tech',
            steps: ['选择任务并点击开始包埋。', '确认包埋完成后提交。'],
            expected: '任务进入已完成状态并流转到切片环节。',
            screenshotNames: ['m3-embedding-complete'],
          },
        ],
      },
    ],
  },
  {
    key: 'm4-doctor-workflow',
    title: 'M4 诊断管理',
    order: 40,
    intro: '覆盖任务分配、报告处理、会诊与追踪等医生侧操作。',
    processSummary: '诊断分配 → 工作站处理 → 报告发放 → 会诊追踪',
    sections: [
      {
        sectionId: 'report',
        title: '病理报告',
        summary: '查看报告列表并执行发布。',
        subsections: [
          {
            subsectionId: 'report-list',
            title: '查看报告列表',
            path: '/doctor-workflow/report',
            role: 'admin',
            steps: ['打开病理报告页。', '按病例号筛选报告列表。'],
            expected: '列表展示当前病例的报告版本。',
            screenshotNames: ['m4-report-list'],
          },
        ],
      },
    ],
  },
  {
    key: 'm5-operation-support',
    title: 'M5 运营支持',
    order: 50,
    intro: '覆盖归档、借记、设备、试剂与医疗废物等支持性业务。',
    processSummary: '归档管理 → 借记处理 → 资源维护',
    sections: [
      {
        sectionId: 'archive',
        title: '归档管理',
        summary: '核对归档台账与存放位置。',
        subsections: [
          {
            subsectionId: 'archive-list',
            title: '查看归档台账',
            path: '/operation-support/archive',
            role: 'admin',
            steps: ['打开归档管理页。'],
            expected: '列表展示可查询的归档对象。',
            screenshotNames: ['m5-archive-list'],
          },
        ],
      },
    ],
  },
  {
    key: 'm6-statistics',
    title: 'M6 数据统计与分析',
    order: 60,
    intro: '覆盖统计仪表盘、质控指标和统计报表工作台。',
    processSummary: '统计仪表盘 → 指标查看 → 报表分析',
    sections: [
      {
        sectionId: 'dashboard',
        title: '统计仪表盘',
        summary: '查看核心统计指标。',
        subsections: [
          {
            subsectionId: 'm6-dashboard',
            title: '查看统计仪表盘',
            path: '/m6/dashboard',
            role: 'm6',
            steps: ['打开统计仪表盘。'],
            expected: '页面展示工作量、运营和质控指标。',
            screenshotNames: ['m6-dashboard'],
          },
        ],
      },
    ],
  },
  {
    key: 'm1-system',
    title: 'M1 系统管理',
    order: 70,
    intro: '覆盖用户、角色、字典、配置与日志等系统级配置操作。',
    processSummary: '基础字典维护 → 权限配置 → 日志审计',
    sections: [
      {
        sectionId: 'users',
        title: '系统用户',
        summary: '维护账号与岗位。',
        subsections: [
          {
            subsectionId: 'user-list',
            title: '查看用户列表',
            path: '/system/users',
            role: 'admin',
            steps: ['打开系统用户页。'],
            expected: '列表展示系统用户与岗位信息。',
            screenshotNames: ['m1-user-list'],
          },
        ],
      },
    ],
  },
];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { force: true, recursive: true });
  }
});

describe('generateUserManual', () => {
  it('generates handbook skeletons for all modules when no screenshots are captured', async () => {
    const tempDir = createTempDir();
    tempDirs.push(tempDir);

    const stageRoot = createStageRoot(tempDir);
    const manualRoot = path.join(tempDir, 'docs', 'user-manual');
    const renderRoot = path.join(tempDir, 'rendered');
    writeManifest(stageRoot, []);
    writeErrorLog(stageRoot);

    const result = await generateUserManual({
      manualRoot,
      moduleSpecs: TEST_MODULE_SPECS,
      renderRoot,
      stageRoot,
    });

    expect(result.moduleKeys).toEqual([
      'dashboard',
      'm2-specimen-workflow',
      'm3-production-management',
      'm4-doctor-workflow',
      'm5-operation-support',
      'm6-statistics',
      'm1-system',
    ]);

    const readme = readManualFile(manualRoot, 'README.md');
    const m3Manual = readManualFile(manualRoot, 'm3-production-management.md');

    expect(readme).toContain('- [M3 制片管理](m3-production-management.md)');
    expect(readme).toContain('流程：包埋 → 切片 → 染色 → 封片');
    expect(m3Manual).toContain('### 1.包埋工作站');
    expect(m3Manual).toContain('#### 1.1 进入包埋工作站');
    expect(m3Manual).toContain(
      '> 本节尚未捕获截图；请先运行 `pnpm manual:capture` 补齐。',
    );
  });

  it('renders structured static modules with section and subsection headings plus screenshot groups', async () => {
    const tempDir = createTempDir();
    tempDirs.push(tempDir);

    const stageRoot = createStageRoot(tempDir);
    const manualRoot = path.join(tempDir, 'docs', 'user-manual');
    const renderRoot = path.join(tempDir, 'rendered');
    writeManifest(stageRoot, [
      {
        caption: '包埋工作站总览',
        image: 'images/m3/embedding-overview.png',
        module: 'm3-production-management',
        order: 1,
        sectionId: 'embedding',
        subsectionId: 'embedding-entry',
      },
      {
        caption: '按病理号筛选待包埋任务',
        image: 'images/m3/embedding-filter.png',
        module: 'm3-production-management',
        order: 2,
        sectionId: 'embedding',
        subsectionId: 'embedding-entry',
      },
    ]);
    writeErrorLog(stageRoot);

    await generateUserManual({
      manualRoot,
      moduleSpecs: TEST_MODULE_SPECS,
      renderRoot,
      stageRoot,
    });

    const m3Manual = readManualFile(manualRoot, 'm3-production-management.md');

    expect(m3Manual).toContain('流程：包埋 → 切片 → 染色 → 封片');
    expect(m3Manual).toContain('### 1.包埋工作站');
    expect(m3Manual).toContain('#### 1.1 进入包埋工作站');
    expect(m3Manual).toContain('菜单路径：制片管理 -> 包埋工作站');
    expect(m3Manual).toContain('页面地址：`/technical-workflow/embedding`');
    expect(m3Manual).toContain('适用角色：`embedding-tech`');
    expect(m3Manual).toContain('角色说明：建议使用包埋岗位账号查看完整列表。');
    expect(m3Manual).toContain('1. 打开包埋工作站。');
    expect(m3Manual).toContain('2. 按病理号或申请单筛选待包埋任务。');
    expect(m3Manual).toContain('可选操作：查看待处理任务；按病理号筛选');
    expect(m3Manual).toContain(
      '预期结果：列表展示待包埋任务，并可进入包埋处理。',
    );
    expect(m3Manual).toContain(
      '![包埋工作站总览](images/m3/embedding-overview.png)',
    );
    expect(m3Manual).toContain(
      '![按病理号筛选待包埋任务](images/m3/embedding-filter.png)',
    );
  });

  it('renders auth_failed and capture_failed as subsection placeholders instead of normal screenshots', async () => {
    const tempDir = createTempDir();
    tempDirs.push(tempDir);

    const stageRoot = createStageRoot(tempDir);
    const manualRoot = path.join(tempDir, 'docs', 'user-manual');
    const renderRoot = path.join(tempDir, 'rendered');
    writeManifest(stageRoot, [
      {
        caption: '进入包埋工作站失败',
        module: 'm3-production-management',
        order: 1,
        sectionId: 'embedding',
        status: 'auth_failed',
        subsectionId: 'embedding-entry',
        warning: '登录态已过期',
      },
      {
        caption: '包埋确认截图失败',
        module: 'm3-production-management',
        order: 2,
        sectionId: 'embedding',
        status: 'capture_failed',
        subsectionId: 'embedding-complete',
        warning: 'timeout',
      },
    ]);
    writeErrorLog(
      stageRoot,
      '[2026-06-29T00:00:00.000Z] m3-production-management/embedding-entry: AUTH_FAILED\n',
    );

    await generateUserManual({
      manualRoot,
      moduleSpecs: TEST_MODULE_SPECS,
      renderRoot,
      stageRoot,
    });

    const m3Manual = readManualFile(manualRoot, 'm3-production-management.md');

    expect(m3Manual).toContain('本节因认证失效未生成截图');
    expect(m3Manual).toContain('本节截图捕获失败');
    expect(m3Manual).not.toContain('![进入包埋工作站失败]');
    expect(m3Manual).not.toContain('![包埋确认截图失败]');
  });

  it('renders README module index with M3 M4 M5 M6 and M1 entries', async () => {
    const tempDir = createTempDir();
    tempDirs.push(tempDir);

    const stageRoot = createStageRoot(tempDir);
    const manualRoot = path.join(tempDir, 'docs', 'user-manual');
    const renderRoot = path.join(tempDir, 'rendered');
    writeManifest(stageRoot, []);
    writeErrorLog(stageRoot);

    await generateUserManual({
      manualRoot,
      moduleSpecs: TEST_MODULE_SPECS,
      renderRoot,
      stageRoot,
    });

    const readme = readManualFile(manualRoot, 'README.md');

    expect(readme).toContain('- [M3 制片管理](m3-production-management.md)');
    expect(readme).toContain('- [M4 诊断管理](m4-doctor-workflow.md)');
    expect(readme).toContain('- [M5 运营支持](m5-operation-support.md)');
    expect(readme).toContain('- [M6 数据统计与分析](m6-statistics.md)');
    expect(readme).toContain('- [M1 系统管理](m1-system.md)');
  });

  it('keeps rendering when manifest only includes legacy caption name order and image fields', async () => {
    const tempDir = createTempDir();
    tempDirs.push(tempDir);

    const stageRoot = createStageRoot(tempDir);
    const manualRoot = path.join(tempDir, 'docs', 'user-manual');
    const renderRoot = path.join(tempDir, 'rendered');
    writeManifest(stageRoot, [
      {
        caption: '旧链路兼容截图',
        image: 'images/m3/legacy-entry.png',
        module: 'm3-production-management',
        name: 'legacy-entry-shot',
        order: 1,
      },
    ]);
    writeErrorLog(stageRoot);

    await generateUserManual({
      manualRoot,
      moduleSpecs: TEST_MODULE_SPECS,
      renderRoot,
      stageRoot,
    });

    const m3Manual = readManualFile(manualRoot, 'm3-production-management.md');

    expect(m3Manual).toContain('#### 1.1 进入包埋工作站');
    expect(m3Manual).toContain('![旧链路兼容截图](images/m3/legacy-entry.png)');
  });
});
