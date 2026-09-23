-- Replace the previously unauthenticated pg_cron invocation with a Vault-backed
-- header. Create this Vault secret before applying this migration:
--   select vault.create_secret('<same value as REMINDERS_WEBHOOK_SECRET>',
--     'send_reminders_webhook_secret', 'Webhook auth for daily reminders');
do $$
declare
  webhook_secret text;
begin
  select decrypted_secret
    into webhook_secret
    from vault.decrypted_secrets
    where name = 'send_reminders_webhook_secret'
    order by created_at desc
    limit 1;

  if webhook_secret is null or length(webhook_secret) < 32 then
    raise exception 'Vault secret send_reminders_webhook_secret must exist and contain at least 32 characters';
  end if;

  perform cron.unschedule(jobid)
    from cron.job
    where jobname = 'send-payment-reminders';

  perform cron.schedule(
    'send-payment-reminders',
    '0 13 * * *',
    $job$
      select net.http_post(
        url := 'https://yadpullgqqehyusoonxs.supabase.co/functions/v1/send-reminders',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-reminders-secret', (
            select decrypted_secret
            from vault.decrypted_secrets
            where name = 'send_reminders_webhook_secret'
            order by created_at desc
            limit 1
          )
        ),
        body := '{}'::jsonb
      )
    $job$
  );
end;
$$;
