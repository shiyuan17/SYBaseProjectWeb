import type { NotificationItem } from '@vben/layouts';

import type { PagedResult } from '#/modules/system-management/types/system-management';

export type NotificationCategory =
  | 'ACCOUNT_PASSWORD'
  | 'SYSTEM_MESSAGE'
  | 'TODO_TASK'
  | 'UNKNOWN';

export type NotificationLevel = 'HIGH' | 'LOW' | 'MEDIUM';

export type NotificationStatus = 'ARCHIVED' | 'READ' | 'UNREAD';

export interface NotificationActionPayload {
  query?: Record<string, string>;
}

export interface NotificationRecordDto {
  actionPayload?: NotificationActionPayload | null;
  actionTarget?: null | string;
  actionText?: null | string;
  actionType?: null | string;
  archivedAt?: null | string;
  avatar?: null | string;
  category?: null | string;
  content?: null | string;
  createdAt?: null | string;
  id: string;
  level?: null | string;
  readAt?: null | string;
  status?: null | string;
  summary?: null | string;
  title?: null | string;
  topicCode?: null | string;
}

export interface NotificationPreferencesDto {
  accountPassword: boolean;
  systemMessage: boolean;
  todoTask: boolean;
}

export interface NotificationUnreadCountDto {
  unreadCount: number;
}

export interface NotificationArchiveRequest {
  notificationIds: string[];
}

export interface NotificationListQuery {
  category?: '' | NotificationCategory;
  keyword?: string;
  page: number;
  size: number;
  status: 'ALL' | 'READ' | 'UNREAD';
}

export interface NotificationViewModel {
  actionLink: null | string;
  actionQuery: Record<string, string>;
  actionRoute: null | string;
  actionText: null | string;
  avatar: string;
  category: NotificationCategory;
  content: string;
  createdAt: string;
  id: string;
  level: NotificationLevel;
  readAt: null | string;
  status: NotificationStatus;
  summary: string;
  title: string;
  topicCode: string;
}

export interface NotificationListPage extends PagedResult<NotificationViewModel> {}

export interface NotificationPopupItem extends NotificationItem {
  actionRoute?: string | undefined;
  category?: NotificationCategory;
  content?: string;
  createdAt?: string;
  level?: NotificationLevel;
  readAt?: null | string;
  status?: NotificationStatus;
  summary?: string;
  topicCode?: string;
}
