"use client";

import type Konva from "konva";
import type { CSSProperties, ReactNode, Ref } from "react";
import { useState } from "react";
import { Layer, Stage } from "react-konva";

import { useElementSize } from "@/lib/canvas/use-element-size";

import { GridBackground } from "./grid-background";

interface FloorPlanCanvasProps {
  showGrid?: boolean;
  className?: string;
  backgroundClassName?: string;
  style?: CSSProperties;
  stageRef?: Ref<Konva.Stage>;
  viewportOverride?: { width: number; height: number };
  children: (viewport: { width: number; height: number }) => ReactNode;
}

export function FloorPlanCanvas({
  showGrid = false,
  className,
  backgroundClassName,
  style,
  stageRef,
  viewportOverride,
  children,
}: FloorPlanCanvasProps) {
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const measuredSize = useElementSize(element);
  const size = viewportOverride ?? measuredSize;
  const resolvedStyle = viewportOverride
    ? {
        width: viewportOverride.width,
        height: viewportOverride.height,
        ...style,
      }
    : style;

  return (
    <div
      ref={setElement}
      className={className}
      style={resolvedStyle}
    >
      {showGrid ? <GridBackground className={backgroundClassName} /> : null}
      <div className="absolute inset-0 overflow-hidden rounded-[18px]">
        {size.width > 0 && size.height > 0 ? (
          <Stage ref={stageRef} width={size.width} height={size.height}>
            <Layer>{children(size)}</Layer>
          </Stage>
        ) : null}
      </div>
    </div>
  );
}
