"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { RoomMeasurePreview } from "@/components/measure/room-measure-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getDoorOffsetDisplayValue,
  getDoorOffsetLabel,
  getWallLength,
  resolveDoorOffset,
} from "@/lib/floorplan/rendering";
import {
  roomMeasureSchema,
  type RoomMeasureFormValues,
  type RoomMeasureSubmitValues,
} from "@/lib/schemas/room-measure";
import { useFloorPlanStore } from "@/store/use-floor-plan-store";
import { useRoomStore } from "@/store/use-room-store";
import { type MeasuredRoomInput, type Room } from "@/types";

const ROOM_TYPE_OPTIONS = [
  { value: "living-room", label: "거실" },
  { value: "bedroom", label: "침실" },
  { value: "kitchen", label: "주방" },
  { value: "bathroom", label: "욕실" },
  { value: "balcony", label: "발코니" },
  { value: "study", label: "서재" },
  { value: "utility", label: "다용도실" },
] as const;

const WALL_OPTIONS = [
  { value: "top", label: "상단 벽" },
  { value: "right", label: "우측 벽" },
  { value: "bottom", label: "하단 벽" },
  { value: "left", label: "좌측 벽" },
] as const;

const SWING_OPTIONS = [
  { value: "clockwise", label: "시계 방향" },
  { value: "counter-clockwise", label: "반시계 방향" },
] as const;

const DOOR_OFFSET_MODE_OPTIONS = [
  { value: "start", label: "좌/상 기준" },
  { value: "center", label: "중심 기준" },
  { value: "end", label: "우/하 기준" },
] as const;

function toInput(room?: Room): RoomMeasureFormValues {
  return {
    roomName: room?.roomName ?? "",
    roomType: room?.roomType ?? "living-room",
    width: room?.width ?? 4200,
    depth: room?.depth ?? 3200,
    height: room?.height ?? 2400,
    doorWall: room?.doors[0]?.position.wall ?? "bottom",
    doorOffset: room?.doors[0]?.position.offset ?? 800,
    doorOffsetMode: room?.doors[0]?.position.mode ?? "start",
    doorWidth: room?.doors[0]?.width ?? 900,
    doorSwingDirection: room?.doors[0]?.swingDirection ?? "clockwise",
    opensToInside: room?.doors[0]?.opensToInside ?? true,
  };
}

function toPreviewRoom(
  values: Partial<RoomMeasureFormValues>,
  roomId: string,
): Room {
  return {
    id: roomId,
    roomId,
    roomName: values.roomName || "미리보기 방",
    roomType: values.roomType ?? "living-room",
    width: Number(values.width ?? 0),
    depth: Number(values.depth ?? 0),
    height: Number(values.height ?? 0),
    area: Number(values.width ?? 0) * Number(values.depth ?? 0),
    wallThickness: 180,
    label: values.roomName || "미리보기 방",
    status: "draft",
    doors: [
      {
        id: `${roomId}-door-1`,
        roomId,
        position: {
          wall: values.doorWall ?? "bottom",
          offset: Number(values.doorOffset ?? 0),
          mode: values.doorOffsetMode ?? "start",
        },
        width: Number(values.doorWidth ?? 0),
        swingDirection: values.doorSwingDirection ?? "clockwise",
        opensToInside: values.opensToInside ?? true,
      },
    ],
  };
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }
  return <p className="text-sm text-destructive">{message}</p>;
}

export function RoomMeasureForm({ editorPath = "/" }: { editorPath?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSaving, setIsSaving] = useState(false);
  const roomId = searchParams.get("roomId");
  const rooms = useRoomStore((state) => state.rooms);
  const addRoom = useRoomStore((state) => state.addRoom);
  const updateRoom = useRoomStore((state) => state.updateRoom);
  const placeRoom = useFloorPlanStore((state) => state.placeRoom);
  const editingRoom = rooms.find((room) => room.id === roomId);

  const form = useForm<
    RoomMeasureFormValues,
    unknown,
    RoomMeasureSubmitValues
  >({
    resolver: zodResolver(roomMeasureSchema),
    defaultValues: toInput(editingRoom),
    mode: "onChange",
  });

  const placements = useFloorPlanStore((state) => state.placedRooms);
  const values = useWatch({ control: form.control });
  const width = Number(values.width ?? toInput(editingRoom).width);
  const depth = Number(values.depth ?? toInput(editingRoom).depth);
  const doorWidth = Number(values.doorWidth ?? toInput(editingRoom).doorWidth);
  const doorWall = values.doorWall ?? toInput(editingRoom).doorWall;
  const doorOffsetMode =
    values.doorOffsetMode ?? toInput(editingRoom).doorOffsetMode;
  const wallLength = getWallLength(width, depth, doorWall);
  const maxDoorOffsetValue =
    doorOffsetMode === "center"
      ? wallLength
      : Math.max(wallLength - doorWidth, 0);
  const doorOffsetInput = Math.min(
    Number(values.doorOffset ?? toInput(editingRoom).doorOffset),
    maxDoorOffsetValue,
  );
  const doorOffset = Math.max(
    resolveDoorOffset({
      wallLength,
      doorWidth,
      value: doorOffsetInput,
      mode: doorOffsetMode,
    }),
    0,
  );
  const doorCenter = doorOffset + doorWidth / 2;
  const leadingLabel =
    doorWall === "top" || doorWall === "bottom" ? "좌측 여백" : "상단 여백";
  const trailingLabel =
    doorWall === "top" || doorWall === "bottom" ? "우측 여백" : "하단 여백";
  const offsetLabel = getDoorOffsetLabel(doorOffsetMode, doorWall);

  useEffect(() => {
    if (Number(values.doorOffset ?? 0) > maxDoorOffsetValue) {
      form.setValue("doorOffset", maxDoorOffsetValue, { shouldValidate: true });
    }
  }, [form, maxDoorOffsetValue, values.doorOffset]);

  const previewRoom = toPreviewRoom(
    {
      ...toInput(editingRoom),
      ...values,
    },
    editingRoom?.id ?? "preview-room",
  );

  const saveRoom = () =>
    form.handleSubmit((rawValues) => {
      if (isSaving) {
        return;
      }
      setIsSaving(true);
      const payload = rawValues as MeasuredRoomInput;
      const targetRoomId = editingRoom?.id ?? addRoom(payload, "measured");
      const existingPlacement = placements.find(
        (placement) => placement.roomId === targetRoomId,
      );

      if (editingRoom) {
        updateRoom(editingRoom.id, payload, "measured");
      }

      placeRoom({
        roomId: targetRoomId,
        placed: true,
        x: existingPlacement?.x ?? 0,
        y: existingPlacement?.y ?? 0,
        attachedTo: existingPlacement?.attachedTo ?? null,
        status: "placed",
        rotation: 0,
        zIndex: existingPlacement?.zIndex ?? rooms.length + 1,
      });

      router.push(editorPath);
    })();

  return (
    <div className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
      <section className="order-2 rounded-[20px] border border-border bg-white p-4 sm:p-6 lg:order-1">
        <div className="mb-6 space-y-2">
          <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
            Measure
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">방 실측 입력</h1>
          <p className="text-sm text-muted-foreground">
            방별 실측값과 문 정보를 입력하면 우측 미리보기에 즉시 반영됩니다.
          </p>
        </div>

        <form className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="roomName">방 이름</Label>
            <Input id="roomName" {...form.register("roomName")} />
            <FieldError message={form.formState.errors.roomName?.message} />
          </div>

          <div className="space-y-2">
            <Label>방 종류</Label>
            <Controller
              control={form.control}
              name="roomType"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROOM_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError message={form.formState.errors.roomType?.message} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="width">가로(mm)</Label>
              <Input id="width" type="number" {...form.register("width")} />
              <FieldError message={form.formState.errors.width?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="depth">세로(mm)</Label>
              <Input id="depth" type="number" {...form.register("depth")} />
              <FieldError message={form.formState.errors.depth?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">높이(mm)</Label>
              <Input id="height" type="number" {...form.register("height")} />
              <FieldError message={form.formState.errors.height?.message} />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>현재 방 크기</span>
              <span className="font-medium text-foreground">
                가로 {width.toLocaleString("ko-KR")} mm / 세로 {depth.toLocaleString("ko-KR")} mm
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>문 위치</Label>
              <Controller
                control={form.control}
                name="doorWall"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WALL_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError message={form.formState.errors.doorWall?.message} />
            </div>
            <div className="space-y-2">
              <Label>문 위치 기준</Label>
              <Controller
                control={form.control}
                name="doorOffsetMode"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DOOR_OFFSET_MODE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError message={form.formState.errors.doorOffsetMode?.message} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="doorOffset">{offsetLabel}(mm)</Label>
              <Input
                id="doorOffset"
                type="number"
                max={maxDoorOffsetValue}
                {...form.register("doorOffset")}
              />
              <FieldError message={form.formState.errors.doorOffset?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doorWidth">문 폭(mm)</Label>
              <Input
                id="doorWidth"
                type="number"
                max={wallLength}
                {...form.register("doorWidth")}
              />
              <FieldError message={form.formState.errors.doorWidth?.message} />
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-border bg-muted/20 px-4 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">문 위치 세부 조정</span>
              <span className="text-muted-foreground">
                {getDoorOffsetDisplayValue({
                  wallLength,
                  doorWidth,
                  offset: doorOffset,
                  mode: doorOffsetMode,
                }).toLocaleString("ko-KR")} / {maxDoorOffsetValue.toLocaleString("ko-KR")} mm
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={maxDoorOffsetValue}
              step={10}
              value={doorOffsetInput}
              onChange={(event) =>
                form.setValue("doorOffset", Number(event.target.value), {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
              className="w-full accent-[var(--color-primary)]"
            />
            <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
              <div className="rounded-lg border border-border bg-white px-3 py-2">
                <p>{offsetLabel}</p>
                <p className="mt-1 font-medium text-foreground">
                  {getDoorOffsetDisplayValue({
                    wallLength,
                    doorWidth,
                    offset: doorOffset,
                    mode: doorOffsetMode,
                  }).toLocaleString("ko-KR")} mm
                </p>
              </div>
              <div className="rounded-lg border border-border bg-white px-3 py-2">
                <p>문 중심</p>
                <p className="mt-1 font-medium text-foreground">
                  {doorCenter.toLocaleString("ko-KR")} mm
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
              <div className="rounded-lg border border-border bg-white px-3 py-2">
                <p>{leadingLabel}</p>
                <p className="mt-1 font-medium text-foreground">
                  {doorOffset.toLocaleString("ko-KR")} mm
                </p>
              </div>
              <div className="rounded-lg border border-border bg-white px-3 py-2">
                <p>{trailingLabel}</p>
                <p className="mt-1 font-medium text-foreground">
                  {Math.max(wallLength - doorOffset - doorWidth, 0).toLocaleString("ko-KR")} mm
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              선택한 벽 길이 {wallLength.toLocaleString("ko-KR")} mm 기준으로 10mm 단위 조정
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>문 열림 방향</Label>
              <Controller
                control={form.control}
                name="doorSwingDirection"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SWING_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError message={form.formState.errors.doorSwingDirection?.message} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>문 열림 기준</Label>
            <Controller
              control={form.control}
              name="opensToInside"
              render={({ field }) => (
                <Select
                  value={field.value ? "inside" : "outside"}
                  onValueChange={(value) => field.onChange(value === "inside")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inside">실내 방향으로 열림</SelectItem>
                    <SelectItem value="outside">실외 방향으로 열림</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <Button type="button" variant="outline" asChild>
              <Link href={editorPath}>취소</Link>
            </Button>
            <Button type="button" onClick={() => saveRoom()} disabled={isSaving}>
              {isSaving ? "저장 중..." : "완료"}
            </Button>
          </div>
        </form>
      </section>

      <div className="order-1 lg:order-2">
        <RoomMeasurePreview room={previewRoom} />
      </div>
    </div>
  );
}
