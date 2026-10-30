import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { Boton } from '@/components/Boton';
import { BotonIcono } from '@/components/BotonIcono';
import { FondoConEstrellitas } from '@/components/FondoConEstrellitas';
import { LogoPuncta } from '@/components/LogoPuncta';
import { Popup } from '@/components/Popup';
import { SheetDeArmado } from '@/components/SheetDeArmado';
import { rankear, type Puesto } from '@/domain/ranking';
import { numeroRondaEnCurso } from '@/domain/rondas';
import { esTruco } from '@/domain/truco';
import type { Partida } from '@/domain/types';
import { usePartidaEnCurso } from '@/hooks/usePartidaEnCurso';
import { es } from '@/i18n/es';
import * as ajustes from '@/repositories/ajustes';
import * as partidas from '@/repositories/partidas';
import { iconos } from '@/theme/iconos';
import { crearEstilos } from '@/theme/tema';
import { BORDE, espacios, fuentes, numerales, radios, tipografia } from '@/theme/tokens';

/**
 * Home (paso 4.2, RF-101 a RF-105; lamina del Home desde el cambio 118).
 *
 * Sobre el fondo del tema con estrellitas: el engranaje arriba, el logo
 * grande y, abajo, al alcance del pulgar, «Nuevo juego», «Seguir» si hay una
 * partida abierta, y Plantillas. Sin «Hola, Giu»
 * ni Historial (decision de la usuaria, cambio 113).
 *
 * A-5 se hace cumplir aca: con una partida abierta, «Nuevo juego» no arma nada,
 * pide confirmacion para terminar la anterior. Nunca hay dos `en_curso`.
 */
export default function Home() {
  const styles = useEstilos();
  const router = useRouter();
  const { partida, cargando, mutar } = usePartidaEnCurso();
  const [confirmando, setConfirmando] = useState(false);
  const [errorAlTerminar, setErrorAlTerminar] = useState(false);
  const [armando, setArmando] = useState(false);

  const { width } = useWindowDimensions();
  // El logo ocupa el ancho, como en la lamina, sin pasarse en una tablet.
  const anchoLogo = Math.min(420, width - 2 * espacios.xl);

  const abrirArmado = () => setArmando(true);

  // Cambio 96: quien abre la app por primera vez ve el instructivo encima del Home.
  useEffect(() => {
    let vigente = true;
    ajustes
      .instructivoVisto()
      .then((visto) => {
        if (vigente && !visto) router.push('/instructivo');
      })
      .catch(() => undefined);
    return () => {
      vigente = false;
    };
  }, [router]);

  const nuevoJuego = () => {
    if (partida === null) {
      abrirArmado();
      return;
    }
    setErrorAlTerminar(false);
    setConfirmando(true);
  };

  /** A-5: termina la anterior (mismo camino que el paso 8.1) y recien ahi arma. */
  const terminarYEmpezar = async () => {
    if (partida === null) return;
    try {
      await mutar(() => partidas.finalizar(partida.id));
    } catch {
      setErrorAlTerminar(true);
      return;
    }
    setConfirmando(false);
    abrirArmado();
  };

  return (
    <SafeAreaView style={styles.pantalla}>
      <FondoConEstrellitas />
      <View style={styles.arriba}>
        <BotonIcono
          icono={iconos.engranaje}
          etiqueta={es.home.configuracion}
          tamano={48}
          onPress={() => router.push('/config')}
        />
      </View>

      <View style={styles.marca}>
        {/* Cambio 128: el logo dibujado, mas abajo y sin la frase. */}
        <LogoPuncta ancho={anchoLogo} />
      </View>

      {/* El lugar que sobra queda entre el logo y los botones. */}
      <View style={styles.medio} />

      <View style={styles.acciones}>
        {/* Hasta la primera lectura no se dibuja nada: si no, «Seguir» aparece de golpe. */}
        {!cargando && (
          <>
            {/* Cambio 128: la partida abierta va primero, arriba de «Nuevo juego». */}
            {partida !== null && <SeguirPartida partida={partida} />}
            <Boton titulo={es.home.nuevoJuego} variante="destacado" onPress={nuevoJuego} grande />
            <Boton
              titulo={es.home.plantillas}
              icono={iconos.plantillaNueva}
              variante="secundario"
              onPress={() => router.push('/plantillas')}
            />
          </>
        )}
      </View>

      {partida !== null && (
        <Popup
          visible={confirmando}
          onCerrar={() => setConfirmando(false)}
          etiquetaCerrar={es.comun.cerrar}
          titulo={es.finalizar.confirmarTitulo}
        >
          <Text style={styles.textoPopup}>{es.home.terminarAnterior(partida.nombre)}</Text>
          {errorAlTerminar && <Text style={styles.error}>{es.comun.errorGuardar}</Text>}
          <View style={styles.botonesPopup}>
            <View style={styles.boton}>
              <Boton titulo={es.comun.cancelar} variante="secundario" onPress={() => setConfirmando(false)} />
            </View>
            <View style={styles.boton}>
              <Boton titulo={es.comun.terminar} onPress={() => void terminarYEmpezar()} />
            </View>
          </View>
        </Popup>
      )}

      <SheetDeArmado visible={armando} onCerrar={() => setArmando(false)} />
    </SafeAreaView>
  );
}

/** Los que van detras del primero que entran al lado; con mas, «+3». */
const MAXIMO_DETRAS = 3;

/**
 * RF-102 (cambio 128): la partida abierta como una tarjeta clara que muestra
 * como va, y no como un boton. Arriba el nombre y la ronda; en el medio quien va
 * ganando, grande, y los demas chiquitos con sus puntos; abajo «Seguir jugando».
 * Toda la tarjeta abre la partida (7.1). Quien gana lo dice `rankear`, con el
 * criterio de la plantilla.
 */
function SeguirPartida({ partida }: { partida: Partida }) {
  const styles = useEstilos();
  const router = useRouter();
  const ronda = esTruco(partida.plantilla)
    ? partida.plantilla.nombre
    : es.home.rondaDe(numeroRondaEnCurso(partida.rondas), partida.plantilla.rondasIlimitadas ? null : partida.plantilla.rondas.length);
  const puestos = rankear(partida);
  const quien = (puesto: Puesto) => partida.participantes.find((p) => p.id === puesto.participanteId)!;
  const primeros = puestos.filter((puesto) => puesto.posicion === 1);
  const detras = puestos.filter((puesto) => puesto.posicion !== 1);
  const lider = quien(primeros[0]!);
  const nombresPrimeros = primeros.map((puesto) => quien(puesto).nombre);
  const puntosPrimeros = puntosCortos(primeros[0]!.total);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${es.home.seguir(partida.nombre)}. ${ronda}. ${es.home.vaGanando(nombresPrimeros.length)} ${nombresPrimeros.join(' y ')}, ${puntosPrimeros}`}
      onPress={() => router.push({ pathname: '/partida/[id]', params: { id: partida.id } })}
      style={({ pressed }) => [styles.seguir, pressed && styles.presionado]}
    >
      <View style={styles.seguirCabecera}>
        <Text style={styles.seguirNombre} numberOfLines={1}>
          {partida.nombre}
        </Text>
        <Text style={styles.seguirRonda} numberOfLines={1}>
          {ronda}
        </Text>
      </View>

      <View style={styles.seguirMedio}>
        <Avatar tipo={lider.avatarTipo} valor={lider.avatarValor} nombre={lider.nombre} tamano={48} />
        <View style={styles.seguirLider}>
          <Text style={styles.seguirEtiqueta}>{es.home.vaGanando(nombresPrimeros.length)}</Text>
          <Text style={[styles.seguirGanador, numerales]} numberOfLines={1}>
            {`${nombresPrimeros.join(' y ')} · ${puntosPrimeros}`}
          </Text>
        </View>
        <View style={styles.detras}>
          {detras.slice(0, MAXIMO_DETRAS).map((puesto) => {
            const p = quien(puesto);
            return (
              <View key={p.id} style={styles.otro}>
                <Avatar tipo={p.avatarTipo} valor={p.avatarValor} nombre={p.nombre} tamano={32} />
                <Text style={[styles.puntosOtro, numerales]}>{puntosCortos(puesto.total)}</Text>
              </View>
            );
          })}
          {detras.length > MAXIMO_DETRAS && (
            <Text style={styles.masJugadores}>{es.home.masJugadores(detras.length - MAXIMO_DETRAS)}</Text>
          )}
        </View>
      </View>

      <Text style={styles.seguirJugando}>{`${es.home.seguirJugando} ${iconos.adelante}`}</Text>
    </Pressable>
  );
}

/** Como en el podio: «85», «−40», sin el «+». */
function puntosCortos(total: number): string {
  return total < 0 ? `−${Math.abs(total)}` : String(total);
}

const useEstilos = crearEstilos((colores) => ({
  pantalla: { flex: 1, backgroundColor: colores.fondo, paddingHorizontal: espacios.xl, paddingBottom: espacios.lg },
  arriba: { flexDirection: 'row', justifyContent: 'flex-end', paddingTop: espacios.sm },
  marca: { marginTop: 2 * espacios.xxl + espacios.md, alignItems: 'center' },
  medio: { flex: 1 },
  // Los botones van abajo, al alcance del pulgar; los personajes llenan lo que sobra.
  acciones: { gap: espacios.sm, paddingTop: espacios.md },
  seguir: {
    gap: espacios.sm,
    paddingVertical: espacios.sm,
    paddingHorizontal: espacios.md,
    borderRadius: radios.lg,
    borderWidth: BORDE,
    borderColor: colores.borde,
    backgroundColor: colores.tarjeta,
  },
  presionado: { opacity: 0.85 },
  seguirCabecera: { flexDirection: 'row', alignItems: 'baseline', gap: espacios.sm },
  seguirNombre: { ...tipografia.cuerpoFuerte, fontFamily: fuentes.cuerpoBold, color: colores.tinta, flex: 1 },
  seguirRonda: { ...tipografia.chico, fontSize: 13, color: colores.grisOscuro },
  seguirMedio: { flexDirection: 'row', alignItems: 'center', gap: espacios.sm },
  seguirLider: { flex: 1 },
  seguirEtiqueta: { ...tipografia.chico, color: colores.grisOscuro },
  seguirGanador: { ...tipografia.subtitulo, color: colores.tinta },
  detras: { flexDirection: 'row', alignItems: 'center', gap: espacios.xs },
  otro: { alignItems: 'center', gap: 2 },
  puntosOtro: { ...tipografia.chico, fontFamily: fuentes.cuerpoBold, color: colores.grisOscuro },
  masJugadores: { ...tipografia.chico, fontFamily: fuentes.cuerpoBold, color: colores.grisOscuro },
  seguirJugando: { ...tipografia.secundario, fontFamily: fuentes.cuerpoBold, color: colores.tinta, textAlign: 'right' },
  textoPopup: { ...tipografia.cuerpo, color: colores.tinta },
  error: { ...tipografia.secundario, color: colores.alerta },
  botonesPopup: { flexDirection: 'row', gap: espacios.sm },
  boton: { flex: 1 },
}));
