import { createApp, defineComponent, h, nextTick } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

const { mockRenderEcharts } = vi.hoisted(() => ({
  mockRenderEcharts: vi.fn(),
}));

vi.mock('@vben/plugins/echarts', () => ({
  EchartsUI: defineComponent({
    inheritAttrs: false,
    setup(_, { attrs }) {
      return () => h('div', attrs, 'chart');
    },
  }),
  useEcharts: () => ({
    renderEcharts: mockRenderEcharts,
  }),
}));

vi.mock('element-plus', () => ({
  ElEmpty: defineComponent({
    props: ['description'],
    setup(props) {
      return () => h('div', props.description);
    },
  }),
  ElSkeleton: defineComponent({
    setup(_, { attrs }) {
      return () => h('div', attrs, 'loading');
    },
  }),
}));

import ReportChartPanel from './ReportChartPanel.vue';

async function flushView() {
  for (let index = 0; index < 4; index += 1) {
    await nextTick();
    await Promise.resolve();
  }
}

function mountPanel(props: InstanceType<typeof ReportChartPanel>['$props']) {
  const root = document.createElement('div');
  document.body.append(root);
  const app = createApp({
    render: () => h(ReportChartPanel, props),
  });
  app.mount(root);
  return { app, root };
}

describe('ReportChartPanel', () => {
  afterEach(() => {
    mockRenderEcharts.mockReset();
    document.body.innerHTML = '';
  });

  it('shows a busy skeleton instead of an empty chart state while loading', async () => {
    const { app, root } = mountPanel({
      emptyText: '暂无趋势图数据',
      loading: true,
      option: { series: [] },
    });
    await flushView();

    expect(root.textContent).toContain('loading');
    expect(root.textContent).not.toContain('暂无趋势图数据');
    expect(root.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(mockRenderEcharts).not.toHaveBeenCalled();

    app.unmount();
    root.remove();
  });
});
