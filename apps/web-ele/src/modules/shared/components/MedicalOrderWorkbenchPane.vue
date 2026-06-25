<script setup lang="ts">
import type {
  MedicalOrderBlockOption,
  MedicalOrderWorkbenchValue,
} from './medical-order-workbench';

import type {
  MedicalOrderCategoryNode,
  MedicalOrderItemView,
  MedicalOrderPackageView,
} from '#/modules/doctor-workflow/types/doctor-workflow';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import { useUserStore } from '@vben/stores';

import {
  ElAlert,
  ElButton,
  ElCheckbox,
  ElDialog,
  ElEmpty,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import {
  confirmMedicalOrderBilling,
  createMedicalOrder,
  createMedicalOrderBlock,
  executeMedicalOrderBilling,
  listMedicalOrderDicts,
  listMedicalOrderPackagesPage,
} from '#/modules/doctor-workflow/api/doctor-workflow-service';
import { getDoctorWorkflowPageErrorMessage } from '#/modules/doctor-workflow/utils/error';
import {
  formatDateTime,
  formatMedicalOrderType,
  formatNullable,
} from '#/modules/doctor-workflow/utils/format';

export interface MedicalOrderWorkbenchPaneProps extends MedicalOrderWorkbenchValue {
  embedded?: boolean;
  loading?: boolean;
}

interface DraftMedicalOrderItem {
  key: string;
  orderContent: string;
  orderItemId: string;
  orderItemName: string;
  orderType: string;
  remarks: string;
  sourceName: string;
}

interface MedicalOrderTableRow {
  billingStatus?: null | string;
  doctorName: string;
  key: string;
  orderContent: string;
  orderId?: string;
  orderTime: string;
  remarks: string;
  removable: boolean;
  resultLabel: string;
  sequenceNo: number;
  statusLabel: string;
}

interface QuickTemplateRow {
  action: () => void;
  count: number;
  key: string;
  letterValues: Array<null | string | undefined>;
  searchValues: Array<null | string | undefined>;
  title: string;
  typeLabel: string;
}

interface MedicalOrderCategoryFilter {
  id: string;
  itemIds: Set<string>;
  label: string;
  testValue: string;
}

const props = withDefaults(defineProps<MedicalOrderWorkbenchPaneProps>(), {
  embedded: false,
  loading: false,
  pathologyNo: null,
  readonly: false,
});

const emit = defineEmits<{
  refresh: [];
}>();

const userStore = useUserStore();
const letterFilters = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];

const candidatesLoading = ref(false);
const submitLoading = ref(false);
const chargeLoading = ref(false);
const chargeDialogVisible = ref(false);
const candidateError = ref('');
const selectedBlockOptionId = ref('');
const keyword = ref('');
const manualBlockInput = ref('');
const activeCategoryId = ref('');
const selectedLetter = ref('');
const chargeActionStatus = ref('');
const selectedCandidateKeys = ref(new Set<string>());
const selectedMedicalOrderIds = ref(new Set<string>());
const dictTree = ref<MedicalOrderCategoryNode[]>([]);
const localMedicalOrderOnlyBlocks = ref<MedicalOrderBlockOption[]>([]);
const packages = ref<MedicalOrderPackageView[]>([]);
const draftItems = reactive<DraftMedicalOrderItem[]>([]);

const currentDoctorName = computed(
  () => userStore.userInfo?.realName?.trim() || '当前医生',
);

const selectedBlock = computed(() =>
  mergedBlockOptions.value.find(
    (item) => item.optionId === selectedBlockOptionId.value,
  ),
);
const mergedBlockOptions = computed(() => {
  const existingCodes = new Set(
    props.blockOptions.map((item) =>
      normalizeBlockCode(item.blockCode, props.pathologyNo),
    ),
  );
  return [
    ...props.blockOptions,
    ...localMedicalOrderOnlyBlocks.value.filter(
      (item) =>
        !existingCodes.has(
          normalizeBlockCode(item.blockCode, props.pathologyNo),
        ),
    ),
  ];
});
const normalizedKeyword = computed(() => keyword.value.trim().toLowerCase());
const sourceOrderItems = computed(() =>
  flattenMedicalOrderItems(dictTree.value).filter((item) => item.enabled),
);
const orderItems = computed(() => sourceOrderItems.value);
const orderItemMap = computed(() => {
  const map = new Map<string, MedicalOrderItemView>();
  for (const item of orderItems.value) {
    map.set(item.id, item);
  }
  return map;
});
const medicalOrderCategoryMap = computed(() => {
  const map = new Map<string, MedicalOrderCategoryNode>();
  const visit = (node: MedicalOrderCategoryNode) => {
    map.set(node.id, node);
    node.children.forEach((childNode) => visit(childNode));
  };
  dictTree.value.forEach((node) => visit(node));
  return map;
});
const categoryFilters = computed(() =>
  buildCategoryFilters(dictTree.value).filter(
    (categoryFilter) => categoryFilter.itemIds.size > 0,
  ),
);
const activeCategoryItemIds = computed(() => {
  if (!activeCategoryId.value) {
    return null;
  }
  return (
    categoryFilters.value.find((item) => item.id === activeCategoryId.value)
      ?.itemIds ?? null
  );
});
const chargeableMedicalOrders = computed(() =>
  props.medicalOrders.filter((item) => !isChargedStatus(item.billingStatus)),
);
const selectedChargeableMedicalOrderIds = computed(() => {
  const chargeableIds = new Set(
    chargeableMedicalOrders.value.map((item) => item.orderId),
  );
  return [...selectedMedicalOrderIds.value].filter((orderId) =>
    chargeableIds.has(orderId),
  );
});
const targetBillingOrderIds = computed(() =>
  selectedChargeableMedicalOrderIds.value.length > 0
    ? selectedChargeableMedicalOrderIds.value
    : chargeableMedicalOrders.value.map((item) => item.orderId),
);
const paidMedicalOrderCount = computed(
  () =>
    props.medicalOrders.filter((item) => isChargedStatus(item.billingStatus))
      .length,
);
const unpaidMedicalOrderCount = computed(
  () => props.medicalOrders.length - paidMedicalOrderCount.value,
);
const medicalOrderRows = computed<MedicalOrderTableRow[]>(() => {
  const existingRows = props.medicalOrders.map((item, index) => ({
    billingStatus: item.billingStatus,
    doctorName: formatNullable(item.doctorName),
    key: item.orderId,
    orderContent: formatMedicalOrderContent(
      item.orderContent,
      props.pathologyNo,
    ),
    orderId: item.orderId,
    orderTime: formatDateTime(item.orderDate),
    remarks: formatNullable(item.remarks),
    removable: false,
    resultLabel: formatBillingStatus(item.billingStatus),
    sequenceNo: index + 1,
    statusLabel: formatOrderStatus(item.status),
  }));
  const draftRows = draftItems.map((item, index) => ({
    doctorName: currentDoctorName.value,
    key: item.key,
    orderContent: item.orderContent,
    orderTime: '待提交',
    remarks: item.remarks || '-',
    removable: true,
    resultLabel: '未收费',
    sequenceNo: existingRows.length + index + 1,
    statusLabel: '待提交',
  }));
  return [...existingRows, ...draftRows];
});
const allQuickTemplateRows = computed<QuickTemplateRow[]>(() => {
  const packageRows = packages.value
    .filter((item) => item.enabled)
    .flatMap((item) => {
      const packageOrderItems = getPackageEnabledOrderItems(item).filter(
        (orderItem) => matchesActiveCategory(orderItem),
      );
      if (packageOrderItems.length === 0) {
        return [];
      }
      const packageItemNames = packageOrderItems
        .map((packageItem) => packageItem.orderItemName)
        .join(' ');
      const packageItemCodes = packageOrderItems
        .map((packageItem) => packageItem.orderItemCode)
        .join(' ');
      return [
        {
          action: () => addPackageItems(item),
          count: packageOrderItems.length,
          key: `package-${item.id}`,
          letterValues: [item.packageCode, item.packageName, packageItemCodes],
          searchValues: [
            item.packageCode,
            item.packageName,
            item.packageType,
            item.remarks,
            packageItemNames,
            packageOrderItems
              .map((orderItem) => orderItem.defaultContent)
              .join(' '),
          ],
          title: item.packageName,
          typeLabel: formatNullable(item.packageType),
        },
      ];
    });

  const itemRows = orderItems.value
    .filter((item) => matchesActiveCategory(item))
    .map((item) => {
      const category = medicalOrderCategoryMap.value.get(item.categoryId);
      return {
        action: () => addOrderItem(item),
        count: 1,
        key: `item-${item.id}`,
        letterValues: [
          item.orderItemCode,
          item.orderItemName,
          category?.categoryCode,
          category?.categoryName,
        ],
        searchValues: [
          item.orderItemCode,
          item.orderItemName,
          item.orderType,
          item.defaultContent,
          item.executionScope,
          category?.categoryCode,
          category?.categoryName,
        ],
        title: item.orderItemName,
        typeLabel: formatMedicalOrderType(item.orderType),
      };
    });

  return [...packageRows, ...itemRows];
});
const quickTemplateRows = computed(() => {
  const keywordRows = allQuickTemplateRows.value.filter((item) =>
    matchesKeyword(item.searchValues, normalizedKeyword.value),
  );
  return keywordRows.filter((item) => matchesLetter(item.letterValues));
});
const selectedQuickTemplateRows = computed(() =>
  quickTemplateRows.value.filter((item) =>
    selectedCandidateKeys.value.has(item.key),
  ),
);
const submitDisabledReason = computed(() => {
  if (props.readonly) {
    return '当前记录为只读，不能新增医嘱';
  }
  if (submitLoading.value) {
    return '医嘱提交中';
  }
  if (!props.caseId) {
    return '请先选择病例';
  }
  if (!selectedBlock.value) {
    return '请先选择蜡块';
  }
  if (!props.canCreateMedicalOrder) {
    return '当前账号没有创建医嘱权限';
  }
  if (draftItems.length === 0) {
    return '请先从下方待选列表添加医嘱草稿';
  }
  return '';
});
const canSubmit = computed(() => !submitDisabledReason.value);
const chargeDisabledReason = computed(() => {
  if (props.readonly) {
    return '当前记录为只读，不能执行收费';
  }
  if (chargeLoading.value) {
    return '收费处理中';
  }
  if (!props.caseId) {
    return '请先选择病例';
  }
  if (!props.canCreateMedicalOrder) {
    return '当前账号没有医嘱收费权限';
  }
  if (targetBillingOrderIds.value.length === 0) {
    return '当前没有可收费医嘱';
  }
  return '';
});
const chargePathologyLabel = computed(() => {
  const pathologyNo = props.pathologyNo?.trim();
  if (!pathologyNo) {
    return '-';
  }
  const blockCode = selectedBlock.value?.blockCode?.trim();
  return blockCode ? `${pathologyNo}-${blockCode}` : pathologyNo;
});

watch(
  () => props.caseId,
  () => {
    draftItems.splice(0);
    chargeActionStatus.value = '';
    localMedicalOrderOnlyBlocks.value = [];
    selectedMedicalOrderIds.value = new Set();
  },
);

watch(
  () => props.blockOptions,
  () => {
    if (
      mergedBlockOptions.value.some(
        (item) => item.optionId === selectedBlockOptionId.value,
      )
    ) {
      return;
    }
    selectedBlockOptionId.value = mergedBlockOptions.value[0]?.optionId ?? '';
  },
  { immediate: true },
);

watch(
  () => props.blockOptions,
  (blocks) => {
    const persistedCodes = new Set(
      blocks.map((item) =>
        normalizeBlockCode(item.blockCode, props.pathologyNo),
      ),
    );
    localMedicalOrderOnlyBlocks.value =
      localMedicalOrderOnlyBlocks.value.filter(
        (item) =>
          !persistedCodes.has(
            normalizeBlockCode(item.blockCode, props.pathologyNo),
          ),
      );
  },
  { immediate: true },
);

watch(quickTemplateRows, (rows) => {
  const visibleKeys = new Set(rows.map((item) => item.key));
  selectedCandidateKeys.value = new Set(
    [...selectedCandidateKeys.value].filter((key) => visibleKeys.has(key)),
  );
});

function flattenMedicalOrderItems(nodes: MedicalOrderCategoryNode[]) {
  const items: MedicalOrderItemView[] = [];
  const visit = (node: MedicalOrderCategoryNode) => {
    if (node.enabled) {
      items.push(...node.items.filter((item) => item.enabled));
    }
    node.children.forEach((childNode) => visit(childNode));
  };
  nodes.forEach((node) => visit(node));
  return items;
}

function matchesKeyword(
  values: Array<null | string | undefined>,
  value: string,
) {
  if (!value) {
    return true;
  }
  return values.some((item) => item?.toLowerCase().includes(value));
}

function matchesLetter(values: Array<null | string | undefined>) {
  if (!selectedLetter.value) {
    return true;
  }
  return values.some((item) =>
    item?.trim().toUpperCase().startsWith(selectedLetter.value),
  );
}

function buildCategoryFilters(nodes: MedicalOrderCategoryNode[]) {
  const categoryFilterItems: MedicalOrderCategoryFilter[] = [];
  const collectItemIds = (node: MedicalOrderCategoryNode) => {
    const itemIds = new Set<string>();
    if (node.enabled) {
      node.items
        .filter((item) => item.enabled)
        .forEach((item) => itemIds.add(item.id));
    }
    node.children.forEach((childNode) => {
      collectItemIds(childNode).forEach((itemId) => itemIds.add(itemId));
    });
    return itemIds;
  };
  const visit = (node: MedicalOrderCategoryNode) => {
    if (node.enabled) {
      categoryFilterItems.push({
        id: node.id,
        itemIds: collectItemIds(node),
        label: node.categoryName,
        testValue: node.categoryCode?.trim() || node.id,
      });
    }
    node.children.forEach((childNode) => visit(childNode));
  };
  nodes.forEach((node) => visit(node));
  return categoryFilterItems;
}

function matchesActiveCategory(item: MedicalOrderItemView) {
  return activeCategoryItemIds.value?.has(item.id) ?? true;
}

function getPackageEnabledOrderItems(row: MedicalOrderPackageView) {
  return row.items.flatMap((item) => {
    const orderItem = orderItemMap.value.get(item.orderItemId);
    return orderItem?.enabled ? [orderItem] : [];
  });
}

function isChargedStatus(value?: null | string) {
  return ['BILLED', 'CHARGED', 'PAID', 'SETTLED', 'SUCCESS'].includes(
    value?.trim().toUpperCase() ?? '',
  );
}

function formatBillingStatus(value?: null | string) {
  const labels: Record<string, string> = {
    BILLED: '已计费',
    CHARGED: '已收费',
    CHARGING: '收费中',
    FAILED: '收费失败',
    PAID: '已收费',
    PENDING: '待收费',
    REFUNDED: '已退费',
    SETTLED: '已收费',
    SUCCESS: '已收费',
    UNPAID: '未收费',
    UNBILLED: '未收费',
    UNCHARGED: '未收费',
  };
  const normalizedValue = value?.trim().toUpperCase();
  if (!normalizedValue) {
    return '-';
  }
  return labels[normalizedValue] ?? formatUnknownEnum(value ?? '', '未知结果');
}

function formatOrderStatus(value?: null | string) {
  const labels: Record<string, string> = {
    ACCEPTED: '已接收',
    CANCELLED: '已取消',
    COMPLETED: '已完成',
    FAILED: '执行失败',
    IN_PROGRESS: '执行中',
    PENDING: '待处理',
    PROCESSING: '处理中',
  };
  const normalizedValue = value?.trim().toUpperCase();
  if (!normalizedValue) {
    return '-';
  }
  return labels[normalizedValue] ?? formatUnknownEnum(value ?? '', '未知状态');
}

function formatUnknownEnum(value: string, fallback: string) {
  return /^[A-Z][\dA-Z_]*$/i.test(value.trim()) ? fallback : value;
}

function getBlockLabel(block: MedicalOrderBlockOption) {
  return block.label.trim();
}

function normalizeBlockCode(
  value: null | string | undefined,
  pathologyNo?: null | string,
) {
  const normalizedValue = getBlockTextLabel(value, pathologyNo)
    .trim()
    .toUpperCase();
  return normalizedValue;
}

function getBlockTextLabel(
  value: null | string | undefined,
  pathologyNo?: null | string,
) {
  const blockCode = value?.trim();
  const normalizedPathologyNo = pathologyNo?.trim();
  if (!blockCode || !normalizedPathologyNo) {
    return blockCode ?? '';
  }
  return blockCode
    .replace(new RegExp(`^${escapeRegExp(normalizedPathologyNo)}[-_]?`), '')
    .trim();
}

function formatMedicalOrderContent(
  value?: null | string,
  pathologyNo?: null | string,
) {
  const content = formatNullable(value);
  if (content === '-') {
    return content;
  }
  return content.replaceAll(
    /([（(]蜡块[:：]\s*)([^）)]*)([）)])/g,
    (_match, prefix: string, blockLabel: string, suffix: string) => {
      const cleanedBlockLabel = getBlockTextLabel(blockLabel, pathologyNo);
      return cleanedBlockLabel ? `${prefix}${cleanedBlockLabel}${suffix}` : '';
    },
  );
}

function escapeRegExp(value: string) {
  return value.replaceAll(/[$()*+.?[\\\]^{|}]/g, String.raw`\$&`);
}

function getSelectedBlockLabel() {
  return selectedBlock.value ? getBlockLabel(selectedBlock.value) : '';
}

function buildOrderContent(item: MedicalOrderItemView) {
  const content = item.defaultContent?.trim() || item.orderItemName;
  const blockLabel = getSelectedBlockLabel();
  return blockLabel ? `${content}（蜡块: ${blockLabel}）` : content;
}

function getSelectedBlockCode() {
  return selectedBlock.value?.blockCode?.trim() || undefined;
}

function findBlockOptionByCode(blockCode: string) {
  return mergedBlockOptions.value.find(
    (item) =>
      normalizeBlockCode(item.blockCode, props.pathologyNo) === blockCode,
  );
}

async function submitManualBlock() {
  if (props.readonly) {
    return;
  }
  if (!props.caseId) {
    ElMessage.warning('请先从左侧选择病例');
    return;
  }
  const normalizedBlockCode = normalizeBlockCode(
    manualBlockInput.value,
    props.pathologyNo,
  );
  if (!normalizedBlockCode) {
    ElMessage.warning('请输入蜡块号');
    return;
  }
  if (normalizedBlockCode.length > 64) {
    ElMessage.warning('蜡块号长度不能超过 64 位');
    return;
  }
  const existingBlock = findBlockOptionByCode(normalizedBlockCode);
  if (existingBlock) {
    selectedBlockOptionId.value = existingBlock.optionId;
    manualBlockInput.value = '';
    return;
  }
  try {
    const createdBlock = await createMedicalOrderBlock(props.caseId, {
      blockNo: normalizedBlockCode,
    });
    const nextOption = {
      blockCode: createdBlock.blockNo,
      description: null,
      label: normalizeBlockCode(createdBlock.blockNo, props.pathologyNo),
      optionId: `MEDICAL_ORDER_ONLY:${createdBlock.medicalOrderBlockId}`,
      source: 'MEDICAL_ORDER_ONLY' as const,
      targetBlockId: null,
    };
    localMedicalOrderOnlyBlocks.value = [
      ...localMedicalOrderOnlyBlocks.value,
      nextOption,
    ];
    selectedBlockOptionId.value = nextOption.optionId;
    manualBlockInput.value = '';
    emit('refresh');
  } catch (error) {
    ElMessage.error(getDoctorWorkflowPageErrorMessage(error));
  }
}

function addOrderItem(item: MedicalOrderItemView, sourceName = '快捷模板') {
  if (props.readonly) {
    return;
  }
  if (!selectedBlock.value) {
    ElMessage.warning('请先选择蜡块');
    return;
  }
  draftItems.push({
    key: `${item.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    orderContent: buildOrderContent(item),
    orderItemId: item.id,
    orderItemName: item.orderItemName,
    orderType: item.orderType?.trim() || 'OTHER',
    remarks: '',
    sourceName,
  });
}

function addPackageItems(row: MedicalOrderPackageView) {
  const enabledPackageItems = getPackageEnabledOrderItems(row).filter((item) =>
    matchesActiveCategory(item),
  );

  if (enabledPackageItems.length === 0) {
    ElMessage.warning('当前套餐没有可加入的启用条目');
    return;
  }

  enabledPackageItems.forEach((item) => addOrderItem(item, row.packageName));
}

function undoLastDraftItem() {
  if (props.readonly) {
    return;
  }
  if (draftItems.length === 0) {
    ElMessage.warning('当前没有可撤销的医嘱');
    return;
  }
  draftItems.splice(-1, 1);
}

function removeDraftItem(key: string) {
  if (props.readonly || !props.canCreateMedicalOrder) {
    return;
  }
  const index = draftItems.findIndex((item) => item.key === key);
  if (index === -1) {
    return;
  }
  draftItems.splice(index, 1);
}

function selectCategoryFilter(value: string) {
  activeCategoryId.value = value;
  selectedLetter.value = '';
  selectedCandidateKeys.value = new Set();
}

function selectLetter(value: string) {
  selectedLetter.value = selectedLetter.value === value ? '' : value;
  activeCategoryId.value = '';
  selectedCandidateKeys.value = new Set();
}

function clearTemplateFilters() {
  keyword.value = '';
  selectedLetter.value = '';
}

function addFirstCandidate() {
  quickTemplateRows.value[0]?.action();
}

function addSelectedCandidates() {
  if (props.readonly) {
    return;
  }
  if (selectedQuickTemplateRows.value.length === 0) {
    ElMessage.warning('请先勾选医嘱项目');
    return;
  }
  if (!selectedBlock.value) {
    ElMessage.warning('请先选择蜡块');
    return;
  }
  selectedQuickTemplateRows.value.forEach((item) => item.action());
  selectedCandidateKeys.value = new Set();
}

function setCandidateSelected(key: string, selected: boolean) {
  const nextKeys = new Set(selectedCandidateKeys.value);
  if (selected) {
    nextKeys.add(key);
  } else {
    nextKeys.delete(key);
  }
  selectedCandidateKeys.value = nextKeys;
}

function toggleCandidateSelection(key: string) {
  setCandidateSelected(key, !selectedCandidateKeys.value.has(key));
}

function isCandidateSelected(key: string) {
  return selectedCandidateKeys.value.has(key);
}

function handleCandidateKeywordKeydown(event: Event | KeyboardEvent) {
  if (event instanceof KeyboardEvent && event.key === 'F9') {
    event.preventDefault();
    clearTemplateFilters();
  }
}

function handleMedicalOrderSelectionChange(rows: MedicalOrderTableRow[]) {
  selectedMedicalOrderIds.value = new Set(
    rows.flatMap((row) =>
      isMedicalOrderRowSelectable(row) && row.orderId ? [row.orderId] : [],
    ),
  );
}

function isMedicalOrderRowSelectable(row: MedicalOrderTableRow) {
  return (
    !props.readonly &&
    Boolean(row.orderId) &&
    !isChargedStatus(row.billingStatus)
  );
}

async function executeCharge() {
  await runMedicalOrderBilling('execute', '执行收费');
}

async function confirmChargeCompletion() {
  await runMedicalOrderBilling('confirm', '确认完成收费');
}

async function runMedicalOrderBilling(
  action: 'confirm' | 'execute',
  successLabel: string,
) {
  if (!props.caseId) {
    ElMessage.warning('请先选择病例');
    return;
  }
  if (!props.canCreateMedicalOrder) {
    ElMessage.warning('当前账号没有医嘱收费权限');
    return;
  }
  const targetOrderIds = targetBillingOrderIds.value;
  if (targetOrderIds.length === 0) {
    ElMessage.warning('当前没有可收费医嘱');
    return;
  }

  chargeLoading.value = true;
  try {
    const payload = {
      caseId: props.caseId,
      orderIds:
        selectedChargeableMedicalOrderIds.value.length > 0
          ? selectedChargeableMedicalOrderIds.value
          : undefined,
      remarks: successLabel,
    };
    const result =
      action === 'execute'
        ? await executeMedicalOrderBilling(payload)
        : await confirmMedicalOrderBilling(payload);
    const statusText = `${successLabel}：成功 ${result.successCount} 条，失败 ${result.failureCount} 条`;
    chargeActionStatus.value = statusText;
    if (result.failureCount > 0) {
      ElMessage.warning(statusText);
    } else {
      ElMessage.success(statusText);
    }
    emit('refresh');
  } catch (error) {
    const message = getDoctorWorkflowPageErrorMessage(error);
    chargeActionStatus.value = message;
    ElMessage.error(message);
  } finally {
    chargeLoading.value = false;
  }
}

function openChargeManager() {
  if (!props.caseId) {
    ElMessage.warning('请先从左侧选择病例');
    return;
  }
  chargeDialogVisible.value = true;
}

function setChargeActionStatus(value: string) {
  chargeActionStatus.value = value;
  ElMessage.success(value);
}

async function loadCandidates() {
  candidatesLoading.value = true;
  candidateError.value = '';
  try {
    const [nextDictTree, packagePage] = await Promise.all([
      listMedicalOrderDicts(),
      listMedicalOrderPackagesPage({
        enabled: true,
        keyword: null,
        packageType: null,
        page: 1,
        size: 100,
      }),
    ]);
    dictTree.value = nextDictTree;
    packages.value = packagePage.items;
  } catch (error) {
    candidateError.value = getDoctorWorkflowPageErrorMessage(error);
  } finally {
    candidatesLoading.value = false;
  }
}

async function submitDraftOrders() {
  if (!props.caseId) {
    ElMessage.warning('请先从左侧选择病例');
    return;
  }
  if (!selectedBlock.value) {
    ElMessage.warning('请先选择蜡块');
    return;
  }
  if (!props.canCreateMedicalOrder) {
    ElMessage.warning('当前账号没有创建医嘱权限');
    return;
  }

  submitLoading.value = true;
  try {
    for (const item of draftItems) {
      await createMedicalOrder({
        blockNo: getSelectedBlockCode(),
        caseId: props.caseId,
        orderContent: item.orderContent,
        orderItemId: item.orderItemId,
        orderType: item.orderType,
        remarks: item.remarks.trim() || undefined,
        ...(selectedBlock.value.source === 'CASE_BLOCK'
          ? {
              targetBlockId:
                selectedBlock.value.targetBlockId?.trim() || undefined,
            }
          : {}),
        targetBlockNo: getSelectedBlockCode(),
      });
    }
    ElMessage.success('医嘱已提交');
    draftItems.splice(0);
    emit('refresh');
  } finally {
    submitLoading.value = false;
  }
}

onMounted(loadCandidates);
</script>

<template>
  <section
    class="flex min-h-[360px] flex-col bg-card"
    :class="
      embedded
        ? 'h-full'
        : 'rounded-lg border border-border shadow-sm xl:h-[calc(100vh-270px)]'
    "
    data-testid="diagnosis-workbench-medical-order-pane"
  >
    <div v-loading="loading" class="min-h-0 flex-1 overflow-auto">
      <ElEmpty v-if="!caseId" description="请先从左侧选择一个病例" />
      <div v-else class="flex min-h-0 flex-col">
        <ElAlert
          v-if="mergedBlockOptions.length === 0"
          :closable="false"
          class="m-3"
          title="当前病例暂无蜡块，不能创建医嘱"
          type="warning"
        />

        <section class="border-b border-border px-4 py-4">
          <div class="medical-order-action-panel">
            <div class="medical-order-action-panel__title">医嘱区</div>
            <div class="medical-order-action-panel__controls">
              <div class="medical-order-action-panel__pathology">
                <span class="medical-order-action-panel__pathology-label">
                  病理号：
                </span>
                <span class="medical-order-action-panel__pathology-value">
                  {{ pathologyNo || '-' }}
                </span>
              </div>
              <div class="medical-order-action-panel__select">
                <ElSelect
                  v-model="selectedBlockOptionId"
                  class="w-full"
                  :disabled="mergedBlockOptions.length === 0"
                  placeholder="请选择蜡块"
                  size="small"
                >
                  <ElOption
                    v-for="block in mergedBlockOptions"
                    :key="block.optionId"
                    :label="getBlockLabel(block)"
                    :value="block.optionId"
                  />
                </ElSelect>
              </div>
              <div
                class="medical-order-action-panel__manual-input"
                data-testid="medical-order-block-input"
              >
                <ElInput
                  v-model="manualBlockInput"
                  clearable
                  placeholder="输入蜡块号，回车添加"
                  size="small"
                  @keyup.enter="submitManualBlock"
                />
              </div>
              <div class="medical-order-action-panel__buttons">
                <ElButton
                  class="m-0 min-w-[108px]"
                  :disabled="Boolean(chargeDisabledReason)"
                  :loading="chargeLoading"
                  size="small"
                  :title="chargeDisabledReason || '执行收费'"
                  type="success"
                  @click="executeCharge"
                >
                  执行收费
                </ElButton>
                <ElButton
                  class="m-0 min-w-[108px]"
                  size="small"
                  @click="openChargeManager"
                >
                  收费管理
                </ElButton>
              </div>
            </div>
          </div>
        </section>

        <section class="min-h-[260px] border-b border-border">
          <div
            class="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/30 px-3 py-2"
          >
            <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h4 class="text-sm font-semibold text-foreground">
                医嘱项目: 未收费 ({{ unpaidMedicalOrderCount }}) 已收费 ({{
                  paidMedicalOrderCount
                }})
              </h4>
              <ElButton
                :disabled="!canSubmit"
                :loading="submitLoading"
                size="small"
                :title="submitDisabledReason || '提交医嘱'"
                type="primary"
                @click="submitDraftOrders"
              >
                提交医嘱
              </ElButton>
            </div>
          </div>
          <ElAlert
            v-if="!canCreateMedicalOrder"
            :closable="false"
            class="m-3"
            title="当前账号没有创建医嘱权限，仅可查看医嘱"
            type="info"
          />
          <ElTable
            :data="medicalOrderRows"
            border
            class="medical-order-table"
            size="small"
            @selection-change="handleMedicalOrderSelectionChange"
          >
            <ElTableColumn
              :selectable="isMedicalOrderRowSelectable"
              type="selection"
              width="42"
            />
            <ElTableColumn label="序" width="52">
              <template #default="{ row }">
                {{ row.sequenceNo }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="医嘱项目" min-width="180">
              <template #default="{ row }">
                <span class="whitespace-pre-wrap">{{ row.orderContent }}</span>
              </template>
            </ElTableColumn>
            <ElTableColumn label="状态" min-width="96">
              <template #default="{ row }">
                <ElTag size="small">{{ row.statusLabel }}</ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn label="结果" min-width="76">
              <template #default="{ row }">
                {{ row.resultLabel }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="医嘱时间" min-width="150">
              <template #default="{ row }">
                {{ row.orderTime }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="医嘱医生" min-width="110">
              <template #default="{ row }">
                {{ row.doctorName }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="备注" min-width="140">
              <template #default="{ row }">
                {{ row.remarks }}
              </template>
            </ElTableColumn>
            <ElTableColumn fixed="right" label="操作" width="88">
              <template #default="{ row }">
                <ElButton
                  v-if="row.removable"
                  :disabled="readonly || !canCreateMedicalOrder"
                  link
                  size="small"
                  type="danger"
                  @click="removeDraftItem(row.key)"
                >
                  删除
                </ElButton>
                <span v-else class="text-muted-foreground">-</span>
              </template>
            </ElTableColumn>
            <template #empty>
              <ElEmpty description="暂无医嘱项目" />
            </template>
          </ElTable>
        </section>

        <section class="min-h-[260px]">
          <div class="border-b border-border px-3 py-2">
            <div class="flex flex-wrap gap-1">
              <button
                v-for="categoryFilter in categoryFilters"
                :key="categoryFilter.id"
                class="h-7 border border-border bg-background px-2 text-xs text-foreground hover:border-primary"
                :class="
                  activeCategoryId === categoryFilter.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : ''
                "
                :data-testid="`medical-order-template-group-${categoryFilter.testValue}`"
                type="button"
                @click="selectCategoryFilter(categoryFilter.id)"
              >
                {{ categoryFilter.label }}
              </button>
            </div>
            <div class="mt-2 flex flex-wrap gap-1">
              <button
                v-for="letter in letterFilters"
                :key="letter"
                class="h-7 min-w-10 border border-border bg-background px-2 text-xs hover:border-primary"
                :class="
                  selectedLetter === letter
                    ? 'border-primary bg-primary/10 text-primary'
                    : ''
                "
                :data-testid="`medical-order-letter-${letter}`"
                type="button"
                @click="selectLetter(letter)"
              >
                {{ letter }}
              </button>
              <button
                class="h-7 min-w-16 border border-border bg-muted px-2 text-xs text-muted-foreground"
                data-testid="medical-order-clear-filters"
                type="button"
                @click="clearTemplateFilters"
              >
                清空
              </button>
            </div>
          </div>

          <div class="border-b border-border px-3 py-2">
            <div
              class="mb-1 flex flex-wrap items-center justify-between gap-2 text-xs"
            >
              <span class="font-semibold text-foreground">
                医嘱项目待选列表
              </span>
              <span class="text-muted-foreground">回车可添加首行</span>
            </div>
            <div class="flex gap-2">
              <ElButton
                class="shrink-0"
                :disabled="readonly"
                size="small"
                type="success"
                @click="addSelectedCandidates"
              >
                + 添加选中
              </ElButton>
              <ElInput
                v-model="keyword"
                clearable
                data-testid="medical-order-candidate-keyword"
                placeholder="快捷搜索，回车 / 双击添加，F9清空"
                size="small"
                @keydown="handleCandidateKeywordKeydown"
                @keyup.enter="addFirstCandidate"
              />
              <ElButton
                class="shrink-0"
                :disabled="readonly"
                size="small"
                @click="undoLastDraftItem"
              >
                撤销添加
              </ElButton>
            </div>
          </div>

          <div
            v-loading="candidatesLoading"
            class="max-h-[230px] overflow-auto"
          >
            <ElAlert
              v-if="candidateError"
              :closable="false"
              :title="candidateError"
              class="m-3"
              show-icon
              type="error"
            >
              <template #default>
                <ElButton link type="primary" @click="loadCandidates">
                  重试
                </ElButton>
              </template>
            </ElAlert>
            <div
              v-for="row in quickTemplateRows"
              :key="row.key"
              class="grid w-full grid-cols-[36px_minmax(0,1fr)_80px] items-center border-b border-border/60 px-3 py-1.5 text-left text-xs hover:bg-primary/5"
              :data-testid="`medical-order-candidate-${row.key}`"
              @dblclick="!readonly && row.action()"
            >
              <ElCheckbox
                :aria-label="`选择${row.title}`"
                :disabled="readonly"
                :model-value="isCandidateSelected(row.key)"
                @change="
                  (value) => setCandidateSelected(row.key, Boolean(value))
                "
                @click.stop
              />
              <button
                class="min-w-0 truncate text-left font-semibold text-foreground"
                :disabled="readonly"
                type="button"
                @click="toggleCandidateSelection(row.key)"
                @dblclick.stop="!readonly && row.action()"
              >
                【{{ row.title }}{{ row.count > 1 ? `${row.count}项` : '' }}】
              </button>
              <span class="truncate text-muted-foreground">
                {{ row.typeLabel }}
              </span>
            </div>
            <ElEmpty
              v-if="!candidateError && quickTemplateRows.length === 0"
              description="暂无符合条件的医嘱项目"
            />
          </div>
        </section>
      </div>
    </div>

    <ElDialog v-model="chargeDialogVisible" title="收费管理" width="480px">
      <div class="charge-manager-dialog">
        <div class="text-lg text-foreground">
          病理号:
          <span class="text-2xl font-semibold text-primary">
            {{ chargePathologyLabel }}
          </span>
        </div>
        <div class="mt-6 grid grid-cols-2 gap-4">
          <ElButton
            :disabled="Boolean(chargeDisabledReason)"
            :loading="chargeLoading"
            size="large"
            :title="chargeDisabledReason || '确认完成收费'"
            type="primary"
            @click="confirmChargeCompletion"
          >
            确认完成收费
          </ElButton>
          <ElButton size="large" @click="setChargeActionStatus('确认病人出院')">
            确认病人出院
          </ElButton>
          <ElButton
            :disabled="Boolean(chargeDisabledReason)"
            :loading="chargeLoading"
            size="large"
            :title="chargeDisabledReason || '重新执行收费'"
            type="danger"
            @click="runMedicalOrderBilling('execute', '重新执行收费')"
          >
            重新执行收费
          </ElButton>
          <div class="flex items-center text-sm text-muted-foreground">
            {{ chargeActionStatus || '病人出院将停止收费' }}
          </div>
        </div>
      </div>
    </ElDialog>
  </section>
</template>

<style scoped>
.medical-order-table :deep(.el-table__header th) {
  color: var(--el-text-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.medical-order-action-panel {
  display: grid;
  gap: 14px;
  padding: 20px 18px 16px;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--el-color-primary) 4%, white) 0%,
    white 100%
  );
  border: 2px solid color-mix(in srgb, var(--el-color-primary) 18%, transparent);
  border-radius: 8px;
}

.medical-order-action-panel__title {
  font-size: 16px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.medical-order-action-panel__controls {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(180px, 320px) minmax(
      180px,
      240px
    ) auto;
  gap: 12px;
  align-items: center;
}

.medical-order-action-panel__pathology {
  display: flex;
  gap: 6px;
  align-items: center;
  min-width: 0;
}

.medical-order-action-panel__pathology-label {
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.medical-order-action-panel__pathology-value {
  min-width: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  word-break: break-all;
}

.medical-order-action-panel__select {
  width: 100%;
}

.medical-order-action-panel__manual-input {
  width: 100%;
}

.medical-order-action-panel__buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: flex-end;
}

.charge-manager-dialog {
  padding: 8px 16px 16px;
}

@media (max-width: 1280px) {
  .medical-order-action-panel__controls {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .medical-order-action-panel__buttons {
    justify-content: flex-start;
  }
}

@media (max-width: 900px) {
  .medical-order-action-panel__controls {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
