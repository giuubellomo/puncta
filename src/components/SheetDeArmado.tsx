import { useRouter } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Keyboard, Pressable, ScrollView, type ScrollViewInstance, Text, View } from 'react-native';

import { MAXIMO_OBJETIVO, OBJETIVO_POR_DEFECTO, PASO_OBJETIVO } from '@/domain/objetivo';
import { EQUIPOS_DEL_TRUCO, maximoDeJugadores, MINIMO_JUGADORES, type Faltante } from '@/domain/participantes';
import { LARGO_MAXIMO_NOMBRE_PARTIDA } from '@/domain/partidas';
import type { ModoPuntos, Participante, Partida } from '@/domain/types';
import { useArmadoDePartida } from '@/hooks/useArmadoDePartida';
import { usePlantillas } from '@/hooks/usePlantillas';
import { es } from '@/i18n/es';
import { iconoDePlantilla, iconos } from '@/theme/iconos';
import { crearEstilos } from '@/theme/tema';
import { espacios, tipografia } from '@/theme/tokens';

import { Avatar } from './Avatar';
import { BottomSheet } from './BottomSheet';
import { Boton } from './Boton';
import { CampoTexto } from './CampoTexto';
import { Card } from './Card';
import { Etiqueta } from './Etiqueta';
import { PopupParticipante } from './PopupParticipante';
import { Segmented } from './Segmented';
import { Stepper } from './Stepper';

const LADO_AVATAR = 60;

interface Props {
  visible: boolean;
  onCerrar: () => void;
}

/**
 * Sheet «Nueva partida» (paso 6.1, RF-601 a RF-605).
 *
 * Arriba, las plantillas de a dos por fila; abajo, los jugadores de esta
 * partida, que se cargan acá y no se guardan aparte (registro, cambio 65).
 * EMPEZAR crea la partida (6.2) si hay nombre, plantilla y jugadores (RF-604).
 * Si falta algo se puede tocar igual (cambio 95): no empieza, marca cada parte
 * que falta con un texto y lleva la vista a la primera.
 *
 * Asume que no hay partida en curso: el Home ya resolvió ese caso (4.2, A-5).
 */
export function SheetDeArmado({ visible, onCerrar }: Props) {
  const styles = useEstilos();
  const { plantillas } = usePlantillas();
  const router = useRouter();
  const armado = useArmadoDePartida();
  // null = popup cerrado. Con un jugador se edita ese; con 'nuevo', se da de alta.
  const [jugadorEnEdicion, setJugadorEnEdicion] = useState<Participante | 'nuevo' | null>(null);
  const [empezando, setEmpezando] = useState(false);
  const [errorAlEmpezar, setErrorAlEmpezar] = useState(false);
  // Se tocó EMPEZAR con algo sin completar: desde ahí se marca lo que falta, y
  // cada marca se va sola apenas se completa esa parte.
  const [intento, setIntento] = useState(false);
  const scroll = useRef<ScrollViewInstance>(null);
  // Dónde arranca cada parte dentro del scroll, para llevar la vista ahí.
  const posiciones = useRef<Partial<Record<'nombre' | 'plantilla' | 'jugadores', number>>>({});

  // Cada apertura arranca vacía: una partida no hereda lo que se eligió para otra.
  const { reiniciar } = armado;
  useEffect(() => {
    if (!visible) return;
    reiniciar();
    setJugadorEnEdicion(null);
    setEmpezando(false);
    setErrorAlEmpezar(false);
    setIntento(false);
  }, [visible, reiniciar]);

  const falta = (faltante: Faltante) => intento && armado.faltantes.includes(faltante);
  const mensajeDeJugadores = falta('pocos')
    ? es.nuevaPartida.faltanJugadores(MINIMO_JUGADORES - armado.jugadores.length)
    : falta('demasiados')
      ? es.nuevaPartida.sobranJugadores(maximoDeJugadores(armado.plantillaId))
      : undefined;

  const tocarEmpezar = () => {
    Keyboard.dismiss();
    const [primero] = armado.faltantes;
    if (primero === undefined) {
      void empezar();
      return;
    }
    setIntento(true);
    const parte = primero === 'nombre' ? 'nombre' : primero === 'plantilla' ? 'plantilla' : 'jugadores';
    scroll.current?.scrollTo({ y: Math.max(0, (posiciones.current[parte] ?? 0) - espacios.md), animated: true });
    AccessibilityInfo.announceForAccessibility(mensajesDe(armado.faltantes, armado.jugadores.length, maximoDeJugadores(armado.plantillaId)).join('. '));
  };

  // Paso 6.2: crea la partida, cierra el sheet y la abre (7.1).
  const empezar = async () => {
    setEmpezando(true);
    setErrorAlEmpezar(false);
    let partida: Partida;
    try {
      partida = await armado.empezar();
    } catch {
      setErrorAlEmpezar(true);
      setEmpezando(false);
      return;
    }
    onCerrar();
    router.push({ pathname: '/partida/[id]', params: { id: partida.id } });
  };

  // Tocar otra cosa suelta el campo del nombre: si no, el teclado queda abierto, y
  // al cerrarse el popup de participante iOS le devuelve el foco y vuelve a subir.
  const abrirJugador = (jugador: Participante | 'nuevo') => {
    Keyboard.dismiss();
    setJugadorEnEdicion(jugador);
  };

  const editado = jugadorEnEdicion === 'nuevo' || jugadorEnEdicion === null ? undefined : jugadorEnEdicion;
  // RF-202: el nombre no se repite entre los jugadores de esta partida.
  const nombresOcupados = armado.jugadores.filter((otro) => otro.id !== editado?.id).map((otro) => otro.nombre);

  return (
    <BottomSheet
      visible={visible}
      onCerrar={onCerrar}
      titulo={es.nuevaPartida.titulo}
      scrollRef={scroll}
      pie={
        <View style={styles.pie}>
          {errorAlEmpezar && <Text style={styles.error}>{es.comun.errorGuardar}</Text>}
          <Boton titulo={es.nuevaPartida.empezar} deshabilitado={empezando} onPress={tocarEmpezar} />
        </View>
      }
    >
      {/* Obligatorio: sin nombre, EMPEZAR no se habilita (registro, cambio 71). */}
      <View onLayout={(e) => (posiciones.current.nombre = e.nativeEvent.layout.y)}>
        <CampoTexto
          etiqueta={es.nuevaPartida.nombre}
          valor={armado.nombre}
          onCambiar={armado.cambiarNombre}
          placeholder={es.nuevaPartida.nombreEjemplo}
          maxLength={LARGO_MAXIMO_NOMBRE_PARTIDA}
          returnKeyType="done"
          error={falta('nombre') ? es.nuevaPartida.faltaNombre : undefined}
        />
      </View>

      <View style={styles.seccion} onLayout={(e) => (posiciones.current.plantilla = e.nativeEvent.layout.y)}>
        <Etiqueta texto={es.nuevaPartida.tipoDeJuego} />
        {falta('plantilla') && <Text style={styles.falta}>{es.nuevaPartida.faltaTipo}</Text>}
        <Grilla>
          {plantillas.map((plantilla) => (
            <Card
              key={plantilla.id}
              estado={plantilla.id === armado.plantillaId ? 'seleccionada' : 'normal'}
              onPress={() => {
                Keyboard.dismiss();
                armado.elegirPlantilla(plantilla);
              }}
              etiqueta={plantilla.nombre}
              style={styles.plantilla}
            >
              <Text allowFontScaling={false} style={styles.glifo}>
                {iconoDePlantilla(plantilla.icono)}
              </Text>
              <Text style={styles.nombrePlantilla} numberOfLines={2}>
                {plantilla.nombre}
              </Text>
            </Card>
          ))}
        </Grilla>
      </View>

      {/* Cambio 121: en la Simple, suma o resta se elige aca. */}
      {armado.modoPuntos !== null && (
        <View style={styles.seccion}>
          <Etiqueta texto={es.plantilla.puntosDeCadaRonda} />
          <Segmented<ModoPuntos>
            opciones={[
              { valor: 'suma', etiqueta: es.plantilla.seSuman, icono: iconos.mas },
              { valor: 'resta', etiqueta: es.plantilla.seRestan, icono: iconos.menos },
            ]}
            seleccionado={armado.modoPuntos}
            onCambiar={(modo) => {
              Keyboard.dismiss();
              armado.cambiarModoPuntos(modo);
            }}
          />
        </View>
      )}

      {/* Cambio 92: si la plantilla tiene objetivo, viene de ahi y se cambia para esta
          partida. En la Simple (cambio 121) ademas se pone o se saca. */}
      {(armado.objetivo !== null || armado.modoPuntos !== null) && (
        <View style={styles.seccion}>
          <Etiqueta texto={es.nuevaPartida.objetivo} />
          {armado.modoPuntos !== null && (
            <Segmented<'sin' | 'con'>
              opciones={[
                { valor: 'sin', etiqueta: es.plantilla.sinObjetivo },
                { valor: 'con', etiqueta: es.plantilla.conObjetivo },
              ]}
              seleccionado={armado.objetivo === null ? 'sin' : 'con'}
              onCambiar={(opcion) => {
                Keyboard.dismiss();
                armado.cambiarObjetivo(opcion === 'con' ? OBJETIVO_POR_DEFECTO : null);
              }}
            />
          )}
          {armado.objetivo !== null && (
            <>
              <Stepper
                valor={armado.objetivo}
                onCambiar={armado.cambiarObjetivo}
                etiquetaRestar={es.comun.restar}
                etiquetaSumar={es.comun.sumar}
                paso={PASO_OBJETIVO}
                minimo={1}
                maximo={MAXIMO_OBJETIVO}
                formato={es.comun.puntosSinSigno}
                escribible
                etiquetaEscribir={es.comun.escribirObjetivo}
              />
              <Text style={styles.ayuda}>{es.nuevaPartida.ayudaObjetivo}</Text>
            </>
          )}
        </View>
      )}

      <View style={styles.seccion} onLayout={(e) => (posiciones.current.jugadores = e.nativeEvent.layout.y)}>
        <Etiqueta texto={es.nuevaPartida.participantes} />
        {mensajeDeJugadores !== undefined && <Text style={styles.falta}>{mensajeDeJugadores}</Text>}
        {maximoDeJugadores(armado.plantillaId) === EQUIPOS_DEL_TRUCO && (
          <Text style={styles.ayuda}>{es.nuevaPartida.dosEquipos}</Text>
        )}
        <Grilla>
          {[
            ...armado.jugadores.map((jugador) => (
              <Pressable
                key={jugador.id}
                accessibilityRole="button"
                accessibilityLabel={`${es.participante.editarTitulo}: ${jugador.nombre}`}
                onPress={() => abrirJugador(jugador)}
                style={({ pressed }) => [styles.jugador, pressed && styles.presionado]}
              >
                <Avatar
                  tipo={jugador.avatarTipo}
                  valor={jugador.avatarValor}
                  nombre={jugador.nombre}
                  tamano={LADO_AVATAR}
                />
                <Text style={styles.nombreJugador} numberOfLines={1}>
                  {jugador.nombre}
                </Text>
              </Pressable>
            )),
            // RF-605: con ocho, el «agregar» desaparece.
            ...(armado.hayLugar
              ? [
                  <Pressable
                    key="agregar"
                    accessibilityRole="button"
                    accessibilityLabel={es.participante.agregarTitulo}
                    onPress={() => abrirJugador('nuevo')}
                    style={({ pressed }) => [styles.jugador, pressed && styles.presionado]}
                  >
                    <View style={[styles.agregar, falta('pocos') && styles.agregarDestacado]}>
                      <Text style={styles.agregarGlifo}>{iconos.mas}</Text>
                    </View>
                    <Text style={styles.agregarTexto}>{es.nuevaPartida.agregar}</Text>
                  </Pressable>,
                ]
              : []),
          ]}
        </Grilla>
      </View>

      {/* Va adentro del sheet y no al lado: en iOS un Modal solo se puede abrir
          encima de otro si esta anidado en él (como en SheetDeRonda). */}
      <PopupParticipante
        visible={jugadorEnEdicion !== null}
        onCerrar={() => setJugadorEnEdicion(null)}
        participante={editado}
        nombresOcupados={nombresOcupados}
        onConfirmar={(datos) =>
          editado === undefined ? armado.agregarJugador(datos) : armado.editarJugador(editado.id, datos)
        }
        onEliminar={
          editado === undefined
            ? undefined
            : () => {
                armado.sacarJugador(editado.id);
                setJugadorEnEdicion(null);
              }
        }
      />
    </BottomSheet>
  );
}

/** Lo que lee el lector de pantalla al tocar EMPEZAR sin tener todo. */
function mensajesDe(faltantes: Faltante[], jugadores: number, maximo: number): string[] {
  return faltantes.map((faltante) => {
    if (faltante === 'nombre') return es.nuevaPartida.faltaNombre;
    if (faltante === 'plantilla') return es.nuevaPartida.faltaTipo;
    if (faltante === 'pocos') return es.nuevaPartida.faltanJugadores(MINIMO_JUGADORES - jugadores);
    return es.nuevaPartida.sobranJugadores(maximo);
  });
}

/** De a dos por fila (RF-601). Si queda uno solo en la última, ocupa media fila. */
function Grilla({ children }: { children: ReactNode[] }) {
  const styles = useEstilos();
  const filas: ReactNode[][] = [];
  for (let i = 0; i < children.length; i += 2) filas.push(children.slice(i, i + 2));

  return (
    <View style={styles.grilla}>
      {filas.map((fila, i) => (
        <View key={i} style={styles.fila}>
          {fila.map((celda, j) => (
            <View key={j} style={styles.celda}>
              {celda}
            </View>
          ))}
          {fila.length === 1 && <View style={styles.celda} />}
        </View>
      ))}
    </View>
  );
}

const useEstilos = crearEstilos((colores) => ({
  seccion: { gap: espacios.xs },
  pie: { gap: espacios.xs },
  error: { ...tipografia.secundario, color: colores.tinta, textAlign: 'center' },
  ayuda: { ...tipografia.secundario, color: colores.grisMedio },
  // Monocromo, como el error de CampoTexto: en tinta y no en rojo.
  falta: { ...tipografia.chico, color: colores.tinta },
  grilla: { gap: espacios.sm },
  fila: { flexDirection: 'row', gap: espacios.sm },
  celda: { flex: 1 },
  plantilla: { alignItems: 'center', justifyContent: 'center', gap: espacios.xs, minHeight: 112 },
  glifo: { fontSize: 26, color: colores.tinta },
  nombrePlantilla: { ...tipografia.cuerpoFuerte, color: colores.tinta, textAlign: 'center' },
  jugador: { alignItems: 'center', gap: espacios.xxs, paddingVertical: espacios.xxs },
  presionado: { opacity: 0.6 },
  nombreJugador: { ...tipografia.secundario, color: colores.grisOscuro },
  agregar: {
    width: LADO_AVATAR,
    height: LADO_AVATAR,
    borderRadius: LADO_AVATAR / 2,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colores.linea,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agregarDestacado: { borderColor: colores.tinta, borderWidth: 2 },
  agregarGlifo: { fontSize: 24, color: colores.grisMedio },
  agregarTexto: { ...tipografia.secundario, color: colores.grisMedio },
}));
