# Email — Configuración y flujo

## Local vs Producción

| Entorno | Proveedor | Dónde ver los emails |
|---|---|---|
| Local (Docker) | Supabase Inbucket/Mailpit integrado | http://127.0.0.1:54324 |
| Producción | Resend via SMTP personalizado | Dashboard de Resend |

En local **no llegan emails reales**. Mailpit los captura todos. No hace falta configurar nada de SMTP para desarrollar.

---

## Producción — Resend como SMTP personalizado

Supabase free tier permite solo **2 emails/hora** con su SMTP por defecto. Resend reemplaza ese SMTP.

### Cuenta y dominio

1. Crear cuenta en [resend.com](https://resend.com)
2. Agregar y verificar el dominio (`elmerjacobo.dev`) en Resend → Domains
3. Crear API key en Resend → API Keys (guardar, solo se muestra una vez)

### Configurar SMTP en Supabase

Supabase dashboard → **Authentication → Settings → SMTP Settings**:

| Campo | Valor |
|---|---|
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | `<API key de Resend>` |
| Sender email | `noreply@elmerjacobo.dev` (o cualquier dirección del dominio verificado) |
| Sender name | `Gastly` |

Activar el toggle **"Enable Custom SMTP"** y guardar.

### Redirect URLs

Supabase dashboard → **Authentication → URL Configuration**:

- Site URL: `https://gastly.elmerjacobo.dev`
- Redirect URLs: `https://gastly.elmerjacobo.dev/**`

El `/**` cubre todos los paths incluyendo `/auth/confirm?next=/reset-password`.

---

## Flujos de autenticación por email

### Confirmar cuenta (registro)

1. Usuario se registra en `/sign-up`
2. `signUp()` llama `supabase.auth.signUp` con `emailRedirectTo: /auth/confirm`
3. Usuario recibe email → click en botón
4. Redirige a `/auth/confirm?token_hash=...&type=signup`
5. Route handler verifica OTP y redirige a `/dashboard`

### Restablecer contraseña

1. Usuario va a `/forgot-password`, ingresa email
2. `forgotPassword()` llama `supabase.auth.resetPasswordForEmail` con `redirectTo: /auth/confirm?next=/reset-password`
3. Usuario recibe email → click en botón
4. Redirige a `/auth/confirm?token_hash=...&type=recovery&next=/reset-password`
5. Route handler verifica OTP y redirige a `/reset-password`
6. Usuario ingresa nueva contraseña → `supabase.auth.updateUser({ password })`

El route handler que maneja ambos casos está en `app/auth/confirm/route.ts`.

---

## Templates de email (Supabase dashboard)

Supabase dashboard → **Authentication → Email Templates**

### Confirm sign up

- Subject: `Confirma tu correo en Gastly`
- Variable principal: `{{ .ConfirmationURL }}`

### Reset password

- Subject: `Restablece tu contraseña en Gastly`
- Variable principal: `{{ .ConfirmationURL }}`

Ambos templates usan la misma estructura HTML (XHTML Transitional, tablas `role="presentation"`, botón bulletproof con `background-color` en `<td>` no en `<a>` — Gmail strips `background-color` de `<a>`).

> Los templates del dashboard de Supabase solo aplican en **producción**. En local, Mailpit muestra el template por defecto de Supabase.
