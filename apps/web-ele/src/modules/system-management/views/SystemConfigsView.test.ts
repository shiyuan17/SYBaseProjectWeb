import {
  createApp,
  defineComponent,
  h,
  inject,
  nextTick,
  onMounted,
  provide,
} from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const serviceMocks = vi.hoisted(() => ({
  createSpecimenDictionaryCategory: vi.fn(),
  createSpecimenDictionaryItem: vi.fn(),
  createSystemConfigCategory: vi.fn(),
  createSystemConfigItem: vi.fn(),
  deleteSpecimenDictionaryCategory: vi.fn(),
  deleteSpecimenDictionaryItem: vi.fn(),
  deleteSystemConfigCategory: vi.fn(),
  deleteSystemConfigItem: vi.fn(),
  getSpecimenDictionaryConfigTree: vi.fn(),
  listDepartments: vi.fn(),
  listSystemConfigs: vi.fn(),
  updateSpecimenDictionaryCategory: vi.fn(),
  updateSpecimenDictionaryItem: vi.fn(),
  updateSystemConfigCategory: vi.fn(),
  updateSystemConfigItem: vi.fn(),
}));

vi.mock('@vben/common-ui', () => ({
  Page: defineComponent({
    name: 'MockPage',
    setup(_, { slots }) {
      return () => h('div', slots.default?.());
    },
  }),
}));

vi.mock('element-plus', () => {
  const tableDataKey = Symbol('table-data');

  const ElButton = defineComponent({
    name: 'ElButton',
    emits: ['click'],
    setup(_, { emit, slots }) {
      return () =>
        h(
          'button',
          {
            onClick: () => emit('click'),
            type: 'button',
          },
          slots.default?.(),
        );
    },
  });

  const ElDescriptions = defineComponent({
    name: 'ElDescriptions',
    setup(_, { slots }) {
      return () => h('div', slots.default?.());
    },
  });

  const ElDescriptionsItem = defineComponent({
    name: 'ElDescriptionsItem',
    setup(_, { slots }) {
      return () => h('div', slots.default?.());
    },
  });

  const ElDialog = defineComponent({
    name: 'ElDialog',
    props: {
      modelValue: {
        default: false,
        type: Boolean,
      },
      title: {
        default: '',
        type: String,
      },
    },
    setup(props, { slots }) {
      return () =>
        props.modelValue
          ? h('div', [
              h('div', props.title),
              slots.default?.(),
              slots.footer?.(),
            ])
          : null;
    },
  });

  const ElEmpty = defineComponent({
    name: 'ElEmpty',
    props: {
      description: {
        default: '',
        type: String,
      },
    },
    setup(props) {
      return () => h('div', props.description);
    },
  });

  const ElForm = defineComponent({
    name: 'ElForm',
    setup(_, { slots }) {
      return () => h('form', slots.default?.());
    },
  });

  const ElFormItem = defineComponent({
    name: 'ElFormItem',
    props: {
      label: {
        default: '',
        type: String,
      },
    },
    setup(props, { slots }) {
      return () => h('label', [props.label, slots.default?.()]);
    },
  });

  const ElInput = defineComponent({
    name: 'ElInput',
    props: {
      modelValue: {
        default: '',
        type: String,
      },
    },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
      return () =>
        h('input', {
          onInput: (event: Event) =>
            emit('update:modelValue', (event.target as HTMLInputElement).value),
          value: props.modelValue,
        });
    },
  });

  const ElInputNumber = defineComponent({
    name: 'ElInputNumber',
    props: {
      modelValue: {
        default: 0,
        type: Number,
      },
    },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
      return () =>
        h('input', {
          onInput: (event: Event) =>
            emit(
              'update:modelValue',
              Number((event.target as HTMLInputElement).value),
            ),
          type: 'number',
          value: props.modelValue,
        });
    },
  });

  const ElMessage = {
    success: vi.fn(),
  };

  const ElOption = defineComponent({
    name: 'ElOption',
    props: {
      label: {
        default: '',
        type: String,
      },
      value: {
        default: '',
        type: String,
      },
    },
    setup(props) {
      return () => h('option', { value: props.value }, props.label);
    },
  });

  const ElSelect = defineComponent({
    name: 'ElSelect',
    setup(_, { slots }) {
      return () => h('select', slots.default?.());
    },
  });

  const ElSwitch = defineComponent({
    name: 'ElSwitch',
    props: {
      modelValue: {
        default: false,
        type: Boolean,
      },
    },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
      return () =>
        h('input', {
          checked: props.modelValue,
          onChange: (event: Event) =>
            emit(
              'update:modelValue',
              (event.target as HTMLInputElement).checked,
            ),
          type: 'checkbox',
        });
    },
  });

  const ElTable = defineComponent({
    name: 'ElTable',
    props: {
      data: {
        default: () => [],
        type: Array,
      },
    },
    setup(props, { slots }) {
      provide(tableDataKey, () => props.data as Array<Record<string, unknown>>);
      return () => h('div', slots.default?.());
    },
  });

  const ElTableColumn = defineComponent({
    name: 'ElTableColumn',
    props: {
      label: {
        default: '',
        type: String,
      },
      prop: {
        default: '',
        type: String,
      },
    },
    setup(props, { slots }) {
      const getRows = inject<() => Array<Record<string, unknown>>>(
        tableDataKey,
        () => [],
      );

      return () =>
        h('div', [
          props.label ? h('div', props.label) : null,
          ...getRows().map((row, index) =>
            h(
              'div',
              { key: `${props.label}-${index}` },
              slots.default
                ? slots.default({ row })
                : (props.prop
                  ? String(row[props.prop] ?? '')
                  : ''),
            ),
          ),
        ]);
    },
  });

  const ElTag = defineComponent({
    name: 'ElTag',
    setup(_, { slots }) {
      return () => h('span', slots.default?.());
    },
  });

  const ElTree = defineComponent({
    name: 'ElTree',
    props: {
      data: {
        default: () => [],
        type: Array,
      },
    },
    emits: ['current-change', 'node-click'],
    setup(props, { emit }) {
      onMounted(() => {
        const firstNode = props.data[0] as undefined | { id?: string };
        if (firstNode) {
          emit('current-change', firstNode);
          emit('node-click', firstNode);
        }
      });

      return () =>
        h(
          'div',
          props.data.map((node) =>
            h(
              'button',
              {
                key: (node as { id: string }).id,
                onClick: () => {
                  emit('current-change', node);
                  emit('node-click', node);
                },
                type: 'button',
              },
              (node as { categoryName: string }).categoryName,
            ),
          ),
        );
    },
  });

  return {
    ElButton,
    ElDescriptions,
    ElDescriptionsItem,
    ElDialog,
    ElEmpty,
    ElForm,
    ElFormItem,
    ElInput,
    ElInputNumber,
    ElMessage,
    ElOption,
    ElSelect,
    ElSwitch,
    ElTable,
    ElTableColumn,
    ElTag,
    ElTree,
  };
});

vi.mock('../api/system-management-service', () => serviceMocks);
vi.mock('../components/SystemLoadError.vue', () => ({
  default: defineComponent({
    name: 'MockSystemLoadError',
    props: {
      message: {
        default: '',
        type: String,
      },
    },
    setup(props) {
      return () => h('div', props.message);
    },
  }),
}));
vi.mock('../components/SystemSectionCard.vue', () => ({
  default: defineComponent({
    name: 'MockSystemSectionCard',
    props: {
      description: {
        default: '',
        type: String,
      },
      title: {
        default: '',
        type: String,
      },
    },
    setup(props, { slots }) {
      return () =>
        h('section', [
          h('h3', props.title),
          h('p', props.description),
          slots.extra?.(),
          slots.default?.(),
        ]);
    },
  }),
}));
vi.mock('../components/SystemStatusTag.vue', () => ({
  default: defineComponent({
    name: 'MockSystemStatusTag',
    props: {
      enabled: {
        default: false,
        type: Boolean,
      },
    },
    setup(props) {
      return () => h('span', props.enabled ? '启用' : '停用');
    },
  }),
}));
vi.mock('#/api/request', () => ({}));

import SystemConfigsView from './SystemConfigsView.vue';

function createHarness() {
  const root = document.createElement('div');
  document.body.append(root);
  const app = createApp({
    render() {
      return h(SystemConfigsView);
    },
  });
  app.directive('access', () => {});
  app.directive('loading', () => {});
  app.mount(root);

  return {
    root,
    unmount() {
      app.unmount();
      root.remove();
    },
  };
}

function clickButtonByText(root: HTMLElement, text: string) {
  const buttons = [...root.querySelectorAll('button')];
  const button = buttons.find((item) => item.textContent?.includes(text));
  button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

async function flushView() {
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

describe('SystemConfigsView', () => {
  beforeEach(() => {
    serviceMocks.listSystemConfigs.mockResolvedValue([
      {
        categoryCode: 'SPECIMEN_DICTIONARY',
        categoryName: '标本字典',
        categoryType: 'SPECIMEN_DICTIONARY',
        children: [],
        enabled: true,
        id: 'SCC_SPECIMEN_DICTIONARY',
        items: [],
        parentId: 'SCC_ROOT',
        sortOrder: 30,
      },
      {
        categoryCode: 'GENERAL',
        categoryName: '通用配置',
        categoryType: 'CONFIG',
        children: [],
        enabled: true,
        id: 'SCC_GENERAL',
        items: [
          {
            categoryId: 'SCC_GENERAL',
            configKey: 'workflow.reference.operating.room.name',
            configName: '手术室名称',
            configValue: 'OR-201',
            enabled: true,
            id: 'SCI_GENERAL_001',
            remarks: null,
            sortOrder: 10,
            valueType: 'STRING',
          },
          {
            categoryId: 'SCC_GENERAL',
            configKey: 'system.theme.display-name',
            configName: '主题名称',
            configValue: '浅色主题',
            enabled: true,
            id: 'SCI_GENERAL_002',
            remarks: null,
            sortOrder: 20,
            valueType: 'STRING',
          },
        ],
        parentId: 'SCC_ROOT',
        sortOrder: 10,
      },
    ]);
    serviceMocks.getSpecimenDictionaryConfigTree.mockResolvedValue({
      items: [
        {
          configKey: 'specimen.dictionary.item.028',
          departmentIds: ['DEPT-GYNE'],
          enabled: true,
          id: 'SCI_SPEC_DICT_028',
          partCategoryId: 'SCC_SPEC_DICT_PART_301',
          remarks: null,
          sortOrder: 10,
          specimenName: '宫颈 3 点位组织',
        },
      ],
      systems: [
        {
          categoryCode: 'SPECIMEN_SYSTEM_GYNE',
          categoryName: '妇科',
          enabled: true,
          id: 'SCC_SPEC_DICT_SYS_003',
          parts: [
            {
              categoryCode: 'SPECIMEN_PART_CERVIX',
              categoryName: '宫颈',
              enabled: true,
              id: 'SCC_SPEC_DICT_PART_301',
              items: [
                {
                  configKey: 'specimen.dictionary.item.028',
                  departmentIds: ['DEPT-GYNE'],
                  enabled: true,
                  id: 'SCI_SPEC_DICT_028',
                  partCategoryId: 'SCC_SPEC_DICT_PART_301',
                  remarks: null,
                  sortOrder: 10,
                  specimenName: '宫颈 3 点位组织',
                },
              ],
              parentId: 'SCC_SPEC_DICT_SYS_003',
              sortOrder: 10,
            },
          ],
          sortOrder: 30,
        },
      ],
    });
    serviceMocks.listDepartments.mockResolvedValue([
      {
        children: [],
        departmentCode: 'GYNECOLOGY',
        departmentName: '妇科',
        enabled: true,
        id: 'DEPT-GYNE',
        parentId: 'DEPT_CLINICAL',
        sortOrder: 70,
      },
    ]);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('renders specimen dictionary workspace when the root category is selected', async () => {
    const harness = createHarness();
    await flushView();

    expect(harness.root.textContent).toContain('标本字典分类详情');
    expect(harness.root.textContent).toContain('标本字典项');
    expect(harness.root.textContent).toContain('宫颈 3 点位组织');
    expect(harness.root.textContent).not.toContain('分类编码');
    expect(harness.root.textContent).not.toContain('分类类型');
    expect(harness.root.textContent).not.toContain('配置键');

    harness.unmount();
  });

  it('hides internal config fields in display areas but keeps edit dialog fields', async () => {
    const harness = createHarness();
    await flushView();

    clickButtonByText(harness.root, '通用配置');
    await flushView();

    expect(harness.root.textContent).toContain('配置项列表');
    expect(harness.root.textContent).toContain('主题名称');
    expect(harness.root.textContent).toContain('浅色主题');
    expect(harness.root.textContent).not.toContain('配置键');
    expect(harness.root.textContent).not.toContain('值类型');
    expect(harness.root.textContent).not.toContain('OR-201');

    clickButtonByText(harness.root, '新增配置项');
    await flushView();

    expect(harness.root.textContent).toContain('新增配置项');
    expect(harness.root.textContent).toContain('配置键');
    expect(harness.root.textContent).toContain('值类型');

    harness.unmount();
  });
});
