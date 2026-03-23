"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { HomeIcon, MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { createHome, deleteHome, getHomes, renameHome } from "@/lib/api/project-shell";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateTime } from "@/lib/utils/format";

type HomeDialogMode = "create" | "rename";

export function HomeSelectionPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const homesQuery = useQuery({
    queryKey: ["homes"],
    queryFn: getHomes,
  });
  const createHomeMutation = useMutation({
    mutationFn: createHome,
    onSuccess: (home) => {
      queryClient.invalidateQueries({ queryKey: ["homes"] });
      setDialogOpen(false);
      setDraftName("");
      router.push(`/homes/${home.id}`);
    },
  });
  const renameHomeMutation = useMutation({
    mutationFn: ({ homeId, name }: { homeId: string; name: string }) =>
      renameHome(homeId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homes"] });
      setDialogOpen(false);
    },
  });
  const deleteHomeMutation = useMutation({
    mutationFn: deleteHome,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homes"] });
    },
  });

  const [query, setQuery] = useState("");
  const [dialogMode, setDialogMode] = useState<HomeDialogMode>("create");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [targetHomeId, setTargetHomeId] = useState<string | null>(null);
  const filteredHomes = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const homes = homesQuery.data ?? [];

    if (!normalized) {
      return homes;
    }

    return homes.filter((home) => home.name.toLowerCase().includes(normalized));
  }, [homesQuery.data, query]);

  const openCreateDialog = () => {
    setDialogMode("create");
    setTargetHomeId(null);
    setDraftName("");
    setDialogOpen(true);
  };

  const openRenameDialog = (homeId: string, currentName: string) => {
    setDialogMode("rename");
    setTargetHomeId(homeId);
    setDraftName(currentName);
    setDialogOpen(true);
  };

  const submit = () => {
    const value = draftName.trim();
    if (!value) {
      return;
    }

    if (dialogMode === "create") {
      createHomeMutation.mutate(value);
      return;
    }

    if (targetHomeId) {
      renameHomeMutation.mutate({ homeId: targetHomeId, name: value });
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      <main className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-border bg-white">
          <div className="flex flex-col gap-4 border-b border-border px-5 py-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
                Workspace
              </p>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">집 선택</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  작업할 집을 선택하세요
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:w-auto sm:flex-row">
              <div className="relative min-w-0 sm:w-[280px]">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  aria-label="집 검색"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="집 이름 검색"
                  className="h-10 rounded-lg pl-9"
                />
              </div>
              <Button type="button" className="h-10 rounded-lg" onClick={openCreateDialog}>
                <Plus />
                새 집 만들기
              </Button>
            </div>
          </div>

          {homesQuery.isLoading ? (
            <div className="px-6 py-12 text-sm text-muted-foreground">집 목록을 불러오는 중입니다.</div>
          ) : homesQuery.isError ? (
            <div className="px-6 py-12 text-sm text-destructive">
              {(homesQuery.error as Error).message}
            </div>
          ) : filteredHomes.length === 0 ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-16 text-center">
              <div className="rounded-full border border-border bg-muted/20 p-4">
                <HomeIcon className="size-6 text-muted-foreground" />
              </div>
              <h2 className="mt-5 text-lg font-semibold">아직 등록된 집이 없습니다</h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                새 집을 만들어 도면 작업을 시작해보세요
              </p>
              <Button type="button" className="mt-5 rounded-lg" onClick={openCreateDialog}>
                <Plus />
                새 집 만들기
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredHomes.map((home) => {
                return (
                  <div
                    key={home.id}
                    className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/20"
                  >
                    <Link
                      href={`/homes/${home.id}`}
                      className="grid min-w-0 flex-1 gap-3 sm:grid-cols-[minmax(0,1.6fr)_140px_180px_auto] sm:items-center"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {home.name}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          도면 편집 허브로 이동
                        </p>
                      </div>
                      <div className="text-sm text-foreground">
                        도면 {home.floorplanCount.toLocaleString("ko-KR")}개
                      </div>
                      <div className="text-sm text-muted-foreground">
                        최근 수정 {formatDateTime(home.updatedAt)}
                      </div>
                      <div className="text-sm font-medium text-foreground">
                        열기
                      </div>
                    </Link>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="rounded-md"
                          aria-label={`${home.name} 더보기`}
                        >
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem
                          onClick={() => openRenameDialog(home.id, home.name)}
                        >
                          <Pencil />
                          이름 수정
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            if (
                              !deleteHomeMutation.isPending &&
                              window.confirm(`'${home.name}'을(를) 삭제할까요?`)
                            ) {
                              deleteHomeMutation.mutate(home.id);
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
                );
              })}
            </div>
          )}
        </section>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="rounded-xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {dialogMode === "create" ? "새 집 만들기" : "집 이름 수정"}
              </DialogTitle>
              <DialogDescription>
                {dialogMode === "create"
                  ? "집 이름을 입력하면 도면 선택 화면으로 이동합니다."
                  : "집 목록에서 구분하기 쉬운 이름으로 수정하세요."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="home-name">집 이름</Label>
              <Input
                id="home-name"
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                placeholder="예: 송파 아파트"
                className="h-10 rounded-lg"
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={createHomeMutation.isPending || renameHomeMutation.isPending}
              >
                취소
              </Button>
              <Button
                type="button"
                onClick={submit}
                disabled={
                  !draftName.trim() ||
                  createHomeMutation.isPending ||
                  renameHomeMutation.isPending
                }
              >
                {createHomeMutation.isPending || renameHomeMutation.isPending
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
