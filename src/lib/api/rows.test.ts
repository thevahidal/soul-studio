import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$env/dynamic/public', () => ({ env: {} }));

const { listRows, getRow, insertRow, updateRow, deleteRow } =
  await import('./rows');

describe('rows API query building', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const ok = (body: unknown = { data: [] }) =>
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  const calledUrl = () =>
    (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;

  it('builds a bare rows URL with no params', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(ok());
    await listRows('orders');
    expect(calledUrl()).toBe('/api/tables/orders/rows');
  });

  it('serializes page/limit/search', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(ok());
    await listRows('orders', { page: 2, limit: 25, search: 'acme' });
    const url = new URL(calledUrl(), 'http://x');
    expect(url.searchParams.get('_page')).toBe('2');
    expect(url.searchParams.get('_limit')).toBe('25');
    expect(url.searchParams.get('_search')).toBe('acme');
  });

  it('serializes a default-operator filter as field:value with no __eq suffix', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(ok());
    await listRows('orders', { filters: [{ field: 'status', value: 'open' }] });
    const url = new URL(calledUrl(), 'http://x');
    expect(url.searchParams.get('_filters')).toBe('status:open');
  });

  it('serializes a non-default operator with a __operator suffix', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(ok());
    await listRows('orders', {
      filters: [{ field: 'total', operator: 'gte', value: 100 }],
    });
    const url = new URL(calledUrl(), 'http://x');
    expect(url.searchParams.get('_filters')).toBe('total__gte:100');
  });

  it('serializes an array value as a bracketed IN(...) list', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(ok());
    await listRows('orders', {
      filters: [{ field: 'id', value: [1, 2, 3] }],
    });
    const url = new URL(calledUrl(), 'http://x');
    expect(url.searchParams.get('_filters')).toBe('id:[1,2,3]');
  });

  it('serializes null/notnull operators with no value', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(ok());
    await listRows('orders', {
      filters: [{ field: 'deletedAt', operator: 'notnull', value: null }],
    });
    const url = new URL(calledUrl(), 'http://x');
    expect(url.searchParams.get('_filters')).toBe('deletedAt__notnull');
  });

  it('joins multiple filters with commas', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(ok());
    await listRows('orders', {
      filters: [
        { field: 'status', value: 'open' },
        { field: 'total', operator: 'gte', value: 100 },
      ],
    });
    const url = new URL(calledUrl(), 'http://x');
    expect(url.searchParams.get('_filters')).toBe('status:open,total__gte:100');
  });

  it('serializes ordering, schema, and extend', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(ok());
    await listRows('orders', {
      ordering: '-createdAt',
      schema: ['id', 'status'],
      extend: ['customerId'],
    });
    const url = new URL(calledUrl(), 'http://x');
    expect(url.searchParams.get('_ordering')).toBe('-createdAt');
    expect(url.searchParams.get('_schema')).toBe('id,status');
    expect(url.searchParams.get('_extend')).toBe('customerId');
  });

  it('getRow includes _lookup_field when provided', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(ok());
    await getRow('orders', 'ORD-1', { lookupField: 'orderCode' });
    const url = new URL(calledUrl(), 'http://x');
    expect(url.pathname).toBe('/api/tables/orders/rows/ORD-1');
    expect(url.searchParams.get('_lookup_field')).toBe('orderCode');
  });

  it('insertRow POSTs { fields } to the collection URL', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      ok({ message: 'Row inserted', data: { changes: 1, lastInsertRowid: 9 } }),
    );
    await insertRow('orders', { status: 'open' });
    const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe('/api/tables/orders/rows');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ fields: { status: 'open' } });
  });

  it('updateRow PUTs { fields } to the pk URL', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      ok({ message: 'Row updated', data: { changes: 1 } }),
    );
    await updateRow('orders', 9, { status: 'closed' });
    const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe('/api/tables/orders/rows/9');
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body)).toEqual({ fields: { status: 'closed' } });
  });

  it('deleteRow DELETEs the pk URL, supporting comma-joined bulk pks', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      ok({ message: 'Row deleted', data: { changes: 2 } }),
    );
    await deleteRow('orders', '8,9');
    const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe('/api/tables/orders/rows/8,9');
    expect(init.method).toBe('DELETE');
  });
});
