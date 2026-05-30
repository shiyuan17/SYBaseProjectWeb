import { createApp, defineComponent, h, nextTick, onMounted, ref } from 'vue';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { listBodyParts } from '../api/system-management-service';
import BodyPartSelect from './BodyPartSelect.vue';

vi.mock('../api/system-management-service', () => ({
  listBodyParts: vi.fn(),
}));

vi.mock('element-plus', () => {
  const ElAutocomplete = defineComponent({
    name: 'ElAutocomplete',
    setup(_, { attrs, slots }) {
      const suggestions = ref<any[]>([]);

      async function refresh(keyword = '') {
        const fetchSuggestions =
          (attrs.fetchSuggestions as
            | ((value: string, callback: (items: any[]) => void) => void)
            | undefined) ??
          (attrs['fetch-suggestions'] as
            | ((value: string, callback: (items: any[]) => void) => void)
            | undefined);
        if (!fetchSuggestions) {
          suggestions.value = [];
          return;
        }

        fetchSuggestions(keyword, (items) => {
          suggestions.value = items;
        });
        await nextTick();
      }

      onMounted(() => {
        void refresh('');
      });

      return () =>
        h('div', [
          (() => {
            const blurHandler = attrs.onBlur as
              | ((event: FocusEvent) => void)
              | undefined;
            const updateModelValue = attrs['onUpdate:modelValue'] as
              | ((value: string) => void)
              | undefined;

            return h('input', {
              disabled: attrs.disabled,
              placeholder: attrs.placeholder,
              value: (attrs.modelValue ?? attrs['model-value']) as string,
              onBlur: (event: FocusEvent) => blurHandler?.(event),
              onInput: (event: Event) => {
                const value = (event.target as HTMLInputElement).value;
                updateModelValue?.(value);
                void refresh(value);
              },
            });
          })(),
          ...suggestions.value.map((item) =>
            h(
              'button',
              {
                'data-option-value': item.value,
                type: 'button',
                onClick: () => {
                  const selectHandler = attrs.onSelect as
                    | ((option: any) => void)
                    | undefined;
                  selectHandler?.(item);
                },
              },
              slots.default ? slots.default({ item }) : item.value,
            ),
          ),
        ]);
    },
  });

  return {
    ElAutocomplete,
  };
});

const listBodyPartsMock = vi.mocked(listBodyParts);

beforeEach(() => {
  listBodyPartsMock.mockReset();
});

describe('BodyPartSelect', () => {
  it('loads body parts, shows path labels, and emits the leaf part name on selection', async () => {
    listBodyPartsMock.mockResolvedValue([
      {
        children: [
          {
            children: [],
            enabled: true,
            id: 'PART-1',
            parentId: 'ROOT-1',
            partAlias: '胃窦',
            partCode: 'PART_STOMACH',
            partLevel: 2,
            partName: '胃',
            sortOrder: 1,
          },
        ],
        enabled: true,
        id: 'ROOT-1',
        parentId: null,
        partAlias: null,
        partCode: 'ROOT_DIGESTIVE',
        partLevel: 1,
        partName: '消化系统',
        sortOrder: 1,
      },
    ] as never);

    const updates: string[] = [];
    const root = document.createElement('div');
    const app = createApp({
      render() {
        return h(BodyPartSelect, {
          modelValue: '',
          'onUpdate:modelValue': (value: string) => updates.push(value),
        });
      },
    });
    app.mount(root);

    await new Promise((resolve) => setTimeout(resolve, 0));
    const input = root.querySelector<HTMLInputElement>('input');
    if (!input) {
      throw new Error('Expected autocomplete input to be rendered');
    }
    input.value = '胃';
    input.dispatchEvent(new Event('input'));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(root.textContent).toContain('消化系统 / 胃');
    root.querySelector<HTMLButtonElement>('[data-option-value="胃"]')?.click();

    expect(updates.at(-1)).toBe('胃');

    app.unmount();
  });

  it('preserves manual input after blur and trims the final value', async () => {
    listBodyPartsMock.mockResolvedValue([] as never);

    const updates: string[] = [];
    const root = document.createElement('div');
    const app = createApp({
      render() {
        return h(BodyPartSelect, {
          modelValue: '',
          'onUpdate:modelValue': (value: string) => updates.push(value),
        });
      },
    });
    app.mount(root);

    await new Promise((resolve) => setTimeout(resolve, 0));

    const input = root.querySelector<HTMLInputElement>('input');
    if (!input) {
      throw new Error('Expected autocomplete input to be rendered');
    }
    input.value = '自定义部位 ';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new FocusEvent('blur'));

    expect(updates).toEqual(['自定义部位 ', '自定义部位']);

    app.unmount();
  });
});
