import { spawn, spawnSync, type ChildProcess } from 'node:child_process';

// Spawns the Studio dev server itself pointed at an already-running Soul
// backend. Not using Playwright's built-in `webServer` option here: that
// config is static (evaluated once, before any setup code runs), but the
// backend's port is only known after soul-backend.ts's dynamic free-port
// pick -- starting both servers from a single globalSetup avoids relying
// on undocumented ordering between Playwright's webServer and globalSetup.
export interface StudioServer {
  baseUrl: string;
  stop: () => Promise<void>;
}

export const startStudioServer = async (
  port: number,
  soulApiUrl: string,
): Promise<StudioServer> => {
  // Runs the generate:extensions step ourselves and spawns Vite directly
  // rather than through `npm run dev`: npm's own process doesn't reliably
  // forward SIGTERM to the script it wraps on every platform, which left
  // an orphaned Vite process (and a squatted port) behind after
  // globalTeardown believed it had stopped the server.
  spawnSync('node', ['scripts/generate-extensions-registry.mjs']);

  const child: ChildProcess = spawn(
    './node_modules/.bin/vite',
    // --strictPort: fail fast instead of silently binding a different port
    // if `port` is already taken -- letting Vite fall back silently would
    // desync this fixture's assumed baseUrl from where the server actually
    // ended up listening.
    ['dev', '--port', String(port), '--strictPort'],
    {
      env: {
        ...process.env,
        PUBLIC_SOUL_API_URL: soulApiUrl,
      },
    },
  );

  const baseUrl = `http://localhost:${port}`;

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error('Studio dev server did not start within 30s'));
    }, 30000);

    const onData = (data: Buffer) => {
      if (data.toString().includes('ready in')) {
        clearTimeout(timeout);
        child.stdout?.off('data', onData);
        resolve();
      }
    };

    child.stdout?.on('data', onData);
    child.stderr?.on('data', (data: Buffer) => {
      console.error(`[studio-server] ${data.toString()}`);
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      clearTimeout(timeout);
      reject(new Error(`Studio dev server exited early with code ${code}`));
    });
  });

  return {
    baseUrl,
    stop: () =>
      new Promise<void>((resolve) => {
        child.once('exit', () => resolve());
        child.kill('SIGTERM');
        setTimeout(() => {
          if (!child.killed) child.kill('SIGKILL');
        }, 5000);
      }),
  };
};
