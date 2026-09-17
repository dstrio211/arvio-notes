# Arvio v3.6.0 — GitHub + Vercel setup

## Upload to GitHub

1. Create or open the Arvio repository.
2. Extract the v3.6.0 ZIP.
3. Upload the **items inside the extracted folder**, not the outer folder itself.
4. The repository root must directly contain `package.json`, `index.html`, `src/`, `public/`, etc.
5. Commit to `main`.

Expected root example:

```text
/package.json
/index.html
/src/main.js
/src/styles/...
/public/...
/vercel.json
```

## Vercel

Import/connect the GitHub repository.

Expected settings:
- Framework Preset: Vite
- Root Directory: `./`
- Build Command: `npm run build`
- Output Directory: `dist`

No Supabase environment variables are required in v3.6.0.

If old `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` variables still exist in Vercel, they may be removed because this build does not read them.

## Normal update workflow

```bash
git add .
git commit -m "Describe the Arvio update"
git push
```

Vercel should auto-deploy `main`.
