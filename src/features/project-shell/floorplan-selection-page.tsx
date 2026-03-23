"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  ChevronRight,
  FileStack,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createFloorplan,
  deleteFloorplan,
  getHomeFloorplans,
  renameFloorplan,
} from "@/lib/api/project-shell";
import { formatDateTime } from "@/lib/utils/format";
import { type FloorplanStatus } from "@/types";

const statusMap: Record<FloorplanStatus, { label: string; className: string }> = {
  empty: {
    label: "비어 있음",
    className: "border-zinc-300 bg-zinc-50 text-zinc-700",
  },
  draft: {
    label: "작성 중",
    className: "border-amber-300 bg-amber-50 text-amber-800",
  },
  complete: {
    label: "완료",
    className: "border-emerald-300 bg-emerald-50 text-emerald-800",
  },
};

type FloorplanDialogMode = "create" | "rename";

export function FloorplanSelectionPage({ homeId }: { homeId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const floorplansQuery = useQuery({
    queryKey: ["homeFloorplans", homeId],
    queryFn: () => getHomeFloorplans(homeId),
  });
  const createFloorplanMutation = useMutation({
    mutationFn: (name: string) => createFloorplan(homeId, name),
    onSuccess: (floorplan) => {
      queryClient.invalidateQueries({ queryKey: ["homes"] });
      queryClient.invalidateQueries({ queryKey: ["homeFloorplans", homeId] });
      setDialogOpen(false);
      router.push(`/homes/${homeId}/floorplans/${floorplan.id}`);
    },
  });
  const renameFloorplanMutation = useMutation({
    mutationFn: ({ floorplanId, name }: { floorplanId: string; name: string }) =>
      renameFloorplan(homeId, floorplanId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homes"] });
      queryClient.invalidateQueries({ queryKey: ["homeFloorplans", homeId] });
      setDialogOpen(false);
    },
  });
  const deleteFloorplanMutation = useMutation({
    mutationFn: (floorplanId: string) => deleteFloorplan(homeId, floorplanId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homes"] });
      queryClient.invalidateQueries({ queryKey: ["homeFloorplans", homeId] });
    },
  });

  const home = floorplansQuery.data?.home ?? null;
  const homeFloorplans = useMemo(
    () => floorplansQuery.data?.floorplans ?? [],
    [floorplansQuery.data],
  );

  const [dialogMode, setDialogMode] = useState<FloorplanDialogMode>("create");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [targetFloorplanId, setTargetFloorplanId] = useState<string | null>(null);

  const openCreateDialog = () => {
    setDialogMode("create");
    setTargetFloorplanId(null);
    setDraftName("");
    setDialogOpen(true);
  };

  const openRenameDialog = (floorplanId: string, currentName: string) => {
    setDialogMode("rename");
    setTargetFloorplanId(floorplanId);
    setDraftName(currentName);
    setDialogOpen(true);
  };

  const submit = () => {
    const value = draftName.trim();
    if (!value) {
      return;
    }

    if (dialogMode === "create") {
      createFloorplanMutation.mutate(value);
      return;
    }

    if (targetFloorplanId) {
      renameFloorplanMutation.mutate({ floorplanId: targetFloorplanId, name: value });
    }
  };

  if (!home) {
    return (
      <div className="min-h-screen bg-[#f3f4f6]">
        <main className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-border bg-white px-6 py-12 text-center">
            <h1 className="text-xl font-semibold">집 정보를 찾을 수 없습니다</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              집 목록으로 돌아가 다른 집을 선택해 주세요.
            </p>
            <Button className="mt-5" asChild>
              <Link href="/">집 목록으로 돌아가기</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      <main className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8">
        <section className="mb-4 rounded-2xl border border-border bg-white px-5 py-4">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">
              홈
            </Link>
            <ChevronRight className="size-4" />
            <span className="text-foreground">{home.name}</span>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-white">
          <div className="border-b border-border px-5 py-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
                  Floorplans
                </p>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">도면 선택</h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    선택한 집의 도면을 열거나 새로 만들 수 있습니다
                  </p>
                </div>
              </div>
              <Button type="button" className="h-10 rounded-lg" onClick={openCreateDialog}>
                <Plus />
                새 도면 만들기
              </Button>
            </div>

            <div className="mt-4 grid gap-3 rounded-xl border border-border bg-muted/20 px-4 py-4 text-sm sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">집 이름</p>
                <p className="mt-1 font-medium text-foreground">{home.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">도면 수</p>
                <p className="mt-1 font-medium text-foreground">
                  {homeFloorplans.length.toLocaleString("ko-KR")}개
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">최근 수정</p>
                <p className="mt-1 font-medium text-foreground">
                  {formatDateTime(home.updatedAt)}
                </p>
              </div>
            </div>
          </div>

          {floorplansQuery.isLoading ? (
            <div className="px-6 py-12 text-sm text-muted-foreground">도면 목록을 불러오는 중입니다.</div>
          ) : floorplansQuery.isError ? (
            <div className="px-6 py-12 text-sm text-destructive">
              {(floorplansQuery.error as Error).message}
            </div>
          ) : homeFloorplans.length === 0 ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-16 text-center">
              <div className="rounded-full border border-border bg-muted/20 p-4">
                <FileStack className="size-6 text-muted-foreground" />
              </div>
              <h2 className="mt-5 text-lg font-semibold">아직 생성된 도면이 없습니다</h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                새 도면을 만들어 이 집의 첫 번째 구조를 시작하세요
              </p>
              <Button type="button" className="mt-5 rounded-lg" onClick={openCreateDialog}>
                <Plus />
                새 도면 만들기
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {homeFloorplans.map((floorplan) => (
                <div
                  key={floorplan.id}
                  className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/20"
                >
                  <Link
                    href={`/homes/${homeId}/floorplans/${floorplan.id}`}
                    className="grid min-w-0 flex-1 gap-3 sm:grid-cols-[minmax(0,1.4fr)_120px_180px_120px_auto] sm:items-center"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {floorplan.name}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        방 {floorplan.roomCount.toLocaleString("ko-KR")}개
                      </p>
                    </div>
                    <div className="text-sm text-foreground">
                      {floorplan.roomCount.toLocaleString("ko-KR")}개 방
                    </div>
                    <div className="text-sm text-muted-foreground">
                      최근 수정 {formatDateTime(floorplan.updatedAt)}
                    </div>
                    <div>
                      <Badge
                        variant="outline"
                        className={`rounded-md ${statusMap[floorplan.status].className}`}
                      >
                        {statusMap[floorplan.status].label}
                      </Badge>
                    </div>
                    <div className="text-sm font-medium text-foreground">열기</div>
                  </Link>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="rounded-md"
                        aria-label={`${floorplan.name} 더보기`}
                      >
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem
                        onClick={() => openRenameDialog(floorplan.id, floorplan.name)}
                      >
                        <Pencil />
                        이름 수정
                      </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            if (
                              !deleteFloorplanMutation.isPending &&
                              window.confirm(`'${floorplan.name}'을(를) 삭제할까요?`)
                            ) {
                              deleteFloorplanMutation.mutate(floorplan.id);
                            }
                          }}
                          className="text-destructive focus:text-destructive"
                      >
                        <Trash2 />
                        삭제
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </section>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="rounded-xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {dialogMode === "create" ? "새 도면 만들기" : "도면 이름 수정"}
              </DialogTitle>
              <DialogDescription>
                {dialogMode === "create"
                  ? "도면 이름을 입력하면 바로 편집 화면으로 이동합니다."
                  : "도면 목록에서 구분하기 쉬운 이름으로 수정하세요."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="floorplan-name">도면 이름</Label>
              <Input
                id="floorplan-name"
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                placeholder="예: 1층 전체 평면"
                className="h-10 rounded-lg"
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={
                  createFloorplanMutation.isPending || renameFloorplanMutation.isPending
                }
              >
                취소
              </Button>
              <Button
                type="button"
                onClick={submit}
                disabled={
                  !draftName.trim() ||
                  createFloorplanMutation.isPending ||
                  renameFloorplanMutation.isPending
                }
              >
                {createFloorplanMutation.isPending || renameFloorplanMutation.isPending
                  ? "저장 중..."
                  : "저장"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
