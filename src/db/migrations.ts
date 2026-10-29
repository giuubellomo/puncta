/**
 * Migraciones de la base (paso 2.2).
 *
 * La version aplicada vive en `PRAGMA user_version` de SQLite: es un entero que
 * viaja en el header del archivo, asi que no hace falta una tabla de control.
 *
 * Reglas:
 *   - una migracion ya publicada NO se edita: se agrega otra abajo con version +1
 *   - `version` arranca en 1 y va de a uno, sin huecos
 *   - cada migracion corre dentro de una transaccion junto con su `user_version`,
 *     asi que o se aplica entera o no se aplica
 */
import type { SQLiteDatabase } from 'expo-sqlite';

import { SCHEMA_SQL } from './schema.generated';

export interface Migracion {
  version: number;
  nombre: string;
  sql: string;
}

export const MIGRACIONES: Migracion[] = [
  { version: 1, nombre: 'esquema inicial', sql: SCHEMA_SQL },
  {
    // Paso 5.4 (ver registro): una regla puede existir en una sola ronda de la
    // plantilla. NULL = vale en todas. Es el numero de ronda y no una foreign key
    // a ronda_plantilla: `actualizar` recrea reglas y rondas enteras, y las
    // reglas se insertan antes que las rondas.
    version: 2,
    nombre: 'reglas de una sola ronda',
    sql: 'ALTER TABLE regla_plantilla ADD COLUMN solo_en_ronda INTEGER CHECK (solo_en_ronda >= 1);',
  },
  {
    // Cambio 89: las rondas 4 a 6 de Karioka estaban en otro orden. La semilla solo
    // inserta la primera vez, asi que la Karioka ya guardada se corrige aca. Los
    // puntajes van con el numero de ronda y no se tocan. Las copias son de la
    // usuaria y las partidas guardan su propio snapshot: no se tocan. En una base
    // nueva no hay filas todavia y no hace nada.
    version: 3,
    nombre: 'orden de las rondas de Karioka',
    sql: `UPDATE ronda_plantilla
      SET objetivo = CASE numero
        WHEN 4 THEN '2 piernas + 1 escalera'
        WHEN 5 THEN '1 pierna + 2 escaleras'
        WHEN 6 THEN '3 piernas'
      END
      WHERE plantilla_id = 'ef056daf-4cba-4370-81b9-0568005c3bcb' AND numero IN (4, 5, 6);`,
  },
  {
    // Cambio 90: la predefinida se llamaba «Karioka» y es «Carioca». Como en la 3,
    // se corrige solo la predefinida ya guardada: las copias y las partidas son de
    // la usuaria y conservan el nombre que tenian.
    version: 4,
    nombre: 'nombre de la Carioca',
    sql: `UPDATE plantilla SET nombre = 'Carioca' WHERE id = 'ef056daf-4cba-4370-81b9-0568005c3bcb';`,
  },
  {
    // Cambio 92: una plantilla puede jugarse hasta un puntaje. NULL = sin objetivo.
    version: 5,
    nombre: 'puntaje objetivo de la plantilla',
    sql: 'ALTER TABLE plantilla ADD COLUMN puntaje_objetivo INTEGER CHECK (puntaje_objetivo >= 1);',
  },
  {
    // Cambio 96: ajustes sueltos de la app, clave y valor. El primero es si ya se
    // vio el instructivo. Una base que ya tiene partidas no es de alguien nuevo:
    // se marca como visto (lo puede abrir igual desde Configuracion).
    version: 6,
    nombre: 'ajustes e instructivo',
    sql: `CREATE TABLE ajuste (clave TEXT PRIMARY KEY, valor TEXT NOT NULL);
      INSERT INTO ajuste (clave, valor) SELECT 'instructivo_visto', '1' WHERE EXISTS (SELECT 1 FROM partida);`,
  },
  {
    // Cambio 102: la Canasta predefinida suma la regla «Tres negro» y pasa el
    // Cierre adelante, como la calculadora. La semilla solo inserta la primera
    // vez: aca se corrige la que ya estaba guardada. En una base sin la Canasta
    // no hace nada, y despues la semilla la inserta ya con todo.
    version: 7,
    nombre: 'treses negros en la Canasta',
    sql: `INSERT INTO regla_plantilla
        (id, plantilla_id, titulo, descripcion, puntaje_base, alcance, asignacion_unica, orden, solo_en_ronda)
      SELECT 'fe4ea74f-29e8-4c87-bfe9-7528a9f4c732', id, 'Tres negro', NULL, -100, 'opcional', 0, 4, NULL
      FROM plantilla WHERE id = '03fac88a-ed58-47bb-95d8-0b758825d952';
      UPDATE regla_plantilla SET orden = CASE id
        WHEN '9c6153a6-d07f-489d-b670-84319c2e8d3e' THEN 0
        WHEN '3c6f8f41-86ee-4055-8c03-7e53a4008363' THEN 1
        WHEN '02934b9a-6818-4598-9018-a8f534c7cfb1' THEN 2
        WHEN '62a7359c-72c5-41ff-a84c-4a3c2fde4644' THEN 3
        WHEN 'f3c7e894-0378-4df4-b477-5499f1958931' THEN 5
        WHEN '2a5c33ce-66a5-4286-8ee5-7207a987bd61' THEN 6
        ELSE orden END
      WHERE plantilla_id = '03fac88a-ed58-47bb-95d8-0b758825d952';`,
  },
  {
    // Una primera version del cambio 116 se probo en el telefono con este numero
    // y pasaba los colores a personajes. Al final se quedan los colores y se van
    // los iconos (migracion 9): esta queda vacia, para que la 9 corra igual en
    // una base que ya paso por aquella y en una que no.
    version: 8,
    nombre: 'reservada',
    sql: 'SELECT 1;',
  },
  {
    // Cambio 116: los iconos de avatar (★ ☀ ☾ ♠ ♥ ♦ ♣ ♪) ya no se eligen. Cada
    // participante con icono pasa a un personaje segun su lugar en la lista (el
    // orden de la pantalla, con los archivados al final), dando la vuelta de a
    // ocho. Los colores y los personajes no se tocan. Las partidas guardadas
    // toman el del participante; si ya no existe, el de su lugar en la partida.
    // Las claves van en el orden de PERSONAJES.
    version: 9,
    nombre: 'personajes en lugar de iconos',
    sql: `CREATE TEMP TABLE personaje_de AS
        SELECT id, CASE (ROW_NUMBER() OVER (ORDER BY archivado, es_dueno DESC, creado_en, id) - 1) % 8
          WHEN 0 THEN 'bomba' WHEN 1 THEN 'fiaca' WHEN 2 THEN 'pincho' WHEN 3 THEN 'tembli'
          WHEN 4 THEN 'mimi' WHEN 5 THEN 'glup' WHEN 6 THEN 'profe' ELSE 'sombra' END AS personaje
        FROM participante;
      UPDATE participante
        SET avatar_valor = (SELECT personaje FROM personaje_de WHERE personaje_de.id = participante.id)
        WHERE avatar_tipo = 'icono'
          AND avatar_valor NOT IN ('bomba', 'fiaca', 'pincho', 'tembli', 'mimi', 'glup', 'profe', 'sombra');
      UPDATE partida_participante
        SET avatar_valor_snapshot = COALESCE(
          (SELECT personaje FROM personaje_de WHERE personaje_de.id = partida_participante.participante_id),
          CASE orden % 8
          WHEN 0 THEN 'bomba' WHEN 1 THEN 'fiaca' WHEN 2 THEN 'pincho' WHEN 3 THEN 'tembli'
          WHEN 4 THEN 'mimi' WHEN 5 THEN 'glup' WHEN 6 THEN 'profe' ELSE 'sombra' END)
        WHERE avatar_tipo_snapshot = 'icono'
          AND avatar_valor_snapshot NOT IN ('bomba', 'fiaca', 'pincho', 'tembli', 'mimi', 'glup', 'profe', 'sombra');
      DROP TABLE personaje_de;`,
  },
];

/** La version mas alta que conoce este build. */
export const VERSION_OBJETIVO = MIGRACIONES.reduce((max, m) => Math.max(max, m.version), 0);

export async function versionActual(db: SQLiteDatabase): Promise<number> {
  const fila = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  return fila?.user_version ?? 0;
}

/**
 * Aplica las migraciones pendientes, en orden, y devuelve cuales corrio.
 * En una base ya migrada no toca nada y devuelve [].
 */
export async function migrar(db: SQLiteDatabase): Promise<Migracion[]> {
  const desde = await versionActual(db);

  if (desde > VERSION_OBJETIVO) {
    throw new Error(
      `La base esta en la version ${desde} y este build solo conoce hasta la ${VERSION_OBJETIVO}. ` +
        'Probablemente sea una app mas vieja abriendo datos mas nuevos.',
    );
  }

  const pendientes = MIGRACIONES.filter((m) => m.version > desde).sort((a, b) => a.version - b.version);

  // BEGIN/COMMIT a mano sobre la misma conexion, como `escribir` en client.ts:
  // withExclusiveTransactionAsync no existe en web (fase 10, cambio 86).
  for (const migracion of pendientes) {
    await db.execAsync('BEGIN IMMEDIATE');
    try {
      await db.execAsync(migracion.sql);
      // user_version no acepta parametros: va interpolado. El valor es nuestro, no del usuario.
      await db.execAsync(`PRAGMA user_version = ${migracion.version}`);
      await db.execAsync('COMMIT');
    } catch (error) {
      await db.execAsync('ROLLBACK');
      throw error;
    }
  }

  return pendientes;
}
