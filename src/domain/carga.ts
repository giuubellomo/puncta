/**
 * Lo que muestra el popup de carga ademas del puntaje (cambio 126). TypeScript puro.
 */
import { aplicarCarga } from './rondas';
import { puntajeCargado, totalHastaRonda } from './scoring';
import type { Partida } from './types';

/**
 * A quien le toca despues de guardar: el proximo en el orden de la partida (como
 * estan sentados) que todavia no cargo en esa ronda, dando la vuelta. null si ya
 * cargaron todos los demas o si la ronda no esta en juego: corregir una cerrada
 * no sigue con nadie.
 */
export function siguienteSinCargar(partida: Partida, numeroRonda: number, participanteId: string): string | null {
  const ronda = partida.rondas.find((r) => r.numero === numeroRonda);
  if (ronda === undefined || ronda.estado !== 'en_curso') return null;
  const { participantes } = partida;
  const desde = participantes.findIndex((p) => p.id === participanteId);
  for (let i = 1; i < participantes.length; i++) {
    const otro = participantes[(desde + i) % participantes.length]!;
    if (puntajeCargado(ronda, partida.plantilla, otro.id) === null) return otro.id;
  }
  return null;
}

/**
 * El acumulado hasta esa ronda como esta y como quedaria con lo que se esta
 * cargando, y la partida con esa carga: «Total 73 → 88».
 */
export function totalConCarga(
  partida: Partida,
  numeroRonda: number,
  participanteId: string,
  puntosManuales: number,
  reglasMarcadas: string[],
): { antes: number; despues: number; partida: Partida } {
  const antes = totalHastaRonda(partida, participanteId, numeroRonda);
  const ronda = partida.rondas.find((r) => r.numero === numeroRonda);
  if (ronda === undefined) return { antes, despues: antes, partida };
  const nueva = aplicarCarga(ronda, partida.plantilla, participanteId, puntosManuales, reglasMarcadas);
  const conCarga: Partida = {
    ...partida,
    rondas: partida.rondas.map((r) => (r.numero === numeroRonda ? nueva : r)),
  };
  return { antes, despues: totalHastaRonda(conCarga, participanteId, numeroRonda), partida: conCarga };
}
