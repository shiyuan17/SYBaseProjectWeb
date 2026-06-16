import { createApp, h, nextTick, reactive, ref } from 'vue';

import { afterEach, describe, expect, it } from 'vitest';

import ArchiveCabinetDialog from './ArchiveCabinetDialog.vue';

function mountDialog() {
  const root = document.createElement('div');
  document.body.append(root);

  const form = reactive({
    capacity: 8,
    cabinetCode: '',
    cabinetName: '',
    cabinetStatus: 'ACTIVE',
    cabinetType: 'APPLICATION_FORM',
    layerCount: 1,
    locationDescription: '',
    nodeCode: '',
    nodeType: 'CABINET' as const,
    operatorName: '归档员甲',
    operatorUserId: 'USER-1',
    parentId: '',
    pathLocation: '',
    remainingCapacity: 8,
    remarks: '',
    slotCountPerLayer: 8,
    terminalCode: '',
  });
  const visible = ref(true);

  const app = createApp({
    render: () =>
      h(ArchiveCabinetDialog, {
        cabinetCapacityPreview: 8,
        cabinetDialogMode: 'create',
        cabinetForm: form,
        'onUpdate:cabinetForm': (nextForm) => Object.assign(form, nextForm),
        cabinetNodes: [
          {
            cabinetId: null,
            cabinetType: 'APPLICATION_FORM',
            capacity: 0,
            id: 'NODE-AREA-1',
            nodeCode: '申请单区域',
            nodeType: 'AREA',
            parentId: null,
            pathLocation: '库房A',
            remainingCapacity: 8,
            remarks: '',
          },
          {
            cabinetId: 'CAB-1',
            cabinetType: 'SLIDE',
            capacity: 8,
            id: 'NODE-CABINET-1',
            nodeCode: 'CAB-01',
            nodeType: 'CABINET',
            parentId: 'NODE-AREA-1',
            pathLocation: '库房A-1',
            remainingCapacity: 8,
            remarks: '',
          },
        ],
        cabinetPositionRulePreview: 'CAB-01-L1-S1',
        isEditingCabinet: false,
        modelValue: visible.value,
        'onUpdate:modelValue': (nextVisible) => {
          visible.value = nextVisible;
        },
        submitting: false,
      }),
  });

  app.mount(root);

  return {
    app,
    form,
    root,
  };
}

describe('ArchiveCabinetDialog', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders node-based fields and create-only cabinet type options', async () => {
    const { app, root } = mountDialog();

    await nextTick();

    expect(document.body.textContent).toContain('新增归档柜');
    expect(document.body.textContent).toContain('父节点');
    expect(document.body.textContent).toContain('节点类型');
    expect(document.body.textContent).toContain('编号');
    expect(document.body.textContent).toContain('柜子类型');
    expect(document.body.textContent).toContain('总容量');
    expect(document.body.textContent).toContain('剩余容量');
    expect(document.body.textContent).toContain('路径位置');
    expect(document.body.textContent).toContain('备注');
    expect(document.body.textContent).not.toContain('操作人');
    expect(document.body.textContent).not.toContain('终端编码');
    expect(document.body.textContent).toContain('区域');
    expect(document.body.textContent).toContain('柜子');
    expect(document.body.textContent).toContain('抽屉');
    expect(document.body.textContent).toContain('申请单');
    expect(document.body.textContent).toContain('蜡块');
    expect(document.body.textContent).toContain('玻片');
    expect(document.body.textContent).toContain('标本');
    expect(document.body.textContent).toContain('试管');
    expect(document.body.textContent).not.toContain('标准柜');
    expect(document.body.textContent).toContain('保存');
    expect(document.body.textContent).toContain('退出');

    app.unmount();
    root.remove();
  });
});
