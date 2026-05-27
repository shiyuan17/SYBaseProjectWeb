<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';

import { useUserStore } from '@vben/stores';

import {
  ElAlert,
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
} from 'element-plus';

import DepartmentSelect from '#/modules/system-management/components/DepartmentSelect.vue';
import SystemUserSelect from '#/modules/system-management/components/SystemUserSelect.vue';

import {
  createTransportOrder,
  getApplicationDetail,
} from '../api/specimen-workflow-service';
import type { ApplicationDetailView } from '../types/specimen-workflow';
import { getWorkflowPageErrorMessage } from '../utils/error';

const props = withDefaults(
  defineProps<{
    initialApplicationId?: string;
    initialApplicationNo?: string;
    modelValue: boolean;
  }>(),
  {
    initialApplicationId: '',
    initialApplicationNo: '',
  },
);

const emit = defineEmits<{
  created: [];
  'update:modelValue': [value: boolean];
}>();

const userStore = useUserStore();

const pageError = ref('');
const createLoading = ref(false);
const applicationDetail = ref<null | ApplicationDetailView>(null);

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const visibleApplicationNo = computed(() => {
  const applicationId = createForm.applicationId.trim();
  const detail = applicationDetail.value;

  if (detail?.id?.trim() === applicationId) {
    return detail.applicationNo?.trim() ?? '';
  }

  if (props.initialApplicationId.trim() === applicationId) {
    return props.initialApplicationNo.trim();
  }

  return '';
});

const createForm = reactive({
  applicationId: '',
  handoverDepartmentId: '',
  handoverDepartmentName: '',
  handoverUserId: userStore.userInfo?.userId ?? '',
  handoverUserName: userStore.userInfo?.realName ?? '',
  receiverDepartmentId: '',
  receiverDepartmentName: '',
  remarks: '',
  selectedSpecimenBarcodes: [] as string[],
  specimenBarcodesText: '',
  terminalCode: '',
});

function splitSpecimenBarcodes(value: string) {
  return [...new Set(value.split(/[\s,，；;]+/).map((item) => item.trim()).filter(Boolean))];
}

const mergedSpecimenBarcodes = computed(() => {
  const selected = createForm.selectedSpecimenBarcodes;
  const manual = splitSpecimenBarcodes(createForm.specimenBarcodesText);
  return [...new Set([...selected, ...manual])];
});

const eligibleSpecimens = computed(() =>
  (applicationDetail.value?.specimens ?? []).filter((item) =>
    item.verificationStatus === 'VERIFIED'
    && item.fixationStatus === 'COMPLETED'
    && Boolean(item.specimenConfirmedAt)
    && item.checkInStatus === 'CHECKED_IN',
  ),
);

function clearApplicationContext() {
  applicationDetail.value = null;
  createForm.selectedSpecimenBarcodes = [];
  pageError.value = '';
}

function resetCreateForm() {
  Object.assign(createForm, {
    applicationId: props.initialApplicationId.trim(),
    handoverDepartmentId: '',
    handoverDepartmentName: '',
    handoverUserId: userStore.userInfo?.userId ?? '',
    handoverUserName: userStore.userInfo?.realName ?? '',
    receiverDepartmentId: '',
    receiverDepartmentName: '',
    remarks: '',
    selectedSpecimenBarcodes: [],
    specimenBarcodesText: '',
    terminalCode: '',
  });
  clearApplicationContext();
}

async function loadApplicationContext(showEmptyWarning = false) {
  const applicationId = createForm.applicationId.trim();
  if (!applicationId) {
    clearApplicationContext();
    if (showEmptyWarning) {
      ElMessage.warning('请先输入申请单编号');
    }
    return;
  }

  if (applicationDetail.value?.id?.trim() === applicationId) {
    return;
  }

  pageError.value = '';
  try {
    const detail = await getApplicationDetail(applicationId);
    if (createForm.applicationId.trim() !== applicationId) {
      return;
    }
    applicationDetail.value = detail;
    createForm.selectedSpecimenBarcodes = detail.specimens
      .filter((item) =>
        item.verificationStatus === 'VERIFIED'
        && item.fixationStatus === 'COMPLETED'
        && Boolean(item.specimenConfirmedAt)
        && item.checkInStatus === 'CHECKED_IN',
      )
      .map((item) => item.barcode)
      .filter(Boolean);
  } catch (error) {
    if (createForm.applicationId.trim() === applicationId) {
      clearApplicationContext();
      pageError.value = getWorkflowPageErrorMessage(error);
    }
  }
}

function resolveSpecimenName(specimen: ApplicationDetailView['specimens'][number]) {
  return specimen.specimenName?.trim() || '未命名标本';
}

function resolveSpecimenType(specimen: ApplicationDetailView['specimens'][number]) {
  return specimen.specimenType?.trim() || '未填写';
}

function resolveSpecimenSite(specimen: ApplicationDetailView['specimens'][number]) {
  return specimen.specimenSite?.trim() || applicationDetail.value?.specimenSite?.trim() || '未填写';
}

function resolveSpecimenCollectionMode(specimen: ApplicationDetailView['specimens'][number]) {
  return specimen.collectionMode?.trim() || '未填写';
}

function resolveSpecimenClinicalSymptom(specimen: ApplicationDetailView['specimens'][number]) {
  return specimen.clinicalSymptom?.trim() || applicationDetail.value?.clinicalSymptom?.trim() || '未填写';
}

function formatSpecimenOptionLabel(specimen: ApplicationDetailView['specimens'][number]) {
  return [
    resolveSpecimenName(specimen),
    `类型:${resolveSpecimenType(specimen)}`,
    `部位:${resolveSpecimenSite(specimen)}`,
    `采集方式:${resolveSpecimenCollectionMode(specimen)}`,
    `临床症状:${resolveSpecimenClinicalSymptom(specimen)}`,
  ].join(' ｜ ');
}

async function submitCreate() {
  const specimenBarcodes = mergedSpecimenBarcodes.value;
  if (!createForm.applicationId.trim()) {
    ElMessage.warning('请填写申请单编号');
    return;
  }
  if (!createForm.handoverDepartmentId.trim()) {
    ElMessage.warning('请选择交接科室');
    return;
  }
  if (!createForm.handoverUserName.trim()) {
    ElMessage.warning('请选择交接人');
    return;
  }
  if (!createForm.receiverDepartmentId.trim()) {
    ElMessage.warning('请选择接收科室');
    return;
  }
  if (specimenBarcodes.length === 0) {
    ElMessage.warning('请至少选择一条标本');
    return;
  }

  createLoading.value = true;
  pageError.value = '';
  try {
    await createTransportOrder({
      applicationId: createForm.applicationId.trim(),
      handoverDepartmentId: createForm.handoverDepartmentId.trim() || null,
      handoverDepartmentName: createForm.handoverDepartmentName.trim(),
      handoverUserId: createForm.handoverUserId.trim() || null,
      handoverUserName: createForm.handoverUserName.trim(),
      receiverDepartmentId: createForm.receiverDepartmentId.trim() || null,
      receiverDepartmentName: createForm.receiverDepartmentName.trim(),
      remarks: createForm.remarks.trim() || null,
      specimenBarcodes,
      terminalCode: createForm.terminalCode.trim() || null,
    });
    ElMessage.success('转运单创建成功');
    emit('created');
    dialogVisible.value = false;
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    createLoading.value = false;
  }
}

function handleDialogClosed() {
  resetCreateForm();
}

function handleHandoverDepartmentChange(department: null | { id: string; name: string }) {
  createForm.handoverDepartmentId = department?.id ?? '';
  createForm.handoverDepartmentName = department?.name ?? '';
}

function handleReceiverDepartmentChange(department: null | { id: string; name: string }) {
  createForm.receiverDepartmentId = department?.id ?? '';
  createForm.receiverDepartmentName = department?.name ?? '';
}

function handleHandoverUserChange(user: null | { id: string; name: string }) {
  createForm.handoverUserId = user?.id ?? '';
  createForm.handoverUserName = user?.name ?? '';
}

watch(
  () => [props.modelValue, props.initialApplicationId],
  async ([visible]) => {
    if (!visible) {
      return;
    }
    resetCreateForm();
    if (createForm.applicationId) {
      await loadApplicationContext();
    }
  },
  { immediate: true },
);
</script>

<template>
  <ElDialog
    v-model="dialogVisible"
    title="创建转运单"
    width="1120px"
    @closed="handleDialogClosed"
  >
    <div class="flex flex-col gap-4">
      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        type="error"
        show-icon
      />

      <div class="text-sm text-muted-foreground">
        仅允许已完成核对、已固定完成、已确认且已入库的标本创建转运单。
      </div>

      <ElForm label-width="132px">
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <ElFormItem label="申请单编号" required>
            <ElInput
              v-model="createForm.applicationId"
              placeholder="请输入申请单编号"
              @blur="loadApplicationContext(true)"
              @keyup.enter="loadApplicationContext(true)"
            />
          </ElFormItem>
          <ElFormItem v-if="visibleApplicationNo" label="申请单号">
            <ElInput :model-value="visibleApplicationNo" readonly />
          </ElFormItem>
          <ElFormItem label="交接科室" required>
            <DepartmentSelect
              v-model="createForm.handoverDepartmentId"
              :selected-label="createForm.handoverDepartmentName"
              placeholder="请选择交接科室"
              @change="handleHandoverDepartmentChange"
            />
          </ElFormItem>
          <ElFormItem label="交接人" required>
            <SystemUserSelect
              v-model="createForm.handoverUserId"
              :selected-label="createForm.handoverUserName"
              placeholder="请选择交接人"
              @change="handleHandoverUserChange"
            />
          </ElFormItem>
          <ElFormItem label="接收科室" required>
            <DepartmentSelect
              v-model="createForm.receiverDepartmentId"
              :selected-label="createForm.receiverDepartmentName"
              placeholder="请选择接收科室"
              @change="handleReceiverDepartmentChange"
            />
          </ElFormItem>
          <ElFormItem label="终端编码">
            <ElInput v-model="createForm.terminalCode" placeholder="工作站终端编码" />
          </ElFormItem>
        </div>
        <ElFormItem label="标本选择" required>
          <ElSelect
            v-model="createForm.selectedSpecimenBarcodes"
            collapse-tags
            collapse-tags-tooltip
            filterable
            multiple
            placeholder="请选择当前申请单下已核对、已固定、已确认且已入库的标本"
            style="width: 100%"
          >
            <ElOption
              v-for="specimen in eligibleSpecimens"
              :key="specimen.id"
              :label="formatSpecimenOptionLabel(specimen)"
              :value="specimen.barcode"
            >
              <div class="flex flex-col gap-1 py-1">
                <span class="font-medium text-[14px] text-[var(--el-text-color-primary)]">
                  {{ resolveSpecimenName(specimen) }}
                </span>
                <span class="text-[12px] leading-5 text-[var(--el-text-color-secondary)]">
                  {{ `类型:${resolveSpecimenType(specimen)}` }}
                  <span class="mx-1 text-[var(--el-border-color)]">|</span>
                  {{ `部位:${resolveSpecimenSite(specimen)}` }}
                  <span class="mx-1 text-[var(--el-border-color)]">|</span>
                  {{ `采集方式:${resolveSpecimenCollectionMode(specimen)}` }}
                  <span class="mx-1 text-[var(--el-border-color)]">|</span>
                  {{ `临床症状:${resolveSpecimenClinicalSymptom(specimen)}` }}
                </span>
              </div>
            </ElOption>
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="建单前置条件">
          <div class="text-sm text-[var(--el-text-color-secondary)]">
            仅允许已完成核对、标本固定、标本确认和标本入库的标本创建转运单。
          </div>
        </ElFormItem>
        <ElFormItem label="批量扫码 / 粘贴">
          <ElInput
            v-model="createForm.specimenBarcodesText"
            :rows="4"
            placeholder="支持换行、空格、逗号分隔多个条码"
            type="textarea"
          />
        </ElFormItem>
        <ElFormItem label="备注">
          <ElInput
            v-model="createForm.remarks"
            :rows="2"
            placeholder="补充转运说明"
            type="textarea"
          />
        </ElFormItem>
      </ElForm>
    </div>

    <template #footer>
      <ElButton @click="dialogVisible = false">取消</ElButton>
      <ElButton :loading="createLoading" type="primary" @click="submitCreate">
        创建转运单
      </ElButton>
    </template>
  </ElDialog>
</template>
