<script setup lang="ts">
import type { UploadProps, UploadRequestOptions } from 'element-plus';

import type { SamplingTemplateTreeOption } from '../composables/useGrossingProcessDialog';
import type { GrossingSpecimenItemRequest } from '../types/technical-workflow';

import type { BodyPartNode } from '#/modules/system-management/types/system-management';
import type { WorkflowReferenceOptionsResponse } from '#/modules/system-management/types/workflow-reference';

import {
  ElButton,
  ElInput,
  ElInputNumber,
  ElTabPane,
  ElTabs,
  ElTreeSelect,
  ElUpload,
} from 'element-plus';

import ReferenceOptionSelect from '#/modules/system-management/components/ReferenceOptionSelect.vue';

defineProps<{
  activeSpecimenKey: string;
  beforeGrossingImageUpload: UploadProps['beforeUpload'];
  bodyPartTreeOptions: BodyPartNode[];
  completeForm: {
    specimens: GrossingSpecimenItemRequest[];
  };
  createGrossingImageUploadRequest: (
    specimenIndex: number,
  ) => (options: UploadRequestOptions) => Promise<void>;
  getSpecimenTabLabel: (index: number) => string;
  grossingImageAccept: string;
  isSpecimenUploading: (specimenIndex: number) => boolean;
  labelClass: string;
  samplingTemplateTreeOptions: SamplingTemplateTreeOption[];
  specimenTabMetas: Array<{ key: string; trackingLabel: string }>;
  workflowReferenceOptions: WorkflowReferenceOptionsResponse;
}>();

const emit = defineEmits<{
  addBlock: [specimenIndex: number];
  addMediaAsset: [specimenIndex: number];
  addSpecimen: [];
  removeBlock: [specimenIndex: number, blockIndex: number];
  removeMediaAsset: [specimenIndex: number, assetIndex: number];
  removeSpecimen: [specimenIndex: number];
  'update:activeSpecimenKey': [value: string];
}>();

function handleActiveSpecimenKeyChange(value: number | string) {
  emit('update:activeSpecimenKey', String(value));
}
</script>

<template>
  <div class="flex items-center justify-between">
    <div>
      <h4 class="text-sm font-semibold text-foreground">标本明细</h4>
      <p class="mt-1 text-xs text-[var(--el-text-color-secondary)]">
        支持录入标本、蜡块和标本摄影像。
      </p>
    </div>
    <ElButton @click="emit('addSpecimen')">新增标本</ElButton>
  </div>

  <ElTabs
    :model-value="activeSpecimenKey"
    class="grossing-specimen-tabs"
    @update:model-value="handleActiveSpecimenKeyChange"
  >
    <ElTabPane
      v-for="(specimen, specimenIndex) in completeForm.specimens"
      :key="specimenTabMetas[specimenIndex]?.key"
      :label="getSpecimenTabLabel(specimenIndex)"
      :name="specimenTabMetas[specimenIndex]?.key"
    >
      <section class="rounded-lg border border-dashed border-border p-4">
        <div class="mb-4">
          <div>
            <h4 class="text-sm font-semibold text-foreground">
              {{ getSpecimenTabLabel(specimenIndex) }}
            </h4>
            <p class="mt-1 text-xs text-[var(--el-text-color-secondary)]">
              当前仅编辑该标本对应的取材、蜡块和影像信息。
            </p>
          </div>
        </div>

        <div class="overflow-x-auto rounded-lg border border-border">
          <div class="min-w-[1340px]">
            <div
              class="hidden grid-cols-[210px_160px_220px_220px_minmax(300px,1fr)_140px] gap-3 border-b border-border bg-muted/30 px-4 py-3 text-sm font-medium text-muted-foreground lg:grid"
            >
              <span>标本编号</span>
              <span>标本类型</span>
              <span>取材部位</span>
              <span>取材模板</span>
              <span>大体描写</span>
              <span class="text-right">操作</span>
            </div>
            <div class="px-4 py-3">
              <div
                class="grid gap-3 lg:grid-cols-[210px_160px_220px_220px_minmax(300px,1fr)_140px] lg:items-start"
              >
                <ElInput
                  v-model="specimen.specimenId"
                  placeholder="优先由病例追踪带入，也可手工录入"
                />
                <ReferenceOptionSelect
                  v-model="specimen.specimenType"
                  :options="workflowReferenceOptions.specimenTypes"
                  placeholder="请选择或输入标本类型"
                />
                <ElTreeSelect
                  v-model="specimen.bodyPartId"
                  :data="bodyPartTreeOptions"
                  :props="{ children: 'children', label: 'partName' }"
                  :render-after-expand="false"
                  check-strictly
                  clearable
                  filterable
                  node-key="id"
                  placeholder="请选择取材部位"
                  value-key="id"
                />
                <ElTreeSelect
                  v-model="specimen.samplingTemplateId"
                  :data="samplingTemplateTreeOptions"
                  :props="{
                    children: 'children',
                    disabled: 'disabled',
                    label: 'name',
                  }"
                  :render-after-expand="false"
                  check-strictly
                  clearable
                  filterable
                  node-key="id"
                  placeholder="请选择取材模板"
                  value-key="id"
                />
                <ElInput
                  v-model="specimen.grossDescription"
                  :rows="3"
                  class="min-w-[300px] w-full"
                  placeholder="请输入大体描写"
                  type="textarea"
                />
                <div class="flex flex-wrap items-start justify-end gap-2">
                  <ElButton
                    link
                    type="primary"
                    @click="emit('addMediaAsset', specimenIndex)"
                  >
                    手工补充影像
                  </ElButton>
                  <ElButton
                    link
                    type="danger"
                    @click="emit('removeSpecimen', specimenIndex)"
                  >
                    删除标本
                  </ElButton>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-4 rounded-lg border border-border p-4">
          <div class="mb-3 flex items-center justify-between">
            <h5 class="text-sm font-medium text-foreground">
              标本影像与取材要素
            </h5>
            <span class="text-xs text-[var(--el-text-color-secondary)]">
              影像可通过下方上传区关联到当前标本。
            </span>
          </div>
          <div
            class="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]"
          >
            <ReferenceOptionSelect
              v-model="specimen.sizeText"
              :options="workflowReferenceOptions.specimenImageSizes"
              placeholder="大小，如 3.2x2.1x1.0cm"
            />
            <ReferenceOptionSelect
              v-model="specimen.cutSurfaceFeature"
              :options="workflowReferenceOptions.cutSurfaceFeatures"
              placeholder="切面特征，如灰白、质硬、坏死"
            />
            <ReferenceOptionSelect
              v-model="specimen.marginMarking"
              :options="workflowReferenceOptions.marginMarkings"
              placeholder="切缘标记，如上缘墨染"
            />
            <ElInputNumber
              v-model="specimen.blockCount"
              :min="1"
              :step="1"
              class="w-full"
              controls-position="right"
              placeholder="取材块数"
            />
          </div>
        </div>

        <div class="mb-2 mt-4 flex items-center justify-between">
          <h5 class="text-sm font-medium text-foreground">蜡块明细</h5>
          <span class="text-xs text-[var(--el-text-color-secondary)]">
            每个标本至少保留一个蜡块明细。
          </span>
        </div>
        <div class="overflow-x-auto rounded-lg border border-border">
          <div class="min-w-[880px]">
            <div
              class="hidden grid-cols-[120px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_180px] items-center gap-3 border-b border-border bg-muted/30 px-4 py-3 text-sm font-medium text-muted-foreground md:grid"
            >
              <span>序号</span>
              <span>蜡块部位</span>
              <span>蜡块描述</span>
              <span>特殊要求</span>
              <span class="text-right">操作</span>
            </div>
            <div class="flex flex-col">
              <section
                v-for="(block, blockIndex) in specimen.blocks"
                :key="blockIndex"
                class="border-b border-border px-4 py-3 last:border-b-0"
              >
                <div
                  class="grid gap-3 md:grid-cols-[120px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_180px] md:items-center"
                >
                  <div class="text-sm font-medium text-foreground">
                    蜡块 {{ blockIndex + 1 }}
                  </div>
                  <ElInput v-model="block.blockSite" placeholder="蜡块部位" />
                  <ElInput
                    v-model="block.blockDescription"
                    placeholder="蜡块描述"
                  />
                  <ElInput
                    v-model="block.specialRequirement"
                    placeholder="特殊要求"
                  />
                  <div class="flex flex-wrap items-center justify-end gap-2">
                    <ElButton
                      link
                      type="primary"
                      @click="emit('addBlock', specimenIndex)"
                    >
                      新增蜡块
                    </ElButton>
                    <ElButton
                      link
                      type="danger"
                      @click="emit('removeBlock', specimenIndex, blockIndex)"
                    >
                      删除蜡块
                    </ElButton>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>

        <div class="mb-2 mt-4 flex items-center justify-between">
          <div>
            <h5 class="text-sm font-medium text-foreground">标本摄影像</h5>
            <span class="text-xs text-[var(--el-text-color-secondary)]">
              上传后自动关联到当前标本，也可手工补充影像地址。
            </span>
          </div>
          <ElUpload
            :accept="grossingImageAccept"
            :before-upload="beforeGrossingImageUpload"
            :disabled="isSpecimenUploading(specimenIndex)"
            :http-request="createGrossingImageUploadRequest(specimenIndex)"
            :show-file-list="false"
          >
            <ElButton
              :loading="isSpecimenUploading(specimenIndex)"
              type="primary"
            >
              上传影像
            </ElButton>
          </ElUpload>
        </div>
        <div v-if="specimen.mediaAssets?.length" class="flex flex-col gap-3">
          <section
            v-for="(asset, assetIndex) in specimen.mediaAssets"
            :key="assetIndex"
            class="rounded border border-border p-3"
          >
            <div class="mb-3 flex items-center justify-between gap-3">
              <span :class="labelClass">影像 {{ assetIndex + 1 }}</span>
              <ElButton
                link
                type="danger"
                @click="emit('removeMediaAsset', specimenIndex, assetIndex)"
              >
                删除影像
              </ElButton>
            </div>
            <div class="grid gap-4 md:grid-cols-2">
              <ElInput v-model="asset.fileUrl" placeholder="影像地址" />
              <ElInput v-model="asset.fileName" placeholder="影像名称" />
            </div>
            <a
              v-if="asset.fileUrl"
              :href="asset.fileUrl"
              class="mt-3 inline-flex text-sm text-primary hover:text-primary/80"
              target="_blank"
              rel="noreferrer"
            >
              查看影像
            </a>
          </section>
        </div>
      </section>
    </ElTabPane>
  </ElTabs>
</template>
