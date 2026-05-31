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
  archiveWorkspace,
  cabinetWorkspace,
  capabilities,
  display,
  loanWorkspace,
  pageState,
  recordWorkspace,
} = useArchiveManagementPage();
</script>

<template>
  <div
    v-if="!capabilities.canViewArchivePage"
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
            :disabled="!capabilities.canCreateCabinet"
            :title="
              capabilities.canCreateCabinet
                ? undefined
                : '当前账号缺少归档柜新增权限'
            "
            type="primary"
            @click="cabinetWorkspace.openCreateCabinetDialog"
          >
            新增归档柜
          </ElButton>
        </template>

        <ElAlert
          v-if="!capabilities.canQueryCabinets"
          :closable="false"
          type="warning"
        >
          <template #title>
            当前账号缺少归档柜查询权限，无法查看归档柜与柜位工作站。
          </template>
        </ElAlert>

        <template v-else>
          <ElAlert
            v-if="cabinetWorkspace.cabinetError"
            :closable="false"
            class="mb-4"
            :title="cabinetWorkspace.cabinetError"
            show-icon
            type="error"
          />

          <ElAlert
            v-if="
              !capabilities.canCreateCabinet || !capabilities.canUpdateCabinet
            "
            :closable="false"
            class="mb-4"
            type="warning"
          >
            <template #title>
              当前账号具备归档柜查询权限，但部分维护能力受限。
            </template>
            <template #default>
              <span v-if="!capabilities.canCreateCabinet"
                >未授权新增归档柜。</span
              >
              <span
                v-if="
                  !capabilities.canCreateCabinet &&
                  !capabilities.canUpdateCabinet
                "
              >
              </span>
              <span v-if="!capabilities.canUpdateCabinet"
                >未授权更新或启停归档柜。</span
              >
            </template>
          </ElAlert>

          <ElTable
            v-loading="cabinetWorkspace.loading.cabinets"
            :data="cabinetWorkspace.cabinets"
            border
          >
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
                <ElTag :type="display.getCabinetStatusTagType(row.cabinetStatus)">
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
                    :disabled="!capabilities.canUpdateCabinet"
                    link
                    type="primary"
                    @click="cabinetWorkspace.openEditCabinetDialog(row)"
                  >
                    编辑
                  </ElButton>
                  <ElButton
                    :disabled="!capabilities.canUpdateCabinet"
                    link
                    type="primary"
                    @click="cabinetWorkspace.toggleCabinetStatus(row)"
                  >
                    {{ display.getToggleCabinetActionLabel(row.cabinetStatus) }}
                  </ElButton>
                </div>
              </template>
            </ElTableColumn>
          </ElTable>
        </template>
      </OperationSectionCard>

      <ArchivePositionWorkbenchPanel
        v-model:cabinet-id="cabinetWorkspace.positionFilters.cabinetId"
        v-model:cabinet-type="cabinetWorkspace.positionFilters.cabinetType"
        :cabinets="cabinetWorkspace.cabinets"
        :can-query-cabinets="capabilities.canQueryCabinets"
        :get-position-status-tag-type="display.getPositionStatusTagType"
        :loading="cabinetWorkspace.loading.positions"
        :position-error="cabinetWorkspace.positionError"
        :position-rows="cabinetWorkspace.positionRows"
        :position-summary="cabinetWorkspace.positionSummary"
        :selected-position="cabinetWorkspace.selectedPosition"
        :selected-position-code="cabinetWorkspace.selectedPositionCode"
        :selected-position-label="cabinetWorkspace.selectedPositionLabel"
        @clear-selected-position="cabinetWorkspace.clearSelectedPosition"
        @load-positions="cabinetWorkspace.loadPositions"
        @select-position="cabinetWorkspace.selectPosition"
      />

      <ArchiveSubmissionPanel
        v-model:archive-form="archiveWorkspace.archiveForm"
        :archive-permission-warning="archiveWorkspace.archivePermissionWarning"
        :archive-submit-button-text="archiveWorkspace.archiveSubmitButtonText"
        :can-submit-archive="archiveWorkspace.canSubmitArchive"
        :selected-position-label="cabinetWorkspace.selectedPositionLabel"
        :submitting="pageState.submitting"
        @submit-archive="archiveWorkspace.submitArchive"
      />

      <ArchiveRecordQueryPanel
        v-model:record-filters="recordWorkspace.recordFilters"
        :can-query-records="capabilities.canQueryRecords"
        :get-archive-status-tag-type="display.getArchiveStatusTagType"
        :get-loan-status-tag-type="display.getLoanStatusTagType"
        :loading="recordWorkspace.loading"
        :record-error="recordWorkspace.recordError"
        :records="recordWorkspace.records"
        @load-records="recordWorkspace.loadRecords"
      />

      <ArchiveLoanWorkbenchPanel
        v-model:loan-filters="loanWorkspace.loanFilters"
        v-model:loan-form="loanWorkspace.loanForm"
        :can-create-loan="capabilities.canCreateLoan"
        :can-query-loans="capabilities.canQueryLoans"
        :can-return-loan="capabilities.canReturnLoan"
        :get-loan-status-tag-type="display.getLoanStatusTagType"
        :loading="loanWorkspace.loading"
        :loan-error="loanWorkspace.loanError"
        :pending-loans="loanWorkspace.pendingLoans"
        :submitting="pageState.submitting"
        @load-loans="loanWorkspace.loadLoans"
        @open-return-dialog="loanWorkspace.openReturnDialog"
        @submit-loan="loanWorkspace.submitLoan"
      />
    </div>

    <ArchiveCabinetDialog
      v-model="cabinetWorkspace.cabinetDialogVisible"
      v-model:cabinet-form="cabinetWorkspace.cabinetForm"
      :cabinet-capacity-preview="cabinetWorkspace.cabinetCapacityPreview"
      :cabinet-dialog-mode="cabinetWorkspace.cabinetDialogMode"
      :cabinet-position-rule-preview="
        cabinetWorkspace.cabinetPositionRulePreview
      "
      :is-editing-cabinet="cabinetWorkspace.isEditingCabinet"
      :submitting="pageState.submitting"
      @submit="cabinetWorkspace.submitCabinet"
    />

    <ArchiveReturnDialog
      v-model="loanWorkspace.returnDialogVisible"
      v-model:return-form="loanWorkspace.returnForm"
      :returning-loan="loanWorkspace.returningLoan"
      :selected-position-label="cabinetWorkspace.selectedPositionLabel"
      :selected-return-position-description="
        loanWorkspace.selectedReturnPositionDescription
      "
      :submitting="pageState.submitting"
      @submit="loanWorkspace.submitReturn"
    />
  </Page>
</template>
