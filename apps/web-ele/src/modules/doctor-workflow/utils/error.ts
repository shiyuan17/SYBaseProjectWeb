type WorkflowApiErrorLike = {
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

export function getDoctorWorkflowPageErrorMessage(error: unknown) {
  const apiError = error as WorkflowApiErrorLike;
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
    return '当前账号没有访问诊断管理模块或操作该功能的权限。';
  }

  return responseMessage || '数据加载失败，请稍后重试。';
}
