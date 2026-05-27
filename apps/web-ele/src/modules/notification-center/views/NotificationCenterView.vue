<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  ElButton,
  ElCard,
  ElCheckbox,
  ElEmpty,
  ElInput,
  ElMessage,
  ElPagination,
  ElSegmented,
  ElSpace,
  ElTag,
} from 'element-plus';
import type { CheckboxValueType } from 'element-plus';

import { storeToRefs } from 'pinia';

import { useNotificationStore } from '../store/useNotificationStore';
import type {
  NotificationCategory,
  NotificationViewModel,
} from '../types/notification-center';
import { getNotificationPageErrorMessage } from '../utils/error';

const notificationStore = useNotificationStore();
const router = useRouter();

const { listLoading, pageItems, query, total } = storeToRefs(notificationStore);

const pageError = ref('');
const keywordInput = ref('');
const selectedIds = ref<string[]>([]);

const statusOptions = [
  { label: '全部', value: 'ALL' },
  { label: '未读', value: 'UNREAD' },
  { label: '已读', value: 'READ' },
] as const;

const categoryOptions: Array<{
  label: string;
  value: '' | NotificationCategory;
}> = [
  { label: '全部类别', value: '' },
  { label: '账户安全', value: 'ACCOUNT_PASSWORD' },
  { label: '系统消息', value: 'SYSTEM_MESSAGE' },
  { label: '待办任务', value: 'TODO_TASK' },
];

const statusSegmentOptions = computed(() => [...statusOptions]);

const hasSelection = computed(() => selectedIds.value.length > 0);

const allChecked = computed({
  get: () =>
    pageItems.value.length > 0 &&
    pageItems.value.every((item) => selectedIds.value.includes(item.id)),
  set: (checked: boolean) => {
    selectedIds.value = checked ? pageItems.value.map((item) => item.id) : [];
  },
});

function resolveStatusLabel(notification: NotificationViewModel) {
  return notification.status === 'UNREAD' ? '未读' : '已读';
}

function resolveCategoryLabel(category: NotificationCategory) {
  if (category === 'ACCOUNT_PASSWORD') {
    return '账户安全';
  }
  if (category === 'SYSTEM_MESSAGE') {
    return '系统消息';
  }
  if (category === 'TODO_TASK') {
    return '待办任务';
  }
  return '通知消息';
}

function toggleSelection(id: string, checked: CheckboxValueType) {
  const normalizedChecked = checked === true;
  if (normalizedChecked) {
    if (!selectedIds.value.includes(id)) {
      selectedIds.value = [...selectedIds.value, id];
    }
    return;
  }
  selectedIds.value = selectedIds.value.filter((value) => value !== id);
}

async function loadNotifications() {
  pageError.value = '';
  try {
    await notificationStore.loadPageNotifications();
    selectedIds.value = [];
  } catch (error) {
    pageError.value = getNotificationPageErrorMessage(error);
  }
}

async function handleSearch() {
  notificationStore.updateQueryKeyword(keywordInput.value.trim());
  notificationStore.updateQueryPage(1);
  await loadNotifications();
}

async function handleStatusChange(value: string) {
  await notificationStore.loadPageNotifications({
    page: 1,
    status: value as 'ALL' | 'READ' | 'UNREAD',
  });
  selectedIds.value = [];
}

async function handleCategoryChange(value: '' | NotificationCategory) {
  await notificationStore.loadPageNotifications({
    category: value,
    page: 1,
  });
  selectedIds.value = [];
}

async function handlePageChange(page: number) {
  notificationStore.updateQueryPage(page);
  await loadNotifications();
}

async function handleSizeChange(size: number) {
  notificationStore.updateQuerySize(size);
  notificationStore.updateQueryPage(1);
  await loadNotifications();
}

async function handleMarkRead(notification: NotificationViewModel) {
  try {
    await notificationStore.markRead(notification.id);
  } catch (error) {
    ElMessage.error(getNotificationPageErrorMessage(error));
  }
}

async function handleArchive(notification: NotificationViewModel) {
  try {
    await notificationStore.archiveOne(notification.id);
  } catch (error) {
    ElMessage.error(getNotificationPageErrorMessage(error));
  }
}

async function handleArchiveSelected() {
  try {
    await notificationStore.archiveMany(selectedIds.value);
    selectedIds.value = [];
  } catch (error) {
    ElMessage.error(getNotificationPageErrorMessage(error));
  }
}

async function handleMarkAllRead() {
  try {
    await notificationStore.markAllRead();
  } catch (error) {
    ElMessage.error(getNotificationPageErrorMessage(error));
  }
}

async function handleOpen(notification: NotificationViewModel) {
  try {
    if (notification.status === 'UNREAD') {
      await notificationStore.markRead(notification.id);
    }
    if (notification.actionLink) {
      window.open(notification.actionLink, '_blank');
      return;
    }
    if (notification.actionRoute) {
      await router.push({
        path: notification.actionRoute,
        query: notification.actionQuery,
      });
    }
  } catch (error) {
    ElMessage.error(getNotificationPageErrorMessage(error));
  }
}

onMounted(async () => {
  keywordInput.value = query.value.keyword ?? '';
  await loadNotifications();
});
</script>

<template>
  <Page title="通知中心" description="集中查看、筛选和处理个人站内通知。">
    <div class="flex flex-col gap-4">
      <ElCard shadow="never">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <ElSpace wrap>
            <ElSegmented
              :model-value="query.status"
              :options="statusSegmentOptions"
              @change="handleStatusChange"
            />
            <ElSegmented
              :model-value="query.category"
              :options="categoryOptions"
              @change="handleCategoryChange"
            />
          </ElSpace>
          <ElSpace wrap>
            <ElInput
              v-model="keywordInput"
              clearable
              placeholder="按标题或摘要搜索"
              style="width: 240px"
              @keyup.enter="handleSearch"
            />
            <ElButton @click="loadNotifications">刷新</ElButton>
            <ElButton @click="handleMarkAllRead">全部已读</ElButton>
            <ElButton :disabled="!hasSelection" type="danger" @click="handleArchiveSelected">
              归档已选
            </ElButton>
          </ElSpace>
        </div>
      </ElCard>

      <ElCard v-if="pageError" shadow="never">
        <div class="flex items-center justify-between gap-4">
          <span class="text-danger">{{ pageError }}</span>
          <ElButton @click="loadNotifications">重试</ElButton>
        </div>
      </ElCard>

      <ElCard shadow="never">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <ElCheckbox v-model="allChecked">全选当前页</ElCheckbox>
              <span class="text-sm text-muted-foreground">当前共 {{ total }} 条通知</span>
            </div>
          </div>
        </template>

        <div v-loading="listLoading" class="flex flex-col gap-4">
          <ElEmpty
            v-if="!listLoading && pageItems.length === 0"
            description="暂无通知消息"
          />

          <div
            v-for="notification in pageItems"
            :key="notification.id"
            class="rounded-2xl border border-border/60 p-4"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="flex items-start gap-3">
                <ElCheckbox
                  :model-value="selectedIds.includes(notification.id)"
                  @change="(checked) => toggleSelection(notification.id, checked)"
                />
                <img
                  :src="notification.avatar"
                  alt="notification avatar"
                  class="size-10 rounded-full object-cover"
                />
                <div class="space-y-2">
                  <div class="flex flex-wrap items-center gap-2">
                    <button
                      class="cursor-pointer text-left text-base font-semibold text-foreground"
                      type="button"
                      @click="handleOpen(notification)"
                    >
                      {{ notification.title }}
                    </button>
                    <ElTag :type="notification.status === 'UNREAD' ? 'danger' : 'info'">
                      {{ resolveStatusLabel(notification) }}
                    </ElTag>
                    <ElTag effect="plain">
                      {{ resolveCategoryLabel(notification.category) }}
                    </ElTag>
                  </div>
                  <p class="text-sm text-muted-foreground">
                    {{ notification.summary }}
                  </p>
                  <p v-if="notification.content" class="text-sm text-foreground">
                    {{ notification.content }}
                  </p>
                  <div class="text-xs text-muted-foreground">
                    {{ notification.createdAt || '-' }}
                  </div>
                </div>
              </div>

              <ElSpace>
                <ElButton
                  v-if="notification.status === 'UNREAD'"
                  link
                  type="primary"
                  @click="handleMarkRead(notification)"
                >
                  标记已读
                </ElButton>
                <ElButton link type="primary" @click="handleOpen(notification)">
                  查看
                </ElButton>
                <ElButton link type="danger" @click="handleArchive(notification)">
                  归档
                </ElButton>
              </ElSpace>
            </div>
          </div>
        </div>

        <div class="mt-6 flex justify-end">
          <ElPagination
            background
            layout="total, sizes, prev, pager, next"
            :current-page="query.page"
            :page-size="query.size"
            :page-sizes="[10, 20, 50]"
            :total="total"
            @current-change="handlePageChange"
            @size-change="handleSizeChange"
          />
        </div>
      </ElCard>
    </div>
  </Page>
</template>
