import type {
  PendingTransportOrderPage,
  PendingTransportOrderQuery,
  QuickSpecimenOutboundRequest,
  SpecimenOutboundListQuery,
  SpecimenOutboundPage,
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
  listSpecimenOutboundsMock,
  outboundTransportOrderMock,
  quickOutboundSpecimenMock,
  printTransportOrderMock,
  USE_SPECIMEN_WORKFLOW_MOCK,
} from './specimen-workflow-mock-gateway';
import {
  type PendingTransportOrderPageResponse,
  type SpecimenOutboundPageResponse,
  mapPendingTransportOrderPageResponse,
  mapSpecimenOutboundPageResponse,
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

export async function listSpecimenOutbounds(
  params: SpecimenOutboundListQuery,
): Promise<SpecimenOutboundPage> {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return listSpecimenOutboundsMock(params);
  }
  const response = await requestClient.get<SpecimenOutboundPageResponse>(
    '/v1/specimen-outbounds',
    { params },
  );
  return mapSpecimenOutboundPageResponse(response);
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

export async function quickOutboundSpecimen(data: QuickSpecimenOutboundRequest) {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return quickOutboundSpecimenMock(data);
  }
  return requestClient.post<TransportOrderView>(
    '/v1/specimen-outbounds/quick-outbound',
    data,
  );
}
