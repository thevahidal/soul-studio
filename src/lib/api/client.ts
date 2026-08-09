import { env } from '$env/dynamic/public';
import { HttpError } from './errors';

// Empty string -> relative fetch('/api/...') -> same-origin, the common
// case (Soul core mounts this app at /studio via `-S` and serves /api on
// the same origin/port). Only set for standalone cross-origin dev, see
// .env.sample.
const baseUrl = () => env.PUBLIC_SOUL_API_URL ?? '';

type SessionExpiredHandler = () => void;
let onSessionExpired: SessionExpiredHandler | null = null;

// The session store registers itself here on init so this module never has
// to import SvelteKit navigation/UI concerns directly.
export const registerSessionExpiredHandler = (
  handler: SessionExpiredHandler,
): void => {
  onSessionExpired = handler;
};

// Both tokens are httpOnly and unreadable from JS -- this refresh call is
// also how the app finds out whether it's still logged in at all (see
// lib/api/auth.ts's session bootstrap). Concurrent 401s across multiple
// in-flight requests share this single promise rather than each firing
// their own refresh call.
let refreshPromise: Promise<void> | null = null;

const refreshSession = (): Promise<void> => {
  if (!refreshPromise) {
    refreshPromise = fetch(`${baseUrl()}/api/auth/token/refresh`, {
      method: 'GET',
      credentials: 'include',
    })
      .then((res) => {
        if (!res.ok) {
          throw new HttpError({
            status: res.status,
            message: 'Session expired',
          });
        }
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

const toHttpError = async (res: Response): Promise<HttpError> => {
  let message = res.statusText;
  let errorField: unknown;
  try {
    const body = await res.json();
    if (typeof body?.message === 'string') message = body.message;
    errorField = body?.error;
  } catch {
    // non-JSON error body (rare) -- fall back to statusText
  }
  return new HttpError({ status: res.status, message, error: errorField });
};

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** internal: set on the retry attempt after a refresh, prevents looping */
  skipRefreshRetry?: boolean;
}

export const request = async <T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> => {
  const { body, skipRefreshRetry, headers, ...rest } = options;

  const res = await fetch(`${baseUrl()}${path}`, {
    ...rest,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const isRefreshCall = path.startsWith('/api/auth/token/refresh');

  if (res.status === 401 && !skipRefreshRetry && !isRefreshCall) {
    try {
      await refreshSession();
    } catch {
      onSessionExpired?.();
      throw await toHttpError(res);
    }
    return request<T>(path, { ...options, skipRefreshRetry: true });
  }

  if (!res.ok) {
    if (res.status === 401 && isRefreshCall) {
      onSessionExpired?.();
    }
    throw await toHttpError(res);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
};
