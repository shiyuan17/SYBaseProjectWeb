import type {
  OperatorVerificationRequest,
  OperatorVerificationResponse,
} from '../../types/specimen-workflow';

import { requestClient } from '#/api/request';

import { USE_SPECIMEN_WORKFLOW_MOCK } from './specimen-workflow-mock-gateway';

export async function verifyOperatorCredential(
  data: OperatorVerificationRequest,
): Promise<OperatorVerificationResponse> {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return {
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      loginName: data.loginName,
      operatorName: data.operatorName,
      operatorUserId: data.operatorUserId,
      operatorVerificationToken: `mock-operator-verification:${data.operatorUserId}`,
    };
  }

  return requestClient.post<OperatorVerificationResponse>(
    '/v1/operator-verifications',
    data,
  );
}
