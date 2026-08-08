import { describe, expect, it } from 'vitest';
import { displayLabel, pickDisplayField } from './displayValue';

describe('pickDisplayField', () => {
  it('picks the first string-valued key', () => {
    expect(pickDisplayField({ id: 1, name: 'Alice', age: 30 })).toBe('name');
  });

  it('excludes keys in excludeKeys even if they are strings', () => {
    expect(pickDisplayField({ code: 'ABC', name: 'Alice' }, ['code'])).toBe(
      'name',
    );
  });

  it('returns undefined when no string-valued column exists', () => {
    expect(pickDisplayField({ id: 1, active: true })).toBeUndefined();
  });
});

describe('displayLabel', () => {
  it('returns the first string field value', () => {
    expect(displayLabel({ id: 1, name: 'Alice' })).toBe('Alice');
  });

  it('falls back to the id column when no string field exists', () => {
    expect(displayLabel({ id: 42, active: true })).toBe('42');
  });

  it('falls back to the first key when there is no id column either', () => {
    expect(displayLabel({ code: 7, active: true })).toBe('7');
  });

  it('returns an empty string for a missing row', () => {
    expect(displayLabel(undefined)).toBe('');
    expect(displayLabel(null)).toBe('');
  });
});
