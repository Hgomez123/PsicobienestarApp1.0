# apiHelper — Diseño (Fase 5)

> Documento vivo. Captura las decisiones de diseño tomadas antes de
> implementar `lib/security/apiHelper.ts`. Cuando la implementación
> esté completa y validada, este archivo se puede archivar o eliminar.

Última actualización: 2026-05-03

---

## Objetivo

Centralizar el patrón duplicado en las 11 rutas API (extraer token,
verificar rol, rate limit, parsear body, verificar ownership, ejecutar
lógica) en un único helper. El handler final solo escribe lógica de
negocio.

## Decisión arquitectónica de fondo

Las verificaciones de ownership pasan a apoyarse en **RLS de Supabase**
como barrera estructural, no en `WHERE doctor_id = ...` explícito en
cada query. Para que RLS aplique, las queries del usuario van por un
**cliente Supabase autenticado con su token**, no por el admin client.

Implicaciones:
- `getAdmin()` (service role) deja de ser la default. Sigue existiendo
  para operaciones que el usuario no podría hacer por sí mismo
  (ej. `auth.admin.deleteUser`, lectura cross-tenant cuando se justifique).
- Cualquier endpoint que llame `getAdmin()` debe tener un comentario
  explicando por qué.
- Se elimina `doctorId` del body en endpoints donde hoy se acepta.
  El doctor autenticado se obtiene del token, no del body.

---

## Bloque 1 — Cliente-con-token

### Ubicación

Archivo nuevo: `lib/supabase/server.ts`. Hogar exclusivo de clientes
Supabase server-side, separado de `lib/supabase/client.ts` (browser).

Razón de la separación: previene importar accidentalmente el cliente
del browser en un Route Handler (o viceversa). Es el patrón canónico
de Supabase + Next.js para route handlers.

### Firma

```ts
function getUserClient(token: string): SupabaseClient
```

- Recibe `token` (string), no `req`. Más fácil de testear, y en el
  pipeline el token ya viene parseado del paso anterior.
- Devuelve siempre un cliente. No valida el token; eso lo hace el
  paso `verifyDoctor` / `verifyPatient` o la propia query (RLS).
- **Sin caché** por ahora. Construir un cliente Supabase es barato.
  Cachear introduce riesgo de tokens expirados sin beneficio claro.
  Si midiendo se vuelve un cuello de botella, se revisa.

### Implementación esperada (esqueleto, no normativo)

```ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";

export function getUserClient(token: string): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
}
```

---

## Bloque 2 — Pipeline (`apiRoute`)

### Forma

Función única con objeto de opciones. **No** builder fluido.

```ts
export async function DELETE(req: NextRequest) {
  return apiRoute(req, {
    auth: "doctor",
    rateLimit: "strict",
    body: deletePatientSchema,
    ownership: async ({ user, body, supabase }) => { /* ... */ },
    handler: async ({ user, body, supabase }) => { /* lógica */ },
  });
}
```

Razón: el orden del pipeline es invariante. Que el call site no pueda
cambiarlo es una feature, no una limitación.

### Firma

```ts
type AuthRole = "doctor" | "patient";
type RateLimitProfile = "strict" | "medium" | "lenient";
type OwnershipCheck<TBody, TUser> =
  | "none"
  | ((ctx: HandlerContext<TBody, TUser>) => Promise<boolean>);

interface ApiRouteOptions<TBody, TUser> {
  auth: AuthRole;
  rateLimit: RateLimitProfile;
  body?: ZodSchema<TBody>;
  ownership: OwnershipCheck<TBody, TUser>;  // OBLIGATORIO
  handler: (ctx: HandlerContext<TBody, TUser>) => Promise<NextResponse>;
}

interface HandlerContext<TBody, TUser> {
  user: TUser;                // tipo discriminado por `auth`
  body: TBody;                // ya parseado y validado por Zod
  supabase: SupabaseClient;   // cliente-con-token
  req: NextRequest;
}

export async function apiRoute<TBody, TUser>(
  req: NextRequest,
  opts: ApiRouteOptions<TBody, TUser>
): Promise<NextResponse>;
```

### Decisiones clave

**`ownership` es obligatorio.** Para endpoints que no aplican
verificación, se pasa `ownership: "none"`. Razón: olvidar el ownership
fue exactamente el bug de Fase 4.6. Forzar la decisión explícita
elimina esa clase de bug.

**`user` se infiere del rol** vía generics discriminados:
`auth: "doctor"` ⇒ `user: Doctor`, `auth: "patient"` ⇒ `user: Patient`.
El handler no necesita type assertions. (Detalle de implementación,
dejado a quien implemente.)

### Orden interno (fijo)

extractToken          → si falla:   401 "No autorizado."
verifyRole (auth)     → si falla:   401 o 403 "No autorizado."
rateLimit             → si falla:   429 "Demasiadas solicitudes."
parseBody (Zod)       → si falla:   400 "Solicitud inválida."
ownership             → si falla:   403 "No autorizado."
handler               → si throw:   500 "Error del servidor."


Justificación del orden:
- Auth antes de rate limit: contar requests del usuario autenticado,
  no del IP anónimo.
- Rate limit antes de parsear body: si el rate limit bloquea, no se
  gasta CPU parseando JSON.
- Body antes de ownership: el ownership a menudo necesita IDs del body.
- Ownership antes del handler: obvio.

**Excepción documentada para el futuro:** si aparecen endpoints
públicos (ej. forgot-password), su rate limit debería ir antes de la
auth. Ninguno de los 11 actuales lo necesita.

### Política de errores al cliente

Mensajes **genéricos**. Los detalles técnicos (qué campo de Zod falló,
qué error de Supabase, etc.) van a `console.error` server-side, **nunca
al body de la respuesta**. Esto resuelve los 4 endpoints que hoy filtran
`error.message` crudo (`checkin-options`, `checkin`, `resource-url`,
`upload-resource`).

Detalles del logging server-side y del catálogo de mensajes (constante
vs hardcoded) → bloque 3, pendiente.

---

## Bloque 3 — Política unificada de errores

### Logging server-side

Helper interno `logError(scope, error, context?)` que escribe JSON
estructurado a `console.error`. Vive en `lib/security/logError.ts`.
Cero dependencias nuevas.

```ts
export function logError(
  scope: string,
  error: unknown,
  context?: Record<string, unknown>
): void {
  console.error(JSON.stringify({
    scope,
    error: error instanceof Error
      ? { message: error.message, stack: error.stack }
      : error,
    context,
    timestamp: new Date().toISOString(),
  }));
}
```

Razón del formato JSON: Vercel logs ya parsea JSON estructurado, así
que ganamos observabilidad gratis cuando la app crezca. Si en el futuro
queremos Sentry / Datadog, cambiar el body del helper migra todo el
repo en un commit.

Caveat menor: JSON-en-stdout es ruidoso de leer en `next dev`. Si
duele, se agrega después un branch `process.env.NODE_ENV === "development"`
que use formato plano.

### Catálogo de mensajes al cliente

Archivo nuevo: `lib/security/errors.ts`. Centraliza todos los mensajes
del pipeline:

```ts
export const ERRORS = {
  UNAUTHORIZED: "No autorizado.",
  RATE_LIMITED: "Demasiadas solicitudes.",
  INVALID_REQUEST: "Solicitud inválida.",
  SERVER_ERROR: "Error del servidor.",
} as const;
```

Handlers que necesiten errores propios (ej. "Cita no disponible.",
"Email ya registrado.") agregan sus mensajes al mismo archivo bajo
la misma constante o una secundaria. Mantiene una sola fuente para
todos los textos visibles al cliente.

TypeScript valida las keys (`ERRORS.UNAUTORIZED` no compila).

### Errores de negocio

Los maneja el handler directamente con `fail(...)` (ver bloque 4).
El pipeline **no** captura excepciones de negocio.

```ts
handler: async ({ supabase, body }) => {
  const { error } = await supabase.from("appointments").insert(...);
  if (error?.code === "23505") {
    return fail("Esta cita ya está reservada.", 409);
  }
  if (error) {
    logError("appointments.insert", error);
    return fail(ERRORS.SERVER_ERROR, 500);
  }
  return ok(data);
}
```

Razón: errores de negocio son parte de la lógica, no errores de
pipeline. Mezclarlos con `throw` y captura en el helper invitaría
a una jerarquía de excepciones que hay que mantener.

El pipeline solo captura `throw` no controlado del handler — lo
trata como 500 con `logError`.

---

## Bloque 4 — Shape de respuesta y helpers de construcción

### Tipos

Discriminated union simple. El status HTTP viaja en la `NextResponse`,
no en el body.

Tipos consolidados en `lib/security/responses.ts` junto con los
helpers (no archivo `types.ts` separado). Razón: los 3 tipos suman
4 líneas y no justifican archivo propio; además, evita colisión
nominal con `lib/supabase/types.ts`.

```ts
// lib/security/responses.ts
export type ApiSuccess<T> = { ok: true; data: T };
export type ApiFailure = { ok: false; error: string };
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
```

El handler devuelve `NextResponse` plano (sin tipar el body). El
contrato lo imponen los helpers `ok()` / `fail()`, no la firma.

### Helpers de construcción

Archivo `lib/security/responses.ts` (mismo archivo donde viven los
tipos).

```ts
import { NextResponse } from "next/server";

export function ok<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json<ApiSuccess<T>>({ ok: true, data }, init);
}

export function fail(error: string, status: number): NextResponse {
  return NextResponse.json<ApiFailure>({ ok: false, error }, { status });
}
```

Decisiones:
- `ok()` acepta `init?` opcional para casos como `POST /api/clinical-notes`
  que devuelve 201. Default 200.
- `fail()` exige status obligatorio. No hay default oculto que invite
  a errores devueltos con status 200.
- Sin shortcuts (`notFound()`, `badRequest()`) por ahora. Si un patrón
  se repite en 3+ endpoints, se agrega.

### Integración con el pipeline

`apiRoute` usa los mismos helpers internamente para sus errores:

```ts
if (!token) return fail(ERRORS.UNAUTHORIZED, 401);
if (rateLimited) return fail(ERRORS.RATE_LIMITED, 429);
// etc.

try {
  return await opts.handler(ctx);
} catch (err) {
  logError(`apiRoute:${req.nextUrl.pathname}`, err);
  return fail(ERRORS.SERVER_ERROR, 500);
}
```

Toda respuesta JSON del sistema (pipeline o handler) pasa por el
mismo embudo. Si un handler tiene un caso raro (blob, redirect),
puede construir `NextResponse` directo — los helpers no son
camisa de fuerza.

---

## Bloque 5 — Integración con Zod

### Dónde viven los schemas

**Inline en cada `route.ts`**, junto al handler que los consume.

```ts
// app/api/patients/route.ts
const deletePatientSchema = z.object({
  userId: z.string().uuid(),
});

export async function DELETE(req: NextRequest) {
  return apiRoute(req, { ..., body: deletePatientSchema, ... });
}
```

Razón: cada schema es la firma del input de **ese endpoint específico**.
Schemas compartidos entre endpoints fragmentan en `createX` / `updateX` /
`partialX` que terminan peor que la duplicación que pretendían evitar.
Si en el futuro el frontend quiere consumir los schemas para validación
client-side, ahí sí se extrae a `lib/schemas/` por dominio.

### Errores Zod

```ts
// Dentro de apiRoute, paso parseBody
const parsed = opts.body.safeParse(rawBody);
if (!parsed.success) {
  logError("apiRoute:parseBody", parsed.error, {
    path: req.nextUrl.pathname,
    issues: parsed.error.issues,
  });
  return fail(ERRORS.INVALID_REQUEST, 400);
}
```

El cliente recibe **solo** `"Solicitud inválida."` con 400. Sin lista
de campos inválidos, sin detalles de qué falló. Razón: el frontend
propio sabe qué manda; si necesita feedback granular para mostrar
errores por campo en un formulario, valida client-side con el mismo
schema. El server es la última línea, no la primera.

`error.issues` (el array detallado de Zod con `{ path, message, code }`
por campo) sí va al `logError` para debugging server-side.

### Query y path params

`apiRoute` extiende su firma para validar también query y path params,
no solo body. Tres schemas opcionales:

```ts
interface ApiRouteOptions<TBody, TQuery, TParams, TUser> {
  auth: AuthRole;
  rateLimit: RateLimitProfile;
  body?: ZodSchema<TBody>;
  query?: ZodSchema<TQuery>;
  params?: ZodSchema<TParams>;
  ownership: OwnershipCheck<...>;
  handler: (ctx: HandlerContext<TBody, TQuery, TParams, TUser>)
    => Promise<NextResponse>;
}
```

Razón: el equivalente del bug de Fase 4.6 en endpoints GET sería
olvidarse de validar el `patientId` que viene en query. Misma clase
de bug. La asimetría "body validado por helper, query a mano" invita
a olvidos.

**Detalle de implementación:** en App Router de Next 15+, los path
params se acceden vía el segundo argumento del handler:

```ts
export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) { ... }
```

`apiRoute` necesita aceptar ese segundo argumento opcional y pasar
los params parseados al schema de validación. No es trivial pero es
estándar.

### Coerción y transforms

- **`trim()` en strings de identidades sociales** (email, nombres):
  default razonable. Whitespace casi siempre es error del cliente.
- **`toLowerCase()` en emails:** sí, evita duplicados case-sensitive.
- **`z.coerce` (string→number, etc.):** no por default. Si el frontend
  manda tipos incorrectos, falle ruidosamente — es bug del frontend,
  no algo que el server debe parchear silenciosamente.

Esto es guía, no enforcement. Cada schema decide.

---

## Notas operativas

- Los 5 bloques de diseño están cerrados. Lista para implementación.
- La implementación se hará en commits separados, idealmente uno por
  pieza: `getUserClient`, `logError`, `ERRORS`, `ok`/`fail`, y
  finalmente `apiRoute` integrando todo. Después, el refactor de las
  11 rutas — probablemente en lotes de 2-3 rutas por commit.
- Cuando la implementación esté validada y el refactor completo
  (Fase 5 cerrada), este archivo se archiva o elimina.
