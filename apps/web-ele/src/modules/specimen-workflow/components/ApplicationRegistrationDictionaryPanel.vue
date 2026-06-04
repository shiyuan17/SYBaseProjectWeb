<script setup lang="ts">
import type {
  SpecimenDictionaryEntryOption,
  SpecimenDictionaryGroup,
} from '../types/application-registration-workbench';

import { computed } from 'vue';

import { ElEmpty, ElInput, ElScrollbar } from 'element-plus';

import WorkflowSectionCard from './WorkflowSectionCard.vue';

const props = defineProps<{
  activePartId: string;
  activeSystemId: string;
  departmentCommonSpecimenOptions: SpecimenDictionaryEntryOption[];
  dictionaryKeyword: string;
  doctorCommonSpecimenOptions: SpecimenDictionaryEntryOption[];
  groups: SpecimenDictionaryGroup[];
}>();

const emit = defineEmits<{
  append: [payload: { specimenName: string; specimenSite: string }];
  selectPart: [partId: string];
  selectSystem: [systemId: string];
  'update:dictionaryKeyword': [value: string];
}>();

const selectedSystem = computed(() => {
  return (
    props.groups.find((group) => group.systemId === props.activeSystemId) ??
    props.groups[0] ??
    null
  );
});

const selectedPart = computed(() => {
  const system = selectedSystem.value;
  if (!system) {
    return null;
  }

  return (
    system.subParts.find((part) => part.partId === props.activePartId) ??
    system.subParts[0] ??
    null
  );
});

function isSystemActive(systemId: string) {
  return systemId === selectedSystem.value?.systemId;
}

function isPartActive(partId: string) {
  return partId === selectedPart.value?.partId;
}

function appendSpecimen(specimenName: string, specimenSite: string) {
  emit('append', {
    specimenName,
    specimenSite,
  });
}
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

    <div class="space-y-3">
      <div
        v-if="
          props.departmentCommonSpecimenOptions.length > 0 ||
          props.doctorCommonSpecimenOptions.length > 0
        "
        class="space-y-2 rounded-lg border border-border/70 bg-muted/10 px-3 py-2"
      >
        <div
          v-if="props.departmentCommonSpecimenOptions.length > 0"
          class="flex flex-wrap items-start gap-2"
        >
          <div
            class="w-20 shrink-0 rounded-md bg-background px-2 py-1 text-center text-xs font-semibold text-foreground"
          >
            科室常用
          </div>
          <div class="flex flex-1 flex-wrap gap-1.5">
            <button
              v-for="option in props.departmentCommonSpecimenOptions"
              :key="`${option.partId}-${option.specimenName}`"
              class="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-500 px-2.5 py-1 text-xs leading-4 text-white transition hover:border-emerald-300 hover:bg-emerald-400"
              type="button"
              @click="appendSpecimen(option.specimenName, option.partName)"
            >
              <span>{{ option.specimenName }}</span>
              <span class="text-[11px] text-white/80">{{
                option.partName
              }}</span>
            </button>
          </div>
        </div>

        <div
          v-if="props.doctorCommonSpecimenOptions.length > 0"
          class="flex flex-wrap items-start gap-2"
        >
          <div
            class="w-20 shrink-0 rounded-md bg-background px-2 py-1 text-center text-xs font-semibold text-foreground"
          >
            医生常用
          </div>
          <div class="flex flex-1 flex-wrap gap-1.5">
            <button
              v-for="option in props.doctorCommonSpecimenOptions"
              :key="`${option.partId}-${option.specimenName}`"
              class="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-500 px-2.5 py-1 text-xs leading-4 text-white transition hover:border-emerald-300 hover:bg-emerald-400"
              type="button"
              @click="appendSpecimen(option.specimenName, option.partName)"
            >
              <span>{{ option.specimenName }}</span>
              <span class="text-[11px] text-white/80">{{
                option.partName
              }}</span>
            </button>
          </div>
        </div>
      </div>

      <template v-if="props.groups.length > 0">
        <ElScrollbar max-height="360px">
          <div class="grid gap-2 xl:grid-cols-[160px_130px_minmax(0,1fr)]">
            <div class="rounded-lg border border-border/70 bg-muted/20 p-2">
              <div class="mb-2 text-xs font-semibold text-muted-foreground">
                系统
              </div>
              <div class="flex flex-col gap-1.5">
                <button
                  v-for="system in props.groups"
                  :key="system.systemId"
                  :aria-pressed="isSystemActive(system.systemId)"
                  class="w-full rounded-md px-3 py-2 text-left text-sm font-medium transition"
                  :class="
                    isSystemActive(system.systemId)
                      ? 'bg-sky-600 text-white shadow-sm ring-2 ring-sky-200'
                      : 'bg-sky-500 text-white hover:bg-sky-400'
                  "
                  type="button"
                  @click="emit('selectSystem', system.systemId)"
                >
                  {{ system.systemName }}
                </button>
              </div>
            </div>

            <div class="rounded-lg border border-border/70 bg-muted/20 p-2">
              <div class="mb-2 text-xs font-semibold text-muted-foreground">
                部位
              </div>
              <div class="flex flex-col gap-1.5">
                <button
                  v-for="part in selectedSystem?.subParts ?? []"
                  :key="part.partId"
                  :aria-pressed="isPartActive(part.partId)"
                  class="w-full rounded-md px-3 py-2 text-sm font-medium transition"
                  :class="
                    isPartActive(part.partId)
                      ? 'bg-cyan-500 text-white shadow-sm ring-2 ring-cyan-200'
                      : 'bg-cyan-400 text-white hover:bg-cyan-300'
                  "
                  type="button"
                  @click="emit('selectPart', part.partId)"
                >
                  {{ part.partName }}
                </button>
              </div>
            </div>

            <div class="rounded-lg border border-border/70 bg-muted/20 p-2">
              <div class="mb-2 text-xs font-semibold text-muted-foreground">
                标本
              </div>
              <div
                v-if="selectedPart?.specimens?.length"
                class="flex flex-wrap gap-1.5"
              >
                <button
                  v-for="specimen in selectedPart.specimens"
                  :key="`${selectedPart.partId}-${specimen}`"
                  class="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-500 px-2.5 py-1 text-xs leading-4 text-white transition hover:border-emerald-300 hover:bg-emerald-400"
                  type="button"
                  @click="appendSpecimen(specimen, selectedPart.partName)"
                >
                  {{ specimen }}
                </button>
              </div>
              <ElEmpty v-else description="请选择左侧系统与部位" />
            </div>
          </div>
        </ElScrollbar>
      </template>
      <ElEmpty v-else description="未找到匹配的标本词条" />
    </div>
  </WorkflowSectionCard>
</template>
