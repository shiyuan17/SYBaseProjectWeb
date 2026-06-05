import { createApp, defineComponent, h, inject, onMounted, provide } from 'vue';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { listSystemUsers } from '../api/system-management-service';
import SystemUserSelect from './SystemUserSelect.vue';

const selectOptionKey = Symbol('select-option');

vi.mock('../api/system-management-service', () => ({
  listSystemUsers: vi.fn(),
}));

vi.mock('element-plus', () => {
  const ElSelect = defineComponent({
    name: 'ElSelect',
    setup(_, { attrs, slots }) {
      const updateModelValue = attrs['onUpdate:modelValue'] as
        | ((value: string) => void)
        | undefined;
      const visibleChange = attrs.onVisibleChange as
        | ((visible: boolean) => void)
        | undefined;

      provide(selectOptionKey, (value: string) => {
        updateModelValue?.(value);
      });

      onMounted(() => {
        visibleChange?.(true);
      });

      return () =>
        h('div', { 'data-testid': 'select-root' }, slots.default?.());
    },
  });

  const ElOption = defineComponent({
    name: 'ElOption',
    props: {
      label: {
        required: true,
        type: String,
      },
      value: {
        required: true,
        type: String,
      },
    },
    setup(props) {
      const selectOption = inject<(value: string) => void>(selectOptionKey);

      return () =>
        h(
          'button',
          {
            'data-option-value': props.value,
            type: 'button',
            onClick: () => selectOption?.(props.value),
          },
          props.label,
        );
    },
  });

  return {
    ElOption,
    ElSelect,
  };
});

const listSystemUsersMock = vi.mocked(listSystemUsers);

beforeEach(() => {
  listSystemUsersMock.mockReset();
});

describe('SystemUserSelect', () => {
  it('renders only the Chinese display name while preserving remote search', async () => {
    listSystemUsersMock.mockResolvedValue({
      items: [
        {
          id: 'USER-1',
          loginName: 'm1.admin',
          name: '病理管理员',
        },
      ],
      page: 1,
      size: 20,
      total: 1,
    } as never);

    const root = document.createElement('div');
    const app = createApp({
      render() {
        return h(SystemUserSelect, {
          modelValue: '',
        });
      },
    });
    app.mount(root);

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(listSystemUsersMock).toHaveBeenCalledWith({
      enabled: true,
      keyword: undefined,
      page: 1,
      size: 20,
    });
    expect(root.textContent).toContain('病理管理员');
    expect(root.textContent).not.toContain('m1.admin');

    app.unmount();
  });

  it('emits the selected user id and Chinese name', async () => {
    listSystemUsersMock.mockResolvedValue({
      items: [
        {
          id: 'USER-1',
          loginName: 'm1.admin',
          name: '病理管理员',
        },
      ],
      page: 1,
      size: 20,
      total: 1,
    } as never);

    const updates: string[] = [];
    const changes: Array<null | {
      id: string;
      loginName: string;
      name: string;
    }> = [];
    const root = document.createElement('div');
    const app = createApp({
      render() {
        return h(SystemUserSelect, {
          modelValue: '',
          'onUpdate:modelValue': (value: string) => updates.push(value),
          onChange: (
            user: null | { id: string; loginName: string; name: string },
          ) => changes.push(user),
        });
      },
    });
    app.mount(root);

    await new Promise((resolve) => setTimeout(resolve, 0));
    root
      .querySelector<HTMLButtonElement>('[data-option-value="USER-1"]')
      ?.click();

    expect(updates).toEqual(['USER-1']);
    expect(changes).toEqual([
      {
        id: 'USER-1',
        loginName: 'm1.admin',
        name: '病理管理员',
      },
    ]);

    app.unmount();
  });
});
