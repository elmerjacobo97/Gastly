# Recordatorios por email

Gastly envía automáticamente un email de recordatorio 3 días antes de que venza un pago recurrente.

## Arquitectura

```
pg_cron (8am Lima, cada día)
       │
       ▼
pg_net.http_post
       │
       ▼
Supabase Edge Function
  /functions/v1/send-reminders
       │  ├── query recurring_expenses WHERE next_due_on = hoy + 3
       │  └── auth.admin.getUserById() → email del usuario
       ▼
Resend API → email al usuario
```

---

## Setup inicial (una sola vez)

### 1. Agregar los secrets de la Edge Function

```bash
REMINDERS_WEBHOOK_SECRET=$(openssl rand -hex 32)
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxxxxx REMINDERS_WEBHOOK_SECRET="$REMINDERS_WEBHOOK_SECRET"
```

El API key se genera en **resend.com → API Keys → Create API Key** con permiso _Sending access_.
Guarda `REMINDERS_WEBHOOK_SECRET` en un gestor seguro; debe coincidir con el valor almacenado en Vault para el job de `pg_cron`. No lo guardes en el repositorio.

Verificar:

```bash
supabase secrets list
```

### 2. Guardar el secret del cron en Vault

En el SQL Editor de Supabase, crea un secret con el mismo valor de `REMINDERS_WEBHOOK_SECRET`:

```sql
select vault.create_secret(
  '<pega aquí el valor de REMINDERS_WEBHOOK_SECRET>',
  'send_reminders_webhook_secret',
  'Auth header for the send-reminders pg_cron job'
);
```

No guardes el valor real en SQL versionado ni en este documento.

### 3. Aplicar las migraciones

```bash
supabase db push
```

La migración original habilita `pg_cron`/`pg_net`; la migración `secure_reminder_webhook` actualiza el job para leer la clave desde Vault en cada ejecución y enviar `x-reminders-secret` (el valor no queda escrito en `cron.job.command`). Requiere que el paso anterior se complete primero.

### 4. Deploy de la Edge Function

```bash
supabase functions deploy send-reminders --no-verify-jwt
```

> **`--no-verify-jwt` sigue siendo necesario** porque invoca `pg_cron`, no un usuario con JWT de Supabase. El handler valida `x-reminders-secret`; requests no autenticados reciben 401.

---

## Re-deploy (cuando se modifica la función o el template del email)

```bash
supabase functions deploy send-reminders --no-verify-jwt
```

El job de pg_cron no cambia — solo se re-deploya la función.

---

## Cómo funciona el job

El job registrado en `cron.job` se puede verificar con:

```sql
SELECT jobname, schedule, command FROM cron.job;
```

Resultado esperado:

```
jobname                  | schedule   | command
send-payment-reminders   | 0 13 * * * | select net.http_post(...)
```

`0 13 * * *` = todos los días a las 13:00 UTC = 8:00am Lima (UTC-5).

---

## Lógica de envío

- Busca pagos con `is_active = true` y fechas calculadas desde el día actual de Lima (+3 días o venció ayer)
- Agrupa por usuario
- Por cada usuario, llama `supabase.auth.admin.getUserById()` para obtener email y nombre
- Si un usuario tiene múltiples pagos ese día, recibe **un solo email** con todos listados
- El asunto varía:
  - 1 pago: `Recordatorio: Netflix vence en 3 días`
  - N pagos: `Recordatorio: 3 pagos próximos en 3 días`
- Repeticiones del mismo envío dentro del mismo día usan una clave de idempotencia de Resend.

---

## Variables de entorno

| Variable                    | Dónde se configura     | Descripción                                                                 |
| --------------------------- | ---------------------- | --------------------------------------------------------------------------- |
| `RESEND_API_KEY`            | `supabase secrets set` | API key de Resend                                                           |
| `REMINDERS_WEBHOOK_SECRET`  | `supabase secrets set` | Secret validado por el handler y también almacenado en Vault para `pg_cron` |
| `SUPABASE_URL`              | Automático             | URL del proyecto                                                            |
| `SUPABASE_SERVICE_ROLE_KEY` | Automático             | Permite usar `auth.admin`                                                   |

---

## Probar manualmente

```bash
curl -X POST \
  -H "x-reminders-secret: $REMINDERS_WEBHOOK_SECRET" \
  https://yadpullgqqehyusoonxs.supabase.co/functions/v1/send-reminders
```

Respuestas posibles:

```json
{ "upcoming": 0, "overdue": 0, "date": "2026-05-25" } // Sin pagos para notificar
{ "upcoming": 2, "overdue": 1, "date": "2026-05-25" } // Emails enviados por tipo
{ "error": "..." }               // Error (ver logs)
```

Para forzar un test: cambiar temporalmente `next_due_on` de un pago recurrente a `hoy + 3 días` desde la app web y volver a correr el curl.

---

## Debugging

```bash
supabase functions logs send-reminders --tail
```

Errores comunes:

| Error              | Causa                                      | Solución                                            |
| ------------------ | ------------------------------------------ | --------------------------------------------------- |
| `sent: 0` siempre  | No hay pagos con `next_due_on = hoy + 3`   | Verificar fechas en la app                          |
| `Resend error 401` | `RESEND_API_KEY` no configurado o inválido | `supabase secrets set RESEND_API_KEY=...`           |
| `Resend error 403` | Dominio no verificado en Resend            | Verificar `elmerjacobo.dev` en resend.com → Domains |
| Job no corre       | `pg_cron` o `pg_net` no instalados         | Correr `supabase db push` con la migración          |
