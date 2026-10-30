import { Pressable } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { crearEstilos, useTema } from '@/theme/tema';
import { AREA_TOCABLE_MINIMA } from '@/theme/tokens';

export type IconoLiviano = 'planilla' | 'ayuda';

interface Props {
  icono: IconoLiviano;
  /** Lo que lee el lector de pantalla: el boton no tiene texto visible. */
  etiqueta: string;
  onPress: () => void;
}

/**
 * Un icono dibujado, sin borde ni fondo (cambio 125): la planilla y la ayuda en
 * el encabezado de la partida. Mas livianos que los BotonIcono, para que no
 * compitan con el de volver. El area tocable es de 44 (RNF-3).
 */
export function BotonLiviano({ icono, etiqueta, onPress }: Props) {
  const styles = useEstilos();
  const { colores } = useTema();
  const trazo = { stroke: colores.tinta, strokeWidth: 2.2, strokeLinecap: 'round' as const, fill: 'none' };
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      onPress={onPress}
      style={({ pressed }) => [styles.boton, pressed && styles.presionado]}
    >
      <Svg width={24} height={24} viewBox="0 0 24 24">
        {icono === 'planilla' ? (
          <>
            <Rect x={3.5} y={4} width={17} height={16} rx={3} {...trazo} />
            <Path d="M3.5 9.5h17M3.5 14.5h17M9.5 4v16" {...trazo} />
          </>
        ) : (
          <>
            <Circle cx={12} cy={12} r={9} {...trazo} />
            <Path d="M9.6 9.3a2.5 2.5 0 1 1 3.6 2.3c-.8.4-1.2 1-1.2 1.9" {...trazo} />
            <Circle cx={12} cy={17} r={1.1} fill={colores.tinta} />
          </>
        )}
      </Svg>
    </Pressable>
  );
}

const useEstilos = crearEstilos(() => ({
  boton: { width: AREA_TOCABLE_MINIMA, height: AREA_TOCABLE_MINIMA, alignItems: 'center', justifyContent: 'center' },
  presionado: { opacity: 0.6 },
}));
