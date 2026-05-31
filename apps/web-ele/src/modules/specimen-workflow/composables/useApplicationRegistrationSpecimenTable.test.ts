import type {
  SpecimenDictionaryEntryOption,
  WorkbenchSpecimenItem,
  WorkbenchSpecimenPrintContext,
} from '../types/application-registration-workbench';

import { createApp, defineComponent, h, ref } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

const buildSpecimenBatchPrintDocumentMock = vi.hoisted(() => vi.fn());
const buildSpecimenPrintDocumentMock = vi.hoisted(() => vi.fn());
const errorMock = vi.hoisted(() => vi.fn());
const warningMock = vi.hoisted(() => vi.fn());

vi.mock('element-plus', () => ({
  ElMessage: {
    error: errorMock,
    warning: warningMock,
  },
}));

vi.mock('../utils/specimen-print', () => ({
  buildSpecimenBatchPrintDocument: buildSpecimenBatchPrintDocumentMock,
  buildSpecimenPrintDocument: buildSpecimenPrintDocumentMock,
}));

import { useApplicationRegistrationSpecimenTable } from './useApplicationRegistrationSpecimenTable';

function createEntryOptions(): SpecimenDictionaryEntryOption[] {
  return [
    {
      partId: 'PART-1',
      partName: '胃',
      searchKeywords: ['胃组织', 'wyzz'],
      specimenName: '胃组织',
      systemId: 'SYS-1',
      systemName: '消化系统',
    },
    {
      partId: 'PART-2',
      partName: '肝',
      searchKeywords: ['肝组织', 'gzz'],
      specimenName: '肝组织',
      systemId: 'SYS-2',
      systemName: '肝胆系统',
    },
  ];
}

function createItems(): WorkbenchSpecimenItem[] {
  return [
    {
      id: 'ITEM-1',
      quantity: 1,
      specimenName: '初始标本',
      specimenNo: 'SP-001',
      specimenSite: '初始部位',
      status: 'REGISTERED',
    },
    {
      id: 'ITEM-2',
      quantity: 1,
      specimenName: '第二标本',
      specimenNo: 'SP-002',
      specimenSite: '胃',
      status: 'REGISTERED',
    },
  ];
}

function createPrintContext(): WorkbenchSpecimenPrintContext {
  return {
    applyDept: '外科',
    gender: '女',
    idNo: 'PAT-001',
    patientName: '张三',
    roomLabel: 'A01',
    surgeryTime: '2026-05-31 09:00:00',
  };
}

function createHarness() {
  const items = ref(createItems());
  const printContext = ref<null | WorkbenchSpecimenPrintContext>(null);
  const specimenEntryOptions = ref(createEntryOptions());
  let state: null | ReturnType<typeof useApplicationRegistrationSpecimenTable> =
    null;

  const Harness = defineComponent({
    setup() {
      state = useApplicationRegistrationSpecimenTable({
        items,
        printContext,
        specimenEntryOptions,
        updateItems(nextItems) {
          items.value = nextItems;
        },
      });

      return () => h('div');
    },
  });

  return {
    Harness,
    items,
    printContext,
    specimenEntryOptions,
    getState: () => state,
  };
}

function mountComposable() {
  const harness = createHarness();
  const root = document.createElement('div');
  document.body.append(root);

  const app = createApp(harness.Harness);
  app.mount(root);

  return {
    ...harness,
    destroy() {
      app.unmount();
      root.remove();
    },
  };
}

describe('useApplicationRegistrationSpecimenTable', () => {
  afterEach(() => {
    buildSpecimenBatchPrintDocumentMock.mockReset();
    buildSpecimenPrintDocumentMock.mockReset();
    errorMock.mockReset();
    warningMock.mockReset();
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('updates specimen items through select, blur, quantity, and remove actions', () => {
    const wrapper = mountComposable();
    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    state.handleSpecimenNameSelect(
      'ITEM-1',
      wrapper.specimenEntryOptions.value[0],
    );
    expect(wrapper.items.value[0]?.specimenName).toBe('胃组织');
    expect(wrapper.items.value[0]?.specimenSite).toBe('胃');

    state.handleSpecimenNameBlur('ITEM-1', '自定义标本');
    expect(wrapper.items.value[0]?.specimenName).toBe('自定义标本');

    state.handleSpecimenSiteSelect('ITEM-1', {
      partName: '肝',
      searchKeywords: ['gan'],
    });
    expect(wrapper.items.value[0]?.specimenSite).toBe('肝');

    state.updateItem('ITEM-1', 'quantity', 3);
    expect(wrapper.items.value[0]?.quantity).toBe(3);

    state.handleSelectionChange(wrapper.items.value);
    state.removeItem('ITEM-1');

    expect(wrapper.items.value).toHaveLength(1);
    expect(state.selectedItemIds.value).toEqual(['ITEM-2']);

    wrapper.destroy();
  });

  it('warns without print context and batch prints selected specimens when context exists', () => {
    const wrapper = mountComposable();
    const state = wrapper.getState();
    if (!state) {
      throw new Error('composable state not initialized');
    }

    state.handleSelectionChange(wrapper.items.value);
    state.handleBatchPrint();

    expect(warningMock).toHaveBeenCalledWith(
      '当前缺少标签打印所需的患者上下文信息',
    );

    wrapper.printContext.value = createPrintContext();
    buildSpecimenBatchPrintDocumentMock.mockReturnValue('<html>print</html>');
    const documentCloseSpy = vi
      .spyOn(document, 'close')
      .mockImplementation(() => undefined);
    const documentOpenSpy = vi
      .spyOn(document, 'open')
      .mockImplementation(() => window);
    const documentWriteSpy = vi
      .spyOn(document, 'write')
      .mockImplementation(() => undefined);
    vi.spyOn(window, 'open').mockReturnValue(window);

    state.handleBatchPrint();

    expect(buildSpecimenBatchPrintDocumentMock).toHaveBeenCalledWith({
      context: wrapper.printContext.value,
      items: wrapper.items.value,
    });
    expect(window.open).toHaveBeenCalledTimes(1);
    expect(documentOpenSpy).toHaveBeenCalledTimes(1);
    expect(documentWriteSpy).toHaveBeenCalledTimes(1);
    expect(documentCloseSpy).toHaveBeenCalledTimes(1);

    wrapper.destroy();
  });
});
