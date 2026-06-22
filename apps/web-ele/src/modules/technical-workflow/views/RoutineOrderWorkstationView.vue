<script setup lang="ts">
import type { RoutineMedicalOrderRow } from '../composables/useRoutineMedicalOrderActions';
import type {
  TechnicalWorkbenchActionEventPayload,
  TechnicalWorkbenchQueryActionEventPayload,
} from '../types/technical-workbench';

import RoutineOrderQcDrawer from '../components/RoutineOrderQcDrawer.vue';
import RoutineOrderTerminationDialog from '../components/RoutineOrderTerminationDialog.vue';
import TechnicalWorkbenchPage from '../components/TechnicalWorkbenchPage.vue';
import { useRoutineMedicalOrderActions } from '../composables/useRoutineMedicalOrderActions';
import { ROUTINE_ORDER_WORKSTATION_CONFIG } from '../utils/technical-order-workstations';

const {
  latestQcEvaluation,
  loadLatestQcEvaluation,
  qcDrawerVisible,
  selectedRows,
  setSelectedRows,
  submitQcEvaluation,
  submitTermination,
  terminationDialogVisible,
  workbenchRef,
  handleToolbarAction,
} = useRoutineMedicalOrderActions();

void workbenchRef;

function handleSelectionChange(rows: RoutineMedicalOrderRow[]) {
  setSelectedRows(rows);
}

function handleQueryAction(payload: TechnicalWorkbenchQueryActionEventPayload) {
  if (payload.trigger === 'action' && payload.action) {
    void handleToolbarAction(payload.action);
    return;
  }
  void workbenchRef.value?.reload?.();
}

function handleToolbarActionEvent(
  payload: TechnicalWorkbenchActionEventPayload,
) {
  void handleToolbarAction(payload.action);
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <TechnicalWorkbenchPage
      ref="workbenchRef"
      :config="ROUTINE_ORDER_WORKSTATION_CONFIG"
      @query-action="handleQueryAction"
      @selection-change="handleSelectionChange"
      @toolbar-action="handleToolbarActionEvent"
    />

    <RoutineOrderTerminationDialog
      v-model="terminationDialogVisible"
      :rows="selectedRows"
      @submit="submitTermination"
    />

    <RoutineOrderQcDrawer
      v-model="qcDrawerVisible"
      :latest-evaluation="latestQcEvaluation"
      :rows="selectedRows"
      @active-row-change="loadLatestQcEvaluation"
      @submit="submitQcEvaluation"
    />
  </div>
</template>
