<script setup lang="ts">
import TechnicalWorkbenchPage from '../components/TechnicalWorkbenchPage.vue';
import { LIQUID_CYTOLOGY_WORKSTATION_CONFIG } from '../utils/technical-order-workstations';
</script>

<template>
  <TechnicalWorkbenchPage :config="LIQUID_CYTOLOGY_WORKSTATION_CONFIG" />
</template>
