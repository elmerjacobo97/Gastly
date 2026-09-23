# Telegram Bot

Gastly tiene un bot de Telegram (`@gastly_finance_bot`) que permite registrar gastos e ingresos y consultar el saldo disponible sin abrir la app.

## Arquitectura

```
Usuario en Telegram
       │
       ▼
Telegram API (webhook POST)
       │
       ▼
Supabase Edge Function  ←── TELEGRAM_BOT_TOKEN + TELEGRAM_WEBHOOK_SECRET (secrets)
  /functions/v1/telegram-bot
       │
       ▼
Supabase DB (service role)
  transactions, monthly_plans, recurring_expenses
```

La Edge Function corre en Deno (runtime de Supabase). Telegram envía cada mensaje como un `POST` al webhook. La función usa el **service role key** para saltarse RLS y acceder a datos de cualquier usuario.

---

## Setup inicial (una sola vez)

### 1. Crear el bot en Telegram

1. Abrir `@BotFather` en Telegram
2. Enviar `/newbot`
3. Seguir los pasos → obtendrás un token tipo `7123456789:AAF...`

### 2. Configurar los secrets de Supabase

```bash
TELEGRAM_WEBHOOK_SECRET=$(openssl rand -hex 32)
supabase secrets set TELEGRAM_BOT_TOKEN=<tu_token> TELEGRAM_WEBHOOK_SECRET="$TELEGRAM_WEBHOOK_SECRET"
```

Conserva `TELEGRAM_WEBHOOK_SECRET` en un gestor seguro: también se usa al registrar el webhook con Telegram. No lo guardes en el repositorio.

Verificar que quedó:

```bash
supabase secrets list
```

### 3. Aplicar la migración de DB

```bash
supabase db push
```

Esto crea las tablas `telegram_connections` y `telegram_link_tokens` con RLS activado.

### 4. Deploy de la Edge Function

```bash
supabase functions deploy telegram-bot --no-verify-jwt
```

> **`--no-verify-jwt` sigue siendo necesario** porque Telegram no envía un JWT de Supabase. La función valida en su lugar el header secreto propio de Telegram; sin el secret, falla cerrada y no procesa updates.

### 5. Registrar el webhook con Telegram

```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -H 'Content-Type: application/json' \
  -d "$(jq -n \
    --arg url 'https://yadpullgqqehyusoonxs.supabase.co/functions/v1/telegram-bot' \
    --arg secret_token "$TELEGRAM_WEBHOOK_SECRET" \
    '{url: $url, secret_token: $secret_token}')"
```

Respuesta esperada:

```json
{ "ok": true, "result": true, "description": "Webhook was set" }
```

Verificar que el webhook está activo:

```bash
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

---

## Re-deploy (cuando se modifica el bot)

Solo se necesita volver a hacer deploy. El webhook no cambia de URL.

```bash
supabase functions deploy telegram-bot --no-verify-jwt
```

---

## Tablas de DB

### `telegram_connections`

Vincula un usuario de Gastly con su cuenta de Telegram.

| Columna             | Tipo        | Descripción                         |
| ------------------- | ----------- | ----------------------------------- |
| `id`                | uuid        | PK                                  |
| `user_id`           | uuid        | FK → `auth.users`                   |
| `telegram_user_id`  | bigint      | ID numérico del usuario en Telegram |
| `telegram_username` | text        | `@username` (puede ser null)        |
| `created_at`        | timestamptz |                                     |

### `telegram_link_tokens`

Token temporal (10 min) para vincular una cuenta. El usuario lo genera desde Settings → Integraciones → Telegram.

| Columna      | Tipo        | Descripción                               |
| ------------ | ----------- | ----------------------------------------- |
| `token`      | uuid        | PK, se envía al bot como `/start <token>` |
| `user_id`    | uuid        | FK → `auth.users`                         |
| `expires_at` | timestamptz | `now() + 10 minutes`                      |
| `used_at`    | timestamptz | null hasta que se use                     |

---

## Comandos del bot

| Comando                          | Ejemplo                | Descripción                                            |
| -------------------------------- | ---------------------- | ------------------------------------------------------ |
| `/start <token>`                 | `/start d7e9f0ad-...`  | Vincula la cuenta (token generado en Settings)         |
| `/gaste <monto> <descripción>`   | `/gaste 50 almuerzo`   | Registra un gasto                                      |
| `/ingreso <monto> <descripción>` | `/ingreso 2500 sueldo` | Registra un ingreso                                    |
| `/saldo`                         | `/saldo`               | Muestra saldo disponible del mes según el plan mensual |
| `/pagos`                         | `/pagos`               | Lista pagos pendientes en los próximos 7 días          |
| `/resumen`                       | `/resumen`             | Resumen de ingresos, gastos y balance del mes          |

---

## Flujo de vinculación

1. Usuario abre **Settings → Integraciones → Telegram** en la app web
2. Hace clic en "Generar código de vinculación" → se crea un token UUID en `telegram_link_tokens` (válido 10 min)
3. Usuario copia el mensaje `/start <token>` y lo envía al bot
4. La Edge Function valida el token (no expirado, no usado) y crea una fila en `telegram_connections`
5. Marca el token como `used_at = now()`
6. El bot responde con confirmación y lista de comandos

> **Importante:** el token se genera contra la DB de producción. Generar el token en `localhost` no funciona porque la Edge Function apunta a la DB de producción.

---

## Variables de entorno

| Variable                    | Dónde se configura           | Descripción                                              |
| --------------------------- | ---------------------------- | -------------------------------------------------------- |
| `TELEGRAM_BOT_TOKEN`        | `supabase secrets set`       | Token del bot de BotFather                               |
| `TELEGRAM_WEBHOOK_SECRET`   | `supabase secrets set`       | Secret validado contra `X-Telegram-Bot-Api-Secret-Token` |
| `SUPABASE_URL`              | Automático en Edge Functions | URL del proyecto                                         |
| `SUPABASE_SERVICE_ROLE_KEY` | Automático en Edge Functions | Clave de servicio (bypasea RLS)                          |

`SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` los inyecta Supabase automáticamente en todas las Edge Functions — no hay que configurarlos manualmente.

---

## Debugging

Ver logs en tiempo real:

```bash
supabase functions logs telegram-bot --tail
```

Ver los últimos N logs:

```bash
supabase functions logs telegram-bot
```

Errores comunes:

| Error                            | Causa                                                                      | Solución                                           |
| -------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------- |
| `401 Unauthorized`               | Secret del webhook ausente o Telegram no se re-registró con `secret_token` | Alinear secrets y ejecutar `setWebhook` nuevamente |
| Bot no responde                  | Webhook no registrado o URL incorrecta                                     | Verificar con `getWebhookInfo`                     |
| `/saldo` no muestra plan mensual | No hay plan mensual creado para el mes                                     | Crear plan en la app web                           |
| Token inválido en `/start`       | Token generado en localhost, no en producción                              | Generar token en `gastly.elmerjacobo.dev`          |
