/**
 * Iconos como glifos de texto (paso 3.2): sin dependencias, y se pintan con el
 * color del texto, asi que respetan el mockup monocromo.
 *
 * `︎` pide la version de texto del caracter: sin eso, iOS y Android dibujan
 * ☀ o ⚙ como emoji de color.
 */
const TEXTO = '︎';

/** Los de la interfaz. */
export const iconos = {
  cerrar: '✕',
  tilde: '✓',
  mas: '+',
  menos: '−',
  atras: '‹',
  adelante: '›',
  abajo: '↓',
  arriba: '↑',
  /** La casilla de puntaje vacia, en la ronda en juego (paso 7.2). */
  raya: '—',
  engranaje: `⚙${TEXTO}`,
  /** «Agregar plantilla» en el pie del Home (paso 4.2). */
  plantillaNueva: '⊞',
  /** El icono elegido de una plantilla, que se toca para ver los demas (cambio 98). */
  desplegar: '▾',
  plegar: '▴',
  /** La ayuda de la plantilla, en la partida (cambio 119). */
  ayuda: '?',
  /** Escribir el objetivo de una ronda (cambio 119). */
  lapiz: `✎${TEXTO}`,
  /** Ver la planilla de toda la partida (cambio 123). */
  planilla: '▦',
  /** En la casilla de quien llego al objetivo (cambio 120). */
  estrella: '★',
} as const;

/**
 * Los de plantilla. En la base se guarda la clave (`plantilla.icono`), no el glifo:
 * asi el dibujo se puede cambiar sin migrar datos.
 */
export const ICONOS_PLANTILLA: Record<string, string> = {
  cartas: `⚄${TEXTO}`,
  numeral: '±',
  /** El cuadradito de cinco del Truco (cambio 93). */
  palitos: '⊠',
  /** La Canasta (cambio 101). */
  canasta: `♣${TEXTO}`,
  /** Para las plantillas propias (cambio 119). */
  numeros: '①',
  dado: `⚅${TEXTO}`,
  estrella: '★',
};

/** El glifo de una clave de plantilla. Una clave desconocida no rompe: muestra un punto. */
export function iconoDePlantilla(clave: string): string {
  return ICONOS_PLANTILLA[clave] ?? '•';
}
