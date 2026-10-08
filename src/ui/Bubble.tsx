// Bombolla flotant: escriure o dictar en català → crear / canviar / eliminar.
import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { addEvent, addTask, deleteEvent, eventsOn, updateEvent } from '../data/store';
import type { CalendarEvent, DB, UserId } from '../data/types';
import { parse } from '../nlp/parse';
import { diaRelatiu, hora, llistaDies } from './ca';
import { blurStyle, C, sans } from './kit';

const ascii = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function trobar(db: DB, user: UserId, query: string, weekday?: number): CalendarEvent | undefined {
  const q = ascii(query).split(' ').filter((w) => w.length > 2);
  const now = new Date();
  // Busca en les properes dues setmanes
  for (let i = 0; i < 14; i++) {
    const d = new Date(now); d.setDate(d.getDate() + i);
    if (weekday !== undefined && d.getDay() !== weekday) continue;
    const hit = eventsOn(d, user, db.events).find((e) => q.every((w) => ascii(e.title + ' ' + e.kind).includes(w)));
    if (hit) return db.events.find((e) => e.id === hit.id);
  }
}

/** Executa una frase. Retorna la resposta i, si falta alguna dada, la frase pendent. */
export function executa(text: string, db: DB, user: UserId): { resposta: string; pendent?: string } {
  const p = parse(text);
  switch (p.type) {
    case 'task':
      if (p.title.length < 2) return { resposta: 'Què vols afegir?' };
      addTask(user, p.title);
      return { resposta: `Afegit a Feina: «${p.title}».` };
    case 'event': {
      if (p.missing.includes('què és')) return { resposta: 'Què vols afegir?', pendent: text };
      if (p.missing.includes('hora')) return { resposta: `${p.title} ${diaRelatiu(p.start)}. A quina hora?`, pendent: text };
      addEvent({
        owner: user, title: p.title, kind: p.kind, start: p.start.toISOString(), end: p.end?.toISOString(),
        location: p.location, recurrence: p.weekdays ? { weekdays: p.weekdays } : undefined,
        visibility: 'privat',
      });
      const quan = p.weekdays ? llistaDies(p.weekdays) : diaRelatiu(p.start);
      return { resposta: `Fet. ${p.title}, ${quan} a les ${hora(p.start)}${p.end ? '–' + hora(p.end) : ''}${p.location ? ' · ' + p.location : ''}.` };
    }
    case 'delete': {
      const e = trobar(db, user, p.query, p.weekday);
      if (!e) return { resposta: `No he trobat «${p.query}».` };
      deleteEvent(e.id);
      return { resposta: `Eliminat: ${e.title}${e.recurrence ? ' (totes les repeticions)' : ''}.` };
    }
    case 'move': {
      const e = trobar(db, user, p.query, p.weekday);
      if (!e) return { resposta: `No he trobat «${p.query}».` };
      const s = new Date(e.start);
      let h = p.toHour;
      if (s.getHours() >= 12 && h < 12 && h >= 1) h += 12; // «de les set a les vuit» a la tarda
      const dur = e.end ? new Date(e.end).getTime() - s.getTime() : 0;
      s.setHours(h, p.toMin, 0, 0);
      updateEvent(e.id, { start: s.toISOString(), end: dur ? new Date(s.getTime() + dur).toISOString() : undefined });
      return { resposta: `Canviat: ${e.title} ara a les ${hora(s)}.` };
    }
    default:
      return { resposta: 'No ho he entès. Prova amb «Demà a les set gimnàs».' };
  }
}

export function Bubble({ db, user, bottom, prefill }: { db: DB; user: UserId; bottom: number; prefill?: { titol: string; n: number } }) {
  const [obert, setObert] = useState(false);
  const [text, setText] = useState('');
  const [resposta, setResposta] = useState('');
  const [pendent, setPendent] = useState<string>();
  useEffect(() => {
    if (!prefill) return;
    obre(true);
    setResposta(`Quan vols fer «${prefill.titol}»?`);
    setPendent(prefill.titol);
  }, [prefill?.n]);
  const [escoltant, setEscoltant] = useState(false);
  const op = useRef(new Animated.Value(0)).current;

  const SR: any = Platform.OS === 'web' && typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const obre = (v: boolean) => {
    setObert(v);
    Animated.timing(op, { toValue: v ? 1 : 0, duration: 220, useNativeDriver: true }).start();
    if (!v) { setResposta(''); setPendent(undefined); setText(''); }
  };

  const envia = (frase = text) => {
    const f = frase.trim();
    if (!f) return;
    const completa = pendent ? `${pendent} ${/^(avui|dem|dilluns|dimarts|dimecres|dijous|divendres|dissabte|diumenge|cada)/i.test(f) ? '' : ''}${/^\d|^(a les|una|dues|tres|quatre|cinc|sis|set|vuit|nou|deu|onze|dotze)/i.test(f) && !/^a les/i.test(f) ? 'a les ' : ''}${f}` : f;
    const r = executa(completa, db, user);
    setResposta(r.resposta);
    setPendent(r.pendent);
    setText('');
  };

  const dicta = () => {
    if (!SR) return;
    const rec = new SR();
    rec.lang = 'ca-ES';
    rec.interimResults = false;
    rec.onresult = (e: any) => { const f = e.results[0][0].transcript; setText(f); envia(f); };
    rec.onend = () => setEscoltant(false);
    setEscoltant(true);
    rec.start();
  };

  if (!obert) {
    return (
      <Pressable onPress={() => obre(true)} style={[st.fab, blurStyle, { bottom }]} accessibilityLabel="Assistent">
        <Text style={st.fabT}>✦</Text>
      </Pressable>
    );
  }

  return (
    <Animated.View style={[st.panel, blurStyle, { bottom, opacity: op, transform: [{ translateY: op.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]}>
      {!!resposta && <Text style={st.resp}>{resposta}</Text>}
      <View style={st.row}>
        <TextInput
          autoFocus value={text} onChangeText={setText} onSubmitEditing={() => envia()}
          placeholder={pendent ? 'Respon…' : 'Demà a les set gimnàs…'} placeholderTextColor={C.faint}
          style={st.input} returnKeyType="send"
        />
        {SR && (
          <Pressable onPress={dicta} style={st.icon}><Text style={[st.iconT, escoltant && { color: C.priv }]}>{escoltant ? '●' : '🎙'}</Text></Pressable>
        )}
        <Pressable onPress={() => obre(false)} style={st.icon}><Text style={st.iconT}>×</Text></Pressable>
      </View>
    </Animated.View>
  );
}

const st = StyleSheet.create({
  fab: {
    position: 'absolute', right: 20, width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(12,28,42,0.6)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
  },
  fabT: { color: C.text, fontSize: 20 },
  panel: {
    position: 'absolute', left: 16, right: 16, borderRadius: 24, padding: 12, paddingLeft: 18,
    backgroundColor: C.glassStrong, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.2)',
  },
  resp: { color: C.text, fontFamily: sans, fontSize: 15, lineHeight: 21, paddingTop: 4, paddingBottom: 10, paddingRight: 8 },
  row: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, color: C.text, fontFamily: sans, fontSize: 16, paddingVertical: 8, outlineStyle: 'none' } as any,
  icon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  iconT: { color: C.soft, fontSize: 20 },
});
