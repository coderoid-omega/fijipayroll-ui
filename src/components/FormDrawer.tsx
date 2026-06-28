import type { ReactNode } from 'react';
import { Button, Drawer, Space } from 'antd';

interface FormDrawerProps {
  open: boolean;
  title: ReactNode;
  onClose: () => void;
  /** Called when the footer submit button is clicked (usually form.submit()). */
  onSubmit: () => void;
  submitting?: boolean;
  submitText?: string;
  width?: number;
  children: ReactNode;
  /** Disable the submit button (e.g. invalid form). */
  submitDisabled?: boolean;
}

/**
 * Standard create/edit Drawer for master data (CLAUDE.md §5 — Drawers for master-data CRUD).
 * Hosts an AntD Form in `children`; the footer's submit triggers the form via `onSubmit`.
 */
export function FormDrawer({
  open,
  title,
  onClose,
  onSubmit,
  submitting,
  submitText = 'Save',
  width = 520,
  submitDisabled,
  children,
}: FormDrawerProps) {
  return (
    <Drawer
      open={open}
      title={title}
      onClose={onClose}
      width={width}
      maskClosable={!submitting}
      destroyOnClose
      footer={
        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="primary" loading={submitting} disabled={submitDisabled} onClick={onSubmit}>
            {submitText}
          </Button>
        </Space>
      }
    >
      {children}
    </Drawer>
  );
}
