create table if not exists public.arvio_workspaces (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.arvio_workspaces enable row level security;

drop policy if exists "Users manage their own Arvio workspace" on public.arvio_workspaces;
create policy "Users manage their own Arvio workspace"
on public.arvio_workspaces
for all to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create or replace function public.set_arvio_workspace_updated_at()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_arvio_workspace_updated_at on public.arvio_workspaces;
create trigger set_arvio_workspace_updated_at
before update on public.arvio_workspaces
for each row execute function public.set_arvio_workspace_updated_at();

-- Required when automatic Data API grants are disabled. RLS still applies.
grant usage on schema public to authenticated;
grant select, insert, update on table public.arvio_workspaces to authenticated;
