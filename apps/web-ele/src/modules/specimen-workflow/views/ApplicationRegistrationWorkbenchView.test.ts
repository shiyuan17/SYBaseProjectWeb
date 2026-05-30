import { createApp, h, nextTick } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@vben/common-ui', () => ({
  Page: ((_: Record<string, unknown>, { slots }: any) =>
    h('section', { 'data-testid': 'page' }, slots.default?.())) as unknown,
}));

vi.mock('../components/ApplicationRegistrationWorkbenchPanel.vue', () => ({
  default: (() =>
    h('div', { 'data-testid': 'workbench-panel-proxy' })) as unknown,
}));

import ApplicationRegistrationWorkbenchView from './ApplicationRegistrationWorkbenchView.vue';

describe('ApplicationRegistrationWorkbenchView', () => {
  afterEach(() => {
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
    expect(
      root.querySelector('[data-testid="workbench-panel-proxy"]'),
    ).not.toBeNull();

    app.unmount();
    root.remove();
  });
});
