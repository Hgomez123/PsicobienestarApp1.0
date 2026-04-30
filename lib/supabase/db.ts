/**
 * Funciones de acceso a la base de datos.
 * Toda la lógica de Supabase vive aquí para mantener los componentes limpios.
 */

import { supabase, supabaseDoctor } from "./client";
import type {
  Patient, Appointment, Goal, Task, ClinicalNote,
  Recommendation, Resource, Checkin, Notification,
  AppointmentRequest,
} from "./types";

// ── AUTH (paciente) ──────────────────────────────────────────

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getSession() {
  return supabase.auth.getSession();
}

export async function getProfile(userId: string) {
  return supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
}

// ── AUTH (doctora) ───────────────────────────────────────────

export async function doctorSignIn(email: string, password: string) {
  return supabaseDoctor.auth.signInWithPassword({ email, password });
}

export async function doctorSignOut() {
  return supabaseDoctor.auth.signOut();
}

export async function getDoctorSession() {
  return supabaseDoctor.auth.getSession();
}

export async function getDoctorProfile(userId: string) {
  return supabaseDoctor
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
}

// ── PATIENTS ─────────────────────────────────────────────────

export async function getPatients(doctorId: string) {
  return supabaseDoctor
    .from("patients")
    .select("*")
    .eq("doctor_id", doctorId)
    .order("created_at", { ascending: false });
}

export async function getPatient(patientId: string) {
  return supabaseDoctor
    .from("patients")
    .select("*")
    .eq("id", patientId)
    .single();
}

export async function getPatientByUserId(userId: string) {
  return supabase
    .from("patients")
    .select("*")
    .eq("user_id", userId)
    .single();
}

export async function createPatient(data: Omit<Patient, "id" | "created_at">) {
  return supabaseDoctor.from("patients").insert(data).select().single();
}

export async function updatePatient(id: string, data: Partial<Patient>) {
  return supabaseDoctor.from("patients").update(data).eq("id", id).select().single();
}

export async function deletePatient(id: string) {
  return supabaseDoctor.from("patients").delete().eq("id", id);
}

// ── APPOINTMENTS ─────────────────────────────────────────────

export async function getAppointments(patientId: string) {
  return supabase
    .from("appointments")
    .select("*")
    .eq("patient_id", patientId)
    .order("scheduled_at", { ascending: true });
}

export async function getAllAppointments(doctorId: string) {
  return supabaseDoctor
    .from("appointments")
    .select("*, patients(name)")
    .eq("doctor_id", doctorId)
    .order("scheduled_at", { ascending: true });
}

// Citas de un paciente leídas con el cliente de la doctora
export async function getDoctorPatientAppointments(patientId: string) {
  return supabaseDoctor
    .from("appointments")
    .select("*")
    .eq("patient_id", patientId)
    .order("scheduled_at", { ascending: true });
}

export async function createAppointment(data: Omit<Appointment, "id" | "created_at">) {
  return supabaseDoctor.from("appointments").insert(data).select().single();
}

export async function updateAppointment(id: string, data: Partial<Appointment>) {
  return supabaseDoctor.from("appointments").update(data).eq("id", id).select().single();
}

export async function deleteAppointment(id: string) {
  return supabaseDoctor.from("appointments").delete().eq("id", id);
}

/** Solicitudes de cita del paciente (lado paciente) */
export async function getPatientAppointmentRequests(patientId: string) {
  return supabase
    .from("appointment_requests")
    .select("id, preferred_date, preferred_modality, status, created_at")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });
}

/** Notas clínicas visibles por el paciente */
export async function getPatientClinicalNotes(patientId: string) {
  return supabase
    .from("clinical_notes")
    .select("content, created_at")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false })
    .limit(3);
}

// ── GOALS ────────────────────────────────────────────────────

export async function getGoals(patientId: string) {
  return supabase
    .from("goals")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: true });
}

export async function createGoal(data: Omit<Goal, "id" | "created_at" | "updated_at">) {
  return supabaseDoctor.from("goals").insert(data).select().single();
}

export async function updateGoal(id: string, data: Partial<Goal>) {
  return supabaseDoctor.from("goals").update(data).eq("id", id).select().single();
}

export async function deleteGoal(id: string) {
  return supabaseDoctor.from("goals").delete().eq("id", id);
}

// ── TASKS ────────────────────────────────────────────────────

export async function createTask(data: Omit<Task, "id" | "created_at">) {
  return supabaseDoctor.from("tasks").insert(data).select().single();
}

export async function getTaskHistory(patientId: string) {
  return supabaseDoctor
    .from("tasks")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });
}

export async function deleteTask(id: string) {
  return supabaseDoctor.from("tasks").delete().eq("id", id);
}

// ── CLINICAL NOTES ───────────────────────────────────────────

export async function getClinicalNotes(patientId: string) {
  return supabaseDoctor
    .from("clinical_notes")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });
}

export async function createClinicalNote(data: Omit<ClinicalNote, "id" | "created_at" | "updated_at">) {
  return supabaseDoctor.from("clinical_notes").insert(data).select().single();
}

export async function updateClinicalNote(id: string, content: string) {
  return supabaseDoctor
    .from("clinical_notes")
    .update({ content })
    .eq("id", id)
    .select()
    .single();
}

export async function deleteClinicalNote(id: string) {
  return supabaseDoctor.from("clinical_notes").delete().eq("id", id);
}

// ── RECOMMENDATIONS ──────────────────────────────────────────

export async function getRecommendations(patientId: string, onlyActive = false) {
  let q = supabase
    .from("recommendations")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });
  if (onlyActive) q = q.eq("active", true);
  return q;
}

export async function createRecommendation(data: Omit<Recommendation, "id" | "created_at" | "updated_at">) {
  return supabaseDoctor.from("recommendations").insert(data).select().single();
}

export async function updateRecommendation(id: string, data: Partial<Recommendation>) {
  return supabaseDoctor.from("recommendations").update(data).eq("id", id).select().single();
}

export async function deleteRecommendation(id: string) {
  return supabaseDoctor.from("recommendations").delete().eq("id", id);
}

// ── RESOURCES ────────────────────────────────────────────────

export async function getResources(patientId: string, onlyActive = false) {
  let q = supabase
    .from("resources")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });
  if (onlyActive) q = q.eq("active", true);
  return q;
}

export async function createResource(data: Omit<Resource, "id" | "created_at">) {
  return supabaseDoctor.from("resources").insert(data).select().single();
}

export async function updateResource(id: string, data: Partial<Resource>) {
  return supabaseDoctor.from("resources").update(data).eq("id", id).select().single();
}

export async function deleteResource(id: string) {
  return supabaseDoctor.from("resources").delete().eq("id", id);
}

// ── FILE UPLOAD ──────────────────────────────────────────────

export async function deleteFile(filePath: string) {
  return supabaseDoctor.storage
    .from("psicobienestar-files")
    .remove([filePath]);
}

export async function getSignedUrl(filePath: string, expiresIn = 3600) {
  return supabaseDoctor.storage
    .from("psicobienestar-files")
    .createSignedUrl(filePath, expiresIn);
}

// ── CHECKINS ─────────────────────────────────────────────────

export async function getCheckins(patientId: string) {
  return supabase
    .from("checkins")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });
}

export async function getAllCheckins(doctorId: string) {
  return supabaseDoctor
    .from("checkins")
    .select("*, patients!inner(name, doctor_id)")
    .eq("patients.doctor_id", doctorId)
    .order("created_at", { ascending: false });
}

export async function getDoctorCheckins(patientId: string) {
  return supabaseDoctor
    .from("checkins")
    .select("id, content, created_at, read_by_doctor")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false })
    .limit(90);
}

export async function createCheckin(patientId: string, content: string) {
  return supabase
    .from("checkins")
    .insert({ patient_id: patientId, content })
    .select()
    .single();
}

export async function markCheckinRead(id: string) {
  return supabaseDoctor
    .from("checkins")
    .update({ read_by_doctor: true })
    .eq("id", id);
}

// ── NOTIFICATIONS ────────────────────────────────────────────

export async function getNotifications(doctorId: string) {
  return supabaseDoctor
    .from("notifications")
    .select("*, patients(name)")
    .eq("doctor_id", doctorId)
    .order("created_at", { ascending: false })
    .limit(50);
}

export async function getUnreadCount(doctorId: string) {
  return supabaseDoctor
    .from("notifications")
    .select("id", { count: "exact" })
    .eq("doctor_id", doctorId)
    .eq("read", false);
}

export async function markNotificationRead(id: string) {
  return supabaseDoctor
    .from("notifications")
    .update({ read: true })
    .eq("id", id);
}

export async function markAllNotificationsRead(doctorId: string) {
  return supabaseDoctor
    .from("notifications")
    .update({ read: true })
    .eq("doctor_id", doctorId)
    .eq("read", false);
}

export async function createNotification(data: {
  doctor_id: string;
  patient_id: string;
  type: "checkin" | "appointment_request" | "message";
  content: string;
}) {
  return supabase.from("notifications").insert(data).select().single();
}

// ── APPOINTMENT REQUESTS ─────────────────────────────────────

export async function getAppointmentRequests(doctorId: string) {
  return supabaseDoctor
    .from("appointment_requests")
    .select("*, patients(name)")
    .eq("doctor_id", doctorId)
    .order("created_at", { ascending: false });
}

export async function createAppointmentRequest(data: Omit<AppointmentRequest, "id" | "created_at" | "status">) {
  return supabase
    .from("appointment_requests")
    .insert({ ...data, status: "Pendiente" })
    .select()
    .single();
}

export async function updateRequestStatus(id: string, status: "Aceptada" | "Rechazada") {
  return supabaseDoctor
    .from("appointment_requests")
    .update({ status })
    .eq("id", id)
    .select()
    .single();
}
