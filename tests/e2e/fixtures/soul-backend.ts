import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import net from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Spawns a real Soul instance as a subprocess -- mirrors the pattern
// soul/src/cli.test.js uses to test its own CLI, and soul/src/tests/
// globalSetup.js's "set up once, tear down once" shape. Two resolution
// modes for where the backend code comes from:
//
//  - SOUL_BACKEND_CWD env var: an explicit path to a `soul` checkout.
//    Needed while the SameSite/foreignKeys/updatesuperuser fixes this
//    Studio rebuild depends on aren't on a published `soul-cli` release
//    yet.
//  - Sibling `../soul` directory: convenience default for the common dev
//    layout where both repos are checked out side by side (as they are in
//    this project's actual development environment).
//
// Neither present -> throw with a clear message rather than silently
// falling back to something that would produce confusing failures.
const resolveBackendCwd = (): string => {
  if (process.env.SOUL_BACKEND_CWD) {
    return process.env.SOUL_BACKEND_CWD;
  }
  const sibling = join(process.cwd(), '..', 'soul');
  if (existsSync(join(sibling, 'src', 'server.js'))) {
    return sibling;
  }
  throw new Error(
    'Could not find a Soul backend checkout to run e2e tests against. ' +
      'Set SOUL_BACKEND_CWD to a local `soul` checkout, or check one out ' +
      'at ../soul relative to soul-studio.',
  );
};

const findFreePort = (): Promise<number> =>
  new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on('error', reject);
    server.listen(0, () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      server.close(() => resolve(port));
    });
  });

const waitForReady = (
  child: ChildProcess,
  marker: string,
  timeoutMs: number,
  label: string,
): Promise<void> =>
  new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error(`${label} did not start within ${timeoutMs}ms`));
    }, timeoutMs);

    const onData = (data: Buffer) => {
      if (data.toString().includes(marker)) {
        clearTimeout(timeout);
        child.stdout?.off('data', onData);
        resolve();
      }
    };

    child.stdout?.on('data', onData);
    child.stderr?.on('data', (data: Buffer) => {
      console.error(`[${label}] ${data.toString()}`);
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      clearTimeout(timeout);
      reject(new Error(`${label} exited early with code ${code}`));
    });
  });

const stopChild = (child: ChildProcess): Promise<void> =>
  new Promise((resolve) => {
    child.once('exit', () => resolve());
    child.kill('SIGTERM');
    setTimeout(() => {
      if (!child.killed) child.kill('SIGKILL');
    }, 5000);
  });

export interface SoulBackend {
  baseUrl: string;
  wsUrl: string;
  tokenSecret: string;
  adminUsername: string;
  adminPassword: string;
  stop: () => Promise<void>;
}

export const startSoulBackend = async (
  studioOrigin: string,
): Promise<SoulBackend> => {
  const cwd = resolveBackendCwd();
  const port = await findFreePort();
  const tokenSecret = 'e2e-test-secret-0123456789';
  const adminUsername = 'admin';
  const adminPassword = 'Str0ngTestPw!1';

  // A real file DB (not :memory:) is required here: promoting the initial
  // user to superuser needs the `updatesuperuser` CLI command to run
  // against the *same* database a second time, and better-sqlite3's
  // :memory: databases are private to the process that opened them -- a
  // separate CLI invocation against `:memory:` would just create its own
  // empty database, not touch the running server's.
  const dbDir = mkdtempSync(join(tmpdir(), 'soul-studio-e2e-'));
  const dbPath = join(dbDir, 'e2e.db');

  const serverArgs = [
    'src/server.js',
    '-d',
    dbPath,
    '-p',
    String(port),
    '-a',
    '--ts',
    tokenSecret,
    '--iuu',
    adminUsername,
    '--iup',
    adminPassword,
    '--cors',
    studioOrigin,
  ];
  const spawnEnv = {
    ...process.env,
    COOKIE_SAMESITE: 'none',
    COOKIE_SECURE: 'true',
    NODE_ENV: 'test',
  };

  // 1. Boot once so `createInitialUser` runs and inserts `admin` (always
  //    non-superuser -- there's no flag to create a ready-made superuser
  //    directly).
  let child = spawn('node', serverArgs, { cwd, env: spawnEnv });
  await waitForReady(child, 'Soul is running', 15000, 'soul-backend');
  await stopChild(child);

  // 2. Promote it to superuser via the CLI, now that the file is unlocked.
  //    Table create/list (needed to seed fixture data) is superuser-only
  //    when AUTH is on -- see soul/src/middlewares/auth.js.
  const promote = spawnSync(
    'node',
    [
      'src/server.js',
      'updatesuperuser',
      '--id=1',
      '--is_superuser=true',
      '-d',
      dbPath,
    ],
    { cwd, env: spawnEnv, encoding: 'utf-8', timeout: 15000 },
  );
  if (!promote.stdout?.includes('updated successfully')) {
    throw new Error(
      `Failed to promote e2e admin user to superuser: ${promote.stdout}\n${promote.stderr}`,
    );
  }

  // 3. Restart for real -- createInitialUser no-ops once a user already
  //    exists, so this won't recreate or duplicate `admin`.
  child = spawn('node', serverArgs, { cwd, env: spawnEnv });
  await waitForReady(child, 'Soul is running', 15000, 'soul-backend');

  return {
    baseUrl: `http://localhost:${port}`,
    wsUrl: `ws://localhost:${port}`,
    tokenSecret,
    adminUsername,
    adminPassword,
    stop: async () => {
      await stopChild(child);
      rmSync(dbDir, { recursive: true, force: true });
    },
  };
};
