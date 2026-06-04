import type { SpecimenManagementListItem } from '../types/specimen-workflow';

import { createApp, h, nextTick } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createButtonStub,
  createTableColumnStub,
  createTableStub,
  createTagStub,
} from '../test-utils/component-stubs';

const tableRowContextKey = vi.hoisted(() =>
  Symbol('tracking-specimen-list-table-row'),
);

vi.mock('element-plus', () => ({
  ElButton: createButtonStub(),
  ElTable: createTableStub(tableRowContextKey),
  ElTableColumn: createTableColumnStub(tableRowContextKey),
  ElTag: createTagStub(),
}));

import TrackingSpecimenListTable from './TrackingSpecimenListTable.vue';

function createItem(
  overrides: Partial<SpecimenManagementListItem> = {},
): SpecimenManagementListItem {
  return {
    abnormalFlag: true,
    applicationId: 'APP-1',
    applicationNo: 'AP-1',
    barcode: 'BC-1',
    barcodeBindingStatus: null,
    checkInStatus: null,
    checkedInAt: null,
    checkedInByName: null,
    containerCount: 1,
    containerName: '試管',
    fixationStatus: 'FIXING',
    labelPrintBatchNo: null,
    labelPrintStatus: 'FAILED',
    latestTrackingAt: '2026-05-31T09:00:00',
    patientName: '张三',
    registeredAt: '2026-05-31T08:30:00',
    specimenCount: 1,
    specimenId: 'SPEC-1',
    specimenName: '血样',
    specimenNo: 'SP-1',
    specimenSite: '血液',
    specimenStatus: 'REGISTERED',
    specimenType: '常规',
    submittingDepartmentId: 'DEP-1',
    submittingDepartmentName: '检验科',
    ...overrides,
  };
}

async function mountTable(props: Record<string, unknown> = {}) {
  const container = document.createElement('div');
  document.body.append(container);
  const detailMock = vi.fn();

  const app = createApp({
    render() {
      return h(TrackingSpecimenListTable, {
        items: [createItem()],
        loading: false,
        onDetail: detailMock,
        ...props,
      });
    },
  });

  app.directive('loading', {});
  app.mount(container);
  await nextTick();

  return {
    container,
    detailMock,
    unmount() {
      app.unmount();
      container.remove();
    },
  };
}

describe('TrackingSpecimenListTable', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('renders specimen list rows', async () => {
    const wrapper = await mountTable();

    expect(wrapper.container.textContent).toContain('SP-1');
    expect(wrapper.container.textContent).toContain('BC-1');
    expect(wrapper.container.textContent).toContain('检验科');
    expect(wrapper.container.textContent).not.toContain('标签打印状态');
    expect(wrapper.container.textContent).not.toContain('打印失败');
    expect(wrapper.container.textContent).not.toContain('待固定');
    expect(wrapper.container.textContent).not.toContain('已固定');

    wrapper.unmount();
  });

  it('uses different colors for different specimen statuses', async () => {
    const container = document.createElement('div');
    document.body.append(container);

    const app = createApp({
      render() {
        return h(TrackingSpecimenListTable, {
          items: [
            createItem({ specimenNo: 'SP-1', specimenStatus: 'FIXED' }),
            createItem({ specimenNo: 'SP-2', specimenStatus: 'IN_TRANSIT' }),
          ],
          loading: false,
        });
      },
    });

    app.directive('loading', {});
    app.mount(container);
    await nextTick();

    const tags = [...container.querySelectorAll('[data-tag-type]')].map(
      (node) => (node as HTMLElement).dataset.tagType,
    );

    expect(tags).toContain('primary');
    expect(tags).toContain('warning');

    app.unmount();
    container.remove();
  });

  it('emits detail action', async () => {
    const wrapper = await mountTable();

    const detailButton = [
      ...wrapper.container.querySelectorAll<HTMLButtonElement>('button'),
    ].find((button) => button.textContent?.includes('详情'));
    detailButton?.click();
    await nextTick();

    expect(wrapper.detailMock).toHaveBeenCalledTimes(1);
    expect(wrapper.detailMock).toHaveBeenCalledWith(
      expect.objectContaining({ specimenNo: 'SP-1' }),
    );

    wrapper.unmount();
  });
});
