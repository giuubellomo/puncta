/**
 * El puntaje objetivo de una partida (cambio 92). TypeScript puro.
 *
 * Llegar es que el total, sin mirar el signo, alcance el objetivo: en una
 * plantilla que resta, los totales bajan y se llega igual. Llegar no dice quien
 * gana: eso lo decide `criterioVictoria` en el podio (`rankear`). Con «menor»,
 * el que llega corta la partida y gana el mas bajo, como en Corazones.
 */
import { totalDeParticipante, totalHastaRonda } from './scoring';
import type { Partida } from './types';

/** Con lo que arranca el objetivo al activarlo en el editor. */
export const OBJETIVO_POR_DEFECTO = 100;
export const MAXIMO_OBJETIVO = 9999;
/** De a cuanto van los botones del stepper; el numero ademas se escribe. */
export const PASO_OBJETIVO = 10;

/** Los ids de quienes ya llegaron, en el orden de la partida. Sin objetivo, ninguno. */
export function llegaronAlObjetivo(partida: Partida): string[] {
  const objetivo = partida.plantilla.puntajeObjetivo;
  if (objetivo === undefined) return [];
  return partida.participantes
    .filter((participante) => Math.abs(totalDeParticipante(partida, participante.id)) >= objetivo)
    .map((participante) => participante.id);
}

/**
 * Si un participante llego al objetivo con el acumulado hasta esa ronda. Es la
 * estrella de su casilla en la ronda (cambio 120).
 */
export function llegoHastaRonda(partida: Partida, participanteId: string, numeroRonda: number): boolean {
  const objetivo = partida.plantilla.puntajeObjetivo;
  if (objetivo === undefined) return false;
  return Math.abs(totalHastaRonda(partida, participanteId, numeroRonda)) >= objetivo;
}

/**
 * Quienes llegaron recien en esa ronda: con ella si, sin ella no. Es lo que
 * dispara el aviso al tocar SIGUIENTE (cambio 120). Si ya habia llegado y se
 * siguio jugando, no se vuelve a avisar por el mismo.
 */
export function nuevosEnLaRonda(partida: Partida, numeroRonda: number): string[] {
  return partida.participantes
    .filter(
      (participante) =>
        llegoHastaRonda(partida, participante.id, numeroRonda) &&
        !llegoHastaRonda(partida, participante.id, numeroRonda - 1),
    )
    .map((participante) => participante.id);
}
