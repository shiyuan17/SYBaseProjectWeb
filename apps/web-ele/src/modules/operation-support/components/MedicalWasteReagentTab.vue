<script setup lang="ts">
import type {
  CreateMedicalWasteReagentBagRequest,
  MedicalWasteReagentBagView,
  MedicalWasteReagentHandoverRequest,
} from '../types/operation-support';

import { computed, reactive, ref } from 'vue';

import {
  ElButton,
  ElDatePicker,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElPopconfirm,
  ElTable,
  ElTableColumn,
} from 'element-plus';

import {
  handoverMedicalWasteReagentBag,
  listMedicalWasteReagentBags,
  saveMedicalWasteReagentBag,
} from '../api/operation-support-service';
import { getOperationSupportPageErrorMessage } from '../utils/error';
import { formatNullable } from '../utils/format';
import {
  buildMedicalWasteReagentPrintHtml,
  formatMedicalWasteReagentType,
  openMedicalWastePrintWindow,
  validateMedicalWasteReagentBagRequest,
} from '../utils/medical-waste';
import ReagentWasteHandoverDialog from './ReagentWasteHandoverDialog.vue';
import ReagentWastePrintDialog from './ReagentWastePrintDialog.vue';

const props = defineProps<{
  currentUserName: string;
}>();

const filters = reactive({
  dateFrom: '',
  dateTo: '',
  keyword: '',
});

const loading = ref(false);
const submitting = ref(false);
const handoverVisible = ref(false);
const printDialogVisible = ref(false);
const rows = ref<MedicalWasteReagentBagView[]>([]);
const selectedRow = ref<MedicalWasteReagentBagView | null>(null);
const form = reactive<CreateMedicalWasteReagentBagRequest>({
  bagName: '',
  remarks: '',
  source: '',
  volumeMl: '',
  wasteType: 'DRUG',
  weightKg: '',
});
const handoverForm = reactive<MedicalWasteReagentHandoverRequest>({
  handedOverAt: '',
  handedOverByName: '',
  handoverRemarks: '',
});

const selectedCanHandover = computed(
  () => selectedRow.value && !selectedRow.value.handedOverAt,
);

function resetPrintForm() {
  form.id = undefined;
  form.bagName = '';
  form.remarks = '';
  form.source = '';
  form.volumeMl = '';
  form.wasteType = 'DRUG';
  form.weightKg = '';
}

function resetHandoverForm() {
  handoverForm.handedOverByName = props.currentUserName;
  handoverForm.handedOverAt = new Date().toISOString().slice(0, 19);
  handoverForm.handoverRemarks = '';
}

async function loadRows() {
  loading.value = true;
  try {
    rows.value = await listMedicalWasteReagentBags({
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
  resetPrintForm();
  printDialogVisible.value = true;
}

async function submitPrintDialog() {
  const validationMessage = validateMedicalWasteReagentBagRequest(form);
  if (validationMessage) {
    ElMessage.warning(validationMessage);
    return;
  }
  submitting.value = true;
  try {
    const saved = await saveMedicalWasteReagentBag(form);
    const documentHtml = buildMedicalWasteReagentPrintHtml(saved);
    if (
      !openMedicalWastePrintWindow(
        `药物试剂标签-${saved.bagName}`,
        documentHtml,
      )
    ) {
      ElMessage.warning('打印窗口被浏览器拦截，请允许弹窗后重试');
      return;
    }
    ElMessage.success('保存并打印成功');
    printDialogVisible.value = false;
    await loadRows();
  } catch (error) {
    ElMessage.error(getOperationSupportPageErrorMessage(error));
  } finally {
    submitting.value = false;
  }
}

function openHandoverDialog() {
  if (!selectedRow.value) {
    ElMessage.warning('请先选择一条记录');
    return;
  }
  if (selectedRow.value.handedOverAt) {
    ElMessage.warning('该废物袋已完成交接');
    return;
  }
  resetHandoverForm();
  handoverVisible.value = true;
}

async function submitHandover() {
  if (!selectedRow.value) {
    return;
  }
  if (!handoverForm.handedOverByName.trim()) {
    ElMessage.warning('请填写交接人');
    return;
  }
  if (!handoverForm.handedOverAt.trim()) {
    ElMessage.warning('请选择交接时间');
    return;
  }
  submitting.value = true;
  try {
    await handoverMedicalWasteReagentBag(selectedRow.value.id, handoverForm);
    ElMessage.success('废物交接成功');
    handoverVisible.value = false;
    await loadRows();
  } catch (error) {
    ElMessage.error(getOperationSupportPageErrorMessage(error));
  } finally {
    submitting.value = false;
  }
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
        <ElFormItem label="废物袋名称">
          <ElInput
            v-model="filters.keyword"
            clearable
            placeholder="请输入废物袋名称"
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
        <ElFormItem>
          <ElPopconfirm
            title="确认对当前选中废物袋进行交接？"
            @confirm="openHandoverDialog"
          >
            <template #reference>
              <ElButton :disabled="!selectedCanHandover">废物交接</ElButton>
            </template>
          </ElPopconfirm>
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
        <ElTableColumn label="废物袋名称" min-width="180" prop="bagName" />
        <ElTableColumn label="种类" min-width="120">
          <template #default="{ row }">
            {{ formatMedicalWasteReagentType(row.wasteType) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="来源" min-width="180">
          <template #default="{ row }">
            {{ formatNullable(row.source) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="重量(KG)" min-width="110">
          <template #default="{ row }">
            {{ formatNullable(row.weightKg) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="容量(ML)" min-width="110">
          <template #default="{ row }">
            {{ formatNullable(row.volumeMl) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="创建信息" min-width="220">
          <template #default="{ row }">
            {{ formatNullable(row.createdInfo) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="交接信息" min-width="220">
          <template #default="{ row }">
            {{ formatNullable(row.handoverInfo) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="备注" min-width="180">
          <template #default="{ row }">
            {{ formatNullable(row.remarks) }}
          </template>
        </ElTableColumn>
      </ElTable>
    </div>

    <ReagentWastePrintDialog
      v-model="printDialogVisible"
      :form="form"
      :submitting="submitting"
      @submit="submitPrintDialog"
      @update:form="Object.assign(form, $event)"
    />

    <ReagentWasteHandoverDialog
      v-model="handoverVisible"
      :form="handoverForm"
      :submitting="submitting"
      @submit="submitHandover"
      @update:form="Object.assign(handoverForm, $event)"
    />
  </section>
</template>
