<script setup lang="ts">
import type {
  PendingTechnicalTaskItem,
  TechnicalOperatorFormValue,
} from '../types/technical-workflow';

import { computed } from 'vue';

import {
  ElButton,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElOption,
  ElSelect,
  ElTag,
} from 'element-plus';

import { EVALUATION_LEVEL_OPTIONS } from '../constants';
import TechnicalOperatorFields from './TechnicalOperatorFields.vue';

const props = defineProps<{
  active: boolean;
  canComplete: boolean;
  completeLoading: boolean;
  form: {
    blockCount: number;
    deviceCode: string;
    embeddingBoxNo: string;
    evaluationLevel: string;
    samplingBlockId: string;
    samplingEvaluation: string;
    sliceNotice: string;
  };
  operatorForm: TechnicalOperatorFormValue;
  selectedBlock: null | {
    blockCode: null | string;
    blockDescription: null | string;
    grossDescription: null | string;
    specimenName: null | string;
  };
  selectedTask: null | PendingTechnicalTaskItem;
}>();

const emit = defineEmits<{
  cancel: [];
  complete: [];
  'update:form': [value: typeof props.form];
  'update:operatorForm': [value: TechnicalOperatorFormValue];
}>();

function createFormModel<Key extends keyof typeof props.form>(key: Key) {
  return computed({
    get: () => props.form[key],
    set: (value: (typeof props.form)[Key]) =>
      emit('update:form', { ...props.form, [key]: value }),
  });
}

const samplingBlockIdModel = createFormModel('samplingBlockId');
const embeddingBoxNoModel = createFormModel('embeddingBoxNo');
const blockCountModel = createFormModel('blockCount');
const evaluationLevelModel = createFormModel('evaluationLevel');
const deviceCodeModel = createFormModel('deviceCode');
const sliceNoticeModel = createFormModel('sliceNotice');
const samplingEvaluationModel = createFormModel('samplingEvaluation');
</script>

<template>
  <section
    class="flex h-full flex-col rounded-2xl border border-slate-200 bg-white"
  >
    <div class="border-b border-slate-200 px-5 py-4">
      <div class="flex items-start justify-between gap-3">
        <div>
          <h3 class="text-base font-semibold text-slate-900">蜡块信息</h3>
          <p class="mt-1 text-sm text-slate-500">
            核对蜡块来源、切片提示和包埋完成信息。
          </p>
        </div>
        <ElTag :type="active ? 'success' : 'info'">
          {{ active ? '处理中' : '未进入处理态' }}
        </ElTag>
      </div>
    </div>

    <div v-if="selectedTask" class="flex flex-1 flex-col gap-4 p-5">
      <div class="grid gap-3 rounded-xl bg-slate-50 p-4 md:grid-cols-2">
        <div>
          <div class="text-xs text-slate-500">当前任务</div>
          <div class="mt-1 text-sm font-medium text-slate-900">
            {{ selectedTask.pathologyNo || '--' }}
          </div>
        </div>
        <div>
          <div class="text-xs text-slate-500">蜡块号</div>
          <div class="mt-1 text-sm font-medium text-slate-900">
            {{
              selectedBlock?.blockCode || selectedTask.samplingBlockCode || '--'
            }}
          </div>
        </div>
        <div>
          <div class="text-xs text-slate-500">蜡块名称</div>
          <div class="mt-1 text-sm text-slate-700">
            {{
              selectedBlock?.blockDescription ||
              selectedTask.samplingBlockDescription ||
              '--'
            }}
          </div>
        </div>
        <div>
          <div class="text-xs text-slate-500">标本名称</div>
          <div class="mt-1 text-sm text-slate-700">
            {{ selectedBlock?.specimenName || '--' }}
          </div>
        </div>
        <div class="md:col-span-2">
          <div class="text-xs text-slate-500">大体所见</div>
          <div
            class="mt-1 min-h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
          >
            {{ selectedBlock?.grossDescription || '--' }}
          </div>
        </div>
      </div>

      <ElForm label-width="92px">
        <TechnicalOperatorFields
          :form="operatorForm"
          remarks-placeholder="包埋备注"
          terminal-placeholder="包埋终端编码"
          @update:form="emit('update:operatorForm', $event)"
        />
        <div class="grid gap-4 md:grid-cols-2">
          <ElFormItem label="取材块编号" required>
            <ElInput v-model="samplingBlockIdModel" readonly />
          </ElFormItem>
          <ElFormItem label="包埋盒号">
            <ElInput
              v-model="embeddingBoxNoModel"
              placeholder="不填则后端自动生成"
            />
          </ElFormItem>
          <ElFormItem label="蜡块数量" required>
            <ElInputNumber v-model="blockCountModel" :min="1" class="w-full" />
          </ElFormItem>
          <ElFormItem label="评估等级">
            <ElSelect
              v-model="evaluationLevelModel"
              clearable
              placeholder="请选择评估等级"
            >
              <ElOption
                v-for="option in EVALUATION_LEVEL_OPTIONS"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="设备编码">
            <ElInput v-model="deviceCodeModel" placeholder="请输入设备编码" />
          </ElFormItem>
          <ElFormItem label="切片提示">
            <ElInput v-model="sliceNoticeModel" placeholder="请输入切片提示" />
          </ElFormItem>
        </div>
        <ElFormItem label="取材评价">
          <ElInput
            v-model="samplingEvaluationModel"
            :rows="3"
            placeholder="请输入取材评价"
            type="textarea"
          />
        </ElFormItem>
      </ElForm>

      <div
        class="mt-auto flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-4"
      >
        <ElButton :disabled="!active" @click="emit('cancel')">
          取消包埋
        </ElButton>
        <ElButton
          :disabled="!canComplete"
          :loading="completeLoading"
          type="primary"
          @click="emit('complete')"
        >
          确认包埋完成(F9)
        </ElButton>
      </div>
    </div>

    <div v-else class="flex flex-1 items-center justify-center p-6">
      <ElEmpty description="请先从左侧待包埋列表选择任务" />
    </div>
  </section>
</template>
