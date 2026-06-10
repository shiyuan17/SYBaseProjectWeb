<script setup lang="ts">
import type { ApplicationListItem } from '../types/specimen-workflow';

import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  ElAlert,
  ElButton,
  ElDatePicker,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElPagination,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import DepartmentSelect from '#/modules/system-management/components/DepartmentSelect.vue';

import {
  deleteApplication,
  listApplications,
} from '../api/specimen-workflow-service';
import ApplicationManageDialog from '../components/ApplicationManageDialog.vue';
import WorkflowSectionCard from '../components/WorkflowSectionCard.vue';
import {
  APPLICATION_FORM_STATUS_OPTIONS,
  APPLICATION_TYPE_OPTIONS,
  DEFAULT_PAGE_SIZE,
  M2_PERMISSION_CODES,
} from '../constants';
import { getWorkflowPageErrorMessage } from '../utils/error';
import {
  formatApplicationFormStatus,
  formatApplicationType,
  formatCurrentNode,
  formatDate,
  formatDateTime,
  formatNullable,
} from '../utils/format';

withDefaults(
  defineProps<{
    embedded?: boolean;
  }>(),
  {
    embedded: false,
  },
);
const router = useRouter();
const accessStore = useAccessStore();

const loading = ref(false);
const pageError = ref('');
const manageDialogVisible = ref(false);
const manageDialogMode = ref<'create' | 'edit'>('create');
const currentApplicationId = ref<null | string>(null);
const deletingApplicationId = ref<null | string>(null);
const items = ref<ApplicationListItem[]>([]);
const total = ref(0);

const filters = reactive({
  applicationFormStatus: '',
  applicationNo: '',
  applicationType: '',
  dateRange: [] as string[],
  page: 1,
  patientName: '',
  size: DEFAULT_PAGE_SIZE,
  submittingDepartmentId: '',
});

const accessCodeSet = computed(() => new Set(accessStore.accessCodes));
const canQueryApplications = computed(() =>
  accessCodeSet.value.has(M2_PERMISSION_CODES.APPLICATION_DETAIL_QUERY),
);
const canOpenSpecimenManagement = computed(() =>
  accessCodeSet.value.has(M2_PERMISSION_CODES.SPECIMEN_REGISTER),
);
const canCreateApplications = computed(() =>
  accessCodeSet.value.has(M2_PERMISSION_CODES.APPLICATION_CREATE),
);
const canImportApplications = computed(() =>
  accessCodeSet.value.has(M2_PERMISSION_CODES.CLINICAL_IMPORT),
);
const canUpdateApplications = computed(() =>
  accessCodeSet.value.has(M2_PERMISSION_CODES.APPLICATION_UPDATE),
);
const canDeleteApplications = computed(() =>
  accessCodeSet.value.has(M2_PERMISSION_CODES.APPLICATION_DELETE),
);
const canManageApplications = computed(
  () => canCreateApplications.value || canImportApplications.value,
);

async function loadApplications() {
  if (!canQueryApplications.value) {
    items.value = [];
    total.value = 0;
    return;
  }

  loading.value = true;
  pageError.value = '';
  try {
    const result = await listApplications({
      applicationFormStatus: filters.applicationFormStatus || undefined,
      applicationNo: filters.applicationNo.trim() || undefined,
      applicationType: filters.applicationType || undefined,
      dateFrom: filters.dateRange[0] || undefined,
      dateTo: filters.dateRange[1] || undefined,
      page: filters.page,
      patientName: filters.patientName.trim() || undefined,
      size: filters.size,
      submittingDepartmentId:
        filters.submittingDepartmentId.trim() || undefined,
    });
    items.value = result.items;
    total.value = result.total;
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  filters.page = 1;
  void loadApplications();
}

function handleReset() {
  filters.applicationFormStatus = '';
  filters.applicationNo = '';
  filters.applicationType = '';
  filters.dateRange = [];
  filters.page = 1;
  filters.patientName = '';
  filters.size = DEFAULT_PAGE_SIZE;
  filters.submittingDepartmentId = '';
  void loadApplications();
}

function handleDepartmentChange(
  department: null | { id: string; name: string },
) {
  filters.submittingDepartmentId = department?.id ?? '';
}

function goToSpecimenManagement(row: ApplicationListItem) {
  if (!canOpenSpecimenManagement.value || row.voided) {
    return;
  }
  void router.push({
    path: '/workflow/submission-registration',
    query: {
      action: 'register',
      applicationId: row.id,
    },
  });
}

function openCreateDialog() {
  manageDialogMode.value = 'create';
  currentApplicationId.value = null;
  manageDialogVisible.value = true;
}

function openEditDialog(row: ApplicationListItem) {
  if (!canUpdateApplications.value || !row.editable) {
    return;
  }
  manageDialogMode.value = 'edit';
  currentApplicationId.value = row.id;
  manageDialogVisible.value = true;
}

async function handleDeleteApplication(row: ApplicationListItem) {
  if (!canDeleteApplications.value || !row.deletable) {
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确认删除申请单 ${row.applicationNo}？删除后申请单将作废，不会物理删除，可通过“已作废”状态筛选回查。`,
      '删除申请单',
      {
        cancelButtonText: '取消',
        confirmButtonText: '确认删除',
        type: 'warning',
      },
    );
  } catch {
    return;
  }

  deletingApplicationId.value = row.id;
  pageError.value = '';
  try {
    await deleteApplication(row.id);
    ElMessage.success('申请单已作废');
    await loadApplications();
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    deletingApplicationId.value = null;
  }
}

function goToTracking(row: ApplicationListItem) {
  void router.push({
    path: '/workflow/tracking-exception',
    query: {
      applicationId: row.id,
    },
  });
}

async function handleApplicationSubmitted(payload: {
  applicationId: string;
  mode: 'save' | 'save-and-manage';
}) {
  if (canQueryApplications.value) {
    filters.page = 1;
    await loadApplications();
  }

  if (payload.mode === 'save-and-manage') {
    void router.push({
      path: '/workflow/submission-registration',
      query: {
        action: 'register',
        applicationId: payload.applicationId,
      },
    });
  }
}

if (canQueryApplications.value) {
  void loadApplications();
}
</script>

<template>
  <Page :show-header="false" :title="embedded ? undefined : '申请与登记'">
    <div class="flex flex-col gap-4">
      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        type="error"
        show-icon
      />

      <ElAlert
        v-if="!canQueryApplications"
        :closable="false"
        title="当前账号没有申请单查询权限，可通过创建按钮新增申请单。"
        type="info"
        show-icon
      />

      <template v-if="canQueryApplications">
        <WorkflowSectionCard
          title="筛选条件"
          description="支持按申请单号、患者、科室、申请类型、表单状态和申请日期筛选。"
        >
          <ElForm label-width="92px">
            <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <ElFormItem label="申请单号">
                <ElInput
                  v-model="filters.applicationNo"
                  clearable
                  placeholder="模糊搜索申请单号"
                  @keyup.enter="handleSearch"
                />
              </ElFormItem>
              <ElFormItem label="患者姓名">
                <ElInput
                  v-model="filters.patientName"
                  clearable
                  placeholder="模糊搜索患者姓名"
                  @keyup.enter="handleSearch"
                />
              </ElFormItem>
              <ElFormItem label="送检科室">
                <DepartmentSelect
                  v-model="filters.submittingDepartmentId"
                  placeholder="请选择送检科室"
                  @change="handleDepartmentChange"
                />
              </ElFormItem>
              <ElFormItem label="申请类型">
                <ElSelect
                  v-model="filters.applicationType"
                  clearable
                  placeholder="请选择申请类型"
                >
                  <ElOption
                    v-for="option in APPLICATION_TYPE_OPTIONS"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </ElSelect>
              </ElFormItem>
              <ElFormItem label="表单状态">
                <ElSelect
                  v-model="filters.applicationFormStatus"
                  clearable
                  placeholder="请选择表单状态"
                >
                  <ElOption
                    v-for="option in APPLICATION_FORM_STATUS_OPTIONS"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </ElSelect>
              </ElFormItem>
              <ElFormItem label="申请日期" class="xl:col-span-2">
                <ElDatePicker
                  v-model="filters.dateRange"
                  end-placeholder="结束日期"
                  range-separator="至"
                  start-placeholder="开始日期"
                  type="daterange"
                  value-format="YYYY-MM-DD"
                />
              </ElFormItem>
            </div>

            <div class="flex justify-end gap-2">
              <ElButton @click="handleReset">重置</ElButton>
              <ElButton type="primary" @click="handleSearch">查询</ElButton>
            </div>
          </ElForm>
        </WorkflowSectionCard>

        <WorkflowSectionCard
          title="申请单列表"
          description="列表展示申请单编号、申请单号、患者、流程节点和异常标记。"
        >
          <template v-if="canManageApplications" #extra>
            <ElButton type="primary" @click="openCreateDialog"> 创建 </ElButton>
          </template>

          <ElTable v-loading="loading" :data="items" border>
            <ElTableColumn label="申请单编号" min-width="220" prop="id" />
            <ElTableColumn
              label="申请单号"
              min-width="160"
              prop="applicationNo"
            />
            <ElTableColumn label="患者信息" min-width="180">
              <template #default="{ row }">
                {{ formatNullable(row.patientName) }} /
                {{ formatNullable(row.patientGender) }} /
                {{ formatNullable(row.patientAge) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="送检科室" min-width="160">
              <template #default="{ row }">
                {{ formatNullable(row.submittingDepartmentName) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="申请类型" min-width="120">
              <template #default="{ row }">
                {{ formatApplicationType(row.applicationType) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="表单状态" min-width="120">
              <template #default="{ row }">
                {{ formatApplicationFormStatus(row.applicationFormStatus) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="当前节点" min-width="120">
              <template #default="{ row }">
                {{ formatCurrentNode(row.currentNode) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="申请人" min-width="120">
              <template #default="{ row }">
                {{ formatNullable(row.submittingDoctorName) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="申请日期" min-width="120">
              <template #default="{ row }">
                {{ formatDate(row.applicationDate) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="更新时间" min-width="180">
              <template #default="{ row }">
                {{ formatDateTime(row.updatedAt) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="异常标记" min-width="110">
              <template #default="{ row }">
                <ElTag :type="row.abnormalFlag ? 'danger' : 'success'">
                  {{ row.abnormalFlag ? '有异常' : '正常' }}
                </ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn fixed="right" label="操作" min-width="260">
              <template #default="{ row }">
                <div class="flex gap-2">
                  <ElButton
                    :disabled="!canOpenSpecimenManagement || row.voided"
                    link
                    :title="
                      row.voided
                        ? row.operationDisabledReason || '申请单已作废'
                        : undefined
                    "
                    type="primary"
                    @click="goToSpecimenManagement(row)"
                  >
                    登记标本
                  </ElButton>
                  <ElButton
                    v-if="canUpdateApplications"
                    :disabled="!row.editable"
                    link
                    :title="
                      row.editable
                        ? undefined
                        : row.operationDisabledReason || '当前申请单不可编辑'
                    "
                    type="primary"
                    @click="openEditDialog(row)"
                  >
                    编辑
                  </ElButton>
                  <ElButton
                    v-if="canDeleteApplications"
                    :disabled="
                      !row.deletable || deletingApplicationId === row.id
                    "
                    link
                    :loading="deletingApplicationId === row.id"
                    :title="
                      row.deletable
                        ? undefined
                        : row.operationDisabledReason || '当前申请单不可删除'
                    "
                    type="danger"
                    @click="handleDeleteApplication(row)"
                  >
                    删除
                  </ElButton>
                  <ElButton link type="primary" @click="goToTracking(row)">
                    追踪与异常
                  </ElButton>
                </div>
              </template>
            </ElTableColumn>
          </ElTable>

          <div v-if="!loading && total === 0" class="py-8">
            <ElEmpty description="暂无符合条件的申请单" />
          </div>

          <div class="mt-4 flex justify-end">
            <ElPagination
              v-model:current-page="filters.page"
              v-model:page-size="filters.size"
              :page-sizes="[10, 20, 50, 100]"
              :total="total"
              background
              layout="total, sizes, prev, pager, next"
              @current-change="loadApplications"
              @size-change="loadApplications"
            />
          </div>
        </WorkflowSectionCard>
      </template>

      <ApplicationManageDialog
        v-model="manageDialogVisible"
        :application-id="currentApplicationId"
        :mode="manageDialogMode"
        @submitted="handleApplicationSubmitted"
      />
    </div>
  </Page>
</template>
