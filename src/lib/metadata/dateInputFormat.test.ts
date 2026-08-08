import { describe, expect, it } from 'vitest';
import {
  fromDatetimeLocalInputValue,
  toDateInputValue,
  toDatetimeLocalInputValue,
} from './dateInputFormat';

describe('toDateInputValue', () => {
  it('extracts the date portion from a SQLite DATETIME string', () => {
    expect(toDateInputValue('2026-08-08 18:41:54')).toBe('2026-08-08');
  });

  it('passes through a bare DATE string unchanged', () => {
    expect(toDateInputValue('2026-08-08')).toBe('2026-08-08');
  });

  it('returns an empty string for a non-string value', () => {
    expect(toDateInputValue(null)).toBe('');
    expect(toDateInputValue(undefined)).toBe('');
  });
});

describe('toDatetimeLocalInputValue', () => {
  it('converts a SQLite DATETIME string to datetime-local format', () => {
    expect(toDatetimeLocalInputValue('2026-08-08 18:41:54')).toBe(
      '2026-08-08T18:41',
    );
  });

  it('returns an empty string for a non-string value', () => {
    expect(toDatetimeLocalInputValue(null)).toBe('');
  });
});

describe('fromDatetimeLocalInputValue', () => {
  it('converts a minute-precision datetime-local value back to SQLite format', () => {
    expect(fromDatetimeLocalInputValue('2026-08-08T18:41')).toBe(
      '2026-08-08 18:41:00',
    );
  });

  it('preserves seconds when the input already includes them', () => {
    expect(fromDatetimeLocalInputValue('2026-08-08T18:41:30')).toBe(
      '2026-08-08 18:41:30',
    );
  });

  it('passes through an empty value unchanged', () => {
    expect(fromDatetimeLocalInputValue('')).toBe('');
  });

  it('round-trips through toDatetimeLocalInputValue back to the original minute', () => {
    const original = '2026-08-08 18:41:54';
    const displayed = toDatetimeLocalInputValue(original);
    const resubmitted = fromDatetimeLocalInputValue(displayed);
    // seconds are lost (native input has minute precision) but everything
    // else round-trips
    expect(resubmitted).toBe('2026-08-08 18:41:00');
  });
});
