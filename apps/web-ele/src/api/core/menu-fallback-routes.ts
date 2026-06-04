import type { RouteRecordStringComponent } from '@vben/types';

import { applyKeepAliveToTabRoutes } from '#/router/routes/keep-alive';

export const STATIC_FALLBACK_MENU_ROUTES: RouteRecordStringComponent<string>[] =
  applyKeepAliveToTabRoutes([
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
          component:
            '/modules/system-management/views/MedicalOrderPackagesView',
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
            icon: 'carbon:list-numbered',
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
        title: '临床送检',
      },
      name: 'WorkflowRoot',
      path: '/workflow',
      redirect: '/workflow/entry',
      children: [
        {
          component: '/modules/specimen-workflow/views/WorkflowEntryView',
          meta: {
            hideInBreadcrumb: true,
            hideInMenu: true,
            hideInTab: true,
            title: '工作流入口',
          },
          name: 'WorkflowEntry',
          path: '/workflow/entry',
        },
        {
          component:
            '/modules/specimen-workflow/views/SubmissionRegistrationView',
          meta: {
            icon: 'carbon:list-boxes',
            title: '申请与登记',
          },
          name: 'SubmissionRegistration',
          path: '/workflow/submission-registration',
        },
        {
          component:
            '/modules/specimen-workflow/views/ApplicationRegistrationWorkbenchView',
          meta: {
            icon: 'carbon:workspace',
            title: '申请登记工作台',
          },
          name: 'ApplicationRegistrationWorkbench',
          path: '/workflow/application-registration-workbench',
        },
        {
          component: '/modules/specimen-workflow/views/FixationTransportView',
          meta: {
            icon: 'carbon:checkmark-outline',
            title: '固定与转运',
          },
          name: 'FixationTransport',
          path: '/workflow/fixation-transport',
        },
        {
          component: '/modules/specimen-workflow/views/SpecimenReceiptView',
          meta: {
            icon: 'carbon:archive',
            title: '标本接收',
          },
          name: 'PathologyReceipt',
          path: '/workflow/pathology-receipt',
        },
        {
          component: '/modules/specimen-workflow/views/TrackingQueryView',
          meta: {
            icon: 'carbon:search',
            title: '追踪与异常',
          },
          name: 'TrackingException',
          path: '/workflow/tracking-exception',
        },
        {
          component: '/modules/specimen-workflow/views/ApplicationListView',
          redirect: '/workflow/submission-registration',
          meta: {
            hideInBreadcrumb: true,
            hideInMenu: true,
            hideInTab: true,
            title: '申请管理',
          },
          name: 'ApplicationList',
          path: '/workflow/application-list',
        },
        {
          component: '/modules/specimen-workflow/views/SpecimenManagementView',
          redirect: '/workflow/submission-registration?action=register',
          meta: {
            hideInBreadcrumb: true,
            hideInMenu: true,
            hideInTab: true,
            title: '标本管理',
          },
          name: 'SpecimenManagement',
          path: '/workflow/specimen-management',
        },
        {
          component: '/modules/specimen-workflow/views/ClinicalRegisterView',
          redirect: '/workflow/submission-registration?action=register',
          meta: {
            hideInBreadcrumb: true,
            hideInMenu: true,
            hideInTab: true,
            title: '送检登记兼容页',
          },
          name: 'ClinicalRegister',
          path: '/workflow/clinical-register',
        },
        {
          component: '/modules/specimen-workflow/views/FixationVerifyView',
          redirect: '/workflow/fixation-transport?tab=fixation',
          meta: {
            hideInBreadcrumb: true,
            hideInMenu: true,
            hideInTab: true,
            title: '固定核对',
          },
          name: 'FixationVerify',
          path: '/workflow/fixation-verify',
        },
        {
          component: '/modules/specimen-workflow/views/TransportHandoverView',
          redirect: '/workflow/fixation-transport?tab=transport',
          meta: {
            hideInBreadcrumb: true,
            hideInMenu: true,
            hideInTab: true,
            title: '转运交接',
          },
          name: 'TransportHandover',
          path: '/workflow/transport-handover',
        },
        {
          component: '/modules/specimen-workflow/views/SpecimenReceiptView',
          redirect: '/workflow/pathology-receipt',
          meta: {
            hideInBreadcrumb: true,
            hideInMenu: true,
            hideInTab: true,
            title: '标本接收',
          },
          name: 'SpecimenReceipt',
          path: '/workflow/specimen-receipt',
        },
        {
          component: '/modules/specimen-workflow/views/TrackingQueryView',
          redirect: '/workflow/tracking-exception',
          meta: {
            hideInBreadcrumb: true,
            hideInMenu: true,
            hideInTab: true,
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
        title: '制片管理',
      },
      name: 'TechnicalWorkflowRoot',
      path: '/technical-workflow',
      redirect: '/workflow/pathology-receipt',
      children: [
        {
          component: '/modules/specimen-workflow/views/SpecimenReceiptView',
          meta: {
            icon: 'carbon:archive',
            title: '标本接收',
          },
          name: 'PathologyReceipt',
          path: '/workflow/pathology-receipt',
        },
        {
          component:
            '/modules/technical-workflow/views/TechnicalSpecimenRegistrationView',
          meta: {
            icon: 'carbon:data-table',
            title: '登记接收工作站',
          },
          name: 'TechnicalSpecimenRegistration',
          path: '/technical-workflow/specimen-registration',
        },
        {
          component: '/modules/technical-workflow/views/TechnicalTasksView',
          meta: {
            hideInMenu: true,
            icon: 'carbon:task',
            title: '任务池',
          },
          name: 'TechnicalTasks',
          path: '/technical-workflow/tasks',
        },
        {
          component: '/modules/technical-workflow/views/FrozenWorkstationView',
          meta: {
            hideInMenu: true,
            icon: 'carbon:snowflake',
            title: '冰冻工作台',
          },
          name: 'FrozenWorkstation',
          path: '/technical-workflow/frozen',
        },
        {
          component:
            '/modules/technical-workflow/views/GrossingWorkstationView',
          meta: {
            icon: 'carbon:scan',
            title: '取材描写工作站',
          },
          name: 'GrossingWorkstation',
          path: '/technical-workflow/grossing',
        },
        {
          component:
            '/modules/technical-workflow/views/DehydrationWorkstationView',
          meta: {
            icon: 'carbon:data-vis-4',
            title: '脱水工作站',
          },
          name: 'DehydrationWorkstation',
          path: '/technical-workflow/dehydration',
        },
        {
          component:
            '/modules/technical-workflow/views/EmbeddingWorkstationView',
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
          component:
            '/modules/technical-workflow/views/StainingWorkstationView',
          meta: {
            icon: 'carbon:color-palette',
            title: '染色出片工作站',
          },
          name: 'StainingWorkstation',
          path: '/technical-workflow/staining',
        },
        {
          component:
            '/modules/technical-workflow/views/RoutineOrderWorkstationView',
          meta: {
            icon: 'carbon:document-tasks',
            title: '常规医嘱工作站',
          },
          name: 'RoutineOrderWorkstation',
          path: '/technical-workflow/routine-orders',
        },
        {
          component:
            '/modules/technical-workflow/views/SpecialOrderWorkstationView',
          meta: {
            icon: 'carbon:document-requirements',
            title: '特检医嘱工作站',
          },
          name: 'SpecialOrderWorkstation',
          path: '/technical-workflow/special-orders',
        },
        {
          component: '/modules/technical-workflow/views/IhcWorkstationView',
          meta: {
            icon: 'carbon:chemistry',
            title: '免疫组化工作站',
          },
          name: 'IhcWorkstation',
          path: '/technical-workflow/ihc',
        },
        {
          component:
            '/modules/technical-workflow/views/CytologyWorkstationView',
          meta: {
            icon: 'carbon:microscope',
            title: '细胞学工作站',
          },
          name: 'CytologyWorkstation',
          path: '/technical-workflow/cytology',
        },
        {
          component:
            '/modules/technical-workflow/views/LiquidCytologyWorkstationView',
          meta: {
            icon: 'lucide:droplets',
            title: '液基细胞学工作站',
          },
          name: 'LiquidCytologyWorkstation',
          path: '/technical-workflow/liquid-cytology',
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
        title: '诊断管理',
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
            title: '诊断平台工作站',
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
          component: '/modules/doctor-workflow/views/FrozenReportView',
          meta: {
            icon: 'carbon:snowflake',
            title: '冰冻快速报告',
          },
          name: 'FrozenReport',
          path: '/doctor-workflow/frozen-report',
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
          component:
            '/modules/doctor-workflow/views/ConsultationWorkstationView',
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
        title: '归档与借记',
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
          component: '/views/_core/fallback/MenuPlaceholderView',
          meta: {
            icon: 'carbon:bookmark',
            title: '借记管理',
          },
          name: 'BorrowManagement',
          path: '/operation-support/borrow',
        },
      ],
    },
    {
      component: 'BasicLayout',
      meta: {
        icon: 'carbon:tool-kit',
        order: 170,
        title: '设备及试剂管理',
      },
      name: 'OperationResourceRoot',
      path: '/operation-resources',
      redirect: '/operation-resources/equipment',
      children: [
        {
          component: '/modules/operation-support/views/EquipmentLedgerView',
          meta: {
            icon: 'carbon:tools',
            title: '仪器设备管理',
          },
          name: 'EquipmentManagement',
          path: '/operation-resources/equipment',
        },
        {
          component: '/modules/operation-support/views/ReagentLedgerView',
          meta: {
            icon: 'carbon:chemistry',
            title: '试剂耗材管理',
          },
          name: 'ReagentConsumableManagement',
          path: '/operation-resources/reagents',
        },
        {
          component: '/views/_core/fallback/MenuPlaceholderView',
          meta: {
            icon: 'carbon:warning-alt',
            title: '危化品管理',
          },
          name: 'HazardousChemicalsManagement',
          path: '/operation-resources/hazardous-chemicals',
        },
        {
          component: '/views/_core/fallback/MenuPlaceholderView',
          meta: {
            icon: 'carbon:trash-can',
            title: '医疗废物管理',
          },
          name: 'MedicalWasteManagement',
          path: '/operation-resources/medical-waste',
        },
      ],
    },
    {
      component: 'BasicLayout',
      meta: {
        icon: 'carbon:data-base',
        order: 190,
        title: '数据统计与分析',
      },
      name: 'M6Root',
      path: '/m6',
      redirect: '/m6/entry',
      children: [
        {
          component: '/modules/m6-management/views/M6EntryView',
          meta: {
            hideInBreadcrumb: true,
            hideInMenu: true,
            hideInTab: true,
            title: '数据统计入口',
          },
          name: 'M6Entry',
          path: '/m6/entry',
        },
        {
          component: '/views/_core/fallback/MenuPlaceholderView',
          meta: {
            icon: 'carbon:chart-line',
            title: '质控指标统计',
          },
          name: 'QualityIndicatorStatistics',
          path: '/m6/quality-indicators',
        },
        {
          component: '/views/_core/fallback/MenuPlaceholderView',
          meta: {
            icon: 'carbon:chart-column',
            title: '管理指标统计',
          },
          name: 'ManagementIndicatorStatistics',
          path: '/m6/management-indicators',
        },
        {
          component: '/modules/m6-statistics/views/StatisticsAnalysisView',
          meta: {
            icon: 'carbon:chart-line',
            title: '自定义统计分析',
          },
          name: 'CustomStatisticsAnalysis',
          path: '/m6/custom-analysis',
        },
      ],
    },
  ]);
