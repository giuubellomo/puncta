import { useCallback, useState } from 'react';

import { faltantesParaEmpezar, maximoDeJugadores, type Faltante } from '@/domain/participantes';
import { nombreDePartida } from '@/domain/partidas';
import { esSimple } from '@/domain/simple';
import type { ModoPuntos, Partida, Participante, Plantilla } from '@/domain/types';
import { nuevoId } from '@/repositories/comun';
import * as partidas from '@/repositories/partidas';

import { mutar } from './useConsulta';

/** Nombre y avatar: lo que carga el popup. El id lo pone el armado. */
type DatosJugador = Omit<Participante, 'id'>;

export interface ArmadoDePartida {
  /** Tal como se escribe; se limpia al empezar. Obligatorio (cambio 71). */
  nombre: string;
  cambiarNombre: (texto: string) => void;
  plantillaId: string | null;
  /**
   * El objetivo de esta partida (cambio 92): arranca con el de la plantilla y se
   * puede cambiar. null si la plantilla elegida no tiene.
   */
  objetivo: number | null;
  /** En la Simple tambien se saca o se pone: null es sin objetivo (cambio 121). */
  cambiarObjetivo: (puntos: number | null) => void;
  /**
   * Cambio 121: si los puntos se suman o se restan, que en la Simple se elige al
   * armar. null en las demas: queda el de la plantilla.
   */
  modoPuntos: ModoPuntos | null;
  cambiarModoPuntos: (modo: ModoPuntos) => void;
  /** En el orden en que se agregaron: es el orden de la partida. */
  jugadores: Participante[];
  /** Con el objetivo (y en la Simple, el modo) que trae la plantilla: pisan a los elegidos para otra. */
  elegirPlantilla: (plantilla: Plantilla) => void;
  /** No hace nada si ya estan los ocho (RF-605), o los dos del Truco (cambio 94). */
  agregarJugador: (datos: DatosJugador) => void;
  editarJugador: (id: string, datos: DatosJugador) => void;
  sacarJugador: (id: string) => void;
  /** Vuelve a cero: sin nombre, sin plantilla y sin jugadores. Es la misma funcion en cada render. */
  reiniciar: () => void;
  hayLugar: boolean;
  /** Lo que falta para empezar, en el orden del sheet (cambio 95). Vacio: se puede. */
  faltantes: Faltante[];
  /**
   * Crea la partida con lo elegido (paso 6.2) y recarga los hooks montados: el
   * Home pasa a mostrarla. Si falla, deja pasar el error.
   */
  empezar: () => Promise<Partida>;
}

/**
 * Lo que se elige en el sheet de «Nueva partida» (paso 6.1, RF-601 a RF-605).
 *
 * Los jugadores son de esta partida y no se guardan aparte (registro, cambio 65):
 * viven aca, en memoria, hasta EMPEZAR. Cada uno nace con un uuid, que es el que
 * va a llevar en la partida (RNF-9).
 */
export function useArmadoDePartida(): ArmadoDePartida {
  const [nombre, setNombre] = useState('');
  const [plantillaId, setPlantillaId] = useState<string | null>(null);
  const [objetivo, setObjetivo] = useState<number | null>(null);
  const [modoPuntos, setModoPuntos] = useState<ModoPuntos | null>(null);
  const [jugadores, setJugadores] = useState<Participante[]>([]);
  const maximo = maximoDeJugadores(plantillaId);

  // Estable: el sheet la llama en un efecto, cada vez que se abre.
  const reiniciar = useCallback(() => {
    setNombre('');
    setPlantillaId(null);
    setObjetivo(null);
    setModoPuntos(null);
    setJugadores([]);
  }, []);

  return {
    nombre,
    cambiarNombre: setNombre,
    plantillaId,
    objetivo,
    cambiarObjetivo: setObjetivo,
    modoPuntos,
    cambiarModoPuntos: setModoPuntos,
    jugadores,
    elegirPlantilla: (plantilla) => {
      setPlantillaId(plantilla.id);
      setObjetivo(plantilla.puntajeObjetivo ?? null);
      setModoPuntos(esSimple(plantilla) ? plantilla.modoPuntos : null);
    },
    agregarJugador: (datos) =>
      setJugadores((previos) =>
        previos.length >= maximo ? previos : [...previos, { ...datos, id: nuevoId() }],
      ),
    editarJugador: (id, datos) =>
      setJugadores((previos) => previos.map((jugador) => (jugador.id === id ? { ...datos, id } : jugador))),
    sacarJugador: (id) => setJugadores((previos) => previos.filter((jugador) => jugador.id !== id)),
    reiniciar,
    hayLugar: jugadores.length < maximo,
    faltantes: faltantesParaEmpezar(nombre, plantillaId !== null, jugadores.length, maximo),
    empezar: () => {
      const limpio = nombreDePartida(nombre);
      if (limpio === null) return Promise.reject(new Error('La partida no tiene nombre'));
      if (plantillaId === null) return Promise.reject(new Error('No hay plantilla elegida'));
      return mutar(() =>
        partidas.crear({
          nombre: limpio,
          plantillaId,
          participantes: jugadores,
          ...(objetivo !== null && { puntajeObjetivo: objetivo }),
          ...(modoPuntos !== null && { modoPuntos }),
        }),
      );
    },
  };
}
