import "server-only";

import { randomUUID } from "crypto";
import { type RowDataPacket } from "mysql2/promise";

import { db, ensureProjectSchema } from "@/lib/server/db";
import {
  type Floorplan,
  type FloorplanDocument,
  type Home,
  type HomeListItem,
  type Placement,
  type Room,
} from "@/types";

type HomeRow = RowDataPacket & {
  id: string;
  name: string;
  updatedAt: Date | string;
  floorplanCount: number;
};

type FloorplanRow = RowDataPacket & {
  id: string;
  homeId: string;
  name: string;
  roomCount: number;
  status: Floorplan["status"];
  roomsJson?: string;
  placementsJson?: string;
  updatedAt: Date | string;
};

function toIso(value: Date | string) {
  return new Date(value).toISOString();
}

function toHome(row: Pick<HomeRow, "id" | "name" | "updatedAt">): Home {
  return {
    id: row.id,
    name: row.name,
    updatedAt: toIso(row.updatedAt),
  };
}

function toFloorplan(row: FloorplanRow): Floorplan {
  return {
    id: row.id,
    homeId: row.homeId,
    name: row.name,
    roomCount: Number(row.roomCount),
    status: row.status,
    updatedAt: toIso(row.updatedAt),
  };
}

function parseJsonArray<T>(value?: string): T[] {
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

function computeStatus(rooms: Room[], placements: Placement[]): Floorplan["status"] {
  if (rooms.length === 0) {
    return "empty";
  }
  if (placements.length === 0) {
    return "draft";
  }
  return "complete";
}

export async function listHomes(): Promise<HomeListItem[]> {
  await ensureProjectSchema();
  const [rows] = await db.query<HomeRow[]>(
    `
      SELECT
        h.id,
        h.name,
        h.updated_at AS updatedAt,
        COUNT(f.id) AS floorplanCount
      FROM homes h
      LEFT JOIN floorplans f ON f.home_id = h.id
      GROUP BY h.id, h.name, h.updated_at
      ORDER BY h.updated_at DESC
    `,
  );

  return rows.map((row) => ({
    ...toHome(row),
    floorplanCount: Number(row.floorplanCount),
  }));
}

export async function createHome(name: string): Promise<Home> {
  await ensureProjectSchema();
  const id = `home-${randomUUID().slice(0, 8)}`;
  await db.execute(
    `INSERT INTO homes (id, name) VALUES (?, ?)`,
    [id, name],
  );

  const [rows] = await db.query<HomeRow[]>(
    `SELECT id, name, updated_at AS updatedAt FROM homes WHERE id = ? LIMIT 1`,
    [id],
  );

  return toHome(rows[0]);
}

export async function renameHome(homeId: string, name: string) {
  await ensureProjectSchema();
  const [result] = await db.execute(
    `UPDATE homes SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [name, homeId],
  );
  return result;
}

export async function deleteHome(homeId: string) {
  await ensureProjectSchema();
  const [result] = await db.execute(`DELETE FROM homes WHERE id = ?`, [homeId]);
  return result;
}

export async function getHomeWithFloorplans(homeId: string): Promise<{
  home: Home | null;
  floorplans: Floorplan[];
}> {
  await ensureProjectSchema();
  const [homeRows] = await db.query<HomeRow[]>(
    `SELECT id, name, updated_at AS updatedAt FROM homes WHERE id = ? LIMIT 1`,
    [homeId],
  );
  if (homeRows.length === 0) {
    return { home: null, floorplans: [] };
  }

  const [floorplanRows] = await db.query<FloorplanRow[]>(
    `
      SELECT
        id,
        home_id AS homeId,
        name,
        room_count AS roomCount,
        status,
        updated_at AS updatedAt
      FROM floorplans
      WHERE home_id = ?
      ORDER BY updated_at DESC
    `,
    [homeId],
  );

  return {
    home: toHome(homeRows[0]),
    floorplans: floorplanRows.map(toFloorplan),
  };
}

export async function createFloorplan(homeId: string, name: string): Promise<Floorplan> {
  await ensureProjectSchema();
  const id = `fp-${randomUUID().slice(0, 8)}`;
  await db.execute(
    `
      INSERT INTO floorplans
        (id, home_id, name, room_count, status, rooms_json, placements_json)
      VALUES (?, ?, ?, 0, 'empty', '[]', '[]')
    `,
    [id, homeId, name],
  );
  await db.execute(
    `UPDATE homes SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [homeId],
  );

  const [rows] = await db.query<FloorplanRow[]>(
    `
      SELECT
        id,
        home_id AS homeId,
        name,
        room_count AS roomCount,
        status,
        updated_at AS updatedAt
      FROM floorplans
      WHERE id = ?
      LIMIT 1
    `,
    [id],
  );

  return toFloorplan(rows[0]);
}

export async function renameFloorplan(homeId: string, floorplanId: string, name: string) {
  await ensureProjectSchema();
  const [result] = await db.execute(
    `
      UPDATE floorplans
      SET name = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND home_id = ?
    `,
    [name, floorplanId, homeId],
  );
  await db.execute(
    `UPDATE homes SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [homeId],
  );
  return result;
}

export async function deleteFloorplan(homeId: string, floorplanId: string) {
  await ensureProjectSchema();
  const [result] = await db.execute(
    `DELETE FROM floorplans WHERE id = ? AND home_id = ?`,
    [floorplanId, homeId],
  );
  await db.execute(
    `UPDATE homes SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [homeId],
  );
  return result;
}

export async function getFloorplanDocument(
  homeId: string,
  floorplanId: string,
): Promise<{
  home: Home | null;
  floorplan: Floorplan | null;
  document: FloorplanDocument | null;
}> {
  await ensureProjectSchema();
  const [rows] = await db.query<(HomeRow & FloorplanRow)[]>(
    `
      SELECT
        h.id,
        h.name,
        h.updated_at AS updatedAt,
        f.id AS floorplanId,
        f.home_id AS homeId,
        f.name AS floorplanName,
        f.room_count AS roomCount,
        f.status,
        f.rooms_json AS roomsJson,
        f.placements_json AS placementsJson,
        f.updated_at AS floorplanUpdatedAt
      FROM homes h
      INNER JOIN floorplans f ON f.home_id = h.id
      WHERE h.id = ? AND f.id = ?
      LIMIT 1
    `,
    [homeId, floorplanId],
  );

  if (rows.length === 0) {
    return {
      home: null,
      floorplan: null,
      document: null,
    };
  }

  const row = rows[0] as HomeRow &
    FloorplanRow & {
      floorplanId: string;
      floorplanName: string;
      floorplanUpdatedAt: Date | string;
    };

  return {
    home: toHome(row),
    floorplan: {
      id: row.floorplanId,
      homeId: row.homeId,
      name: row.floorplanName,
      roomCount: Number(row.roomCount),
      status: row.status,
      updatedAt: toIso(row.floorplanUpdatedAt),
    },
    document: {
      floorplanId: row.floorplanId,
      rooms: parseJsonArray<Room>(row.roomsJson),
      placements: parseJsonArray<Placement>(row.placementsJson),
    },
  };
}

export async function saveFloorplanDocument(
  homeId: string,
  floorplanId: string,
  rooms: Room[],
  placements: Placement[],
) {
  await ensureProjectSchema();
  const status = computeStatus(rooms, placements);
  const roomsJson = JSON.stringify(rooms);
  const placementsJson = JSON.stringify(placements);

  const [result] = await db.execute(
    `
      UPDATE floorplans
      SET
        rooms_json = ?,
        placements_json = ?,
        room_count = ?,
        status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND home_id = ?
    `,
    [roomsJson, placementsJson, rooms.length, status, floorplanId, homeId],
  );

  await db.execute(
    `UPDATE homes SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [homeId],
  );

  return result;
}
