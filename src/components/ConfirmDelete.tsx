import { Modal } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';

interface ConfirmDeleteOptions {
  title?: string;
  content?: string;
  okText?: string;
  onConfirm: () => void | Promise<void>;
}

/**
 * Imperative confirm dialog for destructive actions. Returns a promise that resolves after the
 * confirm handler completes. Note: many master records are *deactivated*, not deleted (Domain
 * Reference §1 — never delete a paid employee); use this for true deletes / hard removals.
 */
export function confirmDelete({
  title = 'Delete this item?',
  content = 'This action cannot be undone.',
  okText = 'Delete',
  onConfirm,
}: ConfirmDeleteOptions): void {
  Modal.confirm({
    title,
    icon: <ExclamationCircleFilled style={{ color: '#d14343' }} />,
    content,
    okText,
    okButtonProps: { danger: true },
    cancelText: 'Cancel',
    onOk: onConfirm,
  });
}
