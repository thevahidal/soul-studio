import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import * as authApi from '$lib/api/auth';
import { listTables } from '$lib/api/tables';
import { registerSessionExpiredHandler } from '$lib/api/client';

type SessionStatus = 'unknown' | 'authenticated' | 'anonymous';

const createSessionStore = () => {
  let status = $state<SessionStatus>('unknown');
  let username = $state<string | null>(null);
  // UX hint only, never a security boundary -- table list/create have no
  // `:name` route param, so `hasTablePermission` always denies non-
  // superusers there. Every real action is still re-authorized server-side
  // regardless of what this flag says. See soul/src/middlewares/auth.js.
  let isSuperuserHint = $state(false);

  const detectSuperuserHint = async () => {
    try {
      await listTables();
      isSuperuserHint = true;
    } catch {
      isSuperuserHint = false;
    }
  };

  const clear = () => {
    status = 'anonymous';
    username = null;
    isSuperuserHint = false;
  };

  registerSessionExpiredHandler(() => {
    clear();
    goto(resolve('/login'));
  });

  const bootstrap = async () => {
    try {
      await authApi.refreshSession();
      status = 'authenticated';
      await detectSuperuserHint();
    } catch {
      status = 'anonymous';
    }
  };

  const login = async (user: string, password: string) => {
    await authApi.login(user, password);
    status = 'authenticated';
    username = user;
    await detectSuperuserHint();
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      clear();
      goto(resolve('/login'));
    }
  };

  return {
    get status() {
      return status;
    },
    get username() {
      return username;
    },
    get isSuperuserHint() {
      return isSuperuserHint;
    },
    get isAuthenticated() {
      return status === 'authenticated';
    },
    bootstrap,
    login,
    logout,
  };
};

export const session = createSessionStore();
