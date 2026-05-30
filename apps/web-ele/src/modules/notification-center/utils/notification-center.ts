import type {
  NotificationCategory,
  NotificationListPage,
  NotificationPopupItem,
  NotificationPreferencesDto,
  NotificationRecordDto,
  NotificationStatus,
  NotificationViewModel,
} from '../types/notification-center';

const DEFAULT_AVATAR = 'https://avatar.vercel.sh/notification.svg?text=NT';

const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  ACCOUNT_PASSWORD: '账户安全',
  SYSTEM_MESSAGE: '系统消息',
  TODO_TASK: '待办任务',
  UNKNOWN: '通知消息',
};

function normalizeCategory(value?: null | string): NotificationCategory {
  if (value === 'ACCOUNT_PASSWORD') {
    return value;
  }
  if (value === 'SYSTEM_MESSAGE') {
    return value;
  }
  if (value === 'TODO_TASK') {
    return value;
  }
  return 'UNKNOWN';
}

function normalizeStatus(value?: null | string): NotificationStatus {
  if (value === 'ARCHIVED') {
    return value;
  }
  if (value === 'READ') {
    return value;
  }
  return 'UNREAD';
}

function resolveAction(record: NotificationRecordDto) {
  const target = record.actionTarget?.trim() ?? '';
  if (!target) {
    return {
      actionLink: null,
      actionRoute: null,
    };
  }
  if (record.actionType === 'EXTERNAL_LINK') {
    return {
      actionLink: target,
      actionRoute: null,
    };
  }
  return {
    actionLink: null,
    actionRoute: target,
  };
}

function formatDisplayDate(createdAt?: null | string) {
  return createdAt?.trim() || '-';
}

export function mapNotificationRecordDto(
  record: NotificationRecordDto,
): NotificationViewModel {
  const category = normalizeCategory(record.category);
  const { actionLink, actionRoute } = resolveAction(record);

  return {
    actionLink,
    actionQuery: record.actionPayload?.query ?? {},
    actionRoute,
    actionText: record.actionText?.trim() || null,
    avatar: record.avatar?.trim() || DEFAULT_AVATAR,
    category,
    content: record.content?.trim() || '',
    createdAt: record.createdAt?.trim() || '',
    id: record.id,
    level:
      record.level === 'HIGH' || record.level === 'LOW'
        ? record.level
        : 'MEDIUM',
    readAt: record.readAt?.trim() || null,
    status: normalizeStatus(record.status),
    summary:
      record.summary?.trim() ||
      record.content?.trim() ||
      CATEGORY_LABELS[category],
    title: record.title?.trim() || CATEGORY_LABELS[category],
    topicCode: record.topicCode?.trim() || '',
  };
}

export function mapNotificationListPage(
  value:
    | null
    | undefined
    | {
        items?: NotificationRecordDto[];
        page?: number;
        size?: number;
        total?: number;
      },
  fallbackPage: number,
  fallbackSize: number,
): NotificationListPage {
  return {
    items: Array.isArray(value?.items)
      ? value.items.map((item) => mapNotificationRecordDto(item))
      : [],
    page: typeof value?.page === 'number' ? value.page : fallbackPage,
    size: typeof value?.size === 'number' ? value.size : fallbackSize,
    total: typeof value?.total === 'number' ? value.total : 0,
  };
}

export function mapNotificationToPopupItem(
  notification: NotificationViewModel,
): NotificationPopupItem {
  const link = notification.actionLink ?? notification.actionRoute ?? undefined;

  return {
    actionRoute: notification.actionRoute ?? undefined,
    avatar: notification.avatar,
    category: notification.category,
    content: notification.content,
    createdAt: notification.createdAt,
    date: formatDisplayDate(notification.createdAt),
    id: notification.id,
    isRead: notification.status !== 'UNREAD',
    level: notification.level,
    link,
    message: notification.summary,
    query: notification.actionQuery,
    readAt: notification.readAt,
    status: notification.status,
    summary: notification.summary,
    title: notification.title,
    topicCode: notification.topicCode,
  };
}

export function createDefaultNotificationPreferences(): NotificationPreferencesDto {
  return {
    accountPassword: true,
    systemMessage: true,
    todoTask: true,
  };
}
