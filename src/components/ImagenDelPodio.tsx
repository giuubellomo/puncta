import type { Ref } from 'react';
import { Text, View, type HostInstance } from 'react-native';

import type { Puesto } from '@/domain/ranking';
import { esTruco } from '@/domain/truco';
import type { Partida, Participante } from '@/domain/types';
import { es } from '@/i18n/es';
import { COLOR_ESCALON, PODIO } from '@/theme/podio';
import { crearEstilos } from '@/theme/tema';
import { BORDE, espacios, fuentes, numerales, radios, tipografia } from '@/theme/tokens';

import { Avatar, type TamanoAvatar } from './Avatar';
import { Corona } from './Corona';

/** El tamaño dibujado. Se exporta a 1080 × 1920, el de una historia. */
export const ANCHO_IMAGEN = 360;
export const ALTO_IMAGEN = 640;

const ALTO_ESCALON: Record<number, number> = { 1: 120, 2: 86, 3: 64 };
const TAMANO_PERSONA: Record<number, TamanoAvatar> = { 1: 56, 2: 48, 3: 40 };
/** Los que van en la tarjeta de abajo; con mas, «y 2 más». */
const MAXIMO_RESTO = 5;

interface Props {
  partida: Partida;
  puestos: Puesto[];
  /** Lo que se captura para compartir. */
  ref: Ref<HostInstance>;
}

/**
 * La imagen del resultado que se comparte desde el podio (cambio 124): vertical,
 * como una historia, siempre con los colores del podio. Arriba la marca y la
 * fecha, el nombre de la partida, quien gano y hasta cuanto se jugo (sin el
 * nombre de la plantilla); el podio sin animar, el resto en una tarjeta y al
 * pie «Anotado con Puncta». El link de la app va aparte, como texto.
 *
 * No se ve: el podio la dibuja fuera de la pantalla y la captura al compartir.
 */
export function ImagenDelPodio({ partida, puestos, ref }: Props) {
  const styles = useEstilos();
  const participante = (puesto: Puesto) => partida.participantes.find((p) => p.id === puesto.participanteId)!;
  const [primero, segundo, tercero] = puestos;
  const podio = [segundo, primero, tercero].filter((puesto): puesto is Puesto => puesto !== undefined);
  const resto = puestos.slice(3);
  const ganadores = puestos.filter((puesto) => puesto.posicion === 1).map((puesto) => participante(puesto).nombre);
  const detalle = detalleDeLaPartida(partida);

  return (
    <View ref={ref} collapsable={false} style={styles.imagen}>
      <View style={styles.marca}>
        <Text style={styles.logo}>Puncta</Text>
        <Text style={styles.fecha}>{es.compartir.fecha(new Date())}</Text>
      </View>

      <View style={styles.encabezado}>
        <Text style={styles.nombrePartida} numberOfLines={1}>
          {partida.nombre}
        </Text>
        <Text style={styles.titulo} numberOfLines={2}>
          {es.finalizar.gano(ganadores)}
        </Text>
        {detalle !== '' && (
          <Text style={styles.detalle} numberOfLines={1}>
            {detalle}
          </Text>
        )}
      </View>

      <View style={styles.podio}>
        {podio.map((puesto) => (
          <Escalon key={puesto.participanteId} puesto={puesto} participante={participante(puesto)} />
        ))}
      </View>

      {resto.length > 0 && (
        <View style={styles.tarjetaResto}>
          {resto.slice(0, MAXIMO_RESTO).map((puesto) => {
            const quien = participante(puesto);
            return (
              <View key={puesto.participanteId} style={styles.fila}>
                <Text style={[styles.posicion, numerales]}>{puesto.posicion}</Text>
                <Avatar tipo={quien.avatarTipo} valor={quien.avatarValor} nombre={quien.nombre} tamano={32} />
                <Text style={styles.nombreFila} numberOfLines={1}>
                  {quien.nombre}
                </Text>
                <Text style={[styles.puntosFila, numerales]}>{puntosCortos(puesto.total)}</Text>
              </View>
            );
          })}
          {resto.length > MAXIMO_RESTO && (
            <Text style={styles.yMas}>{es.compartir.yMas(resto.length - MAXIMO_RESTO)}</Text>
          )}
        </View>
      )}

      <View style={styles.firma}>
        <Text style={styles.textoFirma}>{es.compartir.firma}</Text>
      </View>
    </View>
  );
}

function Escalon({ puesto, participante }: { puesto: Puesto; participante: Participante }) {
  const styles = useEstilos();
  const { posicion } = puesto;
  return (
    <View style={styles.columna}>
      {posicion === 1 && <Corona />}
      <Avatar
        tipo={participante.avatarTipo}
        valor={participante.avatarValor}
        nombre={participante.nombre}
        tamano={TAMANO_PERSONA[posicion] ?? TAMANO_PERSONA[3]}
      />
      <Text style={[styles.nombre, numerales]} numberOfLines={1}>
        {`${participante.nombre} · ${puntosCortos(puesto.total)}`}
      </Text>
      <View
        style={[
          styles.escalon,
          { height: ALTO_ESCALON[posicion] ?? ALTO_ESCALON[3], backgroundColor: COLOR_ESCALON[posicion] ?? PODIO.tercero },
        ]}
      >
        <Text style={styles.numero}>{posicion}</Text>
      </View>
    </View>
  );
}

/** «Hasta 500 pts · 4 rondas», sin el nombre de la plantilla. El Truco no tiene rondas. */
function detalleDeLaPartida(partida: Partida): string {
  const { plantilla } = partida;
  const rondas = partida.rondas.filter((ronda) => ronda.estado !== 'bloqueada').length;
  return [
    ...(plantilla.puntajeObjetivo === undefined ? [] : [es.partida.hasta(plantilla.puntajeObjetivo)]),
    ...(esTruco(plantilla) ? [] : [es.compartir.rondas(rondas)]),
  ].join(' · ');
}

/** Como en el podio: «Caro · 52», sin el «+». */
function puntosCortos(total: number): string {
  return total < 0 ? `−${Math.abs(total)}` : String(total);
}

const useEstilos = crearEstilos(() => ({
  imagen: { width: ANCHO_IMAGEN, height: ALTO_IMAGEN, backgroundColor: PODIO.fondo, overflow: 'hidden' },
  marca: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: espacios.lg,
    paddingTop: espacios.lg,
  },
  logo: { ...tipografia.titulo, letterSpacing: -1.5, color: '#FFFFFF' },
  fecha: { ...tipografia.etiqueta, color: '#FFFFFF', opacity: 0.85 },
  encabezado: { paddingHorizontal: espacios.lg, paddingTop: espacios.lg, gap: espacios.xxs },
  nombrePartida: { ...tipografia.etiqueta, color: '#FFFFFF', opacity: 0.85 },
  titulo: { ...tipografia.titulo, fontSize: 32, lineHeight: 36, letterSpacing: -1, color: '#FFFFFF' },
  detalle: { ...tipografia.secundario, color: '#FFFFFF', opacity: 0.85 },
  podio: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: espacios.xs,
    paddingHorizontal: espacios.lg,
  },
  columna: { flex: 1, maxWidth: 104, alignItems: 'center' },
  nombre: {
    ...tipografia.secundario,
    fontFamily: fuentes.cuerpoBold,
    color: '#FFFFFF',
    marginTop: espacios.xxs,
    marginBottom: espacios.xs,
  },
  escalon: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingTop: espacios.sm,
    borderWidth: BORDE,
    borderBottomWidth: 0,
    borderColor: PODIO.tinta,
    borderTopLeftRadius: radios.md,
    borderTopRightRadius: radios.md,
  },
  numero: { ...tipografia.numeroGrande, fontSize: 34, lineHeight: 40, color: PODIO.tinta },
  // Tapa el pie de los escalones, como en el podio.
  tarjetaResto: {
    marginHorizontal: espacios.lg,
    marginTop: -espacios.sm,
    paddingHorizontal: espacios.md,
    paddingVertical: espacios.xxs,
    backgroundColor: PODIO.tarjeta,
    borderWidth: BORDE,
    borderColor: PODIO.tinta,
    borderRadius: radios.md,
  },
  fila: { flexDirection: 'row', alignItems: 'center', gap: espacios.sm, paddingVertical: espacios.xxs },
  posicion: { ...tipografia.tituloChico, color: PODIO.tinta, minWidth: 16 },
  nombreFila: { ...tipografia.cuerpoFuerte, color: PODIO.tinta, flex: 1 },
  puntosFila: { ...tipografia.tituloChico, color: PODIO.tinta },
  yMas: { ...tipografia.chico, color: PODIO.grisTarjeta, textAlign: 'center', paddingVertical: espacios.xxs },
  firma: { marginTop: espacios.md, backgroundColor: PODIO.tinta, paddingVertical: espacios.sm },
  textoFirma: { ...tipografia.chico, fontFamily: fuentes.cuerpoBold, color: '#FFFFFF', textAlign: 'center', letterSpacing: 0.6 },
}));
