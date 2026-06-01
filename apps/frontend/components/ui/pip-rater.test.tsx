import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PipRater } from './pip-rater';

describe('PipRater', () => {
  it('renders 5 pip buttons', () => {
    render(<PipRater value={0} onChange={vi.fn()} />);
    expect(screen.getAllByRole('button')).toHaveLength(5);
  });

  it('renders a text input', () => {
    render(<PipRater value={0} onChange={vi.fn()} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('calls onChange with pip number when pip clicked', () => {
    const onChange = vi.fn();
    render(<PipRater value={0} onChange={onChange} />);
    fireEvent.click(screen.getAllByRole('button')[2]); // pip 3 (0-indexed)
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('decrements by 1 when clicking the currently active pip (toggle-down)', () => {
    const onChange = vi.fn();
    render(<PipRater value={3} onChange={onChange} />);
    fireEvent.click(screen.getAllByRole('button')[2]); // pip 3, currently value=3
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('strips non-numeric/non-dot characters from input', () => {
    render(<PipRater value={0} onChange={vi.fn()} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'abc4.2x' } });
    expect(input.value).toBe('4.2');
  });

  it('allows only one decimal point in input', () => {
    render(<PipRater value={0} onChange={vi.fn()} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '4.2.3' } });
    expect(input.value).toBe('4.2');
  });

  it('calls onChange with parsed decimal value on input change', () => {
    const onChange = vi.fn();
    render(<PipRater value={0} onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '4.17' } });
    expect(onChange).toHaveBeenCalledWith(4.17);
  });

  it('clamps to max 5 on blur', () => {
    const onChange = vi.fn();
    render(<PipRater value={0} onChange={onChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '9' } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenLastCalledWith(5);
  });

  it('calls onChange(0) on blank blur', () => {
    const onChange = vi.fn();
    render(<PipRater value={3} onChange={onChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenLastCalledWith(0);
  });

  it('shows current value in the input when value prop is non-zero', () => {
    render(<PipRater value={4} onChange={vi.fn()} />);
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('4');
  });
});
