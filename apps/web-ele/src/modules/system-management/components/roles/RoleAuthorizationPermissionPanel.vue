<script setup lang="ts">
import { ElCheckbox, ElCheckboxGroup, ElEmpty } from 'element-plus';

defineProps<{
  authState: {
    permissionIds: string[];
  };
  permissionGroups: Array<{
    entryPermissions: Array<{ id: string; permissionCode: string; permissionName: string }>;
    manualPermissions: Array<{ id: string; permissionCode: string; permissionName: string }>;
    menu: { id: string; menuCode: string; menuName: string };
  }>;
}>();
</script>

<template>
  <div class="flex flex-col gap-4">
    <ElEmpty
      v-if="permissionGroups.length === 0"
      description="请先勾选页面入口菜单后，再配置页面内操作权限"
    />
    <ElCheckboxGroup v-else v-model="authState.permissionIds" class="grid gap-4">
      <div
        v-for="group in permissionGroups"
        :key="group.menu.id"
        class="rounded-2xl border border-border/60 bg-background p-4"
      >
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div class="space-y-1">
            <div class="font-medium text-foreground">
              {{ group.menu.menuName }}
            </div>
            <div class="text-xs text-muted-foreground">
              {{ group.menu.menuCode }}
            </div>
          </div>
          <div
            class="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
          >
            附加权限 {{ group.manualPermissions.length }}
          </div>
        </div>

        <div
          v-if="group.entryPermissions.length > 0"
          class="mt-4 rounded-xl border border-emerald-200/80 bg-emerald-50/80 p-3"
        >
          <div class="text-xs font-medium text-emerald-800">
            自动生效的基础访问权限
          </div>
          <div class="mt-3 grid gap-2 lg:grid-cols-2">
            <div
              v-for="permission in group.entryPermissions"
              :key="permission.id"
              class="rounded-xl bg-white/90 px-3 py-3 ring-1 ring-emerald-200/70"
            >
              <div class="font-medium text-foreground">
                {{ permission.permissionName }}
              </div>
              <div class="mt-1 text-xs text-muted-foreground">
                {{ permission.permissionCode }}
              </div>
            </div>
          </div>
        </div>

        <div class="mt-4">
          <div class="text-xs font-medium text-foreground">可配置的附加权限</div>
          <div
            v-if="group.manualPermissions.length === 0"
            class="mt-3 rounded-xl border border-dashed border-border/60 px-4 py-6 text-sm text-muted-foreground"
          >
            该页面当前没有可单独配置的附加权限。
          </div>
          <div v-else class="mt-3 grid gap-3 lg:grid-cols-2">
            <ElCheckbox
              v-for="permission in group.manualPermissions"
              :key="permission.id"
              :label="permission.id"
              border
              class="!mx-0 !h-auto !items-start rounded-xl !px-4 !py-3"
            >
              <div class="flex flex-col gap-1 leading-5">
                <span class="font-medium text-foreground">
                  {{ permission.permissionName }}
                </span>
                <span class="text-xs text-muted-foreground">
                  {{ permission.permissionCode }}
                </span>
              </div>
            </ElCheckbox>
          </div>
        </div>
      </div>
    </ElCheckboxGroup>
  </div>
</template>
