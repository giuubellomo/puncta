import { colorDeAvatar, indiceDeAvatar, TEMAS, temaPorId, valorDeAvatar } from '@/theme/temas';

describe('temas (cambio 113)', () => {
  it('todos tienen todos los colores', () => {
    for (const tema of TEMAS) {
      expect(Object.values(tema.colores).every((color) => color.length > 0)).toBe(true);
    }
  });

  it('Noche es el oscuro', () => {
    expect(TEMAS.filter((tema) => tema.modo === 'oscuro').map((tema) => tema.id)).toEqual(['noche']);
  });

  it('un id desconocido o una paleta vieja caen en Electrico', () => {
    expect(temaPorId('no-existe').id).toBe('electrico');
    expect(temaPorId('pasteles').id).toBe('electrico');
  });
});

describe('color de un avatar', () => {
  const cuatro = ['#A', '#B', '#C', '#D'];

  it('se guarda el numero y se pinta con los colores activos', () => {
    expect(colorDeAvatar(valorDeAvatar(2), cuatro)).toBe('#C');
  });

  it('los guardados antes con el hex de la monocroma se reconocen por su lugar', () => {
    expect(indiceDeAvatar('#636366')).toBe(1);
    expect(colorDeAvatar('#636366', cuatro)).toBe('#B');
  });

  it('si hay menos colores, da la vuelta', () => {
    expect(colorDeAvatar(valorDeAvatar(4), cuatro)).toBe('#A');
  });

  it('un color suelto se pinta tal cual', () => {
    expect(colorDeAvatar('#123456', cuatro)).toBe('#123456');
  });
});
