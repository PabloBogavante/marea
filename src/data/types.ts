// Model de dades de Marea. Cada registre pertany a un usuari (owner).
// La mateixa estructura es migrarà a Supabase (Postgres + Row Level Security).

export type UserId = 'josep' | 'papa';

export type Visibility = 'privat' | 'ocupat' | 'compartit'; // 🔴 🟡 🟢

export type EventKind = 'feina' | 'esport' | 'oci' | 'cita' | 'recordatori' | 'altre';

export interface Recurrence {
  weekdays: number[]; // 0 = diumenge … 6 = dissabte
}

export interface CalendarEvent {
  id: string;
  owner: UserId;
  title: string;
  kind: EventKind;
  start: string; // ISO
  end?: string;  // ISO
  location?: string;
  recurrence?: Recurrence;
  visibility: Visibility;
  createdAt: string;
}

export interface Task {
  id: string;
  owner: UserId;
  title: string;
  done: boolean;
  archived: boolean;
  list: 'feina' | 'feinapapa';
  createdAt: string;
}

export interface Profile {
  id: UserId;
  name: string;
  heightCm?: number;
  weightKg?: number;
  edat?: number;
  activitat?: 'baixa' | 'moderada' | 'alta';
  hiddenSections: string[];
}

export type Franja = 'mati' | 'migdia' | 'tarda' | 'nit' | 'matinada';
export interface Nutrients { kcal: number; prot: number; carb: number; greix: number; fibra: number }
export interface Meal {
  id: string; owner: UserId; date: string; franja: Franja; text: string;
  items: { nom: string; quantitat: string; n: Nutrients; estimat: boolean }[];
  noReconegut: string[]; createdAt: string;
}

export type Digestio = 'Molt bé' | 'Bé' | 'Incòmode' | 'Malament' | 'Molt malament';
export interface Weight { id: string; owner: UserId; at: string; kg: number; digestio?: Digestio; foto?: string }

export interface SuperItem {
  id: string; nom: string; quantitat?: string; nota?: string; foto?: string;
  estat: 'pendent' | 'comprat' | 'no_hi_havia'; notaPapa?: string; createdAt: string;
}

export interface Outfit {
  id: string; owner: UserId; date: string; foto: string;
  colors: string[]; peces: string[]; calcat?: string; nota?: string;
}

export interface Postal { id: string; from: UserId; to: UserId; text: string; foto?: string; at: string; llegida: boolean }
export interface Proposta { id: string; from: UserId; text: string; at: string; estat: 'pendent' | 'acceptada' | 'rebutjada' }

export interface DB {
  version: 1;
  profiles: Record<UserId, Profile>;
  events: CalendarEvent[];
  tasks: Task[];
  meals: Meal[];
  weights: Weight[];
  superItems: SuperItem[];
  outfits: Outfit[];
  postals: Postal[];
  propostes: Proposta[];
}
