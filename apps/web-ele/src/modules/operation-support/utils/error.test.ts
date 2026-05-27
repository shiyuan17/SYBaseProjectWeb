import { describe, expect, it } from 'vitest';

import { getOperationSupportPageErrorMessage } from './error';

describe('operation support error messages', () => {
  it('maps 409 archive position conflicts into user friendly messages', () => {
    expect(
      getOperationSupportPageErrorMessage({
        response: {
          data: {
            message: 'Archive position is not available',
          },
          status: 409,
        },
      }),
    ).toBe('所选柜位已被占用，请刷新柜位列表后重新选择。');

    expect(
      getOperationSupportPageErrorMessage({
        response: {
          data: {
            message: 'Archive cabinet is disabled',
          },
          status: 409,
        },
      }),
    ).toBe('归档柜已停用，当前柜位不可分配，请先启用归档柜。');
  });

  it('maps repeated borrow and return conflicts', () => {
    expect(
      getOperationSupportPageErrorMessage({
        response: {
          data: {
            message: 'Archived material is already borrowed',
          },
          status: 409,
        },
      }),
    ).toBe('当前材料已借出，不能重复借出。');

    expect(
      getOperationSupportPageErrorMessage({
        response: {
          data: {
            message: 'Material loan is not pending return',
          },
          status: 409,
        },
      }),
    ).toBe('该借阅记录已完成归还或状态无效，不能重复归还。');
  });

  it('maps invalid return position requirements', () => {
    expect(
      getOperationSupportPageErrorMessage({
        response: {
          data: {
            message: 'A replacement archive position is required for return',
          },
          status: 400,
        },
      }),
    ).toBe('原归档柜位不可用，请为归还操作选择新的归档柜位。');
  });

  it('maps permission errors into generic M5 workstation guidance', () => {
    expect(
      getOperationSupportPageErrorMessage({
        response: {
          data: {
            code: 'PERMISSION_DENIED',
          },
          status: 403,
        },
      }),
    ).toBe(
      '当前账号没有访问 M5 运营支持工作站或执行该操作的权限，请联系管理员检查试剂、设备或归档相关权限配置。',
    );
  });
});
