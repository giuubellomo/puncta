/**
 * Los colores de la lamina «Podio» (cambio 117), fijos en cualquier tema: el
 * violeta de fondo, los escalones en sol, chicle y celeste, y la tarjeta blanca
 * del resto. Lo demas (textos claros, botones, confeti) sale del tema Noche,
 * que envuelve la pantalla.
 */
export const PODIO = {
  /** El violeta electrico y no la noche de la lamina: ahi los personajes, con su borde negro, se perdian. */
  fondo: '#A52AE6',
  tinta: '#141118',
  primero: '#FFD23F',
  segundo: '#FF4FD8',
  tercero: '#00C2FF',
  corona: '#FFD23F',
  tarjeta: '#FFFFFF',
  lineaTarjeta: '#DCC3F0',
  grisTarjeta: '#4F3F5E',
} as const;

export const COLOR_ESCALON: Record<number, string> = { 1: PODIO.primero, 2: PODIO.segundo, 3: PODIO.tercero };
