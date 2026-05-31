import type {
  DashboardNotificationItem,
  DashboardNotificationSummary,
} from '../../types/dashboard';

import type { NotificationViewModel } from '#/modules/notification-center/types/notification-center';

import {
  getMyNotificationUnreadCount,
  listMyNotifications,
} from '#/modules/notification-center/api/notification-center-service';

function mapNotificationItem(
  item: NotificationViewModel,
): DashboardNotificationItem {
  return {
    actionRoute: item.actionRoute,
    category: item.category,
    createdAt: item.createdAt,
    id: item.id,
    query: item.actionQuery,
    status: item.status,
    summary: item.summary,
    title: item.title,
    topicCode: item.topicCode,
  };
}

export async function loadNotificationSummary(): Promise<DashboardNotificationSummary> {
  const [page, unreadCount] = await Promise.all([
    listMyNotifications({
      page: 1,
      size: 5,
      status: 'ALL',
    }),
    getMyNotificationUnreadCount(),
  ]);

  return {
    items: page.items.map((item) => mapNotificationItem(item)),
    unreadCount,
  };
}
