<script setup lang="ts">
import type { OperationLog } from '../types/system-management';

import { Page } from '@vben/common-ui';

import {
  ElAlert,
  ElButton,
  ElDatePicker,
  ElDescriptions,
  ElDescriptionsItem,
  ElDrawer,
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElPagination,
  ElSelect,
  ElSkeleton,
  ElTable,
  ElTableColumn,
  ElTabPane,
  ElTabs,
  ElTag,
} from 'element-plus';

import SystemSectionCard from '../components/SystemSectionCard.vue';
import { useLogManagementPage } from '../composables/useLogManagementPage';
import { formatDateTime, formatNullable } from '../utils/format';

const {
  LOG_RESULT_OPTIONS,
  OPERATION_MODULE_OPTIONS,
  activeTab,
  detailDrawerType,
  detailDrawerVisible,
  detailError,
  detailLoading,
  handleLoginPageChange,
  handleLoginSizeChange,
  handleOperationPageChange,
  handleOperationSizeChange,
  handleTabChange,
  loginDetail,
  loginError,
  loginFilters,
  loginLoading,
  loginLogs,
  loginPagination,
  loginTimeRange,
  openLoginDetail,
  openOperationDetail,
  operationDetail,
  operationError,
  operationFilters,
  operationLoading,
  operationLogs,
  operationPagination,
  operationTimeRange,
  resetLoginFilters,
  resetOperationFilters,
  searchLoginLogs,
  searchOperationLogs,
} = useLogManagementPage();

function formatResultLabel(value: null | string | undefined) {
  if (value === 'SUCCESS') {
    return '成功';
  }
  if (value === 'FAILED') {
    return '失败';
  }
  return formatNullable(value);
}

function formatResultType(value: null | string | undefined) {
  if (value === 'SUCCESS') {
    return 'success';
  }
  if (value === 'FAILED') {
    return 'danger';
  }
  return 'info';
}

function formatModuleLabel(value: null | string | undefined) {
  return (
    OPERATION_MODULE_OPTIONS.find((option) => option.value === value)?.label ??
    formatNullable(value)
  );
}

function formatOperationTitle(row: OperationLog) {
  return `${formatModuleLabel(row.moduleCode)} / ${formatNullable(
    row.operationName,
  )}`;
}
</script>

<template>
  <Page
    :show-header="false"
    title="日志管理"
    description="集中查询登录日志与操作日志，支持筛选、分页和脱敏详情查看。"
  >
    <div class="flex flex-col gap-4">
      <SystemSectionCard
        title="日志管理"
        description="登录日志用于追踪账号访问，操作日志用于追踪写操作与敏感查询。"
      >
        <ElTabs v-model="activeTab" @tab-change="handleTabChange">
          <ElTabPane label="登录日志" name="login">
            <div class="flex flex-col gap-4">
              <ElForm
                :model="loginFilters"
                class="grid gap-x-4 gap-y-2 lg:grid-cols-4"
                label-position="top"
                @submit.prevent
              >
                <ElFormItem label="登录名">
                  <ElInput
                    v-model="loginFilters.loginName"
                    clearable
                    placeholder="请输入登录名"
                    @keyup.enter="searchLoginLogs"
                  />
                </ElFormItem>
                <ElFormItem label="用户 ID">
                  <ElInput
                    v-model="loginFilters.userId"
                    clearable
                    placeholder="请输入用户 ID"
                    @keyup.enter="searchLoginLogs"
                  />
                </ElFormItem>
                <ElFormItem label="结果">
                  <ElSelect
                    v-model="loginFilters.result"
                    clearable
                    placeholder="全部结果"
                  >
                    <ElOption
                      v-for="option in LOG_RESULT_OPTIONS"
                      :key="option.value"
                      :label="option.label"
                      :value="option.value"
                    />
                  </ElSelect>
                </ElFormItem>
                <ElFormItem label="IP">
                  <ElInput
                    v-model="loginFilters.ip"
                    clearable
                    placeholder="请输入 IP"
                    @keyup.enter="searchLoginLogs"
                  />
                </ElFormItem>
                <ElFormItem label="客户端">
                  <ElInput
                    v-model="loginFilters.clientDevice"
                    clearable
                    placeholder="浏览器 / 设备"
                    @keyup.enter="searchLoginLogs"
                  />
                </ElFormItem>
                <ElFormItem label="关键字">
                  <ElInput
                    v-model="loginFilters.keyword"
                    clearable
                    placeholder="失败原因、备注等"
                    @keyup.enter="searchLoginLogs"
                  />
                </ElFormItem>
                <ElFormItem class="lg:col-span-2" label="登录时间">
                  <ElDatePicker
                    v-model="loginTimeRange"
                    end-placeholder="结束时间"
                    range-separator="至"
                    start-placeholder="开始时间"
                    type="datetimerange"
                    value-format="YYYY-MM-DDTHH:mm:ss"
                  />
                </ElFormItem>
              </ElForm>
              <div class="flex justify-end gap-2">
                <ElButton @click="resetLoginFilters">重置</ElButton>
                <ElButton type="primary" @click="searchLoginLogs">
                  查询
                </ElButton>
              </div>

              <ElAlert
                v-if="loginError"
                :title="loginError"
                show-icon
                type="error"
                @close="loginError = ''"
              />

              <ElTable
                v-loading="loginLoading"
                :data="loginLogs"
                border
                empty-text="暂无登录日志"
              >
                <ElTableColumn label="登录时间" min-width="170">
                  <template #default="scope">
                    {{ formatDateTime(scope?.row?.loginAt) }}
                  </template>
                </ElTableColumn>
                <ElTableColumn
                  label="登录名"
                  min-width="140"
                  prop="loginName"
                />
                <ElTableColumn label="用户 ID" min-width="180">
                  <template #default="scope">
                    {{ formatNullable(scope?.row?.userId) }}
                  </template>
                </ElTableColumn>
                <ElTableColumn label="结果" width="100">
                  <template #default="scope">
                    <ElTag :type="formatResultType(scope?.row?.loginResult)">
                      {{ formatResultLabel(scope?.row?.loginResult) }}
                    </ElTag>
                  </template>
                </ElTableColumn>
                <ElTableColumn label="IP" min-width="130">
                  <template #default="scope">
                    {{ formatNullable(scope?.row?.clientIp) }}
                  </template>
                </ElTableColumn>
                <ElTableColumn label="客户端" min-width="160">
                  <template #default="scope">
                    {{ formatNullable(scope?.row?.clientDevice) }}
                  </template>
                </ElTableColumn>
                <ElTableColumn label="失败原因" min-width="220">
                  <template #default="scope">
                    {{ formatNullable(scope?.row?.failureReason) }}
                  </template>
                </ElTableColumn>
                <ElTableColumn fixed="right" label="操作" width="100">
                  <template #default="scope">
                    <ElButton
                      link
                      type="primary"
                      @click="openLoginDetail(scope.row)"
                    >
                      详情
                    </ElButton>
                  </template>
                </ElTableColumn>
              </ElTable>

              <div class="flex justify-end">
                <ElPagination
                  :current-page="loginPagination.page"
                  :page-size="loginPagination.size"
                  :page-sizes="[10, 20, 50, 100]"
                  :total="loginPagination.total"
                  background
                  layout="total, sizes, prev, pager, next, jumper"
                  @current-change="handleLoginPageChange"
                  @size-change="handleLoginSizeChange"
                />
              </div>
            </div>
          </ElTabPane>

          <ElTabPane label="操作日志" name="operation">
            <div class="flex flex-col gap-4">
              <ElForm
                :model="operationFilters"
                class="grid gap-x-4 gap-y-2 lg:grid-cols-4"
                label-position="top"
                @submit.prevent
              >
                <ElFormItem label="操作人">
                  <ElInput
                    v-model="operationFilters.operatorKeyword"
                    clearable
                    placeholder="姓名 / 用户 ID"
                    @keyup.enter="searchOperationLogs"
                  />
                </ElFormItem>
                <ElFormItem label="模块">
                  <ElSelect
                    v-model="operationFilters.moduleCode"
                    clearable
                    placeholder="全部模块"
                  >
                    <ElOption
                      v-for="option in OPERATION_MODULE_OPTIONS"
                      :key="option.value"
                      :label="option.label"
                      :value="option.value"
                    />
                  </ElSelect>
                </ElFormItem>
                <ElFormItem label="业务类型">
                  <ElInput
                    v-model="operationFilters.businessType"
                    clearable
                    placeholder="如 APPLICATION"
                    @keyup.enter="searchOperationLogs"
                  />
                </ElFormItem>
                <ElFormItem label="业务 ID">
                  <ElInput
                    v-model="operationFilters.businessId"
                    clearable
                    placeholder="请输入业务 ID"
                    @keyup.enter="searchOperationLogs"
                  />
                </ElFormItem>
                <ElFormItem label="操作名称">
                  <ElInput
                    v-model="operationFilters.operationName"
                    clearable
                    placeholder="如 create_user"
                    @keyup.enter="searchOperationLogs"
                  />
                </ElFormItem>
                <ElFormItem label="结果">
                  <ElSelect
                    v-model="operationFilters.result"
                    clearable
                    placeholder="全部结果"
                  >
                    <ElOption
                      v-for="option in LOG_RESULT_OPTIONS"
                      :key="option.value"
                      :label="option.label"
                      :value="option.value"
                    />
                  </ElSelect>
                </ElFormItem>
                <ElFormItem label="IP">
                  <ElInput
                    v-model="operationFilters.ip"
                    clearable
                    placeholder="请输入 IP"
                    @keyup.enter="searchOperationLogs"
                  />
                </ElFormItem>
                <ElFormItem label="关键字">
                  <ElInput
                    v-model="operationFilters.keyword"
                    clearable
                    placeholder="模块、业务、失败原因"
                    @keyup.enter="searchOperationLogs"
                  />
                </ElFormItem>
                <ElFormItem label="内容关键字">
                  <ElInput
                    v-model="operationFilters.contentKeyword"
                    clearable
                    placeholder="仅用于服务端筛选"
                    @keyup.enter="searchOperationLogs"
                  />
                </ElFormItem>
                <ElFormItem class="lg:col-span-3" label="操作时间">
                  <ElDatePicker
                    v-model="operationTimeRange"
                    end-placeholder="结束时间"
                    range-separator="至"
                    start-placeholder="开始时间"
                    type="datetimerange"
                    value-format="YYYY-MM-DDTHH:mm:ss"
                  />
                </ElFormItem>
              </ElForm>
              <div class="flex justify-end gap-2">
                <ElButton @click="resetOperationFilters">重置</ElButton>
                <ElButton type="primary" @click="searchOperationLogs">
                  查询
                </ElButton>
              </div>

              <ElAlert
                v-if="operationError"
                :title="operationError"
                show-icon
                type="error"
                @close="operationError = ''"
              />

              <ElTable
                v-loading="operationLoading"
                :data="operationLogs"
                border
                empty-text="暂无操作日志"
              >
                <ElTableColumn label="操作时间" min-width="170">
                  <template #default="scope">
                    {{ formatDateTime(scope?.row?.operationAt) }}
                  </template>
                </ElTableColumn>
                <ElTableColumn label="模块" min-width="120">
                  <template #default="scope">
                    {{ formatModuleLabel(scope?.row?.moduleCode) }}
                  </template>
                </ElTableColumn>
                <ElTableColumn label="操作名称" min-width="180">
                  <template #default="scope">
                    {{ formatNullable(scope?.row?.operationName) }}
                  </template>
                </ElTableColumn>
                <ElTableColumn label="业务类型" min-width="140">
                  <template #default="scope">
                    {{ formatNullable(scope?.row?.businessType) }}
                  </template>
                </ElTableColumn>
                <ElTableColumn label="业务 ID" min-width="160">
                  <template #default="scope">
                    {{ formatNullable(scope?.row?.businessId) }}
                  </template>
                </ElTableColumn>
                <ElTableColumn label="操作人" min-width="150">
                  <template #default="scope">
                    {{ formatNullable(scope?.row?.operatorName) }}
                  </template>
                </ElTableColumn>
                <ElTableColumn label="结果" width="100">
                  <template #default="scope">
                    <ElTag
                      :type="formatResultType(scope?.row?.operationResult)"
                    >
                      {{ formatResultLabel(scope?.row?.operationResult) }}
                    </ElTag>
                  </template>
                </ElTableColumn>
                <ElTableColumn label="失败原因" min-width="220">
                  <template #default="scope">
                    {{ formatNullable(scope?.row?.failureReason) }}
                  </template>
                </ElTableColumn>
                <ElTableColumn fixed="right" label="操作" width="100">
                  <template #default="scope">
                    <ElButton
                      link
                      type="primary"
                      @click="openOperationDetail(scope.row)"
                    >
                      详情
                    </ElButton>
                  </template>
                </ElTableColumn>
              </ElTable>

              <div class="flex justify-end">
                <ElPagination
                  :current-page="operationPagination.page"
                  :page-size="operationPagination.size"
                  :page-sizes="[10, 20, 50, 100]"
                  :total="operationPagination.total"
                  background
                  layout="total, sizes, prev, pager, next, jumper"
                  @current-change="handleOperationPageChange"
                  @size-change="handleOperationSizeChange"
                />
              </div>
            </div>
          </ElTabPane>
        </ElTabs>
      </SystemSectionCard>
    </div>

    <ElDrawer
      v-model="detailDrawerVisible"
      :title="detailDrawerType === 'login' ? '登录日志详情' : '操作日志详情'"
      size="560px"
    >
      <ElSkeleton v-if="detailLoading" :rows="8" animated />
      <ElAlert
        v-else-if="detailError"
        :title="detailError"
        show-icon
        type="error"
      />
      <ElDescriptions
        v-else-if="detailDrawerType === 'login' && loginDetail"
        :column="1"
        border
      >
        <ElDescriptionsItem label="登录名">
          {{ loginDetail.loginName }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="用户 ID">
          {{ formatNullable(loginDetail.userId) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="登录结果">
          <ElTag :type="formatResultType(loginDetail.loginResult)">
            {{ formatResultLabel(loginDetail.loginResult) }}
          </ElTag>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="登录时间">
          {{ formatDateTime(loginDetail.loginAt) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="登出时间">
          {{ formatDateTime(loginDetail.logoutAt) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="客户端 IP">
          {{ formatNullable(loginDetail.clientIp) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="客户端设备">
          {{ formatNullable(loginDetail.clientDevice) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="失败原因">
          {{ formatNullable(loginDetail.failureReason) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="备注">
          {{ formatNullable(loginDetail.remarks) }}
        </ElDescriptionsItem>
      </ElDescriptions>
      <ElDescriptions
        v-else-if="detailDrawerType === 'operation' && operationDetail"
        :column="1"
        border
      >
        <ElDescriptionsItem label="摘要">
          {{ formatOperationTitle(operationDetail) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="操作结果">
          <ElTag :type="formatResultType(operationDetail.operationResult)">
            {{ formatResultLabel(operationDetail.operationResult) }}
          </ElTag>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="操作时间">
          {{ formatDateTime(operationDetail.operationAt) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="业务类型">
          {{ formatNullable(operationDetail.businessType) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="业务 ID">
          {{ formatNullable(operationDetail.businessId) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="操作人">
          {{ formatNullable(operationDetail.operatorName) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="操作人 ID">
          {{ formatNullable(operationDetail.operatorUserId) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="操作 IP">
          {{ formatNullable(operationDetail.operatorIp) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="失败原因">
          {{ formatNullable(operationDetail.failureReason) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="操作内容">
          <div
            class="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-muted p-3 text-xs leading-5 text-muted-foreground"
          >
            {{ formatNullable(operationDetail.operationContent) }}
          </div>
        </ElDescriptionsItem>
      </ElDescriptions>
    </ElDrawer>
  </Page>
</template>
