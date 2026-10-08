// Fons marí ambiental: cel + horitzó + mar amb onades lentes.
// Canvia segons l'hora (madrugada, alba, dia, capvespre, nit) i el temps (pluja, vent, núvols).
// Al web (iPhone) es mostren vídeos reals del mar (Pexels, llicència lliure) amb fos suau entre escenes.
// El degradat queda a sota com a reserva mentre carrega o si el mòbil bloqueja el vídeo (mode estalvi).
import { LinearGradient } from 'expo-linear-gradient';
import { createElement, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Platform, StyleSheet, View } from 'react-native';

const V = 'https://videos.pexels.com/video-files/';
const VIDEOS = {
  dia: V + '30143154/12926122_960_540_30fps.mp4',
  nuvol: V + '31584683/13459585_960_540_30fps.mp4',
  alba: V + '31292289/13361163_960_540_30fps.mp4',
  capvespre: V + '33251147/14166153_960_540_24fps.mp4',
  nit: V + '32597068/13899852_960_540_24fps.mp4',
  madrugada: V + '34743427/14728605_540_960_30fps.mp4',
  boira: V + '31154555/13311270_540_960_30fps.mp4',
  pluja: V + '34270428/14520083_960_540_30fps.mp4',
  tempesta: V + '30884729/13205920_960_540_30fps.mp4',
};

function triaVideo(f: Fase, t?: Temps): string {
  const fosc = f === 'nit' || f === 'madrugada';
  if (t?.cel === 'tempesta' || (t && t.vent >= 45 && !fosc)) return VIDEOS.tempesta;
  if (t?.cel === 'pluja' && !fosc) return VIDEOS.pluja;
  if (t?.cel === 'boira' && !fosc) return VIDEOS.boira;
  if (f === 'alba') return VIDEOS.alba;
  if (f === 'capvespre') return VIDEOS.capvespre;
  if (f === 'nit') return VIDEOS.nit;
  if (f === 'madrugada') return VIDEOS.madrugada;
  return t?.cel === 'nuvol' ? VIDEOS.nuvol : VIDEOS.dia;
}

/** Dos vídeos superposats: el nou entra amb un fos de 2,5 s sobre l'anterior. */
function VideoMar({ src }: { src: string }) {
  const [capes, setCapes] = useState<{ src: string; visible: boolean }[]>([{ src, visible: false }]);
  useEffect(() => {
    setCapes((c) => (c[c.length - 1]?.src === src ? c : [...c.slice(-1), { src, visible: false }]));
  }, [src]);
  return (
    <View style={StyleSheet.absoluteFill}>
      {capes.map((c, i) =>
        createElement('video', {
          key: c.src, src: c.src, autoPlay: true, muted: true, loop: true, playsInline: true, preload: 'auto',
          'webkit-playsinline': 'true',
          // iOS només reprodueix automàticament si l'atribut «muted» existeix de veritat a l'HTML
          ref: (el: any) => { if (el && !el.dataset.ok) { el.dataset.ok = '1'; el.muted = true; el.setAttribute('muted', ''); el.setAttribute('playsinline', ''); el.play?.().catch(() => {}); } },
          onLoadedData: () => setCapes((cs) => cs.map((x) => (x.src === c.src ? { ...x, visible: true } : x))),
          style: {
            position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
            opacity: c.visible ? 1 : 0, transition: 'opacity 2.5s ease', zIndex: i,
          },
        }),
      )}
    </View>
  );
}
import type { Temps } from './weather';

type Fase = 'madrugada' | 'alba' | 'dia' | 'capvespre' | 'nit';

const PALETA: Record<Fase, { cel: [string, string, string]; mar: [string, string]; ona: string; llum: string }> = {
  madrugada: { cel: ['#03080f', '#081726', '#0e2236'], mar: ['#0a1a2a', '#02070d'], ona: 'rgba(120,160,200,0.07)', llum: 'rgba(160,190,230,0.10)' },
  alba:      { cel: ['#1d2b4a', '#7a6a8f', '#e8a98a'], mar: ['#3a4f6e', '#0d1e33'], ona: 'rgba(255,200,170,0.10)', llum: 'rgba(255,190,150,0.35)' },
  dia:       { cel: ['#3f7fb5', '#7fb2d6', '#cfe3ee'], mar: ['#2f6f96', '#0b3352'], ona: 'rgba(255,255,255,0.09)', llum: 'rgba(255,255,255,0.28)' },
  capvespre: { cel: ['#2a1f45', '#a5546a', '#f0a265'], mar: ['#5a3f5a', '#14182c'], ona: 'rgba(255,170,120,0.10)', llum: 'rgba(255,160,100,0.40)' },
  nit:       { cel: ['#050a14', '#0b1a2e', '#16304a'], mar: ['#0c2236', '#03080f'], ona: 'rgba(140,180,220,0.06)', llum: 'rgba(200,220,255,0.14)' },
};
const GRIS = { cel: ['#2b3540', '#4b5866', '#6f7c88'] as [string, string, string], mar: ['#33434f', '#0e1820'] as [string, string] };

function fase(now: Date, t?: Temps): Fase {
  const h = now.getHours() + now.getMinutes() / 60;
  const s = t?.sortida ? t.sortida.getHours() + t.sortida.getMinutes() / 60 : 7.8;
  const p = t?.posta ? t.posta.getHours() + t.posta.getMinutes() / 60 : 19.2;
  if (h >= s - 0.75 && h < s + 1) return 'alba';
  if (h >= s + 1 && h < p - 1) return 'dia';
  if (h >= p - 1 && h < p + 0.6) return 'capvespre';
  if (h >= 1 && h < s - 0.75) return 'madrugada';
  return 'nit';
}

const { width: W, height: H } = Dimensions.get('window');

function Ona({ top, color, dur, amp, delay }: { top: number; color: string; dur: number; amp: number; delay: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const a = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: dur, delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    a.start();
    return () => a.stop();
  }, [dur]);
  return (
    <Animated.View
      style={{
        position: 'absolute', left: -W * 0.25, width: W * 1.5, top, height: 2 + amp / 3,
        borderRadius: 999, backgroundColor: color,
        transform: [
          { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [-amp * 2, amp * 2] }) },
          { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, amp / 2] }) },
          { scaleX: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) },
        ],
      }}
    />
  );
}

function Pluja({ forta }: { forta: boolean }) {
  const gotes = useMemo(() => Array.from({ length: forta ? 70 : 40 }, () => ({
    x: Math.random() * W, d: 900 + Math.random() * 700, l: 14 + Math.random() * 16, delay: Math.random() * 1500,
  })), [forta]);
  return <>{gotes.map((g, i) => <Gota key={i} {...g} />)}</>;
}
function Gota({ x, d, l, delay }: { x: number; d: number; l: number; delay: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const a = Animated.loop(Animated.timing(v, { toValue: 1, duration: d, delay, easing: Easing.linear, useNativeDriver: true }));
    a.start(); return () => a.stop();
  }, []);
  return (
    <Animated.View style={{
      position: 'absolute', left: x, top: -40, width: 1, height: l, backgroundColor: 'rgba(220,235,255,0.28)',
      transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, H + 80] }) }, { rotate: '8deg' }],
    }} />
  );
}

export function Sea({ temps }: { temps?: Temps }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(id); }, []);

  const f = fase(now, temps);
  const p = PALETA[f];
  const gris = temps && (temps.cel === 'pluja' || temps.cel === 'tempesta' || temps.cel === 'boira');
  const cel = gris && (f === 'dia' || f === 'alba') ? GRIS.cel : p.cel;
  const mar = gris && (f === 'dia' || f === 'alba') ? GRIS.mar : p.mar;
  const vent = temps ? Math.min(temps.vent, 50) / 50 : 0.2; // 0..1
  const horitzo = H * 0.42;

  // Fos suau quan canvia la fase o el temps
  const fade = useRef(new Animated.Value(0)).current;
  const clau = `${f}-${temps?.cel}`;
  useEffect(() => { fade.setValue(0); Animated.timing(fade, { toValue: 1, duration: 2500, useNativeDriver: true }).start(); }, [clau]);

  const ones = Array.from({ length: 9 }, (_, i) => ({
    top: horitzo + 8 + i * i * 7 + i * 10,
    dur: (9000 - i * 500) * (1 - vent * 0.55),
    amp: (4 + i * 3) * (0.6 + vent),
    delay: i * 400,
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade }]}>
        <LinearGradient colors={cel} style={{ position: 'absolute', left: 0, right: 0, top: 0, height: horitzo + 2 }} />
        <LinearGradient colors={mar} style={{ position: 'absolute', left: 0, right: 0, top: horitzo, bottom: 0 }} />
        {/* reflex de llum sobre l'aigua */}
        <LinearGradient
          colors={['transparent', p.llum, 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
          style={{ position: 'absolute', left: W * 0.2, right: W * 0.2, top: horitzo, height: H * 0.25, opacity: gris ? 0.3 : 1 }}
        />
        {ones.map((o, i) => <Ona key={i} {...o} color={p.ona} />)}
      </Animated.View>
      {Platform.OS === 'web' && <VideoMar src={triaVideo(f, temps)} />}
      {Platform.OS !== 'web' && temps && (temps.cel === 'pluja' || temps.cel === 'tempesta') && <Pluja forta={temps.cel === 'tempesta'} />}
      {/* vel per garantir la lectura */}
      <LinearGradient colors={['rgba(4,10,18,0.45)', 'rgba(4,10,18,0.25)', 'rgba(4,10,18,0.6)']} style={StyleSheet.absoluteFill} />
    </View>
  );
}
