import type { TechnicalTrackingCaseListItem } from '../types/technical-workflow';

import { createApp, defineComponent, h, nextTick } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('element-plus', () => {
  const ElButton = defineComponent({
    setup(_, { slots }) {
      return () => h('button', slots.default?.());
    },
  });
  const ElEmpty = defineComponent({
    props: ['description'],
    setup(props) {
      return () => h('div', props.description);
    },
  });
  const ElPagination = defineComponent({
    setup() {
      return () => h('nav');
    },
  });
  const ElTag = defineComponent({
    setup(_, { slots }) {
      return () => h('span', slots.default?.());
    },
  });

  return {
    ElButton,
    ElEmpty,
    ElPagination,
    ElTag,
  };
});

import TechnicalTrackingCaseListPanel from './TechnicalTrackingCaseListPanel.vue';

function createItem(
  overrides: Partial<TechnicalTrackingCaseListItem> = {},
): TechnicalTrackingCaseListItem {
  return {
    applicationNo: 'APP-001',
    applicationType: 'ROUTINE',
    caseId: 'CASE-001',
    caseStatus: 'SAMPLING',
    latestActivityAt: '2026-06-21T09:00:00',
    matchedActivityTypes: ['TASK'],
    pathologyNo: 'BL-001',
    patientIdDisplay: '08305',
    patientName: '患者甲',
    submittingDepartmentName: '手术室',
    ...overrides,
  };
}

async function flushView() {
  await Promise.resolve();
  await nextTick();
}

function mountComponent(items: TechnicalTrackingCaseListItem[]) {
  const root = document.createElement('div');
  document.body.append(root);
  const app = createApp({
    render: () =>
      h(TechnicalTrackingCaseListPanel, {
        items,
        page: 1,
        selectedCaseId: '',
        size: 20,
        total: items.length,
        'onUpdate:page': () => {},
        'onUpdate:size': () => {},
        onSearch: () => {},
        onSelect: () => {},
      }),
  });

  app.mount(root);
  return { app, root };
}

describe('TechnicalTrackingCaseListPanel', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders application type in Chinese instead of exposing raw code', async () => {
    const { app, root } = mountComponent([
      createItem(),
      createItem({
        applicationType: 'FROZEN',
        caseId: 'CASE-002',
        pathologyNo: 'BD-001',
      }),
    ]);

    await flushView();

    expect(root.textContent).toContain('送检类型：常规');
    expect(root.textContent).toContain('送检类型：冰冻');
    expect(root.textContent).not.toContain('送检类型：ROUTINE');
    expect(root.textContent).not.toContain('送检类型：FROZEN');

    app.unmount();
  });
});
