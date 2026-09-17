# Arvio v3.7.0 Supabase and Vercel setup

1. In Supabase, open SQL Editor and run the complete contents of `supabase/schema.sql`.
2. In Authentication, set Site URL to `https://arvio-notes.vercel.app`.
3. Add these Redirect URLs:
   - `https://arvio-notes.vercel.app`
   - `https://arvio-notes.vercel.app/**`
4. In Supabase Project Settings, open API and copy the Project URL and publishable key.
5. In Vercel Project Settings, open Environment Variables and add both values from `.env.example` for Production and Preview.
6. Deploy the v3.7.0 code. Do not enter the secret service role key in Vercel or in browser code.

The SQL policy limits each row to the signed in user. Browser storage remains the active workspace and Supabase stores the signed in user's cloud copy.
