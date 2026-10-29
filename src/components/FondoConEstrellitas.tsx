import { useMemo, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, G, Line, Path } from 'react-native-svg';

import { crearEstilos, useTema } from '@/theme/tema';

type Forma = 'destello' | 'punto' | 'aro' | 'cruz' | 'flor';

interface Adorno {
  forma: Forma;
  x: number;
  y: number;
  /** Escala de la forma: el destello mide 20 a escala 1. */
  escala: number;
  /** Mas o menos marcada: dos tonos del mismo color. */
  opacidad: number;
}

/** Una celda por adorno: asi quedan repartidos sin amontonarse. */
const CELDA = 68;
/** Cuantas celdas quedan vacias, para que no parezca una grilla. */
const VACIAS = 0.25;

/** Sobre todo estrellitas, como la lamina «Fondos». */
const SORTEO: Forma[] = ['destello', 'destello', 'destello', 'destello', 'punto', 'punto', 'aro', 'cruz', 'flor'];

function sortear<T>(opciones: readonly T[]): T {
  return opciones[Math.floor(Math.random() * opciones.length)]!;
}

/** Al azar cada vez que se arma la pantalla, pero fijo mientras se ve. */
function repartir(ancho: number, alto: number): Adorno[] {
  const adornos: Adorno[] = [];
  for (let y = 0; y < alto; y += CELDA) {
    for (let x = 0; x < ancho; x += CELDA) {
      if (Math.random() < VACIAS) continue;
      const forma = sortear(SORTEO);
      adornos.push({
        forma,
        x: x + CELDA * (0.2 + Math.random() * 0.6),
        y: y + CELDA * (0.2 + Math.random() * 0.6),
        escala: forma === 'destello' ? 0.9 + Math.random() * 1.1 : 0.9 + Math.random() * 0.6,
        opacidad: Math.random() < 0.6 ? 1 : 0.55,
      });
    }
  }
  return adornos;
}

function Dibujo({ forma, x, y, escala, color }: Omit<Adorno, 'opacidad'> & { color: string }) {
  const t = `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${escala.toFixed(2)})`;
  switch (forma) {
    case 'destello':
      return <Path transform={t} d="M0 -10 Q1.6 -1.6 10 0 Q1.6 1.6 0 10 Q-1.6 1.6 -10 0 Q-1.6 -1.6 0 -10 Z" fill={color} />;
    case 'punto':
      return <Circle transform={t} r={2.4} fill={color} />;
    case 'aro':
      return <Circle transform={t} r={6} fill="none" stroke={color} strokeWidth={3} />;
    case 'cruz':
      return (
        <G transform={t} stroke={color} strokeWidth={3} strokeLinecap="round">
          <Line x1={-5} y1={-5} x2={5} y2={5} />
          <Line x1={5} y1={-5} x2={-5} y2={5} />
        </G>
      );
    case 'flor':
      return (
        <G transform={t} fill={color}>
          {[0, 60, 120, 180, 240, 300].map((grados) => {
            const a = (grados * Math.PI) / 180;
            return <Circle key={grados} cx={5 * Math.cos(a)} cy={5 * Math.sin(a)} r={4.2} />;
          })}
          <Circle r={4} />
        </G>
      );
  }
}

/**
 * Estrellitas y formitas tono sobre tono, repartidas al azar detras de la
 * pantalla (cambio 118, solo en el Home), parecido a la lamina «Fondos». El
 * color es la linea del tema, asi sigue al fondo. Va detras de todo y no se toca.
 */
export function FondoConEstrellitas() {
  const styles = useEstilos();
  const { colores } = useTema();
  const [lugar, setLugar] = useState<{ ancho: number; alto: number } | null>(null);
  const adornos = useMemo(() => (lugar === null ? [] : repartir(lugar.ancho, lugar.alto)), [lugar]);

  const medir = (evento: LayoutChangeEvent) => {
    const { width, height } = evento.nativeEvent.layout;
    // Solo si cambia de verdad: si no, cada medida volveria a sortear.
    if (lugar === null || Math.abs(lugar.ancho - width) > 1 || Math.abs(lugar.alto - height) > 1) {
      setLugar({ ancho: width, alto: height });
    }
  };

  return (
    <View
      onLayout={medir}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.fondo}
    >
      {lugar !== null && (
        <Svg width={lugar.ancho} height={lugar.alto}>
          {adornos.map(({ opacidad, ...adorno }, i) => (
            <G key={i} opacity={opacidad}>
              <Dibujo {...adorno} color={colores.linea} />
            </G>
          ))}
        </Svg>
      )}
    </View>
  );
}

const useEstilos = crearEstilos(() => ({
  fondo: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
}));
