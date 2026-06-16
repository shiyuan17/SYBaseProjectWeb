<script setup lang="ts">
import type {
  MedicalWastePrintSpecimenBatchRequest,
  MedicalWasteSpecimenBatchView,
  MedicalWasteSpecimenOptionsView,
  MedicalWasteSpecimenPreviewRequest,
} from '../types/operation-support';

import { computed, reactive, ref } from 'vue';

import {
  ElButton,
  ElDatePicker,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElPopconfirm,
  ElSelect,
  ElTable,
  ElTableColumn,
} from 'element-plus';

import {
  destroyMedicalWasteSpecimenBatch,
  listMedicalWasteSpecimenBatches,
  previewMedicalWasteSpecimenLabels,
  printMedicalWasteSpecimenBatch,
} from '../api/operation-support-service';
import { getOperationSupportPageErrorMessage } from '../utils/error';
import { formatNullable } from '../utils/format';
import {
  buildMedicalWasteSpecimenPrintHtml,
  formatMedicalWastePeriod,
  openMedicalWastePrintWindow,
  validateMedicalWasteSpecimenPreviewRequest,
} from '../utils/medical-waste';
import SpecimenWastePrintDialog from './SpecimenWastePrintDialog.vue';

const props = defineProps<{
  canViewPage: boolean;
  options: MedicalWasteSpecimenOptionsView;
}>();

const filters = reactive({
  createdByName: '',
  dateFrom: '',
  dateTo: '',
  keyword: '',
});

const loading = ref(false);
const previewing = ref(false);
const dialogVisible = ref(false);
const destroyingId = ref('');
const rows = ref<MedicalWasteSpecimenBatchView[]>([]);
const selectedRow = ref<MedicalWasteSpecimenBatchView | null>(null);
const labels = ref(
  [] as Awaited<ReturnType<typeof previewMedicalWasteSpecimenLabels>>,
);
const dialogForm = reactive<
  MedicalWastePrintSpecimenBatchRequest & {
    printInfo?: string;
    weightKg?: string;
  }
>({
  bagName: '',
  grossingDate: '',
  grossingOperatorName: '',
  grossingPeriod: 'AM',
  grossingStationName: '',
  printInfo: '',
  weightKg: '',
});

const hasSelectedRow = computed(() => Boolean(selectedRow.value));

function updatePrintInfo() {
  dialogForm.printInfo = [
    dialogForm.grossingDate || '',
    formatMedicalWastePeriod(dialogForm.grossingPeriod || ''),
    dialogForm.grossingOperatorName || '',
    dialogForm.grossingStationName || '',
  ]
    .filter(Boolean)
    .join(' / ');
}

function resetDialog() {
  dialogForm.bagName = '';
  dialogForm.grossingDate = '';
  dialogForm.grossingOperatorName = '';
  dialogForm.grossingPeriod = 'AM';
  dialogForm.grossingStationName = '';
  dialogForm.printInfo = '';
  dialogForm.weightKg = '';
  labels.value = [];
}

async function loadRows() {
  if (!props.canViewPage) {
    rows.value = [];
    return;
  }
  loading.value = true;
  try {
    rows.value = await listMedicalWasteSpecimenBatches({
      createdByName: filters.createdByName || undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
      keyword: filters.keyword.trim() || undefined,
    });
    if (selectedRow.value) {
      selectedRow.value =
        rows.value.find((item) => item.id === selectedRow.value?.id) ?? null;
    }
  } catch (error) {
    ElMessage.error(getOperationSupportPageErrorMessage(error));
  } finally {
    loading.value = false;
  }
}

function openPrintDialog() {
  resetDialog();
  dialogVisible.value = true;
}

async function queryLabels() {
  const validationMessage = validateMedicalWasteSpecimenPreviewRequest(
    dialogForm as MedicalWasteSpecimenPreviewRequest,
  );
  if (validationMessage) {
    ElMessage.warning(validationMessage);
    return;
  }
  updatePrintInfo();
  previewing.value = true;
  try {
    labels.value = await previewMedicalWasteSpecimenLabels({
      bagName: dialogForm.bagName,
      grossingDate: dialogForm.grossingDate,
      grossingOperatorName: dialogForm.grossingOperatorName,
      grossingPeriod: dialogForm.grossingPeriod,
      grossingStationName: dialogForm.grossingStationName,
    });
  } catch (error) {
    ElMessage.error(getOperationSupportPageErrorMessage(error));
  } finally {
    previewing.value = false;
  }
}

async function submitPrint() {
  const validationMessage = validateMedicalWasteSpecimenPreviewRequest(
    dialogForm as MedicalWasteSpecimenPreviewRequest,
  );
  if (validationMessage) {
    ElMessage.warning(validationMessage);
    return;
  }
  if (labels.value.length === 0) {
    ElMessage.warning('请先查询标签明细');
    return;
  }

  previewing.value = true;
  try {
    const result = await printMedicalWasteSpecimenBatch({
      bagName: dialogForm.bagName,
      grossingDate: dialogForm.grossingDate,
      grossingOperatorName: dialogForm.grossingOperatorName,
      grossingPeriod: dialogForm.grossingPeriod,
      grossingStationName: dialogForm.grossingStationName,
      weightKg: dialogForm.weightKg || undefined,
    });
    const documentHtml = buildMedicalWasteSpecimenPrintHtml(result);
    if (
      !openMedicalWastePrintWindow(
        `人体标本标签-${result.batch.bagName}`,
        documentHtml,
      )
    ) {
      ElMessage.warning('打印窗口被浏览器拦截，请允许弹窗后重试');
      return;
    }
    ElMessage.success('标签打印成功');
    dialogVisible.value = false;
    await loadRows();
  } catch (error) {
    ElMessage.error(getOperationSupportPageErrorMessage(error));
  } finally {
    previewing.value = false;
  }
}

async function destroySelectedRow() {
  if (!selectedRow.value) {
    ElMessage.warning('请先选择一条记录');
    return;
  }
  destroyingId.value = selectedRow.value.id;
  try {
    await destroyMedicalWasteSpecimenBatch(selectedRow.value.id);
    ElMessage.success('标本已销毁');
    await loadRows();
  } catch (error) {
    ElMessage.error(getOperationSupportPageErrorMessage(error));
  } finally {
    destroyingId.value = '';
  }
}

function changeDialogDate(offset: number) {
  const baseDate = dialogForm.grossingDate
    ? new Date(`${dialogForm.grossingDate}T00:00:00`)
    : new Date();
  baseDate.setDate(baseDate.getDate() + offset);
  dialogForm.grossingDate = baseDate.toISOString().slice(0, 10);
  updatePrintInfo();
}

void loadRows();
</script>

<template>
  <section class="rounded-lg border border-border bg-card">
    <div class="border-b border-border px-4 py-3">
      <ElForm class="flex flex-wrap items-end gap-x-3 gap-y-2" inline>
        <ElFormItem>
          <ElButton type="primary" @click="openPrintDialog">打印标签</ElButton>
        </ElFormItem>
        <ElFormItem>
          <ElPopconfirm
            title="确认销毁当前选中的标本记录？"
            @confirm="destroySelectedRow"
          >
            <template #reference>
              <ElButton
                :disabled="!hasSelectedRow"
                :loading="Boolean(destroyingId)"
              >
                销毁标本
              </ElButton>
            </template>
          </ElPopconfirm>
        </ElFormItem>
        <ElFormItem label="创建人">
          <ElSelect
            v-model="filters.createdByName"
            clearable
            filterable
            placeholder="全部"
            style="width: 180px"
          >
            <ElOption
              v-for="item in options.grossingOperators"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="ID/姓名">
          <ElInput
            v-model="filters.keyword"
            clearable
            placeholder="回收袋名称 / 标本人"
            style="width: 220px"
            @keyup.enter="loadRows"
          />
        </ElFormItem>
        <ElFormItem label="日期">
          <ElDatePicker
            v-model="filters.dateFrom"
            placeholder="开始日期"
            style="width: 148px"
            type="date"
            value-format="YYYY-MM-DD"
          />
        </ElFormItem>
        <ElFormItem>
          <ElDatePicker
            v-model="filters.dateTo"
            placeholder="结束日期"
            style="width: 148px"
            type="date"
            value-format="YYYY-MM-DD"
          />
        </ElFormItem>
        <ElFormItem>
          <ElButton :loading="loading" type="primary" @click="loadRows">
            查询
          </ElButton>
        </ElFormItem>
      </ElForm>
    </div>

    <div class="px-4 py-4">
      <ElTable
        v-loading="loading"
        :data="rows"
        border
        highlight-current-row
        @current-change="selectedRow = $event"
      >
        <ElTableColumn label="回收袋名称" min-width="170" prop="bagName" />
        <ElTableColumn label="取材操作" min-width="220">
          <template #default="{ row }">
            {{
              row.grossingAction ||
              `${formatNullable(row.grossingOperatorName)} / ${formatNullable(row.printedAt)}`
            }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="销毁操作" min-width="220">
          <template #default="{ row }">
            {{
              row.destroyAction ||
              `${formatNullable(row.destroyedByName)} / ${formatNullable(row.destroyedAt)}`
            }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="取材台" min-width="140">
          <template #default="{ row }">
            {{ formatNullable(row.grossingStationName) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="重量(KG)" min-width="110">
          <template #default="{ row }">
            {{ formatNullable(row.weightKg) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="标本数量" min-width="100" prop="labelCount" />
      </ElTable>
    </div>

    <SpecimenWastePrintDialog
      v-model="dialogVisible"
      :form="dialogForm"
      :labels="labels"
      :options="options"
      :previewing="previewing"
      :querying="previewing"
      :submitting="previewing"
      @change-date="changeDialogDate"
      @query="queryLabels"
      @submit="submitPrint"
      @update:form="Object.assign(dialogForm, $event)"
    />
  </section>
</template>
