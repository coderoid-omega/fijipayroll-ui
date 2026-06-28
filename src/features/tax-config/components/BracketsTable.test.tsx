import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BracketsTable } from './BracketsTable';
import type { TaxBracket } from '@/types/api';

const brackets: TaxBracket[] = [
  { taxType: 'Resident', levy: 'PAYE', lowerBound: 0, upperBound: 30000, baseAmount: 0, marginalRate: 0, ordinal: 1 },
  { taxType: 'Resident', levy: 'PAYE', lowerBound: 30000, upperBound: 50000, baseAmount: 0, marginalRate: 0.18, ordinal: 2 },
  { taxType: 'Resident', levy: 'PAYE', lowerBound: 270000, upperBound: null, baseAmount: 47600, marginalRate: 0.2, ordinal: 4 },
];

describe('BracketsTable', () => {
  it('renders a closed band and its marginal rate', () => {
    render(<BracketsTable brackets={brackets} />);
    expect(screen.getByText('FJ$30,000.00 – FJ$50,000.00')).toBeInTheDocument();
    expect(screen.getByText('18%')).toBeInTheDocument();
  });

  it('renders an open-ended top band as "Over …"', () => {
    render(<BracketsTable brackets={brackets} />);
    expect(screen.getByText('Over FJ$270,000.00')).toBeInTheDocument();
  });

  it('shows an empty state when there are no brackets', () => {
    render(<BracketsTable brackets={[]} />);
    expect(screen.getByText('No brackets defined for this levy.')).toBeInTheDocument();
  });
});
