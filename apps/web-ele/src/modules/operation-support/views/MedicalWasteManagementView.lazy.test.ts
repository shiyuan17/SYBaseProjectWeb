import { createApp, h, nextTick } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

const { mockAccessStore, mockGetMedicalWasteSpecimenOptions, mockUserStore } =
  vi.hoisted(() => ({
    mockAccessStore: {
      accessCodes: ['PERM_M5_REAGENT_QUERY'] as string[],
    },
    mockGetMedicalWasteSpecimenOptions: vi.fn(),
    mockUserStore: {
      userInfo: {
        realName: '管理员甲',
      },
    },
  }));

vi.mock('vue-router', () => ({
  useRoute: () => ({
    meta: {
      description: '维护医疗废物袋打印与交接记录。',
      title: '医疗废物管理',
    },
  }),
}));

vi.mock('@vben/common-ui', () => ({
  Fallback: {
    props: ['status'],
    template: '<div :data-status="status" />',
  },
  Page: {
    props: ['description', 'title'],
    template:
      '<section><h1>{{ title }}</h1><p v-if="description">{{ description }}</p><slot /></section>',
  },
}));

vi.mock('@vben/stores', () => ({
  useAccessStore: () => mockAccessStore,
  useUserStore: () => mockUserStore,
}));

vi.mock('element-plus', () => {
  const ElTabs = ((props: Record<string, unknown>, { emit, slots }: any) =>
    h('div', [
      h(
        'button',
        {
          'data-testid': 'specimen-tab',
          type: 'button',
          onClick: () => emit('update:modelValue', 'SPECIMEN'),
        },
        '人体标本',
      ),
      h(
        'button',
        {
          'data-testid': 'reagent-tab',
          type: 'button',
          onClick: () => emit('update:modelValue', 'REAGENT'),
        },
        '药物试剂',
      ),
      h('div', { 'data-active-tab': props.modelValue }, slots.default?.()),
    ])) as unknown;
  const ElTabPane = ((_: Record<string, unknown>, { slots }: any) =>
    h('section', slots.default?.())) as unknown;

  return {
    ElAlert: {
      props: ['title'],
      template: '<div>{{ title }}</div>',
    },
    ElTabPane,
    ElTabs,
  };
});

vi.mock('../api/operation-support-service', () => ({
  getMedicalWasteSpecimenOptions: mockGetMedicalWasteSpecimenOptions,
}));

vi.mock('../components/MedicalWasteSpecimenTab.vue', () => ({
  default: {
    props: ['canViewPage', 'options'],
    template:
      '<div data-testid="medical-waste-specimen-tab" :data-can-view-page="canViewPage" />',
  },
}));

vi.mock('../components/MedicalWasteReagentTab.vue', () => ({
  default: {
    props: ['currentUserName'],
    template:
      '<div data-testid="medical-waste-reagent-tab" :data-current-user-name="currentUserName" />',
  },
}));

import MedicalWasteManagementView from './MedicalWasteManagementView.vue';

async function flushAsyncRender() {
  await Promise.resolve();
  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await Promise.resolve();
  await nextTick();
}

describe('MedicalWasteManagementView lazy tabs', () => {
  afterEach(() => {
    mockAccessStore.accessCodes = ['PERM_M5_REAGENT_QUERY'];
    mockGetMedicalWasteSpecimenOptions.mockReset();
    document.body.innerHTML = '';
  });

  it('lazy-loads tab content and keeps visited tabs mounted', async () => {
    mockGetMedicalWasteSpecimenOptions.mockResolvedValue({
      grossingOperators: [],
      grossingPeriods: [],
      grossingStations: [],
    });

    const root = document.createElement('div');
    document.body.append(root);
    const app = createApp(MedicalWasteManagementView);

    app.mount(root);
    await flushAsyncRender();

    expect(mockGetMedicalWasteSpecimenOptions).toHaveBeenCalledTimes(1);
    expect(
      root.querySelector<HTMLElement>('[data-active-tab]')?.dataset.activeTab,
    ).toBe('SPECIMEN');
    expect(
      root.querySelector('[data-testid="medical-waste-specimen-tab"]'),
    ).not.toBeNull();
    expect(
      root.querySelector('[data-testid="medical-waste-reagent-tab"]'),
    ).toBeNull();

    root
      .querySelector<HTMLButtonElement>('[data-testid="reagent-tab"]')
      ?.click();
    await flushAsyncRender();

    expect(
      root.querySelector<HTMLElement>('[data-active-tab]')?.dataset.activeTab,
    ).toBe('REAGENT');
    expect(
      root.querySelector('[data-testid="medical-waste-specimen-tab"]'),
    ).not.toBeNull();
    expect(
      root.querySelector('[data-testid="medical-waste-reagent-tab"]'),
    ).not.toBeNull();

    app.unmount();
  });
});
