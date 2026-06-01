import { ElMessage } from 'element-plus';

type ErrorMessageFormatter = (error: unknown) => string;

type RequestLikeError = {
  config?: unknown;
  isAxiosError?: boolean;
  request?: unknown;
  response?: unknown;
};

function resolveErrorMessage(error: unknown) {
  if (typeof error === 'string') {
    return error.trim();
  }

  if (error instanceof Error) {
    return error.message.trim();
  }

  return '';
}

export function isRequestLikeError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const requestLikeError = error as RequestLikeError;

  return Boolean(
    requestLikeError.isAxiosError ||
      requestLikeError.response ||
      requestLikeError.request ||
      requestLikeError.config,
  );
}

export function reportInlineErrorDisabled(
  error: unknown,
  formatMessage?: ErrorMessageFormatter,
) {
  if (isRequestLikeError(error)) {
    return;
  }

  const message = formatMessage ? formatMessage(error).trim() : resolveErrorMessage(error);

  if (!message) {
    return;
  }

  ElMessage.error(message);
}
