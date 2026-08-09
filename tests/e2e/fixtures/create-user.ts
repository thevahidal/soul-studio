import { readSharedState } from './shared-state';

// Registers a new (non-superuser) user via a real authenticated API call --
// mirrors global-setup.ts's own seedData() pattern (login as the shared
// admin, extract the accessToken cookie, authenticated POST) rather than
// writing to the DB directly, so this doubles as a smoke test of the same
// write path the app itself uses. New users are always non-superuser and
// get the default role assigned automatically -- see
// soul/src/controllers/auth/user.js.
export const createTestUser = async (
  username: string,
  password: string,
): Promise<void> => {
  const state = readSharedState();

  const loginRes = await fetch(`${state.apiUrl}/api/auth/token/obtain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: {
        username: state.adminUsername,
        password: state.adminPassword,
      },
    }),
  });
  if (!loginRes.ok) {
    throw new Error(
      `create test user: admin login failed (${loginRes.status}): ${await loginRes.text()}`,
    );
  }
  const cookies = loginRes.headers.get('set-cookie') ?? '';
  const accessToken = /accessToken=([^;]+)/.exec(cookies)?.[1];

  const res = await fetch(`${state.apiUrl}/api/tables/_users/rows`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `accessToken=${accessToken}`,
    },
    body: JSON.stringify({ fields: { username, password } }),
  });
  if (!res.ok) {
    throw new Error(
      `create test user failed (${res.status}): ${await res.text()}`,
    );
  }
};
