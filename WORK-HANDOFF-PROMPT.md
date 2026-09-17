# Arvio v3.6.0 handoff

Read README.md, CODE-AUDIT-v3.6.0.md and DEPLOY-READY-CHECK.md before editing source.

Arvio is a dark-only, local-first vanilla JS + Vite workspace. GitHub is the source of truth and Vercel deploys main. No backend or Supabase exists. Auth remains a local prototype. Keep SW fetch interception disabled and preserve the existing recovery keys.

Quick Access is implemented as ordered stable IDs in the existing Library snapshot (`quickAccessIds`). New pins prepend. Labels and locations resolve from live data. Trash hides pins without reordering; restore reveals them; permanent deletion removes subtree pins. Duplicates are not automatically pinned. Pin controls use the existing Library item action sheet.

Style ownership: Quick Access in style.css, action-sheet geometry in library.css, shared motion in motion.css. Avoid appending override layers. Existing historical layers elsewhere remain. Mobile navigation and logo assets were not changed.

This release repaired the missing stampSubtreeUpdatedAt helper used by the original Trash/restore code. Newly trashed entries now record parentId to follow parent rename/move during restoration. Older entries retain a legacy path fallback.

Use Node 22, npm ci, npm run build. Browser regressions: npx playwright install chromium, then npm run test:quick-access. Static audit requires Python tinycss2: python tests/static-audit.py. Read the release checklist for the exact tested environment and outstanding physical-device checks.

Do not introduce a backend without proposing a clean migration plan and obtaining approval.
