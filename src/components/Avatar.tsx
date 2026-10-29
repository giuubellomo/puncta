import { Pressable, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import type { AvatarTipo } from '@/domain/types';
import { esPersonaje, PROPORCION_PERSONAJE, svgDePersonaje } from '@/theme/personajes';
import { colorDeAvatar, INICIAL_SOBRE_CLARO, INICIAL_SOBRE_OSCURO } from '@/theme/temas';
import { crearEstilos, useTema } from '@/theme/tema';
import { AREA_TOCABLE_MINIMA, BORDE, fuentes } from '@/theme/tokens';

export type TamanoAvatar = 32 | 40 | 60;

interface Props {
  tipo: AvatarTipo;
  /** Un color hex si `tipo` es 'color'; el glifo o la clave de un personaje si es 'icono'. */
  valor: string;
  /** De aca sale la inicial. */
  nombre: string;
  tamano?: TamanoAvatar;
  /**
   * Para elegir un avatar (alta de participante): con `onPress` el avatar se
   * puede tocar, y `seleccionado` le pone el anillo de afuera.
   */
  onPress?: () => void;
  seleccionado?: boolean;
  /** Lo que lee el lector de pantalla cuando se puede tocar: «Color 2», «Ícono ★», «Personaje 3». */
  etiqueta?: string;
}

/** Espacio entre el circulo y el anillo de seleccion, y grosor del anillo. */
const HUECO = 2;
const ANILLO = 2;

/**
 * Con color: circulo lleno con la inicial, blanca o negra segun lo oscuro del fondo.
 * Con icono: circulo blanco con borde y el glifo en tinta.
 * Con personaje (cambio 115): el dibujo solo, sin circulo, del mismo alto.
 * Es decorativo: el nombre siempre esta escrito al lado, asi que el lector de
 * pantalla lo saltea.
 */
export function Avatar({ onPress, seleccionado = false, etiqueta, ...circulo }: Props) {
  const styles = useEstilos();
  if (onPress === undefined) return <Circulo {...circulo} />;

  const lado = (circulo.tamano ?? 40) + 2 * (HUECO + ANILLO);
  const margen = Math.max(0, (AREA_TOCABLE_MINIMA - lado) / 2);

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={etiqueta}
      accessibilityState={{ checked: seleccionado }}
      onPress={onPress}
      hitSlop={margen}
      style={({ pressed }) => [
        styles.anillo,
        { width: lado, height: lado, borderRadius: lado / 2 },
        seleccionado && styles.anilloSeleccionado,
        pressed && styles.presionado,
      ]}
    >
      <Circulo {...circulo} />
    </Pressable>
  );
}

function Circulo({ tipo, valor, nombre, tamano = 40 }: Pick<Props, 'tipo' | 'valor' | 'nombre' | 'tamano'>) {
  const styles = useEstilos();
  const { colores, coloresDeParticipantes } = useTema();
  if (tipo === 'icono' && esPersonaje(valor)) {
    return (
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[styles.circulo, { width: tamano, height: tamano }]}
      >
        <SvgXml xml={svgDePersonaje(valor)} width={Math.round(tamano * PROPORCION_PERSONAJE)} height={tamano} />
      </View>
    );
  }
  const esIcono = tipo === 'icono';
  // Un color guardado como numero sigue a la paleta activa (cambio 109).
  const fondo = esIcono ? colores.tarjeta : colorDeAvatar(valor, coloresDeParticipantes);
  // La inicial, clara u oscura segun el circulo: no la tinta, que en modo oscuro es clara.
  const tinta = esIcono ? colores.tinta : esOscuro(fondo) ? INICIAL_SOBRE_OSCURO : INICIAL_SOBRE_CLARO;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.circulo,
        { width: tamano, height: tamano, borderRadius: tamano / 2, backgroundColor: fondo },
        esIcono && styles.conBorde,
      ]}
    >
      <Text
        allowFontScaling={false}
        style={[styles.texto, { color: tinta, fontSize: Math.round(tamano * (esIcono ? 0.42 : 0.4)) }]}
      >
        {esIcono ? valor : inicial(nombre)}
      </Text>
    </View>
  );
}

function inicial(nombre: string): string {
  // Array.from separa por caracter real, no por unidad UTF-16: «Ñ» o un emoji no se parten.
  // Sin nombre, el circulo va liso: es la muestra de color del alta de participante.
  return (Array.from(nombre.trim())[0] ?? '').toUpperCase();
}

/** Luminancia relativa aproximada de un #RRGGBB. */
function esOscuro(hex: string): boolean {
  const limpio = hex.replace('#', '');
  if (limpio.length !== 6) return true;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(limpio.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.6;
}

const useEstilos = crearEstilos((colores) => ({
  circulo: { alignItems: 'center', justifyContent: 'center' },
  anillo: { alignItems: 'center', justifyContent: 'center', borderWidth: ANILLO, borderColor: 'transparent' },
  anilloSeleccionado: { borderColor: colores.acento },
  presionado: { opacity: 0.7 },
  conBorde: { borderWidth: BORDE, borderColor: colores.borde },
  texto: { fontFamily: fuentes.display },
}));
