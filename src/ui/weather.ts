// Meteorologia de Palamós amb Open-Meteo (gratuït, sense clau).
import { useEffect, useState } from 'react';

export type Cel = 'clar' | 'nuvol' | 'pluja' | 'tempesta' | 'boira';
export interface Temps { temp: number; cel: Cel; vent: number; sortida?: Date; posta?: Date; codi: number }

const LAT = 41.85, LON = 3.13;

function cel(code: number): Cel {
  if (code >= 95) return 'tempesta';
  if (code >= 51) return 'pluja';
  if (code === 45 || code === 48) return 'boira';
  if (code >= 2) return 'nuvol';
  return 'clar';
}
export const icona = (t?: Temps) =>
  !t ? '' : ({ clar: '☀️', nuvol: '⛅', pluja: '🌧️', tempesta: '⛈️', boira: '🌫️' } as const)[t.cel];
export const descripcio = (t: Temps) =>
  ({ clar: 'cel serè', nuvol: 'núvols', pluja: 'pluja', tempesta: 'tempesta', boira: 'boira' } as const)[t.cel] +
  (t.vent >= 30 ? ' i vent' : '');

export function useTemps(): Temps | undefined {
  const [t, setT] = useState<Temps>();
  useEffect(() => {
    let viu = true;
    const carrega = () =>
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,weather_code,wind_speed_10m&daily=sunrise,sunset&timezone=Europe%2FMadrid&forecast_days=1`)
        .then((r) => r.json())
        .then((j) => viu && setT({
          temp: Math.round(j.current.temperature_2m),
          codi: j.current.weather_code,
          cel: cel(j.current.weather_code),
          vent: j.current.wind_speed_10m,
          sortida: j.daily?.sunrise?.[0] ? new Date(j.daily.sunrise[0]) : undefined,
          posta: j.daily?.sunset?.[0] ? new Date(j.daily.sunset[0]) : undefined,
        }))
        .catch(() => {});
    carrega();
    const id = setInterval(carrega, 20 * 60000);
    return () => { viu = false; clearInterval(id); };
  }, []);
  return t;
}
