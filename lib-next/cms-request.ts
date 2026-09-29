export class RequestError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function cmsRequest<T = { data: Record<string, unknown>[] }>(
  url: string,
  init: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      cache: "no-store",
      ...init,
      signal: init.signal ?? AbortSignal.timeout(60000),
    });
  } catch (error) {
    if (init.signal?.aborted) throw error;
    throw new RequestError("Connection interrupted. Check your connection and retry.", 0);
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new RequestError(
      response.status === 401
        ? "Your admin session expired. Sign in again."
        : body.error || "The request failed. Please retry.",
      response.status,
    );
  return body as T;
}
export const jsonRequest = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});
