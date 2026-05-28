import { createApp, defineComponent, h, nextTick } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

const {
  mockAccessStore,
  mockCreateApplication,
  mockDuplicateCheckApplications,
  mockGetApplicationDetail,
  mockUpdateApplication,
  mockUserStore,
} = vi.hoisted(() => ({
  mockAccessStore: {
    accessCodes: [
      'PERM_APPLICATION_UPDATE',
      'PERM_WORKFLOW_REFERENCE_QUERY',
    ] as string[],
  },
  mockCreateApplication: vi.fn(),
  mockDuplicateCheckApplications: vi.fn(),
  mockGetApplicationDetail: vi.fn(),
  mockUpdateApplication: vi.fn(),
  mockUserStore: {
    userInfo: {
      realName: '当前用户',
      userId: 'USER-CURRENT',
    },
  },
}));

vi.mock('@vben/stores', () => ({
  useAccessStore: () => mockAccessStore,
  useUserStore: () => mockUserStore,
}));

vi.mock('#/modules/system-management/api/workflow-reference-service', () => ({
  createEmptyWorkflowReferenceOptions: () => ({
    clinicalSymptoms: [],
  }),
  loadWorkflowReferenceOptionsSafely: vi.fn(async () => ({
    clinicalSymptoms: [],
  })),
}));

vi.mock('#/modules/system-management/components/BodyPartSelect.vue', () => ({
  default: {
    emits: ['change', 'update:modelValue'],
    props: ['modelValue', 'options', 'placeholder', 'selectedLabel'],
    template: '<input :placeholder="placeholder" :value="modelValue" />',
  },
}));

vi.mock('#/modules/system-management/components/DepartmentSelect.vue', () => ({
  default: {
    emits: ['change', 'update:modelValue'],
    props: ['modelValue', 'options', 'placeholder', 'selectedLabel'],
    template: '<input :placeholder="placeholder" :value="modelValue" />',
  },
}));

vi.mock('#/modules/system-management/components/ReferenceOptionSelect.vue', () => ({
  default: {
    emits: ['change', 'update:modelValue'],
    props: ['modelValue', 'options', 'placeholder', 'selectedLabel'],
    template: '<input :placeholder="placeholder" :value="modelValue" />',
  },
}));

vi.mock('#/modules/system-management/components/SystemUserSelect.vue', () => ({
  default: {
    emits: ['change', 'update:modelValue'],
    props: ['modelValue', 'options', 'placeholder', 'selectedLabel'],
    template: '<input :placeholder="placeholder" :value="modelValue" />',
  },
}));

vi.mock('#/modules/system-management/constants', () => ({
  GENDER_OPTIONS: [
    { label: '男', value: 'M' },
    { label: '女', value: 'F' },
  ],
}));

vi.mock('../api/specimen-workflow-service', () => ({
  createApplication: mockCreateApplication,
  duplicateCheckApplications: mockDuplicateCheckApplications,
  getApplicationDetail: mockGetApplicationDetail,
  importClinicalApplication: vi.fn(),
  updateApplication: mockUpdateApplication,
}));

vi.mock('./WorkflowSectionCard.vue', () => ({
  default: {
    props: ['description', 'title'],
    template:
      '<section><h2>{{ title }}</h2><p v-if="description">{{ description }}</p><slot /></section>',
  },
}));

vi.mock('element-plus', () => {
  const passthrough = (tag = 'div') =>
    defineComponent({
      props: ['description', 'label', 'modelValue', 'title'],
      setup(props, { slots }) {
        return () =>
          h(tag, [
            props.title ? h('div', props.title) : null,
            props.label ? h('span', props.label) : null,
            props.description ? h('div', props.description) : null,
            slots.default?.(),
          ]);
      },
    });

  const ElButton = defineComponent({
    emits: ['click'],
    props: ['disabled', 'loading', 'type'],
    setup(props, { emit, slots }) {
      return () =>
        h(
          'button',
          {
            disabled: Boolean(props.disabled),
            type: 'button',
            onClick: (event: MouseEvent) => emit('click', event),
          },
          slots.default?.(),
        );
    },
  });

  const ElDialog = defineComponent({
    emits: ['update:modelValue'],
    props: ['modelValue', 'title'],
    setup(props, { slots }) {
      return () =>
        props.modelValue
          ? h('section', [h('h3', props.title), slots.default?.(), slots.footer?.()])
          : null;
    },
  });

  const ElInput = defineComponent({
    emits: ['update:modelValue'],
    props: ['modelValue', 'placeholder'],
    setup(props, { emit }) {
      return () =>
        h('input', {
          placeholder: props.placeholder,
          value: props.modelValue,
          onInput: (event: Event) =>
            emit('update:modelValue', (event.target as HTMLInputElement).value),
        });
    },
  });

  const ElSelect = defineComponent({
    emits: ['update:modelValue'],
    props: ['modelValue'],
    setup(props, { emit, slots }) {
      return () =>
        h(
          'select',
          {
            value: props.modelValue,
            onChange: (event: Event) =>
              emit('update:modelValue', (event.target as HTMLSelectElement).value),
          },
          slots.default?.(),
        );
    },
  });

  const ElOption = defineComponent({
    props: ['label', 'value'],
    setup(props) {
      return () => h('option', { value: props.value }, props.label);
    },
  });

  return {
    ElAlert: passthrough(),
    ElButton,
    ElDatePicker: ElInput,
    ElDialog,
    ElEmpty: passthrough(),
    ElForm: passthrough('form'),
    ElFormItem: passthrough(),
    ElInput,
    ElMessage: {
      info: vi.fn(),
      success: vi.fn(),
      warning: vi.fn(),
    },
    ElOption,
    ElSelect,
    ElTabPane: passthrough('section'),
    ElTabs: passthrough(),
  };
});

import ApplicationManageDialog from './ApplicationManageDialog.vue';

function buildApplicationDetail() {
  return {
    abnormalFlag: false,
    applicationDate: '2026-05-28',
    applicationFormStatus: 'PENDING',
    applicationNo: 'M2-EDIT-001',
    applicationType: 'ROUTINE',
    clinicalDiagnosis: '胃镜活检',
    clinicalSymptom: null,
    createdAt: '2026-05-28T08:00:00',
    currentNode: 'SUBMITTED',
    deletable: true,
    editable: true,
    externalOrderNo: null,
    id: 'APP-EDIT-001',
    operationDisabledReason: null,
    patientAge: '45',
    patientGender: 'M',
    patientId: 'PAT-001',
    patientName: '张三',
    recentEvents: [],
    remarks: null,
    sourceHospitalId: null,
    sourceHospitalName: '协作医院',
    specimenRemovalTime: '2026-05-28T09:00:00',
    specimenSite: '胃窦',
    specimens: [],
    status: 'SUBMITTED',
    submissionDate: '2026-05-28',
    submittingDepartmentId: 'DEP-001',
    submittingDepartmentName: '外科',
    submittingDoctorName: '李医生',
    submittingDoctorUserId: 'DOC-001',
    thirdPartySource: null,
    updatedAt: '2026-05-28T09:00:00',
    voided: false,
  };
}

async function flushAll() {
  await Promise.resolve();
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

async function mountDialog() {
  const root = document.createElement('div');
  document.body.append(root);
  const app = createApp({
    render: () =>
      h(ApplicationManageDialog, {
        applicationId: 'APP-EDIT-001',
        mode: 'edit',
        modelValue: true,
        'onUpdate:modelValue': vi.fn(),
        onSubmitted: vi.fn(),
      }),
  });
  app.directive('loading', {
    mounted() {},
    updated() {},
  });
  app.mount(root);
  await flushAll();
  return { app, root };
}

describe('ApplicationManageDialog', () => {
  afterEach(() => {
    mockCreateApplication.mockReset();
    mockDuplicateCheckApplications.mockReset();
    mockGetApplicationDetail.mockReset();
    mockUpdateApplication.mockReset();
    document.body.innerHTML = '';
  });

  it('loads detail and submits updates in edit mode', async () => {
    mockGetApplicationDetail.mockResolvedValue(buildApplicationDetail());
    mockDuplicateCheckApplications.mockResolvedValue({
      items: [],
      suggestedAction: 'ALLOW',
    });
    mockUpdateApplication.mockResolvedValue({ id: 'APP-EDIT-001' });

    const { app, root } = await mountDialog();

    expect(mockGetApplicationDetail).toHaveBeenCalledWith('APP-EDIT-001');
    expect(root.textContent).toContain('编辑申请单');
    expect(root.textContent).not.toContain('第三方导入');

    const saveButton = Array.from(root.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === '保存',
    );
    saveButton?.click();
    await flushAll();

    expect(mockCreateApplication).not.toHaveBeenCalled();
    expect(mockUpdateApplication).toHaveBeenCalledWith(
      'APP-EDIT-001',
      expect.objectContaining({
        applicationNo: 'M2-EDIT-001',
        patientName: '张三',
        specimenSite: '胃窦',
      }),
    );

    app.unmount();
  });
});
