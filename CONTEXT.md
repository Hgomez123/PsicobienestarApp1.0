# CONTEXT.md — Psicobienestar

> **Lee este archivo al inicio de CADA sesión técnica.**
> Es la fuente de verdad del estado del proyecto.
> Si algo en este archivo contradice la memoria de Claude o las
> notas de cualquier asistente, **este archivo gana**.

Última actualización: 2026-04-28

---

## Identidad del proyecto

- **Nombre**: Psicobienestar — portal clínico
- **Cliente**: Lic. María Eugenia Castillo García (Psicología Clínica, Guatemala)
- **Repo correcto**: `Hgomez123/PsicobienestarApp1.0`
- **Path local correcto**: `C:\Users\gomez\psicobienestar\psicobienestar-publica`
- **Deploy**: Vercel — `https://psicobienestar-app1-0-ixke.vercel.app/`
- **Email contacto**: gt.psicobienestar@gmail.com
- **Pacientes activos**: ~2 reales (en crecimiento), portal recién oficializado
- **UUID doctora (prod)**: `de4a5075-c4a0-44e4-8650-754db358f495`

⚠️ **Confusión histórica**: existe otra carpeta `C:\Users\gomez\psicoBienestar\`
con otro repo distinto (solo 2 commits, sin backend). NO es el repo correcto.
Verificar siempre con `git remote -v` al inicio de cada sesión.

---

## Stack técnico

- Next.js 16.2.4 (App Router) + React 19.2 + TypeScript 5
- Tailwind CSS v4
- Supabase (Auth + DB + Storage privado bucket `psicobienestar-files`) — plan Free
- Auth: clientes separados por rol (`supabase` paciente, `supabaseDoctor`)
  con `storageKey` distintas
- Helpers de seguridad: `verifyPatient`, `verifyDoctor`, `patientOwns`,
  `doctorOwnsPatient`

---

## Estado de las 6 fases del plan de hardening

| # | Fase                                          | Estado                              |
|---|-----------------------------------------------|-------------------------------------|
| 1 | SQL/RLS hardening                             | ✅ Aplicada y verificada (28/04/2026) |
| 2 | Rate limiting con Upstash                     | 🟡 Preparada en `security-hardening`, pendiente setup Upstash + migrar 12 call sites |
| 3 | CSP con nonce sobre `proxy.ts`                | ⏳ Pendiente                         |
| 4 | Quitar `getPublicUrl` de `db.ts`              | ✅ Cerrada (29/04/2026) — `uploadFile` eliminada por código muerto |
| 5 | Helper API centralizado + refactor 10 rutas   | ⏳ Pendiente                         |
| 6 | Verificación end-to-end                       | ⏳ Pendiente                         |

### Fase 1 — verificada en Supabase el 28/04/2026

- ✅ Trigger `profiles_prevent_role_change` (BEFORE UPDATE en `profiles`)
- ✅ Función `prevent_role_change()` en schema `public`
- ✅ 12 índices de performance aplicados
- ✅ 22/22 policies UPDATE/INSERT/ALL con `WITH CHECK`
- ✅ `handle_new_user` asigna siempre `'patient'`
- ✅ Tablas `tasks` y `audit_log` creadas con RLS completa
- ✅ Columnas `checkin_options` y `drive_link` agregadas a `patients`
- ✅ Signups desactivados en Supabase Auth → Providers → Email

---

## Estado de las ramas (al 28/04/2026)
main:                ... afeb8cc ── 486ae73 (header redesign)
│
└────── ba47a1a ── 870e9b5 (security-hardening, 16 commits Fase 1)

- `main` tiene el rediseño del header (commit `486ae73`)
- `security-hardening` tiene la Fase 1 completa (16 commits)
- Las ramas divergieron — pendiente reconciliar (merge o rebase) cuando se
  retome el plan
- `feat/header-redesign` ya mergeada a main, se puede borrar

---

## Configuración de Vercel (al 28/04/2026)

- **Repo conectado**: `Hgomez123/PsicobienestarApp1.0`
- **Production branch**: `main`
- **Variables de entorno (proyecto `-ixke`)**:
  - `NEXT_PUBLIC_SUPABASE_URL` ✅
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✅
  - `SUPABASE_SERVICE_ROLE_KEY` ✅ (con marca "Needs Attention" — sin investigar)
  - `NEXT_PUBLIC_SITE_URL=https://psicobienestar-app1-0-ixke.vercel.app` ✅
- **Toggle "Mejorar modelos con datos"**: desactivado (proyecto + cuenta)
- **Proyecto duplicado `psicobienestar-app1-0`**: eliminado el 26/04/2026

---

## Próximos pasos (orden sugerido)

### Pre-trabajo + Fase 4 — cerrados (29/04/2026)

- ✅ Merge `main` → `security-hardening` (commit `d8450bc`)
- ✅ `e2e/.auth/` al `.gitignore` (commit `aa2aca3`)
- ✅ `typescript.ignoreBuildErrors` removido de `next.config.ts` (commit `dca5794`) — TS pasa limpio sin la flag
- ✅ Fase 4: eliminada `uploadFile` de `lib/supabase/db.ts` (commit `8ae05f4`). Era código muerto: única llamada en el repo era la definición misma. El flujo real ya usaba `/api/upload-resource` + `/api/resource-url` con `createSignedUrl`.

### Después

1. Investigar advertencia "Needs Attention" de `SUPABASE_SERVICE_ROLE_KEY`
2. Vercel Toolbar en producción (actualmente "Predeterminado activado")
3. Decisión final del dominio propio con la doctora (`psicobienestar.com.gt`
   y `psicobienestar.gt` están disponibles, ~Q250-600/año)

### Fase 2 (rate limiting con Upstash)

9. Crear cuenta en upstash.com
10. Crear base Redis Regional (us-east-1)
11. Copiar `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` a Vercel
    (Production, Preview, Development) y `.env.local`
12. Migrar 12 call sites a `await checkRateLimit(...)` (será async)
13. Cambiar profile de `/api/checkin` POST de `lenient` → `medium`
14. Eliminar `lib/security/rateLimit.ts` y renombrar `rateLimit.new.ts` →
    `rateLimit.ts`

#### Inventario de los 12 call sites de rate limit

| Ruta                       | Método | Profile actual           | Línea |
|----------------------------|--------|--------------------------|-------|
| `/api/upload-resource`     | POST   | strict                   | 56    |
| `/api/appointments`        | PATCH  | strict                   | 34    |
| `/api/clinical-notes`      | GET    | lenient                  | 34    |
| `/api/clinical-notes`      | POST   | strict                   | 89    |
| `/api/resource-url`        | GET    | lenient                  | 55    |
| `/api/checkin`             | POST   | lenient → cambiar medium | 31    |
| `/api/patient-task`        | GET    | lenient                  | 29    |
| `/api/checkin-options`     | PATCH  | strict                   | 30    |
| `/api/patients`            | POST   | strict                   | 74    |
| `/api/patients`            | DELETE | strict                   | 150   |
| `/api/patient-profile`     | GET    | lenient                  | 37    |
| `/api/available-slots`     | GET    | lenient                  | 30    |

#### Profiles del nuevo rateLimit

```ts
type Profile = "strict" | "medium" | "lenient";
// strict:  20 / 15 min  (login, escrituras sensibles)
// medium:  10 / 1 min   (writes del paciente — checkin)
// lenient: 120 / 1 min  (lecturas autenticadas)
```

---

## Reglas de trabajo (estrictas)

- **Verificar el repo al inicio de cada sesión**: `git remote -v` debe mostrar
  `Hgomez123/PsicobienestarApp1.0`. Si no, parar y aclarar antes de seguir.
- Un commit = una intención. No mezclar fixes de fases distintas.
- Pedir OK explícito antes de cada commit.
- Pegar diffs completos en texto plano (no outputs colapsables).
- Respetar `AGENTS.md` (Next.js 16 frágil — consultar `node_modules/next/dist/docs/`).
- Todo en español: UI, mensajes de commit, nombres de variables.
- No crear archivos `.md` salvo pedido explícito.
- Pin exacto de versiones en `package.json` (sin `^`).
- Migrations versionadas en `lib/supabase/migrations/` (`01_*.sql`, `02_*.sql`...).
- `schema.sql` = estado consolidado; `migrations/` = historial.
- Carpeta `tmp/` está en `.gitignore` para scratch local.

---

## Errores históricos a no repetir

### Sesión 28/04/2026 — Confusión de repos
Una sesión completa se perdió porque Claude Code corrió desde
`C:\Users\gomez\psicoBienestar\` (otro repo, vacío) en lugar de
`C:\Users\gomez\psicobienestar\psicobienestar-publica\` (el correcto).
**Lección**: la primera acción de cada sesión técnica es `git remote -v`.

### Sesión 28/04/2026 — Query mal formulada
Claude buscó el trigger por nombre `prevent_role_change` cuando el nombre
real es `profiles_prevent_role_change`. Resultado: 0 filas → falsa conclusión
de "Fase 1 no aplicada". **Lección**: cuando una verificación da 0, revisar
primero la query antes de cuestionar el estado.

---

## CVEs y deuda técnica

- ✅ GHSA-q4gf-8mx6-v5v3 (DoS Server Components): remediado con bump 16.2.2 → 16.2.4
- ✅ Deprecación middleware → proxy: migrado en commit `a51794b`

---

## Notas de seguridad operacional

- `.env.local` local contiene `SUPABASE_SERVICE_ROLE_KEY` real
- NUNCA pegarlo en chats, screenshots, o paste-bins
- Si se filtra → rotar inmediatamente desde Supabase + actualizar Vercel + `.env.local`
- Las URLs de deploy específicas de Vercel (con hash random) acceden a la
  misma DB de producción → riesgo conocido pendiente de mitigar
