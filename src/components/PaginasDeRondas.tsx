import { useRef, useState } from 'react';
import {
  ScrollView,
  type ScrollViewInstance,
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import type { Partida, RondaJugada } from '@/domain/types';
import { es } from '@/i18n/es';
import { iconos } from '@/theme/iconos';
import { crearEstilos } from '@/theme/tema';
import { espacios, tipografia } from '@/theme/tokens';

import { BotonIcono } from './BotonIcono';
import { TarjetaDeRonda } from './TarjetaDeRonda';

/** Con mas rondas que esto, los puntitos no entran y queda solo el texto. */
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
}

/**
 * Las rondas de la partida, una por pantalla (cambio 100). Se pasa de una a otra
 * deslizando de costado o con las flechas, y SIGUIENTE desliza sola a la nueva.
 * Arriba, «Ronda 3 de 7» y un puntito por ronda.
 *
 * Abre en la ronda en juego. Una cerrada se ve entera y se corrige tocando a un
 * participante (RF-709); las que faltan se ven bloqueadas.
 */
export function PaginasDeRondas({ partida, rondas, onTocarParticipante, onSiguiente, onTocarObjetivo }: Props) {
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
  const titulo =
    ronda === undefined
      ? ''
      : partida.plantilla.rondasIlimitadas
        ? es.ronda.titulo(ronda.numero)
        : es.partida.rondaDeTotal(ronda.numero, rondas.length);

  return (
    <View style={styles.contenedor}>
      <View style={styles.indicador}>
        <BotonIcono
          icono={iconos.atras}
          etiqueta={es.partida.rondaAnterior}
          tamano={32}
          deshabilitado={actual === 0}
          onPress={() => ir(actual - 1)}
        />
        <View style={styles.centro}>
          <Text accessibilityLiveRegion="polite" style={styles.titulo}>
            {titulo}
          </Text>
          {rondas.length <= MAXIMO_DE_PUNTOS && (
            <View style={styles.puntos} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              {rondas.map((otra, i) => (
                <View
                  key={otra.numero}
                  style={[
                    styles.punto,
                    otra.estado === 'cerrada' && styles.puntoCerrada,
                    otra.estado === 'en_curso' && styles.puntoEnCurso,
                    i === actual && styles.puntoActual,
                  ]}
                />
              ))}
            </View>
          )}
        </View>
        <BotonIcono
          icono={iconos.adelante}
          etiqueta={es.partida.rondaSiguiente}
          tamano={32}
          deshabilitado={actual === rondas.length - 1}
          onPress={() => ir(actual + 1)}
        />
      </View>

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
        {rondas.map((otra, i) => (
          <ScrollView key={otra.numero} style={{ width }} contentContainerStyle={styles.pagina}>
            <TarjetaDeRonda
              ronda={otra}
              partida={partida}
              expandida
              onTocarParticipante={(participanteId) => onTocarParticipante(otra.numero, participanteId)}
              onTocarObjetivo={onTocarObjetivo && (() => onTocarObjetivo(otra.numero))}
              onSiguiente={async () => {
                const avanzo = await onSiguiente(otra.numero);
                if (avanzo) ir(i + 1);
                return avanzo;
              }}
            />
          </ScrollView>
        ))}
      </ScrollView>
    </View>
  );
}

const useEstilos = crearEstilos((colores) => ({
  contenedor: { flex: 1 },
  indicador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacios.sm,
    paddingHorizontal: espacios.xl,
    paddingTop: espacios.md,
  },
  centro: { flex: 1, alignItems: 'center', gap: espacios.xs },
  titulo: { ...tipografia.cuerpoFuerte, color: colores.tinta },
  puntos: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 },
  punto: { width: 7, height: 7, borderRadius: 4, borderWidth: 1.5, borderColor: colores.linea },
  puntoCerrada: { backgroundColor: colores.grisMedio, borderColor: colores.grisMedio },
  puntoEnCurso: { borderColor: colores.tinta },
  puntoActual: { width: 18, backgroundColor: colores.acento, borderColor: colores.borde },
  pagina: { padding: espacios.xl },
}));
