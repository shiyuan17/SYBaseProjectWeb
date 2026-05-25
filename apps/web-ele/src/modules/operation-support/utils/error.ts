type OperationSupportApiErrorLike = {
  code?: string;
  error?: string;
  message?: string;
  response?: {
    data?: {
      code?: string;
      error?: string;
      message?: string;
    };
    status?: number;
  };
};

function normalizeMessage(message: string) {
  const trimmedMessage = message.trim();

  if (!trimmedMessage) {
    return '';
  }
  if (trimmedMessage.includes('Archive cabinet code already exists')) {
    return '归档柜编号已存在，请更换后重试。';
  }
  if (trimmedMessage.includes('Archive position is not available')) {
    return '所选柜位已被占用，请刷新柜位列表后重新选择。';
  }
  if (trimmedMessage.includes('Archive cabinet is disabled')) {
    return '归档柜已停用，当前柜位不可分配，请先启用归档柜。';
  }
  if (trimmedMessage.includes('Archived material is already borrowed')) {
    return '当前材料已借出，不能重复借出。';
  }
  if (trimmedMessage.includes('Archived material is currently borrowed')) {
    return '当前档案已借出，归档前请先完成归还。';
  }
  if (trimmedMessage.includes('Material loan is not pending return')) {
    return '该借阅记录已完成归还或状态无效，不能重复归还。';
  }
  if (trimmedMessage.includes('A replacement archive position is required for return')) {
    return '原归档柜位不可用，请为归还操作选择新的归档柜位。';
  }
  if (trimmedMessage.includes('Material loan not found')) {
    return '未找到对应借阅记录，请刷新待归还列表后重试。';
  }
  if (trimmedMessage.includes('Archive record not found')) {
    return '未找到对应归档记录，请确认材料已完成归档后再操作。';
  }
  return trimmedMessage;
}

export function getOperationSupportPageErrorMessage(error: unknown) {
  const apiError = error as OperationSupportApiErrorLike;
  const status = apiError.response?.status;
  const code = apiError.response?.data?.code || apiError.code || '';
  const responseMessage = normalizeMessage(
    apiError.response?.data?.error ||
      apiError.response?.data?.message ||
      apiError.error ||
      apiError.message ||
      '',
  );

  if (status === 401) {
    return '登录状态已失效，请重新登录后再继续操作。';
  }

  if (
    status === 403 ||
    code === 'FORBIDDEN' ||
    code === 'PERMISSION_DENIED' ||
    responseMessage.includes('does not have permission')
  ) {
    return '当前账号没有访问 M5 运营支持工作站或执行该操作的权限，请联系管理员检查试剂、设备或归档相关权限配置。';
  }

  if (status === 409 || code === 'RESOURCE_CONFLICT') {
    return responseMessage || '当前操作与柜位或归档柜状态冲突，请刷新后重试。';
  }

  return responseMessage || '数据加载失败，请稍后重试。';
}
