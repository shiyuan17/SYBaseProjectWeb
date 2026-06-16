import type { SpecimenTrackingSummary } from '../types/specimen-workflow';

export interface SpecimenAbnormalDetail {
  barcode: string;
  id: string;
  qualityCheckResult: null | string;
  qualityIssueCodes: string[];
  reason: null | string;
  specimenNo: string;
  status: null | string;
}

function normalizeCodes(codes?: string[]) {
  return (codes ?? []).map((code) => code.trim()).filter(Boolean);
}

function resolveAbnormalStatus(specimen: SpecimenTrackingSummary) {
  const receiptStatus = specimen.receiptStatus?.trim();
  if (receiptStatus === 'REJECTED' || receiptStatus === 'RETURNED') {
    return receiptStatus;
  }
  const specimenStatus = specimen.specimenStatus?.trim();
  if (specimenStatus === 'REJECTED' || specimenStatus === 'RETURNED') {
    return specimenStatus;
  }
  return null;
}

export function buildSpecimenAbnormalDetails(
  specimens: SpecimenTrackingSummary[],
): SpecimenAbnormalDetail[] {
  return specimens.flatMap((specimen) => {
    const status = resolveAbnormalStatus(specimen);
    const qualityCheckResult = specimen.qualityCheckResult?.trim() || null;
    const qualityIssueCodes = normalizeCodes(specimen.qualityIssueCodes);
    const reason = specimen.abnormalReason?.trim() || null;
    const hasAbnormalInfo = Boolean(
      status ||
      qualityCheckResult === 'FAILED' ||
      qualityIssueCodes.length > 0 ||
      reason,
    );
    if (!hasAbnormalInfo) {
      return [];
    }
    return [
      {
        barcode: specimen.barcode ?? '',
        id: specimen.id,
        qualityCheckResult,
        qualityIssueCodes,
        reason,
        specimenNo: specimen.specimenNo,
        status,
      },
    ];
  });
}
