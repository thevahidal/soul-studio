import type { ApiError } from './types';

export class HttpError extends Error implements ApiError {
  status: number;
  error?: unknown;

  constructor({ status, message, error }: ApiError) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.error = error;
  }
}

export const isHttpError = (value: unknown): value is HttpError =>
  value instanceof HttpError;
