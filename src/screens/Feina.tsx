import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { addTask, deleteTask, duplicateTask, updateTask } from '../data/store';
import type { DB, UserId } from '../data/types';
import { C, Chip, Glass, Label, sans, T } from '../ui/kit';

export function Feina({ db, user, onMoureCalendari }: { db: DB; user: UserId; onMoureCalendari: (titol: string) => void }) {
  const [nou, setNou] = useState('');
  const [obert, setObert] = useState<string>();
  const [arxiu, setArxiu] = useState(false);
  const meves = db.tasks.filter((t) => t.owner === user && t.list === 'feina');
  const pendents = meves.filter((t) => !t.done && !t.archived);
  const fetes = meves.filter((t) => t.done && !t.archived);
  const arxivades = meves.filter((t) => t.archived);

  const afegeix = () => { if (nou.trim()) { addTask(user, nou.trim().replace(/^./, (c) => c.toUpperCase())); setNou(''); } };

  const Fila = ({ id, title, done }: { id: string; title: string; done: boolean }) => (
    <View>
      <Pressable onPress={() => setObert(obert === id ? undefined : id)} style={s.row}>
        <Pressable onPress={() => updateTask(id, { done: !done })} hitSlop={10} style={[s.box, done && s.boxOn]} />
        <T style={[{ flex: 1 }, done ? { color: C.faint, textDecorationLine: 'line-through' } : {}]}>{title}</T>
      </Pressable>
      {obert === id && (
        <View style={s.acc}>
          <Chip label="Al calendari" onPress={() => onMoureCalendari(title)} />
          <Chip label="Duplicar" onPress={() => duplicateTask(id)} />
          <Chip label="Arxivar" onPress={() => { updateTask(id, { archived: true }); setObert(undefined); }} />
          <Chip label="Eliminar" onPress={() => deleteTask(id)} />
        </View>
      )}
    </View>
  );

  return (
    <View style={{ gap: 14, paddingTop: 8 }}>
      <Glass style={{ paddingVertical: 6 }}>
        <TextInput
          value={nou} onChangeText={setNou} onSubmitEditing={afegeix} placeholder="Nova tasca…"
          placeholderTextColor={C.faint} style={s.input} returnKeyType="done"
        />
      </Glass>
      <Glass>
        <Label>PENDENT</Label>
        {pendents.length ? pendents.map((t) => <Fila key={t.id} {...t} />) : <T faint>Res pendent.</T>}
      </Glass>
      {fetes.length > 0 && (
        <Glass>
          <Label>FET</Label>
          {fetes.map((t) => <Fila key={t.id} {...t} />)}
        </Glass>
      )}
      {arxivades.length > 0 && (
        <View style={{ alignItems: 'center' }}>
          <Chip label={arxiu ? 'Amaga l’arxiu' : `Arxiu (${arxivades.length})`} onPress={() => setArxiu(!arxiu)} />
        </View>
      )}
      {arxiu && (
        <Glass>
          {arxivades.map((t) => (
            <View key={t.id} style={s.row}>
              <T faint style={{ flex: 1 }}>{t.title}</T>
              <Chip label="Recuperar" onPress={() => updateTask(t.id, { archived: false })} />
            </View>
          ))}
        </Glass>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  input: { color: C.text, fontFamily: sans, fontSize: 16, paddingVertical: 8, outlineStyle: 'none' } as any,
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9 },
  box: { width: 20, height: 20, borderRadius: 7, borderWidth: 1.2, borderColor: C.soft },
  boxOn: { backgroundColor: C.ok, borderColor: C.ok },
  acc: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingLeft: 32, paddingBottom: 10 },
});
