<script setup lang="ts">
import type { DiagnosticWorkbenchView } from '../types/doctor-workflow';

import type { MedicalOrderBlockOption } from '#/modules/shared/components/medical-order-workbench';

import { computed } from 'vue';

import { useAccessStore } from '@vben/stores';

import MedicalOrderWorkbenchPane from '#/modules/shared/components/MedicalOrderWorkbenchPane.vue';

import { M4_PERMISSION_CODES } from '../constants';

const props = withDefaults(
  defineProps<{
    embedded?: boolean;
    loading?: boolean;
    workbench: DiagnosticWorkbenchView | null;
  }>(),
  {
    embedded: false,
    loading: false,
  },
);

const emit = defineEmits<{
  refresh: [];
}>();

const accessStore = useAccessStore();

const canCreateMedicalOrder = computed(() =>
  accessStore.accessCodes.includes(M4_PERMISSION_CODES.MEDICAL_ORDER_CREATE),
);

const blockOptions = computed<MedicalOrderBlockOption[]>(() => [
  ...(props.workbench?.blocks ?? []).map((block) => ({
    blockCode: normalizeBlockLabel(
      block.blockCode,
      props.workbench?.pathologyNo ?? undefined,
    ),
    description: block.description ?? block.tissueName ?? block.specimenName,
    label: [
      normalizeBlockLabel(
        block.blockCode,
        props.workbench?.pathologyNo ?? undefined,
      ),
      normalizeBlockLabel(
        block.description ?? block.tissueName ?? block.specimenName,
        props.workbench?.pathologyNo ?? undefined,
      ),
    ]
      .filter(Boolean)
      .join(' '),
    optionId: `CASE_BLOCK:${block.blockId}`,
    source: 'CASE_BLOCK' as const,
    targetBlockId: block.blockId,
  })),
  ...(props.workbench?.medicalOrderBlocks ?? []).map((block) => ({
    blockCode: normalizeBlockLabel(
      block.blockNo,
      props.workbench?.pathologyNo ?? undefined,
    ),
    description: null,
    label: normalizeBlockLabel(
      block.blockNo,
      props.workbench?.pathologyNo ?? undefined,
    ),
    optionId: `MEDICAL_ORDER_ONLY:${block.medicalOrderBlockId}`,
    source: 'MEDICAL_ORDER_ONLY' as const,
    targetBlockId: null,
  })),
]);

function normalizeBlockLabel(
  value: null | string | undefined,
  pathologyNo?: string,
) {
  const trimmedValue = value?.trim();
  const trimmedPathologyNo = pathologyNo?.trim();
  if (!trimmedValue || !trimmedPathologyNo) {
    return trimmedValue ?? '';
  }
  return trimmedValue
    .replace(new RegExp(`^${escapeRegExp(trimmedPathologyNo)}[-_]?`), '')
    .trim();
}

function escapeRegExp(value: string) {
  return value.replaceAll(/[$()*+.?[\\\]^{|}]/g, String.raw`\$&`);
}
</script>

<template>
  <MedicalOrderWorkbenchPane
    :block-options="blockOptions"
    :can-create-medical-order="canCreateMedicalOrder"
    :case-id="workbench?.caseId ?? ''"
    :embedded="embedded"
    :loading="loading"
    :medical-orders="workbench?.medicalOrders ?? []"
    :pathology-no="workbench?.pathologyNo ?? null"
    :readonly="false"
    @refresh="emit('refresh')"
  />
</template>
