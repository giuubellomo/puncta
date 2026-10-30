import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { conSigno, es } from '@/i18n/es';
import { iconoDePlantilla, iconos } from '@/theme/iconos';
import { COLOR_ESCALON, PODIO } from '@/theme/podio';
import { PERSONAJES } from '@/theme/personajes';
import { crearEstilos } from '@/theme/tema';
import { BORDE, espacios, fuentes, numerales, radios, tipografia } from '@/theme/tokens';

import { Avatar } from './Avatar';
import { Chip } from './Chip';
import { Corona } from './Corona';

/**
 * Las mini-vistas del instructivo (cambio 97): pedazos de las pantallas de
 * verdad, dibujados con sus componentes y con datos de ejemplo. No son capturas:
 * se ven nitidas en cualquier tamaño y siguen al diseño si cambia.
 *
 * Son decorativas: el lector de pantalla lee el titulo y el texto de la pagina.
 */
export const ILUSTRACIONES = [Podio, Armado, Ronda, Planilla, Plantilla];

const ejemplo = es.instructivo.ejemplo;
const [caro, juan, sofi] = ejemplo.jugadores.map((nombre, i) => ({
  nombre,
  // Un personaje cada uno, como los de verdad (cambio 116).
  personaje: PERSONAJES[i]!,
}));

/** Como una tarjeta de la app, para que se lea como «un pedazo de pantalla». */
function Marco({ children, podio = false }: { children: ReactNode; podio?: boolean }) {
  const styles = useEstilos();
  return (
    <View
      style={[styles.marco, podio && styles.marcoPodio]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {children}
    </View>
  );
}

function Rotulo({ texto }: { texto: string }) {
  const styles = useEstilos();
  return <Text style={styles.rotulo}>{texto}</Text>;
}

/** Bienvenida: el podio del final de una partida, como el de verdad (cambio 117). */
function Podio() {
  const styles = useEstilos();
  const puestos = [
    { jugador: caro!, alto: 56, puesto: 2 },
    { jugador: sofi!, alto: 84, puesto: 1 },
    { jugador: juan!, alto: 36, puesto: 3 },
  ];
  return (
    <Marco podio>
      <View style={styles.podio}>
        {puestos.map(({ jugador, alto, puesto }) => (
          <View key={jugador.nombre} style={styles.escalon}>
            {puesto === 1 && <Corona />}
            <Avatar tipo="icono" valor={jugador.personaje} nombre={jugador.nombre} tamano={40} />
            <Text style={styles.nombrePodio}>{jugador.nombre}</Text>
            <View style={[styles.bloque, { height: alto, backgroundColor: COLOR_ESCALON[puesto] }]}>
              <Text style={styles.puesto}>{puesto}</Text>
            </View>
          </View>
        ))}
      </View>
    </Marco>
  );
}

/** Armar una partida: nombre, tipo de juego y participantes. */
function Armado() {
  const styles = useEstilos();
  return (
    <Marco>
      <Rotulo texto={es.nuevaPartida.nombre} />
      <View style={styles.campo}>
        <Text style={styles.textoCampo}>{ejemplo.partida}</Text>
      </View>

      <Rotulo texto={es.nuevaPartida.tipoDeJuego} />
      <View style={styles.filaJuegos}>
        {ejemplo.plantillas.map(({ nombre, icono }, i) => (
          <View key={nombre} style={[styles.juego, i === 0 && styles.juegoElegido]}>
            <Text style={styles.glifoJuego}>{iconoDePlantilla(icono)}</Text>
            <Text style={styles.nombreChico}>{nombre}</Text>
          </View>
        ))}
      </View>

      <Rotulo texto={es.nuevaPartida.participantes} />
      <View style={styles.filaJugadores}>
        {[caro!, juan!, sofi!].map((jugador) => (
          <Avatar key={jugador.nombre} tipo="icono" valor={jugador.personaje} nombre={jugador.nombre} tamano={32} />
        ))}
        <View style={styles.agregar}>
          <Text style={styles.textoAgregar}>{iconos.mas}</Text>
        </View>
      </View>
    </Marco>
  );
}

/** Lo que lleva cada uno al terminar una ronda del ejemplo (null: no cargo). */
function totalesHasta(ronda: number): number[] {
  return [sofi!, caro!, juan!].map((_, j) =>
    ejemplo.rondas.slice(0, ronda).reduce((suma, fila) => suma + (fila[j] ?? 0), 0),
  );
}

/** «faltan 30» o «★ llegó», como debajo del total (cambio 122). */
function falta(total: number): string {
  return total >= ejemplo.hasta ? `${iconos.estrella} ${es.partida.llego}` : es.partida.faltan(ejemplo.hasta - total, 'suma');
}

/**
 * Cargar los puntos: la ronda en juego como la de ahora (cambio 125), con quien ya
 * llego al objetivo en sol y una casilla por cargar.
 */
function Ronda() {
  const styles = useEstilos();
  const totales = totalesHasta(2);
  const filas = [sofi!, caro!, juan!].map((jugador, j) => ({ jugador, puntaje: ejemplo.rondas[1]![j] ?? null, total: totales[j]! }));
  return (
    <Marco>
      <View style={styles.cabeceraRonda}>
        <Text style={styles.tituloRonda}>{es.ronda.titulo(2)}</Text>
        <View style={styles.sello}>
          <Text style={styles.textoSello}>{es.partida.enJuego}</Text>
        </View>
      </View>
      {filas.map(({ jugador, puntaje, total }, i) => {
        const llego = total >= ejemplo.hasta;
        return (
          <View key={jugador.nombre} style={[styles.filaRonda, i > 0 && styles.filaConRaya]}>
            <Avatar tipo="icono" valor={jugador.personaje} nombre={jugador.nombre} tamano={32} />
            <View style={styles.textosRonda}>
              <Text style={styles.nombreRonda}>{jugador.nombre}</Text>
              <Text style={[styles.detalleRonda, numerales]}>{`${es.partida.total(total)} · ${falta(total)}`}</Text>
            </View>
            <View style={[styles.casilla, puntaje === null && styles.casillaVacia, llego && styles.casillaLlego]}>
              <Text style={[styles.puntaje, numerales, puntaje === null && styles.apagado]}>
                {puntaje === null ? iconos.raya : `${llego ? `${iconos.estrella} ` : ''}${conSigno(puntaje)}`}
              </Text>
            </View>
            {/* La mano que toca la casilla vacia. */}
            {puntaje === null && <Text style={styles.mano}>{'\u261D\uFE0E'}</Text>}
          </View>
        );
      })}
    </Marco>
  );
}

/** La planilla de toda la partida (cambio 123), con el mejor de la ronda en sol. */
function Planilla() {
  const styles = useEstilos();
  const jugadores = [sofi!, caro!, juan!];
  const totales = totalesHasta(ejemplo.rondas.length);
  return (
    <Marco>
      <View style={styles.filaPlanilla}>
        <View style={styles.celdaRonda} />
        {jugadores.map((jugador) => (
          <View key={jugador.nombre} style={styles.celda}>
            <Avatar tipo="icono" valor={jugador.personaje} nombre={jugador.nombre} tamano={32} />
            <Text style={styles.nombreChico}>{jugador.nombre}</Text>
          </View>
        ))}
      </View>
      {ejemplo.rondas.map((fila, r) => {
        const cargados = fila.flatMap((v) => (v === null ? [] : [v as number]));
        const mejor = r < ejemplo.rondas.length - 1 ? Math.max(...cargados) : null;
        return (
          <View key={r} style={[styles.filaPlanilla, styles.filaConLinea, r === ejemplo.rondas.length - 1 && styles.filaEnJuego]}>
            <Text style={[styles.celdaRonda, styles.textoRondaPlanilla]}>{es.planilla.ronda(r + 1)}</Text>
            {fila.map((v, j) => (
              <View key={j} style={styles.celda}>
                <Text style={[styles.numeroPlanilla, numerales, v === null && styles.apagado, v !== null && v === mejor && styles.mejor]}>
                  {v === null ? iconos.raya : conSigno(v)}
                </Text>
              </View>
            ))}
          </View>
        );
      })}
      <View style={[styles.filaPlanilla, styles.filaTotal]}>
        <Text style={[styles.celdaRonda, styles.textoRondaPlanilla]}>{es.planilla.total}</Text>
        {totales.map((total, j) => (
          <View key={j} style={styles.celda}>
            <Text style={[styles.totalPlanilla, numerales]}>{conSigno(total)}</Text>
            <Text style={[styles.faltaPlanilla, total >= ejemplo.hasta && styles.faltaLlego]}>{falta(total)}</Text>
          </View>
        ))}
      </View>
    </Marco>
  );
}

/** El editor de plantillas: reglas y objetivo. */
function Plantilla() {
  const styles = useEstilos();
  return (
    <Marco>
      <Rotulo texto={es.plantilla.reglas(ejemplo.reglas.length)} />
      {ejemplo.reglas.map(({ titulo, puntos }) => (
        <View key={titulo} style={styles.regla}>
          <View style={styles.punto} />
          <Text style={styles.nombreRegla}>{titulo}</Text>
          <Chip valor={conSigno(puntos)} />
        </View>
      ))}

      <Rotulo texto={es.plantilla.objetivo} />
      <View style={styles.objetivo}>
        <View style={styles.circulo}>
          <Text style={styles.textoCirculo}>{iconos.menos}</Text>
        </View>
        <Text style={[styles.valorObjetivo, numerales]}>{es.comun.puntosSinSigno(ejemplo.objetivo)}</Text>
        <View style={styles.circulo}>
          <Text style={styles.textoCirculo}>{iconos.mas}</Text>
        </View>
      </View>
    </Marco>
  );
}

const useEstilos = crearEstilos((colores) => ({
  marco: {
    width: 290,
    maxWidth: '100%',
    gap: espacios.xs,
    padding: espacios.md,
    borderRadius: radios.xl,
    borderWidth: BORDE,
    borderColor: colores.borde,
    backgroundColor: colores.tarjeta,
  },
  marcoPodio: { backgroundColor: PODIO.fondo, borderColor: PODIO.tinta },
  rotulo: { ...tipografia.etiqueta, color: colores.grisMedio, marginTop: espacios.xxs },
  nombreChico: { ...tipografia.chico, color: colores.grisOscuro },
  apagado: { color: colores.grisMedio },

  podio: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: espacios.sm, paddingTop: espacios.xs },
  escalon: { alignItems: 'center', gap: espacios.xxs, width: 72 },
  nombrePodio: { ...tipografia.chico, fontFamily: fuentes.cuerpoBold, color: '#FFFFFF' },
  bloque: {
    alignSelf: 'stretch',
    borderTopLeftRadius: radios.xs,
    borderTopRightRadius: radios.xs,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderColor: PODIO.tinta,
    alignItems: 'center',
    paddingTop: espacios.xs,
  },
  puesto: { ...tipografia.tituloChico, color: PODIO.tinta },

  campo: {
    borderWidth: 1.5,
    borderColor: colores.tinta,
    borderRadius: radios.sm,
    paddingHorizontal: espacios.sm,
    paddingVertical: espacios.xs,
  },
  textoCampo: { ...tipografia.secundario, color: colores.tinta },
  filaJuegos: { flexDirection: 'row', gap: espacios.xs },
  juego: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: espacios.xs,
    borderRadius: radios.sm,
    borderWidth: 1.5,
    borderColor: colores.linea,
  },
  juegoElegido: { borderColor: colores.acento, borderWidth: 3, backgroundColor: colores.tarjeta },
  glifoJuego: { fontSize: 18, color: colores.tinta },
  filaJugadores: { flexDirection: 'row', gap: espacios.xs, alignItems: 'center' },
  agregar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colores.linea,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoAgregar: { fontSize: 16, color: colores.grisMedio },

  // Como la cabecera de la ronda (cambio 125), en chico.
  cabeceraRonda: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: espacios.sm,
    paddingVertical: espacios.xs,
    marginBottom: espacios.xxs,
    borderRadius: radios.sm,
    borderWidth: 2,
    borderColor: colores.borde,
    backgroundColor: colores.acento,
  },
  tituloRonda: { ...tipografia.tituloChico, color: colores.sobreAcento },
  sello: {
    backgroundColor: colores.destacado,
    borderWidth: 1.5,
    borderColor: colores.borde,
    borderRadius: radios.pastilla,
    paddingHorizontal: espacios.xs,
    transform: [{ rotate: '-4deg' }],
  },
  textoSello: { ...tipografia.chico, fontSize: 11, fontFamily: fuentes.cuerpoBold, color: colores.sobreDestacado },
  filaRonda: { flexDirection: 'row', alignItems: 'center', gap: espacios.xs, paddingVertical: espacios.xxs },
  filaConRaya: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colores.linea },
  textosRonda: { flex: 1 },
  nombreRonda: { ...tipografia.secundario, fontFamily: fuentes.cuerpoBold, color: colores.tinta },
  detalleRonda: { ...tipografia.chico, fontSize: 11, color: colores.grisOscuro },
  casilla: {
    minWidth: 52,
    alignItems: 'center',
    paddingVertical: 2,
    borderRadius: radios.xs,
    borderWidth: 1.5,
    borderColor: colores.tinta,
  },
  casillaVacia: { borderStyle: 'dashed', borderColor: colores.grisMedio },
  casillaLlego: { backgroundColor: colores.destacado },
  puntaje: { ...tipografia.secundario, fontFamily: fuentes.display, color: colores.tinta },
  mano: { position: 'absolute', right: 14, bottom: -12, fontSize: 22, color: colores.tinta },

  filaPlanilla: { flexDirection: 'row', alignItems: 'center', minHeight: 26 },
  filaConLinea: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colores.linea },
  filaEnJuego: { backgroundColor: colores.superficie },
  filaTotal: { borderTopWidth: 2, borderTopColor: colores.borde, paddingTop: espacios.xxs },
  celdaRonda: { width: 44 },
  celda: { flex: 1, alignItems: 'center', gap: 1 },
  textoRondaPlanilla: { ...tipografia.chico, fontFamily: fuentes.cuerpoSemi, color: colores.grisOscuro },
  numeroPlanilla: { ...tipografia.secundario, color: colores.tinta },
  mejor: {
    fontFamily: fuentes.cuerpoBold,
    color: colores.sobreDestacado,
    backgroundColor: colores.destacado,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colores.borde,
    paddingHorizontal: 4,
    overflow: 'hidden',
  },
  totalPlanilla: { ...tipografia.tituloChico, fontSize: 15, color: colores.tinta },
  faltaPlanilla: { ...tipografia.chico, fontSize: 10, color: colores.grisOscuro },
  faltaLlego: { color: colores.tinta, fontFamily: fuentes.cuerpoBold },

  regla: { flexDirection: 'row', alignItems: 'center', gap: espacios.xs, paddingVertical: 2 },
  punto: { width: 6, height: 6, borderRadius: 3, backgroundColor: colores.tinta },
  nombreRegla: { ...tipografia.secundario, fontFamily: fuentes.cuerpoSemi, color: colores.tinta, flex: 1 },
  objetivo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: colores.linea,
    borderRadius: radios.sm,
    padding: espacios.xs,
  },
  circulo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colores.linea,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoCirculo: { fontSize: 16, color: colores.tinta },
  valorObjetivo: { ...tipografia.tituloChico, color: colores.tinta },
}));
