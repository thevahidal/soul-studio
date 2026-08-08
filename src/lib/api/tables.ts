import { request } from './client';
import type {
  CreateTablePayload,
  TableListItem,
  TableSchemaColumn,
} from './types';

export const listTables = (params?: { search?: string; ordering?: string }) => {
  const query = new URLSearchParams();
  if (params?.search) query.set('_search', params.search);
  if (params?.ordering) query.set('_ordering', params.ordering);
  const qs = query.toString();
  return request<{ data: TableListItem[] }>(
    `/api/tables/${qs ? `?${qs}` : ''}`,
  );
};

export const getTableSchema = (name: string) =>
  request<{ data: TableSchemaColumn[] }>(
    `/api/tables/${encodeURIComponent(name)}`,
  );

export const createTable = (payload: CreateTablePayload) =>
  request<{
    message: string;
    data: { name: string; schema: TableSchemaColumn[] };
  }>('/api/tables/', { method: 'POST', body: payload });

export const deleteTable = (name: string) =>
  request<{ message: string }>(`/api/tables/${encodeURIComponent(name)}`, {
    method: 'DELETE',
  });
