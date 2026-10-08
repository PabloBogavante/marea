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
  hiddenSections: string[];
}

export interface DB {
  version: 1;
  profiles: Record<UserId, Profile>;
  events: CalendarEvent[];
  tasks: Task[];
}
