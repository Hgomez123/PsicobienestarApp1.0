-- ============================================================
--  PSICOBIENESTAR — FIXES DE SEGURIDAD CRÍTICOS (RLS)
--  Ejecutar en: Supabase → SQL Editor → New Query
--  Revertible: todos los DROP POLICY dejan la versión anterior.
--  Idempotente: puede re-ejecutarse sin error (cada create tiene su drop).
-- ============================================================

-- ── ANTES DE EJECUTAR — verificación obligatoria ──
-- 1) Ejecutar: select distinct doctor_id from public.patients;
-- 2) Ejecutar: select id, email from public.profiles where role = 'doctor';
-- 3) Confirmar que TODOS los doctor_id del paso 1 aparecen en el paso 2.
--    Si no coinciden, NO aplicar este fix sin antes regularizar la data.
-- ─────────────────────────────────────────────────

-- ── FIX C3: trigger no permite auto-asignar rol 'doctor' ──────
-- Antes: tomaba role del metadata del signup.
-- Ahora: siempre 'patient'. La doctora se marca manualmente (ver al final).

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
    new.email,
    'patient'   -- siempre, sin importar lo que mande el cliente
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- ── FIX C2: profiles — WITH CHECK en UPDATE (bloquea escalación) ─

drop policy if exists "Actualizar propio perfil" on public.profiles;
create policy "Actualizar propio perfil" on public.profiles
  for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select role from public.profiles where id = auth.uid())
  );

-- Bloquea INSERT directo a profiles desde el cliente (solo vía trigger)
drop policy if exists "Bloquear insert directo a profiles" on public.profiles;
create policy "Bloquear insert directo a profiles" on public.profiles
  for insert
  with check (false);

-- Bloquea DELETE directo (se borra via CASCADE desde auth.users)
drop policy if exists "Bloquear delete directo a profiles" on public.profiles;
create policy "Bloquear delete directo a profiles" on public.profiles
  for delete
  using (false);

-- ── FIX C2: patients — separar SELECT/INSERT/UPDATE/DELETE con CHECK ─

drop policy if exists "Doctora gestiona pacientes" on public.patients;

drop policy if exists "Doctora lee pacientes" on public.patients;
create policy "Doctora lee pacientes" on public.patients
  for select using (public.is_doctor() and doctor_id = auth.uid());

drop policy if exists "Doctora inserta pacientes" on public.patients;
create policy "Doctora inserta pacientes" on public.patients
  for insert with check (public.is_doctor() and doctor_id = auth.uid());

drop policy if exists "Doctora actualiza pacientes" on public.patients;
create policy "Doctora actualiza pacientes" on public.patients
  for update
  using (public.is_doctor() and doctor_id = auth.uid())
  with check (public.is_doctor() and doctor_id = auth.uid());

drop policy if exists "Doctora elimina pacientes" on public.patients;
create policy "Doctora elimina pacientes" on public.patients
  for delete using (public.is_doctor() and doctor_id = auth.uid());

-- Paciente solo ve su propio registro (ya estaba, la dejamos explícita)
drop policy if exists "Paciente ve su registro" on public.patients;
create policy "Paciente ve su registro" on public.patients
  for select using (user_id = auth.uid());

-- ── FIX C2: appointments — WITH CHECK en UPDATE/INSERT ───────

drop policy if exists "Doctora gestiona citas" on public.appointments;

drop policy if exists "Doctora lee citas" on public.appointments;
create policy "Doctora lee citas" on public.appointments
  for select using (public.is_doctor() and doctor_id = auth.uid());

drop policy if exists "Doctora inserta citas" on public.appointments;
create policy "Doctora inserta citas" on public.appointments
  for insert with check (public.is_doctor() and doctor_id = auth.uid());

drop policy if exists "Doctora actualiza citas" on public.appointments;
create policy "Doctora actualiza citas" on public.appointments
  for update
  using (public.is_doctor() and doctor_id = auth.uid())
  with check (public.is_doctor() and doctor_id = auth.uid());

drop policy if exists "Doctora elimina citas" on public.appointments;
create policy "Doctora elimina citas" on public.appointments
  for delete using (public.is_doctor() and doctor_id = auth.uid());

-- ── FIX C2: goals ────────────────────────────────────────────

drop policy if exists "Doctora gestiona objetivos" on public.goals;

drop policy if exists "Doctora lee objetivos" on public.goals;
create policy "Doctora lee objetivos" on public.goals
  for select using (public.is_doctor() and doctor_id = auth.uid());

drop policy if exists "Doctora inserta objetivos" on public.goals;
create policy "Doctora inserta objetivos" on public.goals
  for insert with check (public.is_doctor() and doctor_id = auth.uid());

drop policy if exists "Doctora actualiza objetivos" on public.goals;
create policy "Doctora actualiza objetivos" on public.goals
  for update
  using (public.is_doctor() and doctor_id = auth.uid())
  with check (public.is_doctor() and doctor_id = auth.uid());

drop policy if exists "Doctora elimina objetivos" on public.goals;
create policy "Doctora elimina objetivos" on public.goals
  for delete using (public.is_doctor() and doctor_id = auth.uid());

-- ── FIX C2: clinical_notes ───────────────────────────────────

drop policy if exists "Doctora gestiona notas" on public.clinical_notes;

drop policy if exists "Doctora lee notas" on public.clinical_notes;
create policy "Doctora lee notas" on public.clinical_notes
  for select using (public.is_doctor() and doctor_id = auth.uid());

drop policy if exists "Doctora inserta notas" on public.clinical_notes;
create policy "Doctora inserta notas" on public.clinical_notes
  for insert with check (public.is_doctor() and doctor_id = auth.uid());

drop policy if exists "Doctora actualiza notas" on public.clinical_notes;
create policy "Doctora actualiza notas" on public.clinical_notes
  for update
  using (public.is_doctor() and doctor_id = auth.uid())
  with check (public.is_doctor() and doctor_id = auth.uid());

drop policy if exists "Doctora elimina notas" on public.clinical_notes;
create policy "Doctora elimina notas" on public.clinical_notes
  for delete using (public.is_doctor() and doctor_id = auth.uid());

-- ── FIX C2: recommendations ──────────────────────────────────

drop policy if exists "Doctora gestiona recomendaciones" on public.recommendations;

drop policy if exists "Doctora lee recomendaciones" on public.recommendations;
create policy "Doctora lee recomendaciones" on public.recommendations
  for select using (public.is_doctor() and doctor_id = auth.uid());

drop policy if exists "Doctora inserta recomendaciones" on public.recommendations;
create policy "Doctora inserta recomendaciones" on public.recommendations
  for insert with check (public.is_doctor() and doctor_id = auth.uid());

drop policy if exists "Doctora actualiza recomendaciones" on public.recommendations;
create policy "Doctora actualiza recomendaciones" on public.recommendations
  for update
  using (public.is_doctor() and doctor_id = auth.uid())
  with check (public.is_doctor() and doctor_id = auth.uid());

drop policy if exists "Doctora elimina recomendaciones" on public.recommendations;
create policy "Doctora elimina recomendaciones" on public.recommendations
  for delete using (public.is_doctor() and doctor_id = auth.uid());

-- ── FIX C2: resources ────────────────────────────────────────

drop policy if exists "Doctora gestiona recursos" on public.resources;

drop policy if exists "Doctora lee recursos" on public.resources;
create policy "Doctora lee recursos" on public.resources
  for select using (public.is_doctor() and doctor_id = auth.uid());

drop policy if exists "Doctora inserta recursos" on public.resources;
create policy "Doctora inserta recursos" on public.resources
  for insert with check (public.is_doctor() and doctor_id = auth.uid());

drop policy if exists "Doctora actualiza recursos" on public.resources;
create policy "Doctora actualiza recursos" on public.resources
  for update
  using (public.is_doctor() and doctor_id = auth.uid())
  with check (public.is_doctor() and doctor_id = auth.uid());

drop policy if exists "Doctora elimina recursos" on public.resources;
create policy "Doctora elimina recursos" on public.resources
  for delete using (public.is_doctor() and doctor_id = auth.uid());

-- ── FIX C2: checkins — ya estaba bien pero añadimos WITH CHECK ─

drop policy if exists "Doctora marca leído" on public.checkins;
create policy "Doctora marca leído" on public.checkins
  for update
  using (public.is_doctor())
  with check (public.is_doctor());

-- ── FIX C2: notifications ────────────────────────────────────

drop policy if exists "Doctora gestiona notificaciones" on public.notifications;

drop policy if exists "Doctora lee notificaciones" on public.notifications;
create policy "Doctora lee notificaciones" on public.notifications
  for select using (doctor_id = auth.uid());

drop policy if exists "Doctora actualiza notificaciones" on public.notifications;
create policy "Doctora actualiza notificaciones" on public.notifications
  for update
  using (doctor_id = auth.uid())
  with check (doctor_id = auth.uid());

drop policy if exists "Doctora elimina notificaciones" on public.notifications;
create policy "Doctora elimina notificaciones" on public.notifications
  for delete using (doctor_id = auth.uid());
-- INSERT lo hace el servidor con service_role (no hace falta policy)

-- ── FIX C2: appointment_requests ─────────────────────────────

drop policy if exists "Doctora gestiona solicitudes" on public.appointment_requests;

drop policy if exists "Doctora lee solicitudes" on public.appointment_requests;
create policy "Doctora lee solicitudes" on public.appointment_requests
  for select using (public.is_doctor() and doctor_id = auth.uid());

drop policy if exists "Doctora actualiza solicitudes" on public.appointment_requests;
create policy "Doctora actualiza solicitudes" on public.appointment_requests
  for update
  using (public.is_doctor() and doctor_id = auth.uid())
  with check (public.is_doctor() and doctor_id = auth.uid());

drop policy if exists "Doctora elimina solicitudes" on public.appointment_requests;
create policy "Doctora elimina solicitudes" on public.appointment_requests
  for delete using (public.is_doctor() and doctor_id = auth.uid());

-- ── FIX NUEVO: tabla `tasks` (faltaba en schema.sql) ─────────

create table if not exists public.tasks (
  id          uuid        default uuid_generate_v4() primary key,
  patient_id  uuid        not null references public.patients(id) on delete cascade,
  doctor_id   uuid        not null references public.profiles(id),
  text        text        not null,
  done        boolean     not null default false,
  created_at  timestamptz not null default now()
);

alter table public.tasks enable row level security;

drop policy if exists "Doctora lee tareas" on public.tasks;
create policy "Doctora lee tareas" on public.tasks
  for select using (public.is_doctor() and doctor_id = auth.uid());

drop policy if exists "Doctora inserta tareas" on public.tasks;
create policy "Doctora inserta tareas" on public.tasks
  for insert with check (public.is_doctor() and doctor_id = auth.uid());

drop policy if exists "Doctora actualiza tareas" on public.tasks;
create policy "Doctora actualiza tareas" on public.tasks
  for update
  using (public.is_doctor() and doctor_id = auth.uid())
  with check (public.is_doctor() and doctor_id = auth.uid());

drop policy if exists "Doctora elimina tareas" on public.tasks;
create policy "Doctora elimina tareas" on public.tasks
  for delete using (public.is_doctor() and doctor_id = auth.uid());

drop policy if exists "Paciente ve sus tareas" on public.tasks;
create policy "Paciente ve sus tareas" on public.tasks
  for select using (public.is_own_patient(patient_id));

-- ── FIX NUEVO: checkin_options como columna real en patients ─

alter table public.patients
  add column if not exists checkin_options text[] default '{}'::text[];

alter table public.patients
  add column if not exists drive_link text;

-- ── FIX NUEVO: audit log clínico ─────────────────────────────
-- Registra quién accede a notas/check-ins de qué paciente y cuándo.
-- Útil legal/éticamente y para detectar accesos anómalos.

create table if not exists public.audit_log (
  id          uuid        default uuid_generate_v4() primary key,
  actor_id    uuid        references public.profiles(id),
  actor_role  text,
  action      text        not null,       -- 'read_clinical_notes', 'read_checkin', ...
  resource    text        not null,       -- 'clinical_notes', 'checkins', 'patients', ...
  patient_id  uuid        references public.patients(id) on delete set null,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists audit_log_patient_idx on public.audit_log(patient_id, created_at desc);
create index if not exists audit_log_actor_idx   on public.audit_log(actor_id, created_at desc);

alter table public.audit_log enable row level security;
-- Solo service_role escribe. La doctora puede leer sus propios accesos.
drop policy if exists "Doctora lee sus logs" on public.audit_log;
create policy "Doctora lee sus logs" on public.audit_log
  for select using (public.is_doctor() and actor_id = auth.uid());

-- ============================================================
--  VERIFICACIÓN — correr después de aplicar
-- ============================================================
-- Listar todas las políticas: deben tener WITH CHECK en UPDATE/INSERT.
-- select schemaname, tablename, policyname, cmd, qual, with_check
-- from pg_policies where schemaname = 'public' order by tablename;

-- ============================================================
--  PASO MANUAL UNA SOLA VEZ
--  En Supabase → Authentication → Providers → Email:
--    - Desactivar "Enable sign ups"
--  Luego, marcar manualmente a la doctora:
--    update public.profiles set role = 'doctor' where email = 'TU-CORREO@...';
-- ============================================================
