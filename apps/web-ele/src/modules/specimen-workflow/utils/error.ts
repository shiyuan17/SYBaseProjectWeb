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

function mapWorkflowEnglishErrorMessage(message: string) {
  if (message === 'Specimen already confirmed for removal') {
    return '该标本已完成离体确认，请勿重复操作。';
  }

  if (
    message === 'Specimen barcode not found' ||
    message === 'Specimen specimenNo not found'
  ) {
    return '未找到对应标本，请确认标本ID是否正确。';
  }

  if (message === 'Specimen number matches multiple records') {
    return '标本ID对应多条记录，无法自动确认。';
  }

  return message;
}

export function getWorkflowPageErrorMessage(error: unknown) {
  const apiError = error as WorkflowApiErrorLike;
  const status = apiError.response?.status;
  const code = apiError.response?.data?.code || apiError.code || '';
  const rawResponseMessage =
    apiError.response?.data?.error ||
    apiError.response?.data?.message ||
    apiError.error ||
    apiError.message ||
    '';
  const responseMessage = mapWorkflowEnglishErrorMessage(rawResponseMessage);

  if (status === 401) {
    return '登录状态已失效，请重新登录后再继续操作。';
  }

  if (
    status === 403 ||
    code === 'FORBIDDEN' ||
    responseMessage.includes('does not have permission')
  ) {
    return '当前账号没有访问该工作流页面或操作该功能的权限。';
  }

  return responseMessage || '数据加载失败，请稍后重试。';
}
