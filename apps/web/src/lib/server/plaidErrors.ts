type PlaidResponseShape = {
  data?: {
    error_message?: string;
    error_code?: string;
  };
};

type PlaidLikeError = {
  message?: string;
  response?: PlaidResponseShape;
};

export function getPlaidErrorMessage(error: unknown, fallback: string) {
  const maybe = error as PlaidLikeError;
  const data = maybe?.response?.data;
  const code = data?.error_code?.trim();
  const message = data?.error_message?.trim();

  if (code && message) return `${code}: ${message}`;
  if (message) return message;
  if (maybe?.message) return maybe.message;
  return fallback;
}
