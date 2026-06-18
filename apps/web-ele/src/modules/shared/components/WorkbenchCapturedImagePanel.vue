<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';

import { Camera, ImagePlus, X } from '@vben/icons';

import {
  ElButton,
  ElEmpty,
  ElImage,
  ElMessage,
  ElSwitch,
  ElTag,
  ElTooltip,
} from 'element-plus';

interface CapturedImageItem {
  fileUrl: string;
  key: string;
  meta?: string;
  sourceLabel: string;
  title: string;
}

const props = withDefaults(
  defineProps<{
    accept: string;
    canEdit: boolean;
    deleteImage?: (key: string) => void;
    disabledText?: string;
    emptyDescription?: string;
    items: CapturedImageItem[];
    previewHint?: string;
    scrollMode?: 'external' | 'internal';
    uploadImageFile: (file: File) => boolean | Promise<boolean>;
  }>(),
  {
    deleteImage: undefined,
    disabledText: '请先选择可编辑标本',
    emptyDescription: '当前没有采图记录',
    previewHint: '当前标本拍照实时预览',
    scrollMode: 'internal',
  },
);

const imageFileInputRef = ref<HTMLInputElement>();
const cameraVideoRef = ref<HTMLVideoElement>();
const cameraCanvasRef = ref<HTMLCanvasElement>();
const cameraPreviewEnabled = ref(false);
const cameraStarting = ref(false);
const cameraCapturing = ref(false);
const cameraReady = ref(false);
const cameraError = ref('');
let cameraStream: MediaStream | null = null;
let cameraStartToken = 0;

const previewSrcList = computed(() => props.items.map((item) => item.fileUrl));
const shouldUseExternalScroll = computed(() => props.scrollMode === 'external');
const panelRootClass = computed(() =>
  shouldUseExternalScroll.value
    ? 'flex min-h-0 flex-none flex-col'
    : 'flex min-h-0 flex-1 flex-col',
);
const panelBodyClass = computed(() =>
  shouldUseExternalScroll.value
    ? 'min-h-40 bg-card p-3 text-sm leading-6 text-foreground'
    : 'min-h-40 flex-1 overflow-auto bg-card p-3 text-sm leading-6 text-foreground',
);

const cameraStatusText = computed(() => {
  if (!cameraPreviewEnabled.value) {
    return '待开启';
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
  if (!props.canEdit) {
    return props.disabledText;
  }
  if (!cameraPreviewEnabled.value) {
    return '点击开启预览后可直接拍照';
  }
  if (cameraStarting.value) {
    return '摄像头初始化中';
  }
  return cameraError.value || '摄像头准备中';
});

watch(cameraPreviewEnabled, (enabled) => {
  if (!enabled) {
    stopCameraStream();
    cameraError.value = '';
    return;
  }
  void syncCameraPreview();
});

watch(
  () => props.canEdit,
  () => {
    void syncCameraPreview();
  },
  { immediate: true },
);

function isCameraSupported() {
  return Boolean(navigator.mediaDevices?.getUserMedia);
}

function stopCameraStream(options: { invalidate?: boolean } = {}) {
  if (options.invalidate !== false) {
    cameraStartToken += 1;
    cameraStarting.value = false;
  }
  cameraStream?.getTracks().forEach((track) => track.stop());
  cameraStream = null;
  cameraReady.value = false;
  if (cameraVideoRef.value) {
    cameraVideoRef.value.srcObject = null;
  }
}

async function startCamera() {
  const startToken = cameraStartToken + 1;
  cameraStartToken = startToken;
  cameraStarting.value = true;
  cameraError.value = '';
  if (!isCameraSupported()) {
    cameraError.value = '当前浏览器不支持摄像头拍照';
    cameraStarting.value = false;
    return;
  }

  stopCameraStream({ invalidate: false });
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: 'environment',
      },
    });
    if (
      cameraStartToken !== startToken ||
      !cameraPreviewEnabled.value ||
      !props.canEdit
    ) {
      stream.getTracks().forEach((track) => track.stop());
      return;
    }
    cameraStream = stream;
    if (cameraVideoRef.value) {
      cameraVideoRef.value.srcObject = stream;
      await cameraVideoRef.value.play();
    }
    if (
      cameraStartToken !== startToken ||
      !cameraPreviewEnabled.value ||
      !props.canEdit
    ) {
      stopCameraStream({ invalidate: false });
      return;
    }
    cameraReady.value = true;
  } catch {
    if (cameraStartToken === startToken) {
      if (cameraPreviewEnabled.value) {
        cameraError.value = '无法打开摄像头，请检查浏览器权限或设备连接';
        ElMessage.warning(cameraError.value);
      }
      stopCameraStream({ invalidate: false });
    }
  } finally {
    if (cameraStartToken === startToken) {
      cameraStarting.value = false;
    }
  }
}

async function syncCameraPreview() {
  if (!cameraPreviewEnabled.value || !props.canEdit) {
    stopCameraStream();
    return;
  }
  await nextTick();
  await startCamera();
}

function buildCapturedFileName() {
  const timestamp = new Date().toISOString().replaceAll(/[:.]/g, '-');
  return `camera-${timestamp}.jpg`;
}

function createCapturedImageBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', 0.92);
  });
}

async function uploadImage(file: File) {
  if (!props.canEdit) {
    ElMessage.warning(props.disabledText);
    return false;
  }
  return props.uploadImageFile(file);
}

async function handleCaptureImage() {
  if (!props.canEdit) {
    ElMessage.warning(props.disabledText);
    return;
  }
  const video = cameraVideoRef.value;
  const canvas = cameraCanvasRef.value;
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
    await uploadImage(file);
  } finally {
    cameraCapturing.value = false;
  }
}

async function handleImageFileChange(event: Event) {
  const fileInput = event.target as HTMLInputElement;
  const files = [...(fileInput.files ?? [])];
  for (const file of files) {
    await uploadImage(file);
  }
  fileInput.value = '';
}

function handleImportImage() {
  if (!props.canEdit) {
    ElMessage.warning(props.disabledText);
    return;
  }
  imageFileInputRef.value?.click();
}

function handleDeleteImage(key: string) {
  if (!props.canEdit) {
    ElMessage.warning(props.disabledText);
    return;
  }
  props.deleteImage?.(key);
}

onBeforeUnmount(() => {
  stopCameraStream();
});
</script>

<template>
  <section data-testid="workbench-captured-image-panel" :class="panelRootClass">
    <input
      ref="imageFileInputRef"
      :accept="accept"
      class="hidden"
      multiple
      type="file"
      @change="handleImageFileChange"
    />
    <div
      data-testid="workbench-captured-image-panel-body"
      :class="panelBodyClass"
    >
      <section class="mb-3 rounded-md border border-border bg-muted/20 p-3">
        <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold text-foreground">
              摄像头预览
            </span>
            <span class="text-xs text-muted-foreground">{{ previewHint }}</span>
          </div>
          <div class="inline-flex items-center gap-2">
            <div
              class="inline-flex items-center gap-2 text-xs text-muted-foreground"
            >
              <span>{{ cameraStatusText }}</span>
              <ElSwitch
                v-model="cameraPreviewEnabled"
                :disabled="!canEdit"
                aria-label="预览开关"
              />
            </div>
            <ElTooltip content="拍照" placement="top">
              <ElButton
                aria-label="拍照"
                :disabled="!canEdit || !cameraReady"
                :icon="Camera"
                :loading="cameraCapturing"
                size="small"
                title="拍照"
                @click="void handleCaptureImage()"
              >
                拍照
              </ElButton>
            </ElTooltip>
            <ElTooltip content="导入图片" placement="top">
              <ElButton
                aria-label="导入图片"
                :disabled="!canEdit"
                :icon="ImagePlus"
                size="small"
                title="导入图片"
                @click="handleImportImage"
              >
                导入图片
              </ElButton>
            </ElTooltip>
          </div>
        </div>
        <div
          class="flex h-40 items-center justify-center overflow-hidden rounded-md border border-dashed border-border bg-slate-950"
        >
          <video
            v-show="cameraPreviewEnabled && cameraReady"
            ref="cameraVideoRef"
            autoplay
            class="h-full w-full object-contain"
            muted
            playsinline
          ></video>
          <div
            v-if="!cameraPreviewEnabled || !cameraReady"
            class="px-4 text-center text-xs text-muted-foreground/50"
          >
            {{ cameraPlaceholderText }}
          </div>
        </div>
        <canvas ref="cameraCanvasRef" class="hidden"></canvas>
      </section>
      <div
        v-if="items.length > 0"
        class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
      >
        <article
          v-for="(asset, assetIndex) in items"
          :key="asset.key"
          class="relative overflow-hidden rounded-md border border-border bg-background"
        >
          <ElTooltip v-if="deleteImage" content="删除图片" placement="left">
            <ElButton
              :aria-label="`删除图片 ${asset.title}`"
              circle
              class="captured-image-delete-button"
              :disabled="!canEdit"
              :icon="X"
              size="small"
              data-testid="captured-image-delete-button"
              type="danger"
              @click.stop="handleDeleteImage(asset.key)"
            />
          </ElTooltip>
          <ElImage
            :alt="asset.title"
            :initial-index="assetIndex"
            :preview-src-list="previewSrcList"
            :src="asset.fileUrl"
            class="block h-32 w-full bg-accent"
            fit="cover"
          >
            <template #error>
              <div
                class="flex h-32 items-center justify-center bg-accent text-xs text-muted-foreground/70"
              >
                预览失败
              </div>
            </template>
          </ElImage>
          <div class="grid gap-2 p-2">
            <div class="flex items-center justify-between gap-2">
              <ElTag effect="plain" size="small">
                {{ asset.sourceLabel }}
              </ElTag>
              <span class="text-[11px] text-muted-foreground">
                {{ assetIndex + 1 }}
              </span>
            </div>
            <div
              class="truncate text-xs font-medium text-foreground"
              :title="asset.title"
            >
              {{ asset.title }}
            </div>
            <div
              class="line-clamp-2 min-h-8 text-xs text-muted-foreground"
              :title="asset.meta || '-'"
            >
              {{ asset.meta || '-' }}
            </div>
          </div>
        </article>
      </div>
      <ElEmpty v-else :description="emptyDescription" />
    </div>
  </section>
</template>

<style scoped>
.captured-image-delete-button {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 2;
  opacity: 0.92;
}
</style>
