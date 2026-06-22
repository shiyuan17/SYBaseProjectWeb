<script setup lang="ts">
import type { MedicalOrderQcEvaluationSummary } from '../../doctor-workflow/types/doctor-workflow';
import type {
  RoutineMedicalOrderRow,
  RoutineOrderQcSubmitPayload,
} from '../composables/useRoutineMedicalOrderActions';

import { computed, reactive, ref, watch } from 'vue';

import {
  ElButton,
  ElDrawer,
  ElInput,
  ElMessage,
  ElTable,
  ElTableColumn,
  ElTabPane,
  ElTabs,
  ElTag,
} from 'element-plus';

type QcAspect = 'GROSSING' | 'SLIDE';
type ProcessingAction = 'FAST_REMAKE' | 'NO_ACTION' | 'REMAKE';

interface QcDeductionItem {
  deductionGroup: string;
  deductionSuggestion: string;
  deductionValue: number;
  itemName: string;
}

const props = defineProps<{
  latestEvaluation?: MedicalOrderQcEvaluationSummary | null;
  modelValue: boolean;
  rows: RoutineMedicalOrderRow[];
}>();

const emit = defineEmits<{
  activeRowChange: [row: RoutineMedicalOrderRow];
  submit: [payload: RoutineOrderQcSubmitPayload];
  'update:modelValue': [value: boolean];
}>();

const SLIDE_RULES: QcDeductionItem[] = [
  {
    deductionGroup: '切片',
    deductionSuggestion: '建议重新制片',
    deductionValue: 5,
    itemName: '空气污染',
  },
  {
    deductionGroup: '切片',
    deductionSuggestion: '建议重新制片',
    deductionValue: 10,
    itemName: '组织折叠',
  },
  {
    deductionGroup: '切片',
    deductionSuggestion: '建议重新制片',
    deductionValue: 15,
    itemName: '染色不均',
  },
];

const GROSSING_RULES: QcDeductionItem[] = [
  {
    deductionGroup: '取材',
    deductionSuggestion: '建议重新取材',
    deductionValue: 30,
    itemName: '取材不足',
  },
  {
    deductionGroup: '取材',
    deductionSuggestion: '建议重新取材',
    deductionValue: 20,
    itemName: '组织方向错误',
  },
  {
    deductionGroup: '取材',
    deductionSuggestion: '建议重新取材',
    deductionValue: 15,
    itemName: '描述与蜡块不符',
  },
];

const drawerVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const activeAspect = ref<QcAspect>('SLIDE');
const activeRowId = ref('');
const checkedDeductionNames = ref<string[]>([]);

const form = reactive<{
  processingAction: null | ProcessingAction;
  remarks: string;
}>({
  processingAction: null,
  remarks: '',
});

const activeRow = computed(() => {
  const matched = props.rows.find((row) => row.id === activeRowId.value);
  return matched ?? props.rows[0] ?? null;
});

const deductionRules = computed(() =>
  activeAspect.value === 'SLIDE' ? SLIDE_RULES : GROSSING_RULES,
);

const selectedRuleItems = computed(() =>
  deductionRules.value.filter((item) =>
    checkedDeductionNames.value.includes(item.itemName),
  ),
);

const totalScore = computed(() => {
  const deduction = selectedRuleItems.value.reduce(
    (sum, item) => sum + item.deductionValue,
    0,
  );
  return Math.max(0, 100 - deduction);
});

const grade = computed(() => {
  if (totalScore.value > 90) {
    return '甲';
  }
  if (totalScore.value >= 75) {
    return '乙';
  }
  if (totalScore.value >= 60) {
    return '丙';
  }
  return '丁';
});

const evaluationReason = computed(() =>
  selectedRuleItems.value.map((item) => item.itemName).join('、'),
);

const reworkType = computed(() => {
  if (form.processingAction === 'NO_ACTION' || !form.processingAction) {
    return null;
  }
  return activeAspect.value === 'SLIDE' ? 'RESLICE' : 'REGROSSING';
});

function resetDrawerState() {
  activeAspect.value = 'SLIDE';
  activeRowId.value = props.rows[0]?.id ?? '';
  checkedDeductionNames.value = [];
  form.processingAction = null;
  form.remarks = '';
}

function syncActiveRow(rowId: string) {
  activeRowId.value = rowId;
  const row = props.rows.find((item) => item.id === rowId);
  if (row) {
    emit('activeRowChange', row);
  }
}

function toggleRuleItem(itemName: string) {
  checkedDeductionNames.value = checkedDeductionNames.value.includes(itemName)
    ? checkedDeductionNames.value.filter((item) => item !== itemName)
    : [...checkedDeductionNames.value, itemName];
}

function selectProcessingAction(action: ProcessingAction) {
  form.processingAction = action;
}

function submitEvaluation() {
  if (!form.processingAction) {
    ElMessage.warning('请选择处理动作');
    return;
  }

  emit('submit', {
    detailItems: selectedRuleItems.value.map((item) => ({
      checked: true,
      deductionGroup: item.deductionGroup,
      deductionSuggestion: item.deductionSuggestion,
      deductionValue: item.deductionValue,
      itemName: item.itemName,
    })),
    evaluationReason: evaluationReason.value,
    grade: grade.value,
    processingAction: form.processingAction,
    qcAspect: activeAspect.value,
    remarks: form.remarks.trim(),
    reworkType: reworkType.value,
    totalScore: totalScore.value,
  });
}

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      resetDrawerState();
    }
  },
);

watch(
  () => props.rows,
  (rows) => {
    if (rows.length > 0 && !rows.some((row) => row.id === activeRowId.value)) {
      activeRowId.value = rows[0]?.id ?? '';
    }
  },
  { deep: true },
);
</script>

<template>
  <ElDrawer
    v-model="drawerVisible"
    :close-on-click-modal="false"
    direction="btt"
    size="78%"
    title="质控评价"
  >
    <div class="flex h-full flex-col gap-4 pb-4">
      <ElTabs v-model="activeAspect">
        <ElTabPane label="切片评价" name="SLIDE" />
        <ElTabPane label="取材评价" name="GROSSING" />
      </ElTabs>

      <div class="rounded-md border border-border bg-accent/40 p-3 text-sm">
        评分规则: 甲(&gt;90分)、乙(75-89分)、丙(60-74)、丁(&lt;60分)
      </div>

      <div
        v-if="latestEvaluation"
        class="rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground"
      >
        最近评价:
        {{ latestEvaluation.evaluatorName ?? '-' }}
        /
        {{ latestEvaluation.totalScore }}
        分
        /
        {{ latestEvaluation.grade ?? '-' }}
        /
        {{ latestEvaluation.evaluatedAt ?? '-' }}
      </div>

      <ElTable :data="rows" border size="small">
        <ElTableColumn label="病理号" min-width="150">
          <template #default="{ row }">
            <button
              class="text-left text-primary"
              type="button"
              @click="syncActiveRow(row.id)"
            >
              {{ row.pathologyNo ?? '-' }}
            </button>
          </template>
        </ElTableColumn>
        <ElTableColumn label="蜡块号" min-width="100">
          <template #default="{ row }">
            {{ row.blockNo ?? '-' }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="项目" min-width="140">
          <template #default="{ row }">
            {{ row.checkItem ?? '-' }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="评价" min-width="80">
          <template #default>
            {{ grade }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="评价原因" min-width="180">
          <template #default>
            {{ evaluationReason || '-' }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="分数" min-width="80">
          <template #default>
            {{ totalScore }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="评价日期" min-width="140">
          <template #default>
            {{ latestEvaluation?.evaluatedAt ?? '-' }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="状态" min-width="100">
          <template #default="{ row }">
            {{ row.releaseStatus ?? '-' }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="备注" min-width="160">
          <template #default="{ row }">
            {{ row.patientName ?? '-' }}
          </template>
        </ElTableColumn>
      </ElTable>

      <div class="grid flex-1 gap-4 lg:grid-cols-[minmax(0,1.6fr)_360px]">
        <section class="rounded-lg border border-border bg-card p-4">
          <div class="mb-3 flex items-center justify-between">
            <div class="text-sm font-medium">扣分项</div>
            <div class="flex items-center gap-3 text-sm">
              <span>总分</span>
              <ElTag>{{ totalScore }}</ElTag>
              <span>等级</span>
              <ElTag>{{ grade }}</ElTag>
            </div>
          </div>

          <ElTable :data="deductionRules" border size="small">
            <ElTableColumn label="评价内容" min-width="160">
              <template #default="{ row }">
                <ElButton text @click="toggleRuleItem(row.itemName)">
                  {{ row.itemName }}
                </ElButton>
              </template>
            </ElTableColumn>
            <ElTableColumn label="分组" min-width="90">
              <template #default="{ row }">
                {{ row.deductionGroup }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="扣分建议" min-width="150">
              <template #default="{ row }">
                {{ row.deductionSuggestion }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="扣分" min-width="70">
              <template #default="{ row }">
                {{ row.deductionValue }}
              </template>
            </ElTableColumn>
          </ElTable>
        </section>

        <section class="rounded-lg border border-border bg-card p-4">
          <div class="text-sm font-medium">处理动作</div>
          <div class="mt-4 flex flex-col gap-3">
            <ElButton
              :type="form.processingAction === 'FAST_REMAKE' ? 'primary' : undefined"
              @click="selectProcessingAction('FAST_REMAKE')"
            >
              (快速)制片
            </ElButton>
            <ElButton
              :type="form.processingAction === 'REMAKE' ? 'primary' : undefined"
              @click="selectProcessingAction('REMAKE')"
            >
              重新制片
            </ElButton>
            <ElButton
              :type="form.processingAction === 'NO_ACTION' ? 'primary' : undefined"
              @click="selectProcessingAction('NO_ACTION')"
            >
              不需要
            </ElButton>
          </div>

          <div class="mt-4 space-y-2 text-sm">
            <div>当前记录: {{ activeRow?.pathologyNo ?? '-' }}</div>
            <div>评价原因: {{ evaluationReason || '-' }}</div>
            <div>返工类型: {{ reworkType ?? '-' }}</div>
          </div>

          <div class="mt-4">
            <div class="mb-2 text-sm font-medium">备注</div>
            <ElInput
              v-model="form.remarks"
              :rows="4"
              placeholder="补充备注"
              type="textarea"
            />
          </div>
        </section>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <ElButton @click="drawerVisible = false">关闭</ElButton>
        <ElButton type="primary" @click="submitEvaluation">保存评价</ElButton>
      </div>
    </template>
  </ElDrawer>
</template>
