// Secció compartida. Al Josep: «PAPÀ» (FeinaPapà, postals, propostes). Al Papà: «JOSEP» (agenda autoritzada, FeinaPapà, postals, proposar un canvi).
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { add, addTask, deleteTask, duplicateTask, eventsOn, update, updateTask } from '../data/store';
import type { DB, UserId } from '../data/types';
import { dataLlarga, DIES, hora } from '../ui/ca';
import { triaFoto } from '../ui/foto';
import { C, Chip, Glass, Label, sans, serif, T } from '../ui/kit';

export function Papa({ db, user, onMoureCalendari }: { db: DB; user: UserId; onMoureCalendari: (t: string) => void }) {
  const esJosep = user === 'josep';
  const [tasca, setTasca] = useState('');
  const [postal, setPostal] = useState('');
  const [foto, setFoto] = useState<string>();
  const [proposta, setProposta] = useState('');
  const [obert, setObert] = useState<string>();
  const [llegint, setLlegint] = useState<string>();

  const feinaPapa = db.tasks.filter((t) => t.list === 'feinapapa' && !t.archived);
  const rebudes = db.postals.filter((p) => p.to === user);
  const propostes = db.propostes;

  // Agenda del Josep visible per al Papà (7 dies), segons permisos
  const agenda = !esJosep ? Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + i);
    return { d, evs: eventsOn(d, 'josep', db.events).filter((e) => (db.events.find((x) => x.id === e.id)?.visibility ?? 'privat') !== 'privat') };
  }).filter((x) => x.evs.length) : [];

  const postalOberta = rebudes.find((p) => p.id === llegint);

  return (
    <View style={{ gap: 14, paddingTop: 8 }}>
      {postalOberta && (
        <Pressable onPress={() => setLlegint(undefined)}>
          <View style={s.postal}>
            <Text style={s.postalSegell}>💌</Text>
            {postalOberta.foto ? <Image source={{ uri: postalOberta.foto }} style={s.postalFoto} /> : null}
            <Text style={s.postalText}>{postalOberta.text}</Text>
            <Text style={s.postalFirma}>— {postalOberta.from === 'josep' ? 'Josep' : 'Papà'} · {dataLlarga(new Date(postalOberta.at))}</Text>
          </View>
        </Pressable>
      )}

      {rebudes.some((p) => !p.llegida) && (
        <Glass>
          {rebudes.filter((p) => !p.llegida).map((p) => (
            <Pressable key={p.id} onPress={() => { update('postals', p.id, { llegida: true }); setLlegint(p.id); }}>
              <T>💌 Has rebut una postal.</T>
            </Pressable>
          ))}
        </Glass>
      )}

      {!esJosep && (
        <Glass>
          <Label>AGENDA DEL JOSEP</Label>
          {agenda.length ? agenda.map(({ d, evs }) => (
            <View key={d.toISOString()} style={{ marginBottom: 8 }}>
              <T faint style={{ fontSize: 13 }}>{DIES[d.getDay()]} {d.getDate()}</T>
              {evs.map((e) => {
                const v = db.events.find((x) => x.id === e.id)!.visibility;
                return <T key={e.id + e.start}>{hora(e.start)}{e.end ? `–${hora(e.end)}` : ''}  {v === 'compartit' ? e.title : 'Ocupat'}</T>;
              })}
            </View>
          )) : <T faint>Res compartit aquests dies.</T>}
        </Glass>
      )}

      <Glass>
        <Label>FEINAPAPÀ</Label>
        {!esJosep && (
          <TextInput value={tasca} onChangeText={setTasca} onSubmitEditing={() => { if (tasca.trim()) { addTask('papa', tasca.trim().replace(/^./, (c) => c.toUpperCase()), 'feinapapa'); setTasca(''); } }}
            placeholder="Una cosa per al Josep…" placeholderTextColor={C.faint} style={s.input} />
        )}
        {feinaPapa.length ? feinaPapa.map((t) => (
          <View key={t.id}>
            <Pressable onPress={() => setObert(obert === t.id ? undefined : t.id)} style={s.row}>
              <Pressable onPress={() => updateTask(t.id, { done: !t.done })} hitSlop={10} style={[s.box, t.done && s.boxOn]} />
              <T style={[{ flex: 1 }, t.done ? { color: C.faint, textDecorationLine: 'line-through' } : {}]}>{t.title}</T>
            </Pressable>
            {obert === t.id && esJosep && (
              <View style={s.acc}>
                <Chip label="Al calendari" onPress={() => onMoureCalendari(t.title)} />
                <Chip label="Duplicar" onPress={() => duplicateTask(t.id)} />
                <Chip label="Arxivar" onPress={() => updateTask(t.id, { archived: true })} />
                <Chip label="Eliminar" onPress={() => deleteTask(t.id)} />
              </View>
            )}
          </View>
        )) : <T faint>{esJosep ? 'El Papà encara no t’ha deixat res.' : 'Escriu aquí tasques, encàrrecs o coses que vulguis dir-li.'}</T>}
      </Glass>

      {esJosep && (
        <Glass>
          <Label>ENVIAR UNA POSTAL</Label>
          <TextInput value={postal} onChangeText={setPostal} placeholder="Unes paraules per al Papà…" placeholderTextColor={C.faint} style={[s.input, { minHeight: 60 }]} multiline />
          <View style={s.acc0}>
            <Chip label={foto ? 'Foto ✓' : 'Afegir foto'} onPress={async () => setFoto(await triaFoto(900))} />
            <Chip label="Enviar" active onPress={() => { if (postal.trim()) { add('postals', { from: 'josep', to: 'papa', text: postal.trim(), foto, at: new Date().toISOString(), llegida: false }); setPostal(''); setFoto(undefined); } }} />
          </View>
          {db.postals.filter((p) => p.from === 'josep').slice(0, 3).map((p) => (
            <T key={p.id} faint style={{ fontSize: 13, marginTop: 6 }}>{p.llegida ? '✓ Llegida' : 'Enviada'} · {p.text.slice(0, 40)}{p.text.length > 40 ? '…' : ''}</T>
          ))}
        </Glass>
      )}

      {!esJosep && rebudes.length > 0 && (
        <Glass>
          <Label>POSTALS</Label>
          {rebudes.map((p) => (
            <Pressable key={p.id} onPress={() => { update('postals', p.id, { llegida: true }); setLlegint(p.id); }} style={s.row}>
              <Text style={{ fontSize: 18 }}>💌</Text>
              <T style={{ flex: 1 }}>{p.text.slice(0, 50)}{p.text.length > 50 ? '…' : ''}</T>
            </Pressable>
          ))}
        </Glass>
      )}

      {!esJosep ? (
        <Glass>
          <Label>PROPOSAR UN CANVI</Label>
          <TextInput value={proposta} onChangeText={setProposta} placeholder="Una idea o canvi per a l’aplicació…" placeholderTextColor={C.faint} style={[s.input, { minHeight: 50 }]} multiline />
          <View style={s.acc0}><Chip label="Enviar al Josep" active onPress={() => { if (proposta.trim()) { add('propostes', { from: 'papa', text: proposta.trim(), at: new Date().toISOString(), estat: 'pendent' }); setProposta(''); } }} /></View>
          {propostes.slice(0, 5).map((p) => <T key={p.id} faint style={{ fontSize: 13, marginTop: 6 }}>{p.estat === 'acceptada' ? '✓ Acceptada' : p.estat === 'rebutjada' ? '✕ Descartada' : '· Pendent'} — {p.text}</T>)}
        </Glass>
      ) : (
        <Glass>
          <Label>PROPOSTES DEL PAPÀ</Label>
          {propostes.length ? propostes.map((p) => (
            <View key={p.id} style={{ paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line }}>
              <T>{p.text}</T>
              <View style={[s.acc0, { marginTop: 6 }]}>
                <Chip label="Acceptar" active={p.estat === 'acceptada'} onPress={() => update('propostes', p.id, { estat: 'acceptada' })} />
                <Chip label="Rebutjar" active={p.estat === 'rebutjada'} onPress={() => update('propostes', p.id, { estat: 'rebutjada' })} />
                <Chip label="Pendent" active={p.estat === 'pendent'} onPress={() => update('propostes', p.id, { estat: 'pendent' })} />
              </View>
            </View>
          )) : <T faint>Cap proposta per ara.</T>}
        </Glass>
      )}
      <T faint style={{ fontSize: 12, textAlign: 'center' }}>Quan connectem els dos mòbils, tot això arribarà a l’altre telèfon.</T>
    </View>
  );
}

const s = StyleSheet.create({
  input: { color: C.text, fontFamily: sans, fontSize: 16, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line, outlineStyle: 'none' } as any,
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9 },
  box: { width: 20, height: 20, borderRadius: 7, borderWidth: 1.2, borderColor: C.soft },
  boxOn: { backgroundColor: C.ok, borderColor: C.ok },
  acc: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingLeft: 32, paddingBottom: 10 },
  acc0: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  postal: { backgroundColor: '#f6efe3', borderRadius: 18, padding: 22, transform: [{ rotate: '-1deg' }], shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } },
  postalSegell: { position: 'absolute', right: 16, top: 12, fontSize: 24 },
  postalFoto: { width: '100%', aspectRatio: 4 / 3, borderRadius: 10, marginBottom: 14, marginTop: 18 },
  postalText: { color: '#2b2a28', fontFamily: serif, fontSize: 22, lineHeight: 30, marginTop: 18 },
  postalFirma: { color: '#7a6f60', fontFamily: sans, fontSize: 13, marginTop: 16, textAlign: 'right' },
});
