import { Pressable, StyleSheet, Text, View } from 'react-native';
import { eventsOn, updateTask } from '../data/store';
import type { DB, UserId } from '../data/types';
import { dataLlarga, hora, salutacio } from '../ui/ca';
import { C, Glass, Label, sans, serif, T } from '../ui/kit';
import { descripcio, icona, type Temps } from '../ui/weather';

export function Avui({ db, user, temps }: { db: DB; user: UserId; temps?: Temps }) {
  const now = new Date();
  const nom = user === 'josep' ? 'Josep' : 'Papà';
  const avui = eventsOn(now, user, db.events);
  const proper = avui.find((e) => new Date(e.end ?? e.start) > now);
  const dema = new Date(now); dema.setDate(dema.getDate() + 1);
  const properDema = !proper ? eventsOn(dema, user, db.events)[0] : undefined;
  const tasques = db.tasks.filter((t) => t.owner === user && !t.done && !t.archived && t.list === 'feina').slice(0, 3);
  const esport = avui.filter((e) => e.kind === 'esport');

  return (
    <View style={{ gap: 14 }}>
      <View style={{ paddingTop: 8, paddingBottom: 18 }}>
        <Text style={s.hola}>{salutacio(now)}, {nom}</Text>
        <Text style={s.data}>{dataLlarga(now)}</Text>
        {temps && (
          <Text style={s.temps}>{icona(temps)}  {temps.temp} °C · {descripcio(temps)}</Text>
        )}
      </View>

      {(proper || properDema) && (
        <Glass>
          <Label>{proper ? 'PRÒXIM' : 'DEMÀ'}</Label>
          <View style={s.ev}>
            <Text style={s.evH}>{hora((proper ?? properDema)!.start)}</Text>
            <View style={{ flex: 1 }}>
              <T>{(proper ?? properDema)!.title}</T>
              {(proper ?? properDema)!.location && <T faint style={{ fontSize: 13 }}>{(proper ?? properDema)!.location}</T>}
            </View>
          </View>
          {proper && avui.filter((e) => e !== proper && new Date(e.start) > new Date(proper.start)).slice(0, 2).map((e) => (
            <View key={e.id + e.start} style={[s.ev, { marginTop: 8 }]}>
              <Text style={[s.evH, { color: C.faint }]}>{hora(e.start)}</Text>
              <T soft>{e.title}</T>
            </View>
          ))}
        </Glass>
      )}

      {tasques.length > 0 && (
        <Glass>
          <Label>FEINA</Label>
          {tasques.map((t) => (
            <Pressable key={t.id} onPress={() => updateTask(t.id, { done: true })} style={s.task}>
              <View style={s.box} />
              <T>{t.title}</T>
            </Pressable>
          ))}
        </Glass>
      )}

      {esport.length > 0 && (
        <Glass>
          <Label>ACTIVITAT</Label>
          {esport.map((e) => (
            <T key={e.id + e.start}>
              {e.title} {new Date(e.end ?? e.start) < now ? '✓' : `· ${hora(e.start)}`}
            </T>
          ))}
        </Glass>
      )}

      {!proper && !properDema && tasques.length === 0 && (
        <Glass>
          <T soft>Avui tens el dia lliure. Toca ✦ i digues, per exemple: «Demà a les set gimnàs».</T>
        </Glass>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  hola: { color: C.text, fontFamily: serif, fontSize: 36, letterSpacing: 0.3 },
  data: { color: C.soft, fontFamily: sans, fontSize: 16, marginTop: 6 },
  temps: { color: C.soft, fontFamily: sans, fontSize: 15, marginTop: 4 },
  ev: { flexDirection: 'row', gap: 16, alignItems: 'baseline' },
  evH: { color: C.accent, fontFamily: sans, fontSize: 16, fontVariant: ['tabular-nums'], width: 50 },
  task: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  box: { width: 18, height: 18, borderRadius: 6, borderWidth: 1.2, borderColor: C.soft },
});
