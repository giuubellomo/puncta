import { esPersonaje, PERSONAJES, svgDePersonaje } from '@/theme/personajes';

describe('personajes', () => {
  it('son los ocho de la lamina', () => {
    expect(PERSONAJES).toHaveLength(8);
  });

  it('no confunden los glifos de los iconos que habia antes (cambio 116)', () => {
    for (const icono of ['★', '☀\uFE0E', '♪\uFE0E']) expect(esPersonaje(icono)).toBe(false);
  });

  it('reconoce solo sus claves', () => {
    for (const id of PERSONAJES) expect(esPersonaje(id)).toBe(true);
    expect(esPersonaje('toString')).toBe(false);
    expect(esPersonaje('#FF3D2E')).toBe(false);
  });

  it('cada dibujo es un svg completo', () => {
    for (const id of PERSONAJES) {
      const svg = svgDePersonaje(id);
      expect(svg.startsWith('<svg viewBox="0 0 100 110"')).toBe(true);
      expect(svg.endsWith('</svg>')).toBe(true);
      expect(svg).not.toContain('undefined');
    }
  });
});
