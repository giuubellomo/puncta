import { useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  type ScrollViewInstance,
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { haySiguienteRonda } from '@/domain/rondas';
import type { Partida, RondaJugada } from '@/domain/types';
import { es } from '@/i18n/es';
import { iconos } from '@/theme/iconos';
import { crearEstilos } from '@/theme/tema';
import { AREA_TOCABLE_MINIMA, espacios, fuentes, tipografia } from '@/theme/tokens';

import { Boton } from './Boton';
import { BotonSiguiente, TarjetaDeRonda } from './TarjetaDeRonda';

/** Con mas rondas que esto, los puntitos no entran y quedan solo las flechas. */
const MAXIMO_DE_PUNTOS = 12;

interface Props {
  partida: Partida;
  /** Las de la base y, con rondas ilimitadas, la bloqueada que sigue. */
  rondas: RondaJugada[];
  /** Tocar a un participante en la ronda en juego o en una cerrada: abre el popup de carga. */
  onTocarParticipante: (numeroRonda: number, participanteId: string) => void;
  /**
   * SIGUIENTE: cierra la ronda en juego. Despues se pasa sola a la pagina de la
   * nueva, salvo que de false (no se cerro: cambio 120).
   */
  onSiguiente: (numeroRonda: number) => Promise<boolean>;
  /** Cambio 119: si la plantilla lo pide, tocar el objetivo de una ronda lo deja escribir. */
  onTocarObjetivo?: (numeroRonda: number) => void;
  /** TERMINAR PARTIDA: abre la confirmacion. */
  onTerminar: () => void;
}

/**
 * Las rondas de la partida, una por pantalla (cambio 100). Se pasa de una a otra
 * deslizando de costado o con las flechas de los puntitos, que van entre la
 * cabecera y la lista (cambio 125). SIGUIENTE desliza sola a la nueva.
 *
 * Abajo, fijo (cambio 125): SIGUIENTE en la ronda en juego, «Ir a la ronda en
 * juego» mirando otra, o TERMINAR PARTIDA en la ultima de rondas fijas. Debajo,
 * «Terminar partida» como link.
 */
export function PaginasDeRondas({ partida, rondas, onTocarParticipante, onSiguiente, onTocarObjetivo, onTerminar }: Props) {
  const styles = useEstilos();
  const { width } = useWindowDimensions();
  const paginas = useRef<ScrollViewInstance>(null);
  const enCurso = rondas.findIndex((ronda) => ronda.estado === 'en_curso');
  // Sin ronda en juego (se cerro la ultima de rondas fijas), la ultima.
  const inicial = enCurso === -1 ? rondas.length - 1 : enCurso;
  const [actual, setActual] = useState(inicial);
  const ubicada = useRef(false);

  const ir = (indice: number) => {
    const destino = Math.max(0, Math.min(rondas.length - 1, indice));
    paginas.current?.scrollTo({ x: destino * width, animated: true });
    setActual(destino);
  };

  const alDeslizar = (evento: NativeSyntheticEvent<NativeScrollEvent>) => {
    const indice = Math.round(evento.nativeEvent.contentOffset.x / width);
    if (indice !== actual && indice >= 0 && indice < rondas.length) setActual(indice);
  };

  const ronda = rondas[actual];
  // Con rondas ilimitadas no hay un total: solo «Ronda 3».
  const posicion = (otra: RondaJugada) =>
    partida.plantilla.rondasIlimitadas ? es.ronda.titulo(otra.numero) : es.partida.rondaDeTotal(otra.numero, rondas.length);

  const navegacion = (otra: RondaJugada) => (
    <View style={styles.navegacion} accessibilityLabel={posicion(otra)}>
      <Flecha
        icono={iconos.atras}
        etiqueta={es.partida.rondaAnterior}
        deshabilitada={actual === 0}
        onPress={() => ir(actual - 1)}
      />
      {rondas.length <= MAXIMO_DE_PUNTOS ? (
        <View style={styles.puntos} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {rondas.map((cada, i) => (
            <View
              key={cada.numero}
              style={[
                styles.punto,
                cada.estado === 'cerrada' && styles.puntoCerrada,
                cada.estado === 'en_curso' && styles.puntoEnCurso,
                i === actual && styles.puntoActual,
              ]}
            />
          ))}
        </View>
      ) : (
        <Text style={styles.posicion}>{posicion(otra)}</Text>
      )}
      <Flecha
        icono={iconos.adelante}
        etiqueta={es.partida.rondaSiguiente}
        deshabilitada={actual === rondas.length - 1}
        onPress={() => ir(actual + 1)}
      />
    </View>
  );

  const enLaRondaEnJuego = ronda?.estado === 'en_curso';
  const conSiguiente = ronda !== undefined && enLaRondaEnJuego && haySiguienteRonda(partida, ronda.numero);
  // En la ultima de rondas fijas no hay SIGUIENTE: el boton grande es terminar.
  const terminarEsElBoton = enLaRondaEnJuego && !conSiguiente;

  return (
    <View style={styles.contenedor}>
      <ScrollView
        ref={paginas}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={alDeslizar}
        scrollEventThrottle={16}
        // La primera vez que tiene ancho, se para en la ronda en juego sin animar.
        onLayout={() => {
          if (ubicada.current) return;
          ubicada.current = true;
          paginas.current?.scrollTo({ x: inicial * width, animated: false });
        }}
      >
        {rondas.map((otra) => (
          <ScrollView key={otra.numero} style={{ width }} contentContainerStyle={styles.pagina}>
            <TarjetaDeRonda
              ronda={otra}
              partida={partida}
              expandida
              onTocarParticipante={(participanteId) => onTocarParticipante(otra.numero, participanteId)}
              onTocarObjetivo={onTocarObjetivo && (() => onTocarObjetivo(otra.numero))}
              navegacion={navegacion(otra)}
            />
          </ScrollView>
        ))}
      </ScrollView>

      <View style={styles.pie}>
        {conSiguiente ? (
          // Una por ronda: al pasar a la siguiente arranca de cero.
          <BotonSiguiente
            key={ronda.numero}
            ronda={ronda}
            partida={partida}
            onSiguiente={async () => {
              const avanzo = await onSiguiente(ronda.numero);
              if (avanzo) ir(actual + 1);
              return avanzo;
            }}
          />
        ) : terminarEsElBoton ? (
          <Boton titulo={es.partida.terminarPartida} onPress={onTerminar} />
        ) : (
          enCurso !== -1 && (
            <Boton titulo={es.partida.irALaRondaEnJuego} variante="secundario" onPress={() => ir(enCurso)} />
          )
        )}
        {!terminarEsElBoton && (
          <Pressable accessibilityRole="button" onPress={onTerminar} hitSlop={espacios.sm} style={styles.link}>
            <Text style={styles.textoLink}>{es.partida.terminarPartida}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

interface PropsFlecha {
  icono: string;
  etiqueta: string;
  deshabilitada: boolean;
  onPress: () => void;
}

/** Una flecha chica, sin borde: tambien se puede deslizar, asi que no compite con la cabecera. */
function Flecha({ icono, etiqueta, deshabilitada, onPress }: PropsFlecha) {
  const styles = useEstilos();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityState={{ disabled: deshabilitada }}
      disabled={deshabilitada}
      onPress={onPress}
      style={({ pressed }) => [styles.flecha, pressed && styles.presionada]}
    >
      <Text style={[styles.textoFlecha, deshabilitada && styles.flechaApagada]}>{icono}</Text>
    </Pressable>
  );
}

const useEstilos = crearEstilos((colores) => ({
  contenedor: { flex: 1 },
  pagina: { paddingHorizontal: espacios.xl, paddingTop: espacios.xs, paddingBottom: espacios.lg },
  navegacion: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: espacios.xs },
  flecha: { width: AREA_TOCABLE_MINIMA, height: 32, alignItems: 'center', justifyContent: 'center' },
  textoFlecha: { fontSize: 24, lineHeight: 28, color: colores.grisOscuro, fontFamily: fuentes.cuerpoBold },
  flechaApagada: { color: colores.linea },
  presionada: { opacity: 0.6 },
  posicion: { ...tipografia.secundario, color: colores.grisOscuro },
  puntos: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 6, flexShrink: 1 },
  punto: { width: 7, height: 7, borderRadius: 4, borderWidth: 1.5, borderColor: colores.linea },
  puntoCerrada: { backgroundColor: colores.grisMedio, borderColor: colores.grisMedio },
  puntoEnCurso: { borderColor: colores.tinta },
  puntoActual: { width: 18, backgroundColor: colores.acento, borderColor: colores.borde },
  pie: {
    gap: espacios.xs,
    paddingHorizontal: espacios.xl,
    paddingTop: espacios.sm,
    paddingBottom: espacios.xs,
  },
  link: { alignSelf: 'center', paddingVertical: espacios.xxs },
  textoLink: {
    ...tipografia.cuerpoFuerte,
    fontSize: 14,
    color: colores.grisOscuro,
    textDecorationLine: 'underline',
  },
}));
