export type RoomType =
  | "living-room"
  | "bedroom"
  | "kitchen"
  | "bathroom"
  | "balcony"
  | "study"
  | "utility";

export type WallSide = "top" | "right" | "bottom" | "left";
export type DoorSwingDirection = "clockwise" | "counter-clockwise";
export type DoorOffsetMode = "start" | "center" | "end";
export type RoomStatus = "draft" | "measured" | "placed";
export type PlacementStatus = "draft" | "placed" | "locked";
export type RenderMode = "clean" | "annotated";
export type RenderStyle = "editor" | "floorplan";
export type FloorplanStatus = "empty" | "draft" | "complete";

export interface Door {
  id: string;
  roomId: string;
  position: {
    wall: WallSide;
    offset: number;
    mode?: DoorOffsetMode;
  };
  width: number;
  swingDirection: DoorSwingDirection;
  opensToInside: boolean;
}

export interface Placement {
  roomId: string;
  placed: boolean;
  x: number;
  y: number;
  attachedTo: string | null;
  status: PlacementStatus;
  rotation: 0 | 90 | 180 | 270;
  zIndex: number;
}

export interface Room {
  id: string;
  roomId: string;
  roomName: string;
  roomType: RoomType;
  width: number;
  depth: number;
  height: number;
  area: number;
  wallThickness: number;
  label: string;
  status: RoomStatus;
  doors: Door[];
}

export interface Project {
  id: string;
  name: string;
  status: "draft" | "saved";
  unit: "mm";
  rooms: Room[];
  placements: Placement[];
  updatedAt: string;
}

export interface Home {
  id: string;
  name: string;
  updatedAt: string;
}

export interface HomeListItem extends Home {
  floorplanCount: number;
}

export interface Floorplan {
  id: string;
  homeId: string;
  name: string;
  roomCount: number;
  status: FloorplanStatus;
  updatedAt: string;
}

export interface FloorplanDocument {
  floorplanId: string;
  rooms: Room[];
  placements: Placement[];
}

export interface WallSegment {
  id: string;
  roomId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  thickness: number;
  label: string;
  isExterior: boolean;
}

export interface FloorPlanRenderOptions {
  scale: number;
  zoom: number;
  wallThickness: number;
  label: string;
  renderStyle: RenderStyle;
  mode: RenderMode;
  showGrid: boolean;
  showDimensions: boolean;
  showLabels: boolean;
}

export interface MeasuredRoomInput {
  roomName: string;
  roomType: RoomType;
  width: number;
  depth: number;
  height: number;
  doorWall: WallSide;
  doorOffset: number;
  doorOffsetMode: DoorOffsetMode;
  doorWidth: number;
  doorSwingDirection: DoorSwingDirection;
  opensToInside: boolean;
}
