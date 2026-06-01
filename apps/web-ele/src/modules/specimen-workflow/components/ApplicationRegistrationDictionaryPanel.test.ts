import type { SpecimenDictionaryEntryOption, SpecimenDictionaryGroup } from '../types/application-registration-workbench';

import { createApp, defineComponent, h, nextTick, ref } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createEmptyStub,
  createInputStub,
  createPassthroughStub,
  createWorkflowSectionCardStub,
} from '../test-utils/component-stubs';

vi.mock('element-plus', () => ({
  ElEmpty: createEmptyStub(),
  ElInput: createInputStub(),
  ElScrollbar: createPassthroughStub('div'),
}));

vi.mock('./WorkflowSectionCard.vue', () => ({
  default: createWorkflowSectionCardStub(),
}));

import ApplicationRegistrationDictionaryPanel from './ApplicationRegistrationDictionaryPanel.vue';

function createGroups(): SpecimenDictionaryGroup[] {
  return [
    {
      subParts: [
        {
          partId: 'P-1',
          partName: '胃',
          specimens: ['胃组织', '胃切缘'],
        },
        {
          partId: 'P-2',
          partName: '肠系膜',
          specimens: ['肠系膜组织'],
        },
      ],
      systemId: 'S-1',
      systemName: '消化',
    },
    {
      subParts: [
        {
          partId: 'P-3',
          partName: '宫颈',
          specimens: ['宫颈活检组织'],
        },
      ],
      systemId: 'S-2',
      systemName: '妇科',
    },
  ];
}

function createCommonOptions(): SpecimenDictionaryEntryOption[] {
  return [
    {
      partId: 'P-1',
      partName: '胃',
      searchKeywords: ['胃组织'],
      specimenName: '胃组织',
      systemId: 'S-1',
      systemName: '消化',
    },
    {
      partId: 'P-2',
      partName: '肠系膜',
      searchKeywords: ['肠系膜组织'],
      specimenName: '肠系膜组织',
      systemId: 'S-1',
      systemName: '消化',
    },
    {
      partId: 'P-3',
      partName: '宫颈',
      searchKeywords: ['宫颈活检组织'],
      specimenName: '宫颈活检组织',
      systemId: 'S-2',
      systemName: '妇科',
    },
  ];
}

async function flush() {
  await Promise.resolve();
  await nextTick();
}

function mountPanel() {
  const root = document.createElement('div');
  document.body.append(root);
  const emitMock = vi.fn();
  const activeSystemId = ref('S-1');
  const activePartId = ref('P-1');
  const dictionaryKeyword = ref('');

  const app = createApp(
    defineComponent({
      setup() {
        return () =>
          h(ApplicationRegistrationDictionaryPanel, {
            activePartId: activePartId.value,
            activeSystemId: activeSystemId.value,
            departmentCommonSpecimenOptions: createCommonOptions().slice(0, 2),
            dictionaryKeyword: dictionaryKeyword.value,
            doctorCommonSpecimenOptions: createCommonOptions().slice(2),
            groups: createGroups(),
            'onUpdate:dictionaryKeyword': (value: string) => {
              dictionaryKeyword.value = value;
              emitMock('update:dictionaryKeyword', value);
            },
            onAppend: (payload: unknown) => emitMock('append', payload),
            onSelectPart: (partId: string) => {
              activePartId.value = partId;
              emitMock('select-part', partId);
            },
            onSelectSystem: (systemId: string) => {
              activeSystemId.value = systemId;
              activePartId.value =
                createGroups().find((group) => group.systemId === systemId)
                  ?.subParts[0]?.partId ?? '';
              emitMock('select-system', systemId);
            },
          });
      },
    }),
  );

  app.mount(root);

  return {
    emitMock,
    root,
    unmount() {
      app.unmount();
      root.remove();
    },
  };
}

describe('ApplicationRegistrationDictionaryPanel', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders the common tags above the dictionary columns', () => {
    const wrapper = mountPanel();

    expect(wrapper.root.textContent).toContain('科室常用');
    expect(wrapper.root.textContent).toContain('医生常用');
    expect(wrapper.root.textContent).toContain('消化');
    expect(wrapper.root.textContent).toContain('胃');
    expect(wrapper.root.textContent).toContain('胃组织');

    wrapper.unmount();
  });

  it('emits selection and append events from the three-level browser', async () => {
    const wrapper = mountPanel();
    await flush();

    [...wrapper.root.querySelectorAll('button')]
      .find((button) => button.textContent?.trim() === '妇科')
      ?.click();
    await flush();
    [...wrapper.root.querySelectorAll('button')]
      .find((button) => button.textContent?.trim() === '宫颈')
      ?.click();
    await flush();
    [...wrapper.root.querySelectorAll('button')]
      .find((button) => button.textContent?.trim() === '宫颈活检组织')
      ?.click();

    expect(wrapper.emitMock).toHaveBeenCalledWith('select-system', 'S-2');
    expect(wrapper.emitMock).toHaveBeenCalledWith('select-part', 'P-3');
    expect(wrapper.emitMock).toHaveBeenCalledWith('append', {
      specimenName: '宫颈活检组织',
      specimenSite: '宫颈',
    });

    wrapper.unmount();
  });

  it('updates the search keyword through the header input', async () => {
    const wrapper = mountPanel();
    await flush();

    const input = wrapper.root.querySelector('input');
    input!.value = '胃';
    input!.dispatchEvent(new Event('input'));

    expect(wrapper.emitMock).toHaveBeenCalledWith('update:dictionaryKeyword', '胃');

    wrapper.unmount();
  });
});
