<script setup lang="ts">
import type {
  DiagnosisWorkbenchReportDraftValue,
  DiagnosticReportPrintPreview,
  DiagnosticWorkbenchView,
} from '../types/doctor-workflow';

import { computed, nextTick, reactive, ref, watch } from 'vue';

import { BookOpenText, InspectionPanel, TextQuote } from '@vben/icons';

import {
  ElButton,
  ElDialog,
  ElDrawer,
  ElEmpty,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
  ElTag,
  ElTooltip,
  ElTree,
} from 'element-plus';

import { formatDateTime, formatNullable } from '../utils/format';

type ReportDraft = {
  bedNo: string;
  checkItem: string;
  clinicalDiagnosis: string;
  deliveredAt: string;
  diagnosisDoctor: string;
  finalDiagnosis: string;
  grossExam: string;
  inpatientNo: string;
  inspectionDate: string;
  microscopicExam: string;
  patientAge: string;
  patientGender: string;
  patientId: string;
  patientName: string;
  phone: string;
  reportDate: string;
  reportNo: string;
  reviewDoctor: string;
  specimenMaterial: string;
  submittingDepartmentName: string;
  submittingDoctorName: string;
};

type ReportDraftKey = keyof ReportDraft;

type ReportFieldConfig = {
  class?: string;
  label: string;
  model: ReportDraftKey;
};

type ReportTemplateSectionKey =
  | 'finalDiagnosis'
  | 'grossExam'
  | 'microscopicExam';

type ReportStyleTemplateType =
  | 'bladder'
  | 'cellDna'
  | 'classicDefault'
  | 'colorectalGene'
  | 'default'
  | 'gastric'
  | 'gynecologic'
  | 'nasopharyngeal'
  | 'str'
  | 'tumorOrigin';

type ReportStyleConfig = {
  accentColor: string;
  hospitalName: string;
  label: string;
  reportTitle: string;
  sectionLabels: Record<ReportTemplateSectionKey, string>;
  templateType: ReportStyleTemplateType;
  value: string;
};

type ReportTemplateTreeNode = {
  children?: ReportTemplateTreeNode[];
  content?: string;
  id: string;
  label: string;
  type: 'category' | 'template';
};

type ReportTemplateSectionConfig = {
  drawerTitle: string;
  fieldLabel: string;
  icon: typeof BookOpenText;
  key: ReportTemplateSectionKey;
  searchPlaceholder: string;
  templateTree: ReportTemplateTreeNode[];
};

type StructuredReportFieldConfig = {
  key: string;
  label: string;
  wide?: boolean;
};

type StructuredReportSectionConfig = {
  key: string;
  options?: string[];
  title: string;
  type: 'checkboxes' | 'textarea';
};

type StructuredReportTableConfig = {
  columns: string[];
  rows: string[];
  title: string;
};

type StructuredReportTemplateConfig = {
  fields: StructuredReportFieldConfig[];
  sections: StructuredReportSectionConfig[];
  tables?: StructuredReportTableConfig[];
};

type ReportMicroscopicImageItem = {
  fileUrl: string;
  key: string;
  title: string;
};

type ReportMicroscopicImageLayout = {
  left: number;
  top: number;
};

const props = defineProps<{
  capturedImages: ReportMicroscopicImageItem[];
  loading: boolean;
  workbench: DiagnosticWorkbenchView | null;
}>();

const emit = defineEmits<{
  draftChange: [draft: DiagnosisWorkbenchReportDraftValue];
  previewChange: [preview: DiagnosticReportPrintPreview | null];
}>();

const printPreviewVisible = defineModel<boolean>('printPreviewVisible', {
  default: false,
});

const reportDraft = reactive<ReportDraft>({
  bedNo: '',
  checkItem: '',
  clinicalDiagnosis: '',
  deliveredAt: '',
  diagnosisDoctor: '',
  finalDiagnosis: '',
  grossExam: '',
  inpatientNo: '',
  inspectionDate: '',
  microscopicExam: '',
  patientAge: '',
  patientGender: '',
  patientId: '',
  patientName: '',
  phone: '',
  reportDate: '',
  reportNo: '',
  reviewDoctor: '',
  specimenMaterial: '',
  submittingDepartmentName: '',
  submittingDoctorName: '',
});

const cellDnaDraft = reactive({
  reportTextPreview: '',
  tbsOpinion: '',
});
const selectedCellDnaOpinions = ref<string[]>([]);
const selectedCellDnaSuggestions = ref<string[]>([]);
const classicClinicalMatchOptions = [
  '未标记临床符合',
  '临床符合',
  '临床不符合',
  '不宜对比',
];
const classicDiagnosisMatchOptions = [
  '未标记诊断符合',
  '诊断符合',
  '诊断基本符合',
  '诊断不符合',
];
const classicReportFlagOptions = ['阳性', '阴性', '签发', '复核'];
const classicClinicalMatchValue = ref('临床符合');
const classicDiagnosisMatchValue = ref('未标记诊断符合');
const classicReportFlags = ref<string[]>([]);
const cellDnaOpinionOptions = [
  '未见DNA倍体异常细胞；未见DNA倍体异常细胞。',
  '可见大量DNA倍体异常细胞；可见大量DNA倍体异常细胞。',
  '细胞数量少，未见DNA倍体异常细胞:细胞数量少，未见DNA倍体异常细胞。',
  '可见少量DNA倍体异常细胞；可见少量DNA倍体异常细胞。',
];
const cellDnaSuggestionOptions = [
  '请结合临床处理，3-6个月复查或活检；请结合临床处理，3-6个月复查或活检。',
  '阴道镜检查及活体组织检查；阴道镜检查及活体组织检查。',
  '结合TBS结果，3-6个月复查；结合TBS结果，3-6个月复查。',
  '结合TBS结果，阴道镜检查及活体组织检查；结合TBS结果，阴道镜检查及活体组织检查。',
  '请结合临床处理，3-6月复查。',
  '一年复查。',
];
const strDraft = reactive({
  dnaConcentration: '',
  instrument: '',
  pathologyDiagnosis: '',
  reagentBatchNo: '',
  sampleType: '',
  submissionType: '',
});
const strLoci = [
  'D3S1358',
  'THO1',
  'D21S11',
  'D18S51',
  'Penta E',
  'D5S818',
  'D13S317',
  'D7S820',
];
const strResults = reactive(
  Object.fromEntries(
    strLoci.map((locus) => [locus, { fetus: '', mother: '' }]),
  ) as Record<string, { fetus: string; mother: string }>,
);
const structuredFieldValues = reactive<Record<string, string>>({});
const structuredSectionValues = reactive<Record<string, string>>({});
const structuredCheckboxValues = reactive<Record<string, string[]>>({});
const structuredTableValues = reactive<Record<string, string>>({});
const microscopicImageLayouts = reactive<
  Record<string, ReportMicroscopicImageLayout>
>({});
const microscopicImageCanvasRef = ref<HTMLElement>();
const manuallyPositionedMicroscopicImageKeys = ref(new Set<string>());
const microscopicImageSize = {
  gap: 16,
  height: 72,
  padding: 12,
  width: 96,
};

const reportNo = computed(() => formatNullable(reportDraft.reportNo));
const inspectionDate = computed(() =>
  formatNullable(reportDraft.inspectionDate),
);
const reviewDoctorLabel = computed(() =>
  formatNullable(reportDraft.reviewDoctor),
);
const diagnosisDoctorLabel = computed(() =>
  formatNullable(reportDraft.diagnosisDoctor),
);
const reportDateLabel = computed(() => formatNullable(reportDraft.reportDate));
const commonPathologySectionLabels = {
  finalDiagnosis: '病理诊断及建议:',
  grossExam: '肉眼所见:',
  microscopicExam: '光镜所见:',
} satisfies Record<ReportTemplateSectionKey, string>;
const molecularReportSectionLabels = {
  finalDiagnosis: '结论及建议:',
  grossExam: '检测结果:',
  microscopicExam: '结果分析:',
} satisfies Record<ReportTemplateSectionKey, string>;
const reportStyleOptions = [
  {
    accentColor: '#f00',
    hospitalName: '',
    label: '默认模板',
    reportTitle: '默认模板',
    sectionLabels: {
      finalDiagnosis: '病理诊断',
      grossExam: '大体所见',
      microscopicExam: '镜下所见',
    },
    templateType: 'classicDefault',
    value: 'default',
  },
  {
    accentColor: '#f00',
    hospitalName: '南方医科大学南方医院病理科',
    label: '所见即所得模板',
    reportTitle: '病理检查报告单',
    sectionLabels: commonPathologySectionLabels,
    templateType: 'default',
    value: 'wysiwyg-template',
  },
  {
    accentColor: '#005c99',
    hospitalName: '南海人民医院',
    label: '南海人民医院STR报告',
    reportTitle: '项目：葡萄胎STR检测',
    sectionLabels: molecularReportSectionLabels,
    templateType: 'str',
    value: 'nh-str',
  },
  {
    accentColor: '#d81b60',
    hospitalName: '佛山市中医院病理科',
    label: '妇科液基细胞学【佛中】',
    reportTitle: '妇科液基细胞学检查报告单',
    sectionLabels: {
      finalDiagnosis: '诊断意见:',
      grossExam: '细胞学所见:',
      microscopicExam: '病原体提示:',
    },
    templateType: 'gynecologic',
    value: 'gynecologic-liquid-cytology',
  },
  {
    accentColor: '#00695c',
    hospitalName: '南海人民医院病理科',
    label: '细胞DNA定量分析',
    reportTitle: '细胞DNA定量分析',
    sectionLabels: molecularReportSectionLabels,
    templateType: 'cellDna',
    value: 'cell-dna-quantification',
  },
  {
    accentColor: '#7b1fa2',
    hospitalName: '市八医院病理科',
    label: '市八鼻咽癌检测报告',
    reportTitle: '鼻咽癌检测报告单',
    sectionLabels: molecularReportSectionLabels,
    templateType: 'nasopharyngeal',
    value: 'nasopharyngeal-carcinoma',
  },
  {
    accentColor: '#f00',
    hospitalName: '南方医科大学南方医院病理科',
    label: '胃癌根治标本病理报告',
    reportTitle: '胃癌根治标本病理报告',
    sectionLabels: {
      finalDiagnosis: '病理诊断:',
      grossExam: '肉眼所见:',
      microscopicExam: '光镜所见:',
    },
    templateType: 'gastric',
    value: 'gastric-cancer-radical',
  },
  {
    accentColor: '#1565c0',
    hospitalName: '南海人民医院病理科',
    label: '肿瘤组织起源基因检测报告单',
    reportTitle: '肿瘤组织起源基因检测报告单',
    sectionLabels: molecularReportSectionLabels,
    templateType: 'tumorOrigin',
    value: 'tumor-origin-gene',
  },
  {
    accentColor: '#2e7d32',
    hospitalName: '南海人民医院病理科',
    label: '肠癌KRAS、NRAS、BRAF、PIK3CA、POLE基因检测（PCR法）',
    reportTitle: '肠癌相关基因检测报告单',
    sectionLabels: molecularReportSectionLabels,
    templateType: 'colorectalGene',
    value: 'colorectal-gene-pcr',
  },
  {
    accentColor: '#c62828',
    hospitalName: '南海人民医院病理科',
    label: '膀胱癌V1',
    reportTitle: '膀胱癌病理报告单',
    sectionLabels: commonPathologySectionLabels,
    templateType: 'bladder',
    value: 'bladder-cancer-v1',
  },
] satisfies [ReportStyleConfig, ...ReportStyleConfig[]];
const selectedReportStyleValue = ref(reportStyleOptions[0].value);
const activeReportStyle = computed(
  () =>
    reportStyleOptions.find(
      (style) => style.value === selectedReportStyleValue.value,
    ) ?? reportStyleOptions[0],
);
const microscopicReportImages = computed(() => props.capturedImages);
const isClassicDefaultReportTemplate = computed(
  () => activeReportStyle.value.templateType === 'classicDefault',
);
const isDefaultReportTemplate = computed(
  () => activeReportStyle.value.templateType === 'default',
);
const isCellDnaReportTemplate = computed(
  () => activeReportStyle.value.templateType === 'cellDna',
);
const isStrReportTemplate = computed(
  () => activeReportStyle.value.templateType === 'str',
);
const structuredReportTemplateConfigs: Partial<
  Record<ReportStyleTemplateType, StructuredReportTemplateConfig>
> = {
  bladder: {
    fields: [
      { key: 'bladder_tumorSite', label: '肿瘤部位:' },
      { key: 'bladder_specimenType', label: '标本类型:' },
      { key: 'bladder_tumorSize', label: '肿瘤大小:' },
      { key: 'bladder_grade', label: '组织学分级:' },
      { key: 'bladder_muscleInvasion', label: '肌层侵犯:' },
      { key: 'bladder_margin', label: '切缘情况:' },
    ],
    sections: [
      {
        key: 'bladder_microscopy',
        title: '镜下描述:',
        type: 'textarea',
      },
      {
        key: 'bladder_stage',
        options: [
          '非浸润性乳头状尿路上皮癌',
          '浸润固有层',
          '浸润肌层',
          '脉管内癌栓可疑',
        ],
        title: '分期要点:',
        type: 'checkboxes',
      },
      {
        key: 'bladder_diagnosis',
        title: '诊断意见:',
        type: 'textarea',
      },
    ],
  },
  colorectalGene: {
    fields: [
      { key: 'colorectal_specimenNo', label: '样本编号:' },
      { key: 'colorectal_tumorContent', label: '肿瘤含量:' },
      { key: 'colorectal_method', label: '检测方法:' },
      { key: 'colorectal_platform', label: '检测平台:' },
      { key: 'colorectal_reagentBatch', label: '试剂批号:' },
      { key: 'colorectal_reportDate', label: '报告日期:' },
    ],
    sections: [
      {
        key: 'colorectal_interpretation',
        title: '临床意义:',
        type: 'textarea',
      },
    ],
    tables: [
      {
        columns: ['检测基因', '检测位点', '检测结果'],
        rows: ['KRAS', 'NRAS', 'BRAF', 'PIK3CA', 'POLE'],
        title: '基因检测结果',
      },
    ],
  },
  gastric: {
    fields: [
      { key: 'gastric_site', label: '肿瘤部位:' },
      { key: 'gastric_size', label: '肿瘤大小:' },
      { key: 'gastric_type', label: '组织学类型:' },
      { key: 'gastric_depth', label: '浸润深度:' },
      { key: 'gastric_nodes', label: '淋巴结:' },
      { key: 'gastric_margin', label: '切缘:' },
    ],
    sections: [
      {
        key: 'gastric_gross',
        title: '大体描述:',
        type: 'textarea',
      },
      {
        key: 'gastric_keyPoints',
        options: ['神经侵犯', '脉管癌栓', '浆膜受侵', '幽门螺杆菌相关改变'],
        title: '病理要点:',
        type: 'checkboxes',
      },
      {
        key: 'gastric_diagnosis',
        title: '病理诊断:',
        type: 'textarea',
      },
    ],
  },
  gynecologic: {
    fields: [
      { key: 'gyne_sampleQuality', label: '标本满意度:' },
      { key: 'gyne_epithelialCount', label: '上皮细胞量:' },
      { key: 'gyne_transformationZone', label: '转化区细胞:' },
      { key: 'gyne_inflammation', label: '炎症程度:' },
    ],
    sections: [
      {
        key: 'gyne_tbs',
        options: ['未见上皮内病变或恶性病变', 'ASC-US', 'LSIL', 'HSIL', 'AGC'],
        title: 'TBS分类:',
        type: 'checkboxes',
      },
      {
        key: 'gyne_microbe',
        options: ['滴虫', '霉菌', '线索细胞', '疱疹病毒改变', 'HPV感染提示'],
        title: '病原体提示:',
        type: 'checkboxes',
      },
      {
        key: 'gyne_suggestion',
        title: '诊断意见:',
        type: 'textarea',
      },
    ],
  },
  nasopharyngeal: {
    fields: [
      { key: 'npc_sampleNo', label: '样本编号:' },
      { key: 'npc_sampleType', label: '样本类型:' },
      { key: 'npc_method', label: '检测方法:' },
      { key: 'npc_ebvDna', label: 'EBV-DNA:' },
      { key: 'npc_internalControl', label: '内参结果:' },
      { key: 'npc_reportDate', label: '报告日期:' },
    ],
    sections: [
      {
        key: 'npc_result',
        options: [
          'EBV-DNA阴性',
          'EBV-DNA低拷贝阳性',
          'EBV-DNA阳性',
          '建议结合鼻咽镜及影像学检查',
        ],
        title: '检测结论:',
        type: 'checkboxes',
      },
      {
        key: 'npc_interpretation',
        title: '结果说明:',
        type: 'textarea',
      },
    ],
  },
  tumorOrigin: {
    fields: [
      { key: 'origin_sampleNo', label: '样本编号:' },
      { key: 'origin_tumorContent', label: '肿瘤细胞含量:' },
      { key: 'origin_panel', label: '检测Panel:' },
      { key: 'origin_quality', label: '质控结果:' },
    ],
    sections: [
      {
        key: 'origin_prediction',
        title: '组织起源预测:',
        type: 'textarea',
      },
      {
        key: 'origin_evidence',
        options: [
          '消化道来源倾向',
          '肺来源倾向',
          '乳腺来源倾向',
          '泌尿系统来源倾向',
          '妇科来源倾向',
        ],
        title: '支持证据:',
        type: 'checkboxes',
      },
      {
        key: 'origin_suggestion',
        title: '建议:',
        type: 'textarea',
      },
    ],
    tables: [
      {
        columns: ['候选来源', '匹配分值', '置信度'],
        rows: ['第一候选', '第二候选', '第三候选'],
        title: '预测排序',
      },
    ],
  },
};
const activeStructuredReportTemplate = computed(
  () => structuredReportTemplateConfigs[activeReportStyle.value.templateType],
);
const isStructuredReportTemplate = computed(() =>
  Boolean(activeStructuredReportTemplate.value),
);
initializeStructuredReportValues();
const templateDrawerVisible = ref(false);
const activeTemplateSectionKey =
  ref<ReportTemplateSectionKey>('finalDiagnosis');
const selectedTemplateNodeId = ref('');
const selectedReportTemplate = ref<null | ReportTemplateTreeNode>(null);
const templateSearchKeyword = ref('');

const reportMetaFields: ReportFieldConfig[] = [
  { label: '联系电话:', model: 'phone' },
  { label: '姓名:', model: 'patientName' },
  { label: '性别:', model: 'patientGender' },
  { label: '年龄:', model: 'patientAge' },
  { label: '病人ID:', model: 'patientId' },
  { label: '床号:', model: 'bedNo' },
  { label: '住院号:', model: 'inpatientNo' },
  { label: '送检医师:', model: 'submittingDoctorName' },
  { class: 'span-2', label: '送检科室:', model: 'submittingDepartmentName' },
  { class: 'span-2', label: '送检材料:', model: 'specimenMaterial' },
  { class: 'span-2', label: '检查项目:', model: 'checkItem' },
  { class: 'span-2', label: '临床诊断:', model: 'clinicalDiagnosis' },
  { class: 'span-2', label: '送检日期:', model: 'inspectionDate' },
];

const diagnosisTemplateTree: ReportTemplateTreeNode[] = [
  {
    children: [
      {
        content:
          '（胃窦）慢性浅表性胃炎，活动性轻度，未见明确萎缩、肠化或异型增生。',
        id: 'diagnosis-digestive-gastritis',
        label: '慢性浅表性胃炎',
        type: 'template',
      },
      {
        content: '（胃体）慢性萎缩性胃炎，伴肠上皮化生，建议结合内镜随访。',
        id: 'diagnosis-digestive-atrophic-gastritis',
        label: '慢性萎缩性胃炎',
        type: 'template',
      },
      {
        content: '（结肠）管状腺瘤，低级别上皮内瘤变，切缘请结合内镜所见评估。',
        id: 'diagnosis-digestive-adenoma',
        label: '管状腺瘤',
        type: 'template',
      },
    ],
    id: 'diagnosis-digestive',
    label: '胃肠',
    type: 'category',
  },
  {
    children: [
      {
        content: '（子宫内膜）增殖期改变，未见明确恶性肿瘤证据。',
        id: 'diagnosis-female-endometrium',
        label: '子宫内膜增殖期改变',
        type: 'template',
      },
      {
        content: '（宫颈）慢性宫颈炎，局灶鳞状上皮化生。',
        id: 'diagnosis-female-cervicitis',
        label: '慢性宫颈炎',
        type: 'template',
      },
    ],
    id: 'diagnosis-female',
    label: '女性生殖系统疾病',
    type: 'category',
  },
  {
    children: [
      {
        content: '（肺）慢性炎症伴纤维组织增生，未见明确恶性肿瘤证据。',
        id: 'diagnosis-respiratory-inflammation',
        label: '肺慢性炎症',
        type: 'template',
      },
      {
        content: '（肺）腺癌，建议结合免疫组化及分子检测结果进一步分型。',
        id: 'diagnosis-respiratory-adenocarcinoma',
        label: '肺腺癌',
        type: 'template',
      },
    ],
    id: 'diagnosis-respiratory',
    label: '呼吸系统、纵隔及心脏疾病',
    type: 'category',
  },
  {
    children: [
      {
        content: '（甲状腺）结节性甲状腺肿，局灶伴囊性变。',
        id: 'diagnosis-endocrine-thyroid-nodule',
        label: '结节性甲状腺肿',
        type: 'template',
      },
      {
        content: '（甲状腺）乳头状癌，建议结合临床完善分期及后续治疗评估。',
        id: 'diagnosis-endocrine-papillary-carcinoma',
        label: '甲状腺乳头状癌',
        type: 'template',
      },
    ],
    id: 'diagnosis-endocrine',
    label: '内分泌系统疾病',
    type: 'category',
  },
];

const finalDiagnosisTemplateSection: ReportTemplateSectionConfig = {
  drawerTitle: '病理诊断模板',
  fieldLabel: '病理诊断',
  icon: BookOpenText,
  key: 'finalDiagnosis',
  searchPlaceholder: '输入疾病名称或诊断关键词',
  templateTree: diagnosisTemplateTree,
};

const reportTemplateSections: ReportTemplateSectionConfig[] = [
  {
    drawerTitle: '肉眼所见模板',
    fieldLabel: '肉眼所见',
    icon: TextQuote,
    key: 'grossExam',
    searchPlaceholder: '输入标本名称或肉眼模板关键词',
    templateTree: [
      {
        children: [
          {
            content:
              '送检：胃黏膜组织数块，灰白灰红色，合计约cm*cm*cm，全取1盒。',
            id: 'gross-digestive-stomach',
            label: '胃黏膜活检',
            type: 'template',
          },
          {
            content:
              '送检：肠黏膜组织数块，灰白灰红色，大小约cm*cm*cm，全取1盒。',
            id: 'gross-digestive-intestine',
            label: '肠黏膜活检',
            type: 'template',
          },
        ],
        id: 'gross-digestive',
        label: '消化系统',
        type: 'category',
      },
      {
        children: [
          {
            content:
              '送检：肺组织一块，灰白灰红色，大小约cm*cm*cm，切面实性，质中，全取1盒。',
            id: 'gross-respiratory-lung',
            label: '肺组织',
            type: 'template',
          },
        ],
        id: 'gross-respiratory',
        label: '呼吸系统',
        type: 'category',
      },
    ],
  },
  {
    drawerTitle: '光镜所见模板',
    fieldLabel: '光镜所见',
    icon: InspectionPanel,
    key: 'microscopicExam',
    searchPlaceholder: '输入镜下表现或模板关键词',
    templateTree: [
      {
        children: [
          {
            content: '镜下见黏膜慢性炎细胞浸润，局灶活动性炎，腺体结构尚可。',
            id: 'micro-inflammation-chronic',
            label: '慢性活动性炎',
            type: 'template',
          },
          {
            content: '镜下见组织纤维化伴慢性炎细胞浸润，局灶出血及坏死样改变。',
            id: 'micro-inflammation-fibrosis',
            label: '纤维化伴慢性炎',
            type: 'template',
          },
        ],
        id: 'micro-inflammation',
        label: '炎症与反应性改变',
        type: 'category',
      },
      {
        children: [
          {
            content:
              '镜下见腺上皮呈管状或乳头状增生，细胞轻中度异型，间质少量慢性炎细胞浸润。',
            id: 'micro-neoplasm-adenoma',
            label: '腺瘤样改变',
            type: 'template',
          },
          {
            content:
              '镜下见异型细胞浸润性生长，核大深染，核分裂象可见，需结合免疫组化进一步判断。',
            id: 'micro-neoplasm-malignant',
            label: '恶性肿瘤提示',
            type: 'template',
          },
        ],
        id: 'micro-neoplasm',
        label: '肿瘤性病变',
        type: 'category',
      },
    ],
  },
  finalDiagnosisTemplateSection,
];

const activeTemplateSection = computed(
  () =>
    reportTemplateSections.find(
      (section) => section.key === activeTemplateSectionKey.value,
    ) ?? finalDiagnosisTemplateSection,
);
const filteredTemplateTree = computed(() =>
  filterReportTemplateTree(
    activeTemplateSection.value.templateTree,
    templateSearchKeyword.value,
  ),
);
const templateExpandedKeys = computed(() =>
  collectCategoryKeys(filteredTemplateTree.value),
);
const reportTemplateTreeProps = {
  children: 'children',
  label: 'label',
};
const templateStageOptions = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
const reportPrintNote =
  '注：该报告附加手写签名后有效。送检医生对本诊断有疑问，请立即与本科有关医师联系。';

function draftValue(value?: null | string) {
  return formatNullable(value);
}

function tableCellKey(
  table: StructuredReportTableConfig,
  row: string,
  column: string,
) {
  return `${table.title}::${row}::${column}`;
}

function getStrResult(locus: string) {
  strResults[locus] ??= { fetus: '', mother: '' };
  return strResults[locus];
}

function initializeStructuredReportValues() {
  for (const config of Object.values(structuredReportTemplateConfigs)) {
    if (!config) {
      continue;
    }
    for (const field of config.fields) {
      structuredFieldValues[field.key] ??= '';
    }
    for (const section of config.sections) {
      if (section.type === 'checkboxes') {
        structuredCheckboxValues[section.key] ??= [];
      } else {
        structuredSectionValues[section.key] ??= '';
      }
    }
    for (const table of config.tables ?? []) {
      for (const row of table.rows) {
        for (const column of table.columns.slice(1)) {
          structuredTableValues[tableCellKey(table, row, column)] ??= '';
        }
      }
    }
  }
}

watch(
  () =>
    props.workbench?.currentReport?.reportId ?? props.workbench?.caseId ?? '',
  () => {
    const workbench = props.workbench;
    const currentReport = workbench?.currentReport;

    reportDraft.deliveredAt = draftValue(
      formatDateTime(workbench?.deliveredAt),
    );
    reportDraft.reportNo = draftValue(
      currentReport?.reportNo ?? workbench?.pathologyNo,
    );
    reportDraft.phone = draftValue(workbench?.phone);
    reportDraft.patientName = draftValue(workbench?.patientName);
    reportDraft.patientGender = draftValue(workbench?.patientGender);
    reportDraft.patientAge = draftValue(workbench?.patientAge);
    reportDraft.patientId = draftValue(workbench?.patientId);
    reportDraft.inpatientNo = draftValue(workbench?.inpatientNo);
    reportDraft.bedNo = draftValue(workbench?.bedNo);
    reportDraft.submittingDepartmentName = draftValue(
      workbench?.submittingDepartmentName,
    );
    reportDraft.submittingDoctorName = draftValue(
      workbench?.submittingDoctorName,
    );
    reportDraft.checkItem = draftValue(workbench?.checkItem);
    reportDraft.specimenMaterial = draftValue(
      workbench?.specimens
        .map((specimen) => specimen.specimenName)
        .filter(Boolean)
        .join('、'),
    );
    reportDraft.clinicalDiagnosis = draftValue(workbench?.clinicalDiagnosis);
    reportDraft.inspectionDate = draftValue(
      formatDateTime(workbench?.deliveredAt ?? workbench?.detachedAt),
    );
    reportDraft.reviewDoctor = draftValue(currentReport?.reviewerName);
    reportDraft.diagnosisDoctor = draftValue(currentReport?.signedByName);
    reportDraft.reportDate = draftValue(
      formatDateTime(
        currentReport?.signedAt ??
          currentReport?.submittedAt ??
          currentReport?.publishedAt,
      ),
    );
    reportDraft.grossExam = props.workbench?.currentReport?.grossExam ?? '';
    reportDraft.microscopicExam =
      props.workbench?.currentReport?.microscopicExam ?? '';
    reportDraft.finalDiagnosis =
      props.workbench?.currentReport?.finalDiagnosis ?? '';
  },
  { immediate: true },
);

const printPreviewSnapshot = computed<DiagnosticReportPrintPreview | null>(
  () => {
    if (!props.workbench) {
      return null;
    }

    const reportStyle = activeReportStyle.value;
    return {
      accentColor: reportStyle.accentColor,
      deliveredAt: reportDraft.deliveredAt,
      footerFields: [
        { label: '审核医师:', value: reviewDoctorLabel.value },
        { label: '诊断医师:', value: diagnosisDoctorLabel.value },
        { label: '报告日期:', value: reportDateLabel.value },
      ],
      hospitalName: reportStyle.hospitalName,
      metaFields: reportMetaFields.map((field) => ({
        class: field.class,
        label: field.label,
        value: reportDraft[field.model],
      })),
      note: reportPrintNote,
      reportNo: reportDraft.reportNo,
      reportTitle: reportStyle.reportTitle,
      sections: [
        {
          label: reportStyle.sectionLabels.grossExam,
          minHeight: 82,
          value: reportDraft.grossExam,
        },
        {
          images: microscopicReportImages.value.map((image) => ({
            ...image,
            ...getMicroscopicImageLayout(image.key, 0),
          })),
          label: reportStyle.sectionLabels.microscopicExam,
          minHeight: 160,
          value: reportDraft.microscopicExam,
        },
        {
          label: reportStyle.sectionLabels.finalDiagnosis,
          minHeight: 92,
          value: reportDraft.finalDiagnosis,
        },
      ],
    };
  },
);

watch(
  printPreviewSnapshot,
  (snapshot) => {
    emit('previewChange', snapshot);
  },
  { immediate: true },
);

watch(
  reportDraft,
  (draft) => {
    emit('draftChange', {
      clinicalDiagnosis: draft.clinicalDiagnosis,
      finalDiagnosis: draft.finalDiagnosis,
      grossExam: draft.grossExam,
      microscopicExam: draft.microscopicExam,
      reportNo: draft.reportNo,
      reportNoLabel: draft.reportNo,
      richTextContent: '',
    });
  },
  { deep: true, immediate: true },
);

watch(
  microscopicReportImages,
  async (images) => {
    const activeKeys = new Set(images.map((image) => image.key));
    await nextTick();
    syncDefaultMicroscopicImageLayouts(images);

    for (const key of Object.keys(microscopicImageLayouts)) {
      if (!activeKeys.has(key)) {
        delete microscopicImageLayouts[key];
      }
    }
    for (const key of manuallyPositionedMicroscopicImageKeys.value) {
      if (!activeKeys.has(key)) {
        manuallyPositionedMicroscopicImageKeys.value.delete(key);
      }
    }
  },
  { immediate: true },
);

function createDefaultImageLayout(index: number): ReportMicroscopicImageLayout {
  const canvasWidth =
    microscopicImageCanvasRef.value?.getBoundingClientRect().width || 520;
  const availableWidth = Math.max(
    microscopicImageSize.width,
    canvasWidth - microscopicImageSize.padding * 2,
  );
  const columnCount = Math.max(
    1,
    Math.floor(
      (availableWidth + microscopicImageSize.gap) /
        (microscopicImageSize.width + microscopicImageSize.gap),
    ),
  );
  const columnIndex = index % columnCount;
  const rowIndex = Math.floor(index / columnCount);

  return {
    left:
      microscopicImageSize.padding +
      columnIndex * (microscopicImageSize.width + microscopicImageSize.gap),
    top:
      microscopicImageSize.padding +
      rowIndex * (microscopicImageSize.height + microscopicImageSize.gap),
  };
}

function syncDefaultMicroscopicImageLayouts(
  images: ReportMicroscopicImageItem[],
) {
  images.forEach((image, index) => {
    if (!manuallyPositionedMicroscopicImageKeys.value.has(image.key)) {
      microscopicImageLayouts[image.key] = createDefaultImageLayout(index);
    }
  });
}

function getMicroscopicImageLayout(
  key: string,
  index: number,
): ReportMicroscopicImageLayout {
  const layout = microscopicImageLayouts[key];
  if (layout) {
    return layout;
  }

  microscopicImageLayouts[key] = createDefaultImageLayout(index);
  return microscopicImageLayouts[key];
}

function clampImagePosition(value: number, max: number) {
  return Math.min(Math.max(value, 0), Math.max(max, 0));
}

function getMicroscopicImageStyle(key: string) {
  const imageIndex = microscopicReportImages.value.findIndex(
    (image) => image.key === key,
  );
  const layout = getMicroscopicImageLayout(key, Math.max(imageIndex, 0));
  return {
    left: `${layout.left}px`,
    top: `${layout.top}px`,
  };
}

function handleMicroscopicImagePointerDown(
  imageKey: string,
  event: PointerEvent,
) {
  if (event.button !== 0) {
    return;
  }

  const canvasElement = microscopicImageCanvasRef.value;
  if (!canvasElement) {
    return;
  }

  event.preventDefault();
  manuallyPositionedMicroscopicImageKeys.value.add(imageKey);
  const targetElement = event.currentTarget as HTMLElement;
  const canvasRect = canvasElement.getBoundingClientRect();
  const imageRect = targetElement.getBoundingClientRect();
  const canvasWidth = canvasRect.width || 520;
  const canvasHeight = canvasRect.height || 160;
  const imageWidth = imageRect.width || 96;
  const imageHeight = imageRect.height || 72;
  const startX = event.clientX;
  const startY = event.clientY;
  const imageIndex = microscopicReportImages.value.findIndex(
    (image) => image.key === imageKey,
  );
  const startLayout = {
    ...getMicroscopicImageLayout(imageKey, Math.max(imageIndex, 0)),
  };

  const handlePointerMove = (moveEvent: PointerEvent) => {
    const layout = getMicroscopicImageLayout(imageKey, Math.max(imageIndex, 0));
    layout.left = clampImagePosition(
      startLayout.left + moveEvent.clientX - startX,
      canvasWidth - imageWidth,
    );
    layout.top = clampImagePosition(
      startLayout.top + moveEvent.clientY - startY,
      canvasHeight - imageHeight,
    );
  };

  const stopDragging = () => {
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', stopDragging);
    window.removeEventListener('pointercancel', stopDragging);
  };

  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', stopDragging, { once: true });
  window.addEventListener('pointercancel', stopDragging, { once: true });
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildPrintField(label: string, value?: null | string) {
  return `
    <div class="field">
      <span class="label">${escapeHtml(label)}</span>
      <span class="value">${escapeHtml(formatNullable(value))}</span>
    </div>
  `;
}

function buildPrintSection(label: string, value: string, minHeight: number) {
  return `
    <section class="report-section" style="min-height:${minHeight}px">
      <div class="section-title">${escapeHtml(label)}</div>
      <div class="section-value">${escapeHtml(value || ' ')}</div>
    </section>
  `;
}

function buildMicroscopicPrintImages() {
  if (microscopicReportImages.value.length === 0) {
    return '';
  }

  return `
    <div class="section-image-stage">
      ${microscopicReportImages.value
          .map((image) => {
            const imageIndex = microscopicReportImages.value.findIndex(
              (item) => item.key === image.key,
            );
            const layout = getMicroscopicImageLayout(
              image.key,
              Math.max(imageIndex, 0),
            );
            return `
            <img
              alt="${escapeHtml(image.title)}"
              class="section-image"
              src="${escapeHtml(image.fileUrl)}"
              style="left:${layout.left}px; top:${layout.top}px;"
            />
          `;
          })
          .join('')}
    </div>
  `;
}

function buildMicroscopicPrintSection(
  label: string,
  value: string,
  minHeight: number,
) {
  return `
    <section class="report-section" style="min-height:${minHeight}px">
      <div class="section-title">${escapeHtml(label)}</div>
      <div class="section-value">${escapeHtml(value || ' ')}</div>
      ${buildMicroscopicPrintImages()}
    </section>
  `;
}

function buildCheckboxLine(label: string, checked: boolean) {
  return `<div class="check-line">${checked ? '☑' : '☐'} ${escapeHtml(label)}</div>`;
}

function collectCategoryKeys(nodes: ReportTemplateTreeNode[]) {
  const keys: string[] = [];
  for (const node of nodes) {
    if (node.type === 'category') {
      keys.push(node.id);
    }
    if (node.children) {
      keys.push(...collectCategoryKeys(node.children));
    }
  }
  return keys;
}

function filterReportTemplateTree(
  nodes: ReportTemplateTreeNode[],
  keyword: string,
) {
  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword) {
    return nodes;
  }

  const result: ReportTemplateTreeNode[] = [];
  for (const node of nodes) {
    const filteredChildren = node.children
      ? filterReportTemplateTree(node.children, normalizedKeyword)
      : [];
    const matched =
      node.label.toLowerCase().includes(normalizedKeyword) ||
      (node.content?.toLowerCase().includes(normalizedKeyword) ?? false);

    if (matched || filteredChildren.length > 0) {
      result.push({
        ...node,
        children:
          filteredChildren.length > 0 ? filteredChildren : node.children,
      });
    }
  }

  return result;
}

function findFirstTemplate(
  nodes: ReportTemplateTreeNode[],
): null | ReportTemplateTreeNode {
  for (const node of nodes) {
    if (node.type === 'template') {
      return node;
    }
    const childTemplate = node.children
      ? findFirstTemplate(node.children)
      : null;
    if (childTemplate) {
      return childTemplate;
    }
  }
  return null;
}

function openTemplateDrawer(sectionKey: ReportTemplateSectionKey) {
  activeTemplateSectionKey.value = sectionKey;
  templateSearchKeyword.value = '';
  const firstTemplate = findFirstTemplate(
    activeTemplateSection.value.templateTree,
  );
  selectedReportTemplate.value = firstTemplate;
  selectedTemplateNodeId.value = firstTemplate?.id ?? '';
  templateDrawerVisible.value = true;
}

function handleTemplateNodeClick(node: ReportTemplateTreeNode) {
  if (node.type !== 'template') {
    return;
  }
  selectedReportTemplate.value = node;
  selectedTemplateNodeId.value = node.id;
}

function appendReportTemplateFromNode(node: ReportTemplateTreeNode) {
  if (node.type !== 'template') {
    return;
  }
  selectedReportTemplate.value = node;
  selectedTemplateNodeId.value = node.id;
  applyReportTemplate('append');
}

function applyReportTemplate(mode: 'append' | 'replace') {
  const template = selectedReportTemplate.value;
  if (!template?.content) {
    ElMessage.warning('请先选择模板');
    return;
  }

  const fieldKey = activeTemplateSection.value.key;
  const currentValue = reportDraft[fieldKey].trim();
  reportDraft[fieldKey] =
    mode === 'append' && currentValue
      ? `${currentValue}\n${template.content}`
      : template.content;
  ElMessage.success(mode === 'append' ? '已追加模板' : '已替换为模板');
}

function buildCellDnaPrintDocument() {
  const reportStyle = activeReportStyle.value;

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>${escapeHtml(reportStyle.reportTitle)} - ${reportNo.value}</title>
    <style>
      body { margin: 0; color: #111; font-family: "SimSun", "Microsoft YaHei", sans-serif; }
      @page { margin: 8mm; size: A4; }
      .sheet { width: 190mm; margin: 0 auto; padding: 4mm; font-size: 4.2mm; line-height: 1.65; }
      h1 { margin: 0 0 1mm; font-size: 5.5mm; font-weight: 400; }
      .badge { display: inline-block; padding: 0 1.5mm; border-radius: 1mm; background: #eee; font-weight: 700; }
      .field { display: grid; grid-template-columns: auto 1fr; align-items: center; gap: 1mm; margin-top: 1mm; }
      .input-line { min-height: 7mm; border: 1px solid #bbb; border-radius: 1mm; }
      .section { margin-top: 3mm; }
      .section-title { font-weight: 700; }
      .check-line { min-height: 7mm; }
      .divider { margin: 2mm 0; border-top: 1px solid #666; }
      .preview-title { color: #00f; font-weight: 700; }
      .preview { min-height: 28mm; border: 1px solid #bbb; border-radius: 1mm; padding: 2mm; white-space: pre-wrap; }
    </style>
  </head>
  <body>
    <article class="sheet">
      <h1>${escapeHtml(reportStyle.reportTitle)}</h1>
      <div><span class="badge">【诊断结果】</span></div>
      <div class="field"><span>TBS意见:</span><div class="input-line">${escapeHtml(cellDnaDraft.tbsOpinion)}</div></div>
      <section class="section">
        <div class="section-title">DNA意见:</div>
        ${cellDnaOpinionOptions
            .map((option) =>
              buildCheckboxLine(
                option,
                selectedCellDnaOpinions.value.includes(option),
              ),
            )
            .join('')}
      </section>
      <section class="section">
        <div><span class="badge">【建议】</span></div>
        ${cellDnaSuggestionOptions
            .map((option) =>
              buildCheckboxLine(
                option,
                selectedCellDnaSuggestions.value.includes(option),
              ),
            )
            .join('')}
      </section>
      <div class="divider"></div>
      <div class="preview-title">【报告文本预览】</div>
      <div class="preview">${escapeHtml(cellDnaDraft.reportTextPreview || '【诊断结果】')}</div>
    </article>
  </body>
</html>`;
}

function buildStrPrintDocument() {
  const reportStyle = activeReportStyle.value;
  const strPrintFields: Array<[string, string]> = [
    ['送检类型:', strDraft.submissionType],
    ['样本类型:', strDraft.sampleType],
    ['病理诊断:', strDraft.pathologyDiagnosis],
    ['试剂批号:', strDraft.reagentBatchNo],
    ['使用仪器:', strDraft.instrument],
    ['DNA浓度:', strDraft.dnaConcentration],
  ];

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>${escapeHtml(reportStyle.reportTitle)} - ${reportNo.value}</title>
    <style>
      body { margin: 0; color: #111; font-family: "SimSun", "Microsoft YaHei", sans-serif; }
      @page { margin: 8mm; size: A4; }
      .sheet { width: 190mm; margin: 0 auto; padding: 4mm; font-size: 4.2mm; line-height: 1.6; }
      h1 { margin: 0 0 2mm; font-size: 5.5mm; font-weight: 400; }
      .field { display: grid; grid-template-columns: 22mm minmax(0, 1fr); align-items: center; gap: 1mm; margin-bottom: 2mm; }
      .label { white-space: nowrap; }
      .value { min-height: 7mm; border: 1px solid #bbb; border-radius: 1mm; padding: 0 1mm; }
      table { width: 100%; border-collapse: collapse; margin-top: 1mm; }
      th, td { border: 1px solid #777; padding: 1.5mm; text-align: left; }
      th { text-align: center; font-weight: 700; }
      .cell-value { min-height: 6mm; border: 1px solid #bbb; border-radius: 1mm; }
    </style>
  </head>
  <body>
    <article class="sheet">
      <h1>${escapeHtml(reportStyle.reportTitle)}</h1>
      ${strPrintFields
          .map(
            ([label, value]) =>
              `<div class="field"><span class="label">${escapeHtml(label)}</span><div class="value">${escapeHtml(value)}</div></div>`,
          )
          .join('')}
      <div>检测结果</div>
      <table>
        <thead><tr><th>STR位点</th><th>母亲</th><th>胎儿</th></tr></thead>
        <tbody>
          ${strLoci
              .map(
                (locus) => `
                <tr>
                  <td>${escapeHtml(locus)}</td>
                  <td><div class="cell-value">${escapeHtml(getStrResult(locus).mother)}</div></td>
                  <td><div class="cell-value">${escapeHtml(getStrResult(locus).fetus)}</div></td>
                </tr>
              `,
              )
              .join('')}
        </tbody>
      </table>
    </article>
  </body>
</html>`;
}

function buildStructuredPrintDocument() {
  const reportStyle = activeReportStyle.value;
  const config = activeStructuredReportTemplate.value;
  if (!config) {
    return '';
  }

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>${escapeHtml(reportStyle.reportTitle)} - ${reportNo.value}</title>
    <style>
      body { margin: 0; color: #111; font-family: "SimSun", "Microsoft YaHei", sans-serif; }
      @page { margin: 8mm; size: A4; }
      .sheet { width: 190mm; margin: 0 auto; padding: 4mm; font-size: 4.1mm; line-height: 1.6; }
      h1 { margin: 0 0 3mm; color: ${reportStyle.accentColor}; font-size: 5.8mm; text-align: center; }
      .field-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 2mm 4mm; }
      .field { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 1mm; align-items: center; }
      .field.wide { grid-column: span 2; }
      .label { font-weight: 700; white-space: nowrap; }
      .value, .section-value, .cell-value { min-height: 7mm; border: 1px solid #bbb; border-radius: 1mm; padding: 0.7mm 1mm; white-space: pre-wrap; }
      .section { margin-top: 4mm; }
      .section-title { color: ${reportStyle.accentColor}; font-weight: 700; }
      .check-line { min-height: 7mm; }
      table { width: 100%; border-collapse: collapse; margin-top: 1mm; }
      th, td { border: 1px solid #777; padding: 1.5mm; }
      th { text-align: center; font-weight: 700; }
    </style>
  </head>
  <body>
    <article class="sheet">
      <h1>${escapeHtml(reportStyle.reportTitle)}</h1>
      <section class="field-grid">
        ${config.fields
            .map(
              (field) => `
              <div class="field ${field.wide ? 'wide' : ''}">
                <span class="label">${escapeHtml(field.label)}</span>
                <span class="value">${escapeHtml(structuredFieldValues[field.key] ?? '')}</span>
              </div>
            `,
            )
            .join('')}
      </section>
      ${config.sections
          .map((section) => {
            if (section.type === 'checkboxes') {
              return `
              <section class="section">
                <div class="section-title">${escapeHtml(section.title)}</div>
                ${(section.options ?? [])
                                .map((option) =>
                                  buildCheckboxLine(
                                    option,
                                    structuredCheckboxValues[
                                      section.key
                                    ]?.includes(option) ?? false,
                                  ),
                                )
                                .join('')}
              </section>
            `;
            }

            return `
            <section class="section">
              <div class="section-title">${escapeHtml(section.title)}</div>
              <div class="section-value">${escapeHtml(structuredSectionValues[section.key] ?? '')}</div>
            </section>
          `;
          })
          .join('')}
      ${(config.tables ?? [])
          .map(
            (table) => `
            <section class="section">
              <div class="section-title">${escapeHtml(table.title)}</div>
              <table>
                <thead>
                  <tr>${table.columns
                                .map(
                                  (column) => `<th>${escapeHtml(column)}</th>`,
                                )
                                .join('')}</tr>
                </thead>
                <tbody>
                  ${table.rows
                                .map(
                                  (row) => `
                        <tr>
                          <td>${escapeHtml(row)}</td>
                          ${table.columns
                                                              .slice(1)
                                                              .map(
                                                                (column) =>
                                                                  `<td><div class="cell-value">${escapeHtml(structuredTableValues[tableCellKey(table, row, column)] ?? '')}</div></td>`,
                                                              )
                                                              .join('')}
                        </tr>
                      `,
                                )
                                .join('')}
                </tbody>
              </table>
            </section>
          `,
          )
          .join('')}
    </article>
  </body>
</html>`;
}

function buildReportPrintDocument() {
  if (isCellDnaReportTemplate.value) {
    return buildCellDnaPrintDocument();
  }
  if (isStrReportTemplate.value) {
    return buildStrPrintDocument();
  }
  if (isStructuredReportTemplate.value) {
    return buildStructuredPrintDocument();
  }

  const reportStyle = activeReportStyle.value;
  const title = `${reportStyle.reportTitle} - ${reportNo.value}`;

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <style>
      :root {
        color-scheme: light;
        font-family: "SimSun", "Microsoft YaHei", "PingFang SC", sans-serif;
      }
      * {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        background: #ffffff;
        color: #111111;
      }
      @page {
        margin: 8mm;
        size: A4;
      }
      .sheet {
        width: 190mm;
        min-height: 276mm;
        margin: 0 auto;
        border: 1px solid #111111;
        padding: 23mm 9mm 9mm;
      }
      .header {
        display: grid;
        grid-template-columns: 38mm 1fr 37mm;
        align-items: end;
        gap: 2mm;
        border-bottom: 1px solid #111111;
        padding-bottom: 1.5mm;
      }
      .time-box,
      .report-no,
      .value {
        min-height: 6mm;
        padding: 0.7mm 0;
      }
      .hospital {
        color: ${reportStyle.accentColor};
        font-size: 6mm;
        font-weight: 700;
        line-height: 1.05;
        text-align: center;
      }
      .subtitle {
        margin-top: 1.5mm;
        color: #111111;
        font-size: 5.5mm;
        font-weight: 700;
        text-align: center;
      }
      .meta-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        border-bottom: 1px solid #111111;
      }
      .field {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        align-items: center;
        min-width: 0;
        min-height: 6mm;
        padding-right: 1.2mm;
      }
      .field.span-2 {
        grid-column: span 2;
      }
      .label {
        font-weight: 700;
        white-space: nowrap;
      }
      .value {
        min-width: 0;
        overflow-wrap: anywhere;
        white-space: pre-wrap;
        word-break: break-word;
      }
      .report-section {
        border-bottom: 1px solid #111111;
        padding: 1.5mm 0 2mm;
      }
      .section-title {
        color: ${reportStyle.accentColor};
        font-weight: 700;
        margin-bottom: 1.5mm;
      }
      .section-value {
        min-height: 7mm;
        max-width: 100%;
        padding: 0;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        word-break: break-word;
      }
      .section-image-stage {
        position: relative;
        min-height: 42mm;
        margin-top: 2mm;
        border: 1px dashed #bdbdbd;
      }
      .section-image {
        position: absolute;
        width: 25mm;
        height: 19mm;
        object-fit: cover;
        border: 1px solid #999999;
        background: #ffffff;
      }
      .footer {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 4mm;
        margin-top: 5mm;
        min-width: 0;
      }
      .note {
        margin-top: 5mm;
        color: #008000;
        font-size: 3.2mm;
      }
    </style>
  </head>
  <body>
    <article class="sheet">
      <header class="header">
        <div class="time-box">${escapeHtml(reportDraft.deliveredAt)}</div>
        <div>
          <div class="hospital">${escapeHtml(reportStyle.hospitalName)}</div>
          <div class="subtitle">${escapeHtml(reportStyle.reportTitle)}</div>
        </div>
        <div class="report-no">${escapeHtml(reportDraft.reportNo)}</div>
      </header>
      <section class="meta-grid">
        ${reportMetaFields
            .map(
              (field) => `
              <div class="field ${field.class ?? ''}">
                <span class="label">${escapeHtml(field.label)}</span>
                <span class="value">${escapeHtml(reportDraft[field.model])}</span>
              </div>
            `,
            )
            .join('')}
      </section>
      ${buildPrintSection(reportStyle.sectionLabels.grossExam, reportDraft.grossExam, 82)}
      ${buildMicroscopicPrintSection(reportStyle.sectionLabels.microscopicExam, reportDraft.microscopicExam, 160)}
      ${buildPrintSection(reportStyle.sectionLabels.finalDiagnosis, reportDraft.finalDiagnosis, 92)}
      <footer class="footer">
        ${buildPrintField('审核医师:', reviewDoctorLabel.value)}
        ${buildPrintField('诊断医师:', diagnosisDoctorLabel.value)}
        ${buildPrintField('报告日期:', reportDateLabel.value)}
      </footer>
      <div class="note">${escapeHtml(reportPrintNote)}</div>
    </article>
  </body>
</html>`;
}

function openReportPreview() {
  if (!props.workbench) {
    ElMessage.warning('请先选择诊断队列中的病例');
    return;
  }
  printPreviewVisible.value = true;
}

function handlePrint() {
  if (!props.workbench) {
    ElMessage.warning('请先选择诊断队列中的病例');
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow?.document) {
    ElMessage.warning('当前浏览器阻止了打印窗口，请允许弹窗后重试');
    return;
  }

  printWindow.document.open();
  printWindow.document.write(buildReportPrintDocument());
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}
</script>

<template>
  <section
    class="flex min-h-0 flex-col rounded-lg border border-border bg-card shadow-sm"
  >
    <header
      class="flex items-center justify-between gap-3 border-b border-border px-3 py-2"
    >
      <h3 class="min-w-0 text-sm font-semibold text-foreground">
        报告预览编辑
      </h3>
      <div class="ml-auto flex shrink-0 items-center gap-2">
        <ElSelect
          v-model="selectedReportStyleValue"
          aria-label="报告样式"
          class="report-style-select"
          fit-input-width
          size="small"
          data-testid="report-style-select"
        >
          <ElOption
            v-for="style in reportStyleOptions"
            :key="style.value"
            :label="style.label"
            :value="style.value"
          />
        </ElSelect>
        <ElButton size="small" @click="openReportPreview">打印预览</ElButton>
        <ElButton size="small" type="primary" @click="handlePrint">
          打印
        </ElButton>
      </div>
    </header>

    <div
      v-loading="loading"
      class="min-h-0 flex-1 overflow-auto bg-muted/30 p-3"
      data-testid="diagnosis-report-editor"
    >
      <ElEmpty
        v-if="!workbench && !loading"
        class="py-10"
        description="请先在左侧诊断队列中选择病例"
      />

      <article
        v-else-if="workbench"
        class="mx-auto min-w-[560px] max-w-[720px] border border-black bg-white text-[13px] leading-tight text-black shadow-sm"
        data-testid="diagnosis-report-paper"
        :style="{ '--report-accent-color': activeReportStyle.accentColor }"
      >
        <template v-if="isClassicDefaultReportTemplate">
          <section class="classic-report-layout">
            <section class="classic-report-section min-h-[160px]">
              <div class="classic-report-heading">
                <label class="classic-report-label" for="classic-gross-editor">
                  大体所见
                </label>
                <ElTooltip content="选择肉眼所见模板" placement="left">
                  <ElButton
                    aria-label="选择肉眼所见模板"
                    class="report-template-button"
                    circle
                    :icon="TextQuote"
                    size="small"
                    data-testid="open-classic-gross-template"
                    @click="openTemplateDrawer('grossExam')"
                  />
                </ElTooltip>
              </div>
              <textarea
                id="classic-gross-editor"
                v-model="reportDraft.grossExam"
                class="classic-report-textarea"
                data-testid="diagnosis-report-gross-editor"
              ></textarea>
            </section>

            <section class="classic-report-section min-h-[210px]">
              <div class="classic-report-heading">
                <label
                  class="classic-report-label"
                  for="classic-microscopic-editor"
                >
                  镜下所见
                </label>
                <ElTooltip content="选择光镜所见模板" placement="left">
                  <ElButton
                    aria-label="选择光镜所见模板"
                    class="report-template-button"
                    circle
                    :icon="InspectionPanel"
                    size="small"
                    data-testid="open-classic-microscopic-template"
                    @click="openTemplateDrawer('microscopicExam')"
                  />
                </ElTooltip>
              </div>
              <textarea
                id="classic-microscopic-editor"
                v-model="reportDraft.microscopicExam"
                class="classic-report-textarea"
                data-testid="diagnosis-report-microscopic-editor"
              ></textarea>
            </section>

            <section class="classic-report-diagnosis-section">
              <div class="classic-report-diagnosis-main">
                <div class="classic-report-heading">
                  <label
                    class="classic-report-label"
                    for="classic-diagnosis-editor"
                  >
                    病理诊断
                  </label>
                  <ElTooltip content="选择病理诊断模板" placement="left">
                    <ElButton
                      aria-label="选择病理诊断模板"
                      class="report-template-button"
                      circle
                      :icon="BookOpenText"
                      size="small"
                      data-testid="open-final-diagnosis-template"
                      @click="openTemplateDrawer('finalDiagnosis')"
                    />
                  </ElTooltip>
                </div>
                <textarea
                  id="classic-diagnosis-editor"
                  v-model="reportDraft.finalDiagnosis"
                  class="classic-report-textarea"
                  data-testid="diagnosis-report-diagnosis-editor"
                ></textarea>
              </div>

              <aside class="classic-report-status-panel">
                <div class="classic-report-select-stack">
                  <ElSelect
                    v-model="classicClinicalMatchValue"
                    aria-label="临床符合"
                    size="small"
                    data-testid="classic-clinical-match-select"
                  >
                    <ElOption
                      v-for="option in classicClinicalMatchOptions"
                      :key="option"
                      :label="option"
                      :value="option"
                    />
                  </ElSelect>
                  <ElSelect
                    v-model="classicDiagnosisMatchValue"
                    aria-label="诊断符合"
                    size="small"
                    data-testid="classic-diagnosis-match-select"
                  >
                    <ElOption
                      v-for="option in classicDiagnosisMatchOptions"
                      :key="option"
                      :label="option"
                      :value="option"
                    />
                  </ElSelect>
                </div>
                <div class="classic-report-status-spacer"></div>
                <div class="classic-report-flags">
                  <label
                    v-for="option in classicReportFlagOptions"
                    :key="option"
                    class="classic-report-flag"
                  >
                    <input
                      v-model="classicReportFlags"
                      type="checkbox"
                      :value="option"
                    />
                    {{ option }}
                  </label>
                </div>
              </aside>
            </section>
          </section>
        </template>

        <template v-else-if="isDefaultReportTemplate">
          <header
            class="grid grid-cols-[92px_minmax(0,1fr)_92px] items-end gap-2 border-b border-black p-2"
          >
            <input
              v-model="reportDraft.deliveredAt"
              aria-label="送检时间"
              class="report-value report-header-input"
            />
            <div class="text-center">
              <div class="report-hospital-name text-2xl">
                {{ activeReportStyle.hospitalName }}
              </div>
              <div class="mt-1 text-xl font-semibold">
                {{ activeReportStyle.reportTitle }}
              </div>
            </div>
            <input
              v-model="reportDraft.reportNo"
              aria-label="报告编号"
              class="report-value report-header-input"
            />
          </header>

          <section class="report-meta-grid">
            <div
              v-for="field in reportMetaFields"
              :key="`${field.label}-${field.model}`"
              class="report-meta-cell"
              :class="field.class"
            >
              <label class="report-label" :for="`report-meta-${field.model}`">
                {{ field.label }}
              </label>
              <input
                :id="`report-meta-${field.model}`"
                v-model="reportDraft[field.model]"
                class="report-value"
              />
            </div>
          </section>

          <section class="report-edit-section min-h-[92px]">
            <div class="report-edit-heading">
              <label class="report-edit-label" for="gross-exam-editor">
                {{ activeReportStyle.sectionLabels.grossExam }}
              </label>
              <ElTooltip content="选择肉眼所见模板" placement="left">
                <ElButton
                  aria-label="选择肉眼所见模板"
                  class="report-template-button"
                  circle
                  :icon="TextQuote"
                  size="small"
                  data-testid="open-gross-template"
                  @click="openTemplateDrawer('grossExam')"
                />
              </ElTooltip>
            </div>
            <textarea
              id="gross-exam-editor"
              v-model="reportDraft.grossExam"
              class="report-edit-textarea min-h-[34px]"
              data-testid="diagnosis-report-gross-editor"
            ></textarea>
          </section>

          <section class="report-edit-section min-h-[188px]">
            <div class="report-edit-heading">
              <label class="report-edit-label" for="microscopic-exam-editor">
                {{ activeReportStyle.sectionLabels.microscopicExam }}
              </label>
              <ElTooltip content="选择光镜所见模板" placement="left">
                <ElButton
                  aria-label="选择光镜所见模板"
                  class="report-template-button"
                  circle
                  :icon="InspectionPanel"
                  size="small"
                  data-testid="open-microscopic-template"
                  @click="openTemplateDrawer('microscopicExam')"
                />
              </ElTooltip>
            </div>
            <textarea
              id="microscopic-exam-editor"
              v-model="reportDraft.microscopicExam"
              class="report-edit-textarea min-h-[126px]"
              data-testid="diagnosis-report-microscopic-editor"
            ></textarea>
            <div
              v-if="microscopicReportImages.length > 0"
              ref="microscopicImageCanvasRef"
              class="report-microscopic-image-canvas"
              data-testid="diagnosis-report-microscopic-image-canvas"
            >
              <img
                v-for="image in microscopicReportImages"
                :key="image.key"
                :alt="image.title"
                class="report-microscopic-image"
                :src="image.fileUrl"
                :style="getMicroscopicImageStyle(image.key)"
                :title="image.title"
                @pointerdown="
                  handleMicroscopicImagePointerDown(image.key, $event)
                "
              />
            </div>
          </section>

          <section class="report-edit-section min-h-[112px]">
            <div class="report-edit-heading">
              <label class="report-edit-label" for="final-diagnosis-editor">
                {{ activeReportStyle.sectionLabels.finalDiagnosis }}
              </label>
              <ElTooltip content="选择病理诊断模板" placement="left">
                <ElButton
                  aria-label="选择病理诊断模板"
                  class="report-template-button"
                  circle
                  :icon="BookOpenText"
                  size="small"
                  data-testid="open-final-diagnosis-template"
                  @click="openTemplateDrawer('finalDiagnosis')"
                />
              </ElTooltip>
            </div>
            <textarea
              id="final-diagnosis-editor"
              v-model="reportDraft.finalDiagnosis"
              class="report-edit-textarea min-h-[52px]"
              data-testid="diagnosis-report-diagnosis-editor"
            ></textarea>
          </section>

          <footer
            class="grid grid-cols-3 gap-3 border-t border-black px-4 py-3 text-sm"
          >
            <div class="report-footer-field">
              <label class="report-label" for="report-review-doctor">
                审核医师:
              </label>
              <input
                id="report-review-doctor"
                v-model="reportDraft.reviewDoctor"
                class="report-value"
              />
            </div>
            <div class="report-footer-field">
              <label class="report-label" for="report-diagnosis-doctor">
                诊断医师:
              </label>
              <input
                id="report-diagnosis-doctor"
                v-model="reportDraft.diagnosisDoctor"
                class="report-value"
              />
            </div>
            <div class="report-footer-field">
              <label class="report-label" for="report-date"> 报告日期: </label>
              <input
                id="report-date"
                v-model="reportDraft.reportDate"
                class="report-value"
              />
            </div>
          </footer>
          <div class="px-4 pb-3 text-xs text-[#008000]">
            注：该报告附加手写签名后有效。送检医生对本诊断有疑问，请立即与本科有关医师联系。
          </div>
        </template>

        <template v-else-if="isCellDnaReportTemplate">
          <section class="special-report-form">
            <h4 class="special-report-title">
              {{ activeReportStyle.reportTitle }}
            </h4>
            <div class="special-badge">【诊断结果】</div>
            <label class="special-inline-field">
              <span>TBS意见:</span>
              <input v-model="cellDnaDraft.tbsOpinion" class="special-input" />
            </label>

            <section class="special-block">
              <div class="special-section-title">DNA意见:</div>
              <label
                v-for="option in cellDnaOpinionOptions"
                :key="option"
                class="special-checkbox-line"
              >
                <input
                  v-model="selectedCellDnaOpinions"
                  type="checkbox"
                  :value="option"
                />
                <span>{{ option }}</span>
              </label>
            </section>

            <section class="special-block">
              <div class="special-badge">【建议】</div>
              <label
                v-for="option in cellDnaSuggestionOptions"
                :key="option"
                class="special-checkbox-line"
              >
                <input
                  v-model="selectedCellDnaSuggestions"
                  type="checkbox"
                  :value="option"
                />
                <span>{{ option }}</span>
              </label>
            </section>

            <section class="special-preview-block">
              <div class="special-preview-title">【报告文本预览】</div>
              <textarea
                v-model="cellDnaDraft.reportTextPreview"
                class="special-preview-textarea"
                data-testid="cell-dna-report-text-preview"
                placeholder="【诊断结果】"
              ></textarea>
            </section>
          </section>
        </template>

        <template v-else-if="isStrReportTemplate">
          <section class="special-report-form">
            <h4 class="special-report-title">
              {{ activeReportStyle.reportTitle }}
            </h4>
            <label class="str-field">
              <span>送检类型:</span>
              <input v-model="strDraft.submissionType" class="special-input" />
            </label>
            <label class="str-field">
              <span>样本类型:</span>
              <input v-model="strDraft.sampleType" class="special-input" />
            </label>
            <label class="str-field str-field-wide">
              <span>病理诊断:</span>
              <input
                v-model="strDraft.pathologyDiagnosis"
                class="special-input"
              />
            </label>
            <label class="str-field">
              <span>试剂批号:</span>
              <input v-model="strDraft.reagentBatchNo" class="special-input" />
            </label>
            <label class="str-field str-field-wide">
              <span>使用仪器:</span>
              <input v-model="strDraft.instrument" class="special-input" />
            </label>
            <label class="str-field">
              <span>DNA浓度:</span>
              <input
                v-model="strDraft.dnaConcentration"
                class="special-input"
              />
            </label>
            <div class="mt-3">检测结果</div>
            <table class="str-result-table">
              <thead>
                <tr>
                  <th>STR位点</th>
                  <th>母亲</th>
                  <th>胎儿</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="locus in strLoci" :key="locus">
                  <td>{{ locus }}</td>
                  <td>
                    <input
                      v-model="getStrResult(locus).mother"
                      class="special-input"
                    />
                  </td>
                  <td>
                    <input
                      v-model="getStrResult(locus).fetus"
                      class="special-input"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </section>
        </template>

        <template v-else-if="isStructuredReportTemplate">
          <section class="special-report-form">
            <h4 class="structured-report-title">
              {{ activeReportStyle.reportTitle }}
            </h4>

            <section class="structured-field-grid">
              <label
                v-for="field in activeStructuredReportTemplate?.fields ?? []"
                :key="field.key"
                class="structured-field"
                :class="{ 'is-wide': field.wide }"
              >
                <span>{{ field.label }}</span>
                <input
                  v-model="structuredFieldValues[field.key]"
                  class="special-input"
                />
              </label>
            </section>

            <section
              v-for="section in activeStructuredReportTemplate?.sections ?? []"
              :key="section.key"
              class="special-block"
            >
              <div class="special-section-title">{{ section.title }}</div>
              <template v-if="section.type === 'checkboxes'">
                <label
                  v-for="option in section.options ?? []"
                  :key="option"
                  class="special-checkbox-line"
                >
                  <input
                    v-model="structuredCheckboxValues[section.key]"
                    type="checkbox"
                    :value="option"
                  />
                  <span>{{ option }}</span>
                </label>
              </template>
              <textarea
                v-else
                v-model="structuredSectionValues[section.key]"
                class="structured-textarea"
              ></textarea>
            </section>

            <section
              v-for="table in activeStructuredReportTemplate?.tables ?? []"
              :key="table.title"
              class="special-block"
            >
              <div class="special-section-title">{{ table.title }}</div>
              <table class="str-result-table">
                <thead>
                  <tr>
                    <th v-for="column in table.columns" :key="column">
                      {{ column }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in table.rows" :key="row">
                    <td>{{ row }}</td>
                    <td v-for="column in table.columns.slice(1)" :key="column">
                      <input
                        v-model="
                          structuredTableValues[
                            tableCellKey(table, row, column)
                          ]
                        "
                        class="special-input"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>
          </section>
        </template>
      </article>
    </div>

    <ElDialog
      v-model="printPreviewVisible"
      append-to-body
      title="打印预览"
      width="860px"
    >
      <div class="max-h-[72vh] overflow-auto bg-muted/30 p-4">
        <div
          class="mx-auto whitespace-pre-wrap border border-border bg-white p-5 text-sm text-foreground shadow-sm"
        >
          <template v-if="isDefaultReportTemplate">
            <div class="text-center text-xl font-semibold">
              {{ activeReportStyle.hospitalName }}
            </div>
            <div class="mt-1 text-center text-lg">
              {{ activeReportStyle.reportTitle }}
            </div>
            <div class="mt-4 grid grid-cols-2 gap-2">
              <span>报告号: {{ reportNo }}</span>
              <span>姓名: {{ reportDraft.patientName }}</span>
              <span>性别: {{ reportDraft.patientGender }}</span>
              <span>年龄: {{ reportDraft.patientAge }}</span>
              <span>申请科室: {{ reportDraft.submittingDepartmentName }}</span>
              <span>检查日期: {{ inspectionDate }}</span>
            </div>
            <div
              class="mt-4 font-semibold"
              :style="{ color: activeReportStyle.accentColor }"
            >
              {{ activeReportStyle.sectionLabels.grossExam }}
            </div>
            <div class="min-h-[48px] p-2">
              {{ reportDraft.grossExam }}
            </div>
            <div
              class="mt-3 font-semibold"
              :style="{ color: activeReportStyle.accentColor }"
            >
              {{ activeReportStyle.sectionLabels.microscopicExam }}
            </div>
            <div class="min-h-[96px] p-2">
              {{ reportDraft.microscopicExam }}
            </div>
            <div
              v-if="microscopicReportImages.length > 0"
              class="report-microscopic-image-canvas is-preview"
            >
              <img
                v-for="image in microscopicReportImages"
                :key="image.key"
                :alt="image.title"
                class="report-microscopic-image"
                :src="image.fileUrl"
                :style="getMicroscopicImageStyle(image.key)"
                :title="image.title"
              />
            </div>
            <div
              class="mt-3 font-semibold"
              :style="{ color: activeReportStyle.accentColor }"
            >
              {{ activeReportStyle.sectionLabels.finalDiagnosis }}
            </div>
            <div class="min-h-[64px] p-2">
              {{ reportDraft.finalDiagnosis }}
            </div>
          </template>

          <template v-else-if="isCellDnaReportTemplate">
            <div class="text-lg">{{ activeReportStyle.reportTitle }}</div>
            <div class="mt-2 font-semibold">【诊断结果】</div>
            <div class="mt-1">TBS意见: {{ cellDnaDraft.tbsOpinion }}</div>
            <div class="mt-3 font-semibold">DNA意见:</div>
            <div
              v-for="option in cellDnaOpinionOptions"
              :key="option"
              class="leading-7"
            >
              {{ selectedCellDnaOpinions.includes(option) ? '☑' : '☐' }}
              {{ option }}
            </div>
            <div class="mt-3 font-semibold">【建议】</div>
            <div
              v-for="option in cellDnaSuggestionOptions"
              :key="option"
              class="leading-7"
            >
              {{ selectedCellDnaSuggestions.includes(option) ? '☑' : '☐' }}
              {{ option }}
            </div>
            <div
              class="mt-3 border-t border-border pt-2 font-semibold text-primary"
            >
              【报告文本预览】
            </div>
            <div class="min-h-[96px] rounded border border-border p-2">
              {{ cellDnaDraft.reportTextPreview || '【诊断结果】' }}
            </div>
          </template>

          <template v-else-if="isStrReportTemplate">
            <div class="text-lg">{{ activeReportStyle.reportTitle }}</div>
            <div class="mt-3 grid grid-cols-2 gap-2">
              <span>送检类型: {{ strDraft.submissionType }}</span>
              <span>样本类型: {{ strDraft.sampleType }}</span>
              <span class="col-span-2">
                病理诊断: {{ strDraft.pathologyDiagnosis }}
              </span>
              <span>试剂批号: {{ strDraft.reagentBatchNo }}</span>
              <span>使用仪器: {{ strDraft.instrument }}</span>
              <span>DNA浓度: {{ strDraft.dnaConcentration }}</span>
            </div>
            <div class="mt-3">检测结果</div>
            <table class="str-result-table mt-1">
              <thead>
                <tr>
                  <th>STR位点</th>
                  <th>母亲</th>
                  <th>胎儿</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="locus in strLoci" :key="locus">
                  <td>{{ locus }}</td>
                  <td>{{ getStrResult(locus).mother }}</td>
                  <td>{{ getStrResult(locus).fetus }}</td>
                </tr>
              </tbody>
            </table>
          </template>

          <template v-else-if="isStructuredReportTemplate">
            <div
              class="text-center text-lg font-semibold"
              :style="{ color: activeReportStyle.accentColor }"
            >
              {{ activeReportStyle.reportTitle }}
            </div>
            <div class="mt-4 grid grid-cols-2 gap-2">
              <span
                v-for="field in activeStructuredReportTemplate?.fields ?? []"
                :key="field.key"
                :class="{ 'col-span-2': field.wide }"
              >
                {{ field.label }}
                {{ structuredFieldValues[field.key] }}
              </span>
            </div>
            <section
              v-for="section in activeStructuredReportTemplate?.sections ?? []"
              :key="section.key"
              class="mt-4"
            >
              <div
                class="font-semibold"
                :style="{ color: activeReportStyle.accentColor }"
              >
                {{ section.title }}
              </div>
              <template v-if="section.type === 'checkboxes'">
                <div
                  v-for="option in section.options ?? []"
                  :key="option"
                  class="leading-7"
                >
                  {{
                    structuredCheckboxValues[section.key]?.includes(option)
                      ? '☑'
                      : '☐'
                  }}
                  {{ option }}
                </div>
              </template>
              <div v-else class="min-h-[72px] rounded border border-border p-2">
                {{ structuredSectionValues[section.key] }}
              </div>
            </section>
            <section
              v-for="table in activeStructuredReportTemplate?.tables ?? []"
              :key="table.title"
              class="mt-4"
            >
              <div
                class="font-semibold"
                :style="{ color: activeReportStyle.accentColor }"
              >
                {{ table.title }}
              </div>
              <table class="str-result-table mt-1">
                <thead>
                  <tr>
                    <th v-for="column in table.columns" :key="column">
                      {{ column }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in table.rows" :key="row">
                    <td>{{ row }}</td>
                    <td v-for="column in table.columns.slice(1)" :key="column">
                      {{
                        structuredTableValues[tableCellKey(table, row, column)]
                      }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>
          </template>
        </div>
      </div>
    </ElDialog>

    <ElDrawer
      v-model="templateDrawerVisible"
      append-to-body
      :close-on-click-modal="false"
      :modal="false"
      :title="activeTemplateSection.drawerTitle"
      size="420px"
    >
      <div
        class="flex h-full min-h-0 flex-col gap-3"
        data-testid="report-template-drawer"
      >
        <header class="grid gap-2">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-sm font-semibold text-foreground">子类</span>
            <ElTag effect="plain" size="small" type="primary">
              {{ activeTemplateSection.fieldLabel }}
            </ElTag>
            <ElButton :icon="BookOpenText" disabled size="small">
              模板管理
            </ElButton>
            <span class="text-xs leading-5 text-primary">
              选中模板后可追加或替换
            </span>
          </div>
          <div class="flex flex-wrap gap-1">
            <ElButton
              v-for="stage in templateStageOptions"
              :key="stage"
              plain
              size="small"
            >
              {{ stage }}
            </ElButton>
          </div>
          <ElInput
            v-model="templateSearchKeyword"
            clearable
            :placeholder="activeTemplateSection.searchPlaceholder"
          />
        </header>

        <main class="min-h-0 flex-1 overflow-auto border border-border">
          <ElTree
            :current-node-key="selectedTemplateNodeId"
            :data="filteredTemplateTree"
            :default-expanded-keys="templateExpandedKeys"
            highlight-current
            node-key="id"
            :props="reportTemplateTreeProps"
            @node-click="handleTemplateNodeClick"
          >
            <template #default="{ data }">
              <span
                class="report-template-tree-node"
                :class="{
                  'is-diagnosis-template':
                    activeTemplateSection.key === 'finalDiagnosis' &&
                    data.type === 'template',
                }"
                @dblclick.stop="appendReportTemplateFromNode(data)"
              >
                <component
                  :is="data.type === 'category' ? BookOpenText : TextQuote"
                  class="report-template-node-icon"
                />
                <span class="truncate">{{ data.label }}</span>
              </span>
            </template>
          </ElTree>
          <ElEmpty
            v-if="filteredTemplateTree.length === 0"
            description="未找到匹配模板"
          />
        </main>

        <footer class="grid gap-2 border-t border-border pt-3">
          <div
            class="min-h-[72px] whitespace-pre-wrap rounded-md border border-border bg-muted/30 p-2 text-sm leading-5 text-foreground"
          >
            {{ selectedReportTemplate?.content || '请选择模板' }}
          </div>
          <div class="flex justify-end gap-2">
            <ElButton
              data-testid="replace-report-template"
              @click="applyReportTemplate('replace')"
            >
              替换当前
            </ElButton>
            <ElButton
              data-testid="append-report-template"
              type="primary"
              @click="applyReportTemplate('append')"
            >
              追加模板
            </ElButton>
          </div>
        </footer>
      </div>
    </ElDrawer>
  </section>
</template>

<style scoped>
.report-meta-cell {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 4px;
  align-items: center;
  min-height: 28px;
  padding: 2px 4px;
}

.report-meta-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  border-bottom: 1px solid #111;
}

.report-meta-cell.span-2 {
  grid-column: span 2;
}

.report-style-select {
  flex: 0 0 260px;
  width: 260px;
  min-width: 260px;
  max-width: 260px;
}

.report-label {
  font-weight: 600;
  white-space: nowrap;
}

.report-hospital-name,
.report-edit-label {
  color: var(--report-accent-color, #f00);
}

.report-value {
  width: 100%;
  min-width: 0;
  min-height: 20px;
  padding: 2px 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  outline: none;
  background: #ddd;
  border: 0;
}

.special-report-form {
  min-height: 680px;
  padding: 10px 14px 16px;
  font-size: 16px;
  line-height: 1.65;
}

.special-report-title {
  margin: 0 0 4px;
  font-size: 20px;
  font-weight: 400;
}

.special-badge {
  display: inline-block;
  padding: 0 6px;
  margin: 2px 0;
  font-weight: 600;
  line-height: 20px;
  background: #eee;
  border-radius: 4px;
}

.special-inline-field,
.str-field {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 4px;
  align-items: center;
  margin: 5px 0;
}

.special-inline-field > span,
.str-field > span {
  white-space: nowrap;
}

.special-input {
  width: 100%;
  min-width: 0;
  height: 27px;
  padding: 2px 6px;
  outline: none;
  background: #fff;
  border: 1px solid #c8c8c8;
  border-radius: 4px;
}

.special-block {
  margin-top: 8px;
}

.special-section-title {
  font-weight: 600;
}

.special-checkbox-line {
  display: flex;
  gap: 4px;
  align-items: center;
  min-height: 30px;
}

.special-checkbox-line input {
  width: 14px;
  height: 14px;
  margin: 0;
}

.special-preview-block {
  padding-top: 6px;
  margin-top: 8px;
  border-top: 1px solid #777;
}

.special-preview-title {
  font-weight: 600;
  color: #00f;
}

.special-preview-textarea {
  display: block;
  width: 100%;
  min-height: 106px;
  padding: 8px;
  margin-top: 2px;
  line-height: 1.5;
  resize: vertical;
  outline: none;
  border: 1px solid #c8c8c8;
  border-radius: 4px;
}

.str-field {
  max-width: 360px;
}

.str-field-wide {
  max-width: 610px;
}

.str-result-table {
  width: 100%;
  border-collapse: collapse;
}

.str-result-table th,
.str-result-table td {
  padding: 5px;
  border: 1px solid #777;
}

.str-result-table th {
  font-weight: 600;
  text-align: center;
}

.report-header-input {
  align-self: end;
}

.classic-report-layout {
  display: flex;
  flex-direction: column;
  min-height: 680px;
  background: #fff;
}

.classic-report-section {
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-bottom: 1px solid #999;
}

.classic-report-heading {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  min-height: 22px;
  padding: 0 6px;
  background: #c7def4;
  border-bottom: 1px solid #9ebad6;
}

.classic-report-label {
  font-weight: 600;
  color: #000;
}

.classic-report-textarea {
  display: block;
  flex: 1 1 auto;
  width: 100%;
  min-height: 132px;
  padding: 8px;
  line-height: 1.45;
  resize: vertical;
  outline: none;
  background: #fff;
  border: 0;
}

.classic-report-diagnosis-section {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 240px;
  min-height: 238px;
}

.classic-report-diagnosis-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
  border-right: 1px solid #999;
}

.classic-report-status-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 6px;
  background: #f2f2f2;
}

.classic-report-select-stack {
  display: grid;
  gap: 6px;
  align-content: start;
  width: 128px;
}

.classic-report-status-spacer {
  flex: 1 1 auto;
  min-height: 120px;
  margin-top: 8px;
  border: 1px solid #d0d0d0;
}

.classic-report-flags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  align-items: center;
  padding-top: 6px;
  font-weight: 600;
}

.classic-report-flag {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  height: 20px;
}

.classic-report-flag:first-child {
  color: #f00;
}

.classic-report-flag input {
  width: 13px;
  height: 13px;
  margin: 0;
}

.report-footer-field {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 4px;
  align-items: center;
}

.report-edit-section {
  padding: 8px 18px 10px;
  border-bottom: 1px solid #111;
}

.report-edit-heading {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.report-edit-label {
  display: block;
  font-weight: 600;
}

.report-template-button {
  color: #f00;
  background: #fff;
  border-color: #f00;
}

.report-template-button:hover,
.report-template-button:focus {
  color: #fff;
  background: #f00;
  border-color: #f00;
}

.report-edit-textarea {
  display: block;
  width: 100%;
  padding: 6px 8px;
  line-height: 1.45;
  resize: vertical;
  outline: none;
  background: #ddd;
  border: 0;
}

.report-microscopic-image-canvas {
  position: relative;
  min-height: 160px;
  margin-top: 8px;
  overflow: hidden;
  background: #f7f7f7;
  border: 1px dashed #bdbdbd;
}

.report-microscopic-image-canvas.is-preview {
  min-height: 160px;
}

.report-microscopic-image {
  position: absolute;
  width: 96px;
  height: 72px;
  cursor: move;
  user-select: none;
  object-fit: cover;
  background: #fff;
  border: 1px solid #999;
}

.report-template-tree-node {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  min-width: 0;
  font-weight: 600;
}

.report-template-tree-node.is-diagnosis-template {
  color: #ff1493;
}

.report-template-node-icon {
  flex: 0 0 auto;
  width: 14px;
  height: 14px;
}
</style>
