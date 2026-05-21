<script setup lang="ts">
import type { DepartmentNode } from '../types/system-management';

import { computed, onMounted, ref } from 'vue';

import { ElTreeSelect } from 'element-plus';

import { listDepartments } from '../api/system-management-service';

const props = withDefaults(
  defineProps<{
    clearable?: boolean;
    disabled?: boolean;
    includeDisabled?: boolean;
    modelValue: string;
    placeholder?: string;
    selectedLabel?: string;
  }>(),
  {
    clearable: true,
    disabled: false,
    includeDisabled: false,
    placeholder: '请选择科室',
    selectedLabel: '',
  },
);

const emit = defineEmits<{
  change: [department: null | { id: string; name: string }];
  'update:modelValue': [value: string];
}>();

const loading = ref(false);
const treeData = ref<DepartmentNode[]>([]);
const nodeMap = ref(new Map<string, DepartmentNode>());

function collectEnabledNodes(nodes: DepartmentNode[]): DepartmentNode[] {
  return nodes
    .filter((node) => props.includeDisabled || node.enabled)
    .map((node) => ({
      ...node,
      children: collectEnabledNodes(node.children ?? []),
    }));
}

function rebuildNodeMap(nodes: DepartmentNode[]) {
  const map = new Map<string, DepartmentNode>();
  const walk = (items: DepartmentNode[]) => {
    items.forEach((item) => {
      map.set(item.id, item);
      if (item.children?.length) {
        walk(item.children);
      }
    });
  };
  walk(nodes);
  nodeMap.value = map;
}

const normalizedTree = computed(() => collectEnabledNodes(treeData.value));

async function loadDepartments() {
  loading.value = true;
  try {
    treeData.value = await listDepartments();
    rebuildNodeMap(treeData.value);
  } finally {
    loading.value = false;
  }
}

function handleChange(value: string) {
  emit('update:modelValue', value);
  const department = value ? nodeMap.value.get(value) : null;
  emit(
    'change',
    department
      ? {
          id: department.id,
          name: department.departmentName,
        }
      : null,
  );
}

onMounted(loadDepartments);
</script>

<template>
  <ElTreeSelect
    :data="normalizedTree"
    :default-expand-all="false"
    :disabled="disabled"
    :loading="loading"
    :model-value="modelValue"
    :props="{ children: 'children', label: 'departmentName' }"
    :render-after-expand="false"
    check-strictly
    class="w-full"
    filterable
    node-key="id"
    value-key="id"
    :clearable="clearable"
    :placeholder="placeholder"
    @update:model-value="handleChange"
  />
</template>
