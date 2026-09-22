# Arvio

Arvio is a dark, local-first notes workspace for desktop and iPhone / Add to Home Screen use.

## v3.7.0: user-pinned Quick Access

Use a note's existing Library **•••** menu to add or remove it from Quick Access. Any parent or nested note is eligible. New pins appear first; other pins retain their order. Sidebar rows show the current title and parent location, and open the note by its stable ID.

Pins are an ordered `quickAccessIds` field in the existing `appState` / `library-state` snapshot. IndexedDB remains primary and the existing localStorage snapshot remains the fallback. Existing v3.5.0 snapshots load with an empty pin list. Existing database, session and recovery keys are unchanged.

- Rename and move preserve pins and refresh sidebar labels.
- Trash hides pins, including descendants, without removing their order.
- Restore reveals those pins again. New Trash entries retain the parent ID, so restoration follows a renamed/moved parent. Legacy Trash entries retain their path-based fallback.
- Permanent deletion removes all pins in the deleted subtree.
- Duplicates receive new IDs and are not pinned automatically.
- Quick Access uses simple text rows, a small empty state, safe truncation and independent scrolling.

## Local development

Node 22.x is the configured target. Vite is pinned to 8.2.0. A package lock is included.

```sh
npm ci
npm run dev
npm run build
npm run preview
```

## Verification

```sh
npx playwright install chromium
npm run test:quick-access
npm run build
npm run test:smoke
python -m pip install tinycss2
python tests/static-audit.py
```

The browser suite starts its own Vite server. `ARVIO_TEST_URL` optionally selects an already-running dev server. It tests real UI pin controls and navigation, plus existing lifecycle functions through a test-only response injection. No test hook is bundled into production. Screenshots are written to ignored `test-results/`. `ARVIO_BROWSER_EXECUTABLE` and `ARVIO_BROWSER_ARGS` support a managed Chromium installation.

To compare CSS ownership with the uploaded baseline:

```sh
python tests/static-audit.py /path/to/ARVIO-GITHUB-READY-v3.5.0.zip
```

See `CODE-AUDIT-v3.7.0.md` for ownership review and validation scope, and `DEPLOY-READY-CHECK.md` for release checks. The original v3.5.0 audit is retained as historical documentation.

## Architecture and deployment

- Vanilla JavaScript and Vite. GitHub is the source of truth; Vercel deploys `main`.
- Notes and hierarchy remain local-first with an optional Supabase cloud copy per authenticated user. See `SUPABASE-SETUP.md`.
- Authentication uses Supabase email and password when both Vercel environment variables are present. It remains a local prototype session when they are absent.
- Public read-only sharing uses Supabase token links. Run `supabase/share-v3.7.6.sql` once; see `UPDATE-v3.7.6.md`. Editor collaboration is not implemented.
- Service-worker fetch interception remains disabled. Existing recovery behavior is preserved.
- Mobile Home / Library / Profile navigation, safe areas and logo assets are preserved.

Continue using one subsystem, one owner, one motion system. Quick Access styles live in `style.css`; Library action-sheet geometry lives in `library.css`; shared motion timing stays in `motion.css`. Broader historical CSS layers remain outside this release.
