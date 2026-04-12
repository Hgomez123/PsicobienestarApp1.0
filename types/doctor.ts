export type DoctorPatient = {
  id: number;
  name: string;
  age: number;
  modality: string;
  status: string;
  nextSession: string;
  process: string;
  lastCheckin: string;
};

export type Goal = {
  id: number;
  text: string;
  done: boolean;
};

export type RecommendationItem = {
  id: number;
  type: string;
  title: string;
  content: string;
  active: boolean;
};

export type ResourceItem = {
  id: number;
  type: string;
  title: string;
  desc: string;
  active: boolean;
};