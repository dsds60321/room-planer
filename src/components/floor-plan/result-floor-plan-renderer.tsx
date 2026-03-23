"use client";

import type Konva from "konva";
import type { CSSProperties, Ref } from "react";
import React from "react";
import { Group } from "react-konva";

import { DoorSwing } from "@/components/floor-plan/door-swing";
import { FloorPlanCanvas } from "@/components/floor-plan/floor-plan-canvas";
import { RoomDimensions } from "@/components/floor-plan/room-dimensions";
import { RoomLabel } from "@/components/floor-plan/room-label";
import { RoomShape } from "@/components/floor-plan/room-shape";
import { WallShape } from "@/components/floor-plan/wall-shape";
import { createRenderContext, getDoorGeometry } from "@/lib/floorplan/rendering";
import { formatAreaMm2 } from "@/lib/utils/format";
import { type Placement, type RenderMode, type Room } from "@/types";

export function ResultFloorPlanRenderer({
  rooms,
  placements,
  mode,
  className,
  style,
  padding = 96,
  zoom = 1,
  stageRef,
  viewportOverride,
  showGridBackground = false,
}: {
  rooms: Room[];
  placements: Placement[];
  mode: RenderMode;
  className?: string;
  style?: CSSProperties;
  padding?: number;
  zoom?: number;
  stageRef?: Ref<Konva.Stage>;
  viewportOverride?: { width: number; height: number };
  showGridBackground?: boolean;
}) {
  return (
    <FloorPlanCanvas
      stageRef={stageRef}
      viewportOverride={viewportOverride}
      showGrid={showGridBackground}
      className={
        className ??
        "relative min-h-[760px] overflow-hidden rounded-[24px] border border-zinc-200 bg-[#fcfcfb]"
      }
      style={style}
    >
      {(viewport) => {
        const context = createRenderContext({
          rooms,
          placements,
          viewport,
          padding,
          options: {
            scale: 0.08,
            zoom,
            wallThickness: 180,
            label: "result",
            renderStyle: "floorplan",
            mode,
            showGrid: false,
            showDimensions: mode === "annotated",
            showLabels: true,
          },
        });

        return (
          <>
            {context.rooms.map((item) => (
              <Group key={`${item.room.id}-fill`} x={item.px.x} y={item.px.y}>
                <RoomShape
                  room={item.room}
                  width={item.px.width}
                  depth={item.px.depth}
                  wallThickness={item.px.wallThickness}
                  showOutline={false}
                />
              </Group>
            ))}
            {context.wallSegments.map((segment) => (
              <WallShape
                key={segment.id}
                segment={segment}
                scale={context.scale}
                offsetX={context.offsetX}
                offsetY={context.offsetY}
              />
            ))}
            {context.rooms.map((item) => {
              const geometry = item.room.doors[0]
                ? getDoorGeometry(
                    item.room.doors[0],
                    item,
                    context.scale,
                    context.offsetX,
                    context.offsetY,
                  )
                : null;

              return (
                <React.Fragment key={`${item.room.id}-detail`}>
                  {mode === "annotated" ? (
                    <RoomDimensions
                      x={item.px.x}
                      y={item.px.y}
                      width={item.px.width}
                      depth={item.px.depth}
                      widthValue={item.room.width}
                      depthValue={item.room.depth}
                      color="#71717a"
                      fontSize={10}
                    />
                  ) : null}
                  {geometry ? (
                    <DoorSwing
                      hingeX={geometry.hingeX}
                      hingeY={geometry.hingeY}
                      leafEndX={geometry.leafEndX}
                      leafEndY={geometry.leafEndY}
                      radius={geometry.radius}
                      arcStart={geometry.arcStart}
                      arcEnd={geometry.arcEnd}
                      stroke="#111827"
                    />
                  ) : null}
                  <RoomLabel
                    x={item.px.x}
                    y={item.px.y}
                    width={item.px.width}
                    depth={item.px.depth}
                    title={item.room.roomName}
                    subtitle={
                      mode === "annotated"
                        ? `${formatAreaMm2(item.room.area)} · ${Math.round(
                            item.room.width / 10,
                          )} x ${Math.round(item.room.depth / 10)} cm`
                        : formatAreaMm2(item.room.area)
                    }
                  />
                </React.Fragment>
              );
            })}
          </>
        );
      }}
    </FloorPlanCanvas>
  );
}
