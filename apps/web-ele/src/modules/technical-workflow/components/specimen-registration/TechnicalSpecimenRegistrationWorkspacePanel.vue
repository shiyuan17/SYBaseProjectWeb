<script setup lang="ts">
import type { ApplicationRegistrationWorkbenchRecord } from '#/modules/specimen-workflow/types/application-registration-workbench';
import type { ApplicationDetailView } from '#/modules/specimen-workflow/types/specimen-workflow';

import type {
  SaveTechnicalSpecimenRegistrationMaterialItem,
  TechnicalSpecimenRegistrationDetailSections,
  TechnicalSpecimenRegistrationMaterial,
  TechnicalSpecimenRegistrationWorkspace,
} from '../../types/technical-workflow';

import { computed, nextTick, ref, watch } from 'vue';

import { ElButton, ElEmpty } from 'element-plus';

import { formatApplicationType } from '#/modules/specimen-workflow/utils/format';

import {
  formatPendingPathologyNo,
  formatSpecimenRegistrationStatus,
} from '../../utils/format';
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
const CONSULTATION_APPLICATION_TYPES = new Set([
  'CONSULTATION',
  'CYTOLOGY_CONSULTATION',
  'DIFFICULT_CONSULTATION',
]);
const CONSULTATION_MATERIAL_TYPE_OPTIONS = [
  'EBER',
  'HE',
  'IHC',
  '白片',
  '玻片',
  '蜡块',
  '特染',
];
const SPECIMEN_TYPE_OPTIONS = ['活体', '细胞学'];
const SPECIMEN_SIZE_OPTIONS = ['小标本', '大标本'];
const DEFAULT_SPECIMEN_TYPE = '活体';
const DEFAULT_SPECIMEN_SIZE = '小标本';
const DEFAULT_TISSUE_COUNT = 1;
const DEFAULT_EVALUATION_ITEMS = [
  '福尔马林未完全浸泡',
  '密封不严',
  '切面质量低',
];

type EditableMaterial = SaveTechnicalSpecimenRegistrationMaterialItem &
  Pick<
    TechnicalSpecimenRegistrationMaterial,
    | 'sequenceNo'
    | 'specimenBarcode'
    | 'verificationCompletedAt'
    | 'verificationStatus'
    | 'verifiedByName'
  >;

type ConsultationTab = 'consultation' | 'routine';

type ConsultationFormValue = {
  clinicalDiagnosis: string;
  consultationRequirement: string;
  externalConsultationId: string;
  materialType: string;
  quantity: number;
  sourceHospitalName: string;
  sourcePart: string;
};

type ConsultationItemSavePayload = {
  consultationFields: ConsultationFormValue;
  materials: SaveTechnicalSpecimenRegistrationMaterialItem[];
};

const props = defineProps<{
  consultationApplicationDetail?: ApplicationDetailView | null;
  consultationContextLoading?: boolean;
  consultationWorkbench?: ApplicationRegistrationWorkbenchRecord | null;
  detailSectionSaving?: boolean;
  loading?: boolean;
  materialSaving?: boolean;
  materialVerificationSaving?: boolean;
  submitting?: boolean;
  workspace: null | TechnicalSpecimenRegistrationWorkspace;
}>();

const emit = defineEmits<{
  'cancel-material-verification': [specimenId: string];
  complete: [];
  'print-material-label': [material: EditableMaterial];
  'save-consultation-item': [payload: ConsultationItemSavePayload];
  'save-detail-sections': [detailSections: TechnicalSpecimenRegistrationDetailSections];
  'save-materials': [materials: SaveTechnicalSpecimenRegistrationMaterialItem[]];
  'verify-material': [specimenId: string];
}>();

const editableMaterials = ref<EditableMaterial[]>([]);
const activeSpecimenTab = ref<ConsultationTab>('routine');
const consultationDialogVisible = ref(false);
const consultationEditingIndex = ref<null | number>(null);
const consultationForm = ref<ConsultationFormValue>({
  clinicalDiagnosis: '',
  consultationRequirement: '',
  externalConsultationId: '',
  materialType: '',
  quantity: DEFAULT_TISSUE_COUNT,
  sourceHospitalName: '',
  sourcePart: '',
});
const selectedMaterialIndex = ref(-1);
const evaluationDialogVisible = ref(false);
const customEvaluationText = ref('');
const activeDetailSectionKey = ref<'' | DetailSectionKey>('');
const editingDetailSectionValue = ref('');

const isConsultationCase = computed(() =>
  CONSULTATION_APPLICATION_TYPES.has(
    props.workspace?.basicInfo.applicationType?.trim() ?? '',
  ),
);
const selectedMaterial = computed(
  () => editableMaterials.value[selectedMaterialIndex.value] ?? null,
);

watch(
  () => props.workspace?.materials,
  (materials) => {
    editableMaterials.value = (materials ?? []).map((material) => ({
      evaluationItems: normalizeEvaluationItems(material.evaluationItems),
      frozen: material.frozen ?? false,
      sourcePart: material.sourcePart,
      sequenceNo: material.sequenceNo,
      specimenBarcode: material.specimenBarcode ?? null,
      specimenId: material.specimenId,
      specimenSize: material.specimenSize || DEFAULT_SPECIMEN_SIZE,
      specimenName: material.specimenName,
      specimenType: material.specimenType || DEFAULT_SPECIMEN_TYPE,
      tissueCount: normalizeTissueCount(material.tissueCount),
      verificationCompletedAt: material.verificationCompletedAt ?? null,
      verificationStatus: material.verificationStatus ?? 'UNVERIFIED',
      verifiedByName: material.verifiedByName ?? null,
    }));
    selectedMaterialIndex.value = -1;
    evaluationDialogVisible.value = false;
    customEvaluationText.value = '';
  },
  { immediate: true },
);

watch(
  () => props.workspace?.basicInfo.applicationType,
  (applicationType) => {
    activeSpecimenTab.value = CONSULTATION_APPLICATION_TYPES.has(
      applicationType?.trim() ?? '',
    )
      ? 'consultation'
      : 'routine';
    consultationDialogVisible.value = false;
    consultationEditingIndex.value = null;
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

function normalizeTissueCount(value: null | number | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_TISSUE_COUNT;
  }
  return Math.max(1, Math.trunc(value));
}

function normalizeEvaluationItems(items: string[] | undefined) {
  return [...new Set((items ?? []).map((item) => item.trim()).filter(Boolean))];
}

function trimOrEmpty(value: null | string | undefined) {
  return value?.trim() ?? '';
}

function mapEditableMaterialToSaveItem(
  item: EditableMaterial,
): SaveTechnicalSpecimenRegistrationMaterialItem {
  return {
    evaluationItems: normalizeEvaluationItems(item.evaluationItems),
    frozen: item.frozen ?? false,
    sourcePart: item.sourcePart ?? null,
    specimenId: item.specimenId ?? null,
    specimenSize: item.specimenSize || DEFAULT_SPECIMEN_SIZE,
    specimenName: item.specimenName ?? null,
    specimenType: item.specimenType || DEFAULT_SPECIMEN_TYPE,
    tissueCount: normalizeTissueCount(item.tissueCount),
  };
}

function buildConsultationForm(
  material?: EditableMaterial,
): ConsultationFormValue {
  return {
    clinicalDiagnosis: trimOrEmpty(
      props.consultationWorkbench?.patientInfo.clinicalDiagnosis ??
        props.consultationApplicationDetail?.clinicalDiagnosis,
    ),
    consultationRequirement: trimOrEmpty(
      props.consultationWorkbench?.patientInfo.deliveryRequirement,
    ),
    externalConsultationId: trimOrEmpty(
      props.consultationApplicationDetail?.externalOrderNo,
    ),
    materialType: trimOrEmpty(material?.specimenName),
    quantity: normalizeTissueCount(material?.tissueCount),
    sourceHospitalName: trimOrEmpty(
      props.consultationApplicationDetail?.sourceHospitalName,
    ),
    sourcePart: trimOrEmpty(material?.sourcePart),
  };
}

function addMaterialRow() {
  editableMaterials.value = [
    ...editableMaterials.value,
    {
      evaluationItems: [],
      frozen: false,
      sourcePart: '',
      sequenceNo: editableMaterials.value.length + 1,
      specimenBarcode: null,
      specimenId: null,
      specimenSize: DEFAULT_SPECIMEN_SIZE,
      specimenName: '',
      specimenType: DEFAULT_SPECIMEN_TYPE,
      tissueCount: DEFAULT_TISSUE_COUNT,
      verificationCompletedAt: null,
      verificationStatus: 'UNVERIFIED',
      verifiedByName: null,
    },
  ];
  selectedMaterialIndex.value = editableMaterials.value.length - 1;
}

function removeMaterialRow(index: number) {
  editableMaterials.value = editableMaterials.value.filter(
    (_item, currentIndex) => currentIndex !== index,
  );
  if (selectedMaterialIndex.value === index) {
    selectedMaterialIndex.value = -1;
    evaluationDialogVisible.value = false;
    return;
  }
  if (selectedMaterialIndex.value > index) {
    selectedMaterialIndex.value -= 1;
  }
}

function saveMaterials() {
  emit(
    'save-materials',
    editableMaterials.value.map(mapEditableMaterialToSaveItem),
  );
}

function formatVerificationStatus(status: null | string | undefined) {
  if (status === 'VERIFIED') {
    return '已核对';
  }
  if (status === 'VERIFYING') {
    return '核对中';
  }
  return '未核对';
}

function verificationStatusClass(status: null | string | undefined) {
  if (status === 'VERIFIED') {
    return 'bg-emerald-50 text-emerald-700';
  }
  if (status === 'VERIFYING') {
    return 'bg-amber-50 text-amber-700';
  }
  return 'bg-slate-100 text-slate-500';
}

function selectedSpecimenId() {
  return selectedMaterial.value?.specimenId?.trim() || '';
}

function printSelectedMaterialLabel() {
  if (!selectedMaterial.value?.specimenId) {
    return;
  }
  emit('print-material-label', selectedMaterial.value);
}

function verifySelectedMaterial() {
  const specimenId = selectedSpecimenId();
  if (!specimenId) {
    return;
  }
  emit('verify-material', specimenId);
}

function cancelSelectedMaterialVerification() {
  const specimenId = selectedSpecimenId();
  if (!specimenId) {
    return;
  }
  emit('cancel-material-verification', specimenId);
}

function openEvaluationDialog() {
  if (!selectedMaterial.value) {
    return;
  }
  customEvaluationText.value = '';
  evaluationDialogVisible.value = true;
}

function toggleEvaluationItem(item: string, checked: boolean) {
  const material = selectedMaterial.value;
  if (!material) {
    return;
  }
  const currentItems = normalizeEvaluationItems(material.evaluationItems);
  material.evaluationItems = checked
    ? normalizeEvaluationItems([...currentItems, item])
    : currentItems.filter((currentItem) => currentItem !== item);
}

function isEvaluationItemChecked(item: string) {
  return normalizeEvaluationItems(selectedMaterial.value?.evaluationItems).includes(
    item,
  );
}

function addCustomEvaluationItem() {
  const normalizedText = customEvaluationText.value.trim();
  if (!normalizedText || !selectedMaterial.value) {
    return;
  }
  selectedMaterial.value.evaluationItems = normalizeEvaluationItems([
    ...(selectedMaterial.value.evaluationItems ?? []),
    normalizedText,
  ]);
  customEvaluationText.value = '';
}

function removeEvaluationItem(item: string) {
  const material = selectedMaterial.value;
  if (!material) {
    return;
  }
  material.evaluationItems = normalizeEvaluationItems(
    material.evaluationItems,
  ).filter((currentItem) => currentItem !== item);
}

function openConsultationCreateDialog() {
  consultationEditingIndex.value = null;
  consultationForm.value = buildConsultationForm();
  consultationDialogVisible.value = true;
}

function openConsultationEditDialog(index: number) {
  const material = editableMaterials.value[index];
  if (!material) {
    return;
  }
  consultationEditingIndex.value = index;
  consultationForm.value = buildConsultationForm(material);
  consultationDialogVisible.value = true;
}

function saveConsultationItem() {
  const materialType = consultationForm.value.materialType.trim();
  const clinicalDiagnosis = consultationForm.value.clinicalDiagnosis.trim();
  if (!materialType || !clinicalDiagnosis) {
    return;
  }

  const baseMaterial =
    consultationEditingIndex.value === null
      ? {
          evaluationItems: [],
          frozen: false,
          sourcePart: '',
          sequenceNo: editableMaterials.value.length + 1,
          specimenBarcode: null,
          specimenId: null,
          specimenSize: DEFAULT_SPECIMEN_SIZE,
          specimenName: '',
          specimenType: DEFAULT_SPECIMEN_TYPE,
          tissueCount: DEFAULT_TISSUE_COUNT,
          verificationCompletedAt: null,
          verificationStatus: 'UNVERIFIED',
          verifiedByName: null,
        }
      : editableMaterials.value[consultationEditingIndex.value];

  if (!baseMaterial) {
    return;
  }

  const nextMaterials = editableMaterials.value.slice();
  const nextMaterial: EditableMaterial = {
    ...baseMaterial,
    sourcePart: trimOrEmpty(consultationForm.value.sourcePart),
    specimenName: materialType,
    tissueCount: normalizeTissueCount(consultationForm.value.quantity),
  };

  if (consultationEditingIndex.value === null) {
    nextMaterials.push(nextMaterial);
  } else {
    nextMaterials.splice(consultationEditingIndex.value, 1, nextMaterial);
  }

  emit('save-consultation-item', {
    consultationFields: {
      ...consultationForm.value,
      clinicalDiagnosis,
      consultationRequirement:
        consultationForm.value.consultationRequirement.trim(),
      externalConsultationId:
        consultationForm.value.externalConsultationId.trim(),
      materialType,
      quantity: normalizeTissueCount(consultationForm.value.quantity),
      sourceHospitalName: consultationForm.value.sourceHospitalName.trim(),
      sourcePart: consultationForm.value.sourcePart.trim(),
    },
    materials: nextMaterials.map(mapEditableMaterialToSaveItem),
  });
  consultationDialogVisible.value = false;
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
              病理号 {{ formatPendingPathologyNo(workspace.basicInfo.pathologyNo) }}，当前状态
              {{ formatSpecimenRegistrationStatus(workspace.basicInfo.registrationStatus) }}
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
      <div v-else class="space-y-3 px-5 py-5">
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
          <div>送检类型：{{ formatApplicationType(workspace.basicInfo.applicationType) }}</div>
        </div>

        <div class="grid gap-2 md:grid-cols-2 2xl:grid-cols-3">
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
            <div class="min-w-0">
              <h3 class="text-sm font-semibold text-slate-900">标本表</h3>
              <div class="mt-2 flex flex-wrap gap-2">
                <button
                  :class="[
                    'rounded-full border px-3 py-1 text-xs font-medium transition',
                    activeSpecimenTab === 'routine'
                      ? 'border-sky-500 bg-sky-500 text-white'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-sky-200 hover:text-sky-600',
                  ]"
                  data-testid="specimen-tab-routine"
                  type="button"
                  @click="activeSpecimenTab = 'routine'"
                >
                  常规
                </button>
                <button
                  :class="[
                    'rounded-full border px-3 py-1 text-xs font-medium transition',
                    activeSpecimenTab === 'consultation'
                      ? 'border-sky-500 bg-sky-500 text-white'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-sky-200 hover:text-sky-600',
                  ]"
                  data-testid="specimen-tab-consultation"
                  type="button"
                  @click="activeSpecimenTab = 'consultation'"
                >
                  会诊
                </button>
              </div>
            </div>
            <div
              v-if="activeSpecimenTab === 'consultation'"
              class="flex flex-wrap justify-end gap-2"
            >
              <ElButton
                :disabled="props.consultationContextLoading"
                plain
                @click="openConsultationCreateDialog"
              >
                新增会诊项
              </ElButton>
            </div>
            <div v-else class="flex flex-wrap justify-end gap-2">
              <ElButton plain @click="addMaterialRow">新增标本</ElButton>
              <ElButton
                :disabled="!selectedMaterial?.specimenId"
                plain
                @click="printSelectedMaterialLabel"
              >
                打印标签
              </ElButton>
              <ElButton
                :disabled="
                  !selectedMaterial?.specimenId ||
                  selectedMaterial.verificationStatus === 'VERIFIED'
                "
                :loading="materialVerificationSaving"
                plain
                @click="verifySelectedMaterial"
              >
                标本核对
              </ElButton>
              <ElButton
                :disabled="
                  !selectedMaterial?.specimenId ||
                  selectedMaterial.verificationStatus === 'UNVERIFIED'
                "
                :loading="materialVerificationSaving"
                plain
                @click="cancelSelectedMaterialVerification"
              >
                取消核对
              </ElButton>
              <ElButton
                :disabled="!selectedMaterial"
                plain
                @click="openEvaluationDialog"
              >
                评价
              </ElButton>
              <ElButton
                :disabled="!workspace.actionFlags.canSaveMaterials"
                :loading="materialSaving"
                type="primary"
                @click="saveMaterials"
              >
                保存标本修改
              </ElButton>
            </div>
          </div>
          <div
            v-if="activeSpecimenTab === 'consultation' && !isConsultationCase"
            class="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500"
          >
            当前病例不是会诊类型，请切换到常规 tab 查看标本列表。
          </div>
          <div
            v-else-if="activeSpecimenTab === 'consultation'"
            class="mt-4 overflow-x-auto"
          >
            <table
              class="min-w-full border-separate border-spacing-0 text-sm"
              data-testid="consultation-material-table"
            >
              <thead>
                <tr class="text-left text-slate-500">
                  <th class="border-b border-slate-200 px-3 py-2">序号</th>
                  <th class="border-b border-slate-200 px-3 py-2">材料类型</th>
                  <th class="border-b border-slate-200 px-3 py-2">数量</th>
                  <th class="border-b border-slate-200 px-3 py-2">核对状态</th>
                  <th class="border-b border-slate-200 px-3 py-2">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(material, index) in editableMaterials"
                  :key="material.specimenId || `consultation-${index}`"
                  :data-testid="`consultation-material-row-${index}`"
                >
                  <td class="border-b border-slate-100 px-3 py-3">{{ index + 1 }}</td>
                  <td class="border-b border-slate-100 px-3 py-3">
                    {{ fieldValue(material.specimenName) }}
                  </td>
                  <td class="border-b border-slate-100 px-3 py-3">
                    {{ normalizeTissueCount(material.tissueCount) }}
                  </td>
                  <td class="border-b border-slate-100 px-3 py-3">
                    <span
                      class="rounded-full px-2 py-0.5 text-xs font-medium"
                      :class="verificationStatusClass(material.verificationStatus)"
                    >
                      {{ formatVerificationStatus(material.verificationStatus) }}
                    </span>
                  </td>
                  <td class="border-b border-slate-100 px-3 py-3">
                    <div class="flex flex-wrap gap-2">
                      <button
                        class="text-sm text-sky-600"
                        type="button"
                        @click="openConsultationEditDialog(index)"
                      >
                        编辑
                      </button>
                      <button
                        class="text-sm text-emerald-600 disabled:cursor-not-allowed disabled:text-slate-300"
                        :disabled="
                          !material.specimenId ||
                          material.verificationStatus === 'VERIFIED'
                        "
                        type="button"
                        @click="emit('verify-material', material.specimenId || '')"
                      >
                        核对
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="editableMaterials.length === 0">
                  <td
                    class="px-3 py-8 text-center text-sm text-slate-400"
                    colspan="5"
                  >
                    暂无会诊项
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="mt-4 overflow-x-auto">
            <table
              class="min-w-[1180px] border-separate border-spacing-0 text-sm whitespace-nowrap"
              data-testid="specimen-material-table"
            >
              <thead>
                <tr class="text-left text-slate-500">
                  <th class="border-b border-slate-200 px-3 py-2">选择</th>
                  <th class="border-b border-slate-200 px-3 py-2">序号</th>
                  <th class="border-b border-slate-200 px-3 py-2">标本名称</th>
                  <th class="border-b border-slate-200 px-3 py-2">类型</th>
                  <th class="border-b border-slate-200 px-3 py-2">组织数量</th>
                  <th class="border-b border-slate-200 px-3 py-2">来源部位</th>
                  <th class="border-b border-slate-200 px-3 py-2">标本大小</th>
                  <th class="border-b border-slate-200 px-3 py-2">是否冰冻</th>
                  <th class="border-b border-slate-200 px-3 py-2">核对状态</th>
                  <th class="border-b border-slate-200 px-3 py-2">评价</th>
                  <th class="border-b border-slate-200 px-3 py-2">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(material, index) in editableMaterials"
                  :key="material.specimenId || `new-${index}`"
                  :data-testid="`material-row-${index}`"
                >
                  <td class="border-b border-slate-100 px-3 py-3">
                    <input
                      v-model="selectedMaterialIndex"
                      :aria-label="`选择第 ${index + 1} 个标本`"
                      :value="index"
                      name="technical-registration-material"
                      type="radio"
                    />
                  </td>
                  <td class="border-b border-slate-100 px-3 py-3">{{ index + 1 }}</td>
                  <td class="border-b border-slate-100 px-3 py-3">
                    <input
                      v-model="material.specimenName"
                      class="min-w-[150px] rounded-lg border border-slate-200 px-3 py-2"
                      placeholder="标本名称"
                    />
                  </td>
                  <td class="border-b border-slate-100 px-3 py-3">
                    <select
                      v-model="material.specimenType"
                      class="min-w-[110px] rounded-lg border border-slate-200 px-3 py-2"
                    >
                      <option
                        v-for="option in SPECIMEN_TYPE_OPTIONS"
                        :key="option"
                        :value="option"
                      >
                        {{ option }}
                      </option>
                    </select>
                  </td>
                  <td class="border-b border-slate-100 px-3 py-3">
                    <input
                      v-model.number="material.tissueCount"
                      class="w-24 rounded-lg border border-slate-200 px-3 py-2"
                      min="1"
                      placeholder="1"
                      type="number"
                    />
                  </td>
                  <td class="border-b border-slate-100 px-3 py-3">
                    <input
                      v-model="material.sourcePart"
                      class="min-w-[140px] rounded-lg border border-slate-200 px-3 py-2"
                      placeholder="来源部位"
                    />
                  </td>
                  <td class="border-b border-slate-100 px-3 py-3">
                    <select
                      v-model="material.specimenSize"
                      class="min-w-[110px] rounded-lg border border-slate-200 px-3 py-2"
                    >
                      <option
                        v-for="option in SPECIMEN_SIZE_OPTIONS"
                        :key="option"
                        :value="option"
                      >
                        {{ option }}
                      </option>
                    </select>
                  </td>
                  <td class="border-b border-slate-100 px-3 py-3">
                    <label class="inline-flex items-center gap-2 text-slate-600">
                      <input v-model="material.frozen" type="checkbox" />
                      <span>{{ material.frozen ? '是' : '否' }}</span>
                    </label>
                  </td>
                  <td class="border-b border-slate-100 px-3 py-3">
                    <div class="flex min-w-[130px] flex-col items-start gap-1">
                      <span
                        class="rounded-full px-2 py-0.5 text-xs font-medium"
                        :class="verificationStatusClass(material.verificationStatus)"
                      >
                        {{ formatVerificationStatus(material.verificationStatus) }}
                      </span>
                    </div>
                  </td>
                  <td class="border-b border-slate-100 px-3 py-3 text-slate-600">
                    <span v-if="material.evaluationItems?.length">
                      {{ material.evaluationItems.join('、') }}
                    </span>
                    <span v-else class="text-slate-400">未评价</span>
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

        <div
          v-if="consultationDialogVisible"
          class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4"
          data-testid="consultation-item-dialog"
        >
          <div class="w-full max-w-[680px] rounded-xl bg-white p-5 shadow-xl">
            <div class="flex items-start justify-between gap-4">
              <div>
                <h3 class="text-base font-semibold text-slate-900">
                  {{ consultationEditingIndex === null ? '新增会诊项' : '编辑会诊项' }}
                </h3>
                <p class="mt-1 text-xs text-slate-500">
                  会诊项使用紧凑列表展示，详细信息集中在弹窗中维护。
                </p>
              </div>
              <button
                class="text-sm text-slate-500"
                type="button"
                @click="consultationDialogVisible = false"
              >
                关闭
              </button>
            </div>

            <div class="mt-4 grid gap-3 md:grid-cols-2">
              <label class="text-sm text-slate-600">
                <span class="mb-1 block">材料类型</span>
                <select
                  v-model="consultationForm.materialType"
                  class="w-full rounded-lg border border-slate-200 px-3 py-2"
                  data-testid="consultation-material-type"
                >
                  <option value="">请选择材料类型</option>
                  <option
                    v-for="option in CONSULTATION_MATERIAL_TYPE_OPTIONS"
                    :key="option"
                    :value="option"
                  >
                    {{ option }}
                  </option>
                </select>
              </label>
              <label class="text-sm text-slate-600">
                <span class="mb-1 block">材料数量</span>
                <input
                  v-model.number="consultationForm.quantity"
                  class="w-full rounded-lg border border-slate-200 px-3 py-2"
                  data-testid="consultation-quantity"
                  min="1"
                  type="number"
                />
              </label>
              <label class="text-sm text-slate-600">
                <span class="mb-1 block">来源部位</span>
                <input
                  v-model="consultationForm.sourcePart"
                  class="w-full rounded-lg border border-slate-200 px-3 py-2"
                  data-testid="consultation-source-part"
                  placeholder="请输入来源部位"
                />
              </label>
              <label class="text-sm text-slate-600">
                <span class="mb-1 block">来源医院</span>
                <input
                  v-model="consultationForm.sourceHospitalName"
                  class="w-full rounded-lg border border-slate-200 px-3 py-2"
                  data-testid="consultation-source-hospital"
                  placeholder="请输入来源医院"
                />
              </label>
              <label class="text-sm text-slate-600">
                <span class="mb-1 block">外院会诊 ID</span>
                <input
                  v-model="consultationForm.externalConsultationId"
                  class="w-full rounded-lg border border-slate-200 px-3 py-2"
                  data-testid="consultation-external-id"
                  placeholder="请输入外院会诊 ID"
                />
              </label>
              <label class="text-sm text-slate-600">
                <span class="mb-1 block">会诊要求</span>
                <input
                  v-model="consultationForm.consultationRequirement"
                  class="w-full rounded-lg border border-slate-200 px-3 py-2"
                  data-testid="consultation-requirement"
                  placeholder="请输入会诊要求"
                />
              </label>
              <label class="text-sm text-slate-600 md:col-span-2">
                <span class="mb-1 block">临床诊断</span>
                <textarea
                  v-model="consultationForm.clinicalDiagnosis"
                  class="min-h-[96px] w-full rounded-lg border border-slate-200 px-3 py-2"
                  data-testid="consultation-clinical-diagnosis"
                  placeholder="请输入临床诊断"
                />
              </label>
            </div>

            <div class="mt-5 flex justify-end gap-2">
              <ElButton plain @click="consultationDialogVisible = false">
                取消
              </ElButton>
              <ElButton
                :disabled="
                  !consultationForm.materialType.trim() ||
                  !consultationForm.clinicalDiagnosis.trim()
                "
                :loading="materialSaving"
                type="primary"
                @click="saveConsultationItem"
              >
                保存会诊项
              </ElButton>
            </div>
          </div>
        </div>

        <div
          v-if="evaluationDialogVisible && selectedMaterial"
          class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4"
          data-testid="material-evaluation-dialog"
        >
          <div class="w-full max-w-[560px] rounded-xl bg-white p-5 shadow-xl">
            <div class="flex items-start justify-between gap-4">
              <div>
                <h3 class="text-base font-semibold text-slate-900">标本评价</h3>
                <p class="mt-1 text-xs text-slate-500">
                  {{ selectedMaterial.specimenName || '未命名标本' }}
                </p>
              </div>
              <button
                class="text-sm text-slate-500"
                type="button"
                @click="evaluationDialogVisible = false"
              >
                关闭
              </button>
            </div>
            <div class="mt-4 space-y-3">
              <label
                v-for="item in DEFAULT_EVALUATION_ITEMS"
                :key="item"
                class="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
              >
                <input
                  :checked="isEvaluationItemChecked(item)"
                  :data-testid="`evaluation-option-${item}`"
                  type="checkbox"
                  @change="
                    toggleEvaluationItem(
                      item,
                      ($event.target as HTMLInputElement).checked,
                    )
                  "
                />
                <span>{{ item }}</span>
              </label>
            </div>
            <div class="mt-4 flex gap-2">
              <input
                v-model="customEvaluationText"
                class="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                data-testid="custom-evaluation-input"
                placeholder="添加自定义评价项"
                @keydown.enter.prevent="addCustomEvaluationItem"
              />
              <ElButton plain @click="addCustomEvaluationItem">添加</ElButton>
            </div>
            <div
              v-if="selectedMaterial.evaluationItems?.length"
              class="mt-4 flex flex-wrap gap-2"
            >
              <button
                v-for="item in selectedMaterial.evaluationItems"
                :key="item"
                class="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
                type="button"
                @click="removeEvaluationItem(item)"
              >
                {{ item }} ×
              </button>
            </div>
            <div class="mt-5 flex justify-end">
              <ElButton type="primary" @click="evaluationDialogVisible = false">
                确定
              </ElButton>
            </div>
          </div>
        </div>

        <article class="rounded-2xl border border-slate-200 p-4">
          <h3 class="text-sm font-semibold text-slate-900">检查列表</h3>
          <div v-if="workspace.checkItems.length > 0" class="mt-4 overflow-x-auto">
            <table class="min-w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr class="text-left text-slate-500">
                  <th class="border-b border-slate-200 px-3 py-2">序号</th>
                  <th class="border-b border-slate-200 px-3 py-2">病理号</th>
                  <th class="border-b border-slate-200 px-3 py-2">类型</th>
                  <th class="border-b border-slate-200 px-3 py-2">检查项目</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(item, index) in workspace.checkItems"
                  :key="`${item.sequenceNo}-${item.name}`"
                >
                  <td class="border-b border-slate-100 px-3 py-3">
                    {{ item.sequenceNo || index + 1 }}
                  </td>
                  <td class="border-b border-slate-100 px-3 py-3">
                    {{ formatPendingPathologyNo(workspace.basicInfo.pathologyNo) }}
                  </td>
                  <td class="border-b border-slate-100 px-3 py-3">
                    {{ formatApplicationType(workspace.basicInfo.applicationType) }}
                  </td>
                  <td class="border-b border-slate-100 px-3 py-3">
                    {{ fieldValue(item.name) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <ElEmpty v-else description="暂无检查项目" :image-size="48" />
        </article>
      </div>
    </template>

    <div v-else class="flex min-h-[760px] items-center justify-center">
      <ElEmpty description="请选择左侧病例" />
    </div>
  </section>
</template>
