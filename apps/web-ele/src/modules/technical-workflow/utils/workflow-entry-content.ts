import type {
  WorkflowChainStep,
  WorkflowMapCard,
  WorkflowOverviewCard,
} from '../types/technical-workflow-entry';

import { TECHNICAL_WORKFLOW_ROUTE_META } from '../constants';

export const workflowOverviewCards: WorkflowOverviewCard[] = [
  {
    description:
      '承接病理接收后的实验室内部生产流程，是技术组从病例进入到玻片产出的统一工作区。',
    title: '业务定位',
  },
  {
    description:
      '围绕接收后标本登记、任务池调度、取材、脱水、包埋、切片、染色出片、返工和追踪组织流程。',
    title: '流程范围',
  },
  {
    description:
      '最终输出可追踪的蜡块、玻片与质控记录，并把诊断所需材料持续推送给下游医生流程。',
    title: '最终结果',
  },
];

export const workflowMapCards: WorkflowMapCard[] = [
  {
    items: [
      '病理接收沿用原有页面与权限，不改变既有菜单地址。',
      '接收后先进入标本登记，登记完成后才进入任务池或目标工位。',
      '技术追踪按病例回看对象树、时间线和异常闭环。',
    ],
    title: '入口与串联',
  },
  {
    items: [
      '常规制片主链覆盖取材、脱水、包埋、切片、染色出片。',
      '任务池继续承接分派、认领、释放和连续处理，但不再是接收后的第一站。',
      '每个工位都围绕同一病例对象持续推进任务状态。',
    ],
    title: '常规制片主链',
  },
  {
    items: [
      '冰冻链独立于常规制片任务池展示，避免语义混淆。',
      '返工和超时任务统一进入异常闭环，而不是散落在各工位。',
      '技术追踪作为返工、质控与主流程核对的统一回看入口。',
    ],
    title: '异常与并行链',
  },
  {
    items: [
      '同一病例会持续关联标本、蜡块、包埋盒和玻片。',
      '超时、处理中和备注会直接影响入口摘要和工位队列排序。',
      '页面更强调“连续处理一条生产链”，而不是单次点状操作。',
    ],
    title: '对象与状态',
  },
];

export const workflowSteps: WorkflowChainStep[] = [
  {
    actionLabel: '打开病理接收',
    description: '接收岗完成病例接收、拒收和明细核对，让病例进入技术链起点。',
    helperText: '当前仍沿用原页面和原权限，不改变外部跳转地址。',
    routePath: '/workflow/pathology-receipt',
    title: '步骤 1: 病理接收',
  },
  {
    actionLabel: '进入标本登记',
    description:
      '接收后先完成技术标本登记，确认送检材料、临床诊断与检查项目后再进入制片主链。',
    helperText: '该页面是取材前置关卡，不复用临床送检阶段的标本登记语义。',
    routePath: TECHNICAL_WORKFLOW_ROUTE_META.SPECIMEN_REGISTRATION.path,
    title: '步骤 2: 标本登记',
  },
  {
    actionLabel: '进入任务池',
    description:
      '任务池继续承担统一调度、连续查看和可选分派，但不是进入后续工位的强制前置。',
    helperText: '当工位间需要切换或集中查看病例时，可先从任务池进入。',
    routePath: TECHNICAL_WORKFLOW_ROUTE_META.TASKS.path,
    title: '步骤 3: 任务调度',
  },
  {
    actionLabel: '进入取材描写',
    description:
      '取材描写把病例转换成后续制片对象，是常规主链的首个核心生产节点。',
    helperText: '适合从待处理任务继续加工同一病例的标本与蜡块。',
    routePath: TECHNICAL_WORKFLOW_ROUTE_META.GROSSING.path,
    title: '步骤 4: 取材描写',
  },
  {
    actionLabel: '进入包埋/切片',
    description: '脱水、包埋、切片按主链连续推进，把蜡块逐步转化为玻片。',
    helperText: '当前入口只保留主链导航，详细操作仍在各工位内完成。',
    routePath: TECHNICAL_WORKFLOW_ROUTE_META.EMBEDDING.path,
    title: '步骤 5: 制片执行',
  },
  {
    actionLabel: '进入染色出片',
    description: '染色出片承接切片结果，为医生侧后续诊断准备最终可用材料。',
    helperText: '当病例已接近产物输出阶段，可从这里继续推进并核对状态。',
    routePath: TECHNICAL_WORKFLOW_ROUTE_META.STAINING.path,
    title: '步骤 6: 产物流转',
  },
];
