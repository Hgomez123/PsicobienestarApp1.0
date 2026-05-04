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

### Frontend — meta-plan a11y portal doctora ✅ cerrado 03/05/2026

Auditoría a11y del portal doctora ejecutada el 02/05/2026. Hallazgos CRÍTICOS
atacados con 8 PRs chicos por tópico, mergeados todos en `main` (PRs GitHub
#4–#11). Orden: aria-labels → form labels → contraste → modal Escape → touch
targets → emojis nav → emojis content → emojis dashboard/schedule. Smoke test
manual entre cada PR.

- **PR #4** — aria-label en 15 botones icon-only de la doctora.
- **PR #5** — form labels con `htmlFor + id` y aria-label en inputs sin label visible.
- **PR #6** — contraste de texto subido (`text-slate-400/300` → `500/600`) para cumplir AA 4.5:1.
- **PR #7** — Escape cierra modales + foco vuelve al elemento de origen.
  Hook nuevo `lib/hooks/useModalA11y.ts` consumido por los 4 modales del portal.
  No incluye focus trap (Tab cyclical) — queda como deuda si se considera necesario.
- **PR #8** — touch targets a ≥44px en mobile con responsive `h-11 md:h-9`
  (header desktop sigue 36px, mobile 44px). Aplicado en DoctorHeader (3 botones),
  DoctorMobileMenu (cerrar drawer), DoctorFollowUp (toggle objetivo, prev/next semana,
  eliminar opción de check-in).
- **PR #9** — emojis de navegación reemplazados por SVG outline (Heroicons-style)
  en DoctorMobileMenu. Eliminado campo `icon` muerto de `SECTION_META` en DoctorHeader.
  SVG inline duplicados con DoctorSidebar (decisión: priorizar PR chico sobre DRY;
  extraer a `lib/icons/` si vale la pena en el futuro).
- **PR #10** — `TYPE_ICON` (emojis) → SVG en DoctorRecommendations (Mensaje/Ejercicio/Reflexión)
  y DoctorResources (PDF/Audio/Lectura/Video). Empty states y paperclip de adjunto también.
- **PR #11** — emojis sueltos → SVG en DoctorDashboard (4 stats cards, empty ☀️, 2 alertas,
  6 quick access) y DoctorSchedule (header solicitudes, empty calendar, link "📅 Calendar").

**Decisión transversal**: caracteres tipográficos `✕` (U+2715) y `→` se mantuvieron
como texto cuando ya tenían `aria-label` — no son emoji pictográfico y renderizan
en font, no en sprite emoji. Reemplazo con SVG no aporta a a11y en esos casos.

**Pendiente** (hallazgos NO-CRÍTICOS de la misma auditoría — sin fecha):
- Focus trap en modales (Tab cyclical dentro del modal). PR #7 lo dejó fuera de scope.
- Modales del paciente (`PortalSidebar`, `Modal.tsx`, `SimpleModal.tsx`, `OnboardingModal.tsx`)
  podrían adoptar `useModalA11y` también — solo se aplicó a la doctora.
- Resto del audit (visuales, copy, jerarquía) — sin compromiso.

### Estado del plan de hardening

- **Fase 1 — SQL + Supabase**: ✅ aplicada y verificada el 28/04/2026 en Supabase. Migraciones consolidadas en `lib/supabase/migrations/`, schema final en `lib/supabase/schema.sql`.
- **Fase 4 — Quitar `getPublicUrl` de `db.ts` (fix C5)**: ✅ cerrada el 29/04/2026 (commit `8ae05f4`). Se eliminó `uploadFile` por ser código muerto, no se reemplazó por `createSignedUrl` porque el flujo real ya usa `getSignedUrl` vía `/api/resource-url`.
- **Fase 4.6 — Fix DELETE /api/patients (ownership)**: ✅ cerrada el 01/05/2026 (commit `7d8e894`). Se agregó verificación `SELECT id FROM patients WHERE user_id = $userId AND doctor_id = $verifiedDoctorId` con `.maybeSingle()` antes de `auth.admin.deleteUser`. Si no hay match, 403 "No autorizado.". Reusa la instancia `admin` ya creada para el `deleteUser`, no abre cliente adicional. 12 líneas insertadas, scope respetado.
- **Fase 5 — Helper API centralizado + refactor de 11 rutas**: parcial. ✅ **Helpers implementados (03/05/2026)**: `lib/supabase/server.ts` con `getUserClient` (4a59f55), `lib/security/logError.ts` (24f85f9), `lib/security/errors.ts` con `ERRORS` (0e8fdd3), `lib/security/responses.ts` con `ApiResponse + ok/fail` (c10ac62), `lib/security/apiHelper.ts` con `apiRoute` (99008c1). Dependencia `zod@^3.25.76` (76072bb). Decisión arquitectónica (a) adoptada: cliente-con-token vía RLS reemplaza admin + WHERE explícito. Decisiones derivadas durante implementación: (1) `RateLimitProfile = "strict" | "lenient"` (no `"medium"` — ese valor llega con Fase 2/Upstash); (2) `HandlerContext.user` tipa como `string`, no objeto rico (los helpers retornan id, no `Doctor`/`Patient`); (3) `apiRoute` no implementa `params` para path dinámicos (cero rutas dinámicas en el repo a la fecha). ⏳ **Pendiente**: refactor de las 11 rutas para usar `apiRoute`, en lotes de 2-3 por commit. Durante el refactor: corregir 4 endpoints que filtran `error.message` crudo (`checkin-options`, `checkin`, `resource-url`, `upload-resource`); corregir orden invertido en `POST /api/patients`; eliminar `doctorId` del body donde aplique (decisión b); centralizar `getAdmin()`, constante `BUCKET`, y `ensureBucket()` con cache de módulo (resuelve TODO previo de storage).
- **Fase 5.1 — Decisiones derivadas de auditoría**: pendiente, durante Fase 5. (1) Verificar cómo renderiza la UI de la doctora el campo `content` de `notifications` (riesgo de XSS si usa `dangerouslySetInnerHTML`). Si hay riesgo, cambiar a render como texto plano y/o guardar data estructurada. (2) Decidir política de validación MIME en `POST /api/upload-resource`: hoy se confía en `file.type` (cliente-controlable). Opciones: aceptar como mitigado por bucket privado, o sniffear magic numbers server-side. (3) Estandarizar status codes (`POST /api/clinical-notes` devuelve 201, los demás POST devuelven 200 — decidir política). (4) Revisar `GET /api/available-slots`: ignora errores de Supabase silenciosamente y usa `getHours()` local del server (timezone-dependent). (5) Registrar intentos no autorizados en `audit_log` (tabla creada en Fase 1). Detectado en Fase 4.6: el 403 de DELETE /api/patients pasa silenciosamente — no queda registro server-side de quién intentó borrar a quién. En portal clínico con datos sensibles eso es señal que queremos ver. Requiere diseñar schema del evento (tipo, actor, target, timestamp, resultado) y nivel de severidad. Aplica a todos los endpoints con ownership check, no solo DELETE.
- **Fase 4.5 — Sesión segura (logout por inactividad)**: pendiente, planeada después de Fase 5. Política acordada: 10 min de inactividad para pacientes, 15 min para doctora, con modal de aviso a los 60 segundos previos al cierre. Implementación: (1) cambiar `localStorage` → `sessionStorage` en `lib/supabase/client.ts` para que cerrar pestaña mate la sesión, (2) componente `InactivityTimer` que escuche eventos de actividad y dispare `signOut()` al pasar el TTL, (3) reducir refresh token expiry en Supabase Dashboard como backstop server-side. Razón: portal clínico con datos sensibles; comportamiento estándar en apps de salud (HIPAA-style).
- **Fase 3 — CSP por entorno con nonce + CORS hard-fail**: pendiente. Trabajo sobre `proxy.ts` (ex-`middleware.ts`). Originalmente fix `lib/security/03_middleware.ts` del plan, renombrado a `03_proxy.ts` en espíritu.
- **Fase 2 — Rate limiting con Upstash**: preparada en paralelo (`lib/security/rateLimit.new.ts`). Pendiente: crear cuenta Upstash + env vars, aplicar `await` en 12 call sites, cambiar `lenient` → `medium` en `/api/checkin`, reemplazar `rateLimit.ts` actual.
- **Fase 6 — Verificación end-to-end**: pendiente. Corre después de las fases anteriores aplicadas.

### Deuda derivada de Fase 5

- **`RateLimitProfile` necesita `"medium"` cuando llegue Fase 2.** El helper `apiRoute` hoy tipa `"strict" | "lenient"` porque el `rateLimit.ts` actual solo expone esos dos perfiles. Cuando Fase 2 reemplace el archivo con la implementación de Upstash que incluye `medium`, agregar el valor al union `RateLimitProfile` en `lib/security/apiHelper.ts`.
- **Considerar enriquecer `verifyDoctor` y `verifyPatient`.** Hoy retornan `string` (id). Si en el futuro se refactoran para devolver objetos `Doctor`/`Patient` ricos (con `name`, `email`, etc.), ajustar `HandlerContext.user` en `apiRoute` y aprovechar el tipado discriminado por rol que el blueprint original anticipaba.
- **Path params en `apiRoute` cuando aparezca primer endpoint dinámico.** Hoy `apiRoute` solo acepta `body` y `query`. Cuando aparezca el primer route con segmento dinámico (`app/api/.../[id]`), extender la firma con `params?: ZodSchema<TParams>` y agregar manejo del segundo argumento `ctx: { params: Promise<...> }` del handler de App Router de Next 15+. Patrón documentado en `lib/security/apiHelper.DESIGN.md` bloque 5.

### Deuda externa

- **Vulnerabilidades pre-existentes de postcss (transitive de Next.js):** `GHSA-qx2v-qp2m-jg93` (XSS via unescaped `</style>`). Detectado durante install de zod en Fase 5 (03/05/2026). `npm audit fix --force` propone degradar Next a 9.3.3 (breaking change que rompe el repo entero). Esperar parche de Next o evaluar bump cuando salga. No se toca.
