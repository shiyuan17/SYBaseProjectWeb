import type { ApplicationRegistrationWorkbenchRecord } from '../types/application-registration-workbench';

import { formatApplicationType } from './format';

export type WorkbenchEditorType = 'readonly' | 'select' | 'text' | 'textarea';

export type WorkbenchInfoItem = {
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

export type WorkbenchSection = {
  items: WorkbenchInfoItem[];
  key: string;
  title: string;
};

const booleanEditorOptions = [
  { label: '是', value: 'true' },
  { label: '否', value: 'false' },
] as const;

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

export function buildSummaryItems(
  record: ApplicationRegistrationWorkbenchRecord,
): WorkbenchInfoItem[] {
  return [
    {
      editorType: 'readonly',
      emphasized: true,
      key: 'applicationNo',
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
      emphasized: true,
      key: 'patientName',
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
      value: formatApplicationType(record.patientInfo.specimenType),
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

export function buildSections(
  record: ApplicationRegistrationWorkbenchRecord,
  context: { buildingLabel: string; roomLabel: string },
): WorkbenchSection[] {
  return [
    {
      key: 'application',
      title: '申请信息',
      items: [
        {
          editorType: 'textarea',
          key: 'clinicalHistory',
          label: '临床病史',
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
          span: 3,
          value: `${formatValue(context.buildingLabel)} / ${formatValue(context.roomLabel)}`,
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
          span: 3,
          value: `${formatValue(record.surgeryInfo.fixationTime)} / ${formatValue(record.surgeryInfo.fixationPerson)}`,
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
          label: '口服雌激素 HRT',
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

export function getSectionDescriptionColumns() {
  return 3;
}

export function getSectionItemSpan(item: WorkbenchInfoItem) {
  if (item.span) {
    return item.span;
  }

  if (item.editorType === 'textarea') {
    return 2;
  }

  return 1;
}

export function getSummaryItemValueClass(item: WorkbenchInfoItem) {
  if (item.key === 'applicationNo') {
    return 'text-[12px] font-semibold';
  }

  if (item.emphasized) {
    return 'text-[13px] font-semibold';
  }

  return '';
}

export function getReprintApplicationIdentifier(
  record: ApplicationRegistrationWorkbenchRecord | null,
) {
  return (
    record?.applicationId?.trim() ||
    record?.patientInfo.applicationNo?.trim() ||
    ''
  );
}
