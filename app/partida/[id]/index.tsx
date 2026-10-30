import { useKeepAwake } from 'expo-keep-awake';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Keyboard, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AvisoDeObjetivo } from '@/components/AvisoDeObjetivo';
import { Boton } from '@/components/Boton';
import { BotonIcono } from '@/components/BotonIcono';
import { BotonLiviano } from '@/components/BotonLiviano';
import { CampoTexto } from '@/components/CampoTexto';
import { PaginasDeRondas } from '@/components/PaginasDeRondas';
import { Popup } from '@/components/Popup';
import { PopupDeCanasta } from '@/components/PopupDeCanasta';
import { PopupDeCarga } from '@/components/PopupDeCarga';
import { SheetDePlanilla } from '@/components/SheetDePlanilla';
import { TableroDeTruco } from '@/components/TableroDeTruco';
import { esCanasta } from '@/domain/canasta';
import { nuevosEnLaRonda } from '@/domain/objetivo';
import { rondaEnCursoIncompleta } from '@/domain/rondas';
import { esTruco } from '@/domain/truco';
import type { Partida, RondaJugada } from '@/domain/types';
import { usePartida } from '@/hooks/usePartida';
import { es } from '@/i18n/es';
import * as partidas from '@/repositories/partidas';
import { iconos } from '@/theme/iconos';
import { crearEstilos } from '@/theme/tema';
import { espacios, tipografia } from '@/theme/tokens';

/**
 * Partida en curso (paso 7.1, RF-701, RF-702, RF-712): encabezado con el nombre,
 * que se elige al armarla y aca no se edita (registro, cambio 71), las rondas y
 * TERMINAR PARTIDA fijo abajo. Todo sale de la base via `usePartida`: salir y
 * volver deja todo igual. Tocar a un participante abre el popup de carga (7.4)
 * y SIGUIENTE cierra la ronda en juego (7.5), o antes avisa si alguien llego al
 * objetivo (cambio 120). Las rondas van una por pantalla
 * (cambio 100): una cerrada se corrige con el mismo popup (7.6). TERMINAR pide
 * confirmacion y finaliza la partida (8.1).
 */
export default function PantallaDePartida() {
  const styles = useEstilos();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { partida, mutar } = usePartida(id);
  // A quien se le esta cargando. Se guarda aparte de `abierta` para que el popup
  // no se vacie mientras se desvanece al cerrarse.
  const [carga, setCarga] = useState<{ numeroRonda: number; participanteId: string } | null>(null);
  const [cargaAbierta, setCargaAbierta] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [errorAlTerminar, setErrorAlTerminar] = useState(false);
  const [viendoAyuda, setViendoAyuda] = useState(false);
  const [viendoPlanilla, setViendoPlanilla] = useState(false);
  // Cambio 119: la ronda cuyo objetivo se esta escribiendo, y lo escrito.
  const [objetivoEnEdicion, setObjetivoEnEdicion] = useState<number | null>(null);
  const [textoObjetivo, setTextoObjetivo] = useState('');
  const [errorObjetivo, setErrorObjetivo] = useState(false);
  // Cambio 120: el aviso de SIGUIENTE cuando alguien llego al objetivo. `responder`
  // le contesta a la tarjeta si la ronda se cerro (true) o no (false).
  const [avisoDeObjetivo, setAvisoDeObjetivo] = useState<{
    numeroRonda: number;
    nombres: string[];
    responder: (avanzo: Promise<boolean>) => void;
  } | null>(null);

  // RF-713: en la mesa nadie toca el telefono por un rato y la pantalla no se apaga.
  useKeepAwake();

  if (partida === null) return null;

  // RF-711: la partida ya no aparece en el Home. Replace: desde el podio, atras
  // es el Home y no una partida finalizada.
  const irAlPodio = () => router.replace({ pathname: '/partida/[id]/final', params: { id: partida.id } });

  const terminar = async () => {
    try {
      await mutar(() => partidas.finalizar(partida.id));
    } catch {
      setErrorAlTerminar(true);
      return;
    }
    setConfirmando(false);
    irAlPodio();
  };

  const cerrarRonda = async (numeroRonda: number) => {
    await mutar(() => partidas.cerrarRonda(partida.id, numeroRonda));
    return true;
  };

  // Cambio 120: llegar al objetivo no corta la carga. Al tocar SIGUIENTE, si
  // alguien llego en esta ronda, se pregunta antes de cerrarla.
  const siguiente = (numeroRonda: number): Promise<boolean> => {
    const nuevos = nuevosEnLaRonda(partida, numeroRonda);
    if (nuevos.length === 0) return cerrarRonda(numeroRonda);
    return new Promise((resolve) =>
      setAvisoDeObjetivo({
        numeroRonda,
        nombres: nuevos.map((id) => partida.participantes.find((p) => p.id === id)?.nombre ?? ''),
        responder: (avanzo) => {
          setAvisoDeObjetivo(null);
          resolve(avanzo);
        },
      }),
    );
  };

  // Desde el aviso, sin la confirmacion de TERMINAR: ya es una.
  const terminarDesdeElAviso = async () => {
    await mutar(() => partidas.finalizar(partida.id));
    avisoDeObjetivo?.responder(Promise.resolve(false));
    irAlPodio();
  };

  const pedirTerminar = () => {
    setErrorAlTerminar(false);
    setConfirmando(true);
  };

  const objetivo = partida.plantilla.puntajeObjetivo;
  const { ayuda } = partida.plantilla;

  const abrirObjetivo = (numeroRonda: number) => {
    setTextoObjetivo(partida.rondas.find((ronda) => ronda.numero === numeroRonda)?.objetivo ?? '');
    setErrorObjetivo(false);
    setObjetivoEnEdicion(numeroRonda);
  };

  const guardarObjetivo = async () => {
    if (objetivoEnEdicion === null) return;
    Keyboard.dismiss();
    try {
      await mutar(() => partidas.escribirObjetivo(partida.id, objetivoEnEdicion, textoObjetivo));
    } catch {
      setErrorObjetivo(true);
      return;
    }
    setObjetivoEnEdicion(null);
  };

  return (
    <SafeAreaView style={styles.pantalla}>
      <View style={styles.encabezado}>
        <BotonIcono icono={iconos.atras} etiqueta={es.comun.volver} tamano={36} onPress={() => router.back()} />
        <View style={styles.textosEncabezado}>
          <Text accessibilityRole="header" style={styles.titulo}>
            {partida.nombre}
          </Text>
          <Text style={styles.hasta}>{es.partida.subtitulo(objetivo, partida.plantilla.criterioVictoria)}</Text>
        </View>
        {/* Cambio 123: toda la partida en una tabla. El Truco no tiene rondas. */}
        {!esTruco(partida.plantilla) && (
          <BotonLiviano icono="planilla" etiqueta={es.partida.verPlanilla} onPress={() => setViendoPlanilla(true)} />
        )}
        {/* Cambio 119: como se cuenta, a mano en la mesa. */}
        {ayuda !== undefined && (
          <BotonLiviano icono="ayuda" etiqueta={es.partida.verAyuda} onPress={() => setViendoAyuda(true)} />
        )}
      </View>

      {/* Cambio 93: el Truco se anota de a palitos, sin rondas. */}
      {esTruco(partida.plantilla) ? (
        <TableroDeTruco
          partida={partida}
          onSumar={(participanteId, delta) => mutar(() => partidas.sumarPalitos(partida.id, participanteId, delta))}
          onFinalizar={() => mutar(() => partidas.finalizar(partida.id))}
          onIrAlPodio={irAlPodio}
        />
      ) : (
        // Cambio 100: una ronda por pantalla, y SIGUIENTE desliza a la nueva.
        <PaginasDeRondas
          partida={partida}
          rondas={rondasAMostrar(partida)}
          onTocarParticipante={(numeroRonda, participanteId) => {
            setCarga({ numeroRonda, participanteId });
            setCargaAbierta(true);
          }}
          onSiguiente={siguiente}
          onTocarObjetivo={partida.plantilla.objetivoEditable ? abrirObjetivo : undefined}
          onTerminar={pedirTerminar}
        />
      )}

      {/* Las rondas llevan su pie (cambio 125); el Truco, este. */}
      {esTruco(partida.plantilla) && (
        <View style={styles.pie}>
          <Boton titulo={es.partida.terminarPartida} variante="secundario" onPress={pedirTerminar} />
        </View>
      )}

      {/* RF-710: confirmacion, con aviso si la ronda en curso no se podia cerrar. */}
      <Popup
        visible={confirmando}
        onCerrar={() => setConfirmando(false)}
        etiquetaCerrar={es.comun.cerrar}
        titulo={es.finalizar.confirmarTitulo}
      >
        {!esTruco(partida.plantilla) && rondaEnCursoIncompleta(partida) && <Text style={styles.textoPopup}>{es.finalizar.rondaIncompleta}</Text>}
        {errorAlTerminar && <Text style={styles.textoPopup}>{es.comun.errorGuardar}</Text>}
        <View style={styles.botonesPopup}>
          <View style={styles.boton}>
            <Boton titulo={es.comun.cancelar} variante="secundario" onPress={() => setConfirmando(false)} />
          </View>
          <View style={styles.boton}>
            <Boton titulo={es.comun.terminar} onPress={() => void terminar()} />
          </View>
        </View>
      </Popup>

      {objetivo !== undefined && (
        <Popup
          visible={avisoDeObjetivo !== null}
          onCerrar={() => avisoDeObjetivo?.responder(Promise.resolve(false))}
          etiquetaCerrar={es.comun.cerrar}
          titulo={es.carga.llegoAlObjetivo(avisoDeObjetivo?.nombres ?? [], objetivo)}
        >
          <AvisoDeObjetivo
            texto={es.carga.terminarOSeguirJugando}
            // Seguir cierra la ronda; si falla, lo dice la tarjeta debajo del SIGUIENTE.
            onSeguir={() => avisoDeObjetivo?.responder(cerrarRonda(avisoDeObjetivo.numeroRonda))}
            onTerminar={terminarDesdeElAviso}
          />
        </Popup>
      )}

      {!esTruco(partida.plantilla) && (
        <SheetDePlanilla visible={viendoPlanilla} partida={partida} onCerrar={() => setViendoPlanilla(false)} />
      )}

      {ayuda !== undefined && (
        <Popup
          visible={viendoAyuda}
          onCerrar={() => setViendoAyuda(false)}
          etiquetaCerrar={es.comun.cerrar}
          titulo={es.partida.verAyuda}
        >
          <Text style={styles.textoPopup}>{ayuda}</Text>
        </Popup>
      )}

      <Popup
        visible={objetivoEnEdicion !== null}
        onCerrar={() => {
          Keyboard.dismiss();
          setObjetivoEnEdicion(null);
        }}
        etiquetaCerrar={es.comun.cerrar}
        titulo={es.partida.objetivoDeLaRonda(objetivoEnEdicion ?? 0)}
      >
        <CampoTexto
          valor={textoObjetivo}
          onCambiar={setTextoObjetivo}
          placeholder={es.partida.ejemploObjetivo}
          accessibilityLabel={es.partida.objetivoDeLaRonda(objetivoEnEdicion ?? 0)}
          maxLength={LARGO_MAXIMO_OBJETIVO}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={() => void guardarObjetivo()}
        />
        {errorObjetivo && <Text style={styles.textoPopup}>{es.comun.errorGuardar}</Text>}
        <Boton titulo={es.comun.guardar} onPress={() => void guardarObjetivo()} />
      </Popup>

      {/* Cambio 101: la Canasta carga cada mano con su calculadora. */}
      {esCanasta(partida.plantilla) ? (
        <PopupDeCanasta
          visible={cargaAbierta}
          partida={partida}
          numeroRonda={carga?.numeroRonda ?? 0}
          participanteId={carga?.participanteId ?? null}
          onCerrar={() => setCargaAbierta(false)}
          onGuardar={(mano) =>
            mutar(() => partidas.guardarManoDeCanasta(partida.id, carga!.numeroRonda, carga!.participanteId, mano))
          }
          onSeguir={(participanteId) => setCarga({ numeroRonda: carga!.numeroRonda, participanteId })}
        />
      ) : (
        <PopupDeCarga
          visible={cargaAbierta}
          partida={partida}
          numeroRonda={carga?.numeroRonda ?? 0}
          participanteId={carga?.participanteId ?? null}
          onCerrar={() => setCargaAbierta(false)}
          onGuardar={(puntos, reglas) =>
            mutar(() => partidas.guardarCarga(partida.id, carga!.numeroRonda, carga!.participanteId, puntos, reglas))
          }
          onSeguir={(participanteId) => setCarga({ numeroRonda: carga!.numeroRonda, participanteId })}
        />
      )}
    </SafeAreaView>
  );
}

/** Una consigna corta: una letra, «Animales», «Solo copas». */
const LARGO_MAXIMO_OBJETIVO = 40;

/**
 * Las rondas de la base, y con rondas ilimitadas una mas bloqueada al final, como
 * dibuja el mockup 5: la siguiente recien se crea al cerrar la actual (7.5).
 */
function rondasAMostrar(partida: Partida): RondaJugada[] {
  const { rondas } = partida;
  const hayEnCurso = rondas.some((ronda) => ronda.estado === 'en_curso');
  if (!partida.plantilla.rondasIlimitadas || !hayEnCurso) return rondas;
  return [...rondas, { numero: rondas.length + 1, estado: 'bloqueada', entradas: [] }];
}

const useEstilos = crearEstilos((colores) => ({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacios.xs,
    paddingHorizontal: espacios.xl,
    paddingTop: espacios.xs,
    paddingBottom: espacios.sm,
  },
  textosEncabezado: { flexShrink: 1 },
  titulo: { ...tipografia.subtitulo, color: colores.tinta },
  hasta: { ...tipografia.secundario, color: colores.grisOscuro },
  textoPopup: { ...tipografia.cuerpo, color: colores.tinta },
  botonesPopup: { flexDirection: 'row', gap: espacios.sm },
  boton: { flex: 1 },
  pie: {
    paddingHorizontal: espacios.xl,
    paddingTop: espacios.md,
    paddingBottom: espacios.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colores.linea,
  },
}));
