import type { ProblemDetails } from '@/types/api';

/**
 * Normalised error thrown by the API client for every non-2xx response, so UI code never
 * branches on raw Axios shapes. Carries the RFC 7807 `errorCode` and field-level `errors`.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly errorCode: string;
  readonly detail?: string;
  readonly traceId?: string;
  readonly fieldErrors?: Record<string, string[]>;
  readonly isNetworkError: boolean;

  constructor(params: {
    status: number;
    errorCode: string;
    message: string;
    detail?: string;
    traceId?: string;
    fieldErrors?: Record<string, string[]>;
    isNetworkError?: boolean;
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.status = params.status;
    this.errorCode = params.errorCode;
    this.detail = params.detail;
    this.traceId = params.traceId;
    this.fieldErrors = params.fieldErrors;
    this.isNetworkError = params.isNetworkError ?? false;
  }

  static fromProblem(status: number, problem: Partial<ProblemDetails>): ApiError {
    return new ApiError({
      status,
      errorCode: problem.errorCode ?? `HTTP_${status}`,
      message: problem.title ?? problem.detail ?? `Request failed (${status})`,
      detail: problem.detail,
      traceId: problem.traceId,
      fieldErrors: problem.errors,
    });
  }

  static network(message = 'Network error — could not reach the server.'): ApiError {
    return new ApiError({
      status: 0,
      errorCode: 'NETWORK_ERROR',
      message,
      isNetworkError: true,
    });
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}
