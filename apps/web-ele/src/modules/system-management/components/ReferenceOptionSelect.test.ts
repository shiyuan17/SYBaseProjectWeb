import { createApp, defineComponent, h, nextTick, onMounted, ref } from 'vue';

import { describe, expect, it, vi } from 'vitest';

vi.mock('element-plus/theme-chalk/base.css', () => ({}));
vi.mock('element-plus/es/components/autocomplete/style/css', () => ({}));

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
              slots.default ? slots.default({ item }) : item.label,
            ),
          ),
        ]);
    },
  });

  return {
    ElAutocomplete,
  };
});
const { default: ReferenceOptionSelect } =
  await import('./ReferenceOptionSelect.vue');

describe('ReferenceOptionSelect', () => {
  it('displays labels while emitting the selected standardized value', async () => {
    const updates: string[] = [];
    const root = document.createElement('div');
    const app = createApp({
      render() {
        return h(ReferenceOptionSelect, {
          modelValue: '',
          options: [
            { label: '常规', value: 'ROUTINE' },
            { label: '冰冻', value: 'FROZEN' },
          ],
          'onUpdate:modelValue': (value: string) => updates.push(value),
        });
      },
    });
    app.mount(root);

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(root.textContent).toContain('常规');
    root
      .querySelector<HTMLButtonElement>('[data-option-value="ROUTINE"]')
      ?.click();

    expect(updates.at(-1)).toBe('ROUTINE');

    app.unmount();
  });

  it('preserves custom manual input after blur and trims the final value', async () => {
    const updates: string[] = [];
    const root = document.createElement('div');
    const app = createApp({
      render() {
        return h(ReferenceOptionSelect, {
          modelValue: '',
          options: [{ label: '常规', value: 'ROUTINE' }],
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
    input.value = '自定义固定液 ';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new FocusEvent('blur'));

    expect(updates).toEqual(['自定义固定液 ', '自定义固定液']);

    app.unmount();
  });
});
