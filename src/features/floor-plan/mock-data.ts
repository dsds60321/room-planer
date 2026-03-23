import {
  type Door,
  type Placement,
  type Project,
  type Room,
  type RoomType,
} from "@/types";

const createDoor = (
  roomId: string,
  wall: Door["position"]["wall"],
  offset: number,
  width: number,
  swingDirection: Door["swingDirection"],
): Door => ({
  id: `${roomId}-door-1`,
  roomId,
  position: { wall, offset, mode: "start" },
  width,
  swingDirection,
  opensToInside: true,
});

const createRoom = (
  roomId: string,
  roomName: string,
  roomType: RoomType,
  width: number,
  depth: number,
  height: number,
  door: Door,
  status: Room["status"] = "placed",
): Room => ({
  id: roomId,
  roomId,
  roomName,
  roomType,
  width,
  depth,
  height,
  area: width * depth,
  wallThickness: 180,
  label: roomName,
  status,
  doors: [door],
});

const rooms: Room[] = [
  createRoom(
    "room-living",
    "거실",
    "living-room",
    4800,
    3800,
    2400,
    createDoor("room-living", "bottom", 2600, 900, "clockwise"),
  ),
  createRoom(
    "room-bedroom-1",
    "침실 1",
    "bedroom",
    3400,
    3200,
    2400,
    createDoor("room-bedroom-1", "left", 900, 850, "counter-clockwise"),
  ),
  createRoom(
    "room-kitchen",
    "주방",
    "kitchen",
    2800,
    2600,
    2400,
    createDoor("room-kitchen", "left", 700, 800, "clockwise"),
  ),
  createRoom(
    "room-bath",
    "욕실",
    "bathroom",
    2200,
    1800,
    2300,
    createDoor("room-bath", "top", 1000, 700, "counter-clockwise"),
  ),
];

const placements: Placement[] = [
  {
    roomId: "room-living",
    placed: true,
    x: 0,
    y: 0,
    attachedTo: null,
    status: "placed",
    rotation: 0,
    zIndex: 1,
  },
  {
    roomId: "room-bedroom-1",
    placed: true,
    x: 0,
    y: 3800,
    attachedTo: "room-living",
    status: "placed",
    rotation: 0,
    zIndex: 2,
  },
  {
    roomId: "room-kitchen",
    placed: true,
    x: 4800,
    y: 0,
    attachedTo: "room-living",
    status: "placed",
    rotation: 0,
    zIndex: 3,
  },
  {
    roomId: "room-bath",
    placed: true,
    x: 3400,
    y: 3800,
    attachedTo: "room-bedroom-1",
    status: "placed",
    rotation: 0,
    zIndex: 4,
  },
];

export const mockProject: Project = {
  id: "demo-project",
  name: "송파 샘플 평면 프로젝트",
  status: "saved",
  unit: "mm",
  rooms,
  placements,
  updatedAt: new Date("2026-03-23T13:00:00+09:00").toISOString(),
};

export const mockRooms = rooms;
export const mockPlacements = placements;
