import type {
  SpecimenDictionaryEntryOption,
  WorkbenchSpecimenItem,
  WorkbenchSpecimenPrintContext,
} from '../types/application-registration-workbench';

import { createApp } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createAutocompleteStub,
  createButtonStub,
  createEmptyStub,
  createInputNumberStub,
  createPassthroughStub,
  createTableColumnStub,
  createTableStub,
  createTagStub,
} from '../test-utils/component-stubs';

const tableDataKey = vi.hoisted(() => Symbol('table-data'));
const buildSpecimenPrintDocumentMock = vi.hoisted(() => vi.fn());
const buildSpecimenBatchPrintDocumentMock = vi.hoisted(() => vi.fn());
const warningMock = vi.hoisted(() => vi.fn());
const errorMock = vi.hoisted(() => vi.fn());

vi.mock('element-plus', () => ({
  ElAutocomplete: createAutocompleteStub(),
  ElButton: createButtonStub(),
  ElEmpty: createEmptyStub(),
  ElInputNumber: createInputNumberStub(),
  ElMessage: {
    error: errorMock,
    warning: warningMock,
  },
  ElTable: createTableStub(tableDataKey),
  ElTableColumn: createTableColumnStub(tableDataKey),
  ElTag: createTagStub(),
}));

vi.mock('./WorkflowSectionCard.vue', () => ({
  default: createPassthroughStub('section'),
}));

vi.mock('../utils/specimen-print', () => ({
  buildSpecimenBatchPrintDocument: buildSpecimenBatchPrintDocumentMock,
  buildSpecimenPrintDocument: buildSpecimenPrintDocumentMock,
}));

import ApplicationRegistrationSpecimenTable from './ApplicationRegistrationSpecimenTable.vue';

type Wrapper = {
  container: HTMLElement;
  unmount: () => void;
};

function createSpecimenItem(status: string): WorkbenchSpecimenItem {
  return {
    id: `item-${status}`,
    quantity: 1,
    specimenName: `标本-${status}`,
    specimenNo: `SP-${status}`,
    specimenSite: '胃',
    status,
  };
}

function createProps(items: WorkbenchSpecimenItem[]) {
  return {
    items,
    printContext: null as null | WorkbenchSpecimenPrintContext,
    roomLabel: 'A01',
    specimenEntryOptions: [] as SpecimenDictionaryEntryOption[],
  };
}

function renderComponent(items: WorkbenchSpecimenItem[]): Wrapper {
  const container = document.createElement('div');
  document.body.append(container);

  const app = createApp(
    ApplicationRegistrationSpecimenTable,
    createProps(items),
  );
  app.mount(container);

  return {
    container,
    unmount() {
      app.unmount();
      container.remove();
    },
  };
}

describe('ApplicationRegistrationSpecimenTable', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    buildSpecimenPrintDocumentMock.mockReset();
    buildSpecimenBatchPrintDocumentMock.mockReset();
    warningMock.mockReset();
    errorMock.mockReset();
  });

  it('uses Chinese labels for known specimen status codes and keeps fallback values', () => {
    const wrapper = renderComponent([
      createSpecimenItem('FIXED'),
      createSpecimenItem('RECEIVED'),
      createSpecimenItem('REGISTERED'),
      createSpecimenItem('新增'),
      createSpecimenItem('UNKNOWN_STATUS'),
    ]);

    const tagTexts = [
      ...wrapper.container.querySelectorAll('[data-tag-type]'),
    ].map((node) => node.textContent?.trim());

    expect(tagTexts).toEqual([
      '固定完成',
      '已接收',
      '已登记',
      '新增',
      'UNKNOWN_STATUS',
    ]);
    expect(tagTexts).not.toContain('FIXED');
    expect(tagTexts).not.toContain('RECEIVED');
    expect(tagTexts).not.toContain('REGISTERED');

    wrapper.unmount();
  });

  it('matches tag types by raw status values', () => {
    const wrapper = renderComponent([
      createSpecimenItem('FIXED'),
      createSpecimenItem('新增'),
      createSpecimenItem('RETURNED'),
    ]);

    const tagTypes = [
      ...wrapper.container.querySelectorAll<HTMLElement>('[data-tag-type]'),
    ].map((node) => node.dataset.tagType);

    expect(tagTypes).toEqual(['primary', 'info', 'warning']);

    wrapper.unmount();
  });

  it('does not force table full height when there are no specimen rows', () => {
    const wrapper = renderComponent([]);

    const table = wrapper.container.querySelector<HTMLElement>(
      '[data-testid="table"]',
    );
    expect(table?.dataset.height).toBe('');
    expect(wrapper.container.textContent).toContain(
      '暂无标本，请从下方字典或套餐中快速追加',
    );

    wrapper.unmount();
  });

  it('shows print action text instead of preview', () => {
    const wrapper = renderComponent([createSpecimenItem('FIXED')]);

    const columnLabels = [
      ...wrapper.container.querySelectorAll<HTMLElement>('[data-column-label]'),
    ].map((node) => node.dataset.columnLabel);

    expect(columnLabels).toContain('标本ID');
    expect(wrapper.container.textContent).toContain('打印');
    expect(wrapper.container.textContent).not.toContain('预览');

    wrapper.unmount();
  });

  it('warns when printing without print context', async () => {
    const wrapper = renderComponent([createSpecimenItem('FIXED')]);

    const printButton = [...wrapper.container.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === '打印',
    );
    printButton?.click();

    expect(warningMock).toHaveBeenCalledWith(
      '当前缺少标签打印所需的患者上下文信息',
    );

    wrapper.unmount();
  });
});
