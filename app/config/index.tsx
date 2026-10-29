import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/Card';
import { Etiqueta } from '@/components/Etiqueta';
import { es } from '@/i18n/es';
import { iconos } from '@/theme/iconos';
import { crearEstilos, useTema } from '@/theme/tema';
import { TEMAS, type DefinicionDeTema } from '@/theme/temas';
import { BORDE, espacios, radios, SOMBRA, tipografia } from '@/theme/tokens';

/**
 * Configuracion (paso 9.1, cambio 82). «Cómo se usa», que abre el instructivo
 * (cambio 96); el tema (cambio 113), que cambia en vivo; y la version y DeBello
 * abajo.
 */
export default function PantallaDeConfiguracion() {
  const styles = useEstilos();
  const router = useRouter();
  const { tema, cambiarTema } = useTema();
  const version = Constants.expoConfig?.version;

  return (
    <SafeAreaView edges={['bottom']} style={styles.pantalla}>
      <ScrollView contentContainerStyle={styles.contenido}>
        <Card onPress={() => router.push('/instructivo')} etiqueta={es.config.comoSeUsa} style={styles.opcion}>
          <Text style={styles.textoOpcion}>{es.config.comoSeUsa}</Text>
          <Text style={styles.flecha}>{iconos.adelante}</Text>
        </Card>

        <View style={styles.grupo}>
          <Etiqueta texto={es.config.tema} />
          <View accessibilityRole="radiogroup" style={styles.temas}>
            {TEMAS.map((otro) => (
              <TarjetaDeTema key={otro.id} tema={otro} elegido={otro.id === tema} onPress={() => cambiarTema(otro.id)} />
            ))}
          </View>
        </View>

        <View style={styles.pie}>
          {version !== undefined && <Text style={styles.version}>{es.config.version(version)}</Text>}
          <Text style={styles.empresa}>{es.config.empresa}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Un tema pintado con sus propios colores, no con los del activo: el fondo de
 * marca y su boton principal, como en la lamina «Paleta».
 */
function TarjetaDeTema({ tema, elegido, onPress }: { tema: DefinicionDeTema; elegido: boolean; onPress: () => void }) {
  const styles = useEstilos();
  const c = tema.colores;
  const nombre = es.config.temas[tema.id];
  // Como en la lamina: sobre el violeta, «Nuevo juego» va en sol; en Noche y Chicle, en su acento.
  const conSol = tema.id === 'electrico';
  const boton = conSol ? { fondo: c.destacado, texto: c.sobreDestacado } : { fondo: c.acento, texto: c.sobreAcento };

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={nombre}
      accessibilityState={{ checked: elegido }}
      onPress={onPress}
      style={({ pressed }) => [styles.conSombra, pressed && styles.presionada]}
    >
      <View style={styles.sombra} />
      <View style={[styles.tarjetaTema, { backgroundColor: c.marca }]}>
        <View style={styles.filaTema}>
          <Text style={[styles.nombreTema, { color: c.sobreMarca }]}>{nombre}</Text>
          <View style={[styles.radio, { borderColor: c.sobreMarca }]}>
            {elegido && <View style={[styles.radioPunto, { backgroundColor: c.sobreMarca }]} />}
          </View>
        </View>
        <View style={[styles.muestraBoton, { backgroundColor: boton.fondo }]}>
          <Text style={[styles.textoMuestra, { color: boton.texto }]}>{es.home.nuevoJuego}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const useEstilos = crearEstilos((colores) => ({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  contenido: { padding: espacios.xl, gap: espacios.xl },
  opcion: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  textoOpcion: { ...tipografia.tituloChico, color: colores.tinta },
  flecha: { ...tipografia.subtitulo, color: colores.tinta },
  grupo: { gap: espacios.sm },
  temas: { gap: espacios.md },
  conSombra: { paddingBottom: SOMBRA },
  sombra: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: SOMBRA,
    bottom: 0,
    borderRadius: radios.lg,
    backgroundColor: colores.borde,
  },
  tarjetaTema: {
    borderRadius: radios.lg,
    borderWidth: BORDE,
    borderColor: colores.borde,
    padding: espacios.md,
    gap: espacios.sm,
  },
  presionada: { opacity: 0.85 },
  filaTema: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nombreTema: { ...tipografia.subtitulo },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  radioPunto: { width: 10, height: 10, borderRadius: 5 },
  muestraBoton: { minHeight: 40, borderRadius: radios.pastilla, alignItems: 'center', justifyContent: 'center' },
  textoMuestra: { ...tipografia.boton, fontSize: 15 },
  pie: { alignItems: 'center', gap: espacios.xxs, paddingTop: espacios.lg },
  version: { ...tipografia.chico, color: colores.grisOscuro },
  empresa: { ...tipografia.tituloChico, color: colores.tinta },
}));
