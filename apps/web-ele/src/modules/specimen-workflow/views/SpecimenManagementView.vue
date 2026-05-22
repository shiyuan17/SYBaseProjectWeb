<script setup lang="ts">
import type {
  ApplicationDetailView,
  LabelPrintRetryResult,
  SpecimenRegisterItemRequest,
  SpecimenRegisterResult,
} from '../types/specimen-workflow';

import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useAccessStore, useUserStore } from '@vben/stores';

import {
  ElAlert,
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElTable,
  ElTableColumn,
  ElTabPane,
  ElTabs,
  ElTag,
} from 'element-plus';

import BodyPartSelect from '#/modules/system-management/components/BodyPartSelect.vue';
import SystemUserSelect from '#/modules/system-management/components/SystemUserSelect.vue';

import {
  getApplicationDetail,
  registerSpecimens,
  retryLabelPrint,
} from '../api/specimen-workflow-service';
import WorkflowSectionCard from '../components/WorkflowSectionCard.vue';
import { M2_PERMISSION_CODES } from '../constants';
import { getWorkflowPageErrorMessage } from '../utils/error';
import {
  formatCurrentNode,
  formatDate,
  formatNullable,
} from '../utils/format';

type RegisterRow = SpecimenRegisterItemRequest & {
  key: number;
};

type WorkflowTabName = 'context' | 'register' | 'result';

const CONTEXT_TAB: WorkflowTabName = 'context';
const REGISTER_TAB: WorkflowTabName = 'register';
const RESULT_TAB: WorkflowTabName = 'result';

const route = useRoute();
const router = useRouter();
const accessStore = useAccessStore();
const userStore = useUserStore();

const accessCodeSet = computed(() => new Set(accessStore.accessCodes));
const canQueryApplicationDetail = computed(() =>
  accessCodeSet.value.has(M2_PERMISSION_CODES.APPLICATION_DETAIL_QUERY),
);

const currentUserName = computed(() => userStore.userInfo?.realName ?? '');
const currentUserId = computed(() => userStore.userInfo?.userId ?? '');

const pageError = ref('');
const activeTab = ref<WorkflowTabName>(CONTEXT_TAB);
const applicationIdInput = ref('');
const currentApplicationId = ref('');
const applicationDetail = ref<null | ApplicationDetailView>(null);
const registerResult = ref<null | SpecimenRegisterResult>(null);
const retryResult = ref<LabelPrintRetryResult | null>(null);

const loadingDetail = ref(false);
const submittingRegister = ref(false);
const retryingLabelPrint = ref(false);

const registerForm = reactive({
  collectionScene: '',
  operatorName: currentUserName.value,
  operatorUserId: currentUserId.value,
  printerCode: '',
  remarks: '',
  terminalCode: '',
});

const retryForm = reactive({
  operatorName: currentUserName.value,
  operatorUserId: currentUserId.value,
  printerCode: '',
  remarks: '',
  terminalCode: '',
});

const registerItems = ref<RegisterRow[]>([createRegisterRow()]);

function createRegisterRow(): RegisterRow {
  return {
    barcode: '',
    clinicalSymptom: '',
    collectionMode: '',
    key: Date.now() + Math.floor(Math.random() * 1000),
    specimenCount: 1,
    specimenNameStandardized: '',
    specimenSite: '',
    specimenType: '',
  };
}

function resetRegisterForm() {
  Object.assign(registerForm, {
    collectionScene: '',
    operatorName: currentUserName.value,
    operatorUserId: currentUserId.value,
    printerCode: '',
    remarks: '',
    terminalCode: '',
  });
  registerItems.value = [createRegisterRow()];
}

function resetRetryForm() {
  Object.assign(retryForm, {
    operatorName: currentUserName.value,
    operatorUserId: currentUserId.value,
    printerCode: '',
    remarks: '',
    terminalCode: '',
  });
}

function addRegisterRow() {
  registerItems.value.push(createRegisterRow());
}

function removeRegisterRow(key: number) {
  if (registerItems.value.length === 1) {
    ElMessage.warning('至少保留一行标本明细');
    return;
  }
  registerItems.value = registerItems.value.filter((item) => item.key !== key);
}

function normalizeRouteQueryValue(value: unknown) {
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : '';
  }
  return '';
}

async function syncRouteApplicationId(applicationId: string) {
  const currentQueryValue = normalizeRouteQueryValue(route.query.applicationId);
  if (currentQueryValue === applicationId) {
    return;
  }
  await router.replace({
    query: {
      ...route.query,
      applicationId,
    },
  });
}

function applyApplicationContext(
  applicationId?: null | string,
  options: {
    fromRoute?: boolean;
    preserveResults?: boolean;
    silent?: boolean;
    targetTab?: WorkflowTabName;
  } = {},
) {
  const normalizedId = (applicationId ?? applicationIdInput.value).trim();
  if (!normalizedId) {
    if (!options.silent) {
      ElMessage.warning('请输入申请单编号');
    }
    return false;
  }

  const changed = normalizedId !== currentApplicationId.value;
  currentApplicationId.value = normalizedId;
  applicationIdInput.value = normalizedId;

  if (changed && !options.preserveResults) {
    registerResult.value = null;
    retryResult.value = null;
  }

  activeTab.value = options.targetTab ?? REGISTER_TAB;

  if (!options.fromRoute) {
    void syncRouteApplicationId(normalizedId);
  }

  return true;
}

async function loadApplication(options: { silent?: boolean } = {}) {
  if (!applyApplicationContext(undefined, { preserveResults: true, silent: options.silent })) {
    return;
  }
  if (!canQueryApplicationDetail.value) {
    if (!options.silent) {
      ElMessage.warning('当前账号没有申请单详情查询权限');
    }
    return;
  }

  loadingDetail.value = true;
  pageError.value = '';
  try {
    applicationDetail.value = await getApplicationDetail(currentApplicationId.value);
    if (!options.silent) {
      ElMessage.success('申请单详情已加载');
    }
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    loadingDetail.value = false;
  }
}

async function handleRouteApplicationIdChange() {
  const routeApplicationId = normalizeRouteQueryValue(route.query.applicationId);
  if (!routeApplicationId.trim()) {
    return;
  }
  const changed = applyApplicationContext(routeApplicationId, {
    fromRoute: true,
    preserveResults: true,
    silent: true,
    targetTab: REGISTER_TAB,
  });
  if (changed && canQueryApplicationDetail.value) {
    await loadApplication({ silent: true });
  }
}

watch(
  () => route.query.applicationId,
  () => {
    void handleRouteApplicationIdChange();
  },
  { immediate: true },
);

async function submitRegister() {
  if (!applyApplicationContext(currentApplicationId.value, { silent: true, targetTab: REGISTER_TAB })) {
    ElMessage.warning('请先在“申请单选择”中确认当前申请单编号');
    return;
  }
  if (!registerForm.operatorName.trim()) {
    ElMessage.warning('请选择操作人');
    return;
  }

  const items = registerItems.value.map((item) => ({
    barcode: item.barcode?.trim() || null,
    clinicalSymptom: item.clinicalSymptom?.trim() || null,
    collectionMode: item.collectionMode?.trim() || null,
    specimenCount: item.specimenCount,
    specimenNameStandardized: item.specimenNameStandardized.trim(),
    specimenSite: item.specimenSite?.trim() || null,
    specimenType: item.specimenType?.trim() || null,
  }));

  if (items.some((item) => !item.specimenNameStandardized)) {
    ElMessage.warning('请完整填写每一行标本名称');
    return;
  }
  if (items.some((item) => !item.specimenCount || item.specimenCount < 1)) {
    ElMessage.warning('标本数量必须大于 0');
    return;
  }

  submittingRegister.value = true;
  pageError.value = '';
  try {
    registerResult.value = await registerSpecimens({
      applicationId: currentApplicationId.value,
      collectionScene: registerForm.collectionScene.trim() || null,
      items,
      operatorName: registerForm.operatorName.trim(),
      operatorUserId: registerForm.operatorUserId.trim() || null,
      printerCode: registerForm.printerCode.trim() || null,
      remarks: registerForm.remarks.trim() || null,
      terminalCode: registerForm.terminalCode.trim() || null,
    });
    retryResult.value = null;
    resetRegisterForm();
    resetRetryForm();
    activeTab.value = RESULT_TAB;
    ElMessage.success('标本登记成功');
    if (canQueryApplicationDetail.value) {
      await loadApplication({ silent: true });
    }
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    submittingRegister.value = false;
  }
}

async function submitRetryLabelPrint() {
  const batchNo = registerResult.value?.labelPrintBatchNo?.trim();
  if (!batchNo) {
    ElMessage.warning('当前没有可补打的标签批次');
    return;
  }
  if (!retryForm.operatorName.trim()) {
    ElMessage.warning('请选择补打操作人');
    return;
  }
  if (!retryForm.printerCode.trim()) {
    ElMessage.warning('请填写打印机编码');
    return;
  }

  retryingLabelPrint.value = true;
  pageError.value = '';
  try {
    retryResult.value = await retryLabelPrint(batchNo, {
      operatorName: retryForm.operatorName.trim(),
      operatorUserId: retryForm.operatorUserId.trim() || null,
      printerCode: retryForm.printerCode.trim(),
      remarks: retryForm.remarks.trim() || null,
      terminalCode: retryForm.terminalCode.trim() || null,
    });
    ElMessage.success('标签补打请求已提交');
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    retryingLabelPrint.value = false;
  }
}

const hasApplicationContext = computed(() => Boolean(currentApplicationId.value));
const detailStatusType = computed(() =>
  applicationDetail.value?.abnormalFlag ? 'danger' : 'success',
);

function handleRegisterOperatorChange(user: null | { id: string; name: string }) {
  registerForm.operatorUserId = user?.id ?? '';
  registerForm.operatorName = user?.name ?? '';
}

function handleRetryOperatorChange(user: null | { id: string; name: string }) {
  retryForm.operatorUserId = user?.id ?? '';
  retryForm.operatorName = user?.name ?? '';
}
</script>

<template>
  <Page title="标本管理">
    <div class="flex flex-col gap-4">
      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        type="error"
        show-icon
      />

      <WorkflowSectionCard
        title="当前上下文"
        description="顶部始终保留当前申请单摘要，减少来回滚动和重复核对。"
      >
        <ElDescriptions :column="3" border>
          <ElDescriptionsItem label="申请单编号">
            {{ hasApplicationContext ? currentApplicationId : '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="申请单号">
            {{ formatNullable(applicationDetail?.applicationNo) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="当前节点">
            {{ formatCurrentNode(applicationDetail?.currentNode) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="患者姓名">
            {{ formatNullable(applicationDetail?.patientName) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="送检科室">
            {{ formatNullable(applicationDetail?.submittingDepartmentName) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="异常标记">
            <ElTag :type="detailStatusType">
              {{ applicationDetail?.abnormalFlag ? '有异常' : '正常' }}
            </ElTag>
          </ElDescriptionsItem>
        </ElDescriptions>
      </WorkflowSectionCard>

      <WorkflowSectionCard
        title="标本管理工作流"
        description="按步骤进入申请单选择、标本登记和结果补打。"
      >
        <ElTabs v-model="activeTab" stretch>
          <ElTabPane :name="CONTEXT_TAB" label="申请单选择">
            <div class="space-y-4">
              <ElForm inline label-width="96px">
                <ElFormItem label="申请单编号">
                  <ElInput
                    v-model="applicationIdInput"
                    clearable
                    placeholder="请输入申请单编号 / ID"
                    style="width: 320px"
                    @keyup.enter="applyApplicationContext(undefined, { targetTab: REGISTER_TAB })"
                  />
                </ElFormItem>
                <ElFormItem>
                  <ElButton
                    type="primary"
                    @click="applyApplicationContext(undefined, { targetTab: REGISTER_TAB })"
                  >
                    设为当前上下文
                  </ElButton>
                  <ElButton
                    v-if="canQueryApplicationDetail"
                    :loading="loadingDetail"
                    @click="loadApplication()"
                  >
                    拉取申请单详情
                  </ElButton>
                </ElFormItem>
              </ElForm>

              <ElAlert
                v-if="!canQueryApplicationDetail"
                :closable="false"
                title="当前账号没有申请单详情查询权限，只能基于当前申请单编号继续登记。"
                type="info"
                show-icon
              />

              <ElDescriptions v-if="applicationDetail" :column="2" border>
                <ElDescriptionsItem label="申请类型">
                  {{ formatNullable(applicationDetail.applicationType) }}
                </ElDescriptionsItem>
                <ElDescriptionsItem label="申请日期">
                  {{ formatDate(applicationDetail.applicationDate) }}
                </ElDescriptionsItem>
                <ElDescriptionsItem label="送检日期">
                  {{ formatDate(applicationDetail.submissionDate) }}
                </ElDescriptionsItem>
                <ElDescriptionsItem label="送检医生">
                  {{ formatNullable(applicationDetail.submittingDoctorName) }}
                </ElDescriptionsItem>
                <ElDescriptionsItem label="临床诊断" :span="2">
                  {{ formatNullable(applicationDetail.clinicalDiagnosis) }}
                </ElDescriptionsItem>
              </ElDescriptions>

              <ElEmpty v-else description="尚未加载申请单详情" />
            </div>
          </ElTabPane>

          <ElTabPane :name="REGISTER_TAB" label="标本登记">
            <div class="space-y-4">
              <ElAlert
                v-if="!hasApplicationContext"
                :closable="false"
                title="请先在“申请单选择”中确认当前申请单编号。"
                type="warning"
                show-icon
              />

              <template v-else>
                <ElForm label-width="104px">
                  <div class="grid gap-4 md:grid-cols-2">
                    <ElFormItem label="操作人" required>
                      <SystemUserSelect
                        v-model="registerForm.operatorUserId"
                        :selected-label="registerForm.operatorName"
                        placeholder="请选择操作人"
                        @change="handleRegisterOperatorChange"
                      />
                    </ElFormItem>
                    <ElFormItem label="打印机编码">
                      <ElInput
                        v-model="registerForm.printerCode"
                        placeholder="用于标签打印"
                      />
                    </ElFormItem>
                    <ElFormItem label="终端编码">
                      <ElInput
                        v-model="registerForm.terminalCode"
                        placeholder="扫码枪 / 工作站终端"
                      />
                    </ElFormItem>
                    <ElFormItem label="采集场景">
                      <ElInput
                        v-model="registerForm.collectionScene"
                        placeholder="例如：门诊、病房、手术室"
                      />
                    </ElFormItem>
                  </div>
                  <ElFormItem label="备注">
                    <ElInput
                      v-model="registerForm.remarks"
                      :rows="2"
                      placeholder="补充登记说明"
                      type="textarea"
                    />
                  </ElFormItem>
                </ElForm>

                <div class="mb-3 flex items-center justify-between gap-2">
                  <div class="text-sm text-muted-foreground">
                    当前登记上下文：{{ currentApplicationId }}
                  </div>
                  <ElButton type="primary" @click="addRegisterRow">新增标本行</ElButton>
                </div>

                <ElTable :data="registerItems" border>
                  <ElTableColumn label="标本名称" min-width="180">
                    <template #default="{ row }">
                      <ElInput
                        v-model="row.specimenNameStandardized"
                        placeholder="标准化标本名称"
                      />
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="标本类型" min-width="140">
                    <template #default="{ row }">
                      <ElInput v-model="row.specimenType" placeholder="类型" />
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="标本部位" min-width="140">
                    <template #default="{ row }">
                      <BodyPartSelect v-model="row.specimenSite" placeholder="部位" />
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="采集方式" min-width="140">
                    <template #default="{ row }">
                      <ElInput v-model="row.collectionMode" placeholder="采集方式" />
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="数量" min-width="120">
                    <template #default="{ row }">
                      <ElInputNumber v-model="row.specimenCount" :min="1" style="width: 100%" />
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="条码" min-width="180">
                    <template #default="{ row }">
                      <ElInput v-model="row.barcode" placeholder="可留空由后端生成" />
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="临床症状" min-width="180">
                    <template #default="{ row }">
                      <ElInput v-model="row.clinicalSymptom" placeholder="临床症状" />
                    </template>
                  </ElTableColumn>
                  <ElTableColumn fixed="right" label="操作" width="100">
                    <template #default="{ row }">
                      <ElButton link type="danger" @click="removeRegisterRow(row.key)">
                        删除
                      </ElButton>
                    </template>
                  </ElTableColumn>
                </ElTable>

                <div class="mt-4 flex justify-end gap-2">
                  <ElButton @click="resetRegisterForm">重置登记表单</ElButton>
                  <ElButton :loading="submittingRegister" type="primary" @click="submitRegister">
                    提交登记
                  </ElButton>
                </div>
              </template>
            </div>
          </ElTabPane>

          <ElTabPane :name="RESULT_TAB" label="登记结果/标签补打">
            <div class="space-y-4">
              <template v-if="registerResult">
                <WorkflowSectionCard
                  title="登记结果"
                  description="展示本次标签打印结果、批次号与已登记标本摘要。"
                >
                  <ElDescriptions :column="2" border>
                    <ElDescriptionsItem label="标签批次号">
                      {{ registerResult.labelPrintBatchNo }}
                    </ElDescriptionsItem>
                    <ElDescriptionsItem label="打印结果">
                      <ElTag :type="registerResult.labelPrintSuccess ? 'success' : 'warning'">
                        {{ registerResult.labelPrintSuccess ? '成功' : '存在失败' }}
                      </ElTag>
                    </ElDescriptionsItem>
                    <ElDescriptionsItem label="结果消息" :span="2">
                      {{ formatNullable(registerResult.labelPrintMessage) }}
                    </ElDescriptionsItem>
                  </ElDescriptions>

                  <ElTable :data="registerResult.specimens" border class="mt-4">
                    <ElTableColumn label="标本号" min-width="140" prop="specimenNo" />
                    <ElTableColumn label="条码" min-width="180" prop="barcode" />
                    <ElTableColumn label="标本名称" min-width="160" prop="specimenName" />
                    <ElTableColumn label="状态" min-width="120" prop="specimenStatus" />
                    <ElTableColumn label="标签状态" min-width="120" prop="labelPrintStatus" />
                    <ElTableColumn label="部位" min-width="120">
                      <template #default="{ row }">
                        {{ formatNullable(row.specimenSite) }}
                      </template>
                    </ElTableColumn>
                  </ElTable>
                </WorkflowSectionCard>

                <WorkflowSectionCard
                  title="标签补打"
                  description="按本次登记批次重新发起标签打印。"
                >
                  <ElForm inline label-width="96px">
                    <ElFormItem label="操作人" required>
                      <SystemUserSelect
                        v-model="retryForm.operatorUserId"
                        :selected-label="retryForm.operatorName"
                        placeholder="请选择补打操作人"
                        @change="handleRetryOperatorChange"
                      />
                    </ElFormItem>
                    <ElFormItem label="打印机编码" required>
                      <ElInput v-model="retryForm.printerCode" placeholder="请输入打印机编码" />
                    </ElFormItem>
                    <ElFormItem label="终端编码">
                      <ElInput v-model="retryForm.terminalCode" placeholder="终端编码" />
                    </ElFormItem>
                  </ElForm>
                  <ElForm label-width="96px">
                    <ElFormItem label="备注">
                      <ElInput v-model="retryForm.remarks" placeholder="补打说明" />
                    </ElFormItem>
                  </ElForm>

                  <div class="flex justify-end">
                    <ElButton
                      :loading="retryingLabelPrint"
                      type="primary"
                      @click="submitRetryLabelPrint"
                    >
                      发起补打
                    </ElButton>
                  </div>

                  <ElDescriptions v-if="retryResult" :column="2" border class="mt-4">
                    <ElDescriptionsItem label="批次号">
                      {{ retryResult.labelPrintBatchNo }}
                    </ElDescriptionsItem>
                    <ElDescriptionsItem label="整体结果">
                      <ElTag :type="retryResult.allSuccessful ? 'success' : 'warning'">
                        {{ retryResult.allSuccessful ? '全部成功' : '部分成功' }}
                      </ElTag>
                    </ElDescriptionsItem>
                    <ElDescriptionsItem label="成功数">
                      {{ retryResult.successCount }}
                    </ElDescriptionsItem>
                    <ElDescriptionsItem label="失败数">
                      {{ retryResult.failedCount }}
                    </ElDescriptionsItem>
                    <ElDescriptionsItem label="重试数">
                      {{ retryResult.retriedCount }}
                    </ElDescriptionsItem>
                    <ElDescriptionsItem label="消息">
                      {{ formatNullable(retryResult.message) }}
                    </ElDescriptionsItem>
                  </ElDescriptions>
                </WorkflowSectionCard>
              </template>

              <ElEmpty v-else description="尚未产生登记结果" />
            </div>
          </ElTabPane>
        </ElTabs>
      </WorkflowSectionCard>
    </div>
  </Page>
</template>
