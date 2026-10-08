// Tria una foto (càmera o galeria) i la redueix perquè ocupi poc al mòbil.
import { Platform } from 'react-native';

export function triaFoto(max = 900): Promise<string | undefined> {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return Promise.resolve(undefined);
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve(undefined);
      const img = new Image();
      img.onload = () => {
        const s = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', 0.72));
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => resolve(undefined);
      img.src = URL.createObjectURL(file);
    };
    input.click();
  });
}

/** Colors dominants aproximats d'una foto (zona central, on sol haver-hi la roba). */
export function colorsDominants(dataUrl: string): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = 40; c.height = 60;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, img.width * 0.25, img.height * 0.15, img.width * 0.5, img.height * 0.75, 0, 0, 40, 60);
      const d = ctx.getImageData(0, 0, 40, 60).data;
      const comptes: Record<string, number> = {};
      for (let i = 0; i < d.length; i += 4) {
        const n = nomColor(d[i], d[i + 1], d[i + 2]);
        comptes[n] = (comptes[n] ?? 0) + 1;
      }
      const total = d.length / 4;
      resolve(Object.entries(comptes).filter(([, v]) => v / total > 0.12).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k));
    };
    img.onerror = () => resolve([]);
    img.src = dataUrl;
  });
}

function nomColor(r: number, g: number, b: number): string {
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 510, sat = max === min ? 0 : (max - min) / (255 - Math.abs(max + min - 255));
  if (l < 0.16) return 'negre';
  if (l > 0.86 && sat < 0.3) return 'blanc';
  if (sat < 0.16) return l < 0.45 ? 'gris fosc' : 'gris';
  let h = 0;
  if (max === r) h = ((g - b) / (max - min)) % 6; else if (max === g) h = (b - r) / (max - min) + 2; else h = (r - g) / (max - min) + 4;
  h = (h * 60 + 360) % 360;
  if (h < 20 || h >= 340) return l < 0.35 ? 'granat' : 'vermell';
  if (h < 45) return l < 0.4 ? 'marró' : l > 0.7 ? 'beix' : 'taronja';
  if (h < 65) return l > 0.7 ? 'beix' : 'groc';
  if (h < 160) return l < 0.3 ? 'verd fosc' : 'verd';
  if (h < 200) return 'turquesa';
  if (h < 250) return l < 0.3 ? 'blau marí' : 'blau';
  if (h < 290) return 'lila';
  return 'rosa';
}
