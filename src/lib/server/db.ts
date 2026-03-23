import "server-only";

import mysql, { type Pool } from "mysql2/promise";

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
    })();
  }

  await globalThis.__roomPlannerSchemaReady;
}
