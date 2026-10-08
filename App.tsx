import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clear, loadDB, updateProfile, useDB } from './src/data/store';
import type { DB, UserId } from './src/data/types';
import { Avui } from './src/screens/Avui';
import { Calendari } from './src/screens/Calendari';
import { Dieta } from './src/screens/Dieta';
import { Feina } from './src/screens/Feina';
import { Ootd } from './src/screens/Ootd';
import { Papa } from './src/screens/Papa';
import { Pes } from './src/screens/Pes';
import { Registre } from './src/screens/Registre';
import { Super } from './src/screens/Super';
import { Bubble } from './src/ui/Bubble';
import { blurStyle, C, Chip, Glass, Label, sans, serif, T } from './src/ui/kit';
import { Sea } from './src/ui/Sea';
import { useTemps } from './src/ui/weather';

type Tab = 'avui' | 'calendari' | 'feina' | 'mes';
type Seccio = 'dieta' | 'pes' | 'ootd' | 'registre' | 'papa' | 'super' | 'ajustos';
const TABS: { id: Tab; nom: string }[] = [
  { id: 'avui', nom: 'Avui' },
  { id: 'calendari', nom: 'Calendari' },
  { id: 'feina', nom: 'Feina' },
  { id: 'mes', nom: 'Més' },
];
const SECCIONS: Record<UserId, { id: Seccio; nom: string; icona: string; col?: 'meals' | 'weights' | 'outfits' | 'superItems' }[]> = {
  josep: [
    { id: 'dieta', nom: 'Dieta', icona: '🥗', col: 'meals' }, { id: 'pes', nom: 'Pes', icona: '⚖️', col: 'weights' },
    { id: 'ootd', nom: 'OOTD', icona: '📸', col: 'outfits' }, { id: 'registre', nom: 'Registre', icona: '📈' },
    { id: 'papa', nom: 'Papà', icona: '👨' }, { id: 'super', nom: 'Josep Súper', icona: '🛒', col: 'superItems' },
  ],
  papa: [
    { id: 'dieta', nom: 'Dieta', icona: '🥗', col: 'meals' }, { id: 'pes', nom: 'Pes', icona: '⚖️', col: 'weights' },
    { id: 'ootd', nom: 'Vestidor', icona: '👔', col: 'outfits' }, { id: 'registre', nom: 'Registre', icona: '📈' },
    { id: 'papa', nom: 'Josep', icona: '💌' }, { id: 'super', nom: 'Josep Súper', icona: '🛒' },
  ],
};
const SESSIO = 'marea.sessio';

export default function App() {
  const db = useDB();
  const temps = useTemps();
  const [user, setUser] = useState<UserId | null | undefined>(undefined);
  const [tab, setTab] = useState<Tab>('avui');
  const [seccio, setSeccio] = useState<Seccio>();
  const [prefill, setPrefill] = useState<{ titol: string; n: number }>();

  useEffect(() => {
    loadDB();
    AsyncStorage.getItem(SESSIO).then((u) => setUser((u as UserId) || null)).catch(() => setUser(null));
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&family=Inter:wght@300;400;500;600&display=swap';
      document.head.appendChild(l);
      const m = document.createElement('meta'); m.name = 'apple-mobile-web-app-capable'; m.content = 'yes'; document.head.appendChild(m);
      const m2 = document.createElement('meta'); m2.name = 'apple-mobile-web-app-status-bar-style'; m2.content = 'black-translucent'; document.head.appendChild(m2);
      document.documentElement.lang = 'ca';
    }
  }, []);

  const entra = (u: UserId) => { setUser(u); AsyncStorage.setItem(SESSIO, u); };
  const surt = () => { setUser(null); AsyncStorage.removeItem(SESSIO); setTab('avui'); setSeccio(undefined); };

  return (
    <View style={{ flex: 1, backgroundColor: '#071420' }}>
      <StatusBar style="light" />
      <Sea temps={temps} />
      {user === undefined ? null : !user ? (
        <Entrada onEntra={entra} />
      ) : (
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {tab === 'avui' && <Avui db={db} user={user} temps={temps} onObre={(x) => { setTab('mes'); setSeccio(x as Seccio); }} />}
            {tab === 'calendari' && <Calendari db={db} user={user} />}
            {tab === 'feina' && (
              <Feina db={db} user={user} onMoureCalendari={(titol) => setPrefill({ titol, n: Date.now() })} />
            )}
            {tab === 'mes' && !seccio && <Mes user={user} hidden={db.profiles[user].hiddenSections} onObre={setSeccio} />}
            {tab === 'mes' && seccio && (
              <View>
                <Pressable onPress={() => setSeccio(undefined)} hitSlop={12} style={{ paddingTop: 6 }}>
                  <Text style={st.back}>‹ {seccio === 'ajustos' ? 'Ajustos' : SECCIONS[user].find((x) => x.id === seccio)?.nom}</Text>
                </Pressable>
                {seccio === 'dieta' && <Dieta db={db} user={user} />}
                {seccio === 'pes' && <Pes db={db} user={user} />}
                {seccio === 'ootd' && <Ootd db={db} user={user} />}
                {seccio === 'registre' && <Registre db={db} user={user} />}
                {seccio === 'papa' && <Papa db={db} user={user} onMoureCalendari={(titol) => setPrefill({ titol, n: Date.now() })} />}
                {seccio === 'super' && <Super db={db} user={user} />}
                {seccio === 'ajustos' && <Ajustos db={db} user={user} onSurt={surt} />}
              </View>
            )}
          </ScrollView>
          <Bubble db={db} user={user} bottom={96} prefill={prefill} />
          <View style={[st.nav, blurStyle]}>
            {TABS.map((t) => (
              <Pressable key={t.id} onPress={() => { setTab(t.id); setSeccio(undefined); }} style={st.navI}>
                <Text style={[st.navT, tab === t.id && { color: C.text }]}>{t.nom}</Text>
                <View style={[st.navDot, { opacity: tab === t.id ? 1 : 0 }]} />
              </Pressable>
            ))}
          </View>
        </SafeAreaView>
      )}
    </View>
  );
}

function Entrada({ onEntra }: { onEntra: (u: UserId) => void }) {
  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', padding: 28 }}>
      <Text style={st.logo}>Marea</Text>
      <T soft style={{ textAlign: 'center', marginBottom: 40 }}>Qui ets?</T>
      <View style={{ gap: 12 }}>
        {(['josep', 'papa'] as UserId[]).map((u) => (
          <Pressable key={u} onPress={() => onEntra(u)} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
            <Glass style={{ alignItems: 'center', paddingVertical: 20 }}>
              <Text style={st.qui}>{u === 'josep' ? 'JOSEP' : 'PAPÀ'}</Text>
            </Glass>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

function Mes({ user, hidden, onObre }: { user: UserId; hidden: string[]; onObre: (s: Seccio) => void }) {
  const items = SECCIONS[user].filter((x) => !hidden.includes(x.id));
  return (
    <View style={{ gap: 12, paddingTop: 8 }}>
      <View style={st.grid}>
        {items.map((x) => (
          <Pressable key={x.id} onPress={() => onObre(x.id)} style={({ pressed }) => [st.cell, pressed && { opacity: 0.7 }]}>
            <Glass style={{ alignItems: 'center', paddingVertical: 22 }}>
              <Text style={{ fontSize: 26 }}>{x.icona}</Text>
              <Text style={st.cellT}>{x.nom}</Text>
            </Glass>
          </Pressable>
        ))}
      </View>
      <Pressable onPress={() => onObre('ajustos')}><Glass style={{ alignItems: 'center' }}><T soft>Ajustos</T></Glass></Pressable>
    </View>
  );
}

function Ajustos({ db, user, onSurt }: { db: DB; user: UserId; onSurt: () => void }) {
  const p = db.profiles[user];
  const [confirmant, setConfirmant] = useState<string>();
  const [edat, setEdat] = useState(p.edat ? String(p.edat) : '');
  const [kg, setKg] = useState(p.weightKg ? String(p.weightKg) : '');
  const [cm, setCm] = useState(p.heightCm ? String(p.heightCm) : '');
  const toggle = (id: string) => updateProfile(user, { hiddenSections: p.hiddenSections.includes(id) ? p.hiddenSections.filter((x) => x !== id) : [...p.hiddenSections, id] });
  return (
    <View style={{ gap: 14, paddingTop: 8 }}>
      <Glass>
        <Label>PERFIL · {user === 'josep' ? 'JOSEP' : 'PAPÀ'}</Label>
        {[['Altura (cm)', cm, setCm], ['Pes aproximat (kg)', kg, setKg], ['Edat', edat, setEdat]].map(([l, v, set]: any) => (
          <View key={l} style={st.ajRow}>
            <T style={{ flex: 1 }}>{l}</T>
            <TextInput value={v} onChangeText={set} keyboardType="decimal-pad" style={st.num} placeholder="—" placeholderTextColor={C.faint} />
          </View>
        ))}
        <View style={[st.ajRow, { gap: 8 }]}>
          <T style={{ flex: 1 }}>Activitat</T>
          {(['baixa', 'moderada', 'alta'] as const).map((a) => <Chip key={a} label={a} active={(p.activitat ?? 'moderada') === a} onPress={() => updateProfile(user, { activitat: a })} />)}
        </View>
        <View style={{ marginTop: 10, alignItems: 'flex-start' }}>
          <Chip label="Desar perfil" active onPress={() => updateProfile(user, { heightCm: parseFloat(cm) || undefined, weightKg: parseFloat(kg.replace(',', '.')) || undefined, edat: parseInt(edat) || undefined })} />
        </View>
      </Glass>
      <Glass>
        <Label>SECCIONS</Label>
        {SECCIONS[user].map((x) => (
          <View key={x.id}>
            <View style={st.ajRow}>
              <T style={{ flex: 1 }}>{x.icona}  {x.nom}</T>
              {x.col && <Pressable onPress={() => setConfirmant(confirmant === x.id ? undefined : x.id)} hitSlop={8}><Text style={{ color: C.faint, fontSize: 13, marginRight: 12 }}>Esborrar dades</Text></Pressable>}
              <Switch value={!p.hiddenSections.includes(x.id)} onValueChange={() => toggle(x.id)} />
            </View>
            {confirmant === x.id && x.col && (
              <View style={st.confirm}>
                <T style={{ fontSize: 14 }}>Estàs segur que vols eliminar les dades de {x.nom}? No es podrà desfer.</T>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                  <Chip label="Sí, eliminar" onPress={() => { clear(x.col!, x.col === 'superItems' ? undefined : user); setConfirmant(undefined); }} />
                  <Chip label="Cancel·lar" onPress={() => setConfirmant(undefined)} />
                </View>
              </View>
            )}
          </View>
        ))}
        <T faint style={{ fontSize: 12, marginTop: 8 }}>L’interruptor només amaga la secció; «Esborrar dades» les elimina.</T>
      </Glass>
      <Glass>
        <Label>DADES</Label>
        <T soft style={{ fontSize: 14 }}>
          Ara mateix les dades es guarden en aquest mòbil. En la propera fase se sincronitzaran entre els dos mòbils amb accés protegit i Face ID.
        </T>
      </Glass>
      <Pressable onPress={onSurt}><Glass style={{ alignItems: 'center' }}><T>Tanca la sessió</T></Glass></Pressable>
    </View>
  );
}

const st = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 180, maxWidth: 560, width: '100%', alignSelf: 'center' },
  nav: {
    position: 'absolute', left: 16, right: 16, bottom: 22, height: 62, borderRadius: 31,
    flexDirection: 'row', backgroundColor: 'rgba(8,18,28,0.62)',
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.16)',
    maxWidth: 528, alignSelf: 'center',
  },
  navI: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navT: { color: C.faint, fontFamily: sans, fontSize: 13, letterSpacing: 0.4 },
  navDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.accent, marginTop: 5 },
  logo: { color: C.text, fontFamily: serif, fontSize: 56, textAlign: 'center', marginBottom: 8, letterSpacing: 1 },
  qui: { color: C.text, fontFamily: sans, fontSize: 16, letterSpacing: 4, fontWeight: '500' },
  ajRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  back: { color: C.soft, fontFamily: sans, fontSize: 16, marginBottom: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cell: { width: '47%', flexGrow: 1 },
  cellT: { color: C.text, fontFamily: sans, fontSize: 15, marginTop: 8 },
  num: { color: C.text, fontFamily: sans, fontSize: 16, width: 70, textAlign: 'right', outlineStyle: 'none' } as any,
  confirm: { backgroundColor: 'rgba(232,135,125,0.12)', borderRadius: 14, padding: 12, marginBottom: 8 },
});
