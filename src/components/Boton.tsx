import { Pressable, Text, View } from 'react-native';

import { crearEstilos, useTema } from '@/theme/tema';
import { AREA_TOCABLE_MINIMA, BORDE, espacios, fuentes, radios, SOMBRA, tipografia } from '@/theme/tokens';

export type VarianteBoton = 'primario' | 'destacado' | 'secundario';

interface Props {
  titulo: string;
  onPress: () => void;
  variante?: VarianteBoton;
  deshabilitado?: boolean;
  /** Un glifo de `theme/iconos` a la izquierda del titulo. */
  icono?: string;
  /** Una linea mas chica debajo del titulo: «y seguir con Tomi» (cambio 126). */
  subtitulo?: string;
}

/**
 * Una pastilla con borde grueso y sombra dura (cambio 113). Primario: el color de
 * acento del tema. Destacado: sol, para «Nuevo juego» y «Revancha». Secundario:
 * del color de las tarjetas. Al apretarlo baja y se tapa la sombra.
 * Deshabilitado: apagado y sin sombra, en cualquiera de las tres.
 */
export function Boton({ titulo, onPress, variante = 'primario', deshabilitado = false, icono, subtitulo }: Props) {
  const styles = useEstilos();
  const { colores } = useTema();
  const fondo = { primario: colores.acento, destacado: colores.destacado, secundario: colores.tarjeta }[variante];
  const texto = { primario: colores.sobreAcento, destacado: colores.sobreDestacado, secundario: colores.tinta }[variante];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: deshabilitado }}
      disabled={deshabilitado}
      onPress={onPress}
      style={styles.contenedor}
    >
      {({ pressed }) => (
        <>
          {!deshabilitado && <View style={styles.sombra} />}
          <View
            style={[
              styles.base,
              { backgroundColor: fondo },
              deshabilitado ? styles.deshabilitado : pressed && styles.apretado,
            ]}
          >
            <Text style={[styles.texto, { color: texto }, deshabilitado && styles.textoDeshabilitado]}>
              {icono !== undefined ? `${icono}  ${titulo}` : titulo}
            </Text>
            {subtitulo !== undefined && (
              <Text style={[styles.subtitulo, { color: texto }, deshabilitado && styles.textoDeshabilitado]} numberOfLines={1}>
                {subtitulo}
              </Text>
            )}
          </View>
        </>
      )}
    </Pressable>
  );
}

const useEstilos = crearEstilos((colores) => ({
  // La sombra ocupa lugar: asi el boton no tapa lo de abajo ni salta al apretarlo.
  contenedor: { paddingBottom: SOMBRA },
  base: {
    minHeight: Math.max(AREA_TOCABLE_MINIMA, 54),
    paddingHorizontal: espacios.lg,
    paddingVertical: espacios.sm,
    borderRadius: radios.pastilla,
    borderWidth: BORDE,
    borderColor: colores.borde,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sombra: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: SOMBRA,
    bottom: 0,
    borderRadius: radios.pastilla,
    backgroundColor: colores.borde,
  },
  apretado: { transform: [{ translateY: SOMBRA }] },
  deshabilitado: { backgroundColor: colores.superficie, borderColor: colores.linea },
  texto: { ...tipografia.boton, textAlign: 'center' },
  textoDeshabilitado: { color: colores.grisMedio },
  subtitulo: { ...tipografia.chico, fontFamily: fuentes.cuerpoSemi, textAlign: 'center', opacity: 0.9 },
}));
