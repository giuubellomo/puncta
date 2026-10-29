import type { ReactNode } from 'react';
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { iconos } from '@/theme/iconos';
import { crearEstilos } from '@/theme/tema';
import { BORDE, espacios, fuentes, radios } from '@/theme/tokens';

export type EstadoCard = 'normal' | 'seleccionada' | 'activa' | 'suave' | 'punteada';

interface Props {
  children: ReactNode;
  /**
   * normal: tarjeta con borde grueso. seleccionada: borde del acento y tilde (plantilla elegida).
   * activa: borde mas grueso (ronda en juego). suave: fondo suave, sin borde grueso (ronda completada).
   * punteada: borde punteado y sin relleno (agregar, próximamente, ronda bloqueada).
   */
  estado?: EstadoCard;
  onPress?: () => void;
  /** Lo que lee el lector de pantalla cuando la card es tocable. */
  etiqueta?: string;
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, estado = 'normal', onPress, etiqueta, style }: Props) {
  const styles = useEstilos();
  const estilosPorEstado = useEstilosPorEstado();
  const cuerpo = [styles.base, estilosPorEstado[estado], style];
  const tilde = estado === 'seleccionada' && (
    <View style={styles.tilde}>
      <Text allowFontScaling={false} style={styles.tildeTexto}>
        {iconos.tilde}
      </Text>
    </View>
  );

  if (onPress === undefined) {
    return (
      <View style={cuerpo}>
        {children}
        {tilde}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityState={{ selected: estado === 'seleccionada' }}
      onPress={onPress}
      style={({ pressed }) => [cuerpo, pressed && styles.presionada]}
    >
      {children}
      {tilde}
    </Pressable>
  );
}

const useEstilos = crearEstilos((colores) => ({
  base: {
    borderRadius: radios.lg,
    borderWidth: BORDE,
    borderColor: colores.borde,
    backgroundColor: colores.tarjeta,
    padding: espacios.md,
  },
  presionada: { opacity: 0.7 },
  tilde: {
    position: 'absolute',
    top: espacios.xs,
    right: espacios.xs,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colores.acento,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tildeTexto: { color: colores.sobreAcento, fontSize: 12, fontFamily: fuentes.cuerpoBold },
}));

const useEstilosPorEstado = crearEstilos((colores) => ({
  normal: {},
  seleccionada: { borderColor: colores.acento, borderWidth: 3 },
  activa: { borderWidth: 3 },
  suave: { backgroundColor: colores.superficie, borderColor: colores.linea },
  punteada: { borderStyle: 'dashed', borderColor: colores.grisMedio, backgroundColor: 'transparent' },
}));
