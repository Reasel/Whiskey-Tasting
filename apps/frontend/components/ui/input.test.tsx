import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './input';

describe('Input', () => {
  it('renders an input element', () => {
    render(<Input />);
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
  });

  it('renders with placeholder text', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('accepts user input', async () => {
    render(<Input />);
    const input = screen.getByRole('textbox');

    await userEvent.type(input, 'Hello World');
    expect(input).toHaveValue('Hello World');
  });

  it('calls onChange handler when value changes', async () => {
    const onChange = vi.fn();
    render(<Input onChange={onChange} />);
    const input = screen.getByRole('textbox');

    await userEvent.type(input, 'test');
    expect(onChange).toHaveBeenCalled();
  });

  it('supports controlled input with value prop', () => {
    const { rerender } = render(<Input value="initial" onChange={() => {}} />);
    const input = screen.getByRole('textbox');

    expect(input).toHaveValue('initial');

    rerender(<Input value="updated" onChange={() => {}} />);
    expect(input).toHaveValue('updated');
  });

  it('renders as disabled when disabled prop is true', () => {
    render(<Input disabled />);
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('does not accept input when disabled', async () => {
    render(<Input disabled />);
    const input = screen.getByRole('textbox');

    await userEvent.type(input, 'test');
    expect(input).toHaveValue('');
  });

  it('supports type="text" (default)', () => {
    render(<Input type="text" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'text');
  });

  it('supports type="email"', () => {
    render(<Input type="email" />);
    const input = document.querySelector('input[type="email"]');
    expect(input).toBeInTheDocument();
  });

  it('supports type="password"', () => {
    render(<Input type="password" />);
    const input = document.querySelector('input[type="password"]');
    expect(input).toBeInTheDocument();
  });

  it('supports type="number"', () => {
    render(<Input type="number" />);
    const input = document.querySelector('input[type="number"]');
    expect(input).toBeInTheDocument();
  });

  it('accepts custom className', () => {
    render(<Input className="custom-class" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('custom-class');
  });

  it('forwards ref to input element', () => {
    const ref = vi.fn();
    render(<Input ref={ref} />);
    expect(ref).toHaveBeenCalled();
  });

  it('supports required attribute', () => {
    render(<Input required />);
    const input = screen.getByRole('textbox');
    expect(input).toBeRequired();
  });

  it('supports readOnly attribute', () => {
    render(<Input readOnly value="Read only" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('readOnly');
  });

  it('supports maxLength attribute', () => {
    render(<Input maxLength={10} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('maxLength', '10');
  });

  it('supports name attribute', () => {
    render(<Input name="username" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('name', 'username');
  });

  it('supports id attribute', () => {
    render(<Input id="test-input" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('id', 'test-input');
  });

  it('supports aria-label attribute', () => {
    render(<Input aria-label="Search" />);
    const input = screen.getByLabelText('Search');
    expect(input).toBeInTheDocument();
  });

  it('clears value when cleared by user', async () => {
    render(<Input />);
    const input = screen.getByRole('textbox');

    await userEvent.type(input, 'test');
    expect(input).toHaveValue('test');

    await userEvent.clear(input);
    expect(input).toHaveValue('');
  });

  it('supports defaultValue for uncontrolled input', () => {
    render(<Input defaultValue="default text" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('default text');
  });

  it('calls onFocus handler when focused', async () => {
    const onFocus = vi.fn();
    render(<Input onFocus={onFocus} />);
    const input = screen.getByRole('textbox');

    await userEvent.click(input);
    expect(onFocus).toHaveBeenCalled();
  });

  it('calls onBlur handler when blurred', async () => {
    const onBlur = vi.fn();
    render(<Input onBlur={onBlur} />);
    const input = screen.getByRole('textbox');

    await userEvent.click(input);
    await userEvent.tab();
    expect(onBlur).toHaveBeenCalled();
  });

  it('accepts numeric input for type="number"', async () => {
    render(<Input type="number" />);
    const input = document.querySelector('input[type="number"]') as HTMLInputElement;

    await userEvent.type(input, '123');
    expect(input.value).toBe('123');
  });

  it('supports pattern attribute for validation', () => {
    render(<Input pattern="[0-9]*" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('pattern', '[0-9]*');
  });
});
