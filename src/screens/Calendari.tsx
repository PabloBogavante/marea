import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { deleteEvent, eventsOn, updateEvent } from '../data/store';
import type { CalendarEvent, DB, UserId, Visibility } from '../data/types';
import { DIES_CURT, dataLlarga, hora, llistaDies } from '../ui/ca';
import { C, Chip, Glass, Label, sans, T } from '../ui/kit';

const VIS: Record<Visibility, { punt: string; nom: string }> = {
  privat: { punt: C.priv, nom: 'Privat' },
  ocupat: { punt: C.ocup, nom: 'Ocupat' },
  compartit: { punt: C.comp, nom: 'Compartit' },
};
const seguent: Record<Visibility, Visibility> = { privat: 'ocupat', ocupat: 'compartit', compartit: 'privat' };
const KIND: Record<string, string> = { feina: 'Feina', esport: 'Esport', oci: 'Oci', cita: 'Cita', recordatori: 'Recordatori', altre: '' };

export function Calendari({ db, user }: { db: DB; user: UserId }) {
  const avui = new Date(); avui.setHours(0, 0, 0, 0);
  const [sel, setSel] = useState(avui);
  const [vista, setVista] = useState<'dia' | 'setmana'>('dia');
  const [obert, setObert] = useState<string>();

  // Setmana de dilluns a diumenge que conté el dia seleccionat
  const dl = new Date(sel); dl.setDate(sel.getDate() - ((sel.getDay() + 6) % 7));
  const setmana = Array.from({ length: 7 }, (_, i) => { const d = new Date(dl); d.setDate(dl.getDate() + i); return d; });
  const mou = (n: number) => { const d = new Date(sel); d.setDate(d.getDate() + n); setSel(d); };

  const Item = ({ e }: { e: CalendarEvent }) => {
    const orig = db.events.find((x) => x.id === e.id)!;
    const key = e.id + e.start;
    return (
      <Pressable onPress={() => setObert(obert === key ? undefined : key)} style={s.item}>
        <Text style={s.h}>{hora(e.start)}{e.end ? `\n${hora(e.end)}` : ''}</Text>
        <View style={{ flex: 1 }}>
          <T>{e.title}</T>
          <T faint style={{ fontSize: 13 }}>
            {[KIND[e.kind], e.location, orig.recurrence && llistaDies(orig.recurrence.weekdays)].filter(Boolean).join(' · ')}
          </T>
          {obert === key && user === 'josep' && (
            <View style={s.acc}>
              <Chip label={`● ${VIS[orig.visibility].nom}`} onPress={() => updateEvent(e.id, { visibility: seguent[orig.visibility] })} />
              <Chip label="Eliminar" onPress={() => deleteEvent(e.id)} />
            </View>
          )}
        </View>
        {user === 'josep' && <View style={[s.punt, { backgroundColor: VIS[orig.visibility].punt }]} />}
      </Pressable>
    );
  };

  return (
    <View style={{ gap: 14 }}>
      <View style={s.top}>
        <Pressable onPress={() => mou(vista === 'dia' ? -1 : -7)} hitSlop={12}><Text style={s.arr}>‹</Text></Pressable>
        <Text style={s.titol}>{dataLlarga(sel)}</Text>
        <Pressable onPress={() => mou(vista === 'dia' ? 1 : 7)} hitSlop={12}><Text style={s.arr}>›</Text></Pressable>
      </View>

      <View style={s.week}>
        {setmana.map((d) => {
          const on = d.getTime() === sel.getTime();
          const te = eventsOn(d, user, db.events).length > 0;
          return (
            <Pressable key={d.toISOString()} onPress={() => { setSel(d); setVista('dia'); }} style={[s.day, on && s.dayOn]}>
              <Text style={[s.dayN, on && { color: '#0b1a26' }]}>{DIES_CURT[d.getDay()]}</Text>
              <Text style={[s.dayD, on && { color: '#0b1a26' }, d.getTime() === avui.getTime() && !on && { color: C.accent }]}>{d.getDate()}</Text>
              <View style={[s.dot, { opacity: te ? 1 : 0 }, on && { backgroundColor: '#0b1a26' }]} />
            </Pressable>
          );
        })}
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Chip label="Dia" active={vista === 'dia'} onPress={() => setVista('dia')} />
        <Chip label="Setmana" active={vista === 'setmana'} onPress={() => setVista('setmana')} />
        {sel.getTime() !== avui.getTime() && <Chip label="Avui" onPress={() => setSel(avui)} />}
      </View>

      {vista === 'dia' ? (
        <Glass>
          {eventsOn(sel, user, db.events).map((e) => <Item key={e.id + e.start} e={e} />)}
          {eventsOn(sel, user, db.events).length === 0 && <T faint>Cap esdeveniment.</T>}
        </Glass>
      ) : (
        setmana.map((d) => {
          const evs = eventsOn(d, user, db.events);
          if (!evs.length) return null;
          return (
            <Glass key={d.toISOString()}>
              <Label>{dataLlarga(d).toUpperCase()}</Label>
              {evs.map((e) => <Item key={e.id + e.start} e={e} />)}
            </Glass>
          );
        })
      )}
      {user === 'josep' && (
        <T faint style={{ fontSize: 12, textAlign: 'center' }}>Toca un esdeveniment per canviar què en veu el Papà: ● privat · ● ocupat · ● compartit</T>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 },
  titol: { color: C.text, fontFamily: sans, fontSize: 18, fontWeight: '500' },
  arr: { color: C.soft, fontSize: 30, paddingHorizontal: 8 },
  week: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { alignItems: 'center', paddingVertical: 8, width: 44, borderRadius: 16 },
  dayOn: { backgroundColor: C.text },
  dayN: { color: C.faint, fontSize: 11, fontFamily: sans, textTransform: 'uppercase', letterSpacing: 1 },
  dayD: { color: C.text, fontSize: 18, fontFamily: sans, marginTop: 2 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.accent, marginTop: 4 },
  item: { flexDirection: 'row', gap: 14, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line },
  h: { color: C.accent, fontFamily: sans, fontSize: 14, width: 46, fontVariant: ['tabular-nums'], lineHeight: 20 },
  punt: { width: 7, height: 7, borderRadius: 4, marginTop: 8 },
  acc: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
});
