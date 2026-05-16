# Plan: Monitoreo de tráfico y actividad de salas

## Contexto

Actualmente Pokaface no tiene ninguna infraestructura de analytics. El plan tiene dos partes independientes que pueden implementarse por separado:

- **Parte 1** — Actividad interna de salas (quién crea/entra a salas), usando el SQLite existente + un endpoint de admin + página `/admin`
- **Parte 2** — Tráfico web general (visitas al sitio), mediante un script de Umami (gratis, sin cookies, GDPR-friendly)

---

## Parte 1: Registro de actividad de salas

### 1. Nueva tabla `events` en SQLite

Archivo: `apps/backend/src/db/schema.ts` — agregar a `runMigrations()`:

```sql
CREATE TABLE IF NOT EXISTS events (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type       TEXT NOT NULL,
  room_id          TEXT,
  participant_name TEXT,
  created_at       TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at DESC);
```

### 2. Función `logEvent()`

Archivo nuevo: `apps/backend/src/db/events.ts`

```ts
export function logEvent(
  db: Database,
  eventType: string,
  roomId?: string,
  participantName?: string
): void {
  db.run(
    `INSERT INTO events (event_type, room_id, participant_name) VALUES (?, ?, ?)`,
    [eventType, roomId ?? null, participantName ?? null]
  );
}
```

Se llama sin `await` (fire-and-forget) para no bloquear los handlers de socket.

### 3. Instrumentar handlers de socket

Archivo: `apps/backend/src/socket/handlers/room.ts`

| Evento socket | Tipo a loggear          | Datos |
|--------------|------------------------|-------|
| `room:create` | `'room_created'`       | room_id, participantName |
| `room:join`   | `'participant_joined'` | room_id, participantName |
| `disconnect`  | `'participant_disconnected'` | room_id (si estaba en sala), participantName |

### 4. Endpoint de stats

Archivo: `apps/backend/src/http/router.ts` — agregar `GET /api/admin/stats`:

```json
{
  "recentEvents": [
    {
      "id": 1,
      "event_type": "room_created",
      "room_id": "abc123",
      "participant_name": "Ana",
      "created_at": "2026-05-15T10:00:00"
    }
  ],
  "totals": {
    "roomsCreated": 42,
    "participantsJoined": 187,
    "activeRooms": 3
  }
}
```

Queries:
- `COUNT` de eventos por tipo (usa el índice `idx_events_created`)
- `SELECT` de las últimas 50 entradas (reducido de 100 para menor memoria)
- `activeRooms`: count de salas donde `updated_at > datetime('now', '-1 hour')` — salas con actividad reciente, sin JOIN costoso

### 5. Limpieza de eventos antiguos

En `apps/backend/src/db/schema.ts`, dentro del job de cleanup de rooms (que ya corre cada 24 h), agregar:

```ts
db.run(`DELETE FROM events WHERE created_at < datetime('now', '-30 days')`);
```

Esto evita que la tabla crezca indefinidamente en el disco del servidor free-tier.

### 5. Página `/admin` en Next.js

Archivo nuevo: `apps/frontend/src/app/admin/page.tsx`

- Fetch a `/api/admin/stats` al montar, con polling cada 60 s (no 30 s — reduce carga DB en free-tier)
- Tarjetas de totales: salas creadas, participantes, salas activas ahora
- Tabla con eventos recientes: tipo, sala, nombre, hora
- Sin dependencias nuevas — solo `useState` + `useEffect` + clases Tailwind existentes
- Sin autenticación por ahora (la URL no está enlazada en la UI)

---

## Parte 2: Tráfico web general (Umami)

### Qué es Umami

- Open source, privacy-first, sin cookies, GDPR compatible
- Tier gratuito en [umami.is](https://umami.is) hasta 100k eventos/mes
- Muestra: visitas únicas, page views, países, dispositivos, páginas más vistas, referrers

### Implementación

Archivo: `apps/frontend/src/app/layout.tsx` — agregar dentro de `<head>`:

```tsx
import Script from 'next/script';

// dentro del return de RootLayout:
<Script
  defer
  src="https://cloud.umami.is/script.js"
  data-website-id="TU-WEBSITE-ID-AQUI"
/>
```

### Pasos manuales necesarios

1. Crear cuenta gratis en [umami.is](https://umami.is)
2. Agregar el sitio (p.ej. `pokaface.io` o tu dominio)
3. Copiar el `data-website-id` generado y pegarlo en `layout.tsx`
4. Hacer deploy — las visitas aparecen en el dashboard de Umami en tiempo real

---

## Archivos a tocar

| Acción  | Archivo |
|---------|---------|
| Modificar | `apps/backend/src/db/schema.ts` |
| Crear   | `apps/backend/src/db/events.ts` |
| Modificar | `apps/backend/src/socket/handlers/room.ts` |
| Modificar | `apps/backend/src/http/router.ts` |
| Crear   | `apps/frontend/src/app/admin/page.tsx` |
| Modificar | `apps/frontend/src/app/layout.tsx` |

---

## Verificación

1. `npm run dev` desde la raíz
2. Crear una sala → `GET http://localhost:3001/api/admin/stats` debe mostrar evento `room_created`
3. Unirse con otro tab → evento `participant_joined`
4. Abrir `http://localhost:3000/admin` → tabla con los eventos
5. Desconectar → evento `participant_disconnected`
6. Para Umami: tras agregar el script y hacer deploy, el dashboard de umami.is muestra las visitas
