import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// globalSetup and spec files run in separate processes -- this is how
// state (the ephemeral backend's URL/credentials) crosses that boundary.
const STATE_FILE = join(process.cwd(), 'tests/e2e/.e2e-state.json');

export interface E2eState {
  apiUrl: string;
  adminUsername: string;
  adminPassword: string;
  seedTable: string;
}

export const writeSharedState = (state: E2eState): void => {
  writeFileSync(STATE_FILE, JSON.stringify(state));
};

export const readSharedState = (): E2eState =>
  JSON.parse(readFileSync(STATE_FILE, 'utf-8'));
