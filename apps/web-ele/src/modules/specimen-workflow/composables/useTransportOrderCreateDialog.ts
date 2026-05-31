import type { Ref } from 'vue';

import type { ApplicationDetailView } from '../types/specimen-workflow';

import { computed, reactive, ref, watch } from 'vue';

import { useUserStore } from '@vben/stores';

import { ElMessage } from 'element-plus';

import {
  createTransportOrder,
  getApplicationDetail,
} from '../api/specimen-workflow-service';
import { getWorkflowPageErrorMessage } from '../utils/error';

type DepartmentOption = null | { id: string; name: string };
type UserOption = null | { id: string; name: string };

export function useTransportOrderCreateDialog(options: {
  initialApplicationId: Ref<string>;
  initialApplicationNo: Ref<string>;
  modelValue: Ref<boolean>;
  onCreated: () => void;
  updateModelValue: (value: boolean) => void;
}) {
  const userStore = useUserStore();

  const pageError = ref('');
  const createLoading = ref(false);
  const applicationDetail = ref<ApplicationDetailView | null>(null);

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

  const dialogVisible = computed({
    get: () => options.modelValue.value,
    set: (value: boolean) => options.updateModelValue(value),
  });

  const visibleApplicationNo = computed(() => {
    const applicationId = createForm.applicationId.trim();
    const detail = applicationDetail.value;

    if (detail?.id?.trim() === applicationId) {
      return detail.applicationNo?.trim() ?? '';
    }

    if (options.initialApplicationId.value.trim() === applicationId) {
      return options.initialApplicationNo.value.trim();
    }

    return '';
  });

  function splitSpecimenBarcodes(value: string) {
    return [
      ...new Set(
        value
          .split(/[\s,，；;]+/)
          .map((item) => item.trim())
          .filter(Boolean),
      ),
    ];
  }

  const mergedSpecimenBarcodes = computed(() => {
    const selected = createForm.selectedSpecimenBarcodes;
    const manual = splitSpecimenBarcodes(createForm.specimenBarcodesText);
    return [...new Set([...selected, ...manual])];
  });

  function isEligibleSpecimen(
    specimen: ApplicationDetailView['specimens'][number],
  ) {
    return (
      specimen.verificationStatus === 'VERIFIED' &&
      specimen.fixationStatus === 'COMPLETED' &&
      Boolean(specimen.specimenConfirmedAt) &&
      specimen.checkInStatus === 'CHECKED_IN'
    );
  }

  const eligibleSpecimens = computed(() =>
    (applicationDetail.value?.specimens ?? []).filter((item) =>
      isEligibleSpecimen(item),
    ),
  );

  function clearApplicationContext() {
    applicationDetail.value = null;
    createForm.selectedSpecimenBarcodes = [];
    pageError.value = '';
  }

  function resetCreateForm() {
    Object.assign(createForm, {
      applicationId: options.initialApplicationId.value.trim(),
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
        .filter((item) => isEligibleSpecimen(item))
        .map((item) => item.barcode)
        .filter((barcode) => barcode.length > 0);
    } catch (error) {
      if (createForm.applicationId.trim() === applicationId) {
        clearApplicationContext();
        pageError.value = getWorkflowPageErrorMessage(error);
      }
    }
  }

  function resolveSpecimenName(
    specimen: ApplicationDetailView['specimens'][number],
  ) {
    return specimen.specimenName?.trim() || '未命名标本';
  }

  function resolveSpecimenType(
    specimen: ApplicationDetailView['specimens'][number],
  ) {
    return specimen.specimenType?.trim() || '未填写';
  }

  function resolveSpecimenSite(
    specimen: ApplicationDetailView['specimens'][number],
  ) {
    return (
      specimen.specimenSite?.trim() ||
      applicationDetail.value?.specimenSite?.trim() ||
      '未填写'
    );
  }

  function resolveSpecimenCollectionMode(
    specimen: ApplicationDetailView['specimens'][number],
  ) {
    return specimen.collectionMode?.trim() || '未填写';
  }

  function resolveSpecimenClinicalSymptom(
    specimen: ApplicationDetailView['specimens'][number],
  ) {
    return (
      specimen.clinicalSymptom?.trim() ||
      applicationDetail.value?.clinicalSymptom?.trim() ||
      '未填写'
    );
  }

  function formatSpecimenOptionLabel(
    specimen: ApplicationDetailView['specimens'][number],
  ) {
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
      options.onCreated();
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

  function handleHandoverDepartmentChange(department: DepartmentOption) {
    createForm.handoverDepartmentId = department?.id ?? '';
    createForm.handoverDepartmentName = department?.name ?? '';
  }

  function handleReceiverDepartmentChange(department: DepartmentOption) {
    createForm.receiverDepartmentId = department?.id ?? '';
    createForm.receiverDepartmentName = department?.name ?? '';
  }

  function handleHandoverUserChange(user: UserOption) {
    createForm.handoverUserId = user?.id ?? '';
    createForm.handoverUserName = user?.name ?? '';
  }

  watch(
    () =>
      [options.modelValue.value, options.initialApplicationId.value] as const,
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

  return {
    applicationDetail,
    createForm,
    createLoading,
    dialogVisible,
    eligibleSpecimens,
    formatSpecimenOptionLabel,
    handleDialogClosed,
    handleHandoverDepartmentChange,
    handleHandoverUserChange,
    handleReceiverDepartmentChange,
    loadApplicationContext,
    mergedSpecimenBarcodes,
    pageError,
    resolveSpecimenClinicalSymptom,
    resolveSpecimenCollectionMode,
    resolveSpecimenName,
    resolveSpecimenSite,
    resolveSpecimenType,
    splitSpecimenBarcodes,
    submitCreate,
    visibleApplicationNo,
  };
}
