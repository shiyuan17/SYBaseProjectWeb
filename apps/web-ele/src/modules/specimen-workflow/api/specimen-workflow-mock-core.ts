import type {
  ApplicationListItem,
  LatestSpecimenRegistrationResult,
  PendingSpecimenItem,
  PendingTransportOrderItem,
  SpecimenManagementListItem,
  SpecimenOutboundListItem,
  SpecimenReceiptResult,
  SpecimenRemovalConfirmRequest,
  SpecimenRemovalConfirmResult,
  SpecimenRemovalItem,
  SpecimenTrackingSummary,
  TrackingQueryView,
  TransportOrderView,
} from '../types/specimen-workflow';
import type {
  MockState,
  RawApplication,
  RawSpecimen,
  RawTransportOrder,
  RawVerificationRecord,
  RawWorkflowEvent,
} from './specimen-workflow-mock-state';

import {
  compareNullableDateDesc,
  createNumericId,
  createTimestamp,
  normalizeText,
} from '../utils/mock-support';
import { createInitialState } from './specimen-workflow-mock-state';

let state: MockState = createInitialState();

const DEFAULT_MOCK_OPERATOR_NAME = '当前登录用户';
const DEFAULT_MOCK_OPERATOR_USER_ID = 'CURRENT-USER';

export function getMockState(): MockState {
  return state;
}

export function resolveMockOperatorContext(operator?: {
  operatorName?: null | string;
  operatorUserId?: null | string;
}) {
  const operatorName =
    normalizeText(operator?.operatorName) || DEFAULT_MOCK_OPERATOR_NAME;
  const operatorUserId =
    normalizeText(operator?.operatorUserId) || DEFAULT_MOCK_OPERATOR_USER_ID;

  return {
    operatorName,
    operatorUserId,
  };
}

function isPresent<T>(value: null | T | undefined): value is T {
  return value !== null && value !== undefined;
}

export function getApplicationById(applicationId: string) {
  const normalizedApplicationId = normalizeText(applicationId);
  const application = state.applications.find(
    (item) => item.id === normalizedApplicationId,
  );
  if (!application) {
    throw new Error(`未找到申请单: ${applicationId}`);
  }
  return application;
}

export function getSpecimensByApplicationId(applicationId: string) {
  return state.specimens.filter((item) => item.applicationId === applicationId);
}

export function resolveSpecimenByIdentifier(identifier: string) {
  const normalizedIdentifier = normalizeText(identifier);
  const specimen = state.specimens.find(
    (item) =>
      item.barcode === normalizedIdentifier ||
      item.id === normalizedIdentifier ||
      item.specimenNo === normalizedIdentifier,
  );
  if (!specimen) {
    throw new Error(`未找到标本: ${identifier}`);
  }
  return specimen;
}

export function resolveSpecimenByBarcode(barcode: string) {
  const normalizedBarcode = normalizeText(barcode);
  const specimen = state.specimens.find(
    (item) => item.barcode === normalizedBarcode,
  );
  if (!specimen) {
    throw new Error('未找到对应标本');
  }
  return specimen;
}

export function resolveSpecimensBySpecimenNo(specimenNo: string) {
  const normalizedSpecimenNo = normalizeText(specimenNo);
  return state.specimens.filter(
    (item) => item.specimenNo === normalizedSpecimenNo,
  );
}

export function resolveSpecimenByPreferredIdentifier(data: {
  specimenBarcode?: null | string;
  specimenId?: null | string;
  specimenNo?: null | string;
}) {
  const specimenId = normalizeText(data.specimenId);
  if (specimenId) {
    return resolveSpecimenByIdentifier(specimenId);
  }

  const specimenBarcode = normalizeText(data.specimenBarcode);
  if (specimenBarcode) {
    return resolveSpecimenByIdentifier(specimenBarcode);
  }

  const specimenNo = normalizeText(data.specimenNo);
  if (specimenNo) {
    const matchedSpecimens = resolveSpecimensBySpecimenNo(specimenNo);
    if (matchedSpecimens.length === 0) {
      throw new Error(`未找到标本: ${specimenNo}`);
    }
    if (matchedSpecimens.length > 1) {
      throw new Error(`标本流水号 ${specimenNo} 匹配到多条记录`);
    }
    const matchedSpecimen = matchedSpecimens[0];
    if (!matchedSpecimen) {
      throw new Error(`未找到标本: ${specimenNo}`);
    }
    return matchedSpecimen;
  }

  throw new Error('缺少标本 ID、条码或标本编号');
}

export function applySpecimenRemovalConfirmation(
  specimen: RawSpecimen,
  data: Pick<SpecimenRemovalConfirmRequest, 'remarks' | 'terminalCode'>,
): SpecimenRemovalConfirmResult {
  if (specimen.specimenRemovalAt) {
    throw new Error(`标本 ${specimen.barcode} 已完成离体确认`);
  }
  const eventTime = createTimestamp();
  const { operatorName } = resolveMockOperatorContext();
  specimen.specimenRemovalAt = eventTime;
  specimen.specimenRemovalOperatorName = operatorName;
  specimen.verificationStatus = 'VERIFIED';
  specimen.verificationStartedAt ??= eventTime;
  specimen.verificationCompletedAt = eventTime;
  specimen.latestTrackingAt = eventTime;
  appendWorkflowEvent({
    applicationId: specimen.applicationId,
    eventContent: '离体确认完成',
    eventStatus: 'SUCCESS',
    eventTime,
    eventType: 'COMPLETED',
    nodeCode: 'REMOVAL',
    operatorName,
    sourceTerminal: data.terminalCode ?? null,
    specimenBarcode: specimen.barcode,
    specimenId: specimen.id,
    specimenNo: specimen.specimenNo,
  });
  return {
    barcode: specimen.barcode ?? '',
    operatorName,
    specimenId: specimen.id,
    specimenRemovalAt: eventTime,
  };
}

export function findTransportOrderById(transportOrderId: string) {
  const normalizedTransportOrderId = normalizeText(transportOrderId);
  const order = state.transportOrders.find(
    (item) => item.id === normalizedTransportOrderId,
  );
  if (!order) {
    throw new Error(`未找到转运单: ${transportOrderId}`);
  }
  return order;
}

export function getTransportOrderBySpecimenId(specimenId: string) {
  return (
    state.transportOrders
      .toReversed()
      .find(
        (item) =>
          item.specimenIds.includes(specimenId) && item.status !== 'CANCELLED',
      ) ?? null
  );
}

export function getActiveTransportOrderBySpecimenId(specimenId: string) {
  return (
    state.transportOrders.find(
      (item) =>
        item.specimenIds.includes(specimenId) &&
        item.status !== 'COMPLETED' &&
        item.status !== 'CANCELLED',
    ) ?? null
  );
}

function hasStartedDownstreamWorkflow(applicationId: string) {
  const specimens = getSpecimensByApplicationId(applicationId);
  return specimens.some(
    (item) =>
      item.fixationStatus !== 'PENDING' ||
      item.specimenStatus !== 'REGISTERED' ||
      Boolean(item.specimenConfirmedAt) ||
      Boolean(item.checkInStatus && item.checkInStatus !== 'NOT_CHECKED_IN') ||
      Boolean(getTransportOrderBySpecimenId(item.id)),
  );
}

export function resolveApplicationOperationState(application: RawApplication) {
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

export function appendWorkflowEvent(payload: Omit<RawWorkflowEvent, 'id'>) {
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

export function appendVerificationRecord(
  payload: Omit<RawVerificationRecord, 'id'>,
) {
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
  if (
    specimen.receiptStatus === 'REJECTED' ||
    specimen.receiptStatus === 'RETURNED'
  ) {
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

export function isSpecimenAbnormal(specimen: RawSpecimen) {
  return Boolean(resolveSpecimenAbnormalType(specimen));
}

export function resolveSpecimenVerificationStatus(specimen: RawSpecimen) {
  return specimen.verificationStatus ?? 'UNVERIFIED';
}

export function resolveSpecimenCheckInStatus(specimen: RawSpecimen) {
  return specimen.checkInStatus ?? 'NOT_CHECKED_IN';
}

function resolveSpecimenBarcodeBindingStatus(specimen: RawSpecimen) {
  return normalizeText(specimen.barcode) ? 'BOUND' : 'UNBOUND';
}

export function isSpecimenInReceiptTerminalState(specimen: RawSpecimen) {
  return ['RECEIVED', 'REJECTED', 'RETURNED'].includes(
    specimen.receiptStatus ?? specimen.specimenStatus ?? '',
  );
}

export function assertSpecimenNotInReceiptTerminalState(
  specimen: RawSpecimen,
  actionName: string,
) {
  if (isSpecimenInReceiptTerminalState(specimen)) {
    throw new Error(
      `标本 ${specimen.barcode || specimen.specimenNo} 已进入接收结果，不能继续${actionName}`,
    );
  }
}

export function isSpecimenVerified(specimen: RawSpecimen) {
  return resolveSpecimenVerificationStatus(specimen) === 'VERIFIED';
}

export function isSpecimenCheckedIn(specimen: RawSpecimen) {
  return resolveSpecimenCheckInStatus(specimen) === 'CHECKED_IN';
}

export function mapSpecimenTrackingSummary(
  specimen: RawSpecimen,
): SpecimenTrackingSummary {
  return {
    abnormalReason: specimen.receiptReason ?? specimen.receiptRemarks ?? null,
    abnormalType: resolveSpecimenAbnormalType(specimen),
    barcode: normalizeText(specimen.barcode) || null,
    barcodeBindingStatus: resolveSpecimenBarcodeBindingStatus(specimen),
    checkInStatus: resolveSpecimenCheckInStatus(specimen),
    checkedInAt: specimen.checkedInAt ?? null,
    checkedInByName: specimen.checkedInByName ?? null,
    clinicalSymptom: specimen.clinicalSymptom,
    collectionMode: specimen.collectionMode,
    containerCount: specimen.containerCount,
    containerName: specimen.containerName,
    fixationCompletedAt: specimen.fixationCompletedAt,
    fixationLiquidType: specimen.fixationLiquidType,
    fixationOperatorName: specimen.fixationOperatorName ?? null,
    fixationOperatorUserId: specimen.fixationOperatorUserId ?? null,
    fixationStartedAt: specimen.fixationStartedAt,
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

export function mapSpecimenManagementItem(
  specimen: RawSpecimen,
): SpecimenManagementListItem {
  const application = getApplicationById(specimen.applicationId);
  return {
    abnormalFlag: isSpecimenAbnormal(specimen),
    abnormalType: resolveSpecimenAbnormalType(specimen),
    applicationId: application.id,
    applicationNo: application.applicationNo,
    barcode: specimen.barcode ?? '',
    barcodeBindingStatus: resolveSpecimenBarcodeBindingStatus(specimen),
    buildingId: null,
    checkInStatus: resolveSpecimenCheckInStatus(specimen),
    checkedInAt: specimen.checkedInAt ?? null,
    checkedInByName: specimen.checkedInByName ?? null,
    containerCount: specimen.containerCount,
    containerName: specimen.containerName,
    fixationCompletedAt: specimen.fixationCompletedAt,
    fixationLiquidType: specimen.fixationLiquidType,
    fixationOperatorName: specimen.fixationOperatorName ?? null,
    fixationOperatorUserId: specimen.fixationOperatorUserId ?? null,
    fixationStartedAt: specimen.fixationStartedAt,
    fixationStatus: specimen.fixationStatus,
    labelPrintBatchNo: specimen.labelPrintBatchNo,
    labelPrintStatus: specimen.labelPrintStatus,
    latestTrackingAt: specimen.latestTrackingAt,
    patientGender: application.patientGender ?? null,
    patientId: application.patientId ?? null,
    patientName: application.patientName,
    recentNode: resolveSpecimenRecentNode(specimen),
    registeredAt: specimen.registeredAt,
    registrationOperatorName: null,
    roomId: null,
    specimenConfirmedAt: specimen.specimenConfirmedAt,
    specimenConfirmedByName: specimen.specimenConfirmedByName ?? null,
    specimenConfirmedByUserId: specimen.specimenConfirmedByUserId ?? null,
    specimenCount: specimen.specimenCount,
    specimenId: specimen.id,
    specimenName: specimen.specimenName,
    specimenNo: specimen.specimenNo,
    specimenSite: specimen.specimenSite,
    specimenStatus: specimen.specimenStatus,
    specimenType: specimen.specimenType,
    submittingDepartmentId: application.submittingDepartmentId,
    submittingDepartmentName: application.submittingDepartmentName,
    surgeryName: application.submittingDepartmentName ?? null,
    verificationCompletedAt: specimen.verificationCompletedAt ?? null,
    verificationStartedAt: specimen.verificationStartedAt ?? null,
    verificationStatus: resolveSpecimenVerificationStatus(specimen),
  };
}

export function mapSpecimenRemovalItem(
  specimen: RawSpecimen,
): SpecimenRemovalItem {
  const application = getApplicationById(specimen.applicationId);
  return {
    abnormalFlag: isSpecimenAbnormal(specimen),
    applicationId: application.id,
    applicationNo: application.applicationNo,
    barcode: specimen.barcode ?? '',
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

export function mapSpecimenOutboundItem(
  specimen: RawSpecimen,
): SpecimenOutboundListItem {
  const application = getApplicationById(specimen.applicationId);
  const order = getTransportOrderBySpecimenId(specimen.id);

  return {
    applicationId: application.id,
    applicationNo: application.applicationNo,
    barcode: specimen.barcode ?? '',
    checkInStatus: resolveSpecimenCheckInStatus(specimen),
    fixationStatus: specimen.fixationStatus,
    inpatientNo: normalizeText(application.applicationNo) || null,
    outboundAt: order?.handedOverAt ?? null,
    outboundUserName: order?.outboundUserName ?? null,
    patientGender: application.patientGender ?? null,
    patientId: application.patientId ?? null,
    patientName: application.patientName,
    registeredAt: specimen.registeredAt,
    registeredByName: '系统导入',
    specimenConfirmedAt: specimen.specimenConfirmedAt ?? null,
    specimenId: specimen.id,
    specimenName: specimen.specimenName,
    specimenNo: specimen.specimenNo,
    specimenStatus: specimen.specimenStatus,
    submittingDepartmentId: application.submittingDepartmentId,
    submittingDepartmentName: application.submittingDepartmentName,
    surgeryName: application.submittingDepartmentName ?? null,
    transportOrderId: order?.id ?? null,
  };
}

export function mapPendingSpecimenItem(
  specimen: RawSpecimen,
): PendingSpecimenItem {
  const application = getApplicationById(specimen.applicationId);
  const order = getTransportOrderBySpecimenId(specimen.id);
  const batchMetrics = order ? buildTransportOrderBatchMetrics(order) : null;

  return {
    abnormalFlag: isSpecimenAbnormal(specimen),
    abnormalType: resolveSpecimenAbnormalType(specimen),
    applicationId: application.id,
    applicationNo: application.applicationNo,
    batchAbnormalFlag: batchMetrics?.batchAbnormalFlag ?? false,
    barcode: specimen.barcode ?? '',
    checkInStatus: resolveSpecimenCheckInStatus(specimen),
    checkedInAt: specimen.checkedInAt ?? null,
    checkedInByName: specimen.checkedInByName ?? null,
    containerCount: specimen.containerCount,
    containerName: specimen.containerName,
    fixationCompletedAt: specimen.fixationCompletedAt,
    fixationLiquidType: specimen.fixationLiquidType,
    fixationOperatorName: specimen.fixationOperatorName ?? null,
    fixationOperatorUserId: specimen.fixationOperatorUserId ?? null,
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
  if (
    specimen.receiptStatus === 'REJECTED' ||
    specimen.receiptStatus === 'RETURNED'
  ) {
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
  const rejectedCount = specimens.filter(
    (item) => item.receiptStatus === 'REJECTED',
  ).length;
  const returnedCount = specimens.filter(
    (item) => item.receiptStatus === 'RETURNED',
  ).length;
  const qualityFailedCount = specimens.filter(
    (item) => item.qualityCheckResult === 'FAILED',
  ).length;
  const unreceivedCount = specimens.filter(
    (item) => item.receiptStatus !== 'RECEIVED',
  ).length;
  if (
    rejectedCount === 0 &&
    returnedCount === 0 &&
    qualityFailedCount === 0 &&
    unreceivedCount === 0
  ) {
    return null;
  }
  return `拒收 ${rejectedCount}，退回 ${returnedCount}，质控失败 ${qualityFailedCount}，未接收 ${unreceivedCount}`;
}

function buildTransportOrderBatchMetrics(order: RawTransportOrder) {
  const specimens = order.specimenIds
    .map((specimenId) => state.specimens.find((item) => item.id === specimenId))
    .filter(isPresent);
  const reminderCount = specimens.filter((item) =>
    isSpecimenAbnormal(item),
  ).length;
  const unreceivedCount = specimens.filter(
    (item) => item.receiptStatus !== 'RECEIVED',
  ).length;
  const batchAbnormalFlag =
    specimens.some((item) => isSpecimenAbnormal(item)) ||
    order.status === 'PARTIALLY_RECEIVED';

  return {
    batchAbnormalFlag,
    reminderCount,
    unreceivedCount,
  };
}

export function mapTransportOrderView(
  order: RawTransportOrder,
): TransportOrderView {
  return {
    applicationId: order.applicationId,
    handedOverAt: order.handedOverAt,
    handoverUserName: order.handoverUserName,
    id: order.id,
    outboundUserId: order.outboundUserId ?? null,
    outboundUserName: order.outboundUserName ?? null,
    receiverUserName: order.receiverUserName,
    status: order.status,
    toBeTransportedAt: order.toBeTransportedAt,
    transportOrderNo: order.transportOrderNo,
  };
}

export function mapPendingTransportOrderItem(
  order: RawTransportOrder,
): PendingTransportOrderItem {
  const application = getApplicationById(order.applicationId);
  const batchMetrics = buildTransportOrderBatchMetrics(order);
  const specimenBarcodes = order.specimenIds
    .map(
      (specimenId) =>
        state.specimens.find((item) => item.id === specimenId)?.barcode ?? '',
    )
    .filter(isPresent);

  return {
    applicationId: application.id,
    applicationNo: application.applicationNo,
    batchAbnormalFlag: batchMetrics.batchAbnormalFlag,
    handedOverAt: order.handedOverAt,
    handoverDepartmentName: order.handoverDepartmentName,
    id: order.id,
    outboundUserId: order.outboundUserId ?? null,
    outboundUserName: order.outboundUserName ?? null,
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
  if (
    specimens.some(
      (item) =>
        item.fixationStatus === 'COMPLETED' || item.fixationStatus === 'FIXING',
    )
  ) {
    return 'FIXATION';
  }
  if (
    specimens.some(
      (item) => resolveSpecimenVerificationStatus(item) === 'VERIFIED',
    )
  ) {
    return 'VERIFICATION';
  }
  if (
    specimens.some(
      (item) => resolveSpecimenVerificationStatus(item) === 'VERIFYING',
    )
  ) {
    return 'VERIFICATION';
  }
  return 'REGISTERED';
}

function resolveApplicationStatus(
  application: RawApplication,
  specimens: RawSpecimen[],
) {
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
  if (
    specimens.some(
      (item) =>
        item.fixationStatus === 'COMPLETED' || item.fixationStatus === 'FIXING',
    )
  ) {
    return 'SUBMITTED';
  }
  return 'SUBMITTED';
}

export function updateApplicationFromSpecimens(applicationId: string) {
  const application = getApplicationById(applicationId);
  const specimens = getSpecimensByApplicationId(applicationId);
  application.currentNode = resolveApplicationCurrentNode(specimens);
  application.status = resolveApplicationStatus(application, specimens);
  application.updatedAt = createTimestamp();
}

export function mapApplicationListItem(
  application: RawApplication,
): ApplicationListItem {
  const specimens = getSpecimensByApplicationId(application.id);
  const latestRegisteredSpecimen = specimens.toSorted((left, right) =>
    compareNullableDateDesc(left.registeredAt, right.registeredAt),
  )[0];
  const operationState = resolveApplicationOperationState(application);

  return {
    abnormalFlag: specimens.some((item) => isSpecimenAbnormal(item)),
    applicationDate: application.applicationDate,
    applicationFormStatus: application.applicationFormStatus,
    applicationNo: application.applicationNo,
    applicationType: application.applicationType,
    createdAt: application.createdAt,
    currentNode:
      application.status === 'VOIDED'
        ? 'VOIDED'
        : resolveApplicationCurrentNode(specimens),
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
    .toSorted((left, right) =>
      compareNullableDateDesc(left.eventTime, right.eventTime),
    );
}

export function mapApplicationTrackingView(
  application: RawApplication,
): TrackingQueryView {
  const specimens = getSpecimensByApplicationId(application.id).toSorted(
    (left, right) =>
      compareNullableDateDesc(left.registeredAt, right.registeredAt),
  );
  const fixationCompletedAt =
    specimens
      .map((item) => item.fixationCompletedAt)
      .filter(isPresent)
      .toSorted(compareNullableDateDesc)[0] ?? null;
  const specimenConfirmedAt =
    specimens
      .map((item) => item.specimenConfirmedAt)
      .filter(isPresent)
      .toSorted(compareNullableDateDesc)[0] ?? null;
  const recentEvents = getApplicationEvents(application.id);
  const operationState = resolveApplicationOperationState(application);

  return {
    ...application,
    abnormalFlag: specimens.some((item) => isSpecimenAbnormal(item)),
    currentNode:
      application.status === 'VOIDED'
        ? 'VOIDED'
        : resolveApplicationCurrentNode(specimens),
    deletable: operationState.deletable,
    editable: operationState.editable,
    fixationCompletedAt,
    patientIdentifier:
      normalizeText(application.patientIdentifier) ||
      normalizeText(application.patientId) ||
      null,
    patientCheckStatus: application.patientCheckStatus ?? 'UNKNOWN',
    operationDisabledReason: operationState.operationDisabledReason,
    receiptAbnormalSummary: buildReceiptAbnormalSummary(specimens),
    recentEvents,
    reportIssued: application.reportIssued ?? false,
    reportStatus: application.reportStatus ?? null,
    specimenConfirmedAt,
    specimens: specimens.map((item) => mapSpecimenTrackingSummary(item)),
    status: resolveApplicationStatus(application, specimens),
    unreceivedCount: specimens.filter(
      (item) => item.receiptStatus !== 'RECEIVED',
    ).length,
    updatedAt: application.updatedAt,
    voided: operationState.voided,
  };
}

function getLatestRegistrationBatch(applicationId: string) {
  return (
    state.registrationBatches
      .filter((item) => item.applicationId === applicationId)
      .toSorted((left, right) =>
        compareNullableDateDesc(left.createdAt, right.createdAt),
      )[0] ?? null
  );
}

export function getLatestRegistrationResultInternal(
  applicationId: string,
): LatestSpecimenRegistrationResult {
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
    .filter(isPresent)
    .map((item) => mapSpecimenTrackingSummary(item));
  return {
    applicationId,
    labelPrintBatchNo: batch.labelPrintBatchNo,
    labelPrintMessage: batch.labelPrintMessage,
    labelPrintSuccess: batch.labelPrintSuccess,
    registrationSnapshot: batch.registrationSnapshot,
    specimens,
  };
}

export function refreshTransportOrderStatus(order: RawTransportOrder) {
  const specimens = order.specimenIds
    .map((specimenId) => state.specimens.find((item) => item.id === specimenId))
    .filter(isPresent);
  const allReceived =
    specimens.length > 0 &&
    specimens.every((item) => item.receiptStatus === 'RECEIVED');
  const hasProcessed = specimens.some((item) =>
    normalizeText(item.receiptStatus),
  );
  const hasPending = specimens.some(
    (item) => !normalizeText(item.receiptStatus),
  );

  if (allReceived) {
    order.status = 'COMPLETED';
    return;
  }
  if (hasProcessed || hasPending) {
    order.status = 'PARTIALLY_RECEIVED';
  }
}

export function createReceiptResult(
  applicationId: string,
): SpecimenReceiptResult {
  const application = getApplicationById(applicationId);
  const specimens = getSpecimensByApplicationId(applicationId);
  const relatedOrders = state.transportOrders.filter(
    (item) => item.applicationId === applicationId,
  );
  const batchMetrics = {
    batchAbnormalFlag: false,
    reminderCount: 0,
  };

  for (const order of relatedOrders) {
    const currentMetrics = buildTransportOrderBatchMetrics(order);
    batchMetrics.batchAbnormalFlag =
      batchMetrics.batchAbnormalFlag || currentMetrics.batchAbnormalFlag;
    batchMetrics.reminderCount += currentMetrics.reminderCount;
  }
  updateApplicationFromSpecimens(applicationId);

  return {
    batchAbnormalFlag: batchMetrics.batchAbnormalFlag,
    caseId: `CASE-${application.applicationNo.slice(-4)}`,
    pathologyNo: null,
    receiptAbnormalSummary: buildReceiptAbnormalSummary(specimens),
    receiptStatus:
      resolveApplicationStatus(application, specimens) ?? 'SUBMITTED',
    reminderCount: batchMetrics.reminderCount,
    unreceivedCount: specimens.filter(
      (item) => item.receiptStatus !== 'RECEIVED',
    ).length,
  };
}

export function resolveApplicationForLookup(applicationNo: string) {
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
