"use client";

import { Group, Line, Shape } from "react-konva";

interface DoorSwingProps {
  hingeX: number;
  hingeY: number;
  leafEndX: number;
  leafEndY: number;
  radius: number;
  arcStart: number;
  arcEnd: number;
  stroke?: string;
}

export function DoorSwing({
  hingeX,
  hingeY,
  leafEndX,
  leafEndY,
  radius,
  arcStart,
  arcEnd,
  stroke = "#52525b",
}: DoorSwingProps) {
  return (
    <Group listening={false}>
      <Line
        points={[hingeX, hingeY, leafEndX, leafEndY]}
        stroke={stroke}
        strokeWidth={2}
        lineCap="round"
      />
      <Shape
        stroke={stroke}
        strokeWidth={1.5}
        sceneFunc={(context, shape) => {
          context.beginPath();
          context.arc(hingeX, hingeY, radius, arcStart, arcEnd, arcEnd < arcStart);
          context.strokeShape(shape);
        }}
      />
    </Group>
  );
}
