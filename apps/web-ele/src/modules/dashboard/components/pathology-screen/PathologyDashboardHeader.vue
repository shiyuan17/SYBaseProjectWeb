<script setup lang="ts">
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

  <section
    v-if="props.partialNotes.length > 0"
    class="pathology-warning"
    data-testid="pathology-partial-banner"
  >
    <strong>部分指标暂未完全就绪</strong>
    <p>{{ props.partialNotes.join('；') }}</p>
  </section>
</template>
