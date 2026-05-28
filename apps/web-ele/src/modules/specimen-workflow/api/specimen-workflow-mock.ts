import type {
  ApplicationCreateRequest,
  ApplicationCreateResult,
  ApplicationDetailView,
  ApplicationFormReprintRequest,
  ApplicationListItem,
  ApplicationListQuery,
  ApplicationPage,
  ApplicationUpdateRequest,
  DirectSpecimenReceiptRequest,
  DuplicateApplicationCheckResult,
  DuplicateApplicationCheckQuery,
  FixationResult,
  ImportClinicalApplicationRequest,
  LabelPrintRetryRequest,
  LabelPrintRetryResult,
  LatestSpecimenRegistrationResult,
  SpecimenCheckInRequest,
  PendingSpecimenItem,
  PendingSpecimenPage,
  PendingSpecimenQuery,
  SpecimenRemovalConfirmRequest,
  SpecimenRemovalConfirmResult,
  SpecimenRemovalItem,
  SpecimenRemovalPage,
  SpecimenRemovalQuery,
  SpecimenRemovalSummary,
  PendingTransportOrderItem,
  PendingTransportOrderPage,
  PendingTransportOrderQuery,
  RegistrationSnapshotView,
  SpecimenBarcodeBindingRequest,
  SpecimenConfirmRequest,
  SpecimenFixationRequest,
  SpecimenManagementListItem,
  SpecimenManagementListPage,
  SpecimenManagementListQuery,
  SpecimenManagementListSummary,
  SpecimenReceiptRequest,
  SpecimenReceiptResult,
  SpecimenRegisterRequest,
  SpecimenRegisterResult,
  SpecimenTrackingSummary,
  SpecimenVerificationRequest,
  SpecimenVerificationRecord,
  TrackingEventView,
  TrackingQueryView,
  TransportOrderCreateRequest,
  TransportOrderHandoverRequest,
  TransportOrderOperatorRequest,
  TransportOrderView,
} from '../types/specimen-workflow';

import applicationsSeedRaw from '../../../../../../mock_data/specimen-workflow/applications.json';
import registrationBatchesSeedRaw from '../../../../../../mock_data/specimen-workflow/registration-batches.json';
import specimensSeedRaw from '../../../../../../mock_data/specimen-workflow/specimens.json';
import transportOrdersSeedRaw from '../../../../../../mock_data/specimen-workflow/transport-orders.json';
import verificationRecordsSeedRaw from '../../../../../../mock_data/specimen-workflow/verification-records.json';
import workflowEventsSeedRaw from '../../../../../../mock_data/specimen-workflow/workflow-events.json';

type RawApplication = Omit<ApplicationDetailView, 'recentEvents' | 'specimens'>;

type RawSpecimen = {
  applicationId: string;
  barcode: string;
  checkInStatus?: null | string;
  checkedInAt?: null | string;
  checkedInByName?: null | string;
  clinicalSymptom: null | string;
  collectionMode: null | string;
  containerCount: null | number;
  containerName: null | string;
  fixationCompletedAt: null | string;
  fixationLiquidType: null | string;
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
  specimenCount: null | number;
  specimenName: string;
  specimenNo: string;
  specimenSite: null | string;
  specimenStatus: null | string;
  specimenType: null | string;
  verificationCompletedAt?: null | string;
  verificationStartedAt?: null | string;
  verificationStatus?: null | string;
};

type RawTransportOrder = {
  applicationId: string;
  createdAt: string;
  handedOverAt: null | string;
  handoverDepartmentId: null | string;
  handoverDepartmentName: null | string;
  handoverUserId: null | string;
  handoverUserName: null | string;
  id: string;
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

type RawWorkflowEvent = TrackingEventView & {
  applicationId: string;
  id: string;
};

type RawVerificationRecord = SpecimenVerificationRecord & {
  id: string;
  operatorUserId: null | string;
};

type RawRegistrationBatch = {
  applicationId: string;
  createdAt: string;
  labelPrintBatchNo: null | string;
  labelPrintMessage: null | string;
  labelPrintSuccess: boolean;
  registrationSnapshot: null | RegistrationSnapshotView;
  specimenIds: string[];
};

type MockState = {
  applications: RawApplication[];
  registrationBatches: RawRegistrationBatch[];
  specimens: RawSpecimen[];
  transportOrders: RawTransportOrder[];
  verificationRecords: RawVerificationRecord[];
  workflowEvents: RawWorkflowEvent[];
};

const applicationsSeed = applicationsSeedRaw as RawApplication[];
const registrationBatchesSeed = registrationBatchesSeedRaw as RawRegistrationBatch[];
const specimensSeed = specimensSeedRaw as RawSpecimen[];
const transportOrdersSeed = transportOrdersSeedRaw as RawTransportOrder[];
const verificationRecordsSeed = verificationRecordsSeedRaw as RawVerificationRecord[];
const workflowEventsSeed = workflowEventsSeedRaw as RawWorkflowEvent[];

let state = createInitialState();

function createInitialState(): MockState {
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

function cloneSeed<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalizeSeedSpecimen(
  specimen: RawSpecimen,
  transportOrders: RawTransportOrder[],
): RawSpecimen {
  const transportOrder = transportOrders.find((item) => item.specimenIds.includes(specimen.id));
  const specimenConfirmedAt =
    specimen.specimenConfirmedAt
    ?? (transportOrder ? transportOrder.createdAt : null);
  const derivedVerificationStatus =
    specimen.verificationStatus
    ?? (specimen.fixationStatus || specimenConfirmedAt || transportOrder
      ? 'VERIFIED'
      : 'UNVERIFIED');
  const verificationCompletedAt =
    specimen.verificationCompletedAt
    ?? (derivedVerificationStatus === 'VERIFIED'
      ? specimen.fixationStartedAt ?? specimenConfirmedAt ?? specimen.registeredAt
      : null);
  const verificationStartedAt =
    specimen.verificationStartedAt
    ?? (derivedVerificationStatus === 'VERIFYING'
      ? specimen.registeredAt
      : verificationCompletedAt);
  const derivedCheckInStatus =
    specimen.checkInStatus
    ?? (transportOrder || specimen.receiptStatus || specimen.specimenStatus === 'IN_TRANSIT'
      ? 'CHECKED_IN'
      : 'NOT_CHECKED_IN');
  const checkedInAt =
    specimen.checkedInAt
    ?? (derivedCheckInStatus === 'CHECKED_IN'
      ? transportOrder?.createdAt ?? specimenConfirmedAt ?? null
      : null);
  const checkedInByName =
    specimen.checkedInByName
    ?? (derivedCheckInStatus === 'CHECKED_IN'
      ? transportOrder?.handoverUserName ?? null
      : null);

  return {
    ...specimen,
    checkInStatus: derivedCheckInStatus,
    checkedInAt,
    checkedInByName,
    specimenConfirmedAt,
    verificationCompletedAt,
    verificationStartedAt,
    verificationStatus: derivedVerificationStatus,
  };
}

function normalizeText(value?: null | string) {
  return value?.trim() ?? '';
}

function includesText(
  value: null | string | undefined,
  keyword?: null | string,
) {
  const normalizedKeyword = normalizeText(keyword).toLowerCase();
  if (!normalizedKeyword) {
    return true;
  }
  return normalizeText(value).toLowerCase().includes(normalizedKeyword);
}

function compareNullableDateDesc(left?: null | string, right?: null | string) {
  return normalizeText(right).localeCompare(normalizeText(left));
}

function withinDateRange(
  value: null | string | undefined,
  dateFrom?: null | string,
  dateTo?: null | string,
) {
  const normalizedValue = normalizeText(value).slice(0, 10);
  if (!normalizedValue) {
    return false;
  }
  const normalizedFrom = normalizeText(dateFrom).slice(0, 10);
  const normalizedTo = normalizeText(dateTo).slice(0, 10);
  if (normalizedFrom && normalizedValue < normalizedFrom) {
    return false;
  }
  if (normalizedTo && normalizedValue > normalizedTo) {
    return false;
  }
  return true;
}

function paginateItems<T>(items: T[], page: number, size: number) {
  const safePage = Math.max(page, 1);
  const safeSize = Math.max(size, 1);
  const startIndex = (safePage - 1) * safeSize;
  return {
    items: items.slice(startIndex, startIndex + safeSize),
    page: safePage,
    size: safeSize,
    total: items.length,
  };
}

function createNumericId(prefix: string, values: string[]) {
  const maxValue = values.reduce((maxValue, currentValue) => {
    const match = currentValue.match(/(\d+)(?!.*\d)/);
    const numericValue = match ? Number.parseInt(match[1] ?? '0', 10) : 0;
    return Math.max(maxValue, numericValue);
  }, 0);
  return `${prefix}-${String(maxValue + 1).padStart(3, '0')}`;
}

function createTimestamp() {
  return new Date().toISOString().slice(0, 19);
}

function getApplicationById(applicationId: string) {
  const normalizedApplicationId = normalizeText(applicationId);
  const application = state.applications.find((item) => item.id === normalizedApplicationId);
  if (!application) {
    throw new Error(`未找到申请单: ${applicationId}`);
  }
  return application;
}

function getSpecimensByApplicationId(applicationId: string) {
  return state.specimens.filter((item) => item.applicationId === applicationId);
}

function resolveSpecimenByIdentifier(identifier: string) {
  const normalizedIdentifier = normalizeText(identifier);
  const specimen = state.specimens.find((item) =>
    item.barcode === normalizedIdentifier
    || item.id === normalizedIdentifier
    || item.specimenNo === normalizedIdentifier,
  );
  if (!specimen) {
    throw new Error(`未找到标本: ${identifier}`);
  }
  return specimen;
}

function findTransportOrderById(transportOrderId: string) {
  const normalizedTransportOrderId = normalizeText(transportOrderId);
  const order = state.transportOrders.find((item) => item.id === normalizedTransportOrderId);
  if (!order) {
    throw new Error(`未找到转运单: ${transportOrderId}`);
  }
  return order;
}

function getTransportOrderBySpecimenId(specimenId: string) {
  return (
    state.transportOrders.find((item) => item.specimenIds.includes(specimenId) && item.status !== 'CANCELLED')
    ?? null
  );
}

function hasStartedDownstreamWorkflow(applicationId: string) {
  const specimens = getSpecimensByApplicationId(applicationId);
  return specimens.some((item) =>
    item.fixationStatus !== 'PENDING'
    || item.specimenStatus !== 'REGISTERED'
    || Boolean(item.specimenConfirmedAt)
    || Boolean(item.checkInStatus && item.checkInStatus !== 'NOT_CHECKED_IN')
    || Boolean(getTransportOrderBySpecimenId(item.id)),
  );
}

function resolveApplicationOperationState(application: RawApplication) {
  if (application.status === 'VOIDED') {
    return {
      deletable: false,
      editable: false,
      operationDisabledReason: '申请单已作废，不能再编辑或作废',
      voided: true,
    };
  }
  if (hasStartedDownstreamWorkflow(application.id)) {
    return {
      deletable: false,
      editable: false,
      operationDisabledReason: '申请单已进入下游流程，不能再编辑或作废',
      voided: false,
    };
  }
  return {
    deletable: true,
    editable: true,
    operationDisabledReason: null,
    voided: false,
  };
}

function appendWorkflowEvent(payload: Omit<RawWorkflowEvent, 'id'>) {
  const event: RawWorkflowEvent = {
    ...payload,
    id: createNumericId(
      'EV',
      state.workflowEvents.map((item) => item.id),
    ),
  };
  state.workflowEvents.push(event);
  return event;
}

function appendVerificationRecord(payload: Omit<RawVerificationRecord, 'id'>) {
  const record: RawVerificationRecord = {
    ...payload,
    id: createNumericId(
      'VR',
      state.verificationRecords.map((item) => item.id),
    ),
  };
  state.verificationRecords.push(record);
  return record;
}

function resolveSpecimenAbnormalType(specimen: RawSpecimen): null | string {
  if (specimen.receiptStatus === 'REJECTED' || specimen.receiptStatus === 'RETURNED') {
    return specimen.receiptStatus;
  }
  if (specimen.qualityCheckResult === 'FAILED') {
    return 'QUALITY_CHECK_FAILED';
  }
  if ((specimen.qualityIssueCodes ?? []).includes('FIXATION_INVALID')) {
    return 'FIXATION_ABNORMAL';
  }
  if ((specimen.qualityIssueCodes ?? []).length > 0 || specimen.receiptReason) {
    return 'WORKFLOW_ABNORMAL';
  }
  return null;
}

function isSpecimenAbnormal(specimen: RawSpecimen) {
  return Boolean(resolveSpecimenAbnormalType(specimen));
}

function resolveSpecimenVerificationStatus(specimen: RawSpecimen) {
  return specimen.verificationStatus ?? 'UNVERIFIED';
}

function resolveSpecimenCheckInStatus(specimen: RawSpecimen) {
  return specimen.checkInStatus ?? 'NOT_CHECKED_IN';
}

function resolveSpecimenBarcodeBindingStatus(specimen: RawSpecimen) {
  return normalizeText(specimen.barcode) ? 'BOUND' : 'UNBOUND';
}

function isSpecimenInReceiptTerminalState(specimen: RawSpecimen) {
  return ['RECEIVED', 'REJECTED', 'RETURNED'].includes(
    specimen.receiptStatus ?? specimen.specimenStatus ?? '',
  );
}

function assertSpecimenNotInReceiptTerminalState(
  specimen: RawSpecimen,
  actionName: string,
) {
  if (isSpecimenInReceiptTerminalState(specimen)) {
    throw new Error(`标本 ${specimen.barcode || specimen.specimenNo} 已进入接收结果，不能继续${actionName}`);
  }
}

function isSpecimenVerified(specimen: RawSpecimen) {
  return resolveSpecimenVerificationStatus(specimen) === 'VERIFIED';
}

function isSpecimenCheckedIn(specimen: RawSpecimen) {
  return resolveSpecimenCheckInStatus(specimen) === 'CHECKED_IN';
}

function mapSpecimenTrackingSummary(specimen: RawSpecimen): SpecimenTrackingSummary {
  return {
    abnormalReason: specimen.receiptReason ?? specimen.receiptRemarks ?? null,
    abnormalType: resolveSpecimenAbnormalType(specimen),
    barcode: specimen.barcode,
    barcodeBindingStatus: resolveSpecimenBarcodeBindingStatus(specimen),
    checkInStatus: resolveSpecimenCheckInStatus(specimen),
    checkedInAt: specimen.checkedInAt ?? null,
    checkedInByName: specimen.checkedInByName ?? null,
    clinicalSymptom: specimen.clinicalSymptom,
    collectionMode: specimen.collectionMode,
    containerCount: specimen.containerCount,
    containerName: specimen.containerName,
    fixationCompletedAt: specimen.fixationCompletedAt,
    fixationStatus: specimen.fixationStatus,
    id: specimen.id,
    labelPrintStatus: specimen.labelPrintStatus,
    qualityCheckResult: specimen.qualityCheckResult,
    qualityIssueCodes: [...(specimen.qualityIssueCodes ?? [])],
    receiptStatus: specimen.receiptStatus,
    specimenConfirmedAt: specimen.specimenConfirmedAt,
    specimenCount: specimen.specimenCount,
    specimenName: specimen.specimenName,
    specimenNo: specimen.specimenNo,
    specimenSite: specimen.specimenSite,
    specimenStatus: specimen.specimenStatus,
    specimenType: specimen.specimenType,
    verificationCompletedAt: specimen.verificationCompletedAt ?? null,
    verificationStartedAt: specimen.verificationStartedAt ?? null,
    verificationStatus: resolveSpecimenVerificationStatus(specimen),
  };
}

function mapSpecimenManagementItem(specimen: RawSpecimen): SpecimenManagementListItem {
  const application = getApplicationById(specimen.applicationId);
  return {
    abnormalFlag: isSpecimenAbnormal(specimen),
    abnormalType: resolveSpecimenAbnormalType(specimen),
    applicationId: application.id,
    applicationNo: application.applicationNo,
    barcode: specimen.barcode,
    barcodeBindingStatus: resolveSpecimenBarcodeBindingStatus(specimen),
    checkInStatus: resolveSpecimenCheckInStatus(specimen),
    checkedInAt: specimen.checkedInAt ?? null,
    checkedInByName: specimen.checkedInByName ?? null,
    containerCount: specimen.containerCount,
    containerName: specimen.containerName,
    fixationCompletedAt: specimen.fixationCompletedAt,
    fixationStatus: specimen.fixationStatus,
    labelPrintBatchNo: specimen.labelPrintBatchNo,
    labelPrintStatus: specimen.labelPrintStatus,
    latestTrackingAt: specimen.latestTrackingAt,
    patientName: application.patientName,
    recentNode: resolveSpecimenRecentNode(specimen),
    registeredAt: specimen.registeredAt,
    specimenConfirmedAt: specimen.specimenConfirmedAt,
    specimenCount: specimen.specimenCount,
    specimenId: specimen.id,
    specimenName: specimen.specimenName,
    specimenNo: specimen.specimenNo,
    specimenSite: specimen.specimenSite,
    specimenStatus: specimen.specimenStatus,
    specimenType: specimen.specimenType,
    submittingDepartmentId: application.submittingDepartmentId,
    submittingDepartmentName: application.submittingDepartmentName,
    verificationCompletedAt: specimen.verificationCompletedAt ?? null,
    verificationStartedAt: specimen.verificationStartedAt ?? null,
    verificationStatus: resolveSpecimenVerificationStatus(specimen),
  };
}

function mapSpecimenRemovalItem(specimen: RawSpecimen): SpecimenRemovalItem {
  const application = getApplicationById(specimen.applicationId);
  const workbenchRecord = state.applications.find((item) => item.id === specimen.applicationId);
  return {
    abnormalFlag: isSpecimenAbnormal(specimen),
    applicationId: application.id,
    applicationNo: application.applicationNo,
    barcode: specimen.barcode,
    confirmedAt: specimen.specimenRemovalAt ?? null,
    containerCount: specimen.containerCount,
    containerName: specimen.containerName,
    inpatientNo: normalizeText(application.applicationNo) || null,
    latestTrackingAt: specimen.latestTrackingAt ?? null,
    patientGender: application.patientGender ?? null,
    patientName: application.patientName,
    registeredAt: specimen.registeredAt,
    registeredByName: '系统导入',
    specimenId: specimen.id,
    specimenName: specimen.specimenName,
    specimenNo: specimen.specimenNo,
    specimenRemovalAt: specimen.specimenRemovalAt ?? null,
    specimenRemovalOperatorName: specimen.specimenRemovalOperatorName ?? null,
    specimenStatus: specimen.specimenStatus,
    specimenType: specimen.specimenType,
    surgeryName: application.submittingDepartmentName ?? null,
  };
}

function mapPendingSpecimenItem(specimen: RawSpecimen): PendingSpecimenItem {
  const application = getApplicationById(specimen.applicationId);
  const order = getTransportOrderBySpecimenId(specimen.id);
  const batchMetrics = order ? buildTransportOrderBatchMetrics(order) : null;

  return {
    abnormalFlag: isSpecimenAbnormal(specimen),
    abnormalType: resolveSpecimenAbnormalType(specimen),
    applicationId: application.id,
    applicationNo: application.applicationNo,
    batchAbnormalFlag: batchMetrics?.batchAbnormalFlag ?? false,
    barcode: specimen.barcode,
    checkInStatus: resolveSpecimenCheckInStatus(specimen),
    checkedInAt: specimen.checkedInAt ?? null,
    checkedInByName: specimen.checkedInByName ?? null,
    containerCount: specimen.containerCount,
    containerName: specimen.containerName,
    fixationCompletedAt: specimen.fixationCompletedAt,
    fixationLiquidType: specimen.fixationLiquidType,
    fixationStartedAt: specimen.fixationStartedAt,
    fixationStatus: specimen.fixationStatus,
    latestTrackingAt: specimen.latestTrackingAt,
    patientName: application.patientName,
    registeredAt: specimen.registeredAt,
    reminderCount: batchMetrics?.reminderCount ?? 0,
    specimenId: specimen.id,
    specimenNo: specimen.specimenNo,
    specimenStatus: specimen.specimenStatus,
    submittingDepartmentId: application.submittingDepartmentId,
    submittingDepartmentName: application.submittingDepartmentName,
    transportOrderId: order?.id ?? null,
    unreceivedCount: batchMetrics?.unreceivedCount ?? 0,
    verificationCompletedAt: specimen.verificationCompletedAt ?? null,
    verificationStartedAt: specimen.verificationStartedAt ?? null,
    verificationStatus: resolveSpecimenVerificationStatus(specimen),
  };
}

function resolveSpecimenRecentNode(specimen: RawSpecimen) {
  if (specimen.receiptStatus === 'REJECTED' || specimen.receiptStatus === 'RETURNED') {
    return specimen.receiptStatus;
  }
  if (specimen.receiptStatus === 'RECEIVED') {
    return 'RECEIVED';
  }
  if (getTransportOrderBySpecimenId(specimen.id)) {
    return 'TRANSPORT';
  }
  if (isSpecimenCheckedIn(specimen)) {
    return 'CHECK_IN';
  }
  if (specimen.specimenConfirmedAt) {
    return 'CONFIRMATION';
  }
  if (specimen.fixationStatus === 'COMPLETED') {
    return 'FIXATION';
  }
  if (specimen.fixationStatus === 'FIXING') {
    return 'FIXATION';
  }
  if (resolveSpecimenVerificationStatus(specimen) === 'VERIFIED') {
    return 'VERIFICATION';
  }
  if (resolveSpecimenVerificationStatus(specimen) === 'VERIFYING') {
    return 'VERIFICATION';
  }
  return 'SPECIMEN_COLLECTION';
}

function buildReceiptAbnormalSummary(specimens: RawSpecimen[]) {
  const rejectedCount = specimens.filter((item) => item.receiptStatus === 'REJECTED').length;
  const returnedCount = specimens.filter((item) => item.receiptStatus === 'RETURNED').length;
  const qualityFailedCount = specimens.filter((item) => item.qualityCheckResult === 'FAILED').length;
  const unreceivedCount = specimens.filter((item) => item.receiptStatus !== 'RECEIVED').length;
  if (rejectedCount === 0 && returnedCount === 0 && qualityFailedCount === 0 && unreceivedCount === 0) {
    return null;
  }
  return `拒收 ${rejectedCount}，退回 ${returnedCount}，质控失败 ${qualityFailedCount}，未接收 ${unreceivedCount}`;
}

function buildTransportOrderBatchMetrics(order: RawTransportOrder) {
  const specimens = order.specimenIds
    .map((specimenId) => state.specimens.find((item) => item.id === specimenId))
    .filter((item): item is RawSpecimen => Boolean(item));
  const reminderCount = specimens.filter((item) => isSpecimenAbnormal(item)).length;
  const unreceivedCount = specimens.filter((item) => item.receiptStatus !== 'RECEIVED').length;
  const batchAbnormalFlag = specimens.some((item) => isSpecimenAbnormal(item)) || order.status === 'PARTIALLY_RECEIVED';

  return {
    batchAbnormalFlag,
    reminderCount,
    unreceivedCount,
  };
}

function mapTransportOrderView(order: RawTransportOrder): TransportOrderView {
  return {
    applicationId: order.applicationId,
    handedOverAt: order.handedOverAt,
    handoverUserName: order.handoverUserName,
    id: order.id,
    receiverUserName: order.receiverUserName,
    status: order.status,
    toBeTransportedAt: order.toBeTransportedAt,
    transportOrderNo: order.transportOrderNo,
  };
}

function mapPendingTransportOrderItem(order: RawTransportOrder): PendingTransportOrderItem {
  const application = getApplicationById(order.applicationId);
  const batchMetrics = buildTransportOrderBatchMetrics(order);
  const specimenBarcodes = order.specimenIds
    .map((specimenId) => state.specimens.find((item) => item.id === specimenId)?.barcode ?? '')
    .filter(Boolean);

  return {
    applicationId: application.id,
    applicationNo: application.applicationNo,
    batchAbnormalFlag: batchMetrics.batchAbnormalFlag,
    handedOverAt: order.handedOverAt,
    handoverDepartmentName: order.handoverDepartmentName,
    id: order.id,
    patientName: application.patientName,
    receiverDepartmentName: order.receiverDepartmentName,
    reminderCount: batchMetrics.reminderCount,
    specimenBarcodes,
    status: order.status,
    toBeTransportedAt: order.toBeTransportedAt,
    transportOrderNo: order.transportOrderNo,
    unreceivedCount: batchMetrics.unreceivedCount,
  };
}

function resolveApplicationCurrentNode(specimens: RawSpecimen[]) {
  const application = specimens[0]?.applicationId
    ? state.applications.find((item) => item.id === specimens[0]?.applicationId)
    : null;
  if (application?.status === 'VOIDED') {
    return 'VOIDED';
  }
  if (specimens.some((item) => item.receiptStatus === 'REJECTED')) {
    return 'REJECTED';
  }
  if (specimens.some((item) => item.receiptStatus === 'RETURNED')) {
    return 'PARTIALLY_RECEIVED';
  }
  if (specimens.length === 0) {
    return 'SUBMITTED';
  }
  if (specimens.every((item) => item.receiptStatus === 'RECEIVED')) {
    return 'RECEIVED';
  }
  if (specimens.some((item) => getTransportOrderBySpecimenId(item.id))) {
    return 'TRANSPORT';
  }
  if (specimens.some((item) => isSpecimenCheckedIn(item))) {
    return 'CHECK_IN';
  }
  if (specimens.some((item) => item.specimenConfirmedAt)) {
    return 'CONFIRMATION';
  }
  if (specimens.some((item) => item.fixationStatus === 'COMPLETED' || item.fixationStatus === 'FIXING')) {
    return 'FIXATION';
  }
  if (specimens.some((item) => resolveSpecimenVerificationStatus(item) === 'VERIFIED')) {
    return 'VERIFICATION';
  }
  if (specimens.some((item) => resolveSpecimenVerificationStatus(item) === 'VERIFYING')) {
    return 'VERIFICATION';
  }
  return 'REGISTERED';
}

function resolveApplicationStatus(application: RawApplication, specimens: RawSpecimen[]) {
  if (application.status === 'VOIDED') {
    return 'VOIDED';
  }
  if (specimens.length === 0) {
    return application.status;
  }
  if (specimens.every((item) => item.receiptStatus === 'RECEIVED')) {
    return 'RECEIVED';
  }
  if (specimens.some((item) => item.receiptStatus === 'REJECTED')) {
    return 'REJECTED';
  }
  if (specimens.some((item) => item.receiptStatus === 'RETURNED')) {
    return 'PARTIALLY_RECEIVED';
  }
  if (specimens.some((item) => getTransportOrderBySpecimenId(item.id))) {
    return 'IN_TRANSIT';
  }
  if (specimens.some((item) => item.fixationStatus === 'COMPLETED' || item.fixationStatus === 'FIXING')) {
    return 'SUBMITTED';
  }
  return 'SUBMITTED';
}

function updateApplicationFromSpecimens(applicationId: string) {
  const application = getApplicationById(applicationId);
  const specimens = getSpecimensByApplicationId(applicationId);
  application.currentNode = resolveApplicationCurrentNode(specimens);
  application.status = resolveApplicationStatus(application, specimens);
  application.updatedAt = createTimestamp();
}

function mapApplicationListItem(application: RawApplication): ApplicationListItem {
  const specimens = getSpecimensByApplicationId(application.id);
  const latestRegisteredSpecimen = [...specimens]
    .sort((left, right) => compareNullableDateDesc(left.registeredAt, right.registeredAt))[0];
  const operationState = resolveApplicationOperationState(application);

  return {
    abnormalFlag: specimens.some((item) => isSpecimenAbnormal(item)),
    applicationDate: application.applicationDate,
    applicationFormStatus: application.applicationFormStatus,
    applicationNo: application.applicationNo,
    applicationType: application.applicationType,
    createdAt: application.createdAt,
    currentNode: application.status === 'VOIDED' ? 'VOIDED' : resolveApplicationCurrentNode(specimens),
    deletable: operationState.deletable,
    editable: operationState.editable,
    id: application.id,
    latestLabelPrintStatus: latestRegisteredSpecimen?.labelPrintStatus ?? null,
    operationDisabledReason: operationState.operationDisabledReason,
    patientAge: application.patientAge,
    patientGender: application.patientGender,
    patientCheckStatus: application.patientCheckStatus ?? 'UNKNOWN',
    patientName: application.patientName,
    receiptAbnormalSummary: buildReceiptAbnormalSummary(specimens),
    registeredSpecimenCount: specimens.length,
    reportIssued: application.reportIssued ?? false,
    reportStatus: application.reportStatus ?? null,
    status: resolveApplicationStatus(application, specimens),
    submissionDate: application.submissionDate,
    submittingDepartmentName: application.submittingDepartmentName,
    submittingDoctorName: application.submittingDoctorName,
    updatedAt: application.updatedAt,
    voided: operationState.voided,
  };
}

function getApplicationEvents(applicationId: string) {
  return state.workflowEvents
    .filter((item) => item.applicationId === applicationId)
    .sort((left, right) => compareNullableDateDesc(left.eventTime, right.eventTime));
}

function mapApplicationTrackingView(application: RawApplication): TrackingQueryView {
  const specimens = getSpecimensByApplicationId(application.id)
    .sort((left, right) => compareNullableDateDesc(left.registeredAt, right.registeredAt));
  const fixationCompletedAt = [...specimens]
    .map((item) => item.fixationCompletedAt)
    .filter(Boolean)
    .sort(compareNullableDateDesc)[0] ?? null;
  const specimenConfirmedAt = [...specimens]
    .map((item) => item.specimenConfirmedAt)
    .filter(Boolean)
    .sort(compareNullableDateDesc)[0] ?? null;
  const recentEvents = getApplicationEvents(application.id);
  const operationState = resolveApplicationOperationState(application);

  return {
    ...application,
    abnormalFlag: specimens.some((item) => isSpecimenAbnormal(item)),
    currentNode: application.status === 'VOIDED' ? 'VOIDED' : resolveApplicationCurrentNode(specimens),
    deletable: operationState.deletable,
    editable: operationState.editable,
    fixationCompletedAt,
    patientCheckStatus: application.patientCheckStatus ?? 'UNKNOWN',
    operationDisabledReason: operationState.operationDisabledReason,
    receiptAbnormalSummary: buildReceiptAbnormalSummary(specimens),
    recentEvents,
    reportIssued: application.reportIssued ?? false,
    reportStatus: application.reportStatus ?? null,
    specimenConfirmedAt,
    specimens: specimens.map(mapSpecimenTrackingSummary),
    status: resolveApplicationStatus(application, specimens),
    unreceivedCount: specimens.filter((item) => item.receiptStatus !== 'RECEIVED').length,
    updatedAt: application.updatedAt,
    voided: operationState.voided,
  };
}

function getLatestRegistrationBatch(applicationId: string) {
  return [...state.registrationBatches]
    .filter((item) => item.applicationId === applicationId)
    .sort((left, right) => compareNullableDateDesc(left.createdAt, right.createdAt))[0] ?? null;
}

function getLatestRegistrationResultInternal(applicationId: string): LatestSpecimenRegistrationResult {
  const batch = getLatestRegistrationBatch(applicationId);
  if (!batch) {
    return {
      applicationId,
      labelPrintBatchNo: null,
      labelPrintMessage: null,
      labelPrintSuccess: false,
      registrationSnapshot: null,
      specimens: [],
    };
  }
  const specimens = batch.specimenIds
    .map((specimenId) => state.specimens.find((item) => item.id === specimenId))
    .filter((item): item is RawSpecimen => Boolean(item))
    .map(mapSpecimenTrackingSummary);
  return {
    applicationId,
    labelPrintBatchNo: batch.labelPrintBatchNo,
    labelPrintMessage: batch.labelPrintMessage,
    labelPrintSuccess: batch.labelPrintSuccess,
    registrationSnapshot: batch.registrationSnapshot,
    specimens,
  };
}

function refreshTransportOrderStatus(order: RawTransportOrder) {
  const specimens = order.specimenIds
    .map((specimenId) => state.specimens.find((item) => item.id === specimenId))
    .filter((item): item is RawSpecimen => Boolean(item));
  const allReceived = specimens.length > 0 && specimens.every((item) => item.receiptStatus === 'RECEIVED');
  const hasProcessed = specimens.some((item) => normalizeText(item.receiptStatus));
  const hasPending = specimens.some((item) => !normalizeText(item.receiptStatus));

  if (allReceived) {
    order.status = 'COMPLETED';
    return;
  }
  if (hasProcessed || hasPending) {
    order.status = 'PARTIALLY_RECEIVED';
  }
}

function createReceiptResult(applicationId: string): SpecimenReceiptResult {
  const application = getApplicationById(applicationId);
  const specimens = getSpecimensByApplicationId(applicationId);
  const relatedOrders = state.transportOrders.filter((item) => item.applicationId === applicationId);
  const batchMetrics = relatedOrders.reduce(
    (result, order) => {
      const currentMetrics = buildTransportOrderBatchMetrics(order);
      return {
        batchAbnormalFlag: result.batchAbnormalFlag || currentMetrics.batchAbnormalFlag,
        reminderCount: result.reminderCount + currentMetrics.reminderCount,
      };
    },
    {
      batchAbnormalFlag: false,
      reminderCount: 0,
    },
  );
  updateApplicationFromSpecimens(applicationId);

  return {
    batchAbnormalFlag: batchMetrics.batchAbnormalFlag,
    caseId: `CASE-${application.applicationNo.slice(-4)}`,
    pathologyNo: `PA-${application.applicationNo.slice(-4)}`,
    receiptAbnormalSummary: buildReceiptAbnormalSummary(specimens),
    receiptStatus: resolveApplicationStatus(application, specimens) ?? 'SUBMITTED',
    reminderCount: batchMetrics.reminderCount,
    unreceivedCount: specimens.filter((item) => item.receiptStatus !== 'RECEIVED').length,
  };
}

function resolveApplicationForLookup(applicationNo: string) {
  const normalizedApplicationNo = normalizeText(applicationNo);
  const application = state.applications.find(
    (item) => item.applicationNo === normalizedApplicationNo,
  );
  if (!application) {
    throw new Error(`未找到申请单号: ${applicationNo}`);
  }
  return application;
}

export function resetMockState() {
  state = createInitialState();
}

export async function createApplicationMock(
  data: ApplicationCreateRequest,
): Promise<ApplicationCreateResult> {
  const now = createTimestamp();
  const applicationId = createNumericId(
    'APP',
    state.applications.map((item) => item.id),
  );
  const applicationNo = normalizeText(data.applicationNo)
    || `M2-${now.slice(0, 10).replaceAll('-', '')}-${String(state.applications.length + 1).padStart(3, '0')}`;
  state.applications.unshift({
    abnormalFlag: false,
    applicationDate: data.applicationDate ?? now.slice(0, 10),
    applicationFormStatus: data.applicationFormStatus ?? 'NOT_UPLOADED',
    applicationNo,
    applicationType: data.applicationType,
    clinicalDiagnosis: data.clinicalDiagnosis,
    clinicalSymptom: data.clinicalSymptom ?? null,
    createdAt: now,
    currentNode: 'SUBMITTED',
    deletable: true,
    editable: true,
    externalOrderNo: data.externalOrderNo ?? null,
    fixationCompletedAt: null,
    id: applicationId,
    operationDisabledReason: null,
    patientAge: data.patientAge ?? null,
    patientGender: data.patientGender ?? null,
    patientId: data.patientId ?? null,
    patientCheckStatus: 'UNKNOWN',
    patientName: data.patientName ?? null,
    remarks: data.remarks ?? null,
    reportIssued: false,
    reportStatus: null,
    sourceHospitalId: data.sourceHospitalId ?? null,
    sourceHospitalName: data.sourceHospitalName ?? null,
    specimenConfirmedAt: null,
    specimenRemovalTime: data.specimenRemovalTime ?? null,
    specimenSite: data.specimenSite,
    status: data.status ?? 'SUBMITTED',
    submissionDate: data.submissionDate ?? now.slice(0, 10),
    submittingDepartmentId: data.submittingDepartmentId,
    submittingDepartmentName: data.submittingDepartmentName,
    submittingDoctorName: data.submittingDoctorName,
    submittingDoctorUserId: data.submittingDoctorUserId,
    thirdPartySource: data.thirdPartySource ?? null,
    unreceivedCount: 0,
    updatedAt: now,
    voided: false,
  });

  return { id: applicationId };
}

export async function updateApplicationMock(
  applicationId: string,
  data: ApplicationUpdateRequest,
): Promise<ApplicationCreateResult> {
  const application = getApplicationById(applicationId);
  const operationState = resolveApplicationOperationState(application);
  if (!operationState.editable) {
    throw new Error(operationState.operationDisabledReason ?? '申请单当前状态不可编辑');
  }
  const applicationNo = normalizeText(data.applicationNo) || application.applicationNo;
  const conflict = state.applications.find((item) =>
    item.id !== application.id
    && item.status !== 'VOIDED'
    && item.applicationNo === applicationNo,
  );
  if (conflict) {
    throw new Error('申请单号已存在');
  }
  Object.assign(application, {
    applicationDate: data.applicationDate ?? application.applicationDate,
    applicationFormStatus: data.applicationFormStatus ?? application.applicationFormStatus,
    applicationNo,
    applicationType: data.applicationType,
    clinicalDiagnosis: data.clinicalDiagnosis,
    clinicalSymptom: data.clinicalSymptom ?? null,
    externalOrderNo: data.externalOrderNo ?? null,
    patientAge: data.patientAge ?? null,
    patientGender: data.patientGender ?? null,
    patientId: data.patientId ?? null,
    patientName: data.patientName ?? null,
    remarks: data.remarks ?? null,
    sourceHospitalId: data.sourceHospitalId ?? null,
    sourceHospitalName: data.sourceHospitalName ?? null,
    specimenRemovalTime: data.specimenRemovalTime ?? null,
    specimenSite: data.specimenSite,
    submissionDate: data.submissionDate ?? application.submissionDate,
    submittingDepartmentId: data.submittingDepartmentId,
    submittingDepartmentName: data.submittingDepartmentName,
    submittingDoctorName: data.submittingDoctorName,
    submittingDoctorUserId: data.submittingDoctorUserId,
    thirdPartySource: data.thirdPartySource ?? null,
    updatedAt: createTimestamp(),
  });
  return { id: application.id };
}

export async function deleteApplicationMock(
  applicationId: string,
): Promise<ApplicationCreateResult> {
  const application = getApplicationById(applicationId);
  const operationState = resolveApplicationOperationState(application);
  if (!operationState.deletable) {
    throw new Error(operationState.operationDisabledReason ?? '申请单当前状态不可作废');
  }
  application.status = 'VOIDED';
  application.currentNode = 'VOIDED';
  application.updatedAt = createTimestamp();
  state.specimens = state.specimens.filter((item) => item.applicationId !== application.id);
  state.registrationBatches = state.registrationBatches.filter((item) => item.applicationId !== application.id);
  state.workflowEvents = state.workflowEvents.filter((item) => item.applicationId !== application.id);
  return { id: application.id };
}

export async function listApplicationsMock(
  params: ApplicationListQuery,
): Promise<ApplicationPage> {
  const formStatus = normalizeText(params.applicationFormStatus);
  const filtered = state.applications
    .filter((item) =>
      (formStatus === 'VOIDED'
        ? item.status === 'VOIDED'
        : item.status !== 'VOIDED' && (!formStatus || item.applicationFormStatus === formStatus))
      && (!normalizeText(params.applicationType) || item.applicationType === params.applicationType)
      && includesText(item.applicationNo, params.applicationNo)
      && includesText(item.patientName, params.patientName)
      && (!normalizeText(params.submittingDepartmentId) || item.submittingDepartmentId === params.submittingDepartmentId)
      && withinDateRange(item.applicationDate, params.dateFrom, params.dateTo)
    )
    .sort((left, right) => compareNullableDateDesc(left.updatedAt, right.updatedAt))
    .map(mapApplicationListItem);

  return paginateItems(filtered, params.page, params.size);
}

export async function duplicateCheckApplicationsMock(
  params: DuplicateApplicationCheckQuery,
): Promise<DuplicateApplicationCheckResult> {
  const items = state.applications
    .filter((application) => application.status !== 'VOIDED')
    .map((application) => {
      const matchedBy = [
        params.externalOrderNo && normalizeText(application.externalOrderNo) === normalizeText(params.externalOrderNo)
          ? 'externalOrderNo'
          : '',
        params.patientId && normalizeText(application.patientId) === normalizeText(params.patientId)
          ? 'patientId'
          : '',
        params.patientName && normalizeText(application.patientName) === normalizeText(params.patientName)
          ? 'patientName'
          : '',
        params.specimenSite && normalizeText(application.specimenSite) === normalizeText(params.specimenSite)
          ? 'specimenSite'
          : '',
        params.applicationDate && normalizeText(application.applicationDate) === normalizeText(params.applicationDate)
          ? 'applicationDate'
          : '',
        params.applicationType && normalizeText(application.applicationType) === normalizeText(params.applicationType)
          ? 'applicationType'
          : '',
      ].filter(Boolean);

      if (matchedBy.length === 0) {
        return null;
      }

      return {
        applicationDate: application.applicationDate,
        applicationNo: application.applicationNo,
        currentNode: application.currentNode,
        id: application.id,
        matchedBy,
        patientName: application.patientName,
        specimenSite: application.specimenSite,
        status: application.status,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return {
    items,
    suggestedAction: items.length === 0 ? 'ALLOW' : items.length === 1 ? 'CONFIRM' : 'BLOCK',
  };
}

export async function importClinicalApplicationMock(
  data: ImportClinicalApplicationRequest,
): Promise<ApplicationCreateResult> {
  return createApplicationMock({
    applicationType: 'ROUTINE',
    clinicalDiagnosis: 'HIS 导入申请',
    externalOrderNo: data.externalOrderNo,
    patientName: '导入患者',
    sourceHospitalName: data.thirdPartySource,
    specimenSite: '待补充',
    submittingDepartmentId: 'DEP-IMPORT',
    submittingDepartmentName: '导入科室',
    submittingDoctorName: '导入医生',
    submittingDoctorUserId: 'DOC-IMPORT',
    thirdPartySource: data.thirdPartySource,
  });
}

export async function getApplicationDetailMock(
  applicationId: string,
): Promise<ApplicationDetailView> {
  return mapApplicationTrackingView(getApplicationById(applicationId));
}

export async function getApplicationTrackingMock(
  applicationId: string,
): Promise<TrackingQueryView> {
  return mapApplicationTrackingView(getApplicationById(applicationId));
}

export async function getApplicationTrackingByApplicationNoMock(
  applicationNo: string,
): Promise<TrackingQueryView> {
  const application = resolveApplicationForLookup(applicationNo);
  return getApplicationTrackingMock(application.id);
}

export async function getSpecimenTrackingByBarcodeMock(
  barcode: string,
): Promise<TrackingQueryView> {
  const specimen = resolveSpecimenByIdentifier(barcode);
  return getApplicationTrackingMock(specimen.applicationId);
}

export async function registerSpecimensMock(
  data: SpecimenRegisterRequest,
): Promise<SpecimenRegisterResult> {
  const application = getApplicationById(data.applicationId);
  const createdAt = createTimestamp();
  const labelPrintBatchNo = `LB-${String(state.registrationBatches.length + 1).padStart(3, '0')}`;
  const createdSpecimens = data.items.map((item, index) => {
    const specimenId = createNumericId(
      'SPEC',
      state.specimens.map((specimen) => specimen.id),
    );
    const barcode = normalizeText(item.barcode) || `BC-${application.id.slice(-3)}-${String(index + 1).padStart(2, '0')}-${state.specimens.length + index + 1}`;
    const specimen: RawSpecimen = {
      applicationId: application.id,
      barcode,
      checkInStatus: 'NOT_CHECKED_IN',
      checkedInAt: null,
      checkedInByName: null,
      clinicalSymptom: item.clinicalSymptom ?? application.clinicalSymptom ?? null,
      collectionMode: item.collectionMode ?? data.collectionScene ?? null,
      containerCount: item.containerCount,
      containerName: item.containerName,
      fixationCompletedAt: null,
      fixationLiquidType: null,
      fixationStartedAt: null,
      fixationStatus: 'PENDING',
      id: specimenId,
      labelPrintBatchNo,
      labelPrintStatus: 'SUCCESS',
      latestTrackingAt: createdAt,
      previousBarcodes: [],
      qualityCheckResult: null,
      qualityIssueCodes: [],
      receiptReason: null,
      receiptRemarks: null,
      receiptStatus: null,
      registeredAt: createdAt,
      specimenConfirmedAt: null,
      specimenCount: item.specimenCount,
      specimenName: item.specimenNameStandardized,
      specimenNo: `SP-${application.id.slice(-3)}-${String(getSpecimensByApplicationId(application.id).length + index + 1).padStart(2, '0')}`,
      specimenSite: item.specimenSite ?? application.specimenSite ?? null,
      specimenStatus: 'REGISTERED',
      specimenType: item.specimenType ?? null,
      verificationCompletedAt: null,
      verificationStartedAt: null,
      verificationStatus: 'UNVERIFIED',
    };
    state.specimens.push(specimen);
    appendWorkflowEvent({
      applicationId: application.id,
      eventContent: '标本登记完成',
      eventStatus: 'SUCCESS',
      eventTime: createdAt,
      eventType: 'REGISTERED',
      nodeCode: 'SPECIMEN_COLLECTION',
      operatorName: data.operatorName,
      sourceTerminal: data.terminalCode ?? null,
      specimenBarcode: specimen.barcode,
      specimenId: specimen.id,
      specimenNo: specimen.specimenNo,
    });
    return specimen;
  });

  state.registrationBatches.push({
    applicationId: application.id,
    createdAt,
    labelPrintBatchNo,
    labelPrintMessage: '标签打印成功',
    labelPrintSuccess: true,
    registrationSnapshot: {
      collectionScene: data.collectionScene ?? null,
      operatorName: data.operatorName,
      operatorUserId: data.operatorUserId ?? null,
      printerCode: data.printerCode ?? null,
      remarks: data.remarks ?? null,
      terminalCode: data.terminalCode ?? null,
    },
    specimenIds: createdSpecimens.map((item) => item.id),
  });

  updateApplicationFromSpecimens(application.id);

  return {
    labelPrintBatchNo,
    labelPrintMessage: '标签打印成功',
    labelPrintSuccess: true,
    specimens: createdSpecimens.map(mapSpecimenTrackingSummary),
  };
}

export async function retryLabelPrintMock(
  batchNo: string,
  data: LabelPrintRetryRequest,
): Promise<LabelPrintRetryResult> {
  const batch = state.registrationBatches.find(
    (item) => item.labelPrintBatchNo === normalizeText(batchNo),
  );
  if (!batch) {
    throw new Error(`未找到标签批次: ${batchNo}`);
  }

  let successCount = 0;
  let failedCount = 0;
  const eventTime = createTimestamp();

  batch.specimenIds.forEach((specimenId) => {
    const specimen = state.specimens.find((item) => item.id === specimenId);
    if (!specimen) {
      return;
    }
    specimen.labelPrintStatus = 'SUCCESS';
    specimen.labelPrintBatchNo = batch.labelPrintBatchNo;
    specimen.latestTrackingAt = eventTime;
    successCount += 1;
    appendWorkflowEvent({
      applicationId: specimen.applicationId,
      eventContent: '标签补打完成',
      eventStatus: 'SUCCESS',
      eventTime,
      eventType: 'RETRY',
      nodeCode: 'LABEL_PRINT',
      operatorName: data.operatorName,
      sourceTerminal: data.terminalCode ?? null,
      specimenBarcode: specimen.barcode,
      specimenId: specimen.id,
      specimenNo: specimen.specimenNo,
    });
  });

  batch.labelPrintSuccess = failedCount === 0;
  batch.labelPrintMessage = failedCount === 0 ? '标签补打成功' : '存在补打失败';

  return {
    allSuccessful: failedCount === 0,
    failedCount,
    labelPrintBatchNo: batch.labelPrintBatchNo ?? batchNo,
    message: batch.labelPrintMessage,
    retriedCount: successCount + failedCount,
    successCount,
  };
}

export async function getLatestRegistrationResultMock(
  applicationId: string,
): Promise<LatestSpecimenRegistrationResult> {
  return getLatestRegistrationResultInternal(applicationId);
}

export async function lookupApplicationForRegistrationMock(
  applicationNo: string,
): Promise<ApplicationListItem> {
  return mapApplicationListItem(resolveApplicationForLookup(applicationNo));
}

export async function listSpecimensMock(
  params: SpecimenManagementListQuery,
): Promise<SpecimenManagementListPage> {
  const filteredItems = state.specimens
    .filter((item) => {
      const application = getApplicationById(item.applicationId);
      const keyword = normalizeText(params.keyword);
      const matchesKeyword = !keyword
        || includesText(application.applicationNo, keyword)
        || includesText(application.patientName, keyword)
        || includesText(item.specimenNo, keyword)
        || includesText(item.barcode, keyword)
        || includesText(item.specimenName, keyword);

      return matchesKeyword
        && (!normalizeText(params.applicationNo) || application.applicationNo === params.applicationNo)
        && (!normalizeText(params.departmentId) || application.submittingDepartmentId === params.departmentId)
        && (!normalizeText(params.labelPrintStatus) || item.labelPrintStatus === params.labelPrintStatus)
        && (!normalizeText(params.specimenStatus) || item.specimenStatus === params.specimenStatus)
        && (params.abnormalFlag === undefined || isSpecimenAbnormal(item) === params.abnormalFlag)
        && withinDateRange(item.registeredAt, params.dateFrom, params.dateTo);
    })
    .sort((left, right) => compareNullableDateDesc(left.latestTrackingAt, right.latestTrackingAt))
    .map(mapSpecimenManagementItem);

  const summary: SpecimenManagementListSummary = {
    abnormalCount: filteredItems.filter((item) => item.abnormalFlag).length,
    labelPrintedCount: filteredItems.filter((item) => item.labelPrintStatus === 'SUCCESS').length,
    pendingLabelCount: filteredItems.filter((item) => item.labelPrintStatus === 'PENDING' || item.labelPrintStatus === 'FAILED').length,
    totalCount: filteredItems.length,
  };

  return {
    ...paginateItems(filteredItems, params.page, params.size),
    summary,
  };
}

export async function listPendingFixationsMock(
  params: PendingSpecimenQuery,
): Promise<PendingSpecimenPage> {
  const filteredItems = state.specimens
    .filter((item) => {
      const application = getApplicationById(item.applicationId);
      const hasTransportOrder = Boolean(getTransportOrderBySpecimenId(item.id));
      return !hasTransportOrder
        && !isSpecimenInReceiptTerminalState(item)
        && (!normalizeText(params.applicationId)
          || application.id === params.applicationId
          || application.applicationNo === params.applicationId)
        && (!normalizeText(params.specimenNo) || item.specimenNo === params.specimenNo)
        && (!normalizeText(params.departmentId) || application.submittingDepartmentId === params.departmentId)
        && (!normalizeText(params.fixationStatus) || item.fixationStatus === params.fixationStatus)
        && (!normalizeText(params.verificationStatus)
          || resolveSpecimenVerificationStatus(item) === params.verificationStatus)
        && (!normalizeText(params.checkInStatus)
          || resolveSpecimenCheckInStatus(item) === params.checkInStatus)
        && withinDateRange(item.registeredAt, params.dateFrom, params.dateTo);
    })
    .sort((left, right) => compareNullableDateDesc(left.registeredAt, right.registeredAt))
    .map(mapPendingSpecimenItem);

  return paginateItems(filteredItems, params.page, params.size);
}

export async function startSpecimenVerificationMock(
  data: SpecimenVerificationRequest,
): Promise<SpecimenTrackingSummary> {
  const specimen = resolveSpecimenByIdentifier(data.specimenBarcode);
  assertSpecimenNotInReceiptTerminalState(specimen, '开始核对');
  if (resolveSpecimenVerificationStatus(specimen) !== 'UNVERIFIED') {
    throw new Error(`标本 ${specimen.barcode} 当前状态不允许开始核对`);
  }

  const eventTime = createTimestamp();
  specimen.verificationStatus = 'VERIFYING';
  specimen.verificationStartedAt = eventTime;
  specimen.latestTrackingAt = eventTime;
  specimen.specimenStatus = 'VERIFYING';
  appendWorkflowEvent({
    applicationId: specimen.applicationId,
    eventContent: '开始核对',
    eventStatus: 'SUCCESS',
    eventTime,
    eventType: 'VERIFYING',
    nodeCode: 'VERIFICATION',
    operatorName: data.operatorName,
    sourceTerminal: data.terminalCode ?? null,
    specimenBarcode: specimen.barcode,
    specimenId: specimen.id,
    specimenNo: specimen.specimenNo,
  });
  appendVerificationRecord({
    applicationId: specimen.applicationId,
    barcode: specimen.barcode,
    operatorName: data.operatorName,
    operatorUserId: data.operatorUserId ?? null,
    remarks: data.remarks ?? '开始核对',
    result: 'SUCCESS',
    specimenId: specimen.id,
    terminalCode: data.terminalCode ?? null,
    verificationType: 'SPECIMEN_VERIFY_START',
    verifiedAt: eventTime,
  });
  updateApplicationFromSpecimens(specimen.applicationId);
  return mapSpecimenTrackingSummary(specimen);
}

export async function completeSpecimenVerificationMock(
  data: SpecimenVerificationRequest,
): Promise<SpecimenTrackingSummary> {
  const specimen = resolveSpecimenByIdentifier(data.specimenBarcode);
  assertSpecimenNotInReceiptTerminalState(specimen, '完成核对');
  if (resolveSpecimenVerificationStatus(specimen) !== 'VERIFYING') {
    throw new Error(`标本 ${specimen.barcode} 当前状态不允许完成核对`);
  }

  const eventTime = createTimestamp();
  specimen.verificationStatus = 'VERIFIED';
  specimen.verificationStartedAt = specimen.verificationStartedAt ?? eventTime;
  specimen.verificationCompletedAt = eventTime;
  specimen.latestTrackingAt = eventTime;
  specimen.specimenStatus = 'VERIFIED';
  appendWorkflowEvent({
    applicationId: specimen.applicationId,
    eventContent: '完成核对',
    eventStatus: 'SUCCESS',
    eventTime,
    eventType: 'VERIFIED',
    nodeCode: 'VERIFICATION',
    operatorName: data.operatorName,
    sourceTerminal: data.terminalCode ?? null,
    specimenBarcode: specimen.barcode,
    specimenId: specimen.id,
    specimenNo: specimen.specimenNo,
  });
  appendVerificationRecord({
    applicationId: specimen.applicationId,
    barcode: specimen.barcode,
    operatorName: data.operatorName,
    operatorUserId: data.operatorUserId ?? null,
    remarks: data.remarks ?? '完成核对',
    result: 'SUCCESS',
    specimenId: specimen.id,
    terminalCode: data.terminalCode ?? null,
    verificationType: 'SPECIMEN_VERIFY_COMPLETE',
    verifiedAt: eventTime,
  });
  updateApplicationFromSpecimens(specimen.applicationId);
  return mapSpecimenTrackingSummary(specimen);
}

export async function startFixationMock(
  data: SpecimenFixationRequest,
): Promise<FixationResult> {
  const specimen = resolveSpecimenByIdentifier(data.specimenBarcode);
  assertSpecimenNotInReceiptTerminalState(specimen, '开始固定');
  if (!isSpecimenVerified(specimen)) {
    throw new Error(`标本 ${specimen.barcode} 尚未完成核对`);
  }
  if (specimen.fixationStatus !== 'PENDING') {
    throw new Error(`标本 ${specimen.barcode} 当前状态不允许开始固定`);
  }
  const eventTime = createTimestamp();
  specimen.fixationStatus = 'FIXING';
  specimen.fixationStartedAt = eventTime;
  specimen.fixationLiquidType = data.fixationLiquidType ?? specimen.fixationLiquidType;
  specimen.specimenStatus = 'FIXING';
  specimen.latestTrackingAt = eventTime;
  appendWorkflowEvent({
    applicationId: specimen.applicationId,
    eventContent: '开始固定',
    eventStatus: 'SUCCESS',
    eventTime,
    eventType: 'STARTED',
    nodeCode: 'FIXATION',
    operatorName: data.operatorName,
    sourceTerminal: data.terminalCode ?? null,
    specimenBarcode: specimen.barcode,
    specimenId: specimen.id,
    specimenNo: specimen.specimenNo,
  });
  appendVerificationRecord({
    applicationId: specimen.applicationId,
    barcode: specimen.barcode,
    operatorName: data.operatorName,
    operatorUserId: data.operatorUserId ?? null,
    remarks: data.remarks ?? '开始固定',
    result: 'SUCCESS',
    specimenId: specimen.id,
    terminalCode: data.terminalCode ?? null,
    verificationType: 'FIXATION_START',
    verifiedAt: eventTime,
  });
  updateApplicationFromSpecimens(specimen.applicationId);
  return {
    barcode: specimen.barcode,
    fixationStatus: specimen.fixationStatus ?? 'FIXING',
    specimenId: specimen.id,
  };
}

export async function completeFixationMock(
  data: SpecimenFixationRequest,
): Promise<FixationResult> {
  const specimen = resolveSpecimenByIdentifier(data.specimenBarcode);
  assertSpecimenNotInReceiptTerminalState(specimen, '完成固定');
  if (specimen.fixationStatus !== 'FIXING') {
    throw new Error(`标本 ${specimen.barcode} 当前状态不允许完成固定`);
  }
  const eventTime = createTimestamp();
  specimen.fixationStatus = 'COMPLETED';
  specimen.fixationStartedAt = specimen.fixationStartedAt ?? eventTime;
  specimen.fixationCompletedAt = eventTime;
  specimen.fixationLiquidType = data.fixationLiquidType ?? specimen.fixationLiquidType;
  specimen.specimenStatus = 'FIXED';
  specimen.latestTrackingAt = eventTime;
  appendWorkflowEvent({
    applicationId: specimen.applicationId,
    eventContent: '固定完成',
    eventStatus: 'SUCCESS',
    eventTime,
    eventType: 'COMPLETED',
    nodeCode: 'FIXATION',
    operatorName: data.operatorName,
    sourceTerminal: data.terminalCode ?? null,
    specimenBarcode: specimen.barcode,
    specimenId: specimen.id,
    specimenNo: specimen.specimenNo,
  });
  appendVerificationRecord({
    applicationId: specimen.applicationId,
    barcode: specimen.barcode,
    operatorName: data.operatorName,
    operatorUserId: data.operatorUserId ?? null,
    remarks: data.remarks ?? '固定完成',
    result: 'SUCCESS',
    specimenId: specimen.id,
    terminalCode: data.terminalCode ?? null,
    verificationType: 'FIXATION_COMPLETE',
    verifiedAt: eventTime,
  });
  updateApplicationFromSpecimens(specimen.applicationId);
  return {
    barcode: specimen.barcode,
    fixationStatus: specimen.fixationStatus ?? 'COMPLETED',
    specimenId: specimen.id,
  };
}

export async function listPendingSpecimenRemovalsMock(
  params: SpecimenRemovalQuery,
): Promise<SpecimenRemovalPage> {
  const filteredItems = state.specimens
    .filter((item) => {
      const application = getApplicationById(item.applicationId);
      const keyword = normalizeText(params.keyword);
      const matchesKeyword = !keyword
        || includesText(application.applicationNo, keyword)
        || includesText(application.patientName, keyword)
        || includesText(item.specimenNo, keyword)
        || includesText(item.barcode, keyword)
        || includesText(item.specimenName, keyword);

      return matchesKeyword
        && (!normalizeText(params.applicationNo) || application.applicationNo === params.applicationNo)
        && (!normalizeText(params.departmentId) || application.submittingDepartmentId === params.departmentId)
        && (!normalizeText(params.specimenStatus) || item.specimenStatus === params.specimenStatus)
        && (params.abnormalFlag === undefined || isSpecimenAbnormal(item) === params.abnormalFlag)
        && withinDateRange(item.registeredAt, params.dateFrom, params.dateTo);
    })
    .sort((left, right) =>
      compareNullableDateDesc(
        left.specimenRemovalAt ?? left.registeredAt,
        right.specimenRemovalAt ?? right.registeredAt,
      ),
    )
    .map(mapSpecimenRemovalItem);

  const summary: SpecimenRemovalSummary = {
    abnormalCount: filteredItems.filter((item) => item.abnormalFlag).length,
    confirmedCount: filteredItems.filter((item) => Boolean(item.specimenRemovalAt)).length,
    pendingCount: filteredItems.filter((item) => !item.specimenRemovalAt).length,
    totalCount: filteredItems.length,
  };

  return {
    ...paginateItems(filteredItems, params.page, params.size),
    summary,
  };
}

export async function confirmSpecimenRemovalMock(
  data: SpecimenRemovalConfirmRequest,
): Promise<SpecimenRemovalConfirmResult> {
  const specimen = resolveSpecimenByIdentifier(data.specimenBarcode);
  if (specimen.specimenRemovalAt) {
    throw new Error(`标本 ${specimen.barcode} 已完成离体确认`);
  }
  const eventTime = createTimestamp();
  specimen.specimenRemovalAt = eventTime;
  specimen.specimenRemovalOperatorName = data.operatorName;
  specimen.latestTrackingAt = eventTime;
  appendWorkflowEvent({
    applicationId: specimen.applicationId,
    eventContent: '离体确认完成',
    eventStatus: 'SUCCESS',
    eventTime,
    eventType: 'COMPLETED',
    nodeCode: 'REMOVAL',
    operatorName: data.operatorName,
    sourceTerminal: data.terminalCode ?? null,
    specimenBarcode: specimen.barcode,
    specimenId: specimen.id,
    specimenNo: specimen.specimenNo,
  });
  return {
    barcode: specimen.barcode,
    operatorName: data.operatorName,
    specimenId: specimen.id,
    specimenRemovalAt: eventTime,
  };
}

export async function listPendingTransportOrdersMock(
  params: PendingTransportOrderQuery,
): Promise<PendingTransportOrderPage> {
  const filteredItems = state.transportOrders
    .filter((item) => {
      const application = getApplicationById(item.applicationId);
      const matchesSpecimenNo = !normalizeText(params.specimenNo)
        || item.specimenIds
          .map((specimenId) => state.specimens.find((specimen) => specimen.id === specimenId))
          .some((specimen) => specimen?.specimenNo === params.specimenNo);
      return item.status !== 'COMPLETED'
        && item.status !== 'CANCELLED'
        && (!normalizeText(params.status) || item.status === params.status)
        && (!normalizeText(params.applicationId)
          || application.id === params.applicationId
          || application.applicationNo === params.applicationId)
        && matchesSpecimenNo
        && (!normalizeText(params.departmentId) || application.submittingDepartmentId === params.departmentId)
        && withinDateRange(item.createdAt, params.dateFrom, params.dateTo);
    })
    .sort((left, right) => compareNullableDateDesc(left.createdAt, right.createdAt))
    .map(mapPendingTransportOrderItem);

  return paginateItems(filteredItems, params.page, params.size);
}

export async function createTransportOrderMock(
  data: TransportOrderCreateRequest,
): Promise<TransportOrderView> {
  const application = getApplicationById(data.applicationId);
  const eventTime = createTimestamp();
  const specimenIds = data.specimenBarcodes.map((barcode) => {
    const specimen = resolveSpecimenByIdentifier(barcode);
    assertSpecimenNotInReceiptTerminalState(specimen, '创建转运单');
    if (specimen.applicationId !== application.id) {
      throw new Error(`标本 ${barcode} 不属于当前申请单`);
    }
    if (specimen.fixationStatus !== 'COMPLETED') {
      throw new Error(`标本 ${barcode} 尚未固定完成`);
    }
    if (!specimen.specimenConfirmedAt) {
      throw new Error(`标本 ${barcode} 尚未完成标本确认`);
    }
    if (!isSpecimenCheckedIn(specimen)) {
      throw new Error(`标本 ${barcode} 尚未完成标本入库`);
    }
    if (getTransportOrderBySpecimenId(specimen.id)) {
      throw new Error(`标本 ${barcode} 已存在转运单`);
    }
    specimen.specimenStatus = 'IN_TRANSIT';
    specimen.latestTrackingAt = eventTime;
    return specimen.id;
  });

  const order: RawTransportOrder = {
    applicationId: application.id,
    createdAt: eventTime,
    handedOverAt: null,
    handoverDepartmentId: data.handoverDepartmentId ?? null,
    handoverDepartmentName: data.handoverDepartmentName,
    handoverUserId: data.handoverUserId ?? null,
    handoverUserName: data.handoverUserName,
    id: createNumericId(
      'TO',
      state.transportOrders.map((item) => item.id),
    ),
    printedAt: null,
    receiverDepartmentId: data.receiverDepartmentId ?? null,
    receiverDepartmentName: data.receiverDepartmentName,
    receiverUserId: null,
    receiverUserName: null,
    remarks: data.remarks ?? null,
    specimenIds,
    status: 'PENDING',
    terminalCode: data.terminalCode ?? null,
    toBeTransportedAt: eventTime,
    transportOrderNo: `TR-${eventTime.slice(0, 10).replaceAll('-', '')}-${String(state.transportOrders.length + 1).padStart(3, '0')}`,
  };
  state.transportOrders.push(order);

  specimenIds.forEach((specimenId) => {
    const specimen = state.specimens.find((item) => item.id === specimenId);
    if (!specimen) {
      return;
    }
    appendWorkflowEvent({
      applicationId: application.id,
      eventContent: `创建转运单 ${order.transportOrderNo}`,
      eventStatus: 'SUCCESS',
      eventTime,
      eventType: 'ORDER_CREATED',
      nodeCode: 'TRANSPORT',
      operatorName: data.handoverUserName,
      sourceTerminal: data.terminalCode ?? null,
      specimenBarcode: specimen.barcode,
      specimenId: specimen.id,
      specimenNo: specimen.specimenNo,
    });
  });

  updateApplicationFromSpecimens(application.id);
  return mapTransportOrderView(order);
}

export async function printTransportOrderMock(
  transportOrderId: string,
  data: TransportOrderOperatorRequest,
): Promise<TransportOrderView> {
  const order = findTransportOrderById(transportOrderId);
  const eventTime = createTimestamp();
  order.status = 'PRINTED';
  order.printedAt = eventTime;
  order.terminalCode = data.terminalCode ?? order.terminalCode;
  order.specimenIds.forEach((specimenId) => {
    const specimen = state.specimens.find((item) => item.id === specimenId);
    if (!specimen) {
      return;
    }
    specimen.latestTrackingAt = eventTime;
    appendWorkflowEvent({
      applicationId: order.applicationId,
      eventContent: `打印转运单 ${order.transportOrderNo}`,
      eventStatus: 'SUCCESS',
      eventTime,
      eventType: 'ORDER_PRINTED',
      nodeCode: 'TRANSPORT',
      operatorName: data.operatorName,
      sourceTerminal: data.terminalCode ?? null,
      specimenBarcode: specimen.barcode,
      specimenId: specimen.id,
      specimenNo: specimen.specimenNo,
    });
  });
  updateApplicationFromSpecimens(order.applicationId);
  return mapTransportOrderView(order);
}

export async function handoverTransportOrderMock(
  transportOrderId: string,
  data: TransportOrderHandoverRequest,
): Promise<TransportOrderView> {
  const order = findTransportOrderById(transportOrderId);
  const eventTime = createTimestamp();
  order.status = 'HANDED_OVER';
  order.handedOverAt = eventTime;
  order.receiverUserId = data.receiverUserId ?? null;
  order.receiverUserName = data.receiverUserName;
  order.remarks = data.remarks ?? order.remarks;
  order.terminalCode = data.terminalCode ?? order.terminalCode;
  order.specimenIds.forEach((specimenId) => {
    const specimen = state.specimens.find((item) => item.id === specimenId);
    if (!specimen) {
      return;
    }
    specimen.latestTrackingAt = eventTime;
    appendWorkflowEvent({
      applicationId: order.applicationId,
      eventContent: `完成转运交接 ${order.transportOrderNo}`,
      eventStatus: 'SUCCESS',
      eventTime,
      eventType: 'HANDED_OVER',
      nodeCode: 'TRANSPORT',
      operatorName: data.receiverUserName,
      sourceTerminal: data.terminalCode ?? null,
      specimenBarcode: specimen.barcode,
      specimenId: specimen.id,
      specimenNo: specimen.specimenNo,
    });
  });
  updateApplicationFromSpecimens(order.applicationId);
  return mapTransportOrderView(order);
}

export async function listPendingReceiptsMock(
  params: PendingSpecimenQuery,
): Promise<PendingSpecimenPage> {
  const filteredItems = state.specimens
    .filter((item) => {
      const application = getApplicationById(item.applicationId);
      const order = getTransportOrderBySpecimenId(item.id);
      if (!order || !['HANDED_OVER', 'PARTIALLY_RECEIVED'].includes(order.status)) {
        return false;
      }
      if (normalizeText(item.receiptStatus)) {
        return false;
      }
      return (!normalizeText(params.applicationId)
          || application.id === params.applicationId
          || application.applicationNo === params.applicationId)
        && (!normalizeText(params.departmentId) || application.submittingDepartmentId === params.departmentId)
        && withinDateRange(order.createdAt, params.dateFrom, params.dateTo);
    })
    .sort((left, right) => compareNullableDateDesc(left.latestTrackingAt, right.latestTrackingAt))
    .map(mapPendingSpecimenItem);

  return paginateItems(filteredItems, params.page, params.size);
}

export async function receiveSpecimensMock(
  data: SpecimenReceiptRequest,
): Promise<SpecimenReceiptResult> {
  const order = findTransportOrderById(data.transportOrderId);
  const eventTime = createTimestamp();

  data.items.forEach((item) => {
    const specimen = resolveSpecimenByIdentifier(item.specimenBarcode);
    if (!order.specimenIds.includes(specimen.id)) {
      throw new Error(`标本 ${item.specimenBarcode} 不属于转运单 ${order.transportOrderNo}`);
    }
    specimen.containerCount = item.containerCount ?? specimen.containerCount;
    specimen.qualityCheckResult = item.qualityCheckResult;
    specimen.qualityIssueCodes = [...(item.qualityIssueCodes ?? [])];
    specimen.receiptStatus = item.receiptStatus;
    specimen.receiptReason = item.reason ?? null;
    specimen.receiptRemarks = item.remarks ?? null;
    specimen.latestTrackingAt = eventTime;
    specimen.specimenStatus = item.receiptStatus === 'RECEIVED' ? 'RECEIVED' : item.receiptStatus;
    appendWorkflowEvent({
      applicationId: specimen.applicationId,
      eventContent: item.receiptStatus === 'RECEIVED' ? '标本接收完成' : '标本接收异常',
      eventStatus: item.receiptStatus,
      eventTime,
      eventType: item.receiptStatus,
      nodeCode: item.receiptStatus === 'RECEIVED' ? 'RECEPTION' : 'PARTIALLY_RECEIVED',
      operatorName: data.receivedByName,
      sourceTerminal: data.terminalCode ?? null,
      specimenBarcode: specimen.barcode,
      specimenId: specimen.id,
      specimenNo: specimen.specimenNo,
    });
    if (item.qualityCheckResult === 'FAILED' || item.receiptStatus !== 'RECEIVED') {
      appendVerificationRecord({
        applicationId: specimen.applicationId,
        barcode: specimen.barcode,
        operatorName: data.receivedByName,
        operatorUserId: data.receivedByUserId ?? null,
        remarks: item.reason ?? item.remarks ?? '接收异常核对',
        result: item.qualityCheckResult === 'FAILED' ? 'FAILED' : item.receiptStatus,
        specimenId: specimen.id,
        terminalCode: data.terminalCode ?? null,
        verificationType: 'RECEIPT_CHECK',
        verifiedAt: eventTime,
      });
    }
  });

  refreshTransportOrderStatus(order);
  updateApplicationFromSpecimens(order.applicationId);
  return createReceiptResult(order.applicationId);
}

export async function directReceiveSpecimensMock(
  data: DirectSpecimenReceiptRequest,
): Promise<SpecimenReceiptResult> {
  const eventTime = createTimestamp();
  const touchedApplications = new Set<string>();

  data.items.forEach((item) => {
    const specimen = resolveSpecimenByIdentifier(item.specimenBarcode);
    specimen.containerCount = item.containerCount ?? specimen.containerCount;
    specimen.qualityCheckResult = item.qualityCheckResult;
    specimen.qualityIssueCodes = [...(item.qualityIssueCodes ?? [])];
    specimen.receiptStatus = item.receiptStatus;
    specimen.receiptReason = item.reason ?? null;
    specimen.receiptRemarks = item.remarks ?? null;
    specimen.latestTrackingAt = eventTime;
    specimen.specimenStatus = item.receiptStatus === 'RECEIVED' ? 'RECEIVED' : item.receiptStatus;
    touchedApplications.add(specimen.applicationId);
    appendWorkflowEvent({
      applicationId: specimen.applicationId,
      eventContent: '按条码直接接收标本',
      eventStatus: item.receiptStatus,
      eventTime,
      eventType: 'DIRECT_RECEIVE',
      nodeCode: item.receiptStatus === 'RECEIVED' ? 'RECEPTION' : 'PARTIALLY_RECEIVED',
      operatorName: data.receivedByName ?? '系统接收',
      sourceTerminal: data.terminalCode ?? null,
      specimenBarcode: specimen.barcode,
      specimenId: specimen.id,
      specimenNo: specimen.specimenNo,
    });
  });

  const applicationId = [...touchedApplications][0];
  if (!applicationId) {
    throw new Error('未找到可接收的标本');
  }

  state.transportOrders
    .filter((item) => item.applicationId === applicationId)
    .forEach(refreshTransportOrderStatus);
  updateApplicationFromSpecimens(applicationId);
  return createReceiptResult(applicationId);
}

export async function bindSpecimenBarcodeMock(
  identifier: string,
  data: SpecimenBarcodeBindingRequest,
): Promise<SpecimenTrackingSummary> {
  const specimen = resolveSpecimenByIdentifier(identifier);
  assertSpecimenNotInReceiptTerminalState(specimen, '绑定条码');
  const eventTime = createTimestamp();
  const previousBarcode = specimen.barcode;
  specimen.previousBarcodes = previousBarcode ? [...specimen.previousBarcodes, previousBarcode] : [...specimen.previousBarcodes];
  specimen.barcode = data.targetBarcode.trim();
  specimen.latestTrackingAt = eventTime;
  appendWorkflowEvent({
    applicationId: specimen.applicationId,
    eventContent: `绑定条码 ${specimen.barcode}`,
    eventStatus: 'SUCCESS',
    eventTime,
    eventType: 'PRINTED',
    nodeCode: 'LABEL_PRINT',
    operatorName: data.operatorName,
    sourceTerminal: data.terminalCode ?? null,
    specimenBarcode: specimen.barcode,
    specimenId: specimen.id,
    specimenNo: specimen.specimenNo,
  });
  appendVerificationRecord({
    applicationId: specimen.applicationId,
    barcode: specimen.barcode,
    operatorName: data.operatorName,
    operatorUserId: data.operatorUserId ?? null,
    remarks: data.remarks ?? null,
    result: 'SUCCESS',
    specimenId: specimen.id,
    terminalCode: data.terminalCode ?? null,
    verificationType: 'BARCODE_BIND',
    verifiedAt: eventTime,
  });
  updateApplicationFromSpecimens(specimen.applicationId);
  return mapSpecimenTrackingSummary(specimen);
}

export async function rebindSpecimenBarcodeMock(
  identifier: string,
  data: SpecimenBarcodeBindingRequest,
): Promise<SpecimenTrackingSummary> {
  const specimen = resolveSpecimenByIdentifier(identifier);
  assertSpecimenNotInReceiptTerminalState(specimen, '重绑条码');
  const oldBarcode = specimen.barcode;
  const eventTime = createTimestamp();
  specimen.previousBarcodes = oldBarcode
    ? [...new Set([...specimen.previousBarcodes, oldBarcode])]
    : [...specimen.previousBarcodes];
  specimen.barcode = data.targetBarcode.trim();
  specimen.latestTrackingAt = eventTime;
  appendWorkflowEvent({
    applicationId: specimen.applicationId,
    eventContent: `条码重绑 ${oldBarcode} -> ${specimen.barcode}`,
    eventStatus: 'SUCCESS',
    eventTime,
    eventType: 'RETRY',
    nodeCode: 'LABEL_PRINT',
    operatorName: data.operatorName,
    sourceTerminal: data.terminalCode ?? null,
    specimenBarcode: specimen.barcode,
    specimenId: specimen.id,
    specimenNo: specimen.specimenNo,
  });
  appendVerificationRecord({
    applicationId: specimen.applicationId,
    barcode: specimen.barcode,
    operatorName: data.operatorName,
    operatorUserId: data.operatorUserId ?? null,
    remarks: data.remarks ?? `旧条码 ${oldBarcode} 更正为 ${specimen.barcode}`,
    result: 'SUCCESS',
    specimenId: specimen.id,
    terminalCode: data.terminalCode ?? null,
    verificationType: 'BARCODE_REBIND',
    verifiedAt: eventTime,
  });
  updateApplicationFromSpecimens(specimen.applicationId);
  return mapSpecimenTrackingSummary(specimen);
}

export async function confirmSpecimenMock(
  identifier: string,
  data: SpecimenConfirmRequest,
): Promise<SpecimenTrackingSummary> {
  const specimen = resolveSpecimenByIdentifier(identifier);
  assertSpecimenNotInReceiptTerminalState(specimen, '标本确认');
  if (specimen.fixationStatus !== 'COMPLETED') {
    throw new Error(`标本 ${specimen.barcode} 需在固定完成后才能确认`);
  }
  if (specimen.specimenConfirmedAt) {
    throw new Error(`标本 ${specimen.barcode} 已完成确认`);
  }
  const eventTime = createTimestamp();
  specimen.specimenConfirmedAt = eventTime;
  specimen.latestTrackingAt = eventTime;
  specimen.specimenStatus = 'VERIFIED';
  appendWorkflowEvent({
    applicationId: specimen.applicationId,
    eventContent: '标本确认完成',
    eventStatus: 'SUCCESS',
    eventTime,
    eventType: 'COMPLETED',
    nodeCode: 'CONFIRMATION',
    operatorName: data.operatorName,
    sourceTerminal: data.terminalCode ?? null,
    specimenBarcode: specimen.barcode,
    specimenId: specimen.id,
    specimenNo: specimen.specimenNo,
  });
  appendVerificationRecord({
    applicationId: specimen.applicationId,
    barcode: specimen.barcode,
    operatorName: data.operatorName,
    operatorUserId: data.operatorUserId ?? null,
    remarks: data.remarks ?? null,
    result: 'SUCCESS',
    specimenId: specimen.id,
    terminalCode: data.terminalCode ?? null,
    verificationType: 'SPECIMEN_CONFIRM',
    verifiedAt: eventTime,
  });
  updateApplicationFromSpecimens(specimen.applicationId);
  return mapSpecimenTrackingSummary(specimen);
}

export async function checkInSpecimenMock(
  identifier: string,
  data: SpecimenCheckInRequest,
): Promise<SpecimenTrackingSummary> {
  const specimen = resolveSpecimenByIdentifier(identifier);
  assertSpecimenNotInReceiptTerminalState(specimen, '标本入库');
  if (!specimen.specimenConfirmedAt) {
    throw new Error(`标本 ${specimen.barcode} 需在确认后才能入库`);
  }
  if (isSpecimenCheckedIn(specimen)) {
    throw new Error(`标本 ${specimen.barcode} 已完成入库`);
  }

  const eventTime = createTimestamp();
  specimen.checkInStatus = 'CHECKED_IN';
  specimen.checkedInAt = eventTime;
  specimen.checkedInByName = data.operatorName;
  specimen.latestTrackingAt = eventTime;
  specimen.specimenStatus = 'CHECKED_IN';
  appendWorkflowEvent({
    applicationId: specimen.applicationId,
    eventContent: '标本入库完成',
    eventStatus: 'SUCCESS',
    eventTime,
    eventType: 'CHECKED_IN',
    nodeCode: 'CHECK_IN',
    operatorName: data.operatorName,
    sourceTerminal: data.terminalCode ?? null,
    specimenBarcode: specimen.barcode,
    specimenId: specimen.id,
    specimenNo: specimen.specimenNo,
  });
  appendVerificationRecord({
    applicationId: specimen.applicationId,
    barcode: specimen.barcode,
    operatorName: data.operatorName,
    operatorUserId: data.operatorUserId ?? null,
    remarks: data.remarks ?? '执行标本入库',
    result: 'SUCCESS',
    specimenId: specimen.id,
    terminalCode: data.terminalCode ?? null,
    verificationType: 'SPECIMEN_CHECK_IN',
    verifiedAt: eventTime,
  });
  updateApplicationFromSpecimens(specimen.applicationId);
  return mapSpecimenTrackingSummary(specimen);
}

export async function listSpecimenVerificationRecordsMock(
  identifier: string,
): Promise<SpecimenVerificationRecord[]> {
  const specimen = resolveSpecimenByIdentifier(identifier);
  return state.verificationRecords
    .filter((item) => item.specimenId === specimen.id)
    .sort((left, right) => compareNullableDateDesc(left.verifiedAt, right.verifiedAt))
    .map((item) => ({
      applicationId: item.applicationId,
      barcode: item.barcode,
      operatorName: item.operatorName,
      remarks: item.remarks,
      result: item.result,
      specimenId: item.specimenId,
      terminalCode: item.terminalCode,
      verificationType: item.verificationType,
      verifiedAt: item.verifiedAt,
    }));
}

export async function reprintApplicationFormMock(
  applicationId: string,
  data: ApplicationFormReprintRequest,
) {
  const application = getApplicationById(applicationId);
  const eventTime = createTimestamp();
  application.updatedAt = eventTime;
  const event = appendWorkflowEvent({
    applicationId: application.id,
    eventContent: '补打印申请单',
    eventStatus: 'SUCCESS',
    eventTime,
    eventType: 'PRINTED',
    nodeCode: application.currentNode,
    operatorName: data.operatorName,
    sourceTerminal: data.terminalCode ?? null,
    specimenBarcode: null,
    specimenId: null,
    specimenNo: null,
  });
  return event;
}
