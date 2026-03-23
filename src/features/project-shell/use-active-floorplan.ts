"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import {
  getFloorplanDocument,
  saveFloorplanDocument,
} from "@/lib/api/project-shell";
import { useFloorPlanStore } from "@/store/use-floor-plan-store";
import { useRoomStore } from "@/store/use-room-store";

export function useActiveFloorplan(homeId: string, floorplanId: string, persist = true) {
  const queryClient = useQueryClient();
  const lastPersistedSignatureRef = useRef<string | null>(null);
  const rooms = useRoomStore((state) => state.rooms);
  const hydrateRooms = useRoomStore((state) => state.hydrateRooms);
  const roomDocumentKey = useRoomStore((state) => state.documentKey);
  const placements = useFloorPlanStore((state) => state.placedRooms);
  const hydrateFloorPlan = useFloorPlanStore((state) => state.hydrateFloorPlan);
  const floorPlanDocumentKey = useFloorPlanStore((state) => state.documentKey);

  const documentQuery = useQuery({
    queryKey: ["floorplanDocument", homeId, floorplanId],
    queryFn: () => getFloorplanDocument(homeId, floorplanId),
  });

  const saveMutation = useMutation({
    mutationFn: (document: { floorplanId: string; rooms: typeof rooms; placements: typeof placements }) =>
      saveFloorplanDocument(homeId, floorplanId, document),
    onSuccess: (payload) => {
      const signature = JSON.stringify(payload.document);
      lastPersistedSignatureRef.current = signature;
      queryClient.setQueryData(["floorplanDocument", homeId, floorplanId], payload);
      queryClient.invalidateQueries({ queryKey: ["homes"] });
      queryClient.invalidateQueries({ queryKey: ["homeFloorplans", homeId] });
    },
  });
  const saveDocument = saveMutation.mutate;

  const home = documentQuery.data?.home ?? null;
  const floorplan = documentQuery.data?.floorplan ?? null;
  const document = documentQuery.data?.document ?? null;

  useEffect(() => {
    if (!document) {
      return;
    }

    lastPersistedSignatureRef.current = JSON.stringify(document);
    hydrateRooms(document.rooms, document.rooms[0]?.id ?? null, floorplanId);
    hydrateFloorPlan(document.placements, { documentKey: floorplanId });
  }, [document, floorplanId, hydrateFloorPlan, hydrateRooms]);

  const isReady =
    !!document &&
    roomDocumentKey === floorplanId &&
    floorPlanDocumentKey === floorplanId;

  useEffect(() => {
    if (!persist || !isReady) {
      return;
    }

    const nextDocument = {
      floorplanId,
      rooms,
      placements,
    };
    const nextSignature = JSON.stringify(nextDocument);

    if (lastPersistedSignatureRef.current === nextSignature) {
      return;
    }

    const timeout = window.setTimeout(() => {
      saveDocument(nextDocument);
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [floorplanId, isReady, persist, placements, rooms, saveDocument]);

  return {
    home,
    floorplan,
    isReady,
    error: documentQuery.error,
    saveState: documentQuery.isLoading
      ? "loading"
      : saveMutation.isPending
        ? "saving"
        : saveMutation.isError
          ? "error"
          : "saved",
    isFetching: documentQuery.isFetching,
  };
}
