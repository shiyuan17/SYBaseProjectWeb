import type { Ref } from 'vue';

import type { ApplicationRegistrationWorkbenchRecord } from '../types/application-registration-workbench';
import type { WorkbenchInfoItem } from '../utils/application-registration-patient-panel';

import { computed, nextTick, ref } from 'vue';

import { ElMessage } from 'element-plus';

import {
  buildSections,
  buildSummaryItems,
  getReprintApplicationIdentifier,
} from '../utils/application-registration-patient-panel';
import { buildApplicationFormPrintDocument } from '../utils/specimen-print';

export function useApplicationRegistrationPatientPanel(options: {
  buildingLabel: Ref<string>;
  record: Ref<ApplicationRegistrationWorkbenchRecord | null>;
  roomLabel: Ref<string>;
  updateRecord: (record: ApplicationRegistrationWorkbenchRecord) => void;
}) {
  const activeEditorKey = ref('');
  const editingValue = ref('');

  const summaryItems = computed(() =>
    options.record.value ? buildSummaryItems(options.record.value) : [],
  );

  const sections = computed(() =>
    options.record.value
      ? buildSections(options.record.value, {
          buildingLabel: options.buildingLabel.value,
          roomLabel: options.roomLabel.value,
        })
      : [],
  );

  function cancelEditing() {
    activeEditorKey.value = '';
    editingValue.value = '';
  }

  async function beginEditing(item: WorkbenchInfoItem) {
    if (!options.record.value || item.editorType === 'readonly') {
      return;
    }

    activeEditorKey.value = item.key;
    if (item.editorType === 'select') {
      editingValue.value = item.value === '是' ? 'true' : 'false';
    } else if (item.value === '-') {
      editingValue.value = '';
    } else {
      editingValue.value = item.value;
    }

    await nextTick();
    const editor = document.querySelector<HTMLElement>(
      `[data-editor-key="${item.key}"] input, [data-editor-key="${item.key}"] textarea`,
    );
    editor?.focus();
  }

  function saveEditing(item: WorkbenchInfoItem) {
    if (!options.record.value || !item.writeBack) {
      cancelEditing();
      return;
    }

    options.updateRecord(
      item.writeBack(options.record.value, editingValue.value),
    );
    cancelEditing();
  }

  function handleValueDoubleClick(item: WorkbenchInfoItem) {
    if (item.editorType === 'readonly') {
      return;
    }

    void beginEditing(item);
  }

  function openPrintWindow(documentHtml: string) {
    const printWindow = window.open('', '_blank', 'width=960,height=760');
    if (!printWindow) {
      ElMessage.warning('打印窗口被浏览器拦截，请允许弹窗后重试');
      return null;
    }

    printWindow.document.open();
    printWindow.document.write(documentHtml);
    printWindow.document.close();
    return printWindow;
  }

  function printApplicationForm() {
    const applicationId = getReprintApplicationIdentifier(options.record.value);
    if (!options.record.value || !applicationId) {
      ElMessage.warning('缺少补打申请单所需的申请单号');
      return;
    }

    try {
      const printDocument = buildApplicationFormPrintDocument(
        options.record.value,
      );
      openPrintWindow(printDocument);
    } catch (error) {
      console.error(error);
      ElMessage.error('申请单打印内容生成失败，请稍后重试');
    }
  }

  return {
    activeEditorKey,
    beginEditing,
    cancelEditing,
    editingValue,
    handleValueDoubleClick,
    printApplicationForm,
    saveEditing,
    sections,
    summaryItems,
  };
}
