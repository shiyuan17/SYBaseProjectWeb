import type {
  PendingTransportOrderPage,
  PendingTransportOrderQuery,
  QuickSpecimenOutboundRequest,
  SpecimenOutboundListQuery,
  SpecimenOutboundPage,
  TransportOrderCreateRequest,
  TransportOrderHandoverRequest,
  TransportOrderOperatorRequest,
  TransportOrderOutboundRequest,
  TransportOrderView,
} from '../types/specimen-workflow';
import type { RawTransportOrder } from './specimen-workflow-mock-state';

import {
  compareNullableDateDesc,
  createNumericId,
  createTimestamp,
  normalizeText,
  paginateItems,
  withinDateRange,
} from '../utils/mock-support';
import {
  appendWorkflowEvent,
  assertSpecimenNotInReceiptTerminalState,
  findTransportOrderById,
  getActiveTransportOrderBySpecimenId,
  getApplicationById,
  getMockState,
  getTransportOrderBySpecimenId,
  isSpecimenCheckedIn,
  mapPendingTransportOrderItem,
  mapSpecimenOutboundItem,
  mapTransportOrderView,
  resetMockState,
  resolveMockOperatorContext,
  resolveSpecimenByIdentifier,
  resolveSpecimensBySpecimenNo,
  updateApplicationFromSpecimens,
} from './specimen-workflow-mock-core';

export { resetMockState };

function assertSpecimenTransportReady(specimenId: string) {
  const specimen = getMockState().specimens.find(
    (item) => item.id === specimenId,
  );
  if (!specimen) {
    throw new Error(`未找到标本: ${specimenId}`);
  }
  assertSpecimenNotInReceiptTerminalState(specimen, '出库');
  if (specimen.specimenStatus === 'IN_TRANSIT') {
    throw new Error('标本已完成出库，无需重复操作');
  }
  if (specimen.fixationStatus !== 'COMPLETED') {
    throw new Error(`标本 ${specimen.specimenNo} 尚未固定完成`);
  }
  if (!specimen.specimenConfirmedAt) {
    throw new Error(`标本 ${specimen.specimenNo} 尚未完成标本确认`);
  }
  if (
    !isSpecimenCheckedIn(specimen) ||
    specimen.specimenStatus !== 'CHECKED_IN'
  ) {
    throw new Error(`标本 ${specimen.specimenNo} 尚未完成标本入库`);
  }
  return specimen;
}

async function listPendingTransportOrdersMock(
  params: PendingTransportOrderQuery,
): Promise<PendingTransportOrderPage> {
  const filteredItems = getMockState()
    .transportOrders.filter((item) => {
      const application = getApplicationById(item.applicationId);
      const matchesSpecimenNo =
        !normalizeText(params.specimenNo) ||
        item.specimenIds
          .map((specimenId) =>
            getMockState().specimens.find(
              (specimen) => specimen.id === specimenId,
            ),
          )
          .some((specimen) => specimen?.specimenNo === params.specimenNo);
      return (
        item.status !== 'COMPLETED' &&
        item.status !== 'CANCELLED' &&
        (!normalizeText(params.status) || item.status === params.status) &&
        (!normalizeText(params.applicationId) ||
          application.id === params.applicationId ||
          application.applicationNo === params.applicationId) &&
        matchesSpecimenNo &&
        (!normalizeText(params.departmentId) ||
          application.submittingDepartmentId === params.departmentId) &&
        withinDateRange(item.createdAt, params.dateFrom, params.dateTo)
      );
    })
    .toSorted((left, right) =>
      compareNullableDateDesc(left.createdAt, right.createdAt),
    )
    .map((item) => mapPendingTransportOrderItem(item));

  return paginateItems(filteredItems, params.page, params.size);
}

async function listSpecimenOutboundsMock(
  params: SpecimenOutboundListQuery,
): Promise<SpecimenOutboundPage> {
  const specimenNo = normalizeText(params.specimenNo);
  const exactSpecimenMatches = specimenNo
    ? resolveSpecimensBySpecimenNo(specimenNo)
    : [];
  const resolvedApplicationId =
    normalizeText(params.applicationId) ||
    (exactSpecimenMatches.length === 1
      ? (exactSpecimenMatches[0]?.applicationId ?? '')
      : '');
  const filteredItems = getMockState()
    .specimens.filter((item) => {
      const application = getApplicationById(item.applicationId);
      const order = getTransportOrderBySpecimenId(item.id);
      const isCheckedInCandidate =
        item.specimenStatus === 'CHECKED_IN' && isSpecimenCheckedIn(item);

      return resolvedApplicationId
        ? application.id === resolvedApplicationId
        : Boolean(order) || isCheckedInCandidate;
    })
    .toSorted((left, right) => {
      const leftOrder = getTransportOrderBySpecimenId(left.id);
      const rightOrder = getTransportOrderBySpecimenId(right.id);
      const leftOutboundAt = leftOrder?.handedOverAt ?? null;
      const rightOutboundAt = rightOrder?.handedOverAt ?? null;

      if (!leftOutboundAt && rightOutboundAt) {
        return -1;
      }
      if (leftOutboundAt && !rightOutboundAt) {
        return 1;
      }
      if (!leftOutboundAt && !rightOutboundAt) {
        return compareNullableDateDesc(
          left.latestTrackingAt ?? left.registeredAt,
          right.latestTrackingAt ?? right.registeredAt,
        );
      }
      return compareNullableDateDesc(leftOutboundAt, rightOutboundAt);
    })
    .map((item) => mapSpecimenOutboundItem(item));

  return paginateItems(filteredItems, params.page, params.size);
}

async function createTransportOrderMock(
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
    if (getActiveTransportOrderBySpecimenId(specimen.id)) {
      throw new Error(`标本 ${barcode} 已存在转运单`);
    }
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
      getMockState().transportOrders.map((item) => item.id),
    ),
    outboundUserId: null,
    outboundUserName: null,
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
    transportOrderNo: `TR-${eventTime.slice(0, 10).replaceAll('-', '')}-${String(getMockState().transportOrders.length + 1).padStart(3, '0')}`,
  };
  getMockState().transportOrders.push(order);

  specimenIds.forEach((specimenId) => {
    const specimen = getMockState().specimens.find(
      (item) => item.id === specimenId,
    );
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

async function printTransportOrderMock(
  transportOrderId: string,
  data: TransportOrderOperatorRequest,
): Promise<TransportOrderView> {
  const order = findTransportOrderById(transportOrderId);
  const eventTime = createTimestamp();
  const operator = resolveMockOperatorContext();
  order.status = 'PRINTED';
  order.printedAt = eventTime;
  order.terminalCode = data.terminalCode ?? order.terminalCode;
  order.specimenIds.forEach((specimenId) => {
    const specimen = getMockState().specimens.find(
      (item) => item.id === specimenId,
    );
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
      operatorName: operator.operatorName,
      sourceTerminal: data.terminalCode ?? null,
      specimenBarcode: specimen.barcode,
      specimenId: specimen.id,
      specimenNo: specimen.specimenNo,
    });
  });
  updateApplicationFromSpecimens(order.applicationId);
  return mapTransportOrderView(order);
}

async function handoverTransportOrderMock(
  transportOrderId: string,
  data: TransportOrderHandoverRequest,
): Promise<TransportOrderView> {
  const order = findTransportOrderById(transportOrderId);
  const eventTime = createTimestamp();
  const operator = resolveMockOperatorContext();
  order.status = 'HANDED_OVER';
  order.handedOverAt = eventTime;
  order.outboundUserId = operator.operatorUserId;
  order.outboundUserName = operator.operatorName;
  order.receiverUserId = data.receiverUserId ?? null;
  order.receiverUserName = data.receiverUserName;
  order.remarks = data.remarks ?? order.remarks;
  order.terminalCode = data.terminalCode ?? order.terminalCode;
  order.specimenIds.forEach((specimenId) => {
    const specimen = getMockState().specimens.find(
      (item) => item.id === specimenId,
    );
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
      operatorName: operator.operatorName,
      sourceTerminal: data.terminalCode ?? null,
      specimenBarcode: specimen.barcode,
      specimenId: specimen.id,
      specimenNo: specimen.specimenNo,
    });
  });
  updateApplicationFromSpecimens(order.applicationId);
  return mapTransportOrderView(order);
}

async function outboundTransportOrderMock(
  transportOrderId: string,
  data: TransportOrderOutboundRequest,
): Promise<TransportOrderView> {
  const order = findTransportOrderById(transportOrderId);
  const eventTime = createTimestamp();
  const operator = resolveMockOperatorContext({
    operatorName: data.outboundUserName,
    operatorUserId: data.outboundUserId,
  });
  order.status = 'HANDED_OVER';
  order.handedOverAt = eventTime;
  order.outboundUserId = operator.operatorUserId;
  order.outboundUserName = operator.operatorName;
  order.remarks = data.remarks ?? order.remarks;
  order.terminalCode = data.terminalCode ?? order.terminalCode;
  order.specimenIds.forEach((specimenId) => {
    const specimen = assertSpecimenTransportReady(specimenId);
    specimen.latestTrackingAt = eventTime;
    specimen.specimenStatus = 'IN_TRANSIT';
    appendWorkflowEvent({
      applicationId: order.applicationId,
      eventContent: `标本出库 ${order.transportOrderNo}`,
      eventStatus: 'SUCCESS',
      eventTime,
      eventType: 'HANDED_OVER',
      nodeCode: 'TRANSPORT',
      operatorName: operator.operatorName,
      sourceTerminal: data.terminalCode ?? null,
      specimenBarcode: specimen.barcode,
      specimenId: specimen.id,
      specimenNo: specimen.specimenNo,
    });
  });
  updateApplicationFromSpecimens(order.applicationId);
  return mapTransportOrderView(order);
}

async function quickOutboundSpecimenMock(
  data: QuickSpecimenOutboundRequest,
): Promise<TransportOrderView> {
  const specimens = resolveSpecimensBySpecimenNo(data.identifier);
  if (specimens.length === 0) {
    throw new Error(`未找到标本: ${data.identifier}`);
  }
  if (specimens.length > 1) {
    throw new Error(
      `标本流水号 ${data.identifier} 匹配到多条记录，无法自动出库`,
    );
  }

  const [specimen] = specimens;
  if (!specimen) {
    throw new Error(`未找到标本: ${data.identifier}`);
  }
  assertSpecimenTransportReady(specimen.id);

  const activeOrder = getActiveTransportOrderBySpecimenId(specimen.id);
  if (activeOrder) {
    return outboundTransportOrderMock(activeOrder.id, {
      outboundUserId: data.outboundUserId,
      outboundUserName: data.outboundUserName,
      remarks: data.remarks,
      terminalCode: data.terminalCode,
    });
  }

  const application = getApplicationById(specimen.applicationId);
  const createdOrder = await createTransportOrderMock({
    applicationId: specimen.applicationId,
    handoverDepartmentId: application.submittingDepartmentId ?? null,
    handoverDepartmentName: application.submittingDepartmentName ?? '',
    handoverUserId: null,
    handoverUserName: specimen.checkedInByName || data.outboundUserName,
    receiverDepartmentId: 'DEPT_PATH',
    receiverDepartmentName: '病理科',
    remarks: data.remarks ?? null,
    specimenBarcodes: [specimen.barcode],
    terminalCode: data.terminalCode ?? null,
  });
  return outboundTransportOrderMock(createdOrder.id, {
    outboundUserId: data.outboundUserId,
    outboundUserName: data.outboundUserName,
    remarks: data.remarks,
    terminalCode: data.terminalCode,
  });
}

export {
  createTransportOrderMock,
  handoverTransportOrderMock,
  listPendingTransportOrdersMock,
  listSpecimenOutboundsMock,
  outboundTransportOrderMock,
  printTransportOrderMock,
  quickOutboundSpecimenMock,
};
