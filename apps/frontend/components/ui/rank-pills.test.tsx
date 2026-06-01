import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RankPills } from './rank-pills';

describe('RankPills', () => {
  it('renders count pill buttons', () => {
    render(<RankPills count={4} value={0} onChange={vi.fn()} />);
    expect(screen.getAllByRole('button')).toHaveLength(4);
  });

  it('labels each button with its rank number', () => {
    render(<RankPills count={3} value={0} onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'rank 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'rank 3' })).toBeInTheDocument();
  });

  it('calls onChange with rank number when pill clicked', () => {
    const onChange = vi.fn();
    render(<RankPills count={3} value={0} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'rank 2' }));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('calls onChange when clicking already-selected pill (allows re-select)', () => {
    const onChange = vi.fn();
    render(<RankPills count={3} value={2} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'rank 2' }));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('renders correct number of pills when count changes', () => {
    const { rerender } = render(<RankPills count={3} value={0} onChange={vi.fn()} />);
    expect(screen.getAllByRole('button')).toHaveLength(3);
    rerender(<RankPills count={5} value={0} onChange={vi.fn()} />);
    expect(screen.getAllByRole('button')).toHaveLength(5);
  });
});
