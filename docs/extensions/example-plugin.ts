// Worked example of a Soul Studio plugin -- documentation only, this file
// is NOT inside `_studio_extensions/` (the directory
// scripts/generate-extensions-registry.mjs actually scans), so dropping a
// copy of this repo won't pick it up on its own. To use it for real:
//
//   1. Copy this file (and any sibling component files it imports) into
//      `_studio_extensions/` at the repo root (or wherever
//      `STUDIO_EXTENSIONS_DIR` points -- see .env.sample).
//   2. Default-export a `StudioPlugin` object from a `.ts`/`.js` file
//      directly under that directory (no subdirectories -- the scanner
//      does a flat `readdirSync`, not a recursive walk).
//   3. Run `npm run dev` or `npm run build` -- both regenerate
//      `src/lib/extensions/registry.generated.ts` first via the
//      `predev`/`prebuild` hooks, statically importing every plugin file
//      found.
//
// Plugins customize how the built-in, metadata-driven screens render --
// they don't define new screens or business logic (see
// src/lib/extensions/types.ts).

import type { StudioPlugin } from '../../src/lib/extensions/types';
import StatusBadgeField from './StatusBadgeField.svelte';

const plugin: StudioPlugin = {
  // Rendered in the sidebar alongside the table list (see
  // src/lib/components/AppSidebar.svelte). `href` is an app-relative path
  // -- the sidebar prefixes it with the configured base path itself, so
  // don't include `/studio` here.
  navItems: [{ label: 'Support queue', href: '/tables/support_tickets' }],

  // Overrides the default type-based widget for one exact table.column.
  // The component must accept `{ value, onchange, disabled? }` (event-
  // based, not `bind:value` -- see FieldRendererProps in types.ts) and is
  // used both in the row create/edit Sheet and can inspect `value` to
  // render read-only summaries elsewhere if you extend it that way.
  fieldRenderers: [
    {
      table: 'support_tickets',
      column: 'status',
      component: StatusBadgeField,
    },
  ],

  // An extra action rendered next to the built-in Edit/Delete buttons in
  // TableBrowser's row-actions column, for every row of the given table.
  rowActions: [
    {
      table: 'support_tickets',
      label: 'Escalate',
      onClick: (row) => {
        console.log('Escalate clicked for row', row.id);
        // Real plugins would call their own API, open a dialog, etc.
        // Row actions are intentionally just a callback -- they don't
        // get a way to mutate Studio's own row list directly.
      },
    },
  ],
};

export default plugin;
