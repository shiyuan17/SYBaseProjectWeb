<script setup lang="ts">
import type { TechnicalSpecimenRegistrationMediaAsset } from '../../types/technical-workflow';

import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';

import { Camera, ImagePlus, X } from '@vben/icons';

import { ElButton, ElEmpty, ElImage, ElMessage, ElSwitch } from 'element-plus';

const props = defineProps<{
  activeAssetId: string;
  canDelete: boolean;
  canUpload: boolean;
  collapsed?: boolean;
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
const videoRef = ref<HTMLVideoElement>();
const canvasRef = ref<HTMLCanvasElement>();
const cameraPreviewEnabled = ref(true);
const cameraStarting = ref(false);
const cameraCapturing = ref(false);
const cameraReady = ref(false);
const cameraError = ref('');

let cameraStream: MediaStream | null = null;

const activeAsset = computed(
  () =>
    props.mediaAssets.find((item) => item.assetId === props.activeAssetId) ??
    props.mediaAssets[0] ??
    null,
);

const mediaAssetUrls = computed(() =>
  props.mediaAssets.map((item) => item.fileUrl),
);

function getMediaAssetPreviewIndex(assetId: string) {
  const activeIndex = props.mediaAssets.findIndex(
    (item) => item.assetId === assetId,
  );
  return Math.max(activeIndex, 0);
}

const cameraStatusText = computed(() => {
  if (!cameraPreviewEnabled.value) {
    return '已关闭';
  }
  if (cameraReady.value) {
    return '预览中';
  }
  if (cameraStarting.value) {
    return '初始化中';
  }
  return cameraError.value ? '预览异常' : '待初始化';
});

const cameraPlaceholderText = computed(() => {
  if (!cameraPreviewEnabled.value) {
    return '预览已关闭';
  }
  if (cameraStarting.value) {
    return '摄像头初始化中';
  }
  return cameraError.value || '摄像头准备中';
});

function openFileDialog() {
  fileInputRef.value?.click();
}

function isCameraSupported() {
  return Boolean(navigator.mediaDevices?.getUserMedia);
}

function stopCameraStream() {
  cameraStream?.getTracks().forEach((track) => track.stop());
  cameraStream = null;
  cameraReady.value = false;
  if (videoRef.value) {
    videoRef.value.srcObject = null;
  }
}

async function startCamera() {
  cameraStarting.value = true;
  cameraError.value = '';
  if (!isCameraSupported()) {
    cameraError.value = '当前浏览器不支持摄像头拍照';
    cameraStarting.value = false;
    return;
  }

  stopCameraStream();
  cameraStarting.value = true;
  cameraError.value = '';
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: 'environment',
      },
    });
    cameraStream = stream;
    cameraReady.value = true;
    if (videoRef.value) {
      videoRef.value.srcObject = stream;
      await videoRef.value.play();
    }
  } catch {
    cameraError.value = '无法打开摄像头，请检查浏览器权限或设备连接';
    ElMessage.warning(cameraError.value);
    stopCameraStream();
  } finally {
    cameraStarting.value = false;
  }
}

function buildCapturedFileName() {
  const timestamp = new Date().toISOString().replaceAll(/[:.]/g, '-');
  return `registration-camera-${timestamp}.jpg`;
}

async function syncCameraPreview() {
  if (!cameraPreviewEnabled.value || props.collapsed || !props.canUpload) {
    stopCameraStream();
    return;
  }
  await nextTick();
  await startCamera();
}

function createCapturedImageBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', 0.92);
  });
}

async function captureCameraFrame() {
  const video = videoRef.value;
  const canvas = canvasRef.value;
  if (!video || !canvas || !cameraReady.value) {
    ElMessage.warning('摄像头未就绪，请稍后再试');
    return;
  }

  const width = video.videoWidth || 1280;
  const height = video.videoHeight || 720;
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    ElMessage.warning('当前浏览器无法生成拍照图片，请使用导入图片');
    return;
  }

  cameraCapturing.value = true;
  try {
    context.drawImage(video, 0, 0, width, height);
    const blob = await createCapturedImageBlob(canvas);
    if (!blob) {
      ElMessage.warning('拍照失败，请重试');
      return;
    }
    const file = new File([blob], buildCapturedFileName(), {
      lastModified: Date.now(),
      type: 'image/jpeg',
    });
    emit('upload', file);
  } finally {
    cameraCapturing.value = false;
  }
}

function handleFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) {
    return;
  }
  emit('upload', file);
  (event.target as HTMLInputElement).value = '';
}

watch(cameraPreviewEnabled, (enabled) => {
  if (!enabled) {
    stopCameraStream();
    cameraError.value = '';
    return;
  }
  void syncCameraPreview();
});

watch(
  () => [props.canUpload, props.collapsed] as const,
  () => {
    void syncCameraPreview();
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  stopCameraStream();
});
</script>

<template>
  <section
    class="flex min-h-[480px] flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
  >
    <input
      ref="fileInputRef"
      accept="image/*"
      class="hidden"
      type="file"
      @change="handleFileChange"
    />

    <button
      v-if="collapsed"
      aria-label="展开图片区"
      class="flex min-h-[480px] w-full flex-1 flex-col items-center justify-start gap-4 px-3 py-5 text-center transition hover:bg-accent"
      type="button"
    >
      <span class="text-sm font-semibold text-foreground">图片区</span>
      <span
        class="rounded-full bg-accent px-2 py-1 text-[11px] text-muted-foreground"
      >
        {{ mediaAssets.length }} 张
      </span>
      <span class="w-full truncate text-xs text-muted-foreground/70">
        {{ activeAsset?.fileName || '暂无登记图片' }}
      </span>
    </button>

    <template v-else>
      <div class="border-b border-border px-4 py-4">
        <div class="text-base font-semibold text-foreground">图片区</div>
        <p class="mt-1 text-xs text-muted-foreground">
          支持本地图片导入、摄像头拍照、预览和删除。
        </p>
        <div class="mt-4 flex flex-wrap items-center gap-3">
          <ElButton
            :disabled="!canUpload"
            :icon="ImagePlus"
            :loading="uploading"
            type="primary"
            @click="openFileDialog"
          >
            导入图片
          </ElButton>
          <ElButton
            :disabled="!canUpload || uploading || !cameraReady"
            :icon="Camera"
            :loading="cameraCapturing"
            @click="captureCameraFrame"
          >
            拍照
          </ElButton>
          <div class="flex items-center gap-2">
            <span class="text-sm text-muted-foreground">预览</span>
            <ElSwitch
              v-model="cameraPreviewEnabled"
              :disabled="!canUpload || uploading"
            />
          </div>
          <ElButton
            :disabled="!activeAsset || !canDelete"
            :loading="deleting"
            @click="activeAsset && emit('delete', activeAsset.assetId)"
          >
            删除图片
          </ElButton>
        </div>
      </div>

      <div class="flex flex-1 flex-col gap-4 px-4 py-4">
        <section class="rounded-2xl border border-border bg-accent p-3">
          <div class="mb-3 flex items-center justify-between gap-2">
            <div class="text-sm font-semibold text-foreground">摄像头画面</div>
            <span
              class="rounded-full bg-card px-2 py-1 text-xs text-muted-foreground"
            >
              {{ cameraStatusText }}
            </span>
          </div>
          <div
            class="h-[300px] max-h-[520px] min-h-[220px] resize-y overflow-auto rounded-xl border border-border bg-slate-950"
          >
            <video
              v-show="cameraPreviewEnabled && cameraReady"
              ref="videoRef"
              autoplay
              class="h-full min-h-[220px] w-full object-contain"
              muted
              playsinline
            ></video>
            <div
              v-if="!cameraPreviewEnabled || !cameraReady"
              class="flex h-full min-h-[220px] items-center justify-center px-4 text-center text-sm text-muted-foreground/70"
            >
              {{ cameraPlaceholderText }}
            </div>
          </div>
          <canvas ref="canvasRef" class="hidden"></canvas>
        </section>

        <section class="rounded-2xl border border-border bg-card p-3">
          <div
            v-if="mediaAssets.length > 0"
            class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
          >
            <div
              v-for="asset in mediaAssets"
              :key="asset.assetId"
              class="group relative overflow-hidden rounded-2xl border p-2 text-left transition"
              :class="[
                asset.assetId === activeAsset?.assetId
                  ? 'border-sky-500 bg-primary/10'
                  : 'border-border bg-card hover:border-border',
              ]"
              :data-testid="`media-asset-${asset.assetId}`"
              role="button"
              tabindex="0"
              @click="emit('select', asset.assetId)"
              @keydown.enter.prevent="emit('select', asset.assetId)"
              @keydown.space.prevent="emit('select', asset.assetId)"
            >
              <button
                v-if="canDelete"
                :aria-label="`删除图片 ${asset.fileName || asset.assetId}`"
                class="absolute right-3 top-3 z-10 flex size-7 items-center justify-center rounded-full bg-slate-900/75 text-white opacity-0 shadow transition hover:bg-red-500 group-hover:opacity-100 focus:opacity-100"
                type="button"
                @click.stop="emit('delete', asset.assetId)"
              >
                <X aria-hidden="true" class="size-4" />
              </button>
              <ElImage
                :alt="asset.fileName || '登记缩略图'"
                :initial-index="getMediaAssetPreviewIndex(asset.assetId)"
                :preview-src-list="mediaAssetUrls"
                preview-teleported
                :src="asset.fileUrl"
                class="h-16 w-full rounded-xl object-cover"
              >
                <template #error>
                  <ElEmpty description="图片加载失败" :image-size="32" />
                </template>
              </ElImage>
              <div class="mt-2 text-xs text-muted-foreground">
                <div class="truncate">{{ asset.fileName || '-' }}</div>
                <div class="mt-1">{{ asset.capturedAt || '-' }}</div>
              </div>
            </div>
          </div>
          <div v-else class="flex min-h-[260px] items-center justify-center">
            <ElEmpty description="暂无登记图片" />
          </div>
        </section>
      </div>
    </template>
  </section>
</template>
