import type {
  ApplicationDetailView,
  ApplicationPage,
  LatestSpecimenRegistrationResult,
  PendingSpecimenPage,
  PendingTransportOrderPage,
  SpecimenManagementListPage,
  SpecimenManagementListSummary,
  SpecimenOutboundPage,
  SpecimenReceiptResult,
  SpecimenRegisterResult,
  SpecimenRemovalItem,
  SpecimenRemovalPage,
  SpecimenRemovalSummary,
  SpecimenTrackingSummary,
  TrackingEventView,
  TrackingQueryView,
} from '../../types/specimen-workflow';

export type ApplicationDetailResponse = Omit<
  ApplicationDetailView,
  'recentEvents' | 'specimens'
> & {
  recentEvents?: TrackingEventView[];
  specimens?: SpecimenTrackingSummary[];
};

export type TrackingQueryResponse = Omit<TrackingQueryView, 'recentEvents'> & {
  recentEvents?: TrackingEventView[];
};

export type RegistrationResultResponse = Omit<
  SpecimenRegisterResult,
  'specimens'
> & {
  specimens?: SpecimenTrackingSummary[];
};

export type LatestRegistrationResultResponse = Omit<
  LatestSpecimenRegistrationResult,
  'registrationSnapshot' | 'specimens'
> & {
  registrationSnapshot?: LatestSpecimenRegistrationResult['registrationSnapshot'];
  specimens?: SpecimenTrackingSummary[];
};

export type ApplicationPageResponse = ApplicationPage;
export type PendingSpecimenPageResponse = PendingSpecimenPage;
export type PendingTransportOrderPageResponse = PendingTransportOrderPage;
export type SpecimenOutboundPageResponse = SpecimenOutboundPage;

export type SpecimenManagementListPageResponse = Omit<
  SpecimenManagementListPage,
  'items' | 'summary'
> & {
  items?: SpecimenManagementListPage['items'];
  summary?: Partial<SpecimenManagementListSummary>;
};

export type SpecimenRemovalPageResponse = Omit<
  SpecimenRemovalPage,
  'items' | 'summary'
> & {
  items?: SpecimenRemovalItem[];
  summary?: Partial<SpecimenRemovalSummary>;
};

export function mapApplicationDetailResponse(
  response: ApplicationDetailResponse,
): ApplicationDetailView {
  return {
    ...response,
    currentNode: response.voided ? 'VOIDED' : response.currentNode,
    deletable: response.deletable ?? false,
    editable: response.editable ?? false,
    fixationCompletedAt: response.fixationCompletedAt ?? null,
    operationDisabledReason: response.operationDisabledReason ?? null,
    patientCheckStatus: response.patientCheckStatus ?? null,
    recentEvents: response.recentEvents ?? [],
    receiptAbnormalSummary: response.receiptAbnormalSummary ?? null,
    reportIssued: response.reportIssued ?? false,
    reportStatus: response.reportStatus ?? null,
    specimenConfirmedAt: response.specimenConfirmedAt ?? null,
    specimens: (response.specimens ?? []).map((item) =>
      mapSpecimenTrackingSummary(item),
    ),
    unreceivedCount: response.unreceivedCount ?? 0,
    voided: response.voided ?? response.status === 'VOIDED',
  };
}

export function mapPendingSpecimenPageResponse(
  response: PendingSpecimenPageResponse,
): PendingSpecimenPage {
  return {
    ...response,
    items: (response.items ?? []).map((item) => {
      const verificationCompletedAt = item.verificationCompletedAt ?? null;
      const verificationStartedAt = item.verificationStartedAt ?? null;

      return {
        ...item,
        abnormalType: item.abnormalType ?? null,
        batchAbnormalFlag: item.batchAbnormalFlag ?? false,
        checkInStatus: item.checkInStatus ?? null,
        checkedInAt: item.checkedInAt ?? null,
        checkedInByName: item.checkedInByName ?? null,
        fixationCompletedAt: item.fixationCompletedAt ?? null,
        fixationLiquidType: item.fixationLiquidType ?? null,
        fixationOperatorName: item.fixationOperatorName ?? null,
        fixationOperatorUserId: item.fixationOperatorUserId ?? null,
        fixationStartedAt: item.fixationStartedAt ?? null,
        reminderCount: item.reminderCount ?? 0,
        unreceivedCount: item.unreceivedCount ?? 0,
        verificationCompletedAt,
        verificationStartedAt,
        verificationStatus: resolvePendingSpecimenVerificationStatus(
          item.verificationStatus,
          verificationStartedAt,
          verificationCompletedAt,
        ),
      };
    }),
  };
}

export function mapApplicationPageResponse(
  response: ApplicationPageResponse,
): ApplicationPage {
  return {
    ...response,
    items: (response.items ?? []).map((item) => ({
      ...item,
      currentNode: item.voided ? 'VOIDED' : item.currentNode,
      deletable: item.deletable ?? false,
      editable: item.editable ?? false,
      operationDisabledReason: item.operationDisabledReason ?? null,
      voided: item.voided ?? item.status === 'VOIDED',
    })),
  };
}

export function mapPendingTransportOrderPageResponse(
  response: PendingTransportOrderPageResponse,
): PendingTransportOrderPage {
  return {
    ...response,
    items: (response.items ?? []).map((item) => ({
      ...item,
      batchAbnormalFlag: item.batchAbnormalFlag ?? false,
      outboundUserId: item.outboundUserId ?? null,
      outboundUserName: item.outboundUserName ?? null,
      reminderCount: item.reminderCount ?? 0,
      unreceivedCount: item.unreceivedCount ?? 0,
    })),
  };
}

export function mapSpecimenOutboundPageResponse(
  response: SpecimenOutboundPageResponse,
): SpecimenOutboundPage {
  return {
    ...response,
    items: (response.items ?? []).map((item) => ({
      ...item,
      checkInStatus: item.checkInStatus ?? null,
      fixationStatus: item.fixationStatus ?? null,
      inpatientNo: item.inpatientNo ?? null,
      outboundAt: item.outboundAt ?? null,
      outboundUserName: item.outboundUserName ?? null,
      patientGender: item.patientGender ?? null,
      patientId: item.patientId ?? null,
      patientName: item.patientName ?? null,
      registeredAt: item.registeredAt ?? null,
      registeredByName: item.registeredByName ?? null,
      specimenConfirmedAt: item.specimenConfirmedAt ?? null,
      specimenStatus: item.specimenStatus ?? null,
      surgeryName: item.surgeryName ?? null,
    })),
  };
}

export function mapSpecimenManagementListPageResponse(
  response: SpecimenManagementListPageResponse,
): SpecimenManagementListPage {
  return {
    ...response,
    items: (response.items ?? []).map((item) => ({
      ...item,
      abnormalType: item.abnormalType ?? null,
      barcodeBindingStatus: item.barcodeBindingStatus ?? null,
      checkInStatus: item.checkInStatus ?? null,
      checkedInAt: item.checkedInAt ?? null,
      checkedInByName: item.checkedInByName ?? null,
      fixationCompletedAt: item.fixationCompletedAt ?? null,
      fixationLiquidType: item.fixationLiquidType ?? null,
      fixationOperatorName: item.fixationOperatorName ?? null,
      fixationOperatorUserId: item.fixationOperatorUserId ?? null,
      fixationStartedAt: item.fixationStartedAt ?? null,
      inpatientNo: item.inpatientNo ?? null,
      recentNode: item.recentNode ?? null,
      specimenConfirmedAt: item.specimenConfirmedAt ?? null,
      specimenConfirmedByName: item.specimenConfirmedByName ?? null,
      specimenConfirmedByUserId: item.specimenConfirmedByUserId ?? null,
      specimenRemovalAt: item.specimenRemovalAt ?? null,
      specimenRemovalOperatorName: item.specimenRemovalOperatorName ?? null,
      surgeryName: item.surgeryName ?? null,
      roomId: item.roomId ?? null,
      buildingId: item.buildingId ?? null,
      patientId: item.patientId ?? null,
      patientGender: item.patientGender ?? null,
      registrationOperatorName: item.registrationOperatorName ?? null,
      verificationCompletedAt: item.verificationCompletedAt ?? null,
      verificationStartedAt: item.verificationStartedAt ?? null,
      verificationStatus: item.verificationStatus ?? null,
      wardName: item.wardName ?? null,
    })),
    summary: {
      abnormalCount: response.summary?.abnormalCount ?? 0,
      labelPrintedCount: response.summary?.labelPrintedCount ?? 0,
      pendingLabelCount: response.summary?.pendingLabelCount ?? 0,
      totalCount: response.summary?.totalCount ?? 0,
      unboundCount: response.summary?.unboundCount ?? 0,
    },
  };
}

export function mapSpecimenRemovalPageResponse(
  response: SpecimenRemovalPageResponse,
): SpecimenRemovalPage {
  return {
    ...response,
    items: (response.items ?? []).map((item) => ({
      ...item,
      confirmedAt: item.confirmedAt ?? null,
      specimenRemovalAt: item.specimenRemovalAt ?? null,
      specimenRemovalOperatorName: item.specimenRemovalOperatorName ?? null,
    })),
    summary: {
      abnormalCount: response.summary?.abnormalCount ?? 0,
      confirmedCount: response.summary?.confirmedCount ?? 0,
      pendingCount: response.summary?.pendingCount ?? 0,
      totalCount: response.summary?.totalCount ?? 0,
    },
  };
}

export function mapRegistrationResultResponse(
  response: RegistrationResultResponse,
): SpecimenRegisterResult {
  return {
    ...response,
    specimens: (response.specimens ?? []).map((item) =>
      mapSpecimenTrackingSummary(item),
    ),
  };
}

export function mapLatestRegistrationResultResponse(
  response: LatestRegistrationResultResponse,
): LatestSpecimenRegistrationResult {
  return {
    ...response,
    registrationSnapshot: response.registrationSnapshot
      ? {
          collectionScene:
            response.registrationSnapshot.collectionScene ?? null,
          operatorName: response.registrationSnapshot.operatorName ?? null,
          operatorUserId: response.registrationSnapshot.operatorUserId ?? null,
          printerCode: response.registrationSnapshot.printerCode ?? null,
          remarks: response.registrationSnapshot.remarks ?? null,
          terminalCode: response.registrationSnapshot.terminalCode ?? null,
        }
      : null,
    specimens: (response.specimens ?? []).map((item) =>
      mapSpecimenTrackingSummary(item),
    ),
  };
}

export function mapSpecimenReceiptResult(
  response: SpecimenReceiptResult,
): SpecimenReceiptResult {
  return {
    ...response,
    batchAbnormalFlag: response.batchAbnormalFlag ?? false,
    receiptAbnormalSummary: response.receiptAbnormalSummary ?? null,
    reminderCount: response.reminderCount ?? 0,
  };
}

function mapSpecimenTrackingSummary(
  specimen: SpecimenTrackingSummary,
): SpecimenTrackingSummary {
  return {
    ...specimen,
    abnormalReason: specimen.abnormalReason ?? null,
    abnormalType: specimen.abnormalType ?? null,
    barcode: specimen.barcode ?? null,
    barcodeBindingStatus: specimen.barcodeBindingStatus ?? null,
    checkInStatus: specimen.checkInStatus ?? null,
    checkedInAt: specimen.checkedInAt ?? null,
    checkedInByName: specimen.checkedInByName ?? null,
    fixationCompletedAt: specimen.fixationCompletedAt ?? null,
    fixationLiquidType: specimen.fixationLiquidType ?? null,
    fixationOperatorName: specimen.fixationOperatorName ?? null,
    fixationOperatorUserId: specimen.fixationOperatorUserId ?? null,
    fixationStartedAt: specimen.fixationStartedAt ?? null,
    qualityCheckResult: specimen.qualityCheckResult ?? null,
    qualityIssueCodes: specimen.qualityIssueCodes ?? [],
    receiptStatus: specimen.receiptStatus ?? null,
    specimenConfirmedAt: specimen.specimenConfirmedAt ?? null,
    verificationCompletedAt: specimen.verificationCompletedAt ?? null,
    verificationStartedAt: specimen.verificationStartedAt ?? null,
    verificationStatus: specimen.verificationStatus ?? null,
  };
}

function resolvePendingSpecimenVerificationStatus(
  verificationStatus: null | string | undefined,
  verificationStartedAt: null | string,
  verificationCompletedAt: null | string,
) {
  const normalizedStatus = verificationStatus?.trim();
  if (normalizedStatus) {
    return normalizedStatus;
  }
  if (verificationCompletedAt) {
    return 'VERIFIED';
  }
  if (verificationStartedAt) {
    return 'VERIFYING';
  }
  return 'UNVERIFIED';
}
