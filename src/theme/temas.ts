/**
 * Los temas de Puncta (cambio 113): Electrico, Noche y Chicle, de la lamina
 * «Paleta» (docs/mockup/Paleta@1x.png). Reemplazan a las nueve paletas y al modo
 * claro/oscuro del cambio 109: Noche hace de modo oscuro.
 *
 * Los nombres de los primeros siete colores vienen de la paleta monocroma
 * original y son roles, no tonos:
 *   tinta: textos
 *   grisOscuro: textos secundarios (subtitulos, totales)
 *   grisMedio: textos apagados, placeholders
 *   linea: separadores finos y punteados
 *   superficie: fondos suaves (chips, ronda completada)
 *   fondo: la pantalla de las planillas
 *   velo: lo que oscurece la pantalla detras de un popup o un bottom sheet
 *
 * Los demas son de la identidad nueva: los bordes gruesos con sombra dura, las
 * tarjetas, el boton principal, el sol de lo elegido y el fondo de marca del Home.
 * Los fondos van lisos: la usuaria descarto las formitas de la lamina «Fondos».
 */

export interface Colores {
  tinta: string;
  grisOscuro: string;
  grisMedio: string;
  linea: string;
  superficie: string;
  fondo: string;
  velo: string;
  /** Tarjetas, popups, sheets y campos de texto. */
  tarjeta: string;
  /** Los bordes gruesos y la sombra dura de botones y tarjetas. */
  borde: string;
  /** El boton principal y la ronda en juego. */
  acento: string;
  sobreAcento: string;
  /** El sol: lo elegido, el puntaje recien cargado, «Nuevo juego». */
  destacado: string;
  sobreDestacado: string;
  /** Restar, el total cerca del limite, los errores. */
  alerta: string;
  /** El fondo del Home y lo que va encima. */
  marca: string;
  sobreMarca: string;
  /** Las letras del logo del Home, con borde negro (cambio 128). */
  logo: string;
}

export type IdTema = 'electrico' | 'noche' | 'chicle';

export type Modo = 'claro' | 'oscuro';

export interface DefinicionDeTema {
  id: IdTema;
  /** Para la barra del telefono y el teclado. */
  modo: Modo;
  colores: Colores;
}

/** Los ocho colores de los personajes (lamina «Paleta», «Un color por jugador»). */
export const COLORES_DE_PARTICIPANTES = [
  '#FF3D2E',
  '#00C2FF',
  '#FFC700',
  '#FF8A1F',
  '#FF4FD8',
  '#00E39A',
  '#2E5BFF',
  '#141118',
] as const;

const TINTA = '#141118';
const SOL = '#FFD23F';

/** En el orden en que aparecen en Configuracion. El primero es el de siempre. */
export const TEMAS: readonly DefinicionDeTema[] = [
  {
    id: 'electrico',
    modo: 'claro',
    colores: {
      tinta: TINTA,
      grisOscuro: '#4F3F5E',
      grisMedio: '#8E78A3',
      linea: '#DCC3F0',
      superficie: '#EFDDFB',
      fondo: '#F6E9FE',
      velo: 'rgba(20, 17, 24, 0.55)',
      tarjeta: '#FFFFFF',
      borde: TINTA,
      acento: '#A52AE6',
      sobreAcento: '#FFFFFF',
      destacado: SOL,
      sobreDestacado: TINTA,
      alerta: '#E8291A',
      marca: '#A52AE6',
      sobreMarca: '#FFFFFF',
      logo: '#A52AE6',
    },
  },
  {
    id: 'noche',
    modo: 'oscuro',
    colores: {
      tinta: '#FFFFFF',
      grisOscuro: '#DCC6EE',
      grisMedio: '#A387BD',
      linea: '#4B2369',
      superficie: '#3A1257',
      fondo: '#1E0430',
      velo: 'rgba(0, 0, 0, 0.65)',
      tarjeta: '#2C0A45',
      borde: '#000000',
      acento: '#FF4FD8',
      sobreAcento: TINTA,
      destacado: SOL,
      sobreDestacado: TINTA,
      alerta: '#FF5A4D',
      marca: '#1E0430',
      sobreMarca: '#FFFFFF',
      logo: '#FF4FD8',
    },
  },
  {
    id: 'chicle',
    modo: 'claro',
    colores: {
      tinta: TINTA,
      grisOscuro: '#5E3A55',
      grisMedio: '#9C6E8F',
      linea: '#F6C2EA',
      superficie: '#FFE0F7',
      fondo: '#FFF0FB',
      velo: 'rgba(20, 17, 24, 0.55)',
      tarjeta: '#FFFFFF',
      borde: TINTA,
      acento: TINTA,
      sobreAcento: '#FFFFFF',
      destacado: SOL,
      sobreDestacado: TINTA,
      alerta: '#E8291A',
      marca: '#FF4FD8',
      sobreMarca: TINTA,
      // El acento de Chicle es la tinta: el logo va en el chicle de la marca.
      logo: '#FF4FD8',
    },
  },
];

export const TEMA_POR_DEFECTO: IdTema = 'electrico';

/** Un id desconocido (o una paleta vieja del cambio 109) cae en el de siempre. */
export function temaPorId(id: string): DefinicionDeTema {
  return TEMAS.find((tema) => tema.id === id) ?? TEMAS[0]!;
}

/**
 * Como se guarda el color de un avatar desde el cambio 109: el numero de color
 * («avatar:2»), asi sigue a los colores activos. Antes se guardaba el hex de la
 * paleta monocroma: esos se reconocen por su lugar en la lista vieja.
 */
const PREFIJO_AVATAR = 'avatar:';
const AVATAR_VIEJO = ['#1C1C1E', '#636366', '#9A9AA0', '#D8D8DC'];

export function valorDeAvatar(indice: number): string {
  return `${PREFIJO_AVATAR}${indice}`;
}

/** El numero de color de un avatar guardado, o null si es un color suelto. */
export function indiceDeAvatar(valor: string): number | null {
  if (valor.startsWith(PREFIJO_AVATAR)) {
    const indice = Number(valor.slice(PREFIJO_AVATAR.length));
    return Number.isInteger(indice) && indice >= 0 ? indice : null;
  }
  const viejo = AVATAR_VIEJO.indexOf(valor.toUpperCase());
  return viejo === -1 ? null : viejo;
}

/** La inicial de un avatar de color va clara u oscura segun lo oscuro del circulo. */
export const INICIAL_SOBRE_OSCURO = '#FFFFFF';
export const INICIAL_SOBRE_CLARO = TINTA;

/** El color con que se pinta un avatar. Si sobra el numero, da la vuelta. */
export function colorDeAvatar(valor: string, participantes: readonly string[]): string {
  const indice = indiceDeAvatar(valor);
  if (indice === null) return valor;
  return participantes[indice % participantes.length]!;
}
