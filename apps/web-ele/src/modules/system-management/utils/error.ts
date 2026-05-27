type ApiErrorLike = {
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

export function getSystemPageErrorMessage(error: unknown) {
  const apiError = error as ApiErrorLike;
  const status = apiError.response?.status;
  const code = apiError.response?.data?.code || apiError.code || '';
  const responseMessage =
    apiError.response?.data?.error ||
    apiError.response?.data?.message ||
    apiError.error ||
    apiError.message ||
    '';

  if (status === 401) {
    return '登录状态已失效，请重新登录后再访问系统管理。';
  }

  if (
    status === 403 ||
    code === 'FORBIDDEN' ||
    responseMessage.includes('does not have permission')
  ) {
    return '当前账号没有访问该页面或功能的权限，请联系管理员配置角色授权。';
  }

  const message = responseMessage || '请检查后端服务和网络连接后重试。';

  return `数据加载失败：${message}`;
}
