import "server-only";

import { randomUUID } from "crypto";
import { type ResultSetHeader, type RowDataPacket } from "mysql2/promise";

import { db, ensureProjectSchema } from "@/lib/server/db";
import {
  type Door,
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
  updatedAt: Date | string;
};

type RoomRow = RowDataPacket & {
  id: string;
  floorplanId: string;
  roomName: string;
  roomType: Room["roomType"];
  width: number;
  depth: number;
  height: number;
  area: number;
  wallThickness: number;
  label: string;
  status: Room["status"];
};

type DoorRow = RowDataPacket & {
  id: string;
  roomId: string;
  wallSide: Door["position"]["wall"];
  offsetValue: number;
  offsetMode: Door["position"]["mode"];
  width: number;
  swingDirection: Door["swingDirection"];
  opensToInside: number;
};

type PlacementRow = RowDataPacket & {
  roomId: string;
  floorplanId: string;
  placed: number;
  x: number;
  y: number;
  attachedTo: string | null;
  status: Placement["status"];
  rotation: Placement["rotation"];
  zIndex: number;
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
  const [rows] = await db.query<
    (HomeRow &
      FloorplanRow & {
        floorplanId: string;
        floorplanName: string;
        floorplanUpdatedAt: Date | string;
      })[]
  >(
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

  const row = rows[0];
  const [roomRows] = await db.query<RoomRow[]>(
    `
      SELECT
        id,
        floorplan_id AS floorplanId,
        room_name AS roomName,
        room_type AS roomType,
        width,
        depth,
        height,
        area,
        wall_thickness AS wallThickness,
        label,
        status
      FROM rooms
      WHERE floorplan_id = ?
      ORDER BY created_at ASC
    `,
    [floorplanId],
  );
  const [doorRows] = await db.query<DoorRow[]>(
    `
      SELECT
        id,
        room_id AS roomId,
        wall_side AS wallSide,
        offset_value AS offsetValue,
        offset_mode AS offsetMode,
        width,
        swing_direction AS swingDirection,
        opens_to_inside AS opensToInside
      FROM doors
      WHERE room_id IN (
        SELECT id FROM rooms WHERE floorplan_id = ?
      )
      ORDER BY created_at ASC
    `,
    [floorplanId],
  );
  const [placementRows] = await db.query<PlacementRow[]>(
    `
      SELECT
        room_id AS roomId,
        floorplan_id AS floorplanId,
        placed,
        x,
        y,
        attached_to AS attachedTo,
        status,
        rotation,
        z_index AS zIndex
      FROM placements
      WHERE floorplan_id = ?
      ORDER BY z_index ASC, created_at ASC
    `,
    [floorplanId],
  );

  const doorMap = new Map<string, Door[]>();
  for (const doorRow of doorRows) {
    const list = doorMap.get(doorRow.roomId) ?? [];
    list.push({
      id: doorRow.id,
      roomId: doorRow.roomId,
      position: {
        wall: doorRow.wallSide,
        offset: Number(doorRow.offsetValue),
        mode: doorRow.offsetMode ?? undefined,
      },
      width: Number(doorRow.width),
      swingDirection: doorRow.swingDirection,
      opensToInside: Boolean(doorRow.opensToInside),
    });
    doorMap.set(doorRow.roomId, list);
  }

  const rooms = roomRows.map((roomRow) => ({
    id: roomRow.id,
    roomId: roomRow.id,
    roomName: roomRow.roomName,
    roomType: roomRow.roomType,
    width: Number(roomRow.width),
    depth: Number(roomRow.depth),
    height: Number(roomRow.height),
    area: Number(roomRow.area),
    wallThickness: Number(roomRow.wallThickness),
    label: roomRow.label,
    status: roomRow.status,
    doors: doorMap.get(roomRow.id) ?? [],
  }));

  const placements = placementRows.map((placementRow) => ({
    roomId: placementRow.roomId,
    placed: Boolean(placementRow.placed),
    x: Number(placementRow.x),
    y: Number(placementRow.y),
    attachedTo: placementRow.attachedTo,
    status: placementRow.status,
    rotation: Number(placementRow.rotation) as Placement["rotation"],
    zIndex: Number(placementRow.zIndex),
  }));

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
      rooms,
      placements,
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
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    await connection.execute(
      `DELETE FROM placements WHERE floorplan_id = ?`,
      [floorplanId],
    );
    await connection.execute(
      `
        DELETE d FROM doors d
        INNER JOIN rooms r ON r.id = d.room_id
        WHERE r.floorplan_id = ?
      `,
      [floorplanId],
    );
    await connection.execute(
      `DELETE FROM rooms WHERE floorplan_id = ?`,
      [floorplanId],
    );

    for (const room of rooms) {
      await connection.execute<ResultSetHeader>(
        `
          INSERT INTO rooms
            (id, floorplan_id, room_name, room_type, width, depth, height, area, wall_thickness, label, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          room.id,
          floorplanId,
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
        await connection.execute<ResultSetHeader>(
          `
            INSERT INTO doors
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
      await connection.execute<ResultSetHeader>(
        `
          INSERT INTO placements
            (room_id, floorplan_id, placed, x, y, attached_to, status, rotation, z_index)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          placement.roomId,
          floorplanId,
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

    const roomsJson = JSON.stringify(rooms);
    const placementsJson = JSON.stringify(placements);

    const [result] = await connection.execute<ResultSetHeader>(
      `
        UPDATE floorplans
        SET
          room_count = ?,
          status = ?,
          rooms_json = ?,
          placements_json = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND home_id = ?
      `,
      [rooms.length, status, roomsJson, placementsJson, floorplanId, homeId],
    );

    await connection.execute<ResultSetHeader>(
      `UPDATE homes SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [homeId],
    );

    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
