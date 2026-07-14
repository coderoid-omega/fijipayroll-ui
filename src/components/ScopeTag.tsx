import { Tag, Tooltip } from 'antd';
import { GlobalOutlined, ShopOutlined } from '@ant-design/icons';

export type DataScope = 'company' | 'tenant';

interface ScopeTagProps {
  scope: DataScope;
  /** Active company name — shown in the tooltip for company-scoped data. */
  companyName?: string | null;
}

/**
 * Marks whether a master's data is specific to the active company or shared tenant-wide
 * (D11: tenant → company → data). Render next to a tab label or section title so users always
 * know the scope of what they're editing.
 */
export function ScopeTag({ scope, companyName }: ScopeTagProps) {
  if (scope === 'company') {
    return (
      <Tooltip
        title={`Specific to ${companyName ?? 'the active company'}. Other companies in your organisation keep their own list.`}
      >
        <Tag icon={<ShopOutlined />} color="geekblue" style={{ marginInlineEnd: 0 }}>
          Company
        </Tag>
      </Tooltip>
    );
  }
  return (
    <Tooltip title="Shared across all companies in your organisation.">
      <Tag icon={<GlobalOutlined />} color="purple" style={{ marginInlineEnd: 0 }}>
        Shared
      </Tag>
    </Tooltip>
  );
}
