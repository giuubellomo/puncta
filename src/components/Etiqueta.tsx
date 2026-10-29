import { Text } from 'react-native';

import { crearEstilos } from '@/theme/tema';
import { tipografia } from '@/theme/tokens';

/** Titulo de seccion: «TIPO DE JUEGO», «NOMBRE». El texto llega en minuscula; el estilo lo pasa a mayuscula. */
export function Etiqueta({ texto }: { texto: string }) {
  const styles = useEstilos();
  return (
    <Text accessibilityRole="header" style={styles.texto}>
      {texto}
    </Text>
  );
}

const useEstilos = crearEstilos((colores) => ({
  texto: { ...tipografia.etiqueta, color: colores.grisOscuro },
}));
