create or replace function public.decrement_account_balance(
  p_account_id uuid,
  p_amount numeric
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Amount must be greater than zero';
  end if;

  update public.accounts
    set balance = balance - p_amount, updated_at = now()
    where id = p_account_id and user_id = auth.uid();
  if not found then
    raise exception 'Account not found or not owned by current user';
  end if;
end;
$$;

create or replace function public.increment_account_balance(
  p_account_id uuid,
  p_amount numeric
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Amount must be greater than zero';
  end if;

  update public.accounts
    set balance = balance + p_amount, updated_at = now()
    where id = p_account_id and user_id = auth.uid();
  if not found then
    raise exception 'Account not found or not owned by current user';
  end if;
end;
$$;

revoke all on function public.decrement_account_balance(uuid, numeric) from public, anon;
revoke all on function public.increment_account_balance(uuid, numeric) from public, anon;
grant execute on function public.decrement_account_balance(uuid, numeric) to authenticated, service_role;
grant execute on function public.increment_account_balance(uuid, numeric) to authenticated, service_role;
