import { View } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';

import { ALTURA_DEL_LOGO, ANCHO_DEL_LOGO, ESTIRADO_DEL_LOGO, LETRAS_DEL_LOGO } from '@/theme/logo';
import { useTema } from '@/theme/tema';

/** El borde de las letras: la mitad queda por fuera de la letra, como en la muestra. */
const GROSOR = 6;
/** Hasta donde llega la sombra unida, hacia abajo a la derecha. */
const SOMBRA_X = 6;
const SOMBRA_Y = 7;
/** Copias de la letra entre la letra y el final de la sombra: con estas ya se ve un bloque. */
const PASOS_SOMBRA = 12;
const MARGEN = 4;

/** Cada letra donde cae: corrida lo que crecieron hacia los costados las de antes. */
const LETRAS = (() => {
  let extra = 0;
  return LETRAS_DEL_LOGO.map((letra, i) => {
    const siguiente = LETRAS_DEL_LOGO[i + 1];
    const x = letra.x + extra;
    if (siguiente !== undefined) extra += (ANCHO_DEL_LOGO[i]! - 1) * (siguiente.x - letra.x);
    return { ...letra, x, y: ALTURA_DEL_LOGO[i]!, ancho: ANCHO_DEL_LOGO[i]!, alto: ESTIRADO_DEL_LOGO[i]! };
  });
})();

/** La caja de todo el dibujo, con el borde y la sombra. */
const CAJA = (() => {
  const xs = LETRAS.flatMap((l) => [l.x + l.ancho * l.caja[0], l.x + l.ancho * l.caja[2]]);
  const ys = LETRAS.flatMap((l) => [l.y + l.alto * l.caja[1], l.y + l.alto * l.caja[3]]);
  const borde = GROSOR / 2 + MARGEN;
  const x = Math.min(...xs) - borde;
  const y = Math.min(...ys) - borde;
  return { x, y, ancho: Math.max(...xs) + SOMBRA_X + borde - x, alto: Math.max(...ys) + SOMBRA_Y + borde - y };
})();

interface Props {
  /** El ancho dibujado; el alto sale de la proporcion del logo. */
  ancho: number;
}

/**
 * El logo del Home (cambio 128): «puncta» en Bricolage, cada letra estirada hacia
 * arriba en un porcentaje distinto, en el color del logo del tema con el borde
 * negro, y una sombra dura unida a las letras hacia abajo a la derecha.
 *
 * Las letras son contornos (`theme/logo.ts`) y no texto: React Native no tiene
 * borde de texto, y asi no depende de que react-native-svg encuentre la fuente.
 * El borde «por fuera» se hace con dos capas: la letra con un trazo grueso del
 * color del borde, y encima la letra sin trazo.
 */
export function LogoPuncta({ ancho }: Props) {
  const { colores } = useTema();
  const transformar = (letra: (typeof LETRAS)[number], dx = 0, dy = 0) =>
    `translate(${letra.x + dx} ${letra.y + dy}) scale(${letra.ancho} ${letra.alto})`;
  const sombra = Array.from({ length: PASOS_SOMBRA }, (_, k) => (PASOS_SOMBRA - k) / PASOS_SOMBRA);

  // El rol de encabezado va en la caja y no en el Svg: en la web, react-native-svg
  // con ese rol dibuja un <h1> en lugar de un <svg> y las letras no se ven.
  return (
    <View accessible accessibilityRole="header" accessibilityLabel="Puncta">
      <Svg
        width={ancho}
        height={(ancho * CAJA.alto) / CAJA.ancho}
        viewBox={`${CAJA.x} ${CAJA.y} ${CAJA.ancho} ${CAJA.alto}`}
      >
        {LETRAS.map((letra) =>
          sombra.map((t) => (
            <Path
              key={`${letra.letra}-${t}`}
              d={letra.d}
              transform={transformar(letra, SOMBRA_X * t, SOMBRA_Y * t)}
              fill={colores.borde}
              stroke={colores.borde}
              strokeWidth={GROSOR}
              strokeLinejoin="round"
            />
          )),
        )}
        {LETRAS.map((letra) => (
          <G key={letra.letra} transform={transformar(letra)}>
            <Path d={letra.d} fill={colores.borde} stroke={colores.borde} strokeWidth={GROSOR} strokeLinejoin="round" />
            <Path d={letra.d} fill={colores.logo} />
          </G>
        ))}
      </Svg>
    </View>
  );
}
