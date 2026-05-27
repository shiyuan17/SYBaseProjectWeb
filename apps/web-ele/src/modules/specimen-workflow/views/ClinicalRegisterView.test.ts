import { createApp, h, nextTick } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

const { mockRoute, mockRouter } = vi.hoisted(() => ({
  mockRoute: {
    query: {
      applicationId: 'APP-001',
    } as Record<string, string>,
  },
  mockRouter: {
    replace: vi.fn(),
  },
}));

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => mockRouter,
}));

import ClinicalRegisterView from './ClinicalRegisterView.vue';

describe('ClinicalRegisterView', () => {
  afterEach(() => {
    mockRouter.replace.mockReset();
  });

  it('redirects the legacy route to submission registration dialog mode', async () => {
    const root = document.createElement('div');
    document.body.append(root);

    const app = createApp({
      render: () => h(ClinicalRegisterView),
    });

    app.mount(root);
    await nextTick();

    expect(mockRouter.replace).toHaveBeenCalledWith({
      path: '/workflow/submission-registration',
      query: {
        action: 'register',
        applicationId: 'APP-001',
      },
    });

    app.unmount();
    root.remove();
  });
});
