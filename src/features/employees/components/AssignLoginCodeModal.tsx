import { useEffect, useState } from 'react';
import { Alert, App as AntApp, Form, Input, Modal, Typography } from 'antd';
import { isApiError } from '@/lib/apiError';
import type { Employee } from '@/types/api';
import { useEnableLogin } from '../api/hooks';

interface AssignLoginCodeModalProps {
  open: boolean;
  companyId: string;
  /** Company code (e.g. "MAIN") — prefix of the proposed login code. */
  companyCode: string;
  employee: Employee;
  onClose: () => void;
}

/**
 * Assigns the employee's globally-unique login CODE (Sprint 2 Epic 3, spec §3.2). NOT "enable
 * login": no credential exists yet, so the result is "login code assigned — credentials pending".
 *
 * The collision path is the point of the feature: the proposed `{companyCode}-{employeeCode}` is
 * only tenant-unique while login codes are global, so on 409 `LOGIN_CODE_TAKEN` the modal
 * re-prompts with an editable code instead of burying the conflict in a toast.
 */
export function AssignLoginCodeModal({ open, companyId, companyCode, employee, onClose }: AssignLoginCodeModalProps) {
  const { message } = AntApp.useApp();
  const [form] = Form.useForm<{ loginCode: string }>();
  const enableLogin = useEnableLogin(companyId, employee.id);
  const proposal = `${companyCode}-${employee.employeeCode}`;
  const [collision, setCollision] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setCollision(null);
    form.setFieldsValue({ loginCode: proposal });
  }, [open, form, proposal]);

  const submit = async () => {
    let body: { loginCode: string } | undefined;
    if (collision) {
      try {
        body = await form.validateFields();
      } catch {
        return;
      }
    }
    try {
      const updated = await enableLogin.mutateAsync(body);
      message.success(`Login code ${updated.loginCode} assigned — credentials pending`);
      onClose();
    } catch (err) {
      if (isApiError(err) && err.errorCode === 'LOGIN_CODE_TAKEN') {
        // Re-prompt with an editable code — the manual fallback is load-bearing.
        setCollision(err.message);
        form.setFields([{ name: 'loginCode', errors: [err.message] }]);
        return;
      }
      if (isApiError(err) && err.errorCode === 'LOGIN_ALREADY_ENABLED') {
        message.warning(err.message);
        onClose();
        return;
      }
      message.error(isApiError(err) ? err.message : 'Could not assign the login code');
    }
  };

  return (
    <Modal
      open={open}
      title="Assign login code"
      okText={collision ? 'Try this code' : 'Assign code'}
      onOk={submit}
      onCancel={onClose}
      confirmLoading={enableLogin.isPending}
      destroyOnClose
    >
      <Typography.Paragraph>
        Reserves a <b>globally unique</b> login code for {employee.displayName}. This assigns the
        code only — the account cannot sign in until credentials are set up (a later feature), so
        the employee will show as <i>credentials pending</i>.
      </Typography.Paragraph>
      <Typography.Paragraph type="secondary">
        The code is <b>immutable once assigned</b> and is never reused, even after termination.
      </Typography.Paragraph>
      {collision && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 12 }}
          message="Proposed code is already taken"
          description="Login codes are global across the platform while company codes are not, so rare cross-tenant collisions are expected. Enter a different code."
        />
      )}
      <Form form={form} layout="vertical">
        <Form.Item
          name="loginCode"
          label={collision ? 'Login code (edit to resolve the collision)' : 'Proposed login code'}
          rules={[
            { required: true, whitespace: true, message: 'Login code is required' },
            { pattern: /^\S+$/, message: 'No spaces — this is a typed credential' },
            { max: 64 },
          ]}
        >
          <Input disabled={!collision} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
