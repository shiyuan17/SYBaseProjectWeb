import type { ApplicationListItem } from '../types/specimen-workflow';

import { createApp, h, nextTick } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createButtonStub,
  createTableColumnStub,
  createTableStub,
  createTagStub,
} from '../test-utils/component-stubs';

const tableRowKey = vi.hoisted(() => Symbol('tracking-application-list-row'));
const { mockClipboardWriteText, mockElMessageSuccess, mockElMessageWarning } =
  vi.hoisted(() => ({
    mockClipboardWriteText: vi.fn(),
    mockElMessageSuccess: vi.fn(),
    mockElMessageWarning: vi.fn(),
  }));

vi.mock('element-plus', () => ({
  ElButton: createButtonStub(),
  ElMessage: {
    success: mockElMessageSuccess,
    warning: mockElMessageWarning,
  },
  ElTable: createTableStub(tableRowKey),
  ElTableColumn: createTableColumnStub(tableRowKey),
  ElTag: createTagStub(),
}));

import TrackingApplicationListTable from './TrackingApplicationListTable.vue';

async function flush() {
  await Promise.resolve();
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

function createItem(
  overrides: Partial<ApplicationListItem> = {},
): ApplicationListItem {
  return {
    abnormalFlag: false,
    applicationDate: '2026-05-22',
    applicationFormStatus: 'PENDING',
    applicationNo: 'AP-001',
    applicationType: 'ROUTINE',
    createdAt: '2026-05-22T08:00:00',
    deletable: false,
    currentNode: 'DIAGNOSIS_ASSIGN',
    editable: false,
    id: 'APP-001',
    latestLabelPrintStatus: 'SUCCESS',
    operationDisabledReason: null,
    pathologyNo: 'BL202606080001',
    patientAge: '42',
    patientGender: 'F',
    patientName: '张三',
    registeredSpecimenCount: 1,
    reportIssued: false,
    submissionDate: '2026-05-22',
    status: 'SUBMITTED',
    submittingDepartmentName: '检验科',
    submittingDoctorName: '李医生',
    updatedAt: '2026-05-24T08:00:00',
    voided: false,
    ...overrides,
  };
}

async function mountTable(props: Record<string, unknown> = {}) {
  const container = document.createElement('div');
  document.body.append(container);
  const detailMock = vi.fn();

  const app = createApp({
    render() {
      return h(TrackingApplicationListTable, {
        items: [createItem()],
        loading: false,
        onDetail: detailMock,
        ...props,
      });
    },
  });

  app.directive('loading', {});
  app.mount(container);
  await flush();

  return {
    container,
    detailMock,
    unmount() {
      app.unmount();
      container.remove();
    },
  };
}

describe('TrackingApplicationListTable', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
    vi.restoreAllMocks();
    mockElMessageSuccess.mockReset();
    mockElMessageWarning.mockReset();
  });

  it('renders application rows', async () => {
    const wrapper = await mountTable();

    expect(wrapper.container.textContent).toContain('AP-001');
    expect(wrapper.container.textContent).toContain('BL202606080001');
    expect(wrapper.container.textContent).toContain('诊断分配');
    expect(wrapper.container.textContent).not.toContain('DIAGNOSIS_ASSIGN');
    expect(wrapper.container.textContent).toContain('详情');

    wrapper.unmount();
  });

  it('emits detail action', async () => {
    const wrapper = await mountTable();

    wrapper.container.querySelector<HTMLButtonElement>('button')?.click();
    await flush();

    expect(wrapper.detailMock).toHaveBeenCalledTimes(1);
    expect(wrapper.detailMock).toHaveBeenCalledWith('APP-001');

    wrapper.unmount();
  });

  it('copies application, pathology and specimen identifiers from the table', async () => {
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: mockClipboardWriteText,
      },
    });
    mockClipboardWriteText.mockResolvedValue(undefined);

    const wrapper = await mountTable({
      items: [
        createItem({
          specimenNos: ['SP-001'],
        }),
      ],
    });

    const pathologyTrigger = wrapper.container.querySelector(
      '[title="点击复制病理号"]',
    ) as HTMLElement | null;
    const applicationTrigger = wrapper.container.querySelector(
      '[title="点击复制申请单号"]',
    ) as HTMLElement | null;
    const specimenTrigger = wrapper.container.querySelector(
      '[title="点击复制标本编号"]',
    ) as HTMLElement | null;

    expect(pathologyTrigger).not.toBeNull();
    expect(applicationTrigger).not.toBeNull();
    expect(specimenTrigger).not.toBeNull();

    applicationTrigger?.click();
    pathologyTrigger?.click();
    specimenTrigger?.click();
    await flush();

    expect(mockClipboardWriteText).toHaveBeenNthCalledWith(1, 'AP-001');
    expect(mockClipboardWriteText).toHaveBeenNthCalledWith(2, 'BL202606080001');
    expect(mockClipboardWriteText).toHaveBeenNthCalledWith(3, 'SP-001');
    expect(mockElMessageSuccess).toHaveBeenCalledTimes(3);

    wrapper.unmount();
  });
});
