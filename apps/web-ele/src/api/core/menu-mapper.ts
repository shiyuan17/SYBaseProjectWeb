import type { RouteRecordStringComponent } from '@vben/types';

import type { MenuView } from '#/modules/system-management/types/system-management';

type BackendMenuComponentDefinition = {
  component: string;
  componentAliases: string[];
  menuCodes?: string[];
  path: string;
  pathAliases?: string[];
  routeName: string;
};

type MenuTreeNode = MenuView & {
  children: MenuTreeNode[];
};

const STATIC_FALLBACK_MENU_ROUTES: RouteRecordStringComponent<string>[] = [
  {
    component: 'BasicLayout',
    meta: {
      icon: 'lucide:layout-dashboard',
      order: -1,
      title: '概览',
    },
    name: 'Dashboard',
    path: '/dashboard',
    redirect: '/analytics',
    children: [
      {
        component: '/views/dashboard/analytics/index',
        meta: {
          affixTab: true,
          icon: 'lucide:area-chart',
          title: '分析页',
        },
        name: 'Analytics',
        path: '/analytics',
      },
      {
        component: '/views/dashboard/workspace/index',
        meta: {
          icon: 'carbon:workspace',
          title: '工作台',
        },
        name: 'Workspace',
        path: '/workspace',
      },
    ],
  },
  {
    component: 'BasicLayout',
    meta: {
      icon: 'carbon:settings',
      order: 900,
      title: '系统管理',
    },
    name: 'SystemRoot',
    path: '/system',
    redirect: '/system/users',
    children: [
      {
        component: '/modules/system-management/views/SystemUsersView',
        meta: {
          icon: 'carbon:user-avatar',
          title: '系统用户',
        },
        name: 'SystemUsers',
        path: '/system/users',
      },
      {
        component: '/modules/system-management/views/RolesView',
        meta: {
          icon: 'carbon:user-role',
          title: '角色授权',
        },
        name: 'Roles',
        path: '/system/roles',
      },
      {
        component: '/modules/system-management/views/DepartmentsView',
        meta: {
          icon: 'carbon:building',
          title: '科室字典',
        },
        name: 'Departments',
        path: '/system/departments',
      },
      {
        component: '/modules/system-management/views/BodyPartsView',
        meta: {
          icon: 'carbon:tree-view',
          title: '部位字典',
        },
        name: 'BodyParts',
        path: '/system/body-parts',
      },
      {
        component: '/modules/system-management/views/MedicalOrderDictsView',
        meta: {
          icon: 'carbon:book',
          title: '医嘱字典',
        },
        name: 'MedicalOrderDicts',
        path: '/system/medical-order-dicts',
      },
      {
        component: '/modules/system-management/views/MedicalOrderChargesView',
        meta: {
          icon: 'carbon:currency',
          title: '医嘱收费',
        },
        name: 'MedicalOrderCharges',
        path: '/system/medical-order-charges',
      },
      {
        component: '/modules/system-management/views/MedicalOrderPackagesView',
        meta: {
          icon: 'carbon:package',
          title: '医嘱套餐',
        },
        name: 'MedicalOrderPackages',
        path: '/system/medical-order-packages',
      },
      {
        component: '/modules/system-management/views/SamplingTemplatesView',
        meta: {
          icon: 'carbon:document-preliminary',
          title: '描写模板',
        },
        name: 'SamplingTemplates',
        path: '/system/sampling-templates',
      },
      {
        component: '/modules/system-management/views/SamplingGuidelinesView',
        meta: {
          icon: 'carbon:rule',
          title: '取材规范',
        },
        name: 'SamplingGuidelines',
        path: '/system/sampling-guidelines',
      },
      {
        component: '/modules/system-management/views/SystemConfigsView',
        meta: {
          icon: 'carbon:settings-adjust',
          title: '系统配置',
        },
        name: 'SystemConfigs',
        path: '/system/configs',
      },
      {
        component: '/modules/system-management/views/NumberingRulesView',
        meta: {
          icon: 'carbon:number-1',
          title: '编号规则',
        },
        name: 'NumberingRules',
        path: '/system/numbering-rules',
      },
    ],
  },
  {
    component: 'BasicLayout',
    meta: {
      icon: 'carbon:flow',
      order: 120,
      title: '临床送检工作流',
    },
    name: 'WorkflowRoot',
    path: '/workflow',
    redirect: '/workflow/clinical-register',
    children: [
      {
        component: '/modules/specimen-workflow/views/ClinicalRegisterView',
        meta: {
          icon: 'carbon:catalog',
          title: '临床登记',
        },
        name: 'ClinicalRegister',
        path: '/workflow/clinical-register',
      },
      {
        component: '/modules/specimen-workflow/views/FixationVerifyView',
        meta: {
          icon: 'carbon:checkmark-outline',
          title: '固定核对',
        },
        name: 'FixationVerify',
        path: '/workflow/fixation-verify',
      },
      {
        component: '/modules/specimen-workflow/views/TransportHandoverView',
        meta: {
          icon: 'carbon:delivery',
          title: '转运交接',
        },
        name: 'TransportHandover',
        path: '/workflow/transport-handover',
      },
      {
        component: '/modules/specimen-workflow/views/SpecimenReceiptView',
        meta: {
          icon: 'carbon:archive',
          title: '标本接收',
        },
        name: 'SpecimenReceipt',
        path: '/workflow/specimen-receipt',
      },
      {
        component: '/modules/specimen-workflow/views/TrackingQueryView',
        meta: {
          icon: 'carbon:search',
          title: '追踪查询',
        },
        name: 'TrackingQuery',
        path: '/workflow/tracking-query',
      },
    ],
  },
  {
    component: 'BasicLayout',
    meta: {
      icon: 'carbon:operations-record',
      order: 130,
      title: '技术组核心生产线',
    },
    name: 'TechnicalWorkflowRoot',
    path: '/technical-workflow',
    redirect: '/technical-workflow/tasks',
    children: [
      {
        component: '/modules/technical-workflow/views/TechnicalTasksView',
        meta: {
          icon: 'carbon:task',
          title: '任务池',
        },
        name: 'TechnicalTasks',
        path: '/technical-workflow/tasks',
      },
      {
        component: '/modules/technical-workflow/views/GrossingWorkstationView',
        meta: {
          icon: 'carbon:scan',
          title: '取材描写',
        },
        name: 'GrossingWorkstation',
        path: '/technical-workflow/grossing',
      },
      {
        component: '/modules/technical-workflow/views/DehydrationWorkstationView',
        meta: {
          icon: 'carbon:data-vis-4',
          title: '脱水工作站',
        },
        name: 'DehydrationWorkstation',
        path: '/technical-workflow/dehydration',
      },
      {
        component: '/modules/technical-workflow/views/EmbeddingWorkstationView',
        meta: {
          icon: 'carbon:cube',
          title: '包埋工作站',
        },
        name: 'EmbeddingWorkstation',
        path: '/technical-workflow/embedding',
      },
      {
        component: '/modules/technical-workflow/views/SlicingWorkstationView',
        meta: {
          icon: 'carbon:cut',
          title: '切片工作站',
        },
        name: 'SlicingWorkstation',
        path: '/technical-workflow/slicing',
      },
      {
        component: '/modules/technical-workflow/views/StainingWorkstationView',
        meta: {
          icon: 'carbon:color-palette',
          title: '染色出片',
        },
        name: 'StainingWorkstation',
        path: '/technical-workflow/staining',
      },
      {
        component: '/modules/technical-workflow/views/ReworkWorkstationView',
        meta: {
          icon: 'carbon:renew',
          title: '返工工作站',
        },
        name: 'ReworkWorkstation',
        path: '/technical-workflow/rework',
      },
      {
        component: '/modules/technical-workflow/views/TechnicalTrackingView',
        meta: {
          icon: 'carbon:search',
          title: '技术追踪',
        },
        name: 'TechnicalTracking',
        path: '/technical-workflow/tracking',
      },
    ],
  },
  {
    component: 'BasicLayout',
    meta: {
      icon: 'carbon:stethoscope',
      order: 140,
      title: '医生诊断工作流',
    },
    name: 'DoctorWorkflowRoot',
    path: '/doctor-workflow',
    redirect: '/doctor-workflow/assignment',
    children: [
      {
        component: '/modules/doctor-workflow/views/DiagnosisAssignmentView',
        meta: {
          icon: 'carbon:user-multiple',
          title: '诊断分配',
        },
        name: 'DiagnosisAssignment',
        path: '/doctor-workflow/assignment',
      },
      {
        component: '/modules/doctor-workflow/views/DiagnosisWorkbenchView',
        meta: {
          icon: 'carbon:workspace',
          title: '诊断工作台',
        },
        name: 'DiagnosisWorkbench',
        path: '/doctor-workflow/workbench',
      },
      {
        component: '/modules/doctor-workflow/views/PathologyReportView',
        meta: {
          icon: 'carbon:report',
          title: '病理报告',
        },
        name: 'PathologyReport',
        path: '/doctor-workflow/report',
      },
      {
        component: '/modules/doctor-workflow/views/ReportTrackingView',
        meta: {
          icon: 'carbon:search',
          title: '报告追踪',
        },
        name: 'ReportTracking',
        path: '/doctor-workflow/tracking',
      },
      {
        component: '/modules/doctor-workflow/views/ReportRevisionView',
        meta: {
          icon: 'carbon:document-preliminary',
          title: '报告修订',
        },
        name: 'ReportRevision',
        path: '/doctor-workflow/revision',
      },
      {
        component: '/modules/doctor-workflow/views/ConsultationWorkstationView',
        meta: {
          icon: 'carbon:group',
          title: '会诊管理',
        },
        name: 'Consultation',
        path: '/doctor-workflow/consultation',
      },
    ],
  },
  {
    component: 'BasicLayout',
    meta: {
      icon: 'carbon:archive',
      order: 160,
      title: '归档与运营支撑',
    },
    name: 'OperationSupportRoot',
    path: '/operation-support',
    redirect: '/operation-support/archive',
    children: [
      {
        component: '/modules/operation-support/views/ArchiveManagementView',
        meta: {
          icon: 'carbon:archive',
          title: '归档管理',
        },
        name: 'ArchiveManagement',
        path: '/operation-support/archive',
      },
      {
        component: '/modules/operation-support/views/ReagentLedgerView',
        meta: {
          icon: 'carbon:chemistry',
          title: '试剂台账',
        },
        name: 'ReagentLedger',
        path: '/operation-support/reagents',
      },
      {
        component: '/modules/operation-support/views/EquipmentLedgerView',
        meta: {
          icon: 'carbon:tools',
          title: '设备台账',
        },
        name: 'EquipmentLedger',
        path: '/operation-support/equipment',
      },
    ],
  },
];

const BACKEND_MENU_COMPONENT_DEFINITIONS: BackendMenuComponentDefinition[] = [
  {
    component: 'BasicLayout',
    componentAliases: ['Layout', 'SystemRoot'],
    menuCodes: ['SYSTEM', 'SYS_MANAGEMENT'],
    path: '/system',
    pathAliases: ['/system'],
    routeName: 'SystemRoot',
  },
  {
    component: '/modules/system-management/views/SystemUsersView',
    componentAliases: ['SystemUsers', 'system/user/index'],
    menuCodes: ['SYS_USERS', 'SYS_USER'],
    path: '/system/users',
    pathAliases: ['/system/users', '/api/v1/system-users'],
    routeName: 'SystemUsers',
  },
  {
    component: '/modules/system-management/views/RolesView',
    componentAliases: ['Roles', 'system/role/index'],
    menuCodes: ['SYS_ROLES', 'SYS_ROLE'],
    path: '/system/roles',
    pathAliases: ['/system/roles', '/api/v1/roles'],
    routeName: 'Roles',
  },
  {
    component: '/modules/system-management/views/DepartmentsView',
    componentAliases: ['Departments', 'system/department/index'],
    menuCodes: ['DEPARTMENTS', 'SYS_DEPT'],
    path: '/system/departments',
    pathAliases: ['/system/departments', '/api/v1/departments'],
    routeName: 'Departments',
  },
  {
    component: '/modules/system-management/views/BodyPartsView',
    componentAliases: ['BodyParts', 'system/body-part/index'],
    menuCodes: ['BODY_PARTS', 'SYS_BODY_PART'],
    path: '/system/body-parts',
    pathAliases: ['/system/body-parts', '/api/v1/body-parts'],
    routeName: 'BodyParts',
  },
  {
    component: '/modules/system-management/views/MedicalOrderDictsView',
    componentAliases: ['MedicalOrderDicts', 'system/medical-order-dict/index'],
    menuCodes: ['ORDER_DICTS', 'SYS_MEDICAL_ORDER_DICT'],
    path: '/system/medical-order-dicts',
    pathAliases: [
      '/system/medical-order-dict',
      '/system/medical-order-dicts',
      '/api/v1/medical-order-dicts',
    ],
    routeName: 'MedicalOrderDicts',
  },
  {
    component: '/modules/system-management/views/MedicalOrderChargesView',
    componentAliases: ['MedicalOrderCharges', 'system/medical-order-charge/index'],
    menuCodes: ['ORDER_CHARGES', 'SYS_MEDICAL_ORDER_CHARGE'],
    path: '/system/medical-order-charges',
    pathAliases: [
      '/system/medical-order-charge',
      '/system/medical-order-charges',
      '/api/v1/medical-order-charge-items',
    ],
    routeName: 'MedicalOrderCharges',
  },
  {
    component: '/modules/system-management/views/MedicalOrderPackagesView',
    componentAliases: ['MedicalOrderPackages', 'system/medical-order-package/index'],
    menuCodes: ['ORDER_PACKAGES', 'SYS_MEDICAL_ORDER_PACKAGE'],
    path: '/system/medical-order-packages',
    pathAliases: [
      '/system/medical-order-packages',
      '/api/v1/medical-order-packages',
    ],
    routeName: 'MedicalOrderPackages',
  },
  {
    component: '/modules/system-management/views/SamplingTemplatesView',
    componentAliases: ['SamplingTemplates', 'system/sampling-template/index'],
    menuCodes: ['SAMPLING_TEMPLATES', 'SYS_SAMPLING_TEMPLATE'],
    path: '/system/sampling-templates',
    pathAliases: [
      '/system/sampling-templates',
      '/api/v1/sampling-templates',
    ],
    routeName: 'SamplingTemplates',
  },
  {
    component: '/modules/system-management/views/SamplingGuidelinesView',
    componentAliases: ['SamplingGuidelines', 'system/sampling-guideline/index'],
    menuCodes: ['SAMPLING_GUIDELINES', 'SYS_SAMPLING_GUIDELINE'],
    path: '/system/sampling-guidelines',
    pathAliases: [
      '/system/sampling-guidelines',
      '/api/v1/sampling-guidelines',
    ],
    routeName: 'SamplingGuidelines',
  },
  {
    component: '/modules/system-management/views/SystemConfigsView',
    componentAliases: ['SystemConfigs', 'system/config/index'],
    menuCodes: ['SYSTEM_CONFIGS', 'SYS_CONFIG'],
    path: '/system/configs',
    pathAliases: ['/system/configs', '/api/v1/system-configs'],
    routeName: 'SystemConfigs',
  },
  {
    component: '/modules/system-management/views/NumberingRulesView',
    componentAliases: ['NumberingRules', 'system/numbering-rule/index'],
    menuCodes: ['NUMBERING_RULES', 'SYS_NUMBERING_RULE'],
    path: '/system/numbering-rules',
    pathAliases: ['/system/numbering-rules', '/api/v1/numbering-rules'],
    routeName: 'NumberingRules',
  },
  {
    component: 'BasicLayout',
    componentAliases: ['Dashboard'],
    menuCodes: ['DASHBOARD'],
    path: '/dashboard',
    pathAliases: ['/dashboard'],
    routeName: 'Dashboard',
  },
  {
    component: '/views/dashboard/analytics/index',
    componentAliases: ['Analytics'],
    menuCodes: ['ANALYTICS'],
    path: '/analytics',
    pathAliases: ['/analytics'],
    routeName: 'Analytics',
  },
  {
    component: '/views/dashboard/workspace/index',
    componentAliases: ['Workspace'],
    menuCodes: ['WORKSPACE'],
    path: '/workspace',
    pathAliases: ['/workspace'],
    routeName: 'Workspace',
  },
  {
    component: 'BasicLayout',
    componentAliases: ['WorkflowRoot'],
    menuCodes: ['M2_WORKFLOW'],
    path: '/workflow',
    pathAliases: ['/workflow'],
    routeName: 'WorkflowRoot',
  },
  {
    component: '/modules/specimen-workflow/views/ClinicalRegisterView',
    componentAliases: ['ClinicalRegister'],
    menuCodes: ['M2_CLINICAL'],
    path: '/workflow/clinical-register',
    pathAliases: [
      '/workflow/clinical-register',
      '/api/v1/specimens/register',
      '/api/v1/specimen-collections',
    ],
    routeName: 'ClinicalRegister',
  },
  {
    component: '/modules/specimen-workflow/views/FixationVerifyView',
    componentAliases: ['FixationVerify'],
    menuCodes: ['M2_FIXATION'],
    path: '/workflow/fixation-verify',
    pathAliases: ['/workflow/fixation-verify', '/api/v1/specimen-fixations'],
    routeName: 'FixationVerify',
  },
  {
    component: '/modules/specimen-workflow/views/TransportHandoverView',
    componentAliases: ['TransportHandover'],
    menuCodes: ['M2_TRANSPORT'],
    path: '/workflow/transport-handover',
    pathAliases: ['/workflow/transport-handover', '/api/v1/transport-orders'],
    routeName: 'TransportHandover',
  },
  {
    component: '/modules/specimen-workflow/views/SpecimenReceiptView',
    componentAliases: ['SpecimenReceipt'],
    menuCodes: ['M2_RECEIPT'],
    path: '/workflow/specimen-receipt',
    pathAliases: ['/workflow/specimen-receipt', '/api/v1/specimen-receipts'],
    routeName: 'SpecimenReceipt',
  },
  {
    component: '/modules/specimen-workflow/views/TrackingQueryView',
    componentAliases: ['TrackingQuery'],
    menuCodes: ['M2_TRACKING'],
    path: '/workflow/tracking-query',
    pathAliases: [
      '/workflow/tracking-query',
      '/api/v1/applications/{id}/tracking',
      '/api/v1/specimens/barcodes/{barcode}/tracking',
    ],
    routeName: 'TrackingQuery',
  },
  {
    component: 'BasicLayout',
    componentAliases: ['TechnicalWorkflowRoot'],
    menuCodes: ['M3_WORKFLOW'],
    path: '/technical-workflow',
    pathAliases: ['/technical-workflow'],
    routeName: 'TechnicalWorkflowRoot',
  },
  {
    component: '/modules/technical-workflow/views/TechnicalTasksView',
    componentAliases: ['TechnicalTasks'],
    menuCodes: ['M3_TASKS'],
    path: '/technical-workflow/tasks',
    pathAliases: ['/technical-workflow/tasks', '/api/v1/technical-tasks/pending'],
    routeName: 'TechnicalTasks',
  },
  {
    component: '/modules/technical-workflow/views/GrossingWorkstationView',
    componentAliases: ['Grossing'],
    menuCodes: ['M3_GROSSING'],
    path: '/technical-workflow/grossing',
    pathAliases: ['/technical-workflow/grossing', '/api/v1/grossings'],
    routeName: 'GrossingWorkstation',
  },
  {
    component: '/modules/technical-workflow/views/DehydrationWorkstationView',
    componentAliases: ['Dehydration'],
    menuCodes: ['M3_DEHYDRATION'],
    path: '/technical-workflow/dehydration',
    pathAliases: ['/technical-workflow/dehydration', '/api/v1/dehydration-batches'],
    routeName: 'DehydrationWorkstation',
  },
  {
    component: '/modules/technical-workflow/views/EmbeddingWorkstationView',
    componentAliases: ['Embedding'],
    menuCodes: ['M3_EMBEDDING'],
    path: '/technical-workflow/embedding',
    pathAliases: ['/technical-workflow/embedding', '/api/v1/embeddings'],
    routeName: 'EmbeddingWorkstation',
  },
  {
    component: '/modules/technical-workflow/views/SlicingWorkstationView',
    componentAliases: ['Slicing'],
    menuCodes: ['M3_SLICING'],
    path: '/technical-workflow/slicing',
    pathAliases: ['/technical-workflow/slicing', '/api/v1/slicings'],
    routeName: 'SlicingWorkstation',
  },
  {
    component: '/modules/technical-workflow/views/StainingWorkstationView',
    componentAliases: ['Staining'],
    menuCodes: ['M3_STAINING'],
    path: '/technical-workflow/staining',
    pathAliases: ['/technical-workflow/staining', '/api/v1/slide-stainings'],
    routeName: 'StainingWorkstation',
  },
  {
    component: '/modules/technical-workflow/views/ReworkWorkstationView',
    componentAliases: ['Rework'],
    menuCodes: ['M3_REWORK'],
    path: '/technical-workflow/rework',
    pathAliases: ['/technical-workflow/rework', '/api/v1/rework-orders'],
    routeName: 'ReworkWorkstation',
  },
  {
    component: '/modules/technical-workflow/views/TechnicalTrackingView',
    componentAliases: ['TechnicalTracking'],
    menuCodes: ['M3_TRACKING'],
    path: '/technical-workflow/tracking',
    pathAliases: [
      '/technical-workflow/tracking',
      '/api/v1/pathology-cases/{id}/technical-tracking',
    ],
    routeName: 'TechnicalTracking',
  },
  {
    component: 'BasicLayout',
    componentAliases: ['DoctorWorkflowRoot'],
    menuCodes: ['M4_WORKFLOW'],
    path: '/doctor-workflow',
    pathAliases: ['/doctor-workflow'],
    routeName: 'DoctorWorkflowRoot',
  },
  {
    component: '/modules/doctor-workflow/views/DiagnosisAssignmentView',
    componentAliases: ['DiagnosisAssignment'],
    menuCodes: ['M4_ASSIGN'],
    path: '/doctor-workflow/assignment',
    pathAliases: [
      '/doctor-workflow/assignment',
      '/api/v1/diagnostic-tasks/pending',
    ],
    routeName: 'DiagnosisAssignment',
  },
  {
    component: '/modules/doctor-workflow/views/DiagnosisWorkbenchView',
    componentAliases: ['DiagnosisWorkbench'],
    menuCodes: ['M4_WORKBENCH'],
    path: '/doctor-workflow/workbench',
    pathAliases: [
      '/doctor-workflow/workbench',
      '/api/v1/pathology-cases/{id}/diagnostic-workbench',
    ],
    routeName: 'DiagnosisWorkbench',
  },
  {
    component: '/modules/doctor-workflow/views/PathologyReportView',
    componentAliases: ['PathologyReport'],
    menuCodes: ['M4_REPORT'],
    path: '/doctor-workflow/report',
    pathAliases: ['/doctor-workflow/report', '/api/v1/pathology-reports'],
    routeName: 'PathologyReport',
  },
  {
    component: '/modules/doctor-workflow/views/ReportTrackingView',
    componentAliases: ['ReportTracking'],
    menuCodes: ['M4_TRACKING'],
    path: '/doctor-workflow/tracking',
    pathAliases: [
      '/doctor-workflow/tracking',
      '/api/v1/pathology-cases/{id}/report-tracking',
    ],
    routeName: 'ReportTracking',
  },
  {
    component: '/modules/doctor-workflow/views/ReportRevisionView',
    componentAliases: ['ReportRevision'],
    menuCodes: ['M4_REVISION'],
    path: '/doctor-workflow/revision',
    pathAliases: [
      '/doctor-workflow/revision',
      '/api/v1/report-revision-requests',
    ],
    routeName: 'ReportRevision',
  },
  {
    component: '/modules/doctor-workflow/views/ConsultationWorkstationView',
    componentAliases: ['Consultation'],
    menuCodes: ['M4_CONSULTATION'],
    path: '/doctor-workflow/consultation',
    pathAliases: ['/doctor-workflow/consultation', '/api/v1/consultations'],
    routeName: 'Consultation',
  },
  {
    component: 'BasicLayout',
    componentAliases: ['OperationSupportRoot'],
    menuCodes: ['M5_SUPPORT'],
    path: '/operation-support',
    pathAliases: ['/operation-support'],
    routeName: 'OperationSupportRoot',
  },
  {
    component: '/modules/operation-support/views/ArchiveManagementView',
    componentAliases: ['ArchiveManagement'],
    menuCodes: ['M5_ARCHIVE'],
    path: '/operation-support/archive',
    pathAliases: [
      '/operation-support/archive',
      '/api/v1/archive-records/search',
    ],
    routeName: 'ArchiveManagement',
  },
  {
    component: '/modules/operation-support/views/ReagentLedgerView',
    componentAliases: ['ReagentLedger'],
    menuCodes: ['M5_REAGENT'],
    path: '/operation-support/reagents',
    pathAliases: ['/operation-support/reagents', '/api/v1/reagents'],
    routeName: 'ReagentLedger',
  },
  {
    component: '/modules/operation-support/views/EquipmentLedgerView',
    componentAliases: ['EquipmentLedger'],
    menuCodes: ['M5_EQUIPMENT'],
    path: '/operation-support/equipment',
    pathAliases: ['/operation-support/equipment', '/api/v1/equipment-records'],
    routeName: 'EquipmentLedger',
  },
];

function findMenuDefinition(
  menu: Pick<MenuView, 'componentName' | 'menuCode' | 'path'>,
) {
  const normalizedComponentName = menu.componentName?.trim().toLowerCase();
  const normalizedMenuCode = menu.menuCode.trim().toLowerCase();
  const normalizedPath = menu.path.trim().toLowerCase();

  return BACKEND_MENU_COMPONENT_DEFINITIONS.find((definition) => {
    const matchesComponent = definition.componentAliases.some(
      (alias) => alias.toLowerCase() === normalizedComponentName,
    );
    const matchesMenuCode = definition.menuCodes?.some(
      (menuCode) => menuCode.toLowerCase() === normalizedMenuCode,
    );
    const matchesPath = definition.pathAliases?.some(
      (path) => path.toLowerCase() === normalizedPath,
    );

    return matchesComponent || matchesMenuCode || matchesPath;
  });
}

function buildMenuTree(menus: MenuView[]): MenuTreeNode[] {
  const visibleMenus: MenuTreeNode[] = menus
    .filter((menu) => menu.enabled && menu.visible)
    .map((menu): MenuTreeNode => ({
      ...menu,
      children: [],
    }));
  const menuMap = new Map<string, MenuTreeNode>(
    visibleMenus.map((menu) => [menu.id, menu]),
  );
  const roots: MenuTreeNode[] = [];

  visibleMenus.forEach((menu) => {
    if (!menu.parentId) {
      roots.push(menu);
      return;
    }

    const parent = menuMap.get(menu.parentId);
    if (parent) {
      parent.children.push(menu);
      return;
    }

    roots.push(menu);
  });

  const sortMenus = (nodes: MenuTreeNode[]) => {
    nodes.sort((left, right) => left.sortOrder - right.sortOrder);
    nodes.forEach((node) => sortMenus(node.children));
  };

  sortMenus(roots);
  return roots;
}

function convertMenuNode(
  node: MenuTreeNode,
): null | RouteRecordStringComponent<string> {
  const definition = findMenuDefinition(node);
  const children = node.children
    .map((child) => convertMenuNode(child))
    .filter(
      (child): child is RouteRecordStringComponent<string> => child !== null,
    );

  if (!definition) {
    return null;
  }

  const route: RouteRecordStringComponent<string> = {
    component: definition.component,
    meta: {
      icon: node.icon || undefined,
      order: node.sortOrder,
      title: node.menuName,
    },
    name: definition.routeName,
    path: definition.path,
  };

  if (children.length > 0) {
    route.children = children;
    route.redirect = children[0]?.path;
  }

  return route;
}

function hasUsableRoutes(routes: RouteRecordStringComponent<string>[]) {
  return routes.some((route) => {
    const isLayoutOnlyRoute =
      route.component === 'BasicLayout' && !route.children?.length;

    return !isLayoutOnlyRoute;
  });
}

export function mapMenuViewsToRoutes(
  menus: MenuView[],
): RouteRecordStringComponent<string>[] {
  return buildMenuTree(menus)
    .map((menu) => convertMenuNode(menu))
    .filter(
      (route): route is RouteRecordStringComponent<string> => route !== null,
    );
}

export async function getBackendFirstMenuRoutes(
  fetchMenuRoutes: () => Promise<RouteRecordStringComponent<string>[]>,
) {
  try {
    const backendRoutes = await fetchMenuRoutes();

    if (hasUsableRoutes(backendRoutes)) {
      return backendRoutes;
    }
  } catch {
    return STATIC_FALLBACK_MENU_ROUTES;
  }

  return STATIC_FALLBACK_MENU_ROUTES;
}
