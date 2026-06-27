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

import DashboardChartPanel from './DashboardChartPanel.vue';

async function flushView() {
  for (let index = 0; index < 4; index += 1) {
    await nextTick();
    await Promise.resolve();
  }
}

function mountPanel(props: InstanceType<typeof DashboardChartPanel>['$props']) {
  const root = document.createElement('div');
  document.body.append(root);
  const app = createApp({
    render: () => h(DashboardChartPanel, props),
  });
  app.mount(root);
  return { app, root };
}

describe('DashboardChartPanel', () => {
  afterEach(() => {
    mockRenderEcharts.mockReset();
    document.body.innerHTML = '';
  });

  it('keeps a visible busy skeleton while chart data is loading', async () => {
    const { app, root } = mountPanel({
      loading: true,
      option: { series: [] },
    });
    await flushView();

    expect(root.textContent).toContain('loading');
    expect(root.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(mockRenderEcharts).not.toHaveBeenCalled();

    app.unmount();
    root.remove();
  });

  it('shows a visible fallback when chart rendering fails', async () => {
    mockRenderEcharts.mockRejectedValueOnce(new Error('render failed'));
    const { app, root } = mountPanel({
      option: { series: [] },
    });
    await flushView();

    expect(mockRenderEcharts).toHaveBeenCalled();
    expect(root.textContent).toContain('图表暂时无法渲染，请稍后重试');
    expect(root.textContent).not.toContain('chart');

    app.unmount();
    root.remove();
  });
});
