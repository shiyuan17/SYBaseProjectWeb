import type { SpecimenRemovalItem } from '../types/specimen-workflow';
import type { RemovalDisplayRow } from '../utils/specimen-removal-display';

import { createApp, h, nextTick } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createButtonStub,
  createTableColumnStub,
  createTableStub,
  createTagStub,
} from '../test-utils/component-stubs';
import { toRemovalDisplayRow } from '../utils/specimen-removal-display';

const tableRowKey = vi.hoisted(() => Symbol('fixation-verify-table-row'));

vi.mock('element-plus', () => ({
  ElButton: createButtonStub(),
  ElTable: createTableStub(tableRowKey),
  ElTableColumn: createTableColumnStub(tableRowKey),
  ElTag: createTagStub(),
}));

import FixationVerifyTable from './FixationVerifyTable.vue';

function createRow(
  overrides: Partial<SpecimenRemovalItem> = {},
): RemovalDisplayRow {
  return toRemovalDisplayRow({
    abnormalFlag: false,
    applicationId: 'APP-1',
    applicationNo: 'AP-001',
    barcode: 'BC-001',
    confirmedAt: null,
    containerCount: 1,
    containerName: '试管',
    inpatientNo: 'ZYH-001',
    latestTrackingAt: '2026-05-31T09:00:00',
    patientGender: '女',
    patientName: '张三',
    registeredAt: '2026-05-31T08:30:00',
    registeredByName: '李护士',
    specimenId: 'SPEC-1',
    specimenName: '血样',
    specimenNo: 'SP-1',
    specimenRemovalAt: null,
    specimenRemovalOperatorName: null,
    specimenStatus: 'REGISTERED',
    specimenType: '常规',
    surgeryName: '手术室1',
    ...overrides,
  });
}

async function mountTable(items: RemovalDisplayRow[]) {
  const container = document.createElement('div');
  document.body.append(container);
  const confirmRemovalMock = vi.fn();

  const app = createApp({
    render() {
      return h(FixationVerifyTable, {
        actionLoading: false,
        canConfirmRemoval: (row: RemovalDisplayRow) => !row.specimenRemovalAt,
        formatRemovalStatus: (row: RemovalDisplayRow) =>
          row.specimenRemovalAt ? '离体' : '未设置',
        items,
        loading: false,
        page: 1,
        size: 20,
        onConfirmRemoval: confirmRemovalMock,
      });
    },
  });

  app.directive('loading', {});
  app.mount(container);
  await nextTick();

  return {
    container,
    confirmRemovalMock,
    unmount() {
      app.unmount();
      container.remove();
    },
  };
}

describe('FixationVerifyTable', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('renders removal rows and confirmation action', async () => {
    const wrapper = await mountTable([createRow()]);

    expect(wrapper.container.textContent).toContain('AP-001');
    expect(wrapper.container.textContent).toContain('离体确认');

    wrapper.container.querySelector<HTMLButtonElement>('button')?.click();
    await nextTick();

    expect(wrapper.confirmRemovalMock).toHaveBeenCalledTimes(1);
    expect(wrapper.confirmRemovalMock).toHaveBeenCalledWith(
      expect.objectContaining({ specimenId: 'SPEC-1' }),
    );

    wrapper.unmount();
  });

  it('renders completed rows without confirmation action', async () => {
    const wrapper = await mountTable([
      createRow({
        specimenRemovalAt: '2026-05-31T08:45:00',
        specimenRemovalOperatorName: '李医生',
      }),
    ]);

    expect(wrapper.container.textContent).toContain('离体');
    expect(wrapper.container.textContent).toContain('离体确认');
    expect(
      wrapper.container.querySelector<HTMLButtonElement>('button')?.disabled,
    ).toBe(true);

    wrapper.unmount();
  });
});
