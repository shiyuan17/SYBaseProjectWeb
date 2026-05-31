import type { LatestSpecimenRegistrationResult } from '../types/specimen-workflow';

import { createApp, h, nextTick } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createDescriptionsItemStub,
  createEmptyStub,
  createPassthroughStub,
  createTableColumnStub,
  createTableStub,
  createTagStub,
} from '../test-utils/component-stubs';

const tableRowContextKey = vi.hoisted(() =>
  Symbol('tracking-specimen-latest-registration-result-row'),
);

vi.mock('element-plus', () => ({
  ElDescriptions: createPassthroughStub('div'),
  ElDescriptionsItem: createDescriptionsItemStub(),
  ElEmpty: createEmptyStub(),
  ElTable: createTableStub(tableRowContextKey),
  ElTableColumn: createTableColumnStub(tableRowContextKey),
  ElTag: createTagStub(),
}));

import TrackingSpecimenLatestRegistrationResult from './TrackingSpecimenLatestRegistrationResult.vue';

function createResult(
  overrides: Partial<LatestSpecimenRegistrationResult> = {},
): LatestSpecimenRegistrationResult {
  return {
    applicationId: 'APP-1',
    labelPrintBatchNo: 'BATCH-1',
    labelPrintMessage: '存在失败',
    labelPrintSuccess: false,
    registrationSnapshot: null,
    specimens: [
      {
        abnormalReason: '容器破损',
        barcode: 'BC-1',
        barcodeBindingStatus: null,
        checkInStatus: null,
        checkedInAt: null,
        checkedInByName: null,
        clinicalSymptom: null,
        collectionMode: null,
        containerCount: 1,
        containerName: '试管',
        fixationStatus: 'FIXING',
        id: 'SPEC-1',
        labelPrintStatus: 'FAILED',
        qualityCheckResult: 'FAILED',
        qualityIssueCodes: ['CONTAINER_DAMAGE'],
        receiptStatus: 'REJECTED',
        specimenCount: 1,
        specimenName: '血样',
        specimenNo: 'SP-1',
        specimenSite: '血液',
        specimenStatus: 'REGISTERED',
        specimenType: '常规',
        verificationCompletedAt: null,
        verificationStartedAt: null,
        verificationStatus: null,
      },
    ],
    ...overrides,
  };
}

async function mountPanel(props: Record<string, unknown> = {}) {
  const container = document.createElement('div');
  document.body.append(container);

  const app = createApp({
    render() {
      return h(TrackingSpecimenLatestRegistrationResult, {
        result: createResult(),
        ...props,
      });
    },
  });

  app.directive('loading', {});
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

describe('TrackingSpecimenLatestRegistrationResult', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('renders latest batch details', async () => {
    const wrapper = await mountPanel();

    expect(wrapper.container.textContent).toContain('BATCH-1');
    expect(wrapper.container.textContent).toContain('BC-1');
    expect(wrapper.container.textContent).toContain('容器破损');

    wrapper.unmount();
  });

  it('renders empty state without batch result', async () => {
    const wrapper = await mountPanel({
      result: null,
    });

    expect(wrapper.container.textContent).toContain('暂无最近批次结果');

    wrapper.unmount();
  });
});
