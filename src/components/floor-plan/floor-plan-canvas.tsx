"use client";

import { useState } from "react";
import { Layer, Stage } from "react-konva";

import { useElementSize } from "@/lib/canvas/use-element-size";

import { GridBackground } from "./grid-background";

interface FloorPlanCanvasProps {
  showGrid?: boolean;
  className?: string;
  backgroundClassName?: string;
  children: (viewport: { width: number; height: number }) => React.ReactNode;
}

export function FloorPlanCanvas({
  showGrid = false,
  className,
  backgroundClassName,
  children,
}: FloorPlanCanvasProps) {
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const size = useElementSize(element);

  return (
    <div
      ref={setElement}
      className={className}
    >
      {showGrid ? <GridBackground className={backgroundClassName} /> : null}
      <div className="absolute inset-0 overflow-hidden rounded-[18px]">
        {size.width > 0 && size.height > 0 ? (
          <Stage width={size.width} height={size.height}>
            <Layer>{children(size)}</Layer>
          </Stage>
        ) : null}
      </div>
    </div>
  );
}
