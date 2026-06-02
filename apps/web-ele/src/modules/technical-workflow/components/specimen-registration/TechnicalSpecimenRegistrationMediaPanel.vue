<script setup lang="ts">
import type { TechnicalSpecimenRegistrationMediaAsset } from '../../types/technical-workflow';

import { computed, ref } from 'vue';

import { ElButton, ElEmpty } from 'element-plus';

const props = defineProps<{
  activeAssetId: string;
  canDelete: boolean;
  canUpload: boolean;
  deleting?: boolean;
  mediaAssets: TechnicalSpecimenRegistrationMediaAsset[];
  uploading?: boolean;
}>();

const emit = defineEmits<{
  delete: [assetId: string];
  select: [assetId: string];
  upload: [file: File];
}>();

const fileInputRef = ref<HTMLInputElement>();

const activeAsset = computed(
  () =>
    props.mediaAssets.find((item) => item.assetId === props.activeAssetId) ??
    props.mediaAssets[0] ??
    null,
);

function openFileDialog() {
  fileInputRef.value?.click();
}

function handleFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) {
    return;
  }
  emit('upload', file);
  (event.target as HTMLInputElement).value = '';
}
</script>

<template>
  <section class="flex min-h-[480px] flex-1 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div class="border-b border-slate-200 px-4 py-4">
      <div class="text-base font-semibold text-slate-900">图片区</div>
      <p class="mt-1 text-xs text-slate-500">
        仅支持本地图片导入、预览和删除，不包含设备拍照能力。
      </p>
      <div class="mt-4 flex flex-wrap gap-2">
        <ElButton
          :disabled="!canUpload"
          :loading="uploading"
          type="primary"
          @click="openFileDialog"
        >
          导入图片
        </ElButton>
        <ElButton
          :disabled="!activeAsset || !canDelete"
          :loading="deleting"
          @click="activeAsset && emit('delete', activeAsset.assetId)"
        >
          删除图片
        </ElButton>
      </div>
      <input
        ref="fileInputRef"
        accept="image/*"
        class="hidden"
        type="file"
        @change="handleFileChange"
      />
    </div>

    <div class="flex-1 px-4 py-4">
      <template v-if="mediaAssets.length > 0">
        <div class="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
          <img
            v-if="activeAsset"
            :alt="activeAsset.fileName || '登记图片'"
            :src="activeAsset.fileUrl"
            class="h-[360px] w-full object-contain"
          />
        </div>
        <div class="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            v-for="asset in mediaAssets"
            :key="asset.assetId"
            :class="[
              'overflow-hidden rounded-2xl border p-2 text-left transition',
              asset.assetId === activeAsset?.assetId
                ? 'border-sky-500 bg-sky-50'
                : 'border-slate-200 bg-white hover:border-slate-300',
            ]"
            :data-testid="`media-asset-${asset.assetId}`"
            type="button"
            @click="emit('select', asset.assetId)"
          >
            <img
              :alt="asset.fileName || '登记缩略图'"
              :src="asset.fileUrl"
              class="h-24 w-full rounded-xl object-cover"
            />
            <div class="mt-2 text-xs text-slate-600">
              <div class="truncate">{{ asset.fileName || '-' }}</div>
              <div class="mt-1">{{ asset.capturedAt || '-' }}</div>
            </div>
          </button>
        </div>
      </template>
      <div v-else class="flex h-full items-center justify-center">
        <ElEmpty description="暂无登记图片" />
      </div>
    </div>
  </section>
</template>
