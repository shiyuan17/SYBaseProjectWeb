import type { TechnicalWorkbenchPageConfig } from '../types/technical-workbench';

import { formatPatientIdDisplay } from './format';
import {
  createMedicalOrderWorkstationDataSource,
  TECHNICAL_ORDER_CATEGORY_CODES,
} from './medical-order-workstation';

function toOptionalString(value: unknown) {
  return typeof value === 'string' ? value : undefined;
}

function formatTechnicalOrderPatientId(row: Record<string, unknown>) {
  return formatPatientIdDisplay(
    toOptionalString(row.patientIdDisplay),
    toOptionalString(row.patientId),
  );
}

function formatDisplayOnlyPatientId(row: Record<string, unknown>) {
  return formatPatientIdDisplay(toOptionalString(row.patientIdDisplay));
}

function formatIhcPatientId(row: Record<string, unknown>) {
  return formatDisplayOnlyPatientId(row);
}

const PENDING_ORDER_STATUS_OPTIONS = [
  { label: '待确认', value: 'PENDING' },
  { label: '已确认', value: 'IN_PROGRESS' },
  { label: '已出片', value: 'COMPLETED' },
  { label: '已终止', value: 'TERMINATED' },
];

export const ROUTINE_ORDER_WORKSTATION_CONFIG: TechnicalWorkbenchPageConfig = {
  columns: [
    {
      formatter: (_, rowIndex) => String(rowIndex + 1),
      key: 'rowIndex',
      label: '序',
      width: 56,
    },
    { key: 'pathologyNo', label: '病理号', minWidth: 132 },
    { key: 'inpatientNo', label: '住院号', minWidth: 96 },
    { key: 'blockNo', label: '蜡块号', width: 86 },
    { key: 'patientName', label: '病人姓名', minWidth: 100 },
    { key: 'checkItem', label: '检查项目', minWidth: 130 },
    { key: 'doctorTime', label: '医嘱时间', minWidth: 160 },
    { key: 'doctorUser', label: '医嘱医生', minWidth: 100 },
    { key: 'chargeStatus', label: '收费状态', minWidth: 90 },
    { key: 'confirmedStatus', label: '确认状态', minWidth: 90 },
    { key: 'printStatus', label: '打印状态', minWidth: 90 },
    { key: 'printTime', label: '打印时间', minWidth: 100 },
    { key: 'releaseStatus', label: '出片状态', minWidth: 90 },
    { key: 'releaseTime', label: '出片时间', minWidth: 100 },
    { key: 'remark', label: '备注', minWidth: 120 },
    { key: 'terminationReason', label: '终止原因', minWidth: 120 },
  ],
  dataSource: createMedicalOrderWorkstationDataSource(
    TECHNICAL_ORDER_CATEGORY_CODES.routine,
    'routine',
  ),
  defaultPageSize: 30,
  defaultWorkday: 'today',
  description:
    '按照旧工作站的操作顺序整理常规医嘱列表，保留高密度工具栏与单表格主视图。',
  emptyText: '暂无常规医嘱数据',
  queryActions: [
    { id: 'routine-more', label: '更多' },
    { id: 'routine-overdue', label: '过期任务' },
  ],
  searchPlaceholder: '请输入病理号',
  showWorkDatePicker: true,
  showPageHeader: false,
  statusOptions: PENDING_ORDER_STATUS_OPTIONS,
  title: '常规医嘱工作站',
  toolbarGroups: [
    [
      {
        hotkey: 'F8',
        id: 'routine-confirm',
        label: '确认',
        requiresSelection: true,
        tone: 'primary',
      },
      { id: 'routine-print-slide', label: '打印玻片', requiresSelection: true },
      {
        hotkey: 'F9',
        id: 'routine-release',
        label: '出片',
        requiresSelection: true,
      },
      {
        id: 'routine-stop',
        label: '终止',
        requiresSelection: true,
        tone: 'danger',
      },
    ],
    [
      {
        id: 'routine-print-label',
        label: '打印申请单标签',
        requiresSelection: true,
      },
      { id: 'routine-merge', label: '相同项目合片' },
      { id: 'routine-unmerge', label: '取消合片' },
      { id: 'routine-export', label: '导出Excel' },
      { id: 'routine-qc', label: '质控评价' },
    ],
  ],
};

export const SPECIAL_ORDER_WORKSTATION_CONFIG: TechnicalWorkbenchPageConfig = {
  columns: [
    {
      formatter: (_, rowIndex) => String(rowIndex + 1),
      key: 'rowIndex',
      label: '序',
      width: 56,
    },
    { key: 'pathologyNo', label: '病理号', minWidth: 132 },
    { key: 'inpatientNo', label: '住院号', minWidth: 100 },
    {
      formatter: formatTechnicalOrderPatientId,
      key: 'patientId',
      label: '病人ID',
      minWidth: 100,
    },
    { key: 'patientName', label: '病人姓名', minWidth: 100 },
    { key: 'checkItem', label: '检查项目', minWidth: 120 },
    { key: 'remark', label: '备注', minWidth: 120 },
    { key: 'orderType', label: '项目类型', minWidth: 96 },
    { key: 'confirmAction', label: '确认操作', minWidth: 90 },
    { key: 'orderAction', label: '出片操作', minWidth: 90 },
    { key: 'chargeStatus', label: '收费状态', minWidth: 90 },
    { key: 'doctorUser', label: '医嘱医生', minWidth: 100 },
    { key: 'printStatus', label: '打印状态', minWidth: 90 },
    { key: 'doctorMessage', label: '医嘱留言', minWidth: 140 },
    { key: 'revokeReminder', label: '撤销提醒', minWidth: 100 },
  ],
  dataSource: createMedicalOrderWorkstationDataSource(
    TECHNICAL_ORDER_CATEGORY_CODES.special,
    'special',
  ),
  defaultPageSize: 100,
  defaultWorkday: 'today',
  description:
    '延续常规医嘱页的信息密度，但突出项目类型、确认操作和撤销提醒等特检字段。',
  emptyText: '暂无特检医嘱数据',
  queryActions: [
    { id: 'special-more', label: '更多' },
    { id: 'special-overdue', label: '过期任务' },
    { id: 'special-remind', label: '撤销提醒' },
  ],
  searchPlaceholder: '请输入病理号',
  showWorkDatePicker: true,
  showPageHeader: false,
  statusOptions: PENDING_ORDER_STATUS_OPTIONS,
  title: '特检医嘱工作站',
  toolbarGroups: [
    [
      {
        hotkey: 'F8',
        id: 'special-confirm',
        label: '确认',
        requiresSelection: true,
        tone: 'primary',
      },
      { id: 'special-print-label', label: '打印标签', requiresSelection: true },
      {
        hotkey: 'F9',
        id: 'special-release',
        label: '出片',
        requiresSelection: true,
      },
      {
        id: 'special-stop',
        label: '终止',
        requiresSelection: true,
        tone: 'danger',
      },
    ],
    [
      { id: 'special-export', label: '导出Excel' },
      {
        id: 'special-change-block',
        label: '改蜡块号',
        requiresSelection: true,
      },
      { id: 'special-qc', label: '质控评价' },
    ],
  ],
};

export const IHC_WORKSTATION_CONFIG: TechnicalWorkbenchPageConfig = {
  columns: [
    {
      formatter: (_, rowIndex) => String(rowIndex + 1),
      key: 'rowIndex',
      label: '序',
      width: 56,
    },
    {
      formatter: formatIhcPatientId,
      key: 'patientId',
      label: '病人ID',
      minWidth: 100,
    },
    { key: 'pathologyNo', label: '原病理号', minWidth: 132 },
    { key: 'patientName', label: '病人', minWidth: 90 },
    { key: 'specimenNo', label: '蜡块号', minWidth: 96 },
    { key: 'confirmAction', label: '确认操作', minWidth: 90 },
    { key: 'instrumentAction', label: '上机操作', minWidth: 90 },
    { key: 'stainingAction', label: '出片操作', minWidth: 90 },
    { key: 'deviceName', label: '分配设备', minWidth: 100 },
    { key: 'doctorUser', label: '医嘱医生', minWidth: 100 },
  ],
  dataSource: createMedicalOrderWorkstationDataSource(
    TECHNICAL_ORDER_CATEGORY_CODES.ihc,
    'ihc',
  ),
  defaultPageSize: 100,
  defaultWorkday: 'today',
  description:
    '保留 Roche / Dako 入口和待确认计数，用统一 Web 骨架承载上机、染色与出片动作。',
  emptyText: '暂无免疫组化任务',
  metrics: [
    {
      id: 'ihc-pending-confirm',
      label: '待确认',
      tone: 'danger',
      value: (rows) =>
        rows.filter((row) => row.confirmAction === '待确认').length,
    },
    {
      id: 'ihc-confirmed-today',
      label: '本人今日确认',
      tone: 'success',
      value: (rows) =>
        rows.filter((row) => row.confirmAction === '已确认').length,
    },
  ],
  queryActions: [
    { id: 'ihc-more', label: '更多' },
    { id: 'ihc-overdue', label: '过期任务' },
    { id: 'ihc-change-remind', label: '变更提醒' },
  ],
  searchPlaceholder: '请输入病理号',
  showWorkDatePicker: true,
  showPageHeader: false,
  statusOptions: PENDING_ORDER_STATUS_OPTIONS,
  title: '免疫组化工作站',
  toolbarGroups: [
    [
      { id: 'ihc-roche', label: 'Roche标签' },
      { id: 'ihc-dako', label: 'Dako标签' },
      {
        id: 'ihc-confirm',
        label: '确认',
        requiresSelection: true,
        tone: 'primary',
      },
      { id: 'ihc-stain', label: '染色', requiresSelection: true },
      { id: 'ihc-release', label: '出片', requiresSelection: true },
    ],
  ],
};

export const CYTOLOGY_WORKSTATION_CONFIG: TechnicalWorkbenchPageConfig = {
  columns: [
    {
      formatter: (_, rowIndex) => String(rowIndex + 1),
      key: 'rowIndex',
      label: '序',
      width: 56,
    },
    { key: 'sampleType', label: '送检类型', minWidth: 120 },
    { key: 'pathologyNo', label: '病理号', minWidth: 132 },
    { key: 'patientName', label: '病人', minWidth: 90 },
    {
      formatter: formatDisplayOnlyPatientId,
      key: 'patientId',
      label: '病人ID',
      minWidth: 100,
    },
    { key: 'flowStatus', label: '流程状态', minWidth: 100 },
    { key: 'printedBlocks', label: '已打蜡块', minWidth: 96, align: 'center' },
    { key: 'printedSlides', label: '已打玻片', minWidth: 96, align: 'center' },
    { key: 'blockCount', label: '蜡块数', minWidth: 80, align: 'center' },
    { key: 'slideCount', label: '玻片数', minWidth: 80, align: 'center' },
    { key: 'tagName', label: '标本', minWidth: 90 },
    { key: 'submitDept', label: '送检科室', minWidth: 120 },
    { key: 'receiverName', label: '接收人', minWidth: 90 },
    { key: 'releaseUser', label: '出片人', minWidth: 90 },
  ],
  dataSource: createMedicalOrderWorkstationDataSource(
    TECHNICAL_ORDER_CATEGORY_CODES.cytology,
    'cytology',
  ),
  defaultPageSize: 100,
  defaultWorkday: 'today',
  description:
    '围绕细胞学送检流转组织页面，保留生成蜡块、打印蜡块和延迟固定等传统入口。',
  emptyText: '暂无细胞学任务',
  queryActions: [
    {
      id: 'cytology-generate-block',
      label: '生成蜡块',
      requiresSelection: true,
    },
    { id: 'cytology-print-block', label: '打印蜡块', requiresSelection: true },
    { id: 'cytology-pending-slide', label: '待打印玻片列表(0)' },
    { id: 'cytology-delay-fixation', label: '延迟固定' },
    { id: 'cytology-overdue', label: '过期任务' },
  ],
  searchPlaceholder: '请输入病理号',
  showWorkDatePicker: true,
  showPageHeader: false,
  statusOptions: PENDING_ORDER_STATUS_OPTIONS,
  title: '细胞学工作站',
  toolbarGroups: [
    [
      { id: 'cytology-qc', label: '质控评价' },
      { id: 'cytology-green-doctor', label: '特检医嘱' },
      {
        id: 'cytology-release',
        label: '出片',
        requiresSelection: true,
        tone: 'primary',
      },
    ],
  ],
};

export const LIQUID_CYTOLOGY_WORKSTATION_CONFIG: TechnicalWorkbenchPageConfig =
  {
    columns: [
      {
        formatter: (_, rowIndex) => String(rowIndex + 1),
        key: 'rowIndex',
        label: '序',
        width: 56,
      },
      { key: 'pathologyNo', label: '病理号', minWidth: 132 },
      { key: 'patientName', label: '病人', minWidth: 90 },
      {
        key: 'printedSlides',
        label: '已打玻片',
        minWidth: 96,
        align: 'center',
      },
      { key: 'flowStatus', label: '流程状态', minWidth: 100 },
      {
        formatter: formatDisplayOnlyPatientId,
        key: 'patientId',
        label: '病人ID',
        minWidth: 100,
      },
      { key: 'submitDept', label: '送检科室', minWidth: 120 },
      { key: 'receiverName', label: '接收人', minWidth: 90 },
      { key: 'releaseUser', label: '出片人', minWidth: 90 },
    ],
    dataSource: createMedicalOrderWorkstationDataSource(
      TECHNICAL_ORDER_CATEGORY_CODES.liquidCytology,
      'liquid-cytology',
    ),
    defaultPageSize: 100,
    defaultWorkday: 'today',
    description:
      '保持液基细胞学页面的极简工具栏，只突出出片、打印玻片和过期任务入口。',
    emptyText: '暂无液基细胞学任务',
    queryActions: [{ id: 'liquid-cytology-overdue', label: '过期任务' }],
    searchPlaceholder: '请输入病理号',
    showWorkDatePicker: true,
    showPageHeader: false,
    statusOptions: PENDING_ORDER_STATUS_OPTIONS,
    title: '液基细胞学工作站',
    toolbarGroups: [
      [
        {
          id: 'liquid-cytology-release',
          label: '出片',
          requiresSelection: true,
          tone: 'primary',
        },
        {
          hotkey: 'F8',
          id: 'liquid-cytology-print-slide',
          label: '打印玻片',
          requiresSelection: true,
        },
        { id: 'liquid-cytology-qc', label: '质控评价' },
      ],
    ],
  };
