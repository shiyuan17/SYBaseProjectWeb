import { createApp, h } from 'vue';

import { describe, expect, it } from 'vitest';

import SystemSectionCard from './SystemSectionCard.vue';

describe('SystemSectionCard', () => {
  it('renders title and description with theme semantic classes', () => {
    const root = document.createElement('div');
    const app = createApp({
      render() {
        return h(
          SystemSectionCard,
          {
            description: '支持关键字、启停状态与分页查询。',
            title: '筛选条件',
          },
          {
            default: () => h('div', 'content'),
          },
        );
      },
    });
    app.mount(root);

    expect(root.textContent).toContain('筛选条件');
    expect(root.textContent).toContain('支持关键字、启停状态与分页查询。');

    const section = root.querySelector('section');
    const title = root.querySelector('h3');
    const description = root.querySelector('p');

    expect(section).not.toBeNull();
    expect(title).not.toBeNull();
    expect(description).not.toBeNull();
    expect([...section!.classList]).toEqual(
      expect.arrayContaining(['bg-card', 'border-border']),
    );
    expect([...title!.classList]).toContain('text-foreground');
    expect([...description!.classList]).toContain('text-muted-foreground');
    expect(root.innerHTML).not.toContain('bg-white');
    expect(root.innerHTML).not.toContain('text-slate-');
    expect(root.innerHTML).not.toContain('border-slate-');

    app.unmount();
  });
});
