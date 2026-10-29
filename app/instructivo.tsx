import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  type ScrollViewInstance,
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Boton } from '@/components/Boton';
import { ILUSTRACIONES } from '@/components/IlustracionesInstructivo';
import { es } from '@/i18n/es';
import * as ajustes from '@/repositories/ajustes';
import { crearEstilos } from '@/theme/tema';
import { AREA_TOCABLE_MINIMA, espacios, tipografia } from '@/theme/tokens';

/**
 * Instructivo (cambio 96): paginas que se pasan deslizando o con SIGUIENTE,
 * cada una con una mini-vista de la app arriba (cambio 97). El
 * Home lo abre solo la primera vez, y Configuracion cuando se lo pide. Saltearlo
 * o terminarlo lo marca como visto y vuelve a donde estaba.
 */
export default function Instructivo() {
  const styles = useEstilos();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const scroll = useRef<ScrollViewInstance>(null);
  const [actual, setActual] = useState(0);
  const paginas = es.instructivo.paginas;
  const esLaUltima = actual === paginas.length - 1;

  const cerrar = () => {
    // Si no se pudo guardar, la proxima vez se vuelve a mostrar: no vale trabar la salida.
    void ajustes.marcarInstructivoVisto().catch(() => undefined);
    router.back();
  };

  const alDeslizar = (evento: NativeSyntheticEvent<NativeScrollEvent>) => {
    const pagina = Math.round(evento.nativeEvent.contentOffset.x / width);
    if (pagina !== actual && pagina >= 0 && pagina < paginas.length) setActual(pagina);
  };

  const siguiente = () => {
    if (esLaUltima) {
      cerrar();
      return;
    }
    scroll.current?.scrollTo({ x: (actual + 1) * width, animated: true });
    setActual(actual + 1);
  };

  return (
    <SafeAreaView style={styles.pantalla}>
      <View style={styles.arriba}>
        {!esLaUltima && (
          <Pressable accessibilityRole="button" onPress={cerrar} style={styles.saltear} hitSlop={8}>
            <Text style={styles.textoSaltear}>{es.instructivo.saltear}</Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        ref={scroll}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={alDeslizar}
        scrollEventThrottle={16}
        style={styles.paginas}
      >
        {paginas.map((pagina, i) => {
          const Ilustracion = ILUSTRACIONES[i];
          return (
            <View
              key={pagina.titulo}
              accessible
              accessibilityLabel={`${es.instructivo.pagina(i + 1, paginas.length)}. ${pagina.titulo}. ${pagina.texto}`}
              style={[styles.pagina, { width }]}
            >
              {Ilustracion !== undefined && <Ilustracion />}
              <View style={styles.textos}>
                <Text style={styles.titulo}>{pagina.titulo}</Text>
                <Text style={styles.texto}>{pagina.texto}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.abajo}>
        <View style={styles.puntos} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {paginas.map((pagina, i) => (
            <View key={pagina.titulo} style={[styles.punto, i === actual && styles.puntoActual]} />
          ))}
        </View>
        <Boton titulo={esLaUltima ? es.instructivo.empezar : es.instructivo.siguiente} onPress={siguiente} />
      </View>
    </SafeAreaView>
  );
}

const useEstilos = crearEstilos((colores) => ({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  arriba: {
    minHeight: AREA_TOCABLE_MINIMA,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: espacios.xl,
  },
  saltear: { minHeight: AREA_TOCABLE_MINIMA, justifyContent: 'center' },
  textoSaltear: { ...tipografia.cuerpoFuerte, color: colores.grisOscuro },
  paginas: { flex: 1 },
  pagina: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: espacios.xxl, paddingHorizontal: espacios.xl },
  textos: { alignItems: 'center', gap: espacios.sm },
  titulo: { ...tipografia.titulo, color: colores.tinta, textAlign: 'center' },
  texto: { ...tipografia.cuerpo, color: colores.grisOscuro, textAlign: 'center', maxWidth: 360 },
  abajo: { gap: espacios.lg, paddingHorizontal: espacios.xl, paddingBottom: espacios.md },
  puntos: { flexDirection: 'row', justifyContent: 'center', gap: espacios.xs },
  punto: { width: 8, height: 8, borderRadius: 4, backgroundColor: colores.linea },
  puntoActual: { width: 20, backgroundColor: colores.acento },
}));
