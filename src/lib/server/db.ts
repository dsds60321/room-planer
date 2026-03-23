import "server-only";

import mysql, { type Pool, type RowDataPacket } from "mysql2/promise";

declare global {
  var __roomPlannerPool: Pool | undefined;
  var __roomPlannerSchemaReady: Promise<void> | undefined;
}

function createPool() {
  return mysql.createPool({
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME ?? "room_planner",
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: true,
    charset: "utf8mb4",
  });
}

export const db =
  globalThis.__roomPlannerPool ?? (globalThis.__roomPlannerPool = createPool());

export async function ensureProjectSchema() {
  if (process.env.DB_AUTO_CREATE_TABLES === "false") {
    return;
  }

  if (!globalThis.__roomPlannerSchemaReady) {
    globalThis.__roomPlannerSchemaReady = (async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS homes (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS floorplans (
          id VARCHAR(64) PRIMARY KEY,
          home_id VARCHAR(64) NOT NULL,
          name VARCHAR(255) NOT NULL,
          room_count INT NOT NULL DEFAULT 0,
          status ENUM('empty', 'draft', 'complete') NOT NULL DEFAULT 'empty',
          rooms_json LONGTEXT NOT NULL,
          placements_json LONGTEXT NOT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          CONSTRAINT fk_floorplans_home
            FOREIGN KEY (home_id) REFERENCES homes(id)
            ON DELETE CASCADE
        )
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS rooms (
          id VARCHAR(64) PRIMARY KEY,
          floorplan_id VARCHAR(64) NOT NULL,
          room_name VARCHAR(255) NOT NULL,
          room_type VARCHAR(32) NOT NULL,
          width INT NOT NULL,
          depth INT NOT NULL,
          height INT NOT NULL,
          area BIGINT NOT NULL,
          wall_thickness INT NOT NULL,
          label VARCHAR(255) NOT NULL,
          status VARCHAR(32) NOT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          CONSTRAINT fk_rooms_floorplan
            FOREIGN KEY (floorplan_id) REFERENCES floorplans(id)
            ON DELETE CASCADE
        )
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS doors (
          id VARCHAR(64) PRIMARY KEY,
          room_id VARCHAR(64) NOT NULL,
          wall_side VARCHAR(16) NOT NULL,
          offset_value INT NOT NULL,
          offset_mode VARCHAR(16) NULL,
          width INT NOT NULL,
          swing_direction VARCHAR(32) NOT NULL,
          opens_to_inside TINYINT(1) NOT NULL DEFAULT 1,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          CONSTRAINT fk_doors_room
            FOREIGN KEY (room_id) REFERENCES rooms(id)
            ON DELETE CASCADE
        )
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS placements (
          room_id VARCHAR(64) PRIMARY KEY,
          floorplan_id VARCHAR(64) NOT NULL,
          placed TINYINT(1) NOT NULL DEFAULT 0,
          x INT NOT NULL DEFAULT 0,
          y INT NOT NULL DEFAULT 0,
          attached_to VARCHAR(64) NULL,
          status VARCHAR(32) NOT NULL,
          rotation INT NOT NULL DEFAULT 0,
          z_index INT NOT NULL DEFAULT 0,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          CONSTRAINT fk_placements_room
            FOREIGN KEY (room_id) REFERENCES rooms(id)
            ON DELETE CASCADE,
          CONSTRAINT fk_placements_floorplan
            FOREIGN KEY (floorplan_id) REFERENCES floorplans(id)
            ON DELETE CASCADE
        )
      `);

      await migrateLegacyJsonDocuments();
    })();
  }

  await globalThis.__roomPlannerSchemaReady;
}

async function migrateLegacyJsonDocuments() {
  const [columns] = await db.query<RowDataPacket[]>(
    `SHOW COLUMNS FROM floorplans LIKE 'rooms_json'`,
  );

  if (columns.length === 0) {
    return;
  }

  const [rows] = await db.query<
    (RowDataPacket & {
      id: string;
      roomsJson: string;
      placementsJson: string;
      roomCount: number;
    })[]
  >(
    `
      SELECT
        f.id,
        f.rooms_json AS roomsJson,
        f.placements_json AS placementsJson,
        COUNT(r.id) AS roomCount
      FROM floorplans f
      LEFT JOIN rooms r ON r.floorplan_id = f.id
      GROUP BY f.id, f.rooms_json, f.placements_json
      HAVING COUNT(r.id) = 0
    `,
  );

  for (const row of rows) {
    const rooms = parseJsonArray(row.roomsJson);
    const placements = parseJsonArray(row.placementsJson);

    if (rooms.length === 0 && placements.length === 0) {
      continue;
    }

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      for (const room of rooms) {
        await connection.execute(
          `
            INSERT IGNORE INTO rooms
              (id, floorplan_id, room_name, room_type, width, depth, height, area, wall_thickness, label, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            room.id,
            row.id,
            room.roomName,
            room.roomType,
            room.width,
            room.depth,
            room.height,
            room.area,
            room.wallThickness,
            room.label,
            room.status,
          ],
        );

        for (const door of room.doors) {
          await connection.execute(
            `
              INSERT IGNORE INTO doors
                (id, room_id, wall_side, offset_value, offset_mode, width, swing_direction, opens_to_inside)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
              door.id,
              room.id,
              door.position.wall,
              door.position.offset,
              door.position.mode ?? null,
              door.width,
              door.swingDirection,
              door.opensToInside ? 1 : 0,
            ],
          );
        }
      }

      for (const placement of placements) {
        await connection.execute(
          `
            INSERT IGNORE INTO placements
              (room_id, floorplan_id, placed, x, y, attached_to, status, rotation, z_index)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            placement.roomId,
            row.id,
            placement.placed ? 1 : 0,
            placement.x,
            placement.y,
            placement.attachedTo,
            placement.status,
            placement.rotation,
            placement.zIndex,
          ],
        );
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

function parseJsonArray(value?: string) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
