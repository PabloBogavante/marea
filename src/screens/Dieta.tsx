import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { add, remove, updateProfile } from '../data/store';
import type { DB, Franja, UserId } from '../data/types';
import { estimate, objectiu, sum } from '../nlp/food';
import { dataLlarga } from '../ui/ca';
import { C, Chip, Glass, Label, sans, T } from '../ui/kit';

const FRANGES: { id: Franja; nom: string }[] = [
  { id: 'mati', nom: 'Matí' }, { id: 'migdia', nom: 'Migdia' }, { id: 'tarda', nom: 'Tarda' },
  { id: 'nit', nom: 'Nit' }, { id: 'matinada', nom: 'Matinada' },
];
const franjaAra = (): Franja => {
  const h = new Date().getHours();
  return h < 6 ? 'matinada' : h < 12 ? 'mati' : h < 16 ? 'migdia' : h < 20 ? 'tarda' : 'nit';
};
const avuiISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

export function Dieta({ db, user }: { db: DB; user: UserId }) {
  const [text, setText] = useState('');
  const [franja, setFranja] = useState<Franja>(franjaAra());
  const [avis, setAvis] = useState('');
  const perfil = db.profiles[user];
  const [edat, setEdat] = useState(perfil.edat ? String(perfil.edat) : '');
  const avui = avuiISO();
  const apats = db.meals.filter((m) => m.owner === user && m.date === avui);
  const total = sum(apats.flatMap((m) => m.items.map((i) => i.n)));
  const obj = objectiu(perfil.weightKg, perfil.heightCm, perfil.edat, perfil.activitat);

  const desa = () => {
    if (!text.trim()) return;
    const r = estimate(text);
    add('meals', { owner: user, date: avui, franja, text: text.trim(), items: r.items, noReconegut: r.noReconegut, createdAt: new Date().toISOString() });
    setAvis(r.noReconegut.length ? `No he sabut estimar: ${r.noReconegut.join(', ')}. La resta queda desada.` : '');
    setText('');
  };

  // Anàlisi breu del dia, sense exagerar
  const notes: string[] = [];
  if (apats.length && obj) {
    const pct = total.kcal / obj.kcal;
    if (pct < 0.5 && new Date().getHours() > 18) notes.push('Avui portes poca energia per l’hora que és.');
    if (pct > 1.15) notes.push('Avui ja has superat l’energia aproximada que necessites.');
    if (total.prot < obj.prot * 0.5 && new Date().getHours() > 16) notes.push(`Vas curt de proteïna (≈${Math.round(total.prot)} g de ${obj.prot} g).`);
    if (total.fibra < 12 && new Date().getHours() > 18) notes.push('Poca fibra avui: fruita, verdura o llegums hi ajudarien.');
    if (!notes.length) notes.push('De moment, el dia va equilibrat.');
  }

  const Barra = ({ nom, v, o, u }: { nom: string; v: number; o?: number; u: string }) => (
    <View style={{ marginTop: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <T soft style={{ fontSize: 14 }}>{nom}</T>
        <T soft style={{ fontSize: 14 }}>≈{Math.round(v)}{o ? ` / ${o}` : ''} {u}</T>
      </View>
      {o ? <View style={s.track}><View style={[s.fill, { width: `${Math.min(100, (v / o) * 100)}%` }]} /></View> : null}
    </View>
  );

  return (
    <View style={{ gap: 14, paddingTop: 8 }}>
      <Glass>
        <Label>QUÈ HAS MENJAT?</Label>
        <TextInput value={text} onChangeText={setText} onSubmitEditing={desa} placeholder="He menjat 8 nous i un préssec…" placeholderTextColor={C.faint} style={s.input} multiline />
        <View style={[s.wrap, { marginTop: 10 }]}>
          {FRANGES.map((f) => <Chip key={f.id} label={f.nom} active={franja === f.id} onPress={() => setFranja(f.id)} />)}
        </View>
        <View style={[s.wrap, { marginTop: 10 }]}><Chip label="Afegir" active onPress={desa} /></View>
        {!!avis && <T faint style={{ fontSize: 13, marginTop: 8 }}>{avis}</T>}
      </Glass>

      <Glass>
        <Label>AVUI · ESTIMACIÓ APROXIMADA</Label>
        <Text style={s.big}>≈{total.kcal} kcal{obj ? <Text style={s.small}>  de ≈{obj.kcal}</Text> : null}</Text>
        <Barra nom="Proteïna" v={total.prot} o={obj?.prot} u="g" />
        <Barra nom="Hidrats" v={total.carb} u="g" />
        <Barra nom="Greix" v={total.greix} u="g" />
        <Barra nom="Fibra" v={total.fibra} o={obj?.fibra} u="g" />
        {notes.map((n) => <T key={n} style={{ marginTop: 12 }}>{n}</T>)}
        {!obj && (
          <View style={{ marginTop: 14 }}>
            <T soft style={{ fontSize: 14 }}>Per calcular la teva necessitat diària em falta l’edat:</T>
            <View style={[s.wrap, { marginTop: 8, alignItems: 'center' }]}>
              <TextInput value={edat} onChangeText={setEdat} placeholder="Edat" placeholderTextColor={C.faint} keyboardType="number-pad" style={[s.input, { width: 80, paddingVertical: 4 }]} />
              <Chip label="Desar" onPress={() => { const e = parseInt(edat); if (e > 10 && e < 100) updateProfile(user, { edat: e, activitat: perfil.activitat ?? 'moderada' }); }} />
            </View>
          </View>
        )}
      </Glass>

      {FRANGES.map((f) => {
        const xs = apats.filter((m) => m.franja === f.id);
        if (!xs.length) return null;
        return (
          <Glass key={f.id}>
            <Label>{f.nom.toUpperCase()}</Label>
            {xs.map((m) => (
              <View key={m.id} style={s.meal}>
                <View style={{ flex: 1 }}>
                  <T>{m.text}</T>
                  <T faint style={{ fontSize: 13 }}>
                    {m.items.map((i) => `${i.nom} (${i.quantitat}) ≈${i.n.kcal} kcal`).join(' · ') || 'Sense estimació'}
                  </T>
                </View>
                <Pressable onPress={() => remove('meals', m.id)} hitSlop={10}><Text style={{ color: C.faint, fontSize: 18 }}>×</Text></Pressable>
              </View>
            ))}
          </Glass>
        );
      })}
      <T faint style={{ fontSize: 12, textAlign: 'center' }}>{dataLlarga(new Date())} · Les calories són estimacions orientatives, no valors exactes.</T>
    </View>
  );
}

const s = StyleSheet.create({
  input: { color: C.text, fontFamily: sans, fontSize: 16, paddingVertical: 8, outlineStyle: 'none' } as any,
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  big: { color: C.text, fontFamily: sans, fontSize: 30, fontWeight: '300' },
  small: { color: C.faint, fontSize: 15 },
  track: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)', marginTop: 5, overflow: 'hidden' },
  fill: { height: 4, borderRadius: 2, backgroundColor: C.accent },
  meal: { flexDirection: 'row', gap: 10, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line },
});
