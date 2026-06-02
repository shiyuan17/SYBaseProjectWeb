<script setup lang="ts">
import type {
  SaveTechnicalSpecimenRegistrationMaterialItem,
  TechnicalSpecimenRegistrationDetailSections,
  TechnicalSpecimenRegistrationWorkspace,
} from '../../types/technical-workflow';

import { nextTick, ref, watch } from 'vue';

import { ElButton, ElEmpty } from 'element-plus';

import TechnicalSpecimenRegistrationEditableSectionCard from './TechnicalSpecimenRegistrationEditableSectionCard.vue';

type DetailSectionKey = keyof TechnicalSpecimenRegistrationDetailSections;

const DETAIL_SECTION_ITEMS: Array<{
  key: DetailSectionKey;
  title: string;
  valueTestId: string;
}> = [
  {
    key: 'historySummary',
    title: '病史摘要',
    valueTestId: 'historySummary',
  },
  {
    key: 'clinicalExaminationAndSurgeryFindings',
    title: '临床检查及手术所见',
    valueTestId: 'clinicalExaminationAndSurgeryFindings',
  },
  {
    key: 'labAndImagingExaminations',
    title: '检验和影像检查',
    valueTestId: 'labAndImagingExaminations',
  },
  {
    key: 'clinicalSubmissionRequirements',
    title: '临床送检要求',
    valueTestId: 'clinicalSubmissionRequirements',
  },
  {
    key: 'infectiousAndPastHistorySummary',
    title: '传染/既往信息摘要',
    valueTestId: 'infectiousAndPastHistorySummary',
  },
  {
    key: 'externalPathologyDiagnosis',
    title: '外院病理诊断',
    valueTestId: 'externalPathologyDiagnosis',
  },
];

const props = defineProps<{
  completionRemarks: string;
  detailSectionSaving?: boolean;
  loading?: boolean;
  materialSaving?: boolean;
  submitting?: boolean;
  workspace: null | TechnicalSpecimenRegistrationWorkspace;
}>();

const emit = defineEmits<{
  complete: [];
  'save-detail-sections': [detailSections: TechnicalSpecimenRegistrationDetailSections];
  'save-materials': [materials: SaveTechnicalSpecimenRegistrationMaterialItem[]];
  'update:completionRemarks': [value: string];
}>();

const editableMaterials = ref<SaveTechnicalSpecimenRegistrationMaterialItem[]>([]);
const activeDetailSectionKey = ref<'' | DetailSectionKey>('');
const editingDetailSectionValue = ref('');

watch(
  () => props.workspace?.materials,
  (materials) => {
    editableMaterials.value = (materials ?? []).map((material) => ({
      sourcePart: material.sourcePart,
      specimenId: material.specimenId,
      specimenName: material.specimenName,
      specimenType: material.specimenType,
    }));
  },
  { immediate: true },
);

watch(
  () => props.workspace?.detailSections,
  () => {
    cancelEditingDetailSection();
  },
);

function fieldValue(value: null | string | undefined) {
  return value?.trim() ? value : '-';
}

function normalizeDetailSectionValue(value: string) {
  const normalizedValue = value.trim();
  return normalizedValue ? normalizedValue : null;
}

function addMaterialRow() {
  editableMaterials.value = [
    ...editableMaterials.value,
    {
      sourcePart: '',
      specimenId: null,
      specimenName: '',
      specimenType: '',
    },
  ];
}

function removeMaterialRow(index: number) {
  editableMaterials.value = editableMaterials.value.filter(
    (_item, currentIndex) => currentIndex !== index,
  );
}

function saveMaterials() {
  emit(
    'save-materials',
    editableMaterials.value.map((item) => ({
      sourcePart: item.sourcePart ?? null,
      specimenId: item.specimenId ?? null,
      specimenName: item.specimenName ?? null,
      specimenType: item.specimenType ?? null,
    })),
  );
}

function beginEditingDetailSection(key: DetailSectionKey) {
  if (!props.workspace?.actionFlags.canSaveDetailSections) {
    return;
  }

  const currentValue = props.workspace.detailSections[key];
  activeDetailSectionKey.value = key;
  editingDetailSectionValue.value = currentValue ?? '';
  void nextTick(() => {
    const textarea = document.querySelector<HTMLTextAreaElement>(
      `[data-editor-key="${key}"] textarea`,
    );
    textarea?.focus();
    textarea?.setSelectionRange(
      textarea.value.length,
      textarea.value.length,
    );
  });
}

function cancelEditingDetailSection() {
  activeDetailSectionKey.value = '';
  editingDetailSectionValue.value = '';
}

function saveDetailSection() {
  if (!props.workspace || !activeDetailSectionKey.value) {
    return;
  }

  const key = activeDetailSectionKey.value;
  const nextDetailSections: TechnicalSpecimenRegistrationDetailSections = {
    ...props.workspace.detailSections,
    [key]: normalizeDetailSectionValue(editingDetailSectionValue.value),
  };
  emit('save-detail-sections', nextDetailSections);
}
</script>

<template>
  <section class="min-h-[760px] rounded-2xl border border-slate-200 bg-white shadow-sm">
    <template v-if="workspace">
      <div class="border-b border-slate-200 px-5 py-4">
        <div class="flex items-center justify-between gap-3">
          <div>
            <div class="text-base font-semibold text-slate-900">登记工作区</div>
            <p class="mt-1 text-xs text-slate-500">
              病理号 {{ fieldValue(workspace.basicInfo.pathologyNo) }}，当前状态
              {{ fieldValue(workspace.basicInfo.registrationStatus) }}
            </p>
          </div>
          <ElButton
            :disabled="!workspace.actionFlags.canCompleteRegistration"
            :loading="submitting"
            type="primary"
            @click="emit('complete')"
          >
            完成登记
          </ElButton>
        </div>
      </div>

      <div v-if="loading" class="px-5 py-10 text-center text-sm text-slate-500">
        正在加载工作台...
      </div>
      <div v-else class="space-y-5 px-5 py-5">
        <div class="grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm md:grid-cols-2 xl:grid-cols-3">
          <div>患者姓名：{{ fieldValue(workspace.basicInfo.patientName) }}</div>
          <div>性别：{{ fieldValue(workspace.basicInfo.patientGender) }}</div>
          <div>年龄：{{ fieldValue(workspace.basicInfo.patientAge) }}</div>
          <div>患者 ID：{{ fieldValue(workspace.basicInfo.patientId) }}</div>
          <div>住院号：{{ fieldValue(workspace.basicInfo.inpatientNo) }}</div>
          <div>申请单号：{{ fieldValue(workspace.basicInfo.applicationNo) }}</div>
          <div>申请科室：{{ fieldValue(workspace.basicInfo.submittingDepartmentName) }}</div>
          <div>申请医生：{{ fieldValue(workspace.basicInfo.submittingDoctorName) }}</div>
          <div>送检日期：{{ fieldValue(workspace.basicInfo.submissionDate) }}</div>
          <div>离体时间：{{ fieldValue(workspace.basicInfo.specimenRemovalTime) }}</div>
          <div>固定时间：{{ fieldValue(workspace.basicInfo.fixationTime) }}</div>
          <div>送检类型：{{ fieldValue(workspace.basicInfo.applicationType) }}</div>
        </div>

        <div class="grid gap-3 xl:grid-cols-2">
          <TechnicalSpecimenRegistrationEditableSectionCard
            v-for="item in DETAIL_SECTION_ITEMS"
            :key="item.key"
            :can-edit="workspace.actionFlags.canSaveDetailSections"
            :editing-value="
              activeDetailSectionKey === item.key ? editingDetailSectionValue : ''
            "
            :is-editing="activeDetailSectionKey === item.key"
            :saving="detailSectionSaving"
            :title="item.title"
            :value="fieldValue(workspace.detailSections[item.key])"
            :value-test-id="item.valueTestId"
            @activate="beginEditingDetailSection(item.key)"
            @cancel="cancelEditingDetailSection"
            @edit="beginEditingDetailSection(item.key)"
            @save="saveDetailSection"
            @update:editingValue="editingDetailSectionValue = $event"
          />
        </div>

        <article class="rounded-2xl border border-slate-200 p-4">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h3 class="text-sm font-semibold text-slate-900">材料表</h3>
              <p class="mt-1 text-xs text-slate-500">
                支持在技术登记阶段调整材料名称、类型和来源部位。
              </p>
            </div>
            <div class="flex gap-2">
              <ElButton plain @click="addMaterialRow">新增材料</ElButton>
              <ElButton
                :disabled="!workspace.actionFlags.canSaveMaterials"
                :loading="materialSaving"
                type="primary"
                @click="saveMaterials"
              >
                保存材料修改
              </ElButton>
            </div>
          </div>
          <div class="mt-4 overflow-x-auto">
            <table class="min-w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr class="text-left text-slate-500">
                  <th class="border-b border-slate-200 px-3 py-2">序号</th>
                  <th class="border-b border-slate-200 px-3 py-2">标本类型</th>
                  <th class="border-b border-slate-200 px-3 py-2">材料名称</th>
                  <th class="border-b border-slate-200 px-3 py-2">来源部位</th>
                  <th class="border-b border-slate-200 px-3 py-2">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(material, index) in editableMaterials"
                  :key="material.specimenId || `new-${index}`"
                  :data-testid="`material-row-${index}`"
                >
                  <td class="border-b border-slate-100 px-3 py-3">{{ index + 1 }}</td>
                  <td class="border-b border-slate-100 px-3 py-3">
                    <input
                      v-model="material.specimenType"
                      class="w-full rounded-lg border border-slate-200 px-3 py-2"
                      placeholder="标本类型"
                    />
                  </td>
                  <td class="border-b border-slate-100 px-3 py-3">
                    <input
                      v-model="material.specimenName"
                      class="w-full rounded-lg border border-slate-200 px-3 py-2"
                      placeholder="材料名称"
                    />
                  </td>
                  <td class="border-b border-slate-100 px-3 py-3">
                    <input
                      v-model="material.sourcePart"
                      class="w-full rounded-lg border border-slate-200 px-3 py-2"
                      placeholder="来源部位"
                    />
                  </td>
                  <td class="border-b border-slate-100 px-3 py-3">
                    <button
                      class="text-sm text-rose-500"
                      type="button"
                      @click="removeMaterialRow(index)"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>

        <article class="rounded-2xl border border-slate-200 p-4">
          <h3 class="text-sm font-semibold text-slate-900">检查项目</h3>
          <div v-if="workspace.checkItems.length > 0" class="mt-3 flex flex-wrap gap-2">
            <span
              v-for="item in workspace.checkItems"
              :key="`${item.sequenceNo}-${item.name}`"
              class="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600"
            >
              {{ item.sequenceNo }}. {{ item.name || '-' }}
            </span>
          </div>
          <ElEmpty v-else description="暂无检查项目" :image-size="48" />
        </article>

        <article class="rounded-2xl border border-slate-200 p-4">
          <h3 class="text-sm font-semibold text-slate-900">登记备注</h3>
          <textarea
            :value="completionRemarks"
            class="mt-3 min-h-[110px] w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"
            placeholder="补充技术登记备注（选填）"
            @input="emit('update:completionRemarks', ($event.target as HTMLTextAreaElement).value)"
          />
        </article>
      </div>
    </template>

    <div v-else class="flex min-h-[760px] items-center justify-center">
      <ElEmpty description="请选择左侧病例" />
    </div>
  </section>
</template>
