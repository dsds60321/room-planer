"use client";

import Link from "next/link";

import { ResultFloorPlanRenderer } from "@/components/floor-plan/result-floor-plan-renderer";
import { SummaryPanel } from "@/components/result/summary-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useActiveFloorplan } from "@/features/project-shell/use-active-floorplan";
import { useFloorPlanStore } from "@/store/use-floor-plan-store";
import { useRoomStore } from "@/store/use-room-store";

export function FloorPlanResultPage({
  homeId,
  floorplanId,
}: {
  homeId: string;
  floorplanId: string;
}) {
  const { home, floorplan, isReady, error } = useActiveFloorplan(homeId, floorplanId, false);
  const rooms = useRoomStore((state) => state.rooms);
  const placements = useFloorPlanStore((state) => state.placedRooms);
  const mode = useFloorPlanStore((state) => state.resultRenderMode);
  const setMode = useFloorPlanStore((state) => state.setResultRenderMode);
  const editorPath = `/homes/${homeId}/floorplans/${floorplanId}`;
  const floorplanPath = `/homes/${homeId}`;

  if (!isReady) {
    return (
      <div className="min-h-screen bg-[#f5f5f4]">
        <main className="mx-auto max-w-[1600px] px-6 py-6">
          <div className="rounded-[24px] border border-border bg-white p-6">
            결과 화면을 불러오는 중입니다.
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f5f5f4]">
        <main className="mx-auto max-w-[960px] px-6 py-10">
          <div className="rounded-[24px] border border-border bg-white px-6 py-10 text-center">
            <h1 className="text-xl font-semibold">결과 데이터를 불러오지 못했습니다</h1>
            <p className="mt-2 text-sm text-muted-foreground">{(error as Error).message}</p>
            <Button className="mt-5" asChild>
              <Link href="/">집 선택으로 돌아가기</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (!home || !floorplan) {
    return (
      <div className="min-h-screen bg-[#f5f5f4]">
        <main className="mx-auto max-w-[960px] px-6 py-10">
          <div className="rounded-[24px] border border-border bg-white px-6 py-10 text-center">
            <h1 className="text-xl font-semibold">도면 정보를 찾을 수 없습니다</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              도면 선택 화면으로 돌아가 다시 선택해 주세요.
            </p>
            <Button className="mt-5" asChild>
              <Link href="/">집 선택으로 돌아가기</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f4]">
      <main className="result-screen mx-auto max-w-[1600px] space-y-6 px-6 py-6">
        <section className="print:hidden rounded-[22px] border border-border bg-white px-6 py-4">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">
              홈
            </Link>
            <span>/</span>
            <Link href={floorplanPath} className="hover:text-foreground">
              {home.name}
            </Link>
            <span>/</span>
            <Link href={editorPath} className="hover:text-foreground">
              {floorplan.name}
            </Link>
            <span>/</span>
            <span className="text-foreground">결과 보기</span>
          </div>
        </section>

        <section className="result-toolbar print:hidden flex flex-wrap items-center justify-between gap-4 rounded-[22px] border border-border bg-white px-6 py-5">
          <div>
            <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
              Final Output
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              평면도 스타일 결과물
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              편집용 강조 요소를 제거하고 외곽 벽, 내부 벽, 문 스윙, 실명 라벨 중심으로 정리한 출력 화면입니다.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant={mode === "annotated" ? "default" : "outline"}
              onClick={() => setMode("annotated")}
            >
              치수 요약 표시
            </Button>
            <Button
              type="button"
              variant={mode === "clean" ? "default" : "outline"}
              onClick={() => setMode("clean")}
            >
              클린 출력
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href={editorPath}>편집으로 돌아가기</Link>
            </Button>
            <Button type="button" onClick={() => window.print()}>
              내보내기
            </Button>
          </div>
        </section>

        <div className="result-layout grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="print-floorplan-root rounded-[24px] border border-zinc-200 bg-white p-4">
            <ResultFloorPlanRenderer
              rooms={rooms}
              placements={placements}
              mode={mode}
              className="relative min-h-[760px] overflow-hidden rounded-[24px] border border-zinc-200 bg-[#fcfcfb] print:min-h-[180mm] print:rounded-none print:border-0"
            />
          </section>
          <aside className="result-sidebar print:hidden space-y-4">
            <SummaryPanel rooms={rooms} />
          </aside>
        </div>
      </main>
    </div>
  );
}
