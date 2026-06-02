<script setup lang="ts">
import TechnicalWorkbenchPage from '../components/TechnicalWorkbenchPage.vue';

import { CYTOLOGY_WORKSTATION_CONFIG } from '../utils/technical-order-workstations';
</script>

<template>
  <TechnicalWorkbenchPage :config="CYTOLOGY_WORKSTATION_CONFIG" />
</template>
