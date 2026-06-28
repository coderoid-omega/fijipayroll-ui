import { Select, Space, Tag } from 'antd';
import { useTenantCompany } from '@/app/providers/TenantCompanyContext';

/**
 * Topbar company (brand) switcher (D11). Switching sets the active company; TenantCompanyProvider
 * persists it and invalidates company-scoped queries so the whole app refetches for the new brand.
 */
export function CompanySwitcher() {
  const { companies, activeCompanyId, setActiveCompany } = useTenantCompany();

  if (companies.length === 0) return null;

  return (
    <Select
      value={activeCompanyId ?? undefined}
      onChange={setActiveCompany}
      style={{ minWidth: 240 }}
      aria-label="Active company"
      optionLabelProp="label"
      options={companies.map((c) => ({
        value: c.id,
        label: c.name,
        title: c.name,
        // Rich render in the dropdown; compact label in the trigger.
        children: (
          <Space>
            <span>{c.name}</span>
            {c.isPrimary && (
              <Tag color="blue" style={{ marginInlineEnd: 0 }}>
                Primary
              </Tag>
            )}
          </Space>
        ),
      }))}
      optionRender={(opt) => opt.data.children}
    />
  );
}
