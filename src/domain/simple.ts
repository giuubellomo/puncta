/**
 * La plantilla Simple (cambio 121): la unica en la que, al armar la partida, se
 * elige si los puntos se suman o se restan y si se juega hasta un puntaje. La
 * reconoce por el id, como al Truco y a la Canasta.
 */
export const PLANTILLA_SIMPLE = '0391b4e3-e991-431c-ac4f-df61b13d62ee';

export function esSimple(plantilla: { id: string }): boolean {
  return plantilla.id === PLANTILLA_SIMPLE;
}
