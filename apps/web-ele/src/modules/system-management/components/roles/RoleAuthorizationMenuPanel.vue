<script setup lang="ts">
import type {
  MenuTreeCheckState,
  MenuTreeNode,
} from '../../composables/useRolesPage';

import { ElTree } from 'element-plus';

defineProps<{
  authLoading: boolean;
  menuTree: MenuTreeNode[];
  menuTreeDefaultCheckedKeys: string[];
  menuTreeReloadKey: number;
}>();

const emit = defineEmits<{
  check: [node: MenuTreeNode, checkedState: MenuTreeCheckState];
}>();

function handleCheck(node: MenuTreeNode, checkedState: MenuTreeCheckState) {
  emit('check', node, checkedState);
}
</script>

<template>
  <div
    v-loading="authLoading"
    class="max-h-[560px] overflow-auto rounded-xl border border-border/60 p-4"
  >
    <ElTree
      :key="menuTreeReloadKey"
      :data="menuTree"
      :default-checked-keys="menuTreeDefaultCheckedKeys"
      default-expand-all
      node-key="id"
      show-checkbox
      :props="{ children: 'children', label: 'menuName' }"
      @check="handleCheck"
    />
  </div>
</template>
