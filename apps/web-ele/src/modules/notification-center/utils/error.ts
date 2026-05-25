type ApiError = Error & {
  response?: {
    data?: {
      error?: string;
      message?: string;
    };
  };
};

export function getNotificationPageErrorMessage(error: unknown) {
  const apiError = error as ApiError;
  const responseMessage =
    apiError.response?.data?.error ||
    apiError.response?.data?.message ||
    apiError.message ||
    '';

  return responseMessage || '通知加载失败，请稍后重试。';
}
