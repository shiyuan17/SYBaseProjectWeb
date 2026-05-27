import type {
  NotificationListQuery,
  NotificationPreferencesDto,
  NotificationViewModel,
} from '../types/notification-center';

import { computed, reactive, ref } from 'vue';

import { defineStore } from 'pinia';

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
import {
  createDefaultNotificationPreferences,
  mapNotificationToPopupItem,
} from '../utils/notification-center';

const DEFAULT_QUERY: NotificationListQuery = {
  category: '',
  keyword: '',
  page: 1,
  size: 10,
  status: 'ALL',
};

export const useNotificationStore = defineStore('notification-center', () => {
  const listLoading = ref(false);
  const popupLoading = ref(false);
  const preferencesLoading = ref(false);
  const pageItems = ref<NotificationViewModel[]>([]);
  const popupItems = ref<NotificationViewModel[]>([]);
  const total = ref(0);
  const unreadCount = ref(0);
  const preferences = ref<NotificationPreferencesDto>(
    createDefaultNotificationPreferences(),
  );

  const query = reactive<NotificationListQuery>({ ...DEFAULT_QUERY });

  const popupNotifications = computed(() =>
    popupItems.value.map((item) => mapNotificationToPopupItem(item)),
  );

  const showDot = computed(() => unreadCount.value > 0);

  async function refreshUnreadCount() {
    unreadCount.value = await getMyNotificationUnreadCount();
  }

  async function loadPopupNotifications() {
    popupLoading.value = true;
    try {
      const result = await listMyNotifications({
        ...DEFAULT_QUERY,
        size: 6,
        status: 'ALL',
      });
      popupItems.value = result.items;
      unreadCount.value = result.items.filter((item) => item.status === 'UNREAD').length;
      if (result.total > result.items.length) {
        await refreshUnreadCount();
      }
    } finally {
      popupLoading.value = false;
    }
  }

  async function loadPageNotifications(overrides?: Partial<NotificationListQuery>) {
    listLoading.value = true;
    try {
      Object.assign(query, overrides ?? {});
      const result = await listMyNotifications(query);
      pageItems.value = result.items;
      total.value = result.total;
    } finally {
      listLoading.value = false;
    }
  }

  async function markRead(id: string) {
    await markMyNotificationRead(id);
    await Promise.all([loadPopupNotifications(), loadPageNotifications()]);
  }

  async function markAllRead() {
    await markAllMyNotificationsRead();
    await Promise.all([loadPopupNotifications(), loadPageNotifications()]);
  }

  async function archiveOne(id: string) {
    await archiveMyNotification(id);
    await Promise.all([loadPopupNotifications(), loadPageNotifications()]);
  }

  async function archiveMany(notificationIds: string[]) {
    if (notificationIds.length === 0) {
      return;
    }
    await archiveMyNotifications({ notificationIds });
    await Promise.all([loadPopupNotifications(), loadPageNotifications()]);
  }

  async function archivePopupItems() {
    await archiveMany(popupItems.value.map((item) => item.id));
  }

  async function loadPreferences() {
    preferencesLoading.value = true;
    try {
      preferences.value = await getMyNotificationPreferences();
    } finally {
      preferencesLoading.value = false;
    }
  }

  async function savePreferences(nextPreferences: NotificationPreferencesDto) {
    preferencesLoading.value = true;
    try {
      preferences.value = await updateMyNotificationPreferences(nextPreferences);
    } finally {
      preferencesLoading.value = false;
    }
  }

  function updateQueryKeyword(keyword: string) {
    query.keyword = keyword;
  }

  function updateQueryPage(page: number) {
    query.page = page;
  }

  function updateQuerySize(size: number) {
    query.size = size;
  }

  function resetQuery() {
    Object.assign(query, DEFAULT_QUERY);
  }

  function $reset() {
    listLoading.value = false;
    popupLoading.value = false;
    preferencesLoading.value = false;
    pageItems.value = [];
    popupItems.value = [];
    total.value = 0;
    unreadCount.value = 0;
    preferences.value = createDefaultNotificationPreferences();
    resetQuery();
  }

  return {
    $reset,
    archiveMany,
    archiveOne,
    archivePopupItems,
    listLoading,
    loadPageNotifications,
    loadPopupNotifications,
    loadPreferences,
    markAllRead,
    markRead,
    pageItems,
    popupItems,
    popupLoading,
    popupNotifications,
    preferences,
    preferencesLoading,
    query,
    refreshUnreadCount,
    resetQuery,
    savePreferences,
    showDot,
    total,
    unreadCount,
    updateQueryKeyword,
    updateQueryPage,
    updateQuerySize,
  };
});
