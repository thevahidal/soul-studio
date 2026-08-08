import { request } from './client';
import type {
  InsertRowResponse,
  ListRowsParams,
  ListRowsResponse,
  MutateRowResponse,
  Row,
  RowFilter,
} from './types';

// Mirrors soul/src/controllers/rows.js's exact grammar:
// `field[__operator]:value`, comma-separated, operator defaults to `eq`.
// `null`/`notnull` operators carry no value on the wire (the backend
// ignores whatever value it's given for those two). Array values use
// `field:[v1,v2,v3]` for an IN(...) match.
const serializeFilters = (filters: RowFilter[]): string =>
  filters
    .map(({ field, operator = 'eq', value }) => {
      const key = operator === 'eq' ? field : `${field}__${operator}`;
      if (operator === 'null' || operator === 'notnull') {
        return key;
      }
      const serializedValue = Array.isArray(value)
        ? `[${value.join(',')}]`
        : String(value);
      return `${key}:${serializedValue}`;
    })
    .join(',');

const buildListQuery = (params: ListRowsParams = {}): string => {
  const query = new URLSearchParams();
  if (params.page) query.set('_page', String(params.page));
  if (params.limit) query.set('_limit', String(params.limit));
  if (params.search) query.set('_search', params.search);
  if (params.filters?.length) {
    query.set('_filters', serializeFilters(params.filters));
  }
  if (params.ordering) query.set('_ordering', params.ordering);
  if (params.schema?.length) query.set('_schema', params.schema.join(','));
  if (params.extend?.length) query.set('_extend', params.extend.join(','));
  return query.toString();
};

interface LookupOptions {
  lookupField?: string;
}

const lookupQuery = ({ lookupField }: LookupOptions = {}): string => {
  const query = new URLSearchParams();
  if (lookupField) query.set('_lookup_field', lookupField);
  return query.toString();
};

export const listRows = (table: string, params?: ListRowsParams) => {
  const qs = buildListQuery(params);
  return request<ListRowsResponse>(
    `/api/tables/${encodeURIComponent(table)}/rows${qs ? `?${qs}` : ''}`,
  );
};

export const getRow = (
  table: string,
  pks: string | number,
  options: LookupOptions & { schema?: string[]; extend?: string[] } = {},
) => {
  const query = new URLSearchParams(lookupQuery(options));
  if (options.schema?.length) query.set('_schema', options.schema.join(','));
  if (options.extend?.length) query.set('_extend', options.extend.join(','));
  const qs = query.toString();
  return request<{ data: Row[] }>(
    `/api/tables/${encodeURIComponent(table)}/rows/${pks}${qs ? `?${qs}` : ''}`,
  );
};

export const insertRow = (table: string, fields: Row) =>
  request<InsertRowResponse>(`/api/tables/${encodeURIComponent(table)}/rows`, {
    method: 'POST',
    body: { fields },
  });

export const updateRow = (
  table: string,
  pks: string | number,
  fields: Row,
  options: LookupOptions = {},
) => {
  const qs = lookupQuery(options);
  return request<MutateRowResponse>(
    `/api/tables/${encodeURIComponent(table)}/rows/${pks}${qs ? `?${qs}` : ''}`,
    { method: 'PUT', body: { fields } },
  );
};

export const deleteRow = (
  table: string,
  pks: string | number,
  options: LookupOptions = {},
) => {
  const qs = lookupQuery(options);
  return request<MutateRowResponse>(
    `/api/tables/${encodeURIComponent(table)}/rows/${pks}${qs ? `?${qs}` : ''}`,
    { method: 'DELETE' },
  );
};
