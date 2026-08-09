import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// $env/dynamic/public reads injected values at request time via the
// adapter-node handler -- that context doesn't exist in a plain Vitest
// process, so it's stubbed here rather than pulling in SvelteKit's dev
// server just for a unit test (same convention as client.test.ts).
vi.mock('$env/dynamic/public', () => ({
  env: { PUBLIC_SOUL_API_URL: 'http://localhost:8000' },
}));

const { subscribeToTable } = await import('./ws');

class FakeWebSocket {
  url: string;
  listeners: Record<string, ((event: unknown) => void)[]> = {
    message: [],
    close: [],
  };
  closed = false;

  constructor(url: string) {
    this.url = url;
    FakeWebSocket.instances.push(this);
  }

  addEventListener(type: string, handler: (event: unknown) => void) {
    this.listeners[type]?.push(handler);
  }

  close() {
    this.closed = true;
  }

  emitMessage(data: unknown) {
    const payload = { data: JSON.stringify(data) };
    this.listeners.message.forEach((handler) => handler(payload));
  }

  emitClose() {
    this.listeners.close.forEach((handler) => handler({}));
  }

  static instances: FakeWebSocket[] = [];
}

describe('subscribeToTable', () => {
  beforeEach(() => {
    FakeWebSocket.instances = [];
    vi.stubGlobal('WebSocket', FakeWebSocket);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('connects to /ws/tables/<name> with the http->ws scheme swap, never under /studio or /api', () => {
    subscribeToTable('books', {});

    expect(FakeWebSocket.instances).toHaveLength(1);
    expect(FakeWebSocket.instances[0].url).toBe(
      'ws://localhost:8000/ws/tables/books',
    );
  });

  it('dispatches INSERT/UPDATE/DELETE broadcasts to their matching callback', () => {
    const onInsert = vi.fn();
    const onUpdate = vi.fn();
    const onDelete = vi.fn();
    subscribeToTable('books', { onInsert, onUpdate, onDelete });
    const socket = FakeWebSocket.instances[0];

    socket.emitMessage({ type: 'INSERT', data: { pk: 1, title: 'Dune' } });
    socket.emitMessage({
      type: 'UPDATE',
      _lookup_field: 'id',
      data: { pks: ['1'], title: 'Dune (updated)' },
    });
    socket.emitMessage({
      type: 'DELETE',
      _lookup_field: 'id',
      data: { pks: ['1'] },
    });

    expect(onInsert).toHaveBeenCalledWith({ pk: 1, title: 'Dune' });
    expect(onUpdate).toHaveBeenCalledWith(
      { pks: ['1'], title: 'Dune (updated)' },
      'id',
    );
    expect(onDelete).toHaveBeenCalledWith({ pks: ['1'] }, 'id');
  });

  it('ignores system messages like the subscribe confirmation', () => {
    const onInsert = vi.fn();
    subscribeToTable('books', { onInsert });
    const socket = FakeWebSocket.instances[0];

    socket.emitMessage({ message: 'Subscribed to table "books"' });

    expect(onInsert).not.toHaveBeenCalled();
  });

  it('calls onAuthError with the last system message when the socket closes before subscribing', () => {
    const onAuthError = vi.fn();
    subscribeToTable('books', { onAuthError });
    const socket = FakeWebSocket.instances[0];

    socket.emitMessage({ message: 'Missing access token' });
    socket.emitClose();

    expect(onAuthError).toHaveBeenCalledWith('Missing access token');
  });

  it('does not call onAuthError when the socket closes after a successful subscribe', () => {
    vi.useFakeTimers();
    const onAuthError = vi.fn();
    subscribeToTable('books', { onAuthError });
    const socket = FakeWebSocket.instances[0];

    socket.emitMessage({ message: 'Subscribed to table "books"' });
    socket.emitClose();

    expect(onAuthError).not.toHaveBeenCalled();
  });

  it('reconnects after an unexpected drop following a successful subscribe', () => {
    vi.useFakeTimers();
    subscribeToTable('books', {});
    const first = FakeWebSocket.instances[0];

    first.emitMessage({ message: 'Subscribed to table "books"' });
    first.emitClose();

    expect(FakeWebSocket.instances).toHaveLength(1);
    vi.advanceTimersByTime(2000);
    expect(FakeWebSocket.instances).toHaveLength(2);
  });

  it('does not reconnect once unsubscribed', () => {
    vi.useFakeTimers();
    const unsubscribe = subscribeToTable('books', {});
    const first = FakeWebSocket.instances[0];
    first.emitMessage({ message: 'Subscribed to table "books"' });

    unsubscribe();
    expect(first.closed).toBe(true);

    first.emitClose();
    vi.advanceTimersByTime(10000);
    expect(FakeWebSocket.instances).toHaveLength(1);
  });
});
