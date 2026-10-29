/**
 * Tokens del sistema de diseño (paso 3.1).
 *
 * Ningun componente escribe un color, un tamaño o un radio suelto. Los colores
 * salen del tema (cambio 109); aca quedan tamaños, radios, espacios y tipografia.
 *
 * Colores, radios y el area tocable minima salen del mockup. La tipografia y el
 * espaciado se tomaron de las capturas del mockup en el paso 3.2 (docs/mockup/) y se
 * ajustan mirando los componentes en el telefono.
 */
import type { TextStyle } from 'react-native';

// Los colores no viven aca: los da el tema (`theme/tema.tsx`) segun el elegido en
// Configuracion (cambio 113). Ver `theme/temas.ts`.

/** Los radios: mas redondos desde la identidad de Puncta (cambio 113). */
export const radios = {
  /** casillas de puntaje, tilde */
  xs: 12,
  /** campos de texto, segmented */
  sm: 14,
  /** botones cuadrados, opciones chicas */
  md: 18,
  /** cards */
  lg: 20,
  /** popup y bottom sheet */
  xl: 26,
  /** botones de texto y chips: una pastilla */
  pastilla: 999,
} as const;


/** Escala de 4. */
export const espacios = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

/** RNF-3: ningun area tocable por debajo de esto, ni de alto ni de ancho. */
export const AREA_TOCABLE_MINIMA = 44;

/**
 * Las fuentes de Puncta (cambio 113, lamina «Identidad y nombre»): Bricolage
 * Grotesque para el logo, los titulos y los puntajes; DM Sans para el texto y los
 * botones. Se cargan en `app/_layout.tsx` con estos nombres.
 *
 * Cada peso es una familia aparte, asi que ningun estilo usa `fontWeight`: con una
 * fuente propia, iOS y Android lo ignoran o lo simulan engrosando la letra.
 */
export const fuentes = {
  display: 'BricolageGrotesque_800ExtraBold',
  displayBold: 'BricolageGrotesque_700Bold',
  cuerpo: 'DMSans_400Regular',
  cuerpoMedio: 'DMSans_500Medium',
  cuerpoSemi: 'DMSans_600SemiBold',
  cuerpoBold: 'DMSans_700Bold',
} as const;

/**
 * Respeta el tamaño que la usuaria elige en el telefono (RNF-7), asi que ningun
 * texto desactiva el escalado. Unica excepcion: un glifo dentro de un circulo de
 * tamaño fijo (avatar, boton de icono), que si crece se sale del circulo.
 */
export const tipografia = {
  /** «puncta» en el Home: grande y apretado, como en la lamina. */
  marca: { fontFamily: fuentes.display, fontSize: 84, lineHeight: 84, letterSpacing: -4.5 },
  titulo: { fontFamily: fuentes.display, fontSize: 28, lineHeight: 34, letterSpacing: -0.5 },
  subtitulo: { fontFamily: fuentes.display, fontSize: 20, lineHeight: 26 },
  tituloChico: { fontFamily: fuentes.display, fontSize: 17, lineHeight: 22 },
  cuerpo: { fontFamily: fuentes.cuerpo, fontSize: 16, lineHeight: 22 },
  cuerpoFuerte: { fontFamily: fuentes.cuerpoSemi, fontSize: 16, lineHeight: 22 },
  secundario: { fontFamily: fuentes.cuerpo, fontSize: 14, lineHeight: 20 },
  chico: { fontFamily: fuentes.cuerpoMedio, fontSize: 12, lineHeight: 16 },
  /** Titulos de seccion: «TIPO DE JUEGO», «NOMBRE». Las mayusculas las pone el estilo. */
  etiqueta: {
    fontFamily: fuentes.cuerpoBold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  boton: { fontFamily: fuentes.display, fontSize: 17, lineHeight: 22 },
  /** El numero del stepper grande, en el popup de carga. */
  numeroGrande: { fontFamily: fuentes.display, fontSize: 46, lineHeight: 54, letterSpacing: -1 },
} as const satisfies Record<string, TextStyle>;

/**
 * El grosor de los bordes de la identidad nueva, y lo que baja la sombra dura.
 * La sombra es una capa del color del borde detras del elemento, corrida hacia
 * abajo. No se usa `boxShadow`: con un radio de pastilla, en iOS era sospechoso
 * de que Expo Go se cerrara al abrir la app.
 */
export const BORDE = 2.5;
export const SOMBRA = 4;

/**
 * RNF-4: todo puntaje va con numerales tabulares, para que las columnas no
 * bailen cuando cambia un digito. Se suma al estilo de texto que corresponda.
 */
export const numerales: TextStyle = { fontVariant: ['tabular-nums'] };
