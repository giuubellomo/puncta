// Arma los SVG del icono de Puncta (cambio 127) con las medidas de la muestra: lapiz
// amarillo con borde negro, adelante, y la chispa grande detras, sobre violeta.
//
//   node scripts/generar-icono.mjs <carpeta>
//
// y despues cada SVG a PNG con `swift scripts/svg-a-png.swift <svg> <png> <lado>`:
//   completo.svg       -> assets/icon.png 1024, public/apple-touch-icon.png 180,
//                         public/icon-192.png 192, public/icon-512.png 512
//   favicon.svg        -> assets/favicon.png 48
//   android-frente.svg -> assets/android-icon-foreground.png 512
//   android-fondo.svg  -> assets/android-icon-background.png 512
//   android-mono.svg   -> assets/android-icon-monochrome.png 432
//   carga.svg          -> assets/splash-icon.png 1024
import fs from 'node:fs';
import path from 'node:path';

const salida = process.argv[2];

const T = '#141118';
const SOL = '#FFD23F';
const VIOLETA = '#A52AE6';

function lapiz({ cuerpo, borde, mina }) {
  const S = `stroke="${borde}" stroke-width="3.5" stroke-linejoin="round"`;
  return (
    `<path d="M30 40 L74 40 L74 60 L30 60 Z" fill="${cuerpo}" ${S}/>` +
    `<path d="M30 46.7 L74 46.7 M30 53.3 L74 53.3" stroke="${borde}" stroke-width="1.6" opacity=".35"/>` +
    `<path d="M74 40 L81 40 L81 60 L74 60 Z" fill="${cuerpo}" ${S}/>` +
    `<path d="M77.5 40 L77.5 60" stroke="${borde}" stroke-width="1.6"/>` +
    `<path d="M81 40 L86 40 Q92 40 92 46 L92 54 Q92 60 86 60 L81 60 Z" fill="${cuerpo}" ${S}/>` +
    `<path d="M30 40 L12 50 L30 60 Z" fill="${cuerpo}" ${S}/>` +
    `<path d="M18.2 46.6 L12 50 L18.2 53.4 Z" fill="${mina}" ${S}/>`
  );
}

function chispa({ relleno, borde }) {
  return `<path transform="translate(1.2 26.1) scale(2.9)" d="M12 1.5l2.4 7.1 7.1 2.4-7.1 2.4L12 20.5l-2.4-7.1L2.5 11l7.1-2.4z" fill="${relleno}" stroke="${borde}" stroke-width="1.6" stroke-linejoin="round"/>`;
}

/** El dibujo en la caja de 100 × 100 de la muestra: chispa detrás, lápiz girado adelante. */
function dibujo(colores) {
  // caja [8, 8, 84, 84] al 70 %, con el corrimiento de 2 hacia abajo de la muestra.
  const escala = 70 / 84;
  const x = (100 - 70) / 2 - 8 * escala;
  const y = x + 2;
  return (
    chispa(colores) +
    `<g transform="translate(${x.toFixed(3)} ${y.toFixed(3)}) scale(${escala.toFixed(5)})">` +
    `<g transform="rotate(-42 50 50) translate(-2 0)">${lapiz(colores)}</g></g>`
  );
}

const color = { cuerpo: SOL, relleno: SOL, borde: T, mina: T };
/** Solo las lineas, en blanco: Android lo tiñe con el color del sistema. */
const lineas = { cuerpo: 'none', relleno: 'none', borde: '#FFFFFF', mina: '#FFFFFF' };

/** `zona`: que parte del lado ocupa el dibujo, centrado (Android deja un margen seguro). */
function svg({ fondo, colores, zona = 1, radio = 0 }) {
  const corrimiento = (100 * (1 - zona)) / 2;
  const fondoSvg = fondo ? `<rect width="100" height="100" rx="${radio}" fill="${fondo}"/>` : '';
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="1024" height="1024">${fondoSvg}` +
    `<g transform="translate(${corrimiento} ${corrimiento}) scale(${zona})">${dibujo(colores)}</g></svg>`
  );
}

const archivos = {
  // iPhone y la web: cuadrado lleno, el sistema redondea.
  'completo.svg': svg({ fondo: VIOLETA, colores: color }),
  // La pestaña del navegador: ya redondeado.
  'favicon.svg': svg({ fondo: VIOLETA, colores: color, radio: 22.5 }),
  // Android adaptativo: el dibujo dentro del 66 % del centro, sin fondo.
  'android-frente.svg': svg({ colores: color, zona: 0.62 }),
  'android-fondo.svg': svg({ fondo: VIOLETA, colores: { cuerpo: 'none', relleno: 'none', borde: 'none', mina: 'none' } }),
  'android-mono.svg': svg({ colores: lineas, zona: 0.62 }),
  // La pantalla de carga: el dibujo solo, sin fondo.
  'carga.svg': svg({ colores: color, zona: 0.8 }),
};
for (const [nombre, contenido] of Object.entries(archivos)) fs.writeFileSync(path.join(salida, nombre), contenido);
console.log(Object.keys(archivos).join(' '));
