/**
 * Los ocho personajes de la lamina «Personajes» (cambio 115), para elegir
 * como avatar ademas de los colores. Ocupan el lugar de los iconos (cambio
 * 116): se guardan como avatar 'icono' con su clave de valor (`bomba`,
 * `fiaca`…), asi que no hace falta tocar el `CHECK` de la base.
 *
 * Sin nombre a la vista: la usuaria pidio que no se muestren (ni el nombre,
 * ni el apodo ni la frase de la lamina). La clave queda solo en el codigo.
 *
 * Los colores son los suyos y no siguen al tema: el personaje es siempre el mismo.
 * Cada dibujo es un SVG de 100×110, el mismo de la muestra aprobada.
 */

const T = '#141118';
const S = `stroke="${T}" stroke-width="3.5" stroke-linejoin="round"`;
const piernas = `<g stroke="${T}" stroke-width="4" stroke-linecap="round"><line x1="40" y1="82" x2="40" y2="98"/><line x1="60" y1="82" x2="60" y2="98"/></g><ellipse cx="37" cy="100" rx="7.5" ry="4.5" fill="${T}"/><ellipse cx="63" cy="100" rx="7.5" ry="4.5" fill="${T}"/>`;
/** `fuentes.display`, escrita aca para que el archivo no dependa de react-native y se pueda testear. */
const DISPLAY = 'BricolageGrotesque_800ExtraBold';
const fantasma = 'M24 88 L24 46 C24 29 36 20 50 20 C64 20 76 29 76 46 L76 88 L67.3 81 L58.6 88 L50 81 L41.3 88 L32.6 81 Z';

/** El contorno con puntas de Pincho. */
function estrella(cx: number, cy: number, puntas: number, rExt: number, rInt: number): string {
  const pts: string[] = [];
  for (let i = 0; i < puntas * 2; i++) {
    const r = i % 2 ? rInt : rExt;
    const a = (Math.PI / puntas) * i - Math.PI / 2;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join(' L')} Z`;
}

const DIBUJOS = {
  bomba: `${piernas}
    <path d="M27 32 L22 7 L43 25 Z" fill="#fff" ${S}/><path d="M73 32 L78 7 L57 25 Z" fill="#fff" ${S}/>
    <rect x="18" y="22" width="64" height="64" rx="20" fill="#FF3D2E" ${S}/>
    <rect x="27" y="42" width="20" height="12" rx="4" fill="${T}"/><rect x="53" y="42" width="20" height="12" rx="4" fill="${T}"/>
    <line x1="46" y1="45" x2="54" y2="45" stroke="${T}" stroke-width="3"/><rect x="30" y="44.5" width="6" height="2.5" rx="1" fill="#fff" opacity=".75"/>
    <path d="M36 66 Q50 75 64 63" fill="none" stroke="${T}" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M45 69.6 L50.5 71 L47.5 77 Z" fill="#fff" stroke="${T}" stroke-width="2" stroke-linejoin="round"/>`,
  fiaca: `${piernas}
    <path d="M16 86 C16 52 26 20 50 20 C74 20 84 52 84 86 Z" fill="#00C2FF" ${S}/>
    <path d="M31 48 A7 6 0 0 0 45 48 Z" fill="#fff" stroke="${T}" stroke-width="2.5"/><path d="M55 48 A7 6 0 0 0 69 48 Z" fill="#fff" stroke="${T}" stroke-width="2.5"/>
    <circle cx="38" cy="50.5" r="2.5" fill="${T}"/><circle cx="62" cy="50.5" r="2.5" fill="${T}"/>
    <g stroke="${T}" stroke-linecap="round" fill="none"><line x1="29" y1="47" x2="47" y2="47" stroke-width="4"/><line x1="53" y1="47" x2="71" y2="47" stroke-width="4"/>
    <path d="M33 57 Q38 59.5 43 57" stroke-width="2"/><path d="M57 57 Q62 59.5 67 57" stroke-width="2"/><line x1="42" y1="67" x2="48" y2="67" stroke-width="3"/></g>
    <circle cx="56" cy="69" r="7" fill="#C9F3FF" stroke="${T}" stroke-width="3"/><circle cx="54" cy="67" r="1.8" fill="#fff"/>
    <text x="72" y="17" font-family="${DISPLAY}" font-size="13" fill="${T}">Z<tspan font-size="9">zz</tspan></text>`,
  pincho: `${piernas}
    <path d="${estrella(50, 52, 13, 36, 27)}" fill="#FFC700" ${S}/>
    <g stroke="${T}" stroke-linecap="round"><line x1="33" y1="41" x2="46" y2="46" stroke-width="4.5"/><line x1="67" y1="41" x2="54" y2="46" stroke-width="4.5"/></g>
    <circle cx="41" cy="51" r="3.5" fill="${T}"/><circle cx="59" cy="51" r="3.5" fill="${T}"/>
    <rect x="36" y="59" width="28" height="11" rx="3" fill="#fff" ${S}/>
    <g stroke="${T}" stroke-width="2.5"><line x1="43" y1="59" x2="43" y2="70"/><line x1="50" y1="59" x2="50" y2="70"/><line x1="57" y1="59" x2="57" y2="70"/></g>
    <g stroke="#FF3D2E" stroke-width="3.5" stroke-linecap="round"><line x1="80" y1="8" x2="88" y2="16"/><line x1="88" y1="8" x2="80" y2="16"/></g>`,
  tembli: `${piernas}
    <g stroke="${T}" stroke-width="3" stroke-linecap="round"><line x1="41" y1="28" x2="35" y2="11"/><line x1="59" y1="28" x2="65" y2="11"/></g>
    <circle cx="35" cy="9" r="4.5" fill="#FF4FD8" stroke="${T}" stroke-width="2.5"/><circle cx="65" cy="9" r="4.5" fill="#FF4FD8" stroke="${T}" stroke-width="2.5"/>
    <rect x="26" y="24" width="48" height="62" rx="24" fill="#FF8A1F" ${S}/>
    <circle cx="41" cy="46" r="9.5" fill="#fff" ${S}/><circle cx="59" cy="46" r="9.5" fill="#fff" ${S}/>
    <circle cx="42" cy="47" r="4.5" fill="${T}"/><circle cx="58" cy="47" r="4.5" fill="${T}"/>
    <path d="M37 67 q3.25 -4 6.5 0 t6.5 0 t6.5 0 t6.5 0" fill="none" stroke="${T}" stroke-width="3" stroke-linecap="round"/>
    <path d="M85 28 C85 28 80 35 80 38.5 A5 5 0 0 0 90 38.5 C90 35 85 28 85 28 Z" fill="#00C2FF" stroke="${T}" stroke-width="2.5" stroke-linejoin="round"/>`,
  mimi: `${piernas}
    <path d="M50 35 Q48 28 50 22" fill="none" stroke="${T}" stroke-width="3" stroke-linecap="round"/>
    <path d="M50 22 C43.5 17 43.5 10.5 47.3 10.5 C49 10.5 50 12 50 13.2 C50 12 51 10.5 52.7 10.5 C56.5 10.5 56.5 17 50 22 Z" fill="#FF3D2E" stroke="${T}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M50 86 C24 70 14 54 16 42 C18 28 34 22 44 30 C47 32 49 34 50 37 C51 34 53 32 56 30 C66 22 82 28 84 42 C86 54 76 70 50 86 Z" fill="#FF4FD8" ${S}/>
    <circle cx="39" cy="48" r="7.5" fill="${T}"/><circle cx="61" cy="48" r="7.5" fill="${T}"/>
    <circle cx="41.5" cy="45.5" r="2.6" fill="#fff"/><circle cx="63.5" cy="45.5" r="2.6" fill="#fff"/><circle cx="37" cy="51" r="1.2" fill="#fff"/><circle cx="59" cy="51" r="1.2" fill="#fff"/>
    <ellipse cx="27" cy="58" rx="5" ry="3" fill="#FF9DB5"/><ellipse cx="73" cy="58" rx="5" ry="3" fill="#FF9DB5"/>
    <path d="M44 61 Q50 66 56 61" fill="none" stroke="${T}" stroke-width="3" stroke-linecap="round"/>
    <path d="M48 63.6 L51.3 64 L49.6 68.5 Z" fill="#fff" stroke="${T}" stroke-width="1.8" stroke-linejoin="round"/>`,
  glup: `${piernas}
    <circle cx="50" cy="56" r="32" fill="#00E39A" ${S}/>
    <path d="M38 28 L53 5 L64 26 Z" fill="#FF4FD8" ${S}/>
    <circle cx="50" cy="20" r="1.8" fill="#fff"/><circle cx="56" cy="16" r="1.8" fill="#fff"/><circle cx="56" cy="23" r="1.8" fill="#fff"/>
    <circle cx="53" cy="5" r="4" fill="#FFD23F" stroke="${T}" stroke-width="2.5"/>
    <circle cx="37" cy="47" r="7" fill="#fff" ${S}/><circle cx="38" cy="48" r="3" fill="${T}"/>
    <circle cx="60" cy="43" r="10.5" fill="#fff" ${S}/><circle cx="61" cy="44" r="4.5" fill="${T}"/>
    <path d="M31 60 Q50 90 69 60 Z" fill="${T}" ${S}/>
    <rect x="42" y="60.5" width="6.5" height="7" rx="1" fill="#fff"/><rect x="51.5" y="60.5" width="6.5" height="7" rx="1" fill="#fff"/>
    <ellipse cx="56" cy="74" rx="7" ry="4" fill="#FF3D2E"/>`,
  profe: `${piernas}
    <path d="M74 60 Q87 54 85 34" fill="none" stroke="${T}" stroke-width="10" stroke-linecap="round"/>
    <path d="M74 60 Q87 54 85 34" fill="none" stroke="#2E5BFF" stroke-width="4.5" stroke-linecap="round"/>
    <path d="${fantasma}" fill="#2E5BFF" ${S}/>
    <rect x="36" y="22" width="28" height="9" fill="${T}"/><path d="M20 22 L50 11 L80 22 L50 32 Z" fill="${T}" stroke="${T}" stroke-width="2" stroke-linejoin="round"/>
    <line x1="72" y1="23" x2="73" y2="38" stroke="#FFD23F" stroke-width="2.5"/><circle cx="73" cy="39.5" r="2.6" fill="#FFD23F"/>
    <circle cx="40" cy="50" r="8.5" fill="#fff" stroke="${T}" stroke-width="3"/><circle cx="60" cy="50" r="8.5" fill="#fff" stroke="${T}" stroke-width="3"/>
    <line x1="48.5" y1="50" x2="51.5" y2="50" stroke="${T}" stroke-width="3"/>
    <circle cx="41" cy="51" r="3.2" fill="${T}"/><circle cx="61" cy="51" r="3.2" fill="${T}"/>
    <path d="M40 66 Q50 72 60 64" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,
  sombra: `${piernas}
    <g transform="rotate(14 75 54)"><rect x="64" y="40" width="22" height="29" rx="3" fill="#fff" ${S}/>
    <path d="M75 59 C71 56 71 52 73 52 C74 52 75 53 75 54 C75 53 76 52 77 52 C79 52 79 56 75 59 Z" fill="#FF3D2E"/></g>
    <path d="${fantasma}" fill="${T}" ${S}/>
    <g stroke="#fff" stroke-linecap="round" fill="none"><line x1="32" y1="44" x2="46" y2="46.5" stroke-width="3.5"/><line x1="54" y1="46.5" x2="68" y2="44" stroke-width="3.5"/>
    <path d="M38 62 Q50 70 61 59" stroke-width="3.5"/></g>
    <ellipse cx="40" cy="51" rx="6" ry="3" fill="#fff"/><ellipse cx="61" cy="51" rx="6" ry="3" fill="#fff"/>
    <circle cx="42.5" cy="51" r="2.2" fill="${T}"/><circle cx="63.5" cy="51" r="2.2" fill="${T}"/>`,
} as const;

export type IdPersonaje = keyof typeof DIBUJOS;

/** En el orden de la lamina, que es el de la grilla para elegir. */
export const PERSONAJES = Object.keys(DIBUJOS) as IdPersonaje[];

/** Ancho sobre alto del dibujo: son un poco mas altos que anchos. */
export const PROPORCION_PERSONAJE = 100 / 110;

export function esPersonaje(valor: string): valor is IdPersonaje {
  return Object.prototype.hasOwnProperty.call(DIBUJOS, valor);
}

/** El SVG entero de un personaje, para `SvgXml`. */
export function svgDePersonaje(id: IdPersonaje): string {
  return `<svg viewBox="0 0 100 110" xmlns="http://www.w3.org/2000/svg">${DIBUJOS[id]}</svg>`;
}
