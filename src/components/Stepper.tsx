import { useState } from 'react';
import { Keyboard, Pressable, Text, TextInput, View } from 'react-native';

import { iconos } from '@/theme/iconos';
import { crearEstilos, useTema } from '@/theme/tema';
import { BORDE, espacios, numerales, radios, tipografia } from '@/theme/tokens';

import { BotonIcono } from './BotonIcono';

interface Props {
  valor: number;
  onCambiar: (valor: number) => void;
  /** Lo que lee el lector de pantalla en cada boton. */
  etiquetaRestar: string;
  etiquetaSumar: string;
  paso?: number;
  minimo?: number;
  maximo?: number;
  /** Como se muestra el numero; por ejemplo con signo: «+100». */
  formato?: (valor: number) => string;
  /**
   * casilla: como grande, con el numero dentro de una casilla con borde, como
   *   la de la fila de la ronda (popup de carga, cambio 126).
   * grande: numero enorme y botones de 48.
   * mediano: dentro de una caja con borde (editar regla).
   * compacto: en una fila (ajuste por ronda).
   */
  tamano?: 'casilla' | 'grande' | 'mediano' | 'compacto';
  /**
   * Tocar el numero abre el teclado numerico para escribirlo (popup de carga,
   * cambio 76). Se escribe sin signo: vale para `minimo` 0 o mas.
   */
  escribible?: boolean;
  /** Lo que lee el lector de pantalla en el numero cuando es escribible. */
  etiquetaEscribir?: string;
  /** Fijo: sin botones ni teclado, en gris (el que corto, en el popup de carga). */
  deshabilitado?: boolean;
}

export function Stepper({
  valor,
  onCambiar,
  etiquetaRestar,
  etiquetaSumar,
  paso = 1,
  minimo = -Infinity,
  maximo = Infinity,
  formato = String,
  tamano = 'mediano',
  escribible = false,
  etiquetaEscribir,
  deshabilitado = false,
}: Props) {
  const styles = useEstilos();
  const { colores, modo } = useTema();
  // null: se muestra el numero con su formato. Un texto: se esta escribiendo.
  const [escrito, setEscrito] = useState<string | null>(null);
  const enCasilla = tamano === 'casilla';
  const boton = tamano === 'grande' || enCasilla ? 48 : tamano === 'mediano' ? 36 : 28;
  const texto =
    tamano === 'grande' || enCasilla
      ? tipografia.numeroGrande
      : tamano === 'mediano'
        ? tipografia.subtitulo
        : tipografia.cuerpoFuerte;

  const estiloDelNumero = [texto, numerales, styles.valor, tamano !== 'compacto' && styles.valorAncho];

  /**
   * Cada digito ya cambia el valor: asi GUARDAR toma lo escrito aunque el
   * teclado siga abierto. Vacio vale el minimo, y nada se pasa del maximo.
   * Los ceros de adelante se borran: sobre un 0, escribir 125 da 125 y no 0125.
   */
  function escribir(texto: string) {
    const digitos = texto.replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, '');
    setEscrito(digitos);
    const numero = digitos === '' ? minimo : Number(digitos);
    onCambiar(Math.min(maximo, Math.max(minimo, numero)));
  }

  function terminarDeEscribir() {
    if (escrito === null) return;
    Keyboard.dismiss();
    setEscrito(null);
  }

  const numero = escrito !== null ? (
    <TextInput
      autoFocus
      // El teclado del telefono acompaña al modo (cambio 109).
      keyboardAppearance={modo === 'oscuro' ? 'dark' : 'light'}
      value={escrito}
      placeholder="0"
      placeholderTextColor={colores.grisMedio}
      keyboardType="number-pad"
      maxLength={String(maximo).length}
      accessibilityLabel={etiquetaEscribir}
      onChangeText={escribir}
      onBlur={() => setEscrito(null)}
      style={[estiloDelNumero, styles.escribiendo]}
    />
  ) : escribible && !deshabilitado ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiquetaEscribir}
      accessibilityValue={{ text: formato(valor) }}
      // Un 0 no se edita, se reemplaza: el campo arranca vacio.
      onPress={() => setEscrito(valor === 0 ? '' : String(valor))}
      style={styles.valorAncho}
    >
      <Text style={[texto, numerales, styles.valor]}>{formato(valor)}</Text>
    </Pressable>
  ) : (
    <Text accessibilityLiveRegion="polite" style={[estiloDelNumero, deshabilitado && styles.apagado]}>
      {formato(valor)}
    </Text>
  );

  return (
    <View
      style={[styles.fila, tamano === 'mediano' && styles.caja, tamano === 'compacto' && styles.compacto]}
    >
      <BotonIcono
        icono={iconos.menos}
        etiqueta={etiquetaRestar}
        tamano={boton}
        deshabilitado={deshabilitado || valor - paso < minimo}
        onPress={() => {
          terminarDeEscribir();
          onCambiar(valor - paso);
        }}
      />
      {enCasilla ? (
        <View style={[styles.casilla, deshabilitado && styles.casillaApagada]}>{numero}</View>
      ) : (
        numero
      )}
      <BotonIcono
        icono={iconos.mas}
        etiqueta={etiquetaSumar}
        tamano={boton}
        deshabilitado={deshabilitado || valor + paso > maximo}
        onPress={() => {
          terminarDeEscribir();
          onCambiar(valor + paso);
        }}
      />
    </View>
  );
}

const useEstilos = crearEstilos((colores) => ({
  fila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  caja: {
    borderWidth: 1.5,
    borderColor: colores.linea,
    borderRadius: radios.sm,
    paddingHorizontal: espacios.sm,
    paddingVertical: espacios.xs,
  },
  compacto: { gap: espacios.xs },
  // Cambio 126: la casilla de la fila, mas grande. Punteada si esta apagada (el que corto).
  casilla: {
    flex: 1,
    height: 78,
    marginHorizontal: espacios.sm,
    alignItems: 'stretch',
    justifyContent: 'center',
    borderWidth: BORDE,
    borderColor: colores.borde,
    borderRadius: radios.md,
    backgroundColor: colores.tarjeta,
  },
  casillaApagada: { borderStyle: 'dashed', borderColor: colores.grisMedio },
  valor: { color: colores.tinta, textAlign: 'center', minWidth: 56 },
  valorAncho: { flex: 1, justifyContent: 'center' },
  apagado: { color: colores.grisMedio },
  // Subrayado mientras se escribe, para que se note que es un campo.
  escribiendo: { borderBottomWidth: 2, borderBottomColor: colores.tinta, paddingVertical: 0 },
}));
