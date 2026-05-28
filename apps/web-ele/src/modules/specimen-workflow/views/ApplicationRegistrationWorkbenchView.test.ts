import { createApp, defineComponent, h, nextTick } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

const panelProps = vi.hoisted(() => ({
  fullHeight: false,
}));

vi.mock('@vben/common-ui', () => ({
  Page: defineComponent({
    setup(_, { slots }) {
      return () => h('section', { 'data-testid': 'page' }, slots.default?.());
    },
  }),
}));

vi.mock('../components/ApplicationRegistrationWorkbenchPanel.vue', () => ({
  default: defineComponent({
    props: {
      fullHeight: {
        default: false,
        type: Boolean,
      },
    },
    setup(props) {
      panelProps.fullHeight = props.fullHeight;
      return () => h('div', { 'data-testid': 'workbench-panel-proxy' });
    },
  }),
}));

import ApplicationRegistrationWorkbenchView from './ApplicationRegistrationWorkbenchView.vue';

describe('ApplicationRegistrationWorkbenchView', () => {
  afterEach(() => {
    panelProps.fullHeight = false;
    document.body.innerHTML = '';
  });

  it('renders the shared workbench panel in full-height mode', async () => {
    const root = document.createElement('div');
    document.body.append(root);

    const app = createApp({
      render: () => h(ApplicationRegistrationWorkbenchView),
    });

    app.mount(root);
    await nextTick();

    expect(root.querySelector('[data-testid="page"]')).not.toBeNull();
    expect(root.querySelector('[data-testid="workbench-panel-proxy"]')).not.toBeNull();
    expect(panelProps.fullHeight).toBe(true);

    app.unmount();
    root.remove();
  });
});
