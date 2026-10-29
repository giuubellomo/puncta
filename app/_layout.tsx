import {
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque';
import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { esBaseAbiertaEnOtraPestana } from '@/db/client';
import { sembrar } from '@/db/seed';
import { es } from '@/i18n/es';
import { crearEstilos, leerTemaGuardado, ProveedorDeTema, useTema } from '@/theme/tema';
import { TEMA_POR_DEFECTO, type IdTema } from '@/theme/temas';
import { espacios, fuentes, tipografia } from '@/theme/tokens';

/**
 * El Home queda siempre debajo en la pila, aunque se entre directo a otra ruta.
 * En web pasa al recargar una pantalla interna: sin esto no habria a donde
 * volver, y con la app agregada a inicio no hay boton atras del navegador
 * (fase 10, cambio 87).
 */
export const unstable_settings = { anchor: 'index' };


/**
 * Antes de montar cualquier pantalla se siembran las plantillas predefinidas
 * (paso 2.4). Asi ninguna pantalla lee la base antes de que esten. Tambien se
 * lee el tema elegido (cambio 113): la app arranca ya con el. Y se cargan las
 * fuentes: sin ellas, el primer dibujo saldria con la del sistema.
 */
export default function RootLayout() {
  const [tema, setTema] = useState<IdTema | null>(null);
  const [error, setError] = useState<unknown>(null);
  // Si una fuente no carga, la app sigue con la del sistema: no vale la pena trabarla.
  const [fuentesCargadas, errorDeFuentes] = useFonts({
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });
  const fuentesListas = fuentesCargadas || errorDeFuentes !== null;

  useEffect(() => {
    sembrar()
      .then(leerTemaGuardado)
      .then(setTema)
      .catch((e: unknown) => setError(e ?? 'Error'));
  }, []);

  if (!fuentesListas) return null;

  // En web, la app ya abierta en otra pestaña: un aviso para la usuaria, no un error.
  if (error !== null && esBaseAbiertaEnOtraPestana(error)) {
    return (
      <ProveedorDeTema inicial={TEMA_POR_DEFECTO}>
        <PantallaError mensaje={es.comun.abiertaEnOtraPestana} />
      </ProveedorDeTema>
    );
  }
  // Diagnostico de desarrollo: si la semilla falla, la app no sirve y hay que verlo.
  if (error !== null) {
    return (
      <ProveedorDeTema inicial={TEMA_POR_DEFECTO}>
        <PantallaError mensaje={String(error)} />
      </ProveedorDeTema>
    );
  }

  // Es un instante: unas lecturas y, solo la primera vez, unas inserciones.
  if (tema === null) return null;

  return (
    <ProveedorDeTema inicial={tema}>
      <Navegacion />
    </ProveedorDeTema>
  );
}

/**
 * Sin bienvenida desde el paso 9.1 (cambio 82): la app abre directo en el Home.
 * La primera vez, el Home abre encima el instructivo (cambio 96).
 */
function Navegacion() {
  const { colores, modo } = useTema();
  return (
    <>
      {/* La barra de arriba del telefono, legible sobre el fondo del tema (cambio 113). */}
      <StatusBar style={modo === 'oscuro' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colores.fondo },
          headerTintColor: colores.tinta,
          headerTitleStyle: { color: colores.tinta, fontFamily: fuentes.display },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colores.fondo },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="plantillas/index" options={{ title: es.plantillas.titulo, headerBackTitle: es.comun.volver }} />
        {/* El editor dibuja su propio encabezado (mockup 3) y confirma antes de salir
            con cambios sin guardar: sin gesto de arrastrar, la ‹ es la unica salida. */}
        <Stack.Screen name="plantillas/[id]" options={{ headerShown: false, gestureEnabled: false }} />
        {/* La partida dibuja su propio encabezado (mockup 4). */}
        <Stack.Screen name="partida/[id]/index" options={{ headerShown: false }} />
        {/* El podio (8.2): se llega con replace desde la partida, asi que atras es el Home. */}
        <Stack.Screen name="partida/[id]/final" options={{ headerShown: false }} />
        <Stack.Screen name="config/index" options={{ title: es.home.configuracion, headerBackTitle: es.comun.volver }} />
        {/* Sin gesto de arrastrar: se sale con SALTEAR o EMPEZAR, que lo marcan como visto. */}
        <Stack.Screen
          name="instructivo"
          options={{ headerShown: false, presentation: 'fullScreenModal', gestureEnabled: false }}
        />
      </Stack>
    </>
  );
}

function PantallaError({ mensaje }: { mensaje: string }) {
  const styles = useEstilos();
  return (
    <View style={styles.error}>
      <Text style={styles.mensaje}>{mensaje}</Text>
    </View>
  );
}

const useEstilos = crearEstilos((colores) => ({
  error: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: espacios.xl, backgroundColor: colores.fondo },
  mensaje: { ...tipografia.cuerpo, color: colores.tinta, textAlign: 'center' },
}));
