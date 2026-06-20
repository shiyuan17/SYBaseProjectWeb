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
      eventContent: '创建转运单',
      eventStatus: 'SUCCESS',
      eventTime: '2026-05-24T08:00:00',
      eventType: 'ORDER_CREATED',
      nodeCode: 'TRANSPORT',
      operatorIp: '10.0.0.1',
      operatorName: '李医生',
      specimenBarcode: 'BC-001',
      specimenId: 'SPEC-001',
      specimenNo: 'SP-001',
      sourceTerminal: 'TERMINAL-1',
    },
    {
      eventContent: '创建转运单',
      eventStatus: 'SUCCESS',
      eventTime: '2026-05-24T08:00:00',
      eventType: 'ORDER_CREATED',
      nodeCode: 'TRANSPORT',
      operatorIp: '10.0.0.2',
      operatorName: '王护士',
      specimenBarcode: 'BC-002',
      specimenId: 'SPEC-002',
      specimenNo: 'SP-002',
      sourceTerminal: 'TERMINAL-2',
    },
    {
      eventContent: '打印转运单',
      eventStatus: 'SUCCESS',
      eventTime: '2026-05-24T08:01:00',
      eventType: 'ORDER_PRINTED',
      nodeCode: 'TRANSPORT',
      operatorName: '前台',
      specimenBarcode: null,
      specimenId: null,
      specimenNo: null,
      sourceTerminal: 'TERMINAL-3',
    },
  ];
}

async function mountTabs(props: Record<string, unknown> = {}) {
  const container = document.createElement('div');
  document.body.append(container);

  const activeTab = ref('overall');
  const specimens = [
    createSpecimen(),
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

describe('TrackingApplicationTimelineTabs', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('renders overall timeline groups with structured metadata', async () => {
    const wrapper = await mountTabs();

    expect(wrapper.container.textContent).toContain('总时间线');
    expect(wrapper.container.textContent).toContain('公共事件');
    expect(wrapper.container.textContent).toContain('SP-001');
    expect(wrapper.container.textContent).toContain('时间');
    expect(wrapper.container.textContent).toContain('操作人');
    expect(wrapper.container.textContent).toContain('IP');
    expect(wrapper.container.textContent).toContain('事件');
    expect(wrapper.container.textContent).not.toContain('节点:');
    expect(wrapper.container.textContent).not.toContain('终端');

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
    ).toContain('创建转运单 / 成功');
    expect(
      wrapper.container.querySelector('[data-tab-panel="SPEC-001"]')
        ?.textContent ?? '',
    ).not.toContain('公共事件');

    wrapper.unmount();
  });
});
