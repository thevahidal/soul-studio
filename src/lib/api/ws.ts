import { env } from '$env/dynamic/public';
import type { WsBroadcast } from './types';

export type InsertData = Extract<WsBroadcast, { type: 'INSERT' }>['data'];
export type UpdateData = Extract<WsBroadcast, { type: 'UPDATE' }>['data'];
export type DeleteData = Extract<WsBroadcast, { type: 'DELETE' }>['data'];

export interface SubscribeCallbacks {
  onInsert?: (data: InsertData) => void;
  onUpdate?: (data: UpdateData, lookupField: string | undefined) => void;
  onDelete?: (data: DeleteData, lookupField: string | undefined) => void;
  // Called when the server rejects the subscription (missing/invalid
  // token, or insufficient read permission) -- see soul/src/websocket.js.
  // The server always closes with no explicit code/reason in this case,
  // so the preceding system message is the only signal for *why*.
  onAuthError?: (message: string) => void;
}

// Same-origin empty string can't work for WS the way it does for fetch()
// paths -- a scheme is required -- so mirror client.ts's baseUrl() but
// swap http(s) for ws(s), falling back to window.location when unset.
const wsBase = (): string => {
  const apiUrl = env.PUBLIC_SOUL_API_URL;
  if (apiUrl) return apiUrl.replace(/^http/, 'ws');
  const { protocol, host } = window.location;
  return `${protocol === 'https:' ? 'wss:' : 'ws:'}//${host}`;
};

const RECONNECT_DELAY_MS = 2000;
const MAX_RECONNECT_ATTEMPTS = 3;

// Never prefixed with /studio or /api -- `/ws` is a root-level path on
// Soul core, same as `/api` (see soul/src/server.js).
const wsUrlFor = (table: string): string =>
  `${wsBase()}/ws/tables/${encodeURIComponent(table)}`;

// Subscribes to realtime row-change broadcasts for a table. Returns an
// unsubscribe function that closes the connection and stops any pending
// reconnect attempt.
export const subscribeToTable = (
  table: string,
  { onInsert, onUpdate, onDelete, onAuthError }: SubscribeCallbacks,
): (() => void) => {
  let socket: WebSocket | null = null;
  let unsubscribed = false;
  let subscribed = false;
  let lastSystemMessage = '';
  let reconnectAttempts = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

  const connect = () => {
    socket = new WebSocket(wsUrlFor(table));

    socket.addEventListener('message', (event) => {
      let parsed: WsBroadcast | { message: string };
      try {
        parsed = JSON.parse(event.data);
      } catch {
        return;
      }

      if ('type' in parsed) {
        if (parsed.type === 'INSERT') onInsert?.(parsed.data);
        else if (parsed.type === 'UPDATE') {
          onUpdate?.(parsed.data, parsed._lookup_field);
        } else if (parsed.type === 'DELETE') {
          onDelete?.(parsed.data, parsed._lookup_field);
        }
        return;
      }

      lastSystemMessage = parsed.message;
      if (parsed.message.startsWith('Subscribed to table')) {
        subscribed = true;
        reconnectAttempts = 0;
      }
    });

    socket.addEventListener('close', () => {
      if (unsubscribed) return;

      if (!subscribed) {
        onAuthError?.(
          lastSystemMessage || 'Failed to subscribe to realtime updates',
        );
        return;
      }

      // Unexpected drop after a successful subscribe (not a rejection) --
      // retry a bounded number of times, then give up silently.
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts += 1;
        subscribed = false;
        reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
      }
    });
  };

  connect();

  return () => {
    unsubscribed = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    socket?.close();
  };
};
