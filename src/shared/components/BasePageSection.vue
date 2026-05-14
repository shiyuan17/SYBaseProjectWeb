<template>
  <section class="panel-surface p-5">
    <div
      v-if="title || description"
      class="mb-4 space-y-1"
    >
      <h2
        v-if="title"
        class="text-lg font-semibold text-slate-900"
      >
        {{ title }}
      </h2>
      <p
        v-if="description"
        class="text-sm text-slate-600"
      >
        {{ description }}
      </p>
    </div>
    <slot />
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
  description?: string
}>()
</script>

