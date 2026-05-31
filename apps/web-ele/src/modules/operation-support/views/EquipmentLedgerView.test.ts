import { createApp, defineComponent, h, nextTick } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { M5_PERMISSION_CODES } from '../constants';

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
    emits: ['click'],
    setup(_, { attrs, emit, slots }) {
      return () =>
        h(
          'button',
          {
            ...attrs,
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

  const ElTable = defineComponent({
    emits: ['current-change'],
    setup(_, { slots }) {
      return () => h('div', slots.default?.());
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

vi.mock('../components/OperationSectionCard.vue', () => ({
  default: defineComponent({
    props: ['description', 'title'],
    setup(props, { slots }) {
      return () =>
        h('section', [
          h('h2', props.title),
          props.description ? h('p', props.description) : null,
          slots.extra?.(),
          slots.default?.(),
        ]);
    },
  }),
}));

function createMarkerComponent(label: string, renderWhenVisible = false) {
  return defineComponent({
    props: ['modelValue'],
    setup(props) {
      return () => {
        if (!renderWhenVisible) {
          return h('div', label);
        }
        if (props.modelValue) {
          return h('div', label);
        }
        return null;
      };
    },
  });
}

vi.mock('../components/EquipmentCatalogPanel.vue', () => ({
  default: defineComponent({
    emits: ['openCreateEquipmentDialog'],
    setup(_, { emit }) {
      return () =>
        h('div', [
          h('div', 'equipment-catalog-panel'),
          h(
            'button',
            {
              type: 'button',
              onClick: () => emit('openCreateEquipmentDialog'),
            },
            '新增设备',
          ),
        ]);
    },
  }),
}));

vi.mock('../components/EquipmentDetailPanel.vue', () => ({
  default: createMarkerComponent('equipment-detail-panel'),
}));

vi.mock('../components/EquipmentWarningPanel.vue', () => ({
  default: createMarkerComponent('equipment-warning-panel'),
}));

vi.mock('../components/EquipmentDialog.vue', () => ({
  default: createMarkerComponent('equipment-dialog', true),
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

  it('renders main equipment sections and opens create dialog from toolbar', async () => {
    const { app, root } = mountView();
    await flushView();

    expect(document.body.textContent).toContain('设备台账');
    expect(document.body.textContent).toContain('equipment-catalog-panel');
    expect(document.body.textContent).toContain('equipment-detail-panel');
    expect(document.body.textContent).toContain('equipment-warning-panel');
    expect(mockListEquipmentRecords).toHaveBeenCalledTimes(1);
    expect(mockListEquipmentWarnings).toHaveBeenCalledTimes(1);

    const createButton = [...document.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === '新增设备',
    );
    expect(createButton).toBeTruthy();

    createButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushView();

    expect(document.body.textContent).toContain('equipment-dialog');

    app.unmount();
    root.remove();
  });
});
