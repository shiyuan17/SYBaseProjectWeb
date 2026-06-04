import { createApp, h, nextTick } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createAlertStub,
  createButtonStub,
  createDialogStub,
  createInputStub,
  createOptionStub,
  createPassthroughStub,
  createSelectStub,
} from '../test-utils/component-stubs';

const pageErrorTextMock = { value: '' };

vi.mock('#/modules/system-management/components/DepartmentSelect.vue', () => ({
  default: createInputStub(),
}));

vi.mock('#/modules/system-management/components/SystemUserSelect.vue', () => ({
  default: createInputStub(),
}));

vi.mock('../composables/useTransportOrderCreateDialog', async () => {
  const { reactive, ref } = await import('vue');

  return {
    useTransportOrderCreateDialog: () => ({
      createForm: reactive({
        applicationId: 'APP-001',
        handoverDepartmentId: '',
        handoverDepartmentName: '',
        handoverUserId: '',
        handoverUserName: '',
        receiverDepartmentId: '',
        receiverDepartmentName: '',
        remarks: '',
        selectedSpecimenBarcodes: [],
        specimenBarcodesText: '',
        terminalCode: '',
      }),
      createLoading: ref(false),
      dialogVisible: ref(true),
      eligibleSpecimens: ref([]),
      formatSpecimenOptionLabel: vi.fn(() => '标本-001'),
      handleDialogClosed: vi.fn(),
      handleHandoverDepartmentChange: vi.fn(),
      handleHandoverUserChange: vi.fn(),
      handleReceiverDepartmentChange: vi.fn(),
      loadApplicationContext: vi.fn(),
      pageError: ref(pageErrorTextMock.value),
      resolveSpecimenClinicalSymptom: vi.fn(() => '-'),
      resolveSpecimenCollectionMode: vi.fn(() => '-'),
      resolveSpecimenName: vi.fn(() => '胃组织'),
      resolveSpecimenSite: vi.fn(() => '胃'),
      resolveSpecimenType: vi.fn(() => '常规'),
      submitCreate: vi.fn(),
      visibleApplicationNo: ref('AP202606020001'),
    }),
  };
});

vi.mock('element-plus', () => ({
  ElAlert: createAlertStub(),
  ElButton: createButtonStub(),
  ElDialog: createDialogStub(),
  ElForm: createPassthroughStub('form'),
  ElFormItem: createPassthroughStub(),
  ElInput: createInputStub(),
  ElOption: createOptionStub(),
  ElSelect: createSelectStub(),
}));

import TransportOrderCreateDialog from './TransportOrderCreateDialog.vue';

function mountDialog() {
  const container = document.createElement('div');
  document.body.append(container);
  const app = createApp({
    render: () =>
      h(TransportOrderCreateDialog, {
        initialApplicationId: 'APP-001',
        initialApplicationNo: 'AP202606020001',
        modelValue: true,
        'onUpdate:modelValue': vi.fn(),
        onCreated: vi.fn(),
      }),
  });
  app.mount(container);
  return { app, container };
}

async function flush() {
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

describe('TransportOrderCreateDialog error display', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    pageErrorTextMock.value = '';
    vi.clearAllMocks();
  });

  it('shows the translated business error when pageError exists', async () => {
    pageErrorTextMock.value =
      '当前申请单下所有标本都完成入库后，才能执行转运。';

    const { app, container } = mountDialog();
    await flush();

    expect(container.textContent).toContain(
      '当前申请单下所有标本都完成入库后，才能执行转运。',
    );

    app.unmount();
  });
});
