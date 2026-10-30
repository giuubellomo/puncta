import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  PixelRatio,
  Platform,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
  useWindowDimensions,
  type HostInstance,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { captureRef } from 'react-native-view-shot';

import { Avatar, type TamanoAvatar } from '@/components/Avatar';
import { Boton } from '@/components/Boton';
import { Confeti } from '@/components/Confeti';
import { Corona } from '@/components/Corona';
import { ALTO_IMAGEN, ANCHO_IMAGEN, ImagenDelPodio } from '@/components/ImagenDelPodio';
import { rankear, type Puesto } from '@/domain/ranking';
import type { Participante } from '@/domain/types';
import { es } from '@/i18n/es';
import * as partidas from '@/repositories/partidas';
import { COLOR_ESCALON, PODIO } from '@/theme/podio';
import { crearEstilos, ProveedorDeTema } from '@/theme/tema';
import { AREA_TOCABLE_MINIMA, BORDE, espacios, fuentes, numerales, radios, tipografia } from '@/theme/tokens';
import { usePartida } from '@/hooks/usePartida';

/** Alto del escalon segun la posicion: con empate, los que comparten puesto quedan a la misma altura. */
const ALTO_ESCALON: Record<number, number> = { 1: 160, 2: 112, 3: 84 };

/** El tamaño de quien esta arriba de cada escalon, como en la lamina. */
const TAMANO_PERSONA: Record<number, TamanoAvatar> = { 1: 88, 2: 56, 3: 48 };


/**
 * La entrada del podio (cambio 105): la pantalla arranca tapada por un circulo
 * oscuro (cambio 108: desde el primer cuadro) que se va cerrando sobre el 1
 * mientras suben los escalones. Cuando queda chiquito aparece el ganador y
 * explota el confeti. Mientras cae, aparecen los demas de a uno, en orden de
 * puesto, y al final el boton.
 */
const SUBIDA_ESCALON = 450;
const ENTRE_ESCALONES = 120;
/** Lo que se queda tapada la pantalla antes de que el circulo empiece a cerrarse. */
const PAUSA_TAPADA = 300;
/** Cuando empiezan a subir los escalones, ya cerrandose el circulo. */
const ESPERA_ESCALONES = 250;
const CIERRE_REFLECTOR = 1600;
const APAGADO_REFLECTOR = 250;
const PAUSA_ANTES_DEL_RESTO = 600;
const ENTRE_APARICIONES = 450;
const APARICION = 400;

/**
 * Podio (paso 8.2, RF-801 a RF-804; lamina «Podio» desde el cambio 117). Sale
 * de `rankear()`: los tres primeros del ranking en orden visual 2º–1º–3º y el
 * resto en una tarjeta abajo. Con dos participantes no hay escalon vacio
 * (RF-803). Los empatados comparten numero y altura de escalon (RF-804). Sin
 * historial, se ve una sola vez (8.1). Entra animado: escalones, el ganador
 * con confeti, y el resto (cambio 105).
 *
 * Siempre en violeta, sea cual sea el tema elegido.
 */
export default function PantallaDePodio() {
  return (
    <ProveedorDeTema inicial="noche">
      <StatusBar style="light" />
      <Podio />
    </ProveedorDeTema>
  );
}

function Podio() {
  const styles = useEstilos();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { partida } = usePartida(id);
  const [armandoRevancha, setArmandoRevancha] = useState(false);
  const [errorRevancha, setErrorRevancha] = useState(false);
  const [compartiendo, setCompartiendo] = useState(false);
  const [errorAlCompartir, setErrorAlCompartir] = useState(false);
  const imagen = useRef<HostInstance>(null);
  const puestos = partida === null ? [] : rankear(partida);
  // Los que aparecen despues del ganador, de a uno y en orden de puesto.
  const siguientes = puestos.filter((puesto) => puesto.posicion !== 1).map((puesto) => puesto.participanteId);
  const animacion = useEntradaDelPodio(partida !== null, siguientes.length);
  const aparicionDe = (participanteId: string) => animacion.apariciones[siguientes.indexOf(participanteId)]!;

  if (partida === null) return null;

  const [primero, segundo, tercero] = puestos;
  // 2º–1º–3º; con dos jugadores, solo 2º–1º.
  const podio = [segundo, primero, tercero].filter((puesto): puesto is Puesto => puesto !== undefined);
  const resto = puestos.slice(3);
  const participante = (puesto: Puesto) => partida.participantes.find((p) => p.id === puesto.participanteId)!;
  const ganadores = puestos.filter((puesto) => puesto.posicion === 1).map((puesto) => participante(puesto).nombre);

  // La misma partida otra vez (cambio 117): mismo nombre, plantilla, objetivo y
  // jugadores. Reemplaza al podio, asi atras sigue siendo el Home.
  const revancha = async () => {
    setArmandoRevancha(true);
    setErrorRevancha(false);
    try {
      const nueva = await partidas.crear({
        nombre: partida.nombre,
        plantillaId: partida.plantilla.id,
        participantes: partida.participantes,
        puntajeObjetivo: partida.plantilla.puntajeObjetivo,
        // En la Simple, suma o resta (cambio 121); en las demas se ignora.
        modoPuntos: partida.plantilla.modoPuntos,
      });
      router.replace({ pathname: '/partida/[id]', params: { id: nueva.id } });
    } catch {
      setErrorRevancha(true);
      setArmandoRevancha(false);
    }
  };

  // Cambio 124: la imagen del resultado, a 1080 × 1920, al menu de compartir del telefono.
  const compartir = async () => {
    setCompartiendo(true);
    setErrorAlCompartir(false);
    try {
      const archivo = await captureRef(imagen, {
        format: 'png',
        result: 'tmpfile',
        width: 1080 / PixelRatio.get(),
        height: 1920 / PixelRatio.get(),
      });
      if (Platform.OS === 'ios') {
        // El Share de React Native manda la imagen y el texto con el link juntos.
        const url = archivo.startsWith('file://') ? archivo : `file://${archivo}`;
        await Share.share({ url, message: es.compartir.mensaje(URL_DE_LA_WEB) });
      } else {
        // En Android, Share solo manda texto: va la imagen sola.
        await Sharing.shareAsync(archivo, { mimeType: 'image/png', dialogTitle: es.compartir.boton });
      }
    } catch {
      setErrorAlCompartir(true);
    } finally {
      setCompartiendo(false);
    }
  };

  return (
    <SafeAreaView style={styles.pantalla}>
      {/* Fuera de la pantalla: solo esta para capturarla al compartir. */}
      {COMPARTIR_DISPONIBLE && (
        <View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={styles.fueraDePantalla}
        >
          <ImagenDelPodio ref={imagen} partida={partida} puestos={puestos} />
        </View>
      )}

      {COMPARTIR_DISPONIBLE && (
        <Animated.View style={[styles.barraSuperior, { opacity: animacion.pie }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={es.compartir.boton}
            accessibilityState={{ disabled: compartiendo }}
            disabled={compartiendo}
            onPress={() => void compartir()}
            style={({ pressed }) => [styles.botonCompartir, (pressed || compartiendo) && styles.presionado]}
          >
            <IconoCompartir />
          </Pressable>
        </Animated.View>
      )}

      <ScrollView contentContainerStyle={styles.contenido}>
        <View style={styles.encabezado}>
          <Text style={styles.etiqueta}>{partida.nombre}</Text>
          <Text accessibilityRole="header" style={styles.titulo}>
            {es.finalizar.gano(ganadores)}
          </Text>
        </View>

        <View style={styles.podio}>
          {podio.map((puesto, i) => (
            <Escalon
              key={puesto.participanteId}
              puesto={puesto}
              participante={participante(puesto)}
              escalon={animacion.escalones[i]!}
              persona={puesto.posicion === 1 ? animacion.ganador : aparicionDe(puesto.participanteId)}
              confeti={animacion.confeti && puesto.posicion === 1}
              reflector={puesto.posicion === 1 ? animacion.reflector : undefined}
            />
          ))}
        </View>

        {resto.length > 0 && (
          <Animated.View style={[styles.tarjetaResto, { opacity: aparicionDe(resto[0]!.participanteId) }]}>
            {resto.map((puesto, i) => (
              <FilaDelResto
                key={puesto.participanteId}
                puesto={puesto}
                participante={participante(puesto)}
                aparicion={aparicionDe(puesto.participanteId)}
                primera={i === 0}
              />
            ))}
          </Animated.View>
        )}
      </ScrollView>

      <Animated.View style={[styles.pie, { opacity: animacion.pie }]}>
        {errorRevancha && <Text style={styles.error}>{es.finalizar.errorRevancha}</Text>}
        {errorAlCompartir && <Text style={styles.error}>{es.compartir.error}</Text>}
        <Boton
          titulo={es.finalizar.revancha}
          variante="destacado"
          deshabilitado={armandoRevancha}
          onPress={() => void revancha()}
        />
        {/* Se llego con replace desde la partida: atras es el Home. */}
        <Pressable accessibilityRole="link" onPress={() => router.back()} hitSlop={espacios.sm} style={styles.volver}>
          <Text style={styles.textoVolver}>{es.finalizar.volverAlInicio}</Text>
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
}

/**
 * En la web no se puede compartir un archivo local (expo-sharing usa la Web
 * Share API, que no lo acepta): ahi el boton no aparece.
 */
const COMPARTIR_DISPONIBLE = Platform.OS !== 'web';

const LADO_BOTON_COMPARTIR = 40;

/**
 * El link que acompaña a la imagen. Si la web se muda (otro nombre de repo),
 * cambia aca junto con `experiments.baseUrl` y `public/manifest.json`.
 */
const URL_DE_LA_WEB = 'https://giuubellomo.github.io/puncta/';

/** El de compartir de iOS: una caja abierta arriba con una flecha que sale. */
function IconoCompartir() {
  return (
    <Svg width={20} height={22} viewBox="0 0 20 22" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Path
        d="M10 14 V2 M5.5 6.5 L10 2 L14.5 6.5 M6.5 9.5 H4 A1.5 1.5 0 0 0 2.5 11 V18.5 A1.5 1.5 0 0 0 4 20 H16 A1.5 1.5 0 0 0 17.5 18.5 V11 A1.5 1.5 0 0 0 16 9.5 H13.5"
        fill="none"
        stroke={PODIO.tinta}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Los puntos al lado del nombre, como en la lamina: «Caro · 52», sin el «+». */
function puntosCortos(total: number): string {
  return total < 0 ? `−${Math.abs(total)}` : String(total);
}

/**
 * Los tiempos de la entrada del podio, cada uno de 0 a 1. Con «Reducir
 * movimiento» activado en el telefono, todo arranca en 1: se ve directo.
 *
 * @param siguientes cuantos aparecen despues del ganador (2º, 3º y el resto)
 */
function useEntradaDelPodio(lista: boolean, siguientes: number) {
  const escalones = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  const ganador = useRef(new Animated.Value(0)).current;
  const pie = useRef(new Animated.Value(0)).current;
  // Reflector: `luz` lo prende y lo apaga, `cierre` lo achica de 0 (abierto) a 1 (chiquito).
  // Arranca prendido: la pantalla no se ve ni un cuadro antes que el circulo.
  const luz = useRef(new Animated.Value(1)).current;
  const cierre = useRef(new Animated.Value(0)).current;
  // Uno por cada participante que aparece despues del ganador. Se crean al saber cuantos son.
  const apariciones = useRef<Animated.Value[]>([]).current;
  while (apariciones.length < siguientes) apariciones.push(new Animated.Value(0));
  const [confeti, setConfeti] = useState(false);
  const empezo = useRef(false);

  useEffect(() => {
    if (!lista || empezo.current) return;
    empezo.current = true;
    const nativo = Platform.OS !== 'web';
    let vigente = true;
    const hasta = (valor: Animated.Value, duracion: number, curva = Easing.out(Easing.cubic), destino = 1) =>
      Animated.timing(valor, { toValue: destino, duration: duracion, easing: curva, useNativeDriver: nativo });

    void AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reducir) => {
        if (!vigente) return;
        if (reducir) {
          [...escalones, ganador, pie, ...apariciones].forEach((valor) => valor.setValue(1));
          luz.setValue(0);
          return;
        }
        Animated.sequence([
          Animated.delay(PAUSA_TAPADA),
          Animated.parallel([
            hasta(cierre, CIERRE_REFLECTOR, Easing.inOut(Easing.cubic)),
            Animated.sequence([
              Animated.delay(ESPERA_ESCALONES),
              Animated.stagger(ENTRE_ESCALONES, escalones.map((valor) => hasta(valor, SUBIDA_ESCALON))),
            ]),
          ]),
        ]).start(() => {
          if (!vigente) return;
          setConfeti(true);
          Animated.parallel([
            hasta(luz, APAGADO_REFLECTOR, Easing.out(Easing.quad), 0),
            Animated.spring(ganador, { toValue: 1, friction: 5, tension: 80, useNativeDriver: nativo }),
          ]).start();
          // Mientras cae el confeti, los demas de a uno, y al final el boton.
          Animated.sequence([
            Animated.delay(PAUSA_ANTES_DEL_RESTO),
            Animated.stagger(ENTRE_APARICIONES, [...apariciones, pie].map((valor) => hasta(valor, APARICION))),
          ]).start();
        });
      });

    return () => {
      vigente = false;
    };
  }, [lista, escalones, ganador, pie, luz, cierre, apariciones]);

  return { escalones, ganador, pie, apariciones, reflector: { luz, cierre }, confeti };
}

interface PropsPuesto {
  puesto: Puesto;
  participante: Participante;
}

interface PropsEscalon extends PropsPuesto {
  /** De 0 a 1: el escalon sube desde abajo. */
  escalon: Animated.Value;
  /** De 0 a 1: aparece quien esta arriba (con rebote si es el ganador). */
  persona: Animated.Value;
  /** El ganador, cuando le toca: explota el confeti desde su nombre. */
  confeti: boolean;
  /** Solo el ganador: el reflector que lo apunta antes de aparecer. */
  reflector?: { luz: Animated.Value; cierre: Animated.Value };
}

/** Avatar (con corona el 1º) y «nombre · puntos» arriba; el escalon con la posicion abajo. */
function Escalon({ puesto, participante, escalon, persona, confeti, reflector }: PropsEscalon) {
  const styles = useEstilos();
  const { posicion, total } = puesto;
  const esPrimero = posicion === 1;
  const alto = ALTO_ESCALON[posicion] ?? ALTO_ESCALON[3]!;
  const subida = escalon.interpolate({ inputRange: [0, 1], outputRange: [alto, 0] });
  const aparicion = esPrimero
    ? { opacity: persona, transform: [{ scale: persona.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }] }
    : { opacity: persona, transform: [{ translateY: persona.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] };
  return (
    <View
      accessible
      accessibilityLabel={`${es.finalizar.puesto(posicion)}: ${participante.nombre}, ${es.comun.puntos(total)}`}
      style={[styles.columna, esPrimero && styles.columnaPrimero]}
    >
      {/* El confeti va al lado y no adentro: si no, se achicaria y desvaneceria con el rebote. */}
      <View style={styles.lugarDeLaPersona}>
        {reflector !== undefined && <Reflector {...reflector} />}
        <Animated.View style={[styles.persona, aparicion]}>
          {esPrimero && <Corona />}
          <Avatar
            tipo={participante.avatarTipo}
            valor={participante.avatarValor}
            nombre={participante.nombre}
            tamano={TAMANO_PERSONA[posicion] ?? TAMANO_PERSONA[3]}
          />
          <Text style={[styles.nombre, numerales]} numberOfLines={1}>
            {`${participante.nombre} · ${puntosCortos(total)}`}
          </Text>
        </Animated.View>
        {esPrimero && <Confeti activo={confeti} />}
      </View>
      <View style={[styles.escalonRecorte, { height: alto }]}>
        <Animated.View
          style={[
            styles.escalon,
            { backgroundColor: COLOR_ESCALON[posicion] ?? PODIO.tercero },
            { height: alto, opacity: escalon, transform: [{ translateY: subida }] },
          ]}
        >
          <Text style={[styles.numero, esPrimero && styles.numeroPrimero]}>{posicion}</Text>
        </Animated.View>
      </View>
    </View>
  );
}

/** El circulo del reflector a escala 1, y lo que queda al final: el lugar del ganador. */
const LADO_LUZ = 100;

/**
 * Un circulo centrado en el lugar del ganador (cambio 105, solo el circulo
 * desde el 106, oscuro desde el 107). Arranca tan grande que tapa toda la
 * pantalla, sin dejar ver lo de abajo, y se va cerrando hasta el primer puesto.
 * `luz` lo prende y lo apaga.
 */
function Reflector({ luz, cierre }: { luz: Animated.Value; cierre: Animated.Value }) {
  const styles = useEstilos();
  const { width, height } = useWindowDimensions();
  // Desde el ganador hasta la esquina mas lejana entra con la diagonal entera.
  const enorme = (2 * Math.hypot(width, height)) / LADO_LUZ;
  const escala = cierre.interpolate({ inputRange: [0, 1], outputRange: [enorme, 1] });
  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.reflector}>
      <Animated.View
        style={[styles.luz, { opacity: luz, transform: [{ scale: escala }] }]}
      />
    </View>
  );
}

interface PropsFila extends PropsPuesto {
  /** De 0 a 1: aparece en su turno, despues del ganador. */
  aparicion: Animated.Value;
  /** La primera no lleva la raya punteada de arriba. */
  primera: boolean;
}

/** La lamina: la posicion, el personaje, el nombre y los puntos a la derecha. */
function FilaDelResto({ puesto, participante, aparicion, primera }: PropsFila) {
  const styles = useEstilos();
  return (
    <Animated.View
      accessible
      accessibilityLabel={`${es.finalizar.puesto(puesto.posicion)}: ${participante.nombre}, ${es.comun.puntos(puesto.total)}`}
      style={[
        {
          opacity: aparicion,
          transform: [{ translateY: aparicion.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
        },
      ]}
    >
      {!primera && (
        // En iOS un borde punteado en un solo lado no se dibuja: se recorta la mitad de un rectangulo punteado.
        <View style={styles.raya}>
          <View style={styles.rayaPunteada} />
        </View>
      )}
      <View style={styles.fila}>
        <Text style={[styles.posicionChica, numerales]}>{puesto.posicion}</Text>
        <Avatar tipo={participante.avatarTipo} valor={participante.avatarValor} nombre={participante.nombre} />
        <Text style={styles.nombreFila} numberOfLines={1}>
          {participante.nombre}
        </Text>
        <Text style={[styles.puntosFila, numerales]}>{puntosCortos(puesto.total)}</Text>
      </View>
    </Animated.View>
  );
}

const useEstilos = crearEstilos((colores) => ({
  pantalla: { flex: 1, backgroundColor: PODIO.fondo },
  fueraDePantalla: { position: 'absolute', top: 0, left: -2 * ANCHO_IMAGEN, width: ANCHO_IMAGEN, height: ALTO_IMAGEN },
  barraSuperior: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: espacios.md, zIndex: 4 },
  // Area tocable de 44 con el hitSlop del margen (RNF-3).
  botonCompartir: {
    width: LADO_BOTON_COMPARTIR,
    height: LADO_BOTON_COMPARTIR,
    margin: (AREA_TOCABLE_MINIMA - LADO_BOTON_COMPARTIR) / 2,
    borderRadius: LADO_BOTON_COMPARTIR / 2,
    borderWidth: BORDE,
    borderColor: PODIO.tinta,
    backgroundColor: PODIO.tarjeta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presionado: { opacity: 0.6 },
  contenido: { paddingHorizontal: espacios.xl, paddingTop: espacios.lg, paddingBottom: espacios.xl },
  encabezado: { alignItems: 'center', gap: espacios.xs, marginBottom: espacios.xl },
  etiqueta: { ...tipografia.etiqueta, color: colores.tinta, opacity: 0.8, textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center' },
  titulo: { ...tipografia.titulo, fontSize: 38, lineHeight: 44, letterSpacing: -1, color: colores.tinta, textAlign: 'center' },
  podio: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: espacios.xs },
  columna: { flex: 1, maxWidth: 120, alignItems: 'center' },
  // El confeti sale del ganador y tiene que pasar por encima de las otras columnas.
  columnaPrimero: { zIndex: 1 },
  // Por encima del escalon de su columna: el circulo oscuro tiene que tapar tambien el «1» (cambio 108).
  lugarDeLaPersona: { alignSelf: 'stretch', zIndex: 2 },
  // Un punto en el centro del lugar del ganador: el circulo de luz se centra ahi.
  reflector: { position: 'absolute', top: '50%', left: '50%', width: 0, height: 0, overflow: 'visible' },
  luz: {
    position: 'absolute',
    top: -LADO_LUZ / 2,
    left: -LADO_LUZ / 2,
    width: LADO_LUZ,
    height: LADO_LUZ,
    borderRadius: LADO_LUZ / 2,
    // Tapa del todo lo de abajo hasta que se cierra (cambio 107).
    backgroundColor: PODIO.reflector,
  },
  persona: { alignItems: 'center', gap: espacios.xxs },
  // El escalon sube desde abajo de la base del podio, sin verse por debajo.
  escalonRecorte: { alignSelf: 'stretch', overflow: 'hidden', justifyContent: 'flex-end' },
  nombre: { ...tipografia.cuerpoFuerte, fontFamily: fuentes.cuerpoBold, color: colores.tinta, marginTop: espacios.xxs, marginBottom: espacios.sm },
  escalon: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingTop: espacios.md,
    borderWidth: BORDE,
    borderBottomWidth: 0,
    borderColor: PODIO.tinta,
    borderTopLeftRadius: radios.lg,
    borderTopRightRadius: radios.lg,
  },
  numero: { ...tipografia.numeroGrande, fontSize: 40, lineHeight: 46, color: PODIO.tinta },
  numeroPrimero: { fontSize: 52, lineHeight: 58 },
  // La tarjeta del resto tapa el pie de los escalones, como en la lamina.
  tarjetaResto: {
    zIndex: 3,
    marginTop: -espacios.md,
    paddingHorizontal: espacios.md,
    paddingVertical: espacios.xs,
    backgroundColor: PODIO.tarjeta,
    borderWidth: BORDE,
    borderColor: PODIO.tinta,
    borderRadius: radios.lg,
  },
  fila: { flexDirection: 'row', alignItems: 'center', gap: espacios.sm, paddingVertical: espacios.sm },
  raya: { height: 2, overflow: 'hidden' },
  rayaPunteada: { height: 6, borderWidth: 2, borderStyle: 'dashed', borderColor: PODIO.lineaTarjeta, borderRadius: 1 },
  posicionChica: { ...tipografia.tituloChico, color: PODIO.tinta, minWidth: 18 },
  nombreFila: { ...tipografia.cuerpoFuerte, color: PODIO.tinta, flex: 1 },
  puntosFila: { ...tipografia.tituloChico, color: PODIO.tinta },
  pie: {
    alignItems: 'stretch',
    gap: espacios.sm,
    paddingHorizontal: espacios.xl,
    paddingTop: espacios.md,
    paddingBottom: espacios.md,
  },
  error: { ...tipografia.chico, color: colores.alerta, textAlign: 'center' },
  volver: { alignSelf: 'center', paddingVertical: espacios.xs },
  textoVolver: { ...tipografia.cuerpoFuerte, fontFamily: fuentes.cuerpoBold, color: colores.destacado, textDecorationLine: 'underline' },
}));
