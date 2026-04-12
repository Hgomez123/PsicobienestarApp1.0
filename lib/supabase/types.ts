export type PatientStatus   = "Activa" | "Pendiente" | "Inactiva";
export type Modality        = "Virtual" | "Presencial" | "Ambas";
export type AppointmentStatus = "Confirmada" | "Pendiente" | "Cancelada" | "Completada";
export type ResourceType    = "PDF" | "Audio" | "Lectura" | "Video";
export type RecommendationType = "Mensaje" | "Ejercicio" | "Reflexión";
export type NotificationType = "checkin" | "appointment_request" | "message";
export type UserRole        = "doctor" | "patient";

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Patient {
  id: string;
  doctor_id: string;
  user_id: string | null;   // null = no tiene acceso al portal aún
  name: string;
  age: number | null;
  email: string | null;
  phone: string | null;
  modality: Modality;
  status: PatientStatus;
  process: string | null;   // enfoque terapéutico actual
  checkin_options: string[] | null;
  created_at: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  scheduled_at: string;
  modality: "Virtual" | "Presencial";
  status: AppointmentStatus;
  duration_minutes: number;
  notes: string | null;
  created_at: string;
}

export interface Goal {
  id: string;
  patient_id: string;
  doctor_id: string;
  text: string;
  done: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClinicalNote {
  id: string;
  patient_id: string;
  doctor_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Recommendation {
  id: string;
  patient_id: string;
  doctor_id: string;
  type: RecommendationType;
  title: string;
  content: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Resource {
  id: string;
  patient_id: string;
  doctor_id: string;
  type: ResourceType;
  title: string;
  description: string | null;
  file_url: string | null;
  file_path: string | null;
  active: boolean;
  created_at: string;
}

export interface Checkin {
  id: string;
  patient_id: string;
  content: string;
  read_by_doctor: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  doctor_id: string;
  patient_id: string | null;
  type: NotificationType;
  content: string;
  read: boolean;
  created_at: string;
  patient?: Patient;
}

export interface AppointmentRequest {
  id: string;
  patient_id: string;
  doctor_id: string;
  preferred_date: string | null;
  preferred_modality: string | null;
  message: string | null;
  status: "Pendiente" | "Aceptada" | "Rechazada";
  created_at: string;
}

// Tipo genérico para la base de datos (simplificado)
export type Database = {
  public: {
    Tables: {
      profiles:             { Row: Profile };
      patients:             { Row: Patient };
      appointments:         { Row: Appointment };
      goals:                { Row: Goal };
      clinical_notes:       { Row: ClinicalNote };
      recommendations:      { Row: Recommendation };
      resources:            { Row: Resource };
      checkins:             { Row: Checkin };
      notifications:        { Row: Notification };
      appointment_requests: { Row: AppointmentRequest };
    };
  };
};
