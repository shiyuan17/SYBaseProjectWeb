<script setup lang="ts">
import type {
  SaveTechnicalSpecimenRegistrationMaterialItem,
  TechnicalSpecimenRegistrationDetailSections,
  TechnicalSpecimenRegistrationMaterial,
  TechnicalSpecimenRegistrationWorkspace,
} from '../../types/technical-workflow';

import type { ApplicationRegistrationWorkbenchRecord } from '#/modules/specimen-workflow/types/application-registration-workbench';
import type { ApplicationDetailView } from '#/modules/specimen-workflow/types/specimen-workflow';

import { computed, nextTick, ref, watch } from 'vue';

import { UserRoundPen } from '@vben/icons';

import { ElButton, ElEmpty } from 'element-plus';

import { APPLICATION_TYPE_OPTIONS } from '#/modules/specimen-workflow/constants';
import {
  buildSections,
  buildSummaryItems,
} from '#/modules/specimen-workflow/utils/application-registration-patient-panel';
import { formatApplicationType } from '#/modules/specimen-workflow/utils/format';

import {
  formatPendingPathologyNo,
  formatRegistrationWorkspacePathologyNo,
} from '../../utils/format';
import {
  isTechnicalRegistrationConsultationApplicationType,
  isTechnicalRegistrationPathologyNoPreview,
  resolveTechnicalRegistrationApplicationType,
} from '../../utils/specimen-registration-application';
import TechnicalSpecimenRegistrationEditableSectionCard from './TechnicalSpecimenRegistrationEditableSectionCard.vue';

type DetailSectionKey = keyof TechnicalSpecimenRegistrationDetailSections;

const props = defineProps<{
  consultationApplicationDetail?: ApplicationDetailView | null;
  consultationContextLoading?: boolean;
  consultationWorkbench?: ApplicationRegistrationWorkbenchRecord | null;
  detailSectionSaving?: boolean;
  loading?: boolean;
  materialSaving?: boolean;
  materialVerificationSaving?: boolean;
  pathologyNoDraft?: null | string;
  selectedApplicationType?: null | string;
  submitting?: boolean;
  workspace: null | TechnicalSpecimenRegistrationWorkspace;
}>();
const emit = defineEmits<{
  cancelMaterialVerification: [specimenId: string];
  complete: [];
  printMaterialLabel: [material: EditableMaterial];
  saveConsultationItem: [payload: ConsultationItemSavePayload];
  saveDetailSections: [
    detailSections: TechnicalSpecimenRegistrationDetailSections,
  ];
  saveMaterials: [materials: SaveTechnicalSpecimenRegistrationMaterialItem[]];
  'update:pathologyNoDraft': [value: string];
  'update:selectedApplicationType': [value: string];
  verifyMaterial: [specimenId: string];
}>();
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

type EditableMaterial = Pick<
  TechnicalSpecimenRegistrationMaterial,
  | 'sequenceNo'
  | 'specimenBarcode'
  | 'verificationCompletedAt'
  | 'verificationStatus'
  | 'verifiedByName'
> &
  SaveTechnicalSpecimenRegistrationMaterialItem;

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

const registrationApplicationType = computed(() =>
  resolveTechnicalRegistrationApplicationType(
    props.selectedApplicationType?.trim() ||
      props.workspace?.basicInfo.applicationType?.trim() ||
      '',
  ),
);
const isConsultationCase = computed(() =>
  isTechnicalRegistrationConsultationApplicationType(
    registrationApplicationType.value,
  ),
);
const registrationTypeOptions = APPLICATION_TYPE_OPTIONS;
const selectedMaterial = computed(
  () => editableMaterials.value[selectedMaterialIndex.value] ?? null,
);
const applicationSummaryItems = computed(() =>
  props.consultationWorkbench
    ? buildSummaryItems(props.consultationWorkbench)
    : [],
);
const applicationSections = computed(() =>
  props.consultationWorkbench
    ? buildSections(props.consultationWorkbench, {
        buildingLabel: props.consultationWorkbench.surgeryInfo.buildingId || '',
        roomLabel: props.consultationWorkbench.surgeryInfo.roomId || '',
      })
    : [],
);
const workspaceHeaderPathologyNo = computed(() => {
  const existingPathologyNo = props.workspace?.basicInfo.pathologyNo;
  if (!existingPathologyNo?.trim()) {
    return null;
  }
  if (
    isTechnicalRegistrationPathologyNoPreview({
      applicationType: registrationApplicationType.value,
      existingPathologyNo,
    })
  ) {
    return null;
  }
  return existingPathologyNo;
});

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
  () => registrationApplicationType.value,
  (applicationType) => {
    activeSpecimenTab.value =
      isTechnicalRegistrationConsultationApplicationType(applicationType)
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
  return value?.trim() || '-';
}

function normalizeDetailSectionValue(value: string) {
  const normalizedValue = value.trim();
  return normalizedValue || null;
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
    'saveMaterials',
    editableMaterials.value.map((item) => mapEditableMaterialToSaveItem(item)),
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
  return 'bg-accent text-muted-foreground';
}

function selectedSpecimenId() {
  return selectedMaterial.value?.specimenId?.trim() || '';
}

function printSelectedMaterialLabel() {
  if (!selectedMaterial.value?.specimenId) {
    return;
  }
  emit('printMaterialLabel', selectedMaterial.value);
}

function verifySelectedMaterial() {
  const specimenId = selectedSpecimenId();
  if (!specimenId) {
    return;
  }
  emit('verifyMaterial', specimenId);
}

function cancelSelectedMaterialVerification() {
  const specimenId = selectedSpecimenId();
  if (!specimenId) {
    return;
  }
  emit('cancelMaterialVerification', specimenId);
}

function openEvaluationDialog() {
  if (!selectedMaterial.value) {
    return;
  }
  customEvaluationText.value = '';
  evaluationDialogVisible.value = true;
}

function openEvaluationDialogForIndex(index: number) {
  const material = editableMaterials.value[index];
  if (!material) {
    return;
  }
  selectedMaterialIndex.value = index;
  openEvaluationDialog();
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
  return normalizeEvaluationItems(
    selectedMaterial.value?.evaluationItems,
  ).includes(item);
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

  const nextMaterials = [...editableMaterials.value];
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

  emit('saveConsultationItem', {
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
    materials: nextMaterials.map((item) => mapEditableMaterialToSaveItem(item)),
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
    textarea?.setSelectionRange(textarea.value.length, textarea.value.length);
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
  emit('saveDetailSections', nextDetailSections);
}

function selectRegistrationApplicationType(value: string) {
  emit(
    'update:selectedApplicationType',
    resolveTechnicalRegistrationApplicationType(value),
  );
}

function updatePathologyNoDraft(event: Event) {
  emit('update:pathologyNoDraft', (event.target as HTMLInputElement).value);
}
</script>

<template>
  <section
    class="min-h-[760px] rounded-2xl border border-border bg-card shadow-sm"
  >
    <template v-if="workspace">
      <div class="border-b border-border px-5 py-4">
        <div class="flex items-center justify-between gap-3">
          <div>
            <div class="text-base font-semibold text-foreground">
              登记工作区
            </div>
            <p class="mt-1 text-xs text-muted-foreground">
              病理号：{{
                formatRegistrationWorkspacePathologyNo(
                  workspaceHeaderPathologyNo,
                )
              }}
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

      <div
        v-if="loading"
        class="px-5 py-10 text-center text-sm text-muted-foreground"
      >
        正在加载工作台...
      </div>
      <div v-else class="space-y-3 px-5 py-5">
        <article
          class="rounded-2xl border border-border bg-accent/70 p-4"
          data-testid="registration-application-full-info"
        >
          <div class="mb-3 flex items-center justify-between gap-3">
            <h3 class="text-sm font-semibold text-foreground">申请完整信息</h3>
            <span class="text-xs text-muted-foreground">
              {{
                props.consultationContextLoading
                  ? '正在加载...'
                  : props.consultationWorkbench
                    ? '已加载'
                    : '基础信息'
              }}
            </span>
          </div>

          <div
            v-if="props.consultationContextLoading"
            class="rounded-xl border border-dashed border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground"
          >
            正在加载患者、申请、手术与妇科信息...
          </div>

          <template v-else-if="props.consultationWorkbench">
            <div
              class="grid gap-2 rounded-xl bg-card p-3 text-sm md:grid-cols-2 xl:grid-cols-3"
            >
              <div
                v-for="item in applicationSummaryItems"
                :key="item.key"
                :class="item.span === 3 ? 'xl:col-span-3' : ''"
              >
                <span class="text-muted-foreground">{{ item.label }}：</span>
                <span class="text-foreground">{{ item.value }}</span>
              </div>
            </div>

            <div class="mt-3 grid gap-3 2xl:grid-cols-2">
              <section
                v-for="section in applicationSections"
                :key="section.key"
                class="rounded-xl border border-border bg-card p-3"
              >
                <h4 class="mb-2 text-sm font-semibold text-foreground">
                  {{ section.title }}
                </h4>
                <div class="grid gap-2 text-sm md:grid-cols-2 xl:grid-cols-3">
                  <div
                    v-for="item in section.items"
                    :key="item.key"
                    :class="
                      item.span === 3 ? 'md:col-span-2 xl:col-span-3' : ''
                    "
                  >
                    <span>{{ item.label }}：</span>
                    <span class="text-foreground">{{ item.value }}</span>
                  </div>
                </div>
              </section>
            </div>
          </template>

          <div
            v-else
            class="grid gap-3 rounded-xl bg-card p-3 text-sm md:grid-cols-2 xl:grid-cols-3"
          >
            <div>
              患者姓名：{{ fieldValue(workspace.basicInfo.patientName) }}
            </div>
            <div>性别：{{ fieldValue(workspace.basicInfo.patientGender) }}</div>
            <div>年龄：{{ fieldValue(workspace.basicInfo.patientAge) }}</div>
            <div>患者 ID：{{ fieldValue(workspace.basicInfo.patientId) }}</div>
            <div>住院号：{{ fieldValue(workspace.basicInfo.inpatientNo) }}</div>
            <div>
              申请单号：{{ fieldValue(workspace.basicInfo.applicationNo) }}
            </div>
            <div>
              申请科室：{{
                fieldValue(workspace.basicInfo.submittingDepartmentName)
              }}
            </div>
            <div>
              申请医生：{{
                fieldValue(workspace.basicInfo.submittingDoctorName)
              }}
            </div>
            <div>
              送检日期：{{ fieldValue(workspace.basicInfo.submissionDate) }}
            </div>
            <div>
              离体时间：{{
                fieldValue(workspace.basicInfo.specimenRemovalTime)
              }}
            </div>
            <div>
              固定时间：{{ fieldValue(workspace.basicInfo.fixationTime) }}
            </div>
            <div>
              送检类型：{{
                formatApplicationType(workspace.basicInfo.applicationType)
              }}
            </div>
          </div>
        </article>

        <div class="grid gap-2 md:grid-cols-2 2xl:grid-cols-3">
          <TechnicalSpecimenRegistrationEditableSectionCard
            v-for="item in DETAIL_SECTION_ITEMS"
            :key="item.key"
            :can-edit="workspace.actionFlags.canSaveDetailSections"
            :editing-value="
              activeDetailSectionKey === item.key
                ? editingDetailSectionValue
                : ''
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
            @update:editing-value="editingDetailSectionValue = $event"
          />
        </div>

        <article class="rounded-2xl border border-border p-4">
          <div class="mb-3">
            <div class="mb-2 text-xs font-semibold text-muted-foreground">
              送检类型
            </div>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="item in registrationTypeOptions"
                :key="item.value"
                :aria-pressed="item.value === registrationApplicationType"
                class="rounded-full border px-3 py-1 text-xs font-medium leading-5 transition"
                :class="[
                  item.value === registrationApplicationType
                    ? 'border-sky-500 bg-primary/100 text-white shadow-sm'
                    : 'border-border bg-card text-muted-foreground hover:border-sky-200 hover:text-sky-600',
                ]"
                :data-testid="`registration-application-type-${item.value}`"
                type="button"
                @click="selectRegistrationApplicationType(item.value)"
              >
                {{ item.label }}
              </button>
            </div>
          </div>
          <div class="flex items-center justify-between gap-3">
            <div class="flex min-w-0 flex-wrap items-center gap-3">
              <h3 class="text-sm font-semibold text-foreground">送检标本</h3>
              <label
                class="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <span class="shrink-0">病理号</span>
                <input
                  class="h-8 w-[180px] rounded-lg border border-border px-3 text-sm"
                  data-testid="registration-pathology-no-input"
                  :disabled="
                    !workspace.actionFlags.canCompleteRegistration || submitting
                  "
                  placeholder="病理号"
                  :value="pathologyNoDraft ?? ''"
                  @input="updatePathologyNoDraft"
                />
              </label>
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
            class="mt-4 rounded-xl border border-dashed border-border bg-accent px-4 py-6 text-sm text-muted-foreground"
          >
            当前送检类型不是会诊类，请切换为会诊类送检类型后查看该列表。
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
                <tr class="text-left text-muted-foreground">
                  <th class="border-b border-border px-3 py-2">序号</th>
                  <th class="border-b border-border px-3 py-2">材料类型</th>
                  <th class="border-b border-border px-3 py-2">数量</th>
                  <th class="border-b border-border px-3 py-2">核对状态</th>
                  <th class="border-b border-border px-3 py-2">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(material, index) in editableMaterials"
                  :key="material.specimenId || `consultation-${index}`"
                  :data-testid="`consultation-material-row-${index}`"
                >
                  <td class="border-b border-border px-3 py-3">
                    {{ index + 1 }}
                  </td>
                  <td class="border-b border-border px-3 py-3">
                    {{ fieldValue(material.specimenName) }}
                  </td>
                  <td class="border-b border-border px-3 py-3">
                    {{ normalizeTissueCount(material.tissueCount) }}
                  </td>
                  <td class="border-b border-border px-3 py-3">
                    <span
                      class="rounded-full px-2 py-0.5 text-xs font-medium"
                      :class="
                        verificationStatusClass(material.verificationStatus)
                      "
                    >
                      {{
                        formatVerificationStatus(material.verificationStatus)
                      }}
                    </span>
                  </td>
                  <td class="border-b border-border px-3 py-3">
                    <div class="flex flex-wrap gap-2">
                      <button
                        class="text-sm text-sky-600"
                        type="button"
                        @click="openConsultationEditDialog(index)"
                      >
                        编辑
                      </button>
                      <button
                        class="text-sm text-emerald-600 disabled:cursor-not-allowed disabled:text-muted-foreground/50"
                        :disabled="
                          !material.specimenId ||
                          material.verificationStatus === 'VERIFIED'
                        "
                        type="button"
                        @click="
                          emit('verifyMaterial', material.specimenId || '')
                        "
                      >
                        核对
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="editableMaterials.length === 0">
                  <td
                    class="px-3 py-8 text-center text-sm text-muted-foreground/70"
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
                <tr class="text-left text-muted-foreground">
                  <th class="border-b border-border px-3 py-2">选择</th>
                  <th class="border-b border-border px-3 py-2">序号</th>
                  <th class="border-b border-border px-3 py-2">标本名称</th>
                  <th class="border-b border-border px-3 py-2">类型</th>
                  <th class="border-b border-border px-3 py-2">组织数量</th>
                  <th class="border-b border-border px-3 py-2">来源部位</th>
                  <th class="border-b border-border px-3 py-2">标本大小</th>
                  <th class="border-b border-border px-3 py-2">是否冰冻</th>
                  <th class="border-b border-border px-3 py-2">核对状态</th>
                  <th class="border-b border-border px-3 py-2">评价</th>
                  <th class="border-b border-border px-3 py-2">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(material, index) in editableMaterials"
                  :key="material.specimenId || `new-${index}`"
                  :data-testid="`material-row-${index}`"
                >
                  <td class="border-b border-border px-3 py-3">
                    <input
                      v-model="selectedMaterialIndex"
                      :aria-label="`选择第 ${index + 1} 个标本`"
                      :value="index"
                      name="technical-registration-material"
                      type="radio"
                    />
                  </td>
                  <td class="border-b border-border px-3 py-3">
                    {{ index + 1 }}
                  </td>
                  <td class="border-b border-border px-3 py-3">
                    <input
                      v-model="material.specimenName"
                      class="min-w-[150px] rounded-lg border border-border px-3 py-2"
                      placeholder="标本名称"
                    />
                  </td>
                  <td class="border-b border-border px-3 py-3">
                    <select
                      v-model="material.specimenType"
                      class="min-w-[110px] rounded-lg border border-border px-3 py-2"
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
                  <td class="border-b border-border px-3 py-3">
                    <input
                      v-model.number="material.tissueCount"
                      class="w-24 rounded-lg border border-border px-3 py-2"
                      min="1"
                      placeholder="1"
                      type="number"
                    />
                  </td>
                  <td class="border-b border-border px-3 py-3">
                    <input
                      v-model="material.sourcePart"
                      class="min-w-[140px] rounded-lg border border-border px-3 py-2"
                      placeholder="来源部位"
                    />
                  </td>
                  <td class="border-b border-border px-3 py-3">
                    <select
                      v-model="material.specimenSize"
                      class="min-w-[110px] rounded-lg border border-border px-3 py-2"
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
                  <td class="border-b border-border px-3 py-3">
                    <label
                      class="inline-flex items-center gap-2 text-muted-foreground"
                    >
                      <input v-model="material.frozen" type="checkbox" />
                      <span>{{ material.frozen ? '是' : '否' }}</span>
                    </label>
                  </td>
                  <td class="border-b border-border px-3 py-3">
                    <div class="flex min-w-[130px] flex-col items-start gap-1">
                      <span
                        class="rounded-full px-2 py-0.5 text-xs font-medium"
                        :class="
                          verificationStatusClass(material.verificationStatus)
                        "
                      >
                        {{
                          formatVerificationStatus(material.verificationStatus)
                        }}
                      </span>
                    </div>
                  </td>
                  <td
                    class="border-b border-border px-3 py-3 text-muted-foreground"
                  >
                    <div class="flex min-w-[180px] items-start gap-2">
                      <span
                        v-if="material.evaluationItems?.length"
                        class="flex-1 whitespace-normal break-words"
                      >
                        {{ material.evaluationItems.join('、') }}
                      </span>
                      <span v-else class="flex-1 text-muted-foreground/70">
                        未评价
                      </span>
                      <ElButton
                        :aria-label="`编辑第 ${index + 1} 个标本评价`"
                        :data-testid="`material-evaluation-edit-${index}`"
                        :icon="UserRoundPen"
                        circle
                        size="small"
                        text
                        title="编辑标本评价"
                        @click="openEvaluationDialogForIndex(index)"
                      />
                    </div>
                  </td>
                  <td class="border-b border-border px-3 py-3">
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
          <div class="w-full max-w-[680px] rounded-xl bg-card p-5 shadow-xl">
            <div class="flex items-start justify-between gap-4">
              <div>
                <h3 class="text-base font-semibold text-foreground">
                  {{
                    consultationEditingIndex === null
                      ? '新增会诊项'
                      : '编辑会诊项'
                  }}
                </h3>
                <p class="mt-1 text-xs text-muted-foreground">
                  会诊项使用紧凑列表展示，详细信息集中在弹窗中维护。
                </p>
              </div>
              <button
                class="text-sm text-muted-foreground"
                type="button"
                @click="consultationDialogVisible = false"
              >
                关闭
              </button>
            </div>

            <div class="mt-4 grid gap-3 md:grid-cols-2">
              <label class="text-sm text-muted-foreground">
                <span class="mb-1 block">材料类型</span>
                <select
                  v-model="consultationForm.materialType"
                  class="w-full rounded-lg border border-border px-3 py-2"
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
              <label class="text-sm text-muted-foreground">
                <span class="mb-1 block">材料数量</span>
                <input
                  v-model.number="consultationForm.quantity"
                  class="w-full rounded-lg border border-border px-3 py-2"
                  data-testid="consultation-quantity"
                  min="1"
                  type="number"
                />
              </label>
              <label class="text-sm text-muted-foreground">
                <span class="mb-1 block">来源部位</span>
                <input
                  v-model="consultationForm.sourcePart"
                  class="w-full rounded-lg border border-border px-3 py-2"
                  data-testid="consultation-source-part"
                  placeholder="请输入来源部位"
                />
              </label>
              <label class="text-sm text-muted-foreground">
                <span class="mb-1 block">来源医院</span>
                <input
                  v-model="consultationForm.sourceHospitalName"
                  class="w-full rounded-lg border border-border px-3 py-2"
                  data-testid="consultation-source-hospital"
                  placeholder="请输入来源医院"
                />
              </label>
              <label class="text-sm text-muted-foreground">
                <span class="mb-1 block">外院会诊 ID</span>
                <input
                  v-model="consultationForm.externalConsultationId"
                  class="w-full rounded-lg border border-border px-3 py-2"
                  data-testid="consultation-external-id"
                  placeholder="请输入外院会诊 ID"
                />
              </label>
              <label class="text-sm text-muted-foreground">
                <span class="mb-1 block">会诊要求</span>
                <input
                  v-model="consultationForm.consultationRequirement"
                  class="w-full rounded-lg border border-border px-3 py-2"
                  data-testid="consultation-requirement"
                  placeholder="请输入会诊要求"
                />
              </label>
              <label class="text-sm text-muted-foreground md:col-span-2">
                <span class="mb-1 block">临床诊断</span>
                <textarea
                  v-model="consultationForm.clinicalDiagnosis"
                  class="min-h-[96px] w-full rounded-lg border border-border px-3 py-2"
                  data-testid="consultation-clinical-diagnosis"
                  placeholder="请输入临床诊断"
                ></textarea>
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
          <div class="w-full max-w-[560px] rounded-xl bg-card p-5 shadow-xl">
            <div class="flex items-start justify-between gap-4">
              <div>
                <h3 class="text-base font-semibold text-foreground">
                  标本评价
                </h3>
                <p class="mt-1 text-xs text-muted-foreground">
                  {{ selectedMaterial.specimenName || '未命名标本' }}
                </p>
              </div>
              <button
                class="text-sm text-muted-foreground"
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
                class="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-foreground"
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
                class="min-w-0 flex-1 rounded-lg border border-border px-3 py-2 text-sm"
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
                class="rounded-full bg-accent px-3 py-1 text-xs text-foreground"
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

        <article class="rounded-2xl border border-border p-4">
          <h3 class="text-sm font-semibold text-foreground">检查列表</h3>
          <div
            v-if="workspace.checkItems.length > 0"
            class="mt-4 overflow-x-auto"
          >
            <table class="min-w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr class="text-left text-muted-foreground">
                  <th class="border-b border-border px-3 py-2">序号</th>
                  <th class="border-b border-border px-3 py-2">病理号</th>
                  <th class="border-b border-border px-3 py-2">类型</th>
                  <th class="border-b border-border px-3 py-2">检查项目</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(item, index) in workspace.checkItems"
                  :key="`${item.sequenceNo}-${item.name}`"
                >
                  <td class="border-b border-border px-3 py-3">
                    {{ item.sequenceNo || index + 1 }}
                  </td>
                  <td class="border-b border-border px-3 py-3">
                    {{
                      formatPendingPathologyNo(workspace.basicInfo.pathologyNo)
                    }}
                  </td>
                  <td class="border-b border-border px-3 py-3">
                    {{
                      formatApplicationType(workspace.basicInfo.applicationType)
                    }}
                  </td>
                  <td class="border-b border-border px-3 py-3">
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

<style scoped>
:where(input:not([type='checkbox']):not([type='radio']), select, textarea) {
  color: hsl(var(--foreground));
  background: hsl(var(--input-background));
}

:where(
  input:not([type='checkbox']):not([type='radio']),
  textarea
)::placeholder {
  color: hsl(var(--muted-foreground));
}
</style>
