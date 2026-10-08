// Estimació nutricional aproximada a partir de text en català («He menjat 8 nous i un préssec»).
// Valors orientatius per 100 g (taules de composició habituals). Sempre es mostren com a estimació.
import type { Nutrients } from '../data/types';

type F = { k: string[]; nom: string; per100: [number, number, number, number, number]; unitat: number; racio?: number };
// per100: kcal, proteïna, hidrats, greix, fibra · unitat: grams d'una peça · racio: grams d'una ració/plat
const T: F[] = [
  { k: ['nou', 'nous'], nom: 'Nous', per100: [654, 15, 14, 65, 7], unitat: 5 },
  { k: ['ametlla', 'ametlles'], nom: 'Ametlles', per100: [579, 21, 22, 50, 12], unitat: 1.2 },
  { k: ['avellana', 'avellanes'], nom: 'Avellanes', per100: [628, 15, 17, 61, 10], unitat: 1.5 },
  { k: ['pressec', 'pressecs'], nom: 'Préssec', per100: [39, 0.9, 10, 0.3, 1.5], unitat: 150 },
  { k: ['poma', 'pomes'], nom: 'Poma', per100: [52, 0.3, 14, 0.2, 2.4], unitat: 180 },
  { k: ['platan', 'platans', 'banana', 'bananes'], nom: 'Plàtan', per100: [89, 1.1, 23, 0.3, 2.6], unitat: 120 },
  { k: ['taronja', 'taronges'], nom: 'Taronja', per100: [47, 0.9, 12, 0.1, 2.4], unitat: 180 },
  { k: ['mandarina', 'mandarines'], nom: 'Mandarina', per100: [53, 0.8, 13, 0.3, 1.8], unitat: 80 },
  { k: ['pera', 'peres'], nom: 'Pera', per100: [57, 0.4, 15, 0.1, 3.1], unitat: 170 },
  { k: ['kiwi', 'kiwis'], nom: 'Kiwi', per100: [61, 1.1, 15, 0.5, 3], unitat: 75 },
  { k: ['maduixa', 'maduixes'], nom: 'Maduixes', per100: [32, 0.7, 8, 0.3, 2], unitat: 12, racio: 150 },
  { k: ['raim'], nom: 'Raïm', per100: [69, 0.7, 18, 0.2, 0.9], unitat: 5, racio: 150 },
  { k: ['ou', 'ous'], nom: 'Ou', per100: [143, 13, 0.7, 10, 0], unitat: 55 },
  { k: ['truita'], nom: 'Truita', per100: [154, 11, 1, 12, 0], unitat: 120 },
  { k: ['pollastre', 'pit de pollastre'], nom: 'Pollastre', per100: [165, 31, 0, 3.6, 0], unitat: 150, racio: 150 },
  { k: ['gall dindi', 'pavo'], nom: 'Gall dindi', per100: [135, 29, 0, 1.5, 0], unitat: 20, racio: 120 },
  { k: ['vedella', 'bistec', 'filet'], nom: 'Vedella', per100: [217, 26, 0, 12, 0], unitat: 150, racio: 150 },
  { k: ['porc', 'llom'], nom: 'Porc', per100: [242, 27, 0, 14, 0], unitat: 150, racio: 150 },
  { k: ['hamburguesa', 'hamburgueses'], nom: 'Hamburguesa', per100: [254, 17, 0, 20, 0], unitat: 120 },
  { k: ['pernil salat', 'pernil serra', 'jamon'], nom: 'Pernil salat', per100: [241, 31, 0, 13, 0], unitat: 15, racio: 50 },
  { k: ['pernil dolc', 'pernil'], nom: 'Pernil dolç', per100: [126, 21, 1, 4, 0], unitat: 15, racio: 50 },
  { k: ['salmo'], nom: 'Salmó', per100: [208, 20, 0, 13, 0], unitat: 150, racio: 150 },
  { k: ['tonyina'], nom: 'Tonyina', per100: [132, 28, 0, 1.3, 0], unitat: 80, racio: 80 },
  { k: ['lluc', 'peix blanc', 'bacalla'], nom: 'Peix blanc', per100: [90, 19, 0, 1, 0], unitat: 150, racio: 150 },
  { k: ['calamar', 'calamars', 'sepia'], nom: 'Calamar', per100: [92, 16, 3, 1.4, 0], unitat: 50, racio: 150 },
  { k: ['gamba', 'gambes', 'llagostins'], nom: 'Gambes', per100: [99, 24, 0.2, 0.3, 0], unitat: 15, racio: 120 },
  { k: ['arros'], nom: 'Arròs', per100: [130, 2.7, 28, 0.3, 0.4], unitat: 200, racio: 200 },
  { k: ['paella'], nom: 'Paella', per100: [160, 7, 22, 5, 1], unitat: 350, racio: 350 },
  { k: ['macarrons', 'pasta', 'espaguetis', 'fideus'], nom: 'Pasta', per100: [158, 5.8, 31, 0.9, 1.8], unitat: 220, racio: 220 },
  { k: ['pa', 'llesca', 'llesques', 'entrepa', 'bocata'], nom: 'Pa', per100: [265, 9, 49, 3.2, 2.7], unitat: 40, racio: 80 },
  { k: ['torrada', 'torrades'], nom: 'Torrada', per100: [313, 11, 60, 4, 4], unitat: 15 },
  { k: ['pa amb tomaquet'], nom: 'Pa amb tomàquet', per100: [230, 6, 40, 6, 3], unitat: 80 },
  { k: ['croissant', 'croissants'], nom: 'Croissant', per100: [406, 8, 46, 21, 2.6], unitat: 60 },
  { k: ['galeta', 'galetes'], nom: 'Galetes', per100: [480, 6.5, 70, 20, 2], unitat: 8 },
  { k: ['cereals', 'flocs de civada', 'civada'], nom: 'Cereals / civada', per100: [379, 13, 68, 6.5, 10], unitat: 40, racio: 40 },
  { k: ['patata', 'patates'], nom: 'Patata', per100: [87, 1.9, 20, 0.1, 1.8], unitat: 150, racio: 200 },
  { k: ['patates fregides'], nom: 'Patates fregides', per100: [312, 3.4, 41, 15, 3.8], unitat: 150, racio: 150 },
  { k: ['amanida', 'enciam'], nom: 'Amanida', per100: [20, 1.3, 3, 0.2, 1.5], unitat: 150, racio: 150 },
  { k: ['tomaquet', 'tomaquets'], nom: 'Tomàquet', per100: [18, 0.9, 3.9, 0.2, 1.2], unitat: 120 },
  { k: ['broquil', 'verdura', 'verdures', 'mongeta tendra'], nom: 'Verdura', per100: [34, 2.8, 7, 0.4, 2.6], unitat: 150, racio: 200 },
  { k: ['cigrons', 'llenties', 'mongetes', 'llegums'], nom: 'Llegums', per100: [130, 8, 20, 2, 7], unitat: 200, racio: 200 },
  { k: ['alvocat'], nom: 'Alvocat', per100: [160, 2, 9, 15, 7], unitat: 150 },
  { k: ['formatge'], nom: 'Formatge', per100: [380, 25, 1.3, 31, 0], unitat: 30, racio: 30 },
  { k: ['iogurt', 'iogurts'], nom: 'Iogurt', per100: [61, 3.5, 4.7, 3.3, 0], unitat: 125 },
  { k: ['iogurt grec'], nom: 'Iogurt grec', per100: [97, 9, 4, 5, 0], unitat: 125 },
  { k: ['llet', 'got de llet', 'tassa de llet'], nom: 'Llet', per100: [64, 3.2, 4.8, 3.6, 0], unitat: 250 },
  { k: ['cafe amb llet', 'tallat'], nom: 'Cafè amb llet', per100: [40, 2, 3, 2, 0], unitat: 200 },
  { k: ['cafe'], nom: 'Cafè', per100: [2, 0.1, 0, 0, 0], unitat: 50 },
  { k: ['sucre'], nom: 'Sucre', per100: [387, 0, 100, 0, 0], unitat: 8 },
  { k: ['oli', 'oli d\'oliva'], nom: 'Oli d\'oliva', per100: [884, 0, 0, 100, 0], unitat: 10 },
  { k: ['xocolata'], nom: 'Xocolata', per100: [546, 5, 61, 31, 7], unitat: 10, racio: 20 },
  { k: ['pizza'], nom: 'Pizza', per100: [266, 11, 33, 10, 2.3], unitat: 110, racio: 330 },
  { k: ['cervesa', 'canya'], nom: 'Cervesa', per100: [43, 0.5, 3.6, 0, 0], unitat: 330 },
  { k: ['vi', 'copa de vi'], nom: 'Vi', per100: [85, 0.1, 2.6, 0, 0], unitat: 150 },
  { k: ['refresc', 'cola', 'coca-cola'], nom: 'Refresc', per100: [42, 0, 10.6, 0, 0], unitat: 330 },
  { k: ['suc', 'suc de taronja'], nom: 'Suc', per100: [45, 0.7, 10, 0.2, 0.2], unitat: 200 },
  { k: ['batut de proteina', 'proteina', 'whey'], nom: 'Batut de proteïna', per100: [380, 75, 8, 5, 0], unitat: 30 },
];

const NUM: Record<string, number> = { un: 1, una: 1, dos: 2, dues: 2, tres: 3, quatre: 4, cinc: 5, sis: 6, set: 7, vuit: 8, nou: 9, deu: 10, dotze: 12, mig: 0.5, mitja: 0.5 };
const ascii = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/’/g, "'");

export interface FoodItem { nom: string; quantitat: string; n: Nutrients; estimat: boolean }

export function estimate(text: string): { items: FoodItem[]; noReconegut: string[] } {
  const t = ascii(text)
    .replace(/^(he menjat|he begut|he pres|menjat|esmorzar|dinar|sopar|berenar)[:\s]*/g, '')
    .replace(/[.!?]/g, '');
  const parts = t.split(/,| i | amb | i un | i una /).map((p) => p.trim()).filter(Boolean);
  const items: FoodItem[] = [];
  const noReconegut: string[] = [];
  for (const p of parts) {
    // Busca l'aliment amb la clau més llarga que coincideixi
    let best: F | undefined; let bestLen = 0;
    for (const f of T) for (const k of f.k) {
      if (new RegExp(`\\b${k}\\b`).test(p) && k.length > bestLen) { best = f; bestLen = k.length; }
    }
    if (!best) { noReconegut.push(p); continue; }
    const g = p.match(/(\d+(?:[.,]\d+)?)\s*(g|gr|grams|ml)\b/);
    const n = p.match(/^(\d+(?:[.,]\d+)?)|\b(un|una|dos|dues|tres|quatre|cinc|sis|set|vuit|nou|deu|dotze|mig|mitja)\b/);
    const plat = /\b(plat|racio|bol)\b/.test(p);
    let grams: number; let quantitat: string;
    if (g) { grams = parseFloat(g[1].replace(',', '.')); quantitat = `${grams} g`; }
    else {
      const qty = n ? (n[1] ? parseFloat(n[1].replace(',', '.')) : NUM[n[2]]) : 1;
      grams = qty * (plat ? best.racio ?? best.unitat : best.unitat);
      quantitat = plat ? `${qty} ració` : `${qty} ${qty === 1 ? 'unitat' : 'unitats'}`;
    }
    const f = grams / 100;
    const [k, pr, c, gr, fi] = best.per100;
    items.push({ nom: best.nom, quantitat, estimat: true, n: { kcal: Math.round(k * f), prot: +(pr * f).toFixed(1), carb: +(c * f).toFixed(1), greix: +(gr * f).toFixed(1), fibra: +(fi * f).toFixed(1) } });
  }
  return { items, noReconegut };
}

export const sum = (ns: Nutrients[]): Nutrients =>
  ns.reduce((a, b) => ({ kcal: a.kcal + b.kcal, prot: a.prot + b.prot, carb: a.carb + b.carb, greix: a.greix + b.greix, fibra: a.fibra + b.fibra }),
    { kcal: 0, prot: 0, carb: 0, greix: 0, fibra: 0 });

/** Necessitat energètica aproximada (Mifflin-St Jeor, home) × activitat. */
export function objectiu(kg?: number, cm?: number, edat?: number, act: 'baixa' | 'moderada' | 'alta' = 'moderada') {
  if (!kg || !cm || !edat) return undefined;
  const bmr = 10 * kg + 6.25 * cm - 5 * edat + 5;
  return { kcal: Math.round(bmr * { baixa: 1.35, moderada: 1.55, alta: 1.75 }[act]), prot: Math.round(kg * 1.6), fibra: 30 };
}
