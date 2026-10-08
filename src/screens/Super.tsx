import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { add, remove, update } from '../data/store';
import type { DB, SuperItem, UserId } from '../data/types';
import { triaFoto } from '../ui/foto';
import { C, Chip, Glass, Label, sans, T } from '../ui/kit';

const EMOJI: [RegExp, string][] = [
  [/llet/i, '🥛'], [/pl[aà]tan/i, '🍌'], [/\bous?\b/i, '🥚'], [/xamp|gel|sab[oó]/i, '🧴'], [/pa\b|barra/i, '🥖'],
  [/poma/i, '🍎'], [/tom[aà]quet/i, '🍅'], [/formatge/i, '🧀'], [/pollastre|carn/i, '🍗'], [/peix|salm[oó]/i, '🐟'],
  [/aigua/i, '💧'], [/caf[eè]/i, '☕'], [/oli/i, '🫒'], [/arr[oò]s/i, '🍚'], [/pasta|macarrons/i, '🍝'], [/paper/i, '🧻'],
];
const emoji = (n: string) => EMOJI.find(([r]) => r.test(n))?.[1] ?? '·';

export function Super({ db, user }: { db: DB; user: UserId }) {
  const [nom, setNom] = useState('');
  const [quant, setQuant] = useState('');
  const [nota, setNota] = useState('');
  const [foto, setFoto] = useState<string>();
  const [obert, setObert] = useState<string>();
  const [notaPapa, setNotaPapa] = useState('');
  const esJosep = user === 'josep';
  const items = db.superItems;
  const pendents = items.filter((i) => i.estat === 'pendent');
  const fets = items.filter((i) => i.estat !== 'pendent');

  const afegeix = () => {
    if (!nom.trim()) return;
    add('superItems', { nom: nom.trim().replace(/^./, (c) => c.toUpperCase()), quantitat: quant.trim() || undefined, nota: nota.trim() || undefined, foto, estat: 'pendent', createdAt: new Date().toISOString() });
    setNom(''); setQuant(''); setNota(''); setFoto(undefined);
  };

  const Fila = ({ i }: { i: SuperItem }) => (
    <View style={s.item}>
      <Pressable onPress={() => { setObert(obert === i.id ? undefined : i.id); setNotaPapa(i.notaPapa ?? ''); }} style={s.row}>
        {i.foto ? <Image source={{ uri: i.foto }} style={s.mini} /> : <Text style={s.emoji}>{emoji(i.nom)}</Text>}
        <View style={{ flex: 1 }}>
          <T style={i.estat !== 'pendent' ? { color: C.faint } : undefined}>{i.nom}{i.quantitat ? ` · ${i.quantitat}` : ''}</T>
          {i.nota ? <T faint style={{ fontSize: 13 }}>{i.nota}</T> : null}
          {i.notaPapa ? <T style={{ fontSize: 13, color: C.ocup }}>Papà: {i.notaPapa}</T> : null}
        </View>
        {i.estat === 'comprat' && <Text style={[s.estat, { color: C.ok }]}>✓ Comprat</Text>}
        {i.estat === 'no_hi_havia' && <Text style={[s.estat, { color: C.priv }]}>✕ No n’hi havia</Text>}
      </Pressable>
      {obert === i.id && (
        <View style={s.acc}>
          {!esJosep && (
            <>
              <Chip label="✓ Comprat" onPress={() => update('superItems', i.id, { estat: 'comprat' })} />
              <Chip label="✕ No n’hi havia" onPress={() => update('superItems', i.id, { estat: 'no_hi_havia' })} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%' }}>
                <TextInput value={notaPapa} onChangeText={setNotaPapa} placeholder="He comprat una altra marca…" placeholderTextColor={C.faint} style={[s.input, { flex: 1 }]} />
                <Chip label="Desar nota" onPress={() => update('superItems', i.id, { notaPapa: notaPapa.trim() || undefined })} />
              </View>
            </>
          )}
          {i.estat !== 'pendent' && <Chip label="Tornar a pendent" onPress={() => update('superItems', i.id, { estat: 'pendent' })} />}
          {esJosep && <Chip label="Eliminar" onPress={() => remove('superItems', i.id)} />}
        </View>
      )}
    </View>
  );

  return (
    <View style={{ gap: 14, paddingTop: 8 }}>
      {esJosep && (
        <Glass>
          <Label>AFEGIR PRODUCTE</Label>
          <TextInput value={nom} onChangeText={setNom} onSubmitEditing={afegeix} placeholder="Llet" placeholderTextColor={C.faint} style={s.input} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TextInput value={quant} onChangeText={setQuant} placeholder="Quantitat" placeholderTextColor={C.faint} style={[s.input, { flex: 1 }]} />
            <TextInput value={nota} onChangeText={setNota} placeholder="Nota" placeholderTextColor={C.faint} style={[s.input, { flex: 2 }]} />
          </View>
          <View style={[s.acc, { paddingLeft: 0 }]}>
            <Chip label={foto ? 'Foto ✓' : 'Foto'} onPress={async () => setFoto(await triaFoto(500))} />
            <Chip label="Afegir" active onPress={afegeix} />
          </View>
        </Glass>
      )}
      <Glass>
        <Label>{esJosep ? 'PER COMPRAR' : 'EL JOSEP NECESSITA'}</Label>
        {pendents.length ? pendents.map((i) => <Fila key={i.id} i={i} />) : <T faint>La llista és buida.</T>}
      </Glass>
      {fets.length > 0 && (
        <Glass>
          <Label>RESPOSTES</Label>
          {fets.map((i) => <Fila key={i.id} i={i} />)}
          {esJosep && <View style={[s.acc, { paddingLeft: 0 }]}><Chip label="Netejar comprats" onPress={() => fets.filter((i) => i.estat === 'comprat').forEach((i) => remove('superItems', i.id))} /></View>}
        </Glass>
      )}
      <T faint style={{ fontSize: 12, textAlign: 'center' }}>Quan connectem els dos mòbils, el Papà veurà aquesta llista al seu.</T>
    </View>
  );
}

const s = StyleSheet.create({
  input: { color: C.text, fontFamily: sans, fontSize: 16, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line, outlineStyle: 'none' } as any,
  item: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  emoji: { fontSize: 22, width: 34, textAlign: 'center', color: C.soft },
  mini: { width: 34, height: 34, borderRadius: 8 },
  estat: { fontFamily: sans, fontSize: 12 },
  acc: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingLeft: 46, paddingBottom: 12, paddingTop: 4 },
});
