import type {
  PendingTechnicalTaskItem,
  TechnicalTrackingEmbeddingRecordSummary,
} from '../types/technical-workflow';

export function formatShortEmbeddingBoxNo(value?: null | string) {
  const normalizedValue = value?.trim() ?? '';
  if (!normalizedValue) {
    return null;
  }
  const suffixMatch = normalizedValue.match(/([A-Za-z]+\d+)$/);
  return suffixMatch?.[1]?.toUpperCase() ?? normalizedValue;
}

export function getEmbeddingBlockDisplayNo(task: PendingTechnicalTaskItem) {
  return (
    task.objectDisplayNo?.trim() ||
    formatShortEmbeddingBoxNo(task.samplingBlockCode) ||
    null
  );
}

export function getEmbeddingWorkstationRemark(task: PendingTechnicalTaskItem) {
  return task.embeddingRemarks?.trim() || task.remarks?.trim() || '';
}

export function getEmbeddingRecordBlockDisplayNo(
  record: Pick<
    TechnicalTrackingEmbeddingRecordSummary,
    'embeddingBoxNo' | 'samplingBlockCode'
  >,
) {
  return (
    formatShortEmbeddingBoxNo(record.embeddingBoxNo) ||
    record.samplingBlockCode?.trim() ||
    null
  );
}
