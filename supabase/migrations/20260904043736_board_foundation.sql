create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  note text check (note is null or char_length(note) <= 5000),
  status text not null default 'backlog' check (status in ('backlog', 'blocked', 'todo', 'doing', 'validation', 'review', 'done')),
  priority text not null default 'none' check (priority in ('none', 'low', 'medium', 'high')),
  planned_start_date date,
  due_date date,
  position integer not null default 0 check (position >= 0),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tickets_due_date_after_start check (
    planned_start_date is null or due_date is null or due_date >= planned_start_date
  ),
  constraint tickets_completed_at_matches_status check (
    (status = 'done' and completed_at is not null) or
    (status <> 'done' and completed_at is null)
  )
);
create table public.timer_sessions (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  constraint timer_sessions_ended_after_start check (ended_at is null or ended_at >= started_at)
);
create index projects_owner_id_idx on public.projects (owner_id);
create index tickets_project_status_position_idx on public.tickets (project_id, status, position, created_at);
create index timer_sessions_ticket_id_idx on public.timer_sessions (ticket_id);
create index timer_sessions_owner_id_idx on public.timer_sessions (owner_id);
create unique index timer_sessions_one_open_per_owner_idx
  on public.timer_sessions (owner_id)
  where ended_at is null;
alter table public.projects enable row level security;
alter table public.tickets enable row level security;
alter table public.timer_sessions enable row level security;
revoke all on table public.projects, public.tickets, public.timer_sessions from anon, authenticated;
grant select, insert, update, delete on table public.projects, public.tickets, public.timer_sessions to authenticated;
create policy "Owners can read projects"
  on public.projects for select to authenticated
  using ((select auth.uid()) = owner_id);
create policy "Owners can create projects"
  on public.projects for insert to authenticated
  with check ((select auth.uid()) = owner_id);
create policy "Owners can update projects"
  on public.projects for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy "Owners can delete projects"
  on public.projects for delete to authenticated
  using ((select auth.uid()) = owner_id);
create policy "Project owners can read tickets"
  on public.tickets for select to authenticated
  using (exists (
    select 1 from public.projects
    where projects.id = tickets.project_id
      and projects.owner_id = (select auth.uid())
  ));
create policy "Project owners can create tickets"
  on public.tickets for insert to authenticated
  with check (exists (
    select 1 from public.projects
    where projects.id = tickets.project_id
      and projects.owner_id = (select auth.uid())
  ));
create policy "Project owners can update tickets"
  on public.tickets for update to authenticated
  using (exists (
    select 1 from public.projects
    where projects.id = tickets.project_id
      and projects.owner_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.projects
    where projects.id = tickets.project_id
      and projects.owner_id = (select auth.uid())
  ));
create policy "Project owners can delete tickets"
  on public.tickets for delete to authenticated
  using (exists (
    select 1 from public.projects
    where projects.id = tickets.project_id
      and projects.owner_id = (select auth.uid())
  ));
create policy "Owners can read timer sessions"
  on public.timer_sessions for select to authenticated
  using ((select auth.uid()) = owner_id);
create policy "Owners can create timer sessions"
  on public.timer_sessions for insert to authenticated
  with check (
    (select auth.uid()) = owner_id and exists (
      select 1 from public.tickets
      join public.projects on projects.id = tickets.project_id
      where tickets.id = timer_sessions.ticket_id
        and projects.owner_id = (select auth.uid())
        and tickets.status <> 'done'
    )
  );
create policy "Owners can update timer sessions"
  on public.timer_sessions for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check (
    (select auth.uid()) = owner_id and exists (
      select 1 from public.tickets
      join public.projects on projects.id = tickets.project_id
      where tickets.id = timer_sessions.ticket_id
        and projects.owner_id = (select auth.uid())
        and tickets.status <> 'done'
    )
  );
create policy "Owners can delete timer sessions"
  on public.timer_sessions for delete to authenticated
  using ((select auth.uid()) = owner_id);
create or replace function public.set_ticket_completion()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'done' then
    new.completed_at := coalesce(new.completed_at, now());

    if old is null or old.status is distinct from 'done' then
      update public.timer_sessions
      set ended_at = coalesce(ended_at, now())
      where ticket_id = new.id
        and owner_id = (select auth.uid())
        and ended_at is null;
    end if;
  else
    new.completed_at := null;
  end if;

  new.updated_at := now();
  return new;
end;
$$;
create trigger tickets_set_completion
  before insert or update on public.tickets
  for each row execute function public.set_ticket_completion();
create or replace function public.start_ticket_timer(p_ticket_id uuid)
returns public.timer_sessions
language plpgsql
set search_path = public
as $$
declare
  current_user_id uuid := (select auth.uid());
  new_session public.timer_sessions;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(current_user_id::text, 0));

  if not exists (
    select 1 from public.tickets
    join public.projects on projects.id = tickets.project_id
    where tickets.id = p_ticket_id
      and projects.owner_id = current_user_id
      and tickets.status <> 'done'
  ) then
    raise exception 'Ticket is not eligible for a timer' using errcode = 'P0001';
  end if;

  update public.timer_sessions
  set ended_at = coalesce(ended_at, now())
  where owner_id = current_user_id
    and ended_at is null;

  insert into public.timer_sessions (ticket_id, owner_id)
  values (p_ticket_id, current_user_id)
  returning * into new_session;

  return new_session;
end;
$$;
revoke execute on function public.start_ticket_timer(uuid) from public, anon;
grant execute on function public.start_ticket_timer(uuid) to authenticated;
