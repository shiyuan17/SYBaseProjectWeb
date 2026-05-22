<script setup lang="ts">
import type {
  EquipmentRecordView,
} from '../types/operation-support';

import { computed, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  ElAlert,
  ElButton,
  ElDialog,
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

import {
  createEquipmentMaintenanceLog,
  createEquipmentRecord,
  listEquipmentMaintenanceLogs,
  listEquipmentRecords,
  listEquipmentWarnings,
  updateEquipmentRecord,
} from '../api/operation-support-service';
import OperationSectionCard from '../components/OperationSectionCard.vue';
import {
  EQUIPMENT_CATEGORY_OPTIONS,
  EQUIPMENT_STATUS_OPTIONS,
  MAINTENANCE_STATUS_OPTIONS,
  MAINTENANCE_TYPE_OPTIONS,
} from '../constants';
import { getOperationSupportPageErrorMessage } from '../utils/error';
import {
  formatEquipmentCategory,
  formatEquipmentStatus,
  formatMaintenanceStatus,
  formatMaintenanceType,
  formatNullable,
  formatWarningType,
} from '../utils/format';

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
const warnings = ref(awaitSafeWarnings());
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

function awaitSafeWarnings() {
  return [] as Awaited<ReturnType<typeof listEquipmentWarnings>>;
}

const equipmentFilters = reactive({
  equipmentStatus: '',
  keyword: '',
});

const equipmentForm = reactive({
  enabledAt: '',
  equipmentCategory: '',
  equipmentCode: '',
  equipmentName: '',
  equipmentStatus: 'ACTIVE',
  locationDescription: '',
  modelNo: '',
  nextMaintenanceAt: '',
  operatorName: '',
  remarks: '',
});

const logForm = reactive({
  description: '',
  maintenanceStatus: 'COMPLETED',
  maintenanceType: 'MAINTENANCE',
  nextMaintenanceAt: '',
  operatorName: '',
  performedAt: '',
  remarks: '',
});

function getEquipmentStatusTagType(status?: null | string) {
  if (status === 'ACTIVE') {
    return 'success';
  }
  if (status === 'MAINTENANCE') {
    return 'warning';
  }
  return 'info';
}

function getWarningTagType(type?: null | string) {
  if (type === 'OVERDUE') {
    return 'danger';
  }
  if (type === 'DUE_SOON') {
    return 'warning';
  }
  return 'info';
}

function resetEquipmentForm() {
  equipmentForm.enabledAt = '';
  equipmentForm.equipmentCategory = '';
  equipmentForm.equipmentCode = '';
  equipmentForm.equipmentName = '';
  equipmentForm.equipmentStatus = 'ACTIVE';
  equipmentForm.locationDescription = '';
  equipmentForm.modelNo = '';
  equipmentForm.nextMaintenanceAt = '';
  equipmentForm.operatorName = '';
  equipmentForm.remarks = '';
}

function openCreateEquipmentDialog() {
  editingEquipment.value = {
    enabledAt: null,
    equipmentCategory: null,
    equipmentCode: '',
    equipmentName: '',
    equipmentStatus: 'ACTIVE',
    id: '',
    locationDescription: null,
    modelNo: null,
    nextMaintenanceAt: null,
    remarks: null,
  };
  resetEquipmentForm();
}

function openEditEquipmentDialog(row: EquipmentRecordView) {
  editingEquipment.value = row;
  equipmentForm.enabledAt = row.enabledAt ?? '';
  equipmentForm.equipmentCategory = row.equipmentCategory ?? '';
  equipmentForm.equipmentCode = row.equipmentCode;
  equipmentForm.equipmentName = row.equipmentName;
  equipmentForm.equipmentStatus = row.equipmentStatus;
  equipmentForm.locationDescription = row.locationDescription ?? '';
  equipmentForm.modelNo = row.modelNo ?? '';
  equipmentForm.nextMaintenanceAt = row.nextMaintenanceAt ?? '';
  equipmentForm.operatorName = '';
  equipmentForm.remarks = row.remarks ?? '';
}

async function loadEquipmentRecords() {
  loading.equipment = true;
  pageError.value = '';
  try {
    equipmentRecords.value = await listEquipmentRecords({
      equipmentStatus: equipmentFilters.equipmentStatus || undefined,
      keyword: equipmentFilters.keyword.trim() || undefined,
    });
  } catch (error) {
    pageError.value = getOperationSupportPageErrorMessage(error);
  } finally {
    loading.equipment = false;
  }
}

async function loadWarnings() {
  loading.warnings = true;
  try {
    warnings.value = await listEquipmentWarnings();
  } catch (error) {
    ElMessage.error(getOperationSupportPageErrorMessage(error));
  } finally {
    loading.warnings = false;
  }
}

async function selectEquipment(row: EquipmentRecordView) {
  selectedEquipment.value = row;
  loading.logs = true;
  try {
    logs.value = await listEquipmentMaintenanceLogs(row.id);
  } catch (error) {
    ElMessage.error(getOperationSupportPageErrorMessage(error));
  } finally {
    loading.logs = false;
  }
}

async function submitEquipment() {
  if (!equipmentForm.equipmentName || !equipmentForm.equipmentStatus || !equipmentForm.operatorName) {
    ElMessage.warning('请填写设备名称、设备状态和操作人');
    return;
  }
  if (!editingEquipment.value?.id && !equipmentForm.equipmentCode) {
    ElMessage.warning('新增设备需要填写设备编码');
    return;
  }

  submitting.value = true;
  try {
    if (editingEquipment.value?.id) {
      await updateEquipmentRecord(editingEquipment.value.id, {
        enabledAt: equipmentForm.enabledAt || undefined,
        equipmentCategory: equipmentForm.equipmentCategory || undefined,
        equipmentName: equipmentForm.equipmentName,
        equipmentStatus: equipmentForm.equipmentStatus,
        locationDescription: equipmentForm.locationDescription || undefined,
        modelNo: equipmentForm.modelNo || undefined,
        nextMaintenanceAt: equipmentForm.nextMaintenanceAt || undefined,
        operatorName: equipmentForm.operatorName,
        remarks: equipmentForm.remarks || undefined,
      });
      ElMessage.success('设备档案已更新');
    } else {
      await createEquipmentRecord({
        enabledAt: equipmentForm.enabledAt || undefined,
        equipmentCategory: equipmentForm.equipmentCategory || undefined,
        equipmentCode: equipmentForm.equipmentCode,
        equipmentName: equipmentForm.equipmentName,
        equipmentStatus: equipmentForm.equipmentStatus,
        locationDescription: equipmentForm.locationDescription || undefined,
        modelNo: equipmentForm.modelNo || undefined,
        nextMaintenanceAt: equipmentForm.nextMaintenanceAt || undefined,
        operatorName: equipmentForm.operatorName,
        remarks: equipmentForm.remarks || undefined,
      });
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
  if (!selectedEquipment.value) {
    ElMessage.warning('请先选择设备');
    return;
  }
  if (!logForm.maintenanceType || !logForm.maintenanceStatus || !logForm.performedAt || !logForm.operatorName) {
    ElMessage.warning('请填写维护类型、状态、执行时间和操作人');
    return;
  }

  submitting.value = true;
  try {
    await createEquipmentMaintenanceLog(selectedEquipment.value.id, {
      description: logForm.description || undefined,
      maintenanceStatus: logForm.maintenanceStatus,
      maintenanceType: logForm.maintenanceType,
      nextMaintenanceAt: logForm.nextMaintenanceAt || undefined,
      operatorName: logForm.operatorName,
      performedAt: logForm.performedAt,
      remarks: logForm.remarks || undefined,
    });
    ElMessage.success('维护记录已新增');
    logForm.description = '';
    logForm.nextMaintenanceAt = '';
    logForm.remarks = '';
    await Promise.all([selectEquipment(selectedEquipment.value), loadEquipmentRecords(), loadWarnings()]);
  } catch (error) {
    ElMessage.error(getOperationSupportPageErrorMessage(error));
  } finally {
    submitting.value = false;
  }
}

void Promise.all([loadEquipmentRecords(), loadWarnings()]);
</script>

<template>
  <Page title="设备台账" description="维护设备档案、保养维修记录，并跟踪到期和逾期预警。">
    <div class="flex flex-col gap-4">
      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        show-icon
        type="error"
      />

      <OperationSectionCard title="设备档案" description="按关键字和设备状态查询设备台账。">
        <template #extra>
          <ElButton type="primary" @click="openCreateEquipmentDialog">新增设备</ElButton>
        </template>
        <ElForm inline label-width="88px">
          <ElFormItem label="关键字">
            <ElInput
              v-model="equipmentFilters.keyword"
              clearable
              placeholder="编码/名称"
              style="width: 220px"
              @keyup.enter="loadEquipmentRecords"
            />
          </ElFormItem>
          <ElFormItem label="状态">
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
              :loading="loading.equipment"
              type="primary"
              @click="loadEquipmentRecords"
            >
              查询
            </ElButton>
          </ElFormItem>
        </ElForm>
        <ElTable
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
            <template #default="{ row }">{{ formatNullable(row.modelNo) }}</template>
          </ElTableColumn>
          <ElTableColumn label="状态" min-width="110">
            <template #default="{ row }">
              <ElTag :type="getEquipmentStatusTagType(row.equipmentStatus)">
                {{ formatEquipmentStatus(row.equipmentStatus) }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn label="下次保养" min-width="180">
            <template #default="{ row }">
              {{ formatNullable(row.nextMaintenanceAt) }}
            </template>
          </ElTableColumn>
          <ElTableColumn fixed="right" label="操作" width="100">
            <template #default="{ row }">
              <ElButton link type="primary" @click.stop="openEditEquipmentDialog(row)">
                编辑
              </ElButton>
            </template>
          </ElTableColumn>
        </ElTable>
      </OperationSectionCard>

      <OperationSectionCard title="维修保养记录" description="选择设备后查看和新增维修保养记录。">
        <ElAlert
          v-if="!selectedEquipment"
          :closable="false"
          title="请在设备档案表中选择一台设备。"
          type="info"
        />
        <template v-else>
          <ElForm inline label-width="88px">
            <ElFormItem label="设备">
              <ElInput
                :model-value="`${selectedEquipment.equipmentCode} ${selectedEquipment.equipmentName}`"
                disabled
                style="width: 260px"
              />
            </ElFormItem>
            <ElFormItem label="维护类型">
              <ElSelect v-model="logForm.maintenanceType" style="width: 140px">
                <ElOption
                  v-for="option in MAINTENANCE_TYPE_OPTIONS"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </ElSelect>
            </ElFormItem>
            <ElFormItem label="维护状态">
              <ElSelect v-model="logForm.maintenanceStatus" style="width: 140px">
                <ElOption
                  v-for="option in MAINTENANCE_STATUS_OPTIONS"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </ElSelect>
            </ElFormItem>
            <ElFormItem label="执行时间">
              <ElInput
                v-model="logForm.performedAt"
                placeholder="YYYY-MM-DDTHH:mm:ss"
                style="width: 210px"
              />
            </ElFormItem>
            <ElFormItem label="下次保养">
              <ElInput
                v-model="logForm.nextMaintenanceAt"
                placeholder="YYYY-MM-DDTHH:mm:ss"
                style="width: 210px"
              />
            </ElFormItem>
            <ElFormItem label="操作人">
              <ElInput v-model="logForm.operatorName" style="width: 160px" />
            </ElFormItem>
            <ElFormItem>
              <ElButton :loading="submitting" type="success" @click="submitMaintenanceLog">
                新增记录
              </ElButton>
            </ElFormItem>
          </ElForm>
          <ElForm label-width="88px">
            <ElFormItem label="说明">
              <ElInput v-model="logForm.description" type="textarea" />
            </ElFormItem>
          </ElForm>
          <ElTable v-loading="loading.logs" :data="logs" border>
            <ElTableColumn label="类型" min-width="120">
              <template #default="{ row }">
                {{ formatMaintenanceType(row.maintenanceType) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="状态" min-width="120">
              <template #default="{ row }">
                {{ formatMaintenanceStatus(row.maintenanceStatus) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="执行时间" min-width="180" prop="performedAt" />
            <ElTableColumn label="执行人" min-width="120">
              <template #default="{ row }">
                {{ formatNullable(row.performedByName) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="下次保养" min-width="180">
              <template #default="{ row }">
                {{ formatNullable(row.nextMaintenanceAt) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="说明" min-width="220">
              <template #default="{ row }">
                {{ formatNullable(row.description) }}
              </template>
            </ElTableColumn>
          </ElTable>
        </template>
      </OperationSectionCard>

      <OperationSectionCard title="设备预警" description="展示即将到期或已逾期维护的设备。">
        <template #extra>
          <ElButton :loading="loading.warnings" @click="loadWarnings">刷新</ElButton>
        </template>
        <ElTable v-loading="loading.warnings" :data="warnings" border>
          <ElTableColumn label="预警" min-width="110">
            <template #default="{ row }">
              <ElTag :type="getWarningTagType(row.warningType)">
                {{ formatWarningType(row.warningType) }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn label="设备编码" min-width="140" prop="equipmentCode" />
          <ElTableColumn label="设备名称" min-width="180" prop="equipmentName" />
          <ElTableColumn label="状态" min-width="120">
            <template #default="{ row }">
              {{ formatEquipmentStatus(row.equipmentStatus) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="下次保养" min-width="180">
            <template #default="{ row }">
              {{ formatNullable(row.nextMaintenanceAt) }}
            </template>
          </ElTableColumn>
        </ElTable>
      </OperationSectionCard>
    </div>

    <ElDialog v-model="equipmentDialogVisible" title="设备档案维护" width="680px">
      <ElForm label-width="120px">
        <ElFormItem label="设备编码" required>
          <ElInput
            v-model="equipmentForm.equipmentCode"
            :disabled="!!editingEquipment?.id"
          />
        </ElFormItem>
        <ElFormItem label="设备名称" required>
          <ElInput v-model="equipmentForm.equipmentName" />
        </ElFormItem>
        <ElFormItem label="设备类别">
          <ElSelect v-model="equipmentForm.equipmentCategory" clearable>
            <ElOption
              v-for="option in EQUIPMENT_CATEGORY_OPTIONS"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="型号">
          <ElInput v-model="equipmentForm.modelNo" />
        </ElFormItem>
        <ElFormItem label="状态" required>
          <ElSelect v-model="equipmentForm.equipmentStatus">
            <ElOption
              v-for="option in EQUIPMENT_STATUS_OPTIONS"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="位置">
          <ElInput v-model="equipmentForm.locationDescription" />
        </ElFormItem>
        <ElFormItem label="启用时间">
          <ElInput v-model="equipmentForm.enabledAt" placeholder="YYYY-MM-DDTHH:mm:ss" />
        </ElFormItem>
        <ElFormItem label="下次保养">
          <ElInput
            v-model="equipmentForm.nextMaintenanceAt"
            placeholder="YYYY-MM-DDTHH:mm:ss"
          />
        </ElFormItem>
        <ElFormItem label="操作人" required>
          <ElInput v-model="equipmentForm.operatorName" />
        </ElFormItem>
        <ElFormItem label="备注">
          <ElInput v-model="equipmentForm.remarks" type="textarea" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="equipmentDialogVisible = false">取消</ElButton>
        <ElButton :loading="submitting" type="primary" @click="submitEquipment">
          保存
        </ElButton>
      </template>
    </ElDialog>
  </Page>
</template>
