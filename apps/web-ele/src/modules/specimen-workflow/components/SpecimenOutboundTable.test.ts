import type { SpecimenOutboundDisplayItem } from '../utils/transport-handover';

import { createApp, h, nextTick } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createTableColumnStub,
  createTableStub,
  createTagStub,
} from '../test-utils/component-stubs';

const tableRowKey = vi.hoisted(() => Symbol('specimen-outbound-table-row'));

vi.mock('element-plus', () => ({
  ElTable: createTableStub(tableRowKey),
  ElTableColumn: createTableColumnStub(tableRowKey),
  ElTag: createTagStub(),
}));

import SpecimenOutboundTable from './SpecimenOutboundTable.vue';

function createRow(
  overrides: Partial<SpecimenOutboundDisplayItem> = {},
): SpecimenOutboundDisplayItem {
  return {
    applicationId: 'APP-1',
    applicationNo: 'AP-001',
    barcode: 'BC-001',
    canOutbound: true,
    checkInStatus: 'CHECKED_IN',
    displayOutboundStatus: '待出库',
    fixationStatus: 'COMPLETED',
    inpatientNo: 'ZY-001',
    outboundAt: null,
    outboundDisabledReason: null,
    outboundDraft: false,
    outboundStatusTagType: 'info',
    outboundUserName: null,
    patientGender: '女',
    patientId: 'UUID-001',
    patientIdDisplay: '08305',
    patientName: '张三',
    registeredAt: '2026-06-08 09:00:00',
    registeredByName: '登记员',
    specimenConfirmedAt: '2026-06-08 08:30:00',
    specimenId: 'SPEC-001',
    specimenName: '甲状腺组织',
    specimenNo: 'SP-001',
    specimenStatus: 'CHECKED_IN',
    submittingDepartmentId: 'DEP-1',
    submittingDepartmentName: '外科',
    surgeryName: '手术间A',
    transportOrderId: null,
    ...overrides,
  };
}

async function mountTable(items: SpecimenOutboundDisplayItem[]) {
  const container = document.createElement('div');
  document.body.append(container);
  const app = createApp({
    render() {
      return h(SpecimenOutboundTable, {
        items,
        loading: false,
        page: 1,
        size: 20,
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

describe('SpecimenOutboundTable', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('renders semantic row tones for outbound states', async () => {
    const wrapper = await mountTable([
      createRow(),
      createRow({
        displayOutboundStatus: '出库未保存',
        outboundDraft: true,
        specimenId: 'SPEC-002',
      }),
      createRow({
        canOutbound: false,
        displayOutboundStatus: '已出库',
        outboundAt: '2026-06-08 10:00:00',
        outboundStatusTagType: 'success',
        specimenId: 'SPEC-003',
        specimenStatus: 'IN_TRANSIT',
      }),
      createRow({
        canOutbound: false,
        displayOutboundStatus: '已接收',
        outboundStatusTagType: 'primary',
        specimenId: 'SPEC-004',
        specimenStatus: 'RECEIVED',
      }),
    ]);

    expect(
      wrapper.container.querySelector('.specimen-workflow-row--actionable'),
    ).not.toBeNull();
    expect(
      wrapper.container.querySelector('.specimen-workflow-row--draft'),
    ).not.toBeNull();
    expect(
      wrapper.container.querySelector('.specimen-workflow-row--completed'),
    ).not.toBeNull();
    expect(
      wrapper.container.querySelector('.specimen-workflow-row--blocked'),
    ).not.toBeNull();
    expect(wrapper.container.textContent).toContain('待出库');
    expect(wrapper.container.textContent).toContain('出库未保存');
    expect(wrapper.container.textContent).toContain('08305');
    expect(wrapper.container.textContent).not.toContain('UUID-001');

    wrapper.unmount();
  });
});
