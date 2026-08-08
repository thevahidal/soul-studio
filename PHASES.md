# Soul Studio rebuild — phase tracker

Written to hand off across sessions. Each phase should land as its own
mergeable slice — see the commits on `rebuild-sveltekit2-svelte5` for the
pattern (implement → verify → commit → push, each phase self-contained).

## Status

- **Backend prereqs** — done, on `soul`'s `studio-cookie-samesite` branch:
  configurable cookie `SameSite`/`Secure`, additive `foreignKeys` on
  `GET /api/tables/:name`, an `updatesuperuser` crash fix, a JWT `jti` fix
  (cross-session revocation bug), and a Joi `.unknown(true)` fix on every
  route's cookie schema (was 400ing on any unrelated browser cookie, e.g.
  `"cookies.csrftoken" is not allowed`).
- **Phase 1** — done: SvelteKit 2 / Svelte 5 / TS scaffold, typed API
  client with 401-refresh-retry, session store, real login/logout,
  extension-registry scaffolding (empty).
- **Phase 2** — done: metadata-driven table/row browser. Schema-derived
  forms (`lib/metadata/schemaToForm.ts`, `fieldWidgets.ts`), FK-aware
  relation display/picker, filters/search/ordering/pagination, real
  create/edit/delete (single + bulk), date/datetime input format
  handling. First Playwright specs (`auth.spec.ts`, `rows-crud.spec.ts`)
  and the e2e CI job, running against a real ephemeral Soul backend.

Both branches are pushed but **not merged** — `soul-cookie-samesite` and
`rebuild-sveltekit2-svelte5` are still open for review.

## Remaining phases

### Phase 3 — Realtime

- `lib/api/ws.ts`: `subscribeToTable(name, { onInsert, onUpdate, onDelete, onAuthError })`
  wrapping a native `WebSocket`, parsing `{type, data, _lookup_field}`
  broadcast messages (see `soul/src/websocket.js` for the exact shape).
  WS base URL derived from `PUBLIC_SOUL_API_URL` (or `window.location` if
  unset) — never under `/studio`, since `/ws` is a root-level path on Soul
  core same as `/api`.
- Wire into `TableBrowser.svelte`: subscribe on mount, unsubscribe on
  navigation away. Merge incoming broadcasts into the visible row list —
  but filter client-side against the currently-active `_filters`/`_search`
  first, since the backend broadcasts every table change to every
  subscriber with no server-side query filtering.
- Auth-close messages (no cookie / invalid / insufficient read permission)
  surface as a toast, not a silent failure.
- New `tests/e2e/realtime.spec.ts`: two Playwright browser _contexts_
  (`browser.newContext()` twice, not two tabs in one context) — one
  mutates a row, the other observes the change appear live without a
  reload.
- **Done when**: the two-context e2e spec passes in CI.

### Phase 4 — Table admin + roles/permissions

- `routes/tables/new/+page.svelte` (superuser-gated in nav, per the
  documented quirk that table list/create have no `:name` param so
  non-superusers always 403 there): `TableCreateForm.svelte` +
  `ColumnEditor.svelte` building the exact `POST /api/tables/` body shape
  (`name`, `autoAddCreatedAt`, `autoAddUpdatedAt`,
  `schema[].{name,type,default,notNull,unique,primaryKey,foreignKey,index}`).
  Client-side mirrors the backend's Joi constraints (name regex
  `^[\w-]+$`, 2–30 chars, type enum) for fast feedback only — backend
  stays the source of truth.
- Table delete: confirm dialog → `DELETE /api/tables/:name`, surface the
  reserved-name `409` / FK-constraint failures readably.
- `routes/roles/+page.svelte`: no dedicated backend endpoint exists for
  this — it's generic CRUD composed into one coherent UI over three
  reserved tables:
  - `RolesList.svelte` — CRUD on `_roles` (`id`, `name`).
  - `PermissionsGrid.svelte` — a **tables × roles** matrix, four toggles
    per cell (create/read/update/delete) bound to `_roles_permissions`
    rows. Round-trip the four fields as `0`/`1` integers, not booleans
    (that's the actual column type). Respect the `(role_id, table_name)`
    unique constraint — upsert vs. insert depending on whether a row
    already exists for that cell.
  - `UserRolesAssignment.svelte` — assign/unassign roles via
    `_users_roles` (`user_id`, `role_id`).
- **Done when**: `tables-admin.spec.ts` and `roles.spec.ts` pass,
  including the non-superuser negative case (403/hidden-from-nav).

### Phase 5 — Plugin/extensibility system

- `_studio_extensions/` directory convention (default, mirrors backend's
  `_extensions` naming), configurable via `STUDIO_EXTENSIONS_DIR`.
- `scripts/generate-extensions-registry.mjs` already exists and is wired
  via `predev`/`prebuild` — currently always produces an empty registry
  since nothing populates `_studio_extensions/` yet. This phase is about
  actually exercising it: ship a worked example plugin under
  `docs/extensions/example-plugin.ts` (documentation only, not inside the
  live-scanned directory).
- `lib/extensions/registry.ts` (merge/collision logic) and
  `lib/extensions/types.ts` (`StudioPlugin`, `FieldRendererProps`) already
  exist and are unit-tested — this phase is primarily about _consuming_
  the registry in real UI: `Nav.svelte`'s nav-item rendering,
  `fieldWidgets.ts`'s plugin-override resolution (already wired, just
  needs a real plugin to prove it), `TableBrowser.svelte`'s row-action bar
  (`registry.rowActions`).
- **Done when**: dropping a plugin file in `_studio_extensions/` and
  rebuilding visibly changes nav/field-rendering/row-actions, proven by a
  seeded e2e spec (write a plugin file before the build step) plus the
  existing registry unit tests.

### Phase 6 — Polish, full CI matrix, release

- Full CI matrix (multi-OS if warranted, matching `soul` core's
  `{ubuntu-latest, macos-latest} × {22.x, 24.x, 26.x}` shape where it
  makes sense).
- Light accessibility pass on the generated forms/tables.
- README/CONTRIBUTING rewrite for the new stack (current README's dev
  section is accurate but minimal — this is where it gets the real
  feature-list treatment).
- Version bump; verify `soul` core's `"soul-studio": "^0.0.1"` dependency
  pin still resolves correctly against the new build.
- Manual smoke test of the `-S`/`--studio` same-origin mount via
  `npm link` before tagging a release — this is the integration contract
  (`soul/src/server.js` dynamically importing `soul-studio/build/handler.js`,
  mounted at `/studio`) that every phase so far has been careful not to
  break.

## Local dev

`soul` (the shell command, in `~/bin/soul`, symlinked into `~/.local/bin`)
opens a tmux session with the backend + Studio dev server already running
against each other, on ports 8001/3000 by default (override via
`SOUL_SERVER_PORT`/`SOUL_WEB_PORT`). First run auto-creates and promotes a
superuser (`admin` / `Str0ngTestPw!1`); the DB persists at `soul/.dev.db`
(gitignored) across runs. `soul --kill` tears it down and frees the ports.

- Backend script: `soul/scripts/dev.sh`
- Both repos' branches as of this writing: `soul@studio-cookie-samesite`,
  `soul-studio@rebuild-sveltekit2-svelte5` — neither merged yet.
