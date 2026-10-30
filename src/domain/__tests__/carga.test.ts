import { siguienteSinCargar, totalConCarga } from '../carga';
import type { Partida } from '../types';

/** Cuatro jugadores en Simple: la ronda 1 cerrada, la 2 en curso con `cargados`. */
function partida(cargados: Record<string, number>): Partida {
  const ids = ['a', 'b', 'c', 'd'];
  return {
    id: 'g1',
    nombre: 'Prueba',
    estado: 'en_curso',
    plantilla: {
      id: 'p1',
      nombre: 'Simple',
      icono: 'numeral',
      modoPuntos: 'suma',
      criterioVictoria: 'mayor',
      rondasIlimitadas: true,
      puntajeObjetivo: 100,
      reglas: [],
      rondas: [],
    },
    participantes: ids.map((id) => ({ id, nombre: id, avatarTipo: 'color', avatarValor: '#000000' })),
    rondas: [
      { numero: 1, estado: 'cerrada', entradas: ids.map((id) => ({ participanteId: id, puntosManuales: 10, marcas: {} })) },
      {
        numero: 2,
        estado: 'en_curso',
        entradas: Object.entries(cargados).map(([id, puntos]) => ({ participanteId: id, puntosManuales: puntos, marcas: {} })),
      },
    ],
  };
}

describe('siguienteSinCargar', () => {
  it('el proximo en el orden de la partida que no cargo', () => {
    expect(siguienteSinCargar(partida({ b: 5 }), 2, 'a')).toBe('c');
  });

  it('da la vuelta', () => {
    expect(siguienteSinCargar(partida({ a: 5, b: 5 }), 2, 'c')).toBe('d');
    expect(siguienteSinCargar(partida({ b: 5, d: 5 }), 2, 'c')).toBe('a');
  });

  it('si ya cargaron todos los demas, nadie', () => {
    expect(siguienteSinCargar(partida({ b: 5, c: 5, d: 5 }), 2, 'a')).toBeNull();
  });

  it('corrigiendo una ronda cerrada, nadie', () => {
    expect(siguienteSinCargar(partida({}), 1, 'a')).toBeNull();
  });
});

describe('totalConCarga', () => {
  it('el total antes y despues de la carga', () => {
    const { antes, despues } = totalConCarga(partida({}), 2, 'a', 15, []);
    expect(antes).toBe(10);
    expect(despues).toBe(25);
  });

  it('corrigiendo lo cargado, antes ya lo incluye', () => {
    const { antes, despues } = totalConCarga(partida({ a: 5 }), 2, 'a', 20, []);
    expect(antes).toBe(15);
    expect(despues).toBe(30);
  });
});
