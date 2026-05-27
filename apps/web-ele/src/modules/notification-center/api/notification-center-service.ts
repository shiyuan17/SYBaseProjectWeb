import type {
  NotificationArchiveRequest,
  NotificationListPage,
  NotificationListQuery,
  NotificationPreferencesDto,
  NotificationRecordDto,
  NotificationUnreadCountDto,
} from '../types/notification-center';

import { requestClient } from '#/api/request';

import {
  createDefaultNotificationPreferences,
  mapNotificationListPage,
} from '../utils/notification-center';

type NotificationListPageResponse = Omit<NotificationListPage, 'items'> & {
  items?: NotificationRecordDto[];
};

export async function listMyNotifications(params: NotificationListQuery) {
  const response = await requestClient.get<NotificationListPageResponse>(
    '/v1/my/notifications',
    {
      params,
    },
  );

  return mapNotificationListPage(response, params.page, params.size);
}

export async function getMyNotificationUnreadCount() {
  const response =
    await requestClient.get<NotificationUnreadCountDto>(
      '/v1/my/notifications/unread-count',
    );

  return typeof response?.unreadCount === 'number' ? response.unreadCount : 0;
}

export async function markMyNotificationRead(id: string) {
  return requestClient.request(`/v1/my/notifications/${id}/read`, {
    method: 'PATCH',
  });
}

export async function markAllMyNotificationsRead() {
  return requestClient.request('/v1/my/notifications/read-all', {
    method: 'PATCH',
  });
}

export async function archiveMyNotification(id: string) {
  return requestClient.request(`/v1/my/notifications/${id}/archive`, {
    method: 'PATCH',
  });
}

export async function archiveMyNotifications(
  data: NotificationArchiveRequest,
) {
  return requestClient.request('/v1/my/notifications/archive', {
    data,
    method: 'PATCH',
  });
}

export async function getMyNotificationPreferences() {
  const response =
    await requestClient.get<Partial<NotificationPreferencesDto>>(
      '/v1/my/notification-preferences',
    );

  return {
    ...createDefaultNotificationPreferences(),
    ...response,
  };
}

export async function updateMyNotificationPreferences(
  data: NotificationPreferencesDto,
) {
  return requestClient.put<NotificationPreferencesDto>(
    '/v1/my/notification-preferences',
    data,
  );
}
