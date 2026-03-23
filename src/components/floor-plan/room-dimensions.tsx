"use client";

import { Group, Line, Text } from "react-konva";

import { formatLength } from "@/lib/utils/format";

interface RoomDimensionsProps {
  x: number;
  y: number;
  width: number;
  depth: number;
  color?: string;
  fontSize?: number;
  widthValue: number;
  depthValue: number;
}

export function RoomDimensions({
  x,
  y,
  width,
  depth,
  color = "#52525b",
  fontSize = 10,
  widthValue,
  depthValue,
}: RoomDimensionsProps) {
  return (
    <Group listening={false}>
      <Line
        points={[x + 10, y - 14, x + width - 10, y - 14]}
        stroke={color}
        strokeWidth={1}
        opacity={0.85}
      />
      <Text
        x={x}
        y={y - 28}
        width={width}
        align="center"
        text={formatLength(widthValue)}
        fontSize={fontSize}
        fill={color}
      />
      <Line
        points={[x - 14, y + 10, x - 14, y + depth - 10]}
        stroke={color}
        strokeWidth={1}
        opacity={0.85}
      />
      <Text
        x={x - 70}
        y={y + depth / 2 - fontSize / 2}
        width={56}
        align="right"
        text={formatLength(depthValue)}
        fontSize={fontSize}
        fill={color}
      />
    </Group>
  );
}
