<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

const props = defineProps<{
  brandLogoSource: string;
  brandName: string;
  partialNotes: string[];
  titlePrefix: string;
  titleSuffix: string;
}>();

const emit = defineEmits<{
  exit: [];
}>();

const noteLayerRef = ref<HTMLElement>();
const isNotePopoverOpen = ref(false);

function closeNotePopover() {
  isNotePopoverOpen.value = false;
}

function toggleNotePopover() {
  isNotePopoverOpen.value = !isNotePopoverOpen.value;
}

function handleDocumentPointerDown(event: MouseEvent) {
  if (!isNotePopoverOpen.value) {
    return;
  }

  const target = event.target;
  if (!(target instanceof Node)) {
    return;
  }

  if (noteLayerRef.value?.contains(target)) {
    return;
  }

  closeNotePopover();
}

function handleDocumentKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeNotePopover();
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleDocumentPointerDown);
  document.addEventListener('keydown', handleDocumentKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleDocumentPointerDown);
  document.removeEventListener('keydown', handleDocumentKeydown);
});
</script>

<template>
  <header
    class="pathology-screen__header"
    data-testid="pathology-screen-header"
  >
    <div class="pathology-screen__brand">
      <div class="pathology-screen__brand-mark">
        <img :src="props.brandLogoSource" :alt="props.brandName" />
      </div>
      <div class="pathology-screen__brand-copy">
        <p class="pathology-screen__brand-name">{{ props.brandName }}</p>
      </div>
    </div>

    <div class="pathology-screen__title-panel">
      <div class="pathology-screen__title-plate">
        <div class="pathology-screen__title-line"></div>
        <h1 class="pathology-screen__title">
          <span>{{ props.titlePrefix }}</span>
          <span class="pathology-screen__title-accent">
            {{ props.titleSuffix }}
          </span>
        </h1>
        <div class="pathology-screen__title-line"></div>
      </div>
    </div>

    <div class="pathology-screen__header-note">
      <div
        v-if="props.partialNotes.length > 0"
        ref="noteLayerRef"
        class="pathology-screen__note-layer"
      >
        <button
          aria-label="查看指标说明"
          class="pathology-screen__note-trigger"
          data-testid="pathology-note-trigger"
          :aria-expanded="isNotePopoverOpen ? 'true' : 'false'"
          type="button"
          @click="toggleNotePopover"
        >
          i
        </button>

        <section
          v-if="isNotePopoverOpen"
          class="pathology-screen__note-popover"
          data-testid="pathology-note-popover"
        >
          <strong>部分指标暂未完全就绪</strong>
          <p>{{ props.partialNotes.join('；') }}</p>
        </section>
      </div>

      <button
        aria-label="进入标本采集首页"
        class="pathology-screen__header-link"
        type="button"
        @click="emit('exit')"
      >
        首页
      </button>
    </div>
  </header>
</template>
