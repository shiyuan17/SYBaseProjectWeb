<script setup lang="ts">
import type {
  ArchiveCabinetView,
  ArchivePositionView,
  ArchiveRecordView,
  MaterialLoanView,
} from '../types/operation-support';

import { computed, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

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
  ElTabs,
  ElTabPane,
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
  MATERIAL_TYPE_OPTIONS,
} from '../constants';
import { getOperationSupportPageErrorMessage } from '../utils/error';
import {
  formatArchiveCabinetStatus,
  formatArchiveCabinetType,
  formatArchiveObjectType,
  formatMaterialType,
  formatNullable,
} from '../utils/format';

const loading = reactive({
  cabinets: false,
  loans: false,
  positions: false,
  records: false,
});
const submitting = ref(false);
const pageError = ref('');
const cabinets = ref<ArchiveCabinetView[]>([]);
const positions = ref<ArchivePositionView[]>([]);
const records = ref<ArchiveRecordView[]>([]);
const loans = ref<MaterialLoanView[]>([]);
const editingCabinet = ref<ArchiveCabinetView | null>(null);
const returningLoan = ref<MaterialLoanView | null>(null);
const cabinetDialogVisible = computed({
  get: () => editingCabinet.value !== null,
  set: (visible: boolean) => {
    if (!visible) {
      editingCabinet.value = null;
    }
  },
});
const returnDialogVisible = computed({
  get: () => returningLoan.value !== null,
  set: (visible: boolean) => {
    if (!visible) {
      returningLoan.value = null;
    }
  },
});

const cabinetForm = reactive({
  cabinetCode: '',
  cabinetName: '',
  cabinetStatus: 'ENABLED',
  cabinetType: 'STANDARD',
  layerCount: 1,
  locationDescription: '',
  operatorName: '',
  remarks: '',
  slotCountPerLayer: 10,
  terminalCode: '',
});

const positionFilters = reactive({
  cabinetId: '',
  cabinetType: '',
});

const archiveForm = reactive({
  archivePositionId: '',
  caseId: '',
  embeddingBoxId: '',
  fileName: '',
  fileUrl: '',
  objectType: 'APPLICATION_FORM',
  operatorName: '',
  remarks: '',
  slideId: '',
  terminalCode: '',
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

const loanForm = reactive({
  borrowedByName: '',
  borrowedByUserId: '',
  borrowPurpose: '',
  materialId: '',
  materialType: 'SLIDE',
  operatorName: '',
  remarks: '',
  terminalCode: '',
});

const returnForm = reactive({
  archivePositionId: '',
  operatorName: '',
  remarks: '',
  terminalCode: '',
});

function getStatusTagType(status?: null | string) {
  if (status === 'ENABLED' || status === 'IN_STORAGE' || status === 'RETURNED') {
    return 'success';
  }
  if (status === 'BORROWED') {
    return 'warning';
  }
  if (status === 'DISABLED') {
    return 'info';
  }
  return 'primary';
}

function clearCabinetForm() {
  editingCabinet.value = null;
  cabinetForm.cabinetCode = '';
  cabinetForm.cabinetName = '';
  cabinetForm.cabinetStatus = 'ENABLED';
  cabinetForm.cabinetType = 'STANDARD';
  cabinetForm.layerCount = 1;
  cabinetForm.locationDescription = '';
  cabinetForm.operatorName = '';
  cabinetForm.remarks = '';
  cabinetForm.slotCountPerLayer = 10;
  cabinetForm.terminalCode = '';
}

function openCreateCabinetDialog() {
  clearCabinetForm();
  editingCabinet.value = {
    cabinetCode: '',
    cabinetName: '',
    cabinetStatus: 'ENABLED',
    cabinetType: 'STANDARD',
    capacity: 0,
    id: '',
    layerCount: 1,
    locationDescription: '',
    remarks: '',
    slotCountPerLayer: 10,
  };
}

function openEditCabinetDialog(row: ArchiveCabinetView) {
  editingCabinet.value = row;
  cabinetForm.cabinetCode = row.cabinetCode;
  cabinetForm.cabinetName = row.cabinetName;
  cabinetForm.cabinetStatus = row.cabinetStatus;
  cabinetForm.cabinetType = row.cabinetType;
  cabinetForm.layerCount = row.layerCount;
  cabinetForm.locationDescription = row.locationDescription ?? '';
  cabinetForm.remarks = row.remarks ?? '';
  cabinetForm.slotCountPerLayer = row.slotCountPerLayer;
}

async function loadCabinets() {
  loading.cabinets = true;
  pageError.value = '';
  try {
    cabinets.value = await listArchiveCabinets();
  } catch (error) {
    pageError.value = getOperationSupportPageErrorMessage(error);
  } finally {
    loading.cabinets = false;
  }
}

async function submitCabinet() {
  if (
    !cabinetForm.cabinetName ||
    !cabinetForm.operatorName ||
    cabinetForm.layerCount < 1 ||
    cabinetForm.slotCountPerLayer < 1
  ) {
    ElMessage.warning('请填写柜名称、操作人，并确认层数和位数大于 0');
    return;
  }
  if (!editingCabinet.value?.id && !cabinetForm.cabinetCode) {
    ElMessage.warning('新增归档柜需要填写柜编号');
    return;
  }

  submitting.value = true;
  try {
    if (editingCabinet.value?.id) {
      await updateArchiveCabinet(editingCabinet.value.id, {
        cabinetName: cabinetForm.cabinetName,
        cabinetStatus: cabinetForm.cabinetStatus,
        locationDescription: cabinetForm.locationDescription || undefined,
        operatorName: cabinetForm.operatorName,
        remarks: cabinetForm.remarks || undefined,
        terminalCode: cabinetForm.terminalCode || undefined,
      });
      ElMessage.success('归档柜已更新');
    } else {
      await createArchiveCabinet({
        cabinetCode: cabinetForm.cabinetCode,
        cabinetName: cabinetForm.cabinetName,
        cabinetType: cabinetForm.cabinetType,
        layerCount: cabinetForm.layerCount,
        locationDescription: cabinetForm.locationDescription || undefined,
        operatorName: cabinetForm.operatorName,
        remarks: cabinetForm.remarks || undefined,
        slotCountPerLayer: cabinetForm.slotCountPerLayer,
        terminalCode: cabinetForm.terminalCode || undefined,
      });
      ElMessage.success('归档柜已创建');
    }
    cabinetDialogVisible.value = false;
    await loadCabinets();
  } catch (error) {
    ElMessage.error(getOperationSupportPageErrorMessage(error));
  } finally {
    submitting.value = false;
  }
}

async function loadPositions() {
  loading.positions = true;
  try {
    positions.value = await listAvailableArchivePositions({
      cabinetId: positionFilters.cabinetId || undefined,
      cabinetType: positionFilters.cabinetType || undefined,
    });
  } catch (error) {
    ElMessage.error(getOperationSupportPageErrorMessage(error));
  } finally {
    loading.positions = false;
  }
}

async function submitArchive() {
  if (!archiveForm.archivePositionId || !archiveForm.operatorName) {
    ElMessage.warning('请选择归档位置并填写操作人');
    return;
  }

  submitting.value = true;
  try {
    if (archiveForm.objectType === 'APPLICATION_FORM') {
      if (!archiveForm.caseId) {
        ElMessage.warning('申请单归档需要填写病例ID');
        return;
      }
      await archiveApplicationForm({
        archivePositionId: archiveForm.archivePositionId,
        caseId: archiveForm.caseId,
        fileName: archiveForm.fileName || undefined,
        fileUrl: archiveForm.fileUrl || undefined,
        operatorName: archiveForm.operatorName,
        remarks: archiveForm.remarks || undefined,
        terminalCode: archiveForm.terminalCode || undefined,
      });
    } else if (archiveForm.objectType === 'EMBEDDING_BOX') {
      if (!archiveForm.embeddingBoxId) {
        ElMessage.warning('包埋盒归档需要填写包埋盒ID');
        return;
      }
      await archiveEmbeddingBox({
        archivePositionId: archiveForm.archivePositionId,
        embeddingBoxId: archiveForm.embeddingBoxId,
        operatorName: archiveForm.operatorName,
        remarks: archiveForm.remarks || undefined,
        terminalCode: archiveForm.terminalCode || undefined,
      });
    } else {
      if (!archiveForm.slideId) {
        ElMessage.warning('玻片归档需要填写玻片ID');
        return;
      }
      await archiveSlide({
        archivePositionId: archiveForm.archivePositionId,
        operatorName: archiveForm.operatorName,
        remarks: archiveForm.remarks || undefined,
        slideId: archiveForm.slideId,
        terminalCode: archiveForm.terminalCode || undefined,
      });
    }

    ElMessage.success('归档操作已完成');
    archiveForm.archivePositionId = '';
    await Promise.all([loadPositions(), loadRecords()]);
  } catch (error) {
    ElMessage.error(getOperationSupportPageErrorMessage(error));
  } finally {
    submitting.value = false;
  }
}

async function loadRecords() {
  loading.records = true;
  try {
    records.value = await searchArchiveRecords({
      caseId: recordFilters.caseId.trim() || undefined,
      keyword: recordFilters.keyword.trim() || undefined,
      objectType: recordFilters.objectType || undefined,
    });
  } catch (error) {
    ElMessage.error(getOperationSupportPageErrorMessage(error));
  } finally {
    loading.records = false;
  }
}

async function loadLoans() {
  loading.loans = true;
  try {
    loans.value = await listPendingMaterialLoans({
      keyword: loanFilters.keyword.trim() || undefined,
      materialType: loanFilters.materialType || undefined,
    });
  } catch (error) {
    ElMessage.error(getOperationSupportPageErrorMessage(error));
  } finally {
    loading.loans = false;
  }
}

async function submitLoan() {
  if (
    !loanForm.materialType ||
    !loanForm.materialId ||
    !loanForm.borrowedByName ||
    !loanForm.operatorName
  ) {
    ElMessage.warning('请填写材料类型、材料ID、借阅人和操作人');
    return;
  }

  submitting.value = true;
  try {
    await createMaterialLoan({
      borrowedByName: loanForm.borrowedByName,
      borrowedByUserId: loanForm.borrowedByUserId || undefined,
      borrowPurpose: loanForm.borrowPurpose || undefined,
      materialId: loanForm.materialId,
      materialType: loanForm.materialType,
      operatorName: loanForm.operatorName,
      remarks: loanForm.remarks || undefined,
      terminalCode: loanForm.terminalCode || undefined,
    });
    ElMessage.success('材料借阅已创建');
    loanForm.materialId = '';
    await loadLoans();
  } catch (error) {
    ElMessage.error(getOperationSupportPageErrorMessage(error));
  } finally {
    submitting.value = false;
  }
}

function openReturnDialog(row: MaterialLoanView) {
  returningLoan.value = row;
  returnForm.archivePositionId = '';
  returnForm.operatorName = '';
  returnForm.remarks = '';
  returnForm.terminalCode = '';
}

async function submitReturn() {
  if (!returningLoan.value || !returnForm.operatorName) {
    ElMessage.warning('请填写归还操作人');
    return;
  }

  submitting.value = true;
  try {
    await returnMaterialLoan(returningLoan.value.loanId, {
      archivePositionId: returnForm.archivePositionId || undefined,
      operatorName: returnForm.operatorName,
      remarks: returnForm.remarks || undefined,
      terminalCode: returnForm.terminalCode || undefined,
    });
    ElMessage.success('材料已归还');
    returnDialogVisible.value = false;
    await Promise.all([loadLoans(), loadRecords(), loadPositions()]);
  } catch (error) {
    ElMessage.error(getOperationSupportPageErrorMessage(error));
  } finally {
    submitting.value = false;
  }
}

void Promise.all([loadCabinets(), loadPositions(), loadRecords(), loadLoans()]);
</script>

<template>
  <Page title="归档管理" description="维护归档柜、库位、归档记录，并处理包埋盒与玻片借阅归还。">
    <div class="flex flex-col gap-4">
      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        show-icon
        type="error"
      />

      <OperationSectionCard title="归档柜" description="维护归档柜编码、容量和启停状态。">
        <template #extra>
          <ElButton type="primary" @click="openCreateCabinetDialog">
            新增归档柜
          </ElButton>
        </template>
        <ElTable v-loading="loading.cabinets" :data="cabinets" border>
          <ElTableColumn label="柜编号" min-width="140" prop="cabinetCode" />
          <ElTableColumn label="柜名称" min-width="160" prop="cabinetName" />
          <ElTableColumn label="类型" min-width="120">
            <template #default="{ row }">
              {{ formatArchiveCabinetType(row.cabinetType) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="容量" min-width="90" prop="capacity" />
          <ElTableColumn label="状态" min-width="100">
            <template #default="{ row }">
              <ElTag :type="getStatusTagType(row.cabinetStatus)">
                {{ formatArchiveCabinetStatus(row.cabinetStatus) }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn label="位置" min-width="180">
            <template #default="{ row }">
              {{ formatNullable(row.locationDescription) }}
            </template>
          </ElTableColumn>
          <ElTableColumn fixed="right" label="操作" width="100">
            <template #default="{ row }">
              <ElButton link type="primary" @click="openEditCabinetDialog(row)">
                编辑
              </ElButton>
            </template>
          </ElTableColumn>
        </ElTable>
      </OperationSectionCard>

      <OperationSectionCard title="归档操作" description="先筛选可用库位，再按对象类型执行归档。">
        <ElForm inline label-width="88px">
          <ElFormItem label="归档柜">
            <ElSelect
              v-model="positionFilters.cabinetId"
              clearable
              filterable
              placeholder="全部归档柜"
              style="width: 220px"
            >
              <ElOption
                v-for="cabinet in cabinets"
                :key="cabinet.id"
                :label="`${cabinet.cabinetCode} ${cabinet.cabinetName}`"
                :value="cabinet.id"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="柜类型">
            <ElSelect
              v-model="positionFilters.cabinetType"
              clearable
              placeholder="全部类型"
              style="width: 160px"
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
            <ElButton :loading="loading.positions" type="primary" @click="loadPositions">
              查询库位
            </ElButton>
          </ElFormItem>
        </ElForm>

        <ElTabs class="mt-2">
          <ElTabPane label="执行归档">
            <ElForm label-width="110px">
              <ElFormItem label="对象类型">
                <ElSelect v-model="archiveForm.objectType" style="width: 220px">
                  <ElOption
                    v-for="option in ARCHIVE_OBJECT_TYPE_OPTIONS"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </ElSelect>
              </ElFormItem>
              <ElFormItem label="归档位置">
                <ElSelect
                  v-model="archiveForm.archivePositionId"
                  filterable
                  placeholder="请选择可用库位"
                  style="width: 320px"
                >
                  <ElOption
                    v-for="position in positions"
                    :key="position.id"
                    :label="position.positionCode"
                    :value="position.id"
                  />
                </ElSelect>
              </ElFormItem>
              <ElFormItem v-if="archiveForm.objectType === 'APPLICATION_FORM'" label="病例ID">
                <ElInput v-model="archiveForm.caseId" style="width: 320px" />
              </ElFormItem>
              <ElFormItem v-if="archiveForm.objectType === 'APPLICATION_FORM'" label="图片URL">
                <ElInput v-model="archiveForm.fileUrl" style="width: 420px" />
              </ElFormItem>
              <ElFormItem v-if="archiveForm.objectType === 'APPLICATION_FORM'" label="文件名">
                <ElInput v-model="archiveForm.fileName" style="width: 320px" />
              </ElFormItem>
              <ElFormItem v-if="archiveForm.objectType === 'EMBEDDING_BOX'" label="包埋盒ID">
                <ElInput v-model="archiveForm.embeddingBoxId" style="width: 320px" />
              </ElFormItem>
              <ElFormItem v-if="archiveForm.objectType === 'SLIDE'" label="玻片ID">
                <ElInput v-model="archiveForm.slideId" style="width: 320px" />
              </ElFormItem>
              <ElFormItem label="操作人">
                <ElInput v-model="archiveForm.operatorName" style="width: 220px" />
              </ElFormItem>
              <ElFormItem label="终端编码">
                <ElInput v-model="archiveForm.terminalCode" style="width: 220px" />
              </ElFormItem>
              <ElFormItem label="备注">
                <ElInput v-model="archiveForm.remarks" type="textarea" />
              </ElFormItem>
              <ElFormItem>
                <ElButton :loading="submitting" type="primary" @click="submitArchive">
                  提交归档
                </ElButton>
              </ElFormItem>
            </ElForm>
          </ElTabPane>
          <ElTabPane label="可用库位">
            <ElTable v-loading="loading.positions" :data="positions" border>
              <ElTableColumn label="库位编码" min-width="180" prop="positionCode" />
              <ElTableColumn label="层" width="90" prop="layerNo" />
              <ElTableColumn label="位" width="90" prop="slotNo" />
              <ElTableColumn label="状态" min-width="120" prop="positionStatus" />
            </ElTable>
          </ElTabPane>
        </ElTabs>
      </OperationSectionCard>

      <OperationSectionCard title="归档记录" description="按关键字、对象类型或病例ID查询归档记录。">
        <ElForm inline label-width="88px">
          <ElFormItem label="关键字">
            <ElInput
              v-model="recordFilters.keyword"
              clearable
              placeholder="病理号/对象编号"
              style="width: 220px"
              @keyup.enter="loadRecords"
            />
          </ElFormItem>
          <ElFormItem label="对象类型">
            <ElSelect v-model="recordFilters.objectType" clearable style="width: 160px">
              <ElOption
                v-for="option in ARCHIVE_OBJECT_TYPE_OPTIONS"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="病例ID">
            <ElInput
              v-model="recordFilters.caseId"
              clearable
              style="width: 220px"
              @keyup.enter="loadRecords"
            />
          </ElFormItem>
          <ElFormItem>
            <ElButton :loading="loading.records" type="primary" @click="loadRecords">
              查询
            </ElButton>
          </ElFormItem>
        </ElForm>
        <ElTable v-loading="loading.records" :data="records" border>
          <ElTableColumn label="病理号" min-width="140">
            <template #default="{ row }">
              {{ formatNullable(row.pathologyNo) }}
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
              {{ formatNullable(row.objectCode) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="归档位置" min-width="180">
            <template #default="{ row }">
              {{ formatNullable(row.archiveLocation) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="归档状态" min-width="120">
            <template #default="{ row }">
              <ElTag :type="getStatusTagType(row.archiveStatus)">
                {{ formatNullable(row.archiveStatus) }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn label="借阅状态" min-width="120">
            <template #default="{ row }">
              {{ formatNullable(row.loanStatus) }}
            </template>
          </ElTableColumn>
        </ElTable>
      </OperationSectionCard>

      <OperationSectionCard title="材料借阅" description="创建包埋盒或玻片借阅，并处理待归还记录。">
        <ElForm inline label-width="88px">
          <ElFormItem label="材料类型">
            <ElSelect v-model="loanFilters.materialType" clearable style="width: 160px">
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
              style="width: 220px"
              @keyup.enter="loadLoans"
            />
          </ElFormItem>
          <ElFormItem>
            <ElButton :loading="loading.loans" type="primary" @click="loadLoans">
              查询待归还
            </ElButton>
          </ElFormItem>
        </ElForm>

        <ElForm class="mb-4" inline label-width="88px">
          <ElFormItem label="材料类型">
            <ElSelect v-model="loanForm.materialType" style="width: 150px">
              <ElOption
                v-for="option in MATERIAL_TYPE_OPTIONS"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="材料ID">
            <ElInput v-model="loanForm.materialId" style="width: 220px" />
          </ElFormItem>
          <ElFormItem label="借阅人">
            <ElInput v-model="loanForm.borrowedByName" style="width: 180px" />
          </ElFormItem>
          <ElFormItem label="操作人">
            <ElInput v-model="loanForm.operatorName" style="width: 180px" />
          </ElFormItem>
          <ElFormItem>
            <ElButton :loading="submitting" type="success" @click="submitLoan">
              创建借阅
            </ElButton>
          </ElFormItem>
        </ElForm>

        <ElTable v-loading="loading.loans" :data="loans" border>
          <ElTableColumn label="材料类型" min-width="120">
            <template #default="{ row }">
              {{ formatMaterialType(row.materialType) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="对象编号" min-width="160">
            <template #default="{ row }">
              {{ formatNullable(row.objectCode) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="借阅人" min-width="120" prop="borrowedByName" />
          <ElTableColumn label="借阅时间" min-width="180">
            <template #default="{ row }">
              {{ formatNullable(row.borrowedAt) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="用途" min-width="180">
            <template #default="{ row }">
              {{ formatNullable(row.borrowPurpose) }}
            </template>
          </ElTableColumn>
          <ElTableColumn fixed="right" label="操作" width="100">
            <template #default="{ row }">
              <ElButton link type="primary" @click="openReturnDialog(row)">
                归还
              </ElButton>
            </template>
          </ElTableColumn>
        </ElTable>
      </OperationSectionCard>
    </div>

    <ElDialog v-model="cabinetDialogVisible" title="归档柜维护" width="680px">
      <ElForm label-width="110px">
        <ElFormItem label="柜编号" required>
          <ElInput v-model="cabinetForm.cabinetCode" :disabled="!!editingCabinet?.id" />
        </ElFormItem>
        <ElFormItem label="柜名称" required>
          <ElInput v-model="cabinetForm.cabinetName" />
        </ElFormItem>
        <ElFormItem label="柜类型" required>
          <ElSelect v-model="cabinetForm.cabinetType" :disabled="!!editingCabinet?.id">
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
            :disabled="!!editingCabinet?.id"
            :min="1"
          />
        </ElFormItem>
        <ElFormItem label="每层位数" required>
          <ElInputNumber
            v-model="cabinetForm.slotCountPerLayer"
            :disabled="!!editingCabinet?.id"
            :min="1"
          />
        </ElFormItem>
        <ElFormItem label="状态" required>
          <ElSelect v-model="cabinetForm.cabinetStatus">
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
      <template #footer>
        <ElButton @click="cabinetDialogVisible = false">取消</ElButton>
        <ElButton :loading="submitting" type="primary" @click="submitCabinet">
          保存
        </ElButton>
      </template>
    </ElDialog>

    <ElDialog v-model="returnDialogVisible" title="材料归还" width="560px">
      <ElForm label-width="110px">
        <ElFormItem label="归档位置">
          <ElSelect
            v-model="returnForm.archivePositionId"
            clearable
            filterable
            placeholder="可不填，默认归还原库位"
          >
            <ElOption
              v-for="position in positions"
              :key="position.id"
              :label="position.positionCode"
              :value="position.id"
            />
          </ElSelect>
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
      <template #footer>
        <ElButton @click="returnDialogVisible = false">取消</ElButton>
        <ElButton :loading="submitting" type="primary" @click="submitReturn">
          确认归还
        </ElButton>
      </template>
    </ElDialog>
  </Page>
</template>
