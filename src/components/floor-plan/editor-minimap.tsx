"use client";

import { getPlanBounds, resolvePlacedRooms } from "@/lib/floorplan/rendering";
import { type Placement, type Room } from "@/types";

export function EditorMinimap({
  rooms,
  placements,
  selectedRoomId,
  onSelect,
}: {
  rooms: Room[];
  placements: Placement[];
  selectedRoomId: string | null;
  onSelect: (roomId: string) => void;
}) {
  const placedRooms = resolvePlacedRooms(rooms, placements);
  const bounds = getPlanBounds(placedRooms);
  const width = 220;
  const height = 160;
  const padding = 12;
  const scale = Math.min(
    (width - padding * 2) / Math.max(bounds.width, 1),
    (height - padding * 2) / Math.max(bounds.height, 1),
  );

  return (
    <div className="rounded-[18px] border border-border bg-white p-3">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold">미니맵</p>
        <p className="text-xs text-muted-foreground">클릭하면 해당 방으로 이동</p>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[160px] w-full rounded-xl bg-[#f8f8f6]">
        {placedRooms.map((item) => {
          const x = padding + (item.x - bounds.minX) * scale;
          const y = padding + (item.y - bounds.minY) * scale;
          const rectWidth = Math.max(item.width * scale, 12);
          const rectHeight = Math.max(item.depth * scale, 12);
          const selected = item.room.id === selectedRoomId;

          return (
            <g
              key={item.room.id}
              onClick={() => onSelect(item.room.id)}
              className="cursor-pointer"
            >
              <rect
                x={x}
                y={y}
                width={rectWidth}
                height={rectHeight}
                rx={3}
                fill={selected ? "#d1fae5" : "#f3f1ea"}
                stroke={selected ? "#0f766e" : "#3f3f46"}
                strokeWidth={selected ? 2 : 1}
              />
              <text
                x={x + rectWidth / 2}
                y={y + rectHeight / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="9"
                fill="#111827"
              >
                {item.room.roomName}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
