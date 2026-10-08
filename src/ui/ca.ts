// Dates en català, sense dependre d'Intl (Hermes no sempre porta el català).
export const DIES = ['diumenge', 'dilluns', 'dimarts', 'dimecres', 'dijous', 'divendres', 'dissabte'];
export const DIES_CURT = ['dg', 'dl', 'dt', 'dc', 'dj', 'dv', 'ds'];
export const MESOS = ['gener', 'febrer', 'març', 'abril', 'maig', 'juny', 'juliol', 'agost', 'setembre', 'octubre', 'novembre', 'desembre'];

const vocal = (s: string) => /^[aeiouàèéíòóú]/i.test(s);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** «Dimecres, 7 d’octubre» */
export function dataLlarga(d: Date) {
  const m = MESOS[d.getMonth()];
  return `${cap(DIES[d.getDay()])}, ${d.getDate()} ${vocal(m) ? 'd’' : 'de '}${m}`;
}
export const hora = (d: Date | string) => {
  const x = typeof d === 'string' ? new Date(d) : d;
  return `${String(x.getHours()).padStart(2, '0')}:${String(x.getMinutes()).padStart(2, '0')}`;
};
export function salutacio(d = new Date()) {
  const h = d.getHours();
  if (h >= 6 && h < 13) return 'Bon dia';
  if (h >= 13 && h < 20) return 'Bona tarda';
  return 'Bona nit';
}
/** «avui», «demà», «dilluns 12» */
export function diaRelatiu(d: Date, now = new Date()) {
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const b = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const n = Math.round((b - a) / 86400000);
  if (n === 0) return 'avui';
  if (n === 1) return 'demà';
  if (n === 2) return 'demà passat';
  return `${DIES[d.getDay()]} ${d.getDate()}`;
}
export function llistaDies(ws: number[]) {
  const noms = [...ws].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map((w) => DIES[w]);
  if (ws.length === 7) return 'cada dia';
  if (noms.length === 1) return `cada ${noms[0]}`;
  return `${noms.slice(0, -1).join(', ')} i ${noms[noms.length - 1]}`;
}
