<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

onMounted(() => {
  void router.replace({
    path: '/workflow/submission-registration',
    query: {
      ...route.query,
      action: route.query.action ?? 'register',
    },
  });
});
</script>

<template>
  <div></div>
</template>
