import { useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, Platform, Pressable, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { puedeCerrarRonda, puntajeDeReglaEnRonda, reglasDeLaRonda, reglasSinAsignar } from '@/domain/rondas';
import { esCanasta, minimoParaBajar } from '@/domain/canasta';
import { faltaParaElObjetivo, llegoHastaRonda } from '@/domain/objetivo';
import { ordenarPorTotalHastaRonda } from '@/domain/ranking';
import { mejoresDeRonda, puntajeCargado, totalHastaRonda } from '@/domain/scoring';
import type { Participante, Partida, Plantilla, RondaJugada } from '@/domain/types';
import { conSigno, es } from '@/i18n/es';
import { iconos } from '@/theme/iconos';
import { crearEstilos, useTema } from '@/theme/tema';
import { AREA_TOCABLE_MINIMA, BORDE, espacios, fuentes, numerales, radios, SOMBRA, tipografia } from '@/theme/tokens';

import { Avatar } from './Avatar';
import { Boton } from './Boton';
import { Card } from './Card';

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
  /** Tocar una ronda cerrada colapsada la expande. */
  onAlternar?: () => void;
  /** Cambio 119: el objetivo se escribe al jugar. Con esto, se toca para escribirlo. */
  onTocarObjetivo?: () => void;
  /** Entre la cabecera y la lista: los puntitos para pasar de ronda (cambio 125). */
  navegacion?: ReactNode;
}

/**
 * Una ronda de la partida (paso 7.1, RF-702), como la lamina «Ronda» desde el
 * cambio 125: arriba una cabecera grande, en el color de acento si esta en
 * juego y apagada si esta cerrada, con el titulo, el objetivo y lo que valen
 * las reglas; abajo una tarjeta con una fila por participante. En cada fila, el
 * acumulado y lo que le falta para el objetivo van debajo del nombre, y la
 * casilla con el puntaje de la ronda queda sola a la derecha. SIGUIENTE ya no
 * va aca: esta fijo abajo de la pantalla (`PaginasDeRondas`).
 *
 * Una cerrada se toca en una fila para corregirla (paso 7.6, RF-709): sigue
 * cerrada, y la en juego sigue siendo la misma. La colapsada y la bloqueada
 * quedan como estaban.
 */
export function TarjetaDeRonda({
  ronda,
  partida,
  onTocarParticipante,
  expandida = false,
  onAlternar,
  onTocarObjetivo,
  navegacion,
}: Props) {
  const styles = useEstilos();
  const titulo = es.ronda.titulo(ronda.numero);

  if (ronda.estado === 'cerrada' && !expandida) {
    const resumen = resumenDeCerrada(ronda, partida);
    return (
      <Card
        estado="suave"
        style={styles.filaSimple}
        onPress={onAlternar}
        etiqueta={[titulo, es.partida.completada, resumen].filter((texto) => texto !== null).join(', ')}
      >
        <View style={styles.textos}>
          <Text style={styles.tituloChico}>{titulo}</Text>
          {/* RNF-4: el resumen lleva puntajes («Cortó: −10 pts»). */}
          {resumen !== null && <Text style={[styles.detalle, numerales]}>{resumen}</Text>}
        </View>
        <Text style={styles.completada}>{`${iconos.tilde} ${es.partida.completada}`}</Text>
      </Card>
    );
  }

  if (ronda.estado === 'bloqueada') {
    return (
      <View style={styles.ronda}>
        <Card estado="punteada">
          <Text style={[styles.tituloChico, styles.apagado]}>{titulo}</Text>
          <Text style={[styles.detalle, styles.apagado]}>{es.partida.bloqueada(ronda.numero - 1)}</Text>
        </Card>
        {navegacion}
      </View>
    );
  }

  const enJuego = ronda.estado === 'en_curso';
  return (
    <View style={styles.ronda}>
      <Cabecera ronda={ronda} partida={partida} titulo={titulo} enJuego={enJuego} onTocarObjetivo={onTocarObjetivo} />
      {navegacion}
      <View style={styles.lista}>
        <Filas ronda={ronda} partida={partida} onTocarParticipante={onTocarParticipante} enJuego={enJuego} />
      </View>
      {/* Corregir no reabre la ronda: si quedo una regla sin asignar, solo se avisa. */}
      {!enJuego && <ReglasSinAsignar ronda={ronda} partida={partida} />}
    </View>
  );
}

interface PropsCabecera {
  ronda: RondaJugada;
  partida: Partida;
  titulo: string;
  enJuego: boolean;
  onTocarObjetivo?: () => void;
}

/**
 * La lamina: «Ronda 4» grande, el objetivo y lo que valen las reglas, con el
 * sello «en juego» en sol y una chispa. Cerrada, en el color suave y con
 * «✓ completada». Lleva la sombra dura de las tarjetas de la identidad.
 */
function Cabecera({ ronda, partida, titulo, enJuego, onTocarObjetivo }: PropsCabecera) {
  const styles = useEstilos();
  const reglas = reglasConPuntaje(ronda, partida.plantilla);
  const texto = enJuego ? styles.sobreAcento : undefined;
  const objetivo =
    onTocarObjetivo === undefined ? (
      ronda.objetivo !== undefined && <Text style={[styles.objetivo, texto]}>{ronda.objetivo}</Text>
    ) : (
      // Cambio 119: se escribe al jugar. Sin escribir todavia, una invitacion subrayada.
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          ronda.objetivo === undefined ? es.partida.escribirObjetivo : es.partida.cambiarObjetivo(ronda.objetivo)
        }
        onPress={onTocarObjetivo}
        hitSlop={espacios.xs}
        style={({ pressed }) => [styles.objetivoTocable, pressed && styles.presionada]}
      >
        <Text style={[styles.objetivo, texto, ronda.objetivo === undefined && styles.objetivoVacio]}>
          {ronda.objetivo ?? es.partida.escribirObjetivo}
        </Text>
        <Text style={[styles.objetivo, texto]}>{iconos.lapiz}</Text>
      </Pressable>
    );

  return (
    <View style={styles.conSombra}>
      <View style={styles.sombra} />
      <View style={[styles.cabecera, enJuego ? styles.cabeceraEnJuego : styles.cabeceraCerrada]}>
        <View style={[styles.filaTitulo, enJuego && styles.filaTituloConChispa]}>
          <Text accessibilityRole="header" style={[styles.titulo, texto]}>
            {titulo}
          </Text>
          <View style={[styles.sello, enJuego ? styles.selloEnJuego : styles.selloCerrada]}>
            <Text style={[styles.textoSello, !enJuego && styles.textoSelloCerrada]}>
              {enJuego ? es.partida.enJuego : `${iconos.tilde} ${es.partida.completada.toLowerCase()}`}
            </Text>
          </View>
        </View>
        {objetivo}
        {reglas.length > 0 && <Text style={[styles.reglas, texto, numerales]}>{reglas.join(' · ')}</Text>}
        {enJuego && <Chispa />}
      </View>
    </View>
  );
}

/** La chispa de cuatro puntas de la lamina, en sol, abajo a la derecha de la cabecera. */
function Chispa() {
  const styles = useEstilos();
  const { colores } = useTema();
  return (
    <View style={styles.chispa} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={28} height={28} viewBox="0 0 24 24">
        <Path
          d="M12 1.5l2.4 7.1 7.1 2.4-7.1 2.4L12 20.5l-2.4-7.1L2.5 11l7.1-2.4z"
          fill={colores.destacado}
          stroke={colores.borde}
          strokeWidth={1.4}
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

interface PropsFilas extends Pick<Props, 'ronda' | 'partida' | 'onTocarParticipante'> {
  /**
   * La ronda en juego (cambio 91): de quien va ganando a quien va perdiendo por
   * el acumulado, y al cargar un puntaje las filas se deslizan a su lugar. Lleva
   * lo que le falta a cada uno para el objetivo (cambio 122). Una cerrada queda
   * en el orden de la partida.
   */
  enJuego: boolean;
}

/** Una fila por participante, con el acumulado hasta esta ronda (cambio 80). */
function Filas({ ronda, partida, onTocarParticipante, enJuego }: PropsFilas) {
  const participantes = enJuego ? ordenarPorTotalHastaRonda(partida, ronda.numero) : partida.participantes;
  return participantes.map((participante, i) => {
    const fila = (
      <FilaDeParticipante
        key={participante.id}
        participante={participante}
        puntaje={puntajeCargado(ronda, partida.plantilla, participante.id)}
        total={totalHastaRonda(partida, participante.id, ronda.numero)}
        detalle={detalleDeFila(ronda, partida, participante.id, enJuego)}
        reglas={esCanasta(partida.plantilla) ? [] : reglasMarcadas(ronda, partida.plantilla, participante.id)}
        llego={llegoHastaRonda(partida, participante.id, ronda.numero)}
        primera={i === 0}
        onPress={onTocarParticipante && (() => onTocarParticipante(participante.id))}
      />
    );
    return enJuego ? <Deslizable key={participante.id}>{fila}</Deslizable> : fila;
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

/** «Falta asignar: Bajó primero» (RF-706), o nada. Va tambien arriba de SIGUIENTE. */
export function ReglasSinAsignar({ ronda, partida }: Pick<Props, 'ronda' | 'partida'>) {
  const styles = useEstilos();
  const sinAsignar = reglasSinAsignar(ronda, partida.plantilla);
  if (sinAsignar.length === 0) return null;
  return <Text style={styles.faltante}>{es.partida.faltanReglas(sinAsignar.map((regla) => regla.titulo))}</Text>;
}

/**
 * SIGUIENTE, fijo abajo de la pantalla desde el cambio 125. Habilitado segun
 * `puedeCerrarRonda`; mientras no, nombra las reglas sin asignar (RF-706). Los
 * puntajes que faltan no se avisan en texto (cambio 79): se ven en las casillas
 * vacias. Da false si no avanzo (cambio 120: se cerro el aviso de objetivo).
 */
export function BotonSiguiente({
  ronda,
  partida,
  onSiguiente,
}: Pick<Props, 'ronda' | 'partida'> & { onSiguiente: () => Promise<boolean> }) {
  const styles = useEstilos();
  const [avanzando, setAvanzando] = useState(false);
  const [errorAlAvanzar, setErrorAlAvanzar] = useState(false);

  const { plantilla, participantes } = partida;
  const puede = puedeCerrarRonda(ronda, plantilla, participantes).puede;

  async function avanzar() {
    setAvanzando(true);
    setErrorAlAvanzar(false);
    try {
      await onSiguiente();
    } catch {
      setErrorAlAvanzar(true);
    }
    setAvanzando(false);
  }

  return (
    <>
      <ReglasSinAsignar ronda={ronda} partida={partida} />
      {errorAlAvanzar && <Text style={styles.faltante}>{es.comun.errorGuardar}</Text>}
      <Boton titulo={es.partida.siguiente} onPress={avanzar} deshabilitado={!puede || avanzando} />
    </>
  );
}

interface PropsFila {
  participante: Participante;
  /** null: todavia no cargo. */
  puntaje: number | null;
  /** El acumulado de toda la partida, con esta ronda incluida (C-2). */
  total: number;
  /** Debajo del nombre: «Total 72 · faltan 78». */
  detalle: string;
  /** Los titulos de las reglas que tiene marcadas en la ronda: «Bajó primero». */
  reglas: string[];
  /** Con el acumulado hasta esta ronda llego al objetivo: la casilla lleva una estrella (cambio 120). */
  llego: boolean;
  /** La primera no lleva la raya punteada de arriba. */
  primera: boolean;
  onPress?: () => void;
}

/**
 * La lamina: personaje, nombre con las reglas que se llevo en la ronda como
 * etiquetas en sol (cambio 77), y debajo el acumulado y lo que le falta. A la
 * derecha, la casilla grande con el puntaje de la ronda; sin cargar, punteada
 * con una raya. Si llego al objetivo, la casilla se pinta y lleva una estrella.
 */
function FilaDeParticipante({ participante, puntaje, total, detalle, reglas, llego, primera, onPress }: PropsFila) {
  const styles = useEstilos();
  const vacia = puntaje === null;
  const valor = vacia ? es.partida.sinCargar : conSigno(puntaje);
  const contenido = (
    <>
      <Avatar tipo={participante.avatarTipo} valor={participante.avatarValor} nombre={participante.nombre} />
      <View style={styles.textos}>
        <View style={styles.lineaNombre}>
          <Text style={styles.nombre}>{participante.nombre}</Text>
          {reglas.map((regla) => (
            <View key={regla} style={styles.etiquetaRegla}>
              <Text style={styles.textoEtiquetaRegla}>{regla.toLowerCase()}</Text>
            </View>
          ))}
        </View>
        <Text style={[styles.detalle, numerales]}>{detalle}</Text>
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
    </>
  );
  const etiqueta = [
    es.partida.puntajeDe(participante.nombre, valor, conSigno(total)),
    ...(llego ? [es.partida.llegoAlObjetivo] : []),
    detalle,
    ...reglas,
  ].join(', ');

  const fila =
    onPress === undefined ? (
      <View accessible accessibilityLabel={etiqueta} style={styles.participante}>
        {contenido}
      </View>
    ) : (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={etiqueta}
        onPress={onPress}
        style={({ pressed }) => [styles.participante, pressed && styles.presionada]}
      >
        {contenido}
      </Pressable>
    );

  return (
    <>
      {!primera && (
        // En iOS un borde punteado en un solo lado no se dibuja: se recorta la mitad de un rectangulo punteado.
        <View style={styles.raya}>
          <View style={styles.rayaPunteada} />
        </View>
      )}
      {fila}
    </>
  );
}

/** «faltan 70», «faltan −70» o «★ llegó»; null sin objetivo (cambio 122). */
export function faltaTexto(partida: Partida, participanteId: string, numeroRonda: number): string | null {
  const falta = faltaParaElObjetivo(partida, participanteId, numeroRonda);
  if (falta === null) return null;
  return falta === 0 ? `${iconos.estrella} ${es.partida.llego}` : es.partida.faltan(falta, partida.plantilla.modoPuntos);
}

/**
 * Debajo del nombre: «Total 72», y en la ronda en juego lo que le falta para el
 * objetivo. En la Canasta (cambio 101), en la ronda en juego tambien lo minimo
 * para bajar, segun lo que llevaba.
 */
function detalleDeFila(ronda: RondaJugada, partida: Partida, participanteId: string, enJuego: boolean): string {
  const partes = [es.partida.total(totalHastaRonda(partida, participanteId, ronda.numero))];
  if (enJuego) {
    const falta = faltaTexto(partida, participanteId, ronda.numero);
    if (falta !== null) partes.push(falta);
    if (esCanasta(partida.plantilla)) {
      partes.push(es.canasta.bajaCon(minimoParaBajar(totalHastaRonda(partida, participanteId, ronda.numero - 1))));
    }
  }
  return partes.join(' · ');
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

/** Lo que entra la chispa en la cabecera: el texto no le pasa por encima. */
const LUGAR_CHISPA = 32;

const useEstilos = crearEstilos((colores) => ({
  ronda: { gap: espacios.sm },
  filaSimple: { flexDirection: 'row', alignItems: 'center', gap: espacios.sm },
  textos: { flex: 1, gap: 2 },
  tituloChico: { ...tipografia.tituloChico, color: colores.tinta },
  detalle: { ...tipografia.secundario, fontSize: 13, lineHeight: 17, color: colores.grisOscuro },
  completada: { ...tipografia.chico, color: colores.grisOscuro },
  apagado: { color: colores.grisMedio },
  presionada: { opacity: 0.7 },

  // La sombra ocupa lugar, como en Boton: una capa del color del borde corrida hacia abajo.
  conSombra: { paddingBottom: SOMBRA },
  sombra: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: SOMBRA,
    bottom: 0,
    borderRadius: radios.lg,
    backgroundColor: colores.borde,
  },
  cabecera: {
    gap: espacios.xxs,
    paddingHorizontal: espacios.md,
    paddingTop: espacios.md,
    paddingBottom: espacios.md,
    paddingRight: espacios.md + LUGAR_CHISPA,
    borderRadius: radios.lg,
    borderWidth: BORDE,
    borderColor: colores.borde,
  },
  cabeceraEnJuego: { backgroundColor: colores.acento },
  cabeceraCerrada: { backgroundColor: colores.superficie, paddingRight: espacios.md },
  filaTitulo: { flexDirection: 'row', alignItems: 'center', gap: espacios.sm },
  // El sello va hasta el borde: el lugar de la chispa es solo para las lineas de abajo.
  filaTituloConChispa: { marginRight: -LUGAR_CHISPA },
  titulo: { ...tipografia.titulo, fontSize: 32, lineHeight: 36, letterSpacing: -1, color: colores.tinta, flex: 1 },
  sobreAcento: { color: colores.sobreAcento },
  sello: { borderRadius: radios.pastilla, borderWidth: 2, paddingHorizontal: espacios.sm, paddingVertical: 3 },
  // El sol y la tinta fijos, como en la lamina: en cualquier tema se lee igual.
  selloEnJuego: { backgroundColor: colores.destacado, borderColor: colores.borde, transform: [{ rotate: '-4deg' }] },
  selloCerrada: { backgroundColor: colores.tarjeta, borderColor: colores.borde },
  textoSello: { ...tipografia.chico, fontFamily: fuentes.cuerpoBold, color: colores.sobreDestacado },
  textoSelloCerrada: { color: colores.tinta },
  objetivo: { ...tipografia.cuerpoFuerte, fontSize: 14, lineHeight: 19, color: colores.tinta },
  objetivoTocable: { flexDirection: 'row', alignItems: 'center', gap: espacios.xxs, alignSelf: 'flex-start' },
  objetivoVacio: { textDecorationLine: 'underline', fontFamily: fuentes.cuerpoBold },
  reglas: { ...tipografia.chico, color: colores.grisOscuro },
  chispa: { position: 'absolute', right: espacios.sm, bottom: espacios.xs },

  lista: {
    paddingHorizontal: espacios.md,
    paddingVertical: espacios.xxs,
    backgroundColor: colores.tarjeta,
    borderWidth: BORDE,
    borderColor: colores.borde,
    borderRadius: radios.lg,
  },
  participante: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacios.sm,
    minHeight: AREA_TOCABLE_MINIMA + 12,
    paddingVertical: espacios.xs,
  },
  raya: { height: 2, overflow: 'hidden' },
  rayaPunteada: { height: 6, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colores.linea, borderRadius: 1 },
  lineaNombre: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: espacios.xxs + 2 },
  nombre: { ...tipografia.cuerpoFuerte, fontFamily: fuentes.cuerpoBold, color: colores.tinta },
  etiquetaRegla: {
    backgroundColor: colores.destacado,
    borderWidth: 1.5,
    borderColor: colores.borde,
    borderRadius: radios.pastilla,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  textoEtiquetaRegla: { ...tipografia.chico, fontSize: 11, lineHeight: 14, fontFamily: fuentes.cuerpoBold, color: colores.sobreDestacado },
  casilla: {
    minWidth: 66,
    height: 46,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: espacios.xxs,
    paddingHorizontal: espacios.sm,
    borderRadius: radios.sm,
    borderWidth: BORDE,
    borderColor: colores.borde,
    backgroundColor: colores.tarjeta,
  },
  casillaVacia: { borderStyle: 'dashed', borderColor: colores.grisMedio },
  casillaLlego: { backgroundColor: colores.destacado },
  puntaje: { ...tipografia.tituloChico, fontSize: 19, lineHeight: 24, color: colores.tinta },
  puntajeVacio: { color: colores.grisMedio, fontFamily: fuentes.cuerpoSemi },
  estrella: { color: colores.sobreDestacado, fontSize: 14 },
  puntajeLlego: { color: colores.sobreDestacado },
  faltante: { ...tipografia.secundario, color: colores.grisOscuro, textAlign: 'center' },
}));

