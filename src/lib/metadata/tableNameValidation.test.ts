import { describe, expect, it } from 'vitest';
import { isValidIdentifier } from './tableNameValidation';

describe('isValidIdentifier', () => {
  it('accepts letters, numbers, underscores, and hyphens between 2 and 30 chars', () => {
    expect(isValidIdentifier('books')).toBe(true);
    expect(isValidIdentifier('my_table-1')).toBe(true);
    expect(isValidIdentifier('ab')).toBe(true);
    expect(isValidIdentifier('a'.repeat(30))).toBe(true);
  });

  it('rejects names shorter than 2 or longer than 30 chars', () => {
    expect(isValidIdentifier('a')).toBe(false);
    expect(isValidIdentifier('')).toBe(false);
    expect(isValidIdentifier('a'.repeat(31))).toBe(false);
  });

  it('rejects characters outside [\\w-]', () => {
    expect(isValidIdentifier('my table')).toBe(false);
    expect(isValidIdentifier('my.table')).toBe(false);
    expect(isValidIdentifier('my/table')).toBe(false);
  });
});
