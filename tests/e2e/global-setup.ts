import { startSoulBackend } from './fixtures/soul-backend';
import { startStudioServer } from './fixtures/studio-server';
import { writeSharedState, type E2eState } from './fixtures/shared-state';
import { seedPlugin } from './fixtures/seed-plugin';

const STUDIO_PORT = 3100;
const SEED_TABLE = 'books';
// Separate from SEED_TABLE deliberately: the plugin fixture overrides this
// table's field rendering, and plugin field renderers don't get an `id` to
// wire up label association (see FieldRendererProps) -- reusing `books`
// here would break rows-crud.spec.ts's `getByLabel('authorName')` lookups.
const PLUGIN_TABLE = 'plugin_demo';

// Seeds fixture data via real API calls (not raw DB writes) once both
// servers are up -- this doubles as a smoke test of the write path itself.
// Every call's status is checked: a silent 403/400 here would otherwise
// surface confusingly as "element not found" in a spec file with no clue
// that the actual cause was upstream in setup.
const seedData = async (state: E2eState) => {
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
      `e2e seed: login failed (${loginRes.status}): ${await loginRes.text()}`,
    );
  }
  const cookies = loginRes.headers.get('set-cookie') ?? '';
  const accessToken = /accessToken=([^;]+)/.exec(cookies)?.[1];
  const authHeaders = {
    'Content-Type': 'application/json',
    Cookie: `accessToken=${accessToken}`,
  };

  const createTableRes = await fetch(`${state.apiUrl}/api/tables/`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: SEED_TABLE,
      schema: [
        { name: 'title', type: 'TEXT', notNull: true },
        { name: 'authorName', type: 'TEXT' },
      ],
    }),
  });
  if (!createTableRes.ok) {
    throw new Error(
      `e2e seed: create table failed (${createTableRes.status}): ${await createTableRes.text()}`,
    );
  }

  const insertRowRes = await fetch(
    `${state.apiUrl}/api/tables/${SEED_TABLE}/rows`,
    {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        fields: { title: 'Dune', authorName: 'Frank Herbert' },
      }),
    },
  );
  if (!insertRowRes.ok) {
    throw new Error(
      `e2e seed: insert row failed (${insertRowRes.status}): ${await insertRowRes.text()}`,
    );
  }

  const createPluginTableRes = await fetch(`${state.apiUrl}/api/tables/`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: PLUGIN_TABLE,
      schema: [{ name: 'note', type: 'TEXT' }],
    }),
  });
  if (!createPluginTableRes.ok) {
    throw new Error(
      `e2e seed: create plugin table failed (${createPluginTableRes.status}): ${await createPluginTableRes.text()}`,
    );
  }

  const insertPluginRowRes = await fetch(
    `${state.apiUrl}/api/tables/${PLUGIN_TABLE}/rows`,
    {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ fields: { note: 'Plugin demo row' } }),
    },
  );
  if (!insertPluginRowRes.ok) {
    throw new Error(
      `e2e seed: insert plugin row failed (${insertPluginRowRes.status}): ${await insertPluginRowRes.text()}`,
    );
  }
};

export default async function globalSetup() {
  const studioOrigin = `http://localhost:${STUDIO_PORT}`;
  const backend = await startSoulBackend(studioOrigin);

  // Must happen before the Studio dev server starts: the extensions
  // registry is only (re)generated once, via the predev hook that runs
  // ahead of Vite -- a plugin dropped in afterward wouldn't be picked up
  // without a restart.
  const removePlugin = seedPlugin();
  const studio = await startStudioServer(STUDIO_PORT, backend.baseUrl);

  const state: E2eState = {
    apiUrl: backend.baseUrl,
    wsUrl: backend.wsUrl,
    adminUsername: backend.adminUsername,
    adminPassword: backend.adminPassword,
    seedTable: SEED_TABLE,
    pluginTable: PLUGIN_TABLE,
  };

  await seedData(state);
  writeSharedState(state);

  return async () => {
    await studio.stop();
    await backend.stop();
    removePlugin();
  };
}
