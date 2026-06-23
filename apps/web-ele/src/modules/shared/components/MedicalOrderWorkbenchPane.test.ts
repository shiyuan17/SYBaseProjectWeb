import type { MedicalOrderBlockOption } from './medical-order-workbench';
import type { MedicalOrderWorkbenchPaneProps } from './MedicalOrderWorkbenchPane.vue';

import { createApp, defineComponent, h, nextTick } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createAlertStub,
  createButtonStub,
  createDialogStub,
  createEmptyStub,
  createInputStub,
  createOptionStub,
  createSelectStub,
  createTableColumnStub,
  createTableStub,
  createTagStub,
} from '#/modules/specimen-workflow/test-utils/component-stubs';

const rowContextKey = vi.hoisted(() => Symbol('medical-order-row'));

const {
  confirmMedicalOrderBillingMock,
  createMedicalOrderMock,
  executeMedicalOrderBillingMock,
  listMedicalOrderDictsMock,
  listMedicalOrderPackagesPageMock,
  messageErrorMock,
  messageSuccessMock,
  messageWarningMock,
  mockUserStore,
} = vi.hoisted(() => ({
  confirmMedicalOrderBillingMock: vi.fn<(data: unknown) => Promise<unknown>>(),
  createMedicalOrderMock: vi.fn<(data: unknown) => Promise<unknown>>(),
  executeMedicalOrderBillingMock: vi.fn<(data: unknown) => Promise<unknown>>(),
  listMedicalOrderDictsMock: vi.fn<() => Promise<unknown[]>>(),
  listMedicalOrderPackagesPageMock:
    vi.fn<(query: unknown) => Promise<unknown>>(),
  messageErrorMock: vi.fn(),
  messageSuccessMock: vi.fn(),
  messageWarningMock: vi.fn(),
  mockUserStore: {
    userInfo: {
      realName: '李医生',
    },
  },
}));

vi.mock('element-plus', () => ({
  ElAlert: createAlertStub(),
  ElButton: createButtonStub(),
  ElCheckbox: defineComponent({
    inheritAttrs: false,
    props: ['ariaLabel', 'disabled', 'modelValue'],
    emits: ['change', 'update:modelValue'],
    setup(props, { attrs, emit }) {
      return () =>
        h('input', {
          ...attrs,
          'aria-label': props.ariaLabel,
          checked: Boolean(props.modelValue),
          disabled: Boolean(props.disabled),
          type: 'checkbox',
          onChange: (event: Event) => {
            const checked = (event.target as HTMLInputElement).checked;
            emit('update:modelValue', checked);
            emit('change', checked);
          },
        });
    },
  }),
  ElDialog: createDialogStub(),
  ElEmpty: createEmptyStub(),
  ElInput: createInputStub(),
  ElMessage: {
    error: messageErrorMock,
    success: messageSuccessMock,
    warning: messageWarningMock,
  },
  ElOption: createOptionStub(),
  ElSelect: createSelectStub(),
  ElTable: createTableStub(rowContextKey),
  ElTableColumn: createTableColumnStub(rowContextKey),
  ElTag: createTagStub(),
}));

vi.mock('#/modules/doctor-workflow/api/doctor-workflow-service', () => ({
  confirmMedicalOrderBilling: confirmMedicalOrderBillingMock,
  createMedicalOrder: createMedicalOrderMock,
  executeMedicalOrderBilling: executeMedicalOrderBillingMock,
  listMedicalOrderDicts: listMedicalOrderDictsMock,
  listMedicalOrderPackagesPage: listMedicalOrderPackagesPageMock,
}));

vi.mock('@vben/stores', () => ({
  useUserStore: () => mockUserStore,
}));

import MedicalOrderWorkbenchPane from './MedicalOrderWorkbenchPane.vue';

const blockOptionsFixture: MedicalOrderBlockOption[] = [
  {
    blockCode: 'A1',
    blockId: 'BOX-001',
    description: '胃窦组织',
    label: 'A1 胃窦组织',
  },
  {
    blockCode: 'B2',
    blockId: 'BOX-002',
    description: '胃体组织',
    label: 'B2 胃体组织',
  },
];

const dictFixture = [
  {
    categoryCode: 'TSRS',
    categoryName: '特殊染色',
    children: [],
    enabled: true,
    id: 'CAT-001',
    items: [
      {
        categoryId: 'CAT-001',
        defaultContent: '补做特殊染色',
        enabled: true,
        executionScope: 'BLOCK',
        id: 'ITEM-001',
        orderItemCode: 'SS-001',
        orderItemName: '特殊染色',
        orderType: 'SPECIAL_STAIN',
        sortOrder: 1,
      },
    ],
    parentId: null,
    sortOrder: 1,
  },
  {
    categoryCode: 'FISH',
    categoryName: 'Fish',
    children: [],
    enabled: true,
    id: 'CAT-002',
    items: [
      {
        categoryId: 'CAT-002',
        defaultContent: '1p19q(Fish)',
        enabled: true,
        executionScope: 'BLOCK',
        id: 'ITEM-002',
        orderItemCode: 'FISH-1P19Q',
        orderItemName: '1p19q(Fish)',
        orderType: 'FISH',
        sortOrder: 1,
      },
    ],
    parentId: null,
    sortOrder: 2,
  },
];

const packageFixture = {
  items: [
    {
      enabled: true,
      id: 'PKG-001',
      items: [
        {
          id: 'PKG-ITEM-001',
          orderItemCode: 'SS-001',
          orderItemId: 'ITEM-001',
          orderItemName: '特殊染色',
          packageId: 'PKG-001',
          remarks: null,
          sortOrder: 1,
        },
        {
          id: 'PKG-ITEM-002',
          orderItemCode: 'FISH-1P19Q',
          orderItemId: 'ITEM-002',
          orderItemName: '1p19q(Fish)',
          packageId: 'PKG-001',
          remarks: null,
          sortOrder: 2,
        },
      ],
      ownerUserId: null,
      packageCode: 'PKG-SPECIAL',
      packageName: '特检套餐',
      packageType: 'SPECIAL',
      remarks: null,
    },
  ],
  page: 1,
  size: 100,
  total: 1,
};

const medicalOrdersFixture = [
  {
    billingStatus: 'PENDING',
    doctorName: '既有医生',
    orderContent: '免疫组化 CK（蜡块: A1 胃窦组织）',
    orderDate: '2026-06-21 10:00:00',
    orderId: 'ORDER-001',
    remarks: '优先处理',
    status: 'IN_PROGRESS',
  },
];

const defaultProps: MedicalOrderWorkbenchPaneProps = {
  blockOptions: blockOptionsFixture,
  canCreateMedicalOrder: true,
  caseId: 'CASE-001',
  medicalOrders: medicalOrdersFixture,
  pathologyNo: 'BL-001',
  readonly: false,
};

function resetMocks() {
  listMedicalOrderDictsMock.mockResolvedValue(dictFixture);
  listMedicalOrderPackagesPageMock.mockResolvedValue(packageFixture);
  createMedicalOrderMock.mockResolvedValue({
    orderId: 'ORDER-NEW',
  });
  executeMedicalOrderBillingMock.mockResolvedValue({
    failureCount: 0,
    items: [],
    successCount: 1,
    totalCount: 1,
  });
  confirmMedicalOrderBillingMock.mockResolvedValue({
    failureCount: 0,
    items: [],
    successCount: 1,
    totalCount: 1,
  });
}

async function flushAll() {
  await Promise.resolve();
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

async function mountPane(
  propsOverrides: Partial<MedicalOrderWorkbenchPaneProps> = {},
) {
  const props = {
    ...defaultProps,
    ...propsOverrides,
  };
  const refreshSpy = vi.fn();
  const root = document.createElement('div');
  document.body.append(root);
  const app = createApp(
    defineComponent({
      setup() {
        return () =>
          h(MedicalOrderWorkbenchPane, {
            ...props,
            onRefresh: refreshSpy,
          });
      },
    }),
  );
  app.directive('loading', {});
  app.mount(root);
  await flushAll();
  return { app, refreshSpy, root };
}

function findButton(root: HTMLElement, text: string) {
  const button = [...root.querySelectorAll<HTMLButtonElement>('button')].find(
    (item) => item.textContent?.includes(text),
  );
  if (!button) {
    throw new Error(`Missing button: ${text}`);
  }
  return button;
}

function findByTestId(root: HTMLElement, testId: string) {
  const element = root.querySelector<HTMLElement>(`[data-testid="${testId}"]`);
  if (!element) {
    throw new Error(`Missing test id: ${testId}`);
  }
  return element;
}

describe('MedicalOrderWorkbenchPane', () => {
  beforeEach(() => {
    resetMocks();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('filters candidates by category and letter', async () => {
    const { app, root } = await mountPane();

    expect(root.textContent).toContain('特殊染色');
    expect(root.textContent).toContain('特检套餐');
    expect(root.textContent).toContain('1p19q(Fish)');

    findByTestId(root, 'medical-order-template-group-FISH').click();
    await flushAll();
    expect(root.textContent).toContain('1p19q(Fish)');
    expect(root.textContent).not.toContain('【特殊染色】');

    findByTestId(root, 'medical-order-letter-F').click();
    await flushAll();
    expect(root.textContent).toContain('Fish');
    expect(root.textContent).not.toContain('【特检套餐');

    app.unmount();
  });

  it('adds candidates and submits orders with block labels', async () => {
    const { app, refreshSpy, root } = await mountPane();

    findByTestId(root, 'medical-order-candidate-item-ITEM-001')
      .querySelector('button')
      ?.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    await flushAll();

    findButton(root, '提交医嘱').click();
    await flushAll();

    expect(createMedicalOrderMock).toHaveBeenCalledWith({
      blockNo: 'A1',
      caseId: 'CASE-001',
      orderContent: '补做特殊染色（蜡块: A1 胃窦组织）',
      orderItemId: 'ITEM-001',
      orderType: 'SPECIAL_STAIN',
      remarks: undefined,
      targetBlockId: 'BOX-001',
      targetBlockNo: 'A1',
    });
    expect(messageSuccessMock).toHaveBeenCalledWith('医嘱已提交');
    expect(refreshSpy).toHaveBeenCalledTimes(1);

    app.unmount();
  });

  it('deletes a draft medical order row from the table', async () => {
    const { app, root } = await mountPane();

    findByTestId(root, 'medical-order-candidate-item-ITEM-001')
      .querySelector('button')
      ?.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    await flushAll();

    expect(root.textContent).toContain('补做特殊染色（蜡块: A1 胃窦组织）');
    expect(findButton(root, '提交医嘱').disabled).toBe(false);
    expect(root.textContent).toContain('删除');

    findButton(root, '删除').click();
    await flushAll();

    expect(root.textContent).not.toContain('补做特殊染色（蜡块: A1 胃窦组织）');
    expect(findButton(root, '提交医嘱').disabled).toBe(true);

    app.unmount();
  });

  it('uses the current user real name for draft medical orders', async () => {
    const { app, root } = await mountPane();

    findByTestId(root, 'medical-order-candidate-item-ITEM-001')
      .querySelector('button')
      ?.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    await flushAll();

    expect(root.textContent).toContain('李医生');
    expect(root.textContent).not.toContain('当前医生');

    app.unmount();
  });

  it('executes and confirms billing for uncharged medical orders', async () => {
    const { app, refreshSpy, root } = await mountPane();

    findButton(root, '执行收费').click();
    await flushAll();
    expect(executeMedicalOrderBillingMock).toHaveBeenCalledWith({
      caseId: 'CASE-001',
      orderIds: undefined,
      remarks: '执行收费',
    });

    findButton(root, '收费管理').click();
    await flushAll();
    findButton(root, '确认完成收费').click();
    await flushAll();

    expect(confirmMedicalOrderBillingMock).toHaveBeenCalledWith({
      caseId: 'CASE-001',
      orderIds: undefined,
      remarks: '确认完成收费',
    });
    expect(refreshSpy).toHaveBeenCalledTimes(2);

    app.unmount();
  });

  it('disables create and billing actions in readonly mode', async () => {
    const { app, root } = await mountPane({
      readonly: true,
    });

    expect(findButton(root, '提交医嘱').disabled).toBe(true);
    expect(findButton(root, '执行收费').disabled).toBe(true);
    expect(root.textContent).not.toContain('删除');

    app.unmount();
  });
});
