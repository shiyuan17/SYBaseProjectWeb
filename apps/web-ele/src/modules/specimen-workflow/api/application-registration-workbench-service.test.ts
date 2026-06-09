import { describe, expect, it } from 'vitest';

import {
  buildWorkbenchLookupRequestConfig,
  isWorkbenchLookupNotFoundError,
} from './application-registration-workbench-service';

describe('application-registration-workbench-service', () => {
  it('recognizes backend resource-not-found lookup errors', () => {
    expect(
      isWorkbenchLookupNotFoundError({
        code: 'RESOURCE_NOT_FOUND',
        error: '申请登记工作台记录不存在',
      }),
    ).toBe(true);
  });

  it('builds lookup request config without global error toast', () => {
    expect(
      buildWorkbenchLookupRequestConfig({
        keyword: ' 1122 ',
        queryType: 'APPLICATION_NO',
      }),
    ).toEqual({
      params: {
        keyword: '1122',
        queryType: 'APPLICATION_NO',
      },
      skipErrorMessage: true,
    });
  });

  it('recognizes axios 404 lookup errors', () => {
    expect(
      isWorkbenchLookupNotFoundError({
        response: {
          data: {
            code: 'RESOURCE_NOT_FOUND',
            message: '申请登记工作台记录不存在',
          },
          status: 404,
        },
      }),
    ).toBe(true);
  });

  it('does not treat unrelated errors as lookup misses', () => {
    expect(
      isWorkbenchLookupNotFoundError({
        code: 'INTERNAL_ERROR',
        error: '数据库异常',
      }),
    ).toBe(false);
  });
});
