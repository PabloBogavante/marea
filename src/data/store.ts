// Capa de dades. Ara: emmagatzematge local. Fase següent: Supabase amb la mateixa interfície.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import type { CalendarEvent, DB, Profile, Task, UserId } from './types';

const KEY = 'marea.db.v1';

const empty: DB = {
  version: 1,
  profiles: {
    josep: { id: 'josep', name: 'Josep', heightCm: 183, weightKg: 74, hiddenSections: [] },
    papa: { id: 'papa', name: 'Papà', hiddenSections: [] },
  },
  events: [],
  tasks: [],
  meals: [],
  weights: [],
  superItems: [],
  outfits: [],
  postals: [],
  propostes: [],
};

let db: DB = empty;
let loaded = false;
const listeners = new Set<() => void>();

export const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export async function loadDB() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) { const d = JSON.parse(raw); db = { ...empty, ...d, profiles: { ...empty.profiles, ...d.profiles } }; }
  } catch {}
  loaded = true;
  emit();
}

function emit() { listeners.forEach((l) => l()); }

async function commit(next: DB) {
  db = next;
  emit();
  try { await AsyncStorage.setItem(KEY, JSON.stringify(db)); } catch {}
}

export function useDB(): DB {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => db,
  );
}
export const isLoaded = () => loaded;

// ── Esdeveniments ──
export const addEvent = (e: Omit<CalendarEvent, 'id' | 'createdAt'>) =>
  commit({ ...db, events: [...db.events, { ...e, id: uid(), createdAt: new Date().toISOString() }] });
export const updateEvent = (id: string, patch: Partial<CalendarEvent>) =>
  commit({ ...db, events: db.events.map((e) => (e.id === id ? { ...e, ...patch } : e)) });
export const deleteEvent = (id: string) =>
  commit({ ...db, events: db.events.filter((e) => e.id !== id) });

// ── Tasques ──
export const addTask = (owner: UserId, title: string, list: Task['list'] = 'feina') =>
  commit({ ...db, tasks: [{ id: uid(), owner, title, done: false, archived: false, list, createdAt: new Date().toISOString() }, ...db.tasks] });
export const updateTask = (id: string, patch: Partial<Task>) =>
  commit({ ...db, tasks: db.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) });
export const deleteTask = (id: string) =>
  commit({ ...db, tasks: db.tasks.filter((t) => t.id !== id) });
export const duplicateTask = (id: string) => {
  const t = db.tasks.find((x) => x.id === id);
  if (t) commit({ ...db, tasks: [{ ...t, id: uid(), done: false, createdAt: new Date().toISOString() }, ...db.tasks] });
};

// ── Col·leccions genèriques (àpats, pesos, súper, OOTD, postals, propostes) ──
type Col = 'meals' | 'weights' | 'superItems' | 'outfits' | 'postals' | 'propostes';
export function add<K extends Col>(col: K, item: Omit<DB[K][number], 'id'>) {
  commit({ ...db, [col]: [{ ...(item as any), id: uid() }, ...(db[col] as any[])] } as DB);
}
export function update<K extends Col>(col: K, id: string, patch: Partial<DB[K][number]>) {
  commit({ ...db, [col]: (db[col] as any[]).map((x) => (x.id === id ? { ...x, ...patch } : x)) } as DB);
}
export function remove<K extends Col>(col: K, id: string) {
  commit({ ...db, [col]: (db[col] as any[]).filter((x) => x.id !== id) } as DB);
}
export function clear(col: Col | 'events' | 'tasks', owner?: UserId) {
  commit({ ...db, [col]: owner ? (db[col] as any[]).filter((x) => (x.owner ?? x.from) !== owner) : [] } as DB);
}
export const updateProfile = (id: UserId, patch: Partial<Profile>) =>
  commit({ ...db, profiles: { ...db.profiles, [id]: { ...db.profiles[id], ...patch } } });

// ── Consultes ──
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** Esdeveniments d'un dia, incloent-hi les ocurrències de les activitats recurrents. */
export function eventsOn(day: Date, owner: UserId, all: CalendarEvent[]): CalendarEvent[] {
  const out: CalendarEvent[] = [];
  for (const e of all) {
    if (e.owner !== owner) continue;
    const s = new Date(e.start);
    if (e.recurrence) {
      if (day >= new Date(s.getFullYear(), s.getMonth(), s.getDate()) && e.recurrence.weekdays.includes(day.getDay())) {
        const st = new Date(day); st.setHours(s.getHours(), s.getMinutes(), 0, 0);
        let en: string | undefined;
        if (e.end) { const d = new Date(e.end).getTime() - s.getTime(); en = new Date(st.getTime() + d).toISOString(); }
        out.push({ ...e, start: st.toISOString(), end: en });
      }
    } else if (sameDay(s, day)) out.push(e);
  }
  return out.sort((a, b) => a.start.localeCompare(b.start));
}
