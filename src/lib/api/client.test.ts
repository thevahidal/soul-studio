import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from './errors';

// $env/dynamic/public reads injected values at request time via the
// adapter-node handler -- that context doesn't exist in a plain Vitest
// process, so it's stubbed here rather than pulling in SvelteKit's dev
// server just for a unit test.
vi.mock('$env/dynamic/public', () => ({ env: {} }));

const { request, registerSessionExpiredHandler } = await import('./client');

describe('request', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    registerSessionExpiredHandler(() => {});
  });

  const jsonResponse = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  it('returns the parsed JSON body on success', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      jsonResponse(200, { data: [{ name: 'Album' }] }),
    );

    const result = await request<{ data: { name: string }[] }>('/api/tables/');

    expect(result.data).toEqual([{ name: 'Album' }]);
  });

  it('always sends credentials: include', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      jsonResponse(200, { data: [] }),
    );

    await request('/api/tables/');

    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(init.credentials).toBe('include');
  });

  it('throws a typed HttpError with the response message on a non-2xx status', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      jsonResponse(400, { message: 'Invalid table name' }),
    );

    await expect(request('/api/tables/bad name')).rejects.toMatchObject({
      status: 400,
      message: 'Invalid table name',
    });
  });

  it('on a 401, refreshes once and retries the original request', async () => {
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce(jsonResponse(401, { message: 'Unauthorized' })) // original request
      .mockResolvedValueOnce(jsonResponse(200, { message: 'Success' })) // refresh call
      .mockResolvedValueOnce(jsonResponse(200, { data: [] })); // retried request

    const result = await request<{ data: unknown[] }>('/api/tables/');

    expect(result.data).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toContain('/api/auth/token/refresh');
  });

  it('dedupes concurrent 401s into a single refresh call', async () => {
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce(jsonResponse(401, { message: 'Unauthorized' }))
      .mockResolvedValueOnce(jsonResponse(401, { message: 'Unauthorized' }))
      .mockResolvedValueOnce(jsonResponse(200, { message: 'Success' })) // shared refresh
      .mockResolvedValueOnce(jsonResponse(200, { data: [1] }))
      .mockResolvedValueOnce(jsonResponse(200, { data: [2] }));

    const [a, b] = await Promise.all([
      request<{ data: number[] }>('/api/tables/one'),
      request<{ data: number[] }>('/api/tables/two'),
    ]);

    expect(a.data).toEqual([1]);
    expect(b.data).toEqual([2]);

    const refreshCalls = fetchMock.mock.calls.filter(([url]) =>
      String(url).includes('/api/auth/token/refresh'),
    );
    expect(refreshCalls).toHaveLength(1);
  });

  it('calls the registered session-expired handler when refresh itself fails', async () => {
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce(jsonResponse(401, { message: 'Unauthorized' }))
      .mockResolvedValueOnce(
        jsonResponse(403, { message: 'Invalid refresh token' }),
      );

    const onExpired = vi.fn();
    registerSessionExpiredHandler(onExpired);

    await expect(request('/api/tables/')).rejects.toBeInstanceOf(HttpError);
    expect(onExpired).toHaveBeenCalledOnce();
  });
});
