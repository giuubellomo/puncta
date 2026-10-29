import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { conSigno, es } from '@/i18n/es';
import { iconoDePlantilla, iconos } from '@/theme/iconos';
import { PERSONAJES } from '@/theme/personajes';
import { crearEstilos } from '@/theme/tema';
import { BORDE, espacios, fuentes, numerales, radios, tipografia } from '@/theme/tokens';

import { Avatar } from './Avatar';
import { Chip } from './Chip';

/**
 * Las mini-vistas del instructivo (cambio 97): pedazos de las pantallas de
 * verdad, dibujados con sus componentes y con datos de ejemplo. No son capturas:
 * se ven nitidas en cualquier tamaño y siguen al diseño si cambia.
 *
 * Son decorativas: el lector de pantalla lee el titulo y el texto de la pagina.
 */
export const ILUSTRACIONES = [Podio, Armado, Ronda, Plantilla];

const ejemplo = es.instructivo.ejemplo;
const [caro, juan, sofi] = ejemplo.jugadores.map((nombre, i) => ({
  nombre,
  // Un personaje cada uno, como los de verdad (cambio 116).
  personaje: PERSONAJES[i]!,
}));

/** Como una tarjeta de la app, para que se lea como «un pedazo de pantalla». */
function Marco({ children }: { children: ReactNode }) {
  const styles = useEstilos();
  return (
    <View style={styles.marco} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {children}
    </View>
  );
}

function Rotulo({ texto }: { texto: string }) {
  const styles = useEstilos();
  return <Text style={styles.rotulo}>{texto}</Text>;
}

/** Bienvenida: el podio del final de una partida. */
function Podio() {
  const styles = useEstilos();
  const puestos = [
    { jugador: caro!, alto: 56, puesto: 2 },
    { jugador: sofi!, alto: 84, puesto: 1 },
    { jugador: juan!, alto: 36, puesto: 3 },
  ];
  return (
    <Marco>
      <View style={styles.podio}>
        {puestos.map(({ jugador, alto, puesto }) => (
          <View key={jugador.nombre} style={styles.escalon}>
            {puesto === 1 && <Text style={styles.estrella}>★</Text>}
            <Avatar tipo="icono" valor={jugador.personaje} nombre={jugador.nombre} tamano={40} />
            <Text style={styles.nombreChico}>{jugador.nombre}</Text>
            <View style={[styles.bloque, { height: alto }, puesto === 1 && styles.bloquePrimero]}>
              <Text style={[styles.puesto, puesto === 1 && styles.puestoPrimero]}>{puesto}</Text>
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

/** Cargar los puntos: la ronda en juego, ordenada, con una casilla por cargar. */
function Ronda() {
  const styles = useEstilos();
  const filas = [
    { jugador: sofi!, puntaje: -20, total: -30 },
    { jugador: caro!, puntaje: -10, total: -15 },
    { jugador: juan!, puntaje: null, total: 5 },
  ];
  return (
    <Marco>
      <View style={styles.cabeceraRonda}>
        <Text style={styles.tituloRonda}>{es.ronda.titulo(2)}</Text>
        <Chip texto={es.partida.enJuego} variante="borde" />
      </View>
      {filas.map(({ jugador, puntaje, total }) => (
        <View key={jugador.nombre} style={styles.filaRonda}>
          <Avatar tipo="icono" valor={jugador.personaje} nombre={jugador.nombre} tamano={32} />
          <Text style={styles.nombreRonda}>{jugador.nombre}</Text>
          <View style={[styles.casilla, puntaje === null && styles.casillaVacia]}>
            <Text style={[styles.puntaje, numerales, puntaje === null && styles.apagado]}>
              {puntaje === null ? iconos.raya : conSigno(puntaje)}
            </Text>
          </View>
          <Text style={[styles.total, numerales]}>{conSigno(total)}</Text>
          {/* La mano que toca la casilla vacia. */}
          {puntaje === null && <Text style={styles.mano}>{'\u261D\uFE0E'}</Text>}
        </View>
      ))}
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
  rotulo: { ...tipografia.etiqueta, color: colores.grisMedio, marginTop: espacios.xxs },
  nombreChico: { ...tipografia.chico, color: colores.grisOscuro },
  apagado: { color: colores.grisMedio },

  podio: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: espacios.sm, paddingTop: espacios.xs },
  escalon: { alignItems: 'center', gap: espacios.xxs, width: 72 },
  estrella: { fontSize: 20, color: colores.tinta },
  bloque: {
    alignSelf: 'stretch',
    borderTopLeftRadius: radios.xs,
    borderTopRightRadius: radios.xs,
    backgroundColor: colores.superficie,
    alignItems: 'center',
    paddingTop: espacios.xs,
  },
  bloquePrimero: { backgroundColor: colores.destacado },
  puesto: { ...tipografia.tituloChico, color: colores.grisOscuro },
  puestoPrimero: { color: colores.sobreDestacado },

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

  cabeceraRonda: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: espacios.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colores.linea,
  },
  tituloRonda: { ...tipografia.tituloChico, color: colores.tinta },
  filaRonda: { flexDirection: 'row', alignItems: 'center', gap: espacios.xs, paddingVertical: 2 },
  nombreRonda: { ...tipografia.secundario, fontFamily: fuentes.cuerpoSemi, color: colores.tinta, flex: 1 },
  casilla: {
    minWidth: 52,
    alignItems: 'center',
    paddingVertical: 2,
    borderRadius: radios.xs,
    borderWidth: 1.5,
    borderColor: colores.tinta,
  },
  casillaVacia: { borderStyle: 'dashed', borderColor: colores.linea },
  puntaje: { ...tipografia.secundario, fontFamily: fuentes.display, color: colores.tinta },
  total: { ...tipografia.chico, color: colores.grisOscuro, minWidth: 30, textAlign: 'right' },
  mano: { position: 'absolute', right: 34, bottom: -14, fontSize: 22, color: colores.tinta },

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
