<script setup lang="ts">
import type {
  FrozenSession,
  FrozenSessionDetail,
} from '#/modules/frozen-workflow/types/frozen-workflow';

import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

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
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import {
  completeFrozenGrossing,
  completeFrozenReceive,
  completeFrozenSlicing,
  getFrozenSessionDetail,
  getFrozenTechnicalWorkbench,
} from '#/modules/frozen-workflow/api/frozen-workflow-service';

import WorkflowSectionCard from '../components/WorkflowSectionCard.vue';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const loading = ref(false);
const actionLoading = ref(false);
const pageError = ref('');
const sessions = ref<FrozenSession[]>([]);
const reminderSummary = ref({
  items: [] as Array<{
    id: string;
    nextAction: string;
    patientName: string;
    sessionId: string;
    timeoutLevel: 'NONE' | 'ORANGE' | 'RED';
    title: string;
  }>,
  orangeCount: 0,
  redCount: 0,
  total: 0,
});
const selectedSessionId = ref('');
const selectedDetail = ref<FrozenSessionDetail | null>(null);

const operatorForm = reactive({
  operatorName: '',
  operatorUserId: '',
  remarks: '',
  terminalCode: '',
});

const currentActionLabel = computed(() => {
  if (!selectedDetail.value) {
    return '';
  }
  if (selectedDetail.value.currentTaskType === 'RECEIVE') {
    return '完成冰冻接收';
  }
  if (selectedDetail.value.currentTaskType === 'GROSSING') {
    return '完成冰冻取材';
  }
  if (selectedDetail.value.currentTaskType === 'SLICING') {
    return '完成冰冻切片';
  }
  return '';
});
const canOperate = computed(() =>
  ['GROSSING', 'RECEIVE', 'SLICING'].includes(
    selectedDetail.value?.currentTaskType ?? '',
  ),
);

function ensureOperator() {
  if (!operatorForm.operatorName.trim()) {
    ElMessage.warning('请先填写操作人');
    return false;
  }
  return true;
}

function buildOperatorPayload() {
  return {
    operatorName: operatorForm.operatorName.trim(),
    operatorUserId: operatorForm.operatorUserId.trim() || null,
    remarks: operatorForm.remarks.trim() || null,
    terminalCode: operatorForm.terminalCode.trim() || null,
  };
}

async function loadWorkbench() {
  loading.value = true;
  pageError.value = '';
  try {
    const result = await getFrozenTechnicalWorkbench();
    sessions.value = result.sessions;
    reminderSummary.value = result.reminders;
    if (!selectedSessionId.value) {
      selectedSessionId.value =
        (typeof route.query.sessionId === 'string'
          ? route.query.sessionId
          : '') ||
        result.sessions[0]?.id ||
        '';
    }
  } catch (error) {
    pageError.value =
      error instanceof Error ? error.message : '冰冻工作台加载失败';
  } finally {
    loading.value = false;
  }
}

async function loadDetail(sessionId: string) {
  if (!sessionId) {
    selectedDetail.value = null;
    return;
  }
  try {
    selectedDetail.value = await getFrozenSessionDetail(sessionId);
  } catch (error) {
    selectedDetail.value = null;
    pageError.value =
      error instanceof Error ? error.message : '冰冻会话加载失败';
  }
}

async function runCurrentAction() {
  if (!selectedDetail.value || !canOperate.value) {
    return;
  }
  if (!ensureOperator()) {
    return;
  }
  actionLoading.value = true;
  try {
    const payload = buildOperatorPayload();
    switch (selectedDetail.value.currentTaskType) {
      case 'GROSSING': {
        await completeFrozenGrossing(selectedDetail.value.id, payload);

        break;
      }
      case 'RECEIVE': {
        await completeFrozenReceive(selectedDetail.value.id, payload);

        break;
      }
      case 'SLICING': {
        await completeFrozenSlicing(selectedDetail.value.id, payload);

        break;
      }
      // No default
    }
    ElMessage.success(`${currentActionLabel.value}成功`);
    await loadWorkbench();
    await loadDetail(selectedDetail.value.id);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '操作失败');
  } finally {
    actionLoading.value = false;
  }
}

function openDoctorSide() {
  if (!selectedDetail.value) {
    ElMessage.warning('请先选择冰冻会话');
    return;
  }
  void router.push({
    path: '/doctor-workflow/frozen-report',
    query: {
      sessionId: selectedDetail.value.id,
    },
  });
}

watch(selectedSessionId, (value) => {
  void loadDetail(value);
});

watch(
  () => userStore.userInfo,
  (value) => {
    if (!operatorForm.operatorName && value?.realName) {
      operatorForm.operatorName = value.realName;
    }
    if (!operatorForm.operatorUserId && value?.userId) {
      operatorForm.operatorUserId = value.userId;
    }
  },
  { immediate: true },
);

void loadWorkbench();
</script>

<template>
  <Page
    title="冰冻工作台"
    description="承接术中冰冻的接收、取材、切片、提醒与交接班，先以统一 mock 会话跑通技术侧流程。"
  >
    <div class="flex flex-col gap-4">
      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        show-icon
        type="error"
      />

      <WorkflowSectionCard
        title="超时提醒"
        description="对应旧系统的冰冻提醒看板，先聚合显示当前待办和超时等级。"
      >
        <div class="grid gap-4 md:grid-cols-3">
          <div class="rounded-lg border border-border bg-background p-4">
            <div class="text-sm text-muted-foreground">全部会话</div>
            <div class="mt-2 text-2xl font-semibold text-foreground">
              {{ reminderSummary.total }}
            </div>
          </div>
          <div class="rounded-lg border border-border bg-background p-4">
            <div class="text-sm text-muted-foreground">橙色提醒</div>
            <div class="mt-2 text-2xl font-semibold text-warning">
              {{ reminderSummary.orangeCount }}
            </div>
          </div>
          <div class="rounded-lg border border-border bg-background p-4">
            <div class="text-sm text-muted-foreground">红色提醒</div>
            <div class="mt-2 text-2xl font-semibold text-danger">
              {{ reminderSummary.redCount }}
            </div>
          </div>
        </div>
      </WorkflowSectionCard>

      <div class="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <WorkflowSectionCard
          title="冰冻会话列表"
          description="按会话承接旧系统分散在接收、取材、切片和提醒里的状态。"
        >
          <ElTable
            v-loading="loading"
            :data="sessions"
            border
            highlight-current-row
            @current-change="selectedSessionId = $event?.id ?? ''"
          >
            <ElTableColumn label="冰冻号" min-width="140">
              <template #default="{ row }">
                <button
                  class="text-left text-primary underline-offset-2 hover:underline"
                  type="button"
                  @click="selectedSessionId = row.id"
                >
                  {{ row.frozenPathologyNo }}
                </button>
              </template>
            </ElTableColumn>
            <ElTableColumn label="患者" min-width="100" prop="patientName" />
            <ElTableColumn
              label="当前节点"
              min-width="120"
              prop="currentTaskType"
            />
            <ElTableColumn label="下一动作" min-width="160" prop="nextAction" />
            <ElTableColumn label="提醒等级" min-width="100">
              <template #default="{ row }">
                <ElTag
                  :type="
                    row.timeoutLevel === 'RED'
                      ? 'danger'
                      : row.timeoutLevel === 'ORANGE'
                        ? 'warning'
                        : 'info'
                  "
                >
                  {{ row.timeoutLevel }}
                </ElTag>
              </template>
            </ElTableColumn>
          </ElTable>
        </WorkflowSectionCard>

        <WorkflowSectionCard
          title="会话详情"
          description="技术侧只操作接收、取材、切片，后续快速报告与冰石对比由医生侧承接。"
        >
          <ElEmpty v-if="!selectedDetail" description="请选择冰冻会话" />
          <template v-else>
            <ElDescriptions :column="2" border>
              <ElDescriptionsItem label="申请单号">
                {{ selectedDetail.applicationNo }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="病例号">
                {{ selectedDetail.caseId }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="当前节点">
                {{ selectedDetail.currentTaskType }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="会话状态">
                {{ selectedDetail.sessionStatus }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="接收时间">
                {{ selectedDetail.receivedAt || '-' }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="取材完成">
                {{ selectedDetail.grossingCompletedAt || '-' }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="切片完成">
                {{ selectedDetail.slicingCompletedAt || '-' }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="快速结果">
                {{ selectedDetail.preliminaryResult || '-' }}
              </ElDescriptionsItem>
            </ElDescriptions>

            <ElForm class="mt-4" label-width="88px">
              <ElFormItem label="操作人">
                <ElInput v-model="operatorForm.operatorName" />
              </ElFormItem>
              <ElFormItem label="终端">
                <ElInput v-model="operatorForm.terminalCode" />
              </ElFormItem>
              <ElFormItem label="备注">
                <ElInput v-model="operatorForm.remarks" type="textarea" />
              </ElFormItem>
              <ElFormItem>
                <div class="flex flex-wrap gap-2">
                  <ElButton
                    v-if="canOperate"
                    :loading="actionLoading"
                    type="primary"
                    @click="runCurrentAction"
                  >
                    {{ currentActionLabel }}
                  </ElButton>
                  <ElButton type="warning" @click="openDoctorSide">
                    进入冰冻报告
                  </ElButton>
                </div>
              </ElFormItem>
            </ElForm>

            <WorkflowSectionCard
              class="mt-4"
              title="时间线"
              description="对应旧系统的提醒看板与技术事件轨迹。"
            >
              <div class="flex flex-col gap-3">
                <article
                  v-for="event in selectedDetail.timeline"
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
          </template>
        </WorkflowSectionCard>
      </div>
    </div>
  </Page>
</template>
