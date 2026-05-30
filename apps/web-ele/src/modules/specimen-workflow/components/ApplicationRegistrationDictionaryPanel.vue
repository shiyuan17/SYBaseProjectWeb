<script setup lang="ts">
import type { SpecimenDictionaryGroup } from '../types/application-registration-workbench';

import { ElEmpty, ElInput, ElScrollbar } from 'element-plus';

import WorkflowSectionCard from './WorkflowSectionCard.vue';

const props = defineProps<{
  dictionaryKeyword: string;
  groups: SpecimenDictionaryGroup[];
}>();

const emit = defineEmits<{
  append: [payload: { specimenName: string; specimenSite: string }];
  'update:dictionaryKeyword': [value: string];
}>();
</script>

<template>
  <WorkflowSectionCard auto-height title="标本字典">
    <template #extra>
      <ElInput
        :model-value="props.dictionaryKeyword"
        class="!w-[168px]"
        clearable
        placeholder="输入标本关键字"
        size="small"
        @update:model-value="emit('update:dictionaryKeyword', $event)"
      />
    </template>

    <ElScrollbar max-height="112px">
      <div
        v-if="props.groups.length > 0"
        class="grid gap-1.5 pr-1.5 2xl:grid-cols-2"
      >
        <section
          v-for="group in props.groups"
          :key="group.systemId"
          class="rounded-md border border-border/80 bg-background/70 px-2 py-1.5"
        >
          <div class="mb-1 text-xs font-semibold text-foreground">
            {{ group.systemName }}
          </div>

          <div class="flex flex-col gap-1">
            <div
              v-for="part in group.subParts"
              :key="part.partId"
              class="grid gap-1 xl:grid-cols-[60px_minmax(0,1fr)] xl:items-start"
            >
              <div
                class="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium leading-4 text-primary"
              >
                {{ part.partName }}
              </div>

              <div class="flex flex-wrap gap-1">
                <button
                  v-for="specimen in part.specimens"
                  :key="`${part.partId}-${specimen}`"
                  class="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] leading-4 text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100"
                  type="button"
                  @click="
                    emit('append', {
                      specimenName: specimen,
                      specimenSite: part.partName,
                    })
                  "
                >
                  {{ specimen }}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div v-else class="py-3">
        <ElEmpty description="未找到匹配的标本词条" />
      </div>
    </ElScrollbar>
  </WorkflowSectionCard>
</template>
