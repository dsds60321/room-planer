"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Ellipsis,
  LayoutGrid,
  List,
  Minus,
  MousePointer2,
  Move,
  Pencil,
  Plus,
  Printer,
  Trash2,
  X,
  XCircle,
  ZoomIn,
} from "lucide-react";

import { EditorFloorPlanRenderer } from "@/components/floor-plan/editor-floor-plan-renderer";
import { EditorMinimap } from "@/components/floor-plan/editor-minimap";
import { AppHeader } from "@/components/layout/app-header";
import { RoomCard } from "@/components/room/room-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useActiveFloorplan } from "@/features/project-shell/use-active-floorplan";
import { getRoomTypeLabel } from "@/lib/floorplan/rendering";
import { formatAreaMm2, formatLength } from "@/lib/utils/format";
import { useFloorPlanStore } from "@/store/use-floor-plan-store";
import { useRoomStore } from "@/store/use-room-store";
import { type Placement } from "@/types";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobile(mediaQuery.matches);

    sync();
    mediaQuery.addEventListener("change", sync);
    return () => mediaQuery.removeEventListener("change", sync);
  }, []);

  return isMobile;
}

export function FloorPlanEditorPage({
  homeId,
  floorplanId,
}: {
  homeId: string;
  floorplanId: string;
}) {
  const isMobile = useIsMobile();
  const [page, setPage] = useState(1);
  const [resetViewToken, setResetViewToken] = useState(0);
  const [wholePlanMode, setWholePlanMode] = useState(false);
  const [roomListOpen, setRoomListOpen] = useState(false);
  const [roomDetailOpen, setRoomDetailOpen] = useState(false);

  const { home, floorplan, isReady, saveState, error } = useActiveFloorplan(homeId, floorplanId);

  const rooms = useRoomStore((state) => state.rooms);
  const selectedRoomId = useRoomStore((state) => state.selectedRoomId);
  const selectRoom = useRoomStore((state) => state.selectRoom);
  const removeRoom = useRoomStore((state) => state.removeRoom);
  const markRoomPlaced = useRoomStore((state) => state.markRoomPlaced);
  const markRoomUnplaced = useRoomStore((state) => state.markRoomUnplaced);
  const cloneRoom = useRoomStore((state) => state.cloneRoom);

  const placements = useFloorPlanStore((state) => state.placedRooms);
  const zoom = useFloorPlanStore((state) => state.zoom);
  const snapEnabled = useFloorPlanStore((state) => state.snapEnabled);
  const history = useFloorPlanStore((state) => state.history);
  const future = useFloorPlanStore((state) => state.future);
  const moveRoom = useFloorPlanStore((state) => state.moveRoom);
  const placeRoom = useFloorPlanStore((state) => state.placeRoom);
  const deletePlacement = useFloorPlanStore((state) => state.deletePlacement);
  const setZoom = useFloorPlanStore((state) => state.setZoom);
  const undo = useFloorPlanStore((state) => state.undo);
  const redo = useFloorPlanStore((state) => state.redo);
  const toggleSnap = useFloorPlanStore((state) => state.toggleSnap);

  const selectedRoom = rooms.find((room) => room.id === selectedRoomId) ?? null;
  const selectedPlacement =
    placements.find((placement) => placement.roomId === selectedRoomId) ?? null;
  const roomsPerPage = 6;
  const totalPages = Math.max(Math.ceil(rooms.length / roomsPerPage), 1);
  const currentPage = Math.min(page, totalPages);
  const desktopWholePlanMode = !isMobile && wholePlanMode;
  const pagedRooms = useMemo(
    () => rooms.slice((currentPage - 1) * roomsPerPage, currentPage * roomsPerPage),
    [currentPage, rooms],
  );
  const editorPath = `/homes/${homeId}/floorplans/${floorplanId}`;
  const measurePath = `${editorPath}/measure`;
  const resultPath = `${editorPath}/result`;
  const homePath = `/homes/${homeId}`;

  useEffect(() => {
    if (isMobile) {
      selectRoom(null);
    }
  }, [isMobile, selectRoom]);

  const focusRoom = (
    roomId: string,
    options?: {
      ensurePlaced?: boolean;
      zoomTo?: number;
      openDetails?: boolean;
    },
  ) => {
    const existing = placements.find((placement) => placement.roomId === roomId);

    if (!existing && options?.ensurePlaced !== false) {
      const nextPlacement: Placement = {
        roomId,
        placed: true,
        x: 600,
        y: 600,
        attachedTo: null,
        status: "placed",
        rotation: 0,
        zIndex: placements.length + 1,
      };

      placeRoom(nextPlacement);
      markRoomPlaced(roomId);
    }

    selectRoom(roomId);
    if (options?.zoomTo) {
      setZoom(options.zoomTo);
    }
    setResetViewToken((value) => value + 1);
    if (options?.openDetails) {
      setRoomDetailOpen(true);
    }
  };

  const removeFromPlan = (roomId: string) => {
    deletePlacement(roomId);
    markRoomUnplaced(roomId);
    selectRoom(roomId);
  };

  const deleteRoomWithConfirm = (roomId: string) => {
    const room = rooms.find((item) => item.id === roomId);
    if (!room || !window.confirm(`'${room.roomName}'을(를) 삭제할까요?`)) {
      return;
    }
    removeRoom(roomId);
    deletePlacement(roomId);
    if (selectedRoomId === roomId) {
      selectRoom(null);
      setRoomDetailOpen(false);
    }
  };

  const duplicateSelectedRoom = () => {
    if (!selectedRoomId) {
      return;
    }
    const clonedRoomId = cloneRoom(selectedRoomId);
    if (!clonedRoomId) {
      return;
    }

    placeRoom({
      roomId: clonedRoomId,
      placed: true,
      x: (selectedPlacement?.x ?? 0) + 300,
      y: (selectedPlacement?.y ?? 0) + 300,
      attachedTo: null,
      status: "placed",
      rotation: 0,
      zIndex: placements.length + 1,
    });
    focusRoom(clonedRoomId, { zoomTo: isMobile ? 0.75 : zoom });
  };

  const showWholePlan = () => {
    setWholePlanMode(true);
    selectRoom(null);
    setZoom(0.6);
    setResetViewToken((value) => value + 1);
  };

  const exitWholePlan = () => {
    setWholePlanMode(false);
  };

  const mobileSaveStatus =
    saveState === "loading"
      ? "불러오는 중"
      : saveState === "saving"
        ? "저장 중"
        : saveState === "error"
          ? "저장 오류"
          : history.length === 0 && future.length === 0
            ? "저장됨"
            : "자동 저장됨";

  if (!isReady) {
    return (
      <div className="min-h-screen bg-[#f3f4f6]">
        <div className="mx-auto max-w-[1600px] px-6 py-8">
          <div className="rounded-[20px] border border-border bg-white px-6 py-12 text-center text-sm text-muted-foreground">
            도면 편집 화면을 불러오는 중입니다.
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f3f4f6]">
        <div className="mx-auto max-w-[1600px] px-6 py-8">
          <div className="rounded-[20px] border border-border bg-white px-6 py-12 text-center">
            <h1 className="text-xl font-semibold">도면 데이터를 불러오지 못했습니다</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {(error as Error).message}
            </p>
            <Button className="mt-5" asChild>
              <Link href="/">집 선택으로 돌아가기</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!home || !floorplan) {
    return (
      <div className="min-h-screen bg-[#f3f4f6]">
        <div className="mx-auto max-w-[1600px] px-6 py-8">
          <div className="rounded-[20px] border border-border bg-white px-6 py-12 text-center">
            <h1 className="text-xl font-semibold">도면 정보를 찾을 수 없습니다</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              집 또는 도면이 삭제되었을 수 있습니다. 도면 선택 화면으로 돌아가 주세요.
            </p>
            <Button className="mt-5" asChild>
              <Link href="/">집 선택으로 돌아가기</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      <AppHeader
        className="hidden md:block"
        projectName={floorplan.name}
        saveStatus={mobileSaveStatus}
        onUndo={undo}
        onRedo={redo}
        disableUndo={history.length === 0}
        disableRedo={future.length === 0}
      />

      <div className="hidden border-b border-border bg-white md:block">
        <div className="mx-auto flex max-w-[1840px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground">
                홈
              </Link>
              <span>/</span>
              <Link href={homePath} className="hover:text-foreground">
                {home.name}
              </Link>
              <span>/</span>
              <span className="truncate text-foreground">{floorplan.name}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              현재 집과 도면 컨텍스트를 유지한 상태로 방 배치와 측정을 편집합니다.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="rounded-md bg-muted/20">
              <Check className="mr-1 size-3.5" />
              {mobileSaveStatus}
            </Badge>
            <Button type="button" variant="outline" asChild>
              <Link href={homePath}>도면 목록으로 돌아가기</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-30 border-b border-border bg-white/95 backdrop-blur md:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="text-[11px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
              {home.name}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <h1 className="truncate text-base font-semibold tracking-tight">
                {floorplan.name}
              </h1>
              <Badge variant="outline" className="rounded-md bg-muted/50 px-2 py-0.5 text-[11px]">
                <CheckCircle2 className="mr-1 size-3" />
                {mobileSaveStatus}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={undo}
              disabled={history.length === 0}
            >
              <ChevronLeft />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={redo}
              disabled={future.length === 0}
            >
              <ChevronRight />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="icon-sm">
                  <Ellipsis />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 min-w-48">
                <DropdownMenuItem onClick={() => setRoomListOpen(true)}>
                  <List />
                  방 목록
                </DropdownMenuItem>
                <DropdownMenuItem onClick={showWholePlan}>
                  <LayoutGrid />
                  전체 보기
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleSnap}>
                  <MousePointer2 />
                  {snapEnabled ? "스냅 끄기" : "스냅 켜기"}
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={resultPath}>
                    <Printer />
                    결과 보기
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={homePath}>도면 목록으로 돌아가기</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <main className="hidden md:block">
        <div
          className={`mx-auto min-h-[calc(100vh-88px)] max-w-[1840px] gap-6 px-4 py-6 sm:px-6 ${
            desktopWholePlanMode ? "block" : "grid xl:grid-cols-[minmax(0,1fr)_640px]"
          }`}
        >
          <section className="flex min-h-0 flex-col space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-border bg-white px-5 py-4">
              <div>
                <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
                  Floor Editor
                </p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight">
                  방 단위 배치 조합 캔버스
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" onClick={toggleSnap}>
                  {snapEnabled ? "스냅 켜짐" : "스냅 꺼짐"}
                </Button>
                <div className="flex items-center gap-1 rounded-md border border-border bg-white px-2 py-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setZoom(Math.max(0.3, Number((zoom - 0.1).toFixed(2))))}
                  >
                    <Minus />
                  </Button>
                  <span className="min-w-14 text-center text-sm font-medium">
                    {Math.round((zoom / 0.6) * 100)}%
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setZoom(Math.min(1.2, Number((zoom + 0.1).toFixed(2))))}
                  >
                    <ZoomIn />
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => selectedRoomId && removeFromPlan(selectedRoomId)}
                  disabled={!selectedPlacement}
                >
                  <XCircle />
                  평면도에서 제거
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={desktopWholePlanMode ? exitWholePlan : showWholePlan}
                >
                  {desktopWholePlanMode ? "편집 패널 보기" : "전체 도면 보기"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href={resultPath}>
                    <Printer />
                    결과 보기
                  </Link>
                </Button>
              </div>
            </div>

            {rooms.length === 0 ? (
              <div className="flex min-h-[620px] flex-col items-center justify-center rounded-[20px] border border-dashed border-border bg-white text-center">
                <p className="text-xl font-semibold tracking-tight">아직 추가된 방이 없습니다</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  우측의 ‘측정 시작하기’로 첫 번째 방을 만들어보세요
                </p>
              </div>
            ) : (
              <EditorFloorPlanRenderer
                rooms={rooms}
                placements={placements}
                selectedRoomId={selectedRoomId}
                zoom={zoom}
                resetViewToken={resetViewToken}
                wholePlanMode={desktopWholePlanMode}
                onRoomSelect={selectRoom}
                onRoomMove={(roomId, next) => {
                  moveRoom(roomId, next.x, next.y);
                  markRoomPlaced(roomId);
                  selectRoom(roomId);
                }}
              />
            )}
          </section>

          {!desktopWholePlanMode ? (
            <aside className="sticky top-6 max-h-[calc(100vh-3rem)] space-y-4 self-start overflow-visible pb-2">
              <EditorMinimap
                rooms={rooms}
                placements={placements}
                selectedRoomId={selectedRoomId}
                onSelect={(roomId) => focusRoom(roomId, { zoomTo: 0.6 })}
              />

              <div className="rounded-[20px] border border-border bg-white p-4 pb-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">방 카드</p>
                    <p className="text-xs text-muted-foreground">
                      총 {rooms.length}개 / 배치 {placements.length}개
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" asChild>
                      <Link href={measurePath}>
                        <Plus />
                        측정 시작하기
                      </Link>
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {pagedRooms.map((room) => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      placement={placements.find((placement) => placement.roomId === room.id)}
                      selected={selectedRoomId === room.id}
                      onSelect={() => focusRoom(room.id)}
                      onLoad={() => focusRoom(room.id)}
                      onRemovePlacement={() => removeFromPlan(room.id)}
                      onDelete={() => deleteRoomWithConfirm(room.id)}
                      measureHref={`${measurePath}?roomId=${room.id}`}
                    />
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <p className="text-xs text-muted-foreground">
                    {currentPage} / {totalPages} 페이지
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((value) => Math.max(1, value - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft />
                      이전
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                      disabled={currentPage === totalPages}
                    >
                      다음
                      <ChevronRight />
                    </Button>
                  </div>
                </div>
              </div>
            </aside>
          ) : null}
        </div>
      </main>

      <main className="mx-auto flex min-h-[calc(100vh-65px)] max-w-[960px] flex-col px-3 py-3 pb-28 md:hidden">
        <section className="relative flex-1 rounded-[24px] border border-border bg-white p-2 shadow-sm">
          {rooms.length === 0 ? (
            <div className="flex min-h-[62vh] flex-col items-center justify-center rounded-[20px] border border-dashed border-border bg-[#fcfcfb] px-6 text-center">
              <p className="text-lg font-semibold tracking-tight">아직 등록된 방이 없습니다</p>
              <p className="mt-2 text-sm text-muted-foreground">
                먼저 방을 추가한 뒤 배치와 조합을 시작하세요.
              </p>
              <Button className="mt-5" asChild>
                <Link href={measurePath}>
                  <Plus />
                  방 추가
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <EditorFloorPlanRenderer
                rooms={rooms}
                placements={placements}
                selectedRoomId={selectedRoomId}
                zoom={zoom}
                resetViewToken={resetViewToken}
                wholePlanMode
                mobileMode
                onBackgroundTap={() => selectRoom(null)}
                onRoomDoubleTap={(roomId) => {
                  focusRoom(roomId, { zoomTo: Math.min(1, zoom + 0.2) });
                }}
                onPinchZoom={(delta) =>
                  setZoom(Math.max(0.3, Math.min(1.2, Number((zoom + delta).toFixed(2)))))
                }
                onRoomSelect={(roomId) => focusRoom(roomId, { zoomTo: zoom })}
                onRoomMove={(roomId, next) => {
                  moveRoom(roomId, next.x, next.y);
                  markRoomPlaced(roomId);
                  selectRoom(roomId);
                }}
              />
              <div className="absolute right-4 bottom-24 flex flex-col gap-2">
                <Button
                  type="button"
                  size="icon"
                  className="size-11 rounded-2xl shadow-md"
                  onClick={() => setZoom(Math.min(1.2, Number((zoom + 0.1).toFixed(2))))}
                >
                  <ZoomIn />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-11 rounded-2xl bg-white shadow-md"
                  onClick={() => setZoom(Math.max(0.3, Number((zoom - 0.1).toFixed(2))))}
                >
                  <Minus />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-11 rounded-2xl bg-white shadow-md"
                  onClick={() => {
                    selectRoom(null);
                    setZoom(0.6);
                    setResetViewToken((value) => value + 1);
                  }}
                >
                  <LayoutGrid />
                </Button>
                {selectedRoom ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-11 rounded-2xl bg-white shadow-md"
                    onClick={() => selectRoom(null)}
                  >
                    <X />
                  </Button>
                ) : null}
              </div>
            </>
          )}
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/98 p-3 shadow-[0_-12px_32px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
        <div className="mx-auto max-w-[960px]">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              {selectedRoom ? (
                <>
                  <p className="truncate text-sm font-semibold">{selectedRoom.roomName}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {getRoomTypeLabel(selectedRoom.roomType)} · {formatAreaMm2(selectedRoom.area)}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold">도면을 한눈에 확인하세요</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    방을 선택하면 수정과 위치 조정 액션이 나타납니다.
                  </p>
                </>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setRoomListOpen(true)}>
                <List />
                방 목록
              </Button>
              {selectedRoom ? (
                <Button type="button" size="sm" onClick={() => setRoomDetailOpen(true)}>
                  <Pencil />
                  수정하기
                </Button>
              ) : (
                <Button type="button" size="sm" asChild>
                  <Link href={measurePath}>
                    <Plus />
                    방 추가
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <Sheet open={roomListOpen} onOpenChange={setRoomListOpen}>
        <SheetContent side="bottom" className="max-h-[78vh] rounded-t-[28px] p-0 md:hidden">
          <SheetHeader className="border-b border-border px-5 pb-4 pt-5">
            <SheetTitle>방 목록</SheetTitle>
            <SheetDescription>탭하면 해당 방으로 이동하고 선택합니다.</SheetDescription>
          </SheetHeader>
          <div className="space-y-2 overflow-y-auto px-4 py-4">
            {rooms.map((room) => {
              const placement = placements.find((item) => item.roomId === room.id);
              const selected = selectedRoomId === room.id;

              return (
                <button
                  key={room.id}
                  type="button"
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                    selected
                      ? "border-teal-700 bg-teal-50 text-teal-950"
                      : "border-border bg-white text-foreground"
                  }`}
                  onClick={() => {
                    focusRoom(room.id, { openDetails: false });
                    setRoomListOpen(false);
                  }}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{room.roomName}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {getRoomTypeLabel(room.roomType)} · {formatAreaMm2(room.area)}
                    </p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>{placement ? "배치 완료" : "미배치"}</p>
                    <p className="mt-1">{formatLength(room.width)} / {formatLength(room.depth)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={roomDetailOpen} onOpenChange={setRoomDetailOpen}>
        <SheetContent side="bottom" className="max-h-[82vh] rounded-t-[28px] p-0 md:hidden">
          <SheetHeader className="border-b border-border px-5 pb-4 pt-5">
            <SheetTitle>{selectedRoom?.roomName ?? "선택된 방"}</SheetTitle>
            <SheetDescription>
              {selectedRoom
                ? `${getRoomTypeLabel(selectedRoom.roomType)} · ${formatAreaMm2(selectedRoom.area)}`
                : "방을 먼저 선택해 주세요."}
            </SheetDescription>
          </SheetHeader>
          {selectedRoom ? (
            <div className="space-y-5 overflow-y-auto px-5 py-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-border bg-muted/20 p-4">
                  <p className="text-xs text-muted-foreground">가로</p>
                  <p className="mt-2 text-base font-semibold">{formatLength(selectedRoom.width)}</p>
                </div>
                <div className="rounded-2xl border border-border bg-muted/20 p-4">
                  <p className="text-xs text-muted-foreground">세로</p>
                  <p className="mt-2 text-base font-semibold">{formatLength(selectedRoom.depth)}</p>
                </div>
                <div className="rounded-2xl border border-border bg-muted/20 p-4">
                  <p className="text-xs text-muted-foreground">면적</p>
                  <p className="mt-2 text-base font-semibold">{formatAreaMm2(selectedRoom.area)}</p>
                </div>
                <div className="rounded-2xl border border-border bg-muted/20 p-4">
                  <p className="text-xs text-muted-foreground">좌표</p>
                  <p className="mt-2 text-base font-semibold">
                    {selectedPlacement ? `${selectedPlacement.x}, ${selectedPlacement.y}` : "미배치"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button asChild className="h-11 rounded-xl">
                  <Link href={`${measurePath}?roomId=${selectedRoom.id}`}>
                    <Pencil />
                    수정하기
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-xl"
                  onClick={duplicateSelectedRoom}
                >
                  <Copy />
                  복제하기
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-xl"
                  onClick={() => setRoomDetailOpen(false)}
                >
                  <Move />
                  위치 조정
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-xl"
                  onClick={() => removeFromPlan(selectedRoom.id)}
                  disabled={!selectedPlacement}
                >
                  <XCircle />
                  배치 제거
                </Button>
              </div>

              <Button
                type="button"
                variant="outline"
                className="h-11 w-full rounded-xl text-destructive"
                onClick={() => deleteRoomWithConfirm(selectedRoom.id)}
              >
                <Trash2 />
                삭제
              </Button>
            </div>
          ) : (
            <div className="px-5 py-8 text-sm text-muted-foreground">
              방을 선택하면 여기에서 수정과 관리 액션을 빠르게 실행할 수 있습니다.
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
