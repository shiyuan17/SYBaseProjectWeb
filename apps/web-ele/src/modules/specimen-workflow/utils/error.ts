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

  if (message === 'Specimen already checked in') {
    return '标本已完成入库，无需重复操作。';
  }

  if (message === 'Specimen already confirmed') {
    return '标本已完成标本确认，无需重复操作。';
  }

  if (message === 'Specimen must be confirmed before check-in') {
    return '标本尚未完成标本确认，不能入库。';
  }

  if (
    message ===
    'All specimens of the application must complete verification, fixation, and confirmation before check-in'
  ) {
    return '当前申请单下仍有标本未完成核对、固定或标本确认，不能入库。';
  }

  if (message === 'Specimen must complete fixation before confirmation') {
    return '标本尚未完成固定，不能进行标本确认。';
  }

  if (message === 'Specimen already reached receipt terminal status') {
    return '标本已接收、拒收或退回，当前流程不可重复操作。';
  }

  if (
    message ===
    'All specimens of the application must be checked in before transport'
  ) {
    return '当前申请单下所有标本都完成入库后，才能执行转运。';
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
