import type {
  PendingTransportOrderPage,
  PendingTransportOrderQuery,
  TransportOrderCreateRequest,
  TransportOrderHandoverRequest,
  TransportOrderOutboundRequest,
  TransportOrderOperatorRequest,
  TransportOrderView,
} from '../../types/specimen-workflow';

import { requestClient } from '#/api/request';

import {
  createTransportOrderMock,
  handoverTransportOrderMock,
  listPendingTransportOrdersMock,
  outboundTransportOrderMock,
  printTransportOrderMock,
  USE_SPECIMEN_WORKFLOW_MOCK,
} from './specimen-workflow-mock-gateway';
import {
  type PendingTransportOrderPageResponse,
  mapPendingTransportOrderPageResponse,
} from './specimen-workflow-mappers';

export async function listPendingTransportOrders(
  params: PendingTransportOrderQuery,
): Promise<PendingTransportOrderPage> {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return listPendingTransportOrdersMock(params);
  }
  const response = await requestClient.get<PendingTransportOrderPageResponse>(
    '/v1/transport-orders/pending',
    { params },
  );
  return mapPendingTransportOrderPageResponse(response);
}

export async function createTransportOrder(data: TransportOrderCreateRequest) {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return createTransportOrderMock(data);
  }
  return requestClient.post<TransportOrderView>('/v1/transport-orders', data);
}

export async function printTransportOrder(
  transportOrderId: string,
  data: TransportOrderOperatorRequest,
) {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return printTransportOrderMock(transportOrderId, data);
  }
  return requestClient.post<TransportOrderView>(
    `/v1/transport-orders/${transportOrderId}/print`,
    data,
  );
}

export async function handoverTransportOrder(
  transportOrderId: string,
  data: TransportOrderHandoverRequest,
) {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return handoverTransportOrderMock(transportOrderId, data);
  }
  return requestClient.post<TransportOrderView>(
    `/v1/transport-orders/${transportOrderId}/handover`,
    data,
  );
}

export async function outboundTransportOrder(
  transportOrderId: string,
  data: TransportOrderOutboundRequest,
) {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return outboundTransportOrderMock(transportOrderId, data);
  }
  return requestClient.post<TransportOrderView>(
    `/v1/transport-orders/${transportOrderId}/outbound`,
    data,
  );
}
