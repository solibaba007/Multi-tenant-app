-- ============================================================================
-- 1. ENUMS
-- ============================================================================
create type user_role as enum ('owner', 'admin', 'member');
create type task_status as enum ('todo', 'in_progress', 'done');

-- ============================================================================
-- 2. TABLES & CONSTRAINTS
-- ============================================================================

-- TENANTS
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz default now() not null
);

-- MEMBERSHIPS
create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.user_role not null default 'member',
  created_at timestamptz default now() not null,
  unique (tenant_id, user_id)
);

-- INVITATIONS
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  email text not null,
  role public.user_role not null default 'member',
  token text not null unique default encode(gen_random_bytes(32), 'hex'),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz default now() not null
);

-- PROJECTS
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now() not null
);

-- TASKS
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  status public.task_status not null default 'todo',
  assignee_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now() not null
);

-- INDEXES
create index idx_memberships_tenant_user on public.memberships(tenant_id, user_id);
create index idx_projects_tenant on public.projects(tenant_id);
create index idx_tasks_tenant on public.tasks(tenant_id);
create index idx_tasks_project on public.tasks(project_id);
create index idx_invitations_token on public.invitations(token);

-- ============================================================================
-- 3. HELPER FUNCTIONS (SECURITY DEFINER)
-- ============================================================================

-- Check if user is a member of tenant (bypasses RLS to prevent recursion)
create or replace function public.is_member(t uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.memberships
    where tenant_id = t and user_id = auth.uid()
  );
$$;

-- Check if user holds specific role(s) in tenant
create or replace function public.has_role(t uuid, allowed_roles public.user_role[])
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.memberships
    where tenant_id = t 
      and user_id = auth.uid()
      and role = any(allowed_roles)
  );
$$;

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS) & POLICIES
-- ============================================================================

alter table public.tenants enable row level security;
alter table public.memberships enable row level security;
alter table public.invitations enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;

-- ----------------------------------------------------------------------------
-- TENANTS POLICIES
-- ----------------------------------------------------------------------------
create policy "members read tenants"
  on public.tenants for select
  using ( public.is_member(id) );

create policy "authenticated users create tenants"
  on public.tenants for insert
  with check ( auth.role() = 'authenticated' );

create policy "owners update tenant"
  on public.tenants for update
  using ( public.has_role(id, array['owner'::public.user_role]) )
  with check ( public.has_role(id, array['owner'::public.user_role]) );

create policy "owners delete tenant"
  on public.tenants for delete
  using ( public.has_role(id, array['owner'::public.user_role]) );

-- ----------------------------------------------------------------------------
-- MEMBERSHIPS POLICIES
-- ----------------------------------------------------------------------------
create policy "members read memberships"
  on public.memberships for select
  using ( public.is_member(tenant_id) );

create policy "membership insert policy"
  on public.memberships for insert
  with check (
    -- 1. Admin/Owner adding a user directly
    public.has_role(tenant_id, array['owner'::public.user_role, 'admin'::public.user_role])
    -- 2. Initial member creation when creating a brand new tenant
    or not exists (select 1 from public.memberships where tenant_id = memberships.tenant_id)
    -- 3. User joining via a valid, unexpired invitation token
    or exists (
      select 1 from public.invitations
      where tenant_id = memberships.tenant_id
        and accepted_at is null
        and expires_at > now()
    )
  );

create policy "admins and owners update memberships"
  on public.memberships for update
  using ( public.has_role(tenant_id, array['owner'::public.user_role, 'admin'::public.user_role]) )
  with check ( public.has_role(tenant_id, array['owner'::public.user_role, 'admin'::public.user_role]) );

create policy "admins and owners remove members"
  on public.memberships for delete
  using ( public.has_role(tenant_id, array['owner'::public.user_role, 'admin'::public.user_role]) );

-- ----------------------------------------------------------------------------
-- INVITATIONS POLICIES
-- ----------------------------------------------------------------------------
create policy "members and invitees read invitations"
  on public.invitations for select
  using ( public.is_member(tenant_id) or token is not null );

create policy "admins insert invitations"
  on public.invitations for insert
  with check ( public.has_role(tenant_id, array['owner'::public.user_role, 'admin'::public.user_role]) );

create policy "admins delete invitations"
  on public.invitations for delete
  using ( public.has_role(tenant_id, array['owner'::public.user_role, 'admin'::public.user_role]) );

-- ----------------------------------------------------------------------------
-- PROJECTS POLICIES
-- ----------------------------------------------------------------------------
create policy "members read projects"
  on public.projects for select
  using ( public.is_member(tenant_id) );

create policy "members insert projects"
  on public.projects for insert
  with check ( public.is_member(tenant_id) and auth.uid() = created_by );

create policy "members update projects"
  on public.projects for update
  using ( public.is_member(tenant_id) )
  with check ( public.is_member(tenant_id) );

create policy "members delete projects"
  on public.projects for delete
  using ( public.is_member(tenant_id) );

-- ----------------------------------------------------------------------------
-- TASKS POLICIES
-- ----------------------------------------------------------------------------
create policy "members read tasks"
  on public.tasks for select
  using ( public.is_member(tenant_id) );

create policy "members insert tasks"
  on public.tasks for insert
  with check ( public.is_member(tenant_id) );

create policy "members update tasks"
  on public.tasks for update
  using ( public.is_member(tenant_id) )
  with check ( public.is_member(tenant_id) );

create policy "members delete tasks"
  on public.tasks for delete
  using ( public.is_member(tenant_id) );

-- ============================================================================
-- 5. TRIGGERS & GUARDRAILS
-- ============================================================================

drop trigger if exists enforce_last_owner on public.memberships;
drop trigger if exists ensure_at_least_one_owner on public.memberships;
drop function if exists public.prevent_last_owner_removal();

create or replace function public.prevent_last_owner_removal()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_count integer;
begin
  -- Check how many owners currently exist for this tenant
  select count(*) into owner_count
  from public.memberships
  where tenant_id = old.tenant_id and role = 'owner';

  -- If deleting or demoting an owner, and they are the last one left
  if (TG_OP = 'DELETE' and old.role = 'owner' and owner_count <= 1) or
     (TG_OP = 'UPDATE' and old.role = 'owner' and new.role != 'owner' and owner_count <= 1) then
    raise exception 'Cannot remove or demote the last owner of an organization.';
  end if;

  return coalesce(new, old);
end;
$$;

create trigger ensure_at_least_one_owner
before delete or update on public.memberships
for each row execute function public.prevent_last_owner_removal();