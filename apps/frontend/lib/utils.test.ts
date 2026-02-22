import { describe, it, expect } from 'vitest';
import { cn, formatDateRange } from './utils';

describe('cn (className combiner)', () => {
  it('combines multiple class names', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
  });

  it('handles conditional classes', () => {
    expect(cn('base', { active: true, disabled: false })).toBe('base active');
  });

  it('filters out falsy values', () => {
    expect(cn('class1', null, undefined, false, 'class2')).toBe('class1 class2');
  });

  it('handles arrays of classes', () => {
    expect(cn(['class1', 'class2'], 'class3')).toBe('class1 class2 class3');
  });

  it('handles empty input', () => {
    expect(cn()).toBe('');
  });

  it('preserves duplicate classes (clsx behavior)', () => {
    // Note: clsx does not deduplicate classes, that's tailwind-merge's job
    expect(cn('class1', 'class1', 'class2')).toBe('class1 class1 class2');
  });
});

describe('formatDateRange', () => {
  it('returns empty string for null input', () => {
    expect(formatDateRange(null)).toBe('');
  });

  it('returns empty string for undefined input', () => {
    expect(formatDateRange(undefined)).toBe('');
  });

  it('returns empty string for empty string input', () => {
    expect(formatDateRange('')).toBe('');
  });

  it('formats "Jun 2025 Aug 2025" pattern', () => {
    expect(formatDateRange('Jun 2025 Aug 2025')).toBe('Jun 2025 - Aug 2025');
  });

  it('preserves existing hyphen separator', () => {
    expect(formatDateRange('Jun 2025 - Aug 2025')).toBe('Jun 2025 - Aug 2025');
  });

  it('formats "2023 2025" pattern', () => {
    expect(formatDateRange('2023 2025')).toBe('2023 - 2025');
  });

  it('handles single date without change', () => {
    expect(formatDateRange('Present')).toBe('Present');
  });

  it('normalizes en-dash to hyphen-minus', () => {
    expect(formatDateRange('Jun 2025 – Aug 2025')).toBe('Jun 2025 - Aug 2025');
  });

  it('normalizes em-dash to hyphen-minus', () => {
    expect(formatDateRange('Jun 2025 — Aug 2025')).toBe('Jun 2025 - Aug 2025');
  });

  it('normalizes spacing around existing hyphens', () => {
    expect(formatDateRange('Jun 2025-Aug 2025')).toBe('Jun 2025 - Aug 2025');
    expect(formatDateRange('Jun 2025  -  Aug 2025')).toBe('Jun 2025 - Aug 2025');
  });

  it('handles abbreviated month names', () => {
    expect(formatDateRange('Jan. 2025 Dec. 2025')).toBe('Jan. 2025 - Dec. 2025');
  });

  it('handles "Jun 2025 Present" pattern', () => {
    expect(formatDateRange('Jun 2025 Present')).toBe('Jun 2025 - Present');
  });

  it('handles "Jun 2025 Current" pattern (case insensitive)', () => {
    expect(formatDateRange('Jun 2025 Current')).toBe('Jun 2025 - Current');
    expect(formatDateRange('Jun 2025 current')).toBe('Jun 2025 - current');
  });

  it('handles "Jun 2025 Now" pattern', () => {
    expect(formatDateRange('Jun 2025 Now')).toBe('Jun 2025 - Now');
  });

  it('handles "Jun 2025 Ongoing" pattern', () => {
    expect(formatDateRange('Jun 2025 Ongoing')).toBe('Jun 2025 - Ongoing');
  });

  it('handles full month names', () => {
    expect(formatDateRange('January 2025 December 2025')).toBe('January 2025 - December 2025');
  });

  it('does not add separator to single year', () => {
    expect(formatDateRange('2025')).toBe('2025');
  });

  it('does not add separator to single month-year', () => {
    expect(formatDateRange('Jun 2025')).toBe('Jun 2025');
  });
});
