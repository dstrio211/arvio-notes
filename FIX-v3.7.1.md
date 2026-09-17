# v3.7.1 startup recovery

In Supabase SQL Editor run:

```sql
grant usage on schema public to authenticated;
grant select, insert, update on table public.arvio_workspaces to authenticated;
```

Existing Row Level Security remains in force. No notes are deleted.

Upload the extracted project files to the root of the GitHub repository and commit. Wait for the new Vercel deployment to be Ready, then refresh.

This update catches startup errors, bounds Supabase requests to 12 seconds, preserves sessions on network errors, and prevents workspace entry when cloud loading fails.

Validation: production build, JavaScript syntax, and mocked startup/error/timeout regression tests passed. Live Supabase and browser visual testing were not completed. This is a scoped startup hotfix, not a full cloud synchronization audit.
