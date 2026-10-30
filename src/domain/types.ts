/**
 * Tipos del dominio de Puncta.
 *
 * TypeScript puro: este archivo no importa React, ni SQLite, ni nada de React Native.
 * Los nombres y los campos estan fijados por el plan (paso 1.1) y no se renombran.
 */

export type AvatarTipo = 'color' | 'icono';
export type ModoPuntos = 'suma' | 'resta';
export type CriterioVictoria = 'menor' | 'mayor';
export type AlcanceRegla = 'todas' | 'opcional';
export type EstadoRonda = 'bloqueada' | 'en_curso' | 'cerrada';
export type EstadoPartida = 'en_curso' | 'finalizada';

export interface Participante {
  id: string;
  nombre: string;
  avatarTipo: AvatarTipo;
  avatarValor: string;
}

export interface Regla {
  id: string;
  titulo: string;
  descripcion?: string;
  puntajeBase: number;        // con signo, distinto de cero
  alcance: AlcanceRegla;
  asignacionUnica: boolean;
  orden: number;
  /**
   * Si viene, la regla existe solo en esa ronda (el numero de la RondaDefinida);
   * en las demas no se muestra ni se pide. Sin el campo, vale en todas.
   * Paso 5.4, ver registro: el mockup la dibuja como «Regla solo para esta ronda».
   */
  soloEnRonda?: number;
}

export interface RondaDefinida {
  numero: number;
  objetivo?: string;
  /** puntaje de una regla solo para esta ronda; pisa a puntajeBase (RF-503) */
  ajustes: Record<string, number>;   // reglaId -> puntaje
}

export interface Plantilla {
  id: string;
  nombre: string;
  icono: string;
  modoPuntos: ModoPuntos;
  criterioVictoria: CriterioVictoria;
  rondasIlimitadas: boolean;
  /**
   * La partida termina cuando alguien llega a este total, y gana segun
   * `criterioVictoria` (cambio 92). Positivo; sin el campo no hay objetivo. En
   * el snapshot de una partida es el que se eligio al armarla.
   */
  puntajeObjetivo?: number;
  /**
   * Un texto corto para tener a mano en la mesa: cuanto vale cada carta, como
   * se cuenta (cambio 119). Se abre con el «?» de la partida. Sin el campo, no hay.
   */
  ayuda?: string;
  /**
   * El objetivo de cada ronda se escribe al jugarla, como la letra del Tutti
   * Frutti (cambio 119). Sin el campo, sale de las rondas de la plantilla.
   */
  objetivoEditable?: true;
  reglas: Regla[];
  rondas: RondaDefinida[];
}

/** Lo que se carga para un participante en una ronda */
export interface EntradaRonda {
  participanteId: string;
  /** siempre positivo o null; el signo lo pone modoPuntos (A-2) */
  puntosManuales: number | null;
  /** reglaId -> puntos congelados al marcar (C-4) */
  marcas: Record<string, number>;
}

export interface RondaJugada {
  numero: number;
  objetivo?: string;
  estado: EstadoRonda;
  entradas: EntradaRonda[];
}

export interface Partida {
  id: string;
  nombre: string;
  estado: EstadoPartida;
  plantilla: Plantilla;        // el snapshot congelado (C-5)
  participantes: Participante[];
  rondas: RondaJugada[];
}
