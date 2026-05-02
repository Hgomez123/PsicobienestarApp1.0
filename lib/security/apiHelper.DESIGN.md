# apiHelper — Diseño (Fase 5)

> Documento vivo. Captura las decisiones de diseño tomadas antes de
> implementar `lib/security/apiHelper.ts`. Cuando la implementación
> esté completa y validada, este archivo se puede archivar o eliminar.

Última actualización: 2026-05-01

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

## Bloques pendientes

3. **Política unificada de errores.** Estructura del log server-side
   (`console.error` plano vs estructurado), catálogo de mensajes
   constante.
4. **Shape de respuesta `{ ok, data?, error? }`.** Tipos TypeScript,
   helpers de construcción (`ok(data)`, `fail(error, status)`).
5. **Integración con Zod.** Qué se valida, dónde, cómo se reportan
   errores de validación al log server-side.

---

## Notas operativas

- Este archivo se actualiza al cerrar cada bloque adicional.
- La implementación no comienza hasta que los 5 bloques estén cerrados.
- Cuando la implementación esté validada y refactor de las 11 rutas
  completo (Fase 5 cerrada), este archivo se archiva o elimina.
