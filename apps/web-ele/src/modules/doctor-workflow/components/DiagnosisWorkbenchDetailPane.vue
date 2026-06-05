<script setup lang="ts">
import type { DiagnosticWorkbenchView } from '../types/doctor-workflow';

import DiagnosisWorkbenchTabs from './DiagnosisWorkbenchTabs.vue';

defineProps<{
  workbench: DiagnosticWorkbenchView | null;
}>();
</script>

<template>
  <div class="flex min-h-0 flex-col">
    <DiagnosisWorkbenchTabs :workbench="workbench" />
  </div>
</template>
