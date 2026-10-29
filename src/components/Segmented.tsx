import { Pressable, Text, View } from 'react-native';

import { crearEstilos } from '@/theme/tema';
import { AREA_TOCABLE_MINIMA, BORDE, espacios, fuentes, radios, tipografia } from '@/theme/tokens';

export interface OpcionSegmented<T extends string> {
  valor: T;
  etiqueta: string;
  /** Un glifo de `theme/iconos`. */
  icono?: string;
}

interface Props<T extends string> {
  opciones: OpcionSegmented<T>[];
  seleccionado: T;
  onCambiar: (valor: T) => void;
  /** Mas bajo, para ir en una fila con otros controles (el Cierre de la Canasta, cambio 104). */
  compacto?: boolean;
}

/** Una opcion de varias: «Se suman / Se restan», «Menos puntos / Más puntos». */
export function Segmented<T extends string>({ opciones, seleccionado, onCambiar, compacto = false }: Props<T>) {
  const styles = useEstilos();
  return (
    <View accessibilityRole="radiogroup" style={styles.contenedor}>
      {opciones.map((opcion) => {
        const activa = opcion.valor === seleccionado;
        return (
          <Pressable
            key={opcion.valor}
            accessibilityRole="radio"
            accessibilityState={{ checked: activa }}
            onPress={() => onCambiar(opcion.valor)}
            // Compacto, el area tocable sigue llegando a 44 con el hitSlop (RNF-3).
            hitSlop={compacto ? { top: 6, bottom: 6 } : undefined}
            style={[styles.opcion, compacto && styles.opcionCompacta, activa && styles.opcionActiva]}
          >
            <Text style={[styles.texto, activa && styles.textoActivo]}>
              {opcion.icono !== undefined ? `${opcion.icono}  ${opcion.etiqueta}` : opcion.etiqueta}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const useEstilos = crearEstilos((colores) => ({
  contenedor: {
    flexDirection: 'row',
    borderWidth: BORDE,
    borderColor: colores.borde,
    borderRadius: radios.sm,
    backgroundColor: colores.tarjeta,
    overflow: 'hidden',
  },
  opcion: {
    flex: 1,
    minHeight: Math.max(AREA_TOCABLE_MINIMA, 48),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: espacios.xs,
  },
  opcionCompacta: { minHeight: AREA_TOCABLE_MINIMA - 12 },
  opcionActiva: { backgroundColor: colores.destacado },
  texto: { ...tipografia.secundario, fontFamily: fuentes.cuerpoSemi, color: colores.grisOscuro, textAlign: 'center' },
  textoActivo: { fontFamily: fuentes.cuerpoBold, color: colores.sobreDestacado },
}));
