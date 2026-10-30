import { Text, View } from 'react-native';

import type { Participante } from '@/domain/types';
import { crearEstilos } from '@/theme/tema';
import { espacios, fuentes, tipografia } from '@/theme/tokens';

import { Avatar } from './Avatar';

interface Props {
  participante: Participante;
  /** «Ronda 4 · 1 pierna + 1 escalera». */
  subtitulo: string;
}

/**
 * Lo que va en la franja de color de los popups de carga (cambio 126): el
 * personaje grande, el nombre y la ronda, como la cabecera de la ronda.
 */
export function EncabezadoDeCarga({ participante, subtitulo }: Props) {
  const styles = useEstilos();
  return (
    <View style={styles.encabezado}>
      <Avatar tipo={participante.avatarTipo} valor={participante.avatarValor} nombre={participante.nombre} tamano={56} />
      <View style={styles.textos}>
        <Text accessibilityRole="header" style={styles.nombre} numberOfLines={1}>
          {participante.nombre}
        </Text>
        <Text style={styles.subtitulo} numberOfLines={2}>
          {subtitulo}
        </Text>
      </View>
    </View>
  );
}

const useEstilos = crearEstilos((colores) => ({
  encabezado: { flexDirection: 'row', alignItems: 'center', gap: espacios.sm },
  textos: { flex: 1, gap: 2 },
  nombre: { ...tipografia.subtitulo, fontSize: 22, lineHeight: 27, letterSpacing: -0.4, color: colores.sobreAcento },
  subtitulo: { ...tipografia.chico, fontSize: 13, lineHeight: 17, fontFamily: fuentes.cuerpoSemi, color: colores.sobreAcento, opacity: 0.92 },
}));
