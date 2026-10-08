// Intèrpret de llenguatge natural en català (sense IA, funciona offline).
// Fase posterior: si una frase no s'entén, es passarà a Claude des del servidor.
// Treballa sobre el text sense accents (perquè \b funcioni) i recupera els accents als títols.
import type { EventKind } from '../data/types';

export type Parsed =
  | { type: 'event'; title: string; kind: EventKind; start: Date; end?: Date; weekdays?: number[]; location?: string; missing: string[] }
  | { type: 'task'; title: string }
  | { type: 'delete'; query: string; weekday?: number }
  | { type: 'move'; query: string; weekday?: number; toHour: number; toMin: number }
  | { type: 'unknown'; text: string };

const DAYS: Record<string, number> = {
  diumenge: 0, dilluns: 1, dimarts: 2, dimecres: 3, dijous: 4, divendres: 5, dissabte: 6,
};
const NUM: Record<string, number> = {
  una: 1, dues: 2, dos: 2, tres: 3, quatre: 4, cinc: 5, sis: 6, set: 7, vuit: 8, nou: 9, deu: 10, onze: 11, dotze: 12,
};
const PLACES = ['girona', 'barcelona', 'palamos', 'figueres', 'sant feliu', 'calonge', 'la bisbal', "platja d'aro", 'palafrugell', 'sant antoni'];

const ACC: Record<string, string> = { à: 'a', á: 'a', è: 'e', é: 'e', í: 'i', ï: 'i', ò: 'o', ó: 'o', ú: 'u', ü: 'u', ç: 'c' };
const ascii = (s: string) => s.replace(/[àáèéíïòóúüç]/g, (c) => ACC[c]);

const lower = (s: string) =>
  s.toLowerCase().replace(/[’`]/g, "'").replace(/\s+/g, ' ').trim().replace(/[.,!?;]+$/, '');

const HOUR = String.raw`(\d{1,2})(?:[:.h](\d{2}))?|(${Object.keys(NUM).join('|')})`;
const DAY_RE = String.raw`\b(${Object.keys(DAYS).join('|')})s?\b`;

function readHour(m: RegExpMatchArray, i: number): { h: number; min: number } | null {
  if (m[i]) return { h: +m[i], min: m[i + 1] ? +m[i + 1] : 0 };
  if (m[i + 2]) return { h: NUM[m[i + 2]], min: 0 };
  return null;
}

/** Interpreta hores ambigües: «a les quatre» → 16:00; «sopar a les nou» → 21:00. */
function ampm(h: number, t: string) {
  if (/del mati|de la matinada/.test(t)) return h === 12 ? 0 : h;
  if (/de la tarda|del vespre|de la nit|\bsopar/.test(t)) return h < 12 ? h + 12 : h;
  if (h >= 1 && h <= 7) return h + 12;
  return h;
}

function guessKind(t: string): EventKind {
  if (/treball|\bfeina\b|\btorn\b/.test(t)) return 'feina';
  if (/gimnas|\bgym\b|correr|nedar|entren|\bbici|esport|futbol|padel|caminar/.test(t)) return 'esport';
  if (/\bcita\b|metge|dentista|reunio|perruqu/.test(t)) return 'cita';
  if (/sopar|dinar|cine|concert|festa|amics|cervesa/.test(t)) return 'oci';
  if (/recorda/.test(t)) return 'recordatori';
  return 'altre';
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Torna a posar els accents de l'original a les paraules del títol. */
function restore(title: string, original: string) {
  const map = new Map<string, string>();
  for (const w of original.split(/[^\p{L}'·]+/u)) if (w) map.set(ascii(w), w);
  return title.split(' ').map((w) => map.get(w) ?? w).join(' ');
}

function cleanTitle(t: string, kind: EventKind, original: string): string {
  let s = t
    .replace(new RegExp(DAY_RE, 'g'), ' ')
    .replace(/\b(dema passat|dema|avui|aquesta tarda|aquesta nit|cada dia|tots els dies)\b/g, ' ')
    .replace(new RegExp(String.raw`\b(de|a les|a la|cap a les|sobre les)\s+(?:les\s+)?(${HOUR})(\s*i mitja|\s*i quart)?\b`, 'g'), ' ')
    .replace(new RegExp(String.raw`\ba (${PLACES.join('|')})\b`, 'g'), ' ')
    .replace(/del mati|de la tarda|del vespre|de la nit|de la matinada|durant \S+ \S+/g, ' ')
    .replace(/[,]/g, ' ')
    .replace(/\s+/g, ' ').trim()
    .replace(/^(recorda'?m( que)?|posa'?m|apunta'?m?|afegeix|crea|tinc|he d'|haig d'|vull|cada|els)\s*/, '')
    .replace(/^(una?|el|la|l')\s+/, '')
    .replace(/^(anar al|anar a la|anar a|anar)\s+/, '')
    .replace(/\b(i|el|els|la)$/, '')
    .replace(/\s+(i|,)\s*$/, '')
    .replace(/\s+/g, ' ').trim();
  if (kind === 'feina' && /^treballo/.test(s)) s = 'Feina';
  if (!s) s = kind === 'cita' ? 'Cita' : kind === 'esport' ? 'Esport' : 'Esdeveniment';
  return cap(restore(s, original));
}

function nextWeekday(from: Date, wd: number, allowToday = false) {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  let diff = (wd - d.getDay() + 7) % 7;
  if (diff === 0 && !allowToday) diff = 7;
  d.setDate(d.getDate() + diff);
  return d;
}

export function parse(input: string, now = new Date()): Parsed {
  const original = lower(input);
  const t = ascii(original);
  if (!t) return { type: 'unknown', text: input };

  const days = [...t.matchAll(new RegExp(DAY_RE, 'g'))].map((m) => DAYS[m[1]]);
  const strip = (s: string) => s.replace(new RegExp(DAY_RE, 'g'), '').replace(/\b(de|del|la|el|l')\b/g, ' ').replace(/\s+/g, ' ').trim();

  // Eliminar: «Elimina la cita de dijous»
  if (/^(elimina|esborra|treu|cancel·la|cancela)\b/.test(t)) {
    return { type: 'delete', query: strip(t.replace(/^\S+\s*/, '')), weekday: days[0] };
  }

  // Canviar hora: «Canvia el gimnàs de dilluns de les set a les vuit»
  if (/^(canvia|mou|passa)\b/.test(t)) {
    const m = t.match(new RegExp(String.raw`a les (?:${HOUR})(\s*i mitja)?$`));
    if (m) {
      const h = readHour(m, 1)!;
      if (m[4]) h.min = 30;
      const q = strip(t.replace(/^\S+\s*/, '').replace(/\bde les .*$/, '').replace(/\ba les .*$/, ''));
      return { type: 'move', query: q, weekday: days[0], toHour: ampm(h.h, t), toMin: h.min };
    }
  }

  // Data
  let date: Date | null = null;
  let weekdays: number[] | undefined;
  if (/\bdema passat\b/.test(t)) { date = new Date(now); date.setDate(date.getDate() + 2); }
  else if (/\bdema\b/.test(t)) { date = new Date(now); date.setDate(date.getDate() + 1); }
  else if (/\bavui\b|\baquesta (tarda|nit)\b/.test(t)) date = new Date(now);
  if (days.length) {
    if (/\bcada\b|\bels (dilluns|dimarts|dimecres|dijous|divendres|dissabtes|diumenges)\b/.test(t) || days.length > 1) {
      weekdays = [...new Set(days)].sort();
      date = weekdays.map((w) => nextWeekday(now, w, true)).sort((a, b) => +a - +b)[0];
    } else date = nextWeekday(now, days[0]);
  }
  if (/\bcada dia\b|\btots els dies\b/.test(t)) { weekdays = [0, 1, 2, 3, 4, 5, 6]; date = date ?? new Date(now); }

  // Hores
  let start: { h: number; min: number } | null = null;
  let end: { h: number; min: number } | null = null;
  const range = t.match(new RegExp(String.raw`\bde (?:les )?(?:${HOUR}) a (?:les )?(?:${HOUR})`));
  if (range) {
    start = readHour(range, 1); end = readHour(range, 4);
    if (start && end) {
      if (start.h < 7 && !/mati/.test(t)) start.h += 12;
      if (end.h <= start.h) end.h += 12;
    }
  } else {
    const at = t.match(new RegExp(String.raw`\b(?:a les|a la|cap a les|sobre les)\s+(?:${HOUR})(\s*i mitja|\s*i quart)?`));
    const clock = t.match(/\b(\d{1,2})[:.h](\d{2})\b/);
    if (at) {
      start = readHour(at, 1);
      if (start && at[4]) start.min = /mitja/.test(at[4]) ? 30 : 15;
      if (start && !at[1]?.includes(':') && +(at[1] ?? 0) < 13) start.h = ampm(start.h, t);
    } else if (clock) start = { h: +clock[1], min: +clock[2] };
  }

  const dur = t.match(/durant (\d+|una|dues|tres) ?(h|hores|hora)\b/);
  if (start && !end && dur) end = { h: start.h + (NUM[dur[1]] ?? +dur[1]), min: start.min };

  if (!date && !start) {
    const title = original.replace(/^(afegeix|apunta'?m?|tasca:?|he de|haig de)\s*/, '');
    return { type: 'task', title: cap(title) };
  }

  const kind = guessKind(t);
  const s = new Date(date ?? now); s.setHours(start?.h ?? 9, start?.min ?? 0, 0, 0);
  if (!date && s < now) s.setDate(s.getDate() + 1);
  let e: Date | undefined;
  if (end) { e = new Date(s); e.setHours(end.h, end.min, 0, 0); }
  else if (kind === 'esport') e = new Date(s.getTime() + 60 * 60000);

  const place = t.match(new RegExp(String.raw`\ba (${PLACES.join('|')})\b`));
  const title = cleanTitle(t, kind, original);
  const missing: string[] = [];
  if (!start) missing.push('hora');
  if (title === 'Esdeveniment') missing.push('què és');

  return {
    type: 'event', title, kind, start: s, end: e, weekdays,
    location: place ? cap(restore(place[1], original)) : undefined,
    missing,
  };
}
