"use client";

import { Line } from "react-konva";

import { type WallSegment } from "@/types";

export function WallShape({
  segment,
  scale,
  offsetX,
  offsetY,
}: {
  segment: WallSegment;
  scale: number;
  offsetX: number;
  offsetY: number;
}) {
  return (
    <Line
      points={[
        segment.x1 * scale + offsetX,
        segment.y1 * scale + offsetY,
        segment.x2 * scale + offsetX,
        segment.y2 * scale + offsetY,
      ]}
      stroke={segment.isExterior ? "#111827" : "#3f3f46"}
      strokeWidth={Math.max(segment.thickness * scale, segment.isExterior ? 7 : 5)}
      lineCap="square"
      listening={false}
    />
  );
}
