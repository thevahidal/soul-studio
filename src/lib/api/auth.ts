import { request } from './client';
import type { ObtainTokenResponse } from './types';

export const login = (username: string, password: string) =>
  request<ObtainTokenResponse>('/api/auth/token/obtain', {
    method: 'POST',
    body: { fields: { username, password } },
  });

// Both the access and refresh tokens are httpOnly cookies -- there is no
// way to read them (or a decoded payload) from JS, and no `/api/auth/me`
// endpoint. This call doubles as the "am I still logged in?" probe on app
// boot/reload, and as the token-rotation call afterwards.
export const refreshSession = () =>
  request<{ message: string; data: { userId: number } }>(
    '/api/auth/token/refresh',
    { method: 'GET' },
  );

export const logout = () =>
  request<{ message: string }>('/api/auth/logout', { method: 'GET' });

export const changePassword = (currentPassword: string, newPassword: string) =>
  request<{ message: string }>('/api/auth/change-password', {
    method: 'PUT',
    body: { fields: { currentPassword, newPassword } },
  });
