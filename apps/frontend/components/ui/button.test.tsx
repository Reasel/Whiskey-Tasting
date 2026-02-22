import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click me</Button>);

    await userEvent.click(screen.getByText('Click me'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not call onClick when disabled', async () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Disabled Button
      </Button>
    );

    await userEvent.click(screen.getByText('Disabled Button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('applies default variant styles', () => {
    render(<Button>Default</Button>);
    const button = screen.getByText('Default');
    expect(button).toBeInTheDocument();
  });

  it('applies destructive variant', () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByText('Delete');
    expect(button).toBeInTheDocument();
  });

  it('applies success variant', () => {
    render(<Button variant="success">Confirm</Button>);
    const button = screen.getByText('Confirm');
    expect(button).toBeInTheDocument();
  });

  it('applies warning variant', () => {
    render(<Button variant="warning">Reset</Button>);
    const button = screen.getByText('Reset');
    expect(button).toBeInTheDocument();
  });

  it('applies outline variant', () => {
    render(<Button variant="outline">Cancel</Button>);
    const button = screen.getByText('Cancel');
    expect(button).toBeInTheDocument();
  });

  it('applies secondary variant', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByText('Secondary');
    expect(button).toBeInTheDocument();
  });

  it('applies ghost variant', () => {
    render(<Button variant="ghost">Ghost</Button>);
    const button = screen.getByText('Ghost');
    expect(button).toBeInTheDocument();
  });

  it('applies link variant', () => {
    render(<Button variant="link">Link</Button>);
    const button = screen.getByText('Link');
    expect(button).toBeInTheDocument();
  });

  it('applies small size', () => {
    render(<Button size="sm">Small</Button>);
    const button = screen.getByText('Small');
    expect(button).toBeInTheDocument();
  });

  it('applies large size', () => {
    render(<Button size="lg">Large</Button>);
    const button = screen.getByText('Large');
    expect(button).toBeInTheDocument();
  });

  it('applies icon size', () => {
    render(<Button size="icon">🔍</Button>);
    const button = screen.getByText('🔍');
    expect(button).toBeInTheDocument();
  });

  it('accepts custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    const button = screen.getByText('Custom');
    expect(button).toHaveClass('custom-class');
  });

  it('renders as disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByText('Disabled');
    expect(button).toBeDisabled();
  });

  it('forwards ref to button element', () => {
    const ref = vi.fn();
    render(<Button ref={ref}>Ref Test</Button>);
    expect(ref).toHaveBeenCalled();
  });

  it('supports type attribute', () => {
    render(<Button type="submit">Submit</Button>);
    const button = screen.getByText('Submit');
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('supports type="button" (default)', () => {
    render(<Button type="button">Button</Button>);
    const button = screen.getByText('Button');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('renders children correctly', () => {
    render(
      <Button>
        <span>Icon</span>
        <span>Text</span>
      </Button>
    );
    expect(screen.getByText('Icon')).toBeInTheDocument();
    expect(screen.getByText('Text')).toBeInTheDocument();
  });

  it('handles multiple clicks', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Multi Click</Button>);

    const button = screen.getByText('Multi Click');
    await userEvent.click(button);
    await userEvent.click(button);
    await userEvent.click(button);

    expect(onClick).toHaveBeenCalledTimes(3);
  });

  it('supports aria-label attribute', () => {
    render(<Button aria-label="Close dialog">X</Button>);
    const button = screen.getByLabelText('Close dialog');
    expect(button).toBeInTheDocument();
  });

  it('renders with no text (icon only)', () => {
    render(<Button aria-label="Search">🔍</Button>);
    const button = screen.getByLabelText('Search');
    expect(button).toBeInTheDocument();
  });
});
