import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View, useWindowDimensions } from 'react-native';

import { crearEstilos, useTema } from '@/theme/tema';

/**
 * Los estallidos (cambio 129): donde, en fracciones del ancho y del alto de la
 * pantalla, y cuando, en milisegundos desde que arranca. Uno despues del otro,
 * repartidos para que entre todos llenen la pantalla.
 */
const ESTALLIDOS = [
  { x: 0.3, y: 0.25, ms: 0 },
  { x: 0.72, y: 0.35, ms: 380 },
  { x: 0.45, y: 0.55, ms: 760 },
  { x: 0.2, y: 0.62, ms: 1100 },
];
const POR_ESTALLIDO = 60;
/** Larga: el confeti cae lento mientras aparecen los demas (cambio 105). */
const DURACION = 5000;
/** Cuantos puntos del recorrido se calculan: entre uno y otro la animacion va derecho. */
const PUNTOS = 48;
/** La fisica del papel, en puntos por segundo: el aire frena, la gravedad tira y hay una velocidad tope. */
const GRAVEDAD = 900;
const FRENO_DEL_AIRE = 3.2;
const VELOCIDAD_TOPE = 170;

interface Particula {
  /** De donde sale: el centro de su estallido. */
  x: number;
  y: number;
  /** El recorrido desde donde sale, en `PUNTOS` momentos entre que sale y el final. */
  xs: number[];
  ys: number[];
  giro: number;
  ancho: number;
  alto: number;
  /** Cual de los colores de los participantes. */
  tono: number;
  /** Cuando sale, de 0 a 1: el de su estallido y un poquito mas. */
  inicio: number;
  /** Se da vuelta como papel: cuantas veces y desde donde arranca. */
  vueltas: number;
  fase: number;
}

interface Props {
  /** Cuando pasa a true, explota una vez. */
  activo: boolean;
}

/**
 * El confeti del podio (cambio 105; varios estallidos por toda la pantalla desde
 * el 129). Va encima de todo: cuatro estallidos chicos en distintos lugares, uno
 * despues del otro. Cada papelito sale disparado hacia un costado y hacia arriba,
 * frena con el aire, cae acelerando hasta su velocidad tope mientras se hamaca y
 * se da vuelta como papel, y se desvanece al final. El recorrido se calcula una
 * vez al armar (`recorrido`) y la animacion lo sigue con transform y opacidad, en
 * el driver nativo: no lo calcula JavaScript cuadro por cuadro.
 *
 * Es decoracion: el lector de pantalla no lo ve y no se puede tocar.
 */
export function Confeti({ activo }: Props) {
  const styles = useEstilos();
  const { coloresDeParticipantes: tonos } = useTema();
  const progreso = useRef(new Animated.Value(0)).current;
  const { width, height } = useWindowDimensions();
  const particulas = useMemo<Particula[]>(
    () =>
      ESTALLIDOS.flatMap((estallido, e) =>
        Array.from({ length: POR_ESTALLIDO }, (_, i) => {
          const angulo = Math.random() * Math.PI * 2;
          // Velocidad de salida, en puntos por segundo: el aire la frena enseguida.
          const fuerza = width * (0.9 + Math.random() * 2.2);
          const y = height * estallido.y;
          return {
            x: width * estallido.x,
            y,
            ...recorrido(
              // Hacia arriba un poco mas que hacia abajo: se abre como un abanico.
              Math.cos(angulo) * fuerza,
              Math.sin(angulo) * fuerza * 0.6 - height * (0.35 + Math.random() * 0.45),
              (DURACION - estallido.ms) / 1000,
            ),
            giro: (Math.random() - 0.5) * 1080,
            ancho: 6 + Math.random() * 5,
            alto: 9 + Math.random() * 8,
            tono: e * POR_ESTALLIDO + i,
            inicio: (estallido.ms + Math.random() * 90) / DURACION,
            vueltas: 4 + Math.random() * 6,
            fase: Math.random() * Math.PI * 2,
          };
        }),
      ),
    [width, height],
  );

  useEffect(() => {
    if (!activo) return;
    progreso.setValue(0);
    Animated.timing(progreso, {
      toValue: 1,
      duration: DURACION,
      easing: Easing.linear,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [activo, progreso]);

  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
      {particulas.map((p, i) => {
        const { inicio } = p;
        // El recorrido calculado, punto por punto desde que sale: frena con el aire,
        // cae acelerando hasta su velocidad tope y se hamaca a su ritmo.
        const momentos = [0, ...p.xs.map((_, k) => inicio + ((1 - inicio) * k) / (PUNTOS - 1))];
        const translateX = progreso.interpolate({ inputRange: momentos, outputRange: [0, ...p.xs], extrapolate: 'clamp' });
        const translateY = progreso.interpolate({ inputRange: momentos, outputRange: [0, ...p.ys], extrapolate: 'clamp' });
        // El giro arranca rapido con el empujon y se va calmando.
        const rotate = progreso.interpolate({
          inputRange: [0, inicio, inicio + (1 - inicio) * 0.25, 1],
          outputRange: ['0deg', '0deg', `${p.giro * 0.5}deg`, `${p.giro}deg`],
          extrapolate: 'clamp',
        });
        // Darse vuelta: el ancho va y viene entre el derecho y el reves.
        const scaleX = progreso.interpolate({
          inputRange: momentos.slice(1),
          outputRange: momentos.slice(1).map((t) => Math.cos(t * p.vueltas * Math.PI * 2 + p.fase)),
        });
        const opacity = progreso.interpolate({
          inputRange: [0, inicio, inicio + 0.01, 0.82, 1],
          outputRange: [0, 0, 1, 1, 0],
          extrapolate: 'clamp',
        });
        return (
          <Animated.View
            key={i}
            style={[
              styles.papelito,
              { left: p.x, top: p.y, width: p.ancho, height: p.alto, backgroundColor: tonos[p.tono % tonos.length], opacity },
              { transform: [{ translateX }, { translateY }, { rotate }, { scaleX }] },
            ]}
          />
        );
      })}
    </View>
  );
}

/**
 * Simula un papelito desde que sale con velocidad (vx, vy) durante `segundos`, a
 * 60 cuadros por segundo, y guarda `PUNTOS` posiciones repartidas en ese tiempo.
 * El aire frena las dos velocidades; la gravedad tira para abajo hasta la
 * velocidad tope; y cada uno se hamaca de costado con su propio ritmo y tamaño
 * (cambio 108: un vaiven igual para todos se veia como un sacudon).
 */
function recorrido(vx0: number, vy0: number, segundos: number): { xs: number[]; ys: number[] } {
  const dt = 1 / 60;
  const tope = VELOCIDAD_TOPE * (0.7 + Math.random() * 0.6);
  const hamaca = 6 + Math.random() * 16;
  const ritmo = 0.5 + Math.random() * 0.9;
  const fase = Math.random() * Math.PI * 2;
  let x = 0;
  let y = 0;
  let vx = vx0;
  let vy = vy0;
  const cuadros = Math.round(segundos / dt);
  const xs: number[] = [];
  const ys: number[] = [];
  for (let c = 0; c <= cuadros; c++) {
    const t = c * dt;
    if (c % Math.max(1, Math.round(cuadros / (PUNTOS - 1))) === 0 && xs.length < PUNTOS) {
      // La hamaca crece a medida que frena: al salir disparado no se nota.
      const frenado = Math.min(1, t / 0.6);
      xs.push(x + Math.sin(t * ritmo * Math.PI * 2 + fase) * hamaca * frenado);
      ys.push(y);
    }
    const freno = Math.exp(-FRENO_DEL_AIRE * dt);
    vx *= freno;
    vy = Math.min(vy * freno + GRAVEDAD * dt, tope);
    x += vx * dt;
    y += vy * dt;
  }
  while (xs.length < PUNTOS) {
    xs.push(xs[xs.length - 1]!);
    ys.push(ys[ys.length - 1]!);
  }
  return { xs, ys };
}

const useEstilos = crearEstilos(() => ({
  papelito: { position: 'absolute', borderRadius: 1.5 },
}));
