import { describe, expect, it, vi } from 'vitest';

const { capturedErrorHandler, elMessageErrorMock } = vi.hoisted(() => {
  let handler:
    | ((
        msg: string,
        error?: { response?: { data?: Record<string, unknown> } },
      ) => void)
    | undefined;

  return {
    capturedErrorHandler: {
      get current() {
        return handler;
      },
      set current(
        next:
          | ((
              msg: string,
              error?: { response?: { data?: Record<string, unknown> } },
            ) => void)
          | undefined,
      ) {
        handler = next;
      },
    },
    elMessageErrorMock: vi.fn(),
  };
});

vi.mock('@vben/hooks', () => ({
  useAppConfig: () => ({
    apiURL: 'http://localhost:8080/api',
  }),
}));

vi.mock('@vben/preferences', () => ({
  preferences: {
    app: {
      locale: 'zh-CN',
      loginExpiredMode: 'modal',
    },
  },
}));

vi.mock('@vben/stores', () => ({
  useAccessStore: () => ({
    accessToken: 'token',
    isAccessChecked: true,
    setAccessToken: vi.fn(),
    setLoginExpired: vi.fn(),
  }),
}));

vi.mock('#/store', () => ({
  useAuthStore: () => ({
    logout: vi.fn(),
  }),
}));

vi.mock('element-plus', () => ({
  ElMessage: {
    error: elMessageErrorMock,
  },
}));

vi.mock('@vben/request', () => {
  class RequestClient {
    addRequestInterceptor() {}

    addResponseInterceptor(interceptor: unknown) {
      void interceptor;
    }
  }

  return {
    RequestClient,
    authenticateResponseInterceptor: vi.fn(() => ({ kind: 'auth' })),
    defaultResponseInterceptor: vi.fn(() => ({ kind: 'default' })),
    errorMessageResponseInterceptor: vi.fn(
      (
        handler: (
          msg: string,
          error?: { response?: { data?: Record<string, unknown> } },
        ) => void,
      ) => {
        capturedErrorHandler.current = handler;
        return { kind: 'error-message' };
      },
    ),
  };
});

describe('request error translation', () => {
  it('translates specimen workflow business errors before top-level message display', async () => {
    await import('./request');

    expect(capturedErrorHandler.current).toBeTypeOf('function');
    capturedErrorHandler.current?.('操作失败', {
      response: {
        data: {
          message:
            'All specimens of the application must complete verification, fixation, and confirmation before check-in',
        },
      },
    });

    expect(elMessageErrorMock).toHaveBeenCalledWith(
      '当前申请单下仍有标本未完成核对、固定或标本确认，不能入库。',
    );
  });
});
