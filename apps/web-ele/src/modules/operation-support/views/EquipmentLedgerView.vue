<script setup lang="ts">
import type {
  EquipmentRecordView,
  EquipmentWarningView,
} from '../types/operation-support';

import { computed, reactive, ref } from 'vue';

import { Fallback, Page } from '@vben/common-ui';
import { useAccessStore, useUserStore } from '@vben/stores';

import {
  ElAlert,
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
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

import { getEquipmentLedgerCapabilities } from '../access';
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

function getDefaultOperatorName() {
  return currentOperatorName.value;
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
  equipmentForm.operatorName = getDefaultOperatorName();
  equipmentForm.remarks = '';
}

function resetLogForm() {
  logForm.description = '';
  logForm.maintenanceStatus = 'COMPLETED';
  logForm.maintenanceType = 'MAINTENANCE';
  logForm.nextMaintenanceAt = '';
  logForm.operatorName = getDefaultOperatorName();
  logForm.performedAt = '';
  logForm.remarks = '';
}

function openCreateEquipmentDialog() {
  if (!capabilities.value.canCreateEquipment) {
    ElMessage.warning('当前账号没有设备档案维护权限');
    return;
  }

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
  if (!capabilities.value.canUpdateEquipment) {
    ElMessage.warning('当前账号没有设备档案维护权限');
    return;
  }

  editingEquipment.value = row;
  equipmentForm.enabledAt = row.enabledAt ?? '';
  equipmentForm.equipmentCategory = row.equipmentCategory ?? '';
  equipmentForm.equipmentCode = row.equipmentCode;
  equipmentForm.equipmentName = row.equipmentName;
  equipmentForm.equipmentStatus = row.equipmentStatus;
  equipmentForm.locationDescription = row.locationDescription ?? '';
  equipmentForm.modelNo = row.modelNo ?? '';
  equipmentForm.nextMaintenanceAt = row.nextMaintenanceAt ?? '';
  equipmentForm.operatorName = getDefaultOperatorName();
  equipmentForm.remarks = row.remarks ?? '';
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

  if (
    !equipmentForm.equipmentName ||
    !equipmentForm.equipmentStatus ||
    !equipmentForm.operatorName
  ) {
    ElMessage.warning('请填写设备名称、设备状态和操作人');
    return;
  }
  if (!editingEquipment.value.id && !equipmentForm.equipmentCode) {
    ElMessage.warning('新增设备需要填写设备编码');
    return;
  }

  submitting.value = true;
  try {
    if (editingEquipment.value.id) {
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
  if (
    !logForm.maintenanceType ||
    !logForm.maintenanceStatus ||
    !logForm.performedAt ||
    !logForm.operatorName
  ) {
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

      <OperationSectionCard
        v-if="
          capabilities.canQueryEquipment ||
          capabilities.canCreateEquipment ||
          capabilities.canUpdateEquipment
        "
        title="设备台账"
        description="按关键字和设备状态查询设备台账，维护设备基础档案。"
      >
        <template #extra>
          <ElButton
            v-if="capabilities.canCreateEquipment"
            type="primary"
            @click="openCreateEquipmentDialog"
          >
            新增设备
          </ElButton>
        </template>
        <ElAlert
          v-if="!capabilities.canQueryEquipment"
          :closable="false"
          title="当前账号没有设备档案查询权限，仅可使用已开放的维护或预警能力。"
          type="warning"
        />
        <template v-else>
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
            <ElTableColumn
              label="设备编码"
              min-width="140"
              prop="equipmentCode"
            />
            <ElTableColumn
              label="设备名称"
              min-width="180"
              prop="equipmentName"
            />
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
            <ElTableColumn label="下次保养" min-width="180">
              <template #default="{ row }">
                {{ formatNullable(row.nextMaintenanceAt) }}
              </template>
            </ElTableColumn>
            <ElTableColumn
              v-if="capabilities.canUpdateEquipment"
              fixed="right"
              label="操作"
              width="100"
            >
              <template #default="{ row }">
                <ElButton
                  link
                  type="primary"
                  @click.stop="openEditEquipmentDialog(row)"
                >
                  编辑
                </ElButton>
              </template>
            </ElTableColumn>
          </ElTable>
        </template>
      </OperationSectionCard>

      <OperationSectionCard
        id="equipment-detail"
        title="设备详情与保养记录"
        description="用于承接设备选择和预警跳转，查看对应设备的台账详情与保养记录。"
      >
        <ElAlert
          v-if="!selectedEquipment"
          :closable="false"
          title="请在设备台账中选择一台设备，或在预警列表中点击“查看设备”。"
          type="info"
        />
        <template v-else>
          <ElDescriptions :column="2" border class="mb-4">
            <ElDescriptionsItem label="设备编码">
              {{ selectedEquipment.equipmentCode }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="设备名称">
              {{ selectedEquipment.equipmentName }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="设备类别">
              {{ formatEquipmentCategory(selectedEquipment.equipmentCategory) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="设备状态">
              {{ formatEquipmentStatus(selectedEquipment.equipmentStatus) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="型号">
              {{ formatNullable(selectedEquipment.modelNo) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="位置">
              {{ formatNullable(selectedEquipment.locationDescription) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="启用时间">
              {{ formatNullable(selectedEquipment.enabledAt) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="下次保养">
              {{ formatNullable(selectedEquipment.nextMaintenanceAt) }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="备注">
              {{ formatNullable(selectedEquipment.remarks) }}
            </ElDescriptionsItem>
          </ElDescriptions>

          <ElForm
            v-if="capabilities.canCreateMaintenanceLog"
            inline
            label-width="88px"
          >
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
              <ElSelect
                v-model="logForm.maintenanceStatus"
                style="width: 140px"
              >
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
              <ElButton
                :loading="submitting"
                type="success"
                @click="submitMaintenanceLog"
              >
                新增记录
              </ElButton>
            </ElFormItem>
          </ElForm>
          <ElAlert
            v-else
            :closable="false"
            class="mb-4"
            title="当前账号没有设备保养记录维护权限，仅可查看设备详情和预警。"
            type="warning"
          />
          <ElForm
            v-if="capabilities.canCreateMaintenanceLog"
            label-width="88px"
          >
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
            <ElTableColumn
              label="执行时间"
              min-width="180"
              prop="performedAt"
            />
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

      <OperationSectionCard
        v-if="capabilities.canQueryWarnings"
        title="设备预警"
        description="支持 DUE_SOON 与 OVERDUE 预警，并可跳转到对应设备详情。"
      >
        <template #extra>
          <ElButton :loading="loading.warnings" @click="loadWarnings">
            刷新
          </ElButton>
        </template>
        <ElTable v-loading="loading.warnings" :data="warnings" border>
          <ElTableColumn label="预警" min-width="110">
            <template #default="{ row }">
              <ElTag :type="getWarningTagType(row.warningType)">
                {{ formatWarningType(row.warningType) }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn
            label="设备编码"
            min-width="140"
            prop="equipmentCode"
          />
          <ElTableColumn
            label="设备名称"
            min-width="180"
            prop="equipmentName"
          />
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
          <ElTableColumn
            v-if="capabilities.canQueryEquipment"
            fixed="right"
            label="跳转"
            width="110"
          >
            <template #default="{ row }">
              <ElButton
                link
                type="primary"
                @click="navigateToEquipmentDetail(row)"
              >
                查看设备
              </ElButton>
            </template>
          </ElTableColumn>
        </ElTable>
      </OperationSectionCard>
    </div>

    <ElDialog
      v-model="equipmentDialogVisible"
      title="设备档案维护"
      width="680px"
    >
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
          <ElInput
            v-model="equipmentForm.enabledAt"
            placeholder="YYYY-MM-DDTHH:mm:ss"
          />
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
