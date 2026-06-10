<script setup lang="ts">
import type { FrozenSessionDetail } from '#/modules/frozen-workflow/types/frozen-workflow';

import { computed, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import {
  ElAlert,
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
  ElTag,
} from 'element-plus';

import {
  completeFrozenParaffinCompare,
  completeFrozenPhoneBack,
  completeFrozenRemainingTissue,
  confirmFrozenReport,
  getFrozenSessionDetail,
  listFrozenSessions,
  saveFrozenPreliminaryReport,
} from '#/modules/frozen-workflow/api/frozen-workflow-service';

import WorkflowSectionCard from '../components/WorkflowSectionCard.vue';

const route = useRoute();
const userStore = useUserStore();

const loading = ref(false);
const actionLoading = ref(false);
const pageError = ref('');
const sessionOptions = ref<
  Array<{ frozenPathologyNo: string; id: string; patientName: string }>
>([]);
const selectedSessionId = ref('');
const detail = ref<FrozenSessionDetail | null>(null);

const form = reactive({
  compareStatus: 'SIGNED_OFF',
  compareSummary: '',
  operatorName: '',
  operatorUserId: '',
  preliminaryResult: '',
  remainingTissueStatus: 'RETAINED',
  remarks: '',
  terminalCode: '',
});

const canSavePreliminary = computed(
  () => detail.value?.currentTaskType === 'REPORT',
);
const canConfirm = computed(
  () =>
    detail.value?.currentTaskType === 'COMPARE' &&
    !detail.value?.finalConfirmedAt,
);
const canCompare = computed(
  () =>
    detail.value?.currentTaskType === 'COMPARE' &&
    Boolean(detail.value?.finalConfirmedAt),
);
const canClose = computed(
  () => detail.value?.currentTaskType === 'REMAINING_TISSUE',
);

function ensureOperator() {
  if (!form.operatorName.trim()) {
    ElMessage.warning('请先填写操作人');
    return false;
  }
  return true;
}

function buildPayload() {
  return {
    operatorName: form.operatorName.trim(),
    operatorUserId: form.operatorUserId.trim() || null,
    remarks: form.remarks.trim() || null,
    terminalCode: form.terminalCode.trim() || null,
  };
}

async function loadSessionList() {
  const result = await listFrozenSessions({
    page: 1,
    size: 100,
  });
  sessionOptions.value = result.items.map((item) => ({
    id: item.id,
    frozenPathologyNo: item.frozenPathologyNo,
    patientName: item.patientName,
  }));
  if (!selectedSessionId.value) {
    selectedSessionId.value =
      (typeof route.query.sessionId === 'string'
        ? route.query.sessionId
        : '') ||
      result.items[0]?.id ||
      '';
  }
}

async function loadDetail(sessionId: string) {
  if (!sessionId) {
    detail.value = null;
    return;
  }
  loading.value = true;
  pageError.value = '';
  try {
    detail.value = await getFrozenSessionDetail(sessionId);
    form.preliminaryResult = detail.value.preliminaryResult ?? '';
    form.compareSummary = detail.value.compareSummary ?? '';
  } catch (error) {
    detail.value = null;
    pageError.value =
      error instanceof Error ? error.message : '冰冻会话加载失败';
  } finally {
    loading.value = false;
  }
}

async function savePreliminary() {
  if (!detail.value || !canSavePreliminary.value) {
    return;
  }
  if (!ensureOperator()) {
    return;
  }
  if (!form.preliminaryResult.trim()) {
    ElMessage.warning('请先填写术中初步结果');
    return;
  }
  actionLoading.value = true;
  try {
    await saveFrozenPreliminaryReport(detail.value.id, {
      ...buildPayload(),
      preliminaryResult: form.preliminaryResult.trim(),
    });
    ElMessage.success('冰冻初步结果已保存');
    await loadDetail(detail.value.id);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '保存失败');
  } finally {
    actionLoading.value = false;
  }
}

async function phoneBack() {
  if (!detail.value || !canSavePreliminary.value) {
    return;
  }
  if (!ensureOperator()) {
    return;
  }
  if (!form.preliminaryResult.trim()) {
    ElMessage.warning('请先填写术中初步结果');
    return;
  }
  actionLoading.value = true;
  try {
    await completeFrozenPhoneBack(detail.value.id, {
      ...buildPayload(),
      preliminaryResult: form.preliminaryResult.trim(),
    });
    ElMessage.success('术中电话回报已完成');
    await loadDetail(detail.value.id);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '电话回报失败');
  } finally {
    actionLoading.value = false;
  }
}

async function confirmReport() {
  if (!detail.value || !ensureOperator()) {
    return;
  }
  actionLoading.value = true;
  try {
    await confirmFrozenReport(detail.value.id, buildPayload());
    ElMessage.success('冰冻快速报告已确认');
    await loadDetail(detail.value.id);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '确认失败');
  } finally {
    actionLoading.value = false;
  }
}

async function submitCompare() {
  if (!detail.value || !canCompare.value) {
    return;
  }
  if (!ensureOperator()) {
    return;
  }
  if (!form.compareSummary.trim()) {
    ElMessage.warning('请先填写冰石对比说明');
    return;
  }
  actionLoading.value = true;
  try {
    await completeFrozenParaffinCompare(detail.value.id, {
      ...buildPayload(),
      compareStatus: form.compareStatus as 'MISMATCH' | 'SIGNED_OFF',
      compareSummary: form.compareSummary.trim(),
    });
    ElMessage.success('冰石对比已完成');
    await loadDetail(detail.value.id);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '冰石对比失败');
  } finally {
    actionLoading.value = false;
  }
}

async function closeSession() {
  if (!detail.value || !canClose.value) {
    return;
  }
  if (!ensureOperator()) {
    return;
  }
  actionLoading.value = true;
  try {
    await completeFrozenRemainingTissue(detail.value.id, {
      ...buildPayload(),
      remainingTissueStatus: form.remainingTissueStatus as
        | 'DISPOSED'
        | 'RETAINED',
    });
    ElMessage.success('剩余组织处理与交接班已完成');
    await loadDetail(detail.value.id);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '流程关闭失败');
  } finally {
    actionLoading.value = false;
  }
}

watch(selectedSessionId, (value) => {
  void loadDetail(value);
});

watch(
  () => userStore.userInfo,
  (value) => {
    if (!form.operatorName && value?.realName) {
      form.operatorName = value.realName;
    }
    if (!form.operatorUserId && value?.userId) {
      form.operatorUserId = value.userId;
    }
  },
  { immediate: true },
);

void loadSessionList();
</script>

<template>
  <Page
    :show-header="false"
    title="冰冻快速报告"
    description="承接术中初步结果、电话回报、最终确认、冰石对比和剩余组织处理。"
  >
    <div class="flex flex-col gap-4">
      <ElAlert
        v-if="false"
        :closable="false"
        :title="pageError"
        show-icon
        type="error"
      />

      <WorkflowSectionCard
        title="冰冻会话选择"
        description="默认按 query 的 sessionId 进入，也支持在页面内切换会话。"
      >
        <ElForm inline label-width="88px">
          <ElFormItem label="冰冻会话">
            <ElSelect v-model="selectedSessionId" style="width: 320px">
              <ElOption
                v-for="item in sessionOptions"
                :key="item.id"
                :label="`${item.frozenPathologyNo} / ${item.patientName}`"
                :value="item.id"
              />
            </ElSelect>
          </ElFormItem>
        </ElForm>
      </WorkflowSectionCard>

      <WorkflowSectionCard
        title="会话概览"
        description="让医生侧能直接看到当前冰冻会话已走到哪一步。"
      >
        <ElEmpty v-if="!detail && !loading" description="请选择冰冻会话" />
        <template v-else-if="detail">
          <ElDescriptions :column="3" border>
            <ElDescriptionsItem label="冰冻号">
              {{ detail.frozenPathologyNo }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="申请单号">
              {{ detail.applicationNo }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="患者">
              {{ detail.patientName }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="当前节点">
              {{ detail.currentTaskType }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="会话状态">
              {{ detail.sessionStatus }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="电话回报">
              <ElTag
                :type="detail.intraoperativePhoneBack ? 'success' : 'warning'"
              >
                {{ detail.intraoperativePhoneBack ? '已完成' : '未完成' }}
              </ElTag>
            </ElDescriptionsItem>
            <ElDescriptionsItem :span="3" label="术中初步结果">
              {{ detail.preliminaryResult || '-' }}
            </ElDescriptionsItem>
            <ElDescriptionsItem :span="3" label="冰石对比说明">
              {{ detail.compareSummary || '-' }}
            </ElDescriptionsItem>
          </ElDescriptions>
        </template>
      </WorkflowSectionCard>

      <div class="grid gap-4 xl:grid-cols-[1fr_0.95fr]">
        <WorkflowSectionCard
          title="报告与对比操作"
          description="旧系统分散在报告页、提醒页和冰石对比页的动作，先收敛到一个专项页面。"
        >
          <ElEmpty v-if="!detail" description="请选择冰冻会话" />
          <template v-else>
            <ElForm label-width="96px">
              <ElFormItem label="操作人">
                <ElInput v-model="form.operatorName" />
              </ElFormItem>
              <ElFormItem label="终端">
                <ElInput v-model="form.terminalCode" />
              </ElFormItem>
              <ElFormItem label="备注">
                <ElInput v-model="form.remarks" type="textarea" />
              </ElFormItem>
              <ElFormItem label="初步结果">
                <ElInput
                  v-model="form.preliminaryResult"
                  :rows="4"
                  placeholder="术中快速报告或电话回报内容"
                  type="textarea"
                />
              </ElFormItem>
              <ElFormItem label="冰石结果">
                <ElSelect v-model="form.compareStatus" style="width: 220px">
                  <ElOption label="符合" value="SIGNED_OFF" />
                  <ElOption label="不符合" value="MISMATCH" />
                </ElSelect>
              </ElFormItem>
              <ElFormItem label="对比说明">
                <ElInput
                  v-model="form.compareSummary"
                  :rows="3"
                  placeholder="填写冰石符合性说明"
                  type="textarea"
                />
              </ElFormItem>
              <ElFormItem label="剩余组织">
                <ElSelect
                  v-model="form.remainingTissueStatus"
                  style="width: 220px"
                >
                  <ElOption label="保留" value="RETAINED" />
                  <ElOption label="已处理" value="DISPOSED" />
                </ElSelect>
              </ElFormItem>
              <ElFormItem>
                <div class="flex flex-wrap gap-2">
                  <ElButton
                    v-if="canSavePreliminary"
                    :loading="actionLoading"
                    type="primary"
                    @click="savePreliminary"
                  >
                    保存初步结果
                  </ElButton>
                  <ElButton
                    v-if="canSavePreliminary"
                    :loading="actionLoading"
                    type="warning"
                    @click="phoneBack"
                  >
                    完成电话回报
                  </ElButton>
                  <ElButton
                    v-if="canConfirm"
                    :loading="actionLoading"
                    type="success"
                    @click="confirmReport"
                  >
                    最终确认
                  </ElButton>
                  <ElButton
                    v-if="canCompare"
                    :loading="actionLoading"
                    type="primary"
                    @click="submitCompare"
                  >
                    完成冰石对比
                  </ElButton>
                  <ElButton
                    v-if="canClose"
                    :loading="actionLoading"
                    type="success"
                    @click="closeSession"
                  >
                    完成剩余组织处理
                  </ElButton>
                </div>
              </ElFormItem>
            </ElForm>
          </template>
        </WorkflowSectionCard>

        <WorkflowSectionCard
          title="时间线"
          description="用于回看术中申请、技术处理、快速报告、冰石对比和流程闭环。"
        >
          <ElEmpty v-if="!detail" description="请选择冰冻会话" />
          <div v-else class="flex flex-col gap-3">
            <article
              v-for="event in detail.timeline"
              :key="event.id"
              class="rounded-lg border border-border bg-background p-3"
            >
              <div class="flex items-center justify-between gap-3">
                <div class="font-medium text-foreground">
                  {{ event.eventContent }}
                </div>
                <ElTag type="info">{{ event.nodeCode }}</ElTag>
              </div>
              <div class="mt-1 text-sm text-muted-foreground">
                {{ event.eventTime }} / {{ event.operatorName || '系统' }}
              </div>
            </article>
          </div>
        </WorkflowSectionCard>
      </div>
    </div>
  </Page>
</template>
