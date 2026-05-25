import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createPinia, setActivePinia } from 'pinia';

import { useNotificationStore } from './useNotificationStore';

import {
  archiveMyNotification,
  archiveMyNotifications,
  getMyNotificationPreferences,
  getMyNotificationUnreadCount,
  listMyNotifications,
  markAllMyNotificationsRead,
  markMyNotificationRead,
  updateMyNotificationPreferences,
} from '../api/notification-center-service';

vi.mock('../api/notification-center-service', () => ({
  archiveMyNotification: vi.fn(),
  archiveMyNotifications: vi.fn(),
  getMyNotificationPreferences: vi.fn(),
  getMyNotificationUnreadCount: vi.fn(),
  listMyNotifications: vi.fn(),
  markAllMyNotificationsRead: vi.fn(),
  markMyNotificationRead: vi.fn(),
  updateMyNotificationPreferences: vi.fn(),
}));

const listMyNotificationsMock = vi.mocked(listMyNotifications);
const getMyNotificationUnreadCountMock = vi.mocked(getMyNotificationUnreadCount);
const markMyNotificationReadMock = vi.mocked(markMyNotificationRead);
const markAllMyNotificationsReadMock = vi.mocked(markAllMyNotificationsRead);
const archiveMyNotificationMock = vi.mocked(archiveMyNotification);
const archiveMyNotificationsMock = vi.mocked(archiveMyNotifications);
const getMyNotificationPreferencesMock = vi.mocked(getMyNotificationPreferences);
const updateMyNotificationPreferencesMock = vi.mocked(updateMyNotificationPreferences);

describe('useNotificationStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('loads popup notifications and refreshes unread count when more data exists', async () => {
    const store = useNotificationStore();

    listMyNotificationsMock.mockResolvedValue({
      items: [
        {
          actionLink: null,
          actionQuery: {},
          actionRoute: '/doctor-workflow/revision',
          actionText: '查看',
          avatar: 'https://example.com/avatar.png',
          category: 'TODO_TASK',
          content: '报告需要修订',
          createdAt: '2026-05-25 10:30:00',
          id: 'NOTICE-1',
          level: 'HIGH',
          readAt: null,
          status: 'UNREAD',
          summary: '你有一条待办',
          title: '报告修订提醒',
          topicCode: 'TOPIC-1',
        },
      ],
      page: 1,
      size: 6,
      total: 9,
    });
    getMyNotificationUnreadCountMock.mockResolvedValue(4);

    await store.loadPopupNotifications();

    expect(listMyNotificationsMock).toHaveBeenCalledWith({
      category: '',
      keyword: '',
      page: 1,
      size: 6,
      status: 'ALL',
    });
    expect(getMyNotificationUnreadCountMock).toHaveBeenCalledTimes(1);
    expect(store.popupItems).toHaveLength(1);
    expect(store.unreadCount).toBe(4);
    expect(store.showDot).toBe(true);
    expect(store.popupNotifications[0]).toEqual(
      expect.objectContaining({
        id: 'NOTICE-1',
        isRead: false,
        link: '/doctor-workflow/revision',
      }),
    );
  });

  it('loads page notifications and updates query state', async () => {
    const store = useNotificationStore();

    listMyNotificationsMock.mockResolvedValue({
      items: [],
      page: 1,
      size: 20,
      total: 0,
    });

    await store.loadPageNotifications({
      category: 'SYSTEM_MESSAGE',
      page: 1,
      size: 20,
      status: 'READ',
    });

    expect(listMyNotificationsMock).toHaveBeenCalledWith({
      category: 'SYSTEM_MESSAGE',
      keyword: '',
      page: 1,
      size: 20,
      status: 'READ',
    });
    expect(store.query.category).toBe('SYSTEM_MESSAGE');
    expect(store.query.status).toBe('READ');
    expect(store.total).toBe(0);
  });

  it('refreshes popup/page data after read and archive actions', async () => {
    const store = useNotificationStore();

    listMyNotificationsMock
      .mockResolvedValue({
        items: [],
        page: 1,
        size: 6,
        total: 0,
      })
      .mockResolvedValue({
        items: [],
        page: 1,
        size: 10,
        total: 0,
      })
      .mockResolvedValue({
        items: [],
        page: 1,
        size: 6,
        total: 0,
      })
      .mockResolvedValue({
        items: [],
        page: 1,
        size: 10,
        total: 0,
      })
      .mockResolvedValue({
        items: [],
        page: 1,
        size: 6,
        total: 0,
      })
      .mockResolvedValue({
        items: [],
        page: 1,
        size: 10,
        total: 0,
      });

    await store.markRead('NOTICE-1');
    await store.markAllRead();
    await store.archiveOne('NOTICE-1');

    expect(markMyNotificationReadMock).toHaveBeenCalledWith('NOTICE-1');
    expect(markAllMyNotificationsReadMock).toHaveBeenCalledTimes(1);
    expect(archiveMyNotificationMock).toHaveBeenCalledWith('NOTICE-1');
    expect(listMyNotificationsMock).toHaveBeenCalledTimes(6);
  });

  it('archives selected and popup notifications safely', async () => {
    const store = useNotificationStore();

    store.popupItems = [
      {
        actionLink: null,
        actionQuery: {},
        actionRoute: null,
        actionText: null,
        avatar: 'https://example.com/avatar.png',
        category: 'SYSTEM_MESSAGE',
        content: '',
        createdAt: '2026-05-25 10:30:00',
        id: 'NOTICE-1',
        level: 'MEDIUM',
        readAt: null,
        status: 'UNREAD',
        summary: '系统消息',
        title: '系统消息',
        topicCode: 'TOPIC-1',
      },
      {
        actionLink: null,
        actionQuery: {},
        actionRoute: null,
        actionText: null,
        avatar: 'https://example.com/avatar.png',
        category: 'TODO_TASK',
        content: '',
        createdAt: '2026-05-25 10:31:00',
        id: 'NOTICE-2',
        level: 'MEDIUM',
        readAt: null,
        status: 'READ',
        summary: '待办消息',
        title: '待办消息',
        topicCode: 'TOPIC-2',
      },
    ];

    listMyNotificationsMock.mockResolvedValue({
      items: [],
      page: 1,
      size: 6,
      total: 0,
    });

    await store.archiveMany([]);
    await store.archivePopupItems();

    expect(archiveMyNotificationsMock).toHaveBeenCalledTimes(1);
    expect(archiveMyNotificationsMock).toHaveBeenCalledWith({
      notificationIds: ['NOTICE-1', 'NOTICE-2'],
    });
  });

  it('loads and saves notification preferences', async () => {
    const store = useNotificationStore();

    getMyNotificationPreferencesMock.mockResolvedValue({
      accountPassword: false,
      systemMessage: true,
      todoTask: false,
    });
    updateMyNotificationPreferencesMock.mockResolvedValue({
      accountPassword: true,
      systemMessage: false,
      todoTask: true,
    });

    await store.loadPreferences();
    expect(store.preferences).toEqual({
      accountPassword: false,
      systemMessage: true,
      todoTask: false,
    });

    await store.savePreferences({
      accountPassword: true,
      systemMessage: false,
      todoTask: true,
    });

    expect(updateMyNotificationPreferencesMock).toHaveBeenCalledWith({
      accountPassword: true,
      systemMessage: false,
      todoTask: true,
    });
    expect(store.preferences).toEqual({
      accountPassword: true,
      systemMessage: false,
      todoTask: true,
    });
  });
});
