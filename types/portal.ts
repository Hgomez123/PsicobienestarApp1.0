export type UserData = {
  name: string;
  email: string;
};

export type NavItem =
  | "Inicio"
  | "Mis recomendaciones"
  | "Mis recursos"
  | "Mi proceso"
  | "Mis citas"
  | "Configuración";

export type SupportCard = "mensaje" | "ejercicio" | "reflexion";