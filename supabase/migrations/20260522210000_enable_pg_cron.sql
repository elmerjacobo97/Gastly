-- Enable extensions required for scheduled jobs
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Schedule daily payment reminders at 8am Lima time (UTC-5 = 13:00 UTC)
select cron.schedule(
  'send-payment-reminders',
  '0 13 * * *',
  $$
  select net.http_post(
    url := 'https://yadpullgqqehyusoonxs.supabase.co/functions/v1/send-reminders',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  )
  $$
);
