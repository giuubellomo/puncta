import { useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import {
  haySiguienteRonda,
  puedeCerrarRonda,
  puntajeDeReglaEnRonda,
  reglasDeLaRonda,
  reglasSinAsignar,
} from '@/domain/rondas';
import { esCanasta, minimoParaBajar } from '@/domain/canasta';
import { llegoHastaRonda } from '@/domain/objetivo';
import { ordenarPorTotalHastaRonda } from '@/domain/ranking';
import { mejoresDeRonda, puntajeCargado, totalHastaRonda } from '@/domain/scoring';
import type { Participante, Partida, Plantilla, RondaJugada } from '@/domain/types';
import { conSigno, es } from '@/i18n/es';
import { iconos } from '@/theme/iconos';
import { crearEstilos } from '@/theme/tema';
import { AREA_TOCABLE_MINIMA, espacios, fuentes, numerales, radios, tipografia } from '@/theme/tokens';

import { Avatar } from './Avatar';
import { Boton } from './Boton';
import { Card } from './Card';
import { Chip } from './Chip';

interface Props {
  ronda: RondaJugada;
  partida: Partida;
  /**
   * Tocar la fila de un participante, en la ronda en juego o en una cerrada
   * expandida: abre el popup de carga de esa ronda (7.4, 7.6).
   */
  onTocarParticipante?: (participanteId: string) => void;
  /** Una ronda cerrada abierta para corregirla (7.6). */
  expandida?: boolean;
  /** Tocar una ronda cerrada la expande o la vuelve a colapsar. */
  onAlternar?: () => void;
  /**
   * SIGUIENTE: cierra la ronda en juego y abre la que sigue (7.5). Da false si
   * no avanzo: se aviso que alguien llego al objetivo y se cerro el aviso (cambio 120).
   */
  onSiguiente?: () => Promise<boolean>;
  /** Cambio 119: el objetivo se escribe al jugar. Con esto, se toca para escribirlo. */
  onTocarObjetivo?: () => void;
}

/**
 * Una ronda de la partida (paso 7.1, RF-702): cerrada y colapsada, en juego y
 * expandida, o bloqueada. La en juego (paso 7.2, RF-703, RF-704) muestra el
 * objetivo, lo que valen las reglas y una fila por participante con su puntaje
 * de la ronda, sin botones de regla: las reglas se marcan en el popup (7.4).
 * A su derecha va el acumulado de la partida (paso 7.3, A-6). Al pie, SIGUIENTE
 * (paso 7.5, RF-706 a RF-708), salvo en la ultima ronda de rondas fijas.
 * Una cerrada se toca para expandirla y corregirla (paso 7.6, RF-709): sigue
 * cerrada, y la en juego sigue siendo la misma.
 */
export function TarjetaDeRonda({
  ronda,
  partida,
  onTocarParticipante,
  onSiguiente,
  expandida = false,
  onAlternar,
  onTocarObjetivo,
}: Props) {
  const styles = useEstilos();
  const titulo = es.ronda.titulo(ronda.numero);
  const completada = <Text style={styles.completada}>{`${iconos.tilde} ${es.partida.completada}`}</Text>;

  if (ronda.estado === 'cerrada' && expandida) {
    const cabecera = (
      <Cabecera ronda={ronda} partida={partida} titulo={titulo} marca={completada} onTocarObjetivo={onTocarObjetivo} />
    );
    return (
      <Card>
        {/* Sin onAlternar no se pliega (una ronda por pantalla, cambio 100): la cabecera no se toca. */}
        {onAlternar === undefined ? (
          cabecera
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: true }}
            accessibilityLabel={`${titulo}, ${es.partida.completada}`}
            onPress={onAlternar}
            style={({ pressed }) => [styles.cabeceraTocable, pressed && styles.presionada]}
          >
            {cabecera}
          </Pressable>
        )}
        <Filas ronda={ronda} partida={partida} onTocarParticipante={onTocarParticipante} />
        {/* Corregir no reabre la ronda: si quedo una regla sin asignar, solo se avisa. */}
        <View style={styles.corregida}>
          <ReglasSinAsignar ronda={ronda} partida={partida} />
        </View>
      </Card>
    );
  }

  if (ronda.estado === 'cerrada') {
    const resumen = resumenDeCerrada(ronda, partida);
    return (
      <Card
        estado="suave"
        style={styles.fila}
        onPress={onAlternar}
        etiqueta={[titulo, es.partida.completada, resumen].filter((texto) => texto !== null).join(', ')}
      >
        <View style={styles.textos}>
          <Text style={styles.titulo}>{titulo}</Text>
          {/* RNF-4: el resumen lleva puntajes («Cortó: −10 pts»). */}
          {resumen !== null && <Text style={[styles.detalle, numerales]}>{resumen}</Text>}
        </View>
        {completada}
      </Card>
    );
  }

  if (ronda.estado === 'bloqueada') {
    return (
      <Card estado="punteada">
        <Text style={[styles.titulo, styles.apagado]}>{titulo}</Text>
        <Text style={[styles.detalle, styles.apagado]}>{es.partida.bloqueada(ronda.numero - 1)}</Text>
      </Card>
    );
  }

  return (
    <Card estado="activa">
      <Cabecera
        ronda={ronda}
        partida={partida}
        titulo={titulo}
        marca={<Chip texto={es.partida.enJuego} variante="borde" />}
        onTocarObjetivo={onTocarObjetivo}
      />
      <Filas ronda={ronda} partida={partida} onTocarParticipante={onTocarParticipante} ordenadas />
      {onSiguiente !== undefined && haySiguienteRonda(partida, ronda.numero) && (
        <Siguiente ronda={ronda} partida={partida} onSiguiente={onSiguiente} />
      )}
    </Card>
  );
}

interface PropsCabecera {
  ronda: RondaJugada;
  partida: Partida;
  titulo: string;
  /** A la derecha del titulo: EN JUEGO o ✓ Completada. */
  marca: ReactNode;
  onTocarObjetivo?: () => void;
}

/** Titulo, objetivo y lo que valen las reglas, con la linea que la separa de las filas. */
function Cabecera({ ronda, partida, titulo, marca, onTocarObjetivo }: PropsCabecera) {
  const styles = useEstilos();
  const reglas = reglasConPuntaje(ronda, partida.plantilla);
  const objetivo =
    onTocarObjetivo === undefined ? (
      ronda.objetivo !== undefined && <Text style={styles.detalle}>{es.partida.objetivo(ronda.objetivo)}</Text>
    ) : (
      // Cambio 119: se escribe al jugar. Sin escribir todavia, la invitacion en el color de acento.
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          ronda.objetivo === undefined ? es.partida.escribirObjetivo : es.partida.cambiarObjetivo(ronda.objetivo)
        }
        onPress={onTocarObjetivo}
        hitSlop={espacios.xs}
        style={({ pressed }) => [styles.objetivoTocable, pressed && styles.presionada]}
      >
        <Text style={[styles.detalle, ronda.objetivo === undefined && styles.objetivoVacio]}>
          {ronda.objetivo === undefined ? es.partida.escribirObjetivo : es.partida.objetivo(ronda.objetivo)}
        </Text>
        <Text style={[styles.detalle, styles.objetivoVacio]}>{iconos.lapiz}</Text>
      </Pressable>
    );
  return (
    <View style={styles.cabecera}>
      <View style={styles.fila}>
        <Text accessibilityRole="header" style={[styles.titulo, styles.textos]}>
          {titulo}
        </Text>
        {marca}
      </View>
      {objetivo}
      {reglas.length > 0 && <Text style={[styles.reglas, numerales]}>{reglas.join(' · ')}</Text>}
    </View>
  );
}

interface PropsFilas extends Pick<Props, 'ronda' | 'partida' | 'onTocarParticipante'> {
  /**
   * La ronda en juego (cambio 91): de quien va ganando a quien va perdiendo por
   * el acumulado, y al cargar un puntaje las filas se deslizan a su lugar. Una
   * cerrada expandida queda en el orden de la partida.
   */
  ordenadas?: boolean;
}

/** Una fila por participante, con el acumulado hasta esta ronda (cambio 80). */
function Filas({ ronda, partida, onTocarParticipante, ordenadas = false }: PropsFilas) {
  const participantes = ordenadas ? ordenarPorTotalHastaRonda(partida, ronda.numero) : partida.participantes;
  return participantes.map((participante) => {
    const fila = (
      <FilaDeParticipante
        key={participante.id}
        participante={participante}
        puntaje={puntajeCargado(ronda, partida.plantilla, participante.id)}
        total={totalHastaRonda(partida, participante.id, ronda.numero)}
        reglas={detalleDeFila(ronda, partida, participante.id)}
        llego={llegoHastaRonda(partida, participante.id, ronda.numero)}
        onPress={onTocarParticipante && (() => onTocarParticipante(participante.id))}
      />
    );
    return ordenadas ? <Deslizable key={participante.id}>{fila}</Deslizable> : fila;
  });
}

/**
 * Cuando la fila cambia de lugar, arranca dibujada donde estaba y se desliza
 * hasta el nuevo. Con Animated y no con LayoutAnimation, que en web no hace nada.
 */
function Deslizable({ children }: { children: ReactNode }) {
  const desplazamiento = useRef(new Animated.Value(0)).current;
  const yAnterior = useRef<number | null>(null);

  function alMedir(evento: LayoutChangeEvent) {
    const { y } = evento.nativeEvent.layout;
    const antes = yAnterior.current;
    yAnterior.current = y;
    // La primera medida es donde aparece: no viene de ningun lado.
    if (antes === null || antes === y) return;
    desplazamiento.setValue(antes - y);
    Animated.timing(desplazamiento, {
      toValue: 0,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }

  return (
    <Animated.View onLayout={alMedir} style={{ transform: [{ translateY: desplazamiento }] }}>
      {children}
    </Animated.View>
  );
}

/** «Falta asignar: Bajó primero» (RF-706), o nada. */
function ReglasSinAsignar({ ronda, partida }: Pick<Props, 'ronda' | 'partida'>) {
  const styles = useEstilos();
  const sinAsignar = reglasSinAsignar(ronda, partida.plantilla);
  if (sinAsignar.length === 0) return null;
  return <Text style={styles.faltante}>{es.partida.faltanReglas(sinAsignar.map((regla) => regla.titulo))}</Text>;
}

/**
 * Habilitado segun `puedeCerrarRonda`. Mientras no, nombra las reglas sin
 * asignar (RF-706). Los puntajes que faltan no se avisan en texto (cambio 79):
 * se ven en las casillas vacias.
 */
function Siguiente({ ronda, partida, onSiguiente }: Required<Pick<Props, 'ronda' | 'partida' | 'onSiguiente'>>) {
  const styles = useEstilos();
  const [avanzando, setAvanzando] = useState(false);
  const [errorAlAvanzar, setErrorAlAvanzar] = useState(false);

  const { plantilla, participantes } = partida;
  const puede = puedeCerrarRonda(ronda, plantilla, participantes).puede;

  async function avanzar() {
    setAvanzando(true);
    setErrorAlAvanzar(false);
    try {
      // Si sale bien esta tarjeta pasa a ser la de una ronda cerrada y este
      // estado se desmonta: no hace falta volver `avanzando` a false.
      if (!(await onSiguiente())) setAvanzando(false);
    } catch {
      setErrorAlAvanzar(true);
      setAvanzando(false);
    }
  }

  return (
    <View style={styles.siguiente}>
      <Boton titulo={es.partida.siguiente} onPress={avanzar} deshabilitado={!puede || avanzando} />
      <ReglasSinAsignar ronda={ronda} partida={partida} />
      {errorAlAvanzar && <Text style={styles.faltante}>{es.comun.errorGuardar}</Text>}
    </View>
  );
}

interface PropsFila {
  participante: Participante;
  /** null: todavia no cargo. */
  puntaje: number | null;
  /** El acumulado de toda la partida, con esta ronda incluida (C-2). */
  total: number;
  /** Los titulos de las reglas que tiene marcadas en la ronda: «Bajó primero». */
  reglas: string[];
  /** Con el acumulado hasta esta ronda llego al objetivo: la casilla lleva una estrella (cambio 120). */
  llego: boolean;
  onPress?: () => void;
}

/**
 * Mockup 4 y 5: avatar, nombre y a la derecha la casilla con el puntaje de la
 * ronda. Sin cargar, la casilla queda punteada con una raya: un lugar vacio
 * que se toca para cargar. A-6: el acumulado a la derecha, mas chico y en gris.
 * Debajo del nombre, las reglas que se llevo en la ronda (cambio 77). Si llego
 * al objetivo, la casilla se pinta y lleva una estrella (cambio 120).
 */
function FilaDeParticipante({ participante, puntaje, total, reglas, llego, onPress }: PropsFila) {
  const styles = useEstilos();
  const vacia = puntaje === null;
  const valor = vacia ? es.partida.sinCargar : conSigno(puntaje);
  const contenido = (
    <>
      <Avatar tipo={participante.avatarTipo} valor={participante.avatarValor} nombre={participante.nombre} />
      <View style={styles.textos}>
        <Text style={styles.nombre}>{participante.nombre}</Text>
        {reglas.length > 0 && <Text style={styles.reglasDelJugador}>{reglas.join(' · ')}</Text>}
      </View>
      <View style={[styles.casilla, vacia && styles.casillaVacia, llego && styles.casillaLlego]}>
        {llego && (
          <Text allowFontScaling={false} style={styles.estrella}>
            {iconos.estrella}
          </Text>
        )}
        <Text style={[styles.puntaje, numerales, vacia && styles.puntajeVacio, llego && styles.puntajeLlego]}>
          {vacia ? iconos.raya : valor}
        </Text>
      </View>
      <Text style={[styles.total, numerales]}>{conSigno(total)}</Text>
    </>
  );
  const etiqueta = [
    es.partida.puntajeDe(participante.nombre, valor, conSigno(total)),
    ...(llego ? [es.partida.llegoAlObjetivo] : []),
    ...reglas,
  ].join(', ');

  if (onPress === undefined) {
    return (
      <View accessible accessibilityLabel={etiqueta} style={styles.participante}>
        {contenido}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      onPress={onPress}
      style={({ pressed }) => [styles.participante, pressed && styles.presionada]}
    >
      {contenido}
    </Pressable>
  );
}

/**
 * Lo que va debajo del nombre: las reglas que se llevo en la ronda (cambio 77).
 * En la Canasta (cambio 101) las reglas son el desglose de la mano y no se
 * nombran: en la ronda en juego va lo minimo para bajar, segun lo que llevaba.
 */
function detalleDeFila(ronda: RondaJugada, partida: Partida, participanteId: string): string[] {
  if (!esCanasta(partida.plantilla)) return reglasMarcadas(ronda, partida.plantilla, participanteId);
  if (ronda.estado !== 'en_curso') return [];
  return [es.canasta.bajaCon(minimoParaBajar(totalHastaRonda(partida, participanteId, ronda.numero - 1)))];
}

/** Las reglas de la ronda que tiene marcadas un participante, en el orden de la plantilla. */
function reglasMarcadas(ronda: RondaJugada, plantilla: Plantilla, participanteId: string): string[] {
  const marcas = ronda.entradas.find((e) => e.participanteId === participanteId)?.marcas ?? {};
  return reglasDeLaRonda(plantilla, ronda.numero)
    .filter((regla) => regla.id in marcas)
    .map((regla) => regla.titulo);
}

/**
 * «Bajó primero: −20 pts», por cada regla de alcance `todas` de esa ronda, con
 * lo que vale ahi (cambio 72). Las opcionales no se nombran: el mockup 4 no las
 * lista en la tarjeta, aparecen en el popup de carga.
 */
function reglasConPuntaje(ronda: RondaJugada, plantilla: Plantilla): string[] {
  return reglasDeLaRonda(plantilla, ronda.numero)
    .filter((regla) => regla.alcance === 'todas')
    .map((regla) => es.partida.reglaConPuntaje(regla.titulo, puntajeDeReglaEnRonda(plantilla, ronda.numero, regla.id)));
}

/**
 * Mockup 4: «2 piernas · Bajó primero: −10 pts · Cortó: −10 pts», con las reglas
 * que hay que asignar en esa ronda y lo que valen ahi. Sin objetivo ni reglas
 * (mockup 5, Simple): quien hizo el mejor puntaje.
 */
function resumenDeCerrada(ronda: RondaJugada, partida: Partida): string | null {
  const { plantilla } = partida;
  const reglas = reglasConPuntaje(ronda, plantilla);
  const partes = ronda.objetivo === undefined ? reglas : [ronda.objetivo, ...reglas];
  if (partes.length > 0) return partes.join(' · ');

  const mejores = mejoresDeRonda(ronda, plantilla);
  if (mejores === null) return null;
  const nombres = mejores.participanteIds.map(
    (id) => partida.participantes.find((participante) => participante.id === id)?.nombre ?? '',
  );
  return es.partida.mejorPuntaje(nombres, mejores.puntaje);
}

const useEstilos = crearEstilos((colores) => ({
  fila: { flexDirection: 'row', alignItems: 'center', gap: espacios.sm },
  textos: { flex: 1, gap: espacios.xxs },
  titulo: { ...tipografia.tituloChico, color: colores.tinta },
  detalle: { ...tipografia.secundario, color: colores.grisOscuro },
  objetivoTocable: { flexDirection: 'row', alignItems: 'center', gap: espacios.xxs, alignSelf: 'flex-start' },
  objetivoVacio: { color: colores.acento, fontFamily: fuentes.cuerpoBold },
  completada: { ...tipografia.chico, color: colores.grisOscuro },
  apagado: { color: colores.grisMedio },
  cabecera: {
    gap: espacios.xxs,
    paddingBottom: espacios.sm,
    marginBottom: espacios.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colores.linea,
  },
  reglas: { ...tipografia.chico, color: colores.grisOscuro, marginTop: espacios.xxs },
  participante: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacios.sm,
    minHeight: AREA_TOCABLE_MINIMA,
    paddingVertical: espacios.xs,
  },
  presionada: { opacity: 0.7 },
  // RNF-3: en Simple la cabecera es solo el titulo, mas bajo que 44.
  cabeceraTocable: { minHeight: AREA_TOCABLE_MINIMA },
  siguiente: { marginTop: espacios.md, gap: espacios.xs },
  corregida: { marginTop: espacios.xs },
  faltante: { ...tipografia.secundario, color: colores.grisOscuro, textAlign: 'center' },
  nombre: { ...tipografia.cuerpoFuerte, color: colores.tinta },
  reglasDelJugador: { ...tipografia.chico, color: colores.grisOscuro },
  casilla: {
    minWidth: 68,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: espacios.xxs,
    paddingHorizontal: espacios.sm,
    paddingVertical: espacios.xs - 2,
    borderRadius: radios.xs,
    borderWidth: 1.5,
    borderColor: colores.tinta,
  },
  casillaVacia: { borderStyle: 'dashed', borderColor: colores.linea },
  puntaje: { ...tipografia.cuerpoFuerte, color: colores.tinta },
  puntajeVacio: { color: colores.grisMedio },
  casillaLlego: { backgroundColor: colores.destacado, borderStyle: 'solid', borderColor: colores.borde },
  estrella: { color: colores.sobreDestacado, fontSize: 14 },
  puntajeLlego: { color: colores.sobreDestacado },
  // Ancho fijo: los totales quedan en columna aunque cambie la cantidad de digitos.
  total: { ...tipografia.secundario, color: colores.grisOscuro, minWidth: 44, textAlign: 'right' },
}));
