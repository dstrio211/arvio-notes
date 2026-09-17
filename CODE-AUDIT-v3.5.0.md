# Arvio v3.5.0 — code-fighting audit

## Bottom line

The code is **not currently fighting across subsystem files in the obvious exact-selector sense**: there are 0 cross-file exact selector/property conflicts after moving the motion timing token to `motion.css`.

However, the project still carries a lot of historical in-file override layers. Those layers are the main technical-debt risk.

## Static audit snapshot

- JavaScript: ~4.6k lines.
- CSS: ~12.2k lines across 14 files.
- CSS parse errors: 0.
- HTML duplicate IDs: 0.
- Duplicate function declaration names: 0.
- Cross-file exact selector/property conflicts: 0.
- Same-file layered selector groups with conflicting property values: 221.
- `!important` occurrences: ~1,294.
- Malformed `!important,`: 0.

## Main hotspots

### `nav.css`
The mobile nav has many generations of visual tuning in one file. Selectors such as `.mobile-nav`, `.mobile-nav-indicator`, and `.mobile-nav .nav-item` are intentionally overridden several times. Do not add another late patch. Consolidate the final computed state into one canonical block when touching this subsystem.

### `note.css`
The command menu / format toolbar / More menu have multiple geometry and motion layers, especially on mobile. This is the highest-risk area for regressions such as popovers jumping, sticking to the wrong selection handle, or falling behind the keyboard.

### `library.css`
Tree rows, action sheets, delete sheet, mobile popovers, and hierarchy visuals have accumulated multiple overrides. The underlying behavior is stable enough to continue, but future fixes should consolidate rather than append.

### `create.css`
The create-choice cards and existing-topic picker have repeated size/material tuning. Current newest-created ordering lives in JS and should be preserved.

### `share.css`
Mobile share-sheet geometry still has repeated overrides. Preserve bottom safe-area behavior when refactoring.

## Data / date integrity

The bad hard-coded `2026-01-01` fallback is gone. Creation time now prefers stable `node.createdAt`, then persisted metadata, then edit/open timestamps only as repair fallbacks. A repair pass persists missing creation metadata after hydration.

## Recently Edited integrity

The previous pseudo-element collision was fixed: the card glaze and arrow no longer share the same `::after` ownership. Recent cards also use explicit spacing so their shadows/material layers do not visually merge.

## Backend state

Supabase is intentionally absent in v3.5.0. Do not assume cloud auth, cloud notes, RLS, or sharing persistence exists. If a backend is reintroduced, design the migration deliberately instead of reviving the old deleted-project configuration.

## Refactor rule for the next chat

Use **one subsystem, one owner, one motion system**. Before changing a UI component:
1. Find all selectors/functions touching it.
2. Identify the final rule currently winning in the cascade.
3. Consolidate the subsystem instead of appending a new version block.
4. Run syntax/static checks.
5. Test desktop + iPhone-sized layout before moving on.
