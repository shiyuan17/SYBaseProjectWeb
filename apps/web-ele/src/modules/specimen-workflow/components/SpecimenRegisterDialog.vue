<script setup lang="ts">
import type { SpecimenRegisterResult } from '../types/specimen-workflow';

import {
  ElAlert,
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import BodyPartSelect from '#/modules/system-management/components/BodyPartSelect.vue';
import ReferenceOptionSelect from '#/modules/system-management/components/ReferenceOptionSelect.vue';

import { useSpecimenRegisterDialog } from '../composables/useSpecimenRegisterDialog';
import {
  formatCurrentNode,
  formatNullable,
  formatQualityCheckResult,
  formatReceiptStatus,
} from '../utils/format';

const props = defineProps<{
  applicationId: string;
  modelValue: boolean;
}>();

const emit = defineEmits<{
  registered: [
    {
      applicationId: string;
      registerResult: SpecimenRegisterResult;
    },
  ];
  'update:modelValue': [boolean];
}>();

const {
  abnormalSpecimens,
  addRegisterRow,
  applicationDetail,
  canQueryApplicationDetail,
  closeDialog,
  currentApplicationId,
  detailStatusType,
  dialogVisible,
  loadingContext,
  pageError,
  refreshDialogContext,
  registerForm,
  registerItems,
  removeRegisterRow,
  resetRegisterForm,
  submitRegister,
  submittingRegister,
  workflowReferenceOptions,
} = useSpecimenRegisterDialog(props, emit);
</script>

<template>
  <ElDialog
    v-model="dialogVisible"
    :close-on-click-modal="false"
    destroy-on-close
    title="标本登记"
    top="4vh"
    width="min(1680px, calc(100vw - 32px))"
  >
    <div class="flex max-h-[72vh] flex-col gap-4 overflow-y-auto pr-1">
      <ElAlert
        v-if="false"
        :closable="false"
        :title="pageError"
        type="error"
        show-icon
      />

      <ElAlert
        v-if="!canQueryApplicationDetail"
        :closable="false"
        title="当前账号没有申请单详情查询权限，弹窗中仅展示申请单编号并允许直接登记。"
        type="info"
        show-icon
      />

      <ElAlert
        v-if="abnormalSpecimens.length > 0"
        :closable="false"
        title="最近一次登记存在异常标本，请根据异常原因修正后重新登记。"
        type="warning"
        show-icon
      >
        <template #default>
          <div class="mt-2 flex flex-col gap-2 text-sm">
            <div
              v-for="specimen in abnormalSpecimens"
              :key="`${specimen.id}-${specimen.barcode}`"
              class="rounded border border-warning/30 bg-warning/10 px-3 py-2"
            >
              <div>
                {{ specimen.specimenNo || '-' }} / {{ specimen.barcode || '-' }}
              </div>
              <div class="mt-1 grid gap-1 text-muted-foreground md:grid-cols-2">
                <div>异常类型：{{ formatReceiptStatus(specimen.status) }}</div>
                <div>
                  质控结果：{{
                    formatQualityCheckResult(specimen.qualityCheckResult)
                  }}
                </div>
                <div>
                  问题代码：{{
                    specimen.qualityIssueCodes.length > 0
                      ? specimen.qualityIssueCodes.join('、')
                      : '-'
                  }}
                </div>
                <div>原因：{{ specimen.reason || '-' }}</div>
              </div>
            </div>
          </div>
        </template>
      </ElAlert>

      <section class="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div
          class="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"
        >
          <div class="text-base font-semibold text-foreground">当前上下文</div>
          <ElButton :loading="loadingContext" @click="refreshDialogContext">
            刷新详情
          </ElButton>
        </div>

        <ElDescriptions :column="2" border>
          <ElDescriptionsItem label="申请单编号">
            {{ currentApplicationId || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="申请单号">
            {{ formatNullable(applicationDetail?.applicationNo) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="当前节点">
            {{ formatCurrentNode(applicationDetail?.currentNode) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="患者姓名">
            {{ formatNullable(applicationDetail?.patientName) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="送检科室">
            {{ formatNullable(applicationDetail?.submittingDepartmentName) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="异常标记">
            <ElTag :type="detailStatusType">
              {{ applicationDetail?.abnormalFlag ? '有异常' : '正常' }}
            </ElTag>
          </ElDescriptionsItem>
        </ElDescriptions>
      </section>

      <section class="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div class="mb-4 text-base font-semibold text-foreground">登记表单</div>

        <ElForm label-width="104px">
          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <ElFormItem label="登记人" required>
              <ElInput :model-value="registerForm.operatorName" disabled />
            </ElFormItem>
            <ElFormItem label="打印机编号">
              <ElInput
                v-model="registerForm.printerCode"
                placeholder="用于标签打印"
              />
            </ElFormItem>
            <ElFormItem label="终端编号">
              <ElInput
                v-model="registerForm.terminalCode"
                placeholder="扫码枪或工作站终端"
              />
            </ElFormItem>
            <ElFormItem label="采集场景">
              <ElInput
                v-model="registerForm.collectionScene"
                placeholder="例如：门诊、病房、手术室"
              />
            </ElFormItem>
          </div>
          <ElFormItem label="备注">
            <ElInput
              v-model="registerForm.remarks"
              :rows="2"
              placeholder="补充登记说明"
              type="textarea"
            />
          </ElFormItem>
        </ElForm>

        <ElTable :data="registerItems" :max-height="360" border>
          <ElTableColumn label="标本名称" min-width="180">
            <template #default="{ row }">
              <ElInput
                v-model="row.specimenNameStandardized"
                placeholder="标准化标本名称"
              />
            </template>
          </ElTableColumn>
          <ElTableColumn label="标本类型" min-width="140">
            <template #default="{ row }">
              <ReferenceOptionSelect
                v-model="row.specimenType"
                :options="workflowReferenceOptions.specimenTypes"
                placeholder="请选择或输入类型"
              />
            </template>
          </ElTableColumn>
          <ElTableColumn label="标本部位" min-width="140">
            <template #default="{ row }">
              <BodyPartSelect v-model="row.specimenSite" placeholder="部位" />
            </template>
          </ElTableColumn>
          <ElTableColumn label="采集方式" min-width="140">
            <template #default="{ row }">
              <ReferenceOptionSelect
                v-model="row.collectionMode"
                :options="workflowReferenceOptions.collectionModes"
                placeholder="请选择或输入采集方式"
              />
            </template>
          </ElTableColumn>
          <ElTableColumn label="标本数量" min-width="120">
            <template #default="{ row }">
              <ElInputNumber
                v-model="row.specimenCount"
                :min="1"
                style="width: 100%"
              />
            </template>
          </ElTableColumn>
          <ElTableColumn label="容器名称" min-width="160">
            <template #default="{ row }">
              <ReferenceOptionSelect
                v-model="row.containerName"
                :options="workflowReferenceOptions.containerNames"
                placeholder="请选择或输入容器名称"
              />
            </template>
          </ElTableColumn>
          <ElTableColumn label="容器数量" min-width="120">
            <template #default="{ row }">
              <ElInputNumber
                v-model="row.containerCount"
                :min="1"
                style="width: 100%"
              />
            </template>
          </ElTableColumn>
          <ElTableColumn label="条码" min-width="180">
            <template #default="{ row }">
              <ElInput v-model="row.barcode" placeholder="可留空由后端生成" />
            </template>
          </ElTableColumn>
          <ElTableColumn label="临床症状" min-width="180">
            <template #default="{ row }">
              <ReferenceOptionSelect
                v-model="row.clinicalSymptom"
                :options="workflowReferenceOptions.clinicalSymptoms"
                placeholder="请选择或输入临床症状"
              />
            </template>
          </ElTableColumn>
          <ElTableColumn fixed="right" label="操作" width="140">
            <template #default="{ row }">
              <div class="flex items-center gap-3">
                <ElButton link type="primary" @click="addRegisterRow(row.key)">
                  新增
                </ElButton>
                <ElButton
                  link
                  type="danger"
                  @click="removeRegisterRow(row.key)"
                >
                  删除
                </ElButton>
              </div>
            </template>
          </ElTableColumn>
        </ElTable>

        <div class="mt-4 flex justify-end gap-2">
          <ElButton @click="resetRegisterForm">重置登记表单</ElButton>
          <ElButton
            :loading="submittingRegister"
            type="primary"
            @click="submitRegister"
          >
            提交登记
          </ElButton>
        </div>
      </section>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <ElButton @click="closeDialog">关闭</ElButton>
      </div>
    </template>
  </ElDialog>
</template>
