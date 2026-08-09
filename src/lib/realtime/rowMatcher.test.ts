import { describe, expect, it } from 'vitest';
import type { FieldDescriptor } from '$lib/metadata/schemaToForm';
import { rowMatchesQuery } from './rowMatcher';

const fields: FieldDescriptor[] = [
  {
    name: 'title',
    sqlType: 'TEXT',
    required: true,
    isPrimaryKey: false,
    defaultValue: null,
  },
  {
    name: 'year',
    sqlType: 'INTEGER',
    required: false,
    isPrimaryKey: false,
    defaultValue: null,
  },
];

describe('rowMatchesQuery', () => {
  it('matches everything when no search/filters are active', () => {
    expect(rowMatchesQuery({ title: 'Dune', year: 1965 }, { fields })).toBe(
      true,
    );
  });

  it('matches a case-insensitive substring search across visible fields', () => {
    const row = { title: 'Dune', year: 1965 };
    expect(rowMatchesQuery(row, { search: 'dun', fields })).toBe(true);
    expect(rowMatchesQuery(row, { search: '1965', fields })).toBe(true);
    expect(rowMatchesQuery(row, { search: 'nope', fields })).toBe(false);
  });

  it('applies eq/neq as string comparisons', () => {
    const row = { title: 'Dune', year: 1965 };
    expect(
      rowMatchesQuery(row, {
        fields,
        filters: [{ field: 'title', operator: 'eq', value: 'Dune' }],
      }),
    ).toBe(true);
    expect(
      rowMatchesQuery(row, {
        fields,
        filters: [{ field: 'title', operator: 'neq', value: 'Dune' }],
      }),
    ).toBe(false);
  });

  it('applies lt/gt/lte/gte as numeric comparisons when both sides parse as numbers', () => {
    const row = { title: 'Dune', year: 1965 };
    expect(
      rowMatchesQuery(row, {
        fields,
        filters: [{ field: 'year', operator: 'gt', value: '1900' }],
      }),
    ).toBe(true);
    expect(
      rowMatchesQuery(row, {
        fields,
        filters: [{ field: 'year', operator: 'lt', value: '1900' }],
      }),
    ).toBe(false);
    expect(
      rowMatchesQuery(row, {
        fields,
        filters: [{ field: 'year', operator: 'gte', value: '1965' }],
      }),
    ).toBe(true);
    expect(
      rowMatchesQuery(row, {
        fields,
        filters: [{ field: 'year', operator: 'lte', value: '1964' }],
      }),
    ).toBe(false);
  });

  it('applies null/notnull ignoring any filter value', () => {
    const row = { title: 'Dune', year: null };
    expect(
      rowMatchesQuery(row, {
        fields,
        filters: [{ field: 'year', operator: 'null', value: 'ignored' }],
      }),
    ).toBe(true);
    expect(
      rowMatchesQuery(row, {
        fields,
        filters: [{ field: 'title', operator: 'notnull', value: 'ignored' }],
      }),
    ).toBe(true);
  });

  it('requires every active filter to match (AND semantics)', () => {
    const row = { title: 'Dune', year: 1965 };
    expect(
      rowMatchesQuery(row, {
        fields,
        filters: [
          { field: 'title', operator: 'eq', value: 'Dune' },
          { field: 'year', operator: 'eq', value: '2000' },
        ],
      }),
    ).toBe(false);
  });

  it('combines search and filters with AND semantics', () => {
    const row = { title: 'Dune', year: 1965 };
    expect(
      rowMatchesQuery(row, {
        fields,
        search: 'dun',
        filters: [{ field: 'year', operator: 'eq', value: '1965' }],
      }),
    ).toBe(true);
    expect(
      rowMatchesQuery(row, {
        fields,
        search: 'nope',
        filters: [{ field: 'year', operator: 'eq', value: '1965' }],
      }),
    ).toBe(false);
  });
});
