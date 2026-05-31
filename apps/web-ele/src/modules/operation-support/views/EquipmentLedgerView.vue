<script setup lang="ts">
import type {
  EquipmentRecordView,
  EquipmentWarningView,
} from '../types/operation-support';
import type {
  EquipmentFormState,
  MaintenanceLogFormState,
} from '../utils/equipment-ledger';

import { computed, reactive, ref } from 'vue';

import { Fallback, Page } from '@vben/common-ui';
import { useAccessStore, useUserStore } from '@vben/stores';

import { ElAlert, ElMessage } from 'element-plus';

import { getEquipmentLedgerCapabilities } from '../access';
import {
  createEquipmentMaintenanceLog,
  createEquipmentRecord,
  listEquipmentMaintenanceLogs,
  listEquipmentRecords,
  listEquipmentWarnings,
  updateEquipmentRecord,
} from '../api/operation-support-service';
import EquipmentCatalogPanel from '../components/EquipmentCatalogPanel.vue';
import EquipmentDetailPanel from '../components/EquipmentDetailPanel.vue';
import EquipmentDialog from '../components/EquipmentDialog.vue';
import EquipmentWarningPanel from '../components/EquipmentWarningPanel.vue';
import {
  buildCreateEquipmentRecordRequest,
  buildCreateMaintenanceLogRequest,
  buildUpdateEquipmentRecordRequest,
  createDraftEquipmentRecordView,
  createEquipmentFormDefaults,
  createEquipmentFormStateFromRow,
  createMaintenanceLogFormDefaults,
  getEquipmentStatusTagType,
  getEquipmentWarningTagType,
  validateEquipmentForm,
  validateMaintenanceLogForm,
} from '../utils/equipment-ledger';
import { getOperationSupportPageErrorMessage } from '../utils/error';

const accessStore = useAccessStore();
const userStore = useUserStore();

const capabilities = computed(() =>
  getEquipmentLedgerCapabilities(accessStore.accessCodes),
);
const currentOperatorName = computed(
  () => userStore.userInfo?.realName?.trim() ?? '',
);

const loading = reactive({
  equipment: false,
  logs: false,
  warnings: false,
});
const submitting = ref(false);
const pageError = ref('');
const equipmentRecords = ref<EquipmentRecordView[]>([]);
const selectedEquipment = ref<EquipmentRecordView | null>(null);
const logs = ref(awaitSafeLogs());
const warnings = ref<EquipmentWarningView[]>([]);
const editingEquipment = ref<EquipmentRecordView | null>(null);
const equipmentDialogVisible = computed({
  get: () => editingEquipment.value !== null,
  set: (visible: boolean) => {
    if (!visible) {
      editingEquipment.value = null;
    }
  },
});

function awaitSafeLogs() {
  return [] as Awaited<ReturnType<typeof listEquipmentMaintenanceLogs>>;
}

const equipmentFilters = reactive({
  equipmentStatus: '',
  keyword: '',
});

const equipmentForm = reactive<EquipmentFormState>(
  createEquipmentFormDefaults(getDefaultOperatorName()),
);

const logForm = reactive<MaintenanceLogFormState>(
  createMaintenanceLogFormDefaults(getDefaultOperatorName()),
);

const getWarningTagType = getEquipmentWarningTagType;
const isEditingEquipment = computed(() => Boolean(editingEquipment.value?.id));

function getDefaultOperatorName() {
  return currentOperatorName.value;
}

function resetEquipmentForm() {
  Object.assign(
    equipmentForm,
    createEquipmentFormDefaults(getDefaultOperatorName()),
  );
}

function resetLogForm() {
  Object.assign(
    logForm,
    createMaintenanceLogFormDefaults(getDefaultOperatorName()),
  );
}

function openCreateEquipmentDialog() {
  if (!capabilities.value.canCreateEquipment) {
    ElMessage.warning('当前账号没有设备档案维护权限');
    return;
  }

  editingEquipment.value = createDraftEquipmentRecordView();
  resetEquipmentForm();
}

function openEditEquipmentDialog(row: EquipmentRecordView) {
  if (!capabilities.value.canUpdateEquipment) {
    ElMessage.warning('当前账号没有设备档案维护权限');
    return;
  }

  editingEquipment.value = row;
  Object.assign(
    equipmentForm,
    createEquipmentFormStateFromRow(row, getDefaultOperatorName()),
  );
}

function syncSelectedEquipment() {
  if (!selectedEquipment.value) {
    return;
  }

  selectedEquipment.value =
    equipmentRecords.value.find(
      (item) => item.id === selectedEquipment.value?.id,
    ) ?? null;
}

async function loadEquipmentRecords() {
  if (!capabilities.value.canQueryEquipment) {
    equipmentRecords.value = [];
    selectedEquipment.value = null;
    return;
  }

  loading.equipment = true;
  pageError.value = '';
  try {
    equipmentRecords.value = await listEquipmentRecords({
      equipmentStatus: equipmentFilters.equipmentStatus || undefined,
      keyword: equipmentFilters.keyword.trim() || undefined,
    });
    syncSelectedEquipment();
  } catch (error) {
    pageError.value = getOperationSupportPageErrorMessage(error);
  } finally {
    loading.equipment = false;
  }
}

async function loadWarnings() {
  if (!capabilities.value.canQueryWarnings) {
    warnings.value = [];
    return;
  }

  loading.warnings = true;
  try {
    warnings.value = await listEquipmentWarnings();
  } catch (error) {
    ElMessage.error(getOperationSupportPageErrorMessage(error));
  } finally {
    loading.warnings = false;
  }
}

async function selectEquipment(row: EquipmentRecordView | null) {
  selectedEquipment.value = row;
  logs.value = [];

  if (!row || !capabilities.value.canQueryEquipment) {
    return;
  }

  loading.logs = true;
  try {
    logs.value = await listEquipmentMaintenanceLogs(row.id);
  } catch (error) {
    ElMessage.error(getOperationSupportPageErrorMessage(error));
  } finally {
    loading.logs = false;
  }
}

function scrollToEquipmentDetail() {
  document.querySelector('#equipment-detail')?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  });
}

async function navigateToEquipmentDetail(warning: EquipmentWarningView) {
  if (!capabilities.value.canQueryEquipment) {
    ElMessage.warning('当前账号没有设备档案查询权限，无法打开设备详情');
    return;
  }

  equipmentFilters.keyword = warning.equipmentCode;
  equipmentFilters.equipmentStatus = '';
  await loadEquipmentRecords();

  const matchedEquipment = equipmentRecords.value.find(
    (item) => item.id === warning.equipmentId,
  );
  if (!matchedEquipment) {
    ElMessage.warning('未找到对应设备，请刷新后重试');
    return;
  }

  await selectEquipment(matchedEquipment);
  scrollToEquipmentDetail();
  ElMessage.success(`已定位到设备 ${warning.equipmentCode}`);
}

async function submitEquipment() {
  if (!editingEquipment.value) {
    return;
  }

  const validationMessage = validateEquipmentForm(
    equipmentForm,
    !editingEquipment.value.id,
  );
  if (validationMessage) {
    ElMessage.warning(validationMessage);
    return;
  }

  submitting.value = true;
  try {
    if (editingEquipment.value.id) {
      await updateEquipmentRecord(
        editingEquipment.value.id,
        buildUpdateEquipmentRecordRequest(equipmentForm),
      );
      ElMessage.success('设备档案已更新');
    } else {
      await createEquipmentRecord(
        buildCreateEquipmentRecordRequest(equipmentForm),
      );
      ElMessage.success('设备档案已创建');
    }
    equipmentDialogVisible.value = false;
    await Promise.all([loadEquipmentRecords(), loadWarnings()]);
  } catch (error) {
    ElMessage.error(getOperationSupportPageErrorMessage(error));
  } finally {
    submitting.value = false;
  }
}

async function submitMaintenanceLog() {
  const validationMessage = validateMaintenanceLogForm({
    form: logForm,
    hasSelectedEquipment: Boolean(selectedEquipment.value),
  });
  if (validationMessage) {
    ElMessage.warning(validationMessage);
    return;
  }
  if (!selectedEquipment.value) {
    return;
  }

  submitting.value = true;
  try {
    await createEquipmentMaintenanceLog(
      selectedEquipment.value.id,
      buildCreateMaintenanceLogRequest(logForm),
    );
    ElMessage.success('维护记录已新增');
    resetLogForm();
    await Promise.all([
      selectEquipment(selectedEquipment.value),
      loadEquipmentRecords(),
      loadWarnings(),
    ]);
  } catch (error) {
    ElMessage.error(getOperationSupportPageErrorMessage(error));
  } finally {
    submitting.value = false;
  }
}

async function initializePage() {
  const tasks: Promise<void>[] = [];

  if (capabilities.value.canQueryEquipment) {
    tasks.push(loadEquipmentRecords());
  }
  if (capabilities.value.canQueryWarnings) {
    tasks.push(loadWarnings());
  }
  resetLogForm();

  await Promise.all(tasks);
}

void initializePage();
</script>

<template>
  <div
    v-if="!capabilities.canViewPage"
    class="flex min-h-[360px] items-center justify-center"
  >
    <Fallback status="403" />
  </div>
  <Page
    v-else
    title="设备台账"
    description="维护设备台账、保养记录，并跟踪 DUE_SOON 与 OVERDUE 预警。"
  >
    <div class="flex flex-col gap-4">
      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        show-icon
        type="error"
      />

      <EquipmentCatalogPanel
        v-model:equipment-filters="equipmentFilters"
        :can-create-equipment="capabilities.canCreateEquipment"
        :can-query-equipment="capabilities.canQueryEquipment"
        :can-update-equipment="capabilities.canUpdateEquipment"
        :equipment-records="equipmentRecords"
        :get-equipment-status-tag-type="getEquipmentStatusTagType"
        :loading="loading.equipment"
        @load-equipment-records="loadEquipmentRecords"
        @open-create-equipment-dialog="openCreateEquipmentDialog"
        @open-edit-equipment-dialog="openEditEquipmentDialog"
        @select-equipment="selectEquipment"
      />

      <EquipmentDetailPanel
        v-model:log-form="logForm"
        :can-create-maintenance-log="capabilities.canCreateMaintenanceLog"
        :loading="loading.logs"
        :logs="logs"
        :selected-equipment="selectedEquipment"
        :submitting="submitting"
        @submit-maintenance-log="submitMaintenanceLog"
      />

      <EquipmentWarningPanel
        :can-query-equipment="capabilities.canQueryEquipment"
        :can-query-warnings="capabilities.canQueryWarnings"
        :get-warning-tag-type="getWarningTagType"
        :loading="loading.warnings"
        :warnings="warnings"
        @load-warnings="loadWarnings"
        @navigate-to-equipment-detail="navigateToEquipmentDetail"
      />
    </div>

    <EquipmentDialog
      v-model="equipmentDialogVisible"
      v-model:equipment-form="equipmentForm"
      :is-editing-equipment="isEditingEquipment"
      :submitting="submitting"
      @submit="submitEquipment"
    />
  </Page>
</template>
