import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { iconos } from '@/theme/iconos';
import { crearEstilos } from '@/theme/tema';
import { BORDE, espacios, radios, tipografia } from '@/theme/tokens';

import { BotonIcono } from './BotonIcono';

interface Props {
  visible: boolean;
  /** Tocar afuera, el boton atras de Android o la ✕. */
  onCerrar: () => void;
  /** Texto para el lector de pantalla en la ✕. */
  etiquetaCerrar: string;
  /** Titulo simple: «Agregar participante». */
  titulo?: string;
  /** En lugar del titulo, un encabezado propio. */
  encabezado?: ReactNode;
  /**
   * En lugar del titulo, una franja del color de acento de borde a borde, con la ✕
   * a la derecha: el personaje y el nombre del popup de carga (cambio 126).
   */
  franja?: ReactNode;
  children: ReactNode;
}

/** Lo que baja la sombra dura del popup: un poco mas que la de los botones. */
const SOMBRA_POPUP = 6;

/** Tarjeta centrada sobre un velo oscuro. Para lo corto: alta de participante, carga de puntaje. */
export function Popup({ visible, onCerrar, etiquetaCerrar, titulo, encabezado, franja, children }: Props) {
  const styles = useEstilos();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCerrar} statusBarTranslucent>
      <View style={[StyleSheet.absoluteFill, styles.velo]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCerrar} accessible={false} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.centro}
        pointerEvents="box-none"
      >
        <View style={styles.marco}>
          <View style={styles.sombra} />
          {franja !== undefined ? (
            <View style={[styles.tarjeta, styles.tarjetaConFranja]} accessibilityViewIsModal>
              <View style={[styles.encabezado, styles.franja]}>
                <View style={styles.encabezadoContenido}>{franja}</View>
                <BotonIcono icono={iconos.cerrar} etiqueta={etiquetaCerrar} tamano={32} onPress={onCerrar} />
              </View>
              <View style={styles.cuerpo}>{children}</View>
            </View>
          ) : (
            <View style={styles.tarjeta} accessibilityViewIsModal>
              <View style={styles.encabezado}>
                <View style={styles.encabezadoContenido}>
                  {encabezado ??
                    (titulo !== undefined && (
                      <Text accessibilityRole="header" style={styles.titulo}>
                        {titulo}
                      </Text>
                    ))}
                </View>
                <BotonIcono icono={iconos.cerrar} etiqueta={etiquetaCerrar} tamano={32} onPress={onCerrar} />
              </View>
              {children}
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const useEstilos = crearEstilos((colores) => ({
  velo: { backgroundColor: colores.velo },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: espacios.xl },
  // El marco deja lugar abajo para la sombra dura, que es una capa detras de la tarjeta.
  marco: { width: '100%', maxWidth: 380, paddingBottom: SOMBRA_POPUP },
  sombra: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: SOMBRA_POPUP,
    bottom: 0,
    borderRadius: radios.xl,
    backgroundColor: colores.borde,
  },
  tarjeta: {
    backgroundColor: colores.tarjeta,
    borderRadius: radios.xl,
    borderWidth: BORDE,
    borderColor: colores.borde,
    padding: espacios.xl,
    gap: espacios.md,
  },
  // La franja va de borde a borde: la tarjeta no lleva padding y el contenido va en `cuerpo`.
  tarjetaConFranja: { padding: 0, gap: 0, overflow: 'hidden' },
  franja: {
    backgroundColor: colores.acento,
    borderBottomWidth: BORDE,
    borderBottomColor: colores.borde,
    paddingLeft: espacios.md,
    paddingRight: espacios.sm,
    paddingVertical: espacios.md,
  },
  cuerpo: { padding: espacios.lg, gap: espacios.md },
  encabezado: { flexDirection: 'row', alignItems: 'center', gap: espacios.sm },
  encabezadoContenido: { flex: 1 },
  titulo: { ...tipografia.subtitulo, color: colores.tinta },
}));
