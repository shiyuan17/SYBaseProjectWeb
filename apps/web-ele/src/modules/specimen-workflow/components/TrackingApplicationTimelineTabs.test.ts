import type {
  SpecimenTrackingSummary,
  TrackingEventView,
} from '../types/specimen-workflow';

import { createApp, h, nextTick, ref } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createEmptyStub,
  createPassthroughStub,
  createTabPaneStub,
  createTabsStub,
  createTagStub,
  createTimelineItemStub,
} from '../test-utils/component-stubs';
import { buildSpecimenTimelineTabs } from '../utils/tracking-application-list';
import { buildTrackingTimelineData } from '../utils/tracking-timeline';

const tabsContextKey = vi.hoisted(() => Symbol('tracking-application-tabs'));

vi.mock('element-plus', () => ({
  ElEmpty: createEmptyStub(),
  ElTabPane: createTabPaneStub(tabsContextKey),
  ElTabs: createTabsStub(tabsContextKey),
  ElTag: createTagStub(),
  ElTimeline: createPassthroughStub('ul'),
  ElTimelineItem: createTimelineItemStub(),
}));

import TrackingApplicationTimelineTabs from './TrackingApplicationTimelineTabs.vue';

function createSpecimen(
  overrides: Partial<SpecimenTrackingSummary> = {},
): SpecimenTrackingSummary {
  return {
    abnormalReason: null,
    barcode: 'BC-001',
    barcodeBindingStatus: null,
    checkInStatus: null,
    checkedInAt: null,
    checkedInByName: null,
    clinicalSymptom: null,
    collectionMode: null,
    containerCount: 1,
    containerName: '试管',
    fixationStatus: 'FIXING',
    id: 'SPEC-001',
    labelPrintStatus: 'SUCCESS',
    qualityCheckResult: null,
    qualityIssueCodes: [],
    receiptStatus: null,
    specimenCount: 1,
    specimenName: '血样',
    specimenNo: 'SP-001',
    specimenSite: '血液',
    specimenStatus: 'REGISTERED',
    specimenType: '常规',
    verificationCompletedAt: null,
    verificationStartedAt: null,
    verificationStatus: null,
    ...overrides,
  };
}

function createEvents(): TrackingEventView[] {
  return [
    {
      eventContent: '离体确认',
      eventStatus: 'SUCCESS',
      eventTime: '2026-05-24T07:55:00',
      eventType: 'COMPLETED',
      nodeCode: 'REMOVAL',
      operatorDevice: 'Removal Timeline Browser',
      operatorIp: '10.0.0.0',
      operatorName: '离体员',
      specimenBarcode: 'BC-001',
      specimenId: 'SPEC-001',
      specimenNo: 'SP-001',
      sourceTerminal: 'TERMINAL-0',
    },
    {
      eventContent: 'Registered specimen 组织',
      eventStatus: 'SUCCESS',
      eventTime: '2026-05-24T08:00:00',
      eventType: 'REGISTERED',
      nodeCode: 'SPECIMEN_COLLECTION',
      operatorDevice: 'Chrome Timeline Browser',
      operatorIp: '10.0.0.1',
      operatorName: '登记员',
      specimenBarcode: 'BC-001',
      specimenId: 'SPEC-001',
      specimenNo: 'SP-001',
      sourceTerminal: 'TERMINAL-1',
    },
    {
      eventContent: '完成固定',
      eventStatus: 'SUCCESS',
      eventTime: '2026-05-24T08:02:00',
      eventType: 'COMPLETED',
      nodeCode: 'FIXATION',
      operatorDevice: 'Edge Timeline Browser',
      operatorIp: '10.0.0.2',
      operatorName: '固定员',
      specimenBarcode: 'BC-001',
      specimenId: 'SPEC-001',
      specimenNo: 'SP-001',
      sourceTerminal: 'TERMINAL-2',
    },
    {
      eventContent: '执行入库',
      eventStatus: 'SUCCESS',
      eventTime: '2026-05-24T08:03:00',
      eventType: 'CHECKED_IN',
      nodeCode: 'CHECK_IN',
      operatorDevice: 'Firefox Timeline Browser',
      operatorIp: '10.0.0.3',
      operatorName: '入库员',
      specimenBarcode: 'BC-001',
      specimenId: 'SPEC-001',
      specimenNo: 'SP-001',
      sourceTerminal: 'TERMINAL-3',
    },
    {
      eventContent: '创建转运单',
      eventStatus: 'SUCCESS',
      eventTime: '2026-05-24T08:04:00',
      eventType: 'ORDER_CREATED',
      nodeCode: 'TRANSPORT',
      operatorDevice: 'Safari Timeline Browser',
      operatorIp: '10.0.0.4',
      operatorName: '物流员',
      specimenBarcode: 'BC-002',
      specimenId: 'SPEC-002',
      specimenNo: 'SP-002',
      sourceTerminal: 'TERMINAL-4',
    },
  ];
}

async function mountTabs(props: Record<string, unknown> = {}) {
  const container = document.createElement('div');
  document.body.append(container);

  const activeTab = ref('overall');
  const specimens = [
    createSpecimen({
      checkedInAt: '2026-05-24T08:03:00',
      checkedInByName: '入库员',
      fixationCompletedAt: '2026-05-24T08:02:00',
      fixationLiquidType: '10%中性福尔马林',
      fixationOperatorName: '固定员',
      registeredAt: '2026-05-24T08:00:00',
      registeredByName: '登记员',
      registrationEvaluationItems: '合格',
      specimenConfirmedAt: '2026-05-24T08:05:00',
      specimenRemovalAt: '2026-05-24T07:55:00',
      specimenRemovalOperatorName: '离体员',
      specimenSize: '2cm x 1cm',
      verifiedByName: '核对员',
      verificationCompletedAt: '2026-05-24T08:01:00',
      verificationStatus: 'VERIFIED',
    }),
    createSpecimen({ id: 'SPEC-002', specimenNo: 'SP-002', barcode: 'BC-002' }),
  ];
  const trackingTimelineData = buildTrackingTimelineData(
    createEvents(),
    specimens,
  );
  const specimenTimelineTabs = buildSpecimenTimelineTabs(
    specimens,
    trackingTimelineData,
  );

  const app = createApp({
    render() {
      return h(TrackingApplicationTimelineTabs, {
        detailRecentEventsCount: 3,
        modelValue: activeTab.value,
        specimens,
        specimenTimelineTabs,
        trackingTimelineData,
        'onUpdate:modelValue': (value: string) => {
          activeTab.value = value;
        },
        ...props,
      });
    },
  });

  app.mount(container);
  await nextTick();

  return {
    container,
    unmount() {
      app.unmount();
      container.remove();
    },
  };
}

function textBetween(text: string, start: string, end: string) {
  const startIndex = text.indexOf(start);
  if (startIndex === -1) {
    return '';
  }
  if (!end) {
    return text.slice(startIndex);
  }
  const endIndex = text.indexOf(end, startIndex + start.length);
  return endIndex === -1
    ? text.slice(startIndex)
    : text.slice(startIndex, endIndex);
}

describe('TrackingApplicationTimelineTabs', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('renders overall timeline groups with structured metadata', async () => {
    const wrapper = await mountTabs();

    expect(wrapper.container.textContent).toContain('总时间线');
    expect(wrapper.container.textContent).toContain('SP-001');
    expect(wrapper.container.textContent).toContain('时间');
    expect(wrapper.container.textContent).toContain('操作人');
    expect(wrapper.container.textContent).toContain('IP');
    expect(wrapper.container.textContent).toContain('设备');
    expect(wrapper.container.textContent).toContain('事件');
    expect(wrapper.container.textContent).not.toContain('节点:');
    expect(wrapper.container.textContent).not.toContain('终端');

    wrapper.unmount();
  });

  it('localizes common event codes without exposing English codes', async () => {
    const specimens = [createSpecimen()];
    const events: TrackingEventView[] = [
      {
        eventContent: null,
        eventStatus: 'SUCCESS',
        eventTime: '2026-05-24T08:10:00',
        eventType: 'START',
        nodeCode: 'FIXATION',
        operatorName: '固定员',
        sourceTerminal: 'TERMINAL-1',
        specimenId: 'SPEC-001',
        specimenNo: 'SP-001',
      },
      {
        eventContent: null,
        eventStatus: 'SUCCESS',
        eventTime: '2026-05-24T08:11:00',
        eventType: 'COMPLETE',
        nodeCode: 'FIXATION',
        operatorName: '固定员',
        sourceTerminal: 'TERMINAL-1',
        specimenId: 'SPEC-001',
        specimenNo: 'SP-001',
      },
      {
        eventContent: null,
        eventStatus: 'SUCCESS',
        eventTime: '2026-05-24T08:12:00',
        eventType: 'UPLOAD_MEDIA',
        nodeCode: 'GROSSING',
        operatorName: '取材员',
        sourceTerminal: 'TERMINAL-2',
        specimenId: 'SPEC-001',
        specimenNo: 'SP-001',
      },
      {
        eventContent: null,
        eventStatus: 'SUCCESS',
        eventTime: '2026-05-24T08:13:00',
        eventType: 'CREATE',
        nodeCode: 'GROSSING',
        operatorName: '取材员',
        sourceTerminal: 'TERMINAL-2',
        specimenId: 'SPEC-001',
        specimenNo: 'SP-001',
      },
    ];
    const trackingTimelineData = buildTrackingTimelineData(events, specimens);
    const wrapper = await mountTabs({
      detailRecentEventsCount: events.length,
      specimens,
      specimenTimelineTabs: buildSpecimenTimelineTabs(
        specimens,
        trackingTimelineData,
      ),
      trackingTimelineData,
    });

    const overallText =
      wrapper.container.querySelector('[data-tab-panel="overall"]')
        ?.textContent ?? '';
    expect(overallText).toContain('固定 / 成功');
    expect(overallText).toContain('取材 / 成功');
    expect(overallText).toContain('开始固定');
    expect(overallText).toContain('完成固定');
    expect(overallText).toContain('上传影像');
    expect(overallText).toContain('创建');
    expect(overallText).not.toMatch(/START|COMPLETE|UPLOAD_MEDIA|CREATE/);

    wrapper.unmount();
  });

  it('shows same-node start and complete events in one overall card', async () => {
    const specimens = [createSpecimen()];
    const events: TrackingEventView[] = [
      {
        eventContent: null,
        eventStatus: 'SUCCESS',
        eventTime: '2026-05-24T08:10:00',
        eventType: 'START',
        nodeCode: 'FIXATION',
        operatorDevice: '固定终端',
        operatorName: '固定员',
        sourceTerminal: 'TERMINAL-1',
        specimenId: 'SPEC-001',
        specimenNo: 'SP-001',
      },
      {
        eventContent: null,
        eventStatus: 'SUCCESS',
        eventTime: '2026-05-24T08:11:00',
        eventType: 'COMPLETE',
        nodeCode: 'FIXATION',
        operatorDevice: '固定终端',
        operatorName: '固定员',
        sourceTerminal: 'TERMINAL-1',
        specimenId: 'SPEC-001',
        specimenNo: 'SP-001',
      },
    ];
    const trackingTimelineData = buildTrackingTimelineData(events, specimens);
    const wrapper = await mountTabs({
      detailRecentEventsCount: events.length,
      specimens,
      specimenTimelineTabs: buildSpecimenTimelineTabs(
        specimens,
        trackingTimelineData,
      ),
      trackingTimelineData,
    });

    const overallPanel = wrapper.container.querySelector(
      '[data-tab-panel="overall"]',
    );
    expect(overallPanel?.querySelectorAll('li')).toHaveLength(1);
    expect(overallPanel?.textContent ?? '').toContain('开始固定；完成固定');

    wrapper.unmount();
  });

  it('shows specimen-specific events when selecting a specimen tab', async () => {
    const wrapper = await mountTabs();

    wrapper.container
      .querySelector<HTMLButtonElement>('[data-tab-name="SPEC-001"]')
      ?.click();
    await nextTick();

    expect(
      wrapper.container.querySelector('[data-tab-panel="SPEC-001"]')
        ?.textContent ?? '',
    ).toContain('标本登记 / 成功');
    expect(
      wrapper.container.querySelector('[data-tab-panel="SPEC-001"]')
        ?.textContent ?? '',
    ).not.toContain('公共事件');

    const specimenText =
      wrapper.container.querySelector('[data-tab-panel="SPEC-001"]')
        ?.textContent ?? '';
    const registrationBlock = textBetween(
      specimenText,
      '事件登记标本 组织',
      '事件完成固定',
    );
    expect(registrationBlock).toContain('登记人');
    expect(registrationBlock).not.toContain('固定液');
    expect(registrationBlock).not.toContain('入库操作人');

    const fixationBlock = textBetween(
      specimenText,
      '事件完成固定',
      '事件执行入库',
    );
    expect(fixationBlock).toContain('固定液');
    expect(fixationBlock).not.toContain('登记人');
    expect(fixationBlock).not.toContain('入库时间');

    const checkInBlock =
      specimenText.match(/标本入库 \/ 成功[\s\S]*$/)?.[0] ?? '';
    expect(checkInBlock).toContain('入库操作人');
    expect(checkInBlock).not.toContain('登记人');
    expect(checkInBlock).not.toContain('固定液');

    wrapper.unmount();
  });

  it('renders only the detail fields that belong to each timeline node', async () => {
    const wrapper = await mountTabs();
    const overallText =
      wrapper.container.querySelector('[data-tab-panel="overall"]')
        ?.textContent ?? '';

    const registrationBlock = textBetween(
      overallText,
      '事件登记标本 组织',
      '事件完成固定',
    );
    expect(registrationBlock).toContain('登记人');
    expect(registrationBlock).toContain('登记员');
    expect(registrationBlock).toContain('标本名称');
    expect(registrationBlock).toContain('血样');
    expect(registrationBlock).not.toContain('固定液');
    expect(registrationBlock).not.toContain('入库操作人');

    const fixationBlock = textBetween(
      overallText,
      '事件完成固定',
      '事件执行入库',
    );
    expect(fixationBlock).toContain('固定液');
    expect(fixationBlock).toContain('10%中性福尔马林');
    expect(fixationBlock).toContain('固定人');
    expect(fixationBlock).not.toContain('登记人');
    expect(fixationBlock).not.toContain('入库时间');

    const checkInBlock = textBetween(
      overallText,
      '事件执行入库',
      '事件创建转运单',
    );
    expect(checkInBlock).toContain('入库操作人');
    expect(checkInBlock).toContain('入库员');
    expect(checkInBlock).toContain('入库时间');
    expect(checkInBlock).not.toContain('固定液');
    expect(checkInBlock).not.toContain('登记人');

    const transportBlock = textBetween(
      overallText,
      'Safari Timeline Browser',
      '',
    );
    expect(transportBlock).toContain('Safari Timeline Browser');
    expect(transportBlock).toContain('事件');
    expect(transportBlock).not.toContain('登记人');
    expect(transportBlock).not.toContain('固定液');
    expect(transportBlock).not.toContain('入库操作人');

    const removalBlock = textBetween(
      overallText,
      'Removal Timeline Browser',
      'Chrome Timeline Browser',
    );
    expect(removalBlock).toContain('离体操作人');
    expect(removalBlock).toContain('离体员');
    expect(removalBlock).toContain('离体时间');
    expect(removalBlock).toContain('Removal Timeline Browser');
    expect(removalBlock).not.toContain('固定液');
    expect(removalBlock).not.toContain('登记人');

    wrapper.unmount();
  });
});
