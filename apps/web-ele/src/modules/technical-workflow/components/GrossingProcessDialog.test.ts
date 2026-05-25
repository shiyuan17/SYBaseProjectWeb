/* eslint-disable vue/one-component-per-file, vue/require-prop-types -- Element Plus mocks are compact inline test doubles for this dialog. */
import {
  createApp,
  defineComponent,
  h,
  inject,
  nextTick,
  onMounted,
  provide,
  ref,
  watch,
} from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

const tabsContextKey = Symbol('tabs-context');

const {
  messageSuccess,
  messageWarning,
  mockCompleteGrossing,
  mockGetTechnicalTracking,
  mockListBodyParts,
  mockListSamplingTemplates,
  mockLoadWorkflowReferenceOptionsSafely,
  mockUploadGrossingMediaAsset,
  mockUserStore,
} = vi.hoisted(() => ({
  messageSuccess: vi.fn(),
  messageWarning: vi.fn(),
  mockCompleteGrossing: vi.fn(),
  mockGetTechnicalTracking: vi.fn(),
  mockListBodyParts: vi.fn(),
  mockListSamplingTemplates: vi.fn(),
  mockLoadWorkflowReferenceOptionsSafely: vi.fn(),
  mockUploadGrossingMediaAsset: vi.fn(),
  mockUserStore: {
    userInfo: {
      realName: '当前取材员',
      userId: 'USER-001',
    },
  },
}));

vi.mock('@vben/stores', () => ({
  useUserStore: () => mockUserStore,
}));

vi.mock('#/modules/system-management/api/system-management-service', () => ({
  listBodyParts: mockListBodyParts,
  listSamplingTemplates: mockListSamplingTemplates,
}));

vi.mock('#/modules/system-management/api/workflow-reference-service', () => ({
  createEmptyWorkflowReferenceOptions: () => ({
    specimenTypes: [],
  }),
  loadWorkflowReferenceOptionsSafely: mockLoadWorkflowReferenceOptionsSafely,
}));

vi.mock('#/modules/system-management/components/ReferenceOptionSelect.vue', () => ({
  default: defineComponent({
    props: ['modelValue', 'placeholder'],
    emits: ['update:modelValue'],
    setup(props, { emit }) {
      return () =>
        h('input', {
          placeholder: props.placeholder,
          value: props.modelValue,
          onInput: (event: Event) =>
            emit('update:modelValue', (event.target as HTMLInputElement).value),
        });
    },
  }),
}));

vi.mock('./TechnicalOperatorFields.vue', () => ({
  default: defineComponent({
    setup() {
      return () => h('div', { 'data-component': 'technical-operator-fields' });
    },
  }),
}));

vi.mock('../api/technical-workflow-service', () => ({
  completeGrossing: mockCompleteGrossing,
  getTechnicalTracking: mockGetTechnicalTracking,
  uploadGrossingMediaAsset: mockUploadGrossingMediaAsset,
}));

vi.mock('element-plus', () => {
  const passthrough = (tag = 'div') =>
    defineComponent({
      props: ['label', 'title'],
      setup(props, { slots }) {
        return () =>
          h(tag, [
            props.title ? h('div', props.title) : null,
            props.label ? h('label', props.label) : null,
            slots.default?.(),
          ]);
      },
    });

  const ElAlert = defineComponent({
    props: ['title'],
    setup(props) {
      return () => h('section', props.title);
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

  const ElDescriptions = passthrough();
  const ElDescriptionsItem = passthrough();

  const ElDialog = defineComponent({
    props: ['modelValue', 'title'],
    setup(props, { slots }) {
      return () =>
        props.modelValue
          ? h('section', [h('h3', props.title), slots.default?.(), slots.footer?.()])
          : null;
    },
  });

  const ElForm = passthrough('form');
  const ElFormItem = passthrough();

  const ElInput = defineComponent({
    props: ['modelValue', 'placeholder', 'rows', 'type'],
    emits: ['update:modelValue'],
    setup(props, { emit }) {
      return () =>
        props.type === 'textarea'
          ? h('textarea', {
              placeholder: props.placeholder,
              rows: props.rows,
              value: props.modelValue,
              onInput: (event: Event) =>
                emit('update:modelValue', (event.target as HTMLTextAreaElement).value),
            })
          : h('input', {
              placeholder: props.placeholder,
              value: props.modelValue,
              onInput: (event: Event) =>
                emit('update:modelValue', (event.target as HTMLInputElement).value),
            });
    },
  });

  const ElInputNumber = defineComponent({
    props: ['modelValue', 'placeholder'],
    emits: ['update:modelValue'],
    setup(props, { emit }) {
      return () =>
        h('input', {
          placeholder: props.placeholder,
          type: 'number',
          value: props.modelValue,
          onInput: (event: Event) =>
            emit('update:modelValue', Number((event.target as HTMLInputElement).value)),
        });
    },
  });

  const ElLink = defineComponent({
    props: ['href'],
    setup(props, { slots }) {
      return () => h('a', { href: props.href }, slots.default?.());
    },
  });

  const ElUpload = defineComponent({
    props: ['accept', 'beforeUpload', 'disabled', 'httpRequest'],
    setup(props, { slots }) {
      return () =>
        h('div', [
          slots.default?.(),
          h('input', {
            'aria-label': '上传影像',
            accept: props.accept,
            disabled: props.disabled,
            type: 'file',
            onChange: async (event: Event) => {
              const file = (event.target as HTMLInputElement).files?.[0];
              if (!file) {
                return;
              }
              const beforeResult = props.beforeUpload?.(file);
              if (beforeResult === false) {
                return;
              }
              await props.httpRequest?.({
                file,
                onError: vi.fn(),
                onSuccess: vi.fn(),
              });
            },
          }),
        ]);
    },
  });

  interface TreeSelectOption {
    children?: TreeSelectOption[];
    disabled?: boolean;
    id: string;
    name?: string;
    partName?: string;
  }

  function flattenTreeSelectOptions(
    nodes: TreeSelectOption[] = [],
    treeProps: Record<string, string> = {},
  ) {
    const childrenKey = treeProps.children || 'children';
    const labelKey = treeProps.label || 'name';
    const disabledKey = treeProps.disabled || 'disabled';
    const options: Array<{ disabled: boolean; label: string; value: string }> = [];
    const walk = (items: TreeSelectOption[]) => {
      items.forEach((item) => {
        options.push({
          disabled: Boolean(item[disabledKey as keyof TreeSelectOption]),
          label: String(item[labelKey as keyof TreeSelectOption] ?? ''),
          value: item.id,
        });
        const children = item[childrenKey as keyof TreeSelectOption];
        if (Array.isArray(children)) {
          walk(children);
        }
      });
    };
    walk(nodes);
    return options;
  }

  const ElTreeSelect = defineComponent({
    props: ['data', 'modelValue', 'placeholder', 'props'],
    emits: ['update:modelValue'],
    setup(props, { emit }) {
      return () =>
        h(
          'select',
          {
            'aria-label': props.placeholder,
            value: props.modelValue,
            onChange: (event: Event) =>
              emit('update:modelValue', (event.target as HTMLSelectElement).value),
          },
          flattenTreeSelectOptions(props.data, props.props).map((option) =>
            h(
              'option',
              {
                disabled: option.disabled,
                value: option.value,
              },
              option.label,
            ),
          ),
        );
    },
  });

  const ElTabs = defineComponent({
    props: ['modelValue'],
    emits: ['update:modelValue'],
    setup(props, { emit, slots }) {
      const activeName = ref(props.modelValue);
      watch(
        () => props.modelValue,
        (value) => {
          activeName.value = value;
        },
      );
      const selectTab = (name: string) => {
        activeName.value = name;
        emit('update:modelValue', name);
      };
      provide(tabsContextKey, {
        activeName,
        selectTab,
      });
      return () =>
        h(
          'div',
          { 'data-active-tab': activeName.value },
          slots.default?.(),
        );
    },
  });

  const ElTabPane = defineComponent({
    props: ['label', 'name'],
    setup(props, { slots }) {
      const tabsContext = inject<null | {
        activeName: { value: string };
        selectTab: (name: string) => void;
      }>(tabsContextKey, null);
      return () => {
        const isActive = tabsContext?.activeName.value === props.name;
        return h('div', [
          h(
            'button',
            {
              'data-active': isActive ? 'true' : 'false',
              'data-tab-name': props.name,
              type: 'button',
              onClick: () => tabsContext?.selectTab(String(props.name)),
            },
            props.label,
          ),
          isActive ? h('div', { 'data-tab-panel': props.name }, slots.default?.()) : null,
        ]);
      };
    },
  });

  return {
    ElAlert,
    ElButton,
    ElDescriptions,
    ElDescriptionsItem,
    ElDialog,
    ElForm,
    ElFormItem,
    ElInput,
    ElInputNumber,
    ElLink,
    ElMessage: {
      success: messageSuccess,
      warning: messageWarning,
    },
    ElTabPane,
    ElTabs,
    ElTreeSelect,
    ElUpload,
  };
});

import GrossingProcessDialog from './GrossingProcessDialog.vue';

function createTrackingResult() {
  return {
    blocks: [],
    caseId: 'CASE-001',
    caseStatus: 'GROSSING_PENDING',
    embeddingBoxes: [],
    events: [],
    pathologyNo: 'BL-001',
    qcEvaluations: [],
    reworks: [],
    slides: [],
    specimens: [
      {
        barcode: 'BC-001',
        specimenId: 'SPEC-001',
        specimenName: '胃组织',
        specimenNo: 'SP-001',
        specimenStatus: 'REGISTERED',
      },
      {
        barcode: 'BC-002',
        specimenId: 'SPEC-002',
        specimenName: '肠组织',
        specimenNo: 'SP-002',
        specimenStatus: 'REGISTERED',
      },
    ],
    technicalTasks: [],
  };
}

function createTask() {
  return {
    applicationId: 'APP-001',
    applicationNo: 'APP-001',
    caseId: 'CASE-001',
    completedAt: null,
    createdAt: '2026-05-24T08:00:00',
    deadlineAt: null,
    id: 'TASK-001',
    objectId: 'CASE-001',
    objectType: 'CASE',
    pathologyNo: 'BL-001',
    payload: null,
    remarks: null,
    specimenId: null,
    startedAt: null,
    taskStatus: 'IN_PROGRESS',
    taskType: 'GROSSING',
    timedOut: false,
    timeoutRuleCode: null,
  };
}

async function flushAll() {
  await Promise.resolve();
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

async function mountDialog(options: {
  bodyParts?: object[];
  samplingTemplates?: object[];
} = {}) {
  mockListBodyParts.mockResolvedValue(options.bodyParts ?? []);
  mockListSamplingTemplates.mockResolvedValue(options.samplingTemplates ?? []);
  mockLoadWorkflowReferenceOptionsSafely.mockResolvedValue({
    specimenTypes: [],
  });
  mockGetTechnicalTracking.mockResolvedValue(createTrackingResult());
  mockCompleteGrossing.mockResolvedValue({
    caseId: 'CASE-001',
    caseStatus: 'DEHYDRATION_PENDING',
    createdDehydrationTaskCount: 2,
    taskId: 'TASK-001',
  });
  mockUploadGrossingMediaAsset.mockResolvedValue({
    contentType: 'image/jpeg',
    fileName: 'uploaded-specimen.jpg',
    fileUrl: '/api/v1/grossing-media-assets/files/20260525/uploaded-specimen.jpg',
    size: 5,
  });

  const root = document.createElement('div');
  document.body.append(root);
  const app = createApp({
    setup() {
      const visible = ref(false);
      onMounted(() => {
        visible.value = true;
      });
      return () =>
        h(GrossingProcessDialog, {
          modelValue: visible.value,
          task: createTask(),
          'onUpdate:modelValue': (value: boolean) => {
            visible.value = value;
          },
          onSubmitted: () => {},
        });
    },
  });
  app.mount(root);
  await flushAll();
  return { app, root };
}

function findButton(root: HTMLElement, text: string) {
  const button = [...root.querySelectorAll<HTMLButtonElement>('button')].find((item) =>
    item.textContent?.includes(text),
  );
  if (!button) {
    throw new Error(`Missing button: ${text}`);
  }
  return button;
}

function findTabButton(root: HTMLElement, label: string) {
  const button = [...root.querySelectorAll<HTMLButtonElement>('button')].find(
    (item) => item.dataset.tabName && item.textContent === label,
  );
  if (!button) {
    throw new Error(`Missing tab button: ${label}`);
  }
  return button;
}

function inputByPlaceholder(root: HTMLElement, placeholder: string, index = 0) {
  const elements = [...root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
      `[placeholder="${placeholder}"]`,
    )];
  const element = elements[index];
  if (!element) {
    throw new Error(`Missing input for placeholder: ${placeholder} at index ${index}`);
  }
  return element;
}

function setInputValue(
  root: HTMLElement,
  placeholder: string,
  value: string,
  index = 0,
) {
  const input = inputByPlaceholder(root, placeholder, index);
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

async function uploadFile(root: HTMLElement, file: File) {
  const input = root.querySelector<HTMLInputElement>('input[aria-label="上传影像"]');
  if (!input) {
    throw new Error('Missing upload input');
  }
  Object.defineProperty(input, 'files', {
    configurable: true,
    value: [file],
  });
  input.dispatchEvent(new Event('change'));
  await flushAll();
}

function selectByLabel(root: HTMLElement, label: string) {
  const select = root.querySelector<HTMLSelectElement>(`select[aria-label="${label}"]`);
  if (!select) {
    throw new Error(`Missing select for label: ${label}`);
  }
  return select;
}

function setSelectValue(root: HTMLElement, label: string, value: string) {
  const select = selectByLabel(root, label);
  select.value = value;
  select.dispatchEvent(new Event('change'));
}

describe('GrossingProcessDialog', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    messageSuccess.mockReset();
    messageWarning.mockReset();
    mockCompleteGrossing.mockReset();
    mockGetTechnicalTracking.mockReset();
    mockListBodyParts.mockReset();
    mockListSamplingTemplates.mockReset();
    mockLoadWorkflowReferenceOptionsSafely.mockReset();
    mockUploadGrossingMediaAsset.mockReset();
  });

  it('loads tracking specimens into tabs and activates the first specimen by default', async () => {
    const { app, root } = await mountDialog();

    expect(mockGetTechnicalTracking).toHaveBeenCalledWith('CASE-001');
    expect(findTabButton(root, 'SP-001').dataset.active).toBe('true');
    expect(findTabButton(root, 'SP-002').dataset.active).toBe('false');
    expect(root.textContent).toContain('当前仅编辑该标本对应的取材、蜡块和影像信息。');

    app.unmount();
  });

  it('adds a specimen tab and switches to it immediately', async () => {
    const { app, root } = await mountDialog();

    findButton(root, '新增标本').click();
    await flushAll();

    expect(findTabButton(root, '标本 3').dataset.active).toBe('true');

    app.unmount();
  });

  it('falls through to the adjacent specimen tab after deleting the current specimen', async () => {
    const { app, root } = await mountDialog();

    findButton(root, '新增标本').click();
    await flushAll();

    findTabButton(root, 'SP-002').click();
    await flushAll();

    expect(findTabButton(root, 'SP-002').dataset.active).toBe('true');

    findButton(root, '删除标本').click();
    await flushAll();

    expect(() => findTabButton(root, 'SP-002')).toThrowError();
    expect(findTabButton(root, '标本 2').dataset.active).toBe('true');

    app.unmount();
  });

  it('keeps the single block guard after the UI reorganization', async () => {
    const { app, root } = await mountDialog();

    findButton(root, '删除蜡块').click();

    expect(messageWarning).toHaveBeenCalledWith('每个标本至少保留一个蜡块明细');

    app.unmount();
  });

  it('submits selected body part and sampling template ids from tree selects', async () => {
    const { app, root } = await mountDialog({
      bodyParts: [
        {
          children: [
            {
              children: [],
              enabled: true,
              id: 'BP-STOMACH-BODY',
              parentId: 'BP-STOMACH',
              partAlias: null,
              partCode: 'BP-STOMACH-BODY',
              partLevel: 2,
              partName: '胃体',
              sortOrder: 1,
            },
          ],
          enabled: true,
          id: 'BP-STOMACH',
          parentId: null,
          partAlias: null,
          partCode: 'BP-STOMACH',
          partLevel: 1,
          partName: '胃',
          sortOrder: 1,
        },
      ],
      samplingTemplates: [
        {
          categoryCode: 'TC-GROSS',
          categoryName: '大体模板',
          children: [],
          enabled: true,
          id: 'TC-GROSS',
          parentId: null,
          sortOrder: 1,
          templates: [
            {
              applicableSpecimenType: null,
              bodyParts: [],
              categoryId: 'TC-GROSS',
              enabled: true,
              id: 'ST-HE-STOMACH',
              splitPartCount: 1,
              templateCode: 'ST-HE-STOMACH',
              templateName: '胃 HE 取材',
            },
          ],
        },
      ],
    });

    const categoryOption = [...selectByLabel(root, '请选择取材模板').options].find(
      (option) => option.value === 'TC-GROSS',
    );
    expect(categoryOption?.disabled).toBe(true);

    setSelectValue(root, '请选择取材部位', 'BP-STOMACH-BODY');
    setSelectValue(root, '请选择取材模板', 'ST-HE-STOMACH');
    setInputValue(root, '蜡块描述', 'A1');
    await flushAll();

    findTabButton(root, 'SP-002').click();
    await flushAll();

    setInputValue(root, '蜡块描述', 'B1');
    await flushAll();

    findButton(root, '完成取材').click();
    await flushAll();

    expect(mockCompleteGrossing).toHaveBeenCalledWith(
      expect.objectContaining({
        specimens: [
          expect.objectContaining({
            bodyPartId: 'BP-STOMACH-BODY',
            samplingTemplateId: 'ST-HE-STOMACH',
          }),
          expect.objectContaining({
            bodyPartId: null,
            samplingTemplateId: null,
          }),
        ],
      }),
    );

    app.unmount();
  });

  it('submits the same payload shape while applying block and media changes to the active specimen only', async () => {
    const { app, root } = await mountDialog();

    setInputValue(root, '蜡块描述', 'A1');
    await flushAll();

    findTabButton(root, 'SP-002').click();
    await flushAll();

    findButton(root, '新增蜡块').click();
    findButton(root, '手工补充影像').click();
    await flushAll();

    setInputValue(root, '蜡块描述', 'B2', 1);
    setInputValue(root, '影像地址', 'https://example.com/spec-2.jpg');
    setInputValue(root, '影像名称', 'spec-2');
    await flushAll();

    findButton(root, '完成取材').click();
    await flushAll();

    expect(mockCompleteGrossing).toHaveBeenCalledTimes(1);
    expect(mockCompleteGrossing).toHaveBeenCalledWith({
      caseId: 'CASE-001',
      operatorName: '当前取材员',
      operatorUserId: 'USER-001',
      remarks: null,
      specimens: [
        {
          blocks: [
            {
              blockDescription: 'A1',
              blockSite: null,
              specialRequirement: null,
            },
          ],
          blockCount: 1,
          bodyPartId: null,
          cutSurfaceFeature: null,
          grossDescription: null,
          marginMarking: null,
          mediaAssets: [],
          samplingTemplateId: null,
          sizeText: null,
          specimenId: 'SPEC-001',
          specimenType: 'ROUTINE',
        },
        {
          blocks: [
            {
              blockDescription: null,
              blockSite: null,
              specialRequirement: null,
            },
            {
              blockDescription: 'B2',
              blockSite: null,
              specialRequirement: null,
            },
          ],
          blockCount: 2,
          bodyPartId: null,
          cutSurfaceFeature: null,
          grossDescription: null,
          marginMarking: null,
          mediaAssets: [
            {
              fileName: 'spec-2',
              fileUrl: 'https://example.com/spec-2.jpg',
            },
          ],
          samplingTemplateId: null,
          sizeText: null,
          specimenId: 'SPEC-002',
          specimenType: 'ROUTINE',
        },
      ],
      taskId: 'TASK-001',
      terminalCode: null,
    });
    expect(messageSuccess).toHaveBeenCalledWith('取材完成，已生成 2 条脱水任务');

    app.unmount();
  });

  it('uploads grossing image to the active specimen only', async () => {
    const { app, root } = await mountDialog();

    setInputValue(root, '蜡块描述', 'A1');
    await flushAll();

    findTabButton(root, 'SP-002').click();
    await flushAll();

    setInputValue(root, '蜡块描述', 'B1');
    await uploadFile(
      root,
      new File(['image'], 'uploaded-specimen.jpg', { type: 'image/jpeg' }),
    );

    expect(mockUploadGrossingMediaAsset).toHaveBeenCalledTimes(1);
    expect(inputByPlaceholder(root, '影像名称').value).toBe('uploaded-specimen.jpg');
    expect(root.textContent).toContain('查看影像');

    findButton(root, '完成取材').click();
    await flushAll();

    expect(mockCompleteGrossing).toHaveBeenCalledWith(
      expect.objectContaining({
        specimens: [
          expect.objectContaining({
            mediaAssets: [],
            specimenId: 'SPEC-001',
          }),
          expect.objectContaining({
            mediaAssets: [
              {
                fileName: 'uploaded-specimen.jpg',
                fileUrl: '/api/v1/grossing-media-assets/files/20260525/uploaded-specimen.jpg',
              },
            ],
            specimenId: 'SPEC-002',
          }),
        ],
      }),
    );

    app.unmount();
  });

  it('blocks unsupported image uploads before calling the API', async () => {
    const { app, root } = await mountDialog();

    await uploadFile(root, new File(['text'], 'specimen.txt', { type: 'text/plain' }));

    expect(mockUploadGrossingMediaAsset).not.toHaveBeenCalled();
    expect(messageWarning).toHaveBeenCalledWith('仅支持 JPG、PNG、WEBP、BMP 格式的标本摄影像');

    app.unmount();
  });
});
