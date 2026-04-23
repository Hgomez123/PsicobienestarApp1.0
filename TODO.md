# TODO

Observaciones y pendientes detectados durante la auditoría de seguridad. Se van agregando por fase cuando encontramos cosas que no corresponden al scope del fix actual pero que no queremos perder.

### Storage — observaciones menores detectadas durante Fase 1

- La comparación `r.file_path = name` en la policy `"Paciente accede a sus archivos"` (`lib/supabase/schema.sql`) **sí funciona** con las rutas `patients/{id}/{timestamp}.{ext}`: tanto `app/api/upload-resource/route.ts:101` como `lib/supabase/db.ts:272` generan exactamente ese formato, y `storage.objects.name` guarda esa misma key interna del bucket. No hay inconsistencia real en la comparación.

- `lib/supabase/db.ts:270-285` (`uploadFile`) llama `getPublicUrl` sobre un bucket **privado** — la URL devuelta nunca va a resolver. El flujo en producción usa `/api/upload-resource` + `/api/resource-url` (URL firmada), por lo que `uploadFile` de `db.ts` huele a código muerto o legacy. **Planeado para eliminar en Fase 5 (fix C5) como parte del cleanup de `lib/supabase/db.ts`** — no duplicar trabajo acá.

- La policy de storage depende de que quien llame a `createResource` guarde `path` (no `url`) en el campo `file_path`. Si alguna vez se guarda la URL ahí por error, la policy falla en silencio para esa fila. Tema de testing, no de schema.

### Storage — optimización de resource-url/upload-resource

- `ensureBucket()` se llama en cada request y hace `listBuckets` + `createBucket?`.
  Mover a cache de módulo (una sola verificación por cold start). Una vez
  aplicado, revisar si el rate limit de `/api/resource-url` necesita ajuste.

### Observaciones pendientes de rateLimit (no críticas)

- **Fallback en memoria sin eviction (dev-only).** `lib/security/rateLimit.new.ts`
  usa un `Map` global (`globalThis.__rlStore`) cuando no hay Upstash. El Map crece
  indefinidamente durante `next dev` — nunca hay eviction de entradas viejas.
  Impacto bajo (dev-only, no corre en producción con Upstash configurado), pero
  una corrida de carga larga podría consumir RAM. Fix futuro: eviction por TTL
  o tamaño máximo (LRU liviano).

### Next.js 16 — migración middleware → proxy

Next 16.0.0 renombró la convención `middleware.ts` a `proxy.ts`. La deprecación
emite warning en cada build/dev desde nuestro bump a 16.2.4. El doc local
(`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`)
deja claro que es un rename puro:

- Archivo: `middleware.ts` → `proxy.ts`.
- Función: `export function middleware(...)` → `export function proxy(...)`.
- `NextRequest`, `NextResponse`, `config.matcher`, cookies API, headers API:
  todos idénticos. Sin cambios de firma ni de tipos.
- Flags avanzados en `next.config.ts` también renombrados
  (`skipMiddlewareUrlNormalize` → `skipProxyUrlNormalize`). **No aplica** —
  no los usamos.

**Sin fecha de EOL** documentada, pero la deprecación ya tiene 2 minor
versions y seguirá el patrón típico de Next (probable removal en v17.x–v18.x).

**Fase afectada:** Fase 3 (proxy con CSP nonce, CORS hard-fail, COOP/CORP).
Ese trabajo va sobre este mismo archivo.

**Opciones consideradas:**
- **(A)** Migrar ahora, en un commit preparatorio antes de Fase 4. El cambio
  es mecánico: mover el archivo y renombrar `middleware` → `proxy` en el
  export. Después correr `npm run build` + smoke test de dev. Deja a Fase 4
  trabajando sobre un archivo ya migrado.
- **(B)** Migrar como parte de Fase 4, en el mismo commit que agrega CSP
  nonce / CORS hard-fail. Mezcla chore mecánico con hardening de seguridad
  — contra rule #2 (un fix = un commit).
- **(C)** Posponer hasta que la deprecación tenga fecha de EOL anunciada.
  Riesgo: AGENTS.md dice explícitamente "Heed deprecation notices".
  Trabajar sobre archivo deprecado contradice esa regla del repo.

**Aplicada: opción (A)** — ver en git log el commit
`chore: rename middleware.ts → proxy.ts por deprecación en Next 16`.
Cumple con AGENTS.md, evita que Fase 4 mezcle scopes, y cuesta un commit
trivial. Se hizo a mano (no con el codemod `@next/codemod@canary`): el
cambio son ~2 líneas, hacerlo a mano es más predecible que correr un
codemod canary sobre el repo entero.

### API routes

_(pendiente — se llenará en fases siguientes)_

### Frontend

_(pendiente — se llenará en fases siguientes)_
