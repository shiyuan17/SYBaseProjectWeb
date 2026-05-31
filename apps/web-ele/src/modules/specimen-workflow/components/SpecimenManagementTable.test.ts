import type { SpecimenManagementListItem } from '../types/specimen-workflow';

import { createApp, h, nextTick } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createButtonStub,
  createTableColumnStub,
  createTableStub,
  createTagStub,
} from '../test-utils/component-stubs';

const tableRowKey = vi.hoisted(() => Symbol('specimen-management-table-row'));

vi.mock('element-plus', () => ({
  ElButton: createButtonStub(),
  ElTable: createTableStub(tableRowKey),
  ElTableColumn: createTableColumnStub(tableRowKey),
  ElTag: createTagStub(),
}));

import SpecimenManagementTable from './SpecimenManagementTable.vue';

function createRow(
  overrides: Partial<SpecimenManagementListItem> = {},
): SpecimenManagementListItem {
  return {
    abnormalFlag: false,
    applicationId: 'APP-1',
    applicationNo: 'AP-001',
    barcode: 'BC-001',
    containerCount: 1,
    containerName: '试管',
    fixationStatus: 'REGISTERED',
    labelPrintBatchNo: 'BATCH-1',
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

async function mountTable(items: SpecimenManagementListItem[]) {
  const container = document.createElement('div');
  document.body.append(container);
  const detailMock = vi.fn();
  const rowRetryMock = vi.fn();
  const goToTrackingMock = vi.fn();
  const verifyMock = vi.fn();

  const app = createApp({
    render() {
      return h(SpecimenManagementTable, {
        canVerifyFixation: true,
        items,
        listLoading: false,
        onDetail: detailMock,
        onGoToTracking: goToTrackingMock,
        onRowRetry: rowRetryMock,
        onVerify: verifyMock,
      });
    },
  });

  app.directive('loading', {});
  app.mount(container);
  await nextTick();

  return {
    container,
    detailMock,
    goToTrackingMock,
    rowRetryMock,
    verifyMock,
    unmount() {
      app.unmount();
      container.remove();
    },
  };
}

describe('SpecimenManagementTable', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('renders specimen rows and detail action', async () => {
    const wrapper = await mountTable([createRow()]);

    expect(wrapper.container.textContent).toContain('SP-1');
    expect(wrapper.container.textContent).toContain('AP-001');

    const buttons = [
      ...wrapper.container.querySelectorAll<HTMLButtonElement>('button'),
    ];
    buttons.at(-1)?.click();
    await nextTick();

    expect(wrapper.detailMock).toHaveBeenCalledTimes(1);

    wrapper.unmount();
  });

  it('emits retry and verify actions for matching rows', async () => {
    const wrapper = await mountTable([
      createRow({
        labelPrintStatus: 'FAILED',
        labelPrintBatchNo: 'BATCH-1',
        specimenId: 'SPEC-RETRY',
      }),
      createRow({
        abnormalFlag: false,
        fixationStatus: 'REGISTERED',
        labelPrintBatchNo: null,
        labelPrintStatus: 'SUCCESS',
        specimenId: 'SPEC-VERIFY',
      }),
    ]);

    const buttons = [
      ...wrapper.container.querySelectorAll<HTMLButtonElement>('button'),
    ];
    buttons
      .find((button) => button.textContent?.includes('琛ユ墦鏍囩'))
      ?.click();
    buttons
      .find((button) => button.textContent?.includes('寮€濮嬫牳楠'))
      ?.click();
    await nextTick();

    expect(wrapper.rowRetryMock).toHaveBeenCalled();
    expect(wrapper.verifyMock).toHaveBeenCalledWith(
      expect.objectContaining({ specimenId: 'SPEC-VERIFY' }),
      'start',
    );

    wrapper.unmount();
  });
});
