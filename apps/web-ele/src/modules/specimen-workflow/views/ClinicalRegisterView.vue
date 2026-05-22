<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

onMounted(() => {
  void router.replace({
    path: '/workflow/specimen-management',
    query: route.query,
  });
});
</script>

<template>
  <div class="min-h-[1px]" />
</template>
