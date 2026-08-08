import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const EXTENSIONS_DIR = join(process.cwd(), '_studio_extensions');

// Targets a dedicated plugin_demo table/column rather than the shared
// `books` fixture table -- plugin field renderers don't get an `id` to
// wire up label association (see FieldRendererProps), so overriding a
// column other specs reach via getByLabel() would break them.
const PLUGIN_ENTRY = `import type { StudioPlugin } from '../src/lib/extensions/types';
import Field from './e2e-plugin-field.svelte';

const plugin: StudioPlugin = {
  navItems: [{ label: 'E2E Plugin Nav', href: '/tables/plugin_demo' }],
  fieldRenderers: [
    { table: 'plugin_demo', column: 'note', component: Field },
  ],
  rowActions: [
    {
      table: 'plugin_demo',
      label: 'E2E Row Action',
      onClick: () => {},
    },
  ],
};

export default plugin;
`;

const PLUGIN_FIELD_COMPONENT = `<script lang="ts">
  let {
    value,
    onchange,
    disabled = false,
  }: {
    value: unknown;
    onchange: (value: unknown) => void;
    disabled?: boolean;
  } = $props();
</script>

<input
  data-testid="e2e-plugin-field"
  type="text"
  value={value ?? ''}
  {disabled}
  oninput={(e) => onchange(e.currentTarget.value)}
/>
`;

// Written *before* the Studio dev server starts -- global-setup.ts calls
// this ahead of startStudioServer(), since
// scripts/generate-extensions-registry.mjs only scans `_studio_extensions/`
// once, via the predev hook, so a plugin dropped in after the server is
// already running wouldn't be picked up without a restart. Returns a
// cleanup function that removes the directory again.
export const seedPlugin = (): (() => void) => {
  mkdirSync(EXTENSIONS_DIR, { recursive: true });
  writeFileSync(join(EXTENSIONS_DIR, 'e2e-plugin.ts'), PLUGIN_ENTRY);
  writeFileSync(
    join(EXTENSIONS_DIR, 'e2e-plugin-field.svelte'),
    PLUGIN_FIELD_COMPONENT,
  );

  return () => {
    rmSync(EXTENSIONS_DIR, { recursive: true, force: true });
    // Regenerates src/lib/extensions/registry.generated.ts back to its
    // empty-plugins state -- otherwise it's left referencing the
    // now-deleted plugin files, which breaks anything that reads it
    // (`vitest run` has no pretest hook to regenerate it itself, unlike
    // predev/prebuild) until the next dev/build run.
    spawnSync('node', ['scripts/generate-extensions-registry.mjs']);
  };
};
