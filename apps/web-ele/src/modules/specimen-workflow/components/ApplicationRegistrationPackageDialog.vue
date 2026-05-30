<script setup lang="ts">
import type {
  SpecimenPackageItem,
  SpecimenPackageOption,
} from '../types/application-registration-workbench';

import { computed, reactive, ref, watch } from 'vue';

import {
  ElButton,
  ElDialog,
  ElDrawer,
  ElEmpty,
  ElInput,
  ElInputNumber,
  ElOption,
  ElScrollbar,
  ElSelect,
  ElTag,
} from 'element-plus';

import { buildSearchKeywords } from '../utils/specimen-dictionary-search';

type EditablePackageItem = SpecimenPackageItem & {
  id: string;
};

const props = defineProps<{
  modelValue: boolean;
  packageOptions: SpecimenPackageOption[];
  preferredDept?: string;
}>();

const emit = defineEmits<{
  confirm: [selectedPackage: SpecimenPackageOption];
  createPackage: [createdPackage: SpecimenPackageOption];
  'update:modelValue': [value: boolean];
}>();

const keyword = ref('');
const selectedDept = ref('');
const selectedPackageId = ref('');
const creating = ref(false);
const packageSeed = ref(9000);

const packageForm = reactive({
  applyDept: '',
  description: '',
  packageName: '',
});

const packageItems = ref<EditablePackageItem[]>([]);

const deptOptions = computed(() =>
  [...new Set(props.packageOptions.map((item) => item.applyDept))].filter(
    Boolean,
  ),
);

const filteredPackageOptions = computed(() => {
  const normalizedKeyword = keyword.value.trim().toLowerCase();
  const normalizedDept = selectedDept.value.trim();

  return props.packageOptions.filter((item) => {
    const matchesDept =
      !normalizedDept ||
      item.applyDept === normalizedDept ||
      item.applyDept.includes(normalizedDept);
    const matchesKeyword =
      !normalizedKeyword ||
      item.searchKeywords.some((searchKeyword) =>
        searchKeyword.includes(normalizedKeyword),
      );

    return matchesDept && matchesKeyword;
  });
});

const selectedPackage = computed(
  () =>
    filteredPackageOptions.value.find(
      (item) => item.packageId === selectedPackageId.value,
    ) ?? null,
);

const canSubmitPackage = computed(() => {
  if (!packageForm.packageName.trim() || !packageForm.applyDept.trim()) {
    return false;
  }

  return packageItems.value.every(
    (item) =>
      item.specimenName.trim() && item.specimenSite.trim() && item.quantity > 0,
  );
});

function closeDrawer() {
  emit('update:modelValue', false);
}

function handleConfirm() {
  if (!selectedPackage.value) {
    return;
  }

  emit('confirm', selectedPackage.value);
  closeDrawer();
}

function resolveInitialDept() {
  const normalizedPreferredDept = props.preferredDept?.trim() ?? '';
  if (!normalizedPreferredDept) {
    return '';
  }

  return deptOptions.value.includes(normalizedPreferredDept)
    ? normalizedPreferredDept
    : '';
}

function createEmptyPackageItem(): EditablePackageItem {
  packageSeed.value += 1;

  return {
    id: `package-item-${packageSeed.value}`,
    quantity: 1,
    specimenName: '',
    specimenSite: '',
    status: '新增',
  };
}

function resetPackageForm() {
  packageForm.packageName = '';
  packageForm.applyDept =
    props.preferredDept?.trim() || selectedDept.value || '';
  packageForm.description = '';
  packageItems.value = [createEmptyPackageItem()];
}

function resetDrawerState() {
  keyword.value = '';
  selectedDept.value = resolveInitialDept();
  selectedPackageId.value = '';
  creating.value = false;
  resetPackageForm();
}

function handleStartCreate() {
  creating.value = true;
  resetPackageForm();
}

function handleCancelCreate() {
  creating.value = false;
  resetPackageForm();
}

function handleAddPackageItem() {
  packageItems.value = [...packageItems.value, createEmptyPackageItem()];
}

function handleRemovePackageItem(itemId: string) {
  if (packageItems.value.length === 1) {
    return;
  }

  packageItems.value = packageItems.value.filter((item) => item.id !== itemId);
}

function handleUpdatePackageItem(
  itemId: string,
  key: keyof SpecimenPackageItem,
  value: number | string,
) {
  packageItems.value = packageItems.value.map((item) =>
    item.id === itemId
      ? {
          ...item,
          [key]: value,
        }
      : item,
  );
}

function handleCreatePackage() {
  if (!canSubmitPackage.value) {
    return;
  }

  packageSeed.value += 1;

  const normalizedItems = packageItems.value.map(({ id: _id, ...item }) => ({
    ...item,
    quantity: Number(item.quantity) || 1,
    specimenName: item.specimenName.trim(),
    specimenSite: item.specimenSite.trim(),
    status: item.status.trim() || '新增',
  }));

  const createdPackage: SpecimenPackageOption = {
    applyDept: packageForm.applyDept.trim(),
    description: packageForm.description.trim(),
    itemCount: normalizedItems.length,
    items: normalizedItems,
    packageId: `SPKG-TEMP-${packageSeed.value}`,
    packageName: packageForm.packageName.trim(),
    searchKeywords: buildSearchKeywords([
      packageForm.packageName,
      packageForm.applyDept,
      packageForm.description,
      ...normalizedItems.flatMap((item) => [
        item.specimenName,
        item.specimenSite,
      ]),
    ]),
  };

  emit('createPackage', createdPackage);
  creating.value = false;
  selectedDept.value = createdPackage.applyDept;
  selectedPackageId.value = createdPackage.packageId;
  resetPackageForm();
}

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      resetDrawerState();
    }
  },
  { immediate: true },
);

watch(
  filteredPackageOptions,
  (options) => {
    if (options.some((item) => item.packageId === selectedPackageId.value)) {
      return;
    }

    selectedPackageId.value = options[0]?.packageId ?? '';
  },
  { immediate: true },
);
</script>

<template>
  <ElDrawer
    :lock-scroll="false"
    :modal="false"
    :model-value="props.modelValue"
    direction="btt"
    size="420px"
    title="标本套餐"
    @close="closeDrawer"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="flex h-full min-h-0 flex-col gap-2">
      <div class="grid gap-2 md:grid-cols-[minmax(0,1fr)_160px_96px]">
        <ElInput
          v-model="keyword"
          clearable
          placeholder="输入套餐名、标本名或拼音首字母"
          size="small"
        />
        <ElSelect
          v-model="selectedDept"
          clearable
          placeholder="全部科室"
          size="small"
        >
          <ElOption label="全部科室" value="" />
          <ElOption
            v-for="dept in deptOptions"
            :key="dept"
            :label="dept"
            :value="dept"
          />
        </ElSelect>
        <ElButton plain size="small" type="primary" @click="handleStartCreate">
          添加套餐
        </ElButton>
      </div>

      <ElScrollbar class="min-h-0 flex-1">
        <div
          v-if="filteredPackageOptions.length > 0"
          class="grid gap-2 pr-2 md:grid-cols-2 xl:grid-cols-3"
        >
          <button
            v-for="item in filteredPackageOptions"
            :key="item.packageId"
            :class="
              item.packageId === selectedPackageId
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-border/70 bg-background hover:border-primary/35 hover:bg-primary/5'
            "
            class="flex flex-col gap-2 rounded-lg border px-3 py-2.5 text-left transition"
            type="button"
            @click="selectedPackageId = item.packageId"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <div class="truncate text-sm font-semibold text-foreground">
                  {{ item.packageName }}
                </div>
                <div class="mt-0.5 text-xs text-muted-foreground">
                  适用科室：{{ item.applyDept }}
                </div>
              </div>
              <ElTag
                :type="
                  item.packageId === selectedPackageId ? 'primary' : 'info'
                "
                effect="plain"
                size="small"
              >
                {{ item.itemCount }} 项
              </ElTag>
            </div>

            <div
              v-if="item.description"
              class="line-clamp-2 text-xs leading-5 text-muted-foreground"
            >
              {{ item.description }}
            </div>

            <div class="flex flex-wrap gap-1">
              <ElTag
                v-for="specimen in item.items"
                :key="`${item.packageId}-${specimen.specimenName}-${specimen.specimenSite}`"
                effect="plain"
                size="small"
                type="success"
              >
                {{ specimen.specimenName }} / {{ specimen.specimenSite }}
              </ElTag>
            </div>
          </button>
        </div>

        <div v-else class="py-8">
          <ElEmpty description="未找到匹配的标本套餐" />
        </div>
      </ElScrollbar>

      <div
        class="flex items-center justify-end gap-2 border-t border-border/70 pt-2"
      >
        <ElButton size="small" @click="closeDrawer">取消</ElButton>
        <ElButton
          :disabled="!selectedPackage"
          size="small"
          type="primary"
          @click="handleConfirm"
        >
          确认选择
        </ElButton>
      </div>
    </div>
  </ElDrawer>

  <ElDialog
    v-model="creating"
    append-to-body
    destroy-on-close
    title="添加套餐"
    width="860px"
    @close="handleCancelCreate"
  >
    <div class="flex flex-col gap-3">
      <div class="grid gap-2 md:grid-cols-[minmax(0,1fr)_180px]">
        <ElInput
          v-model="packageForm.packageName"
          placeholder="套餐名称"
          size="small"
        />
        <ElInput
          v-model="packageForm.applyDept"
          placeholder="适用科室"
          size="small"
        />
      </div>

      <ElInput
        v-model="packageForm.description"
        placeholder="套餐说明，可不填"
        size="small"
      />

      <div class="flex flex-col gap-2">
        <div
          v-for="item in packageItems"
          :key="item.id"
          class="grid gap-2 rounded-md border border-border/70 bg-background px-2 py-2 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_88px_120px_64px]"
        >
          <ElInput
            :model-value="item.specimenName"
            placeholder="标本名称"
            size="small"
            @update:model-value="
              handleUpdatePackageItem(item.id, 'specimenName', $event)
            "
          />
          <ElInput
            :model-value="item.specimenSite"
            placeholder="部位"
            size="small"
            @update:model-value="
              handleUpdatePackageItem(item.id, 'specimenSite', $event)
            "
          />
          <ElInputNumber
            :min="1"
            :model-value="item.quantity"
            controls-position="right"
            size="small"
            style="width: 100%"
            @update:model-value="
              handleUpdatePackageItem(item.id, 'quantity', $event ?? 1)
            "
          />
          <ElInput
            :model-value="item.status"
            placeholder="状态"
            size="small"
            @update:model-value="
              handleUpdatePackageItem(item.id, 'status', $event)
            "
          />
          <ElButton
            :disabled="packageItems.length === 1"
            link
            size="small"
            type="danger"
            @click="handleRemovePackageItem(item.id)"
          >
            删除
          </ElButton>
        </div>
      </div>

      <div class="flex items-center justify-between gap-2">
        <ElButton size="small" @click="handleAddPackageItem">增加条目</ElButton>
        <div class="flex items-center gap-2">
          <ElButton size="small" @click="handleCancelCreate">取消</ElButton>
          <ElButton
            :disabled="!canSubmitPackage"
            size="small"
            type="primary"
            @click="handleCreatePackage"
          >
            保存套餐
          </ElButton>
        </div>
      </div>
    </div>
  </ElDialog>
</template>
