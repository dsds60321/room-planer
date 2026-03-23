"use client";

import Link from "next/link";
import { Focus, Pencil, PlusSquare, Trash2, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatAreaMm2, formatLength } from "@/lib/utils/format";
import { type Placement, type Room } from "@/types";

export function RoomCard({
  room,
  placement,
  selected,
  onLoad,
  onRemovePlacement,
  onDelete,
  onSelect,
}: {
  room: Room;
  placement?: Placement;
  selected?: boolean;
  onLoad: () => void;
  onRemovePlacement: () => void;
  onDelete: () => void;
  onSelect: () => void;
}) {
  const statusLabel =
    room.status === "placed"
      ? "배치됨"
      : room.status === "measured"
        ? "측정 완료"
        : "임시 저장";

  return (
    <Card
      size="sm"
      className={selected ? "ring-2 ring-teal-700/20" : ""}
      onClick={onSelect}
    >
      <CardHeader className="gap-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{room.roomName}</CardTitle>
            <CardDescription>{room.label}</CardDescription>
          </div>
          <Badge variant="outline" className="rounded-md">
            {statusLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-[13px] text-muted-foreground">
        <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
          <div className="flex items-center justify-between text-xs">
            <span>가로</span>
            <span className="font-medium text-foreground">{formatLength(room.width)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs">
            <span>세로</span>
            <span className="font-medium text-foreground">{formatLength(room.depth)}</span>
          </div>
        </div>
        <div className="flex justify-between">
          <span>타입</span>
          <span>{room.roomType}</span>
        </div>
        <div className="flex justify-between">
          <span>치수</span>
          <span>
            {formatLength(room.width)} / {formatLength(room.depth)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>면적</span>
          <span>{formatAreaMm2(room.area)}</span>
        </div>
        <div className="flex justify-between">
          <span>배치 좌표</span>
          <span>{placement ? `${placement.x}, ${placement.y}` : "미배치"}</span>
        </div>
      </CardContent>
      <CardFooter className="grid grid-cols-2 gap-2 border-t bg-muted/20">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={(event) => {
            event.stopPropagation();
            onSelect();
          }}
        >
          <Focus />
          이동
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={(event) => {
            event.stopPropagation();
            onLoad();
          }}
        >
          <PlusSquare />
          불러오기
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={(event) => {
            event.stopPropagation();
            onRemovePlacement();
          }}
          disabled={!placement}
        >
          <XCircle />
          제거
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          asChild
          onClick={(event) => event.stopPropagation()}
        >
          <Link href={`/measure?roomId=${room.id}`}>
            <Pencil />
            수정
          </Link>
        </Button>
      </CardFooter>
      <CardFooter className="border-t bg-white pt-0">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 />
          삭제
        </Button>
      </CardFooter>
    </Card>
  );
}
