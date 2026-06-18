import { createApp, h, nextTick } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import TransportHandoverView from './TransportHandoverView.vue';

const {
  createTransportOrderMock,
  listSpecimenOutboundsMock,
  loadOperatingRoomNameMapSafelyMock,
  outboundTransportOrderMock,
  quickOutboundSpecimenMock,
  verifyOperatorMock,
  warningMock,
} = vi.hoisted(() => ({
  createTransportOrderMock: vi.fn(async () => ({
    applicationId: 'APP-002',
    handedOverAt: null,
    handoverUserName: 'Test User',
    id: 'TO-CREATED-001',
    outboundUserId: null,
    outboundUserName: null,
    receiverUserName: null,
    status: 'PENDING',
    toBeTransportedAt: '2026-05-26 10:00:00',
    transportOrderNo: 'TR-20260526-CREATED',
  })),
  listSpecimenOutboundsMock: vi.fn(async () => ({
    items: [
      {
        applicationId: 'APP-002',
        applicationNo: 'M2-20260526-002',
        barcode: 'BC-TR-001',
        checkInStatus: 'CHECKED_IN',
        fixationStatus: 'COMPLETED',
        inpatientNo: 'ZY-002',
        outboundAt: null,
        outboundUserName: null,
        patientGender: '女',
        patientId: 'PAT-002',
        patientName: 'Alice',
        registeredAt: '2026-05-26 09:30:00',
        registeredByName: '登记员甲',
        specimenConfirmedAt: '2026-05-26 09:10:00',
        specimenId: 'SP-002',
        specimenName: '甲状腺组织',
        specimenNo: 'SP-TR-001',
        specimenStatus: 'CHECKED_IN',
        surgeryName: 'OR-102',
        transportOrderId: 'TO-002',
      },
      {
        applicationId: 'APP-002',
        applicationNo: 'M2-20260526-002',
        barcode: 'BC-TR-002',
        checkInStatus: 'NOT_CHECKED_IN',
        fixationStatus: 'COMPLETED',
        inpatientNo: 'ZY-002',
        outboundAt: null,
        outboundUserName: null,
        patientGender: '女',
        patientId: 'PAT-002',
        patientName: 'Alice',
        registeredAt: '2026-05-26 09:35:00',
        registeredByName: '登记员甲',
        specimenConfirmedAt: '2026-05-26 09:12:00',
        specimenId: 'SP-002-2',
        specimenName: '甲状腺峡部组织',
        specimenNo: 'SP-TR-002',
        specimenStatus: 'FIXED',
        surgeryName: 'OR-102',
        transportOrderId: null,
      },
    ],
    page: 1,
    size: 20,
    total: 2,
  })),
  loadOperatingRoomNameMapSafelyMock: vi.fn(
    async () => new Map([['OR-102', '惠侨楼 - 手术室 2']]),
  ),
  outboundTransportOrderMock: vi.fn(async () => ({
    applicationId: 'APP-002',
    handedOverAt: '2026-05-26 10:10:00',
    handoverUserName: 'Surgery',
    id: 'TO-002',
    outboundUserId: 'USER-001',
    outboundUserName: 'Test User',
    receiverUserName: null,
    status: 'HANDED_OVER',
    toBeTransportedAt: '2026-05-26 10:00:00',
    transportOrderNo: 'TR-20260526-002',
  })),
  quickOutboundSpecimenMock: vi.fn(async () => ({
    applicationId: 'APP-002',
    handedOverAt: '2026-05-26 10:12:00',
    handoverUserName: '入库员甲',
    id: 'TO-NEW-001',
    outboundUserId: 'USER-001',
    outboundUserName: 'Test User',
    receiverUserName: null,
    status: 'HANDED_OVER',
    toBeTransportedAt: '2026-05-26 10:11:00',
    transportOrderNo: 'TR-20260526-NEW',
  })),
  verifyOperatorMock: vi.fn(async () => 'TOKEN-VERIFY'),
  warningMock: vi.fn(),
}));

const { mockRoute } = vi.hoisted(() => ({
  mockRoute: {
    query: {
      applicationId: 'APP-002',
    } as Record<string, string>,
  },
}));

const { mockUserInfo } = vi.hoisted(() => ({
  mockUserInfo: {
    loginName: 'test-user',
    realName: 'Test User',
    userId: 'USER-001',
  },
}));

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
}));

vi.mock('@vben/common-ui', () => ({
  Page: {
    props: ['title'],
    template: '<section><h1 v-if="title">{{ title }}</h1><slot /></section>',
  },
}));

vi.mock('@vben/stores', () => ({
  useUserStore: () => ({
    userInfo: mockUserInfo,
  }),
}));

vi.mock('#/modules/system-management/components/SystemUserSelect.vue', () => ({
  default: {
    props: ['modelValue', 'placeholder', 'selectedLabel'],
    template:
      '<div data-testid="system-user-select">{{ placeholder }}{{ selectedLabel }}</div>',
  },
}));

vi.mock('element-plus', async () => {
  const actual =
    await vi.importActual<typeof import('element-plus')>('element-plus');
  return {
    ...actual,
    ElMessage: { success: vi.fn(), warning: warningMock },
  };
});

vi.mock('../utils/operating-room-display', () => ({
  loadOperatingRoomNameMapSafely: loadOperatingRoomNameMapSafelyMock,
  normalizeOperatingRoomDisplayValue: vi.fn(
    (roomMap: ReadonlyMap<string, string>, value?: null | string) =>
      value ? (roomMap.get(value) ?? value) : '',
  ),
}));

vi.mock('../api/specimen-workflow-service', () => ({
  createTransportOrder: createTransportOrderMock,
  listSpecimenOutbounds: listSpecimenOutboundsMock,
  outboundTransportOrder: outboundTransportOrderMock,
  quickOutboundSpecimen: quickOutboundSpecimenMock,
}));

vi.mock('../composables/useOperatorVerificationPrompt', () => ({
  useOperatorVerificationPrompt: () => ({
    verifyOperator: verifyOperatorMock,
  }),
}));

function mountView() {
  const container = document.createElement('div');
  document.body.append(container);
  const app = createApp({
    render: () => h(TransportHandoverView),
  });

  app.directive('loading', {});
  app.mount(container);

  return { app, container };
}

async function flush() {
  await nextTick();
  await Promise.resolve();
  await Promise.resolve();
  await nextTick();
}

describe('TransportHandoverView', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    mockRoute.query = {
      applicationId: 'APP-002',
    };
    mockUserInfo.loginName = 'test-user';
    mockUserInfo.realName = 'Test User';
    mockUserInfo.userId = 'USER-001';
    vi.clearAllMocks();
  });

  it('keeps the outbound list empty when no route context is provided', async () => {
    mockRoute.query = {};

    const { app, container } = mountView();
    await flush();

    expect(listSpecimenOutboundsMock).not.toHaveBeenCalled();
    expect(container.textContent).toMatch(/全部\s*0/);

    app.unmount();
  });

  it('expands a scanned specimen identifier to its application specimens and only drafts the exact match', async () => {
    mockRoute.query = {};
    listSpecimenOutboundsMock.mockResolvedValueOnce({
      items: [
        {
          applicationId: 'APP-002',
          applicationNo: 'M2-20260526-002',
          barcode: 'BC-TR-001',
          checkInStatus: 'CHECKED_IN',
          fixationStatus: 'COMPLETED',
          inpatientNo: 'ZY-002',
          outboundAt: null,
          outboundUserName: null,
          patientGender: '女',
          patientId: 'PAT-002',
          patientName: 'Alice',
          registeredAt: '2026-05-26 09:30:00',
          registeredByName: '登记员甲',
          specimenConfirmedAt: '2026-05-26 09:10:00',
          specimenId: 'SP-002',
          specimenName: '甲状腺组织',
          specimenNo: 'SP-TR-001',
          specimenStatus: 'CHECKED_IN',
          surgeryName: 'OR-102',
          transportOrderId: 'TO-002',
        },
        {
          applicationId: 'APP-002',
          applicationNo: 'M2-20260526-002',
          barcode: 'BC-TR-002',
          checkInStatus: 'CHECKED_IN',
          fixationStatus: 'COMPLETED',
          inpatientNo: 'ZY-002',
          outboundAt: null,
          outboundUserName: null,
          patientGender: '女',
          patientId: 'PAT-002',
          patientName: 'Alice',
          registeredAt: '2026-05-26 09:35:00',
          registeredByName: '登记员甲',
          specimenConfirmedAt: '2026-05-26 09:12:00',
          specimenId: 'SP-002-2',
          specimenName: '甲状腺峡部组织',
          specimenNo: 'SP-TR-002',
          specimenStatus: 'CHECKED_IN',
          surgeryName: 'OR-102',
          transportOrderId: 'TO-SIBLING',
        },
      ],
      page: 1,
      size: 20,
      total: 2,
    });

    const { app, container } = mountView();
    await flush();

    const specimenNoInput = container.querySelector(
      'input[placeholder="请输入标本条码/编号"]',
    ) as HTMLInputElement | null;
    specimenNoInput!.value = 'BC-TR-001';
    specimenNoInput!.dispatchEvent(new Event('input', { bubbles: true }));
    specimenNoInput!.dispatchEvent(
      new KeyboardEvent('keyup', {
        bubbles: true,
        code: 'Enter',
        key: 'Enter',
      }),
    );
    await flush();

    expect(listSpecimenOutboundsMock).toHaveBeenCalledWith(
      expect.objectContaining({ identifier: 'BC-TR-001' }),
    );
    expect(container.textContent).toMatch(/全部\s*2/);
    expect(container.textContent).toContain('SP-TR-001');
    expect(container.textContent).toContain('SP-TR-002');
    expect(container.textContent).toContain('出库未保存');
    expect(container.textContent).toContain('待出库');

    const transportButton = [...container.querySelectorAll('button')].find(
      (button) => button.textContent?.includes('转运'),
    ) as HTMLButtonElement | undefined;
    expect(transportButton?.disabled).toBe(false);
    transportButton!.click();
    await flush();

    expect(outboundTransportOrderMock).toHaveBeenCalledTimes(1);
    expect(outboundTransportOrderMock).toHaveBeenCalledWith('TO-002', {
      outboundUserId: 'USER-001',
      outboundUserName: 'Test User',
      remarks: null,
      terminalCode: null,
    });
    expect(outboundTransportOrderMock).not.toHaveBeenCalledWith(
      'TO-SIBLING',
      expect.anything(),
    );

    app.unmount();
  });

  it('renders the specimen outbound workspace, keeps hidden route filtering, and removes legacy controls', async () => {
    const { app, container } = mountView();
    await flush();

    expect(container.textContent).toContain('标本出库');
    expect(container.textContent).toContain('选择出库人Test User');
    expect(listSpecimenOutboundsMock).toHaveBeenCalledWith(
      expect.objectContaining({ applicationId: 'APP-002' }),
    );
    expect(container.textContent).toContain('惠侨楼 - 手术室 2');
    expect(container.textContent).not.toContain('OR-102');

    expect(container.textContent).not.toContain('请输入申请单号');
    expect(container.textContent).not.toContain('送检科室');
    expect(container.textContent).toContain('查询');
    expect(container.textContent).not.toContain('重置');
    expect(container.textContent).not.toContain('创建转运单');
    expect(container.textContent).not.toContain('批量打印');
    expect(container.textContent).not.toContain('批量交接');
    expect(container.textContent).not.toContain('最近操作结果');
    expect(container.textContent).toContain('清除列表');
    expect(container.textContent).not.toContain('转运单号');
    expect(container.textContent).not.toContain('交接科室');
    expect(container.textContent).not.toContain('接收科室');
    expect(container.textContent).not.toContain('操作');

    const expectedHeaders = [
      '',
      '序号',
      '申请单',
      '标本编号',
      '姓名',
      '住院号',
      '性别',
      '手术间',
      '标本名称',
      '标本状态',
      '出库状态',
      '添加时间',
      '添加人',
      '病人ID',
      '出库时间',
      '出库人',
    ];
    const headerTexts = [...container.querySelectorAll('thead th')].map(
      (element) => element.textContent?.replaceAll(/\s+/g, '') ?? '',
    );
    expect(headerTexts).toEqual(expectedHeaders);

    app.unmount();
  });

  it('displays already transported specimens while keeping them non-operable', async () => {
    listSpecimenOutboundsMock.mockResolvedValueOnce({
      items: [
        {
          applicationId: 'APP-002',
          applicationNo: 'M2-20260526-002',
          barcode: 'BC-TR-001',
          checkInStatus: 'CHECKED_IN',
          fixationStatus: 'COMPLETED',
          inpatientNo: 'ZY-002',
          outboundAt: null,
          outboundUserName: null,
          patientGender: '女',
          patientId: 'PAT-002',
          patientName: 'Alice',
          registeredAt: '2026-05-26 09:30:00',
          registeredByName: '登记员甲',
          specimenConfirmedAt: '2026-05-26 09:10:00',
          specimenId: 'SP-002',
          specimenName: '甲状腺组织',
          specimenNo: 'SP-TR-001',
          specimenStatus: 'CHECKED_IN',
          surgeryName: 'OR-102',
          transportOrderId: 'TO-002',
        },
        {
          applicationId: 'APP-002',
          applicationNo: 'M2-20260526-002',
          barcode: 'BC-TR-002',
          checkInStatus: 'CHECKED_IN',
          fixationStatus: 'COMPLETED',
          inpatientNo: 'ZY-002',
          outboundAt: null,
          outboundUserName: null,
          patientGender: '女',
          patientId: 'PAT-002',
          patientName: 'Alice',
          registeredAt: '2026-05-26 09:35:00',
          registeredByName: '登记员甲',
          specimenConfirmedAt: '2026-05-26 09:12:00',
          specimenId: 'SP-002-2',
          specimenName: '甲状腺峡部组织',
          specimenNo: 'SP-TR-002',
          specimenStatus: 'IN_TRANSIT',
          surgeryName: 'OR-102',
          transportOrderId: 'TO-002',
        },
      ],
      page: 1,
      size: 20,
      total: 2,
    });

    const { app, container } = mountView();
    await flush();

    expect(container.textContent).toMatch(/全部\s*2/);
    expect(container.textContent).toContain('SP-TR-001');
    expect(container.textContent).toContain('SP-TR-002');
    expect(container.textContent).toContain('已出库');

    app.unmount();
  });

  it('marks the matched specimen as unsaved on scan and submits after clicking transport', async () => {
    const { app, container } = mountView();
    await flush();

    vi.clearAllMocks();
    listSpecimenOutboundsMock.mockResolvedValueOnce({
      items: [
        {
          applicationId: 'APP-002',
          applicationNo: 'M2-20260526-002',
          barcode: 'BC-TR-001',
          checkInStatus: 'CHECKED_IN',
          fixationStatus: 'COMPLETED',
          inpatientNo: 'ZY-002',
          outboundAt: null,
          outboundUserName: null,
          patientGender: '女',
          patientId: 'PAT-002',
          patientName: 'Alice',
          registeredAt: '2026-05-26 09:30:00',
          registeredByName: '登记员甲',
          specimenConfirmedAt: '2026-05-26 09:10:00',
          specimenId: 'SP-002',
          specimenName: '甲状腺组织',
          specimenNo: 'SP-TR-001',
          specimenStatus: 'CHECKED_IN',
          surgeryName: 'OR-102',
          transportOrderId: 'TO-002',
        },
        {
          applicationId: 'APP-002',
          applicationNo: 'M2-20260526-002',
          barcode: 'BC-TR-002',
          checkInStatus: 'NOT_CHECKED_IN',
          fixationStatus: 'COMPLETED',
          inpatientNo: 'ZY-002',
          outboundAt: null,
          outboundUserName: null,
          patientGender: '女',
          patientId: 'PAT-002',
          patientName: 'Alice',
          registeredAt: '2026-05-26 09:35:00',
          registeredByName: '登记员甲',
          specimenConfirmedAt: '2026-05-26 09:12:00',
          specimenId: 'SP-002-2',
          specimenName: '甲状腺峡部组织',
          specimenNo: 'SP-TR-002',
          specimenStatus: 'FIXED',
          surgeryName: 'OR-102',
          transportOrderId: null,
        },
      ],
      page: 1,
      size: 20,
      total: 2,
    });

    const specimenNoInput = container.querySelector(
      'input[placeholder="请输入标本条码/编号"]',
    ) as HTMLInputElement | null;
    specimenNoInput!.value = 'BC-TR-001';
    specimenNoInput!.dispatchEvent(new Event('input', { bubbles: true }));
    specimenNoInput!.dispatchEvent(
      new KeyboardEvent('keyup', {
        bubbles: true,
        code: 'Enter',
        key: 'Enter',
      }),
    );
    await flush();

    expect(listSpecimenOutboundsMock).toHaveBeenCalledWith(
      expect.objectContaining({ identifier: 'BC-TR-001' }),
    );
    expect(container.textContent).toContain('出库未保存');
    expect(outboundTransportOrderMock).not.toHaveBeenCalled();
    expect(quickOutboundSpecimenMock).not.toHaveBeenCalled();
    expect(warningMock).not.toHaveBeenCalled();

    const transportButton = [...container.querySelectorAll('button')].find(
      (button) => button.textContent?.includes('转运'),
    ) as HTMLButtonElement | undefined;
    expect(transportButton?.disabled).toBe(false);
    transportButton!.click();
    await flush();

    expect(verifyOperatorMock).not.toHaveBeenCalled();
    expect(outboundTransportOrderMock).toHaveBeenCalledWith('TO-002', {
      outboundUserId: 'USER-001',
      outboundUserName: 'Test User',
      remarks: null,
      terminalCode: null,
    });
    expect(container.textContent).toContain('SP-TR-001');
    expect(container.textContent).toContain('SP-TR-002');
    expect(container.textContent).toContain('已出库');
    expect(container.textContent).not.toContain('出库未保存');
    expect(container.textContent).toMatch(/已选\s*0/);
    expect(transportButton!.disabled).toBe(true);

    const clearListButton = [...container.querySelectorAll('button')].find(
      (button) => button.textContent?.includes('清除列表'),
    );
    clearListButton?.click();
    await flush();

    expect(container.textContent).not.toContain('SP-TR-001');

    app.unmount();
  });

  it('creates a transport order for an unbound specimen with specimen ids', async () => {
    const { app, container } = mountView();
    await flush();

    vi.clearAllMocks();
    listSpecimenOutboundsMock.mockResolvedValueOnce({
      items: [
        {
          applicationId: 'APP-003',
          applicationNo: 'M2-20260526-003',
          barcode: null,
          checkInStatus: 'CHECKED_IN',
          fixationStatus: 'COMPLETED',
          inpatientNo: 'ZY-003',
          outboundAt: null,
          outboundUserName: null,
          patientGender: '女',
          patientId: 'PAT-003',
          patientName: 'Carol',
          registeredAt: '2026-05-26 09:40:00',
          registeredByName: '登记员乙',
          specimenConfirmedAt: '2026-05-26 09:20:00',
          specimenId: 'SP-UNBOUND-ID',
          specimenName: '未绑定条码标本',
          specimenNo: 'SP-UNBOUND',
          specimenStatus: 'CHECKED_IN',
          submittingDepartmentId: 'DEPT-SURGERY',
          submittingDepartmentName: '外科',
          surgeryName: 'OR-102',
          transportOrderId: null,
        },
      ],
      page: 1,
      size: 20,
      total: 1,
    } as unknown as Awaited<ReturnType<typeof listSpecimenOutboundsMock>>);

    const specimenNoInput = container.querySelector(
      'input[placeholder="请输入标本条码/编号"]',
    ) as HTMLInputElement | null;
    specimenNoInput!.value = 'SP-UNBOUND';
    specimenNoInput!.dispatchEvent(new Event('input', { bubbles: true }));
    specimenNoInput!.dispatchEvent(
      new KeyboardEvent('keyup', {
        bubbles: true,
        code: 'Enter',
        key: 'Enter',
      }),
    );
    await flush();

    const transportButton = [...container.querySelectorAll('button')].find(
      (button) => button.textContent?.includes('转运'),
    ) as HTMLButtonElement | undefined;
    expect(transportButton?.disabled).toBe(false);
    transportButton!.click();
    await flush();

    expect(createTransportOrderMock).toHaveBeenCalledWith(
      expect.objectContaining({
        applicationId: 'APP-003',
        specimenBarcodes: [],
        specimenIds: ['SP-UNBOUND-ID'],
      }),
    );
    expect(outboundTransportOrderMock).toHaveBeenCalledWith('TO-CREATED-001', {
      outboundUserId: 'USER-001',
      outboundUserName: 'Test User',
      remarks: null,
      terminalCode: null,
    });
    expect(warningMock).not.toHaveBeenCalledWith(
      expect.stringContaining('缺少条码'),
    );

    app.unmount();
  });

  it('shows the matched specimen reason when the scanned specimen is not outbound-ready', async () => {
    const { app, container } = mountView();
    await flush();

    vi.clearAllMocks();
    listSpecimenOutboundsMock.mockResolvedValueOnce({
      items: [
        {
          applicationId: 'APP-002',
          applicationNo: 'M2-20260526-002',
          barcode: 'BC-TR-002',
          checkInStatus: 'NOT_CHECKED_IN',
          fixationStatus: 'COMPLETED',
          inpatientNo: 'ZY-002',
          outboundAt: null,
          outboundUserName: null,
          patientGender: '女',
          patientId: 'PAT-002',
          patientName: 'Alice',
          registeredAt: '2026-05-26 09:35:00',
          registeredByName: '登记员甲',
          specimenConfirmedAt: '2026-05-26 09:12:00',
          specimenId: 'SP-002-2',
          specimenName: '甲状腺峡部组织',
          specimenNo: 'SP-TR-002',
          specimenStatus: 'FIXED',
          surgeryName: 'OR-102',
          transportOrderId: null,
        },
        {
          applicationId: 'APP-002',
          applicationNo: 'M2-20260526-002',
          barcode: 'BC-TR-001',
          checkInStatus: 'CHECKED_IN',
          fixationStatus: 'COMPLETED',
          inpatientNo: 'ZY-002',
          outboundAt: null,
          outboundUserName: null,
          patientGender: '女',
          patientId: 'PAT-002',
          patientName: 'Alice',
          registeredAt: '2026-05-26 09:30:00',
          registeredByName: '登记员甲',
          specimenConfirmedAt: '2026-05-26 09:10:00',
          specimenId: 'SP-002',
          specimenName: '甲状腺组织',
          specimenNo: 'SP-TR-001',
          specimenStatus: 'CHECKED_IN',
          surgeryName: 'OR-102',
          transportOrderId: 'TO-002',
        },
      ],
      page: 1,
      size: 20,
      total: 2,
    });

    const specimenNoInput = container.querySelector(
      'input[placeholder="请输入标本条码/编号"]',
    ) as HTMLInputElement | null;
    specimenNoInput!.value = 'SP-TR-002';
    specimenNoInput!.dispatchEvent(new Event('input', { bubbles: true }));
    specimenNoInput!.dispatchEvent(
      new KeyboardEvent('keyup', {
        bubbles: true,
        code: 'Enter',
        key: 'Enter',
      }),
    );
    await flush();

    expect(listSpecimenOutboundsMock).toHaveBeenCalledWith(
      expect.objectContaining({ identifier: 'SP-TR-002' }),
    );
    expect(outboundTransportOrderMock).not.toHaveBeenCalled();
    expect(quickOutboundSpecimenMock).not.toHaveBeenCalled();
    expect(warningMock).toHaveBeenCalledWith(
      '标本 SP-TR-002 尚未完成入库，不能出库',
    );

    app.unmount();
  });

  it('warns and does not quick outbound when the list is empty', async () => {
    const { app, container } = mountView();
    await flush();

    vi.clearAllMocks();
    listSpecimenOutboundsMock.mockResolvedValueOnce({
      items: [],
      page: 1,
      size: 20,
      total: 0,
    });

    const specimenNoInput = container.querySelector(
      'input[placeholder="请输入标本条码/编号"]',
    ) as HTMLInputElement | null;
    specimenNoInput!.value = 'SP-NOT-FOUND';
    specimenNoInput!.dispatchEvent(new Event('input', { bubbles: true }));
    specimenNoInput!.dispatchEvent(
      new KeyboardEvent('keyup', {
        bubbles: true,
        code: 'Enter',
        key: 'Enter',
      }),
    );
    await flush();

    expect(listSpecimenOutboundsMock).toHaveBeenCalledWith(
      expect.objectContaining({ identifier: 'SP-NOT-FOUND' }),
    );
    expect(quickOutboundSpecimenMock).not.toHaveBeenCalled();
    expect(outboundTransportOrderMock).not.toHaveBeenCalled();
    expect(warningMock).toHaveBeenCalledWith('未找到可出库标本：SP-NOT-FOUND');

    app.unmount();
  });

  it('only refreshes the list when specimen serial search matches multiple specimens', async () => {
    const { app, container } = mountView();
    await flush();

    vi.clearAllMocks();
    listSpecimenOutboundsMock.mockResolvedValueOnce({
      items: [
        {
          applicationId: 'APP-003',
          applicationNo: 'M2-20260526-003',
          barcode: 'BC-MULTI-1',
          checkInStatus: 'CHECKED_IN',
          fixationStatus: 'COMPLETED',
          inpatientNo: 'ZY-003',
          outboundAt: null,
          outboundUserName: null,
          patientGender: '男',
          patientId: 'PAT-003',
          patientName: 'Bob',
          registeredAt: '2026-05-26 10:10:00',
          registeredByName: '登记员乙',
          specimenConfirmedAt: '2026-05-26 09:50:00',
          specimenId: 'SP-003',
          specimenName: '淋巴结',
          specimenNo: 'SP-MULTI',
          specimenStatus: 'CHECKED_IN',
          surgeryName: '手术间2',
          transportOrderId: 'TO-003',
        },
        {
          applicationId: 'APP-004',
          applicationNo: 'M2-20260526-004',
          barcode: 'BC-MULTI-2',
          checkInStatus: 'CHECKED_IN',
          fixationStatus: 'COMPLETED',
          inpatientNo: 'ZY-004',
          outboundAt: null,
          outboundUserName: null,
          patientGender: '女',
          patientId: 'PAT-004',
          patientName: 'Carol',
          registeredAt: '2026-05-26 10:20:00',
          registeredByName: '登记员丙',
          specimenConfirmedAt: '2026-05-26 10:00:00',
          specimenId: 'SP-004',
          specimenName: '甲状旁腺',
          specimenNo: 'SP-MULTI',
          specimenStatus: 'CHECKED_IN',
          surgeryName: '手术间3',
          transportOrderId: 'TO-004',
        },
      ],
      page: 1,
      size: 20,
      total: 2,
    });

    const specimenNoInput = container.querySelector(
      'input[placeholder="请输入标本条码/编号"]',
    ) as HTMLInputElement | null;
    specimenNoInput!.value = 'SP-MULTI';
    specimenNoInput!.dispatchEvent(new Event('input', { bubbles: true }));
    specimenNoInput!.dispatchEvent(
      new KeyboardEvent('keyup', {
        bubbles: true,
        code: 'Enter',
        key: 'Enter',
      }),
    );
    await flush();

    expect(listSpecimenOutboundsMock).toHaveBeenCalledWith(
      expect.objectContaining({ identifier: 'SP-MULTI' }),
    );
    expect(outboundTransportOrderMock).not.toHaveBeenCalled();
    expect(warningMock).not.toHaveBeenCalled();

    app.unmount();
  });

  it('blocks transport when outbound operator is not selected', async () => {
    mockUserInfo.loginName = '';
    mockUserInfo.realName = '';
    mockUserInfo.userId = '';

    const { app, container } = mountView();
    await flush();

    vi.clearAllMocks();
    listSpecimenOutboundsMock.mockResolvedValueOnce({
      items: [
        {
          applicationId: 'APP-002',
          applicationNo: 'M2-20260526-002',
          barcode: 'BC-NO-OPERATOR',
          checkInStatus: 'CHECKED_IN',
          fixationStatus: 'COMPLETED',
          inpatientNo: 'ZY-002',
          outboundAt: null,
          outboundUserName: null,
          patientGender: '女',
          patientId: 'PAT-002',
          patientName: 'Alice',
          registeredAt: '2026-05-26 09:30:00',
          registeredByName: '登记员甲',
          specimenConfirmedAt: '2026-05-26 09:10:00',
          specimenId: 'SP-002',
          specimenName: '甲状腺组织',
          specimenNo: 'SP-NO-OPERATOR',
          specimenStatus: 'CHECKED_IN',
          surgeryName: 'OR-102',
          transportOrderId: 'TO-002',
        },
      ],
      page: 1,
      size: 20,
      total: 1,
    });

    const specimenNoInput = container.querySelector(
      'input[placeholder="请输入标本条码/编号"]',
    ) as HTMLInputElement | null;
    specimenNoInput!.value = 'SP-NO-OPERATOR';
    specimenNoInput!.dispatchEvent(new Event('input', { bubbles: true }));
    specimenNoInput!.dispatchEvent(
      new KeyboardEvent('keyup', {
        bubbles: true,
        code: 'Enter',
        key: 'Enter',
      }),
    );
    await flush();

    expect(listSpecimenOutboundsMock).toHaveBeenCalledWith(
      expect.objectContaining({ identifier: 'SP-NO-OPERATOR' }),
    );
    const transportButton = [...container.querySelectorAll('button')].find(
      (button) => button.textContent?.includes('转运'),
    ) as HTMLButtonElement | undefined;
    expect(transportButton?.disabled).toBe(false);
    transportButton!.click();
    await flush();

    expect(warningMock).toHaveBeenCalledWith('请选择操作人');
    expect(outboundTransportOrderMock).not.toHaveBeenCalled();
    expect(quickOutboundSpecimenMock).not.toHaveBeenCalled();
    expect(verifyOperatorMock).not.toHaveBeenCalled();

    app.unmount();
  });
});
