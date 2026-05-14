<template>
  <div class="space-y-6">
    <BasePageHeader
      description="示例模块用于验证模块内 API、store、页面、空态和错误态的完整组织方式。"
      eyebrow="User Management"
      title="用户列表"
    >
      <template #actions>
        <div class="rounded-full bg-brand-muted px-4 py-2 text-sm font-medium text-brand-strong">
          当前共 {{ userListStore.total }} 条用户记录
        </div>
      </template>
    </BasePageHeader>

    <BasePageSection
      description="筛选条件通过模块 store 同步到列表请求，支持分页、重置和错误重试。"
      title="筛选条件"
    >
      <div class="grid gap-4 xl:grid-cols-[1.6fr_1fr_auto]">
        <el-input
          v-model="filters.keyword"
          clearable
          placeholder="输入用户名、邮箱或姓名；输入 empty 查看空态，输入 error 触发错误态"
        />
        <el-select
          v-model="filters.status"
          placeholder="选择状态"
        >
          <el-option
            label="全部状态"
            value="all"
          />
          <el-option
            label="启用"
            value="active"
          />
          <el-option
            label="禁用"
            value="disabled"
          />
        </el-select>
        <div class="flex gap-3">
          <el-button
            :loading="userListStore.isLoading"
            type="primary"
            @click="handleSearch"
          >
            查询
          </el-button>
          <el-button
            plain
            @click="handleReset"
          >
            重置
          </el-button>
        </div>
      </div>
    </BasePageSection>

    <BasePageSection
      description="列表区同时覆盖 loading、empty、error、success 四种常见页面状态。"
      title="用户结果"
    >
      <StatusPanel
        v-if="userListStore.isLoading"
        description="MSW 正在模拟远端接口返回，本状态用于验证占位反馈与重复请求防抖。"
        state="loading"
        title="正在加载用户列表"
      />

      <StatusPanel
        v-else-if="userListStore.errorMessage"
        :description="userListStore.errorMessage"
        state="error"
        title="用户列表加载失败"
      >
        <template #actions>
          <el-button
            type="danger"
            @click="userListStore.retry"
          >
            重试
          </el-button>
        </template>
      </StatusPanel>

      <StatusPanel
        v-else-if="userListStore.isEmpty"
        description="当前筛选条件下没有匹配结果，可以重置条件后再次查询。"
        state="empty"
        title="暂无用户数据"
      >
        <template #actions>
          <el-button
            plain
            @click="handleReset"
          >
            清空筛选
          </el-button>
        </template>
      </StatusPanel>

      <div
        v-else
        class="space-y-5"
      >
        <el-table
          :data="userListStore.items"
          border
          stripe
        >
          <el-table-column
            label="用户名"
            min-width="180"
            prop="username"
          />
          <el-table-column
            label="姓名"
            min-width="180"
            prop="displayName"
          />
          <el-table-column
            label="邮箱"
            min-width="220"
            prop="email"
          />
          <el-table-column
            label="状态"
            min-width="120"
          >
            <template #default="{ row }">
              <el-tag :type="row.status === 'active' ? 'success' : 'info'">
                {{ row.statusLabel }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            label="创建时间"
            min-width="200"
            prop="createdAtLabel"
          />
        </el-table>

        <div class="flex justify-end">
          <el-pagination
            :current-page="userListStore.page"
            :page-size="userListStore.size"
            :page-sizes="[5, 10, 20]"
            :total="userListStore.total"
            background
            layout="total, sizes, prev, pager, next"
            @current-change="userListStore.changePage"
            @size-change="userListStore.changePageSize"
          />
        </div>
      </div>
    </BasePageSection>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted } from 'vue'

import BasePageHeader from '@/shared/components/BasePageHeader.vue'
import BasePageSection from '@/shared/components/BasePageSection.vue'
import StatusPanel from '@/shared/components/StatusPanel.vue'

import { useUserListStore } from '../store/useUserListStore'

const userListStore = useUserListStore()

const filters = reactive({
  keyword: userListStore.filters.keyword,
  status: userListStore.filters.status
})

async function handleSearch() {
  await userListStore.applyFilters({
    keyword: filters.keyword,
    status: filters.status
  })
}

async function handleReset() {
  filters.keyword = ''
  filters.status = 'all'
  await userListStore.resetFilters()
}

onMounted(async () => {
  if (!userListStore.isInitialized) {
    await handleSearch()
  }
})
</script>

