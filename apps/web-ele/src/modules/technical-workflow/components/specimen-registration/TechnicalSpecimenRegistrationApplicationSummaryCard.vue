<script setup lang="ts">
import type { ApplicationRegistrationWorkbenchRecord } from '#/modules/specimen-workflow/types/application-registration-workbench';

import type { TechnicalSpecimenRegistrationWorkspace } from '../../types/technical-workflow';

import { computed } from 'vue';

import { ElAlert, ElButton, ElEmpty } from 'element-plus';

import { APPLICATION_TYPE_OPTIONS } from '#/modules/specimen-workflow/constants';
import { formatApplicationType } from '#/modules/specimen-workflow/utils/format';

import { formatDateTime, formatNullable } from '../../utils/format';
import {
  isTechnicalRegistrationPathologyNoPreview,
  resolveTechnicalRegistrationApplicationType,
  resolveTechnicalRegistrationPathologyNo,
} from '../../utils/specimen-registration-application';

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
const sourceApplicationType = computed(
  () =>
    props.workspace?.basicInfo.applicationType?.trim() ||
    props.record?.patientInfo.specimenType?.trim() ||
    '',
);
const currentApplicationType = computed(
  () =>
    resolveTechnicalRegistrationApplicationType(
      props.selectedApplicationType?.trim() ||
        props.record?.patientInfo.specimenType?.trim() ||
        props.workspace?.basicInfo.applicationType?.trim() ||
        '',
    ),
);
const displayedPathologyNo = computed(() =>
  resolveTechnicalRegistrationPathologyNo({
    applicationType: currentApplicationType.value,
    existingPathologyNo: props.workspace?.basicInfo.pathologyNo,
    referenceDate:
      props.workspace?.basicInfo.submissionDate ||
      props.record?.patientInfo.applicationDate,
    sourceApplicationType: sourceApplicationType.value,
  }),
);
const pathologyNoIsPreview = computed(() =>
  isTechnicalRegistrationPathologyNoPreview({
    applicationType: currentApplicationType.value,
    existingPathologyNo: props.workspace?.basicInfo.pathologyNo,
    sourceApplicationType: sourceApplicationType.value,
  }),
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

const summaryRows = computed(() => [
  {
    key: 'departmentDoctor',
    label: '申请科室/医生',
    value: [
      props.record?.patientInfo.applyDept ||
        props.workspace?.basicInfo.submittingDepartmentName ||
        '',
      props.record?.patientInfo.applyDoctor ||
        props.workspace?.basicInfo.submittingDoctorName ||
        '',
    ]
      .filter((item) => item && item.trim())
      .join(' / '),
  },
  {
    key: 'applicationNo',
    label: '申请单号',
    value:
      props.record?.patientInfo.applicationNo ||
      props.workspace?.basicInfo.applicationNo ||
      '',
  },
  {
    key: 'pathologyNo',
    label: '病理检查号',
    value: displayedPathologyNo.value,
    valueHint: pathologyNoIsPreview.value ? '默认生成' : '',
  },
  {
    key: 'patientName',
    label: '患者姓名',
    value:
      props.record?.patientInfo.patientName ||
      props.workspace?.basicInfo.patientName ||
      '',
  },
  {
    key: 'patientId',
    label: '患者 ID',
    value: props.workspace?.basicInfo.patientId || '',
  },
  {
    key: 'inpatientNo',
    label: '住院号',
    value:
      props.record?.patientInfo.inpatientNo ||
      props.workspace?.basicInfo.inpatientNo ||
      '',
  },
  {
    key: 'submissionDate',
    label: '送检日期',
    value: props.workspace?.basicInfo.submissionDate || '',
  },
  {
    key: 'specimenRemovalTime',
    label: '离体时间',
    value: formatDateTime(props.workspace?.basicInfo.specimenRemovalTime),
  },
  {
    key: 'fixationTime',
    label: '固定时间',
    value: formatDateTime(props.workspace?.basicInfo.fixationTime),
  },
]);
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
      <ElAlert
        v-if="error"
        :closable="false"
        :title="error"
        type="error"
      />

      <div
        v-if="loading"
        class="rounded-lg bg-slate-50 px-4 py-6 text-sm text-slate-500"
      >
        正在加载申请核对信息...
      </div>

      <template v-else-if="hasContext">
        <article class="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div class="mb-3 flex items-center justify-between gap-3">
            <div class="text-xs font-semibold text-slate-500">
              送检类型
            </div>
            <div class="text-[11px] text-slate-400">
              {{ typeOptions.length }} 类
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2 xl:grid-cols-3">
            <button
              v-for="item in typeOptions"
              :key="item.value"
              :aria-pressed="item.value === currentApplicationType"
              :class="[
                'min-h-10 rounded-md border px-2 py-2 text-center text-sm font-medium leading-5 transition',
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

        <div class="grid gap-3 sm:grid-cols-2">
          <article
            v-for="item in summaryRows"
            :key="item.key"
            class="rounded-lg border border-slate-200 px-4 py-3"
          >
            <div class="text-[11px] font-medium uppercase text-slate-400">
              {{ item.label }}
            </div>
            <div class="mt-2 text-sm font-semibold text-slate-900">
              {{ formatNullable(item.value) }}
            </div>
            <div v-if="item.valueHint" class="mt-1 text-[11px] text-sky-500">
              {{ item.valueHint }}
            </div>
          </article>
        </div>
      </template>

      <div v-else class="py-4">
        <ElEmpty description="请选择左侧病例后查看申请核对区" />
      </div>
    </div>
  </section>
</template>
