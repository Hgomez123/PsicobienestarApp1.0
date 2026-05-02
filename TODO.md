# TODO

Observaciones y pendientes detectados durante la auditoría de seguridad. Se van agregando por fase cuando encontramos cosas que no corresponden al scope del fix actual pero que no queremos perder.

### Storage — observaciones menores detectadas durante Fase 1

- La comparación `r.file_path = name` en la policy `"Paciente accede a sus archivos"` (`lib/supabase/schema.sql`) **sí funciona** con las rutas `patients/{id}/{timestamp}.{ext}`: tanto `app/api/upload-resource/route.ts:101` como `lib/supabase/db.ts:272` generan exactamente ese formato, y `storage.objects.name` guarda esa misma key interna del bucket. No hay inconsistencia real en la comparación.

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

Hallazgos de la auditoría exploratoria del 29/04/2026 (11 endpoints en 10 archivos):

- **Patrones a centralizar en helper de Fase 5**: `getAdmin()` duplicado en 10 archivos, `extractToken + verifyPatient/Doctor` en 11/11, bloque de rate limit en 11/11, regex UUID en 9, `req.json()` con cast manual en 6, ownership check en 9, `ensureBucket()` duplicado, constante `BUCKET` duplicada, mensajes de error inconsistentes ("No autorizado." vs "Demasiadas solicitudes.").
- **Inconsistencias menores**: payload de éxito sin contrato uniforme (`{ data }`, `{ success: true }`, etc.), `console.error` solo en 5 endpoints, `Retry-After` con/sin fallback `?? 60`, `clinical-notes POST` único con 201.
- **Hueco real**: `DELETE /api/patients` (ver Fase 4.6).
- **Huecos menores para Fase 5.1**: XSS potencial en `notifications`, MIME client-controlable, status codes inconsistentes, errores ignorados silenciosamente en `available-slots`.

### Frontend

_(pendiente — se llenará en fases siguientes)_

### Estado del plan de hardening

- **Fase 1 — SQL + Supabase**: ✅ aplicada y verificada el 28/04/2026 en Supabase. Migraciones consolidadas en `lib/supabase/migrations/`, schema final en `lib/supabase/schema.sql`.
- **Fase 4 — Quitar `getPublicUrl` de `db.ts` (fix C5)**: ✅ cerrada el 29/04/2026 (commit `8ae05f4`). Se eliminó `uploadFile` por ser código muerto, no se reemplazó por `createSignedUrl` porque el flujo real ya usa `getSignedUrl` vía `/api/resource-url`.
- **Fase 4.6 — Fix DELETE /api/patients (ownership)**: pendiente, siguiente en cola. Bug real detectado en auditoría exploratoria del 29/04/2026: el endpoint autentica a la doctora pero permite borrar cualquier `userId` sin verificar que sea un paciente vinculado a ella. Plan: antes de `auth.admin.deleteUser`, hacer `SELECT id FROM patients WHERE user_id = $userId AND doctor_id = $verifiedDoctorId`. Si no hay match, 403. Mitigante actual: solo hay una doctora real, pero la lógica del endpoint no impone esa restricción y rompe en el momento que haya más de una.
- **Fase 5 — Helper API centralizado + refactor de 11 rutas**: pendiente. Crea `lib/security/apiHelper.ts` con patrón unificado: `requireAuth` → `rateLimit` → `parseBody (Zod)` → `ownership` → handler. Refactor de las 11 rutas para usar el helper. Política unificada de errores (log server-side, mensaje genérico al cliente — corrige los 4 endpoints que filtran `error.message` crudo de Supabase: `checkin-options`, `checkin`, `resource-url`, `upload-resource`). También corrige orden invertido en `POST /api/patients` (hoy valida antes de autenticar). Centraliza `getAdmin()` (duplicado en 10 archivos), constante `BUCKET`, y `ensureBucket()` con cache de módulo (resuelve TODO previo). Estandariza shape de respuesta `{ ok, data?, error? }`. Cataloga mensajes de error en una constante.
- **Fase 5.1 — Decisiones derivadas de auditoría**: pendiente, durante Fase 5. (1) Verificar cómo renderiza la UI de la doctora el campo `content` de `notifications` (riesgo de XSS si usa `dangerouslySetInnerHTML`). Si hay riesgo, cambiar a render como texto plano y/o guardar data estructurada. (2) Decidir política de validación MIME en `POST /api/upload-resource`: hoy se confía en `file.type` (cliente-controlable). Opciones: aceptar como mitigado por bucket privado, o sniffear magic numbers server-side. (3) Estandarizar status codes (`POST /api/clinical-notes` devuelve 201, los demás POST devuelven 200 — decidir política). (4) Revisar `GET /api/available-slots`: ignora errores de Supabase silenciosamente y usa `getHours()` local del server (timezone-dependent).
- **Fase 4.5 — Sesión segura (logout por inactividad)**: pendiente, planeada después de Fase 5. Política acordada: 10 min de inactividad para pacientes, 15 min para doctora, con modal de aviso a los 60 segundos previos al cierre. Implementación: (1) cambiar `localStorage` → `sessionStorage` en `lib/supabase/client.ts` para que cerrar pestaña mate la sesión, (2) componente `InactivityTimer` que escuche eventos de actividad y dispare `signOut()` al pasar el TTL, (3) reducir refresh token expiry en Supabase Dashboard como backstop server-side. Razón: portal clínico con datos sensibles; comportamiento estándar en apps de salud (HIPAA-style).
- **Fase 3 — CSP por entorno con nonce + CORS hard-fail**: pendiente. Trabajo sobre `proxy.ts` (ex-`middleware.ts`). Originalmente fix `lib/security/03_middleware.ts` del plan, renombrado a `03_proxy.ts` en espíritu.
- **Fase 2 — Rate limiting con Upstash**: preparada en paralelo (`lib/security/rateLimit.new.ts`). Pendiente: crear cuenta Upstash + env vars, aplicar `await` en 12 call sites, cambiar `lenient` → `medium` en `/api/checkin`, reemplazar `rateLimit.ts` actual.
- **Fase 6 — Verificación end-to-end**: pendiente. Corre después de las fases anteriores aplicadas.
