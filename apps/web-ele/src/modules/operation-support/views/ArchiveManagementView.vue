<script setup lang="ts">
import type {
  ArchiveApplicationFormRequest,
  ArchiveCabinetView,
  ArchiveEmbeddingBoxRequest,
  ArchivePositionView,
  ArchiveRecordView,
  ArchiveSlideRequest,
  MaterialLoanView,
} from '../types/operation-support';
import type { PositionWorkbenchRow } from '../utils/archive-workbench';

import { computed, reactive, ref, watch } from 'vue';

import { Fallback, Page } from '@vben/common-ui';
import { useAccessStore, useUserStore } from '@vben/stores';

import {
  ElAlert,
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import {
  archiveApplicationForm,
  archiveEmbeddingBox,
  archiveSlide,
  createArchiveCabinet,
  createMaterialLoan,
  listArchiveCabinets,
  listAvailableArchivePositions,
  listPendingMaterialLoans,
  returnMaterialLoan,
  searchArchiveRecords,
  updateArchiveCabinet,
} from '../api/operation-support-service';
import OperationSectionCard from '../components/OperationSectionCard.vue';
import {
  ARCHIVE_CABINET_STATUS_OPTIONS,
  ARCHIVE_CABINET_TYPE_OPTIONS,
  ARCHIVE_OBJECT_TYPE_OPTIONS,
  M5_ARCHIVE_PAGE_AUTHORITIES,
  M5_PERMISSION_CODES,
  MATERIAL_TYPE_OPTIONS,
} from '../constants';
import {
  buildArchivePositionRows,
  buildPositionCode,
  getArchiveStatusTagType,
  getCabinetStatusTagType,
  getLoanStatusTagType,
  getPositionStatusTagType,
  getToggleCabinetActionLabel,
  summarizeArchivePositions,
} from '../utils/archive-workbench';
import { getOperationSupportPageErrorMessage } from '../utils/error';
import {
  formatArchiveCabinetStatus,
  formatArchiveCabinetType,
  formatArchiveObjectType,
  formatArchivePositionStatus,
  formatArchiveStorageStatus,
  formatMaterialLoanStatus,
  formatMaterialType,
  formatNullable,
} from '../utils/format';

type CabinetFormState = {
  cabinetCode: string;
  cabinetName: string;
  cabinetStatus: string;
  cabinetType: string;
  layerCount: number;
  locationDescription: string;
  operatorName: string;
  operatorUserId: string;
  remarks: string;
  slotCountPerLayer: number;
  terminalCode: string;
};

type ArchiveFormState = {
  caseId: string;
  embeddingBoxId: string;
  fileName: string;
  fileUrl: string;
  objectType: string;
  operatorName: string;
  operatorUserId: string;
  remarks: string;
  slideId: string;
  terminalCode: string;
};

type LoanFormState = {
  borrowedByName: string;
  borrowedByUserId: string;
  borrowPurpose: string;
  materialId: string;
  materialType: string;
  operatorName: string;
  operatorUserId: string;
  remarks: string;
  terminalCode: string;
};

type ReturnFormState = {
  operatorName: string;
  operatorUserId: string;
  remarks: string;
  terminalCode: string;
};

const accessStore = useAccessStore();
const userStore = useUserStore();

const accessCodeSet = computed(() => new Set(accessStore.accessCodes));
const canViewArchivePage = computed(() =>
  M5_ARCHIVE_PAGE_AUTHORITIES.some((code) => accessCodeSet.value.has(code)),
);
const canQueryCabinets = computed(() =>
  accessCodeSet.value.has(M5_PERMISSION_CODES.ARCHIVE_CABINET_QUERY),
);
const canCreateCabinet = computed(() =>
  accessCodeSet.value.has(M5_PERMISSION_CODES.ARCHIVE_CABINET_CREATE),
);
const canUpdateCabinet = computed(() =>
  accessCodeSet.value.has(M5_PERMISSION_CODES.ARCHIVE_CABINET_UPDATE),
);
const canArchiveApplicationForm = computed(() =>
  accessCodeSet.value.has(M5_PERMISSION_CODES.APPLICATION_FORM_ARCHIVE),
);
const canArchiveEmbeddingBox = computed(() =>
  accessCodeSet.value.has(M5_PERMISSION_CODES.EMBEDDING_BOX_ARCHIVE),
);
const canArchiveSlide = computed(() =>
  accessCodeSet.value.has(M5_PERMISSION_CODES.SLIDE_ARCHIVE),
);
const canQueryRecords = computed(() =>
  accessCodeSet.value.has(M5_PERMISSION_CODES.ARCHIVE_QUERY),
);
const canCreateLoan = computed(() =>
  accessCodeSet.value.has(M5_PERMISSION_CODES.LOAN_CREATE),
);
const canQueryLoans = computed(() =>
  accessCodeSet.value.has(M5_PERMISSION_CODES.LOAN_QUERY),
);
const canReturnLoan = computed(() =>
  accessCodeSet.value.has(M5_PERMISSION_CODES.LOAN_RETURN),
);

const currentOperatorName = computed(
  () => userStore.userInfo?.realName?.trim() ?? '',
);
const currentOperatorUserId = computed(
  () => userStore.userInfo?.userId?.trim() ?? '',
);

const loading = reactive({
  cabinets: false,
  loans: false,
  positions: false,
  records: false,
});
const submitting = ref(false);
const cabinetError = ref('');
const loanError = ref('');
const positionError = ref('');
const recordError = ref('');

const cabinets = ref<ArchiveCabinetView[]>([]);
const availablePositions = ref<ArchivePositionView[]>([]);
const records = ref<ArchiveRecordView[]>([]);
const pendingLoans = ref<MaterialLoanView[]>([]);
const selectedPositionCode = ref('');
const editingCabinet = ref<ArchiveCabinetView | null>(null);
const returningLoan = ref<MaterialLoanView | null>(null);
const cabinetDialogMode = ref<'create' | 'edit' | null>(null);

const cabinetDialogVisible = computed({
  get: () => cabinetDialogMode.value !== null,
  set: (visible: boolean) => {
    if (!visible) {
      closeCabinetDialog();
    }
  },
});
const returnDialogVisible = computed({
  get: () => returningLoan.value !== null,
  set: (visible: boolean) => {
    if (!visible) {
      closeReturnDialog();
    }
  },
});
const isEditingCabinet = computed(() => cabinetDialogMode.value === 'edit');

const cabinetForm = reactive<CabinetFormState>({
  cabinetCode: '',
  cabinetName: '',
  cabinetStatus: 'ACTIVE',
  cabinetType: 'STANDARD',
  layerCount: 1,
  locationDescription: '',
  operatorName: '',
  operatorUserId: '',
  remarks: '',
  slotCountPerLayer: 10,
  terminalCode: '',
});

const archiveForm = reactive<ArchiveFormState>({
  caseId: '',
  embeddingBoxId: '',
  fileName: '',
  fileUrl: '',
  objectType: 'APPLICATION_FORM',
  operatorName: '',
  operatorUserId: '',
  remarks: '',
  slideId: '',
  terminalCode: '',
});

const loanForm = reactive<LoanFormState>({
  borrowPurpose: '',
  borrowedByName: '',
  borrowedByUserId: '',
  materialId: '',
  materialType: 'SLIDE',
  operatorName: '',
  operatorUserId: '',
  remarks: '',
  terminalCode: '',
});

const returnForm = reactive<ReturnFormState>({
  operatorName: '',
  operatorUserId: '',
  remarks: '',
  terminalCode: '',
});

const positionFilters = reactive({
  cabinetId: '',
  cabinetType: '',
});

const recordFilters = reactive({
  caseId: '',
  keyword: '',
  objectType: '',
});

const loanFilters = reactive({
  keyword: '',
  materialType: '',
});

const filteredCabinets = computed(() =>
  cabinets.value
    .filter((cabinet) => {
      if (
        positionFilters.cabinetId &&
        cabinet.id !== positionFilters.cabinetId
      ) {
        return false;
      }
      if (
        positionFilters.cabinetType &&
        cabinet.cabinetType !== positionFilters.cabinetType
      ) {
        return false;
      }
      return true;
    })
    .toSorted((left, right) =>
      left.cabinetCode.localeCompare(right.cabinetCode),
    ),
);

const positionRows = computed<PositionWorkbenchRow[]>(() => {
  return buildArchivePositionRows(
    filteredCabinets.value,
    availablePositions.value,
  );
});

const selectedPosition = computed(
  () =>
    positionRows.value.find(
      (position) =>
        position.positionCode === selectedPositionCode.value &&
        position.selectable,
    ) ?? null,
);

const positionSummary = computed(() =>
  summarizeArchivePositions(positionRows.value),
);

const cabinetCapacityPreview = computed(
  () => cabinetForm.layerCount * cabinetForm.slotCountPerLayer,
);
const cabinetPositionRulePreview = computed(() =>
  cabinetForm.cabinetCode
    ? buildPositionCode(cabinetForm.cabinetCode.trim(), 1, 1)
    : 'CAB-01-L1-S1',
);
const selectedPositionLabel = computed(
  () => selectedPosition.value?.positionCode || '未选择柜位',
);
const selectedReturnPositionId = computed(() => selectedPosition.value?.id);
const selectedReturnPositionDescription = computed(() => {
  if (!selectedPosition.value) {
    return '未指定替代柜位时，系统默认归还到原始归档柜位；若原柜位不可用，后端会要求选择新的可用柜位。';
  }
  return `当前会将 ${selectedPosition.value.positionCode} 作为归还替代柜位。`;
});
const archiveSubmitButtonText = computed(() => {
  if (archiveForm.objectType === 'EMBEDDING_BOX') {
    return '提交蜡块归档';
  }
  if (archiveForm.objectType === 'SLIDE') {
    return '提交玻片归档';
  }
  return '提交申请单归档';
});
const archivePermissionWarning = computed(() => {
  if (
    archiveForm.objectType === 'EMBEDDING_BOX' &&
    !canArchiveEmbeddingBox.value
  ) {
    return '当前账号缺少蜡块归档权限。';
  }
  if (archiveForm.objectType === 'SLIDE' && !canArchiveSlide.value) {
    return '当前账号缺少玻片归档权限。';
  }
  if (
    archiveForm.objectType === 'APPLICATION_FORM' &&
    !canArchiveApplicationForm.value
  ) {
    return '当前账号缺少申请单归档权限。';
  }
  if (!canQueryCabinets.value) {
    return '当前账号缺少归档柜查询权限，无法选择归档柜位。';
  }
  return '';
});
const canSubmitArchive = computed(() => !archivePermissionWarning.value);

watch(
  () => currentOperatorName.value,
  (operatorName) => {
    populateOperatorDefaults(operatorName, currentOperatorUserId.value);
  },
  { immediate: true },
);

watch(
  () => currentOperatorUserId.value,
  (operatorUserId) => {
    populateOperatorDefaults(currentOperatorName.value, operatorUserId);
  },
  { immediate: true },
);

watch(positionRows, (rows) => {
  if (
    selectedPositionCode.value &&
    !rows.some(
      (row) =>
        row.positionCode === selectedPositionCode.value && row.selectable,
    )
  ) {
    selectedPositionCode.value = '';
  }
});

watch(
  () => archiveForm.objectType,
  () => {
    archiveForm.caseId = '';
    archiveForm.embeddingBoxId = '';
    archiveForm.fileName = '';
    archiveForm.fileUrl = '';
    archiveForm.remarks = '';
    archiveForm.slideId = '';
  },
);

function populateOperatorDefaults(
  operatorName: string,
  operatorUserId: string,
) {
  if (!cabinetForm.operatorName && operatorName) {
    cabinetForm.operatorName = operatorName;
  }
  if (!cabinetForm.operatorUserId && operatorUserId) {
    cabinetForm.operatorUserId = operatorUserId;
  }
  if (!archiveForm.operatorName && operatorName) {
    archiveForm.operatorName = operatorName;
  }
  if (!archiveForm.operatorUserId && operatorUserId) {
    archiveForm.operatorUserId = operatorUserId;
  }
  if (!loanForm.operatorName && operatorName) {
    loanForm.operatorName = operatorName;
  }
  if (!loanForm.operatorUserId && operatorUserId) {
    loanForm.operatorUserId = operatorUserId;
  }
  if (!returnForm.operatorName && operatorName) {
    returnForm.operatorName = operatorName;
  }
  if (!returnForm.operatorUserId && operatorUserId) {
    returnForm.operatorUserId = operatorUserId;
  }
}

function createCabinetFormDefaults(): CabinetFormState {
  return {
    cabinetCode: '',
    cabinetName: '',
    cabinetStatus: 'ACTIVE',
    cabinetType: 'STANDARD',
    layerCount: 1,
    locationDescription: '',
    operatorName: currentOperatorName.value,
    operatorUserId: currentOperatorUserId.value,
    remarks: '',
    slotCountPerLayer: 10,
    terminalCode: '',
  };
}

function applyCabinetFormState(nextState: CabinetFormState) {
  cabinetForm.cabinetCode = nextState.cabinetCode;
  cabinetForm.cabinetName = nextState.cabinetName;
  cabinetForm.cabinetStatus = nextState.cabinetStatus;
  cabinetForm.cabinetType = nextState.cabinetType;
  cabinetForm.layerCount = nextState.layerCount;
  cabinetForm.locationDescription = nextState.locationDescription;
  cabinetForm.operatorName = nextState.operatorName;
  cabinetForm.operatorUserId = nextState.operatorUserId;
  cabinetForm.remarks = nextState.remarks;
  cabinetForm.slotCountPerLayer = nextState.slotCountPerLayer;
  cabinetForm.terminalCode = nextState.terminalCode;
}

function closeCabinetDialog() {
  cabinetDialogMode.value = null;
  editingCabinet.value = null;
  applyCabinetFormState(createCabinetFormDefaults());
}

function openCreateCabinetDialog() {
  cabinetDialogMode.value = 'create';
  editingCabinet.value = null;
  applyCabinetFormState(createCabinetFormDefaults());
}

function openEditCabinetDialog(cabinet: ArchiveCabinetView) {
  cabinetDialogMode.value = 'edit';
  editingCabinet.value = cabinet;
  applyCabinetFormState({
    cabinetCode: cabinet.cabinetCode,
    cabinetName: cabinet.cabinetName,
    cabinetStatus: cabinet.cabinetStatus,
    cabinetType: cabinet.cabinetType,
    layerCount: cabinet.layerCount,
    locationDescription: cabinet.locationDescription ?? '',
    operatorName: currentOperatorName.value,
    operatorUserId: currentOperatorUserId.value,
    remarks: cabinet.remarks ?? '',
    slotCountPerLayer: cabinet.slotCountPerLayer,
    terminalCode: '',
  });
}

function createReturnFormDefaults(): ReturnFormState {
  return {
    operatorName: currentOperatorName.value,
    operatorUserId: currentOperatorUserId.value,
    remarks: '',
    terminalCode: '',
  };
}

function closeReturnDialog() {
  returningLoan.value = null;
  returnForm.operatorName = createReturnFormDefaults().operatorName;
  returnForm.operatorUserId = createReturnFormDefaults().operatorUserId;
  returnForm.remarks = '';
  returnForm.terminalCode = '';
}

function openReturnDialog(loan: MaterialLoanView) {
  returningLoan.value = loan;
  const defaults = createReturnFormDefaults();
  returnForm.operatorName = defaults.operatorName;
  returnForm.operatorUserId = defaults.operatorUserId;
  returnForm.remarks = '';
  returnForm.terminalCode = '';
}

function selectPosition(position: PositionWorkbenchRow) {
  if (!position.selectable) {
    return;
  }

  selectedPositionCode.value = position.positionCode;
  ElMessage.success(`已选择柜位 ${position.positionCode}`);
}

function clearSelectedPosition() {
  selectedPositionCode.value = '';
}

function getArchivePermissionForObjectType(objectType: string) {
  if (objectType === 'EMBEDDING_BOX') {
    return canArchiveEmbeddingBox.value;
  }
  if (objectType === 'SLIDE') {
    return canArchiveSlide.value;
  }
  return canArchiveApplicationForm.value;
}

async function loadCabinets() {
  if (!canQueryCabinets.value) {
    cabinets.value = [];
    cabinetError.value = '';
    return;
  }

  loading.cabinets = true;
  cabinetError.value = '';

  try {
    cabinets.value = await listArchiveCabinets();
  } catch (error) {
    cabinetError.value = getOperationSupportPageErrorMessage(error);
  } finally {
    loading.cabinets = false;
  }
}

async function loadPositions() {
  if (!canQueryCabinets.value) {
    availablePositions.value = [];
    positionError.value = '';
    return;
  }

  loading.positions = true;
  positionError.value = '';

  try {
    availablePositions.value = await listAvailableArchivePositions({
      cabinetId: positionFilters.cabinetId || undefined,
      cabinetType: positionFilters.cabinetType || undefined,
    });
  } catch (error) {
    positionError.value = getOperationSupportPageErrorMessage(error);
  } finally {
    loading.positions = false;
  }
}

async function loadRecords() {
  if (!canQueryRecords.value) {
    records.value = [];
    recordError.value = '';
    return;
  }

  loading.records = true;
  recordError.value = '';

  try {
    records.value = await searchArchiveRecords({
      caseId: recordFilters.caseId.trim() || undefined,
      keyword: recordFilters.keyword.trim() || undefined,
      objectType: recordFilters.objectType || undefined,
    });
  } catch (error) {
    recordError.value = getOperationSupportPageErrorMessage(error);
  } finally {
    loading.records = false;
  }
}

async function loadLoans() {
  if (!canQueryLoans.value) {
    pendingLoans.value = [];
    loanError.value = '';
    return;
  }

  loading.loans = true;
  loanError.value = '';

  try {
    pendingLoans.value = await listPendingMaterialLoans({
      keyword: loanFilters.keyword.trim() || undefined,
      materialType: loanFilters.materialType || undefined,
    });
  } catch (error) {
    loanError.value = getOperationSupportPageErrorMessage(error);
  } finally {
    loading.loans = false;
  }
}

function validateCabinetForm() {
  if (!cabinetForm.cabinetName.trim()) {
    ElMessage.warning('请填写归档柜名称。');
    return false;
  }
  if (!cabinetForm.operatorName.trim()) {
    ElMessage.warning('请填写操作人。');
    return false;
  }
  if (cabinetDialogMode.value === 'create' && !cabinetForm.cabinetCode.trim()) {
    ElMessage.warning('新增归档柜时必须填写归档柜编号。');
    return false;
  }
  if (cabinetForm.layerCount < 1 || cabinetForm.slotCountPerLayer < 1) {
    ElMessage.warning('层数和每层柜位数必须大于 0。');
    return false;
  }
  return true;
}

function validateArchiveForm() {
  if (!getArchivePermissionForObjectType(archiveForm.objectType)) {
    ElMessage.warning(archivePermissionWarning.value);
    return false;
  }
  if (!canQueryCabinets.value || !selectedPosition.value) {
    ElMessage.warning('请先在柜位工作站中选择一个可用柜位。');
    return false;
  }
  if (!archiveForm.operatorName.trim()) {
    ElMessage.warning('请填写归档操作人。');
    return false;
  }
  if (archiveForm.objectType === 'APPLICATION_FORM') {
    if (!archiveForm.caseId.trim()) {
      ElMessage.warning('申请单归档必须填写病例 ID。');
      return false;
    }
    return true;
  }
  if (
    archiveForm.objectType === 'EMBEDDING_BOX' &&
    !archiveForm.embeddingBoxId.trim()
  ) {
    ElMessage.warning('蜡块归档必须填写蜡块 ID。');
    return false;
  }
  if (archiveForm.objectType === 'SLIDE' && !archiveForm.slideId.trim()) {
    ElMessage.warning('玻片归档必须填写玻片 ID。');
    return false;
  }
  return true;
}

function validateLoanForm() {
  if (!canCreateLoan.value) {
    ElMessage.warning('当前账号缺少借出权限。');
    return false;
  }
  if (!loanForm.materialId.trim()) {
    ElMessage.warning('请填写借出材料 ID。');
    return false;
  }
  if (!loanForm.borrowedByName.trim()) {
    ElMessage.warning('请填写借阅人姓名。');
    return false;
  }
  if (!loanForm.operatorName.trim()) {
    ElMessage.warning('请填写借出操作人。');
    return false;
  }
  return true;
}

function validateReturnForm() {
  if (!canReturnLoan.value) {
    ElMessage.warning('当前账号缺少归还权限。');
    return false;
  }
  if (!returningLoan.value) {
    ElMessage.warning('请先选择待归还记录。');
    return false;
  }
  if (!returnForm.operatorName.trim()) {
    ElMessage.warning('请填写归还操作人。');
    return false;
  }
  return true;
}

function resetArchiveForm() {
  archiveForm.caseId = '';
  archiveForm.embeddingBoxId = '';
  archiveForm.fileName = '';
  archiveForm.fileUrl = '';
  archiveForm.objectType = 'APPLICATION_FORM';
  archiveForm.operatorName = currentOperatorName.value;
  archiveForm.operatorUserId = currentOperatorUserId.value;
  archiveForm.remarks = '';
  archiveForm.slideId = '';
  archiveForm.terminalCode = '';
}

function resetLoanForm() {
  loanForm.borrowPurpose = '';
  loanForm.borrowedByName = '';
  loanForm.borrowedByUserId = '';
  loanForm.materialId = '';
  loanForm.materialType = 'SLIDE';
  loanForm.operatorName = currentOperatorName.value;
  loanForm.operatorUserId = currentOperatorUserId.value;
  loanForm.remarks = '';
  loanForm.terminalCode = '';
}

async function refreshArchiveWorkspace() {
  const tasks: Array<Promise<unknown>> = [];

  if (canQueryCabinets.value) {
    tasks.push(loadPositions());
  }
  if (canQueryRecords.value) {
    tasks.push(loadRecords());
  }
  if (canQueryLoans.value) {
    tasks.push(loadLoans());
  }

  if (tasks.length > 0) {
    await Promise.all(tasks);
  }
}

async function submitCabinet() {
  if (!validateCabinetForm()) {
    return;
  }

  submitting.value = true;

  try {
    if (cabinetDialogMode.value === 'edit' && editingCabinet.value) {
      await updateArchiveCabinet(editingCabinet.value.id, {
        cabinetName: cabinetForm.cabinetName.trim(),
        cabinetStatus: cabinetForm.cabinetStatus,
        locationDescription:
          cabinetForm.locationDescription.trim() || undefined,
        operatorName: cabinetForm.operatorName.trim(),
        operatorUserId: cabinetForm.operatorUserId.trim() || undefined,
        remarks: cabinetForm.remarks.trim() || undefined,
        terminalCode: cabinetForm.terminalCode.trim() || undefined,
      });
      ElMessage.success('归档柜信息已更新。');
    } else {
      await createArchiveCabinet({
        cabinetCode: cabinetForm.cabinetCode.trim(),
        cabinetName: cabinetForm.cabinetName.trim(),
        cabinetType: cabinetForm.cabinetType,
        layerCount: cabinetForm.layerCount,
        locationDescription:
          cabinetForm.locationDescription.trim() || undefined,
        operatorName: cabinetForm.operatorName.trim(),
        operatorUserId: cabinetForm.operatorUserId.trim() || undefined,
        remarks: cabinetForm.remarks.trim() || undefined,
        slotCountPerLayer: cabinetForm.slotCountPerLayer,
        terminalCode: cabinetForm.terminalCode.trim() || undefined,
      });
      ElMessage.success('归档柜已创建，系统已同步生成柜位。');
    }

    closeCabinetDialog();
    await Promise.all([loadCabinets(), loadPositions()]);
  } catch (error) {
    ElMessage.error(getOperationSupportPageErrorMessage(error));
  } finally {
    submitting.value = false;
  }
}

async function toggleCabinetStatus(cabinet: ArchiveCabinetView) {
  if (!currentOperatorName.value) {
    ElMessage.warning(
      '当前登录账号缺少操作人姓名，请通过编辑弹窗补充后再执行启停。',
    );
    return;
  }

  submitting.value = true;

  try {
    await updateArchiveCabinet(cabinet.id, {
      cabinetName: cabinet.cabinetName,
      cabinetStatus:
        cabinet.cabinetStatus === 'DISABLED' ? 'ACTIVE' : 'DISABLED',
      locationDescription: cabinet.locationDescription ?? undefined,
      operatorName: currentOperatorName.value,
      operatorUserId: currentOperatorUserId.value || undefined,
      remarks: cabinet.remarks ?? undefined,
    });

    ElMessage.success(
      `归档柜已${cabinet.cabinetStatus === 'DISABLED' ? '启用' : '停用'}。`,
    );
    await Promise.all([loadCabinets(), loadPositions()]);
  } catch (error) {
    ElMessage.error(getOperationSupportPageErrorMessage(error));
  } finally {
    submitting.value = false;
  }
}

async function submitArchive() {
  if (!validateArchiveForm() || !selectedPosition.value) {
    return;
  }

  submitting.value = true;

  try {
    if (archiveForm.objectType === 'APPLICATION_FORM') {
      const request: ArchiveApplicationFormRequest = {
        archivePositionId: selectedPosition.value.id,
        caseId: archiveForm.caseId.trim(),
        fileName: archiveForm.fileName.trim() || undefined,
        fileUrl: archiveForm.fileUrl.trim() || undefined,
        operatorName: archiveForm.operatorName.trim(),
        operatorUserId: archiveForm.operatorUserId.trim() || undefined,
        remarks: archiveForm.remarks.trim() || undefined,
        terminalCode: archiveForm.terminalCode.trim() || undefined,
      };
      await archiveApplicationForm(request);
      ElMessage.success('申请单归档已完成。');
    } else if (archiveForm.objectType === 'EMBEDDING_BOX') {
      const request: ArchiveEmbeddingBoxRequest = {
        archivePositionId: selectedPosition.value.id,
        embeddingBoxId: archiveForm.embeddingBoxId.trim(),
        operatorName: archiveForm.operatorName.trim(),
        operatorUserId: archiveForm.operatorUserId.trim() || undefined,
        remarks: archiveForm.remarks.trim() || undefined,
        terminalCode: archiveForm.terminalCode.trim() || undefined,
      };
      await archiveEmbeddingBox(request);
      ElMessage.success('蜡块归档已完成。');
    } else {
      const request: ArchiveSlideRequest = {
        archivePositionId: selectedPosition.value.id,
        operatorName: archiveForm.operatorName.trim(),
        operatorUserId: archiveForm.operatorUserId.trim() || undefined,
        remarks: archiveForm.remarks.trim() || undefined,
        slideId: archiveForm.slideId.trim(),
        terminalCode: archiveForm.terminalCode.trim() || undefined,
      };
      await archiveSlide(request);
      ElMessage.success('玻片归档已完成。');
    }

    resetArchiveForm();
    await refreshArchiveWorkspace();
  } catch (error) {
    ElMessage.error(getOperationSupportPageErrorMessage(error));
  } finally {
    submitting.value = false;
  }
}

async function submitLoan() {
  if (!validateLoanForm()) {
    return;
  }

  submitting.value = true;

  try {
    await createMaterialLoan({
      borrowPurpose: loanForm.borrowPurpose.trim() || undefined,
      borrowedByName: loanForm.borrowedByName.trim(),
      borrowedByUserId: loanForm.borrowedByUserId.trim() || undefined,
      materialId: loanForm.materialId.trim(),
      materialType: loanForm.materialType,
      operatorName: loanForm.operatorName.trim(),
      operatorUserId: loanForm.operatorUserId.trim() || undefined,
      remarks: loanForm.remarks.trim() || undefined,
      terminalCode: loanForm.terminalCode.trim() || undefined,
    });
    ElMessage.success('材料借出已登记。');
    resetLoanForm();
    await refreshArchiveWorkspace();
  } catch (error) {
    ElMessage.error(getOperationSupportPageErrorMessage(error));
  } finally {
    submitting.value = false;
  }
}

async function submitReturn() {
  if (!validateReturnForm() || !returningLoan.value) {
    return;
  }

  submitting.value = true;

  try {
    await returnMaterialLoan(returningLoan.value.loanId, {
      archivePositionId: selectedReturnPositionId.value,
      operatorName: returnForm.operatorName.trim(),
      operatorUserId: returnForm.operatorUserId.trim() || undefined,
      remarks: returnForm.remarks.trim() || undefined,
      terminalCode: returnForm.terminalCode.trim() || undefined,
    });
    ElMessage.success('材料归还已完成。');
    closeReturnDialog();
    await refreshArchiveWorkspace();
  } catch (error) {
    ElMessage.error(getOperationSupportPageErrorMessage(error));
  } finally {
    submitting.value = false;
  }
}

async function initializePage() {
  if (!canViewArchivePage.value) {
    return;
  }

  const tasks: Array<Promise<unknown>> = [];

  if (canQueryCabinets.value) {
    tasks.push(loadCabinets(), loadPositions());
  }
  if (canQueryRecords.value) {
    tasks.push(loadRecords());
  }
  if (canQueryLoans.value) {
    tasks.push(loadLoans());
  }

  if (tasks.length > 0) {
    await Promise.all(tasks);
  }
}

void initializePage();
</script>

<template>
  <div
    v-if="!canViewArchivePage"
    class="flex min-h-[360px] items-center justify-center"
  >
    <Fallback status="403" />
  </div>

  <Page
    v-else
    title="归档管理"
    description="统一处理申请单、蜡块、玻片归档，以及借出、待归还和归还工作站。"
  >
    <div class="flex flex-col gap-4">
      <ElAlert :closable="false" title="医生工作台状态回流" type="info">
        <template #default>
          申请单归档后，医生工作台会通过既有接口回流
          `applicationFormArchiveStatus`、`applicationFormArchiveLocation` 与
          `applicationFormImageUrl`； 蜡块、玻片借出与归还后，医生工作台中的
          `archiveStatus`、`archiveLocation` 与 `loanStatus`
          会随着后端聚合结果刷新。
        </template>
      </ElAlert>

      <ElAlert
        :closable="false"
        title="柜位编码规则：${cabinetCode}-L${layerNo}-S${slotNo}"
        type="info"
      >
        <template #default>
          柜位查询会展示完整柜位视图：可用柜位可直接选择，未返回的活动柜位视为“已占用”，停用归档柜下的柜位统一标记为“已停用”。
        </template>
      </ElAlert>

      <OperationSectionCard
        title="归档柜工作站"
        description="查看、创建、编辑归档柜，并执行启用或停用。"
      >
        <template #extra>
          <ElButton
            :disabled="!canCreateCabinet"
            :title="canCreateCabinet ? undefined : '当前账号缺少归档柜新增权限'"
            type="primary"
            @click="openCreateCabinetDialog"
          >
            新增归档柜
          </ElButton>
        </template>

        <ElAlert v-if="!canQueryCabinets" :closable="false" type="warning">
          <template #title>
            当前账号缺少归档柜查询权限，无法查看归档柜与柜位工作站。
          </template>
        </ElAlert>

        <template v-else>
          <ElAlert
            v-if="cabinetError"
            :closable="false"
            class="mb-4"
            :title="cabinetError"
            show-icon
            type="error"
          />

          <ElAlert
            v-if="!canCreateCabinet || !canUpdateCabinet"
            :closable="false"
            class="mb-4"
            type="warning"
          >
            <template #title>
              当前账号具备归档柜查询权限，但部分维护能力受限。
            </template>
            <template #default>
              <span v-if="!canCreateCabinet">未授权新增归档柜。</span>
              <span v-if="!canCreateCabinet && !canUpdateCabinet"> </span>
              <span v-if="!canUpdateCabinet">未授权更新或启停归档柜。</span>
            </template>
          </ElAlert>

          <ElTable v-loading="loading.cabinets" :data="cabinets" border>
            <ElTableColumn
              label="归档柜编号"
              min-width="150"
              prop="cabinetCode"
            />
            <ElTableColumn
              label="归档柜名称"
              min-width="180"
              prop="cabinetName"
            />
            <ElTableColumn label="柜体类型" min-width="120">
              <template #default="{ row }">
                {{ formatArchiveCabinetType(row.cabinetType) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="容量" min-width="120">
              <template #default="{ row }">
                {{ row.layerCount }} 层 × {{ row.slotCountPerLayer }} 位 =
                {{ row.capacity }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="状态" min-width="100">
              <template #default="{ row }">
                <ElTag :type="getCabinetStatusTagType(row.cabinetStatus)">
                  {{ formatArchiveCabinetStatus(row.cabinetStatus) }}
                </ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn label="位置说明" min-width="180">
              <template #default="{ row }">
                {{ formatNullable(row.locationDescription) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="备注" min-width="180">
              <template #default="{ row }">
                {{ formatNullable(row.remarks) }}
              </template>
            </ElTableColumn>
            <ElTableColumn fixed="right" label="操作" min-width="170">
              <template #default="{ row }">
                <div class="flex items-center gap-2">
                  <ElButton
                    :disabled="!canUpdateCabinet"
                    link
                    type="primary"
                    @click="openEditCabinetDialog(row)"
                  >
                    编辑
                  </ElButton>
                  <ElButton
                    :disabled="!canUpdateCabinet"
                    link
                    type="primary"
                    @click="toggleCabinetStatus(row)"
                  >
                    {{ getToggleCabinetActionLabel(row.cabinetStatus) }}
                  </ElButton>
                </div>
              </template>
            </ElTableColumn>
          </ElTable>
        </template>
      </OperationSectionCard>

      <OperationSectionCard
        title="柜位查询与选择"
        description="按归档柜或柜体类型查询柜位，并为归档或替代归还选择当前可用柜位。"
      >
        <template v-if="!canQueryCabinets">
          <ElAlert :closable="false" type="warning">
            <template #title>
              当前账号缺少归档柜查询权限，无法查询可用柜位。
            </template>
            <template #default>
              若需要执行归档或为归还指定替代柜位，请先补齐 M5 归档柜查询权限。
            </template>
          </ElAlert>
        </template>

        <template v-else>
          <ElAlert
            v-if="positionError"
            :closable="false"
            class="mb-4"
            :title="positionError"
            show-icon
            type="error"
          />

          <ElForm inline label-width="96px">
            <ElFormItem label="归档柜">
              <ElSelect
                v-model="positionFilters.cabinetId"
                clearable
                filterable
                placeholder="全部归档柜"
                style="width: 240px"
              >
                <ElOption
                  v-for="cabinet in cabinets"
                  :key="cabinet.id"
                  :label="`${cabinet.cabinetCode} ${cabinet.cabinetName}`"
                  :value="cabinet.id"
                />
              </ElSelect>
            </ElFormItem>
            <ElFormItem label="柜体类型">
              <ElSelect
                v-model="positionFilters.cabinetType"
                clearable
                placeholder="全部类型"
                style="width: 180px"
              >
                <ElOption
                  v-for="option in ARCHIVE_CABINET_TYPE_OPTIONS"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </ElSelect>
            </ElFormItem>
            <ElFormItem>
              <ElButton
                :loading="loading.positions"
                type="primary"
                @click="loadPositions"
              >
                查询柜位
              </ElButton>
              <ElButton
                :disabled="!selectedPosition"
                @click="clearSelectedPosition"
              >
                清空选择
              </ElButton>
            </ElFormItem>
          </ElForm>

          <div class="mt-4 grid gap-4 md:grid-cols-4">
            <div class="rounded-lg border border-[var(--el-border-color)] p-4">
              <div class="text-sm text-[var(--el-text-color-secondary)]">
                柜位总数
              </div>
              <div class="mt-2 text-2xl font-semibold">
                {{ positionSummary.total }}
              </div>
            </div>
            <div class="rounded-lg border border-[var(--el-border-color)] p-4">
              <div class="text-sm text-[var(--el-text-color-secondary)]">
                可用柜位
              </div>
              <div
                class="mt-2 text-2xl font-semibold text-[var(--el-color-success)]"
              >
                {{ positionSummary.available }}
              </div>
            </div>
            <div class="rounded-lg border border-[var(--el-border-color)] p-4">
              <div class="text-sm text-[var(--el-text-color-secondary)]">
                已占用柜位
              </div>
              <div
                class="mt-2 text-2xl font-semibold text-[var(--el-color-warning)]"
              >
                {{ positionSummary.occupied }}
              </div>
            </div>
            <div class="rounded-lg border border-[var(--el-border-color)] p-4">
              <div class="text-sm text-[var(--el-text-color-secondary)]">
                已停用柜位
              </div>
              <div
                class="mt-2 text-2xl font-semibold text-[var(--el-text-color-secondary)]"
              >
                {{ positionSummary.disabled }}
              </div>
            </div>
          </div>

          <div
            class="mt-4 rounded-lg border border-dashed border-[var(--el-border-color)] p-4"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <div class="text-sm text-[var(--el-text-color-secondary)]">
                  当前选中柜位
                </div>
                <div class="mt-2 text-base font-medium">
                  {{ selectedPositionLabel }}
                </div>
                <div class="mt-1 text-sm text-[var(--el-text-color-secondary)]">
                  <template v-if="selectedPosition">
                    {{ selectedPosition.cabinetCode }} / 第
                    {{ selectedPosition.layerNo }} 层 / 第
                    {{ selectedPosition.slotNo }} 位
                  </template>
                  <template v-else>
                    暂未选择柜位，可在下表中从“可用”柜位执行选择。
                  </template>
                </div>
              </div>
              <ElTag v-if="selectedPosition" type="success">
                可直接用于归档 / 替代归还
              </ElTag>
            </div>
          </div>

          <ElTable
            v-loading="loading.positions"
            :data="positionRows"
            border
            class="mt-4"
          >
            <ElTableColumn
              label="柜位编码"
              min-width="180"
              prop="positionCode"
            />
            <ElTableColumn label="归档柜" min-width="180">
              <template #default="{ row }">
                {{ row.cabinetCode }} {{ row.cabinetName }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="柜体类型" min-width="120">
              <template #default="{ row }">
                {{ formatArchiveCabinetType(row.cabinetType) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="层号" min-width="90" prop="layerNo" />
            <ElTableColumn label="位号" min-width="90" prop="slotNo" />
            <ElTableColumn label="柜位状态" min-width="110">
              <template #default="{ row }">
                <ElTag :type="getPositionStatusTagType(row.positionStatus)">
                  {{ formatArchivePositionStatus(row.positionStatus) }}
                </ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn label="状态说明" min-width="220">
              <template #default="{ row }">
                {{ row.statusReason }}
              </template>
            </ElTableColumn>
            <ElTableColumn fixed="right" label="选择" min-width="110">
              <template #default="{ row }">
                <ElButton
                  :disabled="!row.selectable"
                  link
                  type="primary"
                  @click="selectPosition(row)"
                >
                  {{
                    selectedPositionCode === row.positionCode
                      ? '已选择'
                      : '选择'
                  }}
                </ElButton>
              </template>
            </ElTableColumn>
          </ElTable>
        </template>
      </OperationSectionCard>

      <OperationSectionCard
        title="统一归档操作"
        description="申请单图片仅使用 fileUrl，不执行真实上传。归档时直接复用上方所选可用柜位。"
      >
        <ElAlert
          v-if="archivePermissionWarning"
          :closable="false"
          class="mb-4"
          :title="archivePermissionWarning"
          type="warning"
        />

        <ElForm label-width="110px">
          <ElFormItem label="对象类型" required>
            <ElSelect v-model="archiveForm.objectType" style="width: 220px">
              <ElOption
                v-for="option in ARCHIVE_OBJECT_TYPE_OPTIONS"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="目标柜位" required>
            <div class="flex flex-col gap-2">
              <div class="text-sm font-medium">{{ selectedPositionLabel }}</div>
              <div class="text-xs text-[var(--el-text-color-secondary)]">
                归档会直接使用上方“柜位查询与选择”中当前选中的可用柜位。
              </div>
            </div>
          </ElFormItem>
          <ElFormItem
            v-if="archiveForm.objectType === 'APPLICATION_FORM'"
            label="病例 ID"
            required
          >
            <ElInput
              v-model="archiveForm.caseId"
              placeholder="请输入病例 ID"
              style="width: 320px"
            />
          </ElFormItem>
          <ElFormItem
            v-if="archiveForm.objectType === 'APPLICATION_FORM'"
            label="图片 URL"
          >
            <ElInput
              v-model="archiveForm.fileUrl"
              placeholder="请输入申请单图片 fileUrl"
              style="width: 520px"
            />
          </ElFormItem>
          <ElFormItem
            v-if="archiveForm.objectType === 'APPLICATION_FORM'"
            label="文件名"
          >
            <ElInput
              v-model="archiveForm.fileName"
              placeholder="可选，便于后续识别"
              style="width: 320px"
            />
          </ElFormItem>
          <ElFormItem
            v-if="archiveForm.objectType === 'EMBEDDING_BOX'"
            label="蜡块 ID"
            required
          >
            <ElInput
              v-model="archiveForm.embeddingBoxId"
              placeholder="请输入蜡块 ID"
              style="width: 320px"
            />
          </ElFormItem>
          <ElFormItem
            v-if="archiveForm.objectType === 'SLIDE'"
            label="玻片 ID"
            required
          >
            <ElInput
              v-model="archiveForm.slideId"
              placeholder="请输入玻片 ID"
              style="width: 320px"
            />
          </ElFormItem>
          <ElFormItem label="操作人" required>
            <ElInput v-model="archiveForm.operatorName" style="width: 220px" />
          </ElFormItem>
          <ElFormItem label="终端编码">
            <ElInput v-model="archiveForm.terminalCode" style="width: 220px" />
          </ElFormItem>
          <ElFormItem label="备注">
            <ElInput v-model="archiveForm.remarks" type="textarea" />
          </ElFormItem>
          <ElFormItem>
            <ElButton
              :disabled="!canSubmitArchive"
              :loading="submitting"
              type="primary"
              @click="submitArchive"
            >
              {{ archiveSubmitButtonText }}
            </ElButton>
          </ElFormItem>
        </ElForm>
      </OperationSectionCard>

      <OperationSectionCard
        title="归档记录查询"
        description="按病例、对象类型或关键字查询归档结果，并核对医生工作台回流状态。"
      >
        <template v-if="!canQueryRecords">
          <ElAlert
            :closable="false"
            title="当前账号缺少归档记录查询权限。"
            type="warning"
          />
        </template>

        <template v-else>
          <ElAlert
            v-if="recordError"
            :closable="false"
            class="mb-4"
            :title="recordError"
            show-icon
            type="error"
          />

          <ElForm inline label-width="88px">
            <ElFormItem label="关键字">
              <ElInput
                v-model="recordFilters.keyword"
                clearable
                placeholder="病理号 / 对象编号"
                style="width: 220px"
                @keyup.enter="loadRecords"
              />
            </ElFormItem>
            <ElFormItem label="对象类型">
              <ElSelect
                v-model="recordFilters.objectType"
                clearable
                style="width: 160px"
              >
                <ElOption
                  v-for="option in ARCHIVE_OBJECT_TYPE_OPTIONS"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </ElSelect>
            </ElFormItem>
            <ElFormItem label="病例 ID">
              <ElInput
                v-model="recordFilters.caseId"
                clearable
                placeholder="请输入病例 ID"
                style="width: 220px"
                @keyup.enter="loadRecords"
              />
            </ElFormItem>
            <ElFormItem>
              <ElButton
                :loading="loading.records"
                type="primary"
                @click="loadRecords"
              >
                查询归档记录
              </ElButton>
            </ElFormItem>
          </ElForm>

          <ElTable v-loading="loading.records" :data="records" border>
            <ElTableColumn label="病例 ID" min-width="140" prop="caseId" />
            <ElTableColumn label="病理号" min-width="140">
              <template #default="{ row }">
                {{ formatNullable(row.pathologyNo) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="申请单号" min-width="140">
              <template #default="{ row }">
                {{ formatNullable(row.applicationNo) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="患者" min-width="120">
              <template #default="{ row }">
                {{ formatNullable(row.patientName) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="对象类型" min-width="120">
              <template #default="{ row }">
                {{ formatArchiveObjectType(row.objectType) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="对象编号" min-width="160">
              <template #default="{ row }">
                {{ formatNullable(row.objectCode || row.objectId) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="归档状态" min-width="120">
              <template #default="{ row }">
                <ElTag :type="getArchiveStatusTagType(row.archiveStatus)">
                  {{ formatArchiveStorageStatus(row.archiveStatus) }}
                </ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn label="归档位置" min-width="180">
              <template #default="{ row }">
                {{ formatNullable(row.archiveLocation) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="借阅状态" min-width="120">
              <template #default="{ row }">
                <ElTag
                  v-if="row.loanStatus"
                  :type="getLoanStatusTagType(row.loanStatus)"
                >
                  {{ formatMaterialLoanStatus(row.loanStatus) }}
                </ElTag>
                <span v-else>-</span>
              </template>
            </ElTableColumn>
            <ElTableColumn label="归档时间" min-width="180">
              <template #default="{ row }">
                {{ formatNullable(row.archivedAt) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="归档人" min-width="120">
              <template #default="{ row }">
                {{ formatNullable(row.storedByName) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="借阅人" min-width="120">
              <template #default="{ row }">
                {{ formatNullable(row.borrowedByName) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="借出时间" min-width="180">
              <template #default="{ row }">
                {{ formatNullable(row.borrowedAt) }}
              </template>
            </ElTableColumn>
          </ElTable>
        </template>
      </OperationSectionCard>

      <OperationSectionCard
        title="借出与待归还"
        description="对蜡块、玻片执行借出，并处理待归还列表。"
      >
        <ElAlert
          v-if="loanError"
          :closable="false"
          class="mb-4"
          :title="loanError"
          show-icon
          type="error"
        />

        <ElForm class="mb-4" inline label-width="88px">
          <ElFormItem label="材料类型">
            <ElSelect v-model="loanForm.materialType" style="width: 160px">
              <ElOption
                v-for="option in MATERIAL_TYPE_OPTIONS"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="材料 ID" required>
            <ElInput
              v-model="loanForm.materialId"
              placeholder="请输入材料 ID"
              style="width: 220px"
            />
          </ElFormItem>
          <ElFormItem label="借阅人" required>
            <ElInput
              v-model="loanForm.borrowedByName"
              placeholder="请输入借阅人姓名"
              style="width: 180px"
            />
          </ElFormItem>
          <ElFormItem label="用途">
            <ElInput
              v-model="loanForm.borrowPurpose"
              placeholder="可选，填写借阅用途"
              style="width: 220px"
            />
          </ElFormItem>
          <ElFormItem label="操作人" required>
            <ElInput v-model="loanForm.operatorName" style="width: 180px" />
          </ElFormItem>
          <ElFormItem>
            <ElButton
              :disabled="!canCreateLoan"
              :loading="submitting"
              type="primary"
              @click="submitLoan"
            >
              提交借出
            </ElButton>
          </ElFormItem>
        </ElForm>

        <ElAlert
          v-if="!canQueryLoans"
          :closable="false"
          class="mb-4"
          title="当前账号缺少待归还列表查询权限。"
          type="warning"
        />

        <template v-else>
          <ElForm inline label-width="88px">
            <ElFormItem label="材料类型">
              <ElSelect
                v-model="loanFilters.materialType"
                clearable
                style="width: 160px"
              >
                <ElOption
                  v-for="option in MATERIAL_TYPE_OPTIONS"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </ElSelect>
            </ElFormItem>
            <ElFormItem label="关键字">
              <ElInput
                v-model="loanFilters.keyword"
                clearable
                placeholder="病理号 / 对象编号"
                style="width: 220px"
                @keyup.enter="loadLoans"
              />
            </ElFormItem>
            <ElFormItem>
              <ElButton
                :loading="loading.loans"
                type="primary"
                @click="loadLoans"
              >
                查询待归还
              </ElButton>
            </ElFormItem>
          </ElForm>

          <ElTable
            v-loading="loading.loans"
            :data="pendingLoans"
            border
            class="mt-4"
          >
            <ElTableColumn label="借阅单号" min-width="160" prop="loanId" />
            <ElTableColumn label="病例 ID" min-width="140" prop="caseId" />
            <ElTableColumn label="病理号" min-width="140">
              <template #default="{ row }">
                {{ formatNullable(row.pathologyNo) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="材料类型" min-width="120">
              <template #default="{ row }">
                {{ formatMaterialType(row.materialType) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="对象编号" min-width="160">
              <template #default="{ row }">
                {{ formatNullable(row.objectCode || row.materialId) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="借阅状态" min-width="120">
              <template #default="{ row }">
                <ElTag :type="getLoanStatusTagType(row.loanStatus)">
                  {{ formatMaterialLoanStatus(row.loanStatus) }}
                </ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn label="借阅人" min-width="120">
              <template #default="{ row }">
                {{ formatNullable(row.borrowedByName) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="借出时间" min-width="180">
              <template #default="{ row }">
                {{ formatNullable(row.borrowedAt) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="借阅用途" min-width="180">
              <template #default="{ row }">
                {{ formatNullable(row.borrowPurpose) }}
              </template>
            </ElTableColumn>
            <ElTableColumn fixed="right" label="操作" min-width="110">
              <template #default="{ row }">
                <ElButton
                  :disabled="!canReturnLoan"
                  link
                  type="primary"
                  @click="openReturnDialog(row)"
                >
                  归还
                </ElButton>
              </template>
            </ElTableColumn>
          </ElTable>
        </template>
      </OperationSectionCard>
    </div>

    <ElDialog
      v-model="cabinetDialogVisible"
      :title="cabinetDialogMode === 'edit' ? '更新归档柜' : '新增归档柜'"
      width="720px"
    >
      <ElForm label-width="118px">
        <ElFormItem label="归档柜编号" required>
          <ElInput
            v-model="cabinetForm.cabinetCode"
            :disabled="cabinetDialogMode === 'edit'"
          />
        </ElFormItem>
        <ElFormItem label="归档柜名称" required>
          <ElInput v-model="cabinetForm.cabinetName" />
        </ElFormItem>
        <ElFormItem label="柜体类型" required>
          <ElSelect
            v-model="cabinetForm.cabinetType"
            :disabled="cabinetDialogMode === 'edit'"
          >
            <ElOption
              v-for="option in ARCHIVE_CABINET_TYPE_OPTIONS"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="层数" required>
          <ElInputNumber
            v-model="cabinetForm.layerCount"
            :disabled="cabinetDialogMode === 'edit'"
            :min="1"
          />
        </ElFormItem>
        <ElFormItem label="每层柜位数" required>
          <ElInputNumber
            v-model="cabinetForm.slotCountPerLayer"
            :disabled="cabinetDialogMode === 'edit'"
            :min="1"
          />
        </ElFormItem>
        <ElFormItem label="归档柜状态" required>
          <ElSelect
            v-model="cabinetForm.cabinetStatus"
            :disabled="!isEditingCabinet"
          >
            <ElOption
              v-for="option in ARCHIVE_CABINET_STATUS_OPTIONS"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="位置说明">
          <ElInput v-model="cabinetForm.locationDescription" />
        </ElFormItem>
        <ElFormItem label="操作人" required>
          <ElInput v-model="cabinetForm.operatorName" />
        </ElFormItem>
        <ElFormItem label="终端编码">
          <ElInput v-model="cabinetForm.terminalCode" />
        </ElFormItem>
        <ElFormItem label="备注">
          <ElInput v-model="cabinetForm.remarks" type="textarea" />
        </ElFormItem>
      </ElForm>

      <ElAlert :closable="false" class="mt-4" type="info">
        <template #title>
          柜位生成预览：{{ cabinetCapacityPreview }} 个柜位，编码示例
          {{ cabinetPositionRulePreview }}
        </template>
        <template #default>
          新增归档柜后，系统会按“层数 ×
          每层柜位数”自动初始化柜位，初始状态固定为“启用”；更新时仅允许维护基础信息和启停状态，不会重建已有柜位。
        </template>
      </ElAlert>

      <template #footer>
        <ElButton @click="cabinetDialogVisible = false">取消</ElButton>
        <ElButton :loading="submitting" type="primary" @click="submitCabinet">
          保存
        </ElButton>
      </template>
    </ElDialog>

    <ElDialog v-model="returnDialogVisible" title="材料归还" width="640px">
      <ElForm label-width="118px">
        <ElFormItem label="借阅单号">
          <span>{{ formatNullable(returningLoan?.loanId) }}</span>
        </ElFormItem>
        <ElFormItem label="材料类型">
          <span>{{ formatMaterialType(returningLoan?.materialType) }}</span>
        </ElFormItem>
        <ElFormItem label="材料 ID">
          <span>{{ formatNullable(returningLoan?.materialId) }}</span>
        </ElFormItem>
        <ElFormItem label="替代柜位">
          <div class="flex flex-col gap-2">
            <div class="font-medium">{{ selectedPositionLabel }}</div>
            <div class="text-xs text-[var(--el-text-color-secondary)]">
              {{ selectedReturnPositionDescription }}
            </div>
          </div>
        </ElFormItem>
        <ElFormItem label="操作人" required>
          <ElInput v-model="returnForm.operatorName" />
        </ElFormItem>
        <ElFormItem label="终端编码">
          <ElInput v-model="returnForm.terminalCode" />
        </ElFormItem>
        <ElFormItem label="备注">
          <ElInput v-model="returnForm.remarks" type="textarea" />
        </ElFormItem>
      </ElForm>

      <ElAlert :closable="false" class="mt-4" type="info">
        <template #default>
          未指定替代柜位时，系统会优先尝试归还到原始柜位；若原柜位已占用或已停用，后端会返回校验提示，请先在“柜位查询与选择”中重新选定可用柜位。
        </template>
      </ElAlert>

      <template #footer>
        <ElButton @click="returnDialogVisible = false">取消</ElButton>
        <ElButton :loading="submitting" type="primary" @click="submitReturn">
          确认归还
        </ElButton>
      </template>
    </ElDialog>
  </Page>
</template>
