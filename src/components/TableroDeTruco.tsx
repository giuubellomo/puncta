import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { llegaronAlObjetivo } from '@/domain/objetivo';
import { totalDeParticipante } from '@/domain/scoring';
import { cuadrados, malasYBuenas, puntosDeMalas, PUNTOS_POR_CUADRADO } from '@/domain/truco';
import type { Participante, Partida } from '@/domain/types';
import { es } from '@/i18n/es';
import { iconos } from '@/theme/iconos';
import { crearEstilos } from '@/theme/tema';
import { AREA_TOCABLE_MINIMA, BORDE, espacios, numerales, radios, tipografia } from '@/theme/tokens';

import { Avatar } from './Avatar';
import { AvisoDeObjetivo } from './AvisoDeObjetivo';
import { Popup } from './Popup';

/** Lado de un cuadradito y grosor de sus palitos. */
const LADO = 34;
const GROSOR = 2.5;
const POR_FILA = 3;
const SEPARACION = 10;
/** Los botones de cada bando: +1 a +4 y −1 para corregir. */
const TOQUES = [1, 2, 3, 4, -1] as const;

interface Props {
  partida: Partida;
  /** Un toque: suma (o resta 1) al puntaje del bando. Si falla, deja pasar el error. */
  onSumar: (participanteId: string, delta: number) => Promise<void>;
  /** TERMINAR del aviso de objetivo: finaliza la partida. Si falla, deja pasar el error. */
  onFinalizar: () => Promise<void>;
  /** Despues de finalizar, con el aviso ya cerrado. */
  onIrAlPodio: () => void;
}

/**
 * La partida de Truco (cambio 93): en vez de rondas, una columna por bando con
 * sus puntos en cuadraditos de cinco, como en papel, partidos en malas y buenas.
 * Cada toque suma directo; no hay rondas que cerrar. Cuando alguien llega al
 * objetivo aparece el mismo aviso que en el popup de carga.
 */
export function TableroDeTruco({ partida, onSumar, onFinalizar, onIrAlPodio }: Props) {
  const styles = useEstilos();
  const [errorAlSumar, setErrorAlSumar] = useState(false);
  const aviso = useAvisoDeObjetivo(partida);
  const objetivo = partida.plantilla.puntajeObjetivo;

  const sumar = async (participanteId: string, delta: number) => {
    setErrorAlSumar(false);
    try {
      await onSumar(participanteId, delta);
    } catch {
      setErrorAlSumar(true);
    }
  };

  // De a dos por fila, como se anota en la mesa: con mas bandos se arma otra fila.
  const filas: Participante[][] = [];
  for (let i = 0; i < partida.participantes.length; i += 2) filas.push(partida.participantes.slice(i, i + 2));

  return (
    <ScrollView contentContainerStyle={styles.contenido}>
      {errorAlSumar && <Text style={styles.error}>{es.comun.errorGuardar}</Text>}
      {filas.map((fila, i) => (
        <View key={i} style={styles.fila}>
          {fila.map((participante, j) => (
            <Columna
              key={participante.id}
              participante={participante}
              total={totalDeParticipante(partida, participante.id)}
              objetivo={objetivo}
              conLinea={j > 0}
              onSumar={(delta) => void sumar(participante.id, delta)}
            />
          ))}
          {fila.length === 1 && <View style={styles.columna} />}
        </View>
      ))}

      {objetivo !== undefined && (
        <Popup
          visible={aviso.abierto}
          onCerrar={aviso.cerrar}
          etiquetaCerrar={es.comun.cerrar}
          titulo={es.carga.llegoAlObjetivo(aviso.nombres, objetivo)}
        >
          <AvisoDeObjetivo
            onSeguir={aviso.cerrar}
            onTerminar={async () => {
              await onFinalizar();
              aviso.cerrar();
              onIrAlPodio();
            }}
          />
        </Popup>
      )}
    </ScrollView>
  );
}

/**
 * Abre el aviso cuando alguien llega al objetivo despues de abrir la pantalla.
 * Mira los totales ya guardados y no el toque, asi que dos toques seguidos no
 * se confunden. Quien ya habia llegado no vuelve a avisar, salvo que baje con
 * un −1 y vuelva a llegar.
 */
function useAvisoDeObjetivo(partida: Partida) {
  const [abierto, setAbierto] = useState(false);
  // Se guardan aparte de `abierto` para que el titulo no se vacie mientras el popup se desvanece.
  const [nombres, setNombres] = useState<string[]>([]);
  const vistos = useRef<Set<string> | null>(null);

  const llegaron = llegaronAlObjetivo(partida);
  const clave = llegaron.join(',');

  useEffect(() => {
    const ahora = new Set(clave === '' ? [] : clave.split(','));
    const antes = vistos.current;
    vistos.current = ahora;
    // La primera vez es lo que habia al entrar: no se avisa.
    if (antes === null) return;
    const nuevos = [...ahora].filter((id) => !antes.has(id));
    if (nuevos.length === 0) return;
    setNombres(nuevos.map((id) => partida.participantes.find((p) => p.id === id)?.nombre ?? ''));
    setAbierto(true);
  }, [clave, partida.participantes]);

  return { abierto, nombres, cerrar: () => setAbierto(false) };
}

interface PropsColumna {
  participante: Participante;
  total: number;
  objetivo: number | undefined;
  /** La linea vertical que separa a los bandos, como en papel. */
  conLinea: boolean;
  onSumar: (delta: number) => void;
}

function Columna({ participante, total, objetivo, conLinea, onSumar }: PropsColumna) {
  const styles = useEstilos();
  const { malas, buenas } = malasYBuenas(total, objetivo);
  const tope = puntosDeMalas(objetivo);
  // Cada mitad reserva el lugar de todos sus cuadraditos: las columnas quedan parejas.
  const alto = tope === null ? undefined : altoDe(tope);

  return (
    <View style={[styles.columna, conLinea && styles.conLinea]}>
      <View
        accessible
        accessibilityLabel={es.truco.columna(participante.nombre, total, malas, buenas)}
        style={styles.marcador}
      >
        <View style={styles.cabecera}>
          <Avatar tipo={participante.avatarTipo} valor={participante.avatarValor} nombre={participante.nombre} />
          <Text style={styles.nombre} numberOfLines={1}>
            {participante.nombre}
          </Text>
        </View>

        {/* Malas arriba y buenas abajo, separadas solo por la linea (cambio 94). */}
        <Cuadrados puntos={malas} alto={alto} />
        {tope !== null && (
          <>
            <View style={styles.division} />
            <Cuadrados puntos={buenas} alto={alto} />
          </>
        )}

        <Text style={[styles.total, numerales]}>{total}</Text>
      </View>

      <View style={styles.botones}>
        {TOQUES.map((delta) => (
          <Pressable
            key={delta}
            accessibilityRole="button"
            accessibilityLabel={delta > 0 ? es.truco.sumar(delta, participante.nombre) : es.truco.restar(participante.nombre)}
            disabled={delta < 0 && total <= 0}
            onPress={() => onSumar(delta)}
            style={({ pressed }) => [
              styles.boton,
              delta < 0 && styles.botonRestar,
              delta < 0 && total <= 0 && styles.apagado,
              pressed && styles.presionado,
            ]}
          >
            <Text style={[styles.textoBoton, numerales, delta < 0 && styles.textoRestar]}>
              {delta > 0 ? `${iconos.mas}${delta}` : `${iconos.menos}1`}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

/** El alto que ocupan los cuadraditos de `puntos`, de a POR_FILA por fila. */
function altoDe(puntos: number): number {
  const filas = Math.max(1, Math.ceil(Math.ceil(puntos / PUNTOS_POR_CUADRADO) / POR_FILA));
  return filas * LADO + (filas - 1) * SEPARACION;
}

function Cuadrados({ puntos, alto }: { puntos: number; alto: number | undefined }) {
  const styles = useEstilos();
  return (
    <View style={[styles.cuadrados, { minHeight: alto ?? LADO }]}>
      {cuadrados(puntos).map((palitos, i) => (
        <Cuadradito key={i} palitos={palitos} />
      ))}
    </View>
  );
}

/**
 * Un cuadradito de cinco con lineas: izquierda, arriba, derecha, abajo y la
 * diagonal. Con menos de cinco se dibujan solo los primeros palitos.
 */
function Cuadradito({ palitos, lado = LADO, grosor = GROSOR }: { palitos: number; lado?: number; grosor?: number }) {
  const styles = useEstilos();
  const diagonal = lado * Math.SQRT2;
  const palos = [
    { left: 0, top: 0, bottom: 0, width: grosor },
    { left: 0, right: 0, top: 0, height: grosor },
    { right: 0, top: 0, bottom: 0, width: grosor },
    { left: 0, right: 0, bottom: 0, height: grosor },
    { width: diagonal, left: (lado - diagonal) / 2, top: (lado - grosor) / 2, height: grosor, transform: [{ rotate: '45deg' }] },
  ];
  return (
    <View style={{ width: lado, height: lado }}>
      {palos.slice(0, palitos).map((estilo, i) => (
        <View key={i} style={[styles.palito, { borderRadius: grosor / 2 }, estilo]} />
      ))}
    </View>
  );
}

const useEstilos = crearEstilos((colores) => ({
  contenido: { padding: espacios.xl, gap: espacios.xl },
  error: { ...tipografia.secundario, color: colores.tinta, textAlign: 'center' },
  fila: { flexDirection: 'row' },
  columna: { flex: 1, alignItems: 'center', gap: espacios.md, paddingHorizontal: espacios.xs },
  conLinea: { borderLeftWidth: 1.5, borderLeftColor: colores.linea },
  marcador: { alignSelf: 'stretch', alignItems: 'center', gap: espacios.xs },
  cabecera: { alignItems: 'center', gap: espacios.xxs, marginBottom: espacios.xs },
  nombre: { ...tipografia.tituloChico, color: colores.tinta },
  division: { alignSelf: 'stretch', height: 1.5, backgroundColor: colores.linea, marginVertical: espacios.xs },
  cuadrados: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignContent: 'flex-start',
    gap: SEPARACION,
    width: POR_FILA * LADO + (POR_FILA - 1) * SEPARACION,
  },
  palito: { position: 'absolute', backgroundColor: colores.tinta },
  total: { ...tipografia.titulo, color: colores.tinta, marginTop: espacios.xs },
  botones: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: espacios.xs,
    width: POR_FILA * AREA_TOCABLE_MINIMA + (POR_FILA - 1) * espacios.xs,
  },
  boton: {
    width: AREA_TOCABLE_MINIMA,
    height: AREA_TOCABLE_MINIMA,
    borderRadius: radios.sm,
    borderWidth: BORDE,
    borderColor: colores.borde,
    backgroundColor: colores.acento,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonRestar: { backgroundColor: colores.tarjeta },
  textoBoton: { ...tipografia.boton, color: colores.sobreAcento },
  textoRestar: { color: colores.tinta },
  apagado: { opacity: 0.4 },
  presionado: { opacity: 0.7 },
}));
