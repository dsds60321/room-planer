"use client";

import { Group, Text } from "react-konva";

interface RoomLabelProps {
  x: number;
  y: number;
  width: number;
  depth: number;
  title: string;
  subtitle: string;
  color?: string;
}

export function RoomLabel({
  x,
  y,
  width,
  depth,
  title,
  subtitle,
  color = "#111827",
}: RoomLabelProps) {
  return (
    <Group listening={false}>
      <Text
        x={x}
        y={y + depth / 2 - 20}
        width={width}
        align="center"
        text={title}
        fontSize={16}
        fontStyle="600"
        fill={color}
      />
      <Text
        x={x}
        y={y + depth / 2 + 4}
        width={width}
        align="center"
        text={subtitle}
        fontSize={11}
        fill="#52525b"
      />
    </Group>
  );
}
