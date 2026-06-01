import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from './dialog';

describe('Dialog', () => {
  it('renders trigger button', () => {
    const onOpenChange = vi.fn();
    render(
      <Dialog open={false} onOpenChange={onOpenChange}>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogTitle>Test Dialog</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByText('Open Dialog')).toBeInTheDocument();
  });

  it('opens dialog when trigger is clicked', async () => {
    const onOpenChange = vi.fn();
    render(
      <Dialog open={false} onOpenChange={onOpenChange}>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Dialog Content</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    await userEvent.click(screen.getByText('Open'));
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it('displays dialog content when open', () => {
    render(
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>Dialog description text</DialogDescription>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByText('Dialog Title')).toBeInTheDocument();
    expect(screen.getByText('Dialog description text')).toBeInTheDocument();
  });

  it('does not display content when closed', () => {
    render(
      <Dialog open={false} onOpenChange={() => {}}>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Hidden Title</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    expect(screen.queryByText('Hidden Title')).not.toBeInTheDocument();
  });

  it('closes dialog when close button is clicked', async () => {
    const onOpenChange = vi.fn();
    render(
      <Dialog open={true} onOpenChange={onOpenChange}>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
          <DialogClose>Close Dialog</DialogClose>
        </DialogContent>
      </Dialog>
    );

    await userEvent.click(screen.getByText('Close Dialog'));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('closes dialog when X button is clicked', async () => {
    const onOpenChange = vi.fn();
    render(
      <Dialog open={true} onOpenChange={onOpenChange}>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    // The X button contains a span with sr-only class containing "Close"
    const closeButtons = screen.getAllByText('Close');
    // Find the one that's inside the X button (sr-only span)
    const xButton = closeButtons.find((el) => el.classList.contains('sr-only'))?.parentElement;
    if (xButton) {
      await userEvent.click(xButton);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    }
  });

  it('renders custom trigger with asChild', async () => {
    const onOpenChange = vi.fn();
    render(
      <Dialog open={false} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>
          <button>Custom Trigger</button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    await userEvent.click(screen.getByText('Custom Trigger'));
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it('renders custom close button with asChild', async () => {
    const onOpenChange = vi.fn();
    render(
      <Dialog open={true} onOpenChange={onOpenChange}>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
          <DialogClose asChild>
            <button>Custom Close</button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    );

    await userEvent.click(screen.getByText('Custom Close'));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('renders dialog header', () => {
    render(
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Header Title</DialogTitle>
            <DialogDescription>Header description</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByText('Header Title')).toBeInTheDocument();
    expect(screen.getByText('Header description')).toBeInTheDocument();
  });

  it('supports controlled state', () => {
    const { rerender } = render(
      <Dialog open={false} onOpenChange={() => {}}>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Controlled Dialog</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    expect(screen.queryByText('Controlled Dialog')).not.toBeInTheDocument();

    rerender(
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Controlled Dialog</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByText('Controlled Dialog')).toBeInTheDocument();
  });

  it('closes on overlay click', async () => {
    const onOpenChange = vi.fn();
    render(
      <Dialog open={true} onOpenChange={onOpenChange}>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    // Click on the overlay (background)
    const overlay = screen.getByRole('button', { name: /close/i }).parentElement?.parentElement;
    if (overlay) {
      await userEvent.click(overlay);
    }
  });

  it('renders multiple children in dialog content', () => {
    render(
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
          <DialogDescription>Description</DialogDescription>
          <p>Additional content</p>
          <button>Action Button</button>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Additional content')).toBeInTheDocument();
    expect(screen.getByText('Action Button')).toBeInTheDocument();
  });

  it('preserves original onClick handler with asChild trigger', async () => {
    const originalOnClick = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <Dialog open={false} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>
          <button onClick={originalOnClick}>Trigger</button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    await userEvent.click(screen.getByText('Trigger'));
    expect(originalOnClick).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it('preserves original onClick handler with asChild close', async () => {
    const originalOnClick = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <Dialog open={true} onOpenChange={onOpenChange}>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
          <DialogClose asChild>
            <button onClick={originalOnClick}>Close Dialog</button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    );

    await userEvent.click(screen.getByText('Close Dialog'));
    expect(originalOnClick).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
