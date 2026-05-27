<script setup lang="ts">
import type { ApplicationRegistrationWorkbenchRecord } from '../types/application-registration-workbench';

import { nextTick, ref } from 'vue';

import {
  ElButton,
  ElEmpty,
  ElInput,
  ElOption,
  ElScrollbar,
  ElSelect,
  ElTag,
} from 'element-plus';

import WorkflowSectionCard from './WorkflowSectionCard.vue';

const props = defineProps<{
  buildingLabel: string;
  record: ApplicationRegistrationWorkbenchRecord | null;
  roomLabel: string;
}>();

const emit = defineEmits<{
  (event: 'update:record', value: ApplicationRegistrationWorkbenchRecord): void;
}>();

type WorkbenchEditorType = 'readonly' | 'select' | 'text' | 'textarea';

type WorkbenchInfoItem = {
  editorType: WorkbenchEditorType;
  key: string;
  label: string;
  options?: Array<{
    label: string;
    value: string;
  }>;
  rows?: number;
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

const activeEditorKey = ref('');
const editingValue = ref('');

function formatValue(value: null | string | undefined) {
  return value && value.trim() ? value : '-';
}

function normalizeTextValue(value: string) {
  return value.trim();
}

function buildSummaryItems(record: ApplicationRegistrationWorkbenchRecord) {
  return [
    { label: '申请单号', value: record.patientInfo.applicationNo },
    { label: '住院号', value: record.patientInfo.inpatientNo || '-' },
    { label: '患者', value: record.patientInfo.patientName },
    {
      label: '性别/年龄',
      value: `${record.patientInfo.gender || '-'} / ${record.patientInfo.age || '-'}`,
    },
    { label: '床号', value: formatValue(record.patientInfo.bedNo) },
    { label: '病区', value: formatValue(record.patientInfo.wardName) },
    { label: '申请科室', value: formatValue(record.patientInfo.applyDept) },
    { label: '申请医生', value: formatValue(record.patientInfo.applyDoctor) },
    { label: '联系电话', value: formatValue(record.patientInfo.phone) },
  ];
}

function buildPatientTags(record: ApplicationRegistrationWorkbenchRecord) {
  const tags = [
    record.patientInfo.specimenType
      ? { label: record.patientInfo.specimenType, type: 'primary' as const }
      : null,
    record.patientInfo.deliveryRequirement
      ? {
          label: record.patientInfo.deliveryRequirement,
          type: 'success' as const,
        }
      : null,
    record.patientInfo.patientVerified
      ? { label: '患者已核对', type: 'warning' as const }
      : null,
    record.patientInfo.frozenReminder
      ? { label: '冰冻提醒', type: 'danger' as const }
      : null,
  ];

  return tags.filter(
    (
      tag,
    ): tag is {
      label: string;
      type: 'danger' | 'primary' | 'success' | 'warning';
    } => Boolean(tag),
  );
}

function buildContagiousTags(record: ApplicationRegistrationWorkbenchRecord) {
  const tags = [
    { active: record.contagiousSpecimen.isolation, label: '隔离' },
    { active: record.contagiousSpecimen.hiv, label: 'HIV' },
    { active: record.contagiousSpecimen.tuberculosis, label: '结核' },
    { active: record.contagiousSpecimen.hepatitis, label: '肝炎' },
    { active: record.contagiousSpecimen.syphilis, label: '梅毒' },
  ];

  return tags.filter((tag) => tag.active);
}

function buildGynecologyTags(record: ApplicationRegistrationWorkbenchRecord) {
  const conditions = record.gynecologyInfo.specialConditions;
  const tags = [
    { active: conditions.menopause, label: '绝经' },
    { active: conditions.hormoneReplacement, label: 'HRT' },
    { active: conditions.birthControl, label: '避孕药/针' },
    { active: conditions.iud, label: '宫内节育器' },
    { active: conditions.pregnancy, label: '妊娠' },
    { active: conditions.lactation, label: '哺乳期' },
    { active: conditions.abnormalBleeding, label: '异常流血' },
    { active: conditions.radiotherapy, label: '放射治疗' },
    { active: conditions.hysterectomy, label: '子宫全切术后' },
  ];

  return tags.filter((tag) => tag.active);
}

function buildSections(record: ApplicationRegistrationWorkbenchRecord): WorkbenchSection[] {
  return [
    {
      key: 'clinical',
      title: '临床信息',
      items: [
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
          editorType: 'textarea',
          key: 'clinicalHistory',
          label: '临床病史',
          rows: 3,
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
          rows: 3,
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
          editorType: 'text',
          key: 'clinicalDiagnosis',
          label: '临床诊断',
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
          rows: 3,
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
          rows: 3,
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
        },
        {
          editorType: 'textarea',
          key: 'clinicalFindings',
          label: '术中所见',
          rows: 3,
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
          label: '固定时间/人',
          value: `${formatValue(record.surgeryInfo.fixationTime)} / ${formatValue(
            record.surgeryInfo.fixationPerson,
          )}`,
        },
        {
          editorType: 'text',
          key: 'fixativeType',
          label: '固定液',
          value: formatValue(record.surgeryInfo.fixativeType),
          writeBack: (currentRecord, value) => ({
            ...currentRecord,
            surgeryInfo: {
              ...currentRecord.surgeryInfo,
              fixativeType: normalizeTextValue(value),
            },
          }),
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
          options: [
            { label: '是', value: 'true' },
            { label: '否', value: 'false' },
          ],
          value: record.gynecologyInfo.menopause ? '是' : '否',
          writeBack: (currentRecord, value) => {
            const normalizedValue = value === 'true';
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
          label: '最后月经',
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
          label: 'HPV',
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
          label: '既往宫颈脱落细胞',
          rows: 3,
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
          label: '既往治疗',
          rows: 3,
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
          label: '其他说明',
          rows: 3,
          value: formatValue(
            record.gynecologyInfo.specialConditions.other ||
              record.gynecologyInfo.additionalNotes,
          ),
          writeBack: (currentRecord, value) => ({
            ...currentRecord,
            gynecologyInfo: {
              ...currentRecord.gynecologyInfo,
              additionalNotes: normalizeTextValue(value),
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
</script>

<template>
  <WorkflowSectionCard title="患者信息">
    <template v-if="props.record" #extra>
      <ElButton disabled size="small">补打申请单号</ElButton>
    </template>

    <template v-if="props.record">
      <div class="flex h-full min-h-0 flex-col gap-3">
        <div class="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          <div
            v-for="item in buildSummaryItems(props.record)"
            :key="item.label"
            class="rounded-md border border-border/80 bg-muted/15 px-4 py-3"
          >
            <div class="text-xs font-medium text-muted-foreground">{{ item.label }}</div>
            <div class="mt-1 break-words text-[13px] font-semibold text-foreground sm:text-sm">
              {{ item.value }}
            </div>
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <ElTag
            v-for="tag in buildPatientTags(props.record)"
            :key="tag.label"
            :type="tag.type"
            effect="plain"
            size="small"
          >
            {{ tag.label }}
          </ElTag>
          <ElTag
            v-for="tag in buildContagiousTags(props.record)"
            :key="tag.label"
            effect="plain"
            size="small"
            type="danger"
          >
            {{ tag.label }}
          </ElTag>
        </div>

        <ElScrollbar class="min-h-0 flex-1">
          <div class="grid gap-2 pr-2 xl:grid-cols-3">
            <section
              v-for="section in buildSections(props.record)"
              :key="section.key"
              class="overflow-hidden rounded-lg border border-border/80 bg-background/70"
            >
              <div class="border-b border-border/70 px-3 py-2 text-sm font-semibold text-foreground">
                {{ section.title }}
              </div>

              <div class="divide-y divide-border/60">
                <div
                  v-for="item in section.items"
                  :key="item.key"
                  :data-testid="`patient-item-${item.key}`"
                  class="group/item relative flex flex-col gap-1.5 px-3 py-2.5 transition-colors hover:bg-primary/5"
                >
                  <button
                    v-if="item.editorType !== 'readonly' && activeEditorKey !== item.key"
                    :data-testid="`patient-edit-${item.key}`"
                    class="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-md border border-border/70 bg-background/95 text-muted-foreground opacity-0 shadow-sm transition-all duration-150 hover:border-primary/50 hover:text-primary group-hover/item:opacity-100"
                    type="button"
                    @click.stop="beginEditing(item)"
                  >
                    <span class="text-[13px] leading-none">编</span>
                  </button>

                  <div
                    class="pr-8 text-xs font-medium text-muted-foreground"
                    :class="item.editorType === 'readonly' ? 'pr-0' : ''"
                  >
                    {{ item.label }}
                  </div>

                  <template v-if="activeEditorKey === item.key">
                    <div :data-editor-key="item.key" class="flex items-start gap-2">
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
                          :autosize="{ minRows: item.rows ?? 2, maxRows: item.rows ?? 4 }"
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

                      <div class="flex shrink-0 flex-col gap-1">
                        <ElButton
                          :data-testid="`patient-save-${item.key}`"
                          circle
                          plain
                          size="small"
                          type="primary"
                          @click="saveEditing(item)"
                        >
                          <span class="text-[13px] leading-none">存</span>
                        </ElButton>
                        <ElButton
                          :data-testid="`patient-cancel-${item.key}`"
                          circle
                          plain
                          size="small"
                          @click="cancelEditing"
                        >
                          <span class="text-[13px] leading-none">取消</span>
                        </ElButton>
                      </div>
                    </div>
                  </template>

                  <div
                    v-else
                    :data-testid="`patient-value-${item.key}`"
                    class="break-words text-sm font-medium leading-6 text-foreground"
                    :class="item.editorType === 'readonly' ? '' : 'cursor-text'"
                    @dblclick="handleValueDoubleClick(item)"
                  >
                    {{ item.value }}
                  </div>
                </div>
              </div>

              <div
                v-if="section.key === 'gynecology' && buildGynecologyTags(props.record).length > 0"
                class="border-t border-border/60 px-3 py-2.5"
              >
                <div class="flex flex-wrap gap-2">
                  <ElTag
                    v-for="tag in buildGynecologyTags(props.record)"
                    :key="tag.label"
                    effect="plain"
                    size="small"
                    type="warning"
                  >
                    {{ tag.label }}
                  </ElTag>
                </div>
              </div>
            </section>
          </div>
        </ElScrollbar>
      </div>
    </template>

    <ElEmpty v-else description="请先查询住院号或申请单号" />
  </WorkflowSectionCard>
</template>
