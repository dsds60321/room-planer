"use client";

import { ResultFloorPlanRenderer } from "@/components/floor-plan/result-floor-plan-renderer";
import { type Room } from "@/types";

export function RoomMeasurePreview({ room }: { room: Room }) {
  return (
    <div className="space-y-4 rounded-[20px] border border-border bg-white p-4">
      <div>
        <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
          Preview
        </p>
        <h3 className="mt-2 text-lg font-semibold tracking-tight">
          실측 비율 기반 간이 도면
        </h3>
      </div>
      <ResultFloorPlanRenderer
        rooms={[room]}
        placements={[
          {
            roomId: room.id,
            placed: true,
            x: 0,
            y: 0,
            attachedTo: null,
            status: "placed",
            rotation: 0,
            zIndex: 1,
          },
        ]}
        mode="annotated"
        padding={72}
        zoom={0.9}
        className="relative min-h-[320px] overflow-hidden rounded-[24px] border border-zinc-200 bg-[#fcfcfb] sm:min-h-[380px] lg:min-h-[420px]"
      />
    </div>
  );
}
