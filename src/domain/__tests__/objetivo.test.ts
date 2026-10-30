import { faltaParaElObjetivo, llegaronAlObjetivo, llegoHastaRonda, nuevosEnLaRonda } from '../objetivo';
import type { ModoPuntos, Partida } from '../types';

/** Dos rondas en Simple: la 1 cerrada con `primera`, la 2 en curso vacia. */
function partida(primera: Record<string, number>, puntajeObjetivo?: number, modoPuntos: ModoPuntos = 'suma'): Partida {
  const ids = Object.keys(primera);
  return {
    id: 'g1',
    nombre: 'Prueba',
    estado: 'en_curso',
    plantilla: {
      id: 'p1',
      nombre: 'Simple',
      icono: 'numeral',
      modoPuntos,
      criterioVictoria: 'mayor',
      rondasIlimitadas: true,
      ...(puntajeObjetivo !== undefined && { puntajeObjetivo }),
      reglas: [],
      rondas: [],
    },
    participantes: ids.map((id) => ({ id, nombre: id, avatarTipo: 'color', avatarValor: '#000000' })),
    rondas: [
      {
        numero: 1,
        estado: 'cerrada',
        entradas: ids.map((id) => ({ participanteId: id, puntosManuales: primera[id] as number, marcas: {} })),
      },
      { numero: 2, estado: 'en_curso', entradas: [] },
    ],
  };
}

describe('llegaronAlObjetivo', () => {
  it('sin objetivo no llega nadie', () => {
    expect(llegaronAlObjetivo(partida({ a: 900, b: 10 }))).toEqual([]);
  });

  it('llega quien alcanza o pasa el objetivo', () => {
    expect(llegaronAlObjetivo(partida({ a: 30, b: 29, c: 45 }, 30))).toEqual(['a', 'c']);
  });

  it('en una plantilla que resta, se llega bajando', () => {
    expect(llegaronAlObjetivo(partida({ a: 100, b: 40 }, 100, 'resta'))).toEqual(['a']);
  });
});

/** La misma partida con la ronda 2 ya cargada. */
function conSegunda(base: Partida, segunda: Record<string, number>): Partida {
  return {
    ...base,
    rondas: base.rondas.map((ronda) =>
      ronda.numero === 2
        ? {
            ...ronda,
            entradas: Object.entries(segunda).map(([id, puntos]) => ({ participanteId: id, puntosManuales: puntos, marcas: {} })),
          }
        : ronda,
    ),
  };
}

describe('llegoHastaRonda', () => {
  it('mira el acumulado hasta esa ronda, no el de toda la partida', () => {
    const p = conSegunda(partida({ a: 25, b: 10 }, 30), { a: 5, b: 0 });
    expect(llegoHastaRonda(p, 'a', 1)).toBe(false);
    expect(llegoHastaRonda(p, 'a', 2)).toBe(true);
  });

  it('sin objetivo nunca llega', () => {
    expect(llegoHastaRonda(partida({ a: 900, b: 10 }), 'a', 1)).toBe(false);
  });
});

describe('faltaParaElObjetivo', () => {
  it('lo que falta con el acumulado hasta la ronda', () => {
    const p = conSegunda(partida({ a: 25, b: 10 }, 30), { a: 3, b: 0 });
    expect(faltaParaElObjetivo(p, 'a', 1)).toBe(5);
    expect(faltaParaElObjetivo(p, 'a', 2)).toBe(2);
  });

  it('restando, cuenta sin el signo', () => {
    expect(faltaParaElObjetivo(partida({ a: 70, b: 10 }, 100, 'resta'), 'a', 1)).toBe(30);
  });

  it('si ya llego, 0; sin objetivo, null', () => {
    expect(faltaParaElObjetivo(partida({ a: 45, b: 10 }, 30), 'a', 1)).toBe(0);
    expect(faltaParaElObjetivo(partida({ a: 45, b: 10 }), 'a', 1)).toBeNull();
  });
});

describe('nuevosEnLaRonda', () => {
  it('avisa por quien llega en esta ronda', () => {
    expect(nuevosEnLaRonda(conSegunda(partida({ a: 25, b: 10 }, 30), { a: 5, b: 4 }), 2)).toEqual(['a']);
  });

  it('no avisa si no llega nadie', () => {
    expect(nuevosEnLaRonda(conSegunda(partida({ a: 25, b: 10 }, 30), { a: 4, b: 4 }), 2)).toEqual([]);
  });

  it('no vuelve a avisar por quien ya habia llegado', () => {
    expect(nuevosEnLaRonda(conSegunda(partida({ a: 30, b: 10 }, 30), { a: 3, b: 0 }), 2)).toEqual([]);
  });

  it('avisa por varios a la vez', () => {
    expect(nuevosEnLaRonda(conSegunda(partida({ a: 25, b: 28 }, 30), { a: 5, b: 2 }), 2)).toEqual(['a', 'b']);
  });
});
