/**
 * Todos los textos de interfaz, en español rioplatense (D-4). Paso 3.3.
 *
 * Ningun texto visible se escribe suelto en un componente o una pantalla: sale de
 * aca. Tampoco los que solo oye el lector de pantalla (`etiqueta` de los botones de
 * icono). Los que llevan un dato son funciones.
 *
 * Organizado por pantalla, como el mockup (`docs/mockup/`). Lo que todavia no
 * existe se suma cuando se construye cada pantalla.
 *
 * No van aca los datos que la usuaria carga o que vienen de la semilla (nombres de
 * plantillas, titulos de reglas, objetivos): esos viven en la base.
 */

/** «−20», «+100», «0». El menos es el signo tipografico (U+2212), no el guion. */
export function conSigno(n: number): string {
  if (n > 0) return `+${n}`;
  if (n < 0) return `−${Math.abs(n)}`;
  return '0';
}

export const es = {
  comun: {
    cancelar: 'Cancelar',
    guardar: 'Guardar',
    agregar: 'Agregar',
    eliminar: 'Eliminar',
    terminar: 'Terminar',
    // Solo para el lector de pantalla
    cerrar: 'Cerrar',
    volver: 'Volver',
    sumar: 'Sumar',
    restar: 'Restar',
    puntos: (n: number) => `${conSigno(n)} pts`,
    /** Un puntaje sin signo: el objetivo, «500 pts». */
    puntosSinSigno: (n: number) => `${n} pts`,
    // Solo para el lector de pantalla
    escribirObjetivo: 'Escribir el objetivo',
    errorGuardar: 'No se pudo guardar. Probá de nuevo.',
    /** Web (cambio 87): la base solo se abre en una pestaña a la vez. */
    abiertaEnOtraPestana: 'Puncta ya está abierta en otra pestaña. Cerrala y recargá esta.',
  },

  home: {
    // El nombre de la app: BELIA hasta el cambio 111, de Bellomo + Pardo
    /** El logo va en minuscula, como en la lamina «Identidad y nombre» (cambio 113). */
    titulo: 'puncta',
    subtitulo: 'Para anotar partidas con amigos.',
    // La tarjeta de la partida abierta, como la lamina (cambio 118)
    seguir: (nombre: string) => `Seguir: ${nombre}`,
    /** «Ronda 4 de 7»; con rondas ilimitadas, «Ronda 4». */
    rondaDe: (ronda: number, total: number | null) => (total === null ? `Ronda ${ronda}` : `Ronda ${ronda} de ${total}`),
    nuevoJuego: 'Nuevo juego',
    configuracion: 'Configuración',
    /** El mockup dice «Agregar plantilla»; el icono abre la lista (ver registro, cambio 51). */
    plantillas: 'Plantillas',
    // A-5: confirmacion al tocar «Nuevo juego» con una partida abierta
    terminarAnterior: (nombre: string) => `Terminá "${nombre}" para empezar una nueva`,
  },

  nuevaPartida: {
    titulo: 'Nueva partida',
    tipoDeJuego: 'Tipo de juego',
    participantes: 'Participantes',
    agregar: 'Agregar',
    empezar: 'Empezar',
    // El nombre se escribe al armar y es obligatorio (registro, cambio 71)
    nombre: 'Nombre de la partida',
    nombreEjemplo: 'Ej: Viernes de juegos',
    // Solo si la plantilla tiene objetivo: viene de ahi y se puede cambiar (cambio 92)
    objetivo: 'Objetivo',
    ayudaObjetivo: 'La partida termina cuando alguien llega a este puntaje.',
    // Cambio 94: los participantes del Truco son los dos equipos
    dosEquipos: 'El Truco se juega entre dos equipos: cargá uno por participante.',
    // Cambio 95: lo que falta, al tocar EMPEZAR sin tener todo
    faltaNombre: 'Escribí un nombre para la partida',
    faltaTipo: 'Elegí un tipo de juego',
    faltanJugadores: (faltan: number) => (faltan === 1 ? 'Agregá 1 participante más' : `Agregá al menos ${faltan} participantes`),
    /** Con más de los que admite la plantilla: el Truco (2) o la Canasta (6). */
    sobranJugadores: (maximo: number) =>
      maximo === 2 ? 'Dejá solo dos: uno por equipo' : `Este juego admite hasta ${maximo} participantes`,
  },

  participante: {
    agregarTitulo: 'Agregar participante',
    /** El mismo popup, con los datos cargados: al tocar un jugador del armado (6.1). */
    editarTitulo: 'Editar participante',
    nombre: 'Nombre',
    nombreEjemplo: 'Ej: Sol',
    personajeOColor: 'Personaje o color',
    // RF-202: validaciones del alta
    errorNombre: {
      vacio: 'Poné un nombre',
      largo: 'Máximo 20 caracteres',
      repetido: 'Ya hay un participante con ese nombre',
    },
    // Lector de pantalla, en el selector de avatar
    /** Sin el nombre del personaje: no se muestra en ninguna parte (cambio 115). */
    personajeNumero: (n: number) => `Personaje ${n}`,
    colorNumero: (n: number) => `Color ${n}`,
  },

  /** La lista (paso 5.1). El editor de una plantilla es `plantilla`, mas abajo. */
  plantillas: {
    titulo: 'Plantillas',
    predefinida: 'Predefinida',
    /** «3 reglas · 7 rondas», «2 reglas · rondas libres» */
    resumen: (reglas: number, rondas: number | null) => {
      const cuantasReglas = reglas === 1 ? '1 regla' : `${reglas} reglas`;
      const cuantasRondas = rondas === null ? 'rondas libres' : rondas === 1 ? '1 ronda' : `${rondas} rondas`;
      return `${cuantasReglas} · ${cuantasRondas}`;
    },
    duplicar: 'Duplicar',
    borrar: 'Borrar',
    /** RF-304. El numero aparece recien en la segunda copia: «Carioca (copia 2)». */
    nombreCopia: (nombre: string, numero: number) =>
      numero === 1 ? `${nombre} (copia)` : `${nombre} (copia ${numero})`,
    // RF-305 + RNF-6
    confirmarBorrarTitulo: '¿Borrar la plantilla?',
    confirmarBorrarTexto: (nombre: string) =>
      `Se borra «${nombre}». Las partidas que ya jugaste con ella no cambian.`,
  },

  plantilla: {
    nueva: 'Nueva plantilla',
    editar: 'Editar plantilla',
    nombreEIcono: 'Nombre e ícono',
    nombreEjemplo: 'Ej: Carioca',
    /** Lector de pantalla, en el selector de icono. `clave` es la del ícono: «cartas». */
    icono: (clave: string) => `Ícono ${clave}`,
    /** Lector de pantalla, en el icono elegido que despliega los demás (cambio 98). */
    cambiarIcono: (clave: string) => `Ícono ${clave}. Tocá para cambiarlo`,
    puntosDeCadaRonda: 'Los puntos de cada ronda',
    seSuman: 'Se suman',
    seRestan: 'Se restan',
    gana: 'Gana',
    menosPuntos: 'Menos puntos',
    masPuntos: 'Más puntos',
    /**
     * Lo que queda configurado, en una linea. Las uniones son las del dominio
     * (`ModoPuntos`, `CriterioVictoria`); este archivo no importa nada.
     */
    // Cambio 92: la partida termina cuando alguien llega al objetivo
    objetivo: 'Objetivo',
    sinObjetivo: 'Sin objetivo',
    conObjetivo: 'Hasta un puntaje',
    ayudaObjetivo: (criterio: 'menor' | 'mayor') =>
      `La partida termina cuando alguien llega a este puntaje, y gana quien tenga ${criterio === 'menor' ? 'menos' : 'más'}. ` +
      'Se puede cambiar al armar la partida.',
    ayudaPuntos: (modo: 'suma' | 'resta', criterio: 'menor' | 'mayor') =>
      `Los puntos de cada ronda ${modo === 'suma' ? 'se suman al' : 'se restan del'} total y gana ` +
      `quien termina con ${criterio === 'menor' ? 'menos' : 'más'}. Cada regla puede sumar o restar por separado.`,
    // Al volver con cambios sin guardar (el editor guarda recien al tocar GUARDAR)
    salirTitulo: '¿Salir sin guardar?',
    salirTexto: 'Los cambios que hiciste se pierden.',
    salir: 'Salir',
    reglas: (n: number) => `Reglas · ${n}`,
    agregarRegla: 'Agregar regla',
    rondas: (n: number) => `Rondas · ${n}`,
    ayudaRondas:
      'Las reglas se aplican en cada ronda. Tocá una ronda para cambiar el objetivo o el puntaje de una regla.',
    // Sin rondas definidas la plantilla es de rondas libres (registro, cambio 56)
    ayudaSinRondas: 'Sin rondas definidas se juegan las que quieran, y cada regla vale siempre lo mismo.',
    agregarRonda: 'Agregar ronda',
    guardar: 'Guardar plantilla',
    // Una predefinida se abre para verla; guardar crea una copia (registro, cambio 64)
    verPredefinida: 'Plantilla predefinida',
    ayudaPredefinida: 'Esta plantilla no se modifica. Si cambiás algo, al guardar se crea una copia con tus cambios.',
    guardarCopia: 'Guardar como copia',
  },

  regla: {
    editar: 'Editar regla',
    nueva: 'Nueva regla',
    /** RNF-6, cambio 83. */
    confirmarEliminar: (titulo: string) => `¿Eliminar «${titulo}»?`,
    titulo: 'Título',
    descripcion: 'Descripción (opcional)',
    puntaje: 'Puntaje',
    suma: 'Suma',
    resta: 'Resta',
    cuandoSeAplica: '¿Cuándo se aplica?',
    enTodasLasRondas: 'En todas las rondas',
    enTodasLasRondasAyuda: 'Se pide cargarla en cada ronda',
    opcional: 'Opcional',
    opcionalAyuda: 'Se marca solo si pasó en esa ronda',
    // RF-406. No está en el mockup: decisión de la usuaria (ver registro, cambio 57).
    quienLaRecibe: '¿Quién la recibe?',
    unaPersona: 'Una sola persona',
    varias: 'Varias',
    quienLaRecibeAyuda:
      'Con «una sola persona», marcársela a alguien se la saca a quien la tenía en esa ronda.',
    // Lector de pantalla, en las flechas que ordenan la lista
    subir: 'Subir',
    bajar: 'Bajar',
    // «¿Cuándo se aplica?» de una regla que es solo de una ronda (paso 5.4)
    obligatoria: 'Obligatoria',
    obligatoriaAyuda: 'Hay que marcársela a alguien para cerrar la ronda',
    guardar: 'Guardar regla',
    // RF-404
    errorTituloVacio: 'Poné un título',
    errorPuntajeCero: 'El puntaje no puede ser cero',
  },

  ronda: {
    titulo: (n: number) => `Ronda ${n}`,
    objetivo: 'Objetivo de la ronda',
    objetivoEjemplo: 'Ej: 2 piernas',
    sinObjetivo: 'Sin objetivo',
    puntajeDeLasReglas: 'Puntaje de las reglas en esta ronda',
    reglaSoloParaEstaRonda: 'Regla solo para esta ronda',
    soloEnEstaRonda: 'Solo en esta ronda',
    /** «ajustado (base −20)»: al lado del alcance, cuando la ronda pisa el puntaje. */
    ajustado: (base: number) => `ajustado (base ${conSigno(base)})`,
    /**
     * Ayuda al pie del sheet de edicion de ronda (RF-503). El mockup nombra un solo
     * puntaje base; con varias reglas, cada una muestra el suyo en su fila.
     */
    ayudaAjuste: (n: number) =>
      `El puntaje que cambies acá vale solo para la Ronda ${n}. En las demás sigue el de la plantilla.`,
    guardar: 'Guardar ronda',
    /** RNF-6, cambio 83. */
    confirmarEliminar: (n: number) => `¿Eliminar la Ronda ${n}?`,
  },

  partida: {
    completada: 'Completada',
    enJuego: 'en juego',
    objetivo: (texto: string) => `Objetivo: ${texto}`,
    bloqueada: (anterior: number) => `Se habilita al terminar la Ronda ${anterior}`,
    siguiente: 'Siguiente',
    terminarPartida: 'Terminar partida',
    /** Arriba de la ronda, una por pantalla (cambio 100): «Ronda 3 de 7». */
    rondaDeTotal: (ronda: number, total: number) => `Ronda ${ronda} de ${total}`,
    // Solo para el lector de pantalla: las flechas de al lado
    rondaAnterior: 'Ronda anterior',
    rondaSiguiente: 'Ronda siguiente',
    /** Debajo del nombre, si la partida tiene objetivo (cambio 92). */
    hasta: (puntos: number) => `Hasta ${puntos} pts`,
    /** «Bajó primero: −20 pts»: lo que vale una regla en esa ronda. */
    reglaConPuntaje: (titulo: string, puntos: number) => `${titulo}: ${conSigno(puntos)} pts`,
    /** Resumen de una ronda cerrada sin objetivo ni reglas: «Mejor puntaje: Ana (+30)». */
    mejorPuntaje: (nombres: string[], puntos: number) => `Mejor puntaje: ${nombres.join(' y ')} (${conSigno(puntos)})`,
    sinCargar: 'Sin cargar',
    /** Lo que lee el lector de pantalla en la fila de un participante: «Ana: −20, total −50». */
    puntajeDe: (nombre: string, puntaje: string, total: string) => `${nombre}: ${puntaje}, total ${total}`,
    // RF-706: por que no se puede cerrar la ronda. Los puntajes que faltan no se avisan (cambio 79).
    faltanReglas: (reglas: string[]) => `Falta asignar: ${reglas.join(', ')}`,
  },

  carga: {
    puntajeDeLaRonda: 'Puntaje de la ronda',
    reglasDeLaRonda: 'Reglas de la ronda',
    guardar: 'Guardar',
    /** Debajo del nombre, en el popup: «Ronda 2 · 1 pierna + 1 escalera», o solo «Ronda 2». */
    subtitulo: (ronda: number, objetivo?: string) =>
      objetivo === undefined ? `Ronda ${ronda}` : `Ronda ${ronda} · ${objetivo}`,
    /** Una regla de asignacion unica que ya tiene otro: al guardar se le saca (cambio 76). */
    laTiene: (nombres: string[]) => `La tiene ${nombres.join(' y ')}`,
    /** Debajo del stepper apagado, cuando se marca la «Cortó» de Carioca (cambio 79). */
    cortoSinPuntaje: 'El que corta no carga puntaje',
    // Solo para el lector de pantalla
    escribirPuntaje: 'Escribir el puntaje',
    // El aviso al guardar el puntaje con el que alguien llega al objetivo (cambio 92)
    llegoAlObjetivo: (nombres: string[], puntos: number) =>
      `${nombres.join(' y ')} ${nombres.length > 1 ? 'llegaron' : 'llegó'} a ${puntos} pts`,
    terminarOSeguir: '¿Terminás la partida? Si fue un error de carga, seguí y corregilo.',
    seguir: 'Seguir',
  },

  /** La calculadora de la Canasta (cambio 101) */
  canasta: {
    limpias: 'Canastas limpias',
    sucias: 'Canastas sucias',
    treses: 'Treses rojos',
    negros: 'Treses negros',
    // Cambio 102: sin canastas, los treses rojos restan
    tresesRestan: 'Sin canastas, los treses rojos restan',
    cierre: 'Cierre',
    noCerro: 'No',
    cerro: 'Sí',
    bajadas: 'Cartas bajadas',
    enMano: 'Cartas en la mano',
    totalDeLaMano: 'Total de la mano',
    /** El cierre lo tenía otro: al guardar se le saca, como una regla única. */
    cerroOtro: (nombres: string[]) => `Cerró ${nombres.join(' y ')}: al guardar se le saca`,
    /** Debajo del nombre, en la ronda en juego: lo mínimo para la primera bajada. */
    bajaCon: (minimo: number) => `Baja con ${minimo}`,
    // Solo para el lector de pantalla
    escribirBajadas: 'Escribir los puntos de las cartas bajadas',
    escribirEnMano: 'Escribir los puntos de las cartas en la mano',
  },

  /** El tablero del Truco (cambio 93): de a palitos, en malas y buenas. */
  truco: {
    // Solo para el lector de pantalla. En pantalla, malas y buenas las separa una linea (cambio 94)
    sumar: (puntos: number, nombre: string) => `Sumar ${puntos} a ${nombre}`,
    restar: (nombre: string) => `Restar 1 a ${nombre}`,
    columna: (nombre: string, total: number, malas: number, buenas: number) =>
      `${nombre}: ${total} pts, ${malas} malas y ${buenas} buenas`,
  },

  /**
   * El instructivo (cambio 96): se abre solo la primera vez y desde Configuracion.
   * Cada pagina lleva un glifo de `theme/iconos`, que elige la pantalla.
   */
  instructivo: {
    // Cambio 97: con mas animo, y cada pagina con su mini-vista (IlustracionesInstructivo)
    paginas: [
      {
        titulo: '¡Chau papel y lápiz!',
        texto: 'Puncta lleva la cuenta por vos: suma, resta y te muestra quién va ganando. Vos preocupate por jugar.',
      },
      {
        titulo: 'Armá la partida en un toque',
        texto: 'Tocá «Nuevo juego», ponele nombre, elegí a qué juegan y sumá a todos los de la mesa. ¡Listo!',
      },
      {
        titulo: 'Anotá sin hacer cuentas',
        texto:
          'Tocá a cada jugador para cargar sus puntos. La ronda se ordena sola: el que va ganando, siempre arriba.',
      },
      {
        titulo: 'Jugá con las reglas de tu casa',
        texto: 'En «Plantillas» inventás tus juegos: reglas, rondas y hasta el puntaje para ganar. ¿Cómo lo juegan ustedes?',
      },
    ],
    /** Los datos de ejemplo de las mini-vistas: no estan en la base. */
    ejemplo: {
      partida: 'Viernes de cartas',
      jugadores: ['Caro', 'Juan', 'Sofi'],
      plantillas: [
        { nombre: 'Carioca', icono: 'cartas' },
        { nombre: 'Simple', icono: 'numeral' },
        { nombre: 'Truco', icono: 'palitos' },
      ],
      reglas: [
        { titulo: 'Bajó primero', puntos: -10 },
        { titulo: 'Cortó', puntos: -10 },
      ],
      objetivo: 500,
    },
    saltear: 'Saltear',
    siguiente: 'Siguiente',
    empezar: '¡A jugar!',
    // Solo para el lector de pantalla: «Página 2 de 4»
    pagina: (actual: number, total: number) => `Página ${actual} de ${total}`,
  },

  /** Configuracion (paso 9.1, cambio 82). El tema, desde el cambio 113. */
  config: {
    comoSeUsa: 'Cómo se usa',
    // Cambio 113: los tres temas reemplazan a las paletas y al modo
    tema: 'Tema',
    /** Los nombres de los temas, por su id (`theme/temas.ts`). */
    temas: {
      electrico: 'Eléctrico',
      noche: 'Noche',
      chicle: 'Chicle',
    },
    version: (version: string) => `Puncta · versión ${version}`,
    empresa: 'DeBello',
  },

  finalizar: {
    // RF-710: confirmacion
    confirmarTitulo: '¿Terminar la partida?',
    rondaIncompleta: 'La ronda en curso quedó incompleta.',
    // El titulo del podio (cambio 117): «¡Ganó Caro!», o los empatados en el 1º.
    gano: (nombres: string[]) =>
      nombres.length === 1
        ? `¡Ganó ${nombres[0]}!`
        : `¡Ganaron ${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}!`,
    revancha: 'Revancha',
    errorRevancha: 'No se pudo armar la revancha. Probá de nuevo.',
    // Solo para el lector de pantalla: «Puesto 1: Caro, −55 pts»
    puesto: (n: number) => `Puesto ${n}`,
    volverAlInicio: 'Volver al inicio',
  },
} as const;
