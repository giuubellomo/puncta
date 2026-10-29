import { Text, View } from 'react-native';

import { crearEstilos } from '@/theme/tema';
import { espacios, fuentes, numerales, tipografia } from '@/theme/tokens';

interface Props {
  /** Sin texto queda solo el valor: la pastilla de puntaje de una regla (5.3). */
  texto?: string;
  /** El puntaje, en negrita a la derecha del texto. */
  valor?: string;
  /** ● regla de todas las rondas, ○ regla opcional. */
  punto?: 'lleno' | 'vacio';
  /** relleno: fondo suave (reglas). borde: de tarjeta con borde (opcionales, «en juego»). */
  variante?: 'relleno' | 'borde';
}

export function Chip({ texto, valor, punto, variante = 'relleno' }: Props) {
  const styles = useEstilos();
  return (
    <View style={[styles.base, variante === 'relleno' ? styles.relleno : styles.borde]}>
      {punto !== undefined && <View style={[styles.punto, punto === 'vacio' && styles.puntoVacio]} />}
      {texto !== undefined && <Text style={styles.texto}>{texto}</Text>}
      {valor !== undefined && <Text style={[styles.valor, numerales]}>{valor}</Text>}
    </View>
  );
}

const useEstilos = crearEstilos((colores) => ({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: espacios.xxs + 2,
    paddingHorizontal: espacios.sm,
    paddingVertical: espacios.xxs + 2,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  relleno: { backgroundColor: colores.superficie, borderColor: colores.superficie },
  borde: { backgroundColor: colores.tarjeta, borderColor: colores.borde },
  punto: { width: 6, height: 6, borderRadius: 3, backgroundColor: colores.tinta },
  puntoVacio: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colores.grisMedio },
  texto: { ...tipografia.chico, fontFamily: fuentes.cuerpoSemi, color: colores.grisOscuro },
  valor: { ...tipografia.chico, fontFamily: fuentes.display, color: colores.tinta },
}));
