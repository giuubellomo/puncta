import { Text, TextInput, View, type TextInputProps } from 'react-native';

import { crearEstilos, useTema } from '@/theme/tema';
import { AREA_TOCABLE_MINIMA, BORDE, espacios, radios, tipografia } from '@/theme/tokens';

import { Etiqueta } from './Etiqueta';

interface Props extends Omit<TextInputProps, 'value' | 'onChangeText' | 'style'> {
  valor: string;
  onCambiar: (texto: string) => void;
  /** El titulo de arriba: «Nombre». */
  etiqueta?: string;
  /** Si viene, el borde se pone del color de alerta y el mensaje aparece abajo. */
  error?: string;
}

export function CampoTexto({ valor, onCambiar, etiqueta, error, ...resto }: Props) {
  const styles = useEstilos();
  const { colores, modo } = useTema();
  return (
    <View style={styles.contenedor}>
      {etiqueta !== undefined && <Etiqueta texto={etiqueta} />}
      <TextInput
        {...resto}
        // El teclado del telefono acompaña al tema: oscuro con Noche (cambio 113).
        keyboardAppearance={modo === 'oscuro' ? 'dark' : 'light'}
        accessibilityLabel={resto.accessibilityLabel ?? etiqueta}
        value={valor}
        onChangeText={onCambiar}
        placeholderTextColor={colores.grisMedio}
        style={[styles.campo, error !== undefined && styles.campoConError]}
      />
      {error !== undefined && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const useEstilos = crearEstilos((colores) => ({
  contenedor: { gap: espacios.xs },
  campo: {
    ...tipografia.cuerpoFuerte,
    color: colores.tinta,
    backgroundColor: colores.tarjeta,
    minHeight: Math.max(AREA_TOCABLE_MINIMA, 50),
    borderWidth: BORDE,
    borderColor: colores.borde,
    borderRadius: radios.sm,
    paddingHorizontal: espacios.md,
    paddingVertical: espacios.sm,
  },
  campoConError: { borderColor: colores.alerta },
  error: { ...tipografia.chico, color: colores.alerta },
}));
