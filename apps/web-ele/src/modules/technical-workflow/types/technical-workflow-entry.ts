import type {
  PendingTechnicalTaskItem,
  WorkstationSummaryBucket,
} from './technical-workflow';

export interface WorkflowOverviewCard {
  description: string;
  title: string;
}

export interface WorkflowMapCard {
  items: string[];
  title: string;
}

export interface WorkflowChainStep {
  actionLabel: string;
  description: string;
  helperText: string;
  routePath?: string;
  title: string;
}

export interface WorkflowRiskCard {
  level: 'danger' | 'primary' | 'success' | 'warning';
  title: string;
  value: string;
}

export interface TechnicalWorkflowEntryViewState {
  abnormalItems: PendingTechnicalTaskItem[];
  accessibleBuckets: WorkstationSummaryBucket[];
  canAccessAnyM3: boolean;
  canAccessFrozen: boolean;
  canAccessReceipt: boolean;
  canAccessRework: boolean;
  canAccessSpecimenRegistration: boolean;
  canAccessTracking: boolean;
  canAccessWorkflowEntry: boolean;
  currentWorkingBucket: null | WorkstationSummaryBucket;
  frozenReminder: PendingTechnicalTaskItem[];
  loading: boolean;
  pageError: string;
  pendingSpecimenRegistrationCount: number;
  regularBuckets: WorkstationSummaryBucket[];
  riskCards: WorkflowRiskCard[];
  workflowLead: string;
}
