import type { ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native';

export const C = {
  text: '#f3f6f8',
  soft: 'rgba(243,246,248,0.72)',
  faint: 'rgba(243,246,248,0.45)',
  line: 'rgba(255,255,255,0.12)',
  glass: 'rgba(10,22,34,0.42)',
  glassStrong: 'rgba(8,18,28,0.72)',
  accent: '#9fd3e6',
  ok: '#a8dcc0',
  priv: '#e8877d', ocup: '#e9c76f', comp: '#8fd3a6',
};

export const serif = Platform.select({ ios: 'Georgia', web: "'Cormorant Garamond', Georgia, serif", default: 'serif' });
export const sans = Platform.select({ ios: 'System', web: "'Inter', -apple-system, system-ui, sans-serif", default: 'sans-serif' });

const blur: ViewStyle = Platform.OS === 'web' ? ({ backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' } as any) : {};

export function Glass({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[s.glass, blur, style]}>{children}</View>;
}

export function Label({ children, style }: { children: ReactNode; style?: TextStyle }) {
  return <Text style={[s.label, style]}>{children}</Text>;
}

export function T({ children, style, soft, faint }: { children: ReactNode; style?: TextStyle | TextStyle[]; soft?: boolean; faint?: boolean }) {
  return <Text style={[s.t, soft && { color: C.soft }, faint && { color: C.faint }, style as any]}>{children}</Text>;
}

export function Chip({ label, onPress, active }: { label: string; onPress?: () => void; active?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.chip, active && s.chipOn, pressed && { opacity: 0.6 }]}>
      <Text style={[s.chipT, active && { color: '#0b1a26' }]}>{label}</Text>
    </Pressable>
  );
}

export const blurStyle = blur;

const s = StyleSheet.create({
  glass: { backgroundColor: C.glass, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, borderColor: C.line, padding: 18 },
  label: { color: C.faint, fontSize: 11, letterSpacing: 2.2, fontFamily: sans, fontWeight: '600', marginBottom: 8 },
  t: { color: C.text, fontSize: 16, fontFamily: sans, lineHeight: 22 },
  chip: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, borderColor: C.line, backgroundColor: 'rgba(255,255,255,0.06)' },
  chipOn: { backgroundColor: C.text },
  chipT: { color: C.soft, fontSize: 13, fontFamily: sans },
});
