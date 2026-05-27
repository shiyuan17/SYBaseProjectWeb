<script setup lang="ts">
import { computed, onMounted } from 'vue';

import { ProfileNotificationSetting } from '@vben/common-ui';
import { ElMessage } from 'element-plus';

import { useNotificationStore } from '#/modules/notification-center/store/useNotificationStore';
import type { NotificationPreferencesDto } from '#/modules/notification-center/types/notification-center';
import { getNotificationPageErrorMessage } from '#/modules/notification-center/utils/error';

const notificationStore = useNotificationStore();

const formSchema = computed(() => {
  return [
    {
      value: notificationStore.preferences.accountPassword,
      fieldName: 'accountPassword',
      label: '账户密码',
      description: '账号安全与密码相关的站内通知提醒开关',
    },
    {
      value: notificationStore.preferences.systemMessage,
      fieldName: 'systemMessage',
      label: '系统消息',
      description: '系统公告、业务消息与普通站内通知提醒开关',
    },
    {
      value: notificationStore.preferences.todoTask,
      fieldName: 'todoTask',
      label: '待办任务',
      description: '需要你处理的待办任务提醒开关',
    },
  ];
});

async function handleChange(payload: Record<string, unknown>) {
  const fieldName = payload.fieldName as keyof NotificationPreferencesDto;
  const value = payload.value === true;
  try {
    await notificationStore.savePreferences({
      ...notificationStore.preferences,
      [fieldName]: value,
    });
    ElMessage.success('提醒设置已保存');
  } catch (error) {
    ElMessage.error(getNotificationPageErrorMessage(error));
  }
}

onMounted(async () => {
  if (!notificationStore.preferencesLoading) {
    await notificationStore.loadPreferences();
  }
});
</script>
<template>
  <ProfileNotificationSetting
    :form-schema="formSchema"
    @change="handleChange"
  />
</template>
