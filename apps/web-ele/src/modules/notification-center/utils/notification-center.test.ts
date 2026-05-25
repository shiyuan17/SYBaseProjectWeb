import { describe, expect, it } from 'vitest';

import {
  createDefaultNotificationPreferences,
  mapNotificationListPage,
  mapNotificationRecordDto,
  mapNotificationToPopupItem,
} from './notification-center';

describe('notification-center mapper helpers', () => {
  it('maps dto to a stable notification view model', () => {
    expect(
      mapNotificationRecordDto({
        actionPayload: {
          query: {
            caseId: 'CASE-1',
          },
        },
        actionTarget: '/doctor-workflow/revision',
        actionText: '立即处理',
        actionType: 'INTERNAL_ROUTE',
        avatar: 'https://example.com/avatar.png',
        category: 'TODO_TASK',
        content: '报告已退回，请尽快修订',
        createdAt: '2026-05-25 10:30:00',
        id: 'NOTICE-1',
        level: 'HIGH',
        readAt: null,
        status: 'UNREAD',
        summary: '你有一条报告修订待办',
        title: '报告修订提醒',
        topicCode: 'NOTIFY_ADMIN_REPORT_REVISION',
      }),
    ).toEqual({
      actionLink: null,
      actionQuery: {
        caseId: 'CASE-1',
      },
      actionRoute: '/doctor-workflow/revision',
      actionText: '立即处理',
      avatar: 'https://example.com/avatar.png',
      category: 'TODO_TASK',
      content: '报告已退回，请尽快修订',
      createdAt: '2026-05-25 10:30:00',
      id: 'NOTICE-1',
      level: 'HIGH',
      readAt: null,
      status: 'UNREAD',
      summary: '你有一条报告修订待办',
      title: '报告修订提醒',
      topicCode: 'NOTIFY_ADMIN_REPORT_REVISION',
    });
  });

  it('falls back safely for unknown category, empty action, and missing avatar', () => {
    const mapped = mapNotificationRecordDto({
      actionTarget: '   ',
      actionType: 'EXTERNAL_LINK',
      avatar: ' ',
      category: 'SOMETHING_ELSE',
      content: '',
      createdAt: null,
      id: 'NOTICE-2',
      level: 'UNKNOWN',
      status: null,
      summary: '',
      title: '',
      topicCode: null,
    });

    expect(mapped).toEqual({
      actionLink: null,
      actionQuery: {},
      actionRoute: null,
      actionText: null,
      avatar: 'https://avatar.vercel.sh/notification.svg?text=NT',
      category: 'UNKNOWN',
      content: '',
      createdAt: '',
      id: 'NOTICE-2',
      level: 'MEDIUM',
      readAt: null,
      status: 'UNREAD',
      summary: '通知消息',
      title: '通知消息',
      topicCode: '',
    });

    expect(mapNotificationToPopupItem(mapped)).toEqual({
      actionRoute: undefined,
      avatar: 'https://avatar.vercel.sh/notification.svg?text=NT',
      category: 'UNKNOWN',
      content: '',
      createdAt: '',
      date: '-',
      id: 'NOTICE-2',
      isRead: false,
      level: 'MEDIUM',
      link: undefined,
      message: '通知消息',
      query: {},
      readAt: null,
      status: 'UNREAD',
      summary: '通知消息',
      title: '通知消息',
      topicCode: '',
    });
  });

  it('maps paged results and preferences with defaults', () => {
    expect(
      mapNotificationListPage(
        {
          items: null as never,
          page: undefined,
          size: undefined,
          total: undefined,
        },
        3,
        50,
      ),
    ).toEqual({
      items: [],
      page: 3,
      size: 50,
      total: 0,
    });

    expect(createDefaultNotificationPreferences()).toEqual({
      accountPassword: true,
      systemMessage: true,
      todoTask: true,
    });
  });
});
