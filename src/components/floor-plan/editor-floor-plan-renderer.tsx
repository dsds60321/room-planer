"use client";

import React, { useRef, useState } from "react";
import { Group, Rect } from "react-konva";

import { DoorSwing } from "@/components/floor-plan/door-swing";
import { FloorPlanCanvas } from "@/components/floor-plan/floor-plan-canvas";
import { RoomDimensions } from "@/components/floor-plan/room-dimensions";
import { RoomLabel } from "@/components/floor-plan/room-label";
import { RoomShape } from "@/components/floor-plan/room-shape";
import { createRenderContext, getDoorGeometry } from "@/lib/floorplan/rendering";
import { formatAreaMm2 } from "@/lib/utils/format";
import { type Placement, type Room } from "@/types";

export function EditorFloorPlanRenderer({
  rooms,
  placements,
  selectedRoomId,
  zoom,
  onRoomSelect,
  onRoomMove,
  resetViewToken,
  wholePlanMode,
  mobileMode = false,
  onBackgroundTap,
  onRoomDoubleTap,
  onPinchZoom,
}: {
  rooms: Room[];
  placements: Placement[];
  selectedRoomId: string | null;
  zoom: number;
  onRoomSelect: (roomId: string) => void;
  onRoomMove: (roomId: string, next: { x: number; y: number }) => void;
  resetViewToken: number;
  wholePlanMode: boolean;
  mobileMode?: boolean;
  onBackgroundTap?: () => void;
  onRoomDoubleTap?: (roomId: string) => void;
  onPinchZoom?: (delta: number) => void;
}) {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const roomDraggingRef = useRef(false);
  const pinchDistanceRef = useRef<number | null>(null);

  return (
    <FloorPlanCanvas
      key={`${selectedRoomId ?? "all"}-${resetViewToken}`}
      showGrid
      className={`relative flex-1 overflow-hidden rounded-[18px] border border-border bg-white shadow-sm ${
        wholePlanMode ? "min-h-[calc(100vh-140px)]" : "min-h-[calc(100vh-190px)]"
      }`}
    >
      {(viewport) => {
        const context = createRenderContext({
          rooms,
          placements,
          viewport,
          focusRoomId: selectedRoomId,
          options: {
            scale: 0.08,
            zoom,
            wallThickness: 180,
            label: "editor",
            renderStyle: "editor",
            mode: "annotated",
            showGrid: true,
            showDimensions: false,
            showLabels: true,
          },
        });

        return (
          <>
            <Rect
              x={-viewport.width}
              y={-viewport.height}
              width={viewport.width * 3}
              height={viewport.height * 3}
              fill="rgba(0,0,0,0)"
              onMouseDown={(event) => {
                if (roomDraggingRef.current) {
                  return;
                }
                const stage = event.target.getStage();
                const point = stage?.getPointerPosition();
                if (!point) {
                  return;
                }
                dragRef.current = { x: point.x, y: point.y };
              }}
              onMouseMove={(event) => {
                if (!dragRef.current || roomDraggingRef.current) {
                  return;
                }
                const stage = event.target.getStage();
                const point = stage?.getPointerPosition();
                if (!point) {
                  return;
                }
                const deltaX = point.x - dragRef.current.x;
                const deltaY = point.y - dragRef.current.y;
                setPan((current) => ({
                  x: current.x + deltaX,
                  y: current.y + deltaY,
                }));
                dragRef.current = { x: point.x, y: point.y };
              }}
              onMouseUp={() => {
                dragRef.current = null;
              }}
              onMouseLeave={() => {
                dragRef.current = null;
              }}
              onClick={() => onBackgroundTap?.()}
              onTap={() => onBackgroundTap?.()}
              onTouchMove={(event) => {
                const touches = event.evt.touches;
                if (touches.length !== 2 || !onPinchZoom) {
                  pinchDistanceRef.current = null;
                  return;
                }
                const distance = Math.hypot(
                  touches[0].clientX - touches[1].clientX,
                  touches[0].clientY - touches[1].clientY,
                );
                if (pinchDistanceRef.current) {
                  onPinchZoom((distance - pinchDistanceRef.current) / 240);
                }
                pinchDistanceRef.current = distance;
              }}
              onTouchEnd={() => {
                pinchDistanceRef.current = null;
              }}
            />
            <Group x={pan.x} y={pan.y}>
              {context.rooms.map((item) => {
                const door = item.room.doors[0];
                const geometry = door
                  ? getDoorGeometry(door, item, context.scale, context.offsetX, context.offsetY)
                  : null;
                const selected = selectedRoomId === item.room.id;
                const showDetailText = !mobileMode || selected || zoom >= 0.8;
                const showDimensions = !mobileMode || selected || zoom >= 1;

                return (
                  <Group
                    key={item.room.id}
                    x={item.px.x}
                    y={item.px.y}
                    draggable
                    onMouseDown={(event) => {
                      event.cancelBubble = true;
                      dragRef.current = null;
                    }}
                    onClick={() => onRoomSelect(item.room.id)}
                    onTap={() => onRoomSelect(item.room.id)}
                    onDblTap={() => onRoomDoubleTap?.(item.room.id)}
                    onDblClick={() => onRoomDoubleTap?.(item.room.id)}
                    onDragStart={(event) => {
                      event.cancelBubble = true;
                      roomDraggingRef.current = true;
                      dragRef.current = null;
                    }}
                    onDragEnd={(event) =>
                      (() => {
                        roomDraggingRef.current = false;
                        onRoomMove(item.room.id, {
                          x: (event.target.x() - context.offsetX) / context.scale,
                          y: (event.target.y() - context.offsetY) / context.scale,
                        });
                      })()
                    }
                  >
                    <RoomShape
                      room={item.room}
                      width={item.px.width}
                      depth={item.px.depth}
                      wallThickness={item.px.wallThickness}
                      selected={selected}
                    />
                    {geometry ? (
                      <DoorSwing
                        hingeX={geometry.hingeX - item.px.x}
                        hingeY={geometry.hingeY - item.px.y}
                        leafEndX={geometry.leafEndX - item.px.x}
                        leafEndY={geometry.leafEndY - item.px.y}
                        radius={geometry.radius}
                        arcStart={geometry.arcStart}
                        arcEnd={geometry.arcEnd}
                        stroke={selectedRoomId === item.room.id ? "#0f766e" : "#52525b"}
                      />
                    ) : null}
                    {showDimensions ? (
                      <RoomDimensions
                        x={0}
                        y={0}
                        width={item.px.width}
                        depth={item.px.depth}
                        widthValue={item.room.width}
                        depthValue={item.room.depth}
                        color={selected ? "#0f766e" : "#64748b"}
                        fontSize={10}
                      />
                    ) : null}
                    <RoomLabel
                      x={0}
                      y={0}
                      width={item.px.width}
                      depth={item.px.depth}
                      title={item.room.roomName}
                      subtitle={
                        showDetailText
                          ? `${formatAreaMm2(item.room.area)} · ${Math.round(
                              item.room.width / 10,
                            )} x ${Math.round(item.room.depth / 10)} cm`
                          : ""
                      }
                      color={selected ? "#0f766e" : "#111827"}
                    />
                  </Group>
                );
              })}
            </Group>
          </>
        );
      }}
    </FloorPlanCanvas>
  );
}
