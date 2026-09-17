# Arvio v3.6.0 ownership review and release audit

## Scope reviewed before implementation

| Area | Existing owners and dependencies | Implementation |
| --- | --- | --- |
| Sidebar Quick Access | `index.html`; base, radius and desktop layers in `style.css`; typography in `ui-system.css`; shared button timing tokens in `motion.css`; sidebar entry in `shell.css` | Replace five static buttons. Consolidate all Quick Access-specific rules in `style.css`. Preserve shared shell/nav motion. |
| Note action sheet | `openLibraryItemActions`, `closeLibraryItemActions`, Library event delegation and confirmation handoff in `main.js`; historical action-sheet geometry in `library.css`; shared timing/reduced-motion in `motion.css` | Add pin toggle to existing sheet. Consolidate its geometry/material at the existing subsystem section. Measure desktop dimensions, constrain scrolling and track viewport size. Dispose resize observers on close. |
| Creation/rename/move | `createDraftAtPath`, `renameLibraryPath`, `moveLibraryPath`, `syncActiveNoteTitleIntoLibrary`, `persistLibraryState` | Existing ID lifecycle remains intact. Central Library mutation refreshes pins. ID-based active-note lookup avoids title/path ambiguity. |
| Duplication | `cloneLibraryNodeForDuplicate`, `duplicateLibraryPath` | Existing fresh IDs are preserved. No pin is copied. |
| Trash/restore/delete | `removeLibraryPath`, `restoreLibraryTrashItem`, `permanentlyDeleteLibraryTrashItems`, `deleteLibrarySubtreeRecordsFromIndexedDB`, legacy Trash replay | Retain hidden pins while trashed. Remove pins recursively on permanent deletion. Record parent ID for new Trash entries. Resolve current parent on restore and avoid sibling-name collisions. Legacy replay matches stable ID when available. |
| Home/Library/editor navigation | `activatePage`, `openArvioNote`, `markNoteOpened`, breadcrumb actions, `flushLocalSave`, `restoreLocalNoteIfPresent` | Open pins using the existing note route with exact ID resolution. Flush current edits before switching pins. Ignore stale asynchronous note loads. Clear selected pin outside the editor. |
| Local persistence | `snapshotLibraryState`, `persistLibraryStateNow`, `persistLibraryState`, legacy restoration, `hydrateLibraryStateFromIndexedDB`, database wrappers | Add ordered `quickAccessIds` to the same snapshot/fallback. Serialize snapshot writes. No new pin database/storage key or account store. Pin control waits for persistence and reports save failure. |
| Mobile bottom navigation | `activatePage`, indicator animation/repair, returning-session splash; `nav.css`, `shell.css`, `page-layout.css`, `motion.css`; HTML three-tab markup | Reviewed and preserved. No new tab, competing nav animation, or nav CSS patch. |
| Packaging | `package.json`, `package-lock.json`, `VERSION`, release docs, tests | Version 3.6.0, reproducible lockfile, development-only Playwright dependency and regression scripts. |

## Relevant baseline defect repaired

The supplied v3.5.0 JavaScript called `stampSubtreeUpdatedAt` from Trash and restore without defining it. Browser execution raised `ReferenceError` during Trash. The missing recursive helper now exists once and updates edit timestamps without changing creation dates or note IDs.

## Identity and persistence invariants

- Pin storage contains only ordered stable note IDs, never titles, breadcrumbs or paths.
- Live-tree resolution supplies current text/location and hides trashed nodes.
- Hidden pins remain in the ordered snapshot. Restore does not re-pin or reorder them.
- Pin cleanup walks the actual permanently-deleted subtree, not a title prefix.
- New copies inherit content and hierarchy but receive new IDs and no pin state.
- Existing IndexedDB version/store names, local session/profile keys, fallback keys and SW recovery markers remain unchanged.
- Older snapshots without a pin field normalize to an empty list. Missing IDs repaired during hydration are persisted.
- Pins belong to the current local workspace. They are not account-synced or a new security boundary.

## CSS audit interpretation

All 14 CSS files parse with no rule/declaration errors. Quick Access has one CSS owner (`style.css`) and no same-scope property redefinitions. The action-sheet base and mobile geometry each have a canonical block; existing shared motion/reduced-motion rules remain intentional.

The v3.5.0 report stated zero cross-file exact selector/property conflicts. The included audit splits top-level selector lists and records matching media scopes. Under this method, 13 pre-existing cross-file selector/property ownership overlaps appear in typography/page-layout rules. The same overlaps exist in the original ZIP. This release introduces zero new overlaps. These counts do not assert that every overlap is a visual conflict, and the older audit's methodology is not available.

## Validation scope

Browser tests cover actual pin toggle controls, local state round trips and existing lifecycle functions. They exercise fresh empty state, parent/nested pins, newest-first ordering, ID-based opening, rename and move, editor title updates, saving before switching pins, duplicates, subtree trash/reload/restore, permanent cleanup, restore after parent rename, name collisions, and localStorage fallback with IndexedDB deliberately blocked.

Desktop and mobile viewport checks cover long unbroken titles, 40 sidebar pins, sheet bounds and scroll reachability at 1440×1000, 900×430, 390×844, 375×667, 320×568 and 844×390. Screenshots support visual inspection. Mobile bottom-nav routing and returning-session settlement are checked. Viewport tests run in Chromium; they are not physical iPhone Safari or installed-PWA verification.

Static audit checks duplicate HTML IDs, duplicate top-level function declarations, malformed `!important,`, CSS parsing, Quick Access ownership and static placeholder removal. Browser runtime checks additionally inspect errors. The package contains repeatable tests; final execution results are in `DEPLOY-READY-CHECK.md`.

## Preserved files and behavior

`nav.css`, `note.css`, `home-profile.css`, `create.css`, `share.css`, `shell.css`, `branding.css`, `page-layout.css`, `motion.css`, public logo/icons/manifest/SW, Vite configuration and Vercel configuration are unchanged. No backend or service-worker fetch interception was added. Parent creation-time sorting and newest-created topic-picker ordering remain unchanged.
