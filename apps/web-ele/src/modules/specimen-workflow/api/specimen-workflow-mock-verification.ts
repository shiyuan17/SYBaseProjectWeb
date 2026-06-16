import type {
  ApplicationFormReprintRequest,
  DirectSpecimenReceiptRequest,
  FixationResult,
  PendingSpecimenPage,
  PendingSpecimenQuery,
  SpecimenBarcodeBindingRequest,
  SpecimenCheckInRequest,
  SpecimenConfirmRequest,
  SpecimenFixationRequest,
  SpecimenReceiptRequest,
  SpecimenReceiptResult,
  SpecimenRemovalConfirmRequest,
  SpecimenRemovalConfirmResult,
  SpecimenRemovalPage,
  SpecimenRemovalQuery,
  SpecimenRemovalQuickConfirmRequest,
  SpecimenRemovalSummary,
  SpecimenTrackingSummary,
  SpecimenVerificationRecord,
  SpecimenVerificationRequest,
} from '../types/specimen-workflow';

import {
  compareNullableDateDesc,
  createTimestamp,
  includesText,
  normalizeText,
  paginateItems,
  withinDateRange,
} from '../utils/mock-support';
import {
  appendVerificationRecord,
  appendWorkflowEvent,
  applySpecimenRemovalConfirmation,
  assertSpecimenNotInReceiptTerminalState,
  createReceiptResult,
  findTransportOrderById,
  getApplicationById,
  getMockState,
  getTransportOrderBySpecimenId,
  isSpecimenAbnormal,
  isSpecimenCheckedIn,
  isSpecimenInReceiptTerminalState,
  isSpecimenVerified,
  mapPendingSpecimenItem,
  mapSpecimenRemovalItem,
  mapSpecimenTrackingSummary,
  refreshTransportOrderStatus,
  resolveMockOperatorContext,
  resolveSpecimenByBarcode,
  resolveSpecimenByIdentifier,
  resolveSpecimenByPreferredIdentifier,
  resolveSpecimenCheckInStatus,
  resolveSpecimensBySpecimenNo,
  resolveSpecimenVerificationStatus,
  updateApplicationFromSpecimens,
} from './specimen-workflow-mock-core';

export async function listPendingFixationsMock(
  params: PendingSpecimenQuery,
): Promise<PendingSpecimenPage> {
  const filteredItems = getMockState()
    .specimens.filter((item) => {
      const application = getApplicationById(item.applicationId);
      const hasTransportOrder = Boolean(getTransportOrderBySpecimenId(item.id));
      return (
        !hasTransportOrder &&
        !isSpecimenInReceiptTerminalState(item) &&
        (!normalizeText(params.applicationId) ||
          application.id === params.applicationId ||
          application.applicationNo === params.applicationId) &&
        (!normalizeText(params.specimenNo) ||
          item.specimenNo === params.specimenNo) &&
        (!normalizeText(params.departmentId) ||
          application.submittingDepartmentId === params.departmentId) &&
        (!normalizeText(params.fixationStatus) ||
          item.fixationStatus === params.fixationStatus) &&
        (!normalizeText(params.verificationStatus) ||
          resolveSpecimenVerificationStatus(item) ===
            params.verificationStatus) &&
        (!normalizeText(params.checkInStatus) ||
          resolveSpecimenCheckInStatus(item) === params.checkInStatus) &&
        withinDateRange(item.registeredAt, params.dateFrom, params.dateTo)
      );
    })
    .toSorted((left, right) =>
      compareNullableDateDesc(left.registeredAt, right.registeredAt),
    )
    .map((item) => mapPendingSpecimenItem(item));

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
  const operator = resolveMockOperatorContext();
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
    operatorName: operator.operatorName,
    sourceTerminal: data.terminalCode ?? null,
    specimenBarcode: specimen.barcode,
    specimenId: specimen.id,
    specimenNo: specimen.specimenNo,
  });
  appendVerificationRecord({
    applicationId: specimen.applicationId,
    barcode: normalizeText(specimen.barcode),
    operatorName: operator.operatorName,
    operatorUserId: operator.operatorUserId,
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
  const operator = resolveMockOperatorContext();
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
    operatorName: operator.operatorName,
    sourceTerminal: data.terminalCode ?? null,
    specimenBarcode: specimen.barcode,
    specimenId: specimen.id,
    specimenNo: specimen.specimenNo,
  });
  appendVerificationRecord({
    applicationId: specimen.applicationId,
    barcode: normalizeText(specimen.barcode),
    operatorName: operator.operatorName,
    operatorUserId: operator.operatorUserId,
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
  const specimen = resolveSpecimenByPreferredIdentifier(data);
  assertSpecimenNotInReceiptTerminalState(specimen, '开始固定');
  if (!isSpecimenVerified(specimen)) {
    throw new Error(`标本 ${specimen.barcode} 尚未完成核对`);
  }
  if (specimen.fixationStatus !== 'PENDING') {
    throw new Error(`标本 ${specimen.barcode} 当前状态不允许开始固定`);
  }
  const eventTime = createTimestamp();
  const operator = resolveMockOperatorContext();
  specimen.fixationStatus = 'FIXING';
  specimen.fixationStartedAt = eventTime;
  specimen.fixationLiquidType =
    data.fixationLiquidType ?? specimen.fixationLiquidType;
  specimen.specimenStatus = 'FIXING';
  specimen.latestTrackingAt = eventTime;
  appendWorkflowEvent({
    applicationId: specimen.applicationId,
    eventContent: '开始固定',
    eventStatus: 'SUCCESS',
    eventTime,
    eventType: 'STARTED',
    nodeCode: 'FIXATION',
    operatorName: operator.operatorName,
    sourceTerminal: data.terminalCode ?? null,
    specimenBarcode: specimen.barcode,
    specimenId: specimen.id,
    specimenNo: specimen.specimenNo,
  });
  appendVerificationRecord({
    applicationId: specimen.applicationId,
    barcode: normalizeText(specimen.barcode),
    operatorName: operator.operatorName,
    operatorUserId: operator.operatorUserId,
    remarks: data.remarks ?? '开始固定',
    result: 'SUCCESS',
    specimenId: specimen.id,
    terminalCode: data.terminalCode ?? null,
    verificationType: 'FIXATION_START',
    verifiedAt: eventTime,
  });
  updateApplicationFromSpecimens(specimen.applicationId);
  return {
    barcode: normalizeText(specimen.barcode),
    fixationCompletedAt: specimen.fixationCompletedAt,
    fixationLiquidType: specimen.fixationLiquidType,
    operatorName: operator.operatorName,
    operatorUserId: operator.operatorUserId,
    fixationStatus: specimen.fixationStatus ?? 'FIXING',
    specimenId: specimen.id,
  };
}

export async function completeFixationMock(
  data: SpecimenFixationRequest,
): Promise<FixationResult> {
  const specimen = resolveSpecimenByPreferredIdentifier(data);
  assertSpecimenNotInReceiptTerminalState(specimen, '完成固定');
  if (!isSpecimenVerified(specimen)) {
    throw new Error(`标本 ${specimen.barcode} 尚未完成核对`);
  }
  if (specimen.fixationStatus === 'COMPLETED') {
    throw new Error(`标本 ${specimen.barcode} 已完成固定`);
  }
  if (
    specimen.fixationStatus !== 'FIXING' &&
    specimen.fixationStatus !== 'PENDING'
  ) {
    throw new Error(`标本 ${specimen.barcode} 当前状态不允许完成固定`);
  }
  const eventTime = createTimestamp();
  const operator = resolveMockOperatorContext();
  specimen.fixationStatus = 'COMPLETED';
  specimen.fixationStartedAt = specimen.fixationStartedAt ?? eventTime;
  specimen.fixationCompletedAt = eventTime;
  specimen.fixationLiquidType =
    data.fixationLiquidType ?? specimen.fixationLiquidType;
  specimen.fixationOperatorName = operator.operatorName;
  specimen.fixationOperatorUserId = operator.operatorUserId;
  specimen.specimenStatus = 'FIXED';
  specimen.latestTrackingAt = eventTime;
  appendWorkflowEvent({
    applicationId: specimen.applicationId,
    eventContent: '固定完成',
    eventStatus: 'SUCCESS',
    eventTime,
    eventType: 'COMPLETED',
    nodeCode: 'FIXATION',
    operatorName: operator.operatorName,
    sourceTerminal: data.terminalCode ?? null,
    specimenBarcode: specimen.barcode,
    specimenId: specimen.id,
    specimenNo: specimen.specimenNo,
  });
  appendVerificationRecord({
    applicationId: specimen.applicationId,
    barcode: normalizeText(specimen.barcode),
    operatorName: operator.operatorName,
    operatorUserId: operator.operatorUserId,
    remarks: data.remarks ?? '固定完成',
    result: 'SUCCESS',
    specimenId: specimen.id,
    terminalCode: data.terminalCode ?? null,
    verificationType: 'FIXATION_COMPLETE',
    verifiedAt: eventTime,
  });
  updateApplicationFromSpecimens(specimen.applicationId);
  return {
    barcode: normalizeText(specimen.barcode),
    fixationCompletedAt: specimen.fixationCompletedAt,
    fixationLiquidType: specimen.fixationLiquidType,
    operatorName: specimen.fixationOperatorName,
    operatorUserId: specimen.fixationOperatorUserId,
    fixationStatus: specimen.fixationStatus ?? 'COMPLETED',
    specimenId: specimen.id,
  };
}

export async function listPendingSpecimenRemovalsMock(
  params: SpecimenRemovalQuery,
): Promise<SpecimenRemovalPage> {
  const filteredItems = getMockState()
    .specimens.filter((item) => {
      const application = getApplicationById(item.applicationId);
      const keyword = normalizeText(params.keyword);
      const matchesKeyword =
        !keyword ||
        includesText(application.applicationNo, keyword) ||
        includesText(application.patientName, keyword) ||
        includesText(item.specimenNo, keyword) ||
        includesText(item.barcode, keyword) ||
        includesText(item.specimenName, keyword);

      return (
        matchesKeyword &&
        (!normalizeText(params.applicationNo) ||
          application.applicationNo === params.applicationNo) &&
        (!normalizeText(params.departmentId) ||
          application.submittingDepartmentId === params.departmentId) &&
        (!normalizeText(params.specimenStatus) ||
          item.specimenStatus === params.specimenStatus) &&
        (params.abnormalFlag === undefined ||
          isSpecimenAbnormal(item) === params.abnormalFlag) &&
        withinDateRange(item.registeredAt, params.dateFrom, params.dateTo)
      );
    })
    .toSorted((left, right) =>
      compareNullableDateDesc(
        left.specimenRemovalAt ?? left.registeredAt,
        right.specimenRemovalAt ?? right.registeredAt,
      ),
    )
    .map((item) => mapSpecimenRemovalItem(item));

  const summary: SpecimenRemovalSummary = {
    abnormalCount: filteredItems.filter((item) => item.abnormalFlag).length,
    confirmedCount: filteredItems.filter((item) =>
      Boolean(item.specimenRemovalAt),
    ).length,
    pendingCount: filteredItems.filter((item) => !item.specimenRemovalAt)
      .length,
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
  return applySpecimenRemovalConfirmation(
    resolveSpecimenByBarcode(data.specimenBarcode),
    data,
  );
}

export async function confirmSpecimenRemovalByIdentifierMock(
  data: SpecimenRemovalQuickConfirmRequest,
): Promise<SpecimenRemovalConfirmResult> {
  if (data.identifierType === 'BARCODE') {
    return applySpecimenRemovalConfirmation(
      resolveSpecimenByBarcode(data.identifier),
      data,
    );
  }
  const matchedSpecimens = resolveSpecimensBySpecimenNo(data.identifier);
  if (matchedSpecimens.length === 0) {
    throw new Error('未找到对应标本');
  }
  if (matchedSpecimens.length > 1) {
    throw new Error('标本流水号对应多条记录，无法自动确认');
  }
  const matchedSpecimen = matchedSpecimens[0];
  if (!matchedSpecimen) {
    throw new Error('未找到对应标本');
  }
  return applySpecimenRemovalConfirmation(matchedSpecimen, data);
}

export async function listPendingReceiptsMock(
  params: PendingSpecimenQuery,
): Promise<PendingSpecimenPage> {
  const filteredItems = getMockState()
    .specimens.filter((item) => {
      const application = getApplicationById(item.applicationId);
      const order = getTransportOrderBySpecimenId(item.id);
      if (
        !order ||
        !['HANDED_OVER', 'PARTIALLY_RECEIVED'].includes(order.status)
      ) {
        return false;
      }
      if (normalizeText(item.receiptStatus)) {
        return false;
      }
      return (
        (!normalizeText(params.applicationId) ||
          application.id === params.applicationId ||
          application.applicationNo === params.applicationId) &&
        (!normalizeText(params.departmentId) ||
          application.submittingDepartmentId === params.departmentId) &&
        withinDateRange(order.createdAt, params.dateFrom, params.dateTo)
      );
    })
    .toSorted((left, right) =>
      compareNullableDateDesc(left.latestTrackingAt, right.latestTrackingAt),
    )
    .map((item) => mapPendingSpecimenItem(item));

  return paginateItems(filteredItems, params.page, params.size);
}

export async function receiveSpecimensMock(
  data: SpecimenReceiptRequest,
): Promise<SpecimenReceiptResult> {
  const order = findTransportOrderById(data.transportOrderId);
  const eventTime = createTimestamp();

  data.items.forEach((item) => {
    const specimen = resolveSpecimenByPreferredIdentifier(item);
    if (!order.specimenIds.includes(specimen.id)) {
      throw new Error(
        `标本 ${item.specimenId ?? item.specimenBarcode ?? item.specimenNo} 不属于转运单 ${order.transportOrderNo}`,
      );
    }
    specimen.containerCount = item.containerCount ?? specimen.containerCount;
    specimen.qualityCheckResult = item.qualityCheckResult;
    specimen.qualityIssueCodes = [...(item.qualityIssueCodes ?? [])];
    specimen.receiptLogisticsStaffName = data.logisticsStaffName;
    specimen.receiptStatus = item.receiptStatus;
    specimen.receiptReason = item.reason ?? null;
    specimen.receiptRemarks = item.remarks ?? null;
    specimen.latestTrackingAt = eventTime;
    specimen.specimenStatus =
      item.receiptStatus === 'RECEIVED' ? 'RECEIVED' : item.receiptStatus;
    appendWorkflowEvent({
      applicationId: specimen.applicationId,
      eventContent:
        item.receiptStatus === 'RECEIVED' ? '标本接收完成' : '标本接收异常',
      eventStatus: item.receiptStatus,
      eventTime,
      eventType: item.receiptStatus,
      nodeCode:
        item.receiptStatus === 'RECEIVED' ? 'RECEPTION' : 'PARTIALLY_RECEIVED',
      operatorName: data.receivedByName,
      sourceTerminal: data.terminalCode ?? null,
      specimenBarcode: specimen.barcode,
      specimenId: specimen.id,
      specimenNo: specimen.specimenNo,
    });
    if (
      item.qualityCheckResult === 'FAILED' ||
      item.receiptStatus !== 'RECEIVED'
    ) {
      appendVerificationRecord({
        applicationId: specimen.applicationId,
        barcode: normalizeText(specimen.barcode),
        operatorName: data.receivedByName,
        operatorUserId: data.receivedByUserId ?? null,
        remarks: item.reason ?? item.remarks ?? '接收异常核对',
        result:
          item.qualityCheckResult === 'FAILED' ? 'FAILED' : item.receiptStatus,
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
    const specimen = resolveSpecimenByPreferredIdentifier(item);
    specimen.containerCount = item.containerCount ?? specimen.containerCount;
    specimen.qualityCheckResult = item.qualityCheckResult;
    specimen.qualityIssueCodes = [...(item.qualityIssueCodes ?? [])];
    specimen.receiptStatus = item.receiptStatus;
    specimen.receiptReason = item.reason ?? null;
    specimen.receiptRemarks = item.remarks ?? null;
    specimen.latestTrackingAt = eventTime;
    specimen.specimenStatus =
      item.receiptStatus === 'RECEIVED' ? 'RECEIVED' : item.receiptStatus;
    touchedApplications.add(specimen.applicationId);
    appendWorkflowEvent({
      applicationId: specimen.applicationId,
      eventContent: '按条码直接接收标本',
      eventStatus: item.receiptStatus,
      eventTime,
      eventType: 'DIRECT_RECEIVE',
      nodeCode:
        item.receiptStatus === 'RECEIVED' ? 'RECEPTION' : 'PARTIALLY_RECEIVED',
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

  getMockState()
    .transportOrders.filter((item) => item.applicationId === applicationId)
    .forEach((item) => refreshTransportOrderStatus(item));
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
  const operator = resolveMockOperatorContext();
  const previousBarcode = specimen.barcode;
  specimen.previousBarcodes = previousBarcode
    ? [...specimen.previousBarcodes, previousBarcode]
    : [...specimen.previousBarcodes];
  specimen.barcode = data.targetBarcode.trim();
  specimen.latestTrackingAt = eventTime;
  appendWorkflowEvent({
    applicationId: specimen.applicationId,
    eventContent: `绑定条码 ${specimen.barcode}`,
    eventStatus: 'SUCCESS',
    eventTime,
    eventType: 'PRINTED',
    nodeCode: 'LABEL_PRINT',
    operatorName: operator.operatorName,
    sourceTerminal: data.terminalCode ?? null,
    specimenBarcode: specimen.barcode,
    specimenId: specimen.id,
    specimenNo: specimen.specimenNo,
  });
  appendVerificationRecord({
    applicationId: specimen.applicationId,
    barcode: normalizeText(specimen.barcode),
    operatorName: operator.operatorName,
    operatorUserId: operator.operatorUserId,
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
  const oldBarcode = normalizeText(specimen.barcode);
  const eventTime = createTimestamp();
  const operator = resolveMockOperatorContext();
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
    operatorName: operator.operatorName,
    sourceTerminal: data.terminalCode ?? null,
    specimenBarcode: specimen.barcode,
    specimenId: specimen.id,
    specimenNo: specimen.specimenNo,
  });
  appendVerificationRecord({
    applicationId: specimen.applicationId,
    barcode: normalizeText(specimen.barcode),
    operatorName: operator.operatorName,
    operatorUserId: operator.operatorUserId,
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

export async function unbindSpecimenBarcodeMock(
  identifier: string,
  data: Pick<SpecimenBarcodeBindingRequest, 'remarks' | 'terminalCode'>,
): Promise<SpecimenTrackingSummary> {
  const specimen = resolveSpecimenByIdentifier(identifier);
  assertSpecimenNotInReceiptTerminalState(specimen, '取消绑定条码');
  if (!normalizeText(specimen.barcode)) {
    throw new Error(`标本 ${specimen.specimenNo} 当前未绑定条码`);
  }

  const operator = resolveMockOperatorContext();
  const oldBarcode = normalizeText(specimen.barcode);
  const eventTime = createTimestamp();
  specimen.previousBarcodes = oldBarcode
    ? [...new Set([...specimen.previousBarcodes, oldBarcode])]
    : [...specimen.previousBarcodes];
  specimen.barcode = '';
  specimen.latestTrackingAt = eventTime;
  appendWorkflowEvent({
    applicationId: specimen.applicationId,
    eventContent: `取消条码绑定 ${oldBarcode}`,
    eventStatus: 'SUCCESS',
    eventTime,
    eventType: 'UNBOUND',
    nodeCode: 'LABEL_PRINT',
    operatorName: operator.operatorName,
    sourceTerminal: data.terminalCode ?? null,
    specimenBarcode: oldBarcode,
    specimenId: specimen.id,
    specimenNo: specimen.specimenNo,
  });
  appendVerificationRecord({
    applicationId: specimen.applicationId,
    barcode: oldBarcode,
    operatorName: operator.operatorName,
    operatorUserId: operator.operatorUserId,
    remarks: data.remarks ?? '取消条码绑定',
    result: 'SUCCESS',
    specimenId: specimen.id,
    terminalCode: data.terminalCode ?? null,
    verificationType: 'BARCODE_UNBIND',
    verifiedAt: eventTime,
  });
  updateApplicationFromSpecimens(specimen.applicationId);
  return mapSpecimenTrackingSummary(specimen);
}

export async function confirmSpecimenMock(
  identifier: string,
  data: SpecimenConfirmRequest,
): Promise<SpecimenTrackingSummary> {
  const specimen = resolveSpecimenByPreferredIdentifier({
    specimenBarcode: data.specimenBarcode ?? identifier,
    specimenId: data.specimenId,
    specimenNo: data.specimenNo,
  });
  assertSpecimenNotInReceiptTerminalState(specimen, '标本确认');
  if (specimen.fixationStatus !== 'COMPLETED') {
    throw new Error(`标本 ${specimen.barcode} 需在固定完成后才能确认`);
  }
  if (specimen.specimenConfirmedAt) {
    throw new Error(`标本 ${specimen.barcode} 已完成确认`);
  }
  const eventTime = createTimestamp();
  const operator = resolveMockOperatorContext(data);
  specimen.specimenConfirmedAt = eventTime;
  specimen.specimenConfirmedByName = operator.operatorName;
  specimen.specimenConfirmedByUserId = operator.operatorUserId;
  specimen.latestTrackingAt = eventTime;
  specimen.specimenStatus = 'VERIFIED';
  appendWorkflowEvent({
    applicationId: specimen.applicationId,
    eventContent: '标本确认完成',
    eventStatus: 'SUCCESS',
    eventTime,
    eventType: 'COMPLETED',
    nodeCode: 'CONFIRMATION',
    operatorName: operator.operatorName,
    sourceTerminal: data.terminalCode ?? null,
    specimenBarcode: specimen.barcode,
    specimenId: specimen.id,
    specimenNo: specimen.specimenNo,
  });
  appendVerificationRecord({
    applicationId: specimen.applicationId,
    barcode: normalizeText(specimen.barcode),
    operatorName: operator.operatorName,
    operatorUserId: operator.operatorUserId,
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
  const specimen = resolveSpecimenByPreferredIdentifier({
    specimenBarcode: data.specimenBarcode ?? identifier,
    specimenId: data.specimenId,
    specimenNo: data.specimenNo,
  });
  assertSpecimenNotInReceiptTerminalState(specimen, '标本入库');
  if (!specimen.specimenConfirmedAt) {
    throw new Error(`标本 ${specimen.barcode} 需在确认后才能入库`);
  }
  if (isSpecimenCheckedIn(specimen)) {
    throw new Error(`标本 ${specimen.barcode} 已完成入库`);
  }

  const eventTime = createTimestamp();
  const operator = resolveMockOperatorContext(data);
  specimen.checkInStatus = 'CHECKED_IN';
  specimen.checkedInAt = eventTime;
  specimen.checkedInByName = operator.operatorName;
  specimen.latestTrackingAt = eventTime;
  specimen.specimenStatus = 'CHECKED_IN';
  appendWorkflowEvent({
    applicationId: specimen.applicationId,
    eventContent: '标本入库完成',
    eventStatus: 'SUCCESS',
    eventTime,
    eventType: 'CHECKED_IN',
    nodeCode: 'CHECK_IN',
    operatorName: operator.operatorName,
    sourceTerminal: data.terminalCode ?? null,
    specimenBarcode: specimen.barcode,
    specimenId: specimen.id,
    specimenNo: specimen.specimenNo,
  });
  appendVerificationRecord({
    applicationId: specimen.applicationId,
    barcode: normalizeText(specimen.barcode),
    operatorName: operator.operatorName,
    operatorUserId: operator.operatorUserId,
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
  return getMockState()
    .verificationRecords.filter((item) => item.specimenId === specimen.id)
    .toSorted((left, right) =>
      compareNullableDateDesc(left.verifiedAt, right.verifiedAt),
    )
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
  const operator = resolveMockOperatorContext();
  application.updatedAt = eventTime;
  const event = appendWorkflowEvent({
    applicationId: application.id,
    eventContent: '补打印申请单',
    eventStatus: 'SUCCESS',
    eventTime,
    eventType: 'PRINTED',
    nodeCode: application.currentNode,
    operatorName: operator.operatorName,
    sourceTerminal: data.terminalCode ?? null,
    specimenBarcode: null,
    specimenId: null,
    specimenNo: null,
  });
  return event;
}
