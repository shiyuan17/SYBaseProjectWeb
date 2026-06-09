<script setup lang="ts">
import type {
  DiagnosticReportPrintPreview,
  DiagnosticWorkbenchView,
} from '../types/doctor-workflow';

import DiagnosisWorkbenchTabs from './DiagnosisWorkbenchTabs.vue';

defineProps<{
  printPreview: DiagnosticReportPrintPreview | null;
  workbench: DiagnosticWorkbenchView | null;
}>();
</script>

<template>
  <div class="flex min-h-0 flex-col">
    <DiagnosisWorkbenchTabs
      :print-preview="printPreview"
      :workbench="workbench"
    >
      <template #medical-orders>
        <slot name="medical-orders"></slot>
      </template>
      <template #capture>
        <slot name="capture"></slot>
      </template>
    </DiagnosisWorkbenchTabs>
  </div>
</template>
