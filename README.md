# Soul Studio

GUI for [Soul](https://github.com/thevahidal/soul): a SQLite REST and realtime server.

Built on SvelteKit 2 / Svelte 5 / TypeScript, styled with Tailwind v4 +
shadcn-svelte. Runs standalone against any Soul backend (same-origin or
cross-origin), or same-origin behind Soul core's own `-S`/`--studio` flag.

## Features

- **Auth** -- login/logout, session persistence, automatic 401-refresh-retry.
- **Table/row browser** -- metadata-driven CRUD for any table: schema-derived
  forms, foreign-key-aware relation pickers, filters/search/ordering/
  pagination, single and bulk row actions.
- **Realtime** -- row changes (insert/update/delete) made by anyone else
  appear live in the table you're viewing, over Soul's WebSocket broadcasts,
  filtered client-side against your active search/filters.
- **Table admin** -- create tables (columns, types, constraints, foreign
  keys) and delete them, gated the same way Soul core itself gates them.
- **Roles & permissions** -- manage roles, a tables x roles permissions
  grid, and per-user role assignment -- all superuser-first UX, always
  re-authorized server-side.
- **Plugin system** -- drop a file in `_studio_extensions/` to add nav
  items, override how a specific column renders, or add row actions,
  without touching the built-in screens. See
  [`docs/extensions/example-plugin.ts`](docs/extensions/example-plugin.ts)
  for a worked example.

## Development

Make sure that [Soul Core API](https://github.com/thevahidal/soul) is up and running and then

```bash
cp .env.sample .env # Duplicate sample environment variables
vim .env # Update the environment variables

npm install # Install dependencies
npm run dev # Start the dev server
```

### Testing

```bash
npm run check      # svelte-check (types)
npm run lint       # eslint
npm test           # unit tests (vitest)
npm run test:coverage
npm run test:e2e   # Playwright, against a real ephemeral Soul backend
                    # (checked out as a sibling ../soul, or point
                    # SOUL_BACKEND_CWD at a Soul checkout elsewhere)
```

### Extending

Plugins are plain `.ts`/`.js` files dropped in `_studio_extensions/` (or
wherever `STUDIO_EXTENSIONS_DIR` points), each default-exporting a
`StudioPlugin` object (see `src/lib/extensions/types.ts`). They're picked up
at build/dev time by `scripts/generate-extensions-registry.mjs`, which runs
automatically via the `predev`/`prebuild` hooks -- no separate build step to
remember.
