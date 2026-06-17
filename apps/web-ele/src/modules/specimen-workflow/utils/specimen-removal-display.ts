import type {
  SpecimenManagementListItem,
  SpecimenRemovalItem,
} from '../types/specimen-workflow';

export type RemovalDisplayRow = SpecimenRemovalItem & {
  actionDisabledReason: null | string;
  patientIdLabel: string;
  sceneMatched: boolean;
};

export function resolveRemovalActionDisabledReason(
  row: Pick<SpecimenRemovalItem, 'specimenRemovalAt'>,
) {
  return row.specimenRemovalAt ? '标本已完成离体确认' : null;
}

export function canConfirmRemoval(
  row: Pick<SpecimenRemovalItem, 'specimenRemovalAt'>,
) {
  return resolveRemovalActionDisabledReason(row) === null;
}

export function toRemovalDisplayRow(
  row: SpecimenRemovalItem,
): RemovalDisplayRow {
  return {
    ...row,
    actionDisabledReason: resolveRemovalActionDisabledReason(row),
    patientIdLabel: row.patientIdLabel?.trim() ?? row.patientId?.trim() ?? '',
    sceneMatched: canConfirmRemoval(row),
  };
}

export function mapSpecimenManagementItemToRemovalDisplayRow(
  item: SpecimenManagementListItem,
): RemovalDisplayRow {
  const baseRow: SpecimenRemovalItem = {
    abnormalFlag: item.abnormalFlag,
    applicationId: item.applicationId,
    applicationNo: item.applicationNo,
    barcode: item.barcode ?? '',
    confirmedAt: item.specimenRemovalAt ?? null,
    containerCount: item.containerCount,
    containerName: item.containerName,
    inpatientNo: item.inpatientNo ?? null,
    latestTrackingAt: item.latestTrackingAt,
    patientGender: item.patientGender ?? null,
    patientId: item.patientId ?? null,
    patientName: item.patientName,
    registeredAt: item.registeredAt,
    registeredByName: item.registrationOperatorName ?? null,
    specimenId: item.specimenId,
    specimenName: item.specimenName,
    specimenNo: item.specimenNo,
    specimenRemovalAt: item.specimenRemovalAt ?? null,
    specimenRemovalOperatorName: item.specimenRemovalOperatorName ?? null,
    specimenStatus: item.specimenStatus,
    specimenType: item.specimenType,
    surgeryName: item.surgeryName ?? null,
    wardName: item.wardName ?? null,
  };

  return toRemovalDisplayRow(baseRow);
}
