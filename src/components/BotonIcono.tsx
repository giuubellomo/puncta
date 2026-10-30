import { Pressable, Text } from 'react-native';

import { crearEstilos } from '@/theme/tema';
import { AREA_TOCABLE_MINIMA, BORDE, fuentes } from '@/theme/tokens';

interface Props {
  /** Un glifo de `theme/iconos`. */
  icono: string;
  /** Lo que lee el lector de pantalla: el boton no tiene texto visible. */
  etiqueta: string;
  onPress: () => void;
  /** Diametro dibujado. El area tocable nunca baja de 44 (RNF-3). */
  tamano?: number;
  deshabilitado?: boolean;
  /** El tamaño del glifo; por defecto, casi la mitad del circulo. El engranaje del Home lo lleva mas grande (cambio 130). */
  tamanoIcono?: number;
}

/** Boton redondo con borde: cerrar, atras, y los − / + del stepper. */
export function BotonIcono({ icono, etiqueta, onPress, tamano = 36, deshabilitado = false, tamanoIcono }: Props) {
  const styles = useEstilos();
  const margen = Math.max(0, (AREA_TOCABLE_MINIMA - tamano) / 2);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityState={{ disabled: deshabilitado }}
      disabled={deshabilitado}
      onPress={onPress}
      hitSlop={margen}
      style={({ pressed }) => [
        styles.circulo,
        { width: tamano, height: tamano, borderRadius: tamano / 2 },
        deshabilitado && styles.deshabilitado,
        pressed && styles.presionado,
      ]}
    >
      <Text
        allowFontScaling={false}
        style={[styles.icono, { fontSize: tamanoIcono ?? Math.round(tamano * 0.45) }, deshabilitado && styles.iconoDeshabilitado]}
      >
        {icono}
      </Text>
    </Pressable>
  );
}

const useEstilos = crearEstilos((colores) => ({
  circulo: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: BORDE,
    borderColor: colores.borde,
    backgroundColor: colores.tarjeta,
  },
  deshabilitado: { borderColor: colores.linea },
  presionado: { backgroundColor: colores.superficie },
  icono: { color: colores.tinta, fontFamily: fuentes.cuerpoBold },
  iconoDeshabilitado: { color: colores.linea },
}));
