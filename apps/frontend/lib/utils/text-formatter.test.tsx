import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { formatTextWithLinks } from './text-formatter';

describe('formatTextWithLinks', () => {
  it('returns plain text without URLs unchanged', () => {
    const text = 'This is plain text';
    const result = formatTextWithLinks(text);
    const { container } = render(<>{result}</>);

    expect(container.textContent).toBe(text);
    expect(container.querySelectorAll('a')).toHaveLength(0);
  });

  it('converts HTTP URLs to links', () => {
    const text = 'Visit http://example.com for more';
    const result = formatTextWithLinks(text);
    const { container } = render(<>{result}</>);

    const links = container.querySelectorAll('a');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', 'http://example.com');
    expect(links[0]).toHaveTextContent('http://example.com');
  });

  it('converts HTTPS URLs to links', () => {
    const text = 'Visit https://example.com for more';
    const result = formatTextWithLinks(text);
    const { container } = render(<>{result}</>);

    const links = container.querySelectorAll('a');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', 'https://example.com');
  });

  it('handles multiple URLs in text', () => {
    const text = 'Check https://example.com and http://test.com';
    const result = formatTextWithLinks(text);
    const { container } = render(<>{result}</>);

    const links = container.querySelectorAll('a');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('href', 'https://example.com');
    expect(links[1]).toHaveAttribute('href', 'http://test.com');
  });

  it('preserves newlines with br elements', () => {
    const text = 'Line 1\nLine 2\nLine 3';
    const result = formatTextWithLinks(text);
    const { container } = render(<>{result}</>);

    const breaks = container.querySelectorAll('br');
    expect(breaks).toHaveLength(2);
    expect(container.textContent).toBe('Line 1Line 2Line 3');
  });

  it('handles URLs with newlines', () => {
    const text = 'First line\nhttps://example.com\nThird line';
    const result = formatTextWithLinks(text);
    const { container } = render(<>{result}</>);

    const links = container.querySelectorAll('a');
    const breaks = container.querySelectorAll('br');

    expect(links).toHaveLength(1);
    expect(breaks).toHaveLength(2);
    expect(links[0]).toHaveAttribute('href', 'https://example.com');
  });

  it('sets target="_blank" on links', () => {
    const text = 'Visit https://example.com';
    const result = formatTextWithLinks(text);
    const { container } = render(<>{result}</>);

    const link = container.querySelector('a');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('sets rel="noopener noreferrer" on links', () => {
    const text = 'Visit https://example.com';
    const result = formatTextWithLinks(text);
    const { container } = render(<>{result}</>);

    const link = container.querySelector('a');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('applies correct CSS classes to links', () => {
    const text = 'Visit https://example.com';
    const result = formatTextWithLinks(text);
    const { container } = render(<>{result}</>);

    const link = container.querySelector('a');
    expect(link).toHaveClass('text-blue-600', 'hover:underline');
  });

  it('handles URLs with query parameters', () => {
    const text = 'Search https://example.com?q=test&page=1';
    const result = formatTextWithLinks(text);
    const { container } = render(<>{result}</>);

    const link = container.querySelector('a');
    expect(link).toHaveAttribute('href', 'https://example.com?q=test&page=1');
  });

  it('handles URLs with hash fragments', () => {
    const text = 'Jump to https://example.com#section';
    const result = formatTextWithLinks(text);
    const { container } = render(<>{result}</>);

    const link = container.querySelector('a');
    expect(link).toHaveAttribute('href', 'https://example.com#section');
  });

  it('handles URLs with paths', () => {
    const text = 'Read https://example.com/docs/guide.html';
    const result = formatTextWithLinks(text);
    const { container } = render(<>{result}</>);

    const link = container.querySelector('a');
    expect(link).toHaveAttribute('href', 'https://example.com/docs/guide.html');
  });

  it('handles empty string', () => {
    const result = formatTextWithLinks('');
    expect(result).toEqual([]);
  });

  it('handles text with only a URL', () => {
    const text = 'https://example.com';
    const result = formatTextWithLinks(text);
    const { container } = render(<>{result}</>);

    const link = container.querySelector('a');
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(container.textContent).toBe('https://example.com');
  });

  it('handles consecutive newlines', () => {
    const text = 'Line 1\n\nLine 3';
    const result = formatTextWithLinks(text);
    const { container } = render(<>{result}</>);

    const breaks = container.querySelectorAll('br');
    expect(breaks).toHaveLength(2);
  });

  it('preserves surrounding text with URLs', () => {
    const text = 'Before https://example.com After';
    const result = formatTextWithLinks(text);
    const { container } = render(<>{result}</>);

    expect(container.textContent).toBe('Before https://example.com After');
  });
});
