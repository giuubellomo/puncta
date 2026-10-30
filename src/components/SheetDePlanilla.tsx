import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { faltaParaElObjetivo } from '@/domain/objetivo';
import { mejoresDeRonda, puntajeCargado, totalDeParticipante } from '@/domain/scoring';
import type { Partida, RondaJugada } from '@/domain/types';
import { conSigno, es } from '@/i18n/es';
import { iconos } from '@/theme/iconos';
import { crearEstilos } from '@/theme/tema';
import { BORDE, espacios, fuentes, numerales, radios, tipografia } from '@/theme/tokens';

import { Avatar } from './Avatar';
import { BottomSheet } from './BottomSheet';
import { faltaTexto } from './TarjetaDeRonda';

/** La columna de «R1», y mas ancha si alguna ronda tiene objetivo («2 piernas»). */
const ANCHO_RONDA = 48;
const ANCHO_RONDA_CON_OBJETIVO = 84;
/** Con mas jugadores que los que entran asi, la tabla se desliza de costado. */
const ANCHO_MINIMO_JUGADOR = 64;
/** El padding de los costados del sheet (`contenidoInterno` de BottomSheet), hasta medir el lugar. */
const MARGEN_DEL_SHEET = espacios.xl;

interface Props {
  visible: boolean;
  partida: Partida;
  onCerrar: () => void;
}

/**
 * La planilla de toda la partida (cambio 123): como la hoja de papel, un
 * jugador por columna y una ronda por fila, con el total y lo que le falta a
 * cada uno abajo. En sol, el mejor de cada ronda cerrada; la en juego va
 * sombreada. Es solo para mirar: se corrige tocando la casilla en la ronda.
 */
export function SheetDePlanilla({ visible, partida, onCerrar }: Props) {
  const styles = useEstilos();
  const { width } = useWindowDimensions();
  // El ancho real del lugar de la tabla: el de la pantalla no cuenta el borde del sheet.
  const [lugar, setLugar] = useState<number | null>(null);
  const { plantilla, participantes } = partida;
  const rondas = partida.rondas.filter((ronda) => ronda.estado !== 'bloqueada');
  const conObjetivos = rondas.some((ronda) => ronda.objetivo !== undefined);
  const anchoRonda = conObjetivos ? ANCHO_RONDA_CON_OBJETIVO : ANCHO_RONDA;
  const disponible = (lugar ?? width - 2 * MARGEN_DEL_SHEET - 2 * BORDE) - 2 * BORDE - anchoRonda;
  const anchoJugador = Math.max(ANCHO_MINIMO_JUGADOR, Math.floor(disponible / participantes.length));
  const objetivo = plantilla.puntajeObjetivo;
  const ultima = rondas.at(-1)?.numero ?? 0;

  const celda = (contenido: ReactNode, clave: string, extra?: object) => (
    <View key={clave} style={[styles.celda, { width: anchoJugador }, extra]}>
      {contenido}
    </View>
  );

  const fila = (ronda: RondaJugada) => {
    const enJuego = ronda.estado === 'en_curso';
    const mejores = enJuego ? null : mejoresDeRonda(ronda, plantilla);
    return (
      <View key={ronda.numero} style={[styles.fila, enJuego && styles.filaEnJuego]}>
        <View style={[styles.rotuloRonda, { width: anchoRonda }]}>
          <Text style={[styles.textoRonda, enJuego && styles.textoRondaEnJuego]}>{es.planilla.ronda(ronda.numero)}</Text>
          {ronda.objetivo !== undefined && (
            <Text style={styles.objetivoRonda} numberOfLines={2}>
              {ronda.objetivo}
            </Text>
          )}
        </View>
        {participantes.map((participante) => {
          const puntaje = puntajeCargado(ronda, plantilla, participante.id);
          if (puntaje === null) {
            return celda(<Text style={[styles.numero, styles.vacio]}>{iconos.raya}</Text>, participante.id);
          }
          const mejor = mejores?.participanteIds.includes(participante.id) ?? false;
          return celda(
            <Text style={[styles.numero, numerales, mejor && styles.mejor]}>{conSigno(puntaje)}</Text>,
            participante.id,
          );
        })}
      </View>
    );
  };

  return (
    <BottomSheet visible={visible} onCerrar={onCerrar} titulo={es.planilla.titulo} etiquetaCerrar={es.comun.cerrar}>
      <Text style={styles.subtitulo}>
        {es.planilla.subtitulo(rondas.length, objetivo, plantilla.criterioVictoria)}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        onLayout={(evento) => setLugar(evento.nativeEvent.layout.width)}
      >
        <View style={styles.tabla}>
          <View style={[styles.fila, styles.filaCabecera]}>
            <View style={{ width: anchoRonda }} />
            {participantes.map((participante) =>
              celda(
                <>
                  <Avatar
                    tipo={participante.avatarTipo}
                    valor={participante.avatarValor}
                    nombre={participante.nombre}
                    tamano={32}
                  />
                  <Text style={styles.nombre} numberOfLines={1}>
                    {participante.nombre}
                  </Text>
                </>,
                participante.id,
                styles.celdaCabecera,
              ),
            )}
          </View>

          {rondas.map(fila)}

          <View style={[styles.fila, styles.filaTotal]}>
            <View style={[styles.rotuloRonda, { width: anchoRonda }]}>
              <Text style={styles.textoRonda}>{es.planilla.total}</Text>
            </View>
            {participantes.map((participante) =>
              celda(
                <Text style={[styles.total, numerales]}>{conSigno(totalDeParticipante(partida, participante.id))}</Text>,
                participante.id,
              ),
            )}
          </View>

          {objetivo !== undefined && (
            <View style={[styles.fila, styles.filaFalta]}>
              <View style={{ width: anchoRonda }} />
              {participantes.map((participante) => {
                const llego = faltaParaElObjetivo(partida, participante.id, ultima) === 0;
                return celda(
                  <Text style={[styles.falta, llego && styles.faltaLlego, numerales]} numberOfLines={1}>
                    {faltaTexto(partida, participante.id, ultima)}
                  </Text>,
                  participante.id,
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
      <View style={styles.leyenda}>
        <Text style={[styles.numero, styles.mejor, styles.ejemplo]}>{conSigno(10)}</Text>
        <Text style={styles.textoLeyenda}>{es.planilla.mejorDeLaRonda}</Text>
      </View>
    </BottomSheet>
  );
}

const useEstilos = crearEstilos((colores) => ({
  subtitulo: { ...tipografia.secundario, color: colores.grisOscuro },
  tabla: {
    backgroundColor: colores.tarjeta,
    borderWidth: BORDE,
    borderColor: colores.borde,
    borderRadius: radios.md,
    overflow: 'hidden',
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 38,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colores.linea,
  },
  filaCabecera: { paddingVertical: espacios.xs },
  filaEnJuego: { backgroundColor: colores.superficie },
  filaTotal: { borderTopWidth: BORDE, borderTopColor: colores.borde, minHeight: 44 },
  filaFalta: { borderBottomWidth: 0, minHeight: 30 },
  rotuloRonda: { paddingHorizontal: espacios.xs, paddingVertical: espacios.xxs },
  textoRonda: { ...tipografia.chico, fontFamily: fuentes.cuerpoSemi, color: colores.grisOscuro },
  textoRondaEnJuego: { color: colores.tinta, fontFamily: fuentes.cuerpoBold },
  objetivoRonda: { ...tipografia.chico, fontSize: 10, lineHeight: 12, color: colores.grisMedio },
  celda: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 },
  celdaCabecera: { gap: espacios.xxs },
  nombre: { ...tipografia.chico, color: colores.grisOscuro, maxWidth: '100%' },
  numero: { ...tipografia.secundario, color: colores.tinta },
  vacio: { color: colores.grisMedio },
  mejor: {
    fontFamily: fuentes.cuerpoBold,
    color: colores.sobreDestacado,
    backgroundColor: colores.destacado,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colores.borde,
    paddingHorizontal: 5,
    overflow: 'hidden',
  },
  total: { ...tipografia.tituloChico, color: colores.tinta },
  falta: { ...tipografia.chico, fontSize: 11, lineHeight: 14, color: colores.grisOscuro },
  faltaLlego: { color: colores.tinta, fontFamily: fuentes.cuerpoBold },
  leyenda: { flexDirection: 'row', alignItems: 'center', gap: espacios.xs },
  ejemplo: { fontSize: 12, lineHeight: 16 },
  textoLeyenda: { ...tipografia.chico, color: colores.grisOscuro },
}));
