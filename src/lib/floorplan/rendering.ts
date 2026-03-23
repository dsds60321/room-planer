import {
  type Door,
  type DoorOffsetMode,
  type FloorPlanRenderOptions,
  type Placement,
  type Room,
  type WallSegment,
} from "@/types";

const ROOM_FILL: Record<Room["roomType"], string> = {
  "living-room": "#f5f4ef",
  bedroom: "#faf9f5",
  kitchen: "#f1efe8",
  bathroom: "#eceae3",
  balcony: "#f7f7f3",
  study: "#f8f6f0",
  utility: "#f0eee8",
};

interface RoomBounds {
  room: Room;
  placement: Placement;
  x: number;
  y: number;
  width: number;
  depth: number;
}

interface RenderedRoom extends RoomBounds {
  px: {
    x: number;
    y: number;
    width: number;
    depth: number;
    wallThickness: number;
  };
}

export interface RenderContext {
  rooms: RenderedRoom[];
  wallSegments: WallSegment[];
  bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
  };
  scale: number;
  offsetX: number;
  offsetY: number;
}

export function getRoomTypeLabel(type: Room["roomType"]) {
  const labels: Record<Room["roomType"], string> = {
    "living-room": "거실",
    bedroom: "침실",
    kitchen: "주방",
    bathroom: "욕실",
    balcony: "발코니",
    study: "서재",
    utility: "다용도실",
  };

  return labels[type];
}

export function getRoomFill(roomType: Room["roomType"]) {
  return ROOM_FILL[roomType];
}

export function getWallLength(
  width: number,
  depth: number,
  wall: Door["position"]["wall"],
) {
  return wall === "top" || wall === "bottom" ? width : depth;
}

export function resolveDoorOffset(args: {
  wallLength: number;
  doorWidth: number;
  value: number;
  mode: DoorOffsetMode;
}) {
  if (args.mode === "center") {
    return args.value - args.doorWidth / 2;
  }

  if (args.mode === "end") {
    return args.wallLength - args.value - args.doorWidth;
  }

  return args.value;
}

export function getDoorOffsetDisplayValue(args: {
  wallLength: number;
  doorWidth: number;
  offset: number;
  mode: DoorOffsetMode;
}) {
  if (args.mode === "center") {
    return args.offset + args.doorWidth / 2;
  }

  if (args.mode === "end") {
    return args.wallLength - args.offset - args.doorWidth;
  }

  return args.offset;
}

export function getDoorOffsetLabel(mode: DoorOffsetMode, wall: Door["position"]["wall"]) {
  if (mode === "center") {
    return wall === "top" || wall === "bottom" ? "좌측에서 문 중심" : "상단에서 문 중심";
  }

  if (mode === "end") {
    return wall === "top" || wall === "bottom" ? "우측 기준 여백" : "하단 기준 여백";
  }

  return wall === "top" || wall === "bottom" ? "좌측 기준 여백" : "상단 기준 여백";
}

export function resolvePlacedRooms(rooms: Room[], placements: Placement[]) {
  const placementMap = new Map(placements.map((placement) => [placement.roomId, placement]));
  return rooms
    .map((room) => {
      const placement = placementMap.get(room.id);
      if (!placement || !placement.placed) {
        return null;
      }
      return {
        room,
        placement,
        x: placement.x,
        y: placement.y,
        width: room.width,
        depth: room.depth,
      };
    })
    .filter((room): room is RoomBounds => room !== null)
    .sort((a, b) => a.placement.zIndex - b.placement.zIndex);
}

export function getPlanBounds(placedRooms: RoomBounds[]) {
  if (placedRooms.length === 0) {
    return {
      minX: 0,
      minY: 0,
      maxX: 8000,
      maxY: 6000,
      width: 8000,
      height: 6000,
    };
  }

  const minX = Math.min(...placedRooms.map((room) => room.x));
  const minY = Math.min(...placedRooms.map((room) => room.y));
  const maxX = Math.max(...placedRooms.map((room) => room.x + room.width));
  const maxY = Math.max(...placedRooms.map((room) => room.y + room.depth));

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

function rangesOverlap(startA: number, endA: number, startB: number, endB: number) {
  return Math.max(startA, startB) < Math.min(endA, endB);
}

function segmentKey(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  isExterior: boolean,
) {
  const forward = `${x1}:${y1}:${x2}:${y2}`;
  const reverse = `${x2}:${y2}:${x1}:${y1}`;
  const base = forward < reverse ? forward : reverse;
  return `${base}:${isExterior ? "ext" : "int"}`;
}

export function buildWallSegments(placedRooms: RoomBounds[]): WallSegment[] {
  const segments = new Map<string, WallSegment>();

  placedRooms.forEach((current) => {
    const edges = [
      {
        label: "top",
        x1: current.x,
        y1: current.y,
        x2: current.x + current.width,
        y2: current.y,
        isExterior: true,
      },
      {
        label: "right",
        x1: current.x + current.width,
        y1: current.y,
        x2: current.x + current.width,
        y2: current.y + current.depth,
        isExterior: true,
      },
      {
        label: "bottom",
        x1: current.x,
        y1: current.y + current.depth,
        x2: current.x + current.width,
        y2: current.y + current.depth,
        isExterior: true,
      },
      {
        label: "left",
        x1: current.x,
        y1: current.y,
        x2: current.x,
        y2: current.y + current.depth,
        isExterior: true,
      },
    ];

    edges.forEach((edge) => {
      const shared = placedRooms.some((other) => {
        if (other.room.id === current.room.id) {
          return false;
        }

        if (edge.label === "top" && current.y === other.y + other.depth) {
          return rangesOverlap(current.x, current.x + current.width, other.x, other.x + other.width);
        }
        if (edge.label === "bottom" && current.y + current.depth === other.y) {
          return rangesOverlap(current.x, current.x + current.width, other.x, other.x + other.width);
        }
        if (edge.label === "left" && current.x === other.x + other.width) {
          return rangesOverlap(current.y, current.y + current.depth, other.y, other.y + other.depth);
        }
        if (edge.label === "right" && current.x + current.width === other.x) {
          return rangesOverlap(current.y, current.y + current.depth, other.y, other.y + other.depth);
        }
        return false;
      });

      const isExterior = !shared;
      const key = segmentKey(edge.x1, edge.y1, edge.x2, edge.y2, isExterior);

      if (!segments.has(key)) {
        segments.set(key, {
          id: `${current.room.id}-${edge.label}-${isExterior ? "outer" : "inner"}`,
          roomId: current.room.id,
          x1: edge.x1,
          y1: edge.y1,
          x2: edge.x2,
          y2: edge.y2,
          thickness: isExterior ? current.room.wallThickness : Math.max(120, current.room.wallThickness - 40),
          label: edge.label,
          isExterior,
        });
      }
    });
  });

  return [...segments.values()];
}

export function createRenderContext(args: {
  rooms: Room[];
  placements: Placement[];
  options: FloorPlanRenderOptions;
  viewport: { width: number; height: number };
  padding?: number;
  focusRoomId?: string | null;
}): RenderContext {
  const placedRooms = resolvePlacedRooms(args.rooms, args.placements);
  const bounds = getPlanBounds(placedRooms);
  const padding = args.padding ?? 80;
  const scaleX = (args.viewport.width - padding * 2) / bounds.width;
  const scaleY = (args.viewport.height - padding * 2) / bounds.height;
  const rawScale = Math.max(Math.min(scaleX, scaleY), 0.01);
  const scale = rawScale * args.options.zoom;
  let offsetX = (args.viewport.width - bounds.width * scale) / 2 - bounds.minX * scale;
  let offsetY = (args.viewport.height - bounds.height * scale) / 2 - bounds.minY * scale;
  const focusedRoom = args.focusRoomId
    ? placedRooms.find((room) => room.room.id === args.focusRoomId)
    : null;

  if (focusedRoom) {
    const roomCenterX = (focusedRoom.x + focusedRoom.width / 2) * scale;
    const roomCenterY = (focusedRoom.y + focusedRoom.depth / 2) * scale;
    offsetX = args.viewport.width / 2 - roomCenterX;
    offsetY = args.viewport.height / 2 - roomCenterY;
  }

  return {
    rooms: placedRooms.map((room) => ({
      ...room,
      px: {
        x: room.x * scale + offsetX,
        y: room.y * scale + offsetY,
        width: room.width * scale,
        depth: room.depth * scale,
        wallThickness: room.room.wallThickness * scale,
      },
    })),
    wallSegments: buildWallSegments(placedRooms),
    bounds,
    scale,
    offsetX,
    offsetY,
  };
}

export function getDoorGeometry(
  door: Door,
  room: RenderedRoom,
  scale: number,
  offsetX: number,
  offsetY: number,
) {
  const x = room.x * scale + offsetX;
  const y = room.y * scale + offsetY;
  const width = room.width * scale;
  const depth = room.depth * scale;
  const doorWidth = door.width * scale;
  const offset =
    resolveDoorOffset({
      wallLength: getWallLength(room.width, room.depth, door.position.wall),
      doorWidth: door.width,
      value: door.position.offset,
      mode: door.position.mode ?? "start",
    }) * scale;
  const openFactor = door.opensToInside ? 1 : -1;
  const swingFactor = door.swingDirection === "clockwise" ? 1 : -1;

  if (door.position.wall === "top") {
    const hingeX = x + offset;
    const hingeY = y;
    return {
      hingeX,
      hingeY,
      leafX: hingeX + doorWidth,
      leafY: hingeY,
      arcStart: 0,
      arcEnd: (Math.PI / 2) * swingFactor * openFactor,
      radius: doorWidth,
      leafEndX: hingeX,
      leafEndY: hingeY + doorWidth * swingFactor * openFactor,
    };
  }

  if (door.position.wall === "bottom") {
    const hingeX = x + offset;
    const hingeY = y + depth;
    return {
      hingeX,
      hingeY,
      leafX: hingeX + doorWidth,
      leafY: hingeY,
      arcStart: 0,
      arcEnd: (-Math.PI / 2) * swingFactor * openFactor,
      radius: doorWidth,
      leafEndX: hingeX,
      leafEndY: hingeY - doorWidth * swingFactor * openFactor,
    };
  }

  if (door.position.wall === "left") {
    const hingeX = x;
    const hingeY = y + offset;
    return {
      hingeX,
      hingeY,
      leafX: hingeX,
      leafY: hingeY + doorWidth,
      arcStart: Math.PI / 2,
      arcEnd: (Math.PI / 2) * (1 - swingFactor * openFactor),
      radius: doorWidth,
      leafEndX: hingeX + doorWidth * swingFactor * openFactor,
      leafEndY: hingeY,
    };
  }

  const hingeX = x + width;
  const hingeY = y + offset;
  return {
    hingeX,
    hingeY,
    leafX: hingeX,
    leafY: hingeY + doorWidth,
    arcStart: Math.PI / 2,
    arcEnd: (Math.PI / 2) * (1 + swingFactor * openFactor),
    radius: doorWidth,
    leafEndX: hingeX - doorWidth * swingFactor * openFactor,
    leafEndY: hingeY,
  };
}
