<script setup lang="ts">
import type { StyleValue } from 'vue';

import type { PageProps } from './types';

import {
  computed,
  nextTick,
  onMounted,
  ref,
  useSlots,
  useTemplateRef,
} from 'vue';

import { CSS_VARIABLE_LAYOUT_CONTENT_HEIGHT } from '@vben-core/shared/constants';
import { cn } from '@vben-core/shared/utils';

defineOptions({
  name: 'Page',
});

const props = withDefaults(defineProps<PageProps>(), {
  autoContentHeight: false,
  heightOffset: 0,
  showHeader: true,
});
const slots = useSlots();

const headerHeight = ref(0);
const footerHeight = ref(0);
const shouldAutoHeight = ref(false);

const headerRef = useTemplateRef<HTMLDivElement>('headerRef');
const footerRef = useTemplateRef<HTMLDivElement>('footerRef');

const contentStyle = computed<StyleValue>(() => {
  if (props.autoContentHeight) {
    return {
      height: `calc(var(${CSS_VARIABLE_LAYOUT_CONTENT_HEIGHT}) - ${headerHeight.value}px - ${footerHeight.value}px - ${typeof props.heightOffset === 'number' ? `${props.heightOffset}px` : props.heightOffset})`,
      overflowY: shouldAutoHeight.value ? 'auto' : 'unset',
    };
  }
  return {};
});

const shouldRenderHeader = computed(
  () =>
    props.showHeader &&
    (props.description ||
      slots.description ||
      props.title ||
      slots.title ||
      slots.extra),
);

async function calcContentHeight() {
  if (!props.autoContentHeight) {
    return;
  }
  await nextTick();
  headerHeight.value = headerRef.value?.offsetHeight || 0;
  footerHeight.value = footerRef.value?.offsetHeight || 0;
  setTimeout(() => {
    shouldAutoHeight.value = true;
  }, 30);
}

onMounted(() => {
  calcContentHeight();
});
</script>

<template>
  <div class="relative flex min-h-full flex-col">
    <div
      v-if="shouldRenderHeader"
      ref="headerRef"
      :class="
        cn(
          'relative flex items-end border-b border-border bg-card px-6 py-4',
          props.headerClass,
        )
      "
    >
      <div class="flex-auto">
        <slot name="title">
          <div v-if="props.title" class="mb-2 flex text-lg font-semibold">
            {{ props.title }}
          </div>
        </slot>

        <slot name="description">
          <p v-if="props.description" class="text-muted-foreground">
            {{ props.description }}
          </p>
        </slot>
      </div>

      <div v-if="$slots.extra">
        <slot name="extra"></slot>
      </div>
    </div>

    <div :class="cn('h-full p-4', props.contentClass)" :style="contentStyle">
      <slot></slot>
    </div>
    <div
      v-if="$slots.footer"
      ref="footerRef"
      :class="cn('align-center flex bg-card px-6 py-4', props.footerClass)"
    >
      <slot name="footer"></slot>
    </div>
  </div>
</template>
