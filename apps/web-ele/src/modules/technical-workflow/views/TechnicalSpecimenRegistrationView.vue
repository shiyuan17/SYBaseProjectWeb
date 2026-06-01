<script setup lang="ts">
import type {
  PendingTechnicalSpecimenRegistrationItem,
  TechnicalSpecimenRegistrationDetail,
} from '../types/technical-workflow';

import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  ElAlert,
  ElButton,
  ElEmpty,
  ElInput,
  ElMessage,
  ElPagination,
  ElTable,
  ElTableColumn,
} from 'element-plus';

import {
  completeTechnicalSpecimenRegistration,
  getTechnicalSpecimenRegistrationDetail,
  listPendingTechnicalSpecimenRegistrations,
} from '../api/technical-workflow-service';
import { DEFAULT_PAGE_SIZE } from '../constants';
import { getWorkflowPageErrorMessage } from '../utils/error';
import { useTechnicalWorkflowNavigation } from '../utils/navigation';

const router = useRouter();
const navigation = useTechnicalWorkflowNavigation(router);

const loading = ref(false);
const detailLoading = ref(false);
const submitting = ref(false);
const pageError = ref('');
const detailError = ref('');
const pendingItems = ref<PendingTechnicalSpecimenRegistrationItem[]>([]);
const total = ref(0);
const selectedCaseId = ref('');
const detail = ref<null | TechnicalSpecimenRegistrationDetail>(null);
const completionRemarks = ref('');

const filters = reactive({
  keyword: '',
  page: 1,
  size: DEFAULT_PAGE_SIZE,
});

const selectedRow = computed(
  () =>
    pendingItems.value.find((item) => item.caseId === selectedCaseId.value) ??
    null,
);

const currentPageModel = computed({
  get: () => filters.page,
  set: (page: number) => {
    filters.page = page;
    void loadPendingData();
  },
});

const pageSizeModel = computed({
  get: () => filters.size,
  set: (size: number) => {
    filters.size = size;
    filters.page = 1;
    void loadPendingData();
  },
});

async function loadPendingData(preferredCaseId?: string) {
  loading.value = true;
  pageError.value = '';
  try {
    const result = await listPendingTechnicalSpecimenRegistrations({
      keyword: filters.keyword.trim() || undefined,
      page: filters.page,
      size: filters.size,
    });
    pendingItems.value = result.items;
    total.value = result.total;

    const nextSelectedCaseId =
      preferredCaseId &&
      result.items.some((item) => item.caseId === preferredCaseId)
        ? preferredCaseId
        : result.items[0]?.caseId ?? '';
    selectedCaseId.value = nextSelectedCaseId;
    completionRemarks.value = '';

    if (nextSelectedCaseId) {
      await loadDetail(nextSelectedCaseId);
    } else {
      detail.value = null;
      detailError.value = '';
    }
  } catch (error) {
    pendingItems.value = [];
    total.value = 0;
    detail.value = null;
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

async function loadDetail(caseId: string) {
  if (!caseId.trim()) {
    detail.value = null;
    return;
  }
  detailLoading.value = true;
  detailError.value = '';
  try {
    detail.value = await getTechnicalSpecimenRegistrationDetail(caseId);
  } catch (error) {
    detail.value = null;
    detailError.value = getWorkflowPageErrorMessage(error);
  } finally {
    detailLoading.value = false;
  }
}

function handleSearch() {
  filters.page = 1;
  void loadPendingData(selectedCaseId.value);
}

function handleRowClick(row: PendingTechnicalSpecimenRegistrationItem) {
  if (row.caseId === selectedCaseId.value) {
    return;
  }
  selectedCaseId.value = row.caseId;
  completionRemarks.value = '';
  void loadDetail(row.caseId);
}

async function handleCompleteRegistration() {
  const currentCaseId = selectedCaseId.value.trim();
  if (!currentCaseId) {
    ElMessage.warning('请先选择待登记病例');
    return;
  }
  submitting.value = true;
  try {
    const result = await completeTechnicalSpecimenRegistration(currentCaseId, {
      remarks: completionRemarks.value.trim() || undefined,
      terminalCode: 'T-M3-SPEC-REG',
    });
    ElMessage.success('标本登记完成，已进入取材前置队列');
    await loadPendingData();
    await navigation.goToTasks({
      mode: 'queue',
      pathologyNo: result.pathologyNo ?? undefined,
    });
  } catch (error) {
    ElMessage.error(getWorkflowPageErrorMessage(error));
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  void loadPendingData();
});
</script>

<template>
  <Page
    title="标本登记"
    description="承接病理接收后的技术登记关卡，登记完成后才进入任务池与取材流程。"
  >
    <div class="flex flex-col gap-3">
      <ElAlert
        :closable="false"
        title="首版按接收后流程关卡实现，保留参考图的台账布局，只开放查询、详情查看和完成登记。"
        type="info"
        show-icon
      />

      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        type="error"
        show-icon
      />

      <section class="rounded-md border border-slate-300 bg-slate-100 p-2">
        <div class="flex flex-wrap items-center gap-2">
          <ElInput
            v-model="filters.keyword"
            class="!w-[260px]"
            clearable
            placeholder="病人ID/病理号/姓名"
            @keyup.enter="handleSearch"
          />
          <ElButton type="primary" @click="handleSearch">查询</ElButton>
          <ElButton disabled>更多</ElButton>
          <span class="text-xs text-slate-500">
            首版仅开放查询与完成登记，删除、打印、前后天等旧动作暂不开放。
          </span>
        </div>
      </section>

      <div class="grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section class="flex min-h-[720px] flex-col rounded-md border border-slate-400 bg-white">
          <div class="border-b border-slate-300 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
            接收后待登记台账
          </div>
          <div class="flex-1 overflow-hidden">
            <ElTable
              v-loading="loading"
              :data="pendingItems"
              border
              class="h-full"
              highlight-current-row
              row-key="caseId"
              @row-click="handleRowClick"
            >
              <ElTableColumn label="序" type="index" width="56" />
              <ElTableColumn label="病理检查号" min-width="156" prop="pathologyNo" />
              <ElTableColumn label="病人" min-width="110" prop="patientName" />
              <ElTableColumn label="病人ID" min-width="130" prop="patientId" />
              <ElTableColumn label="住院号" min-width="120" prop="inpatientNo" />
              <ElTableColumn label="送检类型" min-width="110" prop="applicationType" />
              <ElTableColumn
                label="申请科室"
                min-width="140"
                prop="submittingDepartmentName"
              />
              <ElTableColumn label="检查项目" min-width="180" prop="checkItem" />
              <ElTableColumn label="登记人" min-width="110" prop="registeredByName" />
              <ElTableColumn label="状态" min-width="110" prop="registrationStatus" />
              <ElTableColumn label="申请单号" min-width="150" prop="applicationNo" />
            </ElTable>
          </div>
          <div class="flex items-center justify-between border-t border-slate-300 bg-slate-100 px-3 py-2 text-xs text-slate-600">
            <span>
              {{
                `${currentPageModel}/${Math.max(
                  Math.ceil(total / Math.max(pageSizeModel, 1)),
                  1,
                )} 共${total}条记录`
              }}
            </span>
            <ElPagination
              v-model:current-page="currentPageModel"
              v-model:page-size="pageSizeModel"
              :background="true"
              :page-sizes="[20, 50, 100]"
              :pager-count="5"
              :small="true"
              :total="total"
              layout="sizes, prev, pager, next"
            />
          </div>
        </section>

        <section class="flex min-h-[720px] flex-col gap-3">
          <div class="rounded-md border border-slate-400 bg-white">
            <div class="border-b border-slate-300 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
              送检材料
            </div>
            <div class="min-h-[195px] p-2">
              <ElAlert
                v-if="detailError"
                :closable="false"
                :title="detailError"
                type="error"
                show-icon
              />
              <ElTable
                v-else-if="detail"
                v-loading="detailLoading"
                :data="detail.materials"
                border
                size="small"
              >
                <ElTableColumn label="序" prop="sequenceNo" width="48" />
                <ElTableColumn label="标本类型" min-width="92" prop="specimenType" />
                <ElTableColumn label="名称" min-width="110" prop="specimenName" />
                <ElTableColumn label="来源部位" min-width="110" prop="sourcePart" />
              </ElTable>
              <ElEmpty v-else description="暂无送检材料" :image-size="48" />
            </div>
          </div>

          <div class="rounded-md border border-slate-400 bg-white">
            <div class="border-b border-slate-300 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
              临床诊断
            </div>
            <div class="min-h-[220px] p-3 text-sm text-slate-700">
              <template v-if="detail">
                <div class="mb-2 space-y-1 text-xs text-slate-500">
                  <div>病理号：{{ detail.pathologyNo || '-' }}</div>
                  <div>患者：{{ detail.patientName || '-' }}</div>
                  <div>申请科室：{{ detail.submittingDepartmentName || '-' }}</div>
                </div>
                <div class="whitespace-pre-wrap rounded border border-slate-200 bg-slate-50 p-3 leading-6">
                  {{ detail.clinicalDiagnosis || '暂无临床诊断' }}
                </div>
              </template>
              <ElEmpty v-else description="请选择左侧病例" :image-size="48" />
            </div>
          </div>

          <div class="flex flex-1 flex-col rounded-md border border-slate-400 bg-white">
            <div class="border-b border-slate-300 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
              检查项目
            </div>
            <div class="flex flex-1 flex-col gap-3 p-2">
              <ElTable
                v-if="detail"
                v-loading="detailLoading"
                :data="detail.checkItems"
                border
                size="small"
              >
                <ElTableColumn label="序" prop="sequenceNo" width="48" />
                <ElTableColumn label="检查项目" min-width="220" prop="name" />
              </ElTable>
              <ElEmpty
                v-else
                class="flex-1"
                description="暂无检查项目"
                :image-size="48"
              />

              <ElInput
                v-model="completionRemarks"
                :rows="3"
                placeholder="登记备注（选填）"
                type="textarea"
              />

              <div class="flex items-center justify-between gap-2 text-xs text-slate-500">
                <span>
                  {{
                    detail
                      ? `状态：${detail.registrationStatus || '待登记'} / 接收时间：${detail.receivedAt || '-'}`
                      : '登记完成后将自动进入任务池与取材流程。'
                  }}
                </span>
                <ElButton
                  :disabled="!selectedRow"
                  :loading="submitting"
                  type="primary"
                  @click="handleCompleteRegistration"
                >
                  完成登记
                </ElButton>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </Page>
</template>
