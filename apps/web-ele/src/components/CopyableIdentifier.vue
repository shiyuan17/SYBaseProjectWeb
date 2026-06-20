<script setup lang="ts">
import { computed, useAttrs } from 'vue';

import { ElMessage, ElTag } from 'element-plus';

type CopyableIdentifierKind =
  | 'applicationNo'
  | 'pathologyNo'
  | 'patientId'
  | 'specimenNo';

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(
  defineProps<{
    fallbackValue?: null | number | string;
    kind: CopyableIdentifierKind;
    placeholder?: string;
    tagSize?: 'default' | 'large' | 'small';
    tagType?: '' | 'danger' | 'info' | 'primary' | 'success' | 'warning';
    value?: null | number | string;
  }>(),
  {
    fallbackValue: '',
    placeholder: '-',
    tagSize: 'small',
    tagType: '',
    value: '',
  },
);

const attrs = useAttrs();

const KIND_LABELS: Record<CopyableIdentifierKind, string> = {
  applicationNo: '申请单号',
  pathologyNo: '病理号',
  patientId: '病人ID',
  specimenNo: '标本编号',
};

function normalizeIdentifierValue(value?: null | number | string) {
  if (value === null || value === undefined) {
    return '';
  }

  const normalizedValue = String(value).trim();
  return normalizedValue === '-' ? '' : normalizedValue;
}

const resolvedValue = computed(
  () =>
    normalizeIdentifierValue(props.value) ||
    normalizeIdentifierValue(props.fallbackValue),
);
const isCopyable = computed(() => Boolean(resolvedValue.value));
const displayValue = computed(() => resolvedValue.value || props.placeholder);
const identifierLabel = computed(() => KIND_LABELS[props.kind]);
const copyTitle = computed(() =>
  isCopyable.value ? `点击复制${identifierLabel.value}` : undefined,
);
const rootAttrs = computed(() => {
  const { class: _className, title: _title, ...restAttrs } = attrs;
  return restAttrs;
});

async function copyWithClipboardApi(text: string) {
  if (!navigator?.clipboard?.writeText) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function copyWithLegacyTextarea(text: string) {
  if (typeof document === 'undefined') {
    return false;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.top = '-9999px';
  textarea.style.left = '-9999px';
  textarea.style.opacity = '0';
  document.body.append(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, text.length);

  try {
    return Boolean(document.execCommand?.('copy'));
  } catch {
    return false;
  } finally {
    textarea.remove();
  }
}

async function handleCopy() {
  if (!isCopyable.value) {
    return;
  }

  const identifierValue = resolvedValue.value;
  const copied =
    (await copyWithClipboardApi(identifierValue)) ||
    copyWithLegacyTextarea(identifierValue);

  if (!copied) {
    ElMessage.warning('复制失败，请手动复制');
    return;
  }

  ElMessage.success(`${identifierLabel.value}已复制`);
}
</script>

<template>
  <component
    :is="tagType ? ElTag : 'span'"
    v-bind="rootAttrs"
    class="copyable-identifier"
    :class="[
      attrs.class,
      {
        'copyable-identifier--active': isCopyable,
        'copyable-identifier--tag': Boolean(tagType),
      },
    ]"
    :data-copy-kind="kind"
    :data-copyable="isCopyable ? 'true' : 'false'"
    :size="tagType ? tagSize : undefined"
    :title="copyTitle"
    :type="tagType || undefined"
    @click="void handleCopy()"
  >
    {{ displayValue }}
  </component>
</template>

<style scoped>
.copyable-identifier {
  display: inline-flex;
  min-width: 0;
  max-width: 100%;
  overflow-wrap: anywhere;
}

.copyable-identifier--active {
  cursor: pointer;
}

.copyable-identifier--active:hover {
  text-decoration: underline;
}

.copyable-identifier--tag.copyable-identifier--active:hover {
  text-decoration: none;
  filter: brightness(0.96);
}
</style>
