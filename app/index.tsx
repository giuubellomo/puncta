import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { Boton } from '@/components/Boton';
import { BotonIcono } from '@/components/BotonIcono';
import { FondoConEstrellitas } from '@/components/FondoConEstrellitas';
import { Popup } from '@/components/Popup';
import { SheetDeArmado } from '@/components/SheetDeArmado';
import { numeroRondaEnCurso } from '@/domain/rondas';
import { esTruco } from '@/domain/truco';
import type { Partida } from '@/domain/types';
import { usePartidaEnCurso } from '@/hooks/usePartidaEnCurso';
import { es } from '@/i18n/es';
import * as ajustes from '@/repositories/ajustes';
import * as partidas from '@/repositories/partidas';
import { iconos } from '@/theme/iconos';
import { crearEstilos } from '@/theme/tema';
import { espacios, fuentes, radios, tipografia } from '@/theme/tokens';

/** La tarjeta «Seguir», casi negra en cualquier tema, como en la lamina. */
const OSCURO = '#141118';
const CLARO_SOBRE_OSCURO = '#DCC6EE';

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
  // El logo ocupa el ancho, como en la lamina: «puncta» mide unas 3,2 veces su tamaño de letra.
  const tamanoLogo = Math.min(128, Math.floor((width - 2 * espacios.xl) / 3.2));

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
        <Text
          accessibilityRole="header"
          allowFontScaling={false}
          style={[styles.titulo, { fontSize: tamanoLogo, lineHeight: Math.round(tamanoLogo * 1.02), letterSpacing: -tamanoLogo * 0.055 }]}
        >
          {es.home.titulo}
        </Text>
        <Text style={styles.subtitulo}>{es.home.subtitulo}</Text>
      </View>

      {/* El lugar que sobra queda entre el logo y los botones. */}
      <View style={styles.medio} />

      <View style={styles.acciones}>
        {/* Hasta la primera lectura no se dibuja nada: si no, «Seguir» aparece de golpe. */}
        {!cargando && (
          <>
            <Boton titulo={es.home.nuevoJuego} variante="destacado" onPress={nuevoJuego} />
            {partida !== null && <SeguirPartida partida={partida} />}
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

/**
 * RF-102, como la lamina: quienes juegan, «Seguir: nombre» y en que ronda va.
 * Abre la partida (7.1).
 */
function SeguirPartida({ partida }: { partida: Partida }) {
  const styles = useEstilos();
  const router = useRouter();
  const ronda = esTruco(partida.plantilla)
    ? partida.plantilla.nombre
    : es.home.rondaDe(numeroRondaEnCurso(partida.rondas), partida.plantilla.rondasIlimitadas ? null : partida.plantilla.rondas.length);
  // Hasta tres caras, una encima de la otra.
  const caras = partida.participantes.slice(0, 3);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${es.home.seguir(partida.nombre)}. ${ronda}`}
      onPress={() => router.push({ pathname: '/partida/[id]', params: { id: partida.id } })}
      style={({ pressed }) => [styles.seguir, pressed && styles.presionado]}
    >
      <View style={styles.caras}>
        {caras.map((p, i) => (
          <View key={p.id} style={i > 0 && styles.caraPisada}>
            <Avatar tipo={p.avatarTipo} valor={p.avatarValor} nombre={p.nombre} tamano={32} />
          </View>
        ))}
      </View>
      <View style={styles.seguirTexto}>
        <Text style={styles.seguirTitulo} numberOfLines={1}>
          {es.home.seguir(partida.nombre)}
        </Text>
        <Text style={styles.seguirRonda} numberOfLines={1}>
          {ronda}
        </Text>
      </View>
      <Text allowFontScaling={false} style={styles.flecha}>
        {iconos.adelante}
      </Text>
    </Pressable>
  );
}

const useEstilos = crearEstilos((colores) => ({
  pantalla: { flex: 1, backgroundColor: colores.fondo, paddingHorizontal: espacios.xl, paddingBottom: espacios.lg },
  arriba: { flexDirection: 'row', justifyContent: 'flex-end', paddingTop: espacios.sm },
  marca: { gap: espacios.xs },
  medio: { flex: 1 },
  titulo: { fontFamily: fuentes.display, color: colores.tinta },
  subtitulo: { ...tipografia.cuerpoFuerte, color: colores.grisOscuro },
  // Los botones van abajo, al alcance del pulgar; los personajes llenan lo que sobra.
  acciones: { gap: espacios.sm, paddingTop: espacios.md },
  seguir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacios.sm,
    paddingVertical: espacios.sm,
    paddingHorizontal: espacios.md,
    borderRadius: radios.lg,
    backgroundColor: OSCURO,
  },
  presionado: { opacity: 0.85 },
  caras: { flexDirection: 'row' },
  caraPisada: { marginLeft: -10 },
  seguirTexto: { flex: 1, gap: 2 },
  seguirTitulo: { ...tipografia.cuerpoFuerte, fontFamily: fuentes.cuerpoBold, color: '#FFFFFF' },
  seguirRonda: { ...tipografia.secundario, color: CLARO_SOBRE_OSCURO },
  flecha: { ...tipografia.subtitulo, color: colores.destacado },
  textoPopup: { ...tipografia.cuerpo, color: colores.tinta },
  error: { ...tipografia.secundario, color: colores.alerta },
  botonesPopup: { flexDirection: 'row', gap: espacios.sm },
  boton: { flex: 1 },
}));
