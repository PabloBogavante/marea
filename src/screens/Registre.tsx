// REGISTRE: resum automàtic a partir del calendari i les tasques.
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { eventsOn } from '../data/store';
import type { DB, EventKind, UserId } from '../data/types';
import { C, Chip, Glass, Label, T } from '../ui/kit';

const NOMS: Record<EventKind, string> = { esport: 'Activitat física', feina: 'Feina', oci: 'Oci', cita: 'Cites', recordatori: 'Recordatoris', altre: 'Altres' };
const durada = (h: number) => { const hh = Math.floor(h), mm = Math.round((h - hh) * 60); return mm ? `${hh} h ${mm} min` : `${hh} h`; };

export function Registre({ db, user }: { db: DB; user: UserId }) {
  const [periode, setPeriode] = useState<'setmana' | 'mes' | '30'>('setmana');
  const avui = new Date(); avui.setHours(0, 0, 0, 0);
  const inici = new Date(avui);
  if (periode === 'setmana') inici.setDate(avui.getDate() - ((avui.getDay() + 6) % 7));
  else if (periode === 'mes') inici.setDate(1);
  else inici.setDate(avui.getDate() - 29);

  const ara = new Date();
  const fets: ReturnType<typeof eventsOn> = [];
  for (const d = new Date(inici); d <= avui; d.setDate(d.getDate() + 1)) {
    fets.push(...eventsOn(new Date(d), user, db.events).filter((e) => new Date(e.end ?? e.start) <= ara));
  }
  const perTipus = new Map<EventKind, { n: number; h: number }>();
  const perTitol = new Map<string, { n: number; h: number }>();
  for (const e of fets) {
    const h = e.end ? (new Date(e.end).getTime() - new Date(e.start).getTime()) / 3600000 : 0;
    const a = perTipus.get(e.kind) ?? { n: 0, h: 0 }; perTipus.set(e.kind, { n: a.n + 1, h: a.h + h });
    const b = perTitol.get(e.title) ?? { n: 0, h: 0 }; perTitol.set(e.title, { n: b.n + 1, h: b.h + h });
  }
  const tasquesFetes = db.tasks.filter((t) => t.owner === user && t.done).length;
  const quan = periode === 'setmana' ? 'Aquesta setmana' : periode === 'mes' ? 'Aquest mes' : 'Els darrers 30 dies';
  const esport = perTipus.get('esport');

  return (
    <View style={{ gap: 14, paddingTop: 8 }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Chip label="Setmana" active={periode === 'setmana'} onPress={() => setPeriode('setmana')} />
        <Chip label="Mes" active={periode === 'mes'} onPress={() => setPeriode('mes')} />
        <Chip label="30 dies" active={periode === '30'} onPress={() => setPeriode('30')} />
      </View>
      <Glass>
        <Label>{quan.toUpperCase()}</Label>
        {esport ? <T>{quan} has mantingut {esport.n} {esport.n === 1 ? 'sessió' : 'sessions'} d’activitat física{esport.h ? ` (${durada(esport.h)})` : ''}.</T>
          : <T soft>{quan} encara no hi ha activitat física registrada.</T>}
        {tasquesFetes > 0 && <T soft style={{ marginTop: 6 }}>Tasques completades en total: {tasquesFetes}.</T>}
      </Glass>
      {perTipus.size > 0 && (
        <Glass>
          <Label>PER TIPUS</Label>
          {[...perTipus].map(([k, v]) => (
            <View key={k} style={s.row}><T style={{ flex: 1 }}>{NOMS[k]}</T><T soft>{v.n}×{v.h ? ` · ${durada(v.h)}` : ''}</T></View>
          ))}
        </Glass>
      )}
      {perTitol.size > 0 && (
        <Glass>
          <Label>PER ACTIVITAT</Label>
          {[...perTitol].sort((a, b) => b[1].n - a[1].n).map(([k, v]) => (
            <View key={k} style={s.row}><T style={{ flex: 1 }}>{k}</T><T soft>{v.n}×{v.h ? ` · ${durada(v.h)}` : ''}</T></View>
          ))}
        </Glass>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', paddingVertical: 7, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line },
});
