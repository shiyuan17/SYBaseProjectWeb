<script setup lang="ts">
import type {
  NumberingRuleView,
  UpdateNumberingRuleRequest,
} from '#/modules/system-management/types/system-management';

import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  ElButton,
  ElDrawer,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElSwitch,
  ElTable,
  ElTableColumn,
} from 'element-plus';

import {
  listNumberingRules,
  updateNumberingRule,
} from '../api/system-management-service';
import SystemLoadError from '../components/SystemLoadError.vue';
import SystemSectionCard from '../components/SystemSectionCard.vue';
import SystemStatusTag from '../components/SystemStatusTag.vue';
import { M1_PERMISSION_CODES } from '../constants';
import { getSystemPageErrorMessage } from '../utils/error';
import {
  formatDateTime,
  formatNullable,
  formatNumberingRuleBizType,
  formatNumberingRuleResetPolicy,
  formatNumberingRuleScopeType,
} from '../utils/format';

const loading = ref(false);
const submitLoading = ref(false);
const drawerVisible = ref(false);
const pageError = ref('');
const items = ref<NumberingRuleView[]>([]);

const form = reactive<
  UpdateNumberingRuleRequest & { id: string; ruleCode: string }
>({
  datePattern: '',
  enabled: true,
  id: '',
  prefixPattern: '',
  remarks: '',
  resetPolicy: '',
  ruleCode: '',
  scopeType: '',
  seqLength: 4,
});

async function loadData() {
  loading.value = true;
  pageError.value = '';
  try {
    items.value = await listNumberingRules();
  } catch (error) {
    pageError.value = getSystemPageErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

function openEditDrawer(rule: NumberingRuleView) {
  Object.assign(form, {
    datePattern: rule.datePattern ?? '',
    enabled: rule.enabled,
    id: rule.id,
    prefixPattern: rule.prefixPattern ?? '',
    remarks: rule.remarks ?? '',
    resetPolicy: rule.resetPolicy,
    ruleCode: rule.ruleCode,
    scopeType: rule.scopeType,
    seqLength: rule.seqLength,
  });
  drawerVisible.value = true;
}

async function submitForm() {
  submitLoading.value = true;
  try {
    await updateNumberingRule(form.id, {
      datePattern: form.datePattern || null,
      enabled: form.enabled,
      prefixPattern: form.prefixPattern || null,
      remarks: form.remarks || null,
      resetPolicy: form.resetPolicy,
      scopeType: form.scopeType,
      seqLength: form.seqLength,
    });
    ElMessage.success('编号规则已更新');
    drawerVisible.value = false;
    await loadData();
  } finally {
    submitLoading.value = false;
  }
}

onMounted(loadData);
</script>

<template>
  <Page
    title="编号规则"
    description="维护业务编号前缀、日期格式、流水长度、重置策略和作用域。"
  >
    <SystemLoadError
      v-if="false"
      :message="pageError"
      class="mb-4"
      @retry="loadData"
    />
    <SystemSectionCard
      title="规则列表"
      description="只读展示核心字段，通过抽屉进行规则更新。"
    >
      <ElTable v-loading="loading" :data="items" border>
        <ElTableColumn label="规则编码" min-width="140" prop="ruleCode" />
        <ElTableColumn label="业务类型" min-width="140">
          <template #default="scope">
            {{ formatNumberingRuleBizType(scope?.row?.bizType) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="前缀" min-width="120">
          <template #default="scope">
            {{ formatNullable(scope?.row?.prefixPattern) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="日期格式" min-width="120">
          <template #default="scope">
            {{ formatNullable(scope?.row?.datePattern) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="流水长度" width="100" prop="seqLength" />
        <ElTableColumn label="重置策略" min-width="120">
          <template #default="scope">
            {{ formatNumberingRuleResetPolicy(scope?.row?.resetPolicy) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="作用域" min-width="120">
          <template #default="scope">
            {{ formatNumberingRuleScopeType(scope?.row?.scopeType) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="状态" width="90">
          <template #default="scope">
            <SystemStatusTag v-if="scope?.row" :enabled="scope.row.enabled" />
          </template>
        </ElTableColumn>
        <ElTableColumn label="更新时间" min-width="160">
          <template #default="scope">
            {{ formatDateTime(scope?.row?.updatedAt) }}
          </template>
        </ElTableColumn>
        <ElTableColumn fixed="right" label="操作" width="90">
          <template #default="scope">
            <ElButton
              v-if="scope?.row"
              v-access:code="M1_PERMISSION_CODES.NUMBERING_UPDATE"
              link
              type="primary"
              @click="openEditDrawer(scope.row)"
            >
              编辑
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </SystemSectionCard>

    <ElDrawer
      v-model="drawerVisible"
      :title="`编辑规则 ${form.ruleCode}`"
      size="520px"
    >
      <ElForm label-width="108px">
        <ElFormItem label="规则编码">
          <ElInput v-model="form.ruleCode" disabled />
        </ElFormItem>
        <ElFormItem label="前缀模式">
          <ElInput v-model="form.prefixPattern" />
        </ElFormItem>
        <ElFormItem label="日期格式">
          <ElInput v-model="form.datePattern" placeholder="例如 yyyyMMdd" />
        </ElFormItem>
        <ElFormItem label="流水长度">
          <ElInputNumber v-model="form.seqLength" :max="12" :min="1" />
        </ElFormItem>
        <ElFormItem label="重置策略">
          <ElInput
            v-model="form.resetPolicy"
            placeholder="例如 DAILY / MONTHLY"
          />
        </ElFormItem>
        <ElFormItem label="作用域">
          <ElInput v-model="form.scopeType" placeholder="例如 GLOBAL / LAB" />
        </ElFormItem>
        <ElFormItem label="备注">
          <ElInput v-model="form.remarks" type="textarea" />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSwitch v-model="form.enabled" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <div class="flex justify-end gap-2">
          <ElButton @click="drawerVisible = false">取消</ElButton>
          <ElButton :loading="submitLoading" type="primary" @click="submitForm">
            保存
          </ElButton>
        </div>
      </template>
    </ElDrawer>
  </Page>
</template>
