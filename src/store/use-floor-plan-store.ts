"use client";

import { create } from "zustand";

import { mockPlacements } from "@/features/floor-plan/mock-data";
import { type Placement, type RenderMode } from "@/types";

interface FloorPlanSnapshot {
  placedRooms: Placement[];
  scale: number;
  zoom: number;
  snapEnabled: boolean;
  resultRenderMode: RenderMode;
}

interface FloorPlanState extends FloorPlanSnapshot {
  history: FloorPlanSnapshot[];
  future: FloorPlanSnapshot[];
  pushHistory: () => void;
  setPlacedRooms: (placements: Placement[]) => void;
  moveRoom: (roomId: string, x: number, y: number) => void;
  placeRoom: (placement: Placement) => void;
  deletePlacement: (roomId: string) => void;
  setScale: (scale: number) => void;
  setZoom: (zoom: number) => void;
  toggleSnap: () => void;
  setResultRenderMode: (mode: RenderMode) => void;
  undo: () => void;
  redo: () => void;
}

const initialSnapshot: FloorPlanSnapshot = {
  placedRooms: mockPlacements,
  scale: 0.08,
  zoom: 0.6,
  snapEnabled: true,
  resultRenderMode: "annotated",
};

function createSnapshot(state: FloorPlanSnapshot): FloorPlanSnapshot {
  return {
    placedRooms: state.placedRooms.map((placement) => ({ ...placement })),
    scale: state.scale,
    zoom: state.zoom,
    snapEnabled: state.snapEnabled,
    resultRenderMode: state.resultRenderMode,
  };
}

const SNAP = 100;

export const useFloorPlanStore = create<FloorPlanState>((set, get) => ({
  ...initialSnapshot,
  history: [],
  future: [],
  pushHistory: () =>
    set((state) => ({
      history: [...state.history.slice(-29), createSnapshot(state)],
      future: [],
    })),
  setPlacedRooms: (placedRooms) => {
    get().pushHistory();
    set({ placedRooms });
  },
  moveRoom: (roomId, x, y) => {
    get().pushHistory();
    set((state) => ({
      placedRooms: state.placedRooms.map((placement) =>
        placement.roomId === roomId
          ? {
              ...placement,
              x: state.snapEnabled ? Math.round(x / SNAP) * SNAP : x,
              y: state.snapEnabled ? Math.round(y / SNAP) * SNAP : y,
              placed: true,
              status: "placed",
            }
          : placement,
      ),
    }));
  },
  placeRoom: (placement) => {
    get().pushHistory();
    set((state) => {
      const existing = state.placedRooms.some(
        (item) => item.roomId === placement.roomId,
      );
      if (existing) {
        return {
          placedRooms: state.placedRooms.map((item) =>
            item.roomId === placement.roomId ? placement : item,
          ),
        };
      }
      return {
        placedRooms: [...state.placedRooms, placement],
      };
    });
  },
  deletePlacement: (roomId) => {
    get().pushHistory();
    set((state) => ({
      placedRooms: state.placedRooms.filter((placement) => placement.roomId !== roomId),
    }));
  },
  setScale: (scale) => set({ scale }),
  setZoom: (zoom) => set({ zoom }),
  toggleSnap: () => set((state) => ({ snapEnabled: !state.snapEnabled })),
  setResultRenderMode: (resultRenderMode) => set({ resultRenderMode }),
  undo: () =>
    set((state) => {
      const previous = state.history[state.history.length - 1];
      if (!previous) {
        return state;
      }
      return {
        ...state,
        ...previous,
        history: state.history.slice(0, -1),
        future: [createSnapshot(state), ...state.future.slice(0, 29)],
      };
    }),
  redo: () =>
    set((state) => {
      const next = state.future[0];
      if (!next) {
        return state;
      }
      return {
        ...state,
        ...next,
        history: [...state.history.slice(-29), createSnapshot(state)],
        future: state.future.slice(1),
      };
    }),
}));
