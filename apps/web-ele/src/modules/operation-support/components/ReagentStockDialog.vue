<script setup lang="ts">
import type { ReagentView } from '../types/operation-support';
import type {
  ReagentStockFormState,
  ReagentTemplateTreeGroup,
  ReagentTemplateTreeItem,
} from '../utils/reagent-ledger';

import { computed, ref, watch } from 'vue';

import {
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElRadio,
  ElRadioGroup,
  ElScrollbar,
} from 'element-plus';

import { REAGENT_STOCK_STATUS_OPTIONS } from '../constants';
import { formatNullable, formatReagentType } from '../utils/format';
import {
  applyReagentTemplateToStockForm,
  buildReagentTemplateTree,
} from '../utils/reagent-ledger';

const props = defineProps<{
  isEditingStock: boolean;
  reagents: ReagentView[];
  submitting: boolean;
}>();

const emit = defineEmits<{
  (event: 'submit'): void;
}>();

const dialogVisible = defineModel<boolean>({ required: true });
const stockForm = defineModel<ReagentStockFormState>('stockForm', {
  required: true,
});

const templateKeyword = ref('');
const selectedTemplateId = ref('');

const templateGroups = computed<ReagentTemplateTreeGroup[]>(() =>
  buildReagentTemplateTree(props.reagents, templateKeyword.value),
);

const selectedTemplate = computed(
  () =>
    props.reagents.find(
      (reagent) => reagent.id === stockForm.value.reagentId,
    ) ?? null,
);

const stockDialogTitle = computed(() =>
  props.isEditingStock ? '试剂库存信息' : '新增试剂库存信息',
);

const templateSummary = computed(() => {
  const reagent = selectedTemplate.value;
  if (!reagent) {
    return {
      manufacturer: '-',
      orderItemName: '-',
      reagentCode: '-',
      reagentName: '-',
      specification: '-',
      templateLabel: '-',
      unit: '-',
    };
  }

  return {
    manufacturer: formatNullable(reagent.manufacturer),
    orderItemName: formatNullable(reagent.orderItemName),
    reagentCode: formatNullable(reagent.reagentCode),
    reagentName: formatNullable(reagent.reagentName),
    specification: formatNullable(reagent.specification),
    templateLabel: `${formatNullable(reagent.reagentName)}（${formatReagentType(reagent.reagentType)}）`,
    unit: formatNullable(reagent.unit),
  };
});

function selectTemplate(item: ReagentTemplateTreeItem) {
  selectedTemplateId.value = item.id;
  applyReagentTemplateToStockForm(stockForm.value, item.reagent, {
    overwriteEmptyOnly: true,
  });
}

function closeDialog() {
  dialogVisible.value = false;
}

watch(
  () => dialogVisible.value,
  (visible) => {
    if (!visible) {
      templateKeyword.value = '';
      selectedTemplateId.value = '';
      return;
    }

    selectedTemplateId.value = stockForm.value.reagentId || '';
  },
  { immediate: true },
);

watch(
  () => stockForm.value.reagentId,
  (reagentId) => {
    selectedTemplateId.value = reagentId || '';
  },
);
</script>

<template>
  <ElDialog
    v-model="dialogVisible"
    class="reagent-stock-dialog"
    :close-on-click-modal="false"
    destroy-on-close
    :show-close="false"
    :title="stockDialogTitle"
    top="4vh"
    width="1120px"
  >
    <div class="reagent-stock-dialog__shell">
      <div class="reagent-stock-dialog__toolbar">
        <div class="reagent-stock-dialog__toolbar-title">
          {{ stockDialogTitle }}
        </div>
        <div class="reagent-stock-dialog__toolbar-actions">
          <ElButton
            data-testid="reagent-stock-dialog-save"
            :loading="props.submitting"
            type="primary"
            @click="emit('submit')"
          >
            保存
          </ElButton>
          <ElButton
            data-testid="reagent-stock-dialog-exit"
            @click="closeDialog"
          >
            退出
          </ElButton>
        </div>
      </div>

      <div class="reagent-stock-dialog__body">
        <aside class="reagent-stock-dialog__template-panel">
          <div class="reagent-stock-dialog__panel-title">试剂模板</div>
          <ElInput
            v-model="templateKeyword"
            clearable
            placeholder="搜索试剂模板"
          />
          <div
            class="reagent-stock-dialog__template-tree"
            data-testid="reagent-template-tree"
          >
            <ElScrollbar max-height="520px">
              <div
                v-if="templateGroups.length === 0"
                class="reagent-stock-dialog__empty"
              >
                未找到匹配的模板
              </div>
              <div
                v-for="group in templateGroups"
                v-else
                :key="group.id"
                class="reagent-stock-dialog__template-group"
              >
                <div class="reagent-stock-dialog__template-group-label">
                  {{ group.label }}
                </div>
                <button
                  v-for="item in group.children"
                  :key="item.id"
                  class="reagent-stock-dialog__template-item"
                  :class="{
                    'is-active': selectedTemplateId === item.id,
                  }"
                  type="button"
                  @click="selectTemplate(item)"
                >
                  <span class="reagent-stock-dialog__template-item-name">
                    {{ item.label }}
                  </span>
                  <span class="reagent-stock-dialog__template-item-meta">
                    {{ item.metaLabel }}
                  </span>
                </button>
              </div>
            </ElScrollbar>
          </div>
        </aside>

        <section class="reagent-stock-dialog__form-panel">
          <div class="reagent-stock-dialog__status-row">
            <span class="reagent-stock-dialog__status-label">状态</span>
            <ElRadioGroup
              v-model="stockForm.stockStatus"
              class="reagent-stock-dialog__status-group"
              data-testid="reagent-stock-status-group"
            >
              <ElRadio
                v-for="option in REAGENT_STOCK_STATUS_OPTIONS"
                :key="option.value"
                :label="option.value"
              >
                {{ option.label }}
              </ElRadio>
            </ElRadioGroup>
          </div>

          <div class="reagent-stock-dialog__template-summary">
            <div class="reagent-stock-dialog__summary-line">
              <span class="reagent-stock-dialog__summary-label">所属模板</span>
              <span
                class="reagent-stock-dialog__summary-value"
                data-testid="selected-template-label"
              >
                {{ templateSummary.templateLabel }}
              </span>
            </div>
            <div class="reagent-stock-dialog__summary-grid">
              <div class="reagent-stock-dialog__summary-item">
                <span class="reagent-stock-dialog__summary-item-label">
                  试剂名称
                </span>
                <span data-testid="selected-template-name">
                  {{ templateSummary.reagentName }}
                </span>
              </div>
              <div class="reagent-stock-dialog__summary-item">
                <span class="reagent-stock-dialog__summary-item-label">
                  对应医嘱
                </span>
                <span data-testid="selected-template-order">
                  {{ templateSummary.orderItemName }}
                </span>
              </div>
              <div class="reagent-stock-dialog__summary-item">
                <span class="reagent-stock-dialog__summary-item-label">
                  试剂编码
                </span>
                <span data-testid="selected-template-code">
                  {{ templateSummary.reagentCode }}
                </span>
              </div>
              <div class="reagent-stock-dialog__summary-item">
                <span class="reagent-stock-dialog__summary-item-label">
                  厂家
                </span>
                <span>{{ templateSummary.manufacturer }}</span>
              </div>
              <div class="reagent-stock-dialog__summary-item">
                <span class="reagent-stock-dialog__summary-item-label">
                  规格
                </span>
                <span>{{ templateSummary.specification }}</span>
              </div>
              <div class="reagent-stock-dialog__summary-item">
                <span class="reagent-stock-dialog__summary-item-label">
                  单位
                </span>
                <span>{{ templateSummary.unit }}</span>
              </div>
            </div>
          </div>

          <ElForm label-width="116px">
            <div class="reagent-stock-dialog__form-grid">
              <div class="reagent-stock-dialog__form-column">
                <ElFormItem label="试剂规格">
                  <ElInputNumber
                    v-model="stockForm.initialQuantity"
                    controls-position="right"
                    :min="0"
                  />
                </ElFormItem>
                <ElFormItem label="剩余数量">
                  <ElInputNumber
                    v-model="stockForm.remainingQuantity"
                    controls-position="right"
                    :min="0"
                  />
                </ElFormItem>
                <ElFormItem label="订购提醒阈值">
                  <ElInputNumber
                    v-model="stockForm.lowStockThreshold"
                    controls-position="right"
                    :min="0"
                  />
                </ElFormItem>
                <ElFormItem label="测试提醒阈值">
                  <ElInputNumber
                    v-model="stockForm.testReminderThreshold"
                    controls-position="right"
                    :min="0"
                  />
                </ElFormItem>
                <ElFormItem label="推荐稀释度">
                  <ElInput
                    v-model="stockForm.recommendedDilution"
                    data-testid="stock-form-recommended-dilution"
                  />
                </ElFormItem>
                <ElFormItem label="应用稀释度">
                  <ElInput
                    v-model="stockForm.applicationDilution"
                    data-testid="stock-form-application-dilution"
                  />
                </ElFormItem>
                <ElFormItem label="预计染色数量">
                  <ElInputNumber
                    v-model="stockForm.stainCapacity"
                    controls-position="right"
                    :min="0"
                  />
                </ElFormItem>
                <ElFormItem label="染色数量阈值">
                  <ElInputNumber
                    v-model="stockForm.stainThreshold"
                    controls-position="right"
                    :min="0"
                  />
                </ElFormItem>
              </div>

              <div class="reagent-stock-dialog__form-column">
                <ElFormItem label="批号" required>
                  <ElInput
                    v-model="stockForm.batchNo"
                    :disabled="props.isEditingStock"
                  />
                </ElFormItem>
                <ElFormItem label="生产日期">
                  <ElInput
                    v-model="stockForm.productionDate"
                    placeholder="YYYY-MM-DD"
                  />
                </ElFormItem>
                <ElFormItem label="入库时间">
                  <ElInput
                    v-model="stockForm.inboundAt"
                    placeholder="YYYY-MM-DDTHH:mm:ss"
                  />
                </ElFormItem>
                <ElFormItem label="有效期至">
                  <ElInput
                    v-model="stockForm.expiryDate"
                    placeholder="YYYY-MM-DD"
                  />
                </ElFormItem>
                <ElFormItem label="有效期天数">
                  <ElInputNumber
                    v-model="stockForm.validityDays"
                    controls-position="right"
                    :min="0"
                  />
                </ElFormItem>
                <ElFormItem label="过期提醒阈值">
                  <ElInputNumber
                    v-model="stockForm.expiryReminderThreshold"
                    controls-position="right"
                    :min="0"
                  />
                </ElFormItem>
                <ElFormItem label="近效期天数">
                  <ElInputNumber
                    v-model="stockForm.nearExpiryDays"
                    controls-position="right"
                    :min="0"
                  />
                </ElFormItem>
                <ElFormItem label="存放位置">
                  <ElInput v-model="stockForm.storageLocation" />
                </ElFormItem>
              </div>
            </div>

            <ElFormItem label="备注">
              <ElInput v-model="stockForm.remarks" :rows="3" type="textarea" />
            </ElFormItem>
          </ElForm>
        </section>
      </div>
    </div>
  </ElDialog>
</template>

<style scoped>
.reagent-stock-dialog__shell {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.reagent-stock-dialog__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--el-border-color);
  padding-bottom: 12px;
}

.reagent-stock-dialog__toolbar-title {
  font-size: 16px;
  font-weight: 600;
}

.reagent-stock-dialog__toolbar-actions {
  display: flex;
  gap: 12px;
}

.reagent-stock-dialog__body {
  display: grid;
  gap: 20px;
  grid-template-columns: 280px minmax(0, 1fr);
}

.reagent-stock-dialog__template-panel {
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  padding: 12px;
}

.reagent-stock-dialog__panel-title {
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
}

.reagent-stock-dialog__template-tree {
  margin-top: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background: var(--el-fill-color-blank);
}

.reagent-stock-dialog__template-group {
  padding: 10px;
}

.reagent-stock-dialog__template-group + .reagent-stock-dialog__template-group {
  border-top: 1px solid var(--el-border-color-lighter);
}

.reagent-stock-dialog__template-group-label {
  margin-bottom: 8px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  font-weight: 600;
}

.reagent-stock-dialog__template-item {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  padding: 8px 10px;
  text-align: left;
}

.reagent-stock-dialog__template-item:hover {
  border-color: var(--el-color-primary-light-7);
  background: var(--el-color-primary-light-9);
}

.reagent-stock-dialog__template-item.is-active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.reagent-stock-dialog__template-item-name {
  color: var(--el-text-color-primary);
  font-weight: 600;
}

.reagent-stock-dialog__template-item-meta {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.reagent-stock-dialog__empty {
  padding: 24px 12px;
  color: var(--el-text-color-secondary);
  text-align: center;
}

.reagent-stock-dialog__form-panel {
  min-width: 0;
}

.reagent-stock-dialog__status-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 14px;
}

.reagent-stock-dialog__status-label {
  min-width: 40px;
  color: var(--el-text-color-regular);
  font-weight: 600;
}

.reagent-stock-dialog__status-group {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.reagent-stock-dialog__template-summary {
  margin-bottom: 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-light);
  padding: 14px 16px;
}

.reagent-stock-dialog__summary-line {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.reagent-stock-dialog__summary-label {
  color: var(--el-text-color-regular);
  font-weight: 600;
}

.reagent-stock-dialog__summary-value {
  color: var(--el-color-primary-dark-2);
  font-size: 18px;
  font-weight: 700;
}

.reagent-stock-dialog__summary-grid {
  display: grid;
  gap: 12px 24px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.reagent-stock-dialog__summary-item {
  display: flex;
  gap: 8px;
  min-width: 0;
}

.reagent-stock-dialog__summary-item-label {
  color: var(--el-text-color-secondary);
  flex: none;
}

.reagent-stock-dialog__form-grid {
  display: grid;
  gap: 0 16px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.reagent-stock-dialog__form-column {
  min-width: 0;
}

.reagent-stock-dialog__form-column :deep(.el-form-item) {
  margin-bottom: 14px;
}

.reagent-stock-dialog__form-column :deep(.el-input),
.reagent-stock-dialog__form-column :deep(.el-input-number),
.reagent-stock-dialog__form-column :deep(.el-date-editor) {
  width: 100%;
}

@media (max-width: 1100px) {
  .reagent-stock-dialog__body {
    grid-template-columns: 1fr;
  }

  .reagent-stock-dialog__summary-grid,
  .reagent-stock-dialog__form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
