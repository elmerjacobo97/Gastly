create table telegram_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  telegram_user_id bigint not null unique,
  telegram_username text,
  created_at timestamptz default now()
);

create table telegram_link_tokens (
  token uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '10 minutes'),
  used_at timestamptz
);

alter table telegram_connections enable row level security;
alter table telegram_link_tokens enable row level security;

create policy "users_own_telegram_connection"
  on telegram_connections for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users_own_link_tokens"
  on telegram_link_tokens for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
