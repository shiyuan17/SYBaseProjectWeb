import type {
  ApplicationListItem,
  LabelPrintRetryRequest,
  LabelPrintRetryResult,
  LatestSpecimenRegistrationResult,
  SpecimenManagementListPage,
  SpecimenManagementListQuery,
  SpecimenManagementListSummary,
  SpecimenRegisterRequest,
  SpecimenRegisterResult,
} from '../types/specimen-workflow';
import type { RawSpecimen } from './specimen-workflow-mock-state';

import {
  compareNullableDateDesc,
  createNumericId,
  createTimestamp,
  includesText,
  normalizeText,
  paginateItems,
  withinDateRange,
} from '../utils/mock-support';
import {
  appendWorkflowEvent,
  getApplicationById,
  getLatestRegistrationResultInternal,
  getMockState,
  getSpecimensByApplicationId,
  mapApplicationListItem,
  mapSpecimenManagementItem,
  mapSpecimenTrackingSummary,
  resolveMockOperatorContext,
  resolveApplicationForLookup,
  updateApplicationFromSpecimens,
} from './specimen-workflow-mock-core';

export async function registerSpecimensMock(
  data: SpecimenRegisterRequest,
): Promise<SpecimenRegisterResult> {
  const application = getApplicationById(data.applicationId);
  const createdAt = createTimestamp();
  const operator = resolveMockOperatorContext();
  const labelPrintBatchNo = `LB-${String(getMockState().registrationBatches.length + 1).padStart(3, '0')}`;
  const createdSpecimens = data.items.map((item, index) => {
    const specimenId = createNumericId(
      'SPEC',
      getMockState().specimens.map((specimen) => specimen.id),
    );
    const barcode =
      normalizeText(item.barcode) ||
      `BC-${application.id.slice(-3)}-${String(index + 1).padStart(2, '0')}-${getMockState().specimens.length + index + 1}`;
    const overriddenSpecimenNo = normalizeText(
      (item as { specimenNo?: string }).specimenNo,
    );
    const specimen: RawSpecimen = {
      applicationId: application.id,
      barcode,
      checkInStatus: 'NOT_CHECKED_IN',
      checkedInAt: null,
      checkedInByName: null,
      clinicalSymptom:
        item.clinicalSymptom ?? application.clinicalSymptom ?? null,
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
      receiptLogisticsStaffName: null,
      receiptReason: null,
      receiptRemarks: null,
      receiptStatus: null,
      registeredAt: createdAt,
      specimenConfirmedAt: null,
      specimenCount: item.specimenCount,
      specimenName: item.specimenNameStandardized,
      specimenNo:
        overriddenSpecimenNo ||
        `SP-${application.id.slice(-3)}-${String(getSpecimensByApplicationId(application.id).length + index + 1).padStart(2, '0')}`,
      specimenSite: item.specimenSite ?? application.specimenSite ?? null,
      specimenStatus: 'REGISTERED',
      specimenType: item.specimenType ?? null,
      verificationCompletedAt: null,
      verificationStartedAt: null,
      verificationStatus: 'UNVERIFIED',
    };
    getMockState().specimens.push(specimen);
    appendWorkflowEvent({
      applicationId: application.id,
      eventContent: '标本登记完成',
      eventStatus: 'SUCCESS',
      eventTime: createdAt,
      eventType: 'REGISTERED',
      nodeCode: 'SPECIMEN_COLLECTION',
      operatorName: operator.operatorName,
      sourceTerminal: data.terminalCode ?? null,
      specimenBarcode: specimen.barcode,
      specimenId: specimen.id,
      specimenNo: specimen.specimenNo,
    });
    return specimen;
  });

  getMockState().registrationBatches.push({
    applicationId: application.id,
    createdAt,
    labelPrintBatchNo,
    labelPrintMessage: '标签打印成功',
    labelPrintSuccess: true,
    registrationSnapshot: {
      collectionScene: data.collectionScene ?? null,
      operatorName: operator.operatorName,
      operatorUserId: operator.operatorUserId,
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
    specimens: createdSpecimens.map((item) => mapSpecimenTrackingSummary(item)),
  };
}

export async function retryLabelPrintMock(
  batchNo: string,
  data: LabelPrintRetryRequest,
): Promise<LabelPrintRetryResult> {
  const batch = getMockState().registrationBatches.find(
    (item) => item.labelPrintBatchNo === normalizeText(batchNo),
  );
  if (!batch) {
    throw new Error(`未找到标签批次: ${batchNo}`);
  }

  let successCount = 0;
  const eventTime = createTimestamp();
  const operator = resolveMockOperatorContext();

  batch.specimenIds.forEach((specimenId) => {
    const specimen = getMockState().specimens.find(
      (item) => item.id === specimenId,
    );
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
      operatorName: operator.operatorName,
      sourceTerminal: data.terminalCode ?? null,
      specimenBarcode: specimen.barcode,
      specimenId: specimen.id,
      specimenNo: specimen.specimenNo,
    });
  });
  const failedCount = batch.specimenIds.length - successCount;

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
  const filteredItems = getMockState()
    .specimens
    .map((item) => mapSpecimenManagementItem(item))
    .filter((item) => {
      const keyword = normalizeText(params.keyword);
      const matchesKeyword =
        !keyword ||
        includesText(item.applicationNo, keyword) ||
        includesText(item.patientName, keyword) ||
        includesText(item.specimenNo, keyword) ||
        includesText(item.barcode, keyword) ||
        includesText(item.specimenName, keyword);

      return (
        matchesKeyword &&
        (!normalizeText(params.applicationNo) ||
          item.applicationNo === params.applicationNo) &&
        (!normalizeText(params.departmentId) ||
          item.submittingDepartmentId === params.departmentId) &&
        (!normalizeText(params.buildingId) ||
          item.buildingId === params.buildingId) &&
        (!normalizeText(params.roomId) || item.roomId === params.roomId) &&
        (!normalizeText(params.barcodeBindingStatus) ||
          item.barcodeBindingStatus === params.barcodeBindingStatus) &&
        (!normalizeText(params.labelPrintStatus) ||
          item.labelPrintStatus === params.labelPrintStatus) &&
        (!normalizeText(params.specimenStatus) ||
          item.specimenStatus === params.specimenStatus) &&
        (params.abnormalFlag === undefined ||
          item.abnormalFlag === params.abnormalFlag) &&
        withinDateRange(item.registeredAt, params.dateFrom, params.dateTo)
      );
    })
    .toSorted((left, right) =>
      compareNullableDateDesc(left.latestTrackingAt, right.latestTrackingAt),
    );

  const summary: SpecimenManagementListSummary = {
    abnormalCount: filteredItems.filter((item) => item.abnormalFlag).length,
    labelPrintedCount: filteredItems.filter(
      (item) => item.labelPrintStatus === 'SUCCESS',
    ).length,
    pendingLabelCount: filteredItems.filter(
      (item) =>
        item.labelPrintStatus === 'PENDING' ||
        item.labelPrintStatus === 'FAILED',
    ).length,
    totalCount: filteredItems.length,
    unboundCount: filteredItems.filter(
      (item) => item.barcodeBindingStatus !== 'BOUND',
    ).length,
  };

  return {
    ...paginateItems(filteredItems, params.page, params.size),
    summary,
  };
}
