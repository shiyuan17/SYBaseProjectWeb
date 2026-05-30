<script setup lang="ts">
import type { SpecimenVerificationRecord } from '../types/specimen-workflow';

import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  ElAlert,
  ElEmpty,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTabPane,
  ElTabs,
  ElTag,
} from 'element-plus';

import {
  getApplicationTracking,
  getSpecimenTrackingByBarcode,
  listSpecimenVerificationRecords,
} from '../api/specimen-workflow-service';
import { M2_PERMISSION_CODES } from '../constants';
import { formatDateTime, formatNullable } from '../utils/format';
import TrackingApplicationListView from './TrackingApplicationListView.vue';
import TrackingSpecimenListView from './TrackingSpecimenListView.vue';

type TrackingTab = 'applications' | 'specimens';

const route = useRoute();
const accessStore = useAccessStore();

const accessCodeSet = computed(() => new Set(accessStore.accessCodes));
const canViewApplications = computed(() =>
  accessCodeSet.value.has(M2_PERMISSION_CODES.APPLICATION_DETAIL_QUERY),
);
const canViewSpecimens = computed(() =>
  accessCodeSet.value.has(M2_PERMISSION_CODES.SPECIMEN_REGISTER),
);

const activeTab = ref<TrackingTab>('applications');
const applicationId = ref('');
const applicationTriggerKey = ref(0);
const barcode = ref('');
const specimenTriggerKey = ref(0);
const verificationLoading = ref(false);
const verificationError = ref('');
const verificationRecords = ref<SpecimenVerificationRecord[]>([]);
const verificationSpecimenOptions = ref<
  Array<{ barcode: string; label: string }>
>([]);
const selectedVerificationBarcode = ref('');
const correctionContextText = computed(() => {
  if (barcode.value) {
    return `当前已定位到条码 ${barcode.value}，如需修正异常，请先在标本列表完成异常回查，再回到现有标本管理能力中处理。`;
  }
  if (applicationId.value) {
    return `当前已定位到申请单 ${applicationId.value}，可先查看申请单时间线与异常标记，再进入标本列表做逐条修正。`;
  }
  return '异常修正默认仍收敛在现有标本管理能力内，不新增独立菜单；本页负责追踪回查、核对记录查看与修正入口说明。';
});

function normalizeQueryValue(value: unknown) {
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : '';
  }
  return '';
}

function resolveAvailableTab(preferredTab: TrackingTab): TrackingTab {
  if (preferredTab === 'applications' && canViewApplications.value) {
    return 'applications';
  }
  if (preferredTab === 'specimens' && canViewSpecimens.value) {
    return 'specimens';
  }
  return canViewApplications.value ? 'applications' : 'specimens';
}

async function loadVerificationRecordsByBarcode(targetBarcode: string) {
  const normalizedBarcode = normalizeQueryValue(targetBarcode).trim();
  if (!normalizedBarcode) {
    verificationRecords.value = [];
    verificationError.value = '';
    return;
  }

  verificationLoading.value = true;
  verificationError.value = '';
  try {
    verificationRecords.value =
      await listSpecimenVerificationRecords(normalizedBarcode);
  } catch (error) {
    verificationRecords.value = [];
    verificationError.value =
      error instanceof Error ? error.message : '加载核对记录失败';
  } finally {
    verificationLoading.value = false;
  }
}

async function buildVerificationContextFromBarcode(targetBarcode: string) {
  const normalizedBarcode = normalizeQueryValue(targetBarcode).trim();
  if (!normalizedBarcode) {
    verificationSpecimenOptions.value = [];
    selectedVerificationBarcode.value = '';
    verificationRecords.value = [];
    verificationError.value = '';
    return;
  }

  verificationLoading.value = true;
  verificationError.value = '';
  try {
    const tracking = await getSpecimenTrackingByBarcode(normalizedBarcode);
    verificationSpecimenOptions.value = tracking.specimens.map((specimen) => ({
      barcode: specimen.barcode,
      label: `${specimen.specimenNo || specimen.barcode} / ${specimen.specimenName}`,
    }));
    selectedVerificationBarcode.value =
      verificationSpecimenOptions.value.find(
        (item) => item.barcode === normalizedBarcode,
      )?.barcode ??
      verificationSpecimenOptions.value[0]?.barcode ??
      normalizedBarcode;
    await loadVerificationRecordsByBarcode(selectedVerificationBarcode.value);
  } catch (error) {
    verificationSpecimenOptions.value = [];
    selectedVerificationBarcode.value = normalizedBarcode;
    verificationRecords.value = [];
    verificationError.value =
      error instanceof Error ? error.message : '加载核对记录失败';
    verificationLoading.value = false;
  }
}

async function buildVerificationContextFromApplication(
  targetApplicationId: string,
) {
  const normalizedApplicationId =
    normalizeQueryValue(targetApplicationId).trim();
  if (!normalizedApplicationId) {
    verificationSpecimenOptions.value = [];
    selectedVerificationBarcode.value = '';
    verificationRecords.value = [];
    verificationError.value = '';
    return;
  }

  verificationLoading.value = true;
  verificationError.value = '';
  try {
    const tracking = await getApplicationTracking(normalizedApplicationId);
    verificationSpecimenOptions.value = tracking.specimens.map((specimen) => ({
      barcode: specimen.barcode,
      label: `${specimen.specimenNo || specimen.barcode} / ${specimen.specimenName}`,
    }));
    selectedVerificationBarcode.value =
      verificationSpecimenOptions.value[0]?.barcode ?? '';
    await loadVerificationRecordsByBarcode(selectedVerificationBarcode.value);
  } catch (error) {
    verificationSpecimenOptions.value = [];
    selectedVerificationBarcode.value = '';
    verificationRecords.value = [];
    verificationError.value =
      error instanceof Error ? error.message : '加载核对记录失败';
    verificationLoading.value = false;
  }
}

function handleVerificationBarcodeChange(value: string) {
  selectedVerificationBarcode.value = value;
  void loadVerificationRecordsByBarcode(value);
}

watch(
  () =>
    [
      route.query.applicationId,
      route.query.barcode,
      canViewApplications.value,
      canViewSpecimens.value,
    ] as const,
  ([applicationIdQuery, barcodeQuery]) => {
    const normalizedBarcode = normalizeQueryValue(barcodeQuery).trim();
    const normalizedApplicationId =
      normalizeQueryValue(applicationIdQuery).trim();

    if (normalizedBarcode) {
      activeTab.value = resolveAvailableTab('specimens');
      applicationId.value = '';
      barcode.value = normalizedBarcode;
      specimenTriggerKey.value += 1;
      void buildVerificationContextFromBarcode(normalizedBarcode);
      return;
    }

    if (normalizedApplicationId) {
      activeTab.value = resolveAvailableTab('applications');
      applicationId.value = normalizedApplicationId;
      barcode.value = '';
      applicationTriggerKey.value += 1;
      void buildVerificationContextFromApplication(normalizedApplicationId);
      return;
    }

    activeTab.value = resolveAvailableTab('applications');
    applicationId.value = '';
    barcode.value = '';
    verificationSpecimenOptions.value = [];
    selectedVerificationBarcode.value = '';
    verificationRecords.value = [];
    verificationError.value = '';
  },
  { immediate: true },
);
</script>

<template>
  <Page title="追踪与异常">
    <div class="flex flex-col gap-4">
      <ElAlert
        v-if="!canViewApplications && !canViewSpecimens"
        :closable="false"
        title="当前账号只有追踪菜单权限，暂无申请单列表或标本列表查看权限。"
        type="info"
        show-icon
      />

      <ElTabs
        v-if="canViewApplications || canViewSpecimens"
        v-model="activeTab"
      >
        <ElTabPane
          v-if="canViewApplications"
          label="申请单列表"
          name="applications"
        >
          <TrackingApplicationListView
            :initial-application-id="applicationId"
            :trigger-key="applicationTriggerKey"
          />
        </ElTabPane>
        <ElTabPane v-if="canViewSpecimens" label="标本列表" name="specimens">
          <TrackingSpecimenListView
            :initial-barcode="barcode"
            :trigger-key="specimenTriggerKey"
          />
        </ElTabPane>
      </ElTabs>

      <div
        v-if="canViewApplications || canViewSpecimens"
        class="grid gap-4 xl:grid-cols-2"
      >
        <section class="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div class="flex flex-col gap-3">
            <div
              class="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between"
            >
              <div class="text-base font-semibold text-foreground">
                核对记录视图
              </div>
              <ElSelect
                v-if="verificationSpecimenOptions.length > 0"
                v-model="selectedVerificationBarcode"
                placeholder="请选择标本条码"
                style="width: 320px"
                @change="handleVerificationBarcodeChange"
              >
                <ElOption
                  v-for="option in verificationSpecimenOptions"
                  :key="option.barcode"
                  :label="option.label"
                  :value="option.barcode"
                />
              </ElSelect>
            </div>

            <div class="text-sm leading-6 text-muted-foreground">
              当前按申请单或条码上下文直接展示 mock
              核对记录；后续切真实接口时，页面结构与承接位保持不变。
            </div>

            <div
              v-if="verificationError"
              class="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
            >
              {{ verificationError }}
            </div>

            <ElTable
              v-if="verificationRecords.length > 0"
              v-loading="verificationLoading"
              :data="verificationRecords"
              border
              size="small"
            >
              <ElTableColumn
                label="核对类型"
                min-width="150"
                prop="verificationType"
              />
              <ElTableColumn
                label="核对人"
                min-width="120"
                prop="operatorName"
              />
              <ElTableColumn label="核对时间" min-width="180">
                <template #default="{ row }">
                  {{ formatDateTime(row.verifiedAt) }}
                </template>
              </ElTableColumn>
              <ElTableColumn label="结果" min-width="120">
                <template #default="{ row }">
                  <ElTag
                    :type="row.result === 'SUCCESS' ? 'success' : 'danger'"
                  >
                    {{ row.result }}
                  </ElTag>
                </template>
              </ElTableColumn>
              <ElTableColumn label="说明" min-width="220">
                <template #default="{ row }">
                  {{ formatNullable(row.remarks) }}
                </template>
              </ElTableColumn>
            </ElTable>

            <ElEmpty
              v-else
              :description="
                verificationLoading
                  ? '核对记录加载中'
                  : '当前上下文暂无核对记录'
              "
            />
          </div>

          <div class="mt-2 text-xs text-muted-foreground">
            当前建议：
            {{
              activeTab === 'applications'
                ? '先从申请单视图确认全流程节点，再切换到标本视图查看单条标本事件。'
                : '当前已处于标本追踪视图，可直接按条码或异常标记回查最近事件。'
            }}
          </div>
        </section>

        <section
          class="rounded-lg border border-warning/30 bg-warning/10 p-4 shadow-sm"
        >
          <div class="text-base font-semibold text-foreground">
            异常修正入口说明
          </div>
          <div class="mt-2 text-sm leading-6 text-muted-foreground">
            {{ correctionContextText }}
          </div>
          <div class="mt-3 text-xs text-muted-foreground">
            修正范围包括：
            拒收/退回原因回查、质控问题核对、容器数量异常确认、标签补打与后续确认动作。
          </div>
        </section>
      </div>

      <div
        v-else
        class="rounded-lg border border-dashed border-border bg-card p-8"
      >
        <ElEmpty description="当前账号暂无追踪列表查看权限" />
      </div>
    </div>
  </Page>
</template>
