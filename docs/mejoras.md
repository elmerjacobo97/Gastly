# Roadmap de mejoras e integraciones

## Integraciones

### Telegram Bot ⭐ (gratis, alta utilidad)

El Bot API de Telegram es completamente gratuito. El bot vive como webhook en una Supabase Edge Function.

**Casos de uso:**

- Registrar gasto rápido: `/gaste 50 comida`
- Consultar saldo disponible: `/saldo`
- Ver próximos pagos: `/pagos`
- Resumen diario/semanal automático
- Alerta cuando se acerca vencimiento de un pago recurrente

**Stack:**

- BotFather → crear bot y obtener token
- Supabase Edge Function como webhook receptor
- Tabla `telegram_connections` para vincular `telegram_user_id` con `user_id` de Gastly
- Flujo de vinculación: usuario genera token en Gastly → lo envía al bot con `/start <token>`

---

### Recordatorios por email (gratis, ya tienes Resend)

Supabase Edge Functions + pg_cron para enviar emails automáticos.

**Casos de uso:**

- Email 3 días antes de que venza un pago recurrente
- Resumen mensual el día 1 de cada mes
- Alerta cuando un presupuesto supera 80%

**Stack:**

- `supabase/functions/send-reminders/` — Edge Function
- `pg_cron` en Supabase para disparar la función diariamente
- Resend ya configurado (ver `docs/email.md`)

---

### Google Calendar (gratis con OAuth)

Crear eventos de calendario para fechas de vencimiento de pagos recurrentes, cuotas e installments.

**Casos de uso:**

- Al crear/editar un pago recurrente, opción "Agregar a Google Calendar"
- Evento con recordatorio 1 día antes
- Sincronización cuando cambia `nextDueOn`

**Stack:**

- Google OAuth2 (scope `calendar.events`)
- Google Calendar API v3
- Guardar `google_refresh_token` por usuario en Supabase

---

### Tipo de cambio PEN/USD (gratis)

API pública gratuita para convertir automáticamente gastos en dólares a soles.

**Opciones gratuitas:**

- [exchangerate-api.com](https://exchangerate-api.com) — 1500 req/mes free
- [frankfurter.app](https://frankfurter.app) — sin límite, open source

**Casos de uso:**

- Campo "moneda" en transacciones (PEN/USD)
- Mostrar equivalente en PEN al registrar en USD
- Reportes siempre en PEN para consistencia

---

### CSV Import desde banco

Muchos bancos peruanos (BCP, Interbank, BBVA, Scotiabank) permiten descargar movimientos en Excel/CSV. Parser que auto-crea transacciones.

**Casos de uso:**

- Subir CSV del banco → preview de transacciones → confirmar importación
- Mapear columnas del CSV a campos de Gastly
- Detectar duplicados por fecha + monto

---

### Belvo — Open Banking LatAm (cuenta empresarial requerida)

Equivalente a Plaid pero para LatAm (Perú, México, Brasil, Colombia). Conecta directo con bancos y jala transacciones automáticamente.

**Pro:** Automatiza 100% el registro de transacciones  
**Contra:** Requiere proceso de aprobación empresarial, no disponible para uso personal inmediato

---

## Nuevas características en la app

### Metas de ahorro

Crear objetivos: "Laptop nueva — S/ 3000 para diciembre". Trackear aporte mensual, progreso, fecha estimada.

---

### Gasto diario disponible

En el resumen del dashboard:

```
Restante libre este mes: S/ 600
Días restantes: 15
Puedes gastar: S/ 40 por día
```

---

### Dashboard de próximos pagos

Widget en el resumen con los próximos 7 días:

```
Mañana     Claude Code     S/ 68.23
En 3 días  Celular         S/ 39.90
En 5 días  Netflix         S/ 37.90
```

---

### Onboarding para nuevos usuarios

Flujo al primer login:

1. ¿Cuál es tu ingreso mensual? → crear plan mensual
2. ¿Cuánto quieres ahorrar? → porcentaje de ahorro
3. Crear 3-5 categorías básicas (nombre + ícono + color)

---

### Importar / exportar datos

- **Exportar:** PDF de reporte mensual, CSV de todas las transacciones
- **Importar:** CSV genérico con formato documentado

---

### Deuda neta / patrimonio

Vista simple:

```
Activos:    S/ 5,000 (ahorros estimados acumulados)
Deudas:     S/ 2,400 (préstamos activos)
Neto:       S/ 2,600
```

---

### Transacciones recurrentes

Marcar una transacción como recurrente para que se genere automáticamente cada mes (útil para ingresos fijos o gastos que no son "pagos recurrentes" en el sentido estricto del módulo actual).

---

## UX / Técnico

- **PWA** — instalar como app en móvil (manifest.json + service worker)
- **Operaciones en lote** — seleccionar varias transacciones para eliminar o recategorizar
- **Atajos de teclado** — `N` para nueva transacción, `B` para nuevo presupuesto
- **Búsqueda global** — buscar por descripción o monto en cualquier módulo

---

## Prioridad sugerida

| Prioridad | Item                     | Esfuerzo | Impacto |
| --------- | ------------------------ | -------- | ------- |
| 1         | Recordatorios por email  | Bajo     | Alto    |
| 2         | Gasto diario disponible  | Bajo     | Alto    |
| 3         | Dashboard próximos pagos | Bajo     | Alto    |
| 4         | Telegram bot             | Medio    | Alto    |
| 5         | Tipo de cambio PEN/USD   | Bajo     | Medio   |
| 6         | Metas de ahorro          | Medio    | Alto    |
| 7         | CSV import desde banco   | Medio    | Medio   |
| 8         | Google Calendar          | Medio    | Medio   |
| 9         | Onboarding               | Medio    | Alto    |
| 10        | PWA                      | Bajo     | Medio   |
