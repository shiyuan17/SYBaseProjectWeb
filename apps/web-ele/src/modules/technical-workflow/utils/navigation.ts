import type { Router } from 'vue-router';

import type {
  PendingTechnicalTaskItem,
  TechnicalWorkflowAlertAction,
  TechnicalWorkflowDeepLinkQuery,
  TechnicalWorkflowTaskType,
} from '../types/technical-workflow';

import {
  TASK_TYPE_ROUTE_MAP,
  TECHNICAL_WORKFLOW_ROUTE_META,
} from '../constants';

function normalizeQueryValue(value?: null | string) {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function buildQuery(query?: TechnicalWorkflowDeepLinkQuery) {
  if (!query) {
    return undefined;
  }

  return {
    caseId: normalizeQueryValue(query.caseId),
    mode: normalizeQueryValue(query.mode),
    objectId: normalizeQueryValue(query.objectId),
    objectType: normalizeQueryValue(query.objectType),
    pathologyNo: normalizeQueryValue(query.pathologyNo),
    tab: normalizeQueryValue(query.tab),
    taskId: normalizeQueryValue(query.taskId),
  };
}

export function buildTaskDeepLinkQuery(
  task: PendingTechnicalTaskItem,
  mode?: TechnicalWorkflowDeepLinkQuery['mode'],
): TechnicalWorkflowDeepLinkQuery {
  return {
    caseId: task.caseId,
    mode,
    objectId: task.objectId ?? undefined,
    objectType: task.objectType ?? undefined,
    pathologyNo: task.pathologyNo ?? undefined,
    taskId: task.id,
  };
}

export function resolveTaskTypePath(taskType?: null | string) {
  if (!taskType) {
    return '';
  }
  return TASK_TYPE_ROUTE_MAP[taskType as TechnicalWorkflowTaskType] ?? '';
}

export function useTechnicalWorkflowNavigation(router: Router) {
  function pushToPath(path: string, query?: TechnicalWorkflowDeepLinkQuery) {
    if (!path) {
      return Promise.resolve();
    }
    return router.push({
      path,
      query: buildQuery(query),
    });
  }

  function goToTaskType(
    taskType: TechnicalWorkflowTaskType,
    query?: TechnicalWorkflowDeepLinkQuery,
  ) {
    const path = resolveTaskTypePath(taskType);
    return pushToPath(path, query);
  }

  function goToTask(
    task: PendingTechnicalTaskItem,
    mode?: TechnicalWorkflowDeepLinkQuery['mode'],
  ) {
    const path = resolveTaskTypePath(task.taskType);
    return pushToPath(path, buildTaskDeepLinkQuery(task, mode));
  }

  function goToTracking(query?: TechnicalWorkflowDeepLinkQuery) {
    return pushToPath(TECHNICAL_WORKFLOW_ROUTE_META.TRACKING.path, query);
  }

  function goToRework(query?: TechnicalWorkflowDeepLinkQuery) {
    return pushToPath(TECHNICAL_WORKFLOW_ROUTE_META.REWORK.path, query);
  }

  function goToEntry(query?: TechnicalWorkflowDeepLinkQuery) {
    return pushToPath(TECHNICAL_WORKFLOW_ROUTE_META.ENTRY.path, query);
  }

  function goToTasks(query?: TechnicalWorkflowDeepLinkQuery) {
    return pushToPath(TECHNICAL_WORKFLOW_ROUTE_META.TASKS.path, query);
  }

  function goToFrozen(query?: TechnicalWorkflowDeepLinkQuery) {
    return pushToPath(TECHNICAL_WORKFLOW_ROUTE_META.FROZEN.path, query);
  }

  function goToAlertAction(action?: TechnicalWorkflowAlertAction) {
    if (!action) {
      return Promise.resolve();
    }
    if (action.target.routeType === 'TRACKING') {
      return goToTracking(action.query);
    }
    if (action.target.routeType === 'REWORK') {
      return goToRework(action.query);
    }
    return goToTaskType(action.target.taskType, action.query);
  }

  return {
    goToAlertAction,
    goToEntry,
    goToFrozen,
    goToPath: pushToPath,
    goToRework,
    goToTask,
    goToTaskType,
    goToTasks,
    goToTracking,
  };
}
