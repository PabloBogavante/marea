import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { add, remove } from '../data/store';
import type { DB, Digestio, UserId } from '../data/types';
import { dataLlarga, hora } from '../ui/ca';
import { triaFoto } from '../ui/foto';
import { C, Chip, Glass, Label, serif, T } from '../ui/kit';

const DIG: Digestio[] = ['Molt bé', 'Bé', 'Incòmode', 'Malament', 'Molt malament'];
const dia = (iso: string) => iso.slice(0, 10);

export function Pes({ db, user }: { db: DB; user: UserId }) {
  const [kg, setKg] = useState('');
  const [dig, setDig] = useState<Digestio>();
  const [foto, setFoto] = useState<string>();
  const pesos = db.weights.filter((w) => w.owner === user).sort((a, b) => a.at.localeCompare(b.at));

  const desa = () => {
    const v = parseFloat(kg.replace(',', '.'));
    if (!v || v < 30 || v > 250) return;
    add('weights', { owner: user, at: new Date().toISOString(), kg: v, digestio: dig, foto });
    setKg(''); setDig(undefined); setFoto(undefined);
  };

  // Mitjanes setmanals (últims 7 dies vs els 7 anteriors)
  const ara = Date.now(), D = 86400000;
  const mitja = (a: number, b: number) => {
    const xs = pesos.filter((p) => { const t = ara - new Date(p.at).getTime(); return t >= a * D && t < b * D; }).map((p) => p.kg);
    return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : undefined;
  };
  const m1 = mitja(0, 7), m0 = mitja(7, 14);

  let frase = '';
  if (pesos.length === 1) frase = 'Primer registre desat. Amb uns quants dies més ja podré dir-te la tendència.';
  else if (m1 !== undefined && m0 !== undefined) {
    const d = m1 - m0;
    frase = Math.abs(d) < 0.3 ? 'El teu pes es manté estable aquesta setmana.'
      : d < 0 ? `Aquesta setmana la mitjana ha baixat ${Math.abs(d).toFixed(1)} kg respecte a l’anterior.`
      : `Aquesta setmana la mitjana ha pujat ${d.toFixed(1)} kg respecte a l’anterior.`;
  } else if (pesos.length > 1) frase = 'Continua registrant uns dies més per veure una tendència fiable.';

  // Gràfica: últims 30 registres (un per dia, l'últim de cada dia)
  const perDia = Object.values(pesos.reduce<Record<string, typeof pesos[number]>>((acc, p) => ({ ...acc, [dia(p.at)]: p }), {})).slice(-30);
  const min = Math.min(...perDia.map((p) => p.kg)), max = Math.max(...perDia.map((p) => p.kg));
  const rang = Math.max(max - min, 1);

  return (
    <View style={{ gap: 14, paddingTop: 8 }}>
      <Glass>
        <Label>REGISTRAR PES</Label>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
          <TextInput value={kg} onChangeText={setKg} placeholder="74,0" placeholderTextColor={C.faint} keyboardType="decimal-pad" style={s.kg} onSubmitEditing={desa} />
          <T soft>kg</T>
        </View>
        <Label style={{ marginTop: 14 }}>SENSACIÓ DIGESTIVA</Label>
        <View style={s.wrap}>{DIG.map((d) => <Chip key={d} label={d} active={dig === d} onPress={() => setDig(dig === d ? undefined : d)} />)}</View>
        <View style={[s.wrap, { marginTop: 14 }]}>
          <Chip label={foto ? 'Foto afegida ✓' : 'Afegir foto'} onPress={async () => setFoto(await triaFoto())} />
          <Chip label="Desar" active onPress={desa} />
        </View>
      </Glass>

      {!!frase && <Glass><T>{frase}</T></Glass>}

      {perDia.length > 1 && (
        <Glass>
          <Label>EVOLUCIÓ</Label>
          <View style={s.chart}>
            {perDia.map((p) => (
              <View key={p.id} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
                <View style={{ width: 6, borderRadius: 3, backgroundColor: C.accent, height: 16 + ((p.kg - min) / rang) * 84 }} />
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
            <T faint style={{ fontSize: 12 }}>mín. {min.toFixed(1)} kg</T>
            <T faint style={{ fontSize: 12 }}>màx. {max.toFixed(1)} kg</T>
          </View>
          {m1 !== undefined && <T soft style={{ marginTop: 8, fontSize: 14 }}>Mitjana dels últims 7 dies: {m1.toFixed(1)} kg</T>}
        </Glass>
      )}

      {pesos.length > 0 && (
        <Glass>
          <Label>HISTORIAL</Label>
          {[...pesos].reverse().slice(0, 20).map((p) => (
            <View key={p.id} style={s.row}>
              {p.foto ? <Image source={{ uri: p.foto }} style={s.mini} /> : null}
              <View style={{ flex: 1 }}>
                <T>{p.kg.toFixed(1)} kg</T>
                <T faint style={{ fontSize: 13 }}>{dataLlarga(new Date(p.at))} · {hora(p.at)}{p.digestio ? ` · ${p.digestio}` : ''}</T>
              </View>
              <Pressable onPress={() => remove('weights', p.id)} hitSlop={10}><Text style={{ color: C.faint, fontSize: 18 }}>×</Text></Pressable>
            </View>
          ))}
        </Glass>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  kg: { color: C.text, fontFamily: serif, fontSize: 44, minWidth: 120, outlineStyle: 'none' } as any,
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chart: { height: 110, flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line },
  mini: { width: 36, height: 48, borderRadius: 8 },
});
