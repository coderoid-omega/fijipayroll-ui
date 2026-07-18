import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App as AntApp } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { CompanyLookup, Employee, Lookup } from '@/types/api';
import { RateChangeModal, RegradeModal } from './PositionActionModals';

// Sprint 2 Epic 6: the position actions. Regrade must reject an empty change (no field) BEFORE
// hitting the API; rate-change must send only the field that matches the pay type — the two rules
// most likely to break silently.

vi.mock('@/lib/apiClient', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const { api } = await import('@/lib/apiClient');
const mockedGet = vi.mocked(api.get);
const mockedPost = vi.mocked(api.post);

const occupations: Lookup[] = [{ id: 'oc-1', code: 'ENG', name: 'Engineer' }];
const grades: CompanyLookup[] = [{ id: 'gr-1', companyId: 'c-1', code: 'G5', name: 'Grade 5', status: 'Active' }];
const levels: CompanyLookup[] = [{ id: 'lv-1', companyId: 'c-1', code: 'L2', name: 'Level 2', status: 'Active' }];

const employee = {
  id: 'em-1', companyId: 'c-1', employeeCode: 'EMP001', displayName: 'Ana Rokotui',
  status: 'Active', payType: 'Salary',
} as Employee;

function renderModal(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <AntApp>{ui}</AntApp>
    </QueryClientProvider>,
  );
}

async function pickSelectOption(combobox: HTMLElement, optionText: string) {
  await userEvent.click(combobox);
  const option = await screen.findByText(optionText, { selector: '.ant-select-item-option-content' });
  await userEvent.click(option);
}

async function typeDate(label: string, value: string) {
  const input = screen.getByLabelText(label);
  await userEvent.click(input);
  await userEvent.type(input, `${value}{Enter}`);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedGet.mockImplementation((path: string) => {
    if (path === '/occupations') return Promise.resolve(occupations);
    if (path === '/grades') return Promise.resolve(grades);
    if (path === '/levels') return Promise.resolve(levels);
    return Promise.resolve([]);
  });
});

describe('RegradeModal', () => {
  it('rejects an empty regrade before calling the API', async () => {
    renderModal(<RegradeModal open companyId="c-1" employee={employee} onClose={() => {}} />);
    await typeDate('Effective date', '01-08-2026');

    await userEvent.click(screen.getByRole('button', { name: 'Record regrade' }));

    // The "at least one field" rule fires client-side — no POST is made.
    expect(await screen.findByText('Supply at least one of occupation, grade or level.')).toBeInTheDocument();
    expect(mockedPost).not.toHaveBeenCalled();
  });

  it('submits a grade regrade to /regrade', async () => {
    mockedPost.mockResolvedValueOnce({ ...employee, gradeId: 'gr-1' });
    renderModal(<RegradeModal open companyId="c-1" employee={employee} onClose={() => {}} />);

    const gradeSelect = screen.getAllByRole('combobox').find((c) => c.id === 'gradeId')!;
    await pickSelectOption(gradeSelect, 'Grade 5');
    await typeDate('Effective date', '01-08-2026');
    await userEvent.click(screen.getByRole('button', { name: 'Record regrade' }));

    await waitFor(() => expect(mockedPost).toHaveBeenCalledTimes(1));
    expect(mockedPost).toHaveBeenCalledWith('/employees/em-1/regrade', expect.objectContaining({
      gradeId: 'gr-1', occupationId: null, levelId: null, validFrom: '2026-08-01',
    }));
  });
});

describe('RateChangeModal', () => {
  it('sends only the salary field for a salaried change (hourly stays null)', async () => {
    mockedPost.mockResolvedValueOnce({ ...employee, salaryPerPeriod: 3600 });
    renderModal(<RateChangeModal open companyId="c-1" employee={employee} onClose={() => {}} />);

    await userEvent.type(screen.getByLabelText('Salary per period (FJD)'), '3600');
    await typeDate('Effective date', '01-09-2026');
    await userEvent.click(screen.getByRole('button', { name: 'Record rate change' }));

    await waitFor(() => expect(mockedPost).toHaveBeenCalledTimes(1));
    expect(mockedPost).toHaveBeenCalledWith('/employees/em-1/rate-change', expect.objectContaining({
      payType: 'Salary', salaryPerPeriod: 3600, hourlyRate: null, validFrom: '2026-09-01',
    }));
  });

  it('switches to the hourly field when pay type is Hourly and sends only hourlyRate', async () => {
    mockedPost.mockResolvedValueOnce({ ...employee, payType: 'Hourly', hourlyRate: 15 });
    renderModal(<RateChangeModal open companyId="c-1" employee={employee} onClose={() => {}} />);

    // Salary field shows by default; switching to Hourly swaps it. (fireEvent — AntD Radio.Button
    // sets pointer-events on the wrapper, which userEvent's pointer guard rejects in jsdom.)
    expect(screen.getByLabelText('Salary per period (FJD)')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: 'Hourly' }));
    expect(await screen.findByLabelText('Hourly rate (FJD)')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Hourly rate (FJD)'), '15');
    await typeDate('Effective date', '01-09-2026');
    await userEvent.click(screen.getByRole('button', { name: 'Record rate change' }));

    await waitFor(() => expect(mockedPost).toHaveBeenCalledTimes(1));
    expect(mockedPost).toHaveBeenCalledWith('/employees/em-1/rate-change', expect.objectContaining({
      payType: 'Hourly', hourlyRate: 15, salaryPerPeriod: null,
    }));
  });
});
