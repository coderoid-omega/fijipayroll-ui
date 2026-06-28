import { Button, Result } from 'antd';
import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom';

/** Error boundary for the data router — catches render/loader errors in any route subtree. */
export function RouteError() {
  const error = useRouteError();
  const navigate = useNavigate();

  const { status, message } = isRouteErrorResponse(error)
    ? { status: error.status, message: error.statusText }
    : { status: undefined, message: error instanceof Error ? error.message : 'Unexpected error' };

  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
      <Result
        status="error"
        title={status ? `Error ${status}` : 'Something went wrong'}
        subTitle={message}
        extra={[
          <Button type="primary" key="home" onClick={() => navigate('/')}>
            Back to dashboard
          </Button>,
          <Button key="reload" onClick={() => window.location.reload()}>
            Reload
          </Button>,
        ]}
      />
    </div>
  );
}
