<script setup lang="ts">
import type {
  PendingTechnicalTaskItem,
  SlicingResult,
  TechnicalOperatorFormValue,
} from '../types/technical-workflow';

import { computed, reactive, ref, watch } from 'vue';

import { useUserStore } from '@vben/stores';

import {
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
} from 'element-plus';

import { reportInlineErrorDisabled } from '#/utils/error-feedback';

import {
  completeSlicing,
  startSlicing,
} from '../api/technical-workflow-service';
import { getWorkflowPageErrorMessage } from '../utils/error';
import { formatNullable, formatObjectType } from '../utils/format';
import {
  assignTechnicalOperatorForm,
  createTechnicalOperatorDefaults,
  normalizeTechnicalOperatorPayload,
} from '../utils/operator-form';
import TechnicalOperatorFields from './TechnicalOperatorFields.vue';

const props = defineProps<{
  modelValue: boolean;
  task: null | PendingTechnicalTaskItem;
  tasks?: PendingTechnicalTaskItem[];
}>();

const emit = defineEmits<{
  submitted: [];
  'update:modelValue': [value: boolean];
}>();

const userStore = useUserStore();

const pageError = ref('');
const submitting = ref(false);

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const operatorForm = reactive<TechnicalOperatorFormValue>(
  createTechnicalOperatorDefaults(userStore.userInfo ?? undefined),
);

const completeForm = reactive({
  deviceCode: '',
  embeddingBoxId: '',
  qualityIssue: '',
  slideCount: 1,
  sliceCountPerSlide: 1,
  sliceThickness: '',
  taskId: '',
});

const actionTasks = computed(() => {
  if (props.tasks && props.tasks.length > 0) {
    return props.tasks;
  }
  return props.task ? [props.task] : [];
});

const isBatchMode = computed(() => actionTasks.value.length > 1);

const currentTaskContext = computed(() => ({
  count: actionTasks.value.length,
  objectId: completeForm.embeddingBoxId || props.task?.objectId || '',
  objectType: props.task?.objectType ?? '',
  pathologyNo: props.task?.pathologyNo ?? '',
  taskId: completeForm.taskId || props.task?.id || '',
}));

function resetDialogState() {
  pageError.value = '';
  assignTechnicalOperatorForm(operatorForm, userStore.userInfo ?? undefined);
  completeForm.deviceCode = '';
  completeForm.embeddingBoxId =
    props.task?.objectType === 'EMBEDDING_BOX'
      ? (props.task.objectId ?? '')
      : '';
  completeForm.qualityIssue = '';
  completeForm.slideCount = 1;
  completeForm.sliceCountPerSlide = 1;
  completeForm.sliceThickness = '';
  completeForm.taskId = props.task?.id ?? '';
}

function getTaskEmbeddingBoxId(task: PendingTechnicalTaskItem) {
  return task.objectType === 'EMBEDDING_BOX'
    ? (task.objectId ?? '').trim()
    : '';
}

async function completeSlicingTask(
  task: PendingTechnicalTaskItem,
  usePanelForm: boolean,
): Promise<SlicingResult> {
  const payload = normalizeTechnicalOperatorPayload(operatorForm);
  if (task.taskStatus === 'PENDING') {
    await startSlicing({
      ...payload,
      taskId: task.id,
    });
  } else if (task.taskStatus !== 'IN_PROGRESS') {
    throw new Error('当前任务状态不支持完成切片');
  }

  const embeddingBoxId = usePanelForm
    ? completeForm.embeddingBoxId.trim()
    : getTaskEmbeddingBoxId(task);
  if (!embeddingBoxId) {
    throw new Error('请先确认包埋盒编号');
  }

  return completeSlicing({
    ...payload,
    deviceCode: completeForm.deviceCode.trim() || null,
    embeddingBoxId,
    qualityIssue: completeForm.qualityIssue.trim() || null,
    slideCount: completeForm.slideCount,
    sliceCountPerSlide: completeForm.sliceCountPerSlide,
    sliceThickness: completeForm.sliceThickness.trim() || null,
    taskId: task.id,
  });
}

async function submitSlicing() {
  const tasks = actionTasks.value;
  const usePanelForm = tasks.length === 1;
  if (tasks.length === 0) {
    ElMessage.warning('当前缺少待处理任务');
    return;
  }
  if (
    tasks.some((task) =>
      usePanelForm
        ? !completeForm.embeddingBoxId.trim()
        : !getTaskEmbeddingBoxId(task),
    )
  ) {
    ElMessage.warning('请先确认包埋盒编号');
    return;
  }
  if (!operatorForm.operatorName.trim()) {
    ElMessage.warning('请先确认当前登录人');
    return;
  }
  if (
    tasks.some(
      (task) =>
        task.taskStatus !== 'PENDING' && task.taskStatus !== 'IN_PROGRESS',
    )
  ) {
    ElMessage.warning('当前任务状态不支持完成切片');
    return;
  }

  submitting.value = true;
  pageError.value = '';
  try {
    const results = await Promise.allSettled(
      tasks.map((task) => completeSlicingTask(task, usePanelForm)),
    );
    const failedResults = results.filter(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    );
    const succeededCount = results.length - failedResults.length;

    if (failedResults.length === 0) {
      const firstResult = results[0];
      const slicingResult =
        firstResult?.status === 'fulfilled' ? firstResult.value : null;
      ElMessage.success(
        tasks.length === 1 && slicingResult
          ? `切片完成，已生成 ${slicingResult.slideIds.length} 张玻片`
          : `已完成切片 ${tasks.length} 条任务`,
      );
    } else {
      const firstFailure = failedResults[0];
      if (firstFailure) {
        pageError.value = getWorkflowPageErrorMessage(firstFailure.reason);
        reportInlineErrorDisabled(
          firstFailure.reason,
          getWorkflowPageErrorMessage,
        );
      }
      ElMessage.warning(
        succeededCount > 0
          ? `已完成切片 ${succeededCount} 条任务，${failedResults.length} 条失败`
          : '完成切片失败，请重试',
      );
      if (succeededCount === 0) {
        return;
      }
    }

    emit('submitted');
    dialogVisible.value = false;
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
    reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
  } finally {
    submitting.value = false;
  }
}

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      resetDialogState();
    }
  },
);
</script>

<template>
  <ElDialog
    v-model="dialogVisible"
    :close-on-click-modal="false"
    destroy-on-close
    title="切片处理"
    width="880px"
    @closed="resetDialogState"
  >
    <div class="flex flex-col gap-4">
      <ElDescriptions :column="2" border>
        <ElDescriptionsItem v-if="isBatchMode" label="批量任务">
          {{ currentTaskContext.count }} 条
        </ElDescriptionsItem>
        <ElDescriptionsItem label="任务号">
          {{ formatNullable(currentTaskContext.taskId) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="病理号">
          {{ formatNullable(currentTaskContext.pathologyNo) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="对象类型">
          {{ formatObjectType(currentTaskContext.objectType) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="包埋盒编号">
          {{ formatNullable(currentTaskContext.objectId) }}
        </ElDescriptionsItem>
      </ElDescriptions>

      <ElForm label-width="108px">
        <TechnicalOperatorFields
          :form="operatorForm"
          terminal-placeholder="切片终端编码"
        />
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <ElFormItem label="包埋盒编号" required>
            <ElInput
              v-model="completeForm.embeddingBoxId"
              :placeholder="
                isBatchMode ? '批量时按各任务包埋盒带入' : '由当前任务带入'
              "
              readonly
            />
          </ElFormItem>
          <ElFormItem label="玻片数量" required>
            <ElInputNumber
              v-model="completeForm.slideCount"
              :min="1"
              class="w-full"
            />
          </ElFormItem>
          <ElFormItem label="每片切片数">
            <ElInputNumber
              v-model="completeForm.sliceCountPerSlide"
              :min="1"
              class="w-full"
            />
          </ElFormItem>
          <ElFormItem label="切片厚度">
            <ElInput
              v-model="completeForm.sliceThickness"
              placeholder="例如：4μm"
            />
          </ElFormItem>
          <ElFormItem label="设备编码">
            <ElInput
              v-model="completeForm.deviceCode"
              placeholder="请输入设备编码"
            />
          </ElFormItem>
        </div>
        <ElFormItem label="质量问题">
          <ElInput
            v-model="completeForm.qualityIssue"
            :rows="3"
            placeholder="必要时记录切片质量问题"
            type="textarea"
          />
        </ElFormItem>
      </ElForm>
    </div>

    <template #footer>
      <ElButton @click="dialogVisible = false">取消</ElButton>
      <ElButton :loading="submitting" type="primary" @click="submitSlicing">
        完成切片
      </ElButton>
    </template>
  </ElDialog>
</template>
