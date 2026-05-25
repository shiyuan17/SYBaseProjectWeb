import type { Mock } from 'vitest';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requestClient } from '#/api/request';

import {
  archiveMyNotification,
  archiveMyNotifications,
  getMyNotificationPreferences,
  getMyNotificationUnreadCount,
  listMyNotifications,
  markAllMyNotificationsRead,
  markMyNotificationRead,
  updateMyNotificationPreferences,
} from './notification-center-service';

vi.mock('#/api/request', () => ({
  requestClient: {
    get: vi.fn(),
    put: vi.fn(),
    request: vi.fn(),
  },
}));

type RequestClientMock = {
  get: Mock;
  put: Mock;
  request: Mock;
};

const requestClientMock = requestClient as unknown as RequestClientMock;

beforeEach(() => {
  requestClientMock.get.mockReset();
  requestClientMock.put.mockReset();
  requestClientMock.request.mockReset();
});

describe('notification-center-service', () => {
  it('loads notifications with stable pagination defaults', async () => {
    requestClientMock.get.mockResolvedValue({
      items: [
        {
          category: 'SYSTEM_MESSAGE',
          id: 'NOTICE-1',
          status: 'UNREAD',
          summary: '需要关注的系统公告',
          title: '系统公告',
        },
      ],
      page: 2,
      size: 20,
      total: 31,
    });

    await expect(
      listMyNotifications({
        category: '',
        keyword: '系统',
        page: 1,
        size: 10,
        status: 'ALL',
      }),
    ).resolves.toEqual({
      items: [
        expect.objectContaining({
          category: 'SYSTEM_MESSAGE',
          id: 'NOTICE-1',
          status: 'UNREAD',
          summary: '需要关注的系统公告',
          title: '系统公告',
        }),
      ],
      page: 2,
      size: 20,
      total: 31,
    });

    expect(requestClientMock.get).toHaveBeenCalledWith('/v1/my/notifications', {
      params: {
        category: '',
        keyword: '系统',
        page: 1,
        size: 10,
        status: 'ALL',
      },
    });
  });

  it('normalizes unread count and preferences defaults', async () => {
    requestClientMock.get
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        systemMessage: false,
      });

    await expect(getMyNotificationUnreadCount()).resolves.toBe(0);
    await expect(getMyNotificationPreferences()).resolves.toEqual({
      accountPassword: true,
      systemMessage: false,
      todoTask: true,
    });

    expect(requestClientMock.get).toHaveBeenNthCalledWith(
      1,
      '/v1/my/notifications/unread-count',
    );
    expect(requestClientMock.get).toHaveBeenNthCalledWith(
      2,
      '/v1/my/notification-preferences',
    );
  });

  it('submits read, archive, and preference update requests', async () => {
    const preferences = {
      accountPassword: false,
      systemMessage: true,
      todoTask: false,
    };

    requestClientMock.put.mockResolvedValue(preferences);

    await markMyNotificationRead('NOTICE-1');
    await markAllMyNotificationsRead();
    await archiveMyNotification('NOTICE-1');
    await archiveMyNotifications({ notificationIds: ['NOTICE-1', 'NOTICE-2'] });
    await expect(updateMyNotificationPreferences(preferences)).resolves.toEqual(
      preferences,
    );

    expect(requestClientMock.request).toHaveBeenNthCalledWith(
      1,
      '/v1/my/notifications/NOTICE-1/read',
      {
        method: 'PATCH',
      },
    );
    expect(requestClientMock.request).toHaveBeenNthCalledWith(
      2,
      '/v1/my/notifications/read-all',
      {
        method: 'PATCH',
      },
    );
    expect(requestClientMock.request).toHaveBeenNthCalledWith(
      3,
      '/v1/my/notifications/NOTICE-1/archive',
      {
        method: 'PATCH',
      },
    );
    expect(requestClientMock.request).toHaveBeenNthCalledWith(
      4,
      '/v1/my/notifications/archive',
      {
        data: {
          notificationIds: ['NOTICE-1', 'NOTICE-2'],
        },
        method: 'PATCH',
      },
    );
    expect(requestClientMock.put).toHaveBeenCalledWith(
      '/v1/my/notification-preferences',
      preferences,
    );
  });
});
