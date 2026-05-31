<script setup lang="ts">
import { Fallback, Page } from '@vben/common-ui';

import { ElAlert, ElButton, ElTable, ElTableColumn, ElTag } from 'element-plus';

import ArchiveCabinetDialog from '../components/ArchiveCabinetDialog.vue';
import ArchiveLoanWorkbenchPanel from '../components/ArchiveLoanWorkbenchPanel.vue';
import ArchivePositionWorkbenchPanel from '../components/ArchivePositionWorkbenchPanel.vue';
import ArchiveRecordQueryPanel from '../components/ArchiveRecordQueryPanel.vue';
import ArchiveReturnDialog from '../components/ArchiveReturnDialog.vue';
import ArchiveSubmissionPanel from '../components/ArchiveSubmissionPanel.vue';
import OperationSectionCard from '../components/OperationSectionCard.vue';
import { useArchiveManagementPage } from '../composables/useArchiveManagementPage';
import {
  formatArchiveCabinetStatus,
  formatArchiveCabinetType,
  formatNullable,
} from '../utils/format';

const {
  archiveForm,
  archivePermissionWarning,
  archiveSubmitButtonText,
  cabinetCapacityPreview,
  cabinetDialogMode,
  cabinetDialogVisible,
  cabinetError,
  cabinetForm,
  cabinetPositionRulePreview,
  cabinets,
  canCreateCabinet,
  canCreateLoan,
  canQueryCabinets,
  canQueryLoans,
  canQueryRecords,
  canReturnLoan,
  canSubmitArchive,
  canUpdateCabinet,
  canViewArchivePage,
  clearSelectedPosition,
  getArchiveStatusTagType,
  getCabinetStatusTagType,
  getLoanStatusTagType,
  getPositionStatusTagType,
  getToggleCabinetActionLabel,
  isEditingCabinet,
  loadLoans,
  loadPositions,
  loadRecords,
  loanError,
  loanFilters,
  loanForm,
  loading,
  openCreateCabinetDialog,
  openEditCabinetDialog,
  openReturnDialog,
  pendingLoans,
  positionError,
  positionFilters,
  positionRows,
  positionSummary,
  recordError,
  recordFilters,
  records,
  returnDialogVisible,
  returnForm,
  returningLoan,
  selectedPosition,
  selectedPositionCode,
  selectedPositionLabel,
  selectedReturnPositionDescription,
  selectPosition,
  submitArchive,
  submitCabinet,
  submitLoan,
  submitReturn,
  submitting,
  toggleCabinetStatus,
} = useArchiveManagementPage();
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

      <ArchivePositionWorkbenchPanel
        v-model:cabinet-id="positionFilters.cabinetId"
        v-model:cabinet-type="positionFilters.cabinetType"
        :cabinets="cabinets"
        :can-query-cabinets="canQueryCabinets"
        :get-position-status-tag-type="getPositionStatusTagType"
        :loading="loading.positions"
        :position-error="positionError"
        :position-rows="positionRows"
        :position-summary="positionSummary"
        :selected-position="selectedPosition"
        :selected-position-code="selectedPositionCode"
        :selected-position-label="selectedPositionLabel"
        @clear-selected-position="clearSelectedPosition"
        @load-positions="loadPositions"
        @select-position="selectPosition"
      />

      <ArchiveSubmissionPanel
        v-model:archive-form="archiveForm"
        :archive-permission-warning="archivePermissionWarning"
        :archive-submit-button-text="archiveSubmitButtonText"
        :can-submit-archive="canSubmitArchive"
        :selected-position-label="selectedPositionLabel"
        :submitting="submitting"
        @submit-archive="submitArchive"
      />

      <ArchiveRecordQueryPanel
        v-model:record-filters="recordFilters"
        :can-query-records="canQueryRecords"
        :get-archive-status-tag-type="getArchiveStatusTagType"
        :get-loan-status-tag-type="getLoanStatusTagType"
        :loading="loading.records"
        :record-error="recordError"
        :records="records"
        @load-records="loadRecords"
      />

      <ArchiveLoanWorkbenchPanel
        v-model:loan-filters="loanFilters"
        v-model:loan-form="loanForm"
        :can-create-loan="canCreateLoan"
        :can-query-loans="canQueryLoans"
        :can-return-loan="canReturnLoan"
        :get-loan-status-tag-type="getLoanStatusTagType"
        :loading="loading.loans"
        :loan-error="loanError"
        :pending-loans="pendingLoans"
        :submitting="submitting"
        @load-loans="loadLoans"
        @open-return-dialog="openReturnDialog"
        @submit-loan="submitLoan"
      />
    </div>

    <ArchiveCabinetDialog
      v-model="cabinetDialogVisible"
      v-model:cabinet-form="cabinetForm"
      :cabinet-capacity-preview="cabinetCapacityPreview"
      :cabinet-dialog-mode="cabinetDialogMode"
      :cabinet-position-rule-preview="cabinetPositionRulePreview"
      :is-editing-cabinet="isEditingCabinet"
      :submitting="submitting"
      @submit="submitCabinet"
    />

    <ArchiveReturnDialog
      v-model="returnDialogVisible"
      v-model:return-form="returnForm"
      :returning-loan="returningLoan"
      :selected-position-label="selectedPositionLabel"
      :selected-return-position-description="selectedReturnPositionDescription"
      :submitting="submitting"
      @submit="submitReturn"
    />
  </Page>
</template>
