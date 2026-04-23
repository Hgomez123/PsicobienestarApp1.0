-- ============================================================
--  PSICOBIENESTAR — FIX: trigger anti-escalación de rol
--                       + índices de performance
--  Ejecutar en: Supabase → SQL Editor → New Query
--  Aplicar DESPUÉS de 01_rls_fixes.sql.
--  Idempotente: puede re-ejecutarse sin error.
-- ============================================================

-- ── TRIGGER: anti-escalación de rol en profiles ──

/*
 * Trigger anti-escalación de rol.
 *
 * Bloquea ataques del tipo `update profiles set role='doctor'`
 * desde sesiones autenticadas de cliente. El filtro
 * `auth.uid() is not null` permite el UPDATE manual desde
 * Supabase SQL Editor (corre como postgres sin JWT, auth.uid()
 * null). Si esa convención cambiara, ajustar el filtro o
 * hacer disable/enable manual del trigger para cambios
 * legítimos de rol.
 */

create or replace function public.prevent_role_change()
returns trigger as $$
begin
  if auth.uid() is not null and new.role is distinct from old.role then
    raise exception 'No se permite cambiar el rol desde el cliente';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_prevent_role_change on public.profiles;
create trigger profiles_prevent_role_change
  before update on public.profiles
  for each row execute procedure public.prevent_role_change();

-- ── Simplificar policy "Actualizar propio perfil" ──
-- La versión con subquery en WITH CHECK podía leer el valor
-- post-update en algunas versiones de Postgres, volviendo la
-- defensa inútil. Ahora la defensa real la hace el trigger
-- prevent_role_change; la policy solo verifica identidad.

drop policy if exists "Actualizar propio perfil" on public.profiles;
create policy "Actualizar propio perfil" on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ── ÍNDICES DE PERFORMANCE ──────────────────────────────────
-- Cubren los patrones de acceso de las policies RLS y las
-- queries más frecuentes. Evitan timeouts cuando las policies
-- con subconsultas se evalúan sobre muchas filas.

create index if not exists patients_user_id_idx             on public.patients(user_id);
create index if not exists patients_doctor_id_idx           on public.patients(doctor_id);
create index if not exists appointments_patient_idx         on public.appointments(patient_id, scheduled_at);
create index if not exists appointments_doctor_idx          on public.appointments(doctor_id, scheduled_at);
create index if not exists goals_patient_idx                on public.goals(patient_id);
create index if not exists tasks_patient_idx                on public.tasks(patient_id);
create index if not exists clinical_notes_patient_idx       on public.clinical_notes(patient_id, created_at desc);
create index if not exists recommendations_patient_idx      on public.recommendations(patient_id);
create index if not exists resources_patient_idx            on public.resources(patient_id);
create index if not exists checkins_patient_idx             on public.checkins(patient_id, created_at desc);
create index if not exists notifications_doctor_idx         on public.notifications(doctor_id, created_at desc);
create index if not exists appointment_requests_doctor_idx  on public.appointment_requests(doctor_id);
