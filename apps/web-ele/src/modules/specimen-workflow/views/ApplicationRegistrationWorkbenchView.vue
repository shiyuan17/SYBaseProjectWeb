<script setup lang="ts">
import { Page } from '@vben/common-ui';

import ApplicationRegistrationWorkbenchPanel from '../components/ApplicationRegistrationWorkbenchPanel.vue';
</script>

<template>
  <Page
    :show-header="false"
    auto-content-height
    content-class="overflow-hidden"
  >
    <ApplicationRegistrationWorkbenchPanel full-height />
  </Page>
</template>
