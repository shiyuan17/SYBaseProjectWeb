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
import { useRoute } from 'vue-router';

import { Fallback, Page } from '@vben/common-ui';
import { useAccessStore, useUserStore } from '@vben/stores';

import {
  ElAlert,
  ElButton,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
  ElDrawer,
} from 'element-plus';

import { getEquipmentLedgerCapabilities } from '../access';
import {
  createEquipmentMaintenanceLog,
  createEquipmentRecord,
  listEquipmentMaintenanceLogs,
  listEquipmentRecords,
  listEquipmentWarnings,
  updateEquipmentRecord,
} from '../api/operation-support-service';
import {
  EQUIPMENT_STATUS_OPTIONS,
} from '../constants';
import EquipmentDetailPanel from '../components/EquipmentDetailPanel.vue';
import EquipmentDialog from '../components/EquipmentDialog.vue';
import EquipmentWarningPanel from '../components/EquipmentWarningPanel.vue';
import { getOperationSupportPageErrorMessage } from '../utils/error';
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
import {
  formatEquipmentCategory,
  formatEquipmentStatus,
  formatNullable,
} from '../utils/format';

const accessStore = useAccessStore();
const userStore = useUserStore();
const route = useRoute();

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
const equipmentDetailDrawerVisible = ref(false);
const equipmentWarningDrawerVisible = ref(false);

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

const isEditingEquipment = computed(() => Boolean(editingEquipment.value?.id));
const pageTitle = computed(() => String(route.meta.title || '设备台账'));
const pageDescription = computed(() =>
  String(
    route.meta.description ||
      '维护设备台账、保养记录，并跟踪 DUE_SOON 与 OVERDUE 预警。',
  ),
);

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

function scrollToEquipmentTable() {
  document.querySelector('#equipment-main-table')?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  });
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

function openEditSelectedEquipmentDialog() {
  if (!selectedEquipment.value) {
    return;
  }

  openEditEquipmentDialog(selectedEquipment.value);
}

async function openEquipmentDetailDrawer() {
  if (!selectedEquipment.value) {
    return;
  }

  equipmentDetailDrawerVisible.value = true;
  await selectEquipment(selectedEquipment.value);
}

function openEquipmentWarningDrawer() {
  equipmentWarningDrawerVisible.value = true;
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

  equipmentWarningDrawerVisible.value = false;
  await selectEquipment(matchedEquipment);
  scrollToEquipmentTable();
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

async function refreshEquipmentPage() {
  await Promise.all([loadEquipmentRecords(), loadWarnings()]);
  if (selectedEquipment.value) {
    await selectEquipment(selectedEquipment.value);
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
    :title="pageTitle"
    :description="pageDescription"
  >
    <div class="flex flex-col gap-4">
      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        show-icon
        type="error"
      />

      <section class="rounded-lg border border-border bg-card shadow-sm">
        <div class="border-b border-border px-4 py-3">
          <ElForm class="flex flex-wrap items-end gap-x-4 gap-y-3" inline>
            <ElFormItem label="关键字" label-width="72px">
              <ElInput
                v-model="equipmentFilters.keyword"
                clearable
                placeholder="编码/名称"
                style="width: 220px"
                @keyup.enter="loadEquipmentRecords"
              />
            </ElFormItem>
            <ElFormItem label="状态" label-width="56px">
              <ElSelect
                v-model="equipmentFilters.equipmentStatus"
                clearable
                placeholder="全部"
                style="width: 160px"
              >
                <ElOption
                  v-for="option in EQUIPMENT_STATUS_OPTIONS"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </ElSelect>
            </ElFormItem>
            <ElFormItem>
              <ElButton
                :disabled="!capabilities.canQueryEquipment"
                :loading="loading.equipment"
                type="primary"
                @click="loadEquipmentRecords"
              >
                查询
              </ElButton>
            </ElFormItem>
          </ElForm>
        </div>

        <div class="flex flex-wrap gap-2 border-b border-border px-4 py-3">
          <ElButton
            :disabled="!capabilities.canQueryEquipment"
            :loading="loading.equipment || loading.warnings"
            @click="refreshEquipmentPage"
          >
            刷新
          </ElButton>
          <ElButton
            v-if="capabilities.canCreateEquipment"
            type="primary"
            @click="openCreateEquipmentDialog"
          >
            新增设备
          </ElButton>
          <ElButton
            v-if="capabilities.canUpdateEquipment"
            :disabled="!selectedEquipment"
            @click="openEditSelectedEquipmentDialog"
          >
            编辑设备
          </ElButton>
          <ElButton
            v-if="capabilities.canQueryEquipment"
            :disabled="!selectedEquipment"
            @click="openEquipmentDetailDrawer"
          >
            设备详情/保养
          </ElButton>
          <ElButton
            v-if="capabilities.canQueryWarnings"
            @click="openEquipmentWarningDrawer"
          >
            设备预警
          </ElButton>
        </div>

        <div class="px-4 py-4">
          <ElAlert
            v-if="!capabilities.canQueryEquipment"
            :closable="false"
            title="当前账号没有设备档案查询权限，仅可使用已开放的维护或预警能力。"
            type="warning"
          />
          <ElTable
            v-else
            id="equipment-main-table"
            v-loading="loading.equipment"
            :data="equipmentRecords"
            border
            highlight-current-row
            @current-change="selectEquipment"
          >
            <ElTableColumn label="设备编码" min-width="140" prop="equipmentCode" />
            <ElTableColumn label="设备名称" min-width="180" prop="equipmentName" />
            <ElTableColumn label="类别" min-width="120">
              <template #default="{ row }">
                {{ formatEquipmentCategory(row.equipmentCategory) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="型号" min-width="120">
              <template #default="{ row }">
                {{ formatNullable(row.modelNo) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="状态" min-width="110">
              <template #default="{ row }">
                <ElTag :type="getEquipmentStatusTagType(row.equipmentStatus)">
                  {{ formatEquipmentStatus(row.equipmentStatus) }}
                </ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn label="启用日期" min-width="160">
              <template #default="{ row }">
                {{ formatNullable(row.enabledAt) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="下次保养" min-width="160">
              <template #default="{ row }">
                {{ formatNullable(row.nextMaintenanceAt) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="存放位置" min-width="160">
              <template #default="{ row }">
                {{ formatNullable(row.locationDescription) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="备注" min-width="180">
              <template #default="{ row }">
                {{ formatNullable(row.remarks) }}
              </template>
            </ElTableColumn>
          </ElTable>
        </div>
      </section>
    </div>

    <ElDrawer
      v-model="equipmentDetailDrawerVisible"
      :size="920"
      title="设备详情与保养"
    >
      <EquipmentDetailPanel
        :log-form="logForm"
        :can-create-maintenance-log="capabilities.canCreateMaintenanceLog"
        :loading="loading.logs"
        :logs="logs"
        :selected-equipment="selectedEquipment"
        :submitting="submitting"
        @update:log-form="Object.assign(logForm, $event)"
        @submit-maintenance-log="submitMaintenanceLog"
      />
    </ElDrawer>

    <ElDrawer
      v-model="equipmentWarningDrawerVisible"
      :size="860"
      title="设备预警"
    >
      <EquipmentWarningPanel
        :can-query-equipment="capabilities.canQueryEquipment"
        :can-query-warnings="capabilities.canQueryWarnings"
        :get-warning-tag-type="getEquipmentWarningTagType"
        :loading="loading.warnings"
        :warnings="warnings"
        @load-warnings="loadWarnings"
        @navigate-to-equipment-detail="navigateToEquipmentDetail"
      />
    </ElDrawer>

    <EquipmentDialog
      v-model="equipmentDialogVisible"
      :equipment-form="equipmentForm"
      :is-editing-equipment="isEditingEquipment"
      :submitting="submitting"
      @update:equipment-form="Object.assign(equipmentForm, $event)"
      @submit="submitEquipment"
    />
  </Page>
</template>
