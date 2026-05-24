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

export function getOperationSupportPageErrorMessage(error: unknown) {
  const apiError = error as OperationSupportApiErrorLike;
  const status = apiError.response?.status;
  const code = apiError.response?.data?.code || apiError.code || '';
  const responseMessage =
    apiError.response?.data?.error ||
    apiError.response?.data?.message ||
    apiError.error ||
    apiError.message ||
    '';

  if (status === 401) {
    return '登录状态已失效，请重新登录后再继续操作。';
  }

  if (
    status === 403 ||
    code === 'FORBIDDEN' ||
    responseMessage.includes('does not have permission')
  ) {
    return '当前账号没有访问归档运营管理模块或操作该功能的权限。';
  }

  if (status === 409 || code === 'RESOURCE_CONFLICT') {
    return responseMessage || '当前记录存在业务冲突，请刷新后再处理。';
  }

  return responseMessage || '数据加载失败，请稍后重试。';
}
