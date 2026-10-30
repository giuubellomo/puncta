/**
 * Semilla de plantillas predefinidas (paso 2.4, RF-301).
 *
 * Los ids son fijos: asi `asegurarPredefinidas` reconoce las que ya estan y no
 * las duplica, y una predefinida nueva en un build futuro entra sola en el
 * proximo arranque. Estos ids no se cambian nunca.
 *
 * Nombres y titulos son datos de la plantilla, no textos de interfaz: se guardan
 * en la base y la usuaria los ve igual en la copia que haga.
 *
 * `icono` es una clave. El set de iconos lo define el sistema de diseño (fase 3).
 */
import {
  PLANTILLA_CANASTA,
  PUNTOS_CIERRE,
  PUNTOS_LIMPIA,
  PUNTOS_SUCIA,
  PUNTOS_TRES_NEGRO,
  PUNTOS_TRES_ROJO,
  REGLA_BAJADAS,
  REGLA_CIERRE,
  REGLA_EN_MANO,
  REGLA_LIMPIAS,
  REGLA_NEGROS,
  REGLA_SUCIAS,
  REGLA_TRESES,
} from '@/domain/canasta';
import { REGLA_CORTO } from '@/domain/rondas';
import { PLANTILLA_TRUCO } from '@/domain/truco';
import { PLANTILLA_SIMPLE } from '@/domain/simple';
import type { Plantilla } from '@/domain/types';
import { asegurarPredefinidas } from '@/repositories/plantillas';

const BAJO_PRIMERO = '583c88cf-c86e-4275-99d9-fbf12121350d';
/** El dominio la reconoce por este id (cambio 79). */
const CORTO = REGLA_CORTO;
const PUNTAJE_BASE = -10;

/** A-1 (provisional): el objetivo de cada ronda y lo que valen Bajó primero y Cortó. */
const RONDAS_CARIOCA: Array<[objetivo: string, puntaje: number]> = [
  ['2 piernas', -10],
  ['1 pierna + 1 escalera', -20],
  ['2 escaleras', -30],
  ['2 piernas + 1 escalera', -40],
  ['1 pierna + 2 escaleras', -50],
  ['3 piernas', -60],
  ['3 escaleras', -70],
];

export const CARIOCA: Plantilla = {
  id: 'ef056daf-4cba-4370-81b9-0568005c3bcb',
  nombre: 'Carioca',
  icono: 'cartas',
  modoPuntos: 'suma',
  criterioVictoria: 'menor',
  rondasIlimitadas: false,
  reglas: [
    { id: BAJO_PRIMERO, titulo: 'Bajó primero', puntajeBase: PUNTAJE_BASE, alcance: 'todas', asignacionUnica: true, orden: 0 },
    { id: CORTO, titulo: 'Cortó', puntajeBase: PUNTAJE_BASE, alcance: 'todas', asignacionUnica: true, orden: 1 },
  ],
  rondas: RONDAS_CARIOCA.map(([objetivo, puntaje], i) => {
    // Como en el editor (5.4): solo se guarda ajuste si difiere del base. La ronda 1
    // vale -10, igual que el base, y no tiene que aparecer como ajustada.
    const ajustes: Record<string, number> =
      puntaje === PUNTAJE_BASE ? {} : { [BAJO_PRIMERO]: puntaje, [CORTO]: puntaje };
    return { numero: i + 1, objetivo, ajustes };
  }),
};

/** Cambio 121: suma o resta y el objetivo se eligen al armar la partida. */
export const SIMPLE: Plantilla = {
  id: PLANTILLA_SIMPLE,
  nombre: 'Simple',
  icono: 'numeral',
  modoPuntos: 'suma',
  criterioVictoria: 'mayor',
  rondasIlimitadas: true,
  reglas: [],
  rondas: [],
};

/**
 * Cambio 93: dos bandos que se anotan de a palitos, a 30 por defecto (se cambia al
 * armar). La pantalla de la partida lo reconoce por el id.
 */
export const TRUCO: Plantilla = {
  id: PLANTILLA_TRUCO,
  nombre: 'Truco',
  icono: 'palitos',
  modoPuntos: 'suma',
  criterioVictoria: 'mayor',
  rondasIlimitadas: true,
  puntajeObjetivo: 30,
  reglas: [],
  rondas: [],
};

/**
 * Cambio 101: a 5000, de 2 a 6. Cada mano se carga con la calculadora de la
 * partida, que guarda un concepto por regla con sus puntos: el puntaje base es
 * lo que vale uno (una canasta, un tres rojo, un punto de cartas). Son opcionales
 * para que la tarjeta de la ronda no las liste.
 */
const reglaDeCanasta = (id: string, titulo: string, puntajeBase: number, orden: number) => ({
  id,
  titulo,
  puntajeBase,
  alcance: 'opcional' as const,
  asignacionUnica: id === REGLA_CIERRE,
  orden,
});

export const CANASTA: Plantilla = {
  id: PLANTILLA_CANASTA,
  nombre: 'Canasta',
  icono: 'canasta',
  modoPuntos: 'suma',
  criterioVictoria: 'mayor',
  rondasIlimitadas: true,
  puntajeObjetivo: 5000,
  reglas: [
    // En el orden de la calculadora (cambio 102). Si cambia, ver la migracion 7.
    reglaDeCanasta(REGLA_CIERRE, 'Cierre', PUNTOS_CIERRE, 0),
    reglaDeCanasta(REGLA_LIMPIAS, 'Canasta limpia', PUNTOS_LIMPIA, 1),
    reglaDeCanasta(REGLA_SUCIAS, 'Canasta sucia', PUNTOS_SUCIA, 2),
    reglaDeCanasta(REGLA_TRESES, 'Tres rojo', PUNTOS_TRES_ROJO, 3),
    reglaDeCanasta(REGLA_NEGROS, 'Tres negro', PUNTOS_TRES_NEGRO, 4),
    reglaDeCanasta(REGLA_BAJADAS, 'Cartas bajadas', 1, 5),
    reglaDeCanasta(REGLA_EN_MANO, 'Cartas en la mano', -1, 6),
  ],
  rondas: [],
};

export const PLANTILLAS_PREDEFINIDAS: Plantilla[] = [CARIOCA, SIMPLE, TRUCO, CANASTA];

/** Corre en cada arranque; solo inserta la primera vez. Devuelve cuantas inserto. */
export function sembrar(): Promise<number> {
  return asegurarPredefinidas(PLANTILLAS_PREDEFINIDAS);
}
