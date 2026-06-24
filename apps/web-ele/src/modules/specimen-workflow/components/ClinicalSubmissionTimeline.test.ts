import type {
  SpecimenTrackingSummary,
  TrackingEventView,
} from '../types/specimen-workflow';

import { createApp, h, nextTick } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createEmptyStub,
  createTabPaneStub,
  createTabsStub,
  createTagStub,
} from '../test-utils/component-stubs';

const tabsContextKey = vi.hoisted(() => Symbol('tabs'));

vi.mock('element-plus', () => ({
  ElEmpty: createEmptyStub(),
  ElTabPane: createTabPaneStub(tabsContextKey),
  ElTabs: createTabsStub(tabsContextKey),
  ElTag: createTagStub(),
}));

import ClinicalSubmissionTimeline from './ClinicalSubmissionTimeline.vue';

function createSpecimen(
  overrides: Partial<SpecimenTrackingSummary> = {},
): SpecimenTrackingSummary {
  return {
    abnormalReason: null,
    barcode: 'A1',
    checkInStatus: 'CHECKED_IN',
    checkedInAt: '2026-06-18T10:30:00',
    checkedInByName: '入库员',
    containerCount: 1,
    containerName: '标本瓶',
    fixationCompletedAt: '2026-06-18T09:30:00',
    fixationLiquidType: '10%中性福尔马林',
    fixationOperatorName: '固定员',
    fixationStatus: 'COMPLETED',
    id: 'SPEC-001',
    labelPrintStatus: 'SUCCESS',
    qualityIssueCodes: [],
    specimenConfirmedAt: '2026-06-18T10:00:00',
    specimenCount: 1,
    specimenName: '胃组织',
    specimenNo: 'A',
    specimenRemovalAt: '2026-06-18T08:30:00',
    specimenSite: '胃',
    specimenStatus: 'IN_TRANSIT',
    specimenType: '常规',
    verifiedByName: '确认员',
    ...overrides,
  };
}

const events: TrackingEventView[] = [
  {
    eventContent: '登记标本',
    eventStatus: 'SUCCESS',
    eventTime: '2026-06-18T08:00:00',
    eventType: 'REGISTERED',
    nodeCode: 'SPECIMEN_COLLECTION',
    operatorDevice: 'Chrome 125 / Windows',
    operatorIp: '10.0.0.1',
    operatorName: '采集员',
    sourceTerminal: 'T-1',
    specimenId: 'SPEC-001',
  },
  {
    eventContent: '离体确认',
    eventStatus: 'SUCCESS',
    eventTime: '2026-06-18T08:30:00',
    eventType: 'COMPLETED',
    nodeCode: 'REMOVAL',
    operatorDevice: 'Edge 125 / Windows',
    operatorIp: '10.0.0.2',
    operatorName: '离体员',
    sourceTerminal: 'T-2',
    specimenId: 'SPEC-001',
  },
  {
    eventContent: '完成固定',
    eventStatus: 'SUCCESS',
    eventTime: '2026-06-18T09:30:00',
    eventType: 'COMPLETED',
    nodeCode: 'FIXATION',
    operatorDevice: 'Firefox 126 / Windows',
    operatorIp: '10.0.0.3',
    operatorName: '固定员',
    sourceTerminal: 'T-3',
    specimenId: 'SPEC-001',
  },
  {
    eventContent: '完成确认',
    eventStatus: 'SUCCESS',
    eventTime: '2026-06-18T10:00:00',
    eventType: 'COMPLETED',
    nodeCode: 'CONFIRMATION',
    operatorDevice: 'Safari 17 / macOS',
    operatorIp: '10.0.0.4',
    operatorName: '确认员',
    sourceTerminal: 'T-4',
    specimenId: 'SPEC-001',
  },
  {
    eventContent: '执行入库',
    eventStatus: 'SUCCESS',
    eventTime: '2026-06-18T10:30:00',
    eventType: 'CHECKED_IN',
    nodeCode: 'CHECK_IN',
    operatorDevice: 'Chrome 125 / Linux',
    operatorIp: '10.0.0.5',
    operatorName: '入库员',
    sourceTerminal: 'T-5',
    specimenId: 'SPEC-001',
  },
  {
    eventContent: '出库完成',
    eventStatus: 'SUCCESS',
    eventTime: '2026-06-18T11:00:00',
    eventType: 'HANDED_OVER',
    nodeCode: 'TRANSPORT',
    operatorDevice: 'Edge 126 / Windows',
    operatorIp: '10.0.0.6',
    operatorName: '出库员',
    sourceTerminal: 'T-6',
    specimenId: 'SPEC-001',
  },
  {
    eventContent: '登记第二个标本',
    eventStatus: 'SUCCESS',
    eventTime: '2026-06-18T08:10:00',
    eventType: 'REGISTERED',
    nodeCode: 'SPECIMEN_COLLECTION',
    operatorDevice: 'Chrome 126 / Windows',
    operatorIp: '10.0.1.1',
    operatorName: '采集员乙',
    sourceTerminal: 'T-7',
    specimenId: 'SPEC-002',
  },
];

async function mountTimeline(props: Record<string, unknown> = {}) {
  const root = document.createElement('div');
  document.body.append(root);
  const app = createApp({
    render: () =>
      h(ClinicalSubmissionTimeline, {
        applicationNo: 'AP202606180001',
        events,
        patientId: 'PAT-001',
        patientName: '张三',
        specimens: [
          createSpecimen({
            outboundAt: '2026-06-18T11:00:00',
            outboundUserName: '出库员',
          }),
          createSpecimen({
            barcode: 'B1',
            id: 'SPEC-002',
            specimenNo: 'B',
          }),
        ],
        ...props,
      }),
  });
  app.mount(root);
  await nextTick();
  return { app, root };
}

describe('ClinicalSubmissionTimeline', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders one clinical submission timeline tab per specimen', async () => {
    const { app, root } = await mountTimeline();

    expect(root.textContent).toContain('临床送检');
    const tabButtons = [...root.querySelectorAll('button[data-tab-name]')].map(
      (button) => button.textContent?.trim(),
    );
    expect(tabButtons).toEqual(['A', 'B']);
    for (const stage of [
      '标本采集',
      '离体确认',
      '标本固定',
      '标本确认',
      '标本入库',
      '标本出库',
    ]) {
      expect(root.textContent).toContain(stage);
    }
    expect(root.textContent).toContain('IP');
    expect(root.textContent).toContain('10.0.0.1');
    expect(root.textContent).toContain('浏览器信息');
    expect(root.textContent).toContain('Chrome 125 / Windows');
    expect(root.textContent).toContain('申请单号：AP202606180001');
    expect(root.textContent).toContain('姓名：张三');
    expect(root.textContent).toContain('患者ID：PAT-001');
    expect(root.textContent).toContain('条码绑定：A-A1');
    expect(root.textContent).toContain('离体时间：2026-06-18 08:30:00');
    expect(root.textContent).toContain('固定液类型：10%中性福尔马林');
    expect(root.textContent).toContain('固定时间：2026-06-18 09:30:00');
    expect(root.textContent).toContain('固定人：固定员');
    expect(root.textContent).toContain('确认时间：2026-06-18 10:00:00');
    expect(root.textContent).toContain('确认人：确认员');
    expect(root.textContent).toContain('入库时间：2026-06-18 10:30:00');
    expect(root.textContent).toContain('入库人：入库员');
    expect(root.textContent).toContain('出库时间：2026-06-18 11:00:00');
    expect(root.textContent).toContain('出库人：出库员');
    expect(root.textContent).not.toContain('条码绑定：B-B1');
    expect(root.textContent).not.toContain('10.0.1.1');

    app.unmount();
  });

  it('switches tabs to show only the selected specimen timeline context', async () => {
    const { app, root } = await mountTimeline();

    const secondTab = [
      ...root.querySelectorAll<HTMLButtonElement>('button'),
    ].find((button) => button.textContent?.trim() === 'B');
    secondTab?.click();
    await nextTick();

    expect(root.textContent).toContain('条码绑定：B-B1');
    expect(root.textContent).toContain('IP：10.0.1.1');
    expect(root.textContent).toContain('浏览器信息：Chrome 126 / Windows');
    expect(root.textContent).not.toContain('条码绑定：A-A1');
    expect(root.textContent).not.toContain('IP：10.0.0.1');

    app.unmount();
  });

  it('does not leak unbound stage events into multi-specimen tabs', async () => {
    const { app, root } = await mountTimeline({
      events: [
        ...events,
        {
          eventContent: '未绑定出库',
          eventStatus: 'SUCCESS',
          eventTime: '2026-06-18T12:00:00',
          eventType: 'HANDED_OVER',
          nodeCode: 'TRANSPORT',
          operatorDevice: 'Edge 127 / Windows',
          operatorIp: '10.0.9.9',
          operatorName: '未绑定操作员',
          sourceTerminal: 'T-9',
          specimenBarcode: null,
          specimenId: null,
          specimenNo: null,
        },
      ],
    });

    expect(root.textContent).not.toContain('10.0.9.9');
    expect(root.textContent).not.toContain('Edge 127 / Windows');

    const secondTab = [
      ...root.querySelectorAll<HTMLButtonElement>('button'),
    ].find((button) => button.textContent?.trim() === 'B');
    secondTab?.click();
    await nextTick();

    expect(root.textContent).not.toContain('10.0.9.9');
    expect(root.textContent).not.toContain('Edge 127 / Windows');

    app.unmount();
  });

  it('joins same-stage event IP and browser values for the selected specimen', async () => {
    const { app, root } = await mountTimeline({
      events: [
        {
          eventContent: '标本入库一',
          eventStatus: 'SUCCESS',
          eventTime: '2026-06-18T10:20:00',
          eventType: 'CHECKED_IN',
          nodeCode: 'CHECK_IN',
          operatorDevice: 'Chrome 125 / Windows',
          operatorIp: '10.0.0.5',
          operatorName: '入库员甲',
          sourceTerminal: 'T-5',
          specimenId: 'SPEC-001',
        },
        {
          eventContent: '标本入库二',
          eventStatus: 'SUCCESS',
          eventTime: '2026-06-18T10:30:00',
          eventType: 'CHECKED_IN',
          nodeCode: 'CHECK_IN',
          operatorDevice: 'Edge 126 / Windows',
          operatorIp: '10.0.0.8',
          operatorName: '入库员乙',
          sourceTerminal: 'T-8',
          specimenId: 'SPEC-001',
        },
      ],
      specimens: [createSpecimen()],
    });

    expect(root.textContent).toContain('IP：10.0.0.5、10.0.0.8');
    expect(root.textContent).toContain(
      '浏览器信息：Chrome 125 / Windows、Edge 126 / Windows',
    );

    app.unmount();
  });

  it('prefers specimenNo as tab label and falls back to barcode then id', async () => {
    const { app, root } = await mountTimeline({
      events: [],
      specimens: [
        createSpecimen({
          barcode: 'BAR-001',
          id: 'SPEC-LABEL-001',
          specimenNo: 'NO-001',
        }),
        createSpecimen({
          barcode: 'BAR-002',
          id: 'SPEC-LABEL-002',
          specimenNo: '',
        }),
        createSpecimen({
          barcode: null,
          id: 'SPEC-LABEL-003',
          specimenNo: '',
        }),
      ],
    });

    const tabButtons = [...root.querySelectorAll('button[data-tab-name]')].map(
      (button) => button.textContent?.trim(),
    );
    expect(tabButtons).toEqual(['NO-001', 'BAR-002', 'SPEC-LABEL-003']);

    app.unmount();
  });

  it('keeps all stages visible and uses placeholders for missing data', async () => {
    const { app, root } = await mountTimeline({
      applicationNo: null,
      events: [],
      patientId: null,
      patientName: null,
      specimens: [createSpecimen({ barcode: null, specimenNo: 'C' })],
    });

    expect(root.textContent).toContain('临床送检');
    expect(root.textContent).toContain('标本出库');
    expect(root.textContent).toContain('患者ID：-');
    expect(root.textContent).toContain('条码绑定');
    expect(root.textContent).toContain('C');
    expect(root.textContent).toContain('出库时间：-');
    expect(root.textContent).toContain('出库人：-');

    app.unmount();
  });

  it('does not reuse unbound events across multiple specimen tabs', async () => {
    const { app, root } = await mountTimeline({
      events: [
        ...events,
        {
          eventContent: '公共登记事件',
          eventStatus: 'SUCCESS',
          eventTime: '2026-06-18T08:20:00',
          eventType: 'REGISTERED',
          nodeCode: 'SPECIMEN_COLLECTION',
          operatorDevice: '公共浏览器',
          operatorIp: '10.0.9.9',
          operatorName: '公共操作员',
          sourceTerminal: 'T-9',
          specimenBarcode: null,
          specimenId: null,
          specimenNo: null,
        },
      ],
    });

    expect(root.textContent).toContain('IP：10.0.0.1');
    expect(root.textContent).not.toContain('10.0.9.9');
    expect(root.textContent).not.toContain('公共浏览器');

    app.unmount();
  });

  it('uses unbound event context as fallback for a single specimen', async () => {
    const { app, root } = await mountTimeline({
      events: [
        {
          eventContent: '公共登记事件',
          eventStatus: 'SUCCESS',
          eventTime: '2026-06-18T08:20:00',
          eventType: 'REGISTERED',
          nodeCode: 'SPECIMEN_COLLECTION',
          operatorDevice: '公共浏览器',
          operatorIp: '10.0.9.9',
          operatorName: '公共操作员',
          sourceTerminal: 'T-9',
          specimenBarcode: null,
          specimenId: null,
          specimenNo: null,
        },
      ],
      specimens: [createSpecimen()],
    });

    expect(root.textContent).toContain('IP：10.0.9.9');
    expect(root.textContent).toContain('浏览器信息：公共浏览器');

    app.unmount();
  });
});
