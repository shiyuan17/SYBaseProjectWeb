<script setup lang="ts">
import type {
  BlockSummary,
  DiagnosticWorkbenchView,
  MedicalOrderCategoryNode,
  MedicalOrderItemView,
  MedicalOrderPackageView,
} from '../types/doctor-workflow';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import { useAccessStore, useUserStore } from '@vben/stores';

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
  createMedicalOrder,
  listMedicalOrderDicts,
  listMedicalOrderPackagesPage,
} from '../api/doctor-workflow-service';
import { M4_PERMISSION_CODES } from '../constants';
import { getDoctorWorkflowPageErrorMessage } from '../utils/error';
import {
  formatDateTime,
  formatMedicalOrderType,
  formatNullable,
} from '../utils/format';

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
  doctorName: string;
  draftIndex?: number;
  key: string;
  orderContent: string;
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

interface MedicalOrderGroupMatcher {
  keywords: string[];
  orderTypes: string[];
}

interface FallbackMedicalOrderItemSeed {
  defaultContent?: string;
  group: (typeof templateGroups)[number]['value'];
  name: string;
  orderItemCode: string;
  orderType: string;
}

const props = defineProps<{
  loading?: boolean;
  workbench: DiagnosticWorkbenchView | null;
}>();

const emit = defineEmits<{
  refresh: [];
}>();

const accessStore = useAccessStore();
const userStore = useUserStore();

const templateGroups = [
  { label: '特染', value: 'SPECIAL_STAIN' },
  { label: 'Fish', value: 'FISH' },
  { label: '基因', value: 'GENE' },
  { label: '荧光', value: 'FLUORESCENCE' },
  { label: 'α/β', value: 'ALPHA_BETA' },
  { label: '切片', value: 'SLICE' },
  { label: '垂体', value: 'PITUITARY' },
  { label: '快切', value: 'FROZEN' },
  { label: '借阅', value: 'BORROW' },
] as const;
const letterFilters = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
const templateGroupMatchers: Record<string, MedicalOrderGroupMatcher> = {
  ALPHA_BETA: {
    keywords: ['α/β', 'α', 'β', 'alpha', 'beta', 'tcr'],
    orderTypes: ['ALPHA_BETA', 'ALPHA', 'BETA', 'TCR'],
  },
  BORROW: {
    keywords: ['借阅', '外借', '归档借阅', 'borrow', 'loan'],
    orderTypes: ['BORROW', 'LOAN', 'ARCHIVE_LOAN'],
  },
  FISH: {
    keywords: ['fish', '荧光原位杂交'],
    orderTypes: ['FISH'],
  },
  FLUORESCENCE: {
    keywords: ['荧光', '英光', '免疫荧光', 'fluorescence', 'if'],
    orderTypes: ['FLUORESCENCE', 'IMMUNE_FLUORESCENCE', 'IMMUNOFLUORESCENCE'],
  },
  FROZEN: {
    keywords: ['快切', '快速切片', '冰冻', 'frozen'],
    orderTypes: ['FROZEN', 'FROZEN_SECTION'],
  },
  GENE: {
    keywords: ['基因', '分子', 'gene', 'molecular'],
    orderTypes: ['GENE', 'GENE_TEST', 'MOLECULAR', 'MOLECULAR_TEST'],
  },
  PITUITARY: {
    keywords: ['垂体', 'pituitary'],
    orderTypes: ['PITUITARY'],
  },
  SLICE: {
    keywords: ['切片', '白片', '深切', 'slice', 'section'],
    orderTypes: ['SLICE', 'SLICING', 'SECTION', 'DEEPER_CUT'],
  },
  SPECIAL_STAIN: {
    keywords: ['特染', '特殊染色', 'special stain', 'special_stain'],
    orderTypes: ['SPECIAL_STAIN', 'SPECIAL_STAINING'],
  },
};
const fallbackMedicalOrderCategories: MedicalOrderCategoryNode[] =
  templateGroups.map((group, index) => ({
    categoryCode: group.value,
    categoryName: group.label,
    children: [],
    enabled: true,
    id: `FALLBACK_CATEGORY_${group.value}`,
    items: [],
    parentId: null,
    sortOrder: index + 1,
  }));
const fallbackMedicalOrderItemSeeds: FallbackMedicalOrderItemSeed[] = [
  {
    group: 'SPECIAL_STAIN',
    name: 'AB(Alcian blue)染色(pH2.5)',
    orderItemCode: 'SS-AB-PH25',
    orderType: 'SPECIAL_STAIN',
  },
  {
    group: 'SPECIAL_STAIN',
    name: 'AB(pH2.5)-PAS染色',
    orderItemCode: 'SS-AB-PAS',
    orderType: 'SPECIAL_STAIN',
  },
  {
    group: 'SPECIAL_STAIN',
    name: 'D-PAS',
    orderItemCode: 'SS-D-PAS',
    orderType: 'SPECIAL_STAIN',
  },
  {
    group: 'SPECIAL_STAIN',
    name: 'GMS',
    orderItemCode: 'SS-GMS',
    orderType: 'SPECIAL_STAIN',
  },
  {
    group: 'SPECIAL_STAIN',
    name: 'Masson改良三色染色法',
    orderItemCode: 'SS-MASSON',
    orderType: 'SPECIAL_STAIN',
  },
  {
    group: 'SPECIAL_STAIN',
    name: 'PAS染色',
    orderItemCode: 'SS-PAS',
    orderType: 'SPECIAL_STAIN',
  },
  {
    group: 'SPECIAL_STAIN',
    name: 'W-S染色(Warthin-Starry)',
    orderItemCode: 'SS-WS',
    orderType: 'SPECIAL_STAIN',
  },
  {
    group: 'SPECIAL_STAIN',
    name: '弹力纤维染色(醛品红法)',
    orderItemCode: 'SS-ELASTIC',
    orderType: 'SPECIAL_STAIN',
  },
  {
    group: 'SPECIAL_STAIN',
    name: '淀粉样蛋白(刚果红)染色',
    orderItemCode: 'SS-CONGO-RED',
    orderType: 'SPECIAL_STAIN',
  },
  {
    group: 'SPECIAL_STAIN',
    name: '革兰氏染色(GRAM)',
    orderItemCode: 'SS-GRAM',
    orderType: 'SPECIAL_STAIN',
  },
  {
    group: 'SPECIAL_STAIN',
    name: '抗酸染色(AAS)',
    orderItemCode: 'SS-AAS',
    orderType: 'SPECIAL_STAIN',
  },
  {
    group: 'SPECIAL_STAIN',
    name: '六胺银染色(GMS)',
    orderItemCode: 'SS-METHENAMINE-SILVER',
    orderType: 'SPECIAL_STAIN',
  },
  {
    group: 'FISH',
    name: '1p19q(Fish)',
    orderItemCode: 'FISH-1P19Q',
    orderType: 'FISH',
  },
  {
    group: 'FISH',
    name: 'BCL-2(Fish)',
    orderItemCode: 'FISH-BCL2',
    orderType: 'FISH',
  },
  {
    group: 'FISH',
    name: 'BCL-6(Fish)',
    orderItemCode: 'FISH-BCL6',
    orderType: 'FISH',
  },
  {
    group: 'FISH',
    name: 'Her-2(Fish)',
    orderItemCode: 'FISH-HER2',
    orderType: 'FISH',
  },
  {
    group: 'FISH',
    name: 'Her2基因扩增检测(Fish)',
    orderItemCode: 'FISH-HER2-AMP',
    orderType: 'FISH',
  },
  {
    group: 'FISH',
    name: 'IgH-BCL2(Fish)',
    orderItemCode: 'FISH-IGH-BCL2',
    orderType: 'FISH',
  },
  {
    group: 'FISH',
    name: 'MYC(Fish)',
    orderItemCode: 'FISH-MYC',
    orderType: 'FISH',
  },
  {
    group: 'FISH',
    name: 'SS18(Fish)',
    orderItemCode: 'FISH-SS18',
    orderType: 'FISH',
  },
  {
    group: 'GENE',
    name: 'EGFR基因突变检测',
    orderItemCode: 'GENE-EGFR',
    orderType: 'GENE',
  },
  {
    group: 'GENE',
    name: 'KRAS基因突变检测',
    orderItemCode: 'GENE-KRAS',
    orderType: 'GENE',
  },
  {
    group: 'GENE',
    name: 'NRAS基因突变检测',
    orderItemCode: 'GENE-NRAS',
    orderType: 'GENE',
  },
  {
    group: 'GENE',
    name: 'BRAF基因突变检测',
    orderItemCode: 'GENE-BRAF',
    orderType: 'GENE',
  },
  {
    group: 'GENE',
    name: 'PIK3CA基因突变检测',
    orderItemCode: 'GENE-PIK3CA',
    orderType: 'GENE',
  },
  {
    group: 'GENE',
    name: 'MSI微卫星不稳定检测',
    orderItemCode: 'GENE-MSI',
    orderType: 'GENE',
  },
  {
    group: 'GENE',
    name: 'NTRK融合基因检测',
    orderItemCode: 'GENE-NTRK',
    orderType: 'GENE',
  },
  {
    group: 'FLUORESCENCE',
    name: 'C1q免疫荧光',
    orderItemCode: 'IF-C1Q',
    orderType: 'IMMUNE_FLUORESCENCE',
  },
  {
    group: 'FLUORESCENCE',
    name: 'C3免疫荧光',
    orderItemCode: 'IF-C3',
    orderType: 'IMMUNE_FLUORESCENCE',
  },
  {
    group: 'FLUORESCENCE',
    name: 'C4免疫荧光',
    orderItemCode: 'IF-C4',
    orderType: 'IMMUNE_FLUORESCENCE',
  },
  {
    group: 'FLUORESCENCE',
    name: 'Fib免疫荧光',
    orderItemCode: 'IF-FIB',
    orderType: 'IMMUNE_FLUORESCENCE',
  },
  {
    group: 'FLUORESCENCE',
    name: 'IgA免疫荧光',
    orderItemCode: 'IF-IGA',
    orderType: 'IMMUNE_FLUORESCENCE',
  },
  {
    group: 'FLUORESCENCE',
    name: 'IgG免疫荧光',
    orderItemCode: 'IF-IGG',
    orderType: 'IMMUNE_FLUORESCENCE',
  },
  {
    group: 'FLUORESCENCE',
    name: 'IgM免疫荧光',
    orderItemCode: 'IF-IGM',
    orderType: 'IMMUNE_FLUORESCENCE',
  },
  {
    group: 'FLUORESCENCE',
    name: 'SBCD',
    orderItemCode: 'IF-SBCD',
    orderType: 'IMMUNE_FLUORESCENCE',
  },
  {
    group: 'FLUORESCENCE',
    name: '结构免疫荧光',
    orderItemCode: 'IF-STRUCTURE',
    orderType: 'IMMUNE_FLUORESCENCE',
  },
  {
    group: 'ALPHA_BETA',
    name: 'TCR α/β检测',
    orderItemCode: 'AB-TCR',
    orderType: 'ALPHA_BETA',
  },
  {
    group: 'ALPHA_BETA',
    name: 'TCR β基因重排检测',
    orderItemCode: 'AB-TCR-BETA',
    orderType: 'ALPHA_BETA',
  },
  {
    group: 'ALPHA_BETA',
    name: 'TCR γ基因重排检测',
    orderItemCode: 'AB-TCR-GAMMA',
    orderType: 'ALPHA_BETA',
  },
  {
    group: 'SLICE',
    name: '白片',
    orderItemCode: 'SLICE-BLANK',
    orderType: 'SLICE',
  },
  {
    group: 'SLICE',
    name: '深切',
    orderItemCode: 'SLICE-DEEPER-CUT',
    orderType: 'SLICE',
  },
  {
    group: 'SLICE',
    name: '连续切片',
    orderItemCode: 'SLICE-SERIAL',
    orderType: 'SLICE',
  },
  {
    group: 'SLICE',
    name: '重切片',
    orderItemCode: 'SLICE-RECUT',
    orderType: 'SLICE',
  },
  {
    group: 'PITUITARY',
    name: '垂体PRL',
    orderItemCode: 'PITUITARY-PRL',
    orderType: 'PITUITARY',
  },
  {
    group: 'PITUITARY',
    name: '垂体GH',
    orderItemCode: 'PITUITARY-GH',
    orderType: 'PITUITARY',
  },
  {
    group: 'PITUITARY',
    name: '垂体ACTH',
    orderItemCode: 'PITUITARY-ACTH',
    orderType: 'PITUITARY',
  },
  {
    group: 'PITUITARY',
    name: '垂体TSH',
    orderItemCode: 'PITUITARY-TSH',
    orderType: 'PITUITARY',
  },
  {
    group: 'FROZEN',
    name: '快速切片',
    orderItemCode: 'FROZEN-SECTION',
    orderType: 'FROZEN',
  },
  {
    group: 'FROZEN',
    name: '冰冻切片',
    orderItemCode: 'FROZEN-SLICE',
    orderType: 'FROZEN',
  },
  {
    group: 'FROZEN',
    name: '术中快速病理',
    orderItemCode: 'FROZEN-INTRAOPERATIVE',
    orderType: 'FROZEN',
  },
  {
    group: 'BORROW',
    name: '借阅切片',
    orderItemCode: 'BORROW-SLIDE',
    orderType: 'BORROW',
  },
  {
    group: 'BORROW',
    name: '借阅蜡块',
    orderItemCode: 'BORROW-BLOCK',
    orderType: 'BORROW',
  },
  {
    group: 'BORROW',
    name: '借阅申请单',
    orderItemCode: 'BORROW-APPLICATION',
    orderType: 'BORROW',
  },
];
const fallbackMedicalOrderItems = fallbackMedicalOrderItemSeeds.map(
  (item, index): MedicalOrderItemView => ({
    categoryId: `FALLBACK_CATEGORY_${item.group}`,
    defaultContent: item.defaultContent ?? item.name,
    enabled: true,
    executionScope: 'BLOCK',
    id: `FALLBACK_ITEM_${item.orderItemCode}`,
    orderItemCode: item.orderItemCode,
    orderItemName: item.name,
    orderType: item.orderType,
    sortOrder: index + 1,
  }),
);

const candidatesLoading = ref(false);
const submitLoading = ref(false);
const chargeDialogVisible = ref(false);
const candidateError = ref('');
const selectedBlockId = ref('');
const keyword = ref('');
const activeTemplateGroup = ref('SPECIAL_STAIN');
const selectedLetter = ref('');
const chargeActionStatus = ref('');
const selectedCandidateKeys = ref(new Set<string>());
const dictTree = ref<MedicalOrderCategoryNode[]>([]);
const packages = ref<MedicalOrderPackageView[]>([]);
const draftItems = reactive<DraftMedicalOrderItem[]>([]);

const canCreateMedicalOrder = computed(() =>
  accessStore.accessCodes.includes(M4_PERMISSION_CODES.MEDICAL_ORDER_CREATE),
);

const blockOptions = computed(() => props.workbench?.blocks ?? []);
const selectedBlock = computed(() =>
  blockOptions.value.find((item) => item.blockId === selectedBlockId.value),
);
const normalizedKeyword = computed(() => keyword.value.trim().toLowerCase());
const currentDoctorName = computed(
  () => userStore.userInfo?.realName || '当前医生',
);
const sourceOrderItems = computed(() =>
  flattenMedicalOrderItems(dictTree.value).filter((item) => item.enabled),
);
const orderItems = computed(() =>
  mergeFallbackOrderItems(sourceOrderItems.value, fallbackMedicalOrderItems),
);
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
  fallbackMedicalOrderCategories.forEach((node) => visit(node));
  dictTree.value.forEach((node) => visit(node));
  return map;
});
const paidMedicalOrderCount = computed(
  () =>
    props.workbench?.medicalOrders.filter((item) =>
      isChargedStatus(item.billingStatus),
    ).length ?? 0,
);
const unpaidMedicalOrderCount = computed(
  () =>
    (props.workbench?.medicalOrders.length ?? 0) - paidMedicalOrderCount.value,
);
const medicalOrderRows = computed<MedicalOrderTableRow[]>(() => {
  const existingRows =
    props.workbench?.medicalOrders.map((item, index) => ({
      doctorName: formatNullable(item.doctorName),
      key: item.orderId,
      orderContent: formatNullable(item.orderContent),
      orderTime: formatDateTime(item.orderDate),
      remarks: formatNullable(item.remarks),
      removable: false,
      resultLabel: formatBillingStatus(item.billingStatus),
      sequenceNo: index + 1,
      statusLabel: formatOrderStatus(item.status),
    })) ?? [];
  const draftRows = draftItems.map((item, index) => ({
    doctorName: currentDoctorName.value,
    draftIndex: index,
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
    .filter((item) => matchesTemplateGroup(item))
    .map((item) => {
      const packageOrderItems = item.items.flatMap((packageItem) => {
        const orderItem = orderItemMap.value.get(packageItem.orderItemId);
        return orderItem ? [orderItem] : [];
      });
      const packageItemNames = item.items
        .map((packageItem) => packageItem.orderItemName)
        .join(' ');
      const packageItemCodes = item.items
        .map((packageItem) => packageItem.orderItemCode)
        .join(' ');
      return {
        action: () => addPackageItems(item),
        count: item.items.length,
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
      };
    });

  const itemRows = orderItems.value
    .filter((item) => matchesOrderItemTemplateGroup(item))
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
const canSubmit = computed(
  () =>
    Boolean(props.workbench?.caseId) &&
    Boolean(selectedBlock.value) &&
    canCreateMedicalOrder.value &&
    draftItems.length > 0 &&
    !submitLoading.value,
);
const chargePathologyLabel = computed(() => {
  const pathologyNo = props.workbench?.pathologyNo?.trim();
  if (!pathologyNo) {
    return '-';
  }
  const blockCode = selectedBlock.value?.blockCode?.trim();
  return blockCode ? `${pathologyNo}-${blockCode}` : pathologyNo;
});

watch(
  () => props.workbench?.caseId,
  () => {
    draftItems.splice(0);
    chargeActionStatus.value = '';
  },
);

watch(
  blockOptions,
  (blocks) => {
    if (blocks.some((item) => item.blockId === selectedBlockId.value)) {
      return;
    }
    selectedBlockId.value = blocks[0]?.blockId ?? '';
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
      items.push(...node.items);
    }
    node.children.forEach((childNode) => visit(childNode));
  };
  nodes.forEach((node) => visit(node));
  return items;
}

function mergeFallbackOrderItems(
  sourceItems: MedicalOrderItemView[],
  fallbackItems: MedicalOrderItemView[],
) {
  const knownKeys = new Set<string>();
  const addKnownKeys = (item: MedicalOrderItemView) => {
    const code = normalizeCode(item.orderItemCode);
    if (code) {
      knownKeys.add(`code:${code}`);
    }
    knownKeys.add(`name:${normalizeSearchText(item.orderItemName)}`);
  };
  for (const item of sourceItems) {
    addKnownKeys(item);
  }

  const mergedItems = [...sourceItems];
  for (const item of fallbackItems) {
    const code = normalizeCode(item.orderItemCode);
    const name = normalizeSearchText(item.orderItemName);
    if (
      (code && knownKeys.has(`code:${code}`)) ||
      knownKeys.has(`name:${name}`)
    ) {
      continue;
    }
    mergedItems.push(item);
    addKnownKeys(item);
  }
  return mergedItems;
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

function matchesTemplateGroup(row: MedicalOrderPackageView) {
  const packageOrderItems = row.items.flatMap((item) => {
    const orderItem = orderItemMap.value.get(item.orderItemId);
    return orderItem ? [orderItem] : [];
  });
  return matchesActiveTemplateGroup(
    [
      row.packageCode,
      row.packageType,
      ...packageOrderItems.map((item) => item.orderItemCode),
      ...packageOrderItems.map((item) => item.orderType),
      ...packageOrderItems.map(
        (item) =>
          medicalOrderCategoryMap.value.get(item.categoryId)?.categoryCode,
      ),
    ],
    [
      row.packageName,
      row.remarks,
      row.items.map((item) => item.orderItemName).join(' '),
      packageOrderItems.map((item) => item.defaultContent).join(' '),
      packageOrderItems
        .map(
          (item) =>
            medicalOrderCategoryMap.value.get(item.categoryId)?.categoryName,
        )
        .join(' '),
    ],
  );
}

function matchesOrderItemTemplateGroup(row: MedicalOrderItemView) {
  const category = medicalOrderCategoryMap.value.get(row.categoryId);
  return matchesActiveTemplateGroup(
    [row.orderItemCode, row.orderType, category?.categoryCode],
    [
      row.orderItemName,
      row.defaultContent,
      row.executionScope,
      category?.categoryName,
    ],
  );
}

function matchesActiveTemplateGroup(
  classifierValues: Array<null | string | undefined>,
  textValues: Array<null | string | undefined>,
) {
  const matcher = templateGroupMatchers[activeTemplateGroup.value];
  if (!matcher) {
    return true;
  }
  const normalizedOrderTypes = new Set(
    matcher.orderTypes.map((item) => normalizeCode(item)),
  );
  if (
    classifierValues.some((item) =>
      normalizedOrderTypes.has(normalizeCode(item)),
    )
  ) {
    return true;
  }
  const normalizedKeywords = matcher.keywords.map((item) =>
    normalizeSearchText(item),
  );
  return textValues.some((item) => {
    const normalizedValue = normalizeSearchText(item);
    return normalizedKeywords.some(
      (keywordValue) =>
        keywordValue.length > 0 && normalizedValue.includes(keywordValue),
    );
  });
}

function normalizeCode(value?: null | string) {
  return (
    value
      ?.trim()
      .replaceAll(/[\s-]+/g, '_')
      .toUpperCase() ?? ''
  );
}

function normalizeSearchText(value?: null | string) {
  return value?.trim().toLowerCase() ?? '';
}

function isChargedStatus(value?: null | string) {
  return ['CHARGED', 'PAID', 'SETTLED'].includes(value?.trim() ?? '');
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

function getBlockLabel(block: BlockSummary) {
  return [
    getBlockCodeLabel(block.blockCode),
    block.description ?? block.tissueName ?? block.specimenName,
  ]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(' ');
}

function getBlockCodeLabel(value?: null | string) {
  const blockCode = value?.trim();
  const pathologyNo = props.workbench?.pathologyNo?.trim();
  if (!blockCode || !pathologyNo) {
    return blockCode ?? '';
  }
  return blockCode.replace(
    new RegExp(`^${escapeRegExp(pathologyNo)}[-_]?`),
    '',
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

function addOrderItem(item: MedicalOrderItemView, sourceName = '快捷模板') {
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
  const enabledPackageItems = row.items
    .map(
      (item) =>
        orderItemMap.value.get(item.orderItemId) ?? {
          categoryId: '',
          defaultContent: null,
          enabled: row.enabled,
          executionScope: null,
          id: item.orderItemId,
          orderItemCode: item.orderItemCode,
          orderItemName: item.orderItemName,
          orderType: null,
          sortOrder: item.sortOrder,
        },
    )
    .filter((item) => item.enabled);

  if (enabledPackageItems.length === 0) {
    ElMessage.warning('当前套餐没有可加入的启用条目');
    return;
  }

  enabledPackageItems.forEach((item) => addOrderItem(item, row.packageName));
}

function removeDraftItem(index?: number) {
  if (typeof index !== 'number') {
    return;
  }
  draftItems.splice(index, 1);
}

function undoLastDraftItem() {
  if (draftItems.length === 0) {
    ElMessage.warning('当前没有可撤销的医嘱');
    return;
  }
  draftItems.splice(-1, 1);
}

function selectTemplateGroup(value: string) {
  activeTemplateGroup.value = value;
  selectedLetter.value = '';
  selectedCandidateKeys.value = new Set();
}

function selectLetter(value: string) {
  selectedLetter.value = selectedLetter.value === value ? '' : value;
  activeTemplateGroup.value = '';
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

function executeCharge() {
  if (!props.workbench) {
    ElMessage.warning('请先从左侧选择病例');
    return;
  }
  chargeActionStatus.value = '已触发执行收费';
  ElMessage.success('执行收费已触发');
}

function openChargeManager() {
  if (!props.workbench) {
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
  const caseId = props.workbench?.caseId;
  if (!caseId) {
    ElMessage.warning('请先从左侧选择病例');
    return;
  }
  if (!selectedBlock.value) {
    ElMessage.warning('请先选择蜡块');
    return;
  }
  if (!canCreateMedicalOrder.value) {
    ElMessage.warning('当前账号没有创建医嘱权限');
    return;
  }

  submitLoading.value = true;
  try {
    const operatorName = currentDoctorName.value;
    const operatorUserId = userStore.userInfo?.userId;
    for (const item of draftItems) {
      await createMedicalOrder({
        caseId,
        operatorName,
        operatorUserId,
        orderContent: item.orderContent,
        orderType: item.orderType,
        remarks: item.remarks.trim() || undefined,
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
    class="flex min-h-[360px] flex-col rounded-lg border border-border bg-card shadow-sm xl:h-[calc(100vh-270px)]"
    data-testid="diagnosis-workbench-medical-order-pane"
  >
    <header
      class="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3"
    >
      <h3 class="text-sm font-semibold text-foreground">医嘱区</h3>
      <div class="flex flex-wrap items-center justify-end gap-2">
        <div v-if="workbench" class="w-[220px] text-xs">
          <ElSelect
            v-model="selectedBlockId"
            class="w-full"
            :disabled="blockOptions.length === 0"
            placeholder="请选择蜡块"
            size="small"
          >
            <ElOption
              v-for="block in blockOptions"
              :key="block.blockId"
              :label="getBlockLabel(block)"
              :value="block.blockId"
            />
          </ElSelect>
        </div>
        <ElButton
          class="m-0 w-[88px]"
          size="small"
          type="success"
          @click="executeCharge"
        >
          执行收费
        </ElButton>
        <ElButton class="m-0 w-[88px]" size="small" @click="openChargeManager">
          收费管理
        </ElButton>
      </div>
    </header>

    <div v-loading="loading" class="min-h-0 flex-1 overflow-auto">
      <ElEmpty v-if="!workbench" description="请先从左侧选择一个病例" />
      <div v-else class="flex min-h-0 flex-col">
        <ElAlert
          v-if="blockOptions.length === 0"
          :closable="false"
          class="m-3"
          title="当前病例暂无蜡块，不能创建医嘱"
          type="warning"
        />

        <section class="min-h-[260px] border-b border-border">
          <div
            class="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/30 px-3 py-2"
          >
            <h4 class="text-sm font-semibold text-foreground">
              医嘱项目: 未收费 ({{ unpaidMedicalOrderCount }}) 已收费 ({{
                paidMedicalOrderCount
              }})
            </h4>
            <ElButton
              :disabled="!canSubmit"
              :loading="submitLoading"
              size="small"
              type="primary"
              @click="submitDraftOrders"
            >
              提交医嘱
            </ElButton>
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
          >
            <ElTableColumn type="selection" width="42" />
            <ElTableColumn label="序" width="52">
              <template #default="{ row }">
                {{ row.sequenceNo }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="删除" width="72">
              <template #default="{ row }">
                <ElButton
                  v-if="row.removable"
                  link
                  size="small"
                  type="danger"
                  @click="removeDraftItem(row.draftIndex)"
                >
                  删除
                </ElButton>
                <span v-else class="text-muted-foreground">-</span>
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
            <template #empty>
              <ElEmpty description="暂无医嘱项目" />
            </template>
          </ElTable>
        </section>

        <section class="min-h-[260px]">
          <div class="border-b border-border px-3 py-2">
            <div class="flex flex-wrap gap-1">
              <button
                v-for="group in templateGroups"
                :key="group.value"
                class="h-7 border border-border bg-background px-2 text-xs text-foreground hover:border-primary"
                :class="
                  activeTemplateGroup === group.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : ''
                "
                :data-testid="`medical-order-template-group-${group.value}`"
                type="button"
                @click="selectTemplateGroup(group.value)"
              >
                {{ group.label }}
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
              @dblclick="row.action"
            >
              <ElCheckbox
                :model-value="isCandidateSelected(row.key)"
                :aria-label="`选择${row.title}`"
                @change="
                  (value) => setCandidateSelected(row.key, Boolean(value))
                "
                @click.stop
              />
              <button
                class="min-w-0 truncate text-left font-semibold text-foreground"
                type="button"
                @click="toggleCandidateSelection(row.key)"
                @dblclick.stop="row.action"
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
            size="large"
            type="primary"
            @click="setChargeActionStatus('确认完成收费')"
          >
            确认完成收费
          </ElButton>
          <ElButton size="large" @click="setChargeActionStatus('确认病人出院')">
            确认病人出院
          </ElButton>
          <ElButton
            size="large"
            type="danger"
            @click="setChargeActionStatus('重新执行收费')"
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

.charge-manager-dialog {
  padding: 8px 16px 16px;
}
</style>
