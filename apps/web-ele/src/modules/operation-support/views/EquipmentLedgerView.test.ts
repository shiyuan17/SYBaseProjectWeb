import { createApp, defineComponent, h, nextTick } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { M5_PERMISSION_CODES } from '../constants';

vi.mock('element-plus/theme-chalk/base.css', () => ({}));
vi.mock('vue-router', () => ({
  useRoute: () => ({
    meta: {
      description: '设备页面描述',
      title: '仪器设备管理',
    },
  }),
}));

const {
  messageErrorMock,
  messageSuccessMock,
  messageWarningMock,
  mockAccessStore,
  mockCreateEquipmentMaintenanceLog,
  mockCreateEquipmentRecord,
  mockListEquipmentMaintenanceLogs,
  mockListEquipmentRecords,
  mockListEquipmentWarnings,
  mockUpdateEquipmentRecord,
  mockUserStore,
} = vi.hoisted(() => ({
  messageErrorMock: vi.fn(),
  messageSuccessMock: vi.fn(),
  messageWarningMock: vi.fn(),
  mockAccessStore: {
    accessCodes: [] as string[],
  },
  mockCreateEquipmentMaintenanceLog: vi.fn(),
  mockCreateEquipmentRecord: vi.fn(),
  mockListEquipmentMaintenanceLogs: vi.fn(),
  mockListEquipmentRecords: vi.fn(),
  mockListEquipmentWarnings: vi.fn(),
  mockUpdateEquipmentRecord: vi.fn(),
  mockUserStore: {
    userInfo: {
      realName: '设备员甲',
    },
  },
}));

vi.mock('@vben/common-ui', () => ({
  Fallback: defineComponent({
    props: ['status'],
    setup(props) {
      return () => h('div', `fallback-${props.status}`);
    },
  }),
  Page: defineComponent({
    props: ['description', 'title'],
    setup(props, { slots }) {
      return () =>
        h('main', [
          h('h1', props.title),
          props.description ? h('p', props.description) : null,
          slots.default?.(),
        ]);
    },
  }),
}));

vi.mock('@vben/stores', () => ({
  useAccessStore: () => mockAccessStore,
  useUserStore: () => mockUserStore,
}));

function createModelComponent(tag = 'div') {
  return defineComponent({
    props: ['modelValue'],
    emits: ['update:modelValue'],
    setup(_, { attrs, slots }) {
      return () => h(tag, attrs, slots.default?.());
    },
  });
}

vi.mock('element-plus', () => {
  const ElAlert = defineComponent({
    props: ['title'],
    setup(props, { slots }) {
      return () => h('section', [props.title, slots.default?.()]);
    },
  });

  const ElButton = defineComponent({
    props: ['disabled'],
    emits: ['click'],
    setup(props, { attrs, emit, slots }) {
      return () =>
        h(
          'button',
          {
            ...attrs,
            disabled: props.disabled,
            type: 'button',
            onClick: (event: MouseEvent) => emit('click', event),
          },
          slots.default?.(),
        );
    },
  });

  const ElDescriptions = defineComponent({
    setup(_, { slots }) {
      return () => h('div', slots.default?.());
    },
  });

  const ElDescriptionsItem = defineComponent({
    props: ['label'],
    setup(props, { slots }) {
      return () => h('div', [`${props.label ?? ''}`, slots.default?.()]);
    },
  });

  const ElDialog = defineComponent({
    props: ['modelValue', 'title'],
    emits: ['update:modelValue'],
    setup(props, { slots }) {
      return () =>
        props.modelValue
          ? h('section', [
              h('h2', props.title),
              slots.default?.(),
              slots.footer?.(),
            ])
          : null;
    },
  });

  const ElDrawer = defineComponent({
    props: ['modelValue', 'title'],
    emits: ['update:modelValue'],
    setup(props, { slots }) {
      return () =>
        props.modelValue ? h('section', [h('h2', props.title), slots.default?.()]) : null;
    },
  });

  const ElTable = defineComponent({
    props: ['data'],
    emits: ['current-change'],
    setup(props, { slots, emit }) {
      return () =>
        h('div', [
          props.data?.map((row: { equipmentCode?: string; id: string }) =>
            h(
              'button',
              {
                type: 'button',
                'data-row-id': row.id,
                onClick: () => emit('current-change', row),
              },
              row.equipmentCode ?? row.id,
            ),
          ),
          slots.default?.(),
        ]);
    },
  });

  const ElTableColumn = defineComponent({
    setup() {
      return () => null;
    },
  });

  const ElTag = defineComponent({
    setup(_, { slots }) {
      return () => h('span', slots.default?.());
    },
  });

  return {
    ElAlert,
    ElButton,
    ElDescriptions,
    ElDescriptionsItem,
    ElDialog,
    ElDrawer,
    ElForm: createModelComponent('form'),
    ElFormItem: createModelComponent('div'),
    ElInput: createModelComponent('input'),
    ElMessage: {
      error: messageErrorMock,
      success: messageSuccessMock,
      warning: messageWarningMock,
    },
    ElOption: defineComponent({
      props: ['label'],
      setup(props) {
        return () => h('option', props.label);
      },
    }),
    ElSelect: createModelComponent('select'),
    ElTable,
    ElTableColumn,
    ElTag,
  };
});

vi.mock('../components/EquipmentDetailPanel.vue', () => ({
  default: defineComponent({
    emits: ['submitMaintenanceLog'],
    setup(_, { emit }) {
      return () =>
        h('div', [
          'equipment-detail-panel',
          h(
            'button',
            {
              type: 'button',
              onClick: () => emit('submitMaintenanceLog'),
            },
            '提交保养',
          ),
        ]);
    },
  }),
}));

vi.mock('../components/EquipmentWarningPanel.vue', () => ({
  default: defineComponent({
    props: ['warnings'],
    emits: ['navigateToEquipmentDetail'],
    setup(props, { emit }) {
      return () =>
        h('div', [
          'equipment-warning-panel',
          props.warnings?.map((warning: { equipmentCode: string; equipmentId: string }) =>
            h(
              'button',
              {
                type: 'button',
                onClick: () => emit('navigateToEquipmentDetail', warning),
              },
              `定位-${warning.equipmentCode}`,
            ),
          ),
        ]);
    },
  }),
}));

vi.mock('../components/EquipmentDialog.vue', () => ({
  default: defineComponent({
    props: ['modelValue'],
    setup(props) {
      return () => (props.modelValue ? h('div', 'equipment-dialog') : null);
    },
  }),
}));

vi.mock('../api/operation-support-service', () => ({
  createEquipmentMaintenanceLog: mockCreateEquipmentMaintenanceLog,
  createEquipmentRecord: mockCreateEquipmentRecord,
  listEquipmentMaintenanceLogs: mockListEquipmentMaintenanceLogs,
  listEquipmentRecords: mockListEquipmentRecords,
  listEquipmentWarnings: mockListEquipmentWarnings,
  updateEquipmentRecord: mockUpdateEquipmentRecord,
}));

import EquipmentLedgerView from './EquipmentLedgerView.vue';

function mountView() {
  const root = document.createElement('div');
  document.body.append(root);

  const app = createApp({
    render: () => h(EquipmentLedgerView),
  });
  app.directive('loading', {});

  app.mount(root);

  return {
    app,
    root,
  };
}

async function flushView() {
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

function findButton(label: string) {
  return [...document.querySelectorAll('button')].find(
    (button) => button.textContent?.trim() === label,
  ) as HTMLButtonElement | undefined;
}

describe('EquipmentLedgerView', () => {
  beforeEach(() => {
    mockAccessStore.accessCodes = [
      M5_PERMISSION_CODES.EQUIPMENT_QUERY,
      M5_PERMISSION_CODES.EQUIPMENT_CREATE,
      M5_PERMISSION_CODES.EQUIPMENT_UPDATE,
      M5_PERMISSION_CODES.EQUIPMENT_MAINTENANCE_CREATE,
      M5_PERMISSION_CODES.EQUIPMENT_WARNING_QUERY,
    ];

    mockListEquipmentRecords.mockResolvedValue([
      {
        enabledAt: '2026-01-01',
        equipmentCategory: 'PROCESSING',
        equipmentCode: 'EQ-1',
        equipmentName: 'Processor',
        equipmentStatus: 'ACTIVE',
        id: 'EQUIPMENT-1',
        locationDescription: 'Lab A',
        modelNo: 'M-1',
        nextMaintenanceAt: '2026-06-01',
        remarks: 'Ready',
      },
    ]);
    mockListEquipmentMaintenanceLogs.mockResolvedValue([
      {
        description: 'Cleaned',
        equipmentId: 'EQUIPMENT-1',
        id: 'LOG-1',
        maintenanceStatus: 'COMPLETED',
        maintenanceType: 'MAINTENANCE',
        nextMaintenanceAt: '2026-07-01',
        performedAt: '2026-05-30',
        performedByName: '设备员甲',
        remarks: 'OK',
      },
    ]);
    mockListEquipmentWarnings.mockResolvedValue([
      {
        equipmentCode: 'EQ-1',
        equipmentId: 'EQUIPMENT-1',
        equipmentName: 'Processor',
        equipmentStatus: 'ACTIVE',
        nextMaintenanceAt: '2026-06-01',
        warningType: 'DUE_SOON',
      },
    ]);

    mockCreateEquipmentRecord.mockResolvedValue(undefined);
    mockCreateEquipmentMaintenanceLog.mockResolvedValue(undefined);
    mockUpdateEquipmentRecord.mockResolvedValue(undefined);
  });

  afterEach(() => {
    mockAccessStore.accessCodes = [];
    mockCreateEquipmentMaintenanceLog.mockReset();
    mockCreateEquipmentRecord.mockReset();
    mockListEquipmentMaintenanceLogs.mockReset();
    mockListEquipmentRecords.mockReset();
    mockListEquipmentWarnings.mockReset();
    mockUpdateEquipmentRecord.mockReset();
    messageErrorMock.mockReset();
    messageSuccessMock.mockReset();
    messageWarningMock.mockReset();
    document.body.innerHTML = '';
  });

  it('shows fallback when user has no equipment ledger access', async () => {
    mockAccessStore.accessCodes = [];

    const { app, root } = mountView();
    await flushView();

    expect(document.body.textContent).toContain('fallback-403');
    expect(mockListEquipmentRecords).not.toHaveBeenCalled();
    expect(mockListEquipmentWarnings).not.toHaveBeenCalled();

    app.unmount();
    root.remove();
  });

  it('renders toolbar actions and keeps selected-row actions disabled before selection', async () => {
    const { app, root } = mountView();
    await flushView();

    expect(document.body.textContent).toContain('仪器设备管理');
    expect(mockListEquipmentRecords).toHaveBeenCalledTimes(1);
    expect(mockListEquipmentWarnings).toHaveBeenCalledTimes(1);

    expect(findButton('刷新')).toBeTruthy();
    expect(findButton('新增设备')).toBeTruthy();
    expect(findButton('编辑设备')?.disabled).toBe(true);
    expect(findButton('设备详情/保养')?.disabled).toBe(true);
    expect(findButton('设备预警')).toBeTruthy();

    app.unmount();
    root.remove();
  });

  it('opens create dialog from toolbar', async () => {
    const { app, root } = mountView();
    await flushView();

    findButton('新增设备')?.dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );
    await flushView();

    expect(document.body.textContent).toContain('equipment-dialog');

    app.unmount();
    root.remove();
  });

  it('opens detail drawer after selecting a row and loads maintenance logs', async () => {
    const { app, root } = mountView();
    await flushView();

    document
      .querySelector('[data-row-id="EQUIPMENT-1"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushView();

    expect(findButton('编辑设备')?.disabled).toBe(false);
    expect(findButton('设备详情/保养')?.disabled).toBe(false);

    findButton('设备详情/保养')?.dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );
    await flushView();

    expect(document.body.textContent).toContain('设备详情与保养');
    expect(document.body.textContent).toContain('equipment-detail-panel');
    expect(mockListEquipmentMaintenanceLogs).toHaveBeenCalledWith(
      'EQUIPMENT-1',
    );

    app.unmount();
    root.remove();
  });

  it('navigates from warning drawer back to the equipment list selection', async () => {
    const { app, root } = mountView();
    await flushView();

    findButton('设备预警')?.dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );
    await flushView();

    expect(document.body.textContent).toContain('equipment-warning-panel');

    [...document.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('定位-EQ-1'))
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushView();

    expect(messageSuccessMock).toHaveBeenCalledWith('已定位到设备 EQ-1');
    expect(mockListEquipmentRecords).toHaveBeenCalledTimes(2);

    app.unmount();
    root.remove();
  });
});
