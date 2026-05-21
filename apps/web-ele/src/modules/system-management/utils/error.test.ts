import { describe, expect, it } from 'vitest';

import { getSystemPageErrorMessage } from './error';

describe('getSystemPageErrorMessage', () => {
  it('prefers flat error payload messages', () => {
    expect(
      getSystemPageErrorMessage({
        message: '角色名称重复',
      }),
    ).toBe('数据加载失败：角色名称重复');
  });

  it('maps unauthorized responses to login guidance', () => {
    expect(
      getSystemPageErrorMessage({
        response: {
          status: 401,
        },
      }),
    ).toBe('登录状态已失效，请重新登录后再访问系统管理。');
  });

  it('maps forbidden responses to permission guidance', () => {
    expect(
      getSystemPageErrorMessage({
        response: {
          data: {
            code: 'FORBIDDEN',
          },
          status: 403,
        },
      }),
    ).toBe('当前账号没有访问该页面或功能的权限，请联系管理员配置角色授权。');
  });

  it('falls back to infrastructure guidance when no detail is present', () => {
    expect(getSystemPageErrorMessage({})).toBe(
      '数据加载失败：请检查后端服务和网络连接后重试。',
    );
  });
});
