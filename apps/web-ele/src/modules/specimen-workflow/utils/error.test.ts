import { describe, expect, it } from 'vitest';

import { getWorkflowPageErrorMessage } from './error';

describe('getWorkflowPageErrorMessage', () => {
  it('prefers flat error payload messages', () => {
    expect(
      getWorkflowPageErrorMessage({
        error: '条码不存在',
      }),
    ).toBe('条码不存在');
  });

  it('maps unauthorized responses to login guidance', () => {
    expect(
      getWorkflowPageErrorMessage({
        response: {
          status: 401,
        },
      }),
    ).toBe('登录状态已失效，请重新登录后再继续操作。');
  });

  it('maps forbidden responses to permission guidance', () => {
    expect(
      getWorkflowPageErrorMessage({
        code: 'FORBIDDEN',
      }),
    ).toBe('当前账号没有访问该工作流页面或操作该功能的权限。');
  });

  it('falls back to error.message when present', () => {
    expect(getWorkflowPageErrorMessage(new Error('网络超时'))).toBe('网络超时');
  });
});
