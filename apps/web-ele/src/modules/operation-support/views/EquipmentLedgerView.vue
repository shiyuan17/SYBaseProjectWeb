<script setup lang="ts">
import type { EquipmentRecordView } from '../types/operation-support';
import type {
  EquipmentFormState,
  MaintenanceLogFormState,
} from '../utils/equipment-ledger';
import type {
  EquipmentCommonDeviceView,
  EquipmentUsageRecordFormState,
} from '../utils/equipment-usage-record';

import { computed, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Fallback, Page } from '@vben/common-ui';
import { useAccessStore, useUserStore } from '@vben/stores';
import { downloadFileFromBlob } from '@vben/utils';

import {
  ElAlert,
  ElButton,
  ElDrawer,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import { getEquipmentLedgerCapabilities } from '../access';
import {
  batchUpdateEquipmentStatus,
  createEquipmentMaintenanceLog,
  createEquipmentRecord,
  createEquipmentUsageRecord,
  listEquipmentCommonDevices,
  listEquipmentMaintenanceLogs,
  listEquipmentRecords,
  updateEquipmentRecord,
} from '../api/operation-support-service';
import EquipmentDetailPanel from '../components/EquipmentDetailPanel.vue';
import EquipmentDialog from '../components/EquipmentDialog.vue';
import EquipmentUsageRecordDialog from '../components/EquipmentUsageRecordDialog.vue';
import { EQUIPMENT_STATUS_OPTIONS } from '../constants';
import {
  buildCreateEquipmentRecordRequest,
  buildCreateMaintenanceLogRequest,
  buildEquipmentExportDocument,
  buildEquipmentPrintDocument,
  buildUpdateEquipmentRecordRequest,
  createDraftEquipmentRecordView,
  createEquipmentFormDefaults,
  createEquipmentFormStateFromRow,
  createMaintenanceLogFormDefaults,
  getEquipmentStatusTagType,
  validateEquipmentForm,
  validateMaintenanceLogForm,
} from '../utils/equipment-ledger';
import {
  applyEquipmentUsageCommonDevice,
  buildCreateEquipmentUsageRecordRequest,
  createEquipmentUsageRecordFormDefaults,
  syncEquipmentUsageRuntimeHours,
  validateEquipmentUsageRecordForm,
} from '../utils/equipment-usage-record';
import { getOperationSupportPageErrorMessage } from '../utils/error';
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
  usageCommonDevices: false,
});
const submitting = ref(false);
const pageError = ref('');
const equipmentRecords = ref<EquipmentRecordView[]>([]);
const selectedEquipment = ref<EquipmentRecordView | null>(null);
const selectedRows = ref<EquipmentRecordView[]>([]);
const logs = ref(awaitSafeLogs());
const editingEquipment = ref<EquipmentRecordView | null>(null);
const equipmentDetailDrawerVisible = ref(false);
const equipmentUsageRecordVisible = ref(false);
const commonDevices = ref<EquipmentCommonDeviceView[]>([]);

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

const equipmentUsageRecordForm = reactive<EquipmentUsageRecordFormState>(
  createEquipmentUsageRecordFormDefaults(getDefaultOperatorName()),
);

const equipmentUsageRecordDialogForm = computed({
  get: () => equipmentUsageRecordForm,
  set: (value: EquipmentUsageRecordFormState) => {
    Object.assign(equipmentUsageRecordForm, value);
  },
});

const logForm = reactive<MaintenanceLogFormState>(
  createMaintenanceLogFormDefaults(getDefaultOperatorName()),
);

const isEditingEquipment = computed(() => Boolean(editingEquipment.value?.id));
const pageTitle = computed(() => String(route.meta.title || '仪器设备管理'));

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

function resetEquipmentUsageRecordForm() {
  Object.assign(
    equipmentUsageRecordForm,
    createEquipmentUsageRecordFormDefaults(getDefaultOperatorName()),
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
    selectedRows.value = [];
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

async function loadCommonDevices() {
  loading.usageCommonDevices = true;
  try {
    commonDevices.value = await listEquipmentCommonDevices();
  } catch (error) {
    ElMessage.error(getOperationSupportPageErrorMessage(error));
  } finally {
    loading.usageCommonDevices = false;
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

function handleSelectionChange(rows: EquipmentRecordView[]) {
  selectedRows.value = rows;
}

function openCreateEquipmentDialog() {
  if (!capabilities.value.canCreateEquipment) {
    ElMessage.warning('当前账号没有设备档案维护权限');
    return;
  }
  editingEquipment.value = createDraftEquipmentRecordView();
  resetEquipmentForm();
}

function openEditSelectedEquipmentDialog() {
  if (!selectedEquipment.value || !capabilities.value.canUpdateEquipment) {
    return;
  }
  editingEquipment.value = selectedEquipment.value;
  Object.assign(
    equipmentForm,
    createEquipmentFormStateFromRow(
      selectedEquipment.value,
      getDefaultOperatorName(),
    ),
  );
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
    await loadEquipmentRecords();
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
    ]);
  } catch (error) {
    ElMessage.error(getOperationSupportPageErrorMessage(error));
  } finally {
    submitting.value = false;
  }
}

async function openEquipmentUsageRecordDialog() {
  resetEquipmentUsageRecordForm();
  await loadCommonDevices();
  equipmentUsageRecordVisible.value = true;
}

function applyCommonDevice(row: EquipmentCommonDeviceView) {
  applyEquipmentUsageCommonDevice(equipmentUsageRecordForm, row);
}

async function submitEquipmentUsageRecord() {
  const validationMessage = validateEquipmentUsageRecordForm(
    equipmentUsageRecordForm,
  );
  if (validationMessage) {
    ElMessage.warning(validationMessage);
    return;
  }

  submitting.value = true;
  try {
    syncEquipmentUsageRuntimeHours(equipmentUsageRecordForm);
    await createEquipmentUsageRecord(
      buildCreateEquipmentUsageRecordRequest(equipmentUsageRecordForm),
    );
    ElMessage.success('设备使用记录已保存');
    equipmentUsageRecordVisible.value = false;
  } catch (error) {
    ElMessage.error(getOperationSupportPageErrorMessage(error));
  } finally {
    submitting.value = false;
  }
}

async function handleBatchStatusUpdate(equipmentStatus: 'ACTIVE' | 'DISABLED') {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先勾选设备');
    return;
  }
  try {
    await batchUpdateEquipmentStatus({
      equipmentIds: selectedRows.value.map((item) => item.id),
      equipmentStatus,
    });
    ElMessage.success(
      equipmentStatus === 'ACTIVE' ? '设备已恢复' : '设备已禁用',
    );
    await loadEquipmentRecords();
  } catch (error) {
    ElMessage.error(getOperationSupportPageErrorMessage(error));
  }
}

function handleExportEquipment() {
  const rows =
    selectedRows.value.length > 0 ? selectedRows.value : equipmentRecords.value;
  if (rows.length === 0) {
    ElMessage.warning('当前没有可导出的设备数据');
    return;
  }
  const html = buildEquipmentExportDocument({
    categoryFormatter: (value) => String(formatEquipmentCategory(value)),
    nullableFormatter: formatNullable,
    rows,
    statusFormatter: (value) => String(formatEquipmentStatus(value)),
  });
  const blob = new Blob([`\uFEFF${html}`], {
    type: 'application/vnd.ms-excel;charset=utf-8',
  });
  downloadFileFromBlob({
    fileName: `仪器设备-${new Date().toISOString().slice(0, 10)}.xls`,
    source: blob,
  });
  ElMessage.success('导出成功');
}

function handlePrintEquipment() {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先勾选需要打印的设备');
    return;
  }
  const printWindow = window.open('', '_blank', 'width=1200,height=860');
  if (!printWindow) {
    ElMessage.warning('打印窗口被浏览器拦截，请允许弹窗后重试');
    return;
  }
  printWindow.document.open();
  printWindow.document.write(
    buildEquipmentPrintDocument({
      categoryFormatter: (value) => String(formatEquipmentCategory(value)),
      nullableFormatter: formatNullable,
      rows: selectedRows.value,
      statusFormatter: (value) => String(formatEquipmentStatus(value)),
    }),
  );
  printWindow.document.close();
}

async function refreshEquipmentPage() {
  await loadEquipmentRecords();
  if (selectedEquipment.value) {
    await selectEquipment(selectedEquipment.value);
  }
}

async function openEquipmentDetailDrawer() {
  if (!selectedEquipment.value) {
    return;
  }
  equipmentDetailDrawerVisible.value = true;
  await selectEquipment(selectedEquipment.value);
}

async function initializePage() {
  const tasks: Promise<void>[] = [];
  if (capabilities.value.canQueryEquipment) {
    tasks.push(loadEquipmentRecords());
  }
  resetLogForm();
  await Promise.all(tasks);
}

watch(
  () => [equipmentUsageRecordForm.startedAt, equipmentUsageRecordForm.endedAt],
  () => {
    syncEquipmentUsageRuntimeHours(equipmentUsageRecordForm);
  },
);

void initializePage();
</script>

<template>
  <div
    v-if="!capabilities.canViewPage"
    class="flex min-h-[360px] items-center justify-center"
  >
    <Fallback status="403" />
  </div>
  <Page v-else :show-header="false" :title="pageTitle">
    <div class="flex flex-col gap-4">
      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        show-icon
        type="error"
      />

      <section class="rounded-lg border border-border bg-card shadow-sm">
        <div class="flex flex-wrap gap-2 border-b border-border px-4 py-3">
          <ElButton
            v-if="capabilities.canCreateEquipment"
            type="primary"
            @click="openCreateEquipmentDialog"
          >
            新增设备
          </ElButton>
          <ElButton
            v-if="capabilities.canUpdateEquipment"
            @click="handleBatchStatusUpdate('ACTIVE')"
          >
            恢复
          </ElButton>
          <ElButton
            v-if="capabilities.canUpdateEquipment"
            @click="handleBatchStatusUpdate('DISABLED')"
          >
            禁用
          </ElButton>
          <ElButton @click="loadEquipmentRecords">查询</ElButton>
          <ElButton @click="handleExportEquipment">导出</ElButton>
          <ElButton @click="handlePrintEquipment">打印设备</ElButton>
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
            v-if="capabilities.canUpdateEquipment"
            @click="openEquipmentUsageRecordDialog"
          >
            设备使用记录
          </ElButton>
        </div>

        <div class="border-b border-border px-4 py-3">
          <ElForm class="flex flex-wrap items-end gap-x-4 gap-y-3" inline>
            <ElFormItem label="关键字" label-width="72px">
              <ElInput
                v-model="equipmentFilters.keyword"
                clearable
                placeholder="资产编号/归口编号/设备名称"
                style="width: 280px"
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
            <ElFormItem>
              <ElButton
                :loading="loading.equipment"
                @click="refreshEquipmentPage"
              >
                刷新
              </ElButton>
            </ElFormItem>
          </ElForm>
        </div>

        <div class="px-4 py-4">
          <div class="overflow-x-auto">
            <ElTable
              id="equipment-main-table"
              v-loading="loading.equipment"
              :data="equipmentRecords"
              border
              highlight-current-row
              @current-change="selectEquipment"
              @selection-change="handleSelectionChange"
            >
              <ElTableColumn type="selection" width="48" />
              <ElTableColumn label="序" type="index" width="56" />
              <ElTableColumn
                label="资产编号"
                min-width="140"
                prop="equipmentCode"
              />
              <ElTableColumn
                label="设备名称"
                min-width="200"
                prop="equipmentName"
              />
              <ElTableColumn label="归口编号" min-width="140">
                <template #default="{ row }">
                  {{ formatNullable(row.managementCode) }}
                </template>
              </ElTableColumn>
              <ElTableColumn label="机型" min-width="160">
                <template #default="{ row }">
                  {{ formatNullable(row.modelNo) }}
                </template>
              </ElTableColumn>
              <ElTableColumn label="设备数量" min-width="96">
                <template #default="{ row }">
                  {{ formatNullable(row.quantity) }}
                </template>
              </ElTableColumn>
              <ElTableColumn label="状态" min-width="96">
                <template #default="{ row }">
                  <ElTag :type="getEquipmentStatusTagType(row.equipmentStatus)">
                    {{ formatEquipmentStatus(row.equipmentStatus) }}
                  </ElTag>
                </template>
              </ElTableColumn>
              <ElTableColumn label="仪器类型" min-width="120">
                <template #default="{ row }">
                  {{ formatEquipmentCategory(row.equipmentCategory) }}
                </template>
              </ElTableColumn>
              <ElTableColumn label="出厂编号" min-width="140">
                <template #default="{ row }">
                  {{ formatNullable(row.factoryNo) }}
                </template>
              </ElTableColumn>
              <ElTableColumn label="使用年限" min-width="96">
                <template #default="{ row }">
                  {{ formatNullable(row.serviceLifeYears) }}
                </template>
              </ElTableColumn>
              <ElTableColumn label="折旧方法" min-width="120">
                <template #default="{ row }">
                  {{ formatNullable(row.depreciationMethod) }}
                </template>
              </ElTableColumn>
              <ElTableColumn label="启用日期" min-width="140">
                <template #default="{ row }">
                  {{ formatNullable(row.enabledAt) }}
                </template>
              </ElTableColumn>
              <ElTableColumn label="出厂日期" min-width="120">
                <template #default="{ row }">
                  {{ formatNullable(row.productionDate) }}
                </template>
              </ElTableColumn>
              <ElTableColumn label="是否常用" min-width="96">
                <template #default="{ row }">
                  {{ row.commonlyUsed ? '是' : '否' }}
                </template>
              </ElTableColumn>
              <ElTableColumn label="归口单位" min-width="160">
                <template #default="{ row }">
                  {{ formatNullable(row.managementUnit) }}
                </template>
              </ElTableColumn>
              <ElTableColumn label="使用人姓名" min-width="140">
                <template #default="{ row }">
                  {{ formatNullable(row.userName) }}
                </template>
              </ElTableColumn>
              <ElTableColumn label="购置日期" min-width="120">
                <template #default="{ row }">
                  {{ formatNullable(row.purchaseDate) }}
                </template>
              </ElTableColumn>
              <ElTableColumn label="金额" min-width="120">
                <template #default="{ row }">
                  {{ formatNullable(row.price) }}
                </template>
              </ElTableColumn>
              <ElTableColumn label="存放地点" min-width="180">
                <template #default="{ row }">
                  {{ formatNullable(row.locationDescription) }}
                </template>
              </ElTableColumn>
              <ElTableColumn label="购置人姓名" min-width="140">
                <template #default="{ row }">
                  {{ formatNullable(row.purchaserName) }}
                </template>
              </ElTableColumn>
              <ElTableColumn label="购置人编号" min-width="140">
                <template #default="{ row }">
                  {{ formatNullable(row.purchaserCode) }}
                </template>
              </ElTableColumn>
            </ElTable>
          </div>
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

    <EquipmentDialog
      v-model="equipmentDialogVisible"
      :equipment-form="equipmentForm"
      :is-editing-equipment="isEditingEquipment"
      :submitting="submitting"
      @update:equipment-form="Object.assign(equipmentForm, $event)"
      @submit="submitEquipment"
    />

    <EquipmentUsageRecordDialog
      v-model="equipmentUsageRecordVisible"
      v-model:usage-record-form="equipmentUsageRecordDialogForm"
      :common-devices="commonDevices"
      :loading-common-devices="loading.usageCommonDevices"
      :submitting="submitting"
      @apply-common-device="applyCommonDevice"
      @submit="submitEquipmentUsageRecord"
    />
  </Page>
</template>
