import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadDB, useDB } from './src/data/store';
import type { UserId } from './src/data/types';
import { Avui } from './src/screens/Avui';
import { Calendari } from './src/screens/Calendari';
import { Feina } from './src/screens/Feina';
import { Bubble } from './src/ui/Bubble';
import { blurStyle, C, Glass, Label, sans, serif, T } from './src/ui/kit';
import { Sea } from './src/ui/Sea';
import { useTemps } from './src/ui/weather';

type Tab = 'avui' | 'calendari' | 'feina' | 'ajustos';
const TABS: { id: Tab; nom: string }[] = [
  { id: 'avui', nom: 'Avui' },
  { id: 'calendari', nom: 'Calendari' },
  { id: 'feina', nom: 'Feina' },
  { id: 'ajustos', nom: 'Ajustos' },
];
const SESSIO = 'marea.sessio';

export default function App() {
  const db = useDB();
  const temps = useTemps();
  const [user, setUser] = useState<UserId | null | undefined>(undefined);
  const [tab, setTab] = useState<Tab>('avui');
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
  const surt = () => { setUser(null); AsyncStorage.removeItem(SESSIO); setTab('avui'); };

  return (
    <View style={{ flex: 1, backgroundColor: '#071420' }}>
      <StatusBar style="light" />
      <Sea temps={temps} />
      {user === undefined ? null : !user ? (
        <Entrada onEntra={entra} />
      ) : (
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {tab === 'avui' && <Avui db={db} user={user} temps={temps} />}
            {tab === 'calendari' && <Calendari db={db} user={user} />}
            {tab === 'feina' && (
              <Feina db={db} user={user} onMoureCalendari={(titol) => setPrefill({ titol, n: Date.now() })} />
            )}
            {tab === 'ajustos' && <Ajustos user={user} onSurt={surt} />}
          </ScrollView>
          <Bubble db={db} user={user} bottom={96} prefill={prefill} />
          <View style={[st.nav, blurStyle]}>
            {TABS.map((t) => (
              <Pressable key={t.id} onPress={() => setTab(t.id)} style={st.navI}>
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

const SECCIONS = ['Dieta', 'Pes', 'OOTD', 'Registre', 'Papà', 'Josep Súper'];

function Ajustos({ user, onSurt }: { user: UserId; onSurt: () => void }) {
  const [vis, setVis] = useState<Record<string, boolean>>({});
  return (
    <View style={{ gap: 14, paddingTop: 8 }}>
      <Glass>
        <Label>PERFIL</Label>
        <T>{user === 'josep' ? 'Josep · 1,83 m · 74 kg' : 'Papà'}</T>
      </Glass>
      <Glass>
        <Label>SECCIONS</Label>
        {SECCIONS.map((s) => (
          <View key={s} style={st.ajRow}>
            <T style={{ flex: 1 }}>{s}</T>
            <T faint style={{ fontSize: 12, marginRight: 10 }}>properament</T>
            <Switch value={vis[s] ?? true} onValueChange={(v) => setVis({ ...vis, [s]: v })} />
          </View>
        ))}
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
});
