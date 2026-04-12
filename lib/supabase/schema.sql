-- ============================================================
--  PSICOBIENESTAR · Esquema de base de datos
--  Ejecutar en: Supabase → SQL Editor → New Query
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
  id         uuid        default uuid_generate_v4() primary key,
  doctor_id  uuid        not null references public.profiles(id) on delete cascade,
  user_id    uuid        references public.profiles(id) on delete set null,
  name       text        not null,
  age        integer,
  email      text,
  phone      text,
  modality   text        not null default 'Virtual'  check (modality  in ('Virtual','Presencial','Ambas')),
  status     text        not null default 'Activa'   check (status    in ('Activa','Pendiente','Inactiva')),
  process    text,
  created_at timestamptz not null default now()
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

-- ── TRIGGER: crear perfil automáticamente al registrar usuario ──

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'patient')
  );
  return new;
end;
$$ language plpgsql security definer;

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

create trigger goals_updated_at         before update on public.goals            for each row execute procedure public.set_updated_at();
create trigger clinical_notes_updated_at before update on public.clinical_notes  for each row execute procedure public.set_updated_at();
create trigger recommendations_updated_at before update on public.recommendations for each row execute procedure public.set_updated_at();

-- ── ROW LEVEL SECURITY ───────────────────────────────────────

alter table public.profiles             enable row level security;
alter table public.patients             enable row level security;
alter table public.appointments         enable row level security;
alter table public.goals                enable row level security;
alter table public.clinical_notes       enable row level security;
alter table public.recommendations      enable row level security;
alter table public.resources            enable row level security;
alter table public.checkins             enable row level security;
alter table public.notifications        enable row level security;
alter table public.appointment_requests enable row level security;

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
create policy "Ver propio perfil"           on public.profiles for select using (auth.uid() = id);
create policy "Doctora ve todos los perfiles" on public.profiles for select using (public.is_doctor());
create policy "Actualizar propio perfil"    on public.profiles for update using (auth.uid() = id);

-- ── POLÍTICAS: patients ──
create policy "Doctora gestiona pacientes"  on public.patients for all    using (public.is_doctor());
create policy "Paciente ve su registro"     on public.patients for select using (user_id = auth.uid());

-- ── POLÍTICAS: appointments ──
create policy "Doctora gestiona citas"      on public.appointments for all    using (public.is_doctor());
create policy "Paciente ve sus citas"       on public.appointments for select using (public.is_own_patient(patient_id));

-- ── POLÍTICAS: goals ──
create policy "Doctora gestiona objetivos"  on public.goals for all    using (public.is_doctor());
create policy "Paciente ve sus objetivos"   on public.goals for select using (public.is_own_patient(patient_id));

-- ── POLÍTICAS: clinical_notes (solo doctora) ──
create policy "Doctora gestiona notas"      on public.clinical_notes for all using (public.is_doctor());

-- ── POLÍTICAS: recommendations ──
create policy "Doctora gestiona recomendaciones" on public.recommendations for all    using (public.is_doctor());
create policy "Paciente ve sus recomendaciones"  on public.recommendations for select using (public.is_own_patient(patient_id) and active = true);

-- ── POLÍTICAS: resources ──
create policy "Doctora gestiona recursos"   on public.resources for all    using (public.is_doctor());
create policy "Paciente ve sus recursos"    on public.resources for select using (public.is_own_patient(patient_id) and active = true);

-- ── POLÍTICAS: checkins ──
create policy "Paciente crea check-in"      on public.checkins for insert with check (public.is_own_patient(patient_id));
create policy "Paciente ve sus checkins"    on public.checkins for select using (public.is_own_patient(patient_id));
create policy "Doctora lee checkins"        on public.checkins for select using (public.is_doctor());
create policy "Doctora marca leído"         on public.checkins for update using (public.is_doctor());

-- ── POLÍTICAS: notifications ──
create policy "Doctora gestiona notificaciones" on public.notifications for all using (doctor_id = auth.uid());

-- ── POLÍTICAS: appointment_requests ──
create policy "Paciente crea solicitud"     on public.appointment_requests for insert with check (public.is_own_patient(patient_id));
create policy "Paciente ve sus solicitudes" on public.appointment_requests for select using (public.is_own_patient(patient_id));
create policy "Doctora gestiona solicitudes" on public.appointment_requests for all   using (public.is_doctor());

-- ── STORAGE: bucket para archivos ───────────────────────────
-- Ejecutar también en el SQL Editor:
insert into storage.buckets (id, name, public)
values ('psicobienestar-files', 'psicobienestar-files', false)
on conflict do nothing;

create policy "Doctora sube archivos" on storage.objects
  for insert with check (bucket_id = 'psicobienestar-files' and public.is_doctor());

create policy "Doctora elimina archivos" on storage.objects
  for delete using (bucket_id = 'psicobienestar-files' and public.is_doctor());

create policy "Doctora lee archivos" on storage.objects
  for select using (bucket_id = 'psicobienestar-files' and public.is_doctor());

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
--  FIN DEL SCHEMA
--  Siguiente paso: ir a Supabase → Authentication → Settings
--  y agregar tu dominio en "Site URL" y "Redirect URLs"
-- ============================================================
