import type {
  ApplicationDetailView,
  RegistrationSnapshotView,
  SpecimenVerificationRecord,
  TrackingEventView,
} from '../types/specimen-workflow';

import applicationsSeedRaw from '../../../../../../mock_data/specimen-workflow/applications.json';
import registrationBatchesSeedRaw from '../../../../../../mock_data/specimen-workflow/registration-batches.json';
import specimensSeedRaw from '../../../../../../mock_data/specimen-workflow/specimens.json';
import transportOrdersSeedRaw from '../../../../../../mock_data/specimen-workflow/transport-orders.json';
import verificationRecordsSeedRaw from '../../../../../../mock_data/specimen-workflow/verification-records.json';
import workflowEventsSeedRaw from '../../../../../../mock_data/specimen-workflow/workflow-events.json';

export type RawApplication = Omit<
  ApplicationDetailView,
  'recentEvents' | 'specimens'
>;

export type RawSpecimen = {
  applicationId: string;
  barcode: string;
  checkedInAt?: null | string;
  checkedInByName?: null | string;
  checkInStatus?: null | string;
  clinicalSymptom: null | string;
  collectionMode: null | string;
  containerCount: null | number;
  containerName: null | string;
  fixationCompletedAt: null | string;
  fixationLiquidType: null | string;
  fixationOperatorName?: null | string;
  fixationOperatorUserId?: null | string;
  fixationStartedAt: null | string;
  fixationStatus: null | string;
  id: string;
  labelPrintBatchNo: null | string;
  labelPrintStatus: null | string;
  latestTrackingAt: null | string;
  previousBarcodes: string[];
  qualityCheckResult: null | string;
  qualityIssueCodes: string[];
  receiptReason: null | string;
  receiptRemarks: null | string;
  receiptStatus: null | string;
  registeredAt: null | string;
  specimenConfirmedAt: null | string;
  specimenConfirmedByName?: null | string;
  specimenConfirmedByUserId?: null | string;
  specimenCount: null | number;
  specimenName: string;
  specimenNo: string;
  specimenRemovalAt?: null | string;
  specimenRemovalOperatorName?: null | string;
  specimenSite: null | string;
  specimenStatus: null | string;
  specimenType: null | string;
  verificationCompletedAt?: null | string;
  verificationStartedAt?: null | string;
  verificationStatus?: null | string;
};

export type RawTransportOrder = {
  applicationId: string;
  createdAt: string;
  handedOverAt: null | string;
  handoverDepartmentId: null | string;
  handoverDepartmentName: null | string;
  handoverUserId: null | string;
  handoverUserName: null | string;
  id: string;
  outboundUserId?: null | string;
  outboundUserName?: null | string;
  printedAt: null | string;
  receiverDepartmentId: null | string;
  receiverDepartmentName: null | string;
  receiverUserId: null | string;
  receiverUserName: null | string;
  remarks: null | string;
  specimenIds: string[];
  status: string;
  terminalCode: null | string;
  toBeTransportedAt: null | string;
  transportOrderNo: string;
};

export type RawWorkflowEvent = TrackingEventView & {
  applicationId: string;
  id: string;
};

export type RawVerificationRecord = SpecimenVerificationRecord & {
  id: string;
  operatorUserId: null | string;
};

export type RawRegistrationBatch = {
  applicationId: string;
  createdAt: string;
  labelPrintBatchNo: null | string;
  labelPrintMessage: null | string;
  labelPrintSuccess: boolean;
  registrationSnapshot: null | RegistrationSnapshotView;
  specimenIds: string[];
};

export type MockState = {
  applications: RawApplication[];
  registrationBatches: RawRegistrationBatch[];
  specimens: RawSpecimen[];
  transportOrders: RawTransportOrder[];
  verificationRecords: RawVerificationRecord[];
  workflowEvents: RawWorkflowEvent[];
};

const applicationsSeed = applicationsSeedRaw as RawApplication[];
const registrationBatchesSeed =
  registrationBatchesSeedRaw as RawRegistrationBatch[];
const specimensSeed = specimensSeedRaw as RawSpecimen[];
const transportOrdersSeed = transportOrdersSeedRaw as RawTransportOrder[];
const verificationRecordsSeed =
  verificationRecordsSeedRaw as RawVerificationRecord[];
const workflowEventsSeed = workflowEventsSeedRaw as RawWorkflowEvent[];

function cloneSeed<T>(value: T): T {
  return structuredClone(value);
}

function normalizeSeedSpecimen(
  specimen: RawSpecimen,
  transportOrders: RawTransportOrder[],
): RawSpecimen {
  const transportOrder = transportOrders.find((item) =>
    item.specimenIds.includes(specimen.id),
  );
  const specimenConfirmedAt =
    specimen.specimenConfirmedAt ??
    (transportOrder ? transportOrder.createdAt : null);
  const derivedVerificationStatus =
    specimen.verificationStatus ??
    (specimen.fixationStatus || specimenConfirmedAt || transportOrder
      ? 'VERIFIED'
      : 'UNVERIFIED');
  const verificationCompletedAt =
    specimen.verificationCompletedAt ??
    (derivedVerificationStatus === 'VERIFIED'
      ? (specimen.fixationStartedAt ??
        specimenConfirmedAt ??
        specimen.registeredAt)
      : null);
  const verificationStartedAt =
    specimen.verificationStartedAt ??
    (derivedVerificationStatus === 'VERIFYING'
      ? specimen.registeredAt
      : verificationCompletedAt);
  const derivedCheckInStatus =
    specimen.checkInStatus ??
    (transportOrder ||
    specimen.receiptStatus ||
    specimen.specimenStatus === 'IN_TRANSIT'
      ? 'CHECKED_IN'
      : 'NOT_CHECKED_IN');
  const checkedInAt =
    specimen.checkedInAt ??
    (derivedCheckInStatus === 'CHECKED_IN'
      ? (transportOrder?.createdAt ?? specimenConfirmedAt ?? null)
      : null);
  const checkedInByName =
    specimen.checkedInByName ??
    (derivedCheckInStatus === 'CHECKED_IN'
      ? (transportOrder?.handoverUserName ?? null)
      : null);

  return {
    ...specimen,
    checkInStatus: derivedCheckInStatus,
    checkedInAt,
    checkedInByName,
    fixationOperatorName: specimen.fixationOperatorName ?? null,
    fixationOperatorUserId: specimen.fixationOperatorUserId ?? null,
    specimenConfirmedAt,
    specimenConfirmedByName: specimen.specimenConfirmedByName ?? null,
    specimenConfirmedByUserId: specimen.specimenConfirmedByUserId ?? null,
    verificationCompletedAt,
    verificationStartedAt,
    verificationStatus: derivedVerificationStatus,
  };
}

export function createInitialState(): MockState {
  const transportOrders = cloneSeed(transportOrdersSeed);
  return {
    applications: cloneSeed(applicationsSeed),
    registrationBatches: cloneSeed(registrationBatchesSeed),
    specimens: cloneSeed(specimensSeed).map((item) =>
      normalizeSeedSpecimen(item, transportOrders),
    ),
    transportOrders,
    verificationRecords: cloneSeed(verificationRecordsSeed),
    workflowEvents: cloneSeed(workflowEventsSeed),
  };
}
