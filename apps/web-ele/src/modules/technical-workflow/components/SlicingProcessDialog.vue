<script setup lang="ts">
import type {
  PendingTechnicalTaskItem,
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

import { completeSlicing } from '../api/technical-workflow-service';
import { reportInlineErrorDisabled } from '#/utils/error-feedback';

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

const currentTaskContext = computed(() => ({
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

async function submitSlicing() {
  const payload = normalizeTechnicalOperatorPayload(operatorForm);
  if (!completeForm.taskId.trim()) {
    ElMessage.warning('当前缺少待处理任务');
    return;
  }
  if (!completeForm.embeddingBoxId.trim()) {
    ElMessage.warning('请先确认包埋盒编号');
    return;
  }
  if (!operatorForm.operatorName.trim()) {
    ElMessage.warning('请先确认当前登录人');
    return;
  }

  submitting.value = true;
  pageError.value = '';
  try {
    const result = await completeSlicing({
      ...payload,
      deviceCode: completeForm.deviceCode.trim() || null,
      embeddingBoxId: completeForm.embeddingBoxId.trim(),
      qualityIssue: completeForm.qualityIssue.trim() || null,
      slideCount: completeForm.slideCount,
      sliceCountPerSlide: completeForm.sliceCountPerSlide,
      sliceThickness: completeForm.sliceThickness.trim() || null,
      taskId: completeForm.taskId.trim(),
    });
    ElMessage.success(`切片完成，已生成 ${result.slideIds.length} 张玻片`);
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
              placeholder="由当前任务带入"
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
