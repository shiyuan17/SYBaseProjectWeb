import type {
  CaseLifecycleTrackingView,
  LifecycleNodeView,
} from '../../doctor-workflow/types/doctor-workflow';

export interface TrackingLifecycleFact {
  isDateTime: boolean;
  label: string;
  value: string;
}

export interface TrackingLifecycleNode {
  facts: TrackingLifecycleFact[];
  key: string;
  occurredAt: null | string;
  operatorDevice: null | string;
  operatorIp: null | string;
  operatorName: null | string;
  status: null | string;
  title: string;
}

export interface TrackingLifecycleStage {
  nodes: TrackingLifecycleNode[];
  title: string;
}

const DATE_TIME_LABELS = new Set([
  '修订时间',
  '入库时间',
  '出库时间',
  '初步阅片时间',
  '包埋时间',
  '发布时间',
  '取材时间',
  '固定时间',
  '复核时间',
  '完成切片时间',
  '打印时间',
  '染色出片时间',
  '标本确认时间',
  '登记时间',
  '离体时间',
  '签发时间',
  '签收时间',
  '脱水完成时间',
  '脱水开始时间',
  '驳回时间',
]);

const CLINICAL_NODE_CONFIGS = [
  {
    codes: ['SPECIMEN_REMOVAL'],
    fields: ['离体操作人', '离体时间'],
    title: '离体确认',
  },
  {
    codes: ['SPECIMEN_FIXATION'],
    fields: ['标本固定液', '标本固定人', '固定时间'],
    title: '标本固定',
  },
  {
    codes: ['SPECIMEN_CONFIRMATION'],
    fields: ['标本确认人', '标本确认时间'],
    title: '标本确认',
  },
  {
    codes: ['SPECIMEN_CHECK_IN'],
    fields: ['入库操作人', '入库时间'],
    title: '标本入库',
  },
  {
    codes: ['SPECIMEN_OUTBOUND'],
    fields: ['出库操作人', '出库时间'],
    title: '标本出库',
  },
] as const;

const PRODUCTION_NODE_CONFIGS = [
  {
    codes: ['SPECIMEN_RECEIPT'],
    fields: ['物流人员', '签收人员', '签收时间', '接收状态'],
    title: '标本接收',
  },
  {
    codes: ['SPECIMEN_REGISTRATION'],
    fields: [
      '登记状态',
      '登记时间',
      '登记人',
      '送检类型',
      '标本名称',
      '类型',
      '来源部位',
      '标本大小',
      '核对状态',
      '评价',
      '登记影像',
    ],
    title: '标本登记',
  },
  {
    codes: ['GROSSING'],
    fields: [
      '取材状态',
      '取材时间',
      '包埋盒盒号',
      '包埋备注',
      '取材影像',
      '大体描写信息',
    ],
    title: '取材描写',
  },
  {
    codes: ['DEHYDRATION'],
    fields: ['脱水开始时间', '脱水完成时间', '脱水状态', '脱水操作人'],
    title: '脱水',
  },
  {
    codes: ['EMBEDDING'],
    fields: ['包埋状态', '包埋时间', '包埋人员', '切片备注', '取材评价'],
    title: '包埋',
  },
  {
    codes: ['SLICING'],
    fields: [
      '玻片打印状态',
      '打印时间',
      '打印操作人',
      '完成切片时间',
      '完成切片人',
    ],
    title: '切片',
  },
  {
    codes: ['STAINING'],
    fields: ['染色出片时间', '出片操作人', '出片是否超时', '超时时长'],
    title: '染色出片',
  },
  {
    codes: ['DIAGNOSIS_ASSIGNMENT'],
    fields: ['初诊阅片人', '签发阅片人'],
    title: '诊断分配',
  },
] as const;

const REPORT_NODE_CODES = new Set([
  'PRIMARY_READING',
  'REPORT_DETAIL',
  'REPORT_PUBLISH',
  'REPORT_REVIEW',
  'REPORT_REVISION',
  'REPORT_SIGN',
]);

const REPORT_FIELDS = [
  '初步阅片人',
  '初步阅片时间',
  '复核人',
  '复核时间',
  '签发人',
  '签发时间',
  '详情报告',
  '驳回状态',
  '驳回时间',
  '驳回人',
  '发布人',
  '发布时间',
  '修订时间',
  '修订人',
] as const;

function normalizeCode(value?: null | string) {
  return value?.trim().toUpperCase() ?? '';
}

function normalizeTitle(value?: null | string) {
  return value?.trim() ?? '';
}

function normalizeValue(value?: null | string) {
  const normalized = value?.trim();
  return normalized || '-';
}

function collectNodes(tracking: CaseLifecycleTrackingView | null) {
  return (
    tracking?.overallTimeline.flatMap((stage) => stage.nodes ?? []) ?? []
  );
}

function findNodesByConfig(
  nodes: LifecycleNodeView[],
  config: { codes: readonly string[]; title: string },
) {
  const codeSet = new Set(config.codes);
  return nodes.filter((node) => {
    const nodeCode = normalizeCode(node.nodeCode);
    return codeSet.has(nodeCode) || normalizeTitle(node.title) === config.title;
  });
}

function buildFactMap(nodes: LifecycleNodeView[]) {
  const factMap = new Map<string, string>();
  for (const node of nodes) {
    for (const fact of node.keyFacts ?? []) {
      if (!factMap.has(fact.label)) {
        factMap.set(fact.label, normalizeValue(fact.value));
      }
    }
  }
  return factMap;
}

function buildFacts(
  fields: readonly string[],
  factMap: Map<string, string>,
): TrackingLifecycleFact[] {
  return fields.map((label) => ({
    isDateTime: DATE_TIME_LABELS.has(label),
    label,
    value: factMap.get(label) ?? '-',
  }));
}

function buildNode(
  sourceNode: LifecycleNodeView,
  title: string,
  fields: readonly string[],
  sourceNodes = [sourceNode],
): TrackingLifecycleNode {
  return {
    facts: buildFacts(fields, buildFactMap(sourceNodes)),
    key: [
      title,
      sourceNode.nodeCode ?? '',
      sourceNode.occurredAt ?? '',
      sourceNode.operatorName ?? '',
    ].join('|'),
    occurredAt: sourceNode.occurredAt ?? null,
    operatorDevice: sourceNode.operatorDevice ?? null,
    operatorIp: sourceNode.operatorIp ?? null,
    operatorName: sourceNode.operatorName ?? null,
    status: sourceNode.status ?? null,
    title,
  };
}

function buildNodesByConfigs(
  nodes: LifecycleNodeView[],
  configs: typeof CLINICAL_NODE_CONFIGS | typeof PRODUCTION_NODE_CONFIGS,
) {
  return configs.flatMap((config) =>
    findNodesByConfig(nodes, config).map((node) =>
      buildNode(node, config.title, config.fields),
    ),
  );
}

function isTrackingLifecycleNode(
  node: null | TrackingLifecycleNode,
): node is TrackingLifecycleNode {
  return node !== null;
}

function buildReportNode(nodes: LifecycleNodeView[]) {
  const reportNodes = nodes.filter((node) =>
    REPORT_NODE_CODES.has(normalizeCode(node.nodeCode)),
  );
  if (reportNodes.length === 0) {
    return null;
  }
  const firstNode = reportNodes[0];
  if (!firstNode) {
    return null;
  }
  return buildNode(firstNode, '报告', REPORT_FIELDS, reportNodes);
}

export function buildTrackingLifecycleStages(
  tracking: CaseLifecycleTrackingView | null,
): TrackingLifecycleStage[] {
  const nodes = collectNodes(tracking);
  const clinicalNodes: TrackingLifecycleNode[] = buildNodesByConfigs(
    nodes,
    CLINICAL_NODE_CONFIGS,
  );
  const productionNodes: TrackingLifecycleNode[] = [
    ...buildNodesByConfigs(nodes, PRODUCTION_NODE_CONFIGS),
    buildReportNode(nodes),
  ].filter(isTrackingLifecycleNode);

  return [
    { nodes: clinicalNodes, title: '临床送检' },
    { nodes: productionNodes, title: '制片管理' },
  ].filter((stage) => stage.nodes.length > 0);
}
