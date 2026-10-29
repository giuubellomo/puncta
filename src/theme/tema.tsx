import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';

import * as ajustes from '@/repositories/ajustes';

import { COLORES_DE_PARTICIPANTES, temaPorId, TEMA_POR_DEFECTO, type Colores, type IdTema, type Modo } from './temas';

/**
 * Una clave nueva: la `paleta` del cambio 109 queda guardada pero ya no se lee,
 * asi que quien venia con una paleta arranca en Electrico.
 */
const CLAVE_TEMA = 'tema';

export interface Tema {
  colores: Colores;
  /** Los colores para elegir de los participantes. */
  coloresDeParticipantes: readonly string[];
  /** Noche es oscuro; los otros, claros. Para la barra del telefono y el teclado. */
  modo: Modo;
  tema: IdTema;
  /** Cambia en vivo y lo guarda. Si no se puede guardar, igual se ve mientras dure la app. */
  cambiarTema: (tema: IdTema) => void;
}

const ContextoDeTema = createContext<Tema | null>(null);

/** Lo guardado, para arrancar ya con el tema elegido y sin un parpadeo del de siempre. */
export async function leerTemaGuardado(): Promise<IdTema> {
  return temaPorId((await ajustes.leerAjuste(CLAVE_TEMA)) ?? TEMA_POR_DEFECTO).id;
}

/**
 * Los colores de la app (cambio 113): el tema elegido en Configuracion.
 * Cambiarlo repinta todo en vivo, sin reiniciar.
 */
export function ProveedorDeTema({ inicial, children }: { inicial: IdTema; children: ReactNode }) {
  const [id, setId] = useState<IdTema>(inicial);

  const tema = useMemo<Tema>(() => {
    const elegido = temaPorId(id);
    return {
      colores: elegido.colores,
      coloresDeParticipantes: COLORES_DE_PARTICIPANTES,
      modo: elegido.modo,
      tema: elegido.id,
      cambiarTema: (nuevo) => {
        setId(nuevo);
        void ajustes.guardarAjuste(CLAVE_TEMA, nuevo).catch(() => undefined);
      },
    };
  }, [id]);

  return <ContextoDeTema.Provider value={tema}>{children}</ContextoDeTema.Provider>;
}

export function useTema(): Tema {
  const tema = useContext(ContextoDeTema);
  if (tema === null) throw new Error('useTema va adentro de ProveedorDeTema');
  return tema;
}

/** Como el argumento de `StyleSheet.create`: el `& Estilos` del parametro tipa los literales ('row', 'center'…). */
type Estilos = Record<string, ViewStyle | TextStyle | ImageStyle>;

/**
 * Los estilos de un componente en funcion de los colores del tema. Reemplaza al
 * `StyleSheet.create` suelto: se arman una vez por juego de colores y se
 * reusan, asi cambiar de tema no los recrea en cada dibujo.
 *
 *   const useEstilos = crearEstilos((colores) => ({ texto: { color: colores.tinta } }));
 *   function Componente() { const styles = useEstilos(); ... }
 */
export function crearEstilos<T extends Estilos>(fabrica: (colores: Colores) => T & Estilos): () => T {
  const armados = new WeakMap<Colores, T>();
  return function useEstilos(): T {
    const { colores } = useTema();
    let estilos = armados.get(colores);
    if (estilos === undefined) {
      estilos = StyleSheet.create(fabrica(colores));
      armados.set(colores, estilos);
    }
    return estilos;
  };
}
