# Soul Studio rebuild — phase tracker

Written to hand off across sessions. Each phase lands as its own mergeable
slice — see the commits on `rebuild-sveltekit2-svelte5` for the pattern
(implement → verify → commit → push, each phase self-contained).

## Status

All planned phases are done. Nothing in this doc is "remaining" work anymore
— it's now a record of what shipped and where, kept for context on _why_
things are shaped the way they are.

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
- **UI redesign** — done: Tailwind v4 + shadcn-svelte reskin on top of
  Phase 2's screens (sidebar table nav, real data-grid, `Sheet`-based row
  create/edit, `AlertDialog` confirms, chip-based filters, `svelte-sonner`
  toasts). UI primitives under `lib/components/ui/` are pulled from
  shadcn-svelte's public registry rather than the interactive CLI, which
  wouldn't cooperate non-interactively.
- **Phase 3 (Realtime)** — done: `lib/api/ws.ts` subscribes to Soul's
  `/ws/tables/<name>` broadcasts (cookie auth; rejection is a JSON message
  immediately before an argumentless close, since the server gives no close
  code) with a bounded reconnect. `lib/realtime/rowMatcher.ts` reimplements
  the backend's filter/search predicate client-side, since broadcasts go to
  every subscriber with no server-side query filtering. Wired into
  `TableBrowser.svelte` — deliberately not full pagination-aware
  reconciliation (a row is only ever inserted into the current page when
  there's room, never forced into sort order out of a full page).
  `tests/e2e/realtime.spec.ts` drives two separate browser _contexts_.
- **Phase 4 (Table admin + roles/permissions)** — done: `routes/tables/new`
  (`TableCreateForm` + `ColumnEditor`) builds the exact `CreateTablePayload`
  shape, client-side mirroring the Joi constraints for fast feedback only.
  Table delete lives as a header action on `TableBrowser`, gated by the
  real per-table permission response rather than the superuser hint —
  `DELETE /api/tables/:name` has a `:name` param, so unlike list/create a
  non-superuser with explicit delete permission can legitimately use it.
  `lib/api/roles.ts` + `routes/roles` (`RolesList`, `PermissionsGrid`,
  `UserRolesAssignment`) are generic CRUD over `_roles`/
  `_roles_permissions`/`_users_roles` (no dedicated backend endpoints
  exist) — permission fields round-trip as literal `0`/`1`, not booleans.
  `tests/e2e/tables-admin.spec.ts` / `roles.spec.ts` cover the non-superuser
  negative case. A real backend bug surfaced here and was fixed on `soul`'s
  `fix-users-roles-unique-constraint` branch: `_users_roles`'s unique
  constraint was declared `UNIQUE(user_id, user_id)` (copy-paste typo)
  instead of `UNIQUE(user_id, role_id)`, blocking a second role per user.
- **Phase 5 (Plugin/extensibility)** — done: `docs/extensions/example-plugin.ts`
  is a worked, realistic example (documentation only, outside the
  live-scanned `_studio_extensions/`). `AppSidebar.svelte` now renders
  `registry.navItems`; `TableBrowser.svelte`'s row-actions column renders
  `registry.rowActions`. `fieldWidgets.ts`'s plugin-override resolution was
  already wired from Phase 2 — this proved it end-to-end.
  `tests/e2e/fixtures/seed-plugin.ts` writes a real plugin into
  `_studio_extensions/` _before_ the Studio dev server starts in
  `global-setup.ts` (the registry is generated once, via the `predev` hook)
  targeting a dedicated `plugin_demo` table rather than the shared `books`
  fixture, since plugin field renderers don't get an `id` to wire up label
  association.
- **Phase 6 (Polish, CI, release prep)** — done: CI extended with soul
  core's `{ubuntu-latest, macos-latest} × {22.x, 24.x, 26.x}` matrix for
  lint/check/coverage/build (e2e stays single-OS — real Chromium against a
  real ephemeral backend there multiplies cost, not coverage).
  `vite.config.js`'s coverage gate is scoped to the pure-logic layer this
  project's unit tests actually cover by convention
  (`api`/`metadata`/`realtime`/`extensions`), thresholds set from measured
  coverage, not a guessed target. README rewritten with the real feature
  list. Version bumped to `0.2.0`.
  - The `npm link` same-origin smoke test surfaced a second, more serious
    pre-existing bug, now fixed on `soul`'s `fix-studio-mount-prefix`
    branch: `server.js` mounted Studio via `app.use('/studio', handler)`,
    but Express strips the mount prefix from `req.url` before calling a
    path-mounted middleware, while the adapter-node build (with
    `paths.base: '/studio'` baked in) resolves its own routes against the
    _unstripped_ URL — so every `/studio/*` request 404'd. This integration
    path was never actually exercised end-to-end before this smoke test.
    Fixed by mounting at the root and filtering by path manually instead of
    letting Express's path-mount stripping run.

## Branches, none merged yet

- `soul@studio-cookie-samesite` — backend prereqs (cookie SameSite/Secure,
  foreignKeys, updatesuperuser, JWT jti, Joi cookie schema).
- `soul@fix-users-roles-unique-constraint` — the `_users_roles` unique
  constraint fix (Phase 4 finding).
- `soul@fix-studio-mount-prefix` — the `/studio` mount fix (Phase 6
  finding).
- `soul-studio@rebuild-sveltekit2-svelte5` — everything else: Phases 1-6
  plus the UI redesign, one commit per phase.

## Known follow-ups (not blocking, not yet done)

- `soul`'s `package.json` pins `"soul-studio": "^0.0.1"` — semver's caret
  range on a `0.0.x` version only allows patch bumps, so it will **not**
  resolve `soul-studio@0.2.0` from a registry once published (this doesn't
  affect `npm link`, which bypasses semver resolution entirely — only a
  real `npm install` after publishing). Needs a pin update in `soul` before
  or alongside publishing `soul-studio@0.2.0`.
- None of the four branches above are merged into their respective `main`
  branches yet.

## Local dev

`soul` (the shell command, in `~/bin/soul`, symlinked into `~/.local/bin`)
opens a tmux session with the backend + Studio dev server already running
against each other, on ports 8001/3000 by default (override via
`SOUL_SERVER_PORT`/`SOUL_WEB_PORT`). First run auto-creates and promotes a
superuser (`admin` / `Str0ngTestPw!1`); the DB persists at `soul/.dev.db`
(gitignored) across runs. `soul --kill` tears it down and frees the ports.

- Backend script: `soul/scripts/dev.sh`
