import { Button, Result } from 'antd';
import { isApiError } from '@/lib/apiError';

interface QueryErrorProps {
  error: unknown;
  onRetry?: () => void;
  title?: string;
}

/** Consistent error state for a failed query (CLAUDE.md §5 — every list/detail handles error). */
export function QueryError({ error, onRetry, title = 'Something went wrong' }: QueryErrorProps) {
  const message = isApiError(error)
    ? (error.detail ?? error.message)
    : error instanceof Error
      ? error.message
      : 'Unexpected error';
  const code = isApiError(error) ? error.errorCode : undefined;

  return (
    <Result
      status="error"
      title={title}
      subTitle={code ? `${message} (${code})` : message}
      extra={
        onRetry
          ? [
              <Button type="primary" key="retry" onClick={onRetry}>
                Try again
              </Button>,
            ]
          : undefined
      }
    />
  );
}
