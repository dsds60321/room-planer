"use client";

import { Group, Rect } from "react-konva";

import { getRoomFill } from "@/lib/floorplan/rendering";
import { type Room } from "@/types";

interface RoomShapeProps {
  room: Room;
  width: number;
  depth: number;
  wallThickness: number;
  selected?: boolean;
  showOutline?: boolean;
}

export function RoomShape({
  room,
  width,
  depth,
  wallThickness,
  selected,
  showOutline = true,
}: RoomShapeProps) {
  const inset = Math.max(Math.min(wallThickness, width / 6, depth / 6), 10);

  return (
    <Group>
      <Rect
        width={width}
        height={depth}
        fill="#1f2937"
        stroke={showOutline ? (selected ? "#0f766e" : "#1f2937") : undefined}
        strokeWidth={showOutline ? (selected ? 3 : 1) : 0}
        cornerRadius={2}
      />
      <Rect
        x={inset}
        y={inset}
        width={Math.max(width - inset * 2, 1)}
        height={Math.max(depth - inset * 2, 1)}
        fill={getRoomFill(room.roomType)}
        cornerRadius={1}
      />
      {selected && showOutline ? (
        <Rect
          x={-5}
          y={-5}
          width={width + 10}
          height={depth + 10}
          stroke="#0f766e"
          dash={[8, 6]}
          strokeWidth={1}
        />
      ) : null}
    </Group>
  );
}
