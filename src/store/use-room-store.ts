"use client";

import { create } from "zustand";

import { createShortId } from "@/lib/id";
import { type Door, type MeasuredRoomInput, type Room } from "@/types";

interface RoomState {
  rooms: Room[];
  selectedRoomId: string | null;
  documentKey: string | null;
  hydrateRooms: (
    rooms: Room[],
    selectedRoomId?: string | null,
    documentKey?: string | null,
  ) => void;
  addRoom: (input: MeasuredRoomInput, status?: Room["status"]) => string;
  updateRoom: (
    roomId: string,
    input: MeasuredRoomInput,
    status?: Room["status"],
  ) => void;
  removeRoom: (roomId: string) => void;
  selectRoom: (roomId: string | null) => void;
  markRoomPlaced: (roomId: string) => void;
  markRoomUnplaced: (roomId: string) => void;
  cloneRoom: (roomId: string) => string | null;
}

function toDoor(roomId: string, input: MeasuredRoomInput): Door {
  return {
    id: `${roomId}-door-1`,
    roomId,
    position: {
      wall: input.doorWall,
      offset: input.doorOffset,
      mode: input.doorOffsetMode,
    },
    width: input.doorWidth,
    swingDirection: input.doorSwingDirection,
    opensToInside: input.opensToInside,
  };
}

function toRoom(
  roomId: string,
  input: MeasuredRoomInput,
  status: Room["status"],
): Room {
  return {
    id: roomId,
    roomId,
    roomName: input.roomName,
    roomType: input.roomType,
    width: input.width,
    depth: input.depth,
    height: input.height,
    area: input.width * input.depth,
    wallThickness: 180,
    label: input.roomName,
    status,
    doors: [toDoor(roomId, input)],
  };
}

export const useRoomStore = create<RoomState>((set) => ({
  rooms: [],
  selectedRoomId: null,
  documentKey: null,
  hydrateRooms: (rooms, selectedRoomId = rooms[0]?.id ?? null, documentKey = null) =>
    set({
      rooms: rooms.map((room) => ({
        ...room,
        doors: room.doors.map((door) => ({
          ...door,
          position: { ...door.position },
        })),
      })),
      selectedRoomId,
      documentKey,
    }),
  addRoom: (input, status = "measured") => {
    const roomId = createShortId("room");
    set((state) => ({
      rooms: [...state.rooms, toRoom(roomId, input, status)],
      selectedRoomId: roomId,
    }));
    return roomId;
  },
  updateRoom: (roomId, input, status = "measured") =>
    set((state) => ({
      rooms: state.rooms.map((room) =>
        room.id === roomId ? toRoom(roomId, input, status) : room,
      ),
      selectedRoomId: roomId,
    })),
  removeRoom: (roomId) =>
    set((state) => ({
      rooms: state.rooms.filter((room) => room.id !== roomId),
      selectedRoomId:
        state.selectedRoomId === roomId ? (state.rooms[0]?.id ?? null) : state.selectedRoomId,
    })),
  selectRoom: (roomId) => set({ selectedRoomId: roomId }),
  markRoomPlaced: (roomId) =>
    set((state) => ({
      rooms: state.rooms.map((room) =>
        room.id === roomId ? { ...room, status: "placed" } : room,
      ),
    })),
  markRoomUnplaced: (roomId) =>
    set((state) => ({
      rooms: state.rooms.map((room) =>
        room.id === roomId && room.status === "placed"
          ? { ...room, status: "measured" }
          : room,
      ),
    })),
  cloneRoom: (roomId) => {
    const nextId = createShortId("room");
    const source = useRoomStore.getState().rooms.find((room) => room.id === roomId);
    if (!source) {
      return null;
    }

    const copy: Room = {
      ...source,
      id: nextId,
      roomId: nextId,
      roomName: `${source.roomName} 복제`,
      label: `${source.roomName} 복제`,
      status: "measured",
      doors: source.doors.map((door) => ({
        ...door,
        id: `${nextId}-door-1`,
        roomId: nextId,
      })),
    };

    set((state) => ({
      rooms: [...state.rooms, copy],
      selectedRoomId: nextId,
    }));
    return nextId;
  },
}));
