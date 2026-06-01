import { createApp, h, nextTick } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import TransportHandoverView from './TransportHandoverView.vue';

const {
  listSpecimenOutboundsMock,
  loadOperatingRoomNameMapSafelyMock,
  outboundTransportOrderMock,
  quickOutboundSpecimenMock,
  warningMock,
} = vi.hoisted(() => ({
  listSpecimenOutboundsMock: vi.fn(async () => ({
    items: [
      {
        applicationId: 'APP-002',
        applicationNo: 'M2-20260526-002',
        inpatientNo: 'ZY-002',
        outboundAt: null,
        outboundUserName: null,
        patientGender: '女',
        patientId: 'PAT-002',
        patientName: 'Alice',
        registeredAt: '2026-05-26 09:30:00',
        registeredByName: '登记员甲',
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
    total: 1,
  })),
  loadOperatingRoomNameMapSafelyMock: vi.fn(async () =>
    new Map([['OR-102', '惠侨楼 - 手术室 2']]),
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

vi.mock('../components/WorkflowSectionCard.vue', () => ({
  default: {
    props: ['title', 'description'],
    template:
      '<section><h2>{{ title }}</h2><p v-if="description">{{ description }}</p><slot /></section>',
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
      value ? roomMap.get(value) ?? value : '',
  ),
}));

vi.mock('../api/specimen-workflow-service', () => ({
  listSpecimenOutbounds: listSpecimenOutboundsMock,
  outboundTransportOrder: outboundTransportOrderMock,
  quickOutboundSpecimen: quickOutboundSpecimenMock,
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
    mockUserInfo.realName = 'Test User';
    mockUserInfo.userId = 'USER-001';
    vi.clearAllMocks();
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
    expect(container.textContent).not.toContain('查询');
    expect(container.textContent).not.toContain('重置');
    expect(container.textContent).not.toContain('创建转运单');
    expect(container.textContent).not.toContain('批量打印');
    expect(container.textContent).not.toContain('批量交接');
    expect(container.textContent).not.toContain('最近操作结果');
    expect(container.textContent).not.toContain('转运单号');
    expect(container.textContent).not.toContain('交接科室');
    expect(container.textContent).not.toContain('接收科室');
    expect(container.textContent).not.toContain('操作');

    const expectedHeaders = [
      '序号',
      '申请单',
      '标本编号',
      '姓名',
      '住院号',
      '性别',
      '手术间',
      '标本名称',
      '标本状态',
      '添加时间',
      '添加人',
      '病人ID',
      '出库时间',
      '出库人',
    ];
    const headerTexts = [
      ...container.querySelectorAll('thead th'),
    ].map((element) => element.textContent?.replace(/\s+/g, '') ?? '');
    expect(headerTexts).toEqual(expectedHeaders);

    app.unmount();
  });

  it('submits outbound directly when specimen serial search matches one pending specimen', async () => {
    const { app, container } = mountView();
    await flush();

    vi.clearAllMocks();

    const specimenNoInput = container.querySelector(
      'input[placeholder="请输入标本流水号"]',
    ) as HTMLInputElement | null;
    specimenNoInput!.value = 'SP-TR-001';
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
      expect.objectContaining({ specimenNo: 'SP-TR-001' }),
    );
    expect(outboundTransportOrderMock).toHaveBeenCalledWith('TO-002', {
      outboundUserId: 'USER-001',
      outboundUserName: 'Test User',
      remarks: null,
      terminalCode: null,
    });
    expect(warningMock).not.toHaveBeenCalled();

    app.unmount();
  });

  it('quick outbounds by specimen serial number when the list is empty', async () => {
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
      'input[placeholder="请输入标本流水号"]',
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
      expect.objectContaining({ specimenNo: 'SP-NOT-FOUND' }),
    );
    expect(quickOutboundSpecimenMock).toHaveBeenCalledWith({
      identifier: 'SP-NOT-FOUND',
      identifierType: 'SPECIMEN_NO',
      outboundUserId: 'USER-001',
      outboundUserName: 'Test User',
      remarks: null,
      terminalCode: null,
    });
    expect(outboundTransportOrderMock).not.toHaveBeenCalled();
    expect(warningMock).not.toHaveBeenCalled();

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
          inpatientNo: 'ZY-003',
          outboundAt: null,
          outboundUserName: null,
          patientGender: '男',
          patientId: 'PAT-003',
          patientName: 'Bob',
          registeredAt: '2026-05-26 10:10:00',
          registeredByName: '登记员乙',
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
          inpatientNo: 'ZY-004',
          outboundAt: null,
          outboundUserName: null,
          patientGender: '女',
          patientId: 'PAT-004',
          patientName: 'Carol',
          registeredAt: '2026-05-26 10:20:00',
          registeredByName: '登记员丙',
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
      'input[placeholder="请输入标本流水号"]',
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
      expect.objectContaining({ specimenNo: 'SP-MULTI' }),
    );
    expect(outboundTransportOrderMock).not.toHaveBeenCalled();
    expect(warningMock).not.toHaveBeenCalled();

    app.unmount();
  });

  it('blocks direct and quick outbound when outbound operator is not selected', async () => {
    mockUserInfo.realName = '';
    mockUserInfo.userId = '';

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
      'input[placeholder="请输入标本流水号"]',
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
      expect.objectContaining({ specimenNo: 'SP-NO-OPERATOR' }),
    );
    expect(warningMock).toHaveBeenCalledWith('请选择出库人');
    expect(outboundTransportOrderMock).not.toHaveBeenCalled();
    expect(quickOutboundSpecimenMock).not.toHaveBeenCalled();

    app.unmount();
  });
});
