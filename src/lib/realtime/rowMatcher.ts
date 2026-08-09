import type { FieldDescriptor } from '$lib/metadata/schemaToForm';
import type { FilterOperator, Row } from '$lib/api/types';

// Structurally compatible with FilterBar's `DraftFilter` (value always a
// string while being edited) without importing from a component file.
export interface RowMatchFilter {
  field: string;
  operator?: FilterOperator;
  value: string;
}

export interface RowMatchQuery {
  search?: string;
  filters?: RowMatchFilter[];
  fields: FieldDescriptor[];
}

// Numeric comparison when both sides parse as numbers, else falls back to
// a locale-aware string comparison -- either way reduced to a plain
// number so the same `cmp` callback works for both branches.
const compare = (
  rawValue: unknown,
  rawFilterValue: string,
  cmp: (a: number, b: number) => boolean,
): boolean => {
  const a = Number(rawValue);
  const b = Number(rawFilterValue);
  if (rawValue !== null && rawValue !== undefined && rawValue !== '') {
    if (!Number.isNaN(a) && !Number.isNaN(b)) return cmp(a, b);
  }
  return cmp(String(rawValue ?? '').localeCompare(rawFilterValue), 0);
};

const matchesFilter = (row: Row, filter: RowMatchFilter): boolean => {
  const value = row[filter.field];
  switch (filter.operator ?? 'eq') {
    case 'null':
      return value === null || value === undefined;
    case 'notnull':
      return value !== null && value !== undefined;
    case 'eq':
      return String(value ?? '') === filter.value;
    case 'neq':
      return String(value ?? '') !== filter.value;
    case 'lt':
      return compare(value, filter.value, (a, b) => a < b);
    case 'gt':
      return compare(value, filter.value, (a, b) => a > b);
    case 'lte':
      return compare(value, filter.value, (a, b) => a <= b);
    case 'gte':
      return compare(value, filter.value, (a, b) => a >= b);
    default:
      return true;
  }
};

const matchesSearch = (
  row: Row,
  search: string,
  fields: FieldDescriptor[],
): boolean => {
  const needle = search.toLowerCase();
  return fields.some((field) => {
    const value = row[field.name];
    if (value === null || value === undefined) return false;
    const text =
      typeof value === 'object' ? JSON.stringify(value) : String(value);
    return text.toLowerCase().includes(needle);
  });
};

// Reimplements the same predicate Soul's backend applies server-side (see
// soul/src/controllers/rows.js) so realtime broadcasts -- which the
// backend sends to every subscriber with no server-side query filtering --
// can be filtered client-side against the currently-active search/filters
// before being merged into the visible row list.
export const rowMatchesQuery = (
  row: Row,
  { search, filters, fields }: RowMatchQuery,
): boolean => {
  if (search && !matchesSearch(row, search, fields)) return false;
  if (
    filters?.length &&
    !filters.every((filter) => matchesFilter(row, filter))
  ) {
    return false;
  }
  return true;
};
