import { useEffect, useState, type ReactNode } from 'react';
import { Keyboard, StyleSheet, Text, View } from 'react-native';

import {
  aplicarManoDeCanasta,
  hizoCanasta,
  manoDesdeMarcas,
  MAXIMO_TRESES,
  otrosQueCerraron,
  puntosDeCierre,
  puntosDeTreses,
  PUNTOS_LIMPIA,
  PUNTOS_SUCIA,
  PUNTOS_TRES_NEGRO,
  totalDeMano,
  type Cierre,
  type ManoDeCanasta,
} from '@/domain/canasta';
import { nuevosConRonda } from '@/domain/objetivo';
import type { Participante, Partida, RondaJugada } from '@/domain/types';
import { conSigno, es } from '@/i18n/es';
import { crearEstilos } from '@/theme/tema';
import { espacios, fuentes, numerales, tipografia } from '@/theme/tokens';

import { Avatar } from './Avatar';
import { AvisoDeObjetivo } from './AvisoDeObjetivo';
import { Boton } from './Boton';
import { Popup } from './Popup';
import { Segmented } from './Segmented';
import { Stepper } from './Stepper';

/** Los puntos de cartas van de a 5, como valen las cartas; ademas se escriben. */
const PASO_CARTAS = 5;
const MAXIMO_CARTAS = 9999;
const MAXIMO_CANASTAS = 20;

interface Props {
  visible: boolean;
  partida: Partida;
  numeroRonda: number;
  participanteId: string | null;
  onCerrar: () => void;
  /** Escribe la mano en la base. Si falla, deja pasar el error. */
  onGuardar: (mano: ManoDeCanasta) => Promise<void>;
  /** TERMINAR del aviso de objetivo. */
  onTerminar: () => Promise<void>;
}

/**
 * La calculadora de una mano de Canasta (cambio 101): cierre, canastas limpias
 * y sucias, treses rojos y negros, y los puntos de las cartas bajadas y de las
 * que quedaron en la mano, con el total abajo (orden y treses del cambio 102). Hace las veces del popup de carga para esta
 * plantilla, y como el, si alguien llega al objetivo pasa al aviso.
 */
export function PopupDeCanasta({ visible, partida, numeroRonda, participanteId, onCerrar, onGuardar, onTerminar }: Props) {
  const styles = useEstilos();
  const [apertura, setApertura] = useState(0);
  const [llegaron, setLlegaron] = useState<string[] | null>(null);
  useEffect(() => {
    if (!visible) return;
    setApertura((n) => n + 1);
    setLlegaron(null);
  }, [visible]);

  const participante = partida.participantes.find((p) => p.id === participanteId);
  const ronda = partida.rondas.find((r) => r.numero === numeroRonda);
  const objetivo = partida.plantilla.puntajeObjetivo;

  if (llegaron !== null && objetivo !== undefined) {
    return (
      <Popup
        visible={visible}
        onCerrar={onCerrar}
        etiquetaCerrar={es.comun.cerrar}
        titulo={es.carga.llegoAlObjetivo(llegaron, objetivo)}
      >
        <AvisoDeObjetivo onSeguir={onCerrar} onTerminar={onTerminar} />
      </Popup>
    );
  }

  return (
    <Popup
      visible={visible}
      onCerrar={onCerrar}
      etiquetaCerrar={es.comun.cerrar}
      encabezado={
        participante !== undefined && (
          <View style={styles.encabezado}>
            <Avatar tipo={participante.avatarTipo} valor={participante.avatarValor} nombre={participante.nombre} />
            <View style={styles.textos}>
              <Text accessibilityRole="header" style={styles.nombre}>
                {participante.nombre}
              </Text>
              <Text style={styles.subtitulo}>{es.ronda.titulo(numeroRonda)}</Text>
            </View>
          </View>
        )
      }
    >
      {participante !== undefined && ronda !== undefined && (
        <Calculadora
          key={apertura}
          partida={partida}
          ronda={ronda}
          participante={participante}
          onGuardar={async (mano) => {
            // Antes de guardar: despues `partida` ya trae la mano y no hay con que comparar.
            const nuevos = nuevosConRonda(partida, aplicarManoDeCanasta(ronda, participante.id, mano));
            await onGuardar(mano);
            if (nuevos.length === 0) {
              onCerrar();
              return;
            }
            setLlegaron(nuevos.map((id) => partida.participantes.find((p) => p.id === id)?.nombre ?? ''));
          }}
        />
      )}
    </Popup>
  );
}

interface PropsCalculadora {
  partida: Partida;
  ronda: RondaJugada;
  participante: Participante;
  onGuardar: (mano: ManoDeCanasta) => Promise<void>;
}

function Calculadora({ partida, ronda, participante, onGuardar }: PropsCalculadora) {
  const styles = useEstilos();
  const entrada = ronda.entradas.find((e) => e.participanteId === participante.id);
  // Corregir una mano arranca de lo que se habia cargado.
  const [mano, setMano] = useState<ManoDeCanasta>(manoDesdeMarcas(entrada?.marcas ?? {}));
  const [guardando, setGuardando] = useState(false);
  const [errorAlGuardar, setErrorAlGuardar] = useState(false);
  const cambiar = (cambio: Partial<ManoDeCanasta>) => setMano((actual) => ({ ...actual, ...cambio }));
  const otros = otrosQueCerraron(ronda, partida, participante.id);

  async function guardar() {
    Keyboard.dismiss();
    setGuardando(true);
    setErrorAlGuardar(false);
    try {
      await onGuardar(mano);
    } catch {
      setErrorAlGuardar(true);
      setGuardando(false);
    }
  }

  const contador = (
    titulo: string,
    valor: number,
    maximo: number,
    puntos: number,
    alCambiar: (n: number) => void,
  ) => (
    <Fila titulo={titulo} puntos={puntos}>
      <Stepper
        valor={valor}
        onCambiar={alCambiar}
        etiquetaRestar={`${es.comun.restar}: ${titulo}`}
        etiquetaSumar={`${es.comun.sumar}: ${titulo}`}
        minimo={0}
        maximo={maximo}
        tamano="compacto"
      />
    </Fila>
  );

  const cartas = (titulo: string, valor: number, signo: 1 | -1, etiqueta: string, alCambiar: (n: number) => void) => (
    <Fila titulo={titulo} puntos={signo * valor}>
      <Stepper
        valor={valor}
        onCambiar={alCambiar}
        etiquetaRestar={`${es.comun.restar}: ${titulo}`}
        etiquetaSumar={`${es.comun.sumar}: ${titulo}`}
        paso={PASO_CARTAS}
        minimo={0}
        maximo={MAXIMO_CARTAS}
        tamano="compacto"
        escribible
        etiquetaEscribir={etiqueta}
        // Con su signo, como el puntaje del popup de carga: «+185», «−20».
        formato={(n) => conSigno(signo * n)}
      />
    </Fila>
  );

  return (
    <>
      <View style={styles.filas}>
        {/* En una fila, como los demas (cambio 104). */}
        <Fila titulo={es.canasta.cierre} puntos={puntosDeCierre(mano.cierre)}>
          <Segmented<Cierre>
            opciones={[
              { valor: 'no', etiqueta: es.canasta.noCerro },
              { valor: 'si', etiqueta: es.canasta.cerro },
            ]}
            seleccionado={mano.cierre}
            onCambiar={(cierre) => {
              Keyboard.dismiss();
              cambiar({ cierre });
            }}
            compacto
          />
        </Fila>
        {mano.cierre !== 'no' && otros.length > 0 && <Text style={styles.ayuda}>{es.canasta.cerroOtro(otros)}</Text>}

        {contador(es.canasta.limpias, mano.limpias, MAXIMO_CANASTAS, mano.limpias * PUNTOS_LIMPIA, (limpias) =>
          cambiar({ limpias }),
        )}
        {contador(es.canasta.sucias, mano.sucias, MAXIMO_CANASTAS, mano.sucias * PUNTOS_SUCIA, (sucias) =>
          cambiar({ sucias }),
        )}
        {contador(es.canasta.treses, mano.treses, MAXIMO_TRESES, puntosDeTreses(mano.treses, hizoCanasta(mano)), (treses) =>
          cambiar({ treses }),
        )}
        {mano.treses > 0 && !hizoCanasta(mano) && <Text style={styles.ayuda}>{es.canasta.tresesRestan}</Text>}
        {contador(es.canasta.negros, mano.negros, MAXIMO_TRESES, mano.negros * PUNTOS_TRES_NEGRO, (negros) =>
          cambiar({ negros }),
        )}

        {cartas(es.canasta.bajadas, mano.bajadas, 1, es.canasta.escribirBajadas, (bajadas) => cambiar({ bajadas }))}
        {cartas(es.canasta.enMano, mano.enMano, -1, es.canasta.escribirEnMano, (enMano) => cambiar({ enMano }))}
      </View>

      <View style={styles.total}>
        <Text style={styles.tituloTotal}>{es.canasta.totalDeLaMano}</Text>
        <Text style={[styles.valorTotal, numerales]}>{conSigno(totalDeMano(mano))}</Text>
      </View>

      {errorAlGuardar && <Text style={styles.error}>{es.comun.errorGuardar}</Text>}
      <Boton titulo={es.carga.guardar} onPress={guardar} deshabilitado={guardando} />
    </>
  );
}

/** El concepto a la izquierda, el control al medio y lo que suma a la derecha. */
function Fila({ titulo, puntos, children }: { titulo: string; puntos: number; children: ReactNode }) {
  const styles = useEstilos();
  return (
    <View style={styles.fila}>
      <Text style={[styles.titulo, styles.tituloFila]}>{titulo}</Text>
      <View style={styles.control}>{children}</View>
      <Text style={[styles.puntos, numerales]}>{conSigno(puntos)}</Text>
    </View>
  );
}

const useEstilos = crearEstilos((colores) => ({
  encabezado: { flexDirection: 'row', alignItems: 'center', gap: espacios.sm },
  textos: { flex: 1, gap: 2 },
  nombre: { ...tipografia.tituloChico, color: colores.tinta },
  subtitulo: { ...tipografia.secundario, color: colores.grisOscuro },
  filas: { gap: espacios.xs },
  fila: { flexDirection: 'row', alignItems: 'center', gap: espacios.xs, minHeight: 40 },
  tituloFila: { flex: 1 },
  titulo: { ...tipografia.secundario, fontFamily: fuentes.cuerpoSemi, color: colores.tinta },
  control: { width: 132 },
  puntos: { ...tipografia.secundario, color: colores.grisOscuro, minWidth: 52, textAlign: 'right' },
  ayuda: { ...tipografia.chico, color: colores.grisOscuro },
  total: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: espacios.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colores.linea,
  },
  tituloTotal: { ...tipografia.cuerpoFuerte, color: colores.tinta },
  valorTotal: { ...tipografia.subtitulo, color: colores.tinta },
  error: { ...tipografia.secundario, color: colores.tinta, textAlign: 'center' },
}));
