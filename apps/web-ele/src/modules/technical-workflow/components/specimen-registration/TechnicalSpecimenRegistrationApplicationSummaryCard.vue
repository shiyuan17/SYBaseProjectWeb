<script setup lang="ts">
import type { TechnicalSpecimenRegistrationWorkspace } from '../../types/technical-workflow';

import type { ApplicationRegistrationWorkbenchRecord } from '#/modules/specimen-workflow/types/application-registration-workbench';

import { computed } from 'vue';

import { ElAlert, ElButton, ElEmpty } from 'element-plus';

import { APPLICATION_TYPE_OPTIONS } from '#/modules/specimen-workflow/constants';
import { formatApplicationType } from '#/modules/specimen-workflow/utils/format';

import { resolveTechnicalRegistrationApplicationType } from '../../utils/specimen-registration-application';

const props = defineProps<{
  error?: string;
  loading?: boolean;
  record: ApplicationRegistrationWorkbenchRecord | null;
  selectedApplicationType?: null | string;
  workspace: null | TechnicalSpecimenRegistrationWorkspace;
}>();

const emit = defineEmits<{
  edit: [];
  'update:applicationType': [value: string];
}>();

const hasContext = computed(
  () => props.record !== null || props.workspace !== null,
);
const currentApplicationType = computed(() =>
  resolveTechnicalRegistrationApplicationType(
    props.selectedApplicationType?.trim() ||
      props.record?.patientInfo.specimenType?.trim() ||
      props.workspace?.basicInfo.applicationType?.trim() ||
      '',
  ),
);

const typeOptions = computed(() => {
  const options: Array<{ label: string; value: string }> =
    APPLICATION_TYPE_OPTIONS.map((item) => ({
      label: item.label,
      value: item.value,
    }));
  const currentValue = currentApplicationType.value;
  if (currentValue && !options.some((item) => item.value === currentValue)) {
    options.push({
      label: formatApplicationType(currentValue),
      value: currentValue,
    });
  }
  return options;
});

function selectApplicationType(value: string) {
  if (!hasContext.value || props.loading) {
    return;
  }
  emit('update:applicationType', value);
}
</script>

<template>
  <section class="rounded-lg border border-slate-200 bg-white shadow-sm">
    <div class="border-b border-slate-200 px-4 py-4">
      <div class="flex items-start justify-between gap-3">
        <div>
          <div class="text-base font-semibold text-slate-900">申请核对区</div>
          <p class="mt-1 text-xs text-slate-500">
            对照当前申请信息进行技术登记核对，可在抽屉中补充患者与手术相关字段。
          </p>
        </div>
        <ElButton
          :disabled="!hasContext || loading"
          data-testid="open-application-drawer"
          size="small"
          type="primary"
          @click="emit('edit')"
        >
          编辑申请
        </ElButton>
      </div>
    </div>

    <div class="space-y-4 px-4 py-4">
      <ElAlert v-if="error" :closable="false" :title="error" type="error" />

      <div
        v-if="loading"
        class="rounded-lg bg-slate-50 px-4 py-6 text-sm text-slate-500"
      >
        正在加载申请核对信息...
      </div>

      <template v-else-if="hasContext">
        <article class="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div class="mb-2 flex items-center justify-between gap-3">
            <div class="text-xs font-semibold text-slate-500">送检类型</div>
            <div class="text-[11px] text-slate-400">
              {{ typeOptions.length }} 类
            </div>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="item in typeOptions"
              :key="item.value"
              :aria-pressed="item.value === currentApplicationType"
              class="rounded-full border px-3 py-1 text-xs font-medium leading-5 transition"
              :class="[
                item.value === currentApplicationType
                  ? item.value === 'SUPPLEMENTAL_REPORT'
                    ? 'border-rose-500 bg-rose-500 text-white shadow-sm'
                    : 'border-sky-500 bg-sky-500 text-white shadow-sm'
                  : item.value === 'SUPPLEMENTAL_REPORT'
                    ? 'border-rose-100 bg-white text-rose-500 hover:border-rose-200'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-sky-200 hover:text-sky-600',
              ]"
              :data-testid="`application-type-${item.value}`"
              type="button"
              @click="selectApplicationType(item.value)"
            >
              {{ item.label }}
            </button>
          </div>
        </article>
      </template>

      <div v-else class="py-4">
        <ElEmpty description="请选择左侧病例后查看申请核对区" />
      </div>
    </div>
  </section>
</template>
