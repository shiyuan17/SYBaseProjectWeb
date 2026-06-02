import type {
  DiagnosticWorkbenchView,
  PendingDiagnosticTaskItem,
} from '../types/doctor-workflow';

import {
  formatDiagnosticTaskStatus,
  formatDiagnosticTaskType,
  formatNullable,
} from './format';

export interface DiagnosisWorkbenchQueueStats {
  acceptedCount: number;
  completedCount: number;
  currentPageCount: number;
  inProgressCount: number;
}

export interface DiagnosisWorkbenchProgressNode {
  description: string;
  id: string;
  label: string;
  state: 'active' | 'done' | 'pending' | 'warning';
}

export function resolveWorkbenchSelection(
  items: PendingDiagnosticTaskItem[],
  preferredTaskId: string,
  preferredCaseId: string,
) {
  if (items.length === 0) {
    return null;
  }

  if (preferredTaskId) {
    const matchedTask = items.find((item) => item.id === preferredTaskId);
    if (matchedTask) {
      return matchedTask;
    }
  }

  if (preferredCaseId) {
    const matchedCase = items.find((item) => item.caseId === preferredCaseId);
    if (matchedCase) {
      return matchedCase;
    }
  }

  return items[0] ?? null;
}

export function buildDiagnosisWorkbenchQueueStats(
  items: PendingDiagnosticTaskItem[],
): DiagnosisWorkbenchQueueStats {
  return {
    acceptedCount: items.filter((item) => item.taskStatus === 'ACCEPTED').length,
    completedCount: items.filter((item) => item.taskStatus === 'COMPLETED')
      .length,
    currentPageCount: items.length,
    inProgressCount: items.filter((item) => item.taskStatus === 'IN_PROGRESS')
      .length,
  };
}

export function getDiagnosisTaskStatusTagType(status?: null | string) {
  if (status === 'COMPLETED') {
    return 'success';
  }
  if (status === 'IN_PROGRESS' || status === 'ACCEPTED') {
    return 'warning';
  }
  if (status === 'ASSIGNED') {
    return 'primary';
  }
  if (status === 'CANCELLED') {
    return 'info';
  }
  return 'danger';
}

export function getDiagnosisTaskTypeTagType(taskType?: null | string) {
  if (taskType === 'PRIMARY') {
    return 'primary';
  }
  if (taskType === 'REVIEW') {
    return 'success';
  }
  if (taskType === 'FROZEN') {
    return 'warning';
  }
  return 'info';
}

export function buildDiagnosticProgressNodes(
  workbench: DiagnosticWorkbenchView | null,
  selectedTask: null | PendingDiagnosticTaskItem,
): DiagnosisWorkbenchProgressNode[] {
  if (!workbench) {
    return [];
  }

  const reportStatus = workbench.currentReport?.reportStatus ?? '';
  const pendingMedicalOrderCount = workbench.medicalOrders.filter(
    (item) => item.status === 'PENDING',
  ).length;

  return [
    {
      description: `${formatNullable(workbench.applicationNo)} / ${formatNullable(workbench.patientName)}`,
      id: 'case-context',
      label: '病例进入工作台',
      state: 'done',
    },
    {
      description: selectedTask
        ? `${formatDiagnosticTaskType(selectedTask.taskType)} · ${formatDiagnosticTaskStatus(selectedTask.taskStatus)}`
        : '当前没有可用诊断任务',
      id: 'task-status',
      label: '诊断任务流转',
      state: resolveTaskProgressState(selectedTask?.taskStatus ?? ''),
    },
    {
      description:
        workbench.currentReport?.reportId
          ? `${formatNullable(workbench.currentReport.reportNo)} · v${workbench.currentReport.versionNo ?? 1}`
          : '尚未创建报告',
      id: 'report-status',
      label: '报告编写与流转',
      state: resolveReportProgressState(reportStatus),
    },
    {
      description: buildCollaborationDescription(workbench, pendingMedicalOrderCount),
      id: 'collaboration',
      label: '协同与闭环',
      state:
        workbench.hasPendingRevision || pendingMedicalOrderCount > 0
          ? 'warning'
          : 'done',
    },
  ];
}

function resolveTaskProgressState(taskStatus: string) {
  if (taskStatus === 'COMPLETED') {
    return 'done';
  }
  if (taskStatus === 'IN_PROGRESS' || taskStatus === 'ACCEPTED') {
    return 'active';
  }
  if (taskStatus === 'ASSIGNED') {
    return 'pending';
  }
  if (taskStatus === 'CANCELLED') {
    return 'warning';
  }
  return 'pending';
}

function resolveReportProgressState(reportStatus: string) {
  if (reportStatus === 'PUBLISHED' || reportStatus === 'SIGNED') {
    return 'done';
  }
  if (reportStatus === 'SUBMITTED' || reportStatus === 'REVIEWED') {
    return 'active';
  }
  if (reportStatus === 'DRAFT') {
    return 'pending';
  }
  return 'pending';
}

function buildCollaborationDescription(
  workbench: DiagnosticWorkbenchView,
  pendingMedicalOrderCount: number,
) {
  const segments = [
    `修订 ${workbench.revisions.length}`,
    `会诊 ${workbench.consultations.length}`,
    `医嘱 ${workbench.medicalOrders.length}`,
  ];

  if (pendingMedicalOrderCount > 0) {
    segments.push(`待处理医嘱 ${pendingMedicalOrderCount}`);
  }
  if (workbench.hasPendingRevision) {
    segments.push('存在待修订');
  }

  return segments.join(' · ');
}
