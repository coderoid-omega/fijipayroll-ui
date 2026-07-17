import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App as AntApp } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError } from '@/lib/apiError';
import type { Employee, ExitReason } from '@/types/api';
import { RehireModal, TerminateModal } from './StatusActionModals';

// Sprint 2 Epic 5 ([S06]): the terminate form is D10 CONFIG DRIVING A FORM — the exit reason's
// flags decide what renders, which is exactly where a wrong flag reading looks like correct
// behaviour. These tests pin the flag → rendering contract, and the rehire override path.

vi.mock('@/lib/apiClient', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const { api } = await import('@/lib/apiClient');
const mockedGet = vi.mocked(api.get);
const mockedPost = vi.mocked(api.post);

// The §16 seed's flag semantics — severance ONLY on REDUND, no notice on SUMDIS,
// RETIRE not rehire-eligible. The flags are the point.
const exitReasons: ExitReason[] = [
  { id: 'xr-resign', code: 'RESIGN', name: 'Resignation', initiator: 'Employee', severanceEligible: false, noticeRequired: true, rehireEligible: true, status: 'Active' },
  { id: 'xr-redund', code: 'REDUND', name: 'Redundancy', initiator: 'Employer', severanceEligible: true, noticeRequired: true, rehireEligible: true, status: 'Active' },
  { id: 'xr-sumdis', code: 'SUMDIS', name: 'Summary dismissal', initiator: 'Employer', severanceEligible: false, noticeRequired: false, rehireEligible: false, status: 'Active' },
];

const employee = {
  id: 'em-1',
  companyId: 'c-1',
  employeeCode: 'EMP001',
  displayName: 'Ana Rokotui',
  status: 'Terminated',
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

beforeEach(() => {
  vi.clearAllMocks();
  // Reference lookups the modals load: exit reasons / contract types / stages.
  mockedGet.mockImplementation((path: string) => {
    if (path === '/exit-reasons') return Promise.resolve(exitReasons);
    if (path === '/contract-types')
      return Promise.resolve([{ id: 'ct-perm', code: 'PERM', name: 'Permanent', isFixedTerm: false, status: 'Active' }]);
    if (path === '/employment-stages') return Promise.resolve([]);
    return Promise.resolve([]);
  });
});

describe('TerminateModal — the exit-reason flags drive the form (D10)', () => {
  it('REDUND (severance-eligible) surfaces the severance callout; RESIGN does not', async () => {
    renderModal(<TerminateModal open companyId="c-1" employee={employee} onClose={() => {}} />);

    const reasonSelect = (await screen.findAllByRole('combobox'))[0]!;
    await pickSelectOption(reasonSelect, 'Redundancy');
    expect(await screen.findByText('This exit reason is severance-eligible')).toBeInTheDocument();
    expect(screen.getByText('Severance eligible')).toBeInTheDocument();

    await pickSelectOption(reasonSelect, 'Resignation');
    await waitFor(() =>
      expect(screen.queryByText('This exit reason is severance-eligible')).not.toBeInTheDocument());
  });

  it('SUMDIS (notice not required) hides the whole notice block', async () => {
    renderModal(<TerminateModal open companyId="c-1" employee={employee} onClose={() => {}} />);

    // Notice block renders by default (before/with a notice-requiring reason)...
    expect(await screen.findByTestId('notice-block')).toBeInTheDocument();

    const reasonSelect = (await screen.findAllByRole('combobox'))[0]!;
    await pickSelectOption(reasonSelect, 'Summary dismissal');

    // ...and disappears entirely for a no-notice reason — the flag, not the code, decides.
    await waitFor(() => expect(screen.queryByTestId('notice-block')).not.toBeInTheDocument());
    expect(screen.getByText('Not rehire-eligible')).toBeInTheDocument();
  });

  it('PaidInLieu calls out that last working day and effective date diverge', async () => {
    renderModal(<TerminateModal open companyId="c-1" employee={employee} onClose={() => {}} />);

    const reasonSelect = (await screen.findAllByRole('combobox'))[0]!;
    await pickSelectOption(reasonSelect, 'Redundancy');

    expect(screen.queryByText('Paid in lieu: the two dates differ')).not.toBeInTheDocument();
    const noticeHandlingSelect = screen.getAllByRole('combobox')[1]!;
    await pickSelectOption(noticeHandlingSelect, 'Paid in lieu');
    expect(await screen.findByText('Paid in lieu: the two dates differ')).toBeInTheDocument();
    // Both date fields stay present — recorded separately, never derived from each other.
    expect(screen.getByText('Last working day')).toBeInTheDocument();
    expect(screen.getByText('Termination effective date')).toBeInTheDocument();
  });
});

describe('RehireModal — the override path ([S06])', () => {
  async function fillRequiredFields() {
    const hireDate = screen.getByLabelText('New hire date');
    await userEvent.click(hireDate);
    await userEvent.type(hireDate, '04-01-2027{Enter}');
    const contractType = screen.getAllByRole('combobox').find((c) => c.id === 'contractTypeId')!;
    await pickSelectOption(contractType, 'Permanent');
  }

  it('surfaces the block on 409 REHIRE_NOT_ELIGIBLE, then rehires with the mandatory reason', async () => {
    const blockedMessage =
      "The prior engagement ended with 'Retirement' (RETIRE), which is not rehire-eligible.";
    mockedPost.mockRejectedValueOnce(
      new ApiError({ status: 409, errorCode: 'REHIRE_NOT_ELIGIBLE', message: blockedMessage }));

    renderModal(<RehireModal open companyId="c-1" employee={employee} onClose={() => {}} />);
    await fillRequiredFields();

    // No override UI until the server blocks — the exception is deliberate, not routine.
    expect(screen.queryByTestId('rehire-blocked')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Rehire' }));

    expect(await screen.findByTestId('rehire-blocked')).toHaveTextContent(blockedMessage);
    const overrideField = screen.getByTestId('override-reason');

    // The override cannot proceed silently: the reason is mandatory (the audit records it).
    await userEvent.click(screen.getByRole('button', { name: 'Override and rehire' }));
    expect(await screen.findByText('An override reason is required — the audit records it')).toBeInTheDocument();
    expect(mockedPost).toHaveBeenCalledTimes(1);   // no second call without a reason

    mockedPost.mockResolvedValueOnce({ ...employee, status: 'Active' });
    await userEvent.type(overrideField, 'Board-approved return as consultant');
    await userEvent.click(screen.getByRole('button', { name: 'Override and rehire' }));

    await waitFor(() => expect(mockedPost).toHaveBeenCalledTimes(2));
    expect(mockedPost).toHaveBeenLastCalledWith('/employees/em-1/rehire', expect.objectContaining({
      overrideRehireBlock: true,
      overrideReason: 'Board-approved return as consultant',
      dateOfHire: '2027-01-04',
      contractTypeId: 'ct-perm',
    }));
  });
});
