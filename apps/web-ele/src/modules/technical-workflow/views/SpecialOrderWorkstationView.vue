<script setup lang="ts">
import TechnicalWorkbenchPage from '../components/TechnicalWorkbenchPage.vue';

import { SPECIAL_ORDER_WORKSTATION_CONFIG } from '../utils/technical-order-workstations';
</script>

<template>
  <TechnicalWorkbenchPage :config="SPECIAL_ORDER_WORKSTATION_CONFIG" />
</template>
