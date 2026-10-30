import { useEffect, useState } from 'react';
import { Keyboard, Pressable, Text, View } from 'react-native';

import { siguienteSinCargar, totalConCarga } from '@/domain/carga';
import { faltaParaElObjetivo } from '@/domain/objetivo';
import { puntajeDeReglaEnRonda, quienesTienenRegla, REGLA_CORTO, reglasDeLaRonda } from '@/domain/rondas';
import type { Participante, Partida, Regla, RondaJugada } from '@/domain/types';
import { conSigno, es } from '@/i18n/es';
import { iconos } from '@/theme/iconos';
import { crearEstilos } from '@/theme/tema';
import { espacios, fuentes, numerales, radios, tipografia } from '@/theme/tokens';

import { Boton } from './Boton';
import { EncabezadoDeCarga } from './EncabezadoDeCarga';
import { Etiqueta } from './Etiqueta';
import { Popup } from './Popup';
import { Stepper } from './Stepper';

/** De a cuanto va el stepper; el numero ademas se puede escribir (cambio 76). */
const PASO = 5;
const MAXIMO = 9999;

interface Props {
  visible: boolean;
  partida: Partida;
  numeroRonda: number;
  /** A quien se le carga. Queda puesto mientras el popup se desvanece al cerrarse. */
  participanteId: string | null;
  /** La ✕, el velo o el boton atras: no guarda nada. */
  onCerrar: () => void;
  /** Escribe en la base. El popup se cierra (o sigue con otro) solo si sale bien. */
  onGuardar: (puntos: number, reglasMarcadas: string[]) => Promise<void>;
  /**
   * Cambio 126: despues de guardar, el popup sigue con este participante en lugar
   * de cerrarse. Lo pone la pantalla con `siguienteSinCargar`.
   */
  onSeguir: (participanteId: string) => void;
}

/**
 * Popup de carga (paso 7.4, RF-705, mockup 4), con la identidad de Puncta desde el
 * cambio 126: una franja del color de acento con el personaje, el nombre y la
 * ronda; el puntaje en una casilla grande como la de la fila, siempre positivo
 * (A-2) y con el signo de `modoPuntos` a la vista; las reglas como pastillas que
 * se pintan de sol al marcarlas; y como queda el total. Nada se escribe hasta
 * GUARDAR: ahi va todo junto (`partidas.guardarCarga`).
 *
 * En la ronda en juego, GUARDAR sigue con el proximo que falta cargar sin cerrar
 * el popup (cambio 126). Llegar al objetivo no se avisa aca sino al tocar
 * SIGUIENTE (cambio 120): asi se cargan los demas de la ronda.
 */
export function PopupDeCarga({ visible, partida, numeroRonda, participanteId, onCerrar, onGuardar, onSeguir }: Props) {
  // Cada apertura arranca de lo que hay en la base, no de lo que quedo a medio
  // tocar la vez anterior (igual que PopupParticipante).
  const [apertura, setApertura] = useState(0);
  useEffect(() => {
    if (visible) setApertura((n) => n + 1);
  }, [visible]);

  const participante = partida.participantes.find((p) => p.id === participanteId);
  const ronda = partida.rondas.find((r) => r.numero === numeroRonda);
  const siguienteId = participante === undefined ? null : siguienteSinCargar(partida, numeroRonda, participante.id);
  const siguiente = partida.participantes.find((p) => p.id === siguienteId);

  return (
    <Popup
      visible={visible}
      onCerrar={onCerrar}
      etiquetaCerrar={es.comun.cerrar}
      franja={
        participante !== undefined && (
          <EncabezadoDeCarga participante={participante} subtitulo={es.carga.subtitulo(numeroRonda, ronda?.objetivo)} />
        )
      }
    >
      {participante !== undefined && ronda !== undefined && (
        <Formulario
          // Al seguir con otro, el formulario arranca de cero con lo suyo.
          key={`${apertura}-${participante.id}`}
          partida={partida}
          ronda={ronda}
          participante={participante}
          siguiente={siguiente?.nombre}
          onGuardar={async (puntos, reglas) => {
            await onGuardar(puntos, reglas);
            if (siguiente === undefined) onCerrar();
            else onSeguir(siguiente.id);
          }}
        />
      )}
    </Popup>
  );
}

interface PropsFormulario {
  partida: Partida;
  ronda: RondaJugada;
  participante: Participante;
  /** El nombre del que sigue, para el boton: «y seguir con Tomi». */
  siguiente: string | undefined;
  onGuardar: (puntos: number, reglasMarcadas: string[]) => Promise<void>;
}

function Formulario({ partida, ronda, participante, siguiente, onGuardar }: PropsFormulario) {
  const styles = useEstilos();
  const { plantilla } = partida;
  const entrada = ronda.entradas.find((e) => e.participanteId === participante.id);
  const [puntos, setPuntos] = useState(entrada?.puntosManuales ?? 0);
  const [marcadas, setMarcadas] = useState<string[]>(Object.keys(entrada?.marcas ?? {}));
  const [guardando, setGuardando] = useState(false);
  const [errorAlGuardar, setErrorAlGuardar] = useState(false);

  const reglas = reglasDeLaRonda(plantilla, ronda.numero);
  const signo = plantilla.modoPuntos === 'suma' ? 1 : -1;

  // Cambio 79: el que corto no carga puntaje, queda en 0 y el stepper se apaga.
  const corto = marcadas.includes(REGLA_CORTO);

  // Cambio 126: como queda el total con lo que se esta cargando.
  const total = totalConCarga(partida, ronda.numero, participante.id, puntos, marcadas);
  const falta = faltaParaElObjetivo(total.partida, participante.id, ronda.numero);

  // Las unicas que tiene otro y este no: al marcarlas se le sacan (RF-406).
  const ocupadas = reglas
    .filter((regla) => !marcadas.includes(regla.id))
    .map((regla) => ({ regla, otros: otrosQueLaTienen(regla, ronda, partida, participante.id) }))
    .filter(({ otros }) => otros.length > 0);

  function alternar(reglaId: string) {
    Keyboard.dismiss();
    const marcar = !marcadas.includes(reglaId);
    if (marcar && reglaId === REGLA_CORTO) setPuntos(0);
    setMarcadas((actuales) => (marcar ? [...actuales, reglaId] : actuales.filter((id) => id !== reglaId)));
  }

  async function guardar() {
    Keyboard.dismiss();
    setGuardando(true);
    setErrorAlGuardar(false);
    try {
      await onGuardar(puntos, marcadas);
    } catch {
      setErrorAlGuardar(true);
      setGuardando(false);
    }
  }

  return (
    <>
      <View style={styles.seccion}>
        <Etiqueta texto={es.carga.puntajeDeLaRonda} />
        <Stepper
          valor={puntos}
          onCambiar={setPuntos}
          etiquetaRestar={es.comun.restar}
          etiquetaSumar={es.comun.sumar}
          paso={PASO}
          minimo={0}
          maximo={MAXIMO}
          // A-2: se carga positivo y se ve con el signo que le pone el modo.
          formato={(valor) => conSigno(signo * valor)}
          tamano="casilla"
          escribible
          etiquetaEscribir={es.carga.escribirPuntaje}
          deshabilitado={corto}
        />
        <Text style={styles.ayuda}>{corto ? es.carga.cortoSinPuntaje : es.carga.tocaParaEscribir}</Text>
      </View>

      {reglas.length > 0 && (
        <View style={styles.seccion}>
          <Etiqueta texto={es.carga.reglasDeLaRonda} />
          <View style={styles.pastillas}>
            {reglas.map((regla) => (
              <PastillaDeRegla
                key={regla.id}
                regla={regla}
                puntos={puntajeDeReglaEnRonda(plantilla, ronda.numero, regla.id)}
                marcada={marcadas.includes(regla.id)}
                onPress={() => alternar(regla.id)}
              />
            ))}
          </View>
          {ocupadas.map(({ regla, otros }) => (
            <Text key={regla.id} style={styles.ocupada}>
              {es.carga.laTieneOtro(regla.titulo, otros)}
            </Text>
          ))}
        </View>
      )}

      <View style={styles.total}>
        <Text style={[styles.textoTotal, numerales]}>
          {es.carga.totalAntes(total.antes)}
          <Text style={styles.totalDespues}>{es.carga.totalDespues(total.despues)}</Text>
        </Text>
        {falta !== null && (
          <Text style={[styles.textoTotal, falta === 0 && styles.llega, numerales]}>
            {falta === 0 ? `${iconos.estrella} ${es.carga.llega}` : es.partida.faltan(falta, plantilla.modoPuntos)}
          </Text>
        )}
      </View>

      {errorAlGuardar && <Text style={styles.error}>{es.comun.errorGuardar}</Text>}
      <Boton
        titulo={es.carga.guardar}
        subtitulo={siguiente === undefined ? undefined : es.carga.ySeguirCon(siguiente)}
        onPress={guardar}
        deshabilitado={guardando}
      />
    </>
  );
}

interface PropsPastilla {
  regla: Regla;
  puntos: number;
  marcada: boolean;
  onPress: () => void;
}

/** «Bajó primero −10», que se pinta de sol con un tilde al marcarla, como la etiqueta de la fila. */
function PastillaDeRegla({ regla, puntos, marcada, onPress }: PropsPastilla) {
  const styles = useEstilos();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: marcada }}
      accessibilityLabel={`${regla.titulo}, ${es.comun.puntos(puntos)}`}
      onPress={onPress}
      hitSlop={{ top: 4, bottom: 4 }}
      style={({ pressed }) => [styles.pastilla, marcada && styles.pastillaMarcada, pressed && styles.presionada]}
    >
      <Text style={[styles.textoPastilla, marcada && styles.textoMarcada]}>
        {marcada ? `${iconos.tilde} ${regla.titulo}` : regla.titulo}
      </Text>
      <Text style={[styles.puntosPastilla, marcada && styles.textoMarcada, numerales]}>{conSigno(puntos)}</Text>
    </Pressable>
  );
}

/** Los nombres de quienes tienen marcada una regla unica, sin contar al de este popup. */
function otrosQueLaTienen(regla: Regla, ronda: RondaJugada, partida: Partida, participanteId: string): string[] {
  if (!regla.asignacionUnica) return [];
  return quienesTienenRegla(ronda, regla.id)
    .filter((id) => id !== participanteId)
    .map((id) => partida.participantes.find((p) => p.id === id)?.nombre ?? '');
}

const useEstilos = crearEstilos((colores) => ({
  seccion: { gap: espacios.sm },
  ayuda: { ...tipografia.chico, color: colores.grisOscuro, textAlign: 'center' },
  pastillas: { flexDirection: 'row', flexWrap: 'wrap', gap: espacios.xs },
  pastilla: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacios.xs,
    minHeight: 40,
    paddingHorizontal: espacios.md,
    borderRadius: radios.pastilla,
    borderWidth: 2,
    borderColor: colores.borde,
    backgroundColor: colores.tarjeta,
  },
  pastillaMarcada: { backgroundColor: colores.destacado },
  presionada: { opacity: 0.7 },
  textoPastilla: { ...tipografia.cuerpoFuerte, fontSize: 15, fontFamily: fuentes.cuerpoBold, color: colores.tinta },
  puntosPastilla: { ...tipografia.chico, fontFamily: fuentes.cuerpoSemi, color: colores.grisOscuro },
  textoMarcada: { color: colores.sobreDestacado },
  ocupada: { ...tipografia.chico, color: colores.grisOscuro },
  total: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: espacios.sm,
    paddingHorizontal: espacios.sm,
    paddingVertical: espacios.xs,
    borderRadius: radios.sm,
    backgroundColor: colores.superficie,
  },
  textoTotal: { ...tipografia.secundario, fontSize: 13.5, color: colores.grisOscuro },
  totalDespues: { ...tipografia.tituloChico, fontSize: 16, color: colores.tinta },
  llega: { color: colores.tinta, fontFamily: fuentes.cuerpoBold },
  error: { ...tipografia.secundario, color: colores.alerta, textAlign: 'center' },
}));
