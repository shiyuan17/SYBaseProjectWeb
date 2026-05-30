<script setup lang="ts">
import type { ApplicationRegistrationWorkbenchRecord } from '../types/application-registration-workbench';

import { computed, nextTick, ref } from 'vue';

import { Check, UserRoundPen, X } from '@vben/icons';
import {
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElDivider,
  ElEmpty,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
} from 'element-plus';

import { buildApplicationFormPrintDocument } from '../utils/specimen-print';
import WorkflowSectionCard from './WorkflowSectionCard.vue';

const props = defineProps<{
  buildingLabel: string;
  fullHeight?: boolean;
  record: ApplicationRegistrationWorkbenchRecord | null;
  roomLabel: string;
}>();

const emit = defineEmits<{
  (event: 'update:record', value: ApplicationRegistrationWorkbenchRecord): void;
}>();

type WorkbenchEditorType = 'readonly' | 'select' | 'text' | 'textarea';

type WorkbenchInfoItem = {
  editorType: WorkbenchEditorType;
  emphasized?: boolean;
  key: string;
  label: string;
  options?: Array<{
    label: string;
    value: string;
  }>;
  rows?: number;
  span?: number;
  value: string;
  writeBack?: (
    record: ApplicationRegistrationWorkbenchRecord,
    value: string,
  ) => ApplicationRegistrationWorkbenchRecord;
};

type WorkbenchSection = {
  items: WorkbenchInfoItem[];
  key: string;
  title: string;
};

const booleanEditorOptions = [
  { label: '是', value: 'true' },
  { label: '否', value: 'false' },
] as const;

const activeEditorKey = ref('');
const editingValue = ref('');

const summaryItems = computed(() =>
  props.record ? buildSummaryItems(props.record) : [],
);

const sections = computed(() =>
  props.record ? buildSections(props.record) : [],
);

function formatValue(value: null | string | undefined) {
  return value && value.trim() ? value : '-';
}

function normalizeTextValue(value: string) {
  return value.trim();
}

function normalizeBooleanEditorValue(value: string) {
  return value === 'true';
}

function formatBooleanText(value: boolean) {
  return value ? '是' : '否';
}

function buildSummaryItems(
  record: ApplicationRegistrationWorkbenchRecord,
): WorkbenchInfoItem[] {
  return [
    {
      editorType: 'readonly',
      key: 'applicationNo',
      emphasized: true,
      label: '申请单号',
      value: formatValue(record.patientInfo.applicationNo),
    },
    {
      editorType: 'readonly',
      key: 'applicationDate',
      label: '申请日期',
      value: formatValue(record.patientInfo.applicationDate),
    },
    {
      editorType: 'readonly',
      key: 'patientName',
      emphasized: true,
      label: '患者姓名',
      value: formatValue(record.patientInfo.patientName),
    },
    {
      editorType: 'readonly',
      key: 'gender',
      label: '性别',
      value: formatValue(record.patientInfo.gender),
    },
    {
      editorType: 'readonly',
      key: 'age',
      label: '年龄',
      value: formatValue(record.patientInfo.age),
    },
    {
      editorType: 'text',
      key: 'checkItem',
      label: '检查项目',
      value: formatValue(record.patientInfo.checkItem),
      writeBack: (currentRecord, value) => ({
        ...currentRecord,
        patientInfo: {
          ...currentRecord.patientInfo,
          checkItem: normalizeTextValue(value),
        },
      }),
    },
    {
      editorType: 'text',
      key: 'inpatientNo',
      label: '住院号',
      value: formatValue(record.patientInfo.inpatientNo),
      writeBack: (currentRecord, value) => ({
        ...currentRecord,
        patientInfo: {
          ...currentRecord.patientInfo,
          inpatientNo: normalizeTextValue(value),
        },
      }),
    },
    {
      editorType: 'text',
      key: 'idNo',
      label: 'ID号',
      value: formatValue(record.patientInfo.idNo),
      writeBack: (currentRecord, value) => ({
        ...currentRecord,
        patientInfo: {
          ...currentRecord.patientInfo,
          idNo: normalizeTextValue(value),
        },
      }),
    },
    {
      editorType: 'text',
      key: 'wardName',
      label: '病区',
      value: formatValue(record.patientInfo.wardName),
      writeBack: (currentRecord, value) => ({
        ...currentRecord,
        patientInfo: {
          ...currentRecord.patientInfo,
          wardName: normalizeTextValue(value),
        },
      }),
    },
    {
      editorType: 'text',
      key: 'bedNo',
      label: '床号',
      value: formatValue(record.patientInfo.bedNo),
      writeBack: (currentRecord, value) => ({
        ...currentRecord,
        patientInfo: {
          ...currentRecord.patientInfo,
          bedNo: normalizeTextValue(value),
        },
      }),
    },
    {
      editorType: 'text',
      key: 'phone',
      label: '联系电话',
      value: formatValue(record.patientInfo.phone),
      writeBack: (currentRecord, value) => ({
        ...currentRecord,
        patientInfo: {
          ...currentRecord.patientInfo,
          phone: normalizeTextValue(value),
        },
      }),
    },
    {
      editorType: 'readonly',
      key: 'applyDeptDoctor',
      label: '申请科室/医生',
      span: 3,
      value: `${formatValue(record.patientInfo.applyDept)} / ${formatValue(record.patientInfo.applyDoctor)}`,
    },
    {
      editorType: 'readonly',
      key: 'specimenType',
      label: '送检类型',
      value: formatValue(record.patientInfo.specimenType),
    },
    {
      editorType: 'readonly',
      key: 'deliveryRequirement',
      label: '送检要求',
      value: formatValue(record.patientInfo.deliveryRequirement),
    },
    {
      editorType: 'readonly',
      key: 'registrationStatus',
      label: '登记状态',
      value: formatValue(record.patientInfo.registrationStatus),
    },
    {
      editorType: 'readonly',
      key: 'patientVerified',
      label: '患者核对',
      value: record.patientInfo.patientVerified ? '已核对' : '未核对',
    },
    {
      editorType: 'readonly',
      key: 'frozenReminder',
      label: '冰冻提醒',
      value: record.patientInfo.frozenReminder ? '是' : '否',
    },
  ];
}

function buildSections(
  record: ApplicationRegistrationWorkbenchRecord,
): WorkbenchSection[] {
  return [
    {
      key: 'application',
      title: '申请信息',
      items: [
        {
          editorType: 'textarea',
          key: 'clinicalHistory',
          label: '临床病例',
          rows: 2,
          span: 3,
          value: formatValue(record.patientInfo.clinicalHistory),
          writeBack: (currentRecord, value) => ({
            ...currentRecord,
            patientInfo: {
              ...currentRecord.patientInfo,
              clinicalHistory: normalizeTextValue(value),
            },
          }),
        },
        {
          editorType: 'textarea',
          key: 'imagingResult',
          label: '影像结果',
          rows: 2,
          span: 3,
          value: formatValue(record.patientInfo.imagingResult),
          writeBack: (currentRecord, value) => ({
            ...currentRecord,
            patientInfo: {
              ...currentRecord.patientInfo,
              imagingResult: normalizeTextValue(value),
            },
          }),
        },
        {
          editorType: 'textarea',
          key: 'clinicalDiagnosis',
          label: '临床诊断',
          rows: 2,
          span: 3,
          value: formatValue(record.patientInfo.clinicalDiagnosis),
          writeBack: (currentRecord, value) => ({
            ...currentRecord,
            patientInfo: {
              ...currentRecord.patientInfo,
              clinicalDiagnosis: normalizeTextValue(value),
            },
          }),
        },
        {
          editorType: 'textarea',
          key: 'endoscopyDiagnosis',
          label: '内镜诊断',
          rows: 2,
          span: 3,
          value: formatValue(record.patientInfo.endoscopyDiagnosis),
          writeBack: (currentRecord, value) => ({
            ...currentRecord,
            patientInfo: {
              ...currentRecord.patientInfo,
              endoscopyDiagnosis: normalizeTextValue(value),
            },
          }),
        },
        {
          editorType: 'textarea',
          key: 'remark',
          label: '备注',
          rows: 2,
          span: 3,
          value: formatValue(record.patientInfo.remark),
          writeBack: (currentRecord, value) => ({
            ...currentRecord,
            patientInfo: {
              ...currentRecord.patientInfo,
              remark: normalizeTextValue(value),
            },
          }),
        },
      ],
    },
    {
      key: 'contagious',
      title: '传染性标本',
      items: [
        {
          editorType: 'select',
          key: 'contagiousIsolation',
          label: '隔离',
          options: [...booleanEditorOptions],
          value: formatBooleanText(record.contagiousSpecimen.isolation),
          writeBack: (currentRecord, value) => ({
            ...currentRecord,
            contagiousSpecimen: {
              ...currentRecord.contagiousSpecimen,
              isolation: normalizeBooleanEditorValue(value),
            },
          }),
        },
        {
          editorType: 'select',
          key: 'contagiousHiv',
          label: 'HIV',
          options: [...booleanEditorOptions],
          value: formatBooleanText(record.contagiousSpecimen.hiv),
          writeBack: (currentRecord, value) => ({
            ...currentRecord,
            contagiousSpecimen: {
              ...currentRecord.contagiousSpecimen,
              hiv: normalizeBooleanEditorValue(value),
            },
          }),
        },
        {
          editorType: 'select',
          key: 'contagiousTuberculosis',
          label: '结核',
          options: [...booleanEditorOptions],
          value: formatBooleanText(record.contagiousSpecimen.tuberculosis),
          writeBack: (currentRecord, value) => ({
            ...currentRecord,
            contagiousSpecimen: {
              ...currentRecord.contagiousSpecimen,
              tuberculosis: normalizeBooleanEditorValue(value),
            },
          }),
        },
        {
          editorType: 'select',
          key: 'contagiousHepatitis',
          label: '肝炎',
          options: [...booleanEditorOptions],
          value: formatBooleanText(record.contagiousSpecimen.hepatitis),
          writeBack: (currentRecord, value) => ({
            ...currentRecord,
            contagiousSpecimen: {
              ...currentRecord.contagiousSpecimen,
              hepatitis: normalizeBooleanEditorValue(value),
            },
          }),
        },
        {
          editorType: 'select',
          key: 'contagiousSyphilis',
          label: '梅毒',
          options: [...booleanEditorOptions],
          value: formatBooleanText(record.contagiousSpecimen.syphilis),
          writeBack: (currentRecord, value) => ({
            ...currentRecord,
            contagiousSpecimen: {
              ...currentRecord.contagiousSpecimen,
              syphilis: normalizeBooleanEditorValue(value),
            },
          }),
        },
      ],
    },
    {
      key: 'surgery',
      title: '手术信息',
      items: [
        {
          editorType: 'text',
          key: 'surgeryName',
          label: '手术名称',
          value: formatValue(record.surgeryInfo.surgeryName),
          writeBack: (currentRecord, value) => ({
            ...currentRecord,
            surgeryInfo: {
              ...currentRecord.surgeryInfo,
              surgeryName: normalizeTextValue(value),
            },
          }),
        },
        {
          editorType: 'readonly',
          key: 'buildingRoom',
          label: '手术楼/手术室',
          value: `${formatValue(props.buildingLabel)} / ${formatValue(props.roomLabel)}`,
          span: 3,
        },
        {
          editorType: 'textarea',
          key: 'clinicalFindings',
          label: '临床及手术所见',
          rows: 2,
          span: 3,
          value: formatValue(record.surgeryInfo.clinicalFindings),
          writeBack: (currentRecord, value) => ({
            ...currentRecord,
            surgeryInfo: {
              ...currentRecord.surgeryInfo,
              clinicalFindings: normalizeTextValue(value),
            },
          }),
        },
        {
          editorType: 'readonly',
          key: 'fixationInfo',
          label: '标本固定时间/人',
          value: `${formatValue(record.surgeryInfo.fixationTime)} / ${formatValue(
            record.surgeryInfo.fixationPerson,
          )}`,
          span: 3,
        },
        {
          editorType: 'text',
          key: 'fixativeType',
          label: '固定液类型',
          value: formatValue(record.surgeryInfo.fixativeType),
          writeBack: (currentRecord, value) => ({
            ...currentRecord,
            surgeryInfo: {
              ...currentRecord.surgeryInfo,
              fixativeType: normalizeTextValue(value),
            },
          }),
        },
        {
          editorType: 'readonly',
          key: 'specimenRemovalTime',
          label: '标本离体时间',
          value: formatValue(record.surgeryInfo.specimenRemovalTime),
        },
      ],
    },
    {
      key: 'gynecology',
      title: '妇科信息',
      items: [
        {
          editorType: 'select',
          key: 'menopause',
          label: '是否绝经',
          options: [...booleanEditorOptions],
          value: formatBooleanText(record.gynecologyInfo.menopause),
          writeBack: (currentRecord, value) => {
            const normalizedValue = normalizeBooleanEditorValue(value);
            return {
              ...currentRecord,
              gynecologyInfo: {
                ...currentRecord.gynecologyInfo,
                menopause: normalizedValue,
                specialConditions: {
                  ...currentRecord.gynecologyInfo.specialConditions,
                  menopause: normalizedValue,
                },
              },
            };
          },
        },
        {
          editorType: 'text',
          key: 'lastMenstrualPeriod',
          label: '最后月经时间',
          value: formatValue(record.gynecologyInfo.lastMenstrualPeriod),
          writeBack: (currentRecord, value) => ({
            ...currentRecord,
            gynecologyInfo: {
              ...currentRecord.gynecologyInfo,
              lastMenstrualPeriod: normalizeTextValue(value),
            },
          }),
        },
        {
          editorType: 'text',
          key: 'hpvResult',
          label: '人乳头瘤病毒(HPV)检测结果',
          value: formatValue(record.gynecologyInfo.hpvResult),
          writeBack: (currentRecord, value) => ({
            ...currentRecord,
            gynecologyInfo: {
              ...currentRecord.gynecologyInfo,
              hpvResult: normalizeTextValue(value),
            },
          }),
        },
        {
          editorType: 'textarea',
          key: 'previousCytology',
          label: '以往宫颈脱落细胞检查结果',
          rows: 2,
          span: 3,
          value: formatValue(record.gynecologyInfo.previousCytology),
          writeBack: (currentRecord, value) => ({
            ...currentRecord,
            gynecologyInfo: {
              ...currentRecord.gynecologyInfo,
              previousCytology: normalizeTextValue(value),
            },
          }),
        },
        {
          editorType: 'textarea',
          key: 'previousTreatment',
          label: '以往宫颈治疗史',
          rows: 2,
          span: 3,
          value: formatValue(record.gynecologyInfo.previousTreatment),
          writeBack: (currentRecord, value) => ({
            ...currentRecord,
            gynecologyInfo: {
              ...currentRecord.gynecologyInfo,
              previousTreatment: normalizeTextValue(value),
            },
          }),
        },
        {
          editorType: 'textarea',
          key: 'additionalNotes',
          label: '补充说明',
          rows: 2,
          span: 3,
          value: formatValue(record.gynecologyInfo.additionalNotes),
          writeBack: (currentRecord, value) => ({
            ...currentRecord,
            gynecologyInfo: {
              ...currentRecord.gynecologyInfo,
              additionalNotes: normalizeTextValue(value),
            },
          }),
        },
      ],
    },
    {
      key: 'special',
      title: '特殊情况标注',
      items: [
        {
          editorType: 'select',
          key: 'specialMenopause',
          label: '绝经',
          options: [...booleanEditorOptions],
          value: formatBooleanText(
            record.gynecologyInfo.specialConditions.menopause,
          ),
          writeBack: (currentRecord, value) => ({
            ...currentRecord,
            gynecologyInfo: {
              ...currentRecord.gynecologyInfo,
              specialConditions: {
                ...currentRecord.gynecologyInfo.specialConditions,
                menopause: normalizeBooleanEditorValue(value),
              },
            },
          }),
        },
        {
          editorType: 'select',
          key: 'specialHormoneReplacement',
          label: '口服雌激素/HRT',
          options: [...booleanEditorOptions],
          value: formatBooleanText(
            record.gynecologyInfo.specialConditions.hormoneReplacement,
          ),
          writeBack: (currentRecord, value) => ({
            ...currentRecord,
            gynecologyInfo: {
              ...currentRecord.gynecologyInfo,
              specialConditions: {
                ...currentRecord.gynecologyInfo.specialConditions,
                hormoneReplacement: normalizeBooleanEditorValue(value),
              },
            },
          }),
        },
        {
          editorType: 'select',
          key: 'specialBirthControl',
          label: '口服避孕药或避孕针',
          options: [...booleanEditorOptions],
          value: formatBooleanText(
            record.gynecologyInfo.specialConditions.birthControl,
          ),
          writeBack: (currentRecord, value) => ({
            ...currentRecord,
            gynecologyInfo: {
              ...currentRecord.gynecologyInfo,
              specialConditions: {
                ...currentRecord.gynecologyInfo.specialConditions,
                birthControl: normalizeBooleanEditorValue(value),
              },
            },
          }),
        },
        {
          editorType: 'select',
          key: 'specialIud',
          label: '子宫环',
          options: [...booleanEditorOptions],
          value: formatBooleanText(record.gynecologyInfo.specialConditions.iud),
          writeBack: (currentRecord, value) => ({
            ...currentRecord,
            gynecologyInfo: {
              ...currentRecord.gynecologyInfo,
              specialConditions: {
                ...currentRecord.gynecologyInfo.specialConditions,
                iud: normalizeBooleanEditorValue(value),
              },
            },
          }),
        },
        {
          editorType: 'select',
          key: 'specialPregnancy',
          label: '怀孕',
          options: [...booleanEditorOptions],
          value: formatBooleanText(
            record.gynecologyInfo.specialConditions.pregnancy,
          ),
          writeBack: (currentRecord, value) => ({
            ...currentRecord,
            gynecologyInfo: {
              ...currentRecord.gynecologyInfo,
              specialConditions: {
                ...currentRecord.gynecologyInfo.specialConditions,
                pregnancy: normalizeBooleanEditorValue(value),
              },
            },
          }),
        },
        {
          editorType: 'select',
          key: 'specialLactation',
          label: '哺乳期',
          options: [...booleanEditorOptions],
          value: formatBooleanText(
            record.gynecologyInfo.specialConditions.lactation,
          ),
          writeBack: (currentRecord, value) => ({
            ...currentRecord,
            gynecologyInfo: {
              ...currentRecord.gynecologyInfo,
              specialConditions: {
                ...currentRecord.gynecologyInfo.specialConditions,
                lactation: normalizeBooleanEditorValue(value),
              },
            },
          }),
        },
        {
          editorType: 'select',
          key: 'specialAbnormalBleeding',
          label: '不正常流血',
          options: [...booleanEditorOptions],
          value: formatBooleanText(
            record.gynecologyInfo.specialConditions.abnormalBleeding,
          ),
          writeBack: (currentRecord, value) => ({
            ...currentRecord,
            gynecologyInfo: {
              ...currentRecord.gynecologyInfo,
              specialConditions: {
                ...currentRecord.gynecologyInfo.specialConditions,
                abnormalBleeding: normalizeBooleanEditorValue(value),
              },
            },
          }),
        },
        {
          editorType: 'select',
          key: 'specialRadiotherapy',
          label: '放射性治疗',
          options: [...booleanEditorOptions],
          value: formatBooleanText(
            record.gynecologyInfo.specialConditions.radiotherapy,
          ),
          writeBack: (currentRecord, value) => ({
            ...currentRecord,
            gynecologyInfo: {
              ...currentRecord.gynecologyInfo,
              specialConditions: {
                ...currentRecord.gynecologyInfo.specialConditions,
                radiotherapy: normalizeBooleanEditorValue(value),
              },
            },
          }),
        },
        {
          editorType: 'select',
          key: 'specialHysterectomy',
          label: '子宫全切术后',
          options: [...booleanEditorOptions],
          value: formatBooleanText(
            record.gynecologyInfo.specialConditions.hysterectomy,
          ),
          writeBack: (currentRecord, value) => ({
            ...currentRecord,
            gynecologyInfo: {
              ...currentRecord.gynecologyInfo,
              specialConditions: {
                ...currentRecord.gynecologyInfo.specialConditions,
                hysterectomy: normalizeBooleanEditorValue(value),
              },
            },
          }),
        },
        {
          editorType: 'textarea',
          key: 'specialOther',
          label: '其他',
          rows: 2,
          span: 3,
          value: formatValue(record.gynecologyInfo.specialConditions.other),
          writeBack: (currentRecord, value) => ({
            ...currentRecord,
            gynecologyInfo: {
              ...currentRecord.gynecologyInfo,
              specialConditions: {
                ...currentRecord.gynecologyInfo.specialConditions,
                other: normalizeTextValue(value),
              },
            },
          }),
        },
      ],
    },
  ];
}

function getSectionDescriptionColumns() {
  return 3;
}

function getSectionItemSpan(item: WorkbenchInfoItem) {
  if (item.span) {
    return item.span;
  }

  if (item.editorType === 'textarea') {
    return 2;
  }

  return 1;
}

function getSummaryItemValueClass(item: WorkbenchInfoItem) {
  if (item.key === 'applicationNo') {
    return 'text-[12px] font-semibold';
  }

  if (item.emphasized) {
    return 'text-[13px] font-semibold';
  }

  return '';
}

function cancelEditing() {
  activeEditorKey.value = '';
  editingValue.value = '';
}

async function beginEditing(item: WorkbenchInfoItem) {
  if (!props.record || item.editorType === 'readonly') {
    return;
  }

  activeEditorKey.value = item.key;
  editingValue.value =
    item.editorType === 'select'
      ? item.value === '是'
        ? 'true'
        : 'false'
      : item.value === '-'
        ? ''
        : item.value;

  await nextTick();
  const editor = document.querySelector<HTMLElement>(
    `[data-editor-key="${item.key}"] input, [data-editor-key="${item.key}"] textarea`,
  );
  editor?.focus();
}

function saveEditing(item: WorkbenchInfoItem) {
  if (!props.record || !item.writeBack) {
    cancelEditing();
    return;
  }

  const updatedRecord = item.writeBack(props.record, editingValue.value);
  emit('update:record', updatedRecord);
  cancelEditing();
}

function handleValueDoubleClick(item: WorkbenchInfoItem) {
  if (item.editorType === 'readonly') {
    return;
  }
  void beginEditing(item);
}

function getReprintApplicationIdentifier(
  record: ApplicationRegistrationWorkbenchRecord | null,
) {
  return (
    record?.applicationId?.trim() ||
    record?.patientInfo.applicationNo?.trim() ||
    ''
  );
}

function openPrintWindow(documentHtml: string) {
  const printWindow = window.open('', '_blank', 'width=960,height=760');
  if (!printWindow) {
    ElMessage.warning('打印窗口被浏览器拦截，请允许弹窗后重试');
    return null;
  }

  printWindow.document.open();
  printWindow.document.write(documentHtml);
  printWindow.document.close();
  return printWindow;
}

function printApplicationForm() {
  const applicationId = getReprintApplicationIdentifier(props.record);
  if (!props.record || !applicationId) {
    ElMessage.warning('缺少补打申请单所需的申请单号');
    return;
  }

  try {
    const printDocument = buildApplicationFormPrintDocument(props.record);
    openPrintWindow(printDocument);
  } catch (error) {
    console.error(error);
    ElMessage.error('申请单打印内容生成失败，请稍后重试');
  }
}
</script>

<template>
  <WorkflowSectionCard
    :class="
      props.fullHeight
        ? 'min-h-[420px] max-h-full overflow-hidden'
        : 'max-h-full overflow-hidden'
    "
    :auto-height="!props.fullHeight"
    title="患者信息"
  >
    <template v-if="props.record" #extra>
      <ElButton size="small" @click="printApplicationForm">补打申请单</ElButton>
    </template>

    <template v-if="props.record">
      <div class="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden pr-1">
        <div
          class="overflow-hidden rounded-lg border border-border/80 bg-card shadow-sm"
        >
          <ElDescriptions
            :column="3"
            border
            size="small"
            class="patient-summary-descriptions"
          >
            <ElDescriptionsItem
              v-for="item in summaryItems"
              :key="item.key"
              :label="item.label"
              :span="item.span ?? 1"
            >
              <div class="group/item relative min-h-4">
                <button
                  v-if="
                    item.editorType !== 'readonly' &&
                    activeEditorKey !== item.key
                  "
                  aria-label="编辑"
                  :data-testid="`patient-edit-${item.key}`"
                  class="absolute right-0 top-0 inline-flex h-4 w-4 items-center justify-center rounded-sm border border-border/70 bg-background/95 text-[10px] text-muted-foreground opacity-0 shadow-sm transition-all duration-150 hover:border-primary/50 hover:text-primary group-hover/item:opacity-100"
                  title="编辑"
                  type="button"
                  @click.stop="beginEditing(item)"
                >
                  <UserRoundPen aria-hidden="true" class="h-3 w-3" />
                </button>

                <template v-if="activeEditorKey === item.key">
                  <div
                    :data-editor-key="item.key"
                    class="patient-inline-editor"
                  >
                    <div class="min-w-0 flex-1">
                      <ElInput
                        v-if="item.editorType === 'text'"
                        v-model="editingValue"
                        clearable
                        :data-testid="`patient-input-${item.key}`"
                        size="small"
                        @keyup.enter="saveEditing(item)"
                        @keyup.esc="cancelEditing"
                      />

                      <ElInput
                        v-else-if="item.editorType === 'textarea'"
                        v-model="editingValue"
                        clearable
                        :autosize="{
                          minRows: item.rows ?? 2,
                          maxRows: item.rows ?? 4,
                        }"
                        :data-testid="`patient-input-${item.key}`"
                        resize="none"
                        size="small"
                        type="textarea"
                        @keydown.ctrl.enter.prevent="saveEditing(item)"
                        @keyup.esc="cancelEditing"
                      />

                      <ElSelect
                        v-else
                        v-model="editingValue"
                        :data-testid="`patient-input-${item.key}`"
                        size="small"
                      >
                        <ElOption
                          v-for="option in item.options"
                          :key="`${item.key}-${String(option.value)}`"
                          :label="option.label"
                          :value="option.value"
                        />
                      </ElSelect>
                    </div>

                    <div class="patient-inline-editor__actions">
                      <ElButton
                        aria-label="保存"
                        :data-testid="`patient-save-${item.key}`"
                        :icon="Check"
                        class="patient-inline-editor__button"
                        circle
                        plain
                        size="small"
                        title="保存"
                        type="primary"
                        @click="saveEditing(item)"
                      />
                      <ElButton
                        aria-label="取消"
                        :data-testid="`patient-cancel-${item.key}`"
                        :icon="X"
                        class="patient-inline-editor__button"
                        circle
                        plain
                        size="small"
                        title="取消"
                        @click="cancelEditing"
                      />
                    </div>
                  </div>
                </template>

                <div
                  v-else
                  :data-testid="`patient-value-${item.key}`"
                  class="break-words text-[11px] font-medium leading-4 text-foreground"
                  :class="[
                    item.editorType === 'readonly'
                      ? 'pr-0'
                      : 'cursor-text pr-5',
                    getSummaryItemValueClass(item),
                  ]"
                  @dblclick="handleValueDoubleClick(item)"
                >
                  {{ item.value }}
                </div>
              </div>
            </ElDescriptionsItem>
          </ElDescriptions>
        </div>

        <div class="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pr-1">
          <section v-for="section in sections" :key="section.key" class="px-0">
            <ElDivider
              class="patient-section-divider"
              content-position="center"
            >
              <span class="patient-section-divider__text">{{
                section.title
              }}</span>
            </ElDivider>

            <ElDescriptions
              :column="getSectionDescriptionColumns()"
              border
              size="small"
              class="patient-section-descriptions"
            >
              <ElDescriptionsItem
                v-for="item in section.items"
                :key="item.key"
                :data-testid="`patient-item-${item.key}`"
                :label="item.label"
                :span="getSectionItemSpan(item)"
              >
                <div class="group/item relative min-h-4">
                  <button
                    v-if="
                      item.editorType !== 'readonly' &&
                      activeEditorKey !== item.key
                    "
                    aria-label="编辑"
                    :data-testid="`patient-edit-${item.key}`"
                    class="absolute right-0 top-0 inline-flex h-4 w-4 items-center justify-center rounded-sm border border-border/70 bg-background/95 text-[10px] text-muted-foreground opacity-0 shadow-sm transition-all duration-150 hover:border-primary/50 hover:text-primary group-hover/item:opacity-100"
                    title="编辑"
                    type="button"
                    @click.stop="beginEditing(item)"
                  >
                    <UserRoundPen aria-hidden="true" class="h-3 w-3" />
                  </button>

                  <template v-if="activeEditorKey === item.key">
                    <div
                      :data-editor-key="item.key"
                      class="patient-inline-editor"
                    >
                      <div class="min-w-0 flex-1">
                        <ElInput
                          v-if="item.editorType === 'text'"
                          v-model="editingValue"
                          clearable
                          :data-testid="`patient-input-${item.key}`"
                          size="small"
                          @keyup.enter="saveEditing(item)"
                          @keyup.esc="cancelEditing"
                        />

                        <ElInput
                          v-else-if="item.editorType === 'textarea'"
                          v-model="editingValue"
                          clearable
                          :autosize="{
                            minRows: item.rows ?? 2,
                            maxRows: item.rows ?? 4,
                          }"
                          :data-testid="`patient-input-${item.key}`"
                          resize="none"
                          size="small"
                          type="textarea"
                          @keydown.ctrl.enter.prevent="saveEditing(item)"
                          @keyup.esc="cancelEditing"
                        />

                        <ElSelect
                          v-else
                          v-model="editingValue"
                          :data-testid="`patient-input-${item.key}`"
                          size="small"
                        >
                          <ElOption
                            v-for="option in item.options"
                            :key="`${item.key}-${String(option.value)}`"
                            :label="option.label"
                            :value="option.value"
                          />
                        </ElSelect>
                      </div>

                      <div class="patient-inline-editor__actions">
                        <ElButton
                          aria-label="保存"
                          :data-testid="`patient-save-${item.key}`"
                          :icon="Check"
                          class="patient-inline-editor__button"
                          circle
                          plain
                          size="small"
                          title="保存"
                          type="primary"
                          @click="saveEditing(item)"
                        />
                        <ElButton
                          aria-label="取消"
                          :data-testid="`patient-cancel-${item.key}`"
                          :icon="X"
                          class="patient-inline-editor__button"
                          circle
                          plain
                          size="small"
                          title="取消"
                          @click="cancelEditing"
                        />
                      </div>
                    </div>
                  </template>

                  <div
                    v-else
                    :data-testid="`patient-value-${item.key}`"
                    class="break-words pr-5 text-[11px] font-medium leading-4 text-foreground"
                    :class="
                      item.editorType === 'readonly' ? 'pr-0' : 'cursor-text'
                    "
                    @dblclick="handleValueDoubleClick(item)"
                  >
                    {{ item.value }}
                  </div>
                </div>
              </ElDescriptionsItem>
            </ElDescriptions>
          </section>
        </div>
      </div>
    </template>

    <ElEmpty v-else description="请先查询住院号或申请单号" />
  </WorkflowSectionCard>
</template>

<style scoped>
:deep(.patient-summary-descriptions .el-descriptions__label),
:deep(.patient-summary-descriptions .el-descriptions__content) {
  padding: 3px 6px;
}

:deep(.patient-summary-descriptions .el-descriptions__label) {
  width: 68px;
  white-space: nowrap;
  font-size: 10px;
}

:deep(.patient-summary-descriptions .el-descriptions__content) {
  font-size: 11px;
  line-height: 1.2;
  vertical-align: top;
}

:deep(.patient-section-divider) {
  margin: 1px 0 4px;
}

:deep(.patient-section-divider .el-divider__text) {
  padding: 0 6px;
  background-color: transparent;
}

.patient-section-divider__text {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 0 6px;
  font-size: 10px;
  font-weight: 600;
  line-height: 16px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

:deep(.patient-section-descriptions .el-descriptions__label),
:deep(.patient-section-descriptions .el-descriptions__content) {
  padding: 3px 6px;
  vertical-align: top;
}

:deep(.patient-section-descriptions .el-descriptions__label) {
  width: 88px;
  white-space: nowrap;
  font-size: 10px;
}

:deep(.patient-section-descriptions .el-descriptions__content) {
  font-size: 11px;
  line-height: 1.25;
}

.patient-inline-editor {
  display: flex;
  align-items: center;
  gap: 6px;
}

.patient-inline-editor__actions {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 4px;
}

:deep(.patient-inline-editor__button.el-button) {
  width: 24px;
  height: 24px;
  min-height: 24px;
  margin-left: 0;
  padding: 0;
}

:deep(.patient-inline-editor__button .el-icon) {
  width: 13px;
  height: 13px;
  font-size: 13px;
}
</style>
