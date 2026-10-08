// OOTD (Josep) i VESTIDOR (Papà): foto diària + colors detectats + peces marcades → estadístiques.
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { add, remove, update } from '../data/store';
import type { DB, Outfit, UserId } from '../data/types';
import { dataLlarga } from '../ui/ca';
import { colorsDominants, triaFoto } from '../ui/foto';
import { C, Chip, Glass, Label, sans, T } from '../ui/kit';

const PECES = ['Samarreta', 'Camisa', 'Polo', 'Jersei', 'Jaqueta', 'Americana', 'Abric', 'Texans', 'Pantalons', 'Xinos', 'Pantaló curt', 'Xandall'];
const CALCAT = ['Bambes', 'Botes', 'Sabates', 'Mocassins', 'Sandàlies'];
const COLORS = ['negre', 'blanc', 'gris', 'gris fosc', 'blau marí', 'blau', 'beix', 'marró', 'verd', 'verd fosc', 'granat', 'vermell', 'groc', 'taronja', 'rosa', 'lila', 'turquesa'];
const avuiISO = () => new Date().toISOString().slice(0, 10);
const diesEntre = (a: string, b: string) => Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);

export function Ootd({ db, user }: { db: DB; user: UserId }) {
  const papa = user === 'papa';
  const meus = db.outfits.filter((o) => o.owner === user).sort((a, b) => b.date.localeCompare(a.date));
  const [editant, setEditant] = useState<string>();
  const [carregant, setCarregant] = useState(false);
  const [nota, setNota] = useState('');

  const nou = async () => {
    const foto = await triaFoto(1000);
    if (!foto) return;
    setCarregant(true);
    const colors = await colorsDominants(foto);
    add('outfits', { owner: user, date: avuiISO(), foto, colors, peces: [] });
    setCarregant(false);
  };
  const o = meus.find((x) => x.id === editant);
  const toggle = (x: Outfit, camp: 'peces' | 'colors', v: string) =>
    update('outfits', x.id, { [camp]: x[camp].includes(v) ? x[camp].filter((y) => y !== v) : [...x[camp], v] } as any);

  // Estadístiques (darrers 30 conjunts)
  const recents = meus.slice(0, 30);
  const compta = (xs: string[]) => Object.entries(xs.reduce<Record<string, number>>((a, k) => ({ ...a, [k]: (a[k] ?? 0) + 1 }), {})).sort((a, b) => b[1] - a[1]);
  const colorsTop = compta(recents.flatMap((x) => x.colors));
  const pecesTop = compta(recents.flatMap((x) => x.peces));
  const frases: string[] = [];
  if (recents.length >= 3 && colorsTop[0]) {
    const [c, n] = colorsTop[0];
    frases.push(`El ${c} és el color que més ${papa ? 'portes' : 'utilitzes'}: apareix en ${n} dels darrers ${recents.length} conjunts.`);
    if (colorsTop[1]) frases.push(`${colorsTop[0][0][0].toUpperCase() + colorsTop[0][0].slice(1)} i ${colorsTop[1][0]} són la combinació més habitual.`);
  }
  if (meus.length >= 5) {
    const darrerUs: Record<string, string> = {};
    [...meus].reverse().forEach((x) => x.colors.forEach((c) => (darrerUs[c] = x.date)));
    const oblidat = Object.entries(darrerUs).map(([c, d]) => [c, diesEntre(d, avuiISO())] as const).filter(([, d]) => d >= 14).sort((a, b) => b[1] - a[1])[0];
    if (oblidat) frases.push(`Fa ${oblidat[1]} dies que no portes ${oblidat[0]}.`);
  }
  // Repeticions de la mateixa combinació aquesta setmana
  if (meus[0]) {
    const clau = (x: Outfit) => [...x.colors].sort().join('+') + '|' + [...x.peces].sort().join('+');
    const rep = meus.filter((x) => diesEntre(x.date, avuiISO()) < 7 && clau(x) === clau(meus[0]) && x.peces.length).length;
    if (rep >= 3) frases.push(`Has repetit aquesta combinació ${rep} vegades aquesta setmana.`);
  }
  const avui = meus.find((x) => x.date === avuiISO());

  return (
    <View style={{ gap: 14, paddingTop: 8 }}>
      {!avui && (
        <Pressable onPress={nou}>
          <Glass style={{ alignItems: 'center', paddingVertical: 26 }}>
            <Text style={{ fontSize: 26 }}>📸</Text>
            <T style={{ marginTop: 6 }}>{carregant ? 'Analitzant colors…' : papa ? 'Afegir el conjunt d’avui' : 'Afegir OOTD d’avui'}</T>
            <T faint style={{ fontSize: 13, marginTop: 2 }}>Foto de cos sencer, amb bona llum</T>
          </Glass>
        </Pressable>
      )}

      {o && (
        <Glass>
          <Label>{dataLlarga(new Date(o.date)).toUpperCase()}</Label>
          <Image source={{ uri: o.foto }} style={s.big} resizeMode="cover" />
          <Label style={{ marginTop: 14 }}>COLORS (detectats, corregeix si cal)</Label>
          <View style={s.wrap}>{COLORS.map((c) => <Chip key={c} label={c} active={o.colors.includes(c)} onPress={() => toggle(o, 'colors', c)} />)}</View>
          <Label style={{ marginTop: 14 }}>PECES</Label>
          <View style={s.wrap}>{PECES.map((p) => <Chip key={p} label={p} active={o.peces.includes(p)} onPress={() => toggle(o, 'peces', p)} />)}</View>
          <Label style={{ marginTop: 14 }}>CALÇAT</Label>
          <View style={s.wrap}>{CALCAT.map((p) => <Chip key={p} label={p} active={o.calcat === p} onPress={() => update('outfits', o.id, { calcat: o.calcat === p ? undefined : p })} />)}</View>
          <TextInput value={nota} onChangeText={setNota} onBlur={() => update('outfits', o.id, { nota: nota || undefined })} placeholder="Nota (opcional)" placeholderTextColor={C.faint} style={s.input} />
          <View style={[s.wrap, { marginTop: 12 }]}>
            <Chip label="Fet" active onPress={() => { update('outfits', o.id, { nota: nota || undefined }); setEditant(undefined); }} />
            <Chip label="Eliminar" onPress={() => { remove('outfits', o.id); setEditant(undefined); }} />
          </View>
        </Glass>
      )}

      {frases.length > 0 && (
        <Glass>
          <Label>{papa ? 'EL TEU ESTIL' : 'ESTADÍSTIQUES'}</Label>
          {frases.map((f) => <T key={f} style={{ marginBottom: 6 }}>{f}</T>)}
          {pecesTop.length > 0 && <T faint style={{ fontSize: 13 }}>Peces més usades: {pecesTop.slice(0, 3).map(([p, n]) => `${p.toLowerCase()} (${n})`).join(', ')}</T>}
        </Glass>
      )}
      {meus.length > 0 && meus.length < 3 && (
        <Glass><T soft>Amb uns quants conjunts més començaré a veure patrons de colors i combinacions.</T></Glass>
      )}

      {meus.length > 0 && (
        <View style={s.grid}>
          {meus.slice(0, 30).map((x) => (
            <Pressable key={x.id} onPress={() => { setEditant(x.id); setNota(x.nota ?? ''); }} style={s.cell}>
              <Image source={{ uri: x.foto }} style={s.thumb} />
              <Text style={s.cellT}>{x.date.slice(8, 10)}/{x.date.slice(5, 7)}</Text>
            </Pressable>
          ))}
        </View>
      )}
      {papa && (
        <T faint style={{ fontSize: 12, textAlign: 'center' }}>Els consells detallats sobre tall, taques o desgast arribaran quan connectem l’anàlisi d’imatge amb IA.</T>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  big: { width: '100%', aspectRatio: 3 / 4, borderRadius: 16 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  input: { color: C.text, fontFamily: sans, fontSize: 15, paddingVertical: 8, marginTop: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line, outlineStyle: 'none' } as any,
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  cell: { width: '32%' },
  thumb: { width: '100%', aspectRatio: 3 / 4, borderRadius: 12 },
  cellT: { color: C.soft, fontFamily: sans, fontSize: 11, marginTop: 3, textAlign: 'center' },
});
