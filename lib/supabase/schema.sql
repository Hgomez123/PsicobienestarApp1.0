-- ============================================================
--  PSICOBIENESTAR · Esquema de base de datos (consolidado)
--  Ejecutar en: Supabase → SQL Editor → New Query
--
--  Este archivo refleja el ESTADO FINAL del schema, incluyendo
--  los fixes de seguridad aplicados en lib/supabase/migrations/.
--  Ver nota al final sobre versionado de migraciones.
-- ============================================================

-- Extensiones
create extension if not exists "uuid-ossp";

-- ── TABLAS ──────────────────────────────────────────────────

-- Perfiles (extiende auth.users)
create table if not exists public.profiles (
  id         uuid references auth.users(id) on delete cascade primary key,
  name       text        not null,
  email      text        not null,
  role       text        not null default 'patient' check (role in ('doctor', 'patient')),
  created_at timestamptz not null default now()
);

-- Pacientes (administrados por la doctora)
create table if not exists public.patients (
  id               uuid        default uuid_generate_v4() primary key,
  doctor_id        uuid        not null references public.profiles(id) on delete cascade,
  user_id          uuid        references public.profiles(id) on delete set null,
  name             text        not null,
  age              integer,
  email            text,
  phone            text,
  modality         text        not null default 'Virtual'  check (modality  in ('Virtual','Presencial','Ambas')),
  status           text        not null default 'Activa'   check (status    in ('Activa','Pendiente','Inactiva')),
  process          text,
  checkin_options  text[]      not null default '{}'::text[],
  drive_link       text,
  created_at       timestamptz not null default now()
);

-- Citas
create table if not exists public.appointments (
  id               uuid        default uuid_generate_v4() primary key,
  patient_id       uuid        not null references public.patients(id) on delete cascade,
  doctor_id        uuid        not null references public.profiles(id),
  scheduled_at     timestamptz not null,
  modality         text        not null default 'Virtual' check (modality in ('Virtual','Presencial')),
  status           text        not null default 'Pendiente' check (status in ('Confirmada','Pendiente','Cancelada','Completada')),
  duration_minutes integer     not null default 50,
  notes            text,
  created_at       timestamptz not null default now()
);

-- Objetivos terapéuticos
create table if not exists public.goals (
  id         uuid        default uuid_generate_v4() primary key,
  patient_id uuid        not null references public.patients(id) on delete cascade,
  doctor_id  uuid        not null references public.profiles(id),
  text       text        not null,
  done       boolean     not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tareas (asignadas por la doctora al paciente)
create table if not exists public.tasks (
  id         uuid        default uuid_generate_v4() primary key,
  patient_id uuid        not null references public.patients(id) on delete cascade,
  doctor_id  uuid        not null references public.profiles(id),
  text       text        not null,
  done       boolean     not null default false,
  created_at timestamptz not null default now()
);

-- Notas clínicas (privadas, solo la doctora)
create table if not exists public.clinical_notes (
  id         uuid        default uuid_generate_v4() primary key,
  patient_id uuid        not null references public.patients(id) on delete cascade,
  doctor_id  uuid        not null references public.profiles(id),
  content    text        not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Recomendaciones (visibles al paciente)
create table if not exists public.recommendations (
  id         uuid        default uuid_generate_v4() primary key,
  patient_id uuid        not null references public.patients(id) on delete cascade,
  doctor_id  uuid        not null references public.profiles(id),
  type       text        not null check (type in ('Mensaje','Ejercicio','Reflexión')),
  title      text        not null,
  content    text        not null,
  active     boolean     not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Recursos (archivos/materiales visibles al paciente)
create table if not exists public.resources (
  id          uuid        default uuid_generate_v4() primary key,
  patient_id  uuid        not null references public.patients(id) on delete cascade,
  doctor_id   uuid        not null references public.profiles(id),
  type        text        not null check (type in ('PDF','Audio','Lectura','Video')),
  title       text        not null,
  description text,
  file_url    text,
  file_path   text,
  active      boolean     not null default true,
  created_at  timestamptz not null default now()
);

-- Check-ins (paciente → doctora)
create table if not exists public.checkins (
  id              uuid        default uuid_generate_v4() primary key,
  patient_id      uuid        not null references public.patients(id) on delete cascade,
  content         text        not null,
  read_by_doctor  boolean     not null default false,
  created_at      timestamptz not null default now()
);

-- Notificaciones (para la doctora)
create table if not exists public.notifications (
  id         uuid        default uuid_generate_v4() primary key,
  doctor_id  uuid        not null references public.profiles(id),
  patient_id uuid        references public.patients(id) on delete cascade,
  type       text        not null check (type in ('checkin','appointment_request','message')),
  content    text        not null,
  read       boolean     not null default false,
  created_at timestamptz not null default now()
);

-- Solicitudes de cita (paciente → doctora)
create table if not exists public.appointment_requests (
  id                  uuid        default uuid_generate_v4() primary key,
  patient_id          uuid        not null references public.patients(id) on delete cascade,
  doctor_id           uuid        not null references public.profiles(id),
  preferred_date      text,
  preferred_modality  text,
  message             text,
  status              text        not null default 'Pendiente' check (status in ('Pendiente','Aceptada','Rechazada')),
  created_at          timestamptz not null default now()
);

-- Audit log clínico: registra accesos a datos sensibles
-- (notas clínicas, check-ins, perfiles de paciente). Lo escribe
-- el servidor con service_role. La doctora puede leer sus propios
-- accesos. Sirve para auditoría legal/ética y detección de abuso.
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

-- ── TRIGGER: crear perfil automáticamente al registrar usuario ──
-- El rol se asigna SIEMPRE como 'patient'. La doctora se marca
-- manualmente (ver nota al final). Esto evita escalación de
-- privilegios vía metadata del signup.

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
    new.email,
    'patient'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── TRIGGER: actualizar updated_at automáticamente ──

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists goals_updated_at on public.goals;
create trigger goals_updated_at             before update on public.goals            for each row execute procedure public.set_updated_at();

drop trigger if exists clinical_notes_updated_at on public.clinical_notes;
create trigger clinical_notes_updated_at    before update on public.clinical_notes   for each row execute procedure public.set_updated_at();

drop trigger if exists recommendations_updated_at on public.recommendations;
create trigger recommendations_updated_at   before update on public.recommendations  for each row execute procedure public.set_updated_at();

-- ── ROW LEVEL SECURITY ───────────────────────────────────────

alter table public.profiles             enable row level security;
alter table public.patients             enable row level security;
alter table public.appointments         enable row level security;
alter table public.goals                enable row level security;
alter table public.tasks                enable row level security;
alter table public.clinical_notes       enable row level security;
alter table public.recommendations      enable row level security;
alter table public.resources            enable row level security;
alter table public.checkins             enable row level security;
alter table public.notifications        enable row level security;
alter table public.appointment_requests enable row level security;
alter table public.audit_log            enable row level security;

-- Helper: es doctora?
create or replace function public.is_doctor()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'doctor'
  );
$$ language sql security definer stable;

-- Helper: es paciente dueño del registro?
create or replace function public.is_own_patient(pid uuid)
returns boolean as $$
  select exists (
    select 1 from public.patients
    where id = pid and user_id = auth.uid()
  );
$$ language sql security definer stable;

-- ── POLÍTICAS: profiles ──
-- SELECT propio + SELECT para la doctora. UPDATE del propio perfil
-- pero WITH CHECK impide cambiar el rol (escalación). INSERT y
-- DELETE bloqueados: solo el trigger on_auth_user_created crea
-- profiles; el DELETE cae por CASCADE desde auth.users.

drop policy if exists "Ver propio perfil" on public.profiles;
create policy "Ver propio perfil" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Doctora ve todos los perfiles" on public.profiles;
create policy "Doctora ve todos los perfiles" on public.profiles
  for select using (public.is_doctor());

drop policy if exists "Actualizar propio perfil" on public.profiles;
create policy "Actualizar propio perfil" on public.profiles
  for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select role from public.profiles where id = auth.uid())
  );

drop policy if exists "Bloquear insert directo a profiles" on public.profiles;
create policy "Bloquear insert directo a profiles" on public.profiles
  for insert
  with check (false);

drop policy if exists "Bloquear delete directo a profiles" on public.profiles;
create policy "Bloquear delete directo a profiles" on public.profiles
  for delete
  using (false);

-- ── POLÍTICAS: patients ──
-- Doctora: 4 policies granulares (SELECT/INSERT/UPDATE/DELETE)
-- con WITH CHECK y filtro doctor_id = auth.uid() para impedir
-- escritura cross-tenant si en el futuro hay más de una doctora.
-- Paciente: ve solo su propio registro.

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

drop policy if exists "Paciente ve su registro" on public.patients;
create policy "Paciente ve su registro" on public.patients
  for select using (user_id = auth.uid());

-- ── POLÍTICAS: appointments ──

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

drop policy if exists "Paciente ve sus citas" on public.appointments;
create policy "Paciente ve sus citas" on public.appointments
  for select using (public.is_own_patient(patient_id));

-- ── POLÍTICAS: goals ──

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

drop policy if exists "Paciente ve sus objetivos" on public.goals;
create policy "Paciente ve sus objetivos" on public.goals
  for select using (public.is_own_patient(patient_id));

-- ── POLÍTICAS: tasks ──

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

-- ── POLÍTICAS: clinical_notes (solo doctora) ──

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

-- ── POLÍTICAS: recommendations ──

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

drop policy if exists "Paciente ve sus recomendaciones" on public.recommendations;
create policy "Paciente ve sus recomendaciones" on public.recommendations
  for select using (public.is_own_patient(patient_id) and active = true);

-- ── POLÍTICAS: resources ──

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

drop policy if exists "Paciente ve sus recursos" on public.resources;
create policy "Paciente ve sus recursos" on public.resources
  for select using (public.is_own_patient(patient_id) and active = true);

-- ── POLÍTICAS: checkins ──

drop policy if exists "Paciente crea check-in" on public.checkins;
create policy "Paciente crea check-in" on public.checkins
  for insert with check (public.is_own_patient(patient_id));

drop policy if exists "Paciente ve sus checkins" on public.checkins;
create policy "Paciente ve sus checkins" on public.checkins
  for select using (public.is_own_patient(patient_id));

drop policy if exists "Doctora lee checkins" on public.checkins;
create policy "Doctora lee checkins" on public.checkins
  for select using (public.is_doctor());

drop policy if exists "Doctora marca leído" on public.checkins;
create policy "Doctora marca leído" on public.checkins
  for update
  using (public.is_doctor())
  with check (public.is_doctor());

-- ── POLÍTICAS: notifications ──
-- INSERT lo hace el servidor con service_role (bypasea RLS),
-- no hay policy pública de escritura.

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

-- ── POLÍTICAS: appointment_requests ──

drop policy if exists "Paciente crea solicitud" on public.appointment_requests;
create policy "Paciente crea solicitud" on public.appointment_requests
  for insert with check (public.is_own_patient(patient_id));

drop policy if exists "Paciente ve sus solicitudes" on public.appointment_requests;
create policy "Paciente ve sus solicitudes" on public.appointment_requests
  for select using (public.is_own_patient(patient_id));

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

-- ── POLÍTICAS: audit_log ──
-- Solo service_role escribe. La doctora puede leer sus propios
-- accesos registrados.

drop policy if exists "Doctora lee sus logs" on public.audit_log;
create policy "Doctora lee sus logs" on public.audit_log
  for select using (public.is_doctor() and actor_id = auth.uid());

-- ── STORAGE: bucket para archivos ───────────────────────────
insert into storage.buckets (id, name, public)
values ('psicobienestar-files', 'psicobienestar-files', false)
on conflict do nothing;

drop policy if exists "Doctora sube archivos" on storage.objects;
create policy "Doctora sube archivos" on storage.objects
  for insert with check (bucket_id = 'psicobienestar-files' and public.is_doctor());

drop policy if exists "Doctora elimina archivos" on storage.objects;
create policy "Doctora elimina archivos" on storage.objects
  for delete using (bucket_id = 'psicobienestar-files' and public.is_doctor());

drop policy if exists "Doctora lee archivos" on storage.objects;
create policy "Doctora lee archivos" on storage.objects
  for select using (bucket_id = 'psicobienestar-files' and public.is_doctor());

drop policy if exists "Paciente accede a sus archivos" on storage.objects;
create policy "Paciente accede a sus archivos" on storage.objects
  for select using (
    bucket_id = 'psicobienestar-files'
    and exists (
      select 1 from public.resources r
      join public.patients p on p.id = r.patient_id
      where r.file_path = name and p.user_id = auth.uid()
    )
  );

-- ============================================================
--  PASO MANUAL UNA SOLA VEZ
--  1) En Supabase → Authentication → Providers → Email:
--     desactivar "Enable sign ups".
--  2) Marcar manualmente a la doctora:
--     update public.profiles set role = 'doctor'
--      where email = 'TU-CORREO@...';
-- ============================================================

-- ============================================================
--  VERSIONADO DE MIGRACIONES
--
--  Este archivo (schema.sql) es el ESTADO CONSOLIDADO de la
--  base de datos. Para fixes incrementales que apliques a una
--  BD en producción, NO edites este archivo directamente en
--  primera instancia: creá una migración versionada en
--  lib/supabase/migrations/ (p. ej. 02_xxx.sql, 03_xxx.sql...),
--  aplicala en Supabase, y después reflejá el cambio acá para
--  que este archivo siga siendo reproducible desde cero.
--
--  Fuente de verdad para el historial:  lib/supabase/migrations/
--  Estado consolidado (recreación):     lib/supabase/schema.sql
-- ============================================================
