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

### 1. Agregar RESEND_API_KEY como secret

```bash
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxxxxx
```

El API key se genera en **resend.com → API Keys → Create API Key** con permiso _Sending access_.

Verificar:

```bash
supabase secrets list
```

### 2. Aplicar la migración (habilita pg_cron + pg_net y crea el job)

```bash
supabase db push
```

Esto ejecuta `supabase/migrations/20260522210000_enable_pg_cron.sql` que:

- Habilita las extensiones `pg_cron` y `pg_net`
- Registra el job `send-payment-reminders` corriendo diariamente a las 13:00 UTC (8am Lima)

### 3. Deploy de la Edge Function

```bash
supabase functions deploy send-reminders --no-verify-jwt
```

> **`--no-verify-jwt` es obligatorio.** La función la llama pg_cron internamente, no un usuario autenticado.

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

- Busca en `recurring_expenses` donde `is_active = true` y `next_due_on = CURRENT_DATE + 3 días`
- Agrupa por usuario
- Por cada usuario, llama `supabase.auth.admin.getUserById()` para obtener email y nombre
- Si un usuario tiene múltiples pagos ese día, recibe **un solo email** con todos listados
- El asunto varía:
  - 1 pago: `Recordatorio: Netflix vence en 3 días`
  - N pagos: `Recordatorio: 3 pagos próximos en 3 días`

---

## Variables de entorno

| Variable                    | Dónde se configura     | Descripción               |
| --------------------------- | ---------------------- | ------------------------- |
| `RESEND_API_KEY`            | `supabase secrets set` | API key de Resend         |
| `SUPABASE_URL`              | Automático             | URL del proyecto          |
| `SUPABASE_SERVICE_ROLE_KEY` | Automático             | Permite usar `auth.admin` |

---

## Probar manualmente

```bash
curl -X POST https://yadpullgqqehyusoonxs.supabase.co/functions/v1/send-reminders
```

Respuestas posibles:

```json
{ "sent": 0 }                    // Sin pagos venciendo en 3 días
{ "sent": 2, "date": "2026-05-25" } // Emails enviados
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
